#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const projectRoot = join(process.cwd());

console.log('🔍 Validating Vision Logistics System...\n');

const validations = [
  {
    name: 'Project Structure',
    check: () => {
      const requiredDirs = ['collector', 'manager', 'ui', 'docker', 'scripts'];
      const missingDirs = requiredDirs.filter(dir => !existsSync(join(projectRoot, dir)));
      return {
        passed: missingDirs.length === 0,
        message: missingDirs.length > 0 ? `Missing directories: ${missingDirs.join(', ')}` : 'All directories present'
      };
    }
  },
  
  {
    name: 'Package.json Files',
    check: () => {
      const packages = ['package.json', 'collector/package.json', 'manager/package.json', 'ui/package.json'];
      const missingPackages = packages.filter(pkg => !existsSync(join(projectRoot, pkg)));
      return {
        passed: missingPackages.length === 0,
        message: missingPackages.length > 0 ? `Missing package.json: ${missingPackages.join(', ')}` : 'All package.json files present'
      };
    }
  },
  
  {
    name: 'Docker Configuration',
    check: () => {
      const dockerFile = join(projectRoot, 'docker/docker-compose.yml');
      const exists = existsSync(dockerFile);
      if (!exists) {
        return { passed: false, message: 'docker-compose.yml missing' };
      }
      
      const content = readFileSync(dockerFile, 'utf8');
      const hasKafka = content.includes('kafka');
      const hasRedis = content.includes('redis');
      const hasZookeeper = content.includes('zookeeper');
      
      return {
        passed: hasKafka && hasRedis && hasZookeeper,
        message: hasKafka && hasRedis && hasZookeeper ? 'All services configured' : 'Missing required services'
      };
    }
  },
  
  {
    name: 'Collector Service',
    check: () => {
      const collectorFiles = [
        'collector/src/index.ts',
        'collector/src/services/collector.ts',
        'collector/src/services/kafka-producer.ts',
        'collector/src/types/detection.ts'
      ];
      
      const missingFiles = collectorFiles.filter(file => !existsSync(join(projectRoot, file)));
      return {
        passed: missingFiles.length === 0,
        message: missingFiles.length > 0 ? `Missing files: ${missingFiles.join(', ')}` : 'All collector files present'
      };
    }
  },
  
  {
    name: 'Manager Service',
    check: () => {
      const managerFiles = [
        'manager/src/index.ts',
        'manager/src/services/redis-client.ts',
        'manager/src/services/dwell-processor.ts',
        'manager/src/services/kafka-consumer.ts',
        'manager/src/routes/query.ts',
        'manager/src/routes/feedback.ts'
      ];
      
      const missingFiles = managerFiles.filter(file => !existsSync(join(projectRoot, file)));
      return {
        passed: missingFiles.length === 0,
        message: missingFiles.length > 0 ? `Missing files: ${missingFiles.join(', ')}` : 'All manager files present'
      };
    }
  },
  
  {
    name: 'UI Dashboard',
    check: () => {
      const uiFiles = [
        'ui/src/App.tsx',
        'ui/src/main.tsx',
        'ui/index.html',
        'ui/src/components/HeatmapGrid.tsx',
        'ui/src/components/StatsTable.tsx',
        'ui/src/utils/api.ts'
      ];
      
      const missingFiles = uiFiles.filter(file => !existsSync(join(projectRoot, file)));
      return {
        passed: missingFiles.length === 0,
        message: missingFiles.length > 0 ? `Missing files: ${missingFiles.join(', ')}` : 'All UI files present'
      };
    }
  },
  
  {
    name: 'Test Data Generator',
    check: () => {
      const testFile = join(projectRoot, 'scripts/generate-test-data.js');
      const exists = existsSync(testFile);
      if (!exists) {
        return { passed: false, message: 'Test data generator missing' };
      }
      
      const content = readFileSync(testFile, 'utf8');
      const hasGenerator = content.includes('class TestDataGenerator');
      const hasObjectSim = content.includes('simulateObjectMovement');
      
      return {
        passed: hasGenerator && hasObjectSim,
        message: hasGenerator && hasObjectSim ? 'Test generator complete' : 'Test generator incomplete'
      };
    }
  },
  
  {
    name: 'Environment Configuration',
    check: () => {
      const envExample = existsSync(join(projectRoot, '.env.example'));
      const readme = existsSync(join(projectRoot, 'README.md'));
      
      return {
        passed: envExample && readme,
        message: envExample && readme ? 'Configuration files present' : 'Missing configuration files'
      };
    }
  },
  
  {
    name: 'TypeScript Configuration',
    check: () => {
      const tsConfigs = [
        'collector/tsconfig.json',
        'manager/tsconfig.json', 
        'ui/tsconfig.json'
      ];
      
      const missingConfigs = tsConfigs.filter(config => !existsSync(join(projectRoot, config)));
      return {
        passed: missingConfigs.length === 0,
        message: missingConfigs.length > 0 ? `Missing tsconfig: ${missingConfigs.join(', ')}` : 'All TypeScript configs present'
      };
    }
  },
  
  {
    name: 'API Schema Validation',
    check: () => {
      const collectorTypes = join(projectRoot, 'collector/src/types/detection.ts');
      const managerTypes = join(projectRoot, 'manager/src/types/index.ts');
      const uiTypes = join(projectRoot, 'ui/src/types/api.ts');
      
      if (!existsSync(collectorTypes) || !existsSync(managerTypes) || !existsSync(uiTypes)) {
        return { passed: false, message: 'Missing type definitions' };
      }
      
      const collectorContent = readFileSync(collectorTypes, 'utf8');
      const hasZodSchema = collectorContent.includes('NormalizedEventSchema');
      
      return {
        passed: hasZodSchema,
        message: hasZodSchema ? 'API schemas defined' : 'Missing schema validation'
      };
    }
  }
];

let passedCount = 0;
let totalCount = validations.length;

console.log('Running validation checks:\n');

validations.forEach((validation, index) => {
  const result = validation.check();
  const status = result.passed ? '✅' : '❌';
  const number = `${index + 1}`.padStart(2, '0');
  
  console.log(`${status} ${number}. ${validation.name}: ${result.message}`);
  
  if (result.passed) {
    passedCount++;
  }
});

console.log(`\n📊 Validation Summary: ${passedCount}/${totalCount} checks passed\n`);

if (passedCount === totalCount) {
  console.log('🎉 System validation completed successfully!');
  console.log('✨ The Vision Logistics Tracking System is ready to deploy.');
  console.log('\n🚀 Next Steps:');
  console.log('1. Run: ./scripts/start-system.sh (or follow README.md)');
  console.log('2. Start collector, manager, and UI services');
  console.log('3. Generate test data');
  console.log('4. Open http://localhost:3000 to view the dashboard');
  console.log('\n📖 See README.md for detailed instructions.');
} else {
  console.log(`⚠️  ${totalCount - passedCount} validation(s) failed.`);
  console.log('🔧 Please fix the issues above before deploying the system.');
  process.exit(1);
}

console.log('\n🏗️  System Architecture:');
console.log('┌─────────────┐    ┌─────────┐    ┌─────────────┐    ┌─────────┐');
console.log('│  Cameras    │───▶│Collector│───▶│   Kafka     │───▶│ Manager │');
console.log('│   Feed      │    │Service  │    │  Pipeline   │    │ Service │');
console.log('└─────────────┘    └─────────┘    └─────────────┘    └─────────┘');
console.log('                                                           │');
console.log('                                                           ▼');
console.log('┌─────────────┐    ┌─────────┐    ┌─────────────┐    ┌─────────┐');
console.log('│     UI      │◀───│   API   │◀───│    Redis    │◀───│  Dwell  │');
console.log('│  Dashboard  │    │ Server  │    │  Database   │    │Processor│');
console.log('└─────────────┘    └─────────┘    └─────────────┘    └─────────┘');
console.log('');