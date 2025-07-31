/**
 * Performance Monitor for Super Agents Testing
 * Tracks performance metrics during test execution
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.activeTests = new Map();
    this.systemMetrics = {
      startMemory: null,
      peakMemory: 0,
      startTime: null
    };
    this.benchmarks = {
      toolExecution: {
        target: 2000, // 2 seconds
        warning: 5000  // 5 seconds
      },
      memoryUsage: {
        target: 100 * 1024 * 1024, // 100MB
        warning: 250 * 1024 * 1024 // 250MB
      },
      concurrentTests: {
        target: 10,
        warning: 5
      }
    };
  }

  /**
   * Start performance monitoring
   */
  start() {
    this.systemMetrics.startTime = Date.now();
    this.systemMetrics.startMemory = process.memoryUsage();
    
    // Start periodic memory monitoring
    this.memoryInterval = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed;
      if (currentMemory > this.systemMetrics.peakMemory) {
        this.systemMetrics.peakMemory = currentMemory;
      }
    }, 1000);
    
    console.log('📈 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    console.log('📈 Performance monitoring stopped');
  }

  /**
   * Start monitoring a specific test
   */
  startTest(testName) {
    const handle = `${testName}-${Date.now()}`;
    
    this.activeTests.set(handle, {
      name: testName,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    });
    
    return handle;
  }

  /**
   * Stop monitoring a specific test
   */
  stopTest(handle) {
    const testInfo = this.activeTests.get(handle);
    if (!testInfo) {
      return null;
    }
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const endCpuUsage = process.cpuUsage(testInfo.cpuUsage);
    
    const metrics = {
      name: testInfo.name,
      duration: endTime - testInfo.startTime,
      memory: {
        start: testInfo.startMemory.heapUsed,
        end: endMemory.heapUsed,
        peak: Math.max(testInfo.startMemory.heapUsed, endMemory.heapUsed),
        delta: endMemory.heapUsed - testInfo.startMemory.heapUsed
      },
      cpu: {
        user: endCpuUsage.user / 1000, // Convert to milliseconds
        system: endCpuUsage.system / 1000
      }
    };
    
    // Store metrics for reporting
    if (!this.metrics.has(testInfo.name)) {
      this.metrics.set(testInfo.name, []);
    }
    this.metrics.get(testInfo.name).push(metrics);
    
    this.activeTests.delete(handle);
    
    // Check for performance issues
    this.checkPerformanceThresholds(metrics);
    
    return metrics;
  }

  /**
   * Check if metrics meet performance thresholds
   */
  checkPerformanceThresholds(metrics) {
    const warnings = [];
    
    // Duration check
    if (metrics.duration > this.benchmarks.toolExecution.warning) {
      warnings.push(`Test ${metrics.name} took ${metrics.duration}ms (warning threshold: ${this.benchmarks.toolExecution.warning}ms)`);
    } else if (metrics.duration > this.benchmarks.toolExecution.target) {
      console.log(`⚠️ ${metrics.name} took ${metrics.duration}ms (target: ${this.benchmarks.toolExecution.target}ms)`);
    }
    
    // Memory check
    if (Math.abs(metrics.memory.delta) > this.benchmarks.memoryUsage.warning) {
      warnings.push(`Test ${metrics.name} memory delta ${Math.round(metrics.memory.delta / 1024 / 1024)}MB (warning threshold: ${Math.round(this.benchmarks.memoryUsage.warning / 1024 / 1024)}MB)`);
    }
    
    // Log warnings
    warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  }

  /**
   * Record custom metric
   */
  recordMetric(name, value, unit = 'ms') {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      timestamp: Date.now(),
      value,
      unit
    });
  }

  /**
   * Get performance statistics for a specific test
   */
  getTestStats(testName) {
    const testMetrics = this.metrics.get(testName);
    if (!testMetrics || testMetrics.length === 0) {
      return null;
    }
    
    const durations = testMetrics.map(m => m.duration || m.value);
    const memoryDeltas = testMetrics.map(m => m.memory?.delta || 0);
    
    return {
      name: testName,
      executions: testMetrics.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: this.calculateMedian(durations)
      },
      memory: {
        avgDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        maxDelta: Math.max(...memoryDeltas),
        minDelta: Math.min(...memoryDeltas)
      }
    };
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Benchmark tool execution
   */
  async benchmarkTool(toolName, toolFunction, iterations = 5) {
    console.log(`📈 Benchmarking ${toolName} (${iterations} iterations)...`);
    
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const handle = this.startTest(`${toolName}-benchmark-${i}`);
      
      try {
        await toolFunction();
        const metrics = this.stopTest(handle);
        results.push(metrics);
      } catch (error) {
        this.stopTest(handle);
        console.error(`Benchmark iteration ${i} failed:`, error);
      }
    }
    
    const stats = this.getTestStats(`${toolName}-benchmark-0`);
    console.log(`✅ ${toolName} benchmark: avg ${Math.round(stats.duration.avg)}ms, min ${stats.duration.min}ms, max ${stats.duration.max}ms`);
    
    return stats;
  }

  /**
   * Test concurrent execution performance
   */
  async benchmarkConcurrency(testFunction, concurrency = 10) {
    console.log(`📈 Testing concurrent execution (${concurrency} concurrent tests)...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
      const promise = new Promise(async (resolve) => {
        const handle = this.startTest(`concurrent-test-${i}`);
        try {
          await testFunction();
          const metrics = this.stopTest(handle);
          resolve(metrics);
        } catch (error) {
          this.stopTest(handle);
          resolve({ error: error.message, duration: Date.now() - startTime });
        }
      });
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => !r.error).length;
    
    console.log(`✅ Concurrency test: ${successful}/${concurrency} successful in ${totalTime}ms`);
    
    return {
      concurrency,
      successful,
      total: concurrency,
      totalTime,
      avgTimePerTest: totalTime / concurrency,
      results
    };
  }

  /**
   * Generate comprehensive performance report
   */
  getReport() {
    const totalTests = Array.from(this.metrics.keys()).length;
    const allMetrics = Array.from(this.metrics.values()).flat();
    
    const report = {
      summary: {
        totalTests,
        totalExecutions: allMetrics.length,
        testDuration: this.systemMetrics.startTime ? Date.now() - this.systemMetrics.startTime : 0,
        peakMemoryUsage: this.systemMetrics.peakMemory,
        memoryIncrease: this.systemMetrics.startMemory ? 
          process.memoryUsage().heapUsed - this.systemMetrics.startMemory.heapUsed : 0
      },
      benchmarks: this.benchmarks,
      testStats: {},
      performanceIssues: []
    };
    
    // Generate stats for each test
    for (const testName of this.metrics.keys()) {
      const stats = this.getTestStats(testName);
      if (stats) {
        report.testStats[testName] = stats;
        
        // Check for performance issues
        if (stats.duration.avg > this.benchmarks.toolExecution.warning) {
          report.performanceIssues.push({
            test: testName,
            issue: 'slow_execution',
            value: stats.duration.avg,
            threshold: this.benchmarks.toolExecution.warning
          });
        }
        
        if (Math.abs(stats.memory.avgDelta) > this.benchmarks.memoryUsage.warning) {
          report.performanceIssues.push({
            test: testName,
            issue: 'memory_leak',
            value: stats.memory.avgDelta,
            threshold: this.benchmarks.memoryUsage.warning
          });
        }
      }
    }
    
    return report;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.activeTests.clear();
    this.systemMetrics = {
      startMemory: null,
      peakMemory: 0,
      startTime: null
    };
    
    console.log('📈 Performance metrics reset');
  }
}
