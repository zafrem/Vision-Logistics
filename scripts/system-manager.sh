#!/bin/bash

# Vision Logistics System Manager
# Supports both Docker and non-Docker environments

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"
LOG_DIR="$PROJECT_ROOT/.logs"

# Service configuration
COLLECTOR_PORT=3001
MANAGER_PORT=3002
UI_PORT=3000
REDIS_PORT=6379
KAFKA_PORT=9092

# Docker fallback services (using in-memory alternatives)
REDIS_FALLBACK_PORT=6380
KAFKA_FALLBACK_PORT=9093

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# Create necessary directories
setup_dirs() {
    mkdir -p "$PID_DIR" "$LOG_DIR"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
port_in_use() {
    local port=$1
    if command_exists lsof; then
        lsof -i :$port >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -ln | grep ":$port " >/dev/null 2>&1
    else
        # Fallback: try to connect to port
        (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1
    fi
}

# Kill process by PID file
kill_by_pidfile() {
    local pidfile=$1
    local service_name=$2
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping $service_name (PID: $pid)"
            kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
            sleep 2
        fi
        rm -f "$pidfile"
    fi
}

# Start Docker services
start_docker_services() {
    cd "$PROJECT_ROOT/docker"
    
    if command_exists docker-compose; then
        docker-compose up -d
    elif command_exists docker; then
        docker compose up -d
    else
        error "Docker not available"
        return 1
    fi
    
    log "Docker services started"
    
    # Wait for services to be ready
    info "Waiting for Docker services to be ready..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if port_in_use $REDIS_PORT && port_in_use $KAFKA_PORT; then
            log "Docker services are ready"
            return 0
        fi
        sleep 2
        retries=$((retries - 1))
    done
    
    warn "Docker services may not be fully ready, but continuing..."
    return 0
}

# Stop Docker services
stop_docker_services() {
    cd "$PROJECT_ROOT/docker"
    
    if command_exists docker-compose; then
        docker-compose down
    elif command_exists docker; then
        docker compose down
    else
        warn "Docker not available for cleanup"
        return 0
    fi
    
    log "Docker services stopped"
}

# Start fallback Redis (using Node.js in-memory implementation)
start_fallback_redis() {
    local pidfile="$PID_DIR/redis-fallback.pid"
    local logfile="$LOG_DIR/redis-fallback.log"
    
    info "Starting fallback Redis server on port $REDIS_FALLBACK_PORT"
    
    cat > "$PROJECT_ROOT/scripts/redis-fallback.js" << 'EOF'
#!/usr/bin/env node
import { createServer } from 'net';

const PORT = parseInt(process.env.REDIS_FALLBACK_PORT) || 6380;
const store = new Map();

const server = createServer((socket) => {
  console.log('Client connected');
  
  socket.on('data', (data) => {
    const command = data.toString().trim().split(' ');
    const cmd = command[0].toUpperCase();
    
    let response = '';
    
    switch (cmd) {
      case 'PING':
        response = '+PONG\r\n';
        break;
      case 'SET':
        if (command.length >= 3) {
          store.set(command[1], command[2]);
          response = '+OK\r\n';
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      case 'GET':
        if (command.length >= 2) {
          const value = store.get(command[1]);
          response = value ? `$${value.length}\r\n${value}\r\n` : '$-1\r\n';
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      case 'HSET':
        if (command.length >= 4) {
          const key = command[1];
          const field = command[2];
          const value = command[3];
          if (!store.has(key)) store.set(key, new Map());
          const hash = store.get(key);
          hash.set(field, value);
          response = ':1\r\n';
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      case 'HGETALL':
        if (command.length >= 2) {
          const hash = store.get(command[1]);
          if (hash instanceof Map) {
            const entries = Array.from(hash.entries()).flat();
            response = `*${entries.length}\r\n`;
            entries.forEach(entry => {
              response += `$${entry.length}\r\n${entry}\r\n`;
            });
          } else {
            response = '*0\r\n';
          }
        } else {
          response = '-ERR wrong number of arguments\r\n';
        }
        break;
      default:
        response = '+OK\r\n'; // Simple fallback
    }
    
    socket.write(response);
  });
  
  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Fallback Redis server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down fallback Redis server');
  server.close();
  process.exit(0);
});
EOF

    chmod +x "$PROJECT_ROOT/scripts/redis-fallback.js"
    
    REDIS_FALLBACK_PORT=$REDIS_FALLBACK_PORT nohup node "$PROJECT_ROOT/scripts/redis-fallback.js" > "$logfile" 2>&1 &
    echo $! > "$pidfile"
    
    log "Fallback Redis started (PID: $(cat $pidfile), Port: $REDIS_FALLBACK_PORT)"
}

# Start fallback Kafka (using Node.js in-memory implementation)
start_fallback_kafka() {
    local pidfile="$PID_DIR/kafka-fallback.pid"
    local logfile="$LOG_DIR/kafka-fallback.log"
    
    info "Starting fallback Kafka server on port $KAFKA_FALLBACK_PORT"
    
    cat > "$PROJECT_ROOT/scripts/kafka-fallback.js" << 'EOF'
#!/usr/bin/env node
import { EventEmitter } from 'events';
import { createServer } from 'net';

const PORT = parseInt(process.env.KAFKA_FALLBACK_PORT) || 9093;

class FallbackKafka extends EventEmitter {
  constructor() {
    super();
    this.topics = new Map();
    this.consumers = new Set();
  }

  createTopic(topic) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
  }

  produce(topic, message) {
    this.createTopic(topic);
    const messages = this.topics.get(topic);
    messages.push({
      timestamp: Date.now(),
      value: message,
      offset: messages.length
    });
    
    // Emit to consumers
    this.emit('message', { topic, message: messages[messages.length - 1] });
  }

  consume(topic, callback) {
    this.createTopic(topic);
    const consumer = { topic, callback };
    this.consumers.add(consumer);
    
    // Send existing messages
    const messages = this.topics.get(topic);
    messages.forEach(msg => callback(msg));
    
    // Listen for new messages
    this.on('message', ({ topic: msgTopic, message }) => {
      if (msgTopic === topic) {
        callback(message);
      }
    });
    
    return consumer;
  }
}

const kafka = new FallbackKafka();

// Create essential topics
kafka.createTopic('raw.detections');
kafka.createTopic('state.transitions');
kafka.createTopic('dwell.updates');
kafka.createTopic('feedback.updates');

const server = createServer((socket) => {
  console.log('Kafka client connected');
  
  socket.on('data', (data) => {
    try {
      const request = JSON.parse(data.toString());
      
      if (request.type === 'produce') {
        kafka.produce(request.topic, request.message);
        socket.write(JSON.stringify({ success: true }));
      } else if (request.type === 'consume') {
        kafka.consume(request.topic, (message) => {
          socket.write(JSON.stringify({ topic: request.topic, message }));
        });
      }
    } catch (error) {
      socket.write(JSON.stringify({ error: error.message }));
    }
  });
  
  socket.on('end', () => {
    console.log('Kafka client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Fallback Kafka server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down fallback Kafka server');
  server.close();
  process.exit(0);
});
EOF

    chmod +x "$PROJECT_ROOT/scripts/kafka-fallback.js"
    
    KAFKA_FALLBACK_PORT=$KAFKA_FALLBACK_PORT nohup node "$PROJECT_ROOT/scripts/kafka-fallback.js" > "$logfile" 2>&1 &
    echo $! > "$pidfile"
    
    log "Fallback Kafka started (PID: $(cat $pidfile), Port: $KAFKA_FALLBACK_PORT)"
}

# Start application services
start_app_services() {
    local use_fallback=$1
    
    cd "$PROJECT_ROOT"
    
    # Environment variables
    local redis_url="redis://localhost:${REDIS_PORT}"
    local kafka_brokers="localhost:${KAFKA_PORT}"
    
    if [ "$use_fallback" = "true" ]; then
        redis_url="redis://localhost:${REDIS_FALLBACK_PORT}"
        kafka_brokers="localhost:${KAFKA_FALLBACK_PORT}"
    fi
    
    # Start Collector
    info "Starting Collector service..."
    local collector_pidfile="$PID_DIR/collector.pid"
    local collector_logfile="$LOG_DIR/collector.log"
    
    cd "$PROJECT_ROOT/collector"
    COLLECTOR_ID=collector-01 \
    PORT=$COLLECTOR_PORT \
    KAFKA_BROKERS=$kafka_brokers \
    nohup npm run dev > "$collector_logfile" 2>&1 &
    echo $! > "$collector_pidfile"
    
    # Start Manager
    info "Starting Manager service..."
    local manager_pidfile="$PID_DIR/manager.pid"
    local manager_logfile="$LOG_DIR/manager.log"
    
    cd "$PROJECT_ROOT/manager"
    PORT=$MANAGER_PORT \
    REDIS_URL=$redis_url \
    KAFKA_BROKERS=$kafka_brokers \
    DWELL_TIMEOUT_MS=30000 \
    nohup npm run dev > "$manager_logfile" 2>&1 &
    echo $! > "$manager_pidfile"
    
    # Start UI
    info "Starting UI service..."
    local ui_pidfile="$PID_DIR/ui.pid"
    local ui_logfile="$LOG_DIR/ui.log"
    
    cd "$PROJECT_ROOT/ui"
    VITE_API_URL=http://localhost:$MANAGER_PORT \
    nohup npm run dev > "$ui_logfile" 2>&1 &
    echo $! > "$ui_pidfile"
    
    log "Application services started"
    log "  • Collector: http://localhost:$COLLECTOR_PORT (PID: $(cat $collector_pidfile))"
    log "  • Manager: http://localhost:$MANAGER_PORT (PID: $(cat $manager_pidfile))"
    log "  • UI: http://localhost:$UI_PORT (PID: $(cat $ui_pidfile))"
}

# Check service health
check_health() {
    local all_healthy=true
    
    info "Checking service health..."
    
    # Check Collector
    if port_in_use $COLLECTOR_PORT; then
        if command_exists curl && curl -sf "http://localhost:$COLLECTOR_PORT/health" >/dev/null; then
            log "✓ Collector service is healthy"
        else
            warn "Collector port is open but health check failed"
        fi
    else
        error "✗ Collector service is not responding"
        all_healthy=false
    fi
    
    # Check Manager
    if port_in_use $MANAGER_PORT; then
        if command_exists curl && curl -sf "http://localhost:$MANAGER_PORT/health" >/dev/null; then
            log "✓ Manager service is healthy"
        else
            warn "Manager port is open but health check failed"
        fi
    else
        error "✗ Manager service is not responding"
        all_healthy=false
    fi
    
    # Check UI
    if port_in_use $UI_PORT; then
        log "✓ UI service is running"
    else
        error "✗ UI service is not responding"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log "🎉 All services are healthy!"
        echo ""
        echo "🌐 Access URLs:"
        echo "  • UI Dashboard: http://localhost:$UI_PORT"
        echo "  • Collector API: http://localhost:$COLLECTOR_PORT"
        echo "  • Manager API: http://localhost:$MANAGER_PORT"
    else
        error "Some services are not healthy. Check logs in $LOG_DIR/"
    fi
}

# Start system
start_system() {
    local use_docker=true
    local use_fallback=false
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-docker)
                use_docker=false
                use_fallback=true
                shift
                ;;
            --fallback)
                use_docker=false
                use_fallback=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    log "🚀 Starting Vision Logistics System..."
    
    setup_dirs
    
    # Check prerequisites
    if ! command_exists node; then
        error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        error "npm is required but not installed"
        exit 1
    fi
    
    # Install dependencies
    info "📦 Checking dependencies..."
    cd "$PROJECT_ROOT"
    npm install >/dev/null 2>&1 || warn "Failed to install root dependencies"
    npm install --workspace=collector >/dev/null 2>&1 || warn "Failed to install collector dependencies"
    npm install --workspace=manager >/dev/null 2>&1 || warn "Failed to install manager dependencies"
    npm install --workspace=ui >/dev/null 2>&1 || warn "Failed to install UI dependencies"
    
    # Start infrastructure
    if [ "$use_docker" = true ] && command_exists docker; then
        info "🐳 Starting Docker services..."
        if start_docker_services; then
            log "Docker infrastructure ready"
        else
            warn "Docker services failed, switching to fallback mode"
            use_fallback=true
        fi
    else
        info "🔄 Using fallback services (Docker not available)"
        use_fallback=true
    fi
    
    # Start fallback services if needed
    if [ "$use_fallback" = true ]; then
        start_fallback_redis
        start_fallback_kafka
        sleep 3
    fi
    
    # Start application services
    start_app_services $use_fallback
    
    # Wait for services to start
    info "⏳ Waiting for services to start..."
    sleep 10
    
    # Health check
    check_health
    
    echo ""
    log "📖 Next steps:"
    echo "  1. Generate test data: $PROJECT_ROOT/scripts/generate-test-data.js"
    echo "  2. View logs: tail -f $LOG_DIR/*.log"
    echo "  3. Stop system: $0 stop"
}

# Stop system
stop_system() {
    log "🛑 Stopping Vision Logistics System..."
    
    # Stop application services
    kill_by_pidfile "$PID_DIR/ui.pid" "UI service"
    kill_by_pidfile "$PID_DIR/manager.pid" "Manager service"
    kill_by_pidfile "$PID_DIR/collector.pid" "Collector service"
    
    # Stop fallback services
    kill_by_pidfile "$PID_DIR/redis-fallback.pid" "Fallback Redis"
    kill_by_pidfile "$PID_DIR/kafka-fallback.pid" "Fallback Kafka"
    
    # Stop Docker services
    if command_exists docker; then
        info "🐳 Stopping Docker services..."
        stop_docker_services
    fi
    
    # Cleanup
    rm -f "$PROJECT_ROOT/scripts/redis-fallback.js"
    rm -f "$PROJECT_ROOT/scripts/kafka-fallback.js"
    
    log "✅ System stopped"
}

# Show status
show_status() {
    echo "Vision Logistics System Status:"
    echo "================================"
    
    # Check PID files
    for service in collector manager ui redis-fallback kafka-fallback; do
        local pidfile="$PID_DIR/$service.pid"
        if [ -f "$pidfile" ]; then
            local pid=$(cat "$pidfile")
            if kill -0 "$pid" 2>/dev/null; then
                echo "✓ $service: Running (PID: $pid)"
            else
                echo "✗ $service: Not running (stale PID file)"
            fi
        else
            echo "- $service: Not started"
        fi
    done
    
    echo ""
    echo "Port Status:"
    for port in $COLLECTOR_PORT $MANAGER_PORT $UI_PORT $REDIS_PORT $KAFKA_PORT $REDIS_FALLBACK_PORT $KAFKA_FALLBACK_PORT; do
        if port_in_use $port; then
            echo "✓ Port $port: In use"
        else
            echo "- Port $port: Available"
        fi
    done
}

# Show usage
show_usage() {
    echo "Vision Logistics System Manager"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start         Start the complete system"
    echo "  stop          Stop all services"
    echo "  restart       Stop and start the system"
    echo "  status        Show system status"
    echo "  health        Check service health"
    echo "  logs          Show service logs"
    echo ""
    echo "Options:"
    echo "  --no-docker   Start without Docker (use fallback services)"
    echo "  --fallback    Same as --no-docker"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start with Docker"
    echo "  $0 start --no-docker        # Start with fallback services"
    echo "  $0 stop                     # Stop all services"
    echo "  $0 status                   # Show current status"
}

# Show logs
show_logs() {
    if [ ! -d "$LOG_DIR" ]; then
        error "Log directory not found. System may not be running."
        exit 1
    fi
    
    if command_exists tail; then
        log "📜 Showing service logs (Press Ctrl+C to exit)"
        tail -f "$LOG_DIR"/*.log 2>/dev/null || {
            warn "No log files found. Services may not be running."
            ls -la "$LOG_DIR/" 2>/dev/null || echo "Log directory is empty"
        }
    else
        warn "tail command not available. Showing log files:"
        ls -la "$LOG_DIR/"
    fi
}

# Main script logic
case "${1:-}" in
    start)
        shift
        start_system "$@"
        ;;
    stop)
        stop_system
        ;;
    restart)
        stop_system
        sleep 2
        shift
        start_system "$@"
        ;;
    status)
        show_status
        ;;
    health)
        check_health
        ;;
    logs)
        show_logs
        ;;
    --help|-h|help)
        show_usage
        ;;
    *)
        error "Unknown command: ${1:-}"
        echo ""
        show_usage
        exit 1
        ;;
esac