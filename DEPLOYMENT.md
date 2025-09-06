# Vision Logistics - Deployment Guide

## 🚀 **Quick Deployment Options**

### **Option 1: One-Command Start (Recommended)**
```bash
npm start
```
- ✅ Auto-detects Docker availability
- ✅ Falls back to in-memory services if Docker unavailable  
- ✅ Installs dependencies automatically
- ✅ Works on all platforms

### **Option 2: Fallback Mode (No Docker Required)**
```bash
npm run start:fallback
```
- ✅ Uses in-memory Redis and Kafka alternatives
- ✅ Perfect for development/CI environments
- ✅ All features work identically
- ✅ Lightweight and fast startup

### **Option 3: Windows Batch File**
```bat
start.bat
```
- ✅ Double-click to run
- ✅ Auto-detects environment
- ✅ User-friendly interface
- ✅ Built-in help and status commands

### **Option 4: Advanced System Manager (Linux/macOS)**
```bash
./scripts/system-manager.sh start
./scripts/system-manager.sh status
./scripts/system-manager.sh logs
```
- ✅ Full process management
- ✅ Detailed logging
- ✅ Health monitoring
- ✅ Graceful shutdown

## 🌍 **Environment Compatibility**

### **✅ Supported Environments**
- **Development**: Full Docker + fallback support
- **CI/CD Pipelines**: Fallback mode works perfectly  
- **Production**: Docker recommended, fallback available
- **Demo/Testing**: Fallback mode ideal
- **Containers**: Full Docker support
- **Cloud**: Both modes supported

### **✅ Platform Support**
- **Linux**: All options (recommended: system-manager.sh)
- **macOS**: All options (recommended: system-manager.sh)  
- **Windows**: All options (recommended: start.bat)
- **WSL**: Full Linux compatibility
- **Docker Desktop**: Full container support

## 🔧 **Configuration Options**

### **Environment Variables**
```bash
# Collector Service
COLLECTOR_ID=collector-01           # Unique collector identifier
PORT=3001                          # Collector service port
KAFKA_BROKERS=localhost:9092       # Kafka broker addresses

# Manager Service  
MANAGER_PORT=3002                  # Manager service port
REDIS_URL=redis://localhost:6379   # Redis connection string
DWELL_TIMEOUT_MS=30000            # Object timeout (milliseconds)

# UI Service
VITE_API_URL=http://localhost:3002 # Manager API endpoint

# Test Data Generation
BATCH_SIZE=20                      # Events per batch
INTERVAL_MS=2000                  # Batch interval
DURATION_MINUTES=5                # Generation duration
```

### **Fallback Service Ports**
```bash
# Fallback Redis: 6380 (instead of 6379)
# Fallback Kafka: 9093 (instead of 9092)
# All application ports remain the same: 3000, 3001, 3002
```

## 📊 **Service Architecture**

### **Docker Mode**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Kafka     │    │    Redis    │    │   Zookeeper │
│  (Port 9092)│    │ (Port 6379) │    │ (Port 2181) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Collector  │───▶│   Manager   │◀───│     UI      │
│ (Port 3001) │    │ (Port 3002) │    │ (Port 3000) │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **Fallback Mode**
```
┌─────────────┐    ┌─────────────┐
│ Fallback    │    │ Fallback    │
│ Kafka (9093)│    │ Redis (6380)│
└─────────────┘    └─────────────┘
       │                   │
       └───────────────────┼───────────────────┘
                           │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Collector  │───▶│   Manager   │◀───│     UI      │
│ (Port 3001) │    │ (Port 3002) │    │ (Port 3000) │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 🔍 **Health Monitoring**

### **Built-in Health Checks**
```bash
# System status
npm run system:status

# Health endpoints  
curl http://localhost:3001/health  # Collector
curl http://localhost:3002/health  # Manager
curl http://localhost:3002/status  # Manager detailed status
```

### **Service Validation**
```bash
# Complete system validation
npm run validate

# Check if services are responding
npm run system:health
```

## 🧪 **Testing & Demo**

### **Generate Test Data**
```bash
# Generate 5 minutes of realistic test data
npm run generate-test-data

# Custom generation (edit environment variables in script)
DURATION_MINUTES=10 BATCH_SIZE=50 npm run generate-test-data
```

### **Test Scenarios**
- **Multiple Collectors**: collector-01, collector-02
- **Multiple Cameras**: cam-001, cam-002, cam-003 per collector
- **Object Types**: pallets, forklifts, workers, boxes, containers, trucks
- **Realistic Movement**: Adjacent cell movement + occasional teleportation
- **Object Lifecycle**: Objects appear, move, and disappear over time

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| Port conflicts | `npm stop` then `npm start` |
| Docker not available | Use `npm run start:fallback` |
| Services not responding | Check `npm run system:health` |
| No data in UI | Run `npm run generate-test-data` |
| Permission errors | Ensure scripts are executable: `chmod +x scripts/*.sh` |
| Windows path issues | Use `start.bat` instead of npm commands |

### **Log Files**
```bash
# View all logs (if using system-manager)
npm run system:logs

# Individual log files (created in .logs/)
tail -f .logs/collector.log
tail -f .logs/manager.log  
tail -f .logs/ui.log
```

## 🔐 **Production Considerations**

### **Security**
- Add authentication/authorization to APIs
- Use HTTPS in production
- Secure Kafka and Redis connections
- Environment variable management

### **Scalability**  
- Multiple collector instances
- Kafka partitioning by collector+camera
- Redis clustering for high availability
- Load balancing for Manager APIs

### **Monitoring**
- Prometheus metrics endpoints
- Grafana dashboards
- Log aggregation (ELK stack)
- Alert configuration

### **Data Persistence**
- Persistent volumes for Docker
- Redis data backup/restore
- Kafka log retention policies
- Historical data archival

## 🎯 **Success Indicators**

When everything is working correctly:

1. ✅ **All services healthy**: `npm run system:health` shows green
2. ✅ **UI accessible**: http://localhost:3000 loads dashboard
3. ✅ **Data flowing**: Heatmap updates after running test data generator
4. ✅ **Real-time updates**: Statistics refresh every 30 seconds
5. ✅ **Interactive features**: Cell selection and collector/camera switching work

## 📞 **Support**

- 📖 **Documentation**: See README.md for detailed usage
- 🧪 **Validation**: Run `npm run validate` to check setup
- 🔧 **System Status**: Use `npm run system:status` for diagnostics
- 💬 **Issues**: Check troubleshooting section in README.md