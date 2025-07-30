import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saTrackProgress = {
  name: 'sa_track_progress',
  description: 'Track sprint progress with burndown analysis, velocity tracking, team performance metrics, and predictive insights',
  category: 'scrum-master',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      trackingId: { type: 'string', minLength: 1 },
      trackingPeriod: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          sprintId: { type: 'string' },
          trackingType: { type: 'string', enum: ['sprint', 'epic', 'release', 'team'], default: 'sprint' }
        }
      },
      currentData: {
        type: 'object',
        properties: {
          stories: { type: 'array', items: { type: 'object' } },
          team: { type: 'object' },
          velocity: { type: 'array', items: { type: 'number' } },
          burndown: { type: 'array', items: { type: 'object' } },
          metrics: { type: 'object' }
        }
      },
      historicalData: {
        type: 'object',  
        properties: {
          previousSprints: { type: 'array', items: { type: 'object' } },
          teamHistory: { type: 'array', items: { type: 'object' } }
        }
      },
      goals: {
        type: 'object',
        properties: {
          velocityTarget: { type: 'number' },
          completionTarget: { type: 'number' },
          qualityTarget: { type: 'number' }
        }
      },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['trackingId', 'trackingPeriod']
  },

  validate(args) {
    const errors = [];
    if (!args.trackingId?.trim()) errors.push('trackingId is required');
    if (!args.trackingPeriod) errors.push('trackingPeriod is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const trackingContext = {
        trackingId: args.trackingId.trim(),
        trackingPeriod: args.trackingPeriod,
        currentData: args.currentData || {},
        historicalData: args.historicalData || {},
        goals: args.goals || {},
        timestamp: new Date().toISOString(),
        tracker: context?.userId || 'system'
      };

      // Generate burndown analysis
      const burndownAnalysis = await this.generateBurndownAnalysis(trackingContext);
      
      // Calculate velocity metrics
      const velocityMetrics = await this.calculateVelocityMetrics(trackingContext);
      
      // Analyze team performance
      const teamPerformance = await this.analyzeTeamPerformance(trackingContext);
      
      // Generate predictive insights
      const predictions = await this.generatePredictions(trackingContext, burndownAnalysis, velocityMetrics);
      
      // Create progress dashboard
      const dashboard = await this.createProgressDashboard(trackingContext, {
        burndown: burndownAnalysis,
        velocity: velocityMetrics,
        team: teamPerformance,
        predictions
      });
      
      // Generate actionable insights
      const insights = await this.generateInsights(trackingContext, dashboard);
      
      const output = await this.formatProgressOutput(
        trackingContext,
        dashboard,
        insights
      );
      
      await this.saveProgressData(args.projectPath, trackingContext, {
        burndown: burndownAnalysis,
        velocity: velocityMetrics,
        team: teamPerformance,
        predictions,
        dashboard,
        insights
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          trackingId: trackingContext.trackingId,
          trackingType: trackingContext.trackingPeriod.trackingType,
          sprintId: trackingContext.trackingPeriod.sprintId,
          velocityTrend: velocityMetrics.trend,
          burndownHealth: burndownAnalysis.health,
          predictedCompletion: predictions.sprintCompletion.likelihood,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to track progress: ${error.message}` }],
        isError: true
      };
    }
  },

  async generateBurndownAnalysis(context) {
    const stories = context.currentData.stories || [];
    const burndownData = context.currentData.burndown || [];
    
    // Calculate current burndown state
    const totalPoints = stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
    const completedPoints = stories
      .filter(story => story.status === 'done')
      .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;

    // Calculate ideal burndown
    const sprintDays = this.calculateSprintDays(context.trackingPeriod);
    const currentDay = this.calculateCurrentDay(context.trackingPeriod);
    const idealRemaining = Math.max(0, totalPoints - (totalPoints * currentDay / sprintDays));

    // Analyze burndown trend
    const trend = this.analyzeBurndownTrend(burndownData, idealRemaining, remainingPoints);
    
    // Assess burndown health
    const health = this.assessBurndownHealth(remainingPoints, idealRemaining, currentDay, sprintDays);

    return {
      totalPoints,
      completedPoints,
      remainingPoints,
      idealRemaining: Math.round(idealRemaining),
      currentDay,
      sprintDays,
      trend,
      health,
      variance: remainingPoints - idealRemaining,
      completionRate: Math.round((completedPoints / totalPoints) * 100),
      dailyBurndown: this.calculateDailyBurndown(burndownData),
      projectedCompletion: this.projectBurndownCompletion(remainingPoints, sprintDays - currentDay, trend)
    };
  },

  calculateSprintDays(trackingPeriod) {
    if (!trackingPeriod.startDate || !trackingPeriod.endDate) return 14; // Default 2 weeks

    const start = new Date(trackingPeriod.startDate);
    const end = new Date(trackingPeriod.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Exclude weekends (rough calculation)
    return Math.round(diffDays * 5/7);
  },

  calculateCurrentDay(trackingPeriod) {
    if (!trackingPeriod.startDate) return 1;

    const start = new Date(trackingPeriod.startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, Math.round(diffDays * 5/7));
  },

  analyzeBurndownTrend(burndownData, idealRemaining, actualRemaining) {
    if (burndownData.length < 2) return 'insufficient-data';

    const recentTrend = burndownData.slice(-3);
    if (recentTrend.length < 2) return 'insufficient-data';

    const trendSlope = this.calculateTrendSlope(recentTrend);
    
    if (actualRemaining < idealRemaining - 10) return 'ahead-of-schedule';
    if (actualRemaining > idealRemaining + 20) return 'behind-schedule';
    if (trendSlope > 0) return 'slowing-down';
    if (trendSlope < -3) return 'accelerating';
    return 'on-track';
  },

  calculateTrendSlope(dataPoints) {
    if (dataPoints.length < 2) return 0;

    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, _, index) => sum + index, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.remaining, 0);
    const sumXY = dataPoints.reduce((sum, point, index) => sum + index * point.remaining, 0);
    const sumXX = dataPoints.reduce((sum, _, index) => sum + index * index, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  },

  assessBurndownHealth(remaining, ideal, currentDay, totalDays) {
    const timeRemaining = totalDays - currentDay;
    const workRemaining = remaining;
    
    if (timeRemaining <= 0) {
      return workRemaining === 0 ? 'completed' : 'overdue';
    }

    const variance = Math.abs(remaining - ideal);
    const percentageVariance = variance / Math.max(1, ideal) * 100;

    if (percentageVariance < 10) return 'excellent';
    if (percentageVariance < 25) return 'good';
    if (percentageVariance < 50) return 'concerning';
    return 'critical';
  },

  calculateDailyBurndown(burndownData) {
    if (burndownData.length < 2) return [];

    return burndownData.slice(1).map((current, index) => {
      const previous = burndownData[index];
      return {
        day: index + 2,
        burned: previous.remaining - current.remaining,
        remaining: current.remaining
      };
    });
  },

  projectBurndownCompletion(remainingPoints, daysLeft, trend) {
    if (daysLeft <= 0) return { likely: false, confidence: 'high' };
    if (remainingPoints === 0) return { likely: true, confidence: 'high' };

    const dailyBurnRate = this.estimateDailyBurnRate(trend);
    const projectedCompletion = remainingPoints / Math.max(0.1, dailyBurnRate);

    let likely = projectedCompletion <= daysLeft;
    let confidence = 'medium';

    if (Math.abs(projectedCompletion - daysLeft) < 1) confidence = 'high';
    if (Math.abs(projectedCompletion - daysLeft) > 3) confidence = 'low';

    return { likely, confidence, projectedDays: Math.round(projectedCompletion) };
  },

  estimateDailyBurnRate(trend) {
    const burnRates = {
      'ahead-of-schedule': 3.5,
      'on-track': 2.5,
      'behind-schedule': 1.5,
      'slowing-down': 1.0,
      'accelerating': 4.0,
      'insufficient-data': 2.0
    };

    return burnRates[trend] || 2.0;
  },

  async calculateVelocityMetrics(context) {
    const currentVelocity = this.calculateCurrentVelocity(context.currentData.stories);
    const historicalVelocity = context.currentData.velocity || [];
    const previousSprints = context.historicalData.previousSprints || [];

    // Calculate velocity trend
    const velocityTrend = this.calculateVelocityTrend(historicalVelocity);
    
    // Calculate velocity consistency
    const consistency = this.calculateVelocityConsistency(historicalVelocity);
    
    // Compare with goals
    const goalComparison = this.compareWithVelocityGoals(currentVelocity, context.goals.velocityTarget);

    // Predict future velocity
    const predictedVelocity = this.predictFutureVelocity(historicalVelocity, velocityTrend);

    return {
      current: currentVelocity,
      historical: historicalVelocity,
      average: this.calculateAverageVelocity(historicalVelocity),
      trend: velocityTrend,
      consistency,
      goalComparison,
      predicted: predictedVelocity,
      recommendations: this.generateVelocityRecommendations(currentVelocity, historicalVelocity, velocityTrend)
    };
  },

  calculateCurrentVelocity(stories) {
    if (!stories) return 0;
    
    return stories
      .filter(story => story.status === 'done')
      .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  },

  calculateVelocityTrend(velocityHistory) {
    if (velocityHistory.length < 3) return 'insufficient-data';

    const recent = velocityHistory.slice(-3);
    const older = velocityHistory.slice(-6, -3);

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, v) => sum + v, 0) / older.length : recentAvg;

    const changePercent = ((recentAvg - olderAvg) / Math.max(0.1, olderAvg)) * 100;

    if (changePercent > 15) return 'improving';
    if (changePercent < -15) return 'declining';
    if (Math.abs(changePercent) < 5) return 'stable';
    return 'fluctuating';
  },

  calculateVelocityConsistency(velocityHistory) {
    if (velocityHistory.length < 3) return { level: 'unknown', score: 0 };

    const average = velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length;
    const variance = velocityHistory.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / velocityHistory.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = average > 0 ? (standardDeviation / average) * 100 : 0;

    let level = 'high';
    if (coefficientOfVariation > 30) level = 'low';
    else if (coefficientOfVariation > 15) level = 'medium';

    return {
      level,
      score: Math.max(0, 100 - coefficientOfVariation),
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      coefficientOfVariation: Math.round(coefficientOfVariation)
    };
  },

  calculateAverageVelocity(velocityHistory) {
    if (velocityHistory.length === 0) return 0;
    return Math.round(velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length);
  },

  compareWithVelocityGoals(currentVelocity, target) {
    if (!target) return { status: 'no-target', variance: 0 };

    const variance = currentVelocity - target;
    const percentageVariance = (variance / Math.max(0.1, target)) * 100;

    let status = 'on-target';
    if (percentageVariance > 10) status = 'above-target';
    else if (percentageVariance < -10) status = 'below-target';

    return {
      status,
      variance,
      percentageVariance: Math.round(percentageVariance),
      target
    };
  },

  predictFutureVelocity(velocityHistory, trend) {
    if (velocityHistory.length === 0) return { value: 0, confidence: 'none' };

    const average = this.calculateAverageVelocity(velocityHistory);
    let predicted = average;

    // Adjust based on trend
    switch (trend) {
      case 'improving':
        predicted = Math.round(average * 1.1);
        break;
      case 'declining':
        predicted = Math.round(average * 0.9);
        break;
      case 'stable':
        predicted = average;
        break;
      default:
        predicted = average;
    }

    const confidence = velocityHistory.length >= 5 ? 'high' : 
                     velocityHistory.length >= 3 ? 'medium' : 'low';

    return { value: predicted, confidence };
  },

  generateVelocityRecommendations(current, historical, trend) {
    const recommendations = [];

    if (trend === 'declining') {
      recommendations.push('Investigate causes of velocity decline');
      recommendations.push('Consider removing impediments or reducing scope');
    }

    if (trend === 'fluctuating') {
      recommendations.push('Work on improving sprint planning consistency');
      recommendations.push('Focus on more accurate story point estimation');
    }

    if (historical.length < 3) {
      recommendations.push('Collect more sprint data for better velocity tracking');
    }

    return recommendations;
  },

  async analyzeTeamPerformance(context) {
    const team = context.currentData.team || {};
    const stories = context.currentData.stories || [];
    const teamHistory = context.historicalData.teamHistory || [];

    // Calculate team metrics
    const throughput = this.calculateThroughput(stories);
    const cycleTime = this.calculateCycleTime(stories);
    const workDistribution = this.analyzeWorkDistribution(stories, team);
    const collaboration = this.assessCollaboration(stories, team);
    const qualityMetrics = this.calculateQualityMetrics(stories);

    // Compare with historical performance
    const performanceTrend = this.analyzePerformanceTrend(teamHistory, {
      throughput,
      cycleTime,
      quality: qualityMetrics.defectRate
    });

    return {
      throughput,
      cycleTime,
      workDistribution,
      collaboration,
      quality: qualityMetrics,
      trend: performanceTrend,
      capacity: this.analyzeCapacity(team),
      satisfaction: this.estimateTeamSatisfaction(context),
      recommendations: this.generateTeamRecommendations({
        throughput, cycleTime, workDistribution, qualityMetrics, performanceTrend
      })
    };
  },

  calculateThroughput(stories) {
    const completedStories = stories.filter(s => s.status === 'done');
    return {
      stories: completedStories.length,
      points: completedStories.reduce((sum, s) => sum + (s.storyPoints || 0), 0)
    };
  },

  calculateCycleTime(stories) {
    const completedStories = stories.filter(s => 
      s.status === 'done' && s.startDate && s.completedDate
    );

    if (completedStories.length === 0) return { average: 0, details: 'no-data' };

    const cycleTimes = completedStories.map(story => {
      const start = new Date(story.startDate);
      const end = new Date(story.completedDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });

    const average = cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length;
    const min = Math.min(...cycleTimes);
    const max = Math.max(...cycleTimes);

    return {
      average: Math.round(average),
      min,
      max,
      distribution: this.categorizeCycleTimes(cycleTimes)
    };
  },

  categorizeCycleTimes(cycleTimes) {
    const categories = { fast: 0, normal: 0, slow: 0 };
    
    cycleTimes.forEach(time => {
      if (time <= 2) categories.fast++;
      else if (time <= 5) categories.normal++;
      else categories.slow++;
    });

    return categories;
  },

  analyzeWorkDistribution(stories, team) {
    const teamMembers = team.members || [];
    if (teamMembers.length === 0) return { balance: 'unknown', details: {} };

    const workByMember = {};
    teamMembers.forEach(member => {
      workByMember[member.name] = {
        stories: 0,
        points: 0,
        completed: 0
      };
    });

    stories.forEach(story => {
      if (story.assignee && workByMember[story.assignee]) {
        workByMember[story.assignee].stories++;
        workByMember[story.assignee].points += story.storyPoints || 0;
        if (story.status === 'done') {
          workByMember[story.assignee].completed++;
        }
      }
    });

    const workloads = Object.values(workByMember).map(w => w.points);
    const averageWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const maxDeviation = Math.max(...workloads.map(w => Math.abs(w - averageWorkload)));
    
    let balance = 'good';
    if (maxDeviation > averageWorkload * 0.5) balance = 'poor';
    else if (maxDeviation > averageWorkload * 0.3) balance = 'fair';

    return { balance, details: workByMember, averageWorkload: Math.round(averageWorkload) };
  },

  assessCollaboration(stories, team) {
    const collaborativeStories = stories.filter(s => 
      s.collaborators && s.collaborators.length > 1
    ).length;
    
    const totalStories = stories.length;
    const collaborationRate = totalStories > 0 ? (collaborativeStories / totalStories) * 100 : 0;

    let level = 'low';
    if (collaborationRate > 40) level = 'high';
    else if (collaborationRate > 20) level = 'medium';

    return {
      level,
      rate: Math.round(collaborationRate),
      collaborativeStories,
      totalStories
    };
  },

  calculateQualityMetrics(stories) {
    const totalStories = stories.length;
    if (totalStories === 0) return { defectRate: 0, reworkRate: 0, testCoverage: 0 };

    const bugsFound = stories.filter(s => s.type === 'bug' || s.defectsFound > 0).length;
    const reworkStories = stories.filter(s => s.reworkCount > 0).length;
    const testedStories = stories.filter(s => s.testCoverage > 80).length;

    return {
      defectRate: Math.round((bugsFound / totalStories) * 100),
      reworkRate: Math.round((reworkStories / totalStories) * 100),
      testCoverage: Math.round((testedStories / totalStories) * 100)
    };
  },

  analyzePerformanceTrend(teamHistory, currentMetrics) {
    if (teamHistory.length < 2) return 'insufficient-data';

    const recent = teamHistory.slice(-2);
    const throughputTrend = this.compareTrend(recent.map(h => h.throughput), currentMetrics.throughput);
    const cycleTimeTrend = this.compareTrend(recent.map(h => h.cycleTime), currentMetrics.cycleTime, true);
    const qualityTrend = this.compareTrend(recent.map(h => h.quality), currentMetrics.quality, true);

    return {
      throughput: throughputTrend,
      cycleTime: cycleTimeTrend,
      quality: qualityTrend,
      overall: this.calculateOverallTrend([throughputTrend, cycleTimeTrend, qualityTrend])
    };
  },

  compareTrend(historical, current, lowerIsBetter = false) {
    const average = historical.reduce((sum, val) => sum + val, 0) / historical.length;
    const change = ((current - average) / Math.max(0.1, average)) * 100;

    if (lowerIsBetter) {
      if (change < -15) return 'improving';
      if (change > 15) return 'declining';
    } else {
      if (change > 15) return 'improving';
      if (change < -15) return 'declining';
    }
    
    return 'stable';
  },

  calculateOverallTrend(trends) {
    const improving = trends.filter(t => t === 'improving').length;
    const declining = trends.filter(t => t === 'declining').length;

    if (improving > declining) return 'improving';
    if (declining > improving) return 'declining';
    return 'stable';
  },

  analyzeCapacity(team) {
    const totalCapacity = team.capacity || 40;
    const committed = team.committed || 0;
    const utilization = committed > 0 ? (committed / totalCapacity) * 100 : 0;

    let status = 'optimal';
    if (utilization > 95) status = 'overcommitted';
    else if (utilization < 60) status = 'underutilized';
    else if (utilization > 85) status = 'near-capacity';

    return {
      total: totalCapacity,
      committed,
      available: totalCapacity - committed,
      utilization: Math.round(utilization),
      status
    };
  },

  estimateTeamSatisfaction(context) {
    // Simplified satisfaction estimation based on metrics
    const impediments = context.currentData.impediments?.length || 0;
    const velocityTrend = context.currentData.velocityTrend || 'stable';
    
    let score = 75; // Base satisfaction score

    if (impediments > 3) score -= 20;
    if (velocityTrend === 'declining') score -= 15;
    if (velocityTrend === 'improving') score += 10;

    let level = 'good';
    if (score < 50) level = 'poor';
    else if (score < 70) level = 'fair';
    else if (score > 85) level = 'excellent';

    return { level, score: Math.max(0, Math.min(100, score)) };
  },

  generateTeamRecommendations(metrics) {
    const recommendations = [];

    if (metrics.workDistribution.balance === 'poor') {
      recommendations.push('Rebalance work distribution among team members');
    }

    if (metrics.cycleTime.average > 7) {
      recommendations.push('Focus on reducing story cycle time through process improvements');
    }

    if (metrics.qualityMetrics.defectRate > 20) {
      recommendations.push('Implement additional quality assurance measures');
    }

    if (metrics.performanceTrend.overall === 'declining') {
      recommendations.push('Investigate root causes of performance decline');
    }

    return recommendations;
  },

  async generatePredictions(context, burndownAnalysis, velocityMetrics) {
    const sprintCompletion = this.predictSprintCompletion(burndownAnalysis, velocityMetrics);
    const velocityForecast = this.forecastVelocity(velocityMetrics);
    const riskAssessment = this.assessRisks(context, burndownAnalysis, velocityMetrics);

    return {
      sprintCompletion,
      velocityForecast,
      risks: riskAssessment,
      recommendations: this.generatePredictiveRecommendations(sprintCompletion, riskAssessment)
    };
  },

  predictSprintCompletion(burndownAnalysis, velocityMetrics) {
    const timeRemaining = burndownAnalysis.sprintDays - burndownAnalysis.currentDay;
    const workRemaining = burndownAnalysis.remainingPoints;
    
    let likelihood = 'medium';
    let confidence = 'medium';

    if (timeRemaining <= 0) {
      likelihood = workRemaining === 0 ? 'completed' : 'impossible';
      confidence = 'high';
    } else {
      const projectedCompletion = burndownAnalysis.projectedCompletion;
      
      if (projectedCompletion.likely && projectedCompletion.confidence === 'high') {
        likelihood = 'high';
        confidence = 'high';
      } else if (!projectedCompletion.likely) {
        likelihood = 'low';
        confidence = projectedCompletion.confidence;
      }
    }

    return {
      likelihood,
      confidence,
      timeRemaining,
      workRemaining,
      projectedEndDate: this.calculateProjectedEndDate(burndownAnalysis)
    };
  },

  calculateProjectedEndDate(burndownAnalysis) {
    const projectedDays = burndownAnalysis.projectedCompletion.projectedDays || burndownAnalysis.sprintDays;
    const startDate = new Date(); // Simplified - should use actual sprint start
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + projectedDays);
    
    return endDate.toISOString().split('T')[0];
  },

  forecastVelocity(velocityMetrics) {
    return {
      nextSprint: velocityMetrics.predicted,
      trend: velocityMetrics.trend,
      confidence: velocityMetrics.predicted.confidence,
      factors: this.identifyVelocityFactors(velocityMetrics)
    };
  },

  identifyVelocityFactors(velocityMetrics) {
    const factors = [];

    if (velocityMetrics.consistency.level === 'low') {
      factors.push('Inconsistent velocity may indicate planning issues');
    }

    if (velocityMetrics.trend === 'declining') {
      factors.push('Declining trend suggests potential impediments');
    }

    if (velocityMetrics.goalComparison.status === 'below-target') {
      factors.push('Below target velocity may require scope adjustment');
    }

    return factors;
  },

  assessRisks(context, burndownAnalysis, velocityMetrics) {
    const risks = [];

    // Sprint completion risk
    if (burndownAnalysis.health === 'critical') {
      risks.push({
        type: 'sprint-completion',
        level: 'high',
        description: 'Sprint unlikely to complete on time',
        impact: 'Sprint goals not met'
      });
    }

    // Velocity stability risk
    if (velocityMetrics.consistency.level === 'low') {
      risks.push({
        type: 'velocity-instability',
        level: 'medium',
        description: 'Unpredictable velocity affects planning',
        impact: 'Difficulty in future sprint planning'
      });
    }

    // Team capacity risk
    const team = context.currentData.team || {};
    if (team.utilization > 95) {
      risks.push({
        type: 'team-burnout',
        level: 'high',
        description: 'Team operating at maximum capacity',
        impact: 'Potential burnout and quality issues'
      });
    }

    return risks;
  },

  generatePredictiveRecommendations(sprintCompletion, risks) {
    const recommendations = [];

    if (sprintCompletion.likelihood === 'low') {
      recommendations.push('Consider reducing sprint scope to ensure core objectives are met');
      recommendations.push('Identify and remove impediments blocking progress');
    }

    risks.forEach(risk => {
      switch (risk.type) {
        case 'sprint-completion':
          recommendations.push('Implement daily risk mitigation strategies');
          break;
        case 'velocity-instability':
          recommendations.push('Improve story estimation and planning consistency');
          break;
        case 'team-burnout':
          recommendations.push('Reduce workload and improve work-life balance');
          break;
      }
    });

    return recommendations;
  },

  async createProgressDashboard(context, metrics) {
    return {
      overview: {
        sprintId: context.trackingPeriod.sprintId,
        completionPercentage: metrics.burndown.completionRate,
        daysRemaining: metrics.burndown.sprintDays - metrics.burndown.currentDay,
        velocityStatus: metrics.velocity.goalComparison.status,
        teamHealth: metrics.team.satisfaction.level
      },
      burndown: {
        chart: this.createBurndownChartData(metrics.burndown),
        status: metrics.burndown.health,
        trend: metrics.burndown.trend
      },
      velocity: {
        current: metrics.velocity.current,
        average: metrics.velocity.average,
        trend: metrics.velocity.trend,
        predicted: metrics.velocity.predicted.value
      },
      team: {
        throughput: metrics.team.throughput,
        capacity: metrics.team.capacity,
        workDistribution: metrics.team.workDistribution.balance,
        collaboration: metrics.team.collaboration.level
      },
      quality: {
        defectRate: metrics.team.quality.defectRate,
        reworkRate: metrics.team.quality.reworkRate,
        testCoverage: metrics.team.quality.testCoverage
      },
      predictions: metrics.predictions
    };
  },

  createBurndownChartData(burndownAnalysis) {
    const days = Array.from({ length: burndownAnalysis.sprintDays }, (_, i) => i + 1);
    
    return {
      labels: days,
      ideal: days.map(day => Math.max(0, burndownAnalysis.totalPoints - (burndownAnalysis.totalPoints * day / burndownAnalysis.sprintDays))),
      actual: burndownAnalysis.dailyBurndown.map(d => d.remaining),
      projected: this.calculateProjectedBurndown(burndownAnalysis)
    };
  },

  calculateProjectedBurndown(burndownAnalysis) {
    const dailyRate = burndownAnalysis.remainingPoints / Math.max(1, burndownAnalysis.sprintDays - burndownAnalysis.currentDay);
    const remaining = [];
    
    for (let day = burndownAnalysis.currentDay; day <= burndownAnalysis.sprintDays; day++) {
      const daysFromNow = day - burndownAnalysis.currentDay;
      remaining.push(Math.max(0, burndownAnalysis.remainingPoints - (dailyRate * daysFromNow)));
    }
    
    return remaining;
  },

  async generateInsights(context, dashboard) {
    const insights = [];

    // Performance insights
    if (dashboard.velocity.trend === 'improving') {
      insights.push({
        type: 'positive',
        category: 'velocity',
        message: `Team velocity is improving - ${dashboard.velocity.current} points this sprint vs ${dashboard.velocity.average} average`,
        actionable: false
      });
    }

    // Risk insights
    if (dashboard.burndown.status === 'critical') {
      insights.push({
        type: 'warning',
        category: 'burndown',
        message: 'Sprint is significantly behind schedule - immediate action required',
        actionable: true,
        actions: ['Reduce scope', 'Remove impediments', 'Increase focus']
      });
    }

    // Team insights
    if (dashboard.team.workDistribution === 'poor') {
      insights.push({
        type: 'info',
        category: 'team',
        message: 'Work distribution is unbalanced across team members',
        actionable: true,
        actions: ['Rebalance assignments', 'Pair programming', 'Skill sharing']
      });
    }

    // Quality insights
    if (dashboard.quality.defectRate > 20) {
      insights.push({
        type: 'warning',
        category: 'quality',
        message: `High defect rate detected (${dashboard.quality.defectRate}%) - quality measures needed`,
        actionable: true,
        actions: ['Increase code review', 'Add more testing', 'Quality workshops']
      });
    }

    return insights;
  },

  async formatProgressOutput(context, dashboard, insights) {
    let output = `📊 **Sprint Progress Tracking: ${context.trackingPeriod.sprintId || context.trackingId}**\n\n`;
    output += `📅 **Tracking Period:** ${context.trackingPeriod.startDate} to ${context.trackingPeriod.endDate}\n`;
    output += `🎯 **Type:** ${context.trackingPeriod.trackingType}\n`;
    output += `📈 **Completion:** ${dashboard.overview.completionPercentage}%\n`;
    output += `⏰ **Days Remaining:** ${dashboard.overview.daysRemaining}\n\n`;

    // Sprint Overview
    output += `## 📋 Sprint Overview\n\n`;
    output += `**Sprint Health:** ${dashboard.burndown.status.toUpperCase()}\n`;
    output += `**Velocity Status:** ${dashboard.velocity.trend}\n`;
    output += `**Team Health:** ${dashboard.overview.teamHealth}\n`;
    output += `**Predicted Completion:** ${dashboard.predictions.sprintCompletion.likelihood} (${dashboard.predictions.sprintCompletion.confidence} confidence)\n\n`;

    // Burndown Analysis
    output += `## 🔥 Burndown Analysis\n\n`;
    output += `**Total Points:** ${dashboard.burndown.chart.ideal[0]}\n`;
    output += `**Completed:** ${dashboard.velocity.current} points\n`;
    output += `**Remaining:** ${dashboard.burndown.chart.actual[dashboard.burndown.chart.actual.length - 1] || 'TBD'} points\n`;
    output += `**Trend:** ${dashboard.burndown.trend}\n`;
    output += `**Status:** ${dashboard.burndown.status}\n\n`;

    // Velocity Metrics
    output += `## ⚡ Velocity Metrics\n\n`;
    output += `**Current Sprint:** ${dashboard.velocity.current} points\n`;
    output += `**Historical Average:** ${dashboard.velocity.average} points\n`;
    output += `**Trend:** ${dashboard.velocity.trend}\n`;
    output += `**Next Sprint Prediction:** ${dashboard.velocity.predicted} points\n\n`;

    // Team Performance
    output += `## 👥 Team Performance\n\n`;
    output += `**Throughput:** ${dashboard.team.throughput.stories} stories, ${dashboard.team.throughput.points} points\n`;
    output += `**Capacity Utilization:** ${dashboard.team.capacity.utilization}% (${dashboard.team.capacity.status})\n`;
    output += `**Work Distribution:** ${dashboard.team.workDistribution}\n`;
    output += `**Collaboration Level:** ${dashboard.team.collaboration}\n\n`;

    // Quality Metrics
    output += `## 🎯 Quality Metrics\n\n`;
    output += `**Defect Rate:** ${dashboard.quality.defectRate}%\n`;
    output += `**Rework Rate:** ${dashboard.quality.reworkRate}%\n`;
    output += `**Test Coverage:** ${dashboard.quality.testCoverage}%\n\n`;

    // Risk Assessment
    if (dashboard.predictions.risks.length > 0) {
      output += `## ⚠️ Risk Assessment\n\n`;
      dashboard.predictions.risks.forEach((risk, index) => {
        const riskIcon = { low: '🟡', medium: '🟠', high: '🔴' }[risk.level];
        output += `${index + 1}. ${riskIcon} **${risk.type}** (${risk.level})\n`;
        output += `   ${risk.description}\n`;
        output += `   *Impact: ${risk.impact}*\n\n`;
      });
    }

    // Key Insights
    output += `## 💡 Key Insights\n\n`;
    insights.forEach((insight, index) => {
      const insightIcon = { positive: '✅', warning: '⚠️', info: 'ℹ️' }[insight.type];
      output += `${index + 1}. ${insightIcon} **${insight.category.toUpperCase()}:** ${insight.message}\n`;
      if (insight.actionable && insight.actions) {
        output += `   *Actions: ${insight.actions.join(', ')}*\n`;
      }
      output += '\n';
    });

    // Predictions & Recommendations
    output += `## 🔮 Predictions & Recommendations\n\n`;
    dashboard.predictions.recommendations.forEach((rec, index) => {
      output += `${index + 1}. ${rec}\n`;
    });
    output += '\n';

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. Address high-priority risks identified\n`;
    output += `2. Monitor daily progress against burndown projections\n`;
    output += `3. Implement team performance improvements\n`;
    output += `4. Continue tracking metrics for next sprint planning\n`;
    output += `5. Schedule progress review for midpoint check\n\n`;

    output += `📁 **Complete progress tracking data and analytics saved to project.**`;

    return output;
  },

  async saveProgressData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const progressDir = join(saDir, 'progress-tracking');
      if (!existsSync(progressDir)) {
        require('fs').mkdirSync(progressDir, { recursive: true });
      }
      
      const filename = `progress-${context.trackingId}-${Date.now()}.json`;
      const filepath = join(progressDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save progress tracking data:', error.message);
    }
  }
};