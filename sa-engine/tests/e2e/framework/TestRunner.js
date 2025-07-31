/**
 * Super Agents Framework - End-to-End Test Runner
 * Comprehensive testing framework for validating all integrations
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { TestMetrics } from './TestMetrics.js';
import { IDETestManager } from './IDETestManager.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { ErrorRecoveryTester } from './ErrorRecoveryTester.js';

export class TestRunner extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      parallel: true,
      timeout: 300000, // 5 minutes
      retries: 2,
      outputDir: './test-results',
      ...config
    };
    
    this.metrics = new TestMetrics();
    this.ideManager = new IDETestManager();
    this.performanceMonitor = new PerformanceMonitor();
    this.errorRecoveryTester = new ErrorRecoveryTester();
    
    this.testSuites = new Map();
    this.results = [];
  }

  /**
   * Register test suite
   */
  registerSuite(name, suite) {
    this.testSuites.set(name, {
      name,
      tests: suite.tests || [],
      setup: suite.setup,
      teardown: suite.teardown,
      parallel: suite.parallel !== false
    });
  }

  /**
   * Run all registered test suites
   */
  async runAll() {
    console.log('🚀 Starting Super Agents Integration Testing');
    
    try {
      await this.setupTestEnvironment();
      
      const startTime = Date.now();
      this.metrics.startRun();
      
      // Run test suites
      const suiteResults = await this.executeTestSuites();
      
      // Generate comprehensive report
      const report = await this.generateReport(suiteResults, Date.now() - startTime);
      
      await this.cleanupTestEnvironment();
      
      return report;
    } catch (error) {
      console.error('❌ Test run failed:', error);
      throw error;
    }
  }

  /**
   * Execute all test suites
   */
  async executeTestSuites() {
    const results = [];
    
    for (const [name, suite] of this.testSuites) {
      console.log(`\n📋 Running test suite: ${name}`);
      
      try {
        const suiteResult = await this.executeSuite(suite);
        results.push(suiteResult);
        
        this.emit('suiteComplete', { name, result: suiteResult });
      } catch (error) {
        console.error(`❌ Suite ${name} failed:`, error);
        results.push({
          suite: name,
          passed: false,
          error: error.message,
          tests: []
        });
      }
    }
    
    return results;
  }

  /**
   * Execute individual test suite
   */
  async executeSuite(suite) {
    const suiteStartTime = Date.now();
    
    // Run setup if provided
    if (suite.setup) {
      await suite.setup();
    }
    
    let testResults = [];
    
    try {
      if (suite.parallel && this.config.parallel) {
        // Run tests in parallel
        const promises = suite.tests.map(test => this.executeTest(test));
        testResults = await Promise.all(promises);
      } else {
        // Run tests sequentially
        for (const test of suite.tests) {
          const result = await this.executeTest(test);
          testResults.push(result);
        }
      }
    } finally {
      // Run teardown if provided
      if (suite.teardown) {
        await suite.teardown();
      }
    }
    
    const passed = testResults.every(r => r.passed);
    const duration = Date.now() - suiteStartTime;
    
    this.metrics.recordSuite(suite.name, passed, duration, testResults.length);
    
    return {
      suite: suite.name,
      passed,
      duration,
      tests: testResults
    };
  }

  /**
   * Execute individual test
   */
  async executeTest(test) {
    const testStartTime = Date.now();
    
    console.log(`  🧪 Running: ${test.name}`);
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // Start performance monitoring
        const perfHandle = this.performanceMonitor.startTest(test.name);
        
        // Execute test function
        await Promise.race([
          test.fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
          )
        ]);
        
        // Stop performance monitoring
        const perfMetrics = this.performanceMonitor.stopTest(perfHandle);
        
        const duration = Date.now() - testStartTime;
        
        console.log(`  ✅ ${test.name} (${duration}ms)`);
        
        this.metrics.recordTest(test.name, true, duration, perfMetrics);
        
        return {
          name: test.name,
          passed: true,
          duration,
          performance: perfMetrics,
          attempt: attempt + 1
        };
      } catch (error) {
        if (attempt === this.config.retries) {
          const duration = Date.now() - testStartTime;
          
          console.log(`  ❌ ${test.name} (${error.message})`);
          
          this.metrics.recordTest(test.name, false, duration, null, error.message);
          
          return {
            name: test.name,
            passed: false,
            duration,
            error: error.message,
            attempt: attempt + 1
          };
        }
        
        console.log(`  🔄 ${test.name} (retry ${attempt + 1}/${this.config.retries})`);
      }
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });
    
    // Initialize IDE test environments
    await this.ideManager.setupAll();
    
    // Start performance monitoring
    this.performanceMonitor.start();
    
    console.log('✅ Test environment ready');
  }

  /**
   * Cleanup test environment
   */
  async cleanupTestEnvironment() {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      await this.ideManager.cleanupAll();
      this.performanceMonitor.stop();
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
    
    console.log('✅ Cleanup completed');
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(suiteResults, totalDuration) {
    console.log('\n📊 Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: this.metrics.getSummary(),
      suites: suiteResults,
      performance: this.performanceMonitor.getReport(),
      environment: {
        node: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    };
    
    // Save detailed report
    const reportPath = path.join(this.config.outputDir, `test-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate human-readable summary
    const summaryPath = path.join(this.config.outputDir, 'test-summary.md');
    await this.generateMarkdownSummary(report, summaryPath);
    
    console.log(`📄 Report saved: ${reportPath}`);
    console.log(`📋 Summary saved: ${summaryPath}`);
    
    return report;
  }

  /**
   * Generate markdown summary
   */
  async generateMarkdownSummary(report, outputPath) {
    const { summary } = report;
    const passed = summary.totalTests - summary.failedTests;
    const passRate = ((passed / summary.totalTests) * 100).toFixed(1);
    
    const markdown = `# Super Agents Integration Test Report

**Generated:** ${report.timestamp}
**Duration:** ${Math.round(report.duration / 1000)}s

## Summary

- **Total Tests:** ${summary.totalTests}
- **Passed:** ${passed} (${passRate}%)
- **Failed:** ${summary.failedTests}
- **Test Suites:** ${summary.totalSuites}
- **Average Test Duration:** ${Math.round(summary.avgTestDuration)}ms

## Test Suites

${report.suites.map(suite => 
  `### ${suite.suite}\n\n` +
  `- **Status:** ${suite.passed ? '✅ PASSED' : '❌ FAILED'}\n` +
  `- **Duration:** ${Math.round(suite.duration / 1000)}s\n` +
  `- **Tests:** ${suite.tests.length}\n\n` +
  (suite.tests.length > 0 ? 
    suite.tests.map(test => 
      `- ${test.passed ? '✅' : '❌'} ${test.name} (${test.duration}ms)`
    ).join('\n') + '\n\n' : '')
).join('')}

## Performance Metrics

${Object.entries(report.performance.summary || {}).map(([key, value]) => 
  `- **${key}:** ${typeof value === 'number' ? Math.round(value) : value}`
).join('\n')}

## Environment

- **Node.js:** ${report.environment.node}
- **Platform:** ${report.environment.platform}
- **Memory Usage:** ${Math.round(report.environment.memory.heapUsed / 1024 / 1024)}MB
`;
    
    await fs.writeFile(outputPath, markdown);
  }
}
