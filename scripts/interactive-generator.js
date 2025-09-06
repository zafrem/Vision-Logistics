#!/usr/bin/env node

import { createInterface } from 'readline';
import { CameraDataGenerator } from './camera-data-generator.js';
import { VisualizationScenarios, RealTimeGenerator } from './visualization-scenarios.js';
import axios from 'axios';

const COLLECTOR_URL = process.env.COLLECTOR_URL || 'http://localhost:3001';

class InteractiveGenerator {
  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.generator = null;
    this.isRunning = false;
    this.currentScenario = 'warehouse_operations';
    this.currentSettings = {
      interval: 2000,
      duration: 300,
      intensity: 'medium'
    };
  }

  // Display main menu
  showMainMenu() {
    console.clear();
    console.log('🎮 Vision Logistics - Interactive Data Generator');
    console.log('===============================================\n');
    
    console.log('📊 Current Settings:');
    console.log(`   • Scenario: ${this.currentScenario}`);
    console.log(`   • Interval: ${this.currentSettings.interval}ms`);
    console.log(`   • Duration: ${this.currentSettings.duration}s`);
    console.log(`   • Intensity: ${this.currentSettings.intensity}`);
    console.log(`   • Status: ${this.isRunning ? '🟢 Running' : '🔴 Stopped'}\n`);
    
    console.log('🎯 Available Actions:');
    console.log('   1. Start Generation');
    console.log('   2. Stop Generation');
    console.log('   3. Change Scenario');
    console.log('   4. Adjust Settings');
    console.log('   5. Visualization Patterns');
    console.log('   6. Quick Demo');
    console.log('   7. System Status');
    console.log('   8. Help');
    console.log('   9. Exit\n');
    
    this.promptAction();
  }

  // Prompt for user action
  promptAction() {
    this.rl.question('Choose an action (1-9): ', (answer) => {
      this.handleAction(answer.trim());
    });
  }

  // Handle user actions
  async handleAction(action) {
    switch (action) {
      case '1':
        await this.startGeneration();
        break;
      case '2':
        await this.stopGeneration();
        break;
      case '3':
        await this.changeScenario();
        break;
      case '4':
        await this.adjustSettings();
        break;
      case '5':
        await this.visualizationPatterns();
        break;
      case '6':
        await this.quickDemo();
        break;
      case '7':
        await this.systemStatus();
        break;
      case '8':
        this.showHelp();
        break;
      case '9':
        await this.exit();
        break;
      default:
        console.log('❌ Invalid choice. Please enter 1-9.');
        setTimeout(() => this.showMainMenu(), 1500);
    }
  }

  // Start data generation
  async startGeneration() {
    if (this.isRunning) {
      console.log('⚠️  Generation is already running!');
      setTimeout(() => this.showMainMenu(), 1500);
      return;
    }

    console.log('🚀 Starting data generation...');
    
    try {
      // Create generator based on current settings
      const config = this.buildGeneratorConfig();
      this.generator = new CameraDataGenerator(config);
      
      // Set up event listeners
      this.setupGeneratorEvents();
      
      // Start generation in background
      this.isRunning = true;
      this.generator.start().then(() => {
        this.isRunning = false;
        console.log('\n🏁 Generation completed!');
      }).catch((error) => {
        this.isRunning = false;
        console.log('\n❌ Generation failed:', error.message);
      });
      
      console.log('✅ Generation started successfully!');
      console.log('📊 Real-time stats will appear below...\n');
      
      // Show real-time controls
      this.showRealTimeControls();
      
    } catch (error) {
      console.log('❌ Failed to start generation:', error.message);
      setTimeout(() => this.showMainMenu(), 2000);
    }
  }

  // Stop data generation
  async stopGeneration() {
    if (!this.isRunning) {
      console.log('⚠️  No generation is currently running!');
      setTimeout(() => this.showMainMenu(), 1500);
      return;
    }

    console.log('🛑 Stopping data generation...');
    
    if (this.generator) {
      this.generator.stop();
    }
    
    this.isRunning = false;
    console.log('✅ Generation stopped successfully!');
    setTimeout(() => this.showMainMenu(), 1500);
  }

  // Change scenario
  async changeScenario() {
    console.log('\n📋 Available Scenarios:');
    const scenarios = [
      { key: 'warehouse_operations', name: 'Warehouse Operations', desc: 'Standard warehouse activity' },
      { key: 'busy_period', name: 'Busy Period', desc: 'High activity simulation' },
      { key: 'quiet_period', name: 'Quiet Period', desc: 'Low activity simulation' },
      { key: 'shift_change', name: 'Shift Change', desc: 'Peak worker movement' },
      { key: 'emergency_drill', name: 'Emergency Drill', desc: 'Evacuation simulation' },
      { key: 'demonstration', name: 'Demonstration', desc: 'Balanced demo mode' }
    ];
    
    scenarios.forEach((scenario, index) => {
      const marker = scenario.key === this.currentScenario ? '👉' : '  ';
      console.log(`${marker} ${index + 1}. ${scenario.name} - ${scenario.desc}`);
    });
    
    console.log('\n');
    
    this.rl.question('Choose scenario (1-6) or press Enter to cancel: ', (answer) => {
      if (answer.trim() === '') {
        this.showMainMenu();
        return;
      }
      
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < scenarios.length) {
        this.currentScenario = scenarios[index].key;
        console.log(`✅ Scenario changed to: ${scenarios[index].name}`);
      } else {
        console.log('❌ Invalid choice!');
      }
      
      setTimeout(() => this.showMainMenu(), 1500);
    });
  }

  // Adjust settings
  async adjustSettings() {
    console.log('\n⚙️  Current Settings:');
    console.log(`   1. Interval: ${this.currentSettings.interval}ms`);
    console.log(`   2. Duration: ${this.currentSettings.duration}s`);
    console.log(`   3. Intensity: ${this.currentSettings.intensity}`);
    console.log('   4. Back to main menu\n');
    
    this.rl.question('What would you like to adjust (1-4)? ', (answer) => {
      switch (answer.trim()) {
        case '1':
          this.adjustInterval();
          break;
        case '2':
          this.adjustDuration();
          break;
        case '3':
          this.adjustIntensity();
          break;
        case '4':
        default:
          this.showMainMenu();
      }
    });
  }

  // Adjust interval
  adjustInterval() {
    console.log('\n⏱️  Generation Interval:');
    console.log('   1. Very Fast (500ms)');
    console.log('   2. Fast (1000ms)');
    console.log('   3. Medium (2000ms) - Default');
    console.log('   4. Slow (3000ms)');
    console.log('   5. Very Slow (5000ms)');
    console.log('   6. Custom');
    
    this.rl.question('Choose interval (1-6): ', (answer) => {
      const intervals = [500, 1000, 2000, 3000, 5000];
      const index = parseInt(answer) - 1;
      
      if (index >= 0 && index < 5) {
        this.currentSettings.interval = intervals[index];
        console.log(`✅ Interval set to ${this.currentSettings.interval}ms`);
        setTimeout(() => this.adjustSettings(), 1000);
      } else if (answer === '6') {
        this.rl.question('Enter custom interval in milliseconds (100-10000): ', (custom) => {
          const customInterval = parseInt(custom);
          if (customInterval >= 100 && customInterval <= 10000) {
            this.currentSettings.interval = customInterval;
            console.log(`✅ Interval set to ${customInterval}ms`);
          } else {
            console.log('❌ Invalid interval! Must be between 100-10000ms');
          }
          setTimeout(() => this.adjustSettings(), 1000);
        });
      } else {
        console.log('❌ Invalid choice!');
        setTimeout(() => this.adjustSettings(), 1000);
      }
    });
  }

  // Adjust duration
  adjustDuration() {
    console.log('\n⏰ Generation Duration:');
    console.log('   1. Quick Test (30s)');
    console.log('   2. Short Demo (60s)');
    console.log('   3. Medium Demo (5min) - Default');
    console.log('   4. Long Demo (10min)');
    console.log('   5. Extended (30min)');
    console.log('   6. Custom');
    
    this.rl.question('Choose duration (1-6): ', (answer) => {
      const durations = [30, 60, 300, 600, 1800];
      const index = parseInt(answer) - 1;
      
      if (index >= 0 && index < 5) {
        this.currentSettings.duration = durations[index];
        console.log(`✅ Duration set to ${this.currentSettings.duration}s`);
        setTimeout(() => this.adjustSettings(), 1000);
      } else if (answer === '6') {
        this.rl.question('Enter custom duration in seconds (10-7200): ', (custom) => {
          const customDuration = parseInt(custom);
          if (customDuration >= 10 && customDuration <= 7200) {
            this.currentSettings.duration = customDuration;
            console.log(`✅ Duration set to ${customDuration}s`);
          } else {
            console.log('❌ Invalid duration! Must be between 10-7200s');
          }
          setTimeout(() => this.adjustSettings(), 1000);
        });
      } else {
        console.log('❌ Invalid choice!');
        setTimeout(() => this.adjustSettings(), 1000);
      }
    });
  }

  // Adjust intensity
  adjustIntensity() {
    console.log('\n🔥 Activity Intensity:');
    console.log('   1. Low - Minimal objects');
    console.log('   2. Medium - Balanced activity');  
    console.log('   3. High - Busy warehouse');
    console.log('   4. Maximum - Stress test');
    
    this.rl.question('Choose intensity (1-4): ', (answer) => {
      const intensities = ['low', 'medium', 'high', 'maximum'];
      const index = parseInt(answer) - 1;
      
      if (index >= 0 && index < 4) {
        this.currentSettings.intensity = intensities[index];
        console.log(`✅ Intensity set to ${this.currentSettings.intensity}`);
      } else {
        console.log('❌ Invalid choice!');
      }
      
      setTimeout(() => this.adjustSettings(), 1000);
    });
  }

  // Visualization patterns menu
  async visualizationPatterns() {
    console.log('\n🎨 Visualization Patterns:');
    console.log('   1. Heatwave - Moving concentration');
    console.log('   2. Concentric - Expanding circles');
    console.log('   3. Snake - Spiral movement');
    console.log('   4. Zone Activity - Area-based patterns');
    console.log('   5. Traffic Flow - Directional movement');
    console.log('   6. Clusters - Appearing/disappearing groups');
    console.log('   7. Back to main menu\n');
    
    this.rl.question('Choose pattern (1-7): ', async (answer) => {
      const patterns = ['heatwave', 'concentric', 'snake', 'zones', 'traffic', 'clusters'];
      const index = parseInt(answer) - 1;
      
      if (index >= 0 && index < 6) {
        await this.runVisualizationPattern(patterns[index]);
      } else {
        this.showMainMenu();
      }
    });
  }

  // Run visualization pattern
  async runVisualizationPattern(patternName) {
    console.log(`🎨 Starting ${patternName} visualization pattern...`);
    
    try {
      const { VisualizationScenarios, RealTimeGenerator } = await import('./visualization-scenarios.js');
      
      const scenarios = {
        'heatwave': VisualizationScenarios.createHeatwavePattern(),
        'concentric': VisualizationScenarios.createConcentricPattern(),
        'snake': VisualizationScenarios.createSnakePattern(),
        'zones': VisualizationScenarios.createZoneActivityPattern(),
        'traffic': VisualizationScenarios.createTrafficFlowPattern(),
        'clusters': VisualizationScenarios.createClusterPattern()
      };

      const pattern = scenarios[patternName];
      if (!pattern) {
        console.log('❌ Pattern not found!');
        setTimeout(() => this.showMainMenu(), 1500);
        return;
      }

      console.log(`⏱️  Duration: ${pattern.duration}s | Press Ctrl+C to stop early`);
      
      const generator = new RealTimeGenerator({
        collectors: pattern.collectors,
        duration: pattern.duration,
        interval: pattern.interval,
        scenario: pattern.scenario
      });

      generator.setCustomPattern(pattern);
      
      // Show progress
      generator.on('batch_complete', (data) => {
        const progress = ((Date.now() - generator.startTime) / (pattern.duration * 1000) * 100).toFixed(1);
        process.stdout.write(`\r📊 Progress: ${progress}% | Objects: ${data.total_objects}`);
      });

      await generator.start();
      console.log('\n✅ Visualization pattern completed!');
      
    } catch (error) {
      console.log('❌ Failed to run visualization pattern:', error.message);
    }
    
    setTimeout(() => this.showMainMenu(), 2000);
  }

  // Quick demo
  async quickDemo() {
    console.log('🚀 Starting Quick Demo...');
    console.log('   • 60 seconds of balanced warehouse activity');
    console.log('   • Multiple object types and realistic movement');
    console.log('   • Perfect for testing the UI\n');
    
    const originalSettings = { ...this.currentSettings };
    this.currentSettings = { interval: 1000, duration: 60, intensity: 'medium' };
    this.currentScenario = 'demonstration';
    
    await this.startGeneration();
    
    // Restore original settings after demo
    setTimeout(() => {
      this.currentSettings = originalSettings;
    }, 61000);
  }

  // System status
  async systemStatus() {
    console.log('\n🔍 System Status Check...\n');
    
    try {
      // Check collector service
      console.log('📡 Collector Service:');
      const collectorResponse = await axios.get(`${COLLECTOR_URL}/health`, { timeout: 5000 });
      console.log(`   ✅ Status: ${collectorResponse.data.status}`);
      console.log(`   📍 URL: ${COLLECTOR_URL}`);
      
      // Check manager service
      console.log('\n🧮 Manager Service:');
      try {
        const managerResponse = await axios.get('http://localhost:3002/health', { timeout: 5000 });
        console.log(`   ✅ Status: ${managerResponse.data.status}`);
        console.log(`   📍 URL: http://localhost:3002`);
        
        // Get detailed status
        const statusResponse = await axios.get('http://localhost:3002/status', { timeout: 5000 });
        console.log(`   ⏱️  Uptime: ${Math.floor(statusResponse.data.uptime)}s`);
        console.log(`   🌊 Kafka Consumer: ${statusResponse.data.kafka_consumer?.isRunning ? 'Running' : 'Stopped'}`);
        console.log(`   🗄️  Redis: ${statusResponse.data.redis_connected ? 'Connected' : 'Disconnected'}`);
      } catch (error) {
        console.log('   ❌ Manager service not responding');
      }
      
      // Check UI service
      console.log('\n🌐 UI Dashboard:');
      try {
        const uiResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
        console.log('   ✅ Status: Accessible');
        console.log('   📍 URL: http://localhost:3000');
      } catch (error) {
        console.log('   ❌ UI not accessible');
      }
      
    } catch (error) {
      console.log('❌ System check failed:', error.message);
    }
    
    console.log('\n💡 Tip: If services are down, run "npm run fix-and-start"');
    
    this.rl.question('\nPress Enter to continue...', () => {
      this.showMainMenu();
    });
  }

  // Show help
  showHelp() {
    console.clear();
    console.log('❓ Vision Logistics - Interactive Generator Help');
    console.log('==============================================\n');
    
    console.log('🎯 Purpose:');
    console.log('   Generate realistic camera detection data to visualize in the UI\n');
    
    console.log('🎮 Controls:');
    console.log('   • Use number keys to navigate menus');
    console.log('   • Press Ctrl+C to stop running generation');
    console.log('   • All settings are saved during session\n');
    
    console.log('📊 Scenarios:');
    console.log('   • Warehouse Operations: Balanced, realistic activity');
    console.log('   • Busy Period: High object density and movement');
    console.log('   • Quiet Period: Minimal activity for testing');
    console.log('   • Demonstration: Optimized for showcasing features\n');
    
    console.log('🎨 Visualization Patterns:');
    console.log('   • Special patterns designed to create interesting heatmaps');
    console.log('   • Perfect for demonstrating system capabilities');
    console.log('   • Each pattern runs for a predefined duration\n');
    
    console.log('⚙️  Settings:');
    console.log('   • Interval: Time between data batches (faster = more data)');
    console.log('   • Duration: How long generation runs');
    console.log('   • Intensity: Object density (low to maximum)\n');
    
    console.log('🌐 Viewing Results:');
    console.log('   • Open http://localhost:3000 to see live data');
    console.log('   • Heatmap updates in real-time');
    console.log('   • Statistics table shows dwell time analytics\n');
    
    this.rl.question('Press Enter to return to main menu...', () => {
      this.showMainMenu();
    });
  }

  // Build generator configuration
  buildGeneratorConfig() {
    const intensityMultipliers = {
      'low': 0.3,
      'medium': 1.0,
      'high': 1.8,
      'maximum': 3.0
    };
    
    return {
      duration: this.currentSettings.duration,
      interval: this.currentSettings.interval,
      scenario: this.currentScenario,
      intensity: intensityMultipliers[this.currentSettings.intensity] || 1.0
    };
  }

  // Set up generator event listeners
  setupGeneratorEvents() {
    this.generator.on('batch_complete', (data) => {
      const progress = ((Date.now() - this.generator.startTime) / (this.currentSettings.duration * 1000) * 100).toFixed(1);
      console.log(`📊 Progress: ${progress}% | Objects: ${data.total_objects} | Success: ${data.successful_sends}/${data.frames_generated}`);
    });

    this.generator.on('error', (errorData) => {
      console.log(`❌ Error: ${errorData.error}`);
    });

    this.generator.on('generation_complete', (stats) => {
      console.log(`\n🏁 Generation Complete!`);
      console.log(`   • Total objects: ${stats.objects_created}`);
      console.log(`   • Success rate: ${stats.success_rate}`);
      console.log(`   • Runtime: ${stats.runtime_formatted}`);
      setTimeout(() => this.showMainMenu(), 3000);
    });
  }

  // Show real-time controls
  showRealTimeControls() {
    console.log('🎮 Real-time Controls:');
    console.log('   • Press Ctrl+C to stop generation');
    console.log('   • Check http://localhost:3000 for live visualization\n');
    
    // Set up Ctrl+C handler
    process.on('SIGINT', () => {
      if (this.isRunning && this.generator) {
        console.log('\n🛑 Stopping generation...');
        this.generator.stop();
        this.isRunning = false;
        setTimeout(() => this.showMainMenu(), 1000);
      } else {
        process.exit(0);
      }
    });
  }

  // Exit the program
  async exit() {
    console.log('👋 Stopping any running generation...');
    
    if (this.isRunning && this.generator) {
      this.generator.stop();
    }
    
    console.log('✅ Thank you for using Vision Logistics Generator!');
    console.log('🌐 Don\'t forget to check http://localhost:3000 for your data!');
    
    this.rl.close();
    process.exit(0);
  }

  // Start the interactive session
  async start() {
    console.log('🔍 Checking system status...');
    
    try {
      await axios.get(`${COLLECTOR_URL}/health`, { timeout: 5000 });
      console.log('✅ System is ready!\n');
    } catch (error) {
      console.log('❌ System not ready:', error.message);
      console.log('💡 Please start the system first: npm run fix-and-start\n');
      process.exit(1);
    }
    
    this.showMainMenu();
  }
}

// Run the interactive generator
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new InteractiveGenerator();
  generator.start().catch(console.error);
}

export { InteractiveGenerator };