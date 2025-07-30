import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_analyze_brownfield MCP Tool
 * Brownfield system analysis with technical debt assessment and migration planning
 */
export const saAnalyzeBrownfield = {
  name: 'sa_analyze_brownfield',
  description: 'Analyze existing brownfield systems with technical debt assessment, migration planning, and comprehensive risk analysis',
  category: 'architect',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      systemName: {
        type: 'string',
        description: 'Name of the existing system to analyze',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      systemInfo: {
        type: 'object',
        description: 'Information about the existing system',
        properties: {
          age: { type: 'string' },
          technology: { type: 'array', items: { type: 'string' } },
          size: { type: 'string' },
          complexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
          documentation: { type: 'string', enum: ['none', 'minimal', 'partial', 'comprehensive'] },
          testCoverage: { type: 'string' },
          performanceIssues: { type: 'array', items: { type: 'string' } },
          securityConcerns: { type: 'array', items: { type: 'string' } }
        }
      },
      analysisScope: {
        type: 'string',
        description: 'Scope of brownfield analysis',
        enum: ['architecture-only', 'technical-debt', 'migration-assessment', 'comprehensive'],
        default: 'comprehensive'
      },
      migrationGoals: {
        type: 'object',
        description: 'Migration objectives',
        properties: {
          targetTechnology: { type: 'array', items: { type: 'string' } },
          performanceTargets: { type: 'string' },
          scalabilityGoals: { type: 'string' },
          maintainabilityGoals: { type: 'string' },
          timeline: { type: 'string' }
        }
      },
      constraints: {
        type: 'object',
        description: 'Migration constraints',
        properties: {
          budget: { type: 'string' },
          downtime: { type: 'string' },
          resources: { type: 'string' },
          businessContinuity: { type: 'boolean' },
          riskTolerance: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      },
      includeRiskAssessment: {
        type: 'boolean',
        description: 'Include detailed risk assessment',
        default: true
      }
    },
    required: ['systemName']
  },

  validate(args) {
    const errors = [];
    
    if (!args.systemName || typeof args.systemName !== 'string') {
      errors.push('systemName is required and must be a string');
    }
    
    if (args.systemName && args.systemName.trim().length === 0) {
      errors.push('systemName cannot be empty');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const systemName = args.systemName.trim();
    
    try {
      const analysisContext = {
        systemName,
        systemInfo: args.systemInfo || {},
        analysisScope: args.analysisScope || 'comprehensive',
        migrationGoals: args.migrationGoals || {},
        constraints: args.constraints || {},
        includeRiskAssessment: args.includeRiskAssessment !== false,
        timestamp: new Date().toISOString(),
        analyst: context?.userId || 'system',
        analysisId: `brownfield-analysis-${Date.now()}`
      };

      // Current state analysis
      const currentStateAnalysis = await this.analyzeCurrentState(analysisContext);
      
      // Technical debt assessment
      const technicalDebtAssessment = await this.assessTechnicalDebt(analysisContext, currentStateAnalysis);
      
      // Migration strategy
      const migrationStrategy = await this.developMigrationStrategy(analysisContext, technicalDebtAssessment);
      
      // Risk assessment
      let riskAssessment = null;
      if (analysisContext.includeRiskAssessment) {
        riskAssessment = await this.assessMigrationRisks(analysisContext, migrationStrategy);
      }
      
      // Format output
      const output = await this.formatBrownfieldAnalysisOutput(
        analysisContext, 
        currentStateAnalysis, 
        technicalDebtAssessment, 
        migrationStrategy, 
        riskAssessment
      );
      
      // Save analysis
      await this.saveBrownfieldAnalysisToProject(projectPath, analysisContext, {
        currentState: currentStateAnalysis,
        technicalDebt: technicalDebtAssessment,
        migration: migrationStrategy,
        risks: riskAssessment
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          systemName,
          analysisScope: args.analysisScope,
          includeRiskAssessment: args.includeRiskAssessment,
          analysisId: analysisContext.analysisId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to analyze brownfield system ${systemName}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, systemName, projectPath }
      };
    }
  },

  async analyzeCurrentState(context) {
    return {
      systemOverview: {
        name: context.systemName,
        age: context.systemInfo.age || 'Unknown',
        technology: context.systemInfo.technology || [],
        size: context.systemInfo.size || 'Unknown',
        complexity: context.systemInfo.complexity || 'medium'
      },
      architectureAssessment: this.assessArchitecture(context.systemInfo),
      codeQualityAssessment: this.assessCodeQuality(context.systemInfo),
      performanceAssessment: this.assessPerformance(context.systemInfo),
      securityAssessment: this.assessSecurity(context.systemInfo),
      documentationAssessment: this.assessDocumentation(context.systemInfo)
    };
  },

  assessArchitecture(systemInfo) {
    const score = this.calculateArchitectureScore(systemInfo);
    return {
      score,
      level: score >= 80 ? 'Good' : score >= 60 ? 'Fair' : score >= 40 ? 'Poor' : 'Critical',
      issues: this.identifyArchitectureIssues(systemInfo),
      recommendations: this.generateArchitectureRecommendations(systemInfo)
    };
  },

  calculateArchitectureScore(systemInfo) {
    let score = 100;
    
    if (systemInfo.complexity === 'very-high') score -= 30;
    else if (systemInfo.complexity === 'high') score -= 20;
    else if (systemInfo.complexity === 'medium') score -= 10;
    
    if (systemInfo.documentation === 'none') score -= 25;
    else if (systemInfo.documentation === 'minimal') score -= 15;
    else if (systemInfo.documentation === 'partial') score -= 5;
    
    if (systemInfo.performanceIssues && systemInfo.performanceIssues.length > 0) {
      score -= Math.min(20, systemInfo.performanceIssues.length * 5);
    }
    
    return Math.max(0, score);
  },

  identifyArchitectureIssues(systemInfo) {
    const issues = [];
    
    if (systemInfo.complexity === 'very-high' || systemInfo.complexity === 'high') {
      issues.push('High system complexity affecting maintainability');
    }
    
    if (systemInfo.documentation === 'none' || systemInfo.documentation === 'minimal') {
      issues.push('Insufficient documentation for understanding system architecture');
    }
    
    if (systemInfo.performanceIssues && systemInfo.performanceIssues.length > 0) {
      issues.push('Performance bottlenecks identified');
    }
    
    if (systemInfo.securityConcerns && systemInfo.securityConcerns.length > 0) {
      issues.push('Security vulnerabilities present');
    }
    
    return issues;
  },

  generateArchitectureRecommendations(systemInfo) {
    const recommendations = [];
    
    recommendations.push('Conduct detailed architecture review');
    recommendations.push('Create comprehensive system documentation');
    
    if (systemInfo.complexity === 'very-high') {
      recommendations.push('Consider system decomposition into smaller modules');
    }
    
    if (systemInfo.performanceIssues && systemInfo.performanceIssues.length > 0) {
      recommendations.push('Implement performance optimization strategy');
    }
    
    if (systemInfo.securityConcerns && systemInfo.securityConcerns.length > 0) {
      recommendations.push('Address security vulnerabilities immediately');
    }
    
    return recommendations;
  },

  assessCodeQuality(systemInfo) {
    const testCoverage = this.parseTestCoverage(systemInfo.testCoverage);
    return {
      testCoverage,
      codeQualityLevel: testCoverage >= 80 ? 'Good' : testCoverage >= 60 ? 'Fair' : 'Poor',
      maintainabilityIndex: this.calculateMaintainabilityIndex(systemInfo),
      technicalDebtIndicators: this.identifyTechnicalDebtIndicators(systemInfo)
    };
  },

  parseTestCoverage(coverage) {
    if (!coverage) return 0;
    const match = coverage.match(/(\d+)%?/);
    return match ? parseInt(match[1]) : 0;
  },

  calculateMaintainabilityIndex(systemInfo) {
    let index = 100;
    
    if (systemInfo.complexity === 'very-high') index -= 40;
    else if (systemInfo.complexity === 'high') index -= 30;
    else if (systemInfo.complexity === 'medium') index -= 15;
    
    if (systemInfo.documentation === 'none') index -= 30;
    else if (systemInfo.documentation === 'minimal') index -= 20;
    else if (systemInfo.documentation === 'partial') index -= 10;
    
    const testCoverage = this.parseTestCoverage(systemInfo.testCoverage);
    if (testCoverage < 30) index -= 20;
    else if (testCoverage < 60) index -= 10;
    
    return Math.max(0, index);
  },

  identifyTechnicalDebtIndicators(systemInfo) {
    const indicators = [];
    
    const testCoverage = this.parseTestCoverage(systemInfo.testCoverage);
    if (testCoverage < 60) {
      indicators.push('Low test coverage indicating potential quality issues');
    }
    
    if (systemInfo.complexity === 'very-high' || systemInfo.complexity === 'high') {
      indicators.push('High complexity suggesting refactoring needed');
    }
    
    if (systemInfo.documentation === 'none' || systemInfo.documentation === 'minimal') {
      indicators.push('Inadequate documentation creating knowledge debt');
    }
    
    return indicators;
  },

  assessPerformance(systemInfo) {
    const issues = systemInfo.performanceIssues || [];
    return {
      issueCount: issues.length,
      severity: issues.length > 5 ? 'High' : issues.length > 2 ? 'Medium' : issues.length > 0 ? 'Low' : 'None',
      issues,
      recommendations: this.generatePerformanceRecommendations(issues)
    };
  },

  generatePerformanceRecommendations(issues) {
    const recommendations = [];
    
    if (issues.length > 0) {
      recommendations.push('Conduct comprehensive performance profiling');
      recommendations.push('Implement performance monitoring and alerting');
      recommendations.push('Optimize critical performance bottlenecks');
    }
    
    return recommendations;
  },

  assessSecurity(systemInfo) {
    const concerns = systemInfo.securityConcerns || [];
    return {
      concernCount: concerns.length,
      riskLevel: concerns.length > 3 ? 'High' : concerns.length > 1 ? 'Medium' : concerns.length > 0 ? 'Low' : 'Minimal',
      concerns,
      recommendations: this.generateSecurityRecommendations(concerns)
    };
  },

  generateSecurityRecommendations(concerns) {
    const recommendations = [];
    
    if (concerns.length > 0) {
      recommendations.push('Conduct security audit and penetration testing');
      recommendations.push('Implement security monitoring and incident response');
      recommendations.push('Update security policies and procedures');
    }
    
    return recommendations;
  },

  assessDocumentation(systemInfo) {
    const level = systemInfo.documentation || 'none';
    return {
      level,
      adequacy: level === 'comprehensive' ? 'Adequate' : level === 'partial' ? 'Partial' : 'Inadequate',
      gaps: this.identifyDocumentationGaps(level),
      recommendations: this.generateDocumentationRecommendations(level)
    };
  },

  identifyDocumentationGaps(level) {
    const gaps = [];
    
    if (level === 'none' || level === 'minimal') {
      gaps.push('Architecture documentation missing');
      gaps.push('API documentation incomplete');
      gaps.push('Deployment procedures undocumented');
      gaps.push('Business logic not documented');
    } else if (level === 'partial') {
      gaps.push('Some technical documentation missing');
      gaps.push('User documentation incomplete');
    }
    
    return gaps;
  },

  generateDocumentationRecommendations(level) {
    const recommendations = [];
    
    if (level === 'none' || level === 'minimal') {
      recommendations.push('Create comprehensive system documentation');
      recommendations.push('Document all APIs and interfaces');
      recommendations.push('Create deployment and operational guides');
    } else if (level === 'partial') {
      recommendations.push('Complete missing documentation sections');
      recommendations.push('Update outdated documentation');
    }
    
    return recommendations;
  },

  async assessTechnicalDebt(context, currentState) {
    return {
      debtCategories: this.categorizeTechnicalDebt(currentState),
      debtQuantification: this.quantifyTechnicalDebt(currentState),
      remediationPriorities: this.prioritizeDebtRemediation(currentState),
      costBenefitAnalysis: this.analyzeCostBenefit(currentState)
    };
  },

  categorizeTechnicalDebt(currentState) {
    return {
      codeDebt: {
        level: currentState.codeQualityAssessment.codeQualityLevel,
        issues: currentState.codeQualityAssessment.technicalDebtIndicators,
        impact: 'Affects maintainability and development velocity'
      },
      architecturalDebt: {
        level: currentState.architectureAssessment.level,
        issues: currentState.architectureAssessment.issues,
        impact: 'Affects scalability and system evolution'
      },
      documentationDebt: {
        level: currentState.documentationAssessment.adequacy,
        issues: currentState.documentationAssessment.gaps,
        impact: 'Affects knowledge transfer and onboarding'
      },
      testDebt: {
        level: currentState.codeQualityAssessment.testCoverage < 60 ? 'High' : 'Low',
        issues: currentState.codeQualityAssessment.testCoverage < 60 ? ['Low test coverage'] : [],
        impact: 'Affects confidence in changes and regression prevention'
      }
    };
  },

  quantifyTechnicalDebt(currentState) {
    const architectureScore = currentState.architectureAssessment.score;
    const maintainabilityIndex = currentState.codeQualityAssessment.maintainabilityIndex;
    const testCoverage = currentState.codeQualityAssessment.testCoverage;
    
    const overallScore = (architectureScore + maintainabilityIndex + testCoverage) / 3;
    
    return {
      overallScore: Math.round(overallScore),
      debtLevel: overallScore >= 75 ? 'Low' : overallScore >= 50 ? 'Medium' : overallScore >= 25 ? 'High' : 'Critical',
      estimatedRemediationEffort: this.estimateRemediationEffort(overallScore),
      businessImpact: this.assessBusinessImpact(overallScore)
    };
  },

  estimateRemediationEffort(score) {
    if (score >= 75) return '1-2 months';
    if (score >= 50) return '3-6 months';
    if (score >= 25) return '6-12 months';
    return '12+ months';
  },

  assessBusinessImpact(score) {
    if (score >= 75) return 'Low - Minimal impact on development velocity';
    if (score >= 50) return 'Medium - Noticeable impact on development and maintenance';
    if (score >= 25) return 'High - Significant impact on productivity and system reliability';
    return 'Critical - Severe impact on business operations and growth';
  },

  prioritizeDebtRemediation(currentState) {
    const priorities = [];
    
    if (currentState.securityAssessment.riskLevel === 'High') {
      priorities.push({ item: 'Security vulnerabilities', priority: 'Critical', timeline: 'Immediate' });
    }
    
    if (currentState.performanceAssessment.severity === 'High') {
      priorities.push({ item: 'Performance issues', priority: 'High', timeline: '1-2 months' });
    }
    
    if (currentState.architectureAssessment.level === 'Critical' || currentState.architectureAssessment.level === 'Poor') {
      priorities.push({ item: 'Architecture improvements', priority: 'High', timeline: '2-6 months' });
    }
    
    if (currentState.codeQualityAssessment.testCoverage < 30) {
      priorities.push({ item: 'Test coverage improvement', priority: 'Medium', timeline: '2-4 months' });
    }
    
    if (currentState.documentationAssessment.adequacy === 'Inadequate') {
      priorities.push({ item: 'Documentation creation', priority: 'Medium', timeline: '1-3 months' });
    }
    
    return priorities;
  },

  analyzeCostBenefit(currentState) {
    return {
      remediationCosts: 'Estimated 6-18 months of development effort',
      benefits: [
        'Improved development velocity',
        'Reduced maintenance costs',
        'Better system reliability',
        'Enhanced security posture',
        'Easier onboarding of new team members'
      ],
      riskOfNotActing: [
        'Increasing maintenance costs',
        'Slower feature development',
        'Higher risk of system failures',
        'Difficulty attracting and retaining developers',
        'Potential security breaches'
      ]
    };
  },

  async developMigrationStrategy(context, technicalDebt) {
    return {
      migrationApproach: this.selectMigrationApproach(context, technicalDebt),
      migrationPhases: this.defineMigrationPhases(context, technicalDebt),
      technologyStrategy: this.developTechnologyStrategy(context),
      dataStrategy: this.developDataStrategy(context),
      riskMitigation: this.developRiskMitigation(context, technicalDebt)
    };
  },

  selectMigrationApproach(context, technicalDebt) {
    const debtLevel = technicalDebt.debtQuantification.debtLevel;
    
    if (debtLevel === 'Critical') {
      return {
        approach: 'Rewrite',
        rationale: 'System has critical technical debt requiring complete rewrite',
        timeline: '12-24 months',
        risk: 'High'
      };
    } else if (debtLevel === 'High') {
      return {
        approach: 'Strangler Fig Pattern',
        rationale: 'Gradual replacement while maintaining business continuity',
        timeline: '8-18 months',
        risk: 'Medium'
      };
    } else {
      return {
        approach: 'Incremental Refactoring',
        rationale: 'Moderate debt can be addressed through systematic refactoring',
        timeline: '6-12 months',
        risk: 'Low'
      };
    }
  },

  defineMigrationPhases(context, technicalDebt) {
    const approach = this.selectMigrationApproach(context, technicalDebt);
    
    if (approach.approach === 'Rewrite') {
      return [
        { phase: 'Analysis & Design', duration: '2-3 months', activities: ['Requirements analysis', 'New system design', 'Migration planning'] },
        { phase: 'Development', duration: '8-12 months', activities: ['New system development', 'Testing', 'Integration'] },
        { phase: 'Migration', duration: '2-4 months', activities: ['Data migration', 'System cutover', 'Validation'] },
        { phase: 'Stabilization', duration: '1-2 months', activities: ['Issue resolution', 'Performance tuning', 'User training'] }
      ];
    } else if (approach.approach === 'Strangler Fig Pattern') {
      return [
        { phase: 'Preparation', duration: '1-2 months', activities: ['Strategy definition', 'Tool setup', 'Team training'] },
        { phase: 'Incremental Migration', duration: '6-12 months', activities: ['Module-by-module replacement', 'Testing', 'Deployment'] },
        { phase: 'Legacy Retirement', duration: '2-3 months', activities: ['Legacy system shutdown', 'Cleanup', 'Documentation'] }
      ];
    } else {
      return [
        { phase: 'Planning', duration: '2-4 weeks', activities: ['Refactoring plan', 'Priority setting', 'Resource allocation'] },
        { phase: 'Incremental Improvement', duration: '4-8 months', activities: ['Systematic refactoring', 'Testing', 'Documentation'] },
        { phase: 'Validation', duration: '1-2 months', activities: ['Quality validation', 'Performance testing', 'Final cleanup'] }
      ];
    }
  },

  developTechnologyStrategy(context) {
    const targetTech = context.migrationGoals.targetTechnology || [];
    return {
      modernizationGoals: [
        'Improve maintainability and developer experience',
        'Enhance system performance and scalability',
        'Increase security and compliance',
        'Enable faster feature development'
      ],
      technologyChoices: targetTech.length > 0 ? targetTech : ['To be determined based on requirements'],
      migrationConsiderations: [
        'Team expertise and learning curve',
        'Integration with existing systems',
        'Long-term support and community',
        'Performance and scalability characteristics'
      ]
    };
  },

  developDataStrategy(context) {
    return {
      dataAssessment: 'Analyze current data structures and quality',
      migrationApproach: 'Incremental data migration with validation',
      dataIntegrity: 'Comprehensive data validation and testing',
      backupStrategy: 'Multiple backup points during migration',
      rollbackPlan: 'Ability to rollback to previous state if issues occur'
    };
  },

  developRiskMitigation(context, technicalDebt) {
    return {
      technicalRisks: [
        'Data corruption during migration',
        'System downtime exceeding planned windows',
        'Integration failures with external systems',
        'Performance degradation in new system'
      ],
      businessRisks: [
        'User adoption challenges',
        'Business process disruption',
        'Budget and timeline overruns',
        'Loss of functionality during transition'
      ],
      mitigationStrategies: [
        'Comprehensive testing at all stages',
        'Phased rollout with rollback capabilities',
        'Extensive user training and support',
        'Close monitoring and incident response',
        'Regular stakeholder communication'
      ]
    };
  },

  async assessMigrationRisks(context, migrationStrategy) {
    return {
      riskMatrix: this.createRiskMatrix(context, migrationStrategy),
      riskMitigation: this.planRiskMitigation(context, migrationStrategy),
      contingencyPlans: this.developContingencyPlans(context, migrationStrategy)
    };
  },

  createRiskMatrix(context, migrationStrategy) {
    const risks = [
      { risk: 'Data Loss', probability: 'Low', impact: 'High', severity: 'High' },
      { risk: 'Extended Downtime', probability: 'Medium', impact: 'Medium', severity: 'Medium' },
      { risk: 'Budget Overrun', probability: 'Medium', impact: 'Medium', severity: 'Medium' },
      { risk: 'Timeline Delays', probability: 'High', impact: 'Medium', severity: 'Medium' },
      { risk: 'User Resistance', probability: 'Medium', impact: 'Low', severity: 'Low' }
    ];
    
    if (migrationStrategy.migrationApproach.approach === 'Rewrite') {
      risks.push({ risk: 'Feature Parity Issues', probability: 'High', impact: 'Medium', severity: 'Medium' });
    }
    
    return risks;
  },

  planRiskMitigation(context, migrationStrategy) {
    return {
      dataProtection: 'Multiple backups and data validation procedures',
      downtimeMinimization: 'Blue-green deployment and rollback procedures',
      budgetControl: 'Regular budget reviews and scope management',
      timelineManagement: 'Agile methodology with regular checkpoints',
      userAdoption: 'Change management and training programs'
    };
  },

  developContingencyPlans(context, migrationStrategy) {
    return {
      rollbackPlan: 'Ability to revert to original system within 24 hours',
      alternativeApproaches: 'Hybrid approach if full migration proves unfeasible',
      resourceContingency: '20% additional budget and timeline buffer',
      technicalSupport: 'External expertise available for critical issues'
    };
  },

  async formatBrownfieldAnalysisOutput(context, currentState, technicalDebt, migration, risks) {
    let output = `🏭 **Brownfield System Analysis: ${context.systemName}**\n\n`;
    output += `📊 **Analysis Scope:** ${context.analysisScope}\n`;
    output += `📅 **Analysis Date:** ${new Date(context.timestamp).toLocaleDateString()}\n`;
    output += `🆔 **Analysis ID:** ${context.analysisId}\n\n`;

    // Current State Summary
    output += `## 📈 Current State Assessment\n\n`;
    output += `**System Overview:**\n`;
    output += `• Age: ${currentState.systemOverview.age}\n`;
    output += `• Technology: ${currentState.systemOverview.technology.join(', ') || 'Not specified'}\n`;
    output += `• Size: ${currentState.systemOverview.size}\n`;
    output += `• Complexity: ${currentState.systemOverview.complexity}\n\n`;

    output += `**Quality Scores:**\n`;
    output += `• Architecture: ${currentState.architectureAssessment.score}/100 (${currentState.architectureAssessment.level})\n`;
    output += `• Maintainability: ${currentState.codeQualityAssessment.maintainabilityIndex}/100\n`;
    output += `• Test Coverage: ${currentState.codeQualityAssessment.testCoverage}%\n`;
    output += `• Documentation: ${currentState.documentationAssessment.adequacy}\n\n`;

    // Technical Debt Assessment
    output += `## 💳 Technical Debt Assessment\n\n`;
    output += `**Overall Debt Level:** ${technicalDebt.debtQuantification.debtLevel}\n`;
    output += `**Business Impact:** ${technicalDebt.debtQuantification.businessImpact}\n`;
    output += `**Estimated Remediation:** ${technicalDebt.debtQuantification.estimatedRemediationEffort}\n\n`;

    output += `**Debt Categories:**\n`;
    Object.entries(technicalDebt.debtCategories).forEach(([category, details]) => {
      output += `• **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${details.level}\n`;
      if (details.issues.length > 0) {
        output += `  Issues: ${details.issues.join('; ')}\n`;
      }
    });
    output += '\n';

    // Migration Strategy
    output += `## 🚀 Migration Strategy\n\n`;
    output += `**Recommended Approach:** ${migration.migrationApproach.approach}\n`;
    output += `**Rationale:** ${migration.migrationApproach.rationale}\n`;
    output += `**Timeline:** ${migration.migrationApproach.timeline}\n`;
    output += `**Risk Level:** ${migration.migrationApproach.risk}\n\n`;

    output += `**Migration Phases:**\n`;
    migration.migrationPhases.forEach((phase, index) => {
      output += `${index + 1}. **${phase.phase}** (${phase.duration})\n`;
      output += `   Activities: ${phase.activities.join(', ')}\n`;
    });
    output += '\n';

    // Risk Assessment
    if (risks) {
      output += `## ⚠️ Risk Assessment\n\n`;
      output += `**Key Risks:**\n`;
      risks.riskMatrix.forEach(risk => {
        output += `• **${risk.risk}:** ${risk.probability} probability, ${risk.impact} impact (${risk.severity} severity)\n`;
      });
      output += '\n';

      output += `**Mitigation Strategies:**\n`;
      Object.entries(risks.riskMitigation).forEach(([risk, mitigation]) => {
        output += `• **${risk.charAt(0).toUpperCase() + risk.slice(1)}:** ${mitigation}\n`;
      });
      output += '\n';
    }

    // Recommendations
    output += `## 🎯 Priority Recommendations\n\n`;
    technicalDebt.remediationPriorities.forEach((priority, index) => {
      output += `${index + 1}. **${priority.item}** (${priority.priority} priority)\n`;
      output += `   Timeline: ${priority.timeline}\n`;
    });
    output += '\n';

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Stakeholder Review:** Present analysis findings to key stakeholders\n`;
    output += `2. **Budget Planning:** Secure budget and resources for migration\n`;
    output += `3. **Team Preparation:** Train team on new technologies and approaches\n`;
    output += `4. **Detailed Planning:** Create detailed migration project plan\n`;
    output += `5. **Risk Management:** Implement risk monitoring and mitigation procedures\n\n`;

    output += `💡 **Migration Success Tips:**\n`;
    output += `• Start with highest-risk areas first\n`;
    output += `• Maintain business continuity throughout migration\n`;
    output += `• Invest in comprehensive testing and validation\n`;
    output += `• Communicate regularly with all stakeholders\n`;
    output += `• Plan for rollback scenarios at each phase\n\n`;

    output += `📁 **Complete brownfield analysis saved to project for reference.**`;

    return output;
  },

  async saveBrownfieldAnalysisToProject(projectPath, context, analysisData) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const brownfieldDir = join(saDir, 'brownfield-analysis');
      if (!existsSync(brownfieldDir)) {
        require('fs').mkdirSync(brownfieldDir, { recursive: true });
      }
      
      const filename = `brownfield-analysis-${context.systemName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(brownfieldDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...analysisData }, null, 2));
    } catch (error) {
      console.warn('Failed to save brownfield analysis:', error.message);
    }
  }
};