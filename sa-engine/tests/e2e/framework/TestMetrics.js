/**
 * Test Metrics Collection and Analysis
 * Comprehensive metrics tracking for Super Agents testing
 */

export class TestMetrics {
  constructor() {
    this.metrics = {
      runs: [],
      suites: [],
      tests: [],
      performance: [],
      errors: []
    };
    
    this.currentRun = null;
    this.benchmarks = {
      toolExecution: {
        excellent: 1000,   // < 1s
        good: 3000,        // < 3s
        acceptable: 5000,  // < 5s
        poor: 10000        // < 10s
      },
      memoryUsage: {
        excellent: 50 * 1024 * 1024,   // < 50MB
        good: 100 * 1024 * 1024,       // < 100MB
        acceptable: 200 * 1024 * 1024, // < 200MB
        poor: 500 * 1024 * 1024        // < 500MB
      },
      successRate: {
        excellent: 98,  // >= 98%
        good: 95,       // >= 95%
        acceptable: 90, // >= 90%
        poor: 80        // >= 80%
      }
    };
  }

  /**
   * Start a new test run
   */
  startRun() {
    this.currentRun = {
      id: `run-${Date.now()}`,
      startTime: Date.now(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      totalDuration: 0,
      avgTestDuration: 0,
      environment: {
        node: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    };
    
    console.log(`📈 Started test run: ${this.currentRun.id}`);
  }

  /**
   * End current test run
   */
  endRun() {
    if (!this.currentRun) return;
    
    this.currentRun.endTime = Date.now();
    this.currentRun.totalDuration = this.currentRun.endTime - this.currentRun.startTime;
    this.currentRun.avgTestDuration = this.currentRun.totalTests > 0 ? 
      this.currentRun.totalDuration / this.currentRun.totalTests : 0;
    
    this.metrics.runs.push({ ...this.currentRun });
    
    console.log(`🏁 Completed test run: ${this.currentRun.id}`);
    console.log(`   Duration: ${Math.round(this.currentRun.totalDuration / 1000)}s`);
    console.log(`   Tests: ${this.currentRun.passedTests}/${this.currentRun.totalTests} passed`);
    console.log(`   Suites: ${this.currentRun.passedSuites}/${this.currentRun.totalSuites} passed`);
  }

  /**
   * Record suite execution
   */
  recordSuite(suiteName, passed, duration, testCount) {
    const suiteRecord = {
      id: `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: suiteName,
      passed,
      duration,
      testCount,
      timestamp: new Date().toISOString(),
      runId: this.currentRun?.id
    };
    
    this.metrics.suites.push(suiteRecord);
    
    if (this.currentRun) {
      this.currentRun.totalSuites++;
      if (passed) {
        this.currentRun.passedSuites++;
      } else {
        this.currentRun.failedSuites++;
      }
    }
    
    return suiteRecord;
  }

  /**
   * Record test execution
   */
  recordTest(testName, passed, duration, performanceMetrics = null, errorMessage = null) {
    const testRecord = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: testName,
      passed,
      duration,
      performance: performanceMetrics,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      runId: this.currentRun?.id
    };
    
    this.metrics.tests.push(testRecord);
    
    if (this.currentRun) {
      this.currentRun.totalTests++;
      if (passed) {
        this.currentRun.passedTests++;
      } else {
        this.currentRun.failedTests++;
      }
    }
    
    // Record performance metrics if provided
    if (performanceMetrics) {
      this.recordPerformanceMetric(testName, performanceMetrics);
    }
    
    // Record error if test failed
    if (!passed && errorMessage) {
      this.recordError(testName, errorMessage);
    }
    
    return testRecord;
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(testName, metrics) {
    const perfRecord = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testName,
      duration: metrics.duration,
      memory: metrics.memory,
      cpu: metrics.cpu,
      timestamp: new Date().toISOString(),
      runId: this.currentRun?.id,
      grade: this.gradePerformance(metrics)
    };
    
    this.metrics.performance.push(perfRecord);
    return perfRecord;
  }

  /**
   * Record error occurrence
   */
  recordError(testName, errorMessage, errorType = 'test_failure') {
    const errorRecord = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testName,
      errorType,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      runId: this.currentRun?.id
    };
    
    this.metrics.errors.push(errorRecord);
    return errorRecord;
  }

  /**
   * Grade performance based on benchmarks
   */
  gradePerformance(metrics) {
    const grades = [];
    
    // Duration grade
    if (metrics.duration <= this.benchmarks.toolExecution.excellent) {
      grades.push('A');
    } else if (metrics.duration <= this.benchmarks.toolExecution.good) {
      grades.push('B');
    } else if (metrics.duration <= this.benchmarks.toolExecution.acceptable) {
      grades.push('C');
    } else {
      grades.push('D');
    }
    
    // Memory grade
    const memoryDelta = Math.abs(metrics.memory?.delta || 0);
    if (memoryDelta <= this.benchmarks.memoryUsage.excellent) {
      grades.push('A');
    } else if (memoryDelta <= this.benchmarks.memoryUsage.good) {
      grades.push('B');
    } else if (memoryDelta <= this.benchmarks.memoryUsage.acceptable) {
      grades.push('C');
    } else {
      grades.push('D');
    }
    
    // Return worst grade
    const gradeOrder = ['A', 'B', 'C', 'D'];
    return grades.sort((a, b) => gradeOrder.indexOf(b) - gradeOrder.indexOf(a))[0];
  }

  /**
   * Get comprehensive summary
   */
  getSummary() {
    const totalTests = this.metrics.tests.length;
    const passedTests = this.metrics.tests.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    
    const totalSuites = this.metrics.suites.length;
    const passedSuites = this.metrics.suites.filter(s => s.passed).length;
    const failedSuites = totalSuites - passedSuites;
    
    const durations = this.metrics.tests.map(t => t.duration).filter(d => d);
    const avgTestDuration = durations.length > 0 ? 
      durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    const performanceGrades = this.metrics.performance.map(p => p.grade);
    const gradeDistribution = {
      A: performanceGrades.filter(g => g === 'A').length,
      B: performanceGrades.filter(g => g === 'B').length,
      C: performanceGrades.filter(g => g === 'C').length,
      D: performanceGrades.filter(g => g === 'D').length
    };
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      totalSuites,
      passedSuites,
      failedSuites,
      avgTestDuration: Math.round(avgTestDuration),
      totalRuns: this.metrics.runs.length,
      totalErrors: this.metrics.errors.length,
      performanceGradeDistribution: gradeDistribution,
      performanceScore: this.calculatePerformanceScore(gradeDistribution)
    };
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore(gradeDistribution) {
    const total = Object.values(gradeDistribution).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    const weightedScore = (
      gradeDistribution.A * 100 +
      gradeDistribution.B * 80 +
      gradeDistribution.C * 60 +
      gradeDistribution.D * 40
    ) / total;
    
    return Math.round(weightedScore);
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(testName = null) {
    let performanceData = this.metrics.performance;
    
    if (testName) {
      performanceData = performanceData.filter(p => p.testName === testName);
    }
    
    if (performanceData.length === 0) {
      return null;
    }
    
    // Sort by timestamp
    performanceData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const durations = performanceData.map(p => p.duration);
    const memoryDeltas = performanceData.map(p => Math.abs(p.memory?.delta || 0));
    
    return {
      testName: testName || 'All Tests',
      dataPoints: performanceData.length,
      duration: {
        trend: this.calculateTrend(durations),
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        latest: durations[durations.length - 1]
      },
      memory: {
        trend: this.calculateTrend(memoryDeltas),
        min: Math.min(...memoryDeltas),
        max: Math.max(...memoryDeltas),
        avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        latest: memoryDeltas[memoryDeltas.length - 1]
      }
    };
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis() {
    const errorsByType = {};
    const errorsByTest = {};
    const recentErrors = [];
    
    this.metrics.errors.forEach(error => {
      // Group by error type
      if (!errorsByType[error.errorType]) {
        errorsByType[error.errorType] = [];
      }
      errorsByType[error.errorType].push(error);
      
      // Group by test name
      if (!errorsByTest[error.testName]) {
        errorsByTest[error.testName] = [];
      }
      errorsByTest[error.testName].push(error);
      
      // Collect recent errors (last 24 hours)
      const errorTime = new Date(error.timestamp);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (errorTime > twentyFourHoursAgo) {
        recentErrors.push(error);
      }
    });
    
    return {
      totalErrors: this.metrics.errors.length,
      errorsByType: Object.keys(errorsByType).map(type => ({
        type,
        count: errorsByType[type].length,
        examples: errorsByType[type].slice(0, 3).map(e => e.message)
      })),
      errorsByTest: Object.keys(errorsByTest).map(test => ({
        testName: test,
        errorCount: errorsByTest[test].length,
        errorRate: this.calculateTestErrorRate(test),
        recentErrors: errorsByTest[test].filter(e => recentErrors.includes(e)).length
      })),
      recentErrors: recentErrors.length,
      mostProblematicTests: this.getMostProblematicTests(errorsByTest)
    };
  }

  /**
   * Calculate error rate for a specific test
   */
  calculateTestErrorRate(testName) {
    const testExecutions = this.metrics.tests.filter(t => t.name === testName);
    const testErrors = this.metrics.errors.filter(e => e.testName === testName);
    
    if (testExecutions.length === 0) return 0;
    return (testErrors.length / testExecutions.length) * 100;
  }

  /**
   * Get most problematic tests
   */
  getMostProblematicTests(errorsByTest) {
    return Object.keys(errorsByTest)
      .map(testName => ({
        testName,
        errorCount: errorsByTest[testName].length,
        errorRate: this.calculateTestErrorRate(testName)
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);
  }

  /**
   * Get test reliability metrics
   */
  getReliabilityMetrics() {
    const testReliability = {};
    
    // Group tests by name
    this.metrics.tests.forEach(test => {
      if (!testReliability[test.name]) {
        testReliability[test.name] = {
          totalRuns: 0,
          successfulRuns: 0,
          failures: [],
          durations: []
        };
      }
      
      testReliability[test.name].totalRuns++;
      if (test.passed) {
        testReliability[test.name].successfulRuns++;
      } else {
        testReliability[test.name].failures.push({
          error: test.error,
          timestamp: test.timestamp
        });
      }
      
      if (test.duration) {
        testReliability[test.name].durations.push(test.duration);
      }
    });
    
    // Calculate reliability scores
    const reliabilityScores = Object.keys(testReliability).map(testName => {
      const data = testReliability[testName];
      const successRate = (data.successfulRuns / data.totalRuns) * 100;
      const avgDuration = data.durations.length > 0 ? 
        data.durations.reduce((a, b) => a + b, 0) / data.durations.length : 0;
      
      return {
        testName,
        totalRuns: data.totalRuns,
        successRate,
        avgDuration: Math.round(avgDuration),
        reliability: this.calculateReliabilityGrade(successRate, avgDuration)
      };
    });
    
    return {
      testCount: reliabilityScores.length,
      reliabilityScores: reliabilityScores.sort((a, b) => b.successRate - a.successRate),
      averageReliability: reliabilityScores.reduce((sum, test) => sum + test.successRate, 0) / reliabilityScores.length,
      highReliabilityTests: reliabilityScores.filter(t => t.successRate >= 95).length,
      lowReliabilityTests: reliabilityScores.filter(t => t.successRate < 80).length
    };
  }

  /**
   * Calculate reliability grade
   */
  calculateReliabilityGrade(successRate, avgDuration) {
    let grade = 'F';
    
    if (successRate >= 98 && avgDuration <= this.benchmarks.toolExecution.good) {
      grade = 'A+';
    } else if (successRate >= 95 && avgDuration <= this.benchmarks.toolExecution.acceptable) {
      grade = 'A';
    } else if (successRate >= 90 && avgDuration <= this.benchmarks.toolExecution.poor) {
      grade = 'B';
    } else if (successRate >= 80) {
      grade = 'C';
    } else if (successRate >= 60) {
      grade = 'D';
    }
    
    return grade;
  }

  /**
   * Export metrics data
   */
  exportData() {
    return {
      summary: this.getSummary(),
      runs: this.metrics.runs,
      suites: this.metrics.suites,
      tests: this.metrics.tests,
      performance: this.metrics.performance,
      errors: this.metrics.errors,
      trends: this.getPerformanceTrends(),
      errorAnalysis: this.getErrorAnalysis(),
      reliability: this.getReliabilityMetrics(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      runs: [],
      suites: [],
      tests: [],
      performance: [],
      errors: []
    };
    this.currentRun = null;
    
    console.log('📈 Test metrics cleared');
  }
}
