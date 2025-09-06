#!/usr/bin/env node

import { CameraDataGenerator, OBJECT_CLASSES, GRID_ZONES } from './camera-data-generator.js';
import axios from 'axios';

const COLLECTOR_URL = process.env.COLLECTOR_URL || 'http://localhost:3001';

// Visualization-specific scenarios designed to create interesting patterns
class VisualizationScenarios {
  
  // Create a "heatwave" pattern that moves across the grid
  static createHeatwavePattern() {
    return {
      name: 'heatwave',
      duration: 120, // 2 minutes
      interval: 1000, // 1 second
      scenario: 'demonstration',
      collectors: [{ id: 'collector-01', cameras: ['heatwave-cam'] }],
      
      // Custom object generation logic
      generateCustomObjects: (generator, collectorId, cameraId, frameNumber) => {
        const objects = [];
        const waveX = Math.floor((frameNumber * 0.3) % 20); // Wave moves across X axis
        
        // Create a concentration of objects that follows the wave
        for (let i = 0; i < 8; i++) {
          const x = Math.max(0, Math.min(19, waveX + Math.floor(Math.random() * 4) - 2));
          const y = Math.floor(Math.random() * 15);
          
          objects.push({
            object_id: `heatwave-${frameNumber}-${i}`,
            class: 'worker',
            confidence: 0.8 + Math.random() * 0.2,
            grid_cell_id: `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`,
            bbox: [x * 60, y * 53, 40, 40]
          });
        }
        
        return objects;
      }
    };
  }

  // Create concentric circles pattern
  static createConcentricPattern() {
    return {
      name: 'concentric',
      duration: 180, // 3 minutes
      interval: 1500, // 1.5 seconds
      scenario: 'demonstration',
      collectors: [{ id: 'viz-collector', cameras: ['concentric-cam'] }],
      
      generateCustomObjects: (generator, collectorId, cameraId, frameNumber) => {
        const objects = [];
        const centerX = 10;
        const centerY = 7;
        const radius = (frameNumber * 0.2) % 8; // Expanding radius
        
        // Create objects in concentric pattern
        for (let angle = 0; angle < 360; angle += 45) {
          const radian = (angle * Math.PI) / 180;
          const x = Math.round(centerX + radius * Math.cos(radian));
          const y = Math.round(centerY + radius * Math.sin(radian));
          
          if (x >= 0 && x < 20 && y >= 0 && y < 15) {
            objects.push({
              object_id: `circle-${frameNumber}-${angle}`,
              class: 'box',
              confidence: 0.9,
              grid_cell_id: `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`,
              bbox: [x * 60, y * 53, 30, 30]
            });
          }
        }
        
        return objects;
      }
    };
  }

  // Create a "snake" pattern that moves around the grid
  static createSnakePattern() {
    return {
      name: 'snake',
      duration: 150, // 2.5 minutes
      interval: 800, // 0.8 seconds
      scenario: 'demonstration',
      collectors: [{ id: 'viz-collector', cameras: ['snake-cam'] }],
      
      generateCustomObjects: (generator, collectorId, cameraId, frameNumber) => {
        const objects = [];
        const snakeLength = 10;
        
        // Create snake path (spiral)
        for (let i = 0; i < snakeLength; i++) {
          const progress = (frameNumber + i) * 0.1;
          const spiralRadius = progress * 0.3;
          const angle = progress;
          
          const x = Math.round(10 + spiralRadius * Math.cos(angle)) % 20;
          const y = Math.round(7 + spiralRadius * Math.sin(angle)) % 15;
          
          objects.push({
            object_id: `snake-segment-${i}`,
            class: 'forklift',
            confidence: 0.9 - (i * 0.05), // Fade confidence along snake
            grid_cell_id: `G_${Math.abs(x).toString().padStart(2, '0')}_${Math.abs(y).toString().padStart(2, '0')}`,
            bbox: [Math.abs(x) * 60, Math.abs(y) * 53, 50, 50]
          });
        }
        
        return objects;
      }
    };
  }

  // Create zone-based activity simulation
  static createZoneActivityPattern() {
    return {
      name: 'zone_activity',
      duration: 300, // 5 minutes
      interval: 2000, // 2 seconds
      scenario: 'warehouse_operations',
      collectors: [
        { id: 'zone-collector-01', cameras: ['loading-dock-cam', 'storage-cam'] },
        { id: 'zone-collector-02', cameras: ['shipping-cam', 'office-cam'] }
      ],
      
      generateCustomObjects: (generator, collectorId, cameraId, frameNumber) => {
        const objects = [];
        const timeOfDay = (frameNumber % 60) / 60; // Simulate hour cycle
        
        // Different zones have different activity patterns throughout the "day"
        let targetZone, objectClass, intensity;
        
        if (cameraId.includes('loading-dock')) {
          // High activity in morning and evening
          intensity = Math.sin(timeOfDay * Math.PI * 2) * 0.5 + 0.5;
          targetZone = 'loading_dock';
          objectClass = 'forklift';
        } else if (cameraId.includes('storage')) {
          // Steady activity throughout day
          intensity = 0.6 + Math.sin(timeOfDay * Math.PI * 4) * 0.2;
          targetZone = 'storage_area';
          objectClass = 'pallet';
        } else if (cameraId.includes('shipping')) {
          // Activity peaks in afternoon
          intensity = timeOfDay > 0.4 && timeOfDay < 0.8 ? 0.8 : 0.3;
          targetZone = 'shipping_zone';
          objectClass = 'truck';
        } else {
          // Office - low, steady activity
          intensity = 0.2;
          targetZone = 'office_area';
          objectClass = 'worker';
        }
        
        const objectCount = Math.floor(intensity * 12);
        const zone = GRID_ZONES[targetZone];
        
        for (let i = 0; i < objectCount; i++) {
          const x = Math.floor(Math.random() * (zone.x[1] - zone.x[0] + 1)) + zone.x[0];
          const y = Math.floor(Math.random() * (zone.y[1] - zone.y[0] + 1)) + zone.y[0];
          
          objects.push({
            object_id: `${targetZone}-${frameNumber}-${i}`,
            class: objectClass,
            confidence: 0.7 + Math.random() * 0.3,
            grid_cell_id: `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`,
            bbox: [x * 60 + Math.random() * 20, y * 53 + Math.random() * 20, 40, 40]
          });
        }
        
        return objects;
      }
    };
  }

  // Create traffic flow simulation
  static createTrafficFlowPattern() {
    return {
      name: 'traffic_flow',
      duration: 240, // 4 minutes
      interval: 1000, // 1 second
      scenario: 'demonstration',
      collectors: [{ id: 'traffic-collector', cameras: ['traffic-cam'] }],
      
      generateCustomObjects: (generator, collectorId, cameraId, frameNumber) => {
        const objects = [];
        
        // Create multiple traffic flows
        const flows = [
          { start: [0, 0], end: [19, 0], class: 'forklift', speed: 1 },  // Horizontal top
          { start: [0, 14], end: [19, 14], class: 'worker', speed: 0.8 }, // Horizontal bottom  
          { start: [0, 0], end: [0, 14], class: 'pallet', speed: 0.3 },  // Vertical left
          { start: [19, 0], end: [19, 14], class: 'box', speed: 0.5 }    // Vertical right
        ];
        
        flows.forEach((flow, flowIndex) => {
          const progress = (frameNumber * flow.speed * 0.1) % 1;
          const x = Math.round(flow.start[0] + (flow.end[0] - flow.start[0]) * progress);
          const y = Math.round(flow.start[1] + (flow.end[1] - flow.start[1]) * progress);
          
          // Add some vehicles/objects in this flow
          for (let i = 0; i < 3; i++) {
            const offsetProgress = (progress + i * 0.3) % 1;
            const objX = Math.round(flow.start[0] + (flow.end[0] - flow.start[0]) * offsetProgress);
            const objY = Math.round(flow.start[1] + (flow.end[1] - flow.start[1]) * offsetProgress);
            
            objects.push({
              object_id: `flow-${flowIndex}-${i}`,
              class: flow.class,
              confidence: 0.8,
              grid_cell_id: `G_${objX.toString().padStart(2, '0')}_${objY.toString().padStart(2, '0')}`,
              bbox: [objX * 60, objY * 53, 35, 35]
            });
          }
        });
        
        return objects;
      }
    };
  }

  // Create random clusters that appear and disappear
  static createClusterPattern() {
    return {
      name: 'clusters',
      duration: 200, // ~3.3 minutes
      interval: 1200, // 1.2 seconds
      scenario: 'demonstration',
      collectors: [{ id: 'cluster-collector', cameras: ['cluster-cam'] }],
      
      generateCustomObjects: (generator, collectorId, cameraId, frameNumber) => {
        const objects = [];
        const clusterLifetime = 20; // frames
        const maxClusters = 4;
        
        for (let cluster = 0; cluster < maxClusters; cluster++) {
          const clusterAge = (frameNumber + cluster * 5) % clusterLifetime;
          
          // Only show cluster if it's "alive"
          if (clusterAge < clusterLifetime * 0.8) {
            const centerX = Math.floor(Math.random() * 16) + 2;
            const centerY = Math.floor(Math.random() * 11) + 2;
            const clusterSize = Math.floor(4 + Math.random() * 6);
            
            // Create cluster intensity (fade in/out)
            const intensity = Math.sin((clusterAge / clusterLifetime) * Math.PI);
            
            for (let i = 0; i < clusterSize; i++) {
              const angle = (i / clusterSize) * 2 * Math.PI;
              const radius = 1 + Math.random() * 2;
              
              const x = Math.round(centerX + radius * Math.cos(angle));
              const y = Math.round(centerY + radius * Math.sin(angle));
              
              if (x >= 0 && x < 20 && y >= 0 && y < 15) {
                objects.push({
                  object_id: `cluster-${cluster}-${i}`,
                  class: ['worker', 'box', 'pallet'][cluster % 3],
                  confidence: 0.5 + intensity * 0.4,
                  grid_cell_id: `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`,
                  bbox: [x * 60, y * 53, 30, 30]
                });
              }
            }
          }
        }
        
        return objects;
      }
    };
  }
}

// Real-time streaming generator
class RealTimeGenerator extends CameraDataGenerator {
  constructor(options = {}) {
    super(options);
    this.frameNumber = 0;
    this.customPattern = null;
  }

  setCustomPattern(pattern) {
    this.customPattern = pattern;
  }

  // Override frame generation to use custom patterns
  generateCameraFrame(collectorId, cameraId, scenario = 'warehouse_operations') {
    const timestamp = Date.now();
    const frameId = `${cameraId}-${timestamp}`;
    
    let objects = [];
    
    if (this.customPattern && this.customPattern.generateCustomObjects) {
      objects = this.customPattern.generateCustomObjects(
        this, collectorId, cameraId, this.frameNumber
      );
    } else {
      // Fall back to standard generation
      return super.generateCameraFrame(collectorId, cameraId, scenario);
    }

    this.frameNumber++;
    this.stats.frames_generated++;

    return {
      collector_id: collectorId,
      camera_id: cameraId,
      timestamp_ms: timestamp,
      frame_id: frameId,
      objects
    };
  }
}

// Main execution function
async function runVisualizationScenario(scenarioName = 'heatwave') {
  console.log('🎨 Vision Logistics - Visualization Generator');
  console.log('============================================\n');

  // Check collector service
  try {
    const response = await axios.get(`${COLLECTOR_URL}/health`, { timeout: 5000 });
    console.log('✅ Collector service is ready:', response.data);
  } catch (error) {
    console.error('❌ Collector service not available:', error.message);
    console.log('💡 Start the system first: npm run fix-and-start');
    process.exit(1);
  }

  // Get scenario configuration
  const scenarios = {
    'heatwave': VisualizationScenarios.createHeatwavePattern(),
    'concentric': VisualizationScenarios.createConcentricPattern(),
    'snake': VisualizationScenarios.createSnakePattern(),
    'zones': VisualizationScenarios.createZoneActivityPattern(),
    'traffic': VisualizationScenarios.createTrafficFlowPattern(),
    'clusters': VisualizationScenarios.createClusterPattern()
  };

  const pattern = scenarios[scenarioName];
  if (!pattern) {
    console.error(`❌ Unknown scenario: ${scenarioName}`);
    console.log('Available scenarios:', Object.keys(scenarios).join(', '));
    process.exit(1);
  }

  console.log(`🎬 Starting "${pattern.name}" visualization pattern`);
  console.log(`⏱️  Duration: ${pattern.duration}s | Interval: ${pattern.interval}ms`);
  console.log(`📹 Cameras: ${pattern.collectors.flatMap(c => c.cameras).join(', ')}`);
  console.log('');

  // Create real-time generator
  const generator = new RealTimeGenerator({
    collectors: pattern.collectors,
    duration: pattern.duration,
    interval: pattern.interval,
    scenario: pattern.scenario
  });

  // Set custom pattern
  generator.setCustomPattern(pattern);

  // Add progress tracking
  generator.on('batch_complete', (data) => {
    const progress = ((Date.now() - generator.startTime) / (pattern.duration * 1000) * 100).toFixed(1);
    console.log(`📊 Progress: ${progress}% | Objects: ${data.total_objects} | Success: ${data.successful_sends}/${data.frames_generated}`);
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping visualization generation...');
    generator.stop();
  });

  // Start generation
  await generator.start();

  console.log('\n🎨 Visualization complete! Check the UI at http://localhost:3000');
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const scenarioName = process.argv[2] || 'heatwave';
  runVisualizationScenario(scenarioName).catch(console.error);
}

export { VisualizationScenarios, RealTimeGenerator };