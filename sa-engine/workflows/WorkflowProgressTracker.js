/**
 * Advanced Workflow Progress Tracking and Reporting System
 * Comprehensive tracking, analytics, and reporting for workflow instances
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class WorkflowProgressTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.trackingEnabled = options.trackingEnabled !== false;
    this.reportingEnabled = options.reportingEnabled !== false;
    this.metricsRetention = options.metricsRetention || 90; // days
    this.reportingInterval = options.reportingInterval || 3600000; // 1 hour
    this.storageDir = options.storageDir || path.join(process.cwd(), '.sa-workflows', 'tracking');
    
    this.instanceMetrics = new Map();
    this.phaseMetrics = new Map();
    this.gateMetrics = new Map();
    this.performanceMetrics = new Map();
    this.reportingTimer = null;
    
    this.aggregatedMetrics = {
      workflowStats: new Map(),
      phaseStats: new Map(),
      gateStats: new Map(),
      performanceStats: new Map(),
      trends: new Map()
    };
  }

  /**
   * Initialize the progress tracker
   */
  async initialize() {
    try {
      if (this.trackingEnabled) {
        await this.setupStorage();
        await this.loadHistoricalData();
        this.startPeriodicReporting();
      }

      this.emit('tracker:initialized', {
        trackingEnabled: this.trackingEnabled,
        reportingEnabled: this.reportingEnabled,
        storageDir: this.storageDir
      });

      return {
        success: true,
        message: 'Progress tracker initialized successfully'
      };
    } catch (error) {
      this.emit('tracker:error', error);
      throw new Error(`Failed to initialize progress tracker: ${error.message}`);
    }
  }

  /**
   * Setup storage directories
   */
  async setupStorage() {
    const directories = [
      this.storageDir,
      path.join(this.storageDir, 'instances'),
      path.join(this.storageDir, 'phases'),
      path.join(this.storageDir, 'gates'),
      path.join(this.storageDir, 'reports'),
      path.join(this.storageDir, 'metrics')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load historical tracking data
   */
  async loadHistoricalData() {
    try {
      const metricsFile = path.join(this.storageDir, 'metrics', 'aggregated-metrics.json');
      const data = await fs.readFile(metricsFile, 'utf-8');
      const historicalMetrics = JSON.parse(data);
      
      // Restore aggregated metrics
      Object.entries(historicalMetrics).forEach(([key, value]) => {
        if (this.aggregatedMetrics[key]) {
          this.aggregatedMetrics[key] = new Map(value);
        }
      });

      this.emit('tracker:historical_data_loaded', {
        metricsLoaded: Object.keys(historicalMetrics).length
      });
    } catch (error) {
      // Historical data is optional
      console.log('No historical tracking data found, starting fresh');
    }
  }

  /**
   * Track workflow instance start
   */
  async trackWorkflowStart(instanceId, workflowType, metadata = {}) {
    if (!this.trackingEnabled) return;

    const startTime = new Date();
    const tracking = {
      instanceId,
      workflowType,
      status: 'running',
      startTime: startTime.toISOString(),
      endTime: null,
      duration: null,
      phases: [],
      gates: [],
      metadata: {
        ...metadata,
        version: metadata.version || '1.0',
        complexity: metadata.complexity || 'medium',
        teamSize: metadata.teamSize || 1
      },
      performance: {
        startTimestamp: startTime.getTime(),
        phaseTimings: [],
        gateTimings: [],
        resourceUsage: []
      },
      quality: {
        gateSuccessRate: 0,
        reworkCount: 0,
        blockerCount: 0,
        issueCount: 0
      }
    };

    this.instanceMetrics.set(instanceId, tracking);
    
    // Update aggregated stats
    this.updateWorkflowStats(workflowType, 'started');
    
    await this.persistInstanceMetrics(instanceId);
    
    this.emit('workflow:tracking_started', {
      instanceId,
      workflowType,
      startTime: tracking.startTime
    });
  }

  /**
   * Track phase start
   */
  async trackPhaseStart(instanceId, phaseIndex, phaseName, phaseMetadata = {}) {
    if (!this.trackingEnabled) return;

    const tracking = this.instanceMetrics.get(instanceId);
    if (!tracking) return;

    const startTime = new Date();
    const phaseTracking = {
      phaseIndex,
      phaseName,
      status: 'running',
      startTime: startTime.toISOString(),
      endTime: null,
      duration: null,
      steps: [],
      gates: [],
      issues: [],
      rework: [],
      metadata: phaseMetadata,
      performance: {
        startTimestamp: startTime.getTime(),
        stepTimings: [],
        resourceUsage: []
      }
    };

    tracking.phases[phaseIndex] = phaseTracking;
    
    // Update aggregated phase stats
    this.updatePhaseStats(tracking.workflowType, phaseName, 'started');
    
    await this.persistInstanceMetrics(instanceId);
    
    this.emit('phase:tracking_started', {
      instanceId,
      phaseIndex,
      phaseName,
      startTime: phaseTracking.startTime
    });
  }

  /**
   * Track phase completion
   */
  async trackPhaseCompletion(instanceId, phaseIndex, result = {}) {
    if (!this.trackingEnabled) return;

    const tracking = this.instanceMetrics.get(instanceId);
    if (!tracking || !tracking.phases[phaseIndex]) return;

    const endTime = new Date();
    const phaseTracking = tracking.phases[phaseIndex];
    
    phaseTracking.status = result.success ? 'completed' : 'failed';
    phaseTracking.endTime = endTime.toISOString();
    phaseTracking.duration = endTime.getTime() - new Date(phaseTracking.startTime).getTime();
    phaseTracking.result = result;

    // Update performance metrics
    tracking.performance.phaseTimings.push({
      phaseIndex,
      phaseName: phaseTracking.phaseName,
      duration: phaseTracking.duration,
      timestamp: endTime.toISOString()
    });

    // Update quality metrics
    if (result.issues) {
      tracking.quality.issueCount += result.issues.length;
      phaseTracking.issues.push(...result.issues);
    }

    if (result.rework) {
      tracking.quality.reworkCount += result.rework.length;
      phaseTracking.rework.push(...result.rework);
    }

    // Update aggregated stats
    this.updatePhaseStats(tracking.workflowType, phaseTracking.phaseName, 'completed', {
      duration: phaseTracking.duration,
      success: result.success
    });

    await this.persistInstanceMetrics(instanceId);
    
    this.emit('phase:tracking_completed', {
      instanceId,
      phaseIndex,
      phaseName: phaseTracking.phaseName,
      duration: phaseTracking.duration,
      success: result.success
    });
  }

  /**
   * Track validation gate execution
   */
  async trackValidationGate(instanceId, gateId, gateName, result) {
    if (!this.trackingEnabled) return;

    const tracking = this.instanceMetrics.get(instanceId);
    if (!tracking) return;

    const timestamp = new Date();
    const gateTracking = {
      gateId,
      gateName,
      timestamp: timestamp.toISOString(),
      passed: result.passed,
      duration: result.duration || 0,
      errors: result.errors || [],
      warnings: result.warnings || [],
      autoFixApplied: result.autoFixApplied || false,
      ruleResults: result.ruleResults || []
    };

    tracking.gates.push(gateTracking);

    // Update current phase if exists
    const currentPhase = tracking.phases[tracking.phases.length - 1];
    if (currentPhase && currentPhase.status === 'running') {
      currentPhase.gates.push(gateTracking);
    }

    // Update quality metrics
    const totalGates = tracking.gates.length;
    const passedGates = tracking.gates.filter(g => g.passed).length;
    tracking.quality.gateSuccessRate = (passedGates / totalGates) * 100;

    if (!result.passed) {
      tracking.quality.blockerCount++;
    }

    // Update aggregated gate stats
    this.updateGateStats(gateName, result.passed, result.duration);

    await this.persistInstanceMetrics(instanceId);
    
    this.emit('gate:tracking_completed', {
      instanceId,
      gateId,
      gateName,
      passed: result.passed,
      duration: result.duration
    });
  }

  /**
   * Track workflow completion
   */
  async trackWorkflowCompletion(instanceId, result = {}) {
    if (!this.trackingEnabled) return;

    const tracking = this.instanceMetrics.get(instanceId);
    if (!tracking) return;

    const endTime = new Date();
    tracking.status = result.success ? 'completed' : 'failed';
    tracking.endTime = endTime.toISOString();
    tracking.duration = endTime.getTime() - new Date(tracking.startTime).getTime();
    tracking.result = result;

    // Calculate final metrics
    const completedPhases = tracking.phases.filter(p => p.status === 'completed').length;
    const totalPhases = tracking.phases.length;
    tracking.completionRate = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;

    // Update aggregated stats
    this.updateWorkflowStats(tracking.workflowType, 'completed', {
      duration: tracking.duration,
      success: result.success,
      completionRate: tracking.completionRate
    });

    await this.persistInstanceMetrics(instanceId);
    await this.generateWorkflowReport(instanceId);
    
    this.emit('workflow:tracking_completed', {
      instanceId,
      workflowType: tracking.workflowType,
      duration: tracking.duration,
      success: result.success,
      completionRate: tracking.completionRate
    });
  }

  /**
   * Track custom metrics
   */
  async trackCustomMetric(instanceId, metricName, value, metadata = {}) {
    if (!this.trackingEnabled) return;

    const tracking = this.instanceMetrics.get(instanceId);
    if (!tracking) return;

    if (!tracking.customMetrics) {
      tracking.customMetrics = [];
    }

    tracking.customMetrics.push({
      name: metricName,
      value,
      timestamp: new Date().toISOString(),
      metadata
    });

    await this.persistInstanceMetrics(instanceId);
    
    this.emit('custom_metric:tracked', {
      instanceId,
      metricName,
      value,
      metadata
    });
  }

  /**
   * Update workflow statistics
   */
  updateWorkflowStats(workflowType, event, metrics = {}) {
    const stats = this.aggregatedMetrics.workflowStats.get(workflowType) || {
      started: 0,
      completed: 0,
      failed: 0,
      totalDuration: 0,
      averageDuration: 0,
      successRate: 0,
      averageCompletionRate: 0,
      lastUpdated: new Date().toISOString()
    };

    stats[event]++;
    
    if (metrics.duration) {
      stats.totalDuration += metrics.duration;
      const completed = stats.completed + stats.failed;
      stats.averageDuration = completed > 0 ? stats.totalDuration / completed : 0;
    }

    if (metrics.completionRate !== undefined) {
      // Recalculate average completion rate
      const totalCompleted = stats.completed + stats.failed;
      const currentTotal = (stats.averageCompletionRate * (totalCompleted - 1) + metrics.completionRate);
      stats.averageCompletionRate = totalCompleted > 0 ? currentTotal / totalCompleted : 0;
    }

    stats.successRate = stats.started > 0 ? (stats.completed / stats.started) * 100 : 0;
    stats.lastUpdated = new Date().toISOString();

    this.aggregatedMetrics.workflowStats.set(workflowType, stats);
  }

  /**
   * Update phase statistics
   */
  updatePhaseStats(workflowType, phaseName, event, metrics = {}) {
    const key = `${workflowType}:${phaseName}`;
    const stats = this.aggregatedMetrics.phaseStats.get(key) || {
      started: 0,
      completed: 0,
      failed: 0,
      totalDuration: 0,
      averageDuration: 0,
      successRate: 0,
      lastUpdated: new Date().toISOString()
    };

    stats[event]++;

    if (metrics.duration) {
      stats.totalDuration += metrics.duration;
      const completed = stats.completed + stats.failed;
      stats.averageDuration = completed > 0 ? stats.totalDuration / completed : 0;
    }

    stats.successRate = stats.started > 0 ? (stats.completed / stats.started) * 100 : 0;
    stats.lastUpdated = new Date().toISOString();

    this.aggregatedMetrics.phaseStats.set(key, stats);
  }

  /**
   * Update gate statistics
   */
  updateGateStats(gateName, passed, duration = 0) {
    const stats = this.aggregatedMetrics.gateStats.get(gateName) || {
      executions: 0,
      passed: 0,
      failed: 0,
      totalDuration: 0,
      averageDuration: 0,
      successRate: 0,
      lastUpdated: new Date().toISOString()
    };

    stats.executions++;
    if (passed) {
      stats.passed++;
    } else {
      stats.failed++;
    }

    stats.totalDuration += duration;
    stats.averageDuration = stats.executions > 0 ? stats.totalDuration / stats.executions : 0;
    stats.successRate = stats.executions > 0 ? (stats.passed / stats.executions) * 100 : 0;
    stats.lastUpdated = new Date().toISOString();

    this.aggregatedMetrics.gateStats.set(gateName, stats);
  }

  /**
   * Generate comprehensive progress report
   */
  async generateProgressReport(options = {}) {
    const reportType = options.type || 'comprehensive';
    const timeRange = options.timeRange || '30d';
    const workflowTypes = options.workflowTypes || [];

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        reportType,
        timeRange,
        workflowTypes: workflowTypes.length > 0 ? workflowTypes : 'all'
      },
      summary: await this.generateSummaryReport(timeRange, workflowTypes),
      workflows: await this.generateWorkflowReport(timeRange, workflowTypes),
      phases: await this.generatePhaseReport(timeRange, workflowTypes),
      gates: await this.generateGateReport(timeRange, workflowTypes),
      performance: await this.generatePerformanceReport(timeRange, workflowTypes),
      trends: await this.generateTrendReport(timeRange, workflowTypes),
      recommendations: await this.generateRecommendations()
    };

    if (this.reportingEnabled) {
      await this.saveReport(report, reportType);
    }

    this.emit('report:generated', {
      reportType,
      timeRange,
      workflowCount: report.workflows.length
    });

    return report;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(timeRange, workflowTypes) {
    const activeInstances = Array.from(this.instanceMetrics.values())
      .filter(instance => this.matchesFilters(instance, timeRange, workflowTypes));

    const summary = {
      totalWorkflows: activeInstances.length,
      completedWorkflows: activeInstances.filter(w => w.status === 'completed').length,
      runningWorkflows: activeInstances.filter(w => w.status === 'running').length,
      failedWorkflows: activeInstances.filter(w => w.status === 'failed').length,
      averageDuration: 0,
      successRate: 0,
      mostCommonWorkflowType: null,
      averageGateSuccessRate: 0
    };

    if (summary.totalWorkflows > 0) {
      const completedWorkflows = activeInstances.filter(w => w.duration);
      summary.averageDuration = completedWorkflows.length > 0 
        ? completedWorkflows.reduce((sum, w) => sum + w.duration, 0) / completedWorkflows.length 
        : 0;

      summary.successRate = (summary.completedWorkflows / summary.totalWorkflows) * 100;

      // Find most common workflow type
      const typeCount = {};
      activeInstances.forEach(w => {
        typeCount[w.workflowType] = (typeCount[w.workflowType] || 0) + 1;
      });
      summary.mostCommonWorkflowType = Object.keys(typeCount).reduce((a, b) => 
        typeCount[a] > typeCount[b] ? a : b, null);

      // Calculate average gate success rate
      const gateRates = activeInstances
        .filter(w => w.quality && w.quality.gateSuccessRate)
        .map(w => w.quality.gateSuccessRate);
      summary.averageGateSuccessRate = gateRates.length > 0 
        ? gateRates.reduce((sum, rate) => sum + rate, 0) / gateRates.length 
        : 0;
    }

    return summary;
  }

  /**
   * Generate workflow-specific report
   */
  async generateWorkflowReport(timeRange, workflowTypes) {
    const workflowStats = [];

    for (const [workflowType, stats] of this.aggregatedMetrics.workflowStats) {
      if (workflowTypes.length > 0 && !workflowTypes.includes(workflowType)) {
        continue;
      }

      workflowStats.push({
        workflowType,
        ...stats,
        efficiency: stats.averageDuration > 0 ? stats.averageCompletionRate / (stats.averageDuration / 3600000) : 0
      });
    }

    return workflowStats.sort((a, b) => b.started - a.started);
  }

  /**
   * Generate phase analysis report
   */
  async generatePhaseReport(timeRange, workflowTypes) {
    const phaseStats = [];

    for (const [phaseKey, stats] of this.aggregatedMetrics.phaseStats) {
      const [workflowType, phaseName] = phaseKey.split(':');
      
      if (workflowTypes.length > 0 && !workflowTypes.includes(workflowType)) {
        continue;
      }

      phaseStats.push({
        workflowType,
        phaseName,
        ...stats,
        efficiency: stats.averageDuration > 0 ? stats.successRate / (stats.averageDuration / 3600000) : 0
      });
    }

    return phaseStats.sort((a, b) => b.started - a.started);
  }

  /**
   * Generate validation gate report
   */
  async generateGateReport(timeRange, workflowTypes) {
    const gateStats = [];

    for (const [gateName, stats] of this.aggregatedMetrics.gateStats) {
      gateStats.push({
        gateName,
        ...stats,
        reliability: stats.executions > 0 ? (stats.executions - stats.failed) / stats.executions * 100 : 0
      });
    }

    return gateStats.sort((a, b) => b.executions - a.executions);
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(timeRange, workflowTypes) {
    const performanceData = {
      workflowPerformance: [],
      phasePerformance: [],
      bottlenecks: [],
      optimizationOpportunities: []
    };

    // Analyze workflow performance
    for (const [workflowType, stats] of this.aggregatedMetrics.workflowStats) {
      if (workflowTypes.length > 0 && !workflowTypes.includes(workflowType)) {
        continue;
      }

      performanceData.workflowPerformance.push({
        workflowType,
        averageDuration: stats.averageDuration,
        successRate: stats.successRate,
        throughput: stats.completed / Math.max(1, stats.started) * 100,
        performance_score: this.calculatePerformanceScore(stats)
      });
    }

    // Identify bottlenecks
    const slowPhases = Array.from(this.aggregatedMetrics.phaseStats.entries())
      .filter(([key, stats]) => {
        const [workflowType] = key.split(':');
        return workflowTypes.length === 0 || workflowTypes.includes(workflowType);
      })
      .sort((a, b) => b[1].averageDuration - a[1].averageDuration)
      .slice(0, 10);

    performanceData.bottlenecks = slowPhases.map(([phaseKey, stats]) => {
      const [workflowType, phaseName] = phaseKey.split(':');
      return {
        workflowType,
        phaseName,
        averageDuration: stats.averageDuration,
        successRate: stats.successRate,
        impact: stats.started
      };
    });

    return performanceData;
  }

  /**
   * Generate trend analysis
   */
  async generateTrendReport(timeRange, workflowTypes) {
    const trends = {
      workflowTrends: new Map(),
      phaseTrends: new Map(),
      qualityTrends: new Map(),
      performanceTrends: new Map()
    };

    // This would analyze trends over time
    // For now, return basic trend data
    return {
      workflowVolumeTrend: 'stable',
      successRateTrend: 'improving',
      durationTrend: 'stable',
      qualityTrend: 'improving'
    };
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    // Analyze gate success rates
    for (const [gateName, stats] of this.aggregatedMetrics.gateStats) {
      if (stats.successRate < 70) {
        recommendations.push({
          type: 'quality',
          priority: 'high',
          gate: gateName,
          issue: 'Low gate success rate',
          recommendation: `Review validation rules for ${gateName} gate - success rate is ${stats.successRate.toFixed(1)}%`,
          impact: 'workflow_delays'
        });
      }
    }

    // Analyze phase performance
    for (const [phaseKey, stats] of this.aggregatedMetrics.phaseStats) {
      const [workflowType, phaseName] = phaseKey.split(':');
      if (stats.averageDuration > 86400000) { // > 24 hours
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          workflow: workflowType,
          phase: phaseName,
          issue: 'Long phase duration',
          recommendation: `Consider breaking down ${phaseName} phase in ${workflowType} workflow`,
          impact: 'workflow_efficiency'
        });
      }
    }

    // Analyze workflow success rates
    for (const [workflowType, stats] of this.aggregatedMetrics.workflowStats) {
      if (stats.successRate < 80) {
        recommendations.push({
          type: 'process',
          priority: 'high',
          workflow: workflowType,
          issue: 'Low workflow success rate',
          recommendation: `Review ${workflowType} workflow process - success rate is ${stats.successRate.toFixed(1)}%`,
          impact: 'project_delivery'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(stats) {
    const successWeight = 0.4;
    const speedWeight = 0.3;
    const reliabilityWeight = 0.3;

    const successScore = stats.successRate;
    const speedScore = stats.averageDuration > 0 ? Math.max(0, 100 - (stats.averageDuration / 3600000)) : 0;
    const reliabilityScore = stats.started > 0 ? (stats.completed / stats.started) * 100 : 0;

    return (successScore * successWeight + speedScore * speedWeight + reliabilityScore * reliabilityWeight);
  }

  /**
   * Check if instance matches filters
   */
  matchesFilters(instance, timeRange, workflowTypes) {
    if (workflowTypes.length > 0 && !workflowTypes.includes(instance.workflowType)) {
      return false;
    }

    // Time range filtering would be implemented here
    return true;
  }

  /**
   * Persist instance metrics
   */
  async persistInstanceMetrics(instanceId) {
    if (!this.trackingEnabled) return;

    try {
      const tracking = this.instanceMetrics.get(instanceId);
      if (!tracking) return;

      const metricsFile = path.join(this.storageDir, 'instances', `${instanceId}.json`);
      await fs.writeFile(metricsFile, JSON.stringify(tracking, null, 2));
    } catch (error) {
      console.error(`Failed to persist metrics for ${instanceId}: ${error.message}`);
    }
  }

  /**
   * Save report to file
   */
  async saveReport(report, reportType) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(this.storageDir, 'reports', `${reportType}-report-${timestamp}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

      // Also save as latest
      const latestFile = path.join(this.storageDir, 'reports', `${reportType}-latest.json`);
      await fs.writeFile(latestFile, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error(`Failed to save report: ${error.message}`);
    }
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    if (!this.reportingEnabled) return;

    this.reportingTimer = setInterval(async () => {
      try {
        await this.generateProgressReport({ type: 'periodic' });
        await this.saveAggregatedMetrics();
      } catch (error) {
        this.emit('reporting:error', error);
      }
    }, this.reportingInterval);
  }

  /**
   * Save aggregated metrics
   */
  async saveAggregatedMetrics() {
    try {
      const metricsData = {};
      Object.entries(this.aggregatedMetrics).forEach(([key, value]) => {
        metricsData[key] = Array.from(value.entries());
      });

      const metricsFile = path.join(this.storageDir, 'metrics', 'aggregated-metrics.json');
      await fs.writeFile(metricsFile, JSON.stringify(metricsData, null, 2));
    } catch (error) {
      console.error(`Failed to save aggregated metrics: ${error.message}`);
    }
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics() {
    const activeInstances = Array.from(this.instanceMetrics.values())
      .filter(instance => instance.status === 'running');

    return {
      activeWorkflows: activeInstances.length,
      workflowTypes: [...new Set(activeInstances.map(i => i.workflowType))],
      currentPhases: activeInstances.map(i => ({
        instanceId: i.instanceId,
        workflowType: i.workflowType,
        currentPhase: i.phases[i.phases.length - 1]?.phaseName || 'starting',
        progress: Math.round((i.phases.filter(p => p.status === 'completed').length / i.phases.length) * 100) || 0
      })),
      systemLoad: {
        instanceCount: this.instanceMetrics.size,
        metricsSize: this.instanceMetrics.size + this.aggregatedMetrics.workflowStats.size,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Stop periodic reporting
   */
  stopPeriodicReporting() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
      this.reportingTimer = null;
    }
  }

  /**
   * Shutdown the progress tracker
   */
  async shutdown() {
    this.stopPeriodicReporting();

    if (this.trackingEnabled) {
      // Save all pending metrics
      for (const instanceId of this.instanceMetrics.keys()) {
        await this.persistInstanceMetrics(instanceId);
      }
      
      await this.saveAggregatedMetrics();
    }

    this.instanceMetrics.clear();
    this.emit('tracker:shutdown');

    return {
      success: true,
      message: 'Progress tracker shutdown complete'
    };
  }
}

export default WorkflowProgressTracker;