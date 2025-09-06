# 📹 Camera Data Generation System

> **Comprehensive camera data generation for realistic visualization and testing**

The Vision Logistics system includes a sophisticated camera data generation module designed to create realistic object detection events that demonstrate the system's capabilities. This module generates data that mimics real warehouse operations and creates visually interesting patterns for demonstration purposes.

## 🚀 **Quick Start**

### **🎮 Interactive Mode (Recommended)**
```bash
npm run demo
```
- **Full interactive menu** with real-time controls
- **Multiple scenarios** and visualization patterns
- **Adjustable settings** for interval, duration, and intensity
- **System status monitoring** and health checks

### **⚡ Quick Demos**
```bash
# 1-minute quick demo
npm run demo-quick

# 3-minute warehouse simulation
npm run demo-warehouse  

# Visual heatwave pattern
npm run demo-visualization
```

### **🎨 Visualization Patterns**
```bash
# Specific visualization patterns
npm run generate-visualization heatwave    # Moving concentration wave
npm run generate-visualization concentric  # Expanding circles
npm run generate-visualization snake       # Spiral movement
npm run generate-visualization zones       # Zone-based activity
npm run generate-visualization traffic     # Traffic flow simulation
npm run generate-visualization clusters    # Appearing/disappearing groups
```

## 🏗️ **System Architecture**

### **Generation Components**

```
📹 Camera Data Generator
├── 🎯 Realistic Object Movement
├── 🏭 Zone-Based Activity Simulation  
├── 📊 Multi-Scenario Support
├── 🎨 Visualization Pattern Engine
└── 🎮 Interactive Controls

↓ Sends Detection Events ↓

🔄 Collector Service → 🌊 Kafka → 🧮 Manager → 🌐 UI Dashboard
```

### **Object Classes & Behavior**

| Object Class | Speed | Stickiness | Spawn Rate | Lifetime | Behavior Pattern |
|--------------|-------|------------|------------|----------|------------------|
| **Pallet** | 0.1 | 0.8 | 0.3 | 30-120s | Sticky, local movement |
| **Forklift** | 0.4 | 0.2 | 0.1 | 60-300s | Linear with turns |
| **Worker** | 0.6 | 0.1 | 0.2 | 20-180s | Random walk |
| **Box** | 0.2 | 0.6 | 0.4 | 15-60s | Guided flow |
| **Container** | 0.05 | 0.9 | 0.1 | 120-600s | Minimal movement |
| **Truck** | 0.3 | 0.4 | 0.05 | 180-900s | Zone constrained |

### **Grid Zones & Activity**

| Zone | Grid Area | Activity Level | Preferred Objects |
|------|-----------|----------------|-------------------|
| **Loading Dock** | [0-5, 0-5] | High | Forklift, Worker, Pallet |
| **Storage Area** | [6-15, 2-12] | Medium | Pallet, Container, Box |
| **Shipping Zone** | [16-19, 0-5] | High | Truck, Forklift, Box |
| **Office Area** | [0-5, 13-14] | Low | Worker |
| **Maintenance** | [16-19, 13-14] | Low | Worker, Forklift |
| **Transit Corridor** | [6-15, 0-1] | Medium | Forklift, Worker |
| **Exit Corridor** | [6-15, 13-14] | Medium | Forklift, Worker |

## 🎯 **Generation Scenarios**

### **Standard Scenarios**

#### **🏭 Warehouse Operations**
- **Purpose**: Realistic daily warehouse activity
- **Duration**: 5+ minutes
- **Objects**: Balanced mix of all types
- **Pattern**: Natural movement with zone preferences
- **Use Case**: General demonstration, testing

#### **📈 Busy Period**
- **Purpose**: Peak activity simulation
- **Duration**: 3+ minutes  
- **Objects**: High density, rapid movement
- **Pattern**: Increased spawn rates, faster movement
- **Use Case**: Stress testing, capacity demonstration

#### **📉 Quiet Period**
- **Purpose**: Low activity baseline
- **Duration**: Any
- **Objects**: Minimal objects, slow movement
- **Pattern**: Reduced spawn rates, longer lifetimes
- **Use Case**: Baseline testing, UI verification

#### **👥 Shift Change**
- **Purpose**: Peak worker movement simulation
- **Duration**: 2-3 minutes
- **Objects**: High worker density, minimal equipment
- **Pattern**: Burst of worker objects, corridor movement
- **Use Case**: Human traffic analysis

#### **🚨 Emergency Drill**
- **Purpose**: Evacuation simulation
- **Duration**: 1-2 minutes
- **Objects**: All workers moving to exits
- **Pattern**: Directional movement toward exit corridors
- **Use Case**: Emergency procedure modeling

#### **🎪 Demonstration**
- **Purpose**: Balanced showcase mode
- **Duration**: Configurable
- **Objects**: Optimized for visual appeal
- **Pattern**: Balanced activity with clear patterns
- **Use Case**: Product demos, presentations

### **Visualization Scenarios**

#### **🌊 Heatwave Pattern**
- **Description**: Moving concentration wave across the grid
- **Duration**: 2 minutes
- **Visual Effect**: Horizontal wave of high-activity cells
- **Objects**: Workers following wave pattern
- **Best For**: Demonstrating heatmap intensity visualization

#### **⭕ Concentric Pattern**
- **Description**: Expanding circles from center point
- **Duration**: 3 minutes
- **Visual Effect**: Circular rings expanding outward
- **Objects**: Boxes arranged in circle formations
- **Best For**: Showing radial distribution patterns

#### **🐍 Snake Pattern**
- **Description**: Spiral movement around the grid
- **Duration**: 2.5 minutes
- **Visual Effect**: Connected objects forming spiral
- **Objects**: Forklifts in continuous chain
- **Best For**: Demonstrating continuous movement tracking

#### **🏭 Zone Activity Pattern**
- **Description**: Different zones show varying activity levels
- **Duration**: 5 minutes
- **Visual Effect**: Zone-based intensity variations over time
- **Objects**: All types in appropriate zones
- **Best For**: Showing warehouse workflow patterns

#### **🚦 Traffic Flow Pattern**
- **Description**: Directional movement along corridors
- **Duration**: 4 minutes
- **Visual Effect**: Clear traffic lanes with consistent flow
- **Objects**: Multiple types moving in organized flows
- **Best For**: Logistics flow visualization

#### **⚡ Cluster Pattern**
- **Description**: Groups of objects that appear and disappear
- **Duration**: 3.3 minutes
- **Visual Effect**: Pulsing clusters across the grid
- **Objects**: Mixed types in temporary groupings
- **Best For**: Event-based activity visualization

## 🎮 **Interactive Generation**

### **Main Menu Features**
- **Real-time Status**: Current settings and generation state
- **Start/Stop Control**: Instant generation control
- **Scenario Selection**: Choose from 6 predefined scenarios
- **Settings Adjustment**: Customize interval, duration, intensity
- **Visualization Patterns**: 6 special visual patterns
- **Quick Demo**: One-click 60-second demonstration
- **System Status**: Health check for all services
- **Help System**: Built-in documentation

### **Real-time Controls**
- **Live Progress**: Real-time generation statistics
- **Instant Stop**: Ctrl+C to stop generation immediately
- **Settings Memory**: All settings preserved during session
- **Error Handling**: Graceful error recovery and reporting

### **Configuration Options**

#### **Interval Settings**
- **Very Fast**: 500ms - High-frequency data
- **Fast**: 1000ms - Rapid updates
- **Medium**: 2000ms - Default balanced
- **Slow**: 3000ms - Relaxed pace
- **Very Slow**: 5000ms - Minimal updates
- **Custom**: 100-10000ms - User-defined

#### **Duration Settings**
- **Quick Test**: 30s - Rapid verification
- **Short Demo**: 60s - Brief demonstration
- **Medium Demo**: 5min - Standard showcase
- **Long Demo**: 10min - Extended demonstration
- **Extended**: 30min - Comprehensive testing
- **Custom**: 10-7200s - User-defined

#### **Intensity Settings**
- **Low**: 0.3x multiplier - Minimal objects
- **Medium**: 1.0x multiplier - Balanced activity
- **High**: 1.8x multiplier - Busy warehouse
- **Maximum**: 3.0x multiplier - Stress test levels

## 📊 **Data Generation Features**

### **Realistic Object Movement**
- **Smart Pathfinding**: Objects move logically between zones
- **Behavioral Patterns**: Each object type has unique movement characteristics
- **Collision Avoidance**: Objects don't overlap unrealistically
- **Zone Preferences**: Objects prefer appropriate areas
- **Lifecycle Management**: Natural object creation and destruction

### **Warehouse Simulation**
- **Multi-Camera Support**: Generate data for multiple camera views
- **Zone-Based Logic**: Different areas have different activity patterns
- **Time-Based Variations**: Activity levels change over time
- **Equipment Behavior**: Forklifts follow corridors, workers move freely
- **Cargo Flow**: Boxes and pallets follow logical paths

### **Performance Optimization**
- **Efficient Batching**: Process multiple cameras simultaneously
- **Memory Management**: Clean up expired objects automatically
- **Error Recovery**: Graceful handling of network issues
- **Statistics Tracking**: Comprehensive performance metrics
- **Resource Monitoring**: Track CPU and memory usage

### **Visual Appeal**
- **Varied Movement**: Objects don't move in predictable patterns
- **Natural Clustering**: Objects group naturally in work areas
- **Smooth Transitions**: Movement appears realistic and natural
- **Activity Hotspots**: Clear zones of high activity
- **Dynamic Patterns**: Activity changes over time

## 🎯 **Usage Examples**

### **Demo for Stakeholders**
```bash
npm run demo

# Select: 6. Quick Demo
# Opens interactive interface with 60-second balanced demonstration
```

### **Stress Testing**
```bash
npm run generate-interactive

# Select: 4. Adjust Settings → 3. Intensity → 4. Maximum
# Select: 3. Change Scenario → 2. Busy Period
# Select: 1. Start Generation
```

### **Visual Presentation**
```bash
# Show different visualization patterns
npm run demo-visualization          # Heatwave
npm run generate-visualization snake      # Spiral movement
npm run generate-visualization concentric # Expanding circles
```

### **Realistic Warehouse Simulation**
```bash
npm run generate-camera-data warehouse_busy

# Or for extended realistic simulation:
npm run demo-warehouse
```

### **Custom Scenario**
```javascript
// Create custom generator
import { CameraDataGenerator } from './scripts/camera-data-generator.js';

const generator = new CameraDataGenerator({
  duration: 600,     // 10 minutes
  interval: 1000,    // 1 second updates
  scenario: 'warehouse_operations',
  collectors: [
    { 
      id: 'custom-collector', 
      cameras: ['cam-main', 'cam-storage', 'cam-loading'] 
    }
  ]
});

await generator.start();
```

## 📈 **Monitoring & Analytics**

### **Real-time Statistics**
- **Frames Generated**: Total detection frames sent
- **Objects Created**: New objects spawned
- **Objects Destroyed**: Objects that reached end of life
- **Events Sent**: Successful API calls to collector
- **Success Rate**: Percentage of successful transmissions
- **Generation Rate**: Frames per second
- **Active Objects**: Currently tracked objects

### **Performance Metrics**
- **Runtime**: Total generation time
- **Objects per Frame**: Average object density
- **Network Success**: API call success rate
- **Memory Usage**: Object tracking overhead
- **Processing Speed**: Generation efficiency

### **Visual Feedback**
- **Progress Indicators**: Real-time progress bars
- **Error Reporting**: Clear error messages with context
- **Status Updates**: Continuous status information
- **Completion Summary**: Final statistics and recommendations

## 🔧 **Customization**

### **Adding New Object Types**
```javascript
// Add to OBJECT_CLASSES in camera-data-generator.js
const NEW_OBJECT = {
  speed: 0.25,        // Movement frequency (0-1)
  stickiness: 0.4,    // Tendency to stay in place (0-1)
  spawn_rate: 0.2,    // Creation probability (0-1)
  lifetime: { min: 30, max: 180 } // Lifespan in seconds
};
```

### **Creating New Zones**
```javascript
// Add to GRID_ZONES in camera-data-generator.js
const NEW_ZONE = {
  x: [5, 10],         // X coordinate range
  y: [3, 8],          // Y coordinate range
  activity: 'high',   // Activity level
  preferred_objects: ['worker', 'box'] // Object preferences
};
```

### **Custom Movement Patterns**
```javascript
// Override simulateObjectMovement in generator
simulateObjectMovement(obj) {
  // Custom movement logic
  const newX = obj.x + Math.floor(Math.random() * 3) - 1;
  const newY = obj.y + Math.floor(Math.random() * 3) - 1;
  
  return {
    ...obj,
    x: Math.max(0, Math.min(19, newX)),
    y: Math.max(0, Math.min(14, newY))
  };
}
```

## 📋 **Available Commands**

### **Interactive Commands**
```bash
npm run demo                        # Full interactive interface
npm run generate-interactive        # Same as demo
```

### **Quick Demo Commands**  
```bash
npm run demo-quick                  # 1-minute quick demo
npm run demo-warehouse              # 3-minute warehouse simulation
npm run demo-visualization          # Heatwave visualization pattern
```

### **Direct Generation Commands**
```bash
npm run generate-camera-data        # Standard generation
npm run generate-camera-data quick_demo        # Quick demo scenario
npm run generate-camera-data warehouse_busy    # Busy warehouse
npm run generate-camera-data performance_test  # Performance testing
```

### **Visualization Commands**
```bash
npm run generate-visualization heatwave    # Moving wave pattern
npm run generate-visualization concentric  # Expanding circles
npm run generate-visualization snake       # Spiral movement
npm run generate-visualization zones       # Zone activity
npm run generate-visualization traffic     # Traffic flow
npm run generate-visualization clusters    # Cluster pattern
```

## 🎪 **Best Practices**

### **For Demonstrations**
1. **Start with Quick Demo**: `npm run demo-quick` for immediate results
2. **Use Visualization Patterns**: They create the most striking visual effects
3. **Monitor the UI**: Open http://localhost:3000 during generation
4. **Explain the Patterns**: Point out zones, movement, and dwell times

### **For Testing**
1. **Use Interactive Mode**: Better control and monitoring
2. **Start with Low Intensity**: Easier to debug issues
3. **Check System Status**: Verify all services are healthy
4. **Monitor Performance**: Watch for memory/CPU issues

### **For Development**
1. **Customize Object Behavior**: Modify movement patterns for your needs
2. **Add New Scenarios**: Create domain-specific generation patterns
3. **Extend Visualization**: Add new visual patterns for specific use cases
4. **Integration Testing**: Use for automated testing pipelines

## 🚨 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| **No objects appearing** | Check collector service is running: `curl http://localhost:3001/health` |
| **Generation fails to start** | Verify system status: `npm run system:health` |
| **Low object counts** | Increase intensity in interactive mode or use 'busy_period' scenario |
| **Objects don't move** | Check if using 'quiet_period' scenario or very high stickiness |
| **Network errors** | Restart services: `npm run fix-and-start` |

### **Performance Issues**

| Symptom | Cause | Solution |
|---------|-------|----------|
| **Slow generation** | High interval setting | Reduce interval to 500-1000ms |
| **High memory usage** | Too many active objects | Reduce intensity or duration |
| **Network timeouts** | Services overloaded | Increase interval or reduce intensity |
| **UI lag** | Too frequent updates | Increase interval to 2000ms+ |

### **Validation Commands**
```bash
# Check if everything is working
npm run validate

# Check system health
npm run system:health

# Check specific services
curl http://localhost:3001/health  # Collector
curl http://localhost:3002/health  # Manager
```

## 💡 **Tips for Maximum Impact**

### **Creating Impressive Demos**
1. **Start with heatwave pattern**: Most visually striking
2. **Use multiple patterns**: Show variety in 5-10 minute sessions
3. **Explain the zones**: Point out different warehouse areas
4. **Show real-time stats**: Highlight the statistics table
5. **Demonstrate interactivity**: Click on heatmap cells

### **Educational Use**
1. **Start with simple scenarios**: Build up complexity gradually
2. **Explain object behavior**: Different types move differently
3. **Show zone-based logic**: Warehouse operations aren't random
4. **Demonstrate analytics**: How dwell time reveals patterns
5. **Interactive exploration**: Let users try the controls

### **Business Presentations**
1. **Focus on business value**: Efficiency, optimization, insights
2. **Show realistic scenarios**: Warehouse operations, not just patterns
3. **Highlight real-time capability**: Live updates, immediate insights
4. **Demonstrate scalability**: Multiple collectors, cameras, objects
5. **Connect to ROI**: How this data drives business decisions

The camera data generation system provides everything needed to create compelling, realistic demonstrations of the Vision Logistics platform. Whether you need quick demos, extended testing, or visually striking presentations, the generation module delivers consistent, high-quality data that showcases the system's capabilities effectively. 🚀