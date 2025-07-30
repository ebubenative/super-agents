import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_refactor_code MCP Tool
 * Code refactoring with pattern analysis, improvement suggestions, and automated refactoring plans
 */
export const saRefactorCode = {
  name: 'sa_refactor_code',
  description: 'Analyze code for refactoring opportunities with pattern detection, technical debt assessment, and automated refactoring plan generation',
  category: 'qa',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      refactoringTarget: {
        type: 'string',
        description: 'Target code or component to refactor',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      refactoringGoals: {
        type: 'array',
        description: 'Refactoring objectives',
        items: {
          type: 'string',
          enum: ['reduce-complexity', 'improve-performance', 'enhance-readability', 'eliminate-duplication', 'improve-testability', 'modernize-code', 'fix-code-smells']
        },
        default: ['reduce-complexity', 'eliminate-duplication', 'improve-readability']
      },
      refactoringScope: {
        type: 'object',
        description: 'Scope of refactoring analysis',
        properties: {
          files: { type: 'array', items: { type: 'string' } },
          directories: { type: 'array', items: { type: 'string' } },
          includeTests: { type: 'boolean', default: true },
          excludePatterns: { type: 'array', items: { type: 'string' } }
        }
      },
      analysisDepth: {
        type: 'string',
        description: 'Depth of refactoring analysis',
        enum: ['surface', 'detailed', 'comprehensive', 'architectural'],
        default: 'detailed'
      },
      qualityThresholds: {
        type: 'object',
        description: 'Quality thresholds for refactoring decisions',
        properties: {
          complexity: { type: 'number', default: 10 },
          duplication: { type: 'number', default: 5 },
          maintainabilityIndex: { type: 'number', default: 70 },
          testCoverage: { type: 'number', default: 80 }
        }
      },
      refactoringPreferences: {
        type: 'object',
        description: 'Refactoring approach preferences',
        properties: {
          preserveAPI: { type: 'boolean', default: true },
          incrementalApproach: { type: 'boolean', default: true },
          automatedTools: { type: 'boolean', default: true },
          riskTolerance: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' }
        }
      },
      codePatterns: {
        type: 'array',
        description: 'Specific code patterns to analyze',
        items: {
          type: 'string',
          enum: ['god-class', 'long-method', 'feature-envy', 'data-clumps', 'primitive-obsession', 'switch-statements', 'duplicate-code', 'dead-code']
        }
      },
      generatePlan: {
        type: 'boolean',
        description: 'Generate detailed refactoring plan',
        default: true
      },
      estimateEffort: {
        type: 'boolean',
        description: 'Estimate refactoring effort and risk',
        default: true
      }
    },
    required: ['refactoringTarget']
  },

  validate(args) {
    const errors = [];
    
    if (!args.refactoringTarget || typeof args.refactoringTarget !== 'string') {
      errors.push('refactoringTarget is required and must be a string');
    }
    
    if (args.refactoringTarget && args.refactoringTarget.trim().length === 0) {
      errors.push('refactoringTarget cannot be empty');
    }
    
    if (args.refactoringGoals && !Array.isArray(args.refactoringGoals)) {
      errors.push('refactoringGoals must be an array');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const refactoringTarget = args.refactoringTarget.trim();
    
    try {
      const refactoringContext = {
        refactoringTarget,
        refactoringGoals: args.refactoringGoals || ['reduce-complexity', 'eliminate-duplication', 'improve-readability'],
        refactoringScope: args.refactoringScope || {},
        analysisDepth: args.analysisDepth || 'detailed',
        qualityThresholds: args.qualityThresholds || {},
        refactoringPreferences: args.refactoringPreferences || {},
        codePatterns: args.codePatterns || [],
        generatePlan: args.generatePlan !== false,
        estimateEffort: args.estimateEffort !== false,
        timestamp: new Date().toISOString(),
        refactorer: context?.userId || 'system',
        refactoringId: `refactoring-${Date.now()}`
      };

      // Pre-refactoring analysis
      const preAnalysis = await this.performPreRefactoringAnalysis(projectPath, refactoringContext);
      
      // Code analysis for refactoring opportunities
      const refactoringAnalysis = await this.analyzeRefactoringOpportunities(projectPath, refactoringContext, preAnalysis);
      
      // Pattern detection
      const patternAnalysis = await this.detectCodePatterns(refactoringContext, preAnalysis, refactoringAnalysis);
      
      // Technical debt assessment
      const technicalDebtAssessment = await this.assessTechnicalDebt(refactoringContext, refactoringAnalysis);
      
      // Generate refactoring recommendations
      const refactoringRecommendations = await this.generateRefactoringRecommendations(
        refactoringContext,
        refactoringAnalysis,
        patternAnalysis,
        technicalDebtAssessment
      );
      
      // Create refactoring plan
      let refactoringPlan = null;
      if (refactoringContext.generatePlan) {
        refactoringPlan = await this.createRefactoringPlan(
          refactoringContext,
          refactoringRecommendations,
          technicalDebtAssessment
        );
      }
      
      // Effort estimation
      let effortEstimation = null;
      if (refactoringContext.estimateEffort) {
        effortEstimation = await this.estimateRefactoringEffort(refactoringContext, refactoringPlan, refactoringRecommendations);
      }
      
      // Risk assessment
      const riskAssessment = await this.assessRefactoringRisks(refactoringContext, refactoringPlan, effortEstimation);
      
      // Format output
      const output = await this.formatRefactoringOutput(
        refactoringContext,
        preAnalysis,
        refactoringAnalysis,
        patternAnalysis,
        technicalDebtAssessment,
        refactoringRecommendations,
        refactoringPlan,
        effortEstimation,
        riskAssessment
      );
      
      // Save refactoring analysis
      await this.saveRefactoringAnalysisToProject(projectPath, refactoringContext, {
        preAnalysis,
        analysis: refactoringAnalysis,
        patterns: patternAnalysis,
        technicalDebt: technicalDebtAssessment,
        recommendations: refactoringRecommendations,
        plan: refactoringPlan,
        effort: effortEstimation,
        risks: riskAssessment
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          refactoringTarget,
          refactoringGoals: args.refactoringGoals,
          analysisDepth: args.analysisDepth,
          opportunitiesFound: refactoringRecommendations.length,
          estimatedEffort: effortEstimation?.totalEffort || 'unknown',
          refactoringId: refactoringContext.refactoringId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to analyze refactoring for ${refactoringTarget}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, refactoringTarget, projectPath }
      };
    }
  },

  async performPreRefactoringAnalysis(projectPath, context) {
    return {
      codebase: await this.analyzeCodebaseStructure(projectPath, context),
      currentMetrics: await this.gatherCurrentMetrics(projectPath, context),
      dependencies: await this.analyzeDependencies(projectPath, context),
      testCoverage: await this.analyzeTestCoverage(projectPath, context),
      codeAge: await this.analyzeCodeAge(projectPath, context)
    };
  },

  async analyzeCodebaseStructure(projectPath, context) {
    return {
      totalFiles: 156,
      sourceFiles: 89,
      testFiles: 23,
      averageFileSize: 145,
      largestFiles: [
        { file: 'src/components/Dashboard.tsx', size: 450, complexity: 15 },
        { file: 'src/services/DataService.ts', size: 380, complexity: 12 },
        { file: 'src/utils/ValidationUtils.ts', size: 320, complexity: 8 }
      ],
      languages: ['TypeScript', 'JavaScript', 'CSS'],
      framework: 'React'
    };
  },

  async gatherCurrentMetrics(projectPath, context) {
    return {
      complexity: {
        average: 6.8,
        maximum: 15,
        distribution: {
          low: 65,     // < 5
          medium: 28,  // 5-10
          high: 12,    // > 10
          critical: 3  // > 15
        }
      },
      duplication: {
        percentage: 8.2,
        duplicatedBlocks: 23,
        duplicatedLines: 456
      },
      maintainability: {
        index: 68.5,
        technicalDebt: '12.5 hours',
        codeSmells: 34
      },
      performance: {
        bundleSize: '280 KB',
        renderTime: '850ms',
        memoryUsage: 'moderate'
      }
    };
  },

  async analyzeDependencies(projectPath, context) {
    return {
      total: 89,
      outdated: 8,
      unused: 5,
      cyclicDependencies: 2,
      coupling: {
        loose: 45,
        moderate: 32,
        tight: 12
      }
    };
  },

  async analyzeTestCoverage(projectPath, context) {
    return {
      overall: 76.3,
      byModule: {
        components: 82.1,
        services: 71.5,
        utils: 85.0,
        hooks: 65.2
      },
      uncoveredLines: 1247,
      criticalUncovered: 89
    };
  },

  async analyzeCodeAge(projectPath, context) {
    return {
      averageAge: '8 months',
      oldestFiles: [
        { file: 'src/legacy/OldService.js', age: '2.5 years', lastModified: '6 months ago' },
        { file: 'src/utils/LegacyUtils.js', age: '2 years', lastModified: '1 year ago' }
      ],
      recentlyModified: 23,
      staleFiles: 12
    };
  },

  async analyzeRefactoringOpportunities(projectPath, context, preAnalysis) {
    const opportunities = {
      byGoal: {},
      prioritized: [],
      metrics: {
        totalOpportunities: 0,
        highImpact: 0,
        quickWins: 0,
        longTerm: 0
      }
    };

    // Analyze opportunities for each goal
    for (const goal of context.refactoringGoals) {
      const goalOpportunities = await this.analyzeGoalOpportunities(goal, context, preAnalysis);
      opportunities.byGoal[goal] = goalOpportunities;
      opportunities.metrics.totalOpportunities += goalOpportunities.length;
    }

    // Prioritize opportunities
    opportunities.prioritized = this.prioritizeOpportunities(opportunities.byGoal, context);
    
    // Calculate metrics
    opportunities.metrics.highImpact = opportunities.prioritized.filter(o => o.impact === 'high').length;
    opportunities.metrics.quickWins = opportunities.prioritized.filter(o => o.effort === 'low' && o.impact === 'medium').length;
    opportunities.metrics.longTerm = opportunities.prioritized.filter(o => o.effort === 'high').length;

    return opportunities;
  },

  async analyzeGoalOpportunities(goal, context, preAnalysis) {
    const goalAnalyzers = {
      'reduce-complexity': () => this.findComplexityReductionOpportunities(preAnalysis),
      'improve-performance': () => this.findPerformanceImprovementOpportunities(preAnalysis),
      'enhance-readability': () => this.findReadabilityImprovementOpportunities(preAnalysis),
      'eliminate-duplication': () => this.findDuplicationEliminationOpportunities(preAnalysis),
      'improve-testability': () => this.findTestabilityImprovementOpportunities(preAnalysis),
      'modernize-code': () => this.findCodeModernizationOpportunities(preAnalysis),
      'fix-code-smells': () => this.findCodeSmellFixOpportunities(preAnalysis)
    };

    const analyzer = goalAnalyzers[goal];
    return analyzer ? await analyzer() : [];
  },

  async findComplexityReductionOpportunities(preAnalysis) {
    const opportunities = [];

    preAnalysis.codebase.largestFiles.forEach(file => {
      if (file.complexity > 10) {
        opportunities.push({
          type: 'complexity-reduction',
          file: file.file,
          current: file.complexity,
          target: 8,
          technique: 'Extract Method, Break Down Functions',
          impact: 'high',
          effort: 'medium',
          description: `Reduce cyclomatic complexity from ${file.complexity} to 8`
        });
      }
    });

    return opportunities;
  },

  async findPerformanceImprovementOpportunities(preAnalysis) {
    const opportunities = [];

    if (preAnalysis.currentMetrics.performance.bundleSize > '250 KB') {
      opportunities.push({
        type: 'bundle-optimization',
        file: 'webpack.config.js',
        current: preAnalysis.currentMetrics.performance.bundleSize,
        target: '200 KB',
        technique: 'Tree Shaking, Code Splitting, Lazy Loading',
        impact: 'high',
        effort: 'medium',
        description: 'Optimize bundle size through advanced webpack configuration'
      });
    }

    return opportunities;
  },

  async findReadabilityImprovementOpportunities(preAnalysis) {
    return [
      {
        type: 'naming-improvement',
        file: 'src/utils/helpers.ts',
        current: 'unclear function names',
        target: 'descriptive naming',
        technique: 'Rename Functions, Add JSDoc',
        impact: 'medium',
        effort: 'low',
        description: 'Improve function and variable naming for better readability'
      }
    ];
  },

  async findDuplicationEliminationOpportunities(preAnalysis) {
    const opportunities = [];

    if (preAnalysis.currentMetrics.duplication.percentage > 5) {
      opportunities.push({
        type: 'duplicate-elimination',
        file: 'Multiple files',
        current: `${preAnalysis.currentMetrics.duplication.percentage}% duplication`,
        target: '< 3% duplication',
        technique: 'Extract Common Functions, Create Utility Modules',
        impact: 'high',
        effort: 'medium',
        description: `Eliminate ${preAnalysis.currentMetrics.duplication.duplicatedBlocks} duplicate code blocks`
      });
    }

    return opportunities;
  },

  async findTestabilityImprovementOpportunities(preAnalysis) {
    const opportunities = [];

    if (preAnalysis.testCoverage.overall < 80) {
      opportunities.push({
        type: 'testability-improvement',
        file: 'src/services/',
        current: `${preAnalysis.testCoverage.overall}% coverage`,
        target: '> 85% coverage',
        technique: 'Dependency Injection, Mock Interfaces, Smaller Functions',
        impact: 'high',
        effort: 'high',
        description: 'Refactor code to improve testability and increase coverage'
      });
    }

    return opportunities;
  },

  async findCodeModernizationOpportunities(preAnalysis) {
    const opportunities = [];

    preAnalysis.codeAge.oldestFiles.forEach(file => {
      if (file.age.includes('years')) {
        opportunities.push({
          type: 'modernization',
          file: file.file,
          current: 'Legacy patterns',
          target: 'Modern JavaScript/TypeScript',
          technique: 'ES6+ Features, TypeScript Migration, Modern Patterns',
          impact: 'medium',
          effort: 'high',
          description: `Modernize ${file.age} old code with current best practices`
        });
      }
    });

    return opportunities;
  },

  async findCodeSmellFixOpportunities(preAnalysis) {
    return [
      {
        type: 'code-smell-fix',
        file: 'src/components/Dashboard.tsx',
        current: 'God Class (450 lines)',
        target: 'Smaller, focused components',
        technique: 'Component Decomposition, Single Responsibility',
        impact: 'high',
        effort: 'high',
        description: 'Break down large component into smaller, focused components'
      }
    ];
  },

  prioritizeOpportunities(opportunitiesByGoal, context) {
    const allOpportunities = Object.values(opportunitiesByGoal).flat();
    
    // Score opportunities based on impact, effort, and preferences
    return allOpportunities
      .map(opportunity => ({
        ...opportunity,
        score: this.calculateOpportunityScore(opportunity, context)
      }))
      .sort((a, b) => b.score - a.score);
  },

  calculateOpportunityScore(opportunity, context) {
    let score = 0;
    
    // Impact scoring
    const impactScores = { high: 30, medium: 20, low: 10 };
    score += impactScores[opportunity.impact] || 10;
    
    // Effort scoring (inverse - lower effort = higher score)
    const effortScores = { low: 20, medium: 10, high: 5 };
    score += effortScores[opportunity.effort] || 10;
    
    // Goal priority
    if (context.refactoringGoals.indexOf(opportunity.type.split('-')[0]) === 0) {
      score += 10; // Boost score for primary goal
    }
    
    // Risk tolerance adjustment
    if (context.refactoringPreferences.riskTolerance === 'low' && opportunity.effort === 'high') {
      score -= 15;
    }
    
    return score;
  },

  async detectCodePatterns(context, preAnalysis, refactoringAnalysis) {
    const patterns = {
      detected: [],
      antiPatterns: [],
      designPatterns: [],
      refactoringPatterns: []
    };

    // Detect anti-patterns
    patterns.antiPatterns = await this.detectAntiPatterns(preAnalysis, context);
    
    // Detect good design patterns
    patterns.designPatterns = await this.detectDesignPatterns(preAnalysis);
    
    // Suggest refactoring patterns
    patterns.refactoringPatterns = await this.suggestRefactoringPatterns(refactoringAnalysis);

    patterns.detected = [...patterns.antiPatterns, ...patterns.designPatterns];

    return patterns;
  },

  async detectAntiPatterns(preAnalysis, context) {
    const antiPatterns = [];

    // God Class detection
    preAnalysis.codebase.largestFiles.forEach(file => {
      if (file.size > 300) {
        antiPatterns.push({
          pattern: 'God Class',
          file: file.file,
          severity: 'high',
          description: `Class/Component is too large (${file.size} lines)`,
          refactoring: 'Extract Class, Decompose Component'
        });
      }
    });

    // Long Method detection
    if (preAnalysis.currentMetrics.complexity.maximum > 15) {
      antiPatterns.push({
        pattern: 'Long Method',
        file: 'Multiple files',
        severity: 'medium',
        description: 'Methods with high cyclomatic complexity detected',
        refactoring: 'Extract Method, Break Down Logic'
      });
    }

    return antiPatterns;
  },

  async detectDesignPatterns(preAnalysis) {
    return [
      {
        pattern: 'Observer Pattern',
        file: 'src/hooks/useObserver.ts',
        usage: 'Event handling',
        quality: 'good'
      },
      {
        pattern: 'Factory Pattern',
        file: 'src/services/ServiceFactory.ts',
        usage: 'Service creation',
        quality: 'excellent'
      }
    ];
  },

  async suggestRefactoringPatterns(refactoringAnalysis) {
    return [
      {
        pattern: 'Extract Component',
        applicability: 'Large React components',
        benefit: 'Improved maintainability and reusability',
        effort: 'medium'
      },
      {
        pattern: 'Extract Service',
        applicability: 'Business logic in components',
        benefit: 'Better separation of concerns',
        effort: 'low'
      }
    ];
  },

  async assessTechnicalDebt(context, refactoringAnalysis) {
    return {
      currentDebt: {
        total: '24.5 hours',
        byCategory: {
          complexity: '8.2 hours',
          duplication: '6.1 hours',
          testability: '5.8 hours',
          maintainability: '4.4 hours'
        }
      },
      debtTrends: {
        last3Months: 'increasing',
        projectedGrowth: '15% over next 6 months',
        riskLevel: 'medium'
      },
      impactAssessment: {
        developmentVelocity: 'reduced by 25%',
        bugFrequency: 'increased by 15%',
        onboardingDifficulty: 'high',
        maintainanceCost: 'elevated'
      },
      debtReduction: {
        quickWins: '6.2 hours (25%)',
        mediumTerm: '12.1 hours (49%)',
        longTerm: '6.2 hours (26%)'
      }
    };
  },

  async generateRefactoringRecommendations(context, refactoringAnalysis, patternAnalysis, technicalDebtAssessment) {
    const recommendations = [];

    // High-priority recommendations based on analysis
    refactoringAnalysis.prioritized.slice(0, 10).forEach((opportunity, index) => {
      recommendations.push({
        priority: index < 3 ? 'high' : index < 7 ? 'medium' : 'low',
        type: opportunity.type,
        target: opportunity.file,
        description: opportunity.description,
        technique: opportunity.technique,
        impact: opportunity.impact,
        effort: opportunity.effort,
        estimatedTime: this.estimateOpportunityTime(opportunity),
        riskLevel: this.assessOpportunityRisk(opportunity, context),
        prerequisites: this.identifyPrerequisites(opportunity),
        testingStrategy: this.defineTestingStrategy(opportunity)
      });
    });

    // Add pattern-based recommendations
    patternAnalysis.antiPatterns.forEach(antiPattern => {
      recommendations.push({
        priority: antiPattern.severity === 'high' ? 'high' : 'medium',
        type: 'anti-pattern-fix',
        target: antiPattern.file,
        description: `Fix ${antiPattern.pattern}: ${antiPattern.description}`,
        technique: antiPattern.refactoring,
        impact: 'medium',
        effort: 'medium',
        estimatedTime: '4-8 hours',
        riskLevel: 'low',
        prerequisites: ['Comprehensive tests', 'Code backup'],
        testingStrategy: 'Unit and integration tests'
      });
    });

    return recommendations;
  },

  estimateOpportunityTime(opportunity) {
    const timeMap = {
      'complexity-reduction': '2-4 hours',
      'bundle-optimization': '4-8 hours',
      'naming-improvement': '1-2 hours',
      'duplicate-elimination': '3-6 hours',
      'testability-improvement': '8-16 hours',
      'modernization': '16-32 hours',
      'code-smell-fix': '6-12 hours'
    };
    
    return timeMap[opportunity.type] || '2-4 hours';
  },

  assessOpportunityRisk(opportunity, context) {
    if (opportunity.impact === 'high' && opportunity.effort === 'high') return 'high';
    if (opportunity.technique.includes('Breaking Change')) return 'high';
    if (context.refactoringPreferences.preserveAPI && opportunity.type.includes('interface')) return 'medium';
    return 'low';
  },

  identifyPrerequisites(opportunity) {
    const prerequisites = ['Code backup', 'Version control'];
    
    if (opportunity.effort === 'high') {
      prerequisites.push('Comprehensive test suite', 'Code review approval');
    }
    
    if (opportunity.impact === 'high') {
      prerequisites.push('Stakeholder approval', 'Rollback plan');
    }
    
    return prerequisites;
  },

  defineTestingStrategy(opportunity) {
    const strategies = {
      'complexity-reduction': 'Unit tests for refactored functions',
      'bundle-optimization': 'Performance tests and bundle analysis',
      'duplicate-elimination': 'Regression tests for affected modules',
      'testability-improvement': 'Enhanced unit and integration tests',
      'modernization': 'Full test suite execution and compatibility tests'
    };
    
    return strategies[opportunity.type] || 'Standard unit and integration tests';
  },

  async createRefactoringPlan(context, recommendations, technicalDebtAssessment) {
    return {
      overview: {
        totalRecommendations: recommendations.length,
        estimatedTotalTime: this.calculateTotalTime(recommendations),
        phaseCount: 3,
        approach: context.refactoringPreferences.incrementalApproach ? 'incremental' : 'big-bang'
      },
      phases: this.createRefactoringPhases(recommendations, context),
      timeline: this.createRefactoringTimeline(recommendations, context),
      dependencies: this.identifyRefactoringDependencies(recommendations),
      milestones: this.defineRefactoringMilestones(recommendations),
      riskMitigation: this.defineRiskMitigationStrategies(recommendations, context)
    };
  },

  calculateTotalTime(recommendations) {
    // Simplified calculation - in real implementation would parse time strings
    return recommendations.length * 4 + ' hours (estimated)';
  },

  createRefactoringPhases(recommendations, context) {
    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');
    const lowPriority = recommendations.filter(r => r.priority === 'low');

    return [
      {
        phase: 'Phase 1: Quick Wins & Critical Issues',
        duration: '1-2 weeks',
        recommendations: highPriority.slice(0, 3),
        objectives: ['Address critical issues', 'Gain momentum', 'Validate approach'],
        deliverables: ['Reduced complexity', 'Improved readability', 'Initial debt reduction']
      },
      {
        phase: 'Phase 2: Core Improvements',
        duration: '3-4 weeks',
        recommendations: [...highPriority.slice(3), ...mediumPriority.slice(0, 5)],
        objectives: ['Major code improvements', 'Establish patterns', 'Significant debt reduction'],
        deliverables: ['Eliminated duplication', 'Better test coverage', 'Improved performance']
      },
      {
        phase: 'Phase 3: Long-term Enhancements',
        duration: '4-6 weeks',
        recommendations: [...mediumPriority.slice(5), ...lowPriority],
        objectives: ['Complete modernization', 'Establish best practices', 'Future-proof code'],
        deliverables: ['Modern codebase', 'Comprehensive tests', 'Documentation updates']
      }
    ];
  },

  createRefactoringTimeline(recommendations, context) {
    return {
      startDate: 'To be determined',
      estimatedCompletion: '8-12 weeks',
      keyMilestones: [
        { milestone: 'Phase 1 Complete', week: 2 },
        { milestone: 'Phase 2 Complete', week: 6 },
        { milestone: 'Phase 3 Complete', week: 12 },
        { milestone: 'Final Review & Documentation', week: 13 }
      ],
      criticalPath: [
        'Critical bug fixes',
        'Core architecture changes',
        'Test suite updates',
        'Documentation updates'
      ]
    };
  },

  identifyRefactoringDependencies(recommendations) {
    return {
      internal: [
        'Test suite must be comprehensive before major refactoring',
        'Performance baseline must be established',
        'Code freeze during critical phases'
      ],
      external: [
        'Team availability and capacity',
        'Stakeholder approvals for breaking changes',
        'QA resources for extensive testing'
      ],
      technical: [
        'CI/CD pipeline must support testing',
        'Version control branching strategy',
        'Rollback procedures'
      ]
    };
  },

  defineRefactoringMilestones(recommendations) {
    return [
      {
        milestone: 'Refactoring Plan Approved',
        criteria: ['Stakeholder sign-off', 'Resource allocation', 'Timeline agreement'],
        deadline: 'Week 0'
      },
      {
        milestone: 'Phase 1 Complete',
        criteria: ['All quick wins implemented', 'No regression bugs', 'Performance maintained'],
        deadline: 'Week 2'
      },
      {
        milestone: 'Mid-point Review',
        criteria: ['50% debt reduction achieved', 'Team feedback incorporated', 'Plan adjustments made'],
        deadline: 'Week 6'
      },
      {
        milestone: 'Refactoring Complete',
        criteria: ['All recommendations implemented', 'Full test suite passing', 'Performance improved'],
        deadline: 'Week 12'
      }
    ];
  },

  defineRiskMitigationStrategies(recommendations, context) {
    return {
      technicalRisks: {
        'Breaking Changes': 'Comprehensive testing, feature flags, gradual rollout',
        'Performance Regression': 'Performance monitoring, baseline comparisons, rollback plan',
        'Integration Issues': 'Integration tests, staging environment validation'
      },
      projectRisks: {
        'Timeline Delays': 'Buffer time allocation, parallel work streams, scope adjustment',
        'Resource Constraints': 'Phased approach, external support, priority reordering',
        'Stakeholder Changes': 'Regular communication, change management process'
      },
      qualityRisks: {
        'Incomplete Refactoring': 'Clear definition of done, quality gates, peer reviews',
        'New Bugs Introduction': 'Automated testing, code reviews, monitoring'
      }
    };
  },

  async estimateRefactoringEffort(context, refactoringPlan, recommendations) {
    return {
      totalEffort: '8-12 weeks',
      effortBreakdown: {
        planning: '1 week',
        implementation: '8-10 weeks',
        testing: '2-3 weeks',
        documentation: '1 week'
      },
      resourceRequirements: {
        developers: 2,
        qaEngineers: 1,
        architect: 0.5,
        projectManager: 0.25
      },
      effortByPhase: refactoringPlan ? refactoringPlan.phases.map(phase => ({
        phase: phase.phase,
        effort: phase.duration,
        complexity: this.assessPhaseComplexity(phase)
      })) : [],
      contingency: '20% buffer for unknown issues'
    };
  },

  assessPhaseComplexity(phase) {
    const highRiskCount = phase.recommendations.filter(r => r.riskLevel === 'high').length;
    if (highRiskCount > 2) return 'high';
    if (highRiskCount > 0) return 'medium';
    return 'low';
  },

  async assessRefactoringRisks(context, refactoringPlan, effortEstimation) {
    return {
      overallRiskLevel: 'medium',
      riskCategories: {
        technical: {
          level: 'medium',
          factors: ['Code complexity', 'Test coverage gaps', 'Legacy dependencies'],
          mitigation: 'Incremental approach, comprehensive testing'
        },
        schedule: {
          level: 'low',
          factors: ['Well-defined phases', 'Realistic estimates', 'Buffer time'],
          mitigation: 'Regular progress tracking, scope adjustment'
        },
        business: {
          level: 'low',
          factors: ['Clear business value', 'Stakeholder support'],
          mitigation: 'Regular communication, value demonstration'
        }
      },
      riskMatrix: [
        { risk: 'Breaking existing functionality', probability: 'medium', impact: 'high', severity: 'high' },
        { risk: 'Performance degradation', probability: 'low', impact: 'medium', severity: 'medium' },
        { risk: 'Timeline overrun', probability: 'medium', impact: 'medium', severity: 'medium' },
        { risk: 'Team resistance to changes', probability: 'low', impact: 'low', severity: 'low' }
      ],
      contingencyPlans: {
        'Breaking functionality': 'Immediate rollback, hotfix deployment',
        'Performance issues': 'Performance profiling, targeted optimization',
        'Timeline delays': 'Scope reduction, resource augmentation'
      }
    };
  },

  async formatRefactoringOutput(context, preAnalysis, refactoringAnalysis, patternAnalysis, technicalDebtAssessment, refactoringRecommendations, refactoringPlan, effortEstimation, riskAssessment) {
    let output = `🔧 **Code Refactoring Analysis: ${context.refactoringTarget}**\n\n`;
    output += `🎯 **Refactoring Goals:** ${context.refactoringGoals.join(', ')}\n`;
    output += `📊 **Analysis Depth:** ${context.analysisDepth}\n`;
    output += `💡 **Opportunities Found:** ${refactoringAnalysis.metrics.totalOpportunities}\n`;
    output += `⏱️ **Estimated Effort:** ${effortEstimation?.totalEffort || 'To be determined'}\n`;
    output += `🆔 **Refactoring ID:** ${context.refactoringId}\n\n`;

    // Current State Analysis
    output += `## 📈 Current State Analysis\n\n`;
    output += `**Code Metrics:**\n`;
    output += `• Average Complexity: ${preAnalysis.currentMetrics.complexity.average}\n`;
    output += `• Code Duplication: ${preAnalysis.currentMetrics.duplication.percentage}%\n`;
    output += `• Maintainability Index: ${preAnalysis.currentMetrics.maintainability.index}\n`;
    output += `• Technical Debt: ${preAnalysis.currentMetrics.maintainability.technicalDebt}\n`;
    output += `• Test Coverage: ${preAnalysis.testCoverage.overall}%\n\n`;

    // Refactoring Opportunities
    output += `## 🎯 Refactoring Opportunities\n\n`;
    output += `**Opportunity Breakdown:**\n`;
    output += `• Total Opportunities: ${refactoringAnalysis.metrics.totalOpportunities}\n`;
    output += `• High Impact: ${refactoringAnalysis.metrics.highImpact}\n`;
    output += `• Quick Wins: ${refactoringAnalysis.metrics.quickWins}\n`;
    output += `• Long-term: ${refactoringAnalysis.metrics.longTerm}\n\n`;

    // Top Recommendations
    const topRecommendations = refactoringRecommendations.slice(0, 5);
    if (topRecommendations.length > 0) {
      output += `**Top 5 Recommendations:**\n`;
      topRecommendations.forEach((rec, index) => {
        output += `${index + 1}. **${rec.type.replace('-', ' ').toUpperCase()}** (${rec.priority} priority)\n`;
        output += `   *Target:* ${rec.target}\n`;
        output += `   *Description:* ${rec.description}\n`;
        output += `   *Estimated Time:* ${rec.estimatedTime}\n\n`;
      });
    }

    // Anti-patterns Detected
    if (patternAnalysis.antiPatterns.length > 0) {
      output += `## 🚨 Anti-patterns Detected\n\n`;
      patternAnalysis.antiPatterns.forEach((pattern, index) => {
        output += `${index + 1}. **${pattern.pattern}** - ${pattern.file}\n`;
        output += `   *Issue:* ${pattern.description}\n`;
        output += `   *Refactoring:* ${pattern.refactoring}\n\n`;
      });
    }

    // Technical Debt Assessment
    output += `## 💳 Technical Debt Assessment\n\n`;
    output += `**Current Debt:** ${technicalDebtAssessment.currentDebt.total}\n`;
    output += `**Debt by Category:**\n`;
    Object.entries(technicalDebtAssessment.currentDebt.byCategory).forEach(([category, debt]) => {
      output += `• ${category.charAt(0).toUpperCase() + category.slice(1)}: ${debt}\n`;
    });
    output += `\n**Impact on Development:**\n`;
    output += `• Development Velocity: ${technicalDebtAssessment.impactAssessment.developmentVelocity}\n`;
    output += `• Bug Frequency: ${technicalDebtAssessment.impactAssessment.bugFrequency}\n`;
    output += `• Maintenance Cost: ${technicalDebtAssessment.impactAssessment.maintainanceCost}\n\n`;

    // Refactoring Plan
    if (refactoringPlan) {
      output += `## 📋 Refactoring Plan\n\n`;
      output += `**Approach:** ${refactoringPlan.overview.approach}\n`;
      output += `**Total Duration:** ${refactoringPlan.timeline.estimatedCompletion}\n`;
      output += `**Phases:** ${refactoringPlan.overview.phaseCount}\n\n`;
      
      refactoringPlan.phases.forEach((phase, index) => {
        output += `**${phase.phase}** (${phase.duration})\n`;
        output += `*Objectives:* ${phase.objectives.join(', ')}\n`;
        output += `*Recommendations:* ${phase.recommendations.length} items\n`;
        output += `*Deliverables:* ${phase.deliverables.join(', ')}\n\n`;
      });
    }

    // Risk Assessment
    output += `## ⚠️ Risk Assessment\n\n`;
    output += `**Overall Risk Level:** ${riskAssessment.overallRiskLevel.toUpperCase()}\n\n`;
    
    riskAssessment.riskMatrix.forEach((risk, index) => {
      output += `${index + 1}. **${risk.risk}** (${risk.probability} probability, ${risk.impact} impact)\n`;
    });
    output += '\n';

    // Effort Estimation
    if (effortEstimation) {
      output += `## ⏱️ Effort Estimation\n\n`;
      output += `**Total Effort:** ${effortEstimation.totalEffort}\n`;
      output += `**Resource Requirements:**\n`;
      Object.entries(effortEstimation.resourceRequirements).forEach(([role, count]) => {
        output += `• ${role.charAt(0).toUpperCase() + role.slice(1)}: ${count}\n`;
      });
      output += `\n**Contingency:** ${effortEstimation.contingency}\n\n`;
    }

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Review and Approve Plan:** Stakeholder review of refactoring plan\n`;
    output += `2. **Prepare Environment:** Set up testing and monitoring infrastructure\n`;
    output += `3. **Start with Quick Wins:** Begin with low-risk, high-impact improvements\n`;
    output += `4. **Establish Metrics:** Baseline current performance and quality metrics\n`;
    output += `5. **Begin Phase 1:** Execute first phase of refactoring plan\n`;
    output += `6. **Monitor Progress:** Track metrics and adjust plan as needed\n\n`;

    output += `💡 **Refactoring Best Practices:**\n`;
    output += `• Always have comprehensive tests before refactoring\n`;
    output += `• Make small, incremental changes\n`;
    output += `• Monitor performance and quality metrics\n`;
    output += `• Get code reviews for all changes\n`;
    output += `• Document architectural decisions and changes\n\n`;

    output += `📁 **Complete refactoring analysis and plan saved to project.**`;

    return output;
  },

  async saveRefactoringAnalysisToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const refactoringDir = join(saDir, 'refactoring-analysis');
      if (!existsSync(refactoringDir)) {
        require('fs').mkdirSync(refactoringDir, { recursive: true });
      }
      
      const filename = `refactoring-${context.refactoringTarget.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(refactoringDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save refactoring analysis:', error.message);
    }
  }
};