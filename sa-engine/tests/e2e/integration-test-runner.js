#!/usr/bin/env node
/**
 * Super Agents Integration Test Runner
 * Main entry point for comprehensive integration testing
 */

import { TestRunner } from './framework/TestRunner.js';
import { CompleteWorkflowTests } from './workflows/CompleteWorkflowTests.js';
import { CrossIDETests } from './ide-compatibility/CrossIDETests.js';
import { ErrorRecoveryTester } from './framework/ErrorRecoveryTester.js';
import { PerformanceMonitor } from './framework/PerformanceMonitor.js';
import { TestAutomation } from './automation/TestAutomation.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Main Integration Test Runner
 */
class IntegrationTestRunner {
  constructor() {
    this.testRunner = new TestRunner({
      parallel: true,
      timeout: 300000, // 5 minutes per test
      retries: 2,
      outputDir: './test-results'
    });
    
    this.workflowTests = new CompleteWorkflowTests();
    this.crossIDETests = new CrossIDETests();
    this.errorRecoveryTester = new ErrorRecoveryTester();
    this.performanceMonitor = new PerformanceMonitor();
    this.testAutomation = new TestAutomation();
    
    this.config = {
      runWorkflowTests: true,
      runIDECompatibilityTests: true,
      runErrorRecoveryTests: true,
      runPerformanceTests: true,
      generateReports: true,
      ciMode: process.env.CI === 'true'
    };
  }

  /**
   * Initialize and run all integration tests
   */
  async run(options = {}) {
    console.log('
🎆 Super Agents Framework - Integration Testing');
    console.log('================================================\n');
    
    try {
      // Parse command line options
      this.parseOptions(options);
      
      // Register all test suites
      await this.registerTestSuites();
      
      // Run tests
      const report = await this.testRunner.runAll();
      
      // Generate additional reports
      if (this.config.generateReports) {
        await this.generateComprehensiveReports(report);
      }
      
      // Print summary
      this.printTestSummary(report);
      
      // Exit with appropriate code
      const exitCode = this.determineExitCode(report);
      if (this.config.ciMode) {
        process.exit(exitCode);
      }
      
      return report;
    } catch (error) {
      console.error('❌ Integration test run failed:', error);
      if (this.config.ciMode) {
        process.exit(1);
      }
      throw error;
    }
  }

  /**
   * Parse command line options
   */
  parseOptions(options) {
    // Parse CLI arguments if running from command line
    if (process.argv.length > 2) {
      const args = process.argv.slice(2);
      
      args.forEach(arg => {
        switch (arg) {
          case '--workflow-only':
            this.config.runIDECompatibilityTests = false;
            this.config.runErrorRecoveryTests = false;
            this.config.runPerformanceTests = false;
            break;
          case '--ide-only':
            this.config.runWorkflowTests = false;
            this.config.runErrorRecoveryTests = false;
            this.config.runPerformanceTests = false;
            break;
          case '--error-recovery-only':
            this.config.runWorkflowTests = false;
            this.config.runIDECompatibilityTests = false;
            this.config.runPerformanceTests = false;
            break;
          case '--performance-only':
            this.config.runWorkflowTests = false;
            this.config.runIDECompatibilityTests = false;
            this.config.runErrorRecoveryTests = false;
            break;
          case '--no-reports':
            this.config.generateReports = false;
            break;
          case '--ci':
            this.config.ciMode = true;
            break;
        }
      });
    }
    
    // Override with provided options
    Object.assign(this.config, options);
  }

  /**
   * Register all test suites
   */
  async registerTestSuites() {
    console.log('📋 Registering test suites...');
    
    // Register workflow tests
    if (this.config.runWorkflowTests) {
      console.log('  • Complete workflow testing suite');
      this.workflowTests.registerTests(this.testRunner);
    }
    
    // Register IDE compatibility tests
    if (this.config.runIDECompatibilityTests) {
      console.log('  • Cross-IDE compatibility testing suite');
      this.crossIDETests.registerTests(this.testRunner);
    }
    
    // Register error recovery tests
    if (this.config.runErrorRecoveryTests) {
      console.log('  • Error recovery testing suite');
      this.errorRecoveryTester.registerTests(this.testRunner);
    }
    
    // Register performance tests
    if (this.config.runPerformanceTests) {
      await this.registerPerformanceTests();
      console.log('  • Performance benchmarking suite');
    }
    
    console.log('✅ All test suites registered\n');
  }

  /**
   * Register performance-specific tests
   */
  async registerPerformanceTests() {
    this.testRunner.registerSuite('performance-benchmarks', {
      setup: () => this.performanceMonitor.start(),
      teardown: () => this.performanceMonitor.stop(),
      tests: [
        {
          name: 'Tool Execution Performance Benchmark',
          fn: () => this.benchmarkToolExecution()
        },
        {
          name: 'Concurrent Operation Performance',
          fn: () => this.benchmarkConcurrentOperations()
        },
        {
          name: 'Memory Usage Stability',
          fn: () => this.benchmarkMemoryUsage()
        },
        {
          name: 'Large Project Handling',
          fn: () => this.benchmarkLargeProjectHandling()
        }
      ]
    });
  }

  /**
   * Benchmark tool execution performance
   */
  async benchmarkToolExecution() {
    console.log('    📈 Benchmarking tool execution performance...');
    
    const toolsToTest = [
      'sa-initialize-project',
      'sa-generate-prd',
      'sa-create-architecture',
      'sa-implement-story',
      'sa-review-code'
    ];
    
    const benchmarkResults = [];
    
    for (const toolName of toolsToTest) {
      const stats = await this.performanceMonitor.benchmarkTool(
        toolName,
        () => this.executeMockTool(toolName),
        5 // iterations
      );
      
      benchmarkResults.push({
        tool: toolName,
        stats
      });
    }
    
    // Validate performance meets benchmarks
    const slowTools = benchmarkResults.filter(r => r.stats.duration.avg > 5000);
    if (slowTools.length > 0) {
      console.warn(`⚠️ Slow tools detected: ${slowTools.map(t => t.tool).join(', ')}`);
    }
    
    console.log(`    ✅ Benchmarked ${benchmarkResults.length} tools`);
    return benchmarkResults;
  }

  /**
   * Benchmark concurrent operations
   */
  async benchmarkConcurrentOperations() {
    console.log('    ⚙️ Benchmarking concurrent operations...');
    
    const concurrencyLevels = [1, 5, 10, 20];
    const results = [];
    
    for (const concurrency of concurrencyLevels) {
      const result = await this.performanceMonitor.benchmarkConcurrency(
        () => this.executeMockTool('sa-list-tasks'),
        concurrency
      );
      
      results.push({
        concurrency,
        result
      });
    }
    
    // Validate scalability
    const maxConcurrency = results[results.length - 1];
    if (maxConcurrency.result.successful < maxConcurrency.concurrency * 0.8) {
      throw new Error(`Poor concurrent performance: only ${maxConcurrency.result.successful}/${maxConcurrency.concurrency} succeeded`);
    }
    
    console.log(`    ✅ Concurrent operations tested up to ${Math.max(...concurrencyLevels)} concurrent tasks`);
    return results;
  }

  /**
   * Benchmark memory usage
   */
  async benchmarkMemoryUsage() {
    console.log('    🧠 Benchmarking memory usage...');
    
    const initialMemory = process.memoryUsage();
    
    // Execute many operations to test memory stability
    for (let i = 0; i < 100; i++) {
      await this.executeMockTool('sa-get-task');
      
      // Force garbage collection periodically
      if (i % 20 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Validate memory usage doesn't grow excessively
    const maxAcceptableIncrease = 100 * 1024 * 1024; // 100MB
    if (memoryIncrease > maxAcceptableIncrease) {
      throw new Error(`Excessive memory usage increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }
    
    console.log(`    ✅ Memory usage stable (increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB)`);
    return {
      initialMemory,
      finalMemory,
      memoryIncrease
    };
  }

  /**
   * Benchmark large project handling
   */
  async benchmarkLargeProjectHandling() {
    console.log('    📋 Benchmarking large project handling...');
    
    const largeProjectScenarios = [
      { taskCount: 100, name: 'Medium Project' },
      { taskCount: 500, name: 'Large Project' },
      { taskCount: 1000, name: 'Enterprise Project' }
    ];
    
    const results = [];
    
    for (const scenario of largeProjectScenarios) {
      const startTime = Date.now();
      
      // Simulate handling large project
      await this.simulateLargeProject(scenario.taskCount);
      
      const duration = Date.now() - startTime;
      
      results.push({
        scenario: scenario.name,
        taskCount: scenario.taskCount,
        duration
      });
      
      // Validate performance scales reasonably
      const tasksPerSecond = scenario.taskCount / (duration / 1000);
      if (tasksPerSecond < 10) {
        console.warn(`⚠️ Slow large project handling: ${tasksPerSecond.toFixed(1)} tasks/sec`);
      }
    }
    
    console.log(`    ✅ Large project handling tested up to ${Math.max(...largeProjectScenarios.map(s => s.taskCount))} tasks`);
    return results;
  }

  /**
   * Execute mock tool for testing
   */
  async executeMockTool(toolName) {
    // Simulate tool execution with realistic timing
    const baseTime = Math.random() * 500 + 200; // 200-700ms
    await new Promise(resolve => setTimeout(resolve, baseTime));
    
    return {
      tool: toolName,
      success: true,
      duration: baseTime,
      output: `Mock output for ${toolName}`
    };
  }

  /**
   * Simulate large project operations
   */
  async simulateLargeProject(taskCount) {
    const batchSize = 20;
    const batches = Math.ceil(taskCount / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const currentBatchSize = Math.min(batchSize, taskCount - i * batchSize);
      
      // Process batch concurrently
      const promises = Array(currentBatchSize).fill().map(() => 
        this.executeMockTool('sa-list-tasks')
      );
      
      await Promise.all(promises);
    }
  }

  /**
   * Generate comprehensive reports
   */
  async generateComprehensiveReports(testReport) {
    console.log('\n📄 Generating comprehensive reports...');
    
    const outputDir = this.testRunner.config.outputDir;
    
    // Generate HTML report
    await this.generateHTMLReport(testReport, path.join(outputDir, 'integration-report.html'));
    
    // Generate performance report
    const performanceReport = this.performanceMonitor.getReport();
    await fs.writeFile(
      path.join(outputDir, 'performance-report.json'),
      JSON.stringify(performanceReport, null, 2)
    );
    
    // Generate CI/CD compatible reports
    if (this.config.ciMode) {
      await this.generateJUnitReport(testReport, path.join(outputDir, 'junit-report.xml'));
      await this.generateCoverageReport(testReport, path.join(outputDir, 'coverage-report.json'));
    }
    
    console.log('✅ Reports generated successfully');
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(testReport, outputPath) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Super Agents Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; flex: 1; }
        .metric.success { border-left: 4px solid #28a745; }
        .metric.warning { border-left: 4px solid #ffc107; }
        .metric.error { border-left: 4px solid #dc3545; }
        .suite { margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; }
        .suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .test { padding: 10px 15px; border-bottom: 1px solid #eee; }
        .test:last-child { border-bottom: none; }
        .test.passed { background: #d4edda; }
        .test.failed { background: #f8d7da; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Super Agents Integration Test Report</h1>
        <p class="timestamp">Generated: ${testReport.timestamp}</p>
        <p>Duration: ${Math.round(testReport.duration / 1000)}s</p>
    </div>
    
    <div class="summary">
        <div class="metric ${testReport.summary.failedTests === 0 ? 'success' : 'error'}">
            <h3>Tests</h3>
            <p><strong>${testReport.summary.totalTests - testReport.summary.failedTests}/${testReport.summary.totalTests}</strong> passed</p>
        </div>
        <div class="metric ${testReport.summary.avgTestDuration < 3000 ? 'success' : 'warning'}">
            <h3>Average Duration</h3>
            <p><strong>${testReport.summary.avgTestDuration}ms</strong></p>
        </div>
        <div class="metric success">
            <h3>Test Suites</h3>
            <p><strong>${testReport.suites.length}</strong> executed</p>
        </div>
    </div>
    
    ${testReport.suites.map(suite => `
        <div class="suite">
            <div class="suite-header">
                <h3>${suite.suite} ${suite.passed ? '✅' : '❌'}</h3>
                <p>Duration: ${Math.round(suite.duration / 1000)}s | Tests: ${suite.tests.length}</p>
            </div>
            ${suite.tests.map(test => `
                <div class="test ${test.passed ? 'passed' : 'failed'}">
                    <strong>${test.name}</strong> (${test.duration}ms)
                    ${test.error ? `<br><em>Error: ${test.error}</em>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
        <h3>Environment Information</h3>
        <p><strong>Node.js:</strong> ${testReport.environment.node}</p>
        <p><strong>Platform:</strong> ${testReport.environment.platform}</p>
        <p><strong>Memory Usage:</strong> ${Math.round(testReport.environment.memory.heapUsed / 1024 / 1024)}MB</p>
    </div>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }

  /**
   * Generate JUnit XML report for CI/CD
   */
  async generateJUnitReport(testReport, outputPath) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Super Agents Integration Tests" tests="${testReport.summary.totalTests}" failures="${testReport.summary.failedTests}" time="${testReport.duration / 1000}">
${testReport.suites.map(suite => `  <testsuite name="${suite.suite}" tests="${suite.tests.length}" failures="${suite.tests.filter(t => !t.passed).length}" time="${suite.duration / 1000}">
${suite.tests.map(test => `    <testcase name="${test.name}" time="${test.duration / 1000}">
${test.passed ? '' : `      <failure message="${test.error || 'Test failed'}">${test.error || 'Test failed'}</failure>`}
    </testcase>`).join('\n')}
  </testsuite>`).join('\n')}
</testsuites>`;
    
    await fs.writeFile(outputPath, xml);
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport(testReport, outputPath) {
    const coverage = {
      total: {
        tests: testReport.summary.totalTests,
        passed: testReport.summary.totalTests - testReport.summary.failedTests,
        coverage: ((testReport.summary.totalTests - testReport.summary.failedTests) / testReport.summary.totalTests * 100).toFixed(2)
      },
      suites: testReport.suites.map(suite => ({
        name: suite.suite,
        tests: suite.tests.length,
        passed: suite.tests.filter(t => t.passed).length,
        coverage: ((suite.tests.filter(t => t.passed).length / suite.tests.length) * 100).toFixed(2)
      }))
    };
    
    await fs.writeFile(outputPath, JSON.stringify(coverage, null, 2));
  }

  /**
   * Print test summary
   */
  printTestSummary(report) {
    console.log('\n📈 Test Summary');
    console.log('================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ✅ ${report.summary.totalTests - report.summary.failedTests}`);
    console.log(`Failed: ❌ ${report.summary.failedTests}`);
    console.log(`Success Rate: ${((report.summary.totalTests - report.summary.failedTests) / report.summary.totalTests * 100).toFixed(1)}%`);
    console.log(`Average Duration: ${report.summary.avgTestDuration}ms`);
    console.log(`Total Duration: ${Math.round(report.duration / 1000)}s`);
    
    if (report.summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      report.suites.forEach(suite => {
        const failedTests = suite.tests.filter(t => !t.passed);
        if (failedTests.length > 0) {
          console.log(`  ${suite.suite}:`);
          failedTests.forEach(test => {
            console.log(`    - ${test.name}: ${test.error}`);
          });
        }
      });
    }
    
    console.log('\n✅ Integration testing completed!');
  }

  /**
   * Determine exit code based on test results
   */
  determineExitCode(report) {
    if (report.summary.failedTests > 0) {
      return 1; // Tests failed
    }
    
    // Check for performance issues
    if (report.performance && report.performance.performanceIssues.length > 0) {
      console.warn('⚠️ Performance issues detected but tests passed');
      return 0; // Don't fail on performance warnings
    }
    
    return 0; // All tests passed
  }
}

// Export for programmatic use
export { IntegrationTestRunner };

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new IntegrationTestRunner();
  
  runner.run().catch(error => {
    console.error('❌ Integration tests failed:', error);
    process.exit(1);
  });
}
