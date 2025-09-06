#!/usr/bin/env node

import { randomUUID } from 'crypto';
import axios from 'axios';
import { EventEmitter } from 'events';

const COLLECTOR_URL = process.env.COLLECTOR_URL || 'http://localhost:3001';

// Object classes with different behavior patterns
const OBJECT_CLASSES = {
  'pallet': { speed: 0.1, stickiness: 0.8, spawn_rate: 0.3, lifetime: { min: 30, max: 120 } },
  'forklift': { speed: 0.4, stickiness: 0.2, spawn_rate: 0.1, lifetime: { min: 60, max: 300 } },
  'worker': { speed: 0.6, stickiness: 0.1, spawn_rate: 0.2, lifetime: { min: 20, max: 180 } },
  'box': { speed: 0.2, stickiness: 0.6, spawn_rate: 0.4, lifetime: { min: 15, max: 60 } },
  'container': { speed: 0.05, stickiness: 0.9, spawn_rate: 0.1, lifetime: { min: 120, max: 600 } },
  'truck': { speed: 0.3, stickiness: 0.4, spawn_rate: 0.05, lifetime: { min: 180, max: 900 } }
};

// Grid zones with different characteristics
const GRID_ZONES = {
  'loading_dock': { x: [0, 5], y: [0, 5], activity: 'high', preferred_objects: ['forklift', 'worker', 'pallet'] },
  'storage_area': { x: [6, 15], y: [2, 12], activity: 'medium', preferred_objects: ['pallet', 'container', 'box'] },
  'shipping_zone': { x: [16, 19], y: [0, 5], activity: 'high', preferred_objects: ['truck', 'forklift', 'box'] },
  'office_area': { x: [0, 5], y: [13, 14], activity: 'low', preferred_objects: ['worker'] },
  'maintenance': { x: [16, 19], y: [13, 14], activity: 'low', preferred_objects: ['worker', 'forklift'] },
  'transit_corridor': { x: [6, 15], y: [0, 1], activity: 'medium', preferred_objects: ['forklift', 'worker'] },
  'exit_corridor': { x: [6, 15], y: [13, 14], activity: 'medium', preferred_objects: ['forklift', 'worker'] }
};

const COLLECTORS = [
  { id: 'collector-warehouse-01', cameras: ['cam-main-floor', 'cam-loading-dock', 'cam-storage-A'] },
  { id: 'collector-warehouse-02', cameras: ['cam-shipping-zone', 'cam-office-area', 'cam-maintenance'] }
];

class CameraDataGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      collectors: options.collectors || COLLECTORS,
      duration: options.duration || 300, // 5 minutes default
      interval: options.interval || 2000, // 2 seconds
      scenario: options.scenario || 'warehouse_operations',
      visualization_mode: options.visualization_mode || false,
      realtime_streaming: options.realtime_streaming || false,
      ...options
    };

    this.objects = new Map(); // Tracks all objects across all cameras
    this.isRunning = false;
    this.frameCount = 0;
    this.startTime = Date.now();
    
    // Performance tracking
    this.stats = {
      frames_generated: 0,
      objects_created: 0,
      objects_destroyed: 0,
      events_sent: 0,
      errors: 0
    };
  }

  // Generate unique object ID
  generateObjectId(objectClass) {
    return `${objectClass}-${randomUUID().slice(0, 8)}`;
  }

  // Get random grid cell within zone or anywhere
  getGridCell(zone = null) {
    let x, y;
    
    if (zone && GRID_ZONES[zone]) {
      const zoneData = GRID_ZONES[zone];
      x = Math.floor(Math.random() * (zoneData.x[1] - zoneData.x[0] + 1)) + zoneData.x[0];
      y = Math.floor(Math.random() * (zoneData.y[1] - zoneData.y[0] + 1)) + zoneData.y[0];
    } else {
      x = Math.floor(Math.random() * 20);
      y = Math.floor(Math.random() * 15);
    }
    
    return {
      id: `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`,
      x, y
    };
  }

  // Get zone for a given cell
  getCellZone(x, y) {
    for (const [zoneName, zoneData] of Object.entries(GRID_ZONES)) {
      if (x >= zoneData.x[0] && x <= zoneData.x[1] && 
          y >= zoneData.y[0] && y <= zoneData.y[1]) {
        return zoneName;
      }
    }
    return 'general_area';
  }

  // Simulate object movement with realistic patterns
  simulateObjectMovement(obj) {
    const objectData = OBJECT_CLASSES[obj.class];
    const currentZone = this.getCellZone(obj.x, obj.y);
    const zoneData = GRID_ZONES[currentZone] || { activity: 'medium' };
    
    // Determine if object should move based on stickiness and activity
    const moveChance = (1 - objectData.stickiness) * 
                      (zoneData.activity === 'high' ? 1.2 : 
                       zoneData.activity === 'low' ? 0.5 : 1.0);
    
    if (Math.random() > moveChance) {
      return obj; // Object stays in same position
    }

    // Different movement patterns based on object type
    let newX = obj.x;
    let newY = obj.y;

    switch (obj.class) {
      case 'forklift':
        // Forklifts move in corridors and between zones
        if (Math.random() < 0.7) {
          // Prefer corridor movement
          if (obj.y === 0 || obj.y === 1 || obj.y === 13 || obj.y === 14) {
            newX += Math.random() < 0.5 ? -1 : 1; // Horizontal in corridors
          } else {
            newY += Math.random() < 0.5 ? -1 : 1; // Vertical movement
          }
        } else {
          // Random movement
          newX += Math.floor(Math.random() * 3) - 1;
          newY += Math.floor(Math.random() * 3) - 1;
        }
        break;

      case 'worker':
        // Workers move more randomly but tend to stay in their zones
        if (Math.random() < 0.3) {
          // Stay in zone
          const moves = this.getAdjacentCells(obj.x, obj.y);
          const zoneMovement = moves.filter(([x, y]) => 
            this.getCellZone(x, y) === currentZone);
          
          if (zoneMovement.length > 0) {
            [newX, newY] = zoneMovement[Math.floor(Math.random() * zoneMovement.length)];
          }
        } else {
          // Random movement
          newX += Math.floor(Math.random() * 3) - 1;
          newY += Math.floor(Math.random() * 3) - 1;
        }
        break;

      case 'pallet':
      case 'container':
        // Heavy objects move slowly and prefer adjacent cells
        const adjacentCells = this.getAdjacentCells(obj.x, obj.y);
        if (adjacentCells.length > 0) {
          [newX, newY] = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
        }
        break;

      case 'truck':
        // Trucks move primarily in loading/shipping areas
        if (currentZone === 'shipping_zone' || currentZone === 'loading_dock') {
          newX += Math.random() < 0.5 ? -1 : 1;
        } else {
          // Move towards shipping/loading areas
          if (obj.x < 10) newX += 1; // Move towards loading dock
          else newX -= 1; // Move towards shipping zone
        }
        break;

      default:
        // Default movement pattern
        newX += Math.floor(Math.random() * 3) - 1;
        newY += Math.floor(Math.random() * 3) - 1;
    }

    // Ensure movement stays within bounds
    newX = Math.max(0, Math.min(19, newX));
    newY = Math.max(0, Math.min(14, newY));

    return { ...obj, x: newX, y: newY, 
             grid_cell_id: `G_${newX.toString().padStart(2, '0')}_${newY.toString().padStart(2, '0')}` };
  }

  // Get adjacent cells
  getAdjacentCells(x, y) {
    const adjacent = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const newX = x + dx;
        const newY = y + dy;
        if (newX >= 0 && newX < 20 && newY >= 0 && newY < 15) {
          adjacent.push([newX, newY]);
        }
      }
    }
    return adjacent;
  }

  // Create new object based on scenario and zone preferences
  createObject(collectorId, cameraId, preferredZone = null) {
    let objectClass, zone;
    
    // Select object class based on zone preferences
    if (preferredZone && GRID_ZONES[preferredZone]) {
      const zonePreferences = GRID_ZONES[preferredZone].preferred_objects;
      objectClass = zonePreferences[Math.floor(Math.random() * zonePreferences.length)];
      zone = preferredZone;
    } else {
      // Weighted random selection
      const weights = Object.entries(OBJECT_CLASSES).map(([cls, data]) => [cls, data.spawn_rate]);
      objectClass = this.weightedRandomSelect(weights);
      zone = null;
    }

    const cell = this.getGridCell(zone);
    const lifetime = OBJECT_CLASSES[objectClass].lifetime;
    const lifespan = (lifetime.min + Math.random() * (lifetime.max - lifetime.min)) * 1000;

    const obj = {
      object_id: this.generateObjectId(objectClass),
      class: objectClass,
      confidence: 0.7 + Math.random() * 0.3,
      grid_cell_id: cell.id,
      x: cell.x,
      y: cell.y,
      bbox: this.generateBbox(objectClass),
      created_at: Date.now(),
      expires_at: Date.now() + lifespan,
      collector_id: collectorId,
      camera_id: cameraId,
      movement_pattern: this.getMovementPattern(objectClass),
      zone: this.getCellZone(cell.x, cell.y)
    };

    this.stats.objects_created++;
    return obj;
  }

  // Generate realistic bounding box based on object class
  generateBbox(objectClass) {
    const baseSizes = {
      'pallet': [100, 80],
      'forklift': [150, 200],
      'worker': [60, 180],
      'box': [50, 50],
      'container': [200, 150],
      'truck': [300, 180]
    };

    const [baseWidth, baseHeight] = baseSizes[objectClass] || [80, 80];
    const variance = 0.2; // 20% size variance
    
    const width = baseWidth * (1 + (Math.random() - 0.5) * variance);
    const height = baseHeight * (1 + (Math.random() - 0.5) * variance);
    
    return [
      Math.floor(Math.random() * (1200 - width)),
      Math.floor(Math.random() * (800 - height)),
      Math.floor(width),
      Math.floor(height)
    ];
  }

  // Get movement pattern for object class
  getMovementPattern(objectClass) {
    const patterns = {
      'forklift': 'linear_with_turns',
      'worker': 'random_walk',
      'pallet': 'sticky_local',
      'box': 'guided_flow',
      'container': 'minimal_movement',
      'truck': 'zone_constrained'
    };
    
    return patterns[objectClass] || 'random_walk';
  }

  // Weighted random selection
  weightedRandomSelect(weights) {
    const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const [item, weight] of weights) {
      if (random < weight) return item;
      random -= weight;
    }
    
    return weights[0][0]; // Fallback
  }

  // Generate detection frame for a specific camera
  generateCameraFrame(collectorId, cameraId, scenario = 'warehouse_operations') {
    const timestamp = Date.now();
    const frameId = `${cameraId}-${timestamp}`;
    const cameraKey = `${collectorId}:${cameraId}`;
    
    // Get existing objects for this camera
    if (!this.objects.has(cameraKey)) {
      this.objects.set(cameraKey, []);
    }
    
    let objects = this.objects.get(cameraKey);
    
    // Remove expired objects
    const expired = objects.filter(obj => timestamp > obj.expires_at);
    objects = objects.filter(obj => timestamp <= obj.expires_at);
    this.stats.objects_destroyed += expired.length;
    
    // Update existing objects (movement)
    objects = objects.map(obj => {
      const updated = this.simulateObjectMovement(obj);
      updated.confidence = 0.7 + Math.random() * 0.3; // Slight confidence variation
      return updated;
    });

    // Generate new objects based on scenario
    const newObjectCount = this.getNewObjectCount(scenario, objects.length, cameraId);
    
    for (let i = 0; i < newObjectCount; i++) {
      const preferredZone = this.getPreferredZoneForCamera(cameraId);
      const newObject = this.createObject(collectorId, cameraId, preferredZone);
      objects.push(newObject);
    }

    // Update objects map
    this.objects.set(cameraKey, objects);

    // Create detection frame
    const frame = {
      collector_id: collectorId,
      camera_id: cameraId,
      timestamp_ms: timestamp,
      frame_id: frameId,
      objects: objects.map(obj => ({
        object_id: obj.object_id,
        class: obj.class,
        confidence: obj.confidence,
        grid_cell_id: obj.grid_cell_id,
        bbox: obj.bbox
      }))
    };

    this.stats.frames_generated++;
    return frame;
  }

  // Determine how many new objects to create
  getNewObjectCount(scenario, currentCount, cameraId) {
    const maxObjects = this.getMaxObjectsForCamera(cameraId);
    
    if (currentCount >= maxObjects) return 0;

    // Scenario-based object generation
    const scenarioRates = {
      'warehouse_operations': 0.3,
      'busy_period': 0.6,
      'quiet_period': 0.1,
      'shift_change': 0.8,
      'emergency_drill': 0.2,
      'demonstration': 0.5
    };

    const baseRate = scenarioRates[scenario] || 0.3;
    const spawnChance = baseRate * (1 - currentCount / maxObjects);
    
    return Math.random() < spawnChance ? Math.floor(Math.random() * 3) + 1 : 0;
  }

  // Get maximum objects for a camera based on its coverage area
  getMaxObjectsForCamera(cameraId) {
    const limits = {
      'cam-main-floor': 15,
      'cam-loading-dock': 8,
      'cam-storage-A': 12,
      'cam-shipping-zone': 6,
      'cam-office-area': 3,
      'cam-maintenance': 4
    };
    
    return limits[cameraId] || 8;
  }

  // Get preferred zone for camera
  getPreferredZoneForCamera(cameraId) {
    const cameraZones = {
      'cam-main-floor': null, // All zones
      'cam-loading-dock': 'loading_dock',
      'cam-storage-A': 'storage_area',
      'cam-shipping-zone': 'shipping_zone',
      'cam-office-area': 'office_area',
      'cam-maintenance': 'maintenance'
    };
    
    return cameraZones[cameraId] || null;
  }

  // Send frame to collector service
  async sendFrame(frame) {
    try {
      const response = await axios.post(`${COLLECTOR_URL}/frames`, frame, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      this.stats.events_sent++;
      this.emit('frame_sent', {
        frame_id: frame.frame_id,
        object_count: frame.objects.length,
        response: response.data
      });
      
      return response.data;
    } catch (error) {
      this.stats.errors++;
      this.emit('error', {
        frame_id: frame.frame_id,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  // Generate batch of frames for all collectors/cameras
  async generateBatch() {
    const frames = [];
    
    for (const collector of this.options.collectors) {
      for (const cameraId of collector.cameras) {
        const frame = this.generateCameraFrame(
          collector.id, 
          cameraId, 
          this.options.scenario
        );
        frames.push(frame);
      }
    }

    // Send frames
    const results = await Promise.allSettled(
      frames.map(frame => this.sendFrame(frame))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Emit batch completion event
    this.emit('batch_complete', {
      timestamp: Date.now(),
      frames_generated: frames.length,
      successful_sends: successful,
      failed_sends: failed,
      total_objects: frames.reduce((sum, frame) => sum + frame.objects.length, 0),
      stats: this.getStats()
    });

    return {
      frames: frames.length,
      objects: frames.reduce((sum, frame) => sum + frame.objects.length, 0),
      successful,
      failed
    };
  }

  // Get current statistics
  getStats() {
    const runtime = Date.now() - this.startTime;
    const activeObjects = Array.from(this.objects.values())
      .reduce((sum, objects) => sum + objects.length, 0);

    return {
      ...this.stats,
      runtime_ms: runtime,
      runtime_formatted: this.formatDuration(runtime),
      active_objects: activeObjects,
      frames_per_second: this.stats.frames_generated / (runtime / 1000),
      objects_per_frame: this.stats.frames_generated > 0 ? 
        this.stats.objects_created / this.stats.frames_generated : 0,
      success_rate: this.stats.events_sent > 0 ? 
        ((this.stats.events_sent - this.stats.errors) / this.stats.events_sent * 100).toFixed(2) + '%' : '100%'
    };
  }

  // Format duration for display
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  // Start continuous generation
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Generator already running');
      return;
    }

    console.log('🚀 Starting Camera Data Generator...');
    console.log(`📊 Configuration:`);
    console.log(`   • Collectors: ${this.options.collectors.length}`);
    console.log(`   • Cameras: ${this.options.collectors.reduce((sum, c) => sum + c.cameras.length, 0)}`);
    console.log(`   • Scenario: ${this.options.scenario}`);
    console.log(`   • Duration: ${this.formatDuration(this.options.duration * 1000)}`);
    console.log(`   • Interval: ${this.formatDuration(this.options.interval)}`);
    console.log(`   • Target URL: ${COLLECTOR_URL}`);
    console.log('');

    this.isRunning = true;
    this.startTime = Date.now();
    const endTime = this.startTime + (this.options.duration * 1000);

    // Event listeners for logging
    this.on('batch_complete', (data) => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const remaining = Math.max(0, (endTime - Date.now()) / 1000);
      
      console.log(`📊 Batch ${this.frameCount + 1}: ${data.total_objects} objects, ${data.successful_sends}/${data.frames_generated} sent successfully`);
      console.log(`⏱️  Runtime: ${elapsed.toFixed(1)}s | Remaining: ${remaining.toFixed(1)}s | Active objects: ${data.stats.active_objects}`);
      
      this.frameCount++;
    });

    this.on('error', (errorData) => {
      console.log(`❌ Error sending frame ${errorData.frame_id}: ${errorData.error}`);
    });

    // Main generation loop
    while (this.isRunning && Date.now() < endTime) {
      try {
        await this.generateBatch();
        
        if (Date.now() < endTime) {
          await new Promise(resolve => setTimeout(resolve, this.options.interval));
        }
        
      } catch (error) {
        console.error('Generation error:', error.message);
        await new Promise(resolve => setTimeout(resolve, this.options.interval * 2));
      }
    }

    this.isRunning = false;
    const finalStats = this.getStats();
    
    console.log('\n🏁 Generation Complete!');
    console.log('=====================');
    console.log(`📊 Final Statistics:`);
    console.log(`   • Total runtime: ${finalStats.runtime_formatted}`);
    console.log(`   • Frames generated: ${finalStats.frames_generated}`);
    console.log(`   • Objects created: ${finalStats.objects_created}`);
    console.log(`   • Objects destroyed: ${finalStats.objects_destroyed}`);
    console.log(`   • Events sent: ${finalStats.events_sent}`);
    console.log(`   • Success rate: ${finalStats.success_rate}`);
    console.log(`   • Avg objects per frame: ${finalStats.objects_per_frame.toFixed(2)}`);
    console.log(`   • Generation rate: ${finalStats.frames_per_second.toFixed(2)} fps`);
    
    this.emit('generation_complete', finalStats);
  }

  // Stop generation
  stop() {
    console.log('🛑 Stopping camera data generation...');
    this.isRunning = false;
  }

  // Generate demo scenarios
  static createDemoScenario(scenarioName) {
    const scenarios = {
      'quick_demo': {
        duration: 60, // 1 minute
        interval: 1000, // 1 second
        scenario: 'demonstration',
        collectors: [
          { id: 'demo-collector', cameras: ['demo-cam-01', 'demo-cam-02'] }
        ]
      },
      
      'warehouse_busy': {
        duration: 180, // 3 minutes
        interval: 1500, // 1.5 seconds
        scenario: 'busy_period',
        collectors: COLLECTORS
      },
      
      'visualization_test': {
        duration: 300, // 5 minutes
        interval: 2000, // 2 seconds
        scenario: 'demonstration',
        visualization_mode: true,
        collectors: [
          { id: 'viz-collector', cameras: ['viz-main-camera'] }
        ]
      },

      'performance_test': {
        duration: 600, // 10 minutes
        interval: 500, // 0.5 seconds
        scenario: 'warehouse_operations',
        collectors: COLLECTORS.concat([
          { id: 'collector-warehouse-03', cameras: ['cam-extra-01', 'cam-extra-02'] }
        ])
      }
    };

    return scenarios[scenarioName] || scenarios['warehouse_busy'];
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const scenarioName = args[0] || 'warehouse_busy';
  
  console.log('🎬 Vision Logistics - Camera Data Generator');
  console.log('==========================================\n');

  // Check if collector service is available
  try {
    const response = await axios.get(`${COLLECTOR_URL}/health`, { timeout: 5000 });
    console.log('✅ Collector service is healthy:', response.data);
  } catch (error) {
    console.error('❌ Collector service not available:', error.message);
    console.log('💡 Make sure to start the system first:');
    console.log('   npm run fix-and-start');
    process.exit(1);
  }

  // Create and start generator
  const config = CameraDataGenerator.createDemoScenario(scenarioName);
  const generator = new CameraDataGenerator(config);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Received SIGINT, stopping generation...');
    generator.stop();
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, stopping generation...');
    generator.stop();
  });

  await generator.start();
}

// Export for use as module
export { CameraDataGenerator, OBJECT_CLASSES, GRID_ZONES, COLLECTORS };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}