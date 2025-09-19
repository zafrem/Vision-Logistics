# 🎯 Vision-Enabled Logistics Tracking System

> **Real-time object tracking with intelligent camera data generation and live visualization**

A comprehensive system that generates realistic camera detection data and visualizes object movements across warehouse grid cells in real-time. Features intelligent data generation, interactive heatmaps, and live analytics - perfect for demonstrating warehouse logistics tracking capabilities with stunning visual impact.

[![System Validation](https://img.shields.io/badge/system-validated-green)](./scripts/validate-system.js)
[![Docker Support](https://img.shields.io/badge/docker-supported-blue)](#docker-mode)
[![Fallback Mode](https://img.shields.io/badge/fallback-enabled-orange)](#fallback-mode)
[![Cross Platform](https://img.shields.io/badge/platform-cross--platform-lightgrey)](#platform-support)

## 🚀 **Quick Start (30 seconds)**

### **🎮 See It In Action**

```bash
# Clone and start the complete system
git clone <repository-url>
cd vision-logistics
npm run fix-and-start
```

**Wait for "System is ready!" message, then:**

```bash
# Generate stunning visual data (new terminal)
npm run demo-visualization
```

**🌐 Open http://localhost:3000** and watch:
- **Live heatmap** with moving concentration waves
- **Real-time statistics** updating every second
- **Interactive grid** with clickable cells
- **Visual intensity patterns** that demonstrate warehouse analytics
- **🔥 Real-time event log** showing live detection events at bottom of screen

### **🎪 Interactive Demo Mode**

```bash
npm run demo
```

**Full interactive interface with:**
- 🎯 **6 realistic scenarios** (warehouse ops, busy period, shift change, etc.)
- 🎨 **6 stunning visualizations** (heatwave, concentric, snake, traffic flow, etc.)
- ⚙️ **Adjustable settings** (speed, duration, intensity)
- 📊 **Real-time monitoring** and system health checks

### **🎬 Animated Demo Screen**

```bash
npm start
# Wait for services to start, then open: http://localhost:3000
```

**Features Live Animated Movement:**
- 🚛 **Horizontal Forklift**: Moves left-to-right across warehouse floor
- 👷 **Diagonal Worker**: Travels diagonally through work zones
- 📦 **Circular Pallet**: Orbital movement pattern around storage area
- 🛒 **Vertical Cart**: Oscillates up-and-down in transport corridor
- 🔥 **15-second animation cycles** with smooth, realistic movement
- 📊 **Synchronized data** - active objects match heatmap positions
- 🎯 **Auto-refresh every 30 seconds** for continuous animation

## 🏗️ **System Architecture**

```
🎥 Cameras → 📡 Collectors → 🗄️ Redis → 🧮 Manager → 📊 Analytics
                                ↑                      ↓
                              Queue                🌐 UI ← APIs
```

### **Components**

| Service | Purpose | Port | Technology |
|---------|---------|------|------------|
| **Collector** | Process camera feeds, normalize events | 3001 | Node.js + Fastify |
| **Manager** | Consume events, calculate dwell times | 3002 | Node.js + Redis |
| **UI** | Real-time analytics dashboard + event log | 3000 | React + TypeScript |
| **Redis** | Message queuing, streams, and state storage | 6379 | Redis |

## 💻 **Platform Support**

### **🖥️ All Platforms**
```bash
npm start                    # Universal - works everywhere
npm run start:fallback       # No Docker required
```

### **🐧 Linux/macOS Advanced**
```bash
./scripts/system-manager.sh start    # Full process management  
./scripts/system-manager.sh logs     # View all logs
./scripts/system-manager.sh health   # Health monitoring
```

### **🪟 Windows**
```bat
start.bat                    # Double-click to run
start.bat --fallback         # No Docker mode
start.bat status             # Check service status
```

## 🔧 **Deployment Modes**

### **🐳 Docker Mode (Recommended)**
- ✅ Redis container with persistence
- ✅ Redis Commander for data visualization
- ✅ Production-ready setup
- ✅ Data persistence and streams
- ✅ Simple and reliable architecture

**Requirements**: Docker + Docker Compose

### **⚡ Fallback Mode (Universal)**  
- ✅ In-memory Redis alternatives
- ✅ Works without Docker
- ✅ Perfect for CI/CD and development
- ✅ Identical functionality
- ✅ Faster startup (5-10 seconds)

**Requirements**: Just Node.js + npm

### **🎛️ Manual Mode (Expert)**
```bash
npm run docker:up            # Start infrastructure only
npm run dev:collector        # Terminal 1
npm run dev:manager          # Terminal 2
npm run dev:ui               # Terminal 3
```

**Requirements**: Docker + multiple terminals

## 📊 **Features & Capabilities**

### **🎯 Real-time Tracking**
- **20×15 Grid System**: 300 trackable cells with `G_XX_YY` format
- **Multiple Object Types**: Pallets, forklifts, workers, boxes, containers, trucks
- **Dwell Time Calculation**: Precise timing with timeout handling
- **Multi-Collector Support**: Unlimited collectors and cameras
- **State Persistence**: Object states maintained across sessions

### **📈 Interactive Analytics**
- **Live Heatmaps**: Visual intensity mapping with color-coded cells
- **Statistics Tables**: Top cells by dwell time, object counts, averages  
- **Real-time Updates**: Auto-refresh every 30 seconds (configurable)
- **Data Source Selection**: Filter by collector and camera
- **Cell Details**: Click any cell for detailed information
- **🔥 Real-time Event Log**: Live feed of detection events at bottom of screen
  - Color-coded event types (enter: green, exit: red, move: blue)
  - Real-time timestamps and object tracking
  - Pause/resume and clear functionality
  - Shows object IDs, grid cells, and collector information

### **🔄 Human-in-the-Loop**
- **Object Relabeling**: Correct object identification errors
- **Cell Corrections**: Fix incorrect cell assignments
- **False Positive Removal**: Delete invalid detection spans
- **Audit Logging**: Complete tracking of all corrections

### **🧪 Test Data Generation**
- **Realistic Simulation**: Smart object movement patterns
- **Configurable Scenarios**: Adjustable object counts and movement
- **Lifecycle Management**: Objects appear, move, and disappear naturally
- **Multi-Camera Support**: Simultaneous data across all cameras

## 📚 **API Reference**

### **Collector Service (Port 3001)**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/frames` | POST | Process camera detection frame |
| `/generate-test-frame` | POST | Generate single test frame |
| `/simulate-batch` | POST | Simulate batch processing |

### **Manager Service (Port 3002)**

#### **Query APIs**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stats/cells` | GET | Get cell statistics with filters |
| `/objects/{collector}/{camera}/{object}` | GET | Get object timeline and state |
| `/heatmap` | GET | Generate heatmap data |
| `/events/recent` | GET | Get recent detection events for real-time log |
| `/health` | GET | Service health check |
| `/status` | GET | Detailed service status |

#### **Feedback APIs**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/feedback/relabel` | POST | Change object ID |
| `/feedback/correct-cell` | POST | Fix cell assignment |
| `/feedback/delete-span` | POST | Remove false positive |

### **Example API Usage**

```bash
# Get heatmap data
curl "http://localhost:3002/heatmap?collector_id=collector-01&camera_id=cam-001"

# Get cell statistics  
curl "http://localhost:3002/stats/cells?collector_id=collector-01&camera_id=cam-001"

# Get recent events for real-time log
curl "http://localhost:3002/events/recent"

# Generate test frame
curl -X POST http://localhost:3001/generate-test-frame \
  -H "Content-Type: application/json" \
  -d '{"camera_id": "cam-001", "object_count": 5}'
```

## 🛠️ **Development**

### **Prerequisites Check**
```bash
npm run validate             # Validate system setup
node --version               # Should be 18+
npm --version                # Should be 8+
```

### **Build System**
```bash
npm run build               # Build all services
npm test                    # Run all tests
npm run build:collector     # Build collector only
npm run build:manager       # Build manager only
npm run build:ui            # Build UI only
```

### **Development Workflow**
1. **Setup**: `npm install` (installs all workspace dependencies)
2. **Start**: `npm start` (auto-detects environment)
3. **Test**: `npm run generate-test-data` (creates realistic data)
4. **Monitor**: `npm run system:health` (check service status)
5. **Debug**: `npm run system:logs` (view service logs)

### **Code Structure**
```
vision-logistics/
├── collector/              # Camera feed processor
│   ├── src/
│   │   ├── services/       # Kafka producer, collector logic
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Helper functions
│   └── package.json
├── manager/                # Event processor and API server  
│   ├── src/
│   │   ├── services/       # Redis client, Kafka consumer, dwell processor
│   │   ├── routes/         # REST API endpoints
│   │   └── types/          # TypeScript definitions  
│   └── package.json
├── ui/                     # React dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # API client and formatters
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── docker/                 # Infrastructure
│   └── docker-compose.yml  # Kafka, Redis, management UIs
└── scripts/                # System management
    ├── system-manager.sh   # Advanced start/stop (Linux/macOS)
    ├── start.js            # Cross-platform starter
    ├── generate-test-data.js # Test data generator
    └── validate-system.js  # System validation
```

## 🎛️ **Configuration**

### **Environment Variables**

Create `.env` file (copy from `.env.example`):

```bash
# Service Configuration
COLLECTOR_ID=collector-01
PORT=3001
MANAGER_PORT=3002
UI_PORT=3000

# Infrastructure  
REDIS_URL=redis://localhost:6379
DWELL_TIMEOUT_MS=30000

# API
VITE_API_URL=http://localhost:3002

# Test Data
BATCH_SIZE=20
INTERVAL_MS=2000
DURATION_MINUTES=5
```

### **Advanced Configuration**

```bash
# Multiple collectors
COLLECTOR_ID=collector-02 PORT=3011 npm run dev:collector

# Custom timeouts  
DWELL_TIMEOUT_MS=60000 npm run dev:manager

# Extended test data generation
DURATION_MINUTES=30 npm run generate-test-data
```

## 🌐 **Access & Monitoring**

### **🎯 Primary Access**
- **📊 Dashboard**: http://localhost:3000 - Main analytics UI
- **⚙️ Collector API**: http://localhost:3001/health - Service health
- **🔧 Manager API**: http://localhost:3002/status - System status

### **🔍 Development Tools (Docker Mode)**
- **🗄️ Redis Commander**: http://localhost:8081 - Data browser and streams monitoring
- **📋 Service Logs**: `npm run system:logs` - Real-time logs

### **📈 System Metrics**
- **Health Checks**: All services expose `/health` endpoints
- **Performance**: Memory usage, CPU load, uptime statistics
- **Business Metrics**: Event rates, object counts, dwell distributions

## 🎪 **Camera Data Generation**

### **🎨 Stunning Visual Patterns**

#### **🌊 Heatwave Pattern**
```bash
npm run demo-visualization heatwave
```
Creates a **moving concentration wave** across the grid - perfect for showing dynamic heatmap visualization.

#### **⭕ Concentric Circles**  
```bash
npm run demo-visualization concentric
```
**Expanding circle patterns** from the center - demonstrates radial activity distribution.

#### **🐍 Snake Movement**
```bash
npm run demo-visualization snake
```
**Spiral movement pattern** creating connected object trails - shows continuous tracking.

### **🏭 Realistic Warehouse Scenarios**

#### **📈 Busy Warehouse**
```bash
npm run demo-warehouse
```
**3-minute high-activity simulation** with realistic object density and movement patterns.

#### **👥 Shift Change**
```bash
npm run generate-interactive
# Select: 3. Change Scenario → 4. Shift Change
```
**Peak worker movement** simulation showing personnel flow patterns.

#### **🚨 Emergency Drill**
```bash
npm run generate-interactive  
# Select: 3. Change Scenario → 5. Emergency Drill
```
**Evacuation simulation** with all objects moving toward exit points.

### **⚙️ Custom Generation**
```bash
npm run demo
# Interactive menu with full control over:
# • Generation speed (0.5s - 5s intervals)
# • Duration (30s - 30min)
# • Activity intensity (low to maximum)
# • Object behavior patterns
# • Real-time statistics and monitoring
```

## 📋 **Available Commands Reference**

### **🎮 Data Generation Commands**
```bash
# 🎪 Interactive & Demo Commands
npm run demo                 # Full interactive interface
npm run demo-quick           # 1-minute quick demo
npm run demo-warehouse       # 3-minute warehouse simulation
npm run demo-visualization   # Heatwave visualization

# 🎨 Visualization Patterns
npm run generate-visualization heatwave    # Moving wave
npm run generate-visualization concentric  # Expanding circles
npm run generate-visualization snake       # Spiral movement
npm run generate-visualization zones       # Zone activity
npm run generate-visualization traffic     # Traffic flow
npm run generate-visualization clusters    # Cluster patterns

# 📊 Advanced Generation
npm run generate-camera-data              # Standard generation
npm run generate-interactive              # Interactive controls
```

### **🚀 System Commands**
```bash
# 🛠️ System Management
npm run fix-and-start        # Complete system startup with error handling
npm start                    # Smart start (Docker or fallback)
npm run start:fallback       # Force fallback mode (no Docker)
npm stop                     # Stop all services

# 📈 Monitoring & Health
npm run system:health        # Health check all services
npm run system:status        # Detailed status information
npm run system:logs          # View real-time logs
npm run validate             # Validate system setup

# 🏗️ Development
npm run dev                  # Start all services manually
npm run build                # Build all services
npm test                     # Run all tests
```

## 🚨 **Troubleshooting**

### **🔥 Quick Fix for Connection Errors**

If you see `ERR_CONNECTION_REFUSED` errors:
```bash
npm run fix-and-start
```
This command automatically fixes common issues and starts all services.

### **🔧 Common Issues**

| Problem | Quick Fix | 
|---------|-----------|
| **ERR_CONNECTION_REFUSED on :3002** | `npm run fix-and-start` |
| **Services won't start** | `killall node && npm start` |
| **Docker not available** | `npm run start:fallback` |
| **Port conflicts** | `lsof -i :3000 :3001 :3002` then kill processes |
| **No data in UI** | `npm run generate-test-data` |
| **Missing vite.svg (404)** | `npm run fix-and-start` creates missing assets |

### **🔧 Detailed Troubleshooting**

<details>
<summary><strong>Port Conflicts</strong></summary>

```bash
# Check what's using the ports
lsof -i :3000 -i :3001 -i :3002

# Kill all Node processes (nuclear option)
killall node

# Restart system
npm start
```
</details>

<details>
<summary><strong>Docker Issues</strong></summary>

```bash
# Check Docker status
docker ps
docker compose -f docker/docker-compose.yml ps

# Reset Docker services
npm run docker:down
npm run docker:up

# Use fallback if Docker is problematic
npm run start:fallback
```
</details>

<details>
<summary><strong>Service Health</strong></summary>

```bash
# Check all service health
npm run system:health

# Individual health checks
curl http://localhost:3001/health  # Collector
curl http://localhost:3002/health  # Manager  
curl http://localhost:3002/status  # Manager detailed status
```
</details>

<details>
<summary><strong>Data Issues</strong></summary>

```bash
# Verify test data generation
npm run generate-test-data

# Check manager logs for processing issues
npm run system:logs | grep manager

# Validate Redis connectivity (Docker mode)
docker exec -it vision-redis redis-cli ping
```
</details>

## 🎯 **Key Features**

### **📊 Real-time Analytics**
- **Interactive Heatmaps**: 20×15 grid with intensity visualization
- **Live Statistics**: Top cells by dwell time, object counts
- **Multi-source Data**: Support for multiple collectors and cameras  
- **Auto-refresh**: Configurable update intervals (default 30s)

### **🎮 User Experience**
- **One-click Start**: `npm start` works everywhere
- **Smart Fallbacks**: Automatically handles missing dependencies
- **Cross-platform**: Linux, macOS, Windows support
- **Responsive Design**: Works on desktop and tablet devices

### **🔧 Developer Experience**  
- **Hot Reload**: Automatic service restart on code changes
- **Comprehensive Logging**: Structured logs with correlation IDs
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Easy Testing**: Built-in test data generation

### **🚀 Production Ready**
- **Containerized**: Full Docker support with docker-compose
- **Scalable**: Kafka partitioning, stateless services
- **Monitored**: Health checks, metrics, and status endpoints
- **Documented**: Complete API documentation and deployment guides

## 📖 **Documentation**

- **[Camera Data Generation Guide](./CAMERA_DATA_GENERATION.md)** - Complete guide to data generation features
- **[System Requirements](./SYSTEM_REQUIREMENTS.md)** - Detailed technical requirements
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment options  
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🧬 **Data Models**

### **Detection Event**
```typescript
{
  collector_id: "collector-01",
  camera_id: "cam-001", 
  object_id: "obj-abc123",
  grid_cell_id: "G_05_12",
  timestamp_ms: 1725421200123
}
```

### **Object State**
```typescript
{
  collector_id: "collector-01",
  camera_id: "cam-001",
  object_id: "obj-abc123", 
  current_cell: "G_05_12",
  enter_ts_ms: 1725421200000,
  accumulated_ms: 45000
}
```

### **Heatmap Data**
```typescript
{
  collector_id: "collector-01",
  camera_id: "cam-001",
  grid_size: { width: 20, height: 15 },
  cells: [{
    grid_cell_id: "G_05_12",
    x: 5, y: 12,
    dwell_ms: 45000,
    object_count: 3,
    intensity: 0.75
  }]
}
```

## 🎪 **Use Cases**

### **🏭 Warehouse Management**
- Track pallet movements and storage times
- Monitor forklift efficiency and traffic patterns  
- Identify bottlenecks in loading/unloading areas
- Optimize storage layout based on dwell analytics

### **🚚 Logistics Centers**
- Monitor package flow and processing times
- Track vehicle movements in yard areas
- Analyze worker movement patterns
- Identify process optimization opportunities

### **🏗️ Construction Sites**  
- Track equipment utilization and idle times
- Monitor material placement and movement
- Analyze worker safety and efficiency
- Optimize site layout and workflow

### **🏪 Retail Operations**
- Customer movement and dwell time analysis
- Product interaction tracking
- Queue management and flow optimization  
- Store layout effectiveness measurement

## 🎁 **Getting Help**

### **📞 Support Resources**
- **Quick Start**: Follow the 30-second setup above
- **System Validation**: `npm run validate` 
- **Health Check**: `npm run system:health`
- **Documentation**: Check README.md and other `.md` files

### **🐛 Reporting Issues**
1. Run `npm run validate` and share output
2. Run `npm run system:health` and include results  
3. Include relevant logs from `.logs/` directory
4. Specify platform (Windows/Linux/macOS) and Node.js version

### **💡 Quick Fixes**
```bash
# Reset everything
npm stop && npm start

# Clean install  
rm -rf node_modules */node_modules
npm install

# Force fallback mode
npm run start:fallback
```

## 📜 **License**

MIT License - see LICENSE file for details.

## 🌟 **What Makes This Special**

- **🎨 Stunning Visualizations**: 6 visual patterns that create compelling heatmap demonstrations
- **🏭 Realistic Simulation**: Smart object behavior with zone-based warehouse logic
- **🎮 Interactive Controls**: Full-featured interface for customizing data generation
- **⚡ Instant Results**: 30-second setup to working visual demonstration
- **🌍 Universal Compatibility**: Works everywhere Node.js runs (no Docker required)
- **📊 Real-time Analytics**: Live updates showing dwell times, object tracking, and statistics
- **🎯 Demo-Perfect**: Designed specifically for impressive stakeholder presentations

## 🚀 **Get Started Now**

```bash
# 1. Clone and start system
git clone <repository-url>
cd vision-logistics  
npm run fix-and-start

# 2. Generate visual data (new terminal)
npm run demo-visualization

# 3. Open http://localhost:3000 and watch the magic! ✨
```

**Perfect for product demos, stakeholder presentations, and understanding warehouse logistics through interactive data visualization!** 🎪