import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_correct_course MCP Tool
 * Issue identification, correction planning, remediation workflows, and progress monitoring
 */
export const saCorrectCourse = {
  name: 'sa_correct_course',
  description: 'Identify project issues, plan course corrections, execute remediation workflows, and monitor progress for project recovery',
  category: 'product-owner',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      correctionId: {
        type: 'string',
        description: 'Unique identifier for the course correction',
        minLength: 1
      },
      issueContext: {
        type: 'object',
        description: 'Context of the issue requiring course correction',
        properties: {
          issueType: { 
            type: 'string', 
            enum: ['schedule-delay', 'quality-issues', 'scope-creep', 'resource-constraints', 'technical-blockers', 'stakeholder-concerns', 'team-performance', 'custom'],
            default: 'custom'
          },
          severity: { 
            type: 'string', 
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
          },
          description: { type: 'string' },
          impactArea: { 
            type: 'string', 
            enum: ['timeline', 'budget', 'quality', 'scope', 'team', 'stakeholders', 'all']
          },
          affectedComponents: { type: 'array', items: { type: 'string' } },
          discoveredDate: { type: 'string' },
          reportedBy: { type: 'string' }
        },
        required: ['issueType', 'severity']
      },
      currentState: {
        type: 'object',
        description: 'Current project state and metrics',
        properties: {
          projectHealth: { 
            type: 'string', 
            enum: ['healthy', 'at-risk', 'critical', 'failing']
          },
          schedule: {
            type: 'object',
            properties: {
              originalEndDate: { type: 'string' },
              currentEndDate: { type: 'string' },
              delayDays: { type: 'number' },
              completionPercentage: { type: 'number' }
            }
          },
          budget: {
            type: 'object',
            properties: {
              originalBudget: { type: 'number' },
              spentAmount: { type: 'number' },
              remainingBudget: { type: 'number' },
              projectedOverrun: { type: 'number' }
            }
          },
          quality: {
            type: 'object',
            properties: {
              qualityScore: { type: 'number' },
              defectCount: { type: 'number' },
              testCoverage: { type: 'number' },
              technicalDebt: { type: 'string' }
            }
          },
          team: {
            type: 'object',
            properties: {
              availableCapacity: { type: 'number' },
              utilizationRate: { type: 'number' },
              velocityTrend: { type: 'string' },
              teamMorale: { type: 'string' }
            }
          }
        }
      },
      correctionScope: {
        type: 'string',
        description: 'Scope of the course correction',
        enum: ['immediate', 'sprint', 'milestone', 'project', 'strategic'],
        default: 'sprint'
      },
      correctionStrategy: {
        type: 'string',
        description: 'Strategy for course correction',
        enum: ['scope-reduction', 'resource-addition', 'timeline-extension', 'quality-improvement', 'process-optimization', 'stakeholder-alignment', 'comprehensive'],
        default: 'comprehensive'
      },
      constraints: {
        type: 'object',
        description: 'Constraints for the course correction',
        properties: {
          budgetConstraint: { type: 'number' },
          timeConstraint: { type: 'string' },
          resourceConstraint: { type: 'array', items: { type: 'string' } },
          qualityConstraint: { type: 'number' },
          scopeConstraint: { type: 'boolean' }
        }
      },
      stakeholders: {
        type: 'object',
        description: 'Stakeholder information',
        properties: {
          decisionMakers: { type: 'array', items: { type: 'string' } },
          affectedParties: { type: 'array', items: { type: 'string' } },
          communicationPlan: { type: 'boolean', default: true },
          approvalRequired: { type: 'boolean', default: true }
        }
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      executionMode: {
        type: 'string',
        description: 'How to execute the course correction',
        enum: ['plan-only', 'plan-and-execute', 'monitor-existing'],
        default: 'plan-and-execute'
      }
    },
    required: ['correctionId', 'issueContext']
  },

  validate(args) {
    const errors = [];
    
    if (!args.correctionId || typeof args.correctionId !== 'string') {
      errors.push('correctionId is required and must be a string');
    }
    
    if (args.correctionId && args.correctionId.trim().length === 0) {
      errors.push('correctionId cannot be empty');
    }
    
    if (!args.issueContext || typeof args.issueContext !== 'object') {
      errors.push('issueContext is required and must be an object');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const correctionId = args.correctionId.trim();
    
    try {
      const correctionContext = {
        correctionId,
        issueContext: args.issueContext,
        currentState: args.currentState || {},
        correctionScope: args.correctionScope || 'sprint',
        correctionStrategy: args.correctionStrategy || 'comprehensive',
        constraints: args.constraints || {},
        stakeholders: args.stakeholders || {},
        executionMode: args.executionMode || 'plan-and-execute',
        timestamp: new Date().toISOString(),
        initiator: context?.userId || 'system',
        operationId: `course-correction-${Date.now()}`
      };

      // Issue analysis and root cause identification
      const issueAnalysis = await this.performIssueAnalysis(correctionContext);
      
      // Impact assessment
      const impactAssessment = await this.assessImpact(correctionContext, issueAnalysis);
      
      // Generate correction options
      const correctionOptions = await this.generateCorrectionOptions(correctionContext, issueAnalysis, impactAssessment);
      
      // Select optimal correction plan
      const selectedPlan = await this.selectOptimalPlan(correctionOptions, correctionContext);
      
      // Create detailed correction plan
      const detailedPlan = await this.createDetailedPlan(selectedPlan, correctionContext);
      
      // Risk assessment for the correction plan
      const riskAssessment = await this.assessCorrectionRisks(detailedPlan, correctionContext);
      
      // Stakeholder communication plan
      const communicationPlan = await this.createCommunicationPlan(correctionContext, detailedPlan, impactAssessment);
      
      // Execute based on mode
      let executionResult = null;
      if (correctionContext.executionMode !== 'plan-only') {
        executionResult = await this.executeCorrectionPlan(detailedPlan, correctionContext);
      }
      
      // Monitoring and tracking setup
      const monitoringPlan = await this.setupMonitoring(detailedPlan, correctionContext);
      
      // Success criteria and metrics
      const successCriteria = await this.defineSuccessCriteria(correctionContext, detailedPlan, impactAssessment);
      
      // Generate comprehensive report
      const correctionReport = await this.generateCorrectionReport(
        correctionContext,
        issueAnalysis,
        impactAssessment,
        correctionOptions,
        detailedPlan,
        riskAssessment,
        communicationPlan,
        executionResult,
        monitoringPlan,
        successCriteria
      );
      
      // Format output
      const output = await this.formatCorrectionOutput(
        correctionContext,
        issueAnalysis,
        impactAssessment,
        detailedPlan,
        executionResult,
        correctionReport
      );
      
      // Save correction data
      await this.saveCorrectionResults(projectPath, correctionContext, {
        analysis: issueAnalysis,
        impact: impactAssessment,
        options: correctionOptions,
        plan: detailedPlan,
        risks: riskAssessment,
        communication: communicationPlan,
        execution: executionResult,
        monitoring: monitoringPlan,
        success: successCriteria,
        report: correctionReport
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          correctionId,
          issueType: args.issueContext.issueType,
          severity: args.issueContext.severity,
          correctionStrategy: args.correctionStrategy,
          executionMode: args.executionMode,
          planComplexity: detailedPlan.complexity,
          estimatedDuration: detailedPlan.timeline.totalDuration,
          riskLevel: riskAssessment.overallRisk,
          operationId: correctionContext.operationId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to execute course correction ${correctionId}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, correctionId, projectPath }
      };
    }
  },

  async performIssueAnalysis(context) {
    const analysis = {
      issueType: context.issueContext.issueType,
      severity: context.issueContext.severity,
      rootCauses: [],
      contributingFactors: [],
      symptoms: [],
      trends: {},
      classification: {}
    };

    // Identify root causes based on issue type
    analysis.rootCauses = await this.identifyRootCauses(context.issueContext, context.currentState);
    
    // Identify contributing factors
    analysis.contributingFactors = await this.identifyContributingFactors(context.issueContext, context.currentState);
    
    // Analyze symptoms and patterns
    analysis.symptoms = await this.analyzeSymptoms(context.issueContext, context.currentState);
    
    // Trend analysis
    analysis.trends = await this.analyzeTrends(context.currentState);
    
    // Classify the issue
    analysis.classification = await this.classifyIssue(context.issueContext, analysis);
    
    return analysis;
  },

  async identifyRootCauses(issueContext, currentState) {
    const rootCauses = [];
    
    switch (issueContext.issueType) {
      case 'schedule-delay':
        if (currentState.schedule?.delayDays > 0) {
          rootCauses.push({
            category: 'estimation',
            description: 'Initial time estimates were too optimistic',
            confidence: 0.8,
            evidence: `Project delayed by ${currentState.schedule.delayDays} days`
          });
        }
        
        if (currentState.team?.velocityTrend === 'declining') {
          rootCauses.push({
            category: 'team-performance',
            description: 'Team velocity has been declining',
            confidence: 0.7,
            evidence: 'Velocity trend analysis shows consistent decline'
          });
        }
        break;
        
      case 'quality-issues':
        if (currentState.quality?.defectCount > 10) {
          rootCauses.push({
            category: 'quality-process',
            description: 'Insufficient quality assurance processes',
            confidence: 0.9,
            evidence: `High defect count: ${currentState.quality.defectCount}`
          });
        }
        
        if (currentState.quality?.testCoverage < 70) {
          rootCauses.push({
            category: 'testing',
            description: 'Inadequate test coverage',
            confidence: 0.8,
            evidence: `Test coverage below 70%: ${currentState.quality.testCoverage}%`
          });
        }
        break;
        
      case 'resource-constraints':
        if (currentState.team?.utilizationRate > 90) {
          rootCauses.push({
            category: 'overallocation',
            description: 'Team is overallocated and experiencing burnout',
            confidence: 0.8,
            evidence: `High utilization rate: ${currentState.team.utilizationRate}%`
          });
        }
        
        if (currentState.budget?.projectedOverrun > 0) {
          rootCauses.push({
            category: 'budget-planning',
            description: 'Initial budget estimates were insufficient',
            confidence: 0.7,
            evidence: `Projected budget overrun: ${currentState.budget.projectedOverrun}`
          });
        }
        break;
        
      default:
        rootCauses.push({
          category: 'analysis-needed',
          description: 'Detailed root cause analysis required',
          confidence: 0.5,
          evidence: 'Issue type requires custom analysis'
        });
    }
    
    return rootCauses;
  },

  async identifyContributingFactors(issueContext, currentState) {
    const factors = [];
    
    // Common contributing factors
    if (currentState.team?.teamMorale === 'low') {
      factors.push({
        factor: 'low-team-morale',
        description: 'Low team morale affecting productivity',
        impact: 'medium',
        addressable: true
      });
    }
    
    if (currentState.quality?.technicalDebt === 'high') {
      factors.push({
        factor: 'technical-debt',
        description: 'High technical debt slowing development',
        impact: 'high',
        addressable: true
      });
    }
    
    if (issueContext.affectedComponents && issueContext.affectedComponents.length > 3) {
      factors.push({
        factor: 'complexity',
        description: 'High system complexity affecting multiple components',
        impact: 'medium',
        addressable: false
      });
    }
    
    return factors;
  },

  async analyzeSymptoms(issueContext, currentState) {
    const symptoms = [];
    
    // Schedule symptoms
    if (currentState.schedule?.delayDays > 0) {
      symptoms.push({
        type: 'schedule',
        symptom: 'missed-deadlines',
        description: 'Consistent pattern of missing project deadlines',
        severity: currentState.schedule.delayDays > 30 ? 'high' : 'medium'
      });
    }
    
    // Quality symptoms
    if (currentState.quality?.qualityScore < 70) {
      symptoms.push({
        type: 'quality',
        symptom: 'quality-degradation',
        description: 'Overall quality metrics below acceptable threshold',
        severity: currentState.quality.qualityScore < 50 ? 'high' : 'medium'
      });
    }
    
    // Team symptoms
    if (currentState.team?.velocityTrend === 'declining') {
      symptoms.push({
        type: 'team',
        symptom: 'declining-velocity',
        description: 'Team productivity consistently declining',
        severity: 'medium'
      });
    }
    
    return symptoms;
  },

  async analyzeTrends(currentState) {
    return {
      schedule: {
        trend: currentState.schedule?.delayDays > 0 ? 'deteriorating' : 'stable',
        trajectory: 'concerning',
        projectedOutcome: 'further delays likely without intervention'
      },
      quality: {
        trend: currentState.quality?.qualityScore < 70 ? 'declining' : 'stable',
        trajectory: 'needs-attention',
        projectedOutcome: 'quality issues may increase'
      },
      team: {
        trend: currentState.team?.velocityTrend || 'unknown',
        trajectory: 'variable',
        projectedOutcome: 'performance may continue to fluctuate'
      },
      budget: {
        trend: currentState.budget?.projectedOverrun > 0 ? 'over-budget' : 'on-track',
        trajectory: 'concerning',
        projectedOutcome: 'budget overrun likely'
      }
    };
  },

  async classifyIssue(issueContext, analysis) {
    const urgency = this.calculateUrgency(issueContext.severity, analysis);
    const complexity = this.calculateComplexity(analysis.rootCauses, analysis.contributingFactors);
    const scope = this.calculateScope(issueContext.impactArea, issueContext.affectedComponents);
    
    return {
      urgency,
      complexity,
      scope,
      category: this.determineIssueCategory(urgency, complexity, scope),
      recommended_approach: this.recommendApproach(urgency, complexity, scope)
    };
  },

  calculateUrgency(severity, analysis) {
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    let urgencyScore = severityScores[severity] || 2;
    
    // Adjust based on trends
    if (analysis.trends.schedule?.trend === 'deteriorating') urgencyScore += 1;
    if (analysis.trends.quality?.trend === 'declining') urgencyScore += 1;
    
    if (urgencyScore <= 2) return 'low';
    if (urgencyScore <= 4) return 'medium';
    if (urgencyScore <= 6) return 'high';
    return 'critical';
  },

  calculateComplexity(rootCauses, contributingFactors) {
    const totalFactors = rootCauses.length + contributingFactors.length;
    
    if (totalFactors <= 2) return 'simple';
    if (totalFactors <= 4) return 'moderate';
    if (totalFactors <= 6) return 'complex';
    return 'very-complex';
  },

  calculateScope(impactArea, affectedComponents) {
    let scopeScore = 0;
    
    if (impactArea === 'all') scopeScore += 4;
    else if (['timeline', 'budget', 'quality'].includes(impactArea)) scopeScore += 3;
    else scopeScore += 2;
    
    if (affectedComponents && affectedComponents.length > 3) scopeScore += 2;
    else if (affectedComponents && affectedComponents.length > 1) scopeScore += 1;
    
    if (scopeScore <= 2) return 'limited';
    if (scopeScore <= 4) return 'moderate';
    if (scopeScore <= 6) return 'extensive';
    return 'enterprise-wide';
  },

  determineIssueCategory(urgency, complexity, scope) {
    if (urgency === 'critical' || complexity === 'very-complex') return 'major-incident';
    if (urgency === 'high' && scope === 'extensive') return 'significant-issue';
    if (complexity === 'complex' || scope === 'extensive') return 'complex-problem';
    return 'standard-issue';
  },

  recommendApproach(urgency, complexity, scope) {
    if (urgency === 'critical') return 'immediate-response';
    if (complexity === 'very-complex') return 'structured-analysis';
    if (scope === 'extensive') return 'phased-correction';
    return 'standard-correction';
  },

  async assessImpact(context, analysis) {
    const impact = {
      timeline: await this.assessTimelineImpact(context, analysis),
      budget: await this.assessBudgetImpact(context, analysis),
      quality: await this.assessQualityImpact(context, analysis),
      team: await this.assessTeamImpact(context, analysis),
      stakeholders: await this.assessStakeholderImpact(context, analysis),
      overall: {}
    };
    
    // Calculate overall impact
    impact.overall = await this.calculateOverallImpact(impact);
    
    return impact;
  },

  async assessTimelineImpact(context, analysis) {
    const currentDelay = context.currentState.schedule?.delayDays || 0;
    let additionalDelay = 0;
    
    // Estimate additional delay based on issue type
    switch (context.issueContext.issueType) {
      case 'quality-issues':
        additionalDelay = Math.ceil(currentDelay * 0.3); // 30% additional delay for rework
        break;
      case 'technical-blockers':
        additionalDelay = Math.ceil(currentDelay * 0.5); // 50% additional delay
        break;
      case 'resource-constraints':
        additionalDelay = Math.ceil(currentDelay * 0.4); // 40% additional delay
        break;
      default:
        additionalDelay = Math.ceil(currentDelay * 0.2); // 20% additional delay
    }
    
    return {
      currentDelay,
      projectedAdditionalDelay: additionalDelay,
      totalProjectedDelay: currentDelay + additionalDelay,
      criticalPath: analysis.symptoms.some(s => s.type === 'schedule'),
      mitigationPotential: this.calculateMitigationPotential('timeline', context)
    };
  },

  async assessBudgetImpact(context, analysis) {
    const currentOverrun = context.currentState.budget?.projectedOverrun || 0;
    const remainingBudget = context.currentState.budget?.remainingBudget || 0;
    
    // Estimate additional costs
    let additionalCosts = 0;
    if (context.issueContext.issueType === 'resource-constraints') {
      additionalCosts = remainingBudget * 0.2; // 20% additional costs
    } else if (context.issueContext.issueType === 'quality-issues') {
      additionalCosts = remainingBudget * 0.15; // 15% for rework
    }
    
    return {
      currentOverrun,
      projectedAdditionalCosts: additionalCosts,
      totalProjectedOverrun: currentOverrun + additionalCosts,
      budgetRisk: additionalCosts > remainingBudget * 0.1 ? 'high' : 'medium',
      mitigationPotential: this.calculateMitigationPotential('budget', context)
    };
  },

  async assessQualityImpact(context, analysis) {
    const currentQuality = context.currentState.quality?.qualityScore || 70;
    let qualityDegradation = 0;
    
    if (context.issueContext.issueType === 'schedule-delay') {
      qualityDegradation = 10; // Quality often suffers under time pressure
    } else if (context.issueContext.issueType === 'resource-constraints') {
      qualityDegradation = 15; // Resource constraints directly impact quality
    }
    
    return {
      currentQuality,
      projectedQualityDegradation: qualityDegradation,
      projectedQualityScore: Math.max(0, currentQuality - qualityDegradation),
      riskLevel: qualityDegradation > 10 ? 'high' : 'medium',
      mitigationPotential: this.calculateMitigationPotential('quality', context)
    };
  },

  async assessTeamImpact(context, analysis) {
    const currentMorale = context.currentState.team?.teamMorale || 'medium';
    const utilizationRate = context.currentState.team?.utilizationRate || 80;
    
    return {
      currentMorale,
      utilizationRate,
      burnoutRisk: utilizationRate > 90 ? 'high' : utilizationRate > 80 ? 'medium' : 'low',
      productivityImpact: this.assessProductivityImpact(context.issueContext.issueType),
      teamStability: analysis.contributingFactors.some(f => f.factor === 'low-team-morale') ? 'at-risk' : 'stable',
      mitigationPotential: this.calculateMitigationPotential('team', context)
    };
  },

  assessProductivityImpact(issueType) {
    const impactMap = {
      'schedule-delay': 'medium',
      'quality-issues': 'high',
      'resource-constraints': 'high',
      'technical-blockers': 'very-high',
      'team-performance': 'very-high'
    };
    return impactMap[issueType] || 'medium';
  },

  async assessStakeholderImpact(context, analysis) {
    const decisionMakers = context.stakeholders.decisionMakers || [];
    const affectedParties = context.stakeholders.affectedParties || [];
    
    return {
      decisionMakersCount: decisionMakers.length,
      affectedPartiesCount: affectedParties.length,
      communicationComplexity: decisionMakers.length + affectedParties.length > 5 ? 'high' : 'medium',
      reputationRisk: this.assessReputationRisk(context.issueContext.severity, analysis),
      relationshipImpact: context.issueContext.severity === 'critical' ? 'high' : 'medium'
    };
  },

  assessReputationRisk(severity, analysis) {
    if (severity === 'critical') return 'high';
    if (severity === 'high' && analysis.classification.scope === 'extensive') return 'high';
    return 'medium';
  },

  calculateMitigationPotential(area, context) {
    // Simplified mitigation potential calculation
    const constraints = context.constraints;
    let potential = 'medium';
    
    if (area === 'budget' && constraints.budgetConstraint) {
      potential = 'low';
    } else if (area === 'timeline' && constraints.timeConstraint) {
      potential = 'low';
    } else if (area === 'team' && constraints.resourceConstraint?.length > 0) {
      potential = 'low';
    } else {
      potential = 'high';
    }
    
    return potential;
  },

  async calculateOverallImpact(impact) {
    const scores = {
      timeline: this.impactToScore(impact.timeline.totalProjectedDelay > 30 ? 'high' : 'medium'),
      budget: this.impactToScore(impact.budget.budgetRisk),
      quality: this.impactToScore(impact.quality.riskLevel),
      team: this.impactToScore(impact.team.burnoutRisk),
      stakeholders: this.impactToScore(impact.stakeholders.reputationRisk)
    };
    
    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      overallScore: Math.round(averageScore),
      overallLevel: this.scoreToImpact(averageScore),
      criticalAreas: Object.entries(scores).filter(([_, score]) => score >= 3).map(([area, _]) => area),
      mitigationPriority: this.determineMitigationPriority(scores)
    };
  },

  impactToScore(level) {
    const scoreMap = { low: 1, medium: 2, high: 3, 'very-high': 4, critical: 4 };
    return scoreMap[level] || 2;
  },

  scoreToImpact(score) {
    if (score >= 3.5) return 'critical';
    if (score >= 2.5) return 'high';
    if (score >= 1.5) return 'medium';
    return 'low';
  },

  determineMitigationPriority(scores) {
    const sortedAreas = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([area, _]) => area);
    
    return sortedAreas.slice(0, 3); // Top 3 priority areas
  },

  async generateCorrectionOptions(context, analysis, impact) {
    const options = [];
    
    // Generate options based on correction strategy
    switch (context.correctionStrategy) {
      case 'scope-reduction':
        options.push(...await this.generateScopeReductionOptions(context, analysis, impact));
        break;
      case 'resource-addition':
        options.push(...await this.generateResourceAdditionOptions(context, analysis, impact));
        break;
      case 'timeline-extension':
        options.push(...await this.generateTimelineExtensionOptions(context, analysis, impact));
        break;
      case 'quality-improvement':
        options.push(...await this.generateQualityImprovementOptions(context, analysis, impact));
        break;
      case 'process-optimization':
        options.push(...await this.generateProcessOptimizationOptions(context, analysis, impact));
        break;
      default:
        options.push(...await this.generateComprehensiveOptions(context, analysis, impact));
    }
    
    // Score and rank options
    return this.scoreAndRankOptions(options, context, impact);
  },

  async generateScopeReductionOptions(context, analysis, impact) {
    return [
      {
        id: 'scope-reduction-aggressive',
        title: 'Aggressive Scope Reduction',
        description: 'Remove 30-40% of non-critical features to meet timeline',
        approach: 'scope-reduction',
        effort: 'low',
        timeframe: '1-2 weeks',
        pros: ['Quick impact', 'Reduces complexity', 'Maintains core value'],
        cons: ['Stakeholder pushback', 'Reduced functionality', 'Potential revenue impact'],
        feasibility: context.constraints.scopeConstraint ? 'low' : 'high',
        estimatedImpact: {
          timeline: 'high-positive',
          budget: 'positive',
          quality: 'positive',
          stakeholders: 'negative'
        }
      },
      {
        id: 'scope-reduction-phased',
        title: 'Phased Feature Delivery',
        description: 'Move 20-30% of features to future releases',
        approach: 'scope-reduction',
        effort: 'medium',
        timeframe: '2-3 weeks',
        pros: ['Maintains long-term vision', 'Reduces immediate pressure', 'Allows iterative improvement'],
        cons: ['Complex planning', 'Dependency management', 'Extended overall timeline'],
        feasibility: 'high',
        estimatedImpact: {
          timeline: 'positive',
          budget: 'neutral',
          quality: 'positive',
          stakeholders: 'neutral'
        }
      }
    ];
  },

  async generateResourceAdditionOptions(context, analysis, impact) {
    return [
      {
        id: 'team-augmentation',
        title: 'Team Augmentation',
        description: 'Add 2-3 experienced team members for critical path work',
        approach: 'resource-addition',
        effort: 'high',
        timeframe: '2-4 weeks',
        pros: ['Increases capacity', 'Brings fresh perspective', 'Accelerates delivery'],
        cons: ['High cost', 'Onboarding time', 'Team dynamics'],
        feasibility: context.constraints.budgetConstraint ? 'low' : 'medium',
        estimatedImpact: {
          timeline: 'positive',
          budget: 'negative',
          quality: 'neutral',
          team: 'mixed'
        }
      },
      {
        id: 'specialist-contractors',
        title: 'Specialist Contractors',
        description: 'Hire specialists for specific technical challenges',
        approach: 'resource-addition',
        effort: 'medium',
        timeframe: '1-2 weeks',
        pros: ['Expert knowledge', 'Focused effort', 'Faster problem resolution'],
        cons: ['Higher hourly cost', 'Limited availability', 'Knowledge transfer'],
        feasibility: 'medium',
        estimatedImpact: {
          timeline: 'high-positive',
          budget: 'negative',
          quality: 'positive',
          team: 'neutral'
        }
      }
    ];
  },

  async generateTimelineExtensionOptions(context, analysis, impact) {
    return [
      {
        id: 'timeline-extension-moderate',
        title: 'Moderate Timeline Extension',
        description: 'Extend project timeline by 4-6 weeks',
        approach: 'timeline-extension',
        effort: 'low',
        timeframe: 'immediate',
        pros: ['Reduces pressure', 'Maintains quality', 'No additional costs'],
        cons: ['Stakeholder impact', 'Market timing', 'Opportunity cost'],
        feasibility: context.constraints.timeConstraint ? 'low' : 'high',
        estimatedImpact: {
          timeline: 'neutral',
          budget: 'neutral',
          quality: 'positive',
          stakeholders: 'negative'
        }
      }
    ];
  },

  async generateQualityImprovementOptions(context, analysis, impact) {
    return [
      {
        id: 'quality-sprint',
        title: 'Dedicated Quality Sprint',
        description: 'Allocate 2-3 sprints for technical debt and quality improvements',
        approach: 'quality-improvement',
        effort: 'high',
        timeframe: '4-6 weeks',
        pros: ['Improves foundation', 'Reduces future issues', 'Team morale boost'],
        cons: ['No new features', 'Stakeholder perception', 'Immediate timeline impact'],
        feasibility: 'medium',
        estimatedImpact: {
          timeline: 'negative',
          budget: 'neutral',
          quality: 'high-positive',
          team: 'positive'
        }
      }
    ];
  },

  async generateProcessOptimizationOptions(context, analysis, impact) {
    return [
      {
        id: 'process-streamlining',
        title: 'Development Process Streamlining',
        description: 'Optimize development workflows and reduce bureaucratic overhead',
        approach: 'process-optimization',
        effort: 'medium',
        timeframe: '2-3 weeks',
        pros: ['Improves efficiency', 'Reduces waste', 'Sustainable improvement'],
        cons: ['Change management', 'Initial disruption', 'Cultural resistance'],
        feasibility: 'high',
        estimatedImpact: {
          timeline: 'positive',
          budget: 'neutral',
          quality: 'positive',
          team: 'positive'
        }
      }
    ];
  },

  async generateComprehensiveOptions(context, analysis, impact) {
    return [
      {
        id: 'hybrid-approach',
        title: 'Hybrid Recovery Approach',
        description: 'Combine scope reduction, process optimization, and selective resource addition',
        approach: 'comprehensive',
        effort: 'high',
        timeframe: '3-4 weeks',
        pros: ['Addresses multiple factors', 'Balanced approach', 'Sustainable solution'],
        cons: ['Complex coordination', 'Higher effort', 'Multiple moving parts'],
        feasibility: 'medium',
        estimatedImpact: {
          timeline: 'positive',
          budget: 'mixed',
          quality: 'positive',
          stakeholders: 'neutral'
        }
      }
    ];
  },

  scoreAndRankOptions(options, context, impact) {
    return options.map(option => {
      const score = this.calculateOptionScore(option, context, impact);
      return { ...option, score, rank: 0 };
    }).sort((a, b) => b.score - a.score).map((option, index) => ({
      ...option,
      rank: index + 1
    }));
  },

  calculateOptionScore(option, context, impact) {
    let score = 50; // Base score
    
    // Feasibility impact
    const feasibilityScores = { low: -20, medium: -5, high: 10 };
    score += feasibilityScores[option.feasibility] || 0;
    
    // Effort impact (lower effort is better for quick fixes)
    const effortScores = { low: 10, medium: 5, high: -5 };
    score += effortScores[option.effort] || 0;
    
    // Timeline impact
    if (impact.overall.criticalAreas.includes('timeline') && 
        option.estimatedImpact.timeline.includes('positive')) {
      score += 20;
    }
    
    // Budget constraint consideration
    if (context.constraints.budgetConstraint && 
        option.estimatedImpact.budget === 'negative') {
      score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  },

  async selectOptimalPlan(options, context) {
    // Select highest scoring option that meets constraints
    const feasibleOptions = options.filter(option => option.feasibility !== 'low');
    
    if (feasibleOptions.length === 0) {
      // If no feasible options, select least bad option
      return options[0];
    }
    
    return feasibleOptions[0]; // Highest scoring feasible option
  },

  async createDetailedPlan(selectedOption, context) {
    const plan = {
      optionId: selectedOption.id,
      title: selectedOption.title,
      approach: selectedOption.approach,
      complexity: this.assessPlanComplexity(selectedOption, context),
      phases: await this.createPlanPhases(selectedOption, context),
      timeline: {},
      resources: await this.planResources(selectedOption, context),
      dependencies: await this.identifyPlanDependencies(selectedOption, context),
      milestones: [],
      deliverables: [],
      riskFactors: selectedOption.cons || []
    };
    
    // Calculate timeline
    plan.timeline = await this.calculatePlanTimeline(plan.phases);
    
    // Define milestones
    plan.milestones = await this.definePlanMilestones(plan);
    
    // Define deliverables
    plan.deliverables = await this.definePlanDeliverables(plan, selectedOption);
    
    return plan;
  },

  assessPlanComplexity(option, context) {
    let complexity = 1;
    
    if (option.effort === 'high') complexity += 2;
    else if (option.effort === 'medium') complexity += 1;
    
    if (option.approach === 'comprehensive') complexity += 2;
    
    if (context.stakeholders.decisionMakers?.length > 3) complexity += 1;
    
    if (complexity <= 2) return 'low';
    if (complexity <= 4) return 'medium';
    return 'high';
  },

  async createPlanPhases(option, context) {
    const basePhases = [
      {
        id: 'preparation',
        name: 'Preparation and Setup',
        description: 'Initial setup and stakeholder alignment',
        duration: '3-5 days',
        activities: [
          'Stakeholder communication',
          'Team briefing',
          'Resource allocation',
          'Timeline confirmation'
        ]
      }
    ];
    
    // Add approach-specific phases
    switch (option.approach) {
      case 'scope-reduction':
        basePhases.push({
          id: 'scope-analysis',
          name: 'Scope Analysis and Prioritization',
          description: 'Analyze and prioritize features for reduction',
          duration: '5-7 days',
          activities: [
            'Feature impact analysis',
            'Stakeholder prioritization session',
            'Technical dependency review',
            'Scope reduction plan creation'
          ]
        });
        break;
        
      case 'resource-addition':
        basePhases.push({
          id: 'resource-acquisition',
          name: 'Resource Acquisition and Onboarding',
          description: 'Acquire and onboard additional resources',
          duration: '7-14 days',
          activities: [
            'Resource identification and hiring',
            'Onboarding and training',
            'Team integration',
            'Capacity planning update'
          ]
        });
        break;
    }
    
    basePhases.push({
      id: 'execution',
      name: 'Plan Execution',
      description: 'Execute the correction plan',
      duration: option.timeframe,
      activities: [
        'Plan implementation',
        'Progress monitoring',
        'Issue resolution',
        'Stakeholder updates'
      ]
    });
    
    basePhases.push({
      id: 'validation',
      name: 'Validation and Closure',
      description: 'Validate results and close correction',
      duration: '2-3 days',
      activities: [
        'Results validation',
        'Success criteria assessment',
        'Lessons learned capture',
        'Process improvement recommendations'
      ]
    });
    
    return basePhases;
  },

  async calculatePlanTimeline(phases) {
    const totalDurationDays = phases.reduce((total, phase) => {
      const duration = this.parseDuration(phase.duration);
      return total + duration;
    }, 0);
    
    return {
      totalDuration: `${totalDurationDays} days`,
      totalDurationDays,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + totalDurationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      phases: phases.map((phase, index) => ({
        ...phase,
        startDay: phases.slice(0, index).reduce((sum, p) => sum + this.parseDuration(p.duration), 0) + 1,
        endDay: phases.slice(0, index + 1).reduce((sum, p) => sum + this.parseDuration(p.duration), 0)
      }))
    };
  },

  parseDuration(duration) {
    // Simple duration parser (e.g., "3-5 days" -> 4)
    const match = duration.match(/(\d+)(?:-(\d+))?\s*days?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      return Math.ceil((min + max) / 2);
    }
    return 5; // Default
  },

  async planResources(option, context) {
    const resources = {
      personnel: [],
      budget: 0,
      tools: [],
      external: []
    };
    
    // Plan personnel based on approach
    switch (option.approach) {
      case 'resource-addition':
        resources.personnel.push(
          { role: 'Senior Developer', count: 2, duration: '6-8 weeks' },
          { role: 'Technical Lead', count: 1, duration: '2-3 weeks' }
        );
        resources.budget = 80000; // Estimated cost
        break;
        
      case 'scope-reduction':
        resources.personnel.push(
          { role: 'Product Owner', count: 1, duration: '2-3 weeks' },
          { role: 'Business Analyst', count: 1, duration: '1-2 weeks' }
        );
        resources.budget = 15000;
        break;
        
      default:
        resources.personnel.push(
          { role: 'Project Manager', count: 1, duration: option.timeframe },
          { role: 'Team Lead', count: 1, duration: option.timeframe }
        );
        resources.budget = 25000;
    }
    
    return resources;
  },

  async identifyPlanDependencies(option, context) {
    const dependencies = [];
    
    // Common dependencies
    dependencies.push({
      type: 'approval',
      description: 'Stakeholder approval for plan execution',
      criticality: 'high',
      expectedResolution: '2-3 days'
    });
    
    // Approach-specific dependencies
    if (option.approach === 'resource-addition') {
      dependencies.push({
        type: 'resource',
        description: 'Availability of qualified personnel',
        criticality: 'high',
        expectedResolution: '1-2 weeks'
      });
    }
    
    if (option.approach === 'scope-reduction') {
      dependencies.push({
        type: 'business',
        description: 'Business prioritization decisions',
        criticality: 'critical',
        expectedResolution: '3-5 days'
      });
    }
    
    return dependencies;
  },

  async definePlanMilestones(plan) {
    return [
      {
        id: 'plan-approved',
        name: 'Plan Approved',
        description: 'Correction plan approved by stakeholders',
        targetDay: 3,
        criteria: ['Stakeholder sign-off obtained', 'Resources confirmed', 'Timeline agreed']
      },
      {
        id: 'execution-started',
        name: 'Execution Started',
        description: 'Plan execution begins',
        targetDay: Math.ceil(plan.timeline.totalDurationDays * 0.2),
        criteria: ['Resources mobilized', 'Activities initiated', 'Monitoring in place']
      },
      {
        id: 'halfway-review',
        name: 'Halfway Review',
        description: 'Mid-point progress review',
        targetDay: Math.ceil(plan.timeline.totalDurationDays * 0.5),
        criteria: ['50% of activities completed', 'Progress on track', 'Issues addressed']
      },
      {
        id: 'plan-completed',
        name: 'Plan Completed',
        description: 'Correction plan execution completed',
        targetDay: plan.timeline.totalDurationDays - 2,
        criteria: ['All activities completed', 'Objectives achieved', 'Results validated']
      }
    ];
  },

  async definePlanDeliverables(plan, option) {
    const deliverables = [
      {
        id: 'communication-plan',
        name: 'Stakeholder Communication Plan',
        description: 'Plan for communicating progress and changes',
        dueDay: 2,
        owner: 'Project Manager'
      },
      {
        id: 'progress-reports',
        name: 'Weekly Progress Reports',
        description: 'Regular progress updates for stakeholders',
        dueDay: 'weekly',
        owner: 'Project Manager'
      }
    ];
    
    // Add approach-specific deliverables
    if (option.approach === 'scope-reduction') {
      deliverables.push({
        id: 'scope-reduction-plan',
        name: 'Scope Reduction Plan',
        description: 'Detailed plan for feature scope reduction',
        dueDay: 7,
        owner: 'Product Owner'
      });
    }
    
    deliverables.push({
      id: 'final-report',
      name: 'Course Correction Final Report',
      description: 'Comprehensive report on correction results',
      dueDay: plan.timeline.totalDurationDays,
      owner: 'Project Manager'
    });
    
    return deliverables;
  },

  async assessCorrectionRisks(plan, context) {
    const risks = [];
    
    // Common risks
    risks.push({
      id: 'stakeholder-resistance',
      category: 'stakeholder',
      description: 'Stakeholders may resist proposed changes',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Early engagement and clear communication of benefits',
      owner: 'Project Manager'
    });
    
    risks.push({
      id: 'timeline-slippage',
      category: 'schedule',
      description: 'Correction activities may take longer than planned',
      probability: 'medium',
      impact: 'medium',
      mitigation: 'Buffer time included and regular monitoring',
      owner: 'Project Manager'
    });
    
    // Plan-specific risks
    if (plan.approach === 'resource-addition') {
      risks.push({
        id: 'resource-availability',
        category: 'resource',
        description: 'Required resources may not be available when needed',
        probability: 'high',
        impact: 'high',
        mitigation: 'Early identification and backup options',
        owner: 'Resource Manager'
      });
    }
    
    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(risks);
    
    return {
      overallRisk,
      riskCount: risks.length,
      highRisks: risks.filter(r => r.impact === 'high').length,
      risks,
      mitigationPlan: this.createRiskMitigationPlan(risks)
    };
  },

  calculateOverallRisk(risks) {
    const riskScores = risks.map(risk => {
      const probScore = { low: 1, medium: 2, high: 3 }[risk.probability] || 2;
      const impactScore = { low: 1, medium: 2, high: 3 }[risk.impact] || 2;
      return probScore * impactScore;
    });
    
    const avgRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    if (avgRiskScore <= 2) return 'low';
    if (avgRiskScore <= 4) return 'medium';
    return 'high';
  },

  createRiskMitigationPlan(risks) {
    const highRisks = risks.filter(r => r.impact === 'high' || r.probability === 'high');
    
    return {
      monitoringFrequency: 'weekly',
      escalationCriteria: 'Any high-impact risk probability increases',
      responseTeam: ['Project Manager', 'Team Lead', 'Stakeholder Representative'],
      contingencyPlans: highRisks.map(risk => ({
        riskId: risk.id,
        contingency: `If ${risk.description.toLowerCase()}, then ${risk.mitigation.toLowerCase()}`
      }))
    };
  },

  async createCommunicationPlan(context, plan, impact) {
    const stakeholders = context.stakeholders;
    
    return {
      audiences: await this.identifyAudiences(stakeholders, impact),
      messages: await this.craftKeyMessages(context, plan, impact),
      channels: await this.selectCommunicationChannels(stakeholders),
      timeline: await this.createCommunicationTimeline(plan),
      feedback: await this.planFeedbackCollection(stakeholders)
    };
  },

  async identifyAudiences(stakeholders, impact) {
    const audiences = [];
    
    if (stakeholders.decisionMakers?.length > 0) {
      audiences.push({
        group: 'Decision Makers',
        members: stakeholders.decisionMakers,
        interest: 'high',
        influence: 'high',
        communicationStyle: 'executive-summary',
        frequency: 'bi-weekly'
      });
    }
    
    if (stakeholders.affectedParties?.length > 0) {
      audiences.push({
        group: 'Affected Parties',
        members: stakeholders.affectedParties,
        interest: 'medium',
        influence: 'medium',
        communicationStyle: 'detailed-updates',
        frequency: 'weekly'
      });
    }
    
    audiences.push({
      group: 'Project Team',
      members: ['team-members'],
      interest: 'high',
      influence: 'medium',
      communicationStyle: 'operational-details',
      frequency: 'daily'
    });
    
    return audiences;
  },

  async craftKeyMessages(context, plan, impact) {
    return {
      situation: `We have identified ${context.issueContext.issueType} with ${context.issueContext.severity} severity impact.`,
      action: `We are implementing a ${plan.approach} approach to correct course and recover the project.`,
      benefits: `This plan will address the root causes and mitigate ${impact.overall.overallLevel} impact.`,
      timeline: `The correction plan will take ${plan.timeline.totalDuration} to complete.`,
      next_steps: 'We need stakeholder approval to proceed with immediate implementation.'
    };
  },

  async selectCommunicationChannels(stakeholders) {
    return {
      formal: ['email', 'written-reports', 'presentations'],
      informal: ['meetings', 'calls', 'chat-updates'],
      emergency: ['urgent-email', 'phone-calls', 'emergency-meetings']
    };
  },

  async createCommunicationTimeline(plan) {
    return [
      { event: 'Initial Announcement', timing: 'Day 1', audience: 'all' },
      { event: 'Plan Approval Request', timing: 'Day 2', audience: 'decision-makers' },
      { event: 'Execution Kickoff', timing: `Day ${Math.ceil(plan.timeline.totalDurationDays * 0.1)}`, audience: 'team' },
      { event: 'Progress Updates', timing: 'Weekly', audience: 'all' },
      { event: 'Completion Announcement', timing: `Day ${plan.timeline.totalDurationDays}`, audience: 'all' }
    ];
  },

  async planFeedbackCollection(stakeholders) {
    return {
      mechanisms: ['surveys', 'feedback-sessions', 'regular-check-ins'],
      frequency: 'weekly',
      channels: ['email-surveys', 'one-on-one-meetings', 'team-retrospectives'],
      analysis: 'bi-weekly-analysis-and-action-planning'
    };
  },

  async executeCorrectionPlan(plan, context) {
    if (context.executionMode === 'plan-only') {
      return null;
    }
    
    // Simulate plan execution
    const execution = {
      status: 'in-progress',
      startDate: new Date().toISOString(),
      currentPhase: plan.phases[0].id,
      completedPhases: [],
      completedActivities: [],
      issues: [],
      progress: {
        overallProgress: 0,
        phaseProgress: {},
        milestonesAchieved: []
      }
    };
    
    // Simulate execution progress
    if (context.executionMode === 'plan-and-execute') {
      execution.status = 'completed';
      execution.completedPhases = plan.phases.map(p => p.id);
      execution.progress.overallProgress = 100;
      execution.endDate = new Date(Date.now() + plan.timeline.totalDurationDays * 24 * 60 * 60 * 1000).toISOString();
    }
    
    return execution;
  },

  async setupMonitoring(plan, context) {
    return {
      kpis: await this.defineMonitoringKPIs(context, plan),
      dashboards: await this.setupMonitoringDashboards(plan),
      alerts: await this.configureAlerts(plan),
      reporting: await this.configureReporting(context, plan),
      reviews: await this.scheduleReviews(plan)
    };
  },

  async defineMonitoringKPIs(context, plan) {
    const kpis = [
      {
        name: 'Plan Progress',
        description: 'Percentage of plan activities completed',
        target: '100%',
        frequency: 'daily',
        threshold: { warning: 85, critical: 75 }
      },
      {
        name: 'Timeline Adherence',
        description: 'Plan execution on schedule',
        target: '±2 days',
        frequency: 'weekly',
        threshold: { warning: 3, critical: 5 }
      }
    ];
    
    // Add issue-specific KPIs
    if (context.issueContext.issueType === 'quality-issues') {
      kpis.push({
        name: 'Quality Score Improvement',
        description: 'Improvement in overall quality metrics',
        target: '+20 points',
        frequency: 'weekly',
        threshold: { warning: 10, critical: 5 }
      });
    }
    
    return kpis;
  },

  async setupMonitoringDashboards(plan) {
    return {
      executive: {
        metrics: ['overall-progress', 'timeline-status', 'budget-status', 'risk-level'],
        updateFrequency: 'daily',
        audience: 'decision-makers'
      },
      operational: {
        metrics: ['phase-progress', 'activity-completion', 'resource-utilization', 'issue-count'],
        updateFrequency: 'real-time',
        audience: 'project-team'
      }
    };
  },

  async configureAlerts(plan) {
    return [
      {
        trigger: 'milestone-missed',
        recipients: ['project-manager', 'team-lead'],
        escalation: 'stakeholders-after-24h'
      },
      {
        trigger: 'budget-overrun-risk',
        recipients: ['project-manager', 'financial-controller'],
        escalation: 'decision-makers-immediately'
      },
      {
        trigger: 'quality-degradation',
        recipients: ['quality-lead', 'technical-lead'],
        escalation: 'project-manager-after-4h'
      }
    ];
  },

  async configureReporting(context, plan) {
    return {
      frequency: 'weekly',
      format: 'structured-report',
      distribution: context.stakeholders.decisionMakers || ['project-stakeholders'],
      content: [
        'Progress summary',
        'Milestone status',
        'Risk updates',
        'Issue resolution',
        'Next week focus'
      ]
    };
  },

  async scheduleReviews(plan) {
    return [
      {
        type: 'weekly-progress-review',
        frequency: 'weekly',
        participants: ['project-team'],
        duration: '1 hour'
      },
      {
        type: 'milestone-review',
        frequency: 'per-milestone',
        participants: ['stakeholders', 'project-team'],
        duration: '2 hours'
      },
      {
        type: 'final-review',
        frequency: 'at-completion',
        participants: ['all-stakeholders'],
        duration: '3 hours'
      }
    ];
  },

  async defineSuccessCriteria(context, plan, impact) {
    const criteria = [];
    
    // Primary success criteria based on issue type
    switch (context.issueContext.issueType) {
      case 'schedule-delay':
        criteria.push({
          criterion: 'Timeline Recovery',
          description: 'Reduce project delay by at least 50%',
          measurement: 'days',
          target: Math.ceil((impact.timeline.totalProjectedDelay || 30) * 0.5),
          priority: 'critical'
        });
        break;
        
      case 'quality-issues':
        criteria.push({
          criterion: 'Quality Improvement',
          description: 'Increase quality score to acceptable level',
          measurement: 'score',
          target: 80,
          priority: 'critical'
        });
        break;
        
      case 'resource-constraints':
        criteria.push({
          criterion: 'Resource Optimization',
          description: 'Achieve sustainable team utilization',
          measurement: 'percentage',
          target: 85,
          priority: 'high'
        });
        break;
    }
    
    // Common success criteria
    criteria.push(
      {
        criterion: 'Stakeholder Satisfaction',
        description: 'Maintain stakeholder confidence and support',
        measurement: 'survey-score',
        target: 7,
        priority: 'high'
      },
      {
        criterion: 'Team Morale',
        description: 'Maintain or improve team morale',
        measurement: 'survey-score',
        target: 7,
        priority: 'medium'
      },
      {
        criterion: 'Plan Execution',
        description: 'Complete correction plan on time and budget',
        measurement: 'percentage',
        target: 95,
        priority: 'high'
      }
    );
    
    return {
      criteria,
      measurement_plan: await this.createMeasurementPlan(criteria),
      validation_process: await this.createValidationProcess(criteria)
    };
  },

  async createMeasurementPlan(criteria) {
    return criteria.map(criterion => ({
      criterion: criterion.criterion,
      baseline: 'current-state-measurement',
      measurement_method: this.determineMeasurementMethod(criterion.measurement),
      measurement_frequency: 'weekly',
      data_source: this.determineDataSource(criterion.measurement),
      responsible_party: 'project-manager'
    }));
  },

  determineMeasurementMethod(measurementType) {
    const methods = {
      'days': 'schedule-tracking',
      'score': 'metrics-dashboard',
      'percentage': 'automated-calculation',
      'survey-score': 'stakeholder-survey'
    };
    return methods[measurementType] || 'manual-assessment';
  },

  determineDataSource(measurementType) {
    const sources = {
      'days': 'project-management-tool',
      'score': 'quality-metrics-system',
      'percentage': 'resource-management-system',
      'survey-score': 'feedback-platform'
    };
    return sources[measurementType] || 'manual-collection';
  },

  async createValidationProcess(criteria) {
    return {
      validation_gates: criteria.map(criterion => ({
        gate: `${criterion.criterion}-validation`,
        trigger: 'weekly-measurement',
        validation_method: 'automated-threshold-check',
        escalation: criterion.priority === 'critical' ? 'immediate' : 'next-review'
      })),
      final_validation: {
        timing: 'plan-completion',
        method: 'comprehensive-assessment',
        participants: ['stakeholders', 'project-team'],
        documentation: 'success-criteria-report'
      }
    };
  },

  async generateCorrectionReport(context, analysis, impact, options, plan, risks, communication, execution, monitoring, success) {
    return {
      metadata: {
        correctionId: context.correctionId,
        operationId: context.operationId,
        timestamp: context.timestamp,
        initiator: context.initiator
      },
      executive_summary: {
        issue: `${context.issueContext.issueType} with ${context.issueContext.severity} severity`,
        impact: impact.overall.overallLevel,
        solution: plan.title,
        timeline: plan.timeline.totalDuration,
        success_probability: this.calculateSuccessProbability(plan, risks, context)
      },
      situation_analysis: {
        issue_analysis: analysis,
        impact_assessment: impact,
        root_causes: analysis.rootCauses,
        contributing_factors: analysis.contributingFactors
      },
      solution_design: {
        options_considered: options.length,
        selected_approach: plan.approach,
        plan_details: plan,
        rationale: this.generateSelectionRationale(options[0], context)
      },
      implementation: {
        execution_plan: plan,
        resource_requirements: plan.resources,
        timeline: plan.timeline,
        dependencies: plan.dependencies,
        milestones: plan.milestones
      },
      risk_management: risks,
      communication_strategy: communication,
      monitoring_framework: monitoring,
      success_measurement: success,
      execution_status: execution
    };
  },

  calculateSuccessProbability(plan, risks, context) {
    let probability = 70; // Base probability
    
    // Adjust based on plan complexity
    const complexityAdjustments = { low: 10, medium: 0, high: -15 };
    probability += complexityAdjustments[plan.complexity] || 0;
    
    // Adjust based on risk level
    const riskAdjustments = { low: 10, medium: -5, high: -20 };
    probability += riskAdjustments[risks.overallRisk] || 0;
    
    // Adjust based on constraints
    if (context.constraints.budgetConstraint) probability -= 10;
    if (context.constraints.timeConstraint) probability -= 10;
    
    return Math.max(10, Math.min(95, probability));
  },

  generateSelectionRationale(selectedOption, context) {
    return `Selected ${selectedOption.title} because it offers the best balance of ${selectedOption.pros.slice(0, 2).join(' and ')} 
            while being ${selectedOption.feasibility} feasibility given current constraints.`;
  },

  async formatCorrectionOutput(context, analysis, impact, plan, execution, report) {
    let output = `🔄 **Course Correction: ${context.correctionId}**\n\n`;
    output += `🎯 **Issue Type:** ${context.issueContext.issueType}\n`;
    output += `🚨 **Severity:** ${context.issueContext.severity.toUpperCase()}\n`;
    output += `📊 **Impact Level:** ${impact.overall.overallLevel}\n`;
    output += `⚙️ **Strategy:** ${context.correctionStrategy}\n`;
    output += `🆔 **Operation ID:** ${context.operationId}\n\n`;

    // Issue Analysis Summary
    output += `## 🔍 Issue Analysis\n\n`;
    output += `**Root Causes Identified:** ${analysis.rootCauses.length}\n`;
    analysis.rootCauses.slice(0, 3).forEach((cause, index) => {
      output += `${index + 1}. **${cause.category.toUpperCase()}:** ${cause.description}\n`;
      output += `   *Confidence: ${Math.round(cause.confidence * 100)}%*\n`;
    });
    output += '\n';

    // Impact Assessment
    output += `## 📈 Impact Assessment\n\n`;
    output += `**Overall Impact:** ${impact.overall.overallLevel.toUpperCase()}\n`;
    output += `**Critical Areas:** ${impact.overall.criticalAreas.join(', ')}\n\n`;
    
    output += `**Impact Breakdown:**\n`;
    if (impact.timeline.totalProjectedDelay > 0) {
      output += `• **Timeline:** +${impact.timeline.totalProjectedDelay} days delay\n`;
    }
    if (impact.budget.projectedAdditionalCosts > 0) {
      output += `• **Budget:** $${impact.budget.projectedAdditionalCosts.toLocaleString()} additional cost\n`;
    }
    if (impact.quality.projectedQualityDegradation > 0) {
      output += `• **Quality:** -${impact.quality.projectedQualityDegradation} points degradation\n`;
    }
    output += `• **Team:** ${impact.team.burnoutRisk} burnout risk\n`;
    output += `• **Stakeholders:** ${impact.stakeholders.reputationRisk} reputation risk\n\n`;

    // Selected Solution
    output += `## ✅ Selected Solution\n\n`;
    output += `**Approach:** ${plan.title}\n`;
    output += `**Strategy:** ${plan.approach}\n`;
    output += `**Complexity:** ${plan.complexity}\n`;
    output += `**Timeline:** ${plan.timeline.totalDuration}\n`;
    output += `**Success Probability:** ${report.executive_summary.success_probability}%\n\n`;

    // Plan Phases
    output += `**Execution Phases:**\n`;
    plan.phases.forEach((phase, index) => {
      output += `${index + 1}. **${phase.name}** (${phase.duration})\n`;
      output += `   ${phase.description}\n`;
    });
    output += '\n';

    // Milestones
    output += `## 🎯 Key Milestones\n\n`;
    plan.milestones.slice(0, 4).forEach(milestone => {
      output += `• **${milestone.name}** (Day ${milestone.targetDay})\n`;
      output += `  ${milestone.description}\n`;
    });
    output += '\n';

    // Resource Requirements
    if (plan.resources.personnel.length > 0) {
      output += `## 👥 Resource Requirements\n\n`;
      output += `**Personnel:**\n`;
      plan.resources.personnel.forEach(resource => {
        output += `• ${resource.count}x ${resource.role} (${resource.duration})\n`;
      });
      if (plan.resources.budget > 0) {
        output += `**Budget:** $${plan.resources.budget.toLocaleString()}\n`;
      }
      output += '\n';
    }

    // Risk Management
    output += `## ⚠️ Risk Management\n\n`;
    output += `**Overall Risk Level:** ${report.risk_management.overallRisk.toUpperCase()}\n`;
    output += `**High-Risk Items:** ${report.risk_management.highRisks}\n\n`;
    
    const topRisks = report.risk_management.risks.slice(0, 3);
    if (topRisks.length > 0) {
      output += `**Top Risks:**\n`;
      topRisks.forEach((risk, index) => {
        output += `${index + 1}. **${risk.description}**\n`;
        output += `   Probability: ${risk.probability}, Impact: ${risk.impact}\n`;
        output += `   Mitigation: ${risk.mitigation}\n\n`;
      });
    }

    // Execution Status
    if (execution) {
      output += `## 🏃‍♂️ Execution Status\n\n`;
      output += `**Status:** ${execution.status.toUpperCase()}\n`;
      output += `**Current Phase:** ${execution.currentPhase}\n`;
      output += `**Overall Progress:** ${execution.progress.overallProgress}%\n`;
      
      if (execution.completedPhases.length > 0) {
        output += `**Completed Phases:** ${execution.completedPhases.join(', ')}\n`;
      }
      
      if (execution.issues.length > 0) {
        output += `**Issues:** ${execution.issues.length} active\n`;
      }
      output += '\n';
    }

    // Success Criteria
    output += `## 🎯 Success Criteria\n\n`;
    report.success_measurement.criteria.slice(0, 3).forEach((criterion, index) => {
      output += `${index + 1}. **${criterion.criterion}**\n`;
      output += `   Target: ${criterion.target} ${criterion.measurement}\n`;
      output += `   Priority: ${criterion.priority}\n`;
    });
    output += '\n';

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    if (context.executionMode === 'plan-only') {
      output += `1. Review and approve the course correction plan\n`;
      output += `2. Secure necessary resources and budget approval\n`;
      output += `3. Communicate plan to all stakeholders\n`;
      output += `4. Execute the plan with regular monitoring\n`;
    } else {
      output += `1. Monitor plan execution progress daily\n`;
      output += `2. Address any emerging risks promptly\n`;
      output += `3. Maintain stakeholder communication\n`;
      output += `4. Validate success criteria achievement\n`;
    }
    output += '\n';

    // Best Practices
    output += `## 💡 Course Correction Best Practices\n\n`;
    output += `• Act quickly when issues are identified - early intervention is more effective\n`;
    output += `• Focus on root causes rather than symptoms for lasting solutions\n`;
    output += `• Maintain transparent communication with all stakeholders\n`;
    output += `• Monitor progress closely and be ready to adjust the plan\n`;
    output += `• Document lessons learned for future projects\n`;
    output += `• Balance speed of correction with quality of solution\n\n`;

    output += `📁 **Complete course correction analysis and plan saved to project.**`;

    return output;
  },

  async saveCorrectionResults(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const correctionsDir = join(saDir, 'course-corrections');
      if (!existsSync(correctionsDir)) {
        require('fs').mkdirSync(correctionsDir, { recursive: true });
      }
      
      const filename = `course-correction-${context.correctionId}-${Date.now()}.json`;
      const filepath = join(correctionsDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save course correction results:', error.message);
    }
  }
};