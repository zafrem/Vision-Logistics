#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import { createServer } from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const services = new Map();
const USE_FALLBACK = process.argv.includes('--fallback') || process.argv.includes('--no-docker');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'green') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function error(message) { log(`❌ ${message}`, 'red'); }
function warn(message) { log(`⚠️  ${message}`, 'yellow'); }
function info(message) { log(`ℹ️  ${message}`, 'blue'); }

// Check if port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    server.on('error', () => resolve(true));
  });
}

// Wait for port to be available
async function waitForPort(port, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await checkPort(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Execute command and return promise
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: projectRoot, ...options }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Check if Docker is available
async function checkDocker() {
  try {
    await execPromise('docker --version');
    await execPromise('docker compose version');
    return true;
  } catch {
    try {
      await execPromise('docker-compose --version');
      return true;
    } catch {
      return false;
    }
  }
}

// Start Docker services
async function startDockerServices() {
  log('🐳 Starting Docker services...');
  
  try {
    const dockerDir = path.join(projectRoot, 'docker');
    
    try {
      await execPromise('docker compose up -d', { cwd: dockerDir });
    } catch {
      await execPromise('docker-compose up -d', { cwd: dockerDir });
    }
    
    log('Docker services started');
    
    // Wait for services
    info('Waiting for Docker services...');
    if (await waitForPort(6379) && await waitForPort(9092)) {
      log('✓ Docker services are ready');
      return true;
    } else {
      warn('Docker services may not be fully ready');
      return true;
    }
  } catch (err) {
    error(`Failed to start Docker services: ${err.message}`);
    return false;
  }
}

// Simple in-memory Redis-like server
function startFallbackRedis(port = 6380) {
  return new Promise((resolve) => {
    const store = new Map();
    const server = createServer((socket) => {
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
            }
            break;
          case 'GET':
            const value = store.get(command[1]);
            response = value ? `$${value.length}\r\n${value}\r\n` : '$-1\r\n';
            break;
          case 'HSET':
            if (command.length >= 4) {
              const key = command[1];
              if (!store.has(key)) store.set(key, new Map());
              const hash = store.get(key);
              hash.set(command[2], command[3]);
              response = ':1\r\n';
            }
            break;
          case 'HGETALL':
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
            break;
          default:
            response = '+OK\r\n';
        }
        
        socket.write(response);
      });
    });
    
    server.listen(port, () => {
      log(`✓ Fallback Redis started on port ${port}`);
      services.set('fallback-redis', server);
      resolve(server);
    });
  });
}

// Simple Kafka-like message broker
function startFallbackKafka(port = 9093) {
  return new Promise((resolve) => {
    const topics = new Map();
    const consumers = new Set();
    
    const server = createServer((socket) => {
      socket.on('data', (data) => {
        try {
          const lines = data.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const request = JSON.parse(line);
              
              if (request.type === 'produce') {
                if (!topics.has(request.topic)) {
                  topics.set(request.topic, []);
                }
                const messages = topics.get(request.topic);
                messages.push({
                  timestamp: Date.now(),
                  value: request.message,
                  offset: messages.length
                });
                
                socket.write(JSON.stringify({ success: true }) + '\n');
              }
            } catch (err) {
              // Ignore parse errors for now
            }
          }
        } catch (err) {
          // Ignore errors
        }
      });
    });
    
    server.listen(port, () => {
      log(`✓ Fallback Kafka started on port ${port}`);
      services.set('fallback-kafka', server);
      resolve(server);
    });
  });
}

// Install dependencies
async function installDependencies() {
  info('📦 Installing dependencies...');
  
  try {
    await execPromise('npm install');
    await execPromise('npm install --workspace=collector');
    await execPromise('npm install --workspace=manager');
    await execPromise('npm install --workspace=ui');
    log('✓ Dependencies installed');
  } catch (err) {
    warn(`Failed to install some dependencies: ${err.message}`);
  }
}

// Start Node.js service
function startService(name, command, cwd, env = {}) {
  return new Promise((resolve) => {
    const fullEnv = { ...process.env, ...env };
    const child = spawn('npm', ['run', command], {
      cwd: path.join(projectRoot, cwd),
      env: fullEnv,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    child.stdout.on('data', (data) => {
      console.log(`${colors.cyan}[${name}]${colors.reset} ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`${colors.yellow}[${name}]${colors.reset} ${data.toString().trim()}`);
    });
    
    child.on('close', (code) => {
      warn(`${name} service exited with code ${code}`);
      services.delete(name);
    });
    
    services.set(name, child);
    log(`✓ ${name} service started (PID: ${child.pid})`);
    resolve(child);
  });
}

// Main start function
async function start() {
  log('🚀 Starting Vision Logistics System...');
  
  // Install dependencies
  await installDependencies();
  
  let redisPort = 6379;
  let kafkaBrokers = 'localhost:9092';
  
  // Start infrastructure
  if (USE_FALLBACK) {
    info('🔄 Starting fallback services...');
    await startFallbackRedis(6380);
    await startFallbackKafka(9093);
    redisPort = 6380;
    kafkaBrokers = 'localhost:9093';
  } else {
    const dockerAvailable = await checkDocker();
    if (dockerAvailable) {
      const dockerStarted = await startDockerServices();
      if (!dockerStarted) {
        warn('Falling back to in-memory services');
        await startFallbackRedis(6380);
        await startFallbackKafka(9093);
        redisPort = 6380;
        kafkaBrokers = 'localhost:9093';
      }
    } else {
      warn('Docker not available, using fallback services');
      await startFallbackRedis(6380);
      await startFallbackKafka(9093);
      redisPort = 6380;
      kafkaBrokers = 'localhost:9093';
    }
  }
  
  // Give services time to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start application services
  info('🚀 Starting application services...');
  
  await startService('collector', 'dev', 'collector', {
    COLLECTOR_ID: 'collector-01',
    PORT: '3001',
    KAFKA_BROKERS: kafkaBrokers
  });
  
  await startService('manager', 'dev', 'manager', {
    PORT: '3002',
    REDIS_URL: `redis://localhost:${redisPort}`,
    KAFKA_BROKERS: kafkaBrokers,
    DWELL_TIMEOUT_MS: '30000'
  });
  
  await startService('ui', 'dev', 'ui', {
    VITE_API_URL: 'http://localhost:3002'
  });
  
  // Wait for services to be ready
  info('⏳ Waiting for services to start...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Health check
  await checkHealth();
  
  log('🎉 System started successfully!');
  console.log('');
  console.log('🌐 Access URLs:');
  console.log('  • UI Dashboard: http://localhost:3000');
  console.log('  • Collector API: http://localhost:3001');
  console.log('  • Manager API: http://localhost:3002');
  console.log('');
  console.log('📖 Next steps:');
  console.log('  • Generate test data: npm run generate-test-data');
  console.log('  • Stop system: npm run stop');
  console.log('');
}

// Health check
async function checkHealth() {
  info('🔍 Checking service health...');
  
  const healthChecks = [
    { name: 'Collector', url: 'http://localhost:3001/health' },
    { name: 'Manager', url: 'http://localhost:3002/health' }
  ];
  
  for (const check of healthChecks) {
    try {
      const response = await fetch(check.url);
      if (response.ok) {
        log(`✓ ${check.name} is healthy`);
      } else {
        warn(`${check.name} responded but not healthy`);
      }
    } catch {
      warn(`${check.name} is not responding`);
    }
  }
}

// Stop all services
function stop() {
  log('🛑 Stopping all services...');
  
  for (const [name, service] of services) {
    if (service.kill) {
      service.kill('SIGTERM');
      log(`Stopped ${name}`);
    } else if (service.close) {
      service.close();
      log(`Stopped ${name}`);
    }
  }
  
  services.clear();
  
  // Stop Docker services if they were started
  if (!USE_FALLBACK) {
    exec('docker compose -f docker/docker-compose.yml down', { cwd: projectRoot }, (error) => {
      if (error) {
        exec('docker-compose -f docker/docker-compose.yml down', { cwd: projectRoot });
      }
    });
  }
  
  log('✅ All services stopped');
  process.exit(0);
}

// Handle signals
process.on('SIGINT', () => {
  console.log('\n👋 Received SIGINT, shutting down gracefully...');
  stop();
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM, shutting down gracefully...');
  stop();
});

// Parse arguments
const command = process.argv[2];

switch (command) {
  case 'start':
    start().catch(console.error);
    break;
  case 'stop':
    stop();
    break;
  default:
    start().catch(console.error);
}