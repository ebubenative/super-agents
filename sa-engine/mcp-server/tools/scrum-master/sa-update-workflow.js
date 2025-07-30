import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saUpdateWorkflow = {
  name: 'sa_update_workflow',
  description: 'Update and manage agile workflows with status tracking, workflow optimization, and process improvement recommendations',
  category: 'scrum-master',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      workflowId: { type: 'string', minLength: 1 },
      updateType: { 
        type: 'string', 
        enum: ['status-update', 'process-change', 'optimization', 'impediment-resolution', 'team-adjustment'],
        default: 'status-update'
      },
      currentState: {
        type: 'object',
        properties: {
          sprint: { type: 'object' },
          stories: { type: 'array', items: { type: 'object' } },
          team: { type: 'object' },
          impediments: { type: 'array', items: { type: 'object' } }
        }
      },
      updates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            target: { type: 'string' },
            change: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      },
      improvements: { type: 'array', items: { type: 'string' } },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['workflowId']
  },

  validate(args) {
    const errors = [];
    if (!args.workflowId?.trim()) errors.push('workflowId is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const workflowContext = {
        workflowId: args.workflowId.trim(),
        updateType: args.updateType || 'status-update',
        currentState: args.currentState || {},
        updates: args.updates || [],
        improvements: args.improvements || [],
        timestamp: new Date().toISOString(),
        updatedBy: context?.userId || 'system'
      };

      // Analyze current workflow state
      const workflowAnalysis = await this.analyzeWorkflowState(workflowContext);
      
      // Process workflow updates
      const processedUpdates = await this.processWorkflowUpdates(workflowContext, workflowAnalysis);
      
      // Generate workflow optimizations
      const optimizations = await this.generateOptimizations(workflowContext, workflowAnalysis);
      
      // Create updated workflow state
      const updatedWorkflow = await this.createUpdatedWorkflow(workflowContext, processedUpdates, optimizations);
      
      // Generate improvement recommendations
      const recommendations = await this.generateRecommendations(workflowContext, workflowAnalysis, optimizations);
      
      const output = await this.formatWorkflowOutput(
        workflowContext,
        workflowAnalysis,
        processedUpdates,
        updatedWorkflow,
        optimizations,
        recommendations
      );
      
      await this.saveWorkflowData(args.projectPath, workflowContext, {
        analysis: workflowAnalysis,
        updates: processedUpdates,
        workflow: updatedWorkflow,
        optimizations,
        recommendations
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          workflowId: workflowContext.workflowId,
          updateType: workflowContext.updateType,
          updatesProcessed: processedUpdates.length,
          optimizationsFound: optimizations.length,
          recommendationsGenerated: recommendations.length,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to update workflow: ${error.message}` }],
        isError: true
      };
    }
  },

  async analyzeWorkflowState(context) {
    const analysis = {
      sprintHealth: await this.assessSprintHealth(context.currentState.sprint),
      storyFlow: await this.analyzeStoryFlow(context.currentState.stories),
      teamEfficiency: await this.assessTeamEfficiency(context.currentState.team),
      impediments: await this.analyzeImpediments(context.currentState.impediments),
      processMetrics: await this.calculateProcessMetrics(context.currentState),
      bottlenecks: await this.identifyBottlenecks(context.currentState)
    };

    return analysis;
  },

  async assessSprintHealth(sprint) {
    if (!sprint) return { status: 'no-active-sprint', health: 'unknown' };

    const daysElapsed = sprint.daysElapsed || 0;
    const totalDays = sprint.duration || 14;
    const completed = sprint.completed || 0;
    const committed = sprint.committed || 0;
    
    const timeProgress = (daysElapsed / totalDays) * 100;
    const workProgress = committed > 0 ? (completed / committed) * 100 : 0;
    
    let health = 'good';
    const issues = [];
    
    if (workProgress < timeProgress - 20) {
      health = 'at-risk';
      issues.push('Work progress behind schedule');
    }
    
    if (workProgress < timeProgress - 40) {
      health = 'critical';
      issues.push('Significant delay in sprint progress');
    }

    return {
      status: 'active',
      health,
      timeProgress: Math.round(timeProgress),
      workProgress: Math.round(workProgress),
      issues,
      burndownTrend: this.calculateBurndownTrend(timeProgress, workProgress)
    };
  },

  calculateBurndownTrend(timeProgress, workProgress) {
    const expectedWork = 100 - timeProgress;
    const actualWork = 100 - workProgress;
    
    if (actualWork < expectedWork - 10) return 'ahead';
    if (actualWork > expectedWork + 10) return 'behind';
    return 'on-track';
  },

  async analyzeStoryFlow(stories) {
    if (!stories || stories.length === 0) {
      return { status: 'no-stories', flow: 'stalled' };
    }

    const statusCounts = stories.reduce((counts, story) => {
      counts[story.status] = (counts[story.status] || 0) + 1;
      return counts;
    }, {});

    const totalStories = stories.length;
    const inProgress = statusCounts['in-progress'] || 0;
    const done = statusCounts['done'] || 0;
    const blocked = statusCounts['blocked'] || 0;

    let flowHealth = 'good';
    const issues = [];

    if (blocked > totalStories * 0.2) {
      flowHealth = 'poor';
      issues.push('High number of blocked stories');
    }

    if (inProgress > totalStories * 0.4) {
      flowHealth = 'concerning';
      issues.push('Too many stories in progress simultaneously');
    }

    return {
      totalStories,
      statusDistribution: statusCounts,
      completionRate: Math.round((done / totalStories) * 100),
      flowHealth,
      issues,
      cycleTime: this.estimateCycleTime(stories)
    };
  },

  estimateCycleTime(stories) {
    const completedStories = stories.filter(s => s.status === 'done' && s.startDate && s.completedDate);
    if (completedStories.length === 0) return 'insufficient-data';

    const cycleTimes = completedStories.map(story => {
      const start = new Date(story.startDate);
      const end = new Date(story.completedDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // days
    });

    const avgCycleTime = cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length;
    return Math.round(avgCycleTime);
  },

  async assessTeamEfficiency(team) {
    if (!team) return { status: 'no-team-data', efficiency: 'unknown' };

    const capacity = team.capacity || 40;
    const utilization = team.utilization || 0;
    const velocity = team.velocity || 0;

    let efficiency = 'good';
    const recommendations = [];

    if (utilization > 90) {
      efficiency = 'overloaded';
      recommendations.push('Team appears overloaded - consider reducing commitment');
    } else if (utilization < 60) {
      efficiency = 'underutilized';
      recommendations.push('Team may be underutilized - consider additional work');
    }

    return {
      capacity,
      utilization: Math.round(utilization),
      velocity,
      efficiency,
      recommendations,
      productivityTrend: this.calculateProductivityTrend(team)
    };
  },

  calculateProductivityTrend(team) {
    const recentVelocity = team.recentVelocity || [];
    if (recentVelocity.length < 2) return 'insufficient-data';

    const recent = recentVelocity.slice(-3);
    const older = recentVelocity.slice(-6, -3);

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'declining';
    return 'stable';
  },

  async analyzeImpediments(impediments) {
    if (!impediments || impediments.length === 0) {
      return { count: 0, severity: 'none', impact: 'minimal' };
    }

    const severityCounts = impediments.reduce((counts, imp) => {
      counts[imp.severity] = (counts[imp.severity] || 0) + 1;
      return counts;
    }, {});

    const totalImpediments = impediments.length;
    const criticalCount = severityCounts.critical || 0;
    const highCount = severityCounts.high || 0;

    let overallSeverity = 'low';
    let impact = 'minimal';

    if (criticalCount > 0) {
      overallSeverity = 'critical';
      impact = 'severe';
    } else if (highCount > 0) {
      overallSeverity = 'high';
      impact = 'moderate';
    } else if (totalImpediments > 3) {
      overallSeverity = 'moderate';
      impact = 'noticeable';
    }

    return {
      count: totalImpediments,
      severity: overallSeverity,
      impact,
      severityBreakdown: severityCounts,
      oldestImpediment: this.findOldestImpediment(impediments),
      resolutionRate: this.calculateResolutionRate(impediments)
    };
  },

  findOldestImpediment(impediments) {
    const oldest = impediments.reduce((oldest, current) => {
      const currentDate = new Date(current.createdDate);
      const oldestDate = new Date(oldest.createdDate);
      return currentDate < oldestDate ? current : oldest;
    });

    const daysSinceCreated = Math.ceil((new Date() - new Date(oldest.createdDate)) / (1000 * 60 * 60 * 24));
    return { ...oldest, ageInDays: daysSinceCreated };
  },

  calculateResolutionRate(impediments) {
    const resolved = impediments.filter(imp => imp.status === 'resolved').length;
    if (impediments.length === 0) return 0;
    return Math.round((resolved / impediments.length) * 100);
  },

  async calculateProcessMetrics(currentState) {
    return {
      leadTime: this.calculateLeadTime(currentState.stories),
      throughput: this.calculateThroughput(currentState.stories),
      workInProgress: this.calculateWIP(currentState.stories),
      defectRate: this.calculateDefectRate(currentState.stories),
      reworkRate: this.calculateReworkRate(currentState.stories)
    };
  },

  calculateLeadTime(stories) {
    // Simplified lead time calculation
    const completedStories = stories?.filter(s => s.status === 'done') || [];
    if (completedStories.length === 0) return 'no-data';

    const avgLeadTime = completedStories.reduce((sum, story) => {
      const leadTime = story.leadTime || 5; // Default 5 days
      return sum + leadTime;
    }, 0) / completedStories.length;

    return Math.round(avgLeadTime);
  },

  calculateThroughput(stories) {
    const completedStories = stories?.filter(s => s.status === 'done') || [];
    return completedStories.length;
  },

  calculateWIP(stories) {
    const wipStories = stories?.filter(s => s.status === 'in-progress') || [];
    return wipStories.length;
  },

  calculateDefectRate(stories) {
    const totalStories = stories?.length || 1;
    const bugsFound = stories?.filter(s => s.type === 'bug').length || 0;
    return Math.round((bugsFound / totalStories) * 100);
  },

  calculateReworkRate(stories) {
    const totalStories = stories?.length || 1;
    const reworkStories = stories?.filter(s => s.reworkCount && s.reworkCount > 0).length || 0;
    return Math.round((reworkStories / totalStories) * 100);
  },

  async identifyBottlenecks(currentState) {
    const bottlenecks = [];

    // Check for status bottlenecks
    const stories = currentState.stories || [];
    const statusCounts = stories.reduce((counts, story) => {
      counts[story.status] = (counts[story.status] || 0) + 1;
      return counts;
    }, {});

    if (statusCounts['in-progress'] > statusCounts['todo'] * 2) {
      bottlenecks.push({
        type: 'status-bottleneck',
        location: 'in-progress',
        description: 'Too many stories stuck in development',
        severity: 'high'
      });
    }

    if (statusCounts['review'] > 3) {
      bottlenecks.push({
        type: 'review-bottleneck',
        location: 'review',
        description: 'Review queue is backing up',
        severity: 'medium'
      });
    }

    // Check for team bottlenecks
    const team = currentState.team || {};
    if (team.utilization > 95) {
      bottlenecks.push({
        type: 'capacity-bottleneck',
        location: 'team-capacity',
        description: 'Team is at maximum capacity',
        severity: 'high'
      });
    }

    return bottlenecks;
  },

  async processWorkflowUpdates(context, analysis) {
    const processedUpdates = [];

    for (const update of context.updates) {
      const processed = {
        ...update,
        id: `UPDATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: context.timestamp,
        impact: await this.assessUpdateImpact(update, analysis),
        validation: await this.validateUpdate(update, context.currentState)
      };

      processedUpdates.push(processed);
    }

    // Add automatic updates based on analysis
    const automaticUpdates = await this.generateAutomaticUpdates(analysis);
    processedUpdates.push(...automaticUpdates);

    return processedUpdates;
  },

  async assessUpdateImpact(update, analysis) {
    const impactLevels = {
      'status-update': 'low',
      'process-change': 'high',
      'optimization': 'medium',
      'impediment-resolution': 'high',
      'team-adjustment': 'medium'
    };

    return {
      level: impactLevels[update.type] || 'medium',
      affectedAreas: this.identifyAffectedAreas(update),
      riskLevel: this.assessRiskLevel(update)
    };
  },

  identifyAffectedAreas(update) {
    const areas = [];
    
    if (update.target?.includes('sprint')) areas.push('sprint-planning');
    if (update.target?.includes('story')) areas.push('story-management');
    if (update.target?.includes('team')) areas.push('team-dynamics');
    if (update.target?.includes('process')) areas.push('workflow-process');

    return areas.length > 0 ? areas : ['general'];
  },

  assessRiskLevel(update) {
    const highRiskTypes = ['process-change', 'team-adjustment'];
    return highRiskTypes.includes(update.type) ? 'high' : 'low';
  },

  async validateUpdate(update, currentState) {
    const validation = {
      isValid: true,
      warnings: [],
      blockers: []
    };

    // Check for conflicts with current state
    if (update.type === 'status-update' && update.target === 'sprint') {
      if (!currentState.sprint) {
        validation.warnings.push('No active sprint to update');
      }
    }

    // Check for process change impacts
    if (update.type === 'process-change') {
      validation.warnings.push('Process changes may require team alignment');
    }

    return validation;
  },

  async generateAutomaticUpdates(analysis) {
    const automaticUpdates = [];

    // Auto-update for impediment resolution
    if (analysis.impediments.count > 0) {
      automaticUpdates.push({
        id: `AUTO-IMPEDIMENT-${Date.now()}`,
        type: 'impediment-resolution',
        target: 'impediments',
        change: 'Schedule impediment resolution session',
        reason: `${analysis.impediments.count} impediments need attention`,
        automatic: true,
        priority: analysis.impediments.severity === 'critical' ? 'high' : 'medium'
      });
    }

    // Auto-update for workflow optimization
    if (analysis.bottlenecks.length > 0) {
      automaticUpdates.push({
        id: `AUTO-BOTTLENECK-${Date.now()}`,
        type: 'optimization',
        target: 'workflow',
        change: 'Address identified bottlenecks',
        reason: `${analysis.bottlenecks.length} bottlenecks identified`,
        automatic: true,
        priority: 'medium'
      });
    }

    return automaticUpdates;
  },

  async generateOptimizations(context, analysis) {
    const optimizations = [];

    // Sprint optimization
    if (analysis.sprintHealth.health === 'at-risk' || analysis.sprintHealth.health === 'critical') {
      optimizations.push({
        area: 'sprint-management',
        type: 'process-improvement',
        suggestion: 'Implement daily progress tracking and risk mitigation',
        priority: 'high',
        effort: 'low',
        impact: 'high'
      });
    }

    // Story flow optimization
    if (analysis.storyFlow.flowHealth === 'poor') {
      optimizations.push({
        area: 'story-flow',
        type: 'wip-limits',
        suggestion: 'Implement work-in-progress limits to improve flow',
        priority: 'high',
        effort: 'medium',
        impact: 'high'
      });
    }

    // Team efficiency optimization
    if (analysis.teamEfficiency.efficiency === 'overloaded') {
      optimizations.push({
        area: 'team-capacity',
        type: 'workload-balancing',
        suggestion: 'Redistribute work or reduce sprint commitment',
        priority: 'critical',
        effort: 'low',
        impact: 'high'
      });
    }

    // Process metrics optimization
    if (analysis.processMetrics.defectRate > 15) {
      optimizations.push({
        area: 'quality-process',
        type: 'quality-improvement',
        suggestion: 'Implement additional code review and testing practices',
        priority: 'medium',
        effort: 'medium',
        impact: 'medium'
      });
    }

    return optimizations;
  },

  async createUpdatedWorkflow(context, processedUpdates, optimizations) {
    const workflow = {
      id: context.workflowId,
      lastUpdated: context.timestamp,
      updatedBy: context.updatedBy,
      version: this.incrementVersion(context.currentState.version),
      state: await this.applyUpdatesToState(context.currentState, processedUpdates),
      optimizations: optimizations.map(opt => opt.suggestion),
      metrics: await this.updateMetrics(context.currentState, processedUpdates),
      nextReviewDate: this.calculateNextReviewDate(context.updateType)
    };

    return workflow;
  },

  incrementVersion(currentVersion) {
    if (!currentVersion) return '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  },

  async applyUpdatesToState(currentState, updates) {
    let newState = JSON.parse(JSON.stringify(currentState)); // Deep copy

    updates.forEach(update => {
      if (update.target === 'sprint' && newState.sprint) {
        newState.sprint.lastUpdated = update.timestamp;
        newState.sprint.status = update.change;
      }
      
      if (update.target === 'stories' && newState.stories) {
        // Apply story updates
        newState.stories = newState.stories.map(story => ({
          ...story,
          lastUpdated: update.timestamp
        }));
      }
    });

    return newState;
  },

  async updateMetrics(currentState, updates) {
    return {
      updatesApplied: updates.length,
      automaticUpdates: updates.filter(u => u.automatic).length,
      manualUpdates: updates.filter(u => !u.automatic).length,
      highPriorityUpdates: updates.filter(u => u.priority === 'high').length,
      lastMetricUpdate: new Date().toISOString()
    };
  },

  calculateNextReviewDate(updateType) {
    const reviewIntervals = {
      'status-update': 1, // 1 day
      'process-change': 7, // 1 week
      'optimization': 3, // 3 days
      'impediment-resolution': 2, // 2 days
      'team-adjustment': 5 // 5 days
    };

    const days = reviewIntervals[updateType] || 3;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + days);
    
    return nextReview.toISOString().split('T')[0];
  },

  async generateRecommendations(context, analysis, optimizations) {
    const recommendations = [];

    // Immediate action recommendations
    if (analysis.impediments.count > 0) {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        action: 'Address blocking impediments',
        details: `${analysis.impediments.count} impediments are affecting team progress`,
        timeline: '1-2 days'
      });
    }

    // Short-term improvements
    if (analysis.bottlenecks.length > 0) {
      recommendations.push({
        type: 'short-term',
        priority: 'medium',
        action: 'Resolve workflow bottlenecks',
        details: `Focus on ${analysis.bottlenecks.map(b => b.location).join(', ')}`,
        timeline: '1 week'
      });
    }

    // Long-term process improvements
    if (optimizations.length > 2) {
      recommendations.push({
        type: 'long-term',
        priority: 'medium',
        action: 'Implement systematic process improvements',
        details: `${optimizations.length} optimization opportunities identified`,
        timeline: '2-4 weeks'
      });
    }

    // Team development recommendations
    if (analysis.teamEfficiency.efficiency !== 'good') {
      recommendations.push({
        type: 'team-development',
        priority: 'medium',
        action: 'Focus on team efficiency improvements',
        details: `Current efficiency: ${analysis.teamEfficiency.efficiency}`,
        timeline: '2-3 weeks'
      });
    }

    return recommendations;
  },

  async formatWorkflowOutput(context, analysis, updates, workflow, optimizations, recommendations) {
    let output = `🔄 **Workflow Update: ${context.workflowId}**\n\n`;
    output += `📊 **Update Type:** ${context.updateType}\n`;
    output += `📅 **Updated:** ${context.timestamp.split('T')[0]}\n`;
    output += `👤 **Updated By:** ${context.updatedBy}\n`;
    output += `🔢 **Version:** ${workflow.version}\n\n`;

    // Workflow Health Summary
    output += `## 📈 Workflow Health Summary\n\n`;
    output += `**Sprint Health:** ${analysis.sprintHealth.health} (${analysis.sprintHealth.workProgress}% complete)\n`;
    output += `**Story Flow:** ${analysis.storyFlow.flowHealth} (${analysis.storyFlow.completionRate}% completion rate)\n`;
    output += `**Team Efficiency:** ${analysis.teamEfficiency.efficiency} (${analysis.teamEfficiency.utilization}% utilization)\n`;
    output += `**Active Impediments:** ${analysis.impediments.count} (${analysis.impediments.severity} severity)\n\n`;

    // Process Metrics
    output += `## 📊 Process Metrics\n\n`;
    output += `**Lead Time:** ${analysis.processMetrics.leadTime} days\n`;
    output += `**Throughput:** ${analysis.processMetrics.throughput} stories\n`;
    output += `**Work in Progress:** ${analysis.processMetrics.workInProgress} stories\n`;
    output += `**Defect Rate:** ${analysis.processMetrics.defectRate}%\n`;
    output += `**Rework Rate:** ${analysis.processMetrics.reworkRate}%\n\n`;

    // Applied Updates
    output += `## ✅ Applied Updates (${updates.length})\n\n`;
    updates.forEach((update, index) => {
      const icon = update.automatic ? '🤖' : '👤';
      output += `${index + 1}. ${icon} **${update.type}:** ${update.change}\n`;
      output += `   *Reason: ${update.reason}*\n`;
      if (update.validation && update.validation.warnings.length > 0) {
        output += `   ⚠️ Warnings: ${update.validation.warnings.join(', ')}\n`;
      }
      output += '\n';
    });

    // Identified Bottlenecks
    if (analysis.bottlenecks.length > 0) {
      output += `## 🚧 Identified Bottlenecks\n\n`;
      analysis.bottlenecks.forEach((bottleneck, index) => {
        output += `${index + 1}. **${bottleneck.location}** (${bottleneck.severity})\n`;
        output += `   ${bottleneck.description}\n\n`;
      });
    }

    // Optimization Suggestions
    if (optimizations.length > 0) {
      output += `## 🎯 Optimization Suggestions\n\n`;
      optimizations.forEach((opt, index) => {
        output += `${index + 1}. **${opt.area}** - ${opt.suggestion}\n`;
        output += `   Priority: ${opt.priority} | Effort: ${opt.effort} | Impact: ${opt.impact}\n\n`;
      });
    }

    // Recommendations
    output += `## 💡 Recommendations\n\n`;
    recommendations.forEach((rec, index) => {
      const priorityIcon = { high: '🔴', medium: '🟡', low: '🔵' }[rec.priority];
      output += `${index + 1}. ${priorityIcon} **${rec.action}** (${rec.timeline})\n`;
      output += `   ${rec.details}\n\n`;
    });

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. Review and address immediate recommendations\n`;
    output += `2. Monitor workflow metrics for improvements\n`;
    output += `3. Schedule next workflow review for ${workflow.nextReviewDate}\n`;
    output += `4. Implement suggested optimizations\n`;
    output += `5. Track impediment resolution progress\n\n`;

    output += `📁 **Complete workflow update data and analysis saved to project.**`;

    return output;
  },

  async saveWorkflowData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const workflowsDir = join(saDir, 'workflows');
      if (!existsSync(workflowsDir)) {
        require('fs').mkdirSync(workflowsDir, { recursive: true });
      }
      
      const filename = `workflow-update-${context.workflowId}-${Date.now()}.json`;
      const filepath = join(workflowsDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save workflow data:', error.message);
    }
  }
};