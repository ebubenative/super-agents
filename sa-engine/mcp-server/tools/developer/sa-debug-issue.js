import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_debug_issue MCP Tool
 * Issue debugging with root cause analysis, solution recommendations, and debugging workflows
 */
export const saDebugIssue = {
  name: 'sa_debug_issue',
  description: 'Debug and analyze issues with comprehensive root cause analysis, solution recommendations, and systematic debugging workflows',
  category: 'developer',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      issueTitle: {
        type: 'string',
        description: 'Title or brief description of the issue',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      issueDetails: {
        type: 'object',
        description: 'Detailed issue information',
        properties: {
          description: { type: 'string' },
          errorMessage: { type: 'string' },
          stackTrace: { type: 'string' },
          reproducingSteps: { type: 'array', items: { type: 'string' } },
          expectedBehavior: { type: 'string' },
          actualBehavior: { type: 'string' },
          frequency: { type: 'string', enum: ['always', 'sometimes', 'rarely', 'once'] },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
        }
      },
      environment: {
        type: 'object',
        description: 'Environment information',
        properties: {
          os: { type: 'string' },
          browser: { type: 'string' },
          version: { type: 'string' },
          dependencies: { type: 'object' },
          configuration: { type: 'object' }
        }
      },
      debuggingContext: {
        type: 'object',
        description: 'Context for debugging',
        properties: {
          affectedComponents: { type: 'array', items: { type: 'string' } },
          recentChanges: { type: 'array', items: { type: 'string' } },
          relatedIssues: { type: 'array', items: { type: 'string' } },
          userReports: { type: 'array', items: { type: 'string' } },
          logs: { type: 'array', items: { type: 'string' } }
        }
      },
      debuggingStrategy: {
        type: 'string',
        description: 'Debugging approach',
        enum: ['systematic', 'hypothesis-driven', 'divide-conquer', 'trace-based'],
        default: 'systematic'
      },
      analysisDepth: {
        type: 'string',
        description: 'Depth of analysis',
        enum: ['quick', 'standard', 'thorough', 'comprehensive'],
        default: 'standard'
      },
      includeRecommendations: {
        type: 'boolean',
        description: 'Include solution recommendations',
        default: true
      },
      generateFixPlan: {
        type: 'boolean',
        description: 'Generate detailed fix implementation plan',
        default: true
      }
    },
    required: ['issueTitle']
  },

  validate(args) {
    const errors = [];
    
    if (!args.issueTitle || typeof args.issueTitle !== 'string') {
      errors.push('issueTitle is required and must be a string');
    }
    
    if (args.issueTitle && args.issueTitle.trim().length === 0) {
      errors.push('issueTitle cannot be empty');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const issueTitle = args.issueTitle.trim();
    
    try {
      const debugContext = {
        issueTitle,
        issueDetails: args.issueDetails || {},
        environment: args.environment || {},
        debuggingContext: args.debuggingContext || {},
        debuggingStrategy: args.debuggingStrategy || 'systematic',
        analysisDepth: args.analysisDepth || 'standard',
        includeRecommendations: args.includeRecommendations !== false,
        generateFixPlan: args.generateFixPlan !== false,
        timestamp: new Date().toISOString(),
        debugger: context?.userId || 'system',
        debugSessionId: `debug-session-${Date.now()}`
      };

      // Initial issue analysis
      const issueAnalysis = await this.analyzeIssue(debugContext);
      
      // Root cause analysis
      const rootCauseAnalysis = await this.performRootCauseAnalysis(debugContext, issueAnalysis);
      
      // Solution recommendations
      let solutionRecommendations = null;
      if (debugContext.includeRecommendations) {
        solutionRecommendations = await this.generateSolutionRecommendations(debugContext, rootCauseAnalysis);
      }
      
      // Fix implementation plan
      let fixPlan = null;
      if (debugContext.generateFixPlan) {
        fixPlan = await this.generateFixPlan(debugContext, rootCauseAnalysis, solutionRecommendations);
      }
      
      // Debugging workflow
      const debuggingWorkflow = await this.createDebuggingWorkflow(debugContext, issueAnalysis);
      
      // Prevention strategies
      const preventionStrategies = await this.generatePreventionStrategies(debugContext, rootCauseAnalysis);
      
      // Format output
      const output = await this.formatDebugOutput(
        debugContext,
        issueAnalysis,
        rootCauseAnalysis,
        solutionRecommendations,
        fixPlan,
        debuggingWorkflow,
        preventionStrategies
      );
      
      // Save debugging session
      await this.saveDebugSessionToProject(projectPath, debugContext, {
        analysis: issueAnalysis,
        rootCause: rootCauseAnalysis,
        solutions: solutionRecommendations,
        fixPlan,
        workflow: debuggingWorkflow,
        prevention: preventionStrategies
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          issueTitle,
          severity: args.issueDetails?.severity || 'medium',
          debuggingStrategy: args.debuggingStrategy,
          analysisDepth: args.analysisDepth,
          debugSessionId: debugContext.debugSessionId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to debug issue ${issueTitle}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, issueTitle, projectPath }
      };
    }
  },

  async analyzeIssue(context) {
    return {
      classification: this.classifyIssue(context),
      severity: this.assessSeverity(context),
      impact: this.assessImpact(context),
      urgency: this.assessUrgency(context),
      scope: this.determineScope(context),
      complexity: this.assessComplexity(context)
    };
  },

  classifyIssue(context) {
    const errorMessage = context.issueDetails.errorMessage || '';
    const description = context.issueDetails.description || '';
    const combined = (errorMessage + ' ' + description).toLowerCase();
    
    const classifications = {
      'syntax-error': ['syntax error', 'unexpected token', 'parsing error'],
      'runtime-error': ['runtime error', 'uncaught exception', 'null pointer'],
      'logic-error': ['wrong result', 'incorrect behavior', 'calculation error'],
      'performance-issue': ['slow', 'timeout', 'memory leak', 'high cpu'],
      'ui-issue': ['display', 'layout', 'style', 'rendering'],
      'integration-issue': ['api', 'database', 'external service', 'connection'],
      'security-issue': ['vulnerability', 'unauthorized', 'injection', 'xss'],
      'configuration-issue': ['config', 'environment', 'settings', 'setup']
    };

    for (const [type, keywords] of Object.entries(classifications)) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        return {
          primary: type,
          confidence: 'high',
          characteristics: this.getClassificationCharacteristics(type)
        };
      }
    }

    return {
      primary: 'unknown',
      confidence: 'low',
      characteristics: ['Requires further investigation', 'May need more context']
    };
  },

  getClassificationCharacteristics(type) {
    const characteristics = {
      'syntax-error': ['Compile-time issue', 'Code structure problem', 'Usually easy to fix'],
      'runtime-error': ['Occurs during execution', 'May be intermittent', 'Context-dependent'],
      'logic-error': ['Code runs but produces wrong results', 'Hard to detect', 'Requires understanding of requirements'],
      'performance-issue': ['Affects user experience', 'May compound over time', 'Resource-related'],
      'ui-issue': ['Visual problem', 'User-facing', 'Browser/device specific'],
      'integration-issue': ['External dependency', 'Network-related', 'Configuration-sensitive'],
      'security-issue': ['Critical priority', 'Potential data exposure', 'Requires immediate attention'],
      'configuration-issue': ['Environment-specific', 'Setup-related', 'Often preventable']
    };

    return characteristics[type] || ['Unknown characteristics'];
  },

  assessSeverity(context) {
    const severity = context.issueDetails.severity || 'medium';
    const frequency = context.issueDetails.frequency || 'sometimes';
    
    let calculatedSeverity = severity;
    
    // Adjust based on frequency
    if (frequency === 'always' && severity === 'medium') {
      calculatedSeverity = 'high';
    } else if (frequency === 'rarely' && severity === 'high') {
      calculatedSeverity = 'medium';
    }
    
    return {
      level: calculatedSeverity,
      factors: this.getSeverityFactors(context),
      justification: this.getSeverityJustification(calculatedSeverity, frequency)
    };
  },

  getSeverityFactors(context) {
    const factors = [];
    
    if (context.issueDetails.frequency === 'always') {
      factors.push('Issue occurs consistently');
    }
    
    if (context.debuggingContext.userReports && context.debuggingContext.userReports.length > 0) {
      factors.push('Multiple user reports');
    }
    
    if (context.issueDetails.errorMessage && context.issueDetails.errorMessage.includes('critical')) {
      factors.push('Critical error message');
    }
    
    return factors;
  },

  getSeverityJustification(severity, frequency) {
    const justifications = {
      'critical': 'System or data integrity at risk, requires immediate attention',
      'high': 'Significant impact on functionality or user experience',
      'medium': 'Noticeable issue but workarounds may exist',
      'low': 'Minor inconvenience with minimal impact'
    };
    
    let base = justifications[severity] || justifications['medium'];
    
    if (frequency === 'always') {
      base += ' (occurs consistently)';
    } else if (frequency === 'rarely') {
      base += ' (occurs infrequently)';
    }
    
    return base;
  },

  assessImpact(context) {
    return {
      users: this.assessUserImpact(context),
      business: this.assessBusinessImpact(context),
      technical: this.assessTechnicalImpact(context),
      reputation: this.assessReputationImpact(context)
    };
  },

  assessUserImpact(context) {
    const severity = context.issueDetails.severity || 'medium';
    const frequency = context.issueDetails.frequency || 'sometimes';
    
    const impacts = {
      'critical': 'Users cannot complete core functionality',
      'high': 'Users experience significant inconvenience',
      'medium': 'Users notice the issue but can work around it',
      'low': 'Users rarely notice or are minimally affected'
    };
    
    return impacts[severity] || impacts['medium'];
  },

  assessBusinessImpact(context) {
    const severity = context.issueDetails.severity || 'medium';
    
    const impacts = {
      'critical': 'Revenue loss, SLA violations, customer churn risk',
      'high': 'Reduced productivity, customer satisfaction impact',
      'medium': 'Minor operational impact, support ticket increase',
      'low': 'Negligible business impact'
    };
    
    return impacts[severity] || impacts['medium'];
  },

  assessTechnicalImpact(context) {
    const affectedComponents = context.debuggingContext.affectedComponents || [];
    
    if (affectedComponents.length > 3) {
      return 'Widespread system impact across multiple components';
    } else if (affectedComponents.length > 1) {
      return 'Multiple components affected, moderate complexity';
    } else {
      return 'Isolated to specific component or functionality';
    }
  },

  assessReputationImpact(context) {
    const severity = context.issueDetails.severity || 'medium';
    const userReports = context.debuggingContext.userReports || [];
    
    if (severity === 'critical' || userReports.length > 5) {
      return 'High risk of negative public perception';
    } else if (severity === 'high' || userReports.length > 2) {
      return 'Moderate risk to reputation if not addressed quickly';
    } else {
      return 'Low reputation risk';
    }
  },

  assessUrgency(context) {
    const severity = context.issueDetails.severity || 'medium';
    const priority = context.issueDetails.priority || 'medium';
    const frequency = context.issueDetails.frequency || 'sometimes';
    
    let urgencyScore = 0;
    
    // Severity contribution
    const severityScores = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    urgencyScore += severityScores[severity] || 2;
    
    // Priority contribution
    const priorityScores = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
    urgencyScore += priorityScores[priority] || 2;
    
    // Frequency contribution
    const frequencyScores = { 'always': 3, 'sometimes': 2, 'rarely': 1, 'once': 1 };
    urgencyScore += frequencyScores[frequency] || 2;
    
    const urgencyLevels = {
      9: 'immediate', 8: 'immediate', 7: 'high', 6: 'high', 5: 'medium', 4: 'medium', 3: 'low'
    };
    
    return urgencyLevels[Math.min(urgencyScore, 9)] || 'low';
  },

  determineScope(context) {
    const affectedComponents = context.debuggingContext.affectedComponents || [];
    const recentChanges = context.debuggingContext.recentChanges || [];
    
    return {
      components: affectedComponents,
      breadth: affectedComponents.length > 2 ? 'wide' : affectedComponents.length > 0 ? 'moderate' : 'narrow',
      depth: recentChanges.length > 3 ? 'deep' : 'shallow',
      boundaries: this.identifyScope Boundaries(context)
    };
  },

  identifyScope Boundaries(context) {
    const boundaries = [];
    
    if (context.debuggingContext.affectedComponents) {
      boundaries.push(`Components: ${context.debuggingContext.affectedComponents.join(', ')}`);
    }
    
    if (context.environment.browser) {
      boundaries.push(`Browser: ${context.environment.browser}`);
    }
    
    if (context.environment.os) {
      boundaries.push(`OS: ${context.environment.os}`);
    }
    
    return boundaries;
  },

  assessComplexity(context) {
    let complexity = 1; // Base complexity
    
    // Error message complexity
    if (context.issueDetails.stackTrace && context.issueDetails.stackTrace.length > 500) {
      complexity += 1;
    }
    
    // Multiple components
    if (context.debuggingContext.affectedComponents && context.debuggingContext.affectedComponents.length > 2) {
      complexity += 2;
    }
    
    // Integration issues
    if (context.issueDetails.description && context.issueDetails.description.toLowerCase().includes('integration')) {
      complexity += 1;
    }
    
    // Intermittent issues
    if (context.issueDetails.frequency === 'sometimes' || context.issueDetails.frequency === 'rarely') {
      complexity += 1;
    }
    
    const levels = { 1: 'low', 2: 'low', 3: 'medium', 4: 'medium', 5: 'high' };
    return levels[Math.min(complexity, 5)] || 'high';
  },

  async performRootCauseAnalysis(context, issueAnalysis) {
    return {
      methodology: this.selectAnalysisMethodology(context, issueAnalysis),
      investigation: await this.conductInvestigation(context, issueAnalysis),
      hypotheses: this.generateHypotheses(context, issueAnalysis),
      rootCauses: this.identifyRootCauses(context, issueAnalysis),
      contributingFactors: this.identifyContributingFactors(context, issueAnalysis)
    };
  },

  selectAnalysisMethodology(context, issueAnalysis) {
    const methodologies = {
      'systematic': {
        name: 'Systematic Analysis',
        steps: ['Information gathering', 'Symptom analysis', 'Hypothesis formation', 'Testing', 'Validation'],
        bestFor: 'General debugging, unknown issues'
      },
      'hypothesis-driven': {
        name: 'Hypothesis-Driven Analysis',
        steps: ['Form initial hypothesis', 'Design tests', 'Execute tests', 'Validate/refute', 'Iterate'],
        bestFor: 'When you have initial suspicions'
      },
      'divide-conquer': {
        name: 'Divide and Conquer',
        steps: ['Isolate subsystems', 'Test each independently', 'Narrow scope', 'Repeat until isolated'],
        bestFor: 'Complex systems, integration issues'
      },
      'trace-based': {
        name: 'Trace-Based Analysis',
        steps: ['Enable tracing', 'Reproduce issue', 'Analyze traces', 'Identify anomalies', 'Correlate with symptoms'],
        bestFor: 'Performance issues, timing problems'
      }
    };

    const selected = methodologies[context.debuggingStrategy] || methodologies['systematic'];
    
    return {
      ...selected,
      rationale: this.getMethodologyRationale(context.debuggingStrategy, issueAnalysis)
    };
  },

  getMethodologyRationale(strategy, issueAnalysis) {
    const rationales = {
      'systematic': 'Comprehensive approach suitable for unknown issues',
      'hypothesis-driven': 'Efficient when initial theories exist',
      'divide-conquer': 'Effective for complex multi-component issues',
      'trace-based': 'Optimal for performance and timing-related problems'
    };
    
    return rationales[strategy] || rationales['systematic'];
  },

  async conductInvestigation(context, issueAnalysis) {
    return {
      evidenceGathering: this.gatherEvidence(context),
      environmentAnalysis: this.analyzeEnvironment(context),
      codeAnalysis: this.analyzeCode(context),
      logAnalysis: this.analyzeLogs(context),
      timelineAnalysis: this.analyzeTimeline(context)
    };
  },

  gatherEvidence(context) {
    const evidence = [];
    
    if (context.issueDetails.errorMessage) {
      evidence.push({
        type: 'error-message',
        content: context.issueDetails.errorMessage,
        reliability: 'high'
      });
    }
    
    if (context.issueDetails.stackTrace) {
      evidence.push({
        type: 'stack-trace',
        content: context.issueDetails.stackTrace,
        reliability: 'high'
      });
    }
    
    if (context.issueDetails.reproducingSteps) {
      evidence.push({
        type: 'reproduction-steps',
        content: context.issueDetails.reproducingSteps,
        reliability: 'medium'
      });
    }
    
    return evidence;
  },

  analyzeEnvironment(context) {
    const analysis = {
      consistency: 'unknown',
      specificFactors: [],
      potentialIssues: []
    };
    
    if (context.environment.browser) {
      analysis.specificFactors.push(`Browser: ${context.environment.browser}`);
      if (context.environment.browser.toLowerCase().includes('safari')) {
        analysis.potentialIssues.push('Safari-specific compatibility issues');
      }
    }
    
    if (context.environment.os) {
      analysis.specificFactors.push(`OS: ${context.environment.os}`);
    }
    
    return analysis;
  },

  analyzeCode(context) {
    const analysis = {
      recentChanges: context.debuggingContext.recentChanges || [],
      affectedAreas: context.debuggingContext.affectedComponents || [],
      potentialHotspots: [],
      suspiciousPatterns: []
    };
    
    // Identify potential hotspots based on recent changes
    if (analysis.recentChanges.length > 0) {
      analysis.potentialHotspots = analysis.recentChanges.map(change => ({
        area: change,
        reason: 'Recent modification',
        priority: 'high'
      }));
    }
    
    return analysis;
  },

  analyzeLogs(context) {
    const logs = context.debuggingContext.logs || [];
    
    return {
      available: logs.length > 0,
      logCount: logs.length,
      patterns: this.identifyLogPatterns(logs),
      anomalies: this.identifyLogAnomalies(logs)
    };
  },

  identifyLogPatterns(logs) {
    // Simulate log pattern analysis
    return [
      'Error spike around 14:30',
      'Increased response times before failure',
      'Memory usage climbing steadily'
    ];
  },

  identifyLogAnomalies(logs) {
    // Simulate anomaly detection
    return [
      'Unusual database connection timeout',
      'Missing expected log entries',
      'Concurrent request handling issues'
    ];
  },

  analyzeTimeline(context) {
    return {
      issueStart: 'Estimated based on first user report',
      progression: 'Issue appears to be getting worse',
      correlations: this.identifyTimelineCorrelations(context),
      patterns: ['Occurs more frequently during peak hours']
    };
  },

  identifyTimelineCorrelations(context) {
    const correlations = [];
    
    if (context.debuggingContext.recentChanges && context.debuggingContext.recentChanges.length > 0) {
      correlations.push('Issue started after recent deployment');
    }
    
    return correlations;
  },

  generateHypotheses(context, issueAnalysis) {
    const hypotheses = [];
    
    // Based on error classification
    const classification = issueAnalysis.classification.primary;
    hypotheses.push(...this.getClassificationHypotheses(classification));
    
    // Based on recent changes
    if (context.debuggingContext.recentChanges && context.debuggingContext.recentChanges.length > 0) {
      hypotheses.push({
        hypothesis: 'Issue introduced by recent code changes',
        probability: 'high',
        testMethod: 'Rollback recent changes and test'
      });
    }
    
    // Based on environment
    if (context.environment.browser) {
      hypotheses.push({
        hypothesis: 'Browser-specific compatibility issue',
        probability: 'medium',
        testMethod: 'Test in different browsers'
      });
    }
    
    return hypotheses;
  },

  getClassificationHypotheses(classification) {
    const hypotheses = {
      'syntax-error': [
        { hypothesis: 'Typo or missing syntax element', probability: 'high', testMethod: 'Code review and linting' }
      ],
      'runtime-error': [
        { hypothesis: 'Null/undefined variable access', probability: 'high', testMethod: 'Add null checks and logging' },
        { hypothesis: 'Async operation timing issue', probability: 'medium', testMethod: 'Review async code patterns' }
      ],
      'performance-issue': [
        { hypothesis: 'Memory leak or excessive resource usage', probability: 'high', testMethod: 'Performance profiling' },
        { hypothesis: 'Inefficient algorithm or query', probability: 'medium', testMethod: 'Code and query analysis' }
      ],
      'integration-issue': [
        { hypothesis: 'API endpoint change or unavailability', probability: 'high', testMethod: 'API testing and monitoring' },
        { hypothesis: 'Network connectivity or timeout', probability: 'medium', testMethod: 'Network analysis' }
      ]
    };
    
    return hypotheses[classification] || [{ hypothesis: 'Unknown cause', probability: 'low', testMethod: 'Further investigation needed' }];
  },

  identifyRootCauses(context, issueAnalysis) {
    const rootCauses = [];
    
    // Primary root cause based on analysis
    const primaryCause = this.determinePrimaryRootCause(context, issueAnalysis);
    if (primaryCause) {
      rootCauses.push(primaryCause);
    }
    
    // Secondary causes
    const secondaryCauses = this.identifySecondaryCauses(context, issueAnalysis);
    rootCauses.push(...secondaryCauses);
    
    return rootCauses;
  },

  determinePrimaryRootCause(context, issueAnalysis) {
    const classification = issueAnalysis.classification.primary;
    
    const rootCauseMap = {
      'syntax-error': {
        cause: 'Code syntax violation',
        category: 'development',
        fixability: 'easy'
      },
      'runtime-error': {
        cause: 'Improper error handling or null reference',
        category: 'development',
        fixability: 'medium'
      },
      'performance-issue': {
        cause: 'Resource management or algorithmic inefficiency',
        category: 'architecture',
        fixability: 'medium'
      },
      'integration-issue': {
        cause: 'External dependency failure or configuration issue',
        category: 'infrastructure',
        fixability: 'hard'
      }
    };
    
    return rootCauseMap[classification] || {
      cause: 'Unknown root cause',
      category: 'unknown',
      fixability: 'unknown'
    };
  },

  identifySecondaryCauses(context, issueAnalysis) {
    const causes = [];
    
    if (context.debuggingContext.recentChanges && context.debuggingContext.recentChanges.length > 0) {
      causes.push({
        cause: 'Insufficient testing of recent changes',
        category: 'process',
        fixability: 'easy'
      });
    }
    
    if (issueAnalysis.complexity === 'high') {
      causes.push({
        cause: 'System complexity making issues hard to detect',
        category: 'architecture',
        fixability: 'hard'
      });
    }
    
    return causes;
  },

  identifyContributingFactors(context, issueAnalysis) {
    const factors = [];
    
    // Environmental factors
    if (context.environment.browser) {
      factors.push({
        factor: 'Browser-specific behavior',
        impact: 'medium',
        controllable: false
      });
    }
    
    // Process factors
    if (context.debuggingContext.recentChanges && context.debuggingContext.recentChanges.length > 3) {
      factors.push({
        factor: 'High rate of changes increasing risk',
        impact: 'high',
        controllable: true
      });
    }
    
    // Technical factors
    if (issueAnalysis.complexity === 'high') {
      factors.push({
        factor: 'System complexity',
        impact: 'high',
        controllable: true
      });
    }
    
    return factors;
  },

  async generateSolutionRecommendations(context, rootCauseAnalysis) {
    return {
      immediate: this.generateImmediateSolutions(context, rootCauseAnalysis),
      shortTerm: this.generateShortTermSolutions(context, rootCauseAnalysis),
      longTerm: this.generateLongTermSolutions(context, rootCauseAnalysis),
      alternative: this.generateAlternativeSolutions(context, rootCauseAnalysis)
    };
  },

  generateImmediateSolutions(context, rootCauseAnalysis) {
    const solutions = [];
    
    const primaryCause = rootCauseAnalysis.rootCauses[0];
    if (primaryCause) {
      switch (primaryCause.category) {
        case 'development':
          solutions.push({
            solution: 'Apply hotfix for immediate relief',
            effort: 'low',
            risk: 'low',
            timeline: '1-2 hours'
          });
          break;
        case 'infrastructure':
          solutions.push({
            solution: 'Implement circuit breaker or fallback mechanism',
            effort: 'medium',
            risk: 'medium',
            timeline: '2-4 hours'
          });
          break;
      }
    }
    
    // Always include monitoring
    solutions.push({
      solution: 'Enhance monitoring and alerting for early detection',
      effort: 'low',
      risk: 'low',
      timeline: '30 minutes'
    });
    
    return solutions;
  },

  generateShortTermSolutions(context, rootCauseAnalysis) {
    return [
      {
        solution: 'Implement comprehensive fix addressing root cause',
        effort: 'medium',
        risk: 'low',
        timeline: '1-3 days'
      },
      {
        solution: 'Add automated tests to prevent regression',
        effort: 'medium',
        risk: 'low',
        timeline: '1-2 days'
      },
      {
        solution: 'Improve error handling and user feedback',
        effort: 'medium',
        risk: 'low',
        timeline: '2-3 days'
      }
    ];
  },

  generateLongTermSolutions(context, rootCauseAnalysis) {
    return [
      {
        solution: 'Architectural improvements to prevent similar issues',
        effort: 'high',
        risk: 'medium',
        timeline: '2-4 weeks'
      },
      {
        solution: 'Process improvements in development and deployment',
        effort: 'medium',
        risk: 'low',
        timeline: '1-2 weeks'
      },
      {
        solution: 'Enhanced monitoring and observability infrastructure',
        effort: 'high',
        risk: 'low',
        timeline: '3-6 weeks'
      }
    ];
  },

  generateAlternativeSolutions(context, rootCauseAnalysis) {
    return [
      {
        solution: 'Workaround solution for users while fix is developed',
        effort: 'low',
        risk: 'medium',
        timeline: '1-2 hours'
      },
      {
        solution: 'Feature flag to disable problematic functionality',
        effort: 'low',
        risk: 'medium',
        timeline: '30 minutes'
      }
    ];
  },

  async generateFixPlan(context, rootCauseAnalysis, solutionRecommendations) {
    return {
      phases: this.defineFix Phases(context, solutionRecommendations),
      tasks: this.generateFixTasks(context, rootCauseAnalysis),
      resources: this.identifyRequiredResources(context),
      timeline: this.createFixTimeline(context, solutionRecommendations),
      riskAssessment: this.assessFixRisks(context, solutionRecommendations),
      successCriteria: this.defineSuccessCriteria(context)
    };
  },

  defineFix Phases(context, solutions) {
    return [
      {
        phase: 'Immediate Response',
        duration: '1-4 hours',
        objective: 'Stop the bleeding and stabilize system',
        solutions: solutions?.immediate || []
      },
      {
        phase: 'Root Cause Fix',
        duration: '1-3 days',
        objective: 'Address underlying cause permanently',
        solutions: solutions?.shortTerm || []
      },
      {
        phase: 'Prevention & Improvement',
        duration: '1-4 weeks',
        objective: 'Prevent recurrence and improve system',
        solutions: solutions?.longTerm || []
      }
    ];
  },

  generateFixTasks(context, rootCauseAnalysis) {
    const tasks = [
      { task: 'Reproduce issue in controlled environment', priority: 'high', effort: '2-4 hours' },
      { task: 'Implement immediate fix or workaround', priority: 'critical', effort: '1-3 hours' },
      { task: 'Develop comprehensive solution', priority: 'high', effort: '4-8 hours' },
      { task: 'Create automated tests for regression prevention', priority: 'medium', effort: '2-4 hours' },
      { task: 'Update documentation and runbooks', priority: 'low', effort: '1-2 hours' },
      { task: 'Conduct post-incident review', priority: 'medium', effort: '1 hour' }
    ];

    // Add specific tasks based on root cause
    const primaryCause = rootCauseAnalysis.rootCauses[0];
    if (primaryCause && primaryCause.category === 'infrastructure') {
      tasks.push({
        task: 'Review and update infrastructure monitoring',
        priority: 'medium',
        effort: '2-3 hours'
      });
    }

    return tasks;
  },

  identifyRequiredResources(context) {
    return {
      personnel: ['Developer', 'QA Engineer', 'DevOps Engineer'],
      tools: ['Debugging tools', 'Testing framework', 'Monitoring dashboard'],
      access: ['Production logs', 'Database access', 'External API documentation'],
      time: this.estimateOverallTime(context)
    };
  },

  estimateOverallTime(context) {
    const severity = context.issueDetails.severity || 'medium';
    const complexity = context.analysisDepth;
    
    const timeEstimates = {
      'critical': { 'quick': '2-4 hours', 'standard': '4-8 hours', 'thorough': '8-16 hours' },
      'high': { 'quick': '4-8 hours', 'standard': '1-2 days', 'thorough': '2-3 days' },
      'medium': { 'quick': '1-2 days', 'standard': '2-4 days', 'thorough': '1 week' },
      'low': { 'quick': '2-4 days', 'standard': '1 week', 'thorough': '2 weeks' }
    };
    
    return timeEstimates[severity]?.[complexity] || '1-2 days';
  },

  createFixTimeline(context, solutions) {
    const milestones = [
      { milestone: 'Issue reproduced and understood', timeline: '1-2 hours' },
      { milestone: 'Immediate workaround deployed', timeline: '2-4 hours' },
      { milestone: 'Root cause fix implemented', timeline: '1-3 days' },
      { milestone: 'Testing completed', timeline: '3-5 days' },
      { milestone: 'Fix deployed to production', timeline: '5-7 days' },
      { milestone: 'Issue monitoring and validation', timeline: '7-14 days' }
    ];

    return {
      milestones,
      criticalPath: ['Issue reproduction', 'Fix implementation', 'Testing', 'Deployment'],
      dependencies: this.identifyFixDependencies(context)
    };
  },

  identifyFixDependencies(context) {
    const dependencies = [];
    
    if (context.debuggingContext.affectedComponents && context.debuggingContext.affectedComponents.length > 1) {
      dependencies.push('Coordination between multiple teams');
    }
    
    if (context.issueDetails.severity === 'critical') {
      dependencies.push('Management approval for emergency deployment');
    }
    
    return dependencies;
  },

  assessFixRisks(context, solutions) {
    return {
      implementationRisks: [
        { risk: 'Fix introduces new issues', probability: 'medium', impact: 'high', mitigation: 'Comprehensive testing' },
        { risk: 'Deployment causes downtime', probability: 'low', impact: 'medium', mitigation: 'Blue-green deployment' }
      ],
      scheduleRisks: [
        { risk: 'Fix takes longer than estimated', probability: 'medium', impact: 'medium', mitigation: 'Parallel workstreams' }
      ],
      qualityRisks: [
        { risk: 'Incomplete fix leads to recurrence', probability: 'low', impact: 'high', mitigation: 'Thorough root cause analysis' }
      ]
    };
  },

  defineSuccessCriteria(context) {
    return {
      primary: [
        'Issue no longer occurs in production',
        'All affected functionality works as expected',
        'No new issues introduced by the fix'
      ],
      secondary: [
        'Improved monitoring provides early warning',
        'Documentation updated with lessons learned',
        'Team knowledge improved for similar issues'
      ],
      metrics: [
        'Error rate returns to baseline',
        'User reports of issue cease',
        'System performance metrics remain stable'
      ]
    };
  },

  async createDebuggingWorkflow(context, issueAnalysis) {
    return {
      methodology: this.defineWorkflowMethodology(context),
      steps: this.defineDebuggingSteps(context, issueAnalysis),
      tools: this.recommendDebuggingTools(context, issueAnalysis),
      checkpoints: this.defineDebuggingCheckpoints(context),
      escalation: this.defineEscalationProcedure(context, issueAnalysis)
    };
  },

  defineWorkflowMethodology(context) {
    const methodologies = {
      'systematic': 'Follow structured debugging process with documentation at each step',
      'hypothesis-driven': 'Form and test hypotheses iteratively with quick feedback loops',
      'divide-conquer': 'Break down system into smaller parts and test each independently',
      'trace-based': 'Use comprehensive logging and tracing to follow execution path'
    };
    
    return methodologies[context.debuggingStrategy] || methodologies['systematic'];
  },

  defineDebuggingSteps(context, issueAnalysis) {
    const baseSteps = [
      'Gather all available information and evidence',
      'Reproduce the issue in a controlled environment',
      'Form initial hypotheses about potential causes',
      'Design tests to validate or refute hypotheses',
      'Execute tests and collect results',
      'Analyze results and refine hypotheses',
      'Identify root cause and contributing factors',
      'Design and implement solution',
      'Test solution thoroughly',
      'Deploy fix and monitor results'
    ];

    // Customize based on issue classification
    const classification = issueAnalysis.classification.primary;
    if (classification === 'performance-issue') {
      baseSteps.splice(3, 0, 'Set up performance profiling and monitoring');
    } else if (classification === 'integration-issue') {
      baseSteps.splice(3, 0, 'Test external dependencies and connections');
    }

    return baseSteps;
  },

  recommendDebuggingTools(context, issueAnalysis) {
    const tools = {
      general: ['Browser DevTools', 'IDE Debugger', 'Log Analysis Tools'],
      specific: []
    };

    const classification = issueAnalysis.classification.primary;
    switch (classification) {
      case 'performance-issue':
        tools.specific.push('Performance Profiler', 'Memory Analyzer', 'CPU Monitor');
        break;
      case 'integration-issue':
        tools.specific.push('API Testing Tools', 'Network Monitor', 'Service Health Dashboard');
        break;
      case 'ui-issue':
        tools.specific.push('Visual Regression Tools', 'Cross-browser Testing', 'Accessibility Checker');
        break;
      default:
        tools.specific.push('Code Analysis Tools', 'Unit Test Framework', 'Static Analysis');
    }

    return tools;
  },

  defineDebuggingCheckpoints(context) {
    return [
      { checkpoint: 'Issue successfully reproduced', criteria: 'Can consistently trigger the issue' },
      { checkpoint: 'Root cause identified', criteria: 'Clear understanding of why issue occurs' },
      { checkpoint: 'Solution validated', criteria: 'Fix resolves issue without side effects' },
      { checkpoint: 'Prevention measures in place', criteria: 'Safeguards prevent recurrence' }
    ];
  },

  defineEscalationProcedure(context, issueAnalysis) {
    const severity = issueAnalysis.severity.level;
    
    const procedures = {
      'critical': {
        immediate: 'Notify on-call engineer and team lead immediately',
        timeline: 'Escalate to management if not resolved in 2 hours',
        resources: 'All hands on deck, involve external experts if needed'
      },
      'high': {
        immediate: 'Notify team lead and senior developer',
        timeline: 'Escalate if not resolved in 24 hours',
        resources: 'Assign additional developer if needed'
      },
      'medium': {
        immediate: 'Assign to experienced developer',
        timeline: 'Review progress in 48 hours',
        resources: 'Provide support as needed'
      },
      'low': {
        immediate: 'Add to regular development backlog',
        timeline: 'Review in next sprint planning',
        resources: 'Normal development resources'
      }
    };
    
    return procedures[severity] || procedures['medium'];
  },

  async generatePreventionStrategies(context, rootCauseAnalysis) {
    return {
      immediate: this.generateImmediatePreventionStrategies(context, rootCauseAnalysis),
      longTerm: this.generateLongTermPreventionStrategies(context, rootCauseAnalysis),
      processImprovements: this.generateProcessImprovements(context, rootCauseAnalysis),
      toolingEnhancements: this.generateToolingEnhancements(context, rootCauseAnalysis)
    };
  },

  generateImmediatePreventionStrategies(context, rootCauseAnalysis) {
    return [
      'Add comprehensive logging around affected functionality',
      'Implement input validation and error handling',
      'Add monitoring alerts for similar symptoms',
      'Create automated tests for this specific scenario'
    ];
  },

  generateLongTermPreventionStrategies(context, rootCauseAnalysis) {
    return [
      'Implement comprehensive integration testing',
      'Establish performance benchmarking and regression testing',
      'Create architectural guidelines to prevent similar issues',
      'Develop team training on common pitfalls and best practices'
    ];
  },

  generateProcessImprovements(context, rootCauseAnalysis) {
    return [
      'Enhanced code review checklist focusing on issue category',
      'Pre-deployment testing protocols',
      'Incident response runbooks',
      'Regular architecture and security reviews'
    ];
  },

  generateToolingEnhancements(context, rootCauseAnalysis) {
    return [
      'Automated testing pipeline improvements',
      'Enhanced monitoring and alerting systems',
      'Static code analysis tools',
      'Deployment automation and rollback capabilities'
    ];
  },

  async formatDebugOutput(context, issueAnalysis, rootCauseAnalysis, solutions, fixPlan, workflow, prevention) {
    let output = `🐛 **Issue Debug Analysis: ${context.issueTitle}**\n\n`;
    output += `🔍 **Debugging Strategy:** ${context.debuggingStrategy}\n`;
    output += `📊 **Analysis Depth:** ${context.analysisDepth}\n`;
    output += `⚡ **Severity:** ${issueAnalysis.severity.level} (${issueAnalysis.urgency} urgency)\n`;
    output += `🎯 **Classification:** ${issueAnalysis.classification.primary}\n`;
    output += `🆔 **Debug Session:** ${context.debugSessionId}\n\n`;

    // Issue Summary
    if (context.issueDetails.description) {
      output += `## 📋 Issue Summary\n\n`;
      output += `**Description:** ${context.issueDetails.description}\n\n`;
      
      if (context.issueDetails.errorMessage) {
        output += `**Error Message:** \`${context.issueDetails.errorMessage}\`\n\n`;
      }
      
      if (context.issueDetails.reproducingSteps) {
        output += `**Reproduction Steps:**\n`;
        context.issueDetails.reproducingSteps.forEach((step, index) => {
          output += `${index + 1}. ${step}\n`;
        });
        output += '\n';
      }
    }

    // Impact Assessment
    output += `## 📈 Impact Assessment\n\n`;
    output += `**User Impact:** ${issueAnalysis.impact.users}\n`;
    output += `**Business Impact:** ${issueAnalysis.impact.business}\n`;
    output += `**Technical Impact:** ${issueAnalysis.impact.technical}\n`;
    output += `**Complexity:** ${issueAnalysis.complexity}\n\n`;

    // Root Cause Analysis
    output += `## 🎯 Root Cause Analysis\n\n`;
    output += `**Methodology:** ${rootCauseAnalysis.methodology.name}\n\n`;
    
    if (rootCauseAnalysis.rootCauses.length > 0) {
      output += `**Identified Root Causes:**\n`;
      rootCauseAnalysis.rootCauses.forEach((cause, index) => {
        output += `${index + 1}. **${cause.cause}** (${cause.category}, ${cause.fixability} to fix)\n`;
      });
      output += '\n';
    }

    // Top Hypotheses
    if (rootCauseAnalysis.hypotheses.length > 0) {
      output += `**Top Hypotheses:**\n`;
      rootCauseAnalysis.hypotheses.slice(0, 3).forEach((hypothesis, index) => {
        output += `${index + 1}. **${hypothesis.hypothesis}** (${hypothesis.probability} probability)\n`;
        output += `   *Test Method:* ${hypothesis.testMethod}\n`;
      });
      output += '\n';
    }

    // Solution Recommendations
    if (solutions) {
      output += `## 🛠️ Solution Recommendations\n\n`;
      
      if (solutions.immediate.length > 0) {
        output += `**Immediate Actions:**\n`;
        solutions.immediate.forEach((solution, index) => {
          output += `${index + 1}. ${solution.solution} (${solution.effort} effort, ${solution.timeline})\n`;
        });
        output += '\n';
      }
      
      if (solutions.shortTerm.length > 0) {
        output += `**Short-term Solutions:**\n`;
        solutions.shortTerm.forEach((solution, index) => {
          output += `${index + 1}. ${solution.solution} (${solution.timeline})\n`;
        });
        output += '\n';
      }
    }

    // Fix Implementation Plan
    if (fixPlan) {
      output += `## 📋 Fix Implementation Plan\n\n`;
      output += `**Estimated Timeline:** ${fixPlan.resources.time}\n`;
      output += `**Required Resources:** ${fixPlan.resources.personnel.join(', ')}\n\n`;
      
      output += `**Implementation Phases:**\n`;
      fixPlan.phases.forEach((phase, index) => {
        output += `${index + 1}. **${phase.phase}** (${phase.duration})\n`;
        output += `   *Objective:* ${phase.objective}\n`;
      });
      output += '\n';
      
      output += `**Key Tasks:**\n`;
      fixPlan.tasks.slice(0, 5).forEach((task, index) => {
        output += `${index + 1}. ${task.task} (${task.priority} priority, ~${task.effort})\n`;
      });
      output += '\n';
    }

    // Debugging Workflow
    output += `## 🔄 Debugging Workflow\n\n`;
    output += `**Methodology:** ${workflow.methodology}\n\n`;
    
    output += `**Key Steps:**\n`;
    workflow.steps.slice(0, 6).forEach((step, index) => {
      output += `${index + 1}. ${step}\n`;
    });
    output += '\n';
    
    output += `**Recommended Tools:** ${[...workflow.tools.general, ...workflow.tools.specific.slice(0, 3)].join(', ')}\n\n`;

    // Risk Assessment
    if (fixPlan && fixPlan.riskAssessment) {
      output += `## ⚠️ Risk Assessment\n\n`;
      fixPlan.riskAssessment.implementationRisks.forEach((risk, index) => {
        output += `**${risk.risk}** (${risk.probability} probability, ${risk.impact} impact)\n`;
        output += `*Mitigation:* ${risk.mitigation}\n\n`;
      });
    }

    // Prevention Strategies
    if (prevention) {
      output += `## 🛡️ Prevention Strategies\n\n`;
      output += `**Immediate Prevention:**\n`;
      prevention.immediate.forEach((strategy, index) => {
        output += `• ${strategy}\n`;
      });
      output += '\n';
      
      output += `**Long-term Prevention:**\n`;
      prevention.longTerm.slice(0, 3).forEach((strategy, index) => {
        output += `• ${strategy}\n`;
      });
      output += '\n';
    }

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Immediate Action:** ${solutions?.immediate[0]?.solution || 'Begin systematic debugging'}\n`;
    output += `2. **Set up Environment:** Prepare debugging tools and access\n`;
    output += `3. **Reproduce Issue:** Confirm issue can be consistently reproduced\n`;
    output += `4. **Implement Fix:** Follow the implementation plan\n`;
    output += `5. **Validate Solution:** Ensure fix resolves issue completely\n`;
    output += `6. **Deploy & Monitor:** Deploy fix and monitor for effectiveness\n\n`;

    output += `💡 **Debugging Best Practices:**\n`;
    output += `• Document all findings and hypotheses\n`;
    output += `• Test one hypothesis at a time\n`;
    output += `• Keep detailed logs of debugging steps\n`;
    output += `• Don't make multiple changes simultaneously\n`;
    output += `• Validate fix doesn't introduce new issues\n\n`;

    output += `📁 **Complete debug analysis and fix plan saved to project.**`;

    return output;
  },

  async saveDebugSessionToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const debugDir = join(saDir, 'debug-sessions');
      if (!existsSync(debugDir)) {
        require('fs').mkdirSync(debugDir, { recursive: true });
      }
      
      const filename = `debug-session-${context.issueTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(debugDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save debug session:', error.message);
    }
  }
};