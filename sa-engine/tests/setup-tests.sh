#!/bin/bash

# Super Agents MCP Testing Setup Script
# Sets up the comprehensive test environment for Phase 8

echo "🚀 Setting up Super Agents MCP Testing Environment..."

# Navigate to tests directory
cd "$(dirname "$0")"

# Install test dependencies
echo "📦 Installing test dependencies..."
npm install

# Create additional test directories
echo "📁 Creating test directory structure..."
mkdir -p unit/{core,dependencies,analyst,architect,developer,pm,qa,product-owner,scrum-master,ux-expert}
mkdir -p integration/{tool-interactions,state-management,workflow-scenarios}
mkdir -p e2e/{ide-integrations,user-workflows,performance}
mkdir -p benchmark/{performance,load-testing,memory-usage}
mkdir -p fixtures/{sample-projects,mock-responses,test-data}

# Create test configuration files
echo "⚙️ Setting up test configuration..."

# Create Jest configuration for different test types
cat > jest.unit.config.js << 'EOF'
export default {
  displayName: 'Unit Tests',
  testMatch: ['**/tests/unit/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup/test-setup.js'],
  collectCoverageFrom: [
    '../mcp-server/**/*.js',
    '!../mcp-server/node_modules/**',
    '!../mcp-server/test-*.js'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'html', 'lcov'],
  testTimeout: 30000,
  maxWorkers: '50%'
};
EOF

cat > jest.integration.config.js << 'EOF'
export default {
  displayName: 'Integration Tests',
  testMatch: ['**/tests/integration/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup/test-setup.js'],
  testTimeout: 60000,
  maxWorkers: 1 // Sequential execution for integration tests
};
EOF

cat > jest.e2e.config.js << 'EOF'
export default {
  displayName: 'E2E Tests',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setup/test-setup.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  // E2E tests run slower and need more resources
  slowTestThreshold: 60
};
EOF

# Create test runner scripts
echo "📝 Creating test runner scripts..."

cat > run-all-tests.js << 'EOF'
#!/usr/bin/env node

/**
 * Comprehensive test runner for Super Agents MCP
 * Runs all test suites in sequence with proper reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const testSuites = [
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    config: 'jest.unit.config.js',
    critical: true
  },
  {
    name: 'Integration Tests', 
    command: 'npm run test:integration',
    config: 'jest.integration.config.js',
    critical: true
  },
  {
    name: 'Performance Benchmarks',
    command: 'npm run test:performance',
    config: 'jest.unit.config.js',
    critical: false
  },
  {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    config: 'jest.e2e.config.js',
    critical: false
  }
];

console.log('🧪 Starting Super Agents MCP Test Suite\n');

let results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: testSuites.length
};

for (const suite of testSuites) {
  console.log(`\n📋 Running ${suite.name}...`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    execSync(suite.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${suite.name} PASSED (${duration}ms)`);
    results.passed++;
    
  } catch (error) {
    console.log(`❌ ${suite.name} FAILED`);
    results.failed++;
    
    if (suite.critical) {
      console.log(`💥 Critical test suite failed. Stopping execution.`);
      break;
    }
  }
}

// Generate summary report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST EXECUTION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}/${results.total}`);
console.log(`❌ Failed: ${results.failed}/${results.total}`);
console.log(`⏭️  Skipped: ${results.total - results.passed - results.failed}/${results.total}`);

const successRate = (results.passed / results.total * 100).toFixed(1);
console.log(`📈 Success Rate: ${successRate}%`);

if (results.failed === 0) {
  console.log('\n🎉 All tests passed! MCP tools are ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.');
  process.exit(1);
}
EOF

chmod +x run-all-tests.js

# Update package.json scripts
echo "🔧 Updating package.json scripts..."
npm pkg set scripts.test:unit="jest --config=jest.unit.config.js"
npm pkg set scripts.test:integration="jest --config=jest.integration.config.js"  
npm pkg set scripts.test:e2e="jest --config=jest.e2e.config.js"
npm pkg set scripts.test:performance="jest --testPathPattern=performance --config=jest.unit.config.js"
npm pkg set scripts.test:all="node run-all-tests.js"
npm pkg set scripts.test:coverage="jest --coverage --config=jest.unit.config.js"
npm pkg set scripts.test:watch="jest --watch --config=jest.unit.config.js"

# Create benchmark utilities
echo "⏱️  Setting up performance benchmarks..."

mkdir -p benchmark
cat > benchmark/run-benchmarks.js << 'EOF'
#!/usr/bin/env node

/**
 * Performance benchmark suite for MCP tools
 * Measures execution time, memory usage, and throughput
 */

import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class MCPBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      benchmarks: []
    };
  }

  async measureExecution(name, fn, iterations = 100) {
    console.log(`🔥 Benchmarking ${name}...`);
    
    const times = [];
    const memoryBefore = process.memoryUsage();
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    const memoryAfter = process.memoryUsage();
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const memoryDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
    
    const result = {
      name,
      iterations,
      avgTime: Number(avgTime.toFixed(3)),
      minTime: Number(minTime.toFixed(3)),
      maxTime: Number(maxTime.toFixed(3)),
      memoryDelta: memoryDelta,
      throughput: Number((iterations / (avgTime / 1000)).toFixed(2))
    };
    
    this.results.benchmarks.push(result);
    
    console.log(`  Average: ${result.avgTime}ms`);
    console.log(`  Min/Max: ${result.minTime}ms / ${result.maxTime}ms`);
    console.log(`  Memory: ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Throughput: ${result.throughput} ops/sec\n`);
    
    return result;
  }

  async saveResults() {
    const resultsPath = path.join(process.cwd(), 'benchmark', 'results.json');
    await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`📊 Benchmark results saved to ${resultsPath}`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📈 PERFORMANCE BENCHMARK REPORT');
    console.log('='.repeat(60));
    
    this.results.benchmarks.forEach(benchmark => {
      console.log(`\n${benchmark.name}:`);
      console.log(`  Avg Time: ${benchmark.avgTime}ms`);
      console.log(`  Throughput: ${benchmark.throughput} ops/sec`);
      console.log(`  Memory Impact: ${(benchmark.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    });
  }
}

// Example benchmark (can be extended with actual MCP tool tests)
async function runSampleBenchmarks() {
  const benchmark = new MCPBenchmark();
  
  // Simulate MCP tool execution
  await benchmark.measureExecution('MCP Tool Simulation', async () => {
    // Simulate some async work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    // Simulate memory allocation
    const data = new Array(1000).fill(0).map(() => Math.random());
    return data.length;
  }, 50);
  
  await benchmark.saveResults();
  benchmark.generateReport();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSampleBenchmarks().catch(console.error);
}

export default MCPBenchmark;
EOF

chmod +x benchmark/run-benchmarks.js

# Create mock MCP client for testing
echo "🤖 Creating mock MCP client..."

mkdir -p integration/mcp-client
cat > integration/mcp-client/MockMCPClient.js << 'EOF'
/**
 * Mock MCP Client for integration testing
 * Simulates MCP protocol communication without actual server
 */

import { EventEmitter } from 'events';

export class MockMCPClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      simulateLatency: options.simulateLatency !== false,
      latencyRange: options.latencyRange || [10, 100],
      errorRate: options.errorRate || 0.05,
      ...options
    };
    
    this.isConnected = false;
    this.tools = new Map();
    this.requestId = 0;
  }

  async connect() {
    await this.simulateDelay();
    this.isConnected = true;
    this.emit('connected');
    return true;
  }

  async disconnect() {
    await this.simulateDelay();
    this.isConnected = false;
    this.emit('disconnected');
    return true;
  }

  async listTools() {
    this.ensureConnected();
    await this.simulateDelay();
    
    return {
      tools: Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }

  async callTool(toolName, args) {
    this.ensureConnected();
    this.maybeSimulateError();
    await this.simulateDelay();
    
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Simulate tool execution
    const requestId = ++this.requestId;
    this.emit('toolCallStarted', { toolName, args, requestId });
    
    try {
      const result = await tool.execute(args);
      this.emit('toolCallCompleted', { toolName, args, result, requestId });
      return result;
    } catch (error) {
      this.emit('toolCallFailed', { toolName, args, error, requestId });
      throw error;
    }
  }

  registerMockTool(tool) {
    this.tools.set(tool.name, tool);
  }

  ensureConnected() {
    if (!this.isConnected) {
      throw new Error('MCP client is not connected');
    }
  }

  async simulateDelay() {
    if (!this.options.simulateLatency) return;
    
    const [min, max] = this.options.latencyRange;
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  maybeSimulateError() {
    if (Math.random() < this.options.errorRate) {
      throw new Error('Simulated network error');
    }
  }
}

export default MockMCPClient;
EOF

# Create test data generators
echo "🎲 Setting up test data generators..."

mkdir -p fixtures/generators
cat > fixtures/generators/TestDataGenerator.js << 'EOF'
/**
 * Test data generator for creating realistic test scenarios
 */

import { faker } from '@faker-js/faker';

export class TestDataGenerator {
  static generateTask(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      description: faker.lorem.paragraph({ min: 2, max: 5 }),
      status: faker.helpers.arrayElement(['pending', 'in-progress', 'completed', 'blocked']),
      priority: faker.helpers.arrayElement(['high', 'medium', 'low']),
      effort: faker.datatype.number({ min: 1, max: 5 }),
      estimated_hours: faker.datatype.number({ min: 4, max: 80 }),
      skills: faker.helpers.arrayElements(['javascript', 'react', 'node.js', 'python', 'testing'], { min: 1, max: 3 }),
      assignee: faker.person.firstName(),
      created_at: faker.date.past().toISOString(),
      updated_at: faker.date.recent().toISOString(),
      tags: faker.helpers.arrayElements(['frontend', 'backend', 'api', 'ui', 'database'], { min: 0, max: 2 }),
      subtasks: [],
      ...overrides
    };
  }

  static generateWorkflow(overrides = {}) {
    const phases = this.generatePhases(4);
    
    return {
      id: faker.datatype.uuid(),
      type: faker.helpers.arrayElement(['greenfield-fullstack', 'brownfield-fullstack', 'greenfield-service']),
      projectName: faker.company.name() + ' Project',
      status: faker.helpers.arrayElement(['active', 'paused', 'completed']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      currentPhase: faker.datatype.number({ min: 0, max: phases.length - 1 }),
      phases,
      progress: {
        overall: faker.datatype.number({ min: 0, max: 100 }),
        currentPhase: faker.datatype.number({ min: 0, max: 3 }),
        completedPhases: faker.datatype.number({ min: 0, max: 2 }),
        totalPhases: phases.length
      },
      ...overrides
    };
  }

  static generatePhases(count = 4) {
    const phaseNames = ['Planning', 'Design', 'Development', 'Testing', 'Deployment'];
    
    return Array.from({ length: count }, (_, index) => ({
      name: phaseNames[index] || `Phase ${index + 1}`,
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['pending', 'in-progress', 'completed']),
      progress: faker.datatype.number({ min: 0, max: 100 }),
      estimatedDuration: `${faker.datatype.number({ min: 1, max: 4 })} weeks`,
      startedAt: faker.date.past().toISOString(),
      completedAt: Math.random() > 0.5 ? faker.date.recent().toISOString() : null
    }));
  }

  static generatePRD(complexity = 'medium') {
    const templates = {
      simple: `# ${faker.company.name()} App

## Overview
${faker.lorem.paragraph()}

## Features
${Array.from({ length: 3 }, () => `- ${faker.lorem.sentence()}`).join('\n')}

## Requirements
${faker.lorem.paragraph()}`,

      complex: `# ${faker.company.name()} Platform

## Executive Summary
${faker.lorem.paragraphs(2)}

## Core Features
${Array.from({ length: 5 }, (_, i) => `
### ${faker.lorem.words(2)}
${faker.lorem.paragraph()}
`).join('')}

## Technical Requirements
${faker.lorem.paragraph()}

## Acceptance Criteria
${Array.from({ length: 4 }, () => `- ${faker.lorem.sentence()}`).join('\n')}`
    };

    return templates[complexity] || templates.simple;
  }

  static generateProject(overrides = {}) {
    return {
      name: faker.company.name() + ' Project',
      description: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(['web-app', 'mobile-app', 'api', 'desktop-app']),
      technology: faker.helpers.arrayElement(['React/Node.js', 'Vue/Express', 'Angular/NestJS']),
      complexity: faker.helpers.arrayElement(['low', 'medium', 'high']),
      teamSize: faker.datatype.number({ min: 2, max: 10 }),
      estimatedDuration: `${faker.datatype.number({ min: 4, max: 24 })} weeks`,
      budget: faker.datatype.number({ min: 10000, max: 500000 }),
      ...overrides
    };
  }
}

export default TestDataGenerator;
EOF

echo "✅ Test environment setup complete!"
echo ""
echo "📋 Available test commands:"
echo "  npm run test:unit          - Run unit tests"
echo "  npm run test:integration   - Run integration tests"  
echo "  npm run test:e2e           - Run end-to-end tests"
echo "  npm run test:performance   - Run performance benchmarks"
echo "  npm run test:all           - Run all tests"
echo "  npm run test:coverage      - Run tests with coverage"
echo "  npm run test:watch         - Run tests in watch mode"
echo ""
echo "🎯 Next steps:"
echo "  1. Implement remaining unit tests for all MCP tools"
echo "  2. Create integration test scenarios"
echo "  3. Set up E2E tests with IDE integration"
echo "  4. Run comprehensive test suite"
echo ""
echo "🚀 Ready to test Super Agents MCP tools!"
EOF