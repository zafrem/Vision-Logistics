# 🎯 Vision Logistics Tracking System

> **Real-time warehouse logistics tracking with live animated heatmaps**

A demo-ready system that visualizes object movements across warehouse grid cells with animated heatmaps, real-time statistics, and live event tracking.

[![System Validation](https://img.shields.io/badge/system-validated-green)](./scripts/validate-system.js)
[![Docker Support](https://img.shields.io/badge/docker-supported-blue)](#quick-start)
[![Cross Platform](https://img.shields.io/badge/platform-cross--platform-lightgrey)](#quick-start)

## 🚀 **Quick Start**

```bash
git clone <repository-url>
cd vision-logistics
npm start
```

**🌐 Open http://localhost:3000** to see:
- **Live animated heatmap** with 4 moving objects
- **Real-time statistics** and object tracking
- **Event log** showing live warehouse activity

### **🎬 What You'll See**

- 🚛 **Forklift**: Horizontal movement across warehouse floor
- 👷 **Worker**: Diagonal movement through work zones
- 📦 **Pallet**: Circular movement around storage area
- 🛒 **Cart**: Vertical movement in transport corridors
- 🔄 **15-second animation cycles** with auto-refresh

## 🏗️ **System Architecture**

```
🎥 Cameras → 📡 Collectors → 🗄️ Redis → 🧮 Manager → 📊 Analytics
                                ↑                      ↓
                              Queue                🌐 UI ← APIs
```

| Service | Purpose | Port |
|---------|---------|------|
| **Collector** | Process camera feeds | 3001 |
| **Manager** | Calculate dwell times | 3002 |
| **UI** | Live analytics dashboard | 3000 |

## 🔧 **Features**

- **20×15 Grid System**: 300 trackable warehouse cells
- **Live Heatmaps**: Visual intensity mapping with animations
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Interactive**: Click cells for detailed information
- **Cross-platform**: Windows, macOS, Linux support

## 🚨 **Troubleshooting**

**Connection errors?**
```bash
npm run fix-and-start
```

**Common issues:**
- **Port conflicts**: `killall node && npm start`
- **No Docker**: `npm run start:fallback`
- **No data**: `npm run generate-test-data`

## 📚 **Documentation**

- **[Demo Guide](./docs/DEMO_GUIDE.md)** - Presentation and demonstration guide
- **[Practice Guide](./docs/PRACTICE_GUIDE.md)** - Learning exercises and tutorials
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Complete troubleshooting reference

## 🔍 **API Examples**

```bash
# Get live heatmap data
curl "http://localhost:3002/heatmap"

# Get active objects
curl "http://localhost:3002/objects/active"

# Get recent events
curl "http://localhost:3002/events/recent"

# Generate test data
curl -X POST http://localhost:3001/generate-test-frame \
  -H "Content-Type: application/json" \
  -d '{"camera_id": "cam-001", "object_count": 5}'
```

## 🎯 **Use Cases**

- **Warehouse Management**: Track pallet movements and storage times
- **Logistics Centers**: Monitor package flow and processing times
- **Construction Sites**: Track equipment utilization and idle times
- **Retail Operations**: Customer movement and dwell time analysis

---

**Perfect for product demos and understanding warehouse logistics through interactive data visualization!** 🎪