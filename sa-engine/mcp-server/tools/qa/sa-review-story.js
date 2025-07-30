import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_review_story MCP Tool
 * Story completeness review, acceptance criteria validation, implementation quality check
 */
export const saReviewStory = {
  name: 'sa_review_story',
  description: 'Review story completeness, validate acceptance criteria, and check implementation quality against requirements',
  category: 'qa',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      storyId: {
        type: 'string',
        description: 'Unique identifier for the story being reviewed',
        minLength: 1
      },
      storyTitle: {
        type: 'string',
        description: 'Title of the story being reviewed',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      storyData: {
        type: 'object',
        description: 'Story data and details',
        properties: {
          description: { type: 'string' },
          acceptanceCriteria: { type: 'array', items: { type: 'string' } },
          requirements: { type: 'array', items: { type: 'string' } },
          dependencies: { type: 'array', items: { type: 'string' } },
          estimatedEffort: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          assignee: { type: 'string' },
          status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'] }
        }
      },
      implementationDetails: {
        type: 'object',
        description: 'Implementation details for validation',
        properties: {
          filesChanged: { type: 'array', items: { type: 'string' } },
          testFiles: { type: 'array', items: { type: 'string' } },
          documentation: { type: 'array', items: { type: 'string' } },
          pullRequestUrl: { type: 'string' },
          commits: { type: 'array', items: { type: 'string' } }
        }
      },
      reviewCriteria: {
        type: 'array',
        description: 'Review criteria to evaluate',
        items: {
          type: 'string',
          enum: ['completeness', 'acceptance-criteria', 'implementation-quality', 'testing', 'documentation', 'dependencies']
        },
        default: ['completeness', 'acceptance-criteria', 'implementation-quality', 'testing']
      },
      reviewLevel: {
        type: 'string',
        description: 'Level of review depth',
        enum: ['quick', 'standard', 'thorough'],
        default: 'standard'
      },
      contextInfo: {
        type: 'object',
        description: 'Context information for the review',
        properties: {
          sprintId: { type: 'string' },
          epicId: { type: 'string' },
          reviewer: { type: 'string' },
          reviewDate: { type: 'string' },
          stakeholders: { type: 'array', items: { type: 'string' } }
        }
      },
      generateReport: {
        type: 'boolean',
        description: 'Generate detailed review report',
        default: true
      }
    },
    required: ['storyId', 'storyTitle']
  },

  validate(args) {
    const errors = [];
    
    if (!args.storyId || typeof args.storyId !== 'string') {
      errors.push('storyId is required and must be a string');
    }
    
    if (!args.storyTitle || typeof args.storyTitle !== 'string') {
      errors.push('storyTitle is required and must be a string');
    }
    
    if (args.storyTitle && args.storyTitle.trim().length === 0) {
      errors.push('storyTitle cannot be empty');
    }
    
    if (args.reviewCriteria && !Array.isArray(args.reviewCriteria)) {
      errors.push('reviewCriteria must be an array');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const storyId = args.storyId.trim();
    const storyTitle = args.storyTitle.trim();
    
    try {
      const reviewContext = {
        storyId,
        storyTitle,
        storyData: args.storyData || {},
        implementationDetails: args.implementationDetails || {},
        reviewCriteria: args.reviewCriteria || ['completeness', 'acceptance-criteria', 'implementation-quality', 'testing'],
        reviewLevel: args.reviewLevel || 'standard',
        contextInfo: args.contextInfo || {},
        generateReport: args.generateReport !== false,
        timestamp: new Date().toISOString(),
        reviewer: context?.userId || 'system',
        reviewId: `story-review-${Date.now()}`
      };

      // Story analysis
      const storyAnalysis = await this.performStoryAnalysis(projectPath, reviewContext);
      
      // Completeness review
      let completenessReview = null;
      if (reviewContext.reviewCriteria.includes('completeness')) {
        completenessReview = await this.performCompletenessReview(reviewContext, storyAnalysis);
      }
      
      // Acceptance criteria validation
      let acceptanceCriteriaReview = null;
      if (reviewContext.reviewCriteria.includes('acceptance-criteria')) {
        acceptanceCriteriaReview = await this.performAcceptanceCriteriaReview(reviewContext, storyAnalysis);
      }
      
      // Implementation quality review
      let implementationReview = null;
      if (reviewContext.reviewCriteria.includes('implementation-quality')) {
        implementationReview = await this.performImplementationReview(reviewContext, storyAnalysis);
      }
      
      // Testing review
      let testingReview = null;
      if (reviewContext.reviewCriteria.includes('testing')) {
        testingReview = await this.performTestingReview(reviewContext, storyAnalysis);
      }
      
      // Documentation review
      let documentationReview = null;
      if (reviewContext.reviewCriteria.includes('documentation')) {
        documentationReview = await this.performDocumentationReview(reviewContext, storyAnalysis);
      }
      
      // Dependencies review
      let dependenciesReview = null;
      if (reviewContext.reviewCriteria.includes('dependencies')) {
        dependenciesReview = await this.performDependenciesReview(reviewContext, storyAnalysis);
      }
      
      // Overall assessment
      const overallAssessment = await this.performOverallAssessment(
        reviewContext,
        completenessReview,
        acceptanceCriteriaReview,
        implementationReview,
        testingReview,
        documentationReview,
        dependenciesReview
      );
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        reviewContext,
        overallAssessment,
        completenessReview,
        acceptanceCriteriaReview,
        implementationReview,
        testingReview,
        documentationReview,
        dependenciesReview
      );
      
      // Approval workflow
      const approvalStatus = await this.generateApprovalStatus(reviewContext, overallAssessment, recommendations);
      
      // Create review report
      let reviewReport = null;
      if (reviewContext.generateReport) {
        reviewReport = await this.generateStoryReviewReport(
          reviewContext,
          storyAnalysis,
          overallAssessment,
          completenessReview,
          acceptanceCriteriaReview,
          implementationReview,
          testingReview,
          documentationReview,
          dependenciesReview,
          recommendations,
          approvalStatus
        );
      }
      
      // Format output
      const output = await this.formatStoryReviewOutput(
        reviewContext,
        overallAssessment,
        completenessReview,
        acceptanceCriteriaReview,
        implementationReview,
        testingReview,
        documentationReview,
        dependenciesReview,
        recommendations,
        approvalStatus
      );
      
      // Save review results
      await this.saveStoryReviewToProject(projectPath, reviewContext, {
        analysis: storyAnalysis,
        assessment: overallAssessment,
        completeness: completenessReview,
        acceptanceCriteria: acceptanceCriteriaReview,
        implementation: implementationReview,
        testing: testingReview,
        documentation: documentationReview,
        dependencies: dependenciesReview,
        recommendations,
        approval: approvalStatus,
        report: reviewReport
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          storyId,
          storyTitle,
          reviewLevel: args.reviewLevel,
          overallScore: overallAssessment.score,
          approvalStatus: approvalStatus.status,
          criticalIssues: overallAssessment.criticalIssues,
          reviewId: reviewContext.reviewId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to review story ${storyId}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, storyId, storyTitle, projectPath }
      };
    }
  },

  async performStoryAnalysis(projectPath, context) {
    return {
      story: {
        id: context.storyId,
        title: context.storyTitle,
        status: context.storyData.status || 'unknown',
        priority: context.storyData.priority || 'medium',
        assignee: context.storyData.assignee || 'unassigned',
        estimatedEffort: context.storyData.estimatedEffort || 'not-estimated'
      },
      structure: {
        hasDescription: !!(context.storyData.description && context.storyData.description.trim()),
        acceptanceCriteriaCount: (context.storyData.acceptanceCriteria || []).length,
        requirementsCount: (context.storyData.requirements || []).length,
        dependenciesCount: (context.storyData.dependencies || []).length
      },
      implementation: {
        filesChangedCount: (context.implementationDetails.filesChanged || []).length,
        testFilesCount: (context.implementationDetails.testFiles || []).length,
        documentationCount: (context.implementationDetails.documentation || []).length,
        hasPullRequest: !!(context.implementationDetails.pullRequestUrl),
        commitsCount: (context.implementationDetails.commits || []).length
      }
    };
  },

  async performCompletenessReview(context, analysis) {
    const issues = [];
    const warnings = [];
    let score = 100;

    // Check story description
    if (!analysis.structure.hasDescription) {
      issues.push({
        type: 'missing-description',
        severity: 'high',
        message: 'Story lacks a clear description',
        suggestion: 'Add a comprehensive story description explaining the user need and value'
      });
      score -= 20;
    }

    // Check acceptance criteria
    if (analysis.structure.acceptanceCriteriaCount === 0) {
      issues.push({
        type: 'missing-acceptance-criteria',
        severity: 'critical',
        message: 'Story has no acceptance criteria defined',
        suggestion: 'Define clear, testable acceptance criteria for the story'
      });
      score -= 30;
    } else if (analysis.structure.acceptanceCriteriaCount < 2) {
      warnings.push({
        type: 'minimal-acceptance-criteria',
        severity: 'medium',
        message: 'Story has very few acceptance criteria',
        suggestion: 'Consider adding more detailed acceptance criteria to cover edge cases'
      });
      score -= 10;
    }

    // Check requirements
    if (analysis.structure.requirementsCount === 0) {
      warnings.push({
        type: 'missing-requirements',
        severity: 'medium',
        message: 'Story lacks detailed requirements',
        suggestion: 'Add technical or business requirements for clarity'
      });
      score -= 10;
    }

    // Check effort estimation
    if (analysis.story.estimatedEffort === 'not-estimated') {
      warnings.push({
        type: 'missing-estimation',
        severity: 'low',
        message: 'Story lacks effort estimation',
        suggestion: 'Add story point or time estimation for planning'
      });
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      completenessLevel: this.calculateCompletenessLevel(score),
      recommendations: this.generateCompletenessRecommendations(issues, warnings)
    };
  },

  calculateCompletenessLevel(score) {
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'acceptable';
    if (score >= 50) return 'poor';
    return 'incomplete';
  },

  generateCompletenessRecommendations(issues, warnings) {
    const recommendations = [];
    
    if (issues.length > 0) {
      recommendations.push('Address critical completeness issues before proceeding with implementation');
    }
    
    if (warnings.length > 0) {
      recommendations.push('Improve story details to enhance clarity and reduce ambiguity');
    }
    
    return recommendations;
  },

  async performAcceptanceCriteriaReview(context, analysis) {
    const issues = [];
    const warnings = [];
    let score = 100;

    const acceptanceCriteria = context.storyData.acceptanceCriteria || [];

    if (acceptanceCriteria.length === 0) {
      issues.push({
        type: 'no-acceptance-criteria',
        severity: 'critical',
        message: 'No acceptance criteria defined',
        suggestion: 'Define specific, measurable acceptance criteria'
      });
      score = 0;
    } else {
      // Analyze each acceptance criterion
      acceptanceCriteria.forEach((criterion, index) => {
        const analysis = this.analyzeAcceptanceCriterion(criterion, index);
        if (analysis.issues.length > 0) {
          issues.push(...analysis.issues);
          score -= 10;
        }
        if (analysis.warnings.length > 0) {
          warnings.push(...analysis.warnings);
          score -= 5;
        }
      });

      // Check for testability
      const testabilityScore = this.assessCriteriaTestability(acceptanceCriteria);
      if (testabilityScore < 70) {
        warnings.push({
          type: 'low-testability',
          severity: 'medium',
          message: 'Some acceptance criteria are difficult to test automatically',
          suggestion: 'Make acceptance criteria more specific and measurable'
        });
        score -= 15;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      criteriaCount: acceptanceCriteria.length,
      testabilityScore: acceptanceCriteria.length > 0 ? this.assessCriteriaTestability(acceptanceCriteria) : 0,
      qualityLevel: this.calculateCriteriaQuality(score),
      recommendations: this.generateCriteriaRecommendations(issues, warnings, acceptanceCriteria)
    };
  },

  analyzeAcceptanceCriterion(criterion, index) {
    const issues = [];
    const warnings = [];

    // Check if criterion is too vague
    if (criterion.length < 10) {
      warnings.push({
        type: 'vague-criterion',
        severity: 'medium',
        criterionIndex: index,
        message: `Acceptance criterion ${index + 1} is too brief and may be vague`,
        suggestion: 'Provide more specific and detailed acceptance criteria'
      });
    }

    // Check for action words
    const hasActionWords = /\b(should|must|will|can|shall)\b/i.test(criterion);
    if (!hasActionWords) {
      warnings.push({
        type: 'unclear-expectation',
        severity: 'low',
        criterionIndex: index,
        message: `Acceptance criterion ${index + 1} lacks clear expectation words`,
        suggestion: 'Use words like "should", "must", "will" to clarify expectations'
      });
    }

    return { issues, warnings };
  },

  assessCriteriaTestability(criteria) {
    let testableCount = 0;
    
    criteria.forEach(criterion => {
      // Simple heuristic for testability
      const hasSpecificConditions = /\b(when|if|given|then)\b/i.test(criterion);
      const hasVerifiableOutcome = /\b(display|show|return|redirect|save|update|delete)\b/i.test(criterion);
      
      if (hasSpecificConditions || hasVerifiableOutcome) {
        testableCount++;
      }
    });

    return criteria.length > 0 ? Math.round((testableCount / criteria.length) * 100) : 0;
  },

  calculateCriteriaQuality(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    if (score >= 50) return 'poor';
    return 'inadequate';
  },

  generateCriteriaRecommendations(issues, warnings, criteria) {
    const recommendations = [];
    
    if (criteria.length === 0) {
      recommendations.push('Define at least 3-5 clear acceptance criteria');
      recommendations.push('Use Given-When-Then format for clarity');
    } else {
      if (issues.length > 0) {
        recommendations.push('Revise critical acceptance criteria issues');
      }
      if (warnings.length > 0) {
        recommendations.push('Improve clarity and specificity of acceptance criteria');
      }
      if (criteria.length < 3) {
        recommendations.push('Consider adding more acceptance criteria to cover edge cases');
      }
    }
    
    return recommendations;
  },

  async performImplementationReview(context, analysis) {
    const issues = [];
    const warnings = [];
    let score = 100;

    // Check if implementation exists
    if (analysis.implementation.filesChangedCount === 0) {
      if (context.storyData.status === 'done') {
        issues.push({
          type: 'no-implementation',
          severity: 'critical',
          message: 'Story marked as done but no implementation files found',
          suggestion: 'Provide implementation details or update story status'
        });
        score -= 50;
      } else {
        warnings.push({
          type: 'no-implementation-yet',
          severity: 'low',
          message: 'No implementation details provided yet',
          suggestion: 'Add implementation details when available'
        });
        score -= 10;
      }
    } else {
      // Check implementation completeness
      if (analysis.implementation.filesChangedCount < 2) {
        warnings.push({
          type: 'minimal-implementation',
          severity: 'medium',
          message: 'Very few files changed for this story',
          suggestion: 'Verify that implementation is complete'
        });
        score -= 10;
      }

      // Check for pull request
      if (!analysis.implementation.hasPullRequest) {
        warnings.push({
          type: 'no-pull-request',
          severity: 'medium',
          message: 'No pull request associated with this story',
          suggestion: 'Create pull request for proper code review'
        });
        score -= 10;
      }

      // Check commits
      if (analysis.implementation.commitsCount === 0) {
        warnings.push({
          type: 'no-commits',
          severity: 'medium',
          message: 'No commits associated with this story',
          suggestion: 'Ensure proper version control tracking'
        });
        score -= 10;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      implementationLevel: this.calculateImplementationLevel(score, analysis),
      filesChanged: analysis.implementation.filesChangedCount,
      hasCodeReview: analysis.implementation.hasPullRequest,
      recommendations: this.generateImplementationRecommendations(issues, warnings, analysis)
    };
  },

  calculateImplementationLevel(score, analysis) {
    if (analysis.implementation.filesChangedCount === 0) return 'none';
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    return 'needs-improvement';
  },

  generateImplementationRecommendations(issues, warnings, analysis) {
    const recommendations = [];
    
    if (analysis.implementation.filesChangedCount === 0) {
      recommendations.push('Provide implementation details and file changes');
    } else {
      if (!analysis.implementation.hasPullRequest) {
        recommendations.push('Create pull request for code review');
      }
      if (analysis.implementation.commitsCount === 0) {
        recommendations.push('Ensure proper version control with meaningful commits');
      }
    }
    
    return recommendations;
  },

  async performTestingReview(context, analysis) {
    const issues = [];
    const warnings = [];
    let score = 100;

    // Check test files
    if (analysis.implementation.testFilesCount === 0) {
      if (context.storyData.status === 'done') {
        issues.push({
          type: 'no-tests',
          severity: 'high',
          message: 'Story completed without associated test files',
          suggestion: 'Add unit tests and integration tests for the implementation'
        });
        score -= 40;
      } else {
        warnings.push({
          type: 'tests-pending',
          severity: 'medium',
          message: 'No test files identified yet',
          suggestion: 'Plan and implement tests as part of the story'
        });
        score -= 20;
      }
    } else {
      // Check test coverage ratio
      const testToImplementationRatio = analysis.implementation.testFilesCount / Math.max(1, analysis.implementation.filesChangedCount);
      
      if (testToImplementationRatio < 0.5) {
        warnings.push({
          type: 'low-test-coverage',
          severity: 'medium',
          message: 'Low ratio of test files to implementation files',
          suggestion: 'Increase test coverage to ensure quality'
        });
        score -= 15;
      }
    }

    // Check for acceptance criteria testing
    const acceptanceCriteriaCount = analysis.structure.acceptanceCriteriaCount;
    if (acceptanceCriteriaCount > 0 && analysis.implementation.testFilesCount === 0) {
      issues.push({
        type: 'untested-acceptance-criteria',
        severity: 'high',
        message: 'Acceptance criteria defined but no tests to validate them',
        suggestion: 'Create tests that validate each acceptance criterion'
      });
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      testFilesCount: analysis.implementation.testFilesCount,
      testCoverageLevel: this.calculateTestCoverageLevel(score),
      testToImplementationRatio: analysis.implementation.filesChangedCount > 0 ? 
        analysis.implementation.testFilesCount / analysis.implementation.filesChangedCount : 0,
      recommendations: this.generateTestingRecommendations(issues, warnings, analysis)
    };
  },

  calculateTestCoverageLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    if (score >= 50) return 'poor';
    return 'inadequate';
  },

  generateTestingRecommendations(issues, warnings, analysis) {
    const recommendations = [];
    
    if (analysis.implementation.testFilesCount === 0) {
      recommendations.push('Create comprehensive test suite for the story');
      recommendations.push('Test each acceptance criterion with automated tests');
    } else {
      const ratio = analysis.implementation.testFilesCount / Math.max(1, analysis.implementation.filesChangedCount);
      if (ratio < 0.5) {
        recommendations.push('Increase test coverage for better quality assurance');
      }
    }
    
    return recommendations;
  },

  async performDocumentationReview(context, analysis) {
    const issues = [];
    const warnings = [];
    let score = 100;

    // Check documentation files
    if (analysis.implementation.documentationCount === 0) {
      if (context.storyData.priority === 'high' || context.storyData.priority === 'critical') {
        warnings.push({
          type: 'missing-documentation',
          severity: 'medium',
          message: 'High priority story lacks documentation',
          suggestion: 'Add documentation for user guides or technical specifications'
        });
        score -= 20;
      } else {
        warnings.push({
          type: 'no-documentation',
          severity: 'low',
          message: 'No documentation files associated with story',
          suggestion: 'Consider adding documentation if needed for user understanding'
        });
        score -= 10;
      }
    }

    // Check story description as documentation
    if (!analysis.structure.hasDescription) {
      warnings.push({
        type: 'inadequate-story-documentation',
        severity: 'medium',
        message: 'Story itself lacks proper documentation in description',
        suggestion: 'Improve story description for better understanding'
      });
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      documentationCount: analysis.implementation.documentationCount,
      documentationLevel: this.calculateDocumentationLevel(score),
      recommendations: this.generateDocumentationRecommendations(issues, warnings, context, analysis)
    };
  },

  calculateDocumentationLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    return 'needs-improvement';
  },

  generateDocumentationRecommendations(issues, warnings, context, analysis) {
    const recommendations = [];
    
    if (analysis.implementation.documentationCount === 0) {
      if (context.storyData.priority === 'high' || context.storyData.priority === 'critical') {
        recommendations.push('Add user documentation for this high-priority feature');
      } else {
        recommendations.push('Consider adding documentation if the feature is user-facing');
      }
    }
    
    if (!analysis.structure.hasDescription) {
      recommendations.push('Improve story description for better team understanding');
    }
    
    return recommendations;
  },

  async performDependenciesReview(context, analysis) {
    const issues = [];
    const warnings = [];
    let score = 100;

    const dependencies = context.storyData.dependencies || [];

    // Check for blocked dependencies
    if (dependencies.length > 0) {
      // Simulate dependency status check
      const blockedDependencies = dependencies.filter(dep => 
        dep.includes('blocked') || dep.includes('pending')
      );
      
      if (blockedDependencies.length > 0) {
        issues.push({
          type: 'blocked-dependencies',
          severity: 'high',
          message: `${blockedDependencies.length} dependencies are blocked or pending`,
          suggestion: 'Resolve blocked dependencies before proceeding with story',
          blockedDependencies
        });
        score -= 30;
      }

      // Check for circular dependencies
      const circularDependencies = this.detectCircularDependencies(context.storyId, dependencies);
      if (circularDependencies.length > 0) {
        issues.push({
          type: 'circular-dependencies',
          severity: 'critical',
          message: 'Circular dependencies detected',
          suggestion: 'Resolve circular dependencies by refactoring story breakdown',
          circularDependencies
        });
        score -= 40;
      }
    }

    // Check if story should have dependencies but doesn't
    if (dependencies.length === 0 && (context.storyData.priority === 'high' || context.storyData.priority === 'critical')) {
      warnings.push({
        type: 'missing-dependency-analysis',
        severity: 'low',
        message: 'High priority story may have undocumented dependencies',
        suggestion: 'Review and document any dependencies this story might have'
      });
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      dependenciesCount: dependencies.length,
      blockedCount: dependencies.filter(dep => dep.includes('blocked')).length,
      dependencyHealth: this.calculateDependencyHealth(score),
      recommendations: this.generateDependencyRecommendations(issues, warnings, dependencies)
    };
  },

  detectCircularDependencies(storyId, dependencies) {
    // Simplified circular dependency detection
    return dependencies.filter(dep => dep.includes(storyId));
  },

  calculateDependencyHealth(score) {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'acceptable';
    if (score >= 50) return 'concerning';
    return 'blocked';
  },

  generateDependencyRecommendations(issues, warnings, dependencies) {
    const recommendations = [];
    
    const blockedCount = dependencies.filter(dep => dep.includes('blocked')).length;
    if (blockedCount > 0) {
      recommendations.push(`Resolve ${blockedCount} blocked dependencies before implementation`);
    }
    
    if (dependencies.length === 0) {
      recommendations.push('Review potential dependencies and document them');
    }
    
    return recommendations;
  },

  async performOverallAssessment(context, completeness, acceptanceCriteria, implementation, testing, documentation, dependencies) {
    const scores = [];
    const criticalIssues = [];
    const allIssues = [];
    const allWarnings = [];

    // Collect scores and issues
    if (completeness) {
      scores.push({ category: 'completeness', score: completeness.score, weight: 0.25 });
      criticalIssues.push(...completeness.issues.filter(i => i.severity === 'critical'));
      allIssues.push(...completeness.issues);
      allWarnings.push(...completeness.warnings);
    }

    if (acceptanceCriteria) {
      scores.push({ category: 'acceptance-criteria', score: acceptanceCriteria.score, weight: 0.30 });
      criticalIssues.push(...acceptanceCriteria.issues.filter(i => i.severity === 'critical'));
      allIssues.push(...acceptanceCriteria.issues);
      allWarnings.push(...acceptanceCriteria.warnings);
    }

    if (implementation) {
      scores.push({ category: 'implementation', score: implementation.score, weight: 0.20 });
      criticalIssues.push(...implementation.issues.filter(i => i.severity === 'critical'));
      allIssues.push(...implementation.issues);
      allWarnings.push(...implementation.warnings);
    }

    if (testing) {
      scores.push({ category: 'testing', score: testing.score, weight: 0.15 });
      criticalIssues.push(...testing.issues.filter(i => i.severity === 'critical'));
      allIssues.push(...testing.issues);
      allWarnings.push(...testing.warnings);
    }

    if (documentation) {
      scores.push({ category: 'documentation', score: documentation.score, weight: 0.05 });
      allIssues.push(...documentation.issues);
      allWarnings.push(...documentation.warnings);
    }

    if (dependencies) {
      scores.push({ category: 'dependencies', score: dependencies.score, weight: 0.05 });
      criticalIssues.push(...dependencies.issues.filter(i => i.severity === 'critical'));
      allIssues.push(...dependencies.issues);
      allWarnings.push(...dependencies.warnings);
    }

    // Calculate weighted overall score
    let weightedScore = 0;
    let totalWeight = 0;
    scores.forEach(({ score, weight }) => {
      weightedScore += score * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    const qualityGrade = this.calculateStoryQualityGrade(overallScore, criticalIssues.length);

    return {
      score: overallScore,
      qualityGrade,
      criticalIssues: criticalIssues.length,
      totalIssues: allIssues.length,
      totalWarnings: allWarnings.length,
      categoryScores: scores.reduce((acc, { category, score }) => {
        acc[category] = score;
        return acc;
      }, {}),
      readyForImplementation: this.assessReadinessForImplementation(overallScore, criticalIssues),
      readyForDeployment: this.assessReadinessForDeployment(overallScore, criticalIssues, context.storyData.status)
    };
  },

  calculateStoryQualityGrade(score, criticalIssues) {
    if (criticalIssues > 0) return 'F';
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  assessReadinessForImplementation(score, criticalIssues) {
    return score >= 80 && criticalIssues.length === 0;
  },

  assessReadinessForDeployment(score, criticalIssues, status) {
    return score >= 90 && criticalIssues.length === 0 && status === 'done';
  },

  async generateRecommendations(context, assessment, completeness, acceptanceCriteria, implementation, testing, documentation, dependencies) {
    const recommendations = {
      critical: [],
      important: [],
      suggested: []
    };

    // Critical recommendations
    if (assessment.criticalIssues > 0) {
      recommendations.critical.push({
        action: 'Resolve all critical issues before proceeding',
        priority: 'critical',
        timeline: 'immediate',
        impact: 'blocks story progress'
      });
    }

    // Important recommendations
    if (assessment.score < 80) {
      recommendations.important.push({
        action: 'Improve story quality score to at least 80%',
        priority: 'high',
        timeline: '1-2 days',
        impact: 'enables successful implementation'
      });
    }

    if (!assessment.readyForImplementation && context.storyData.status === 'in-progress') {
      recommendations.important.push({
        action: 'Complete story preparation before continuing implementation',
        priority: 'high',
        timeline: '1 day',
        impact: 'prevents rework and delays'
      });
    }

    // Collect category-specific recommendations
    [completeness, acceptanceCriteria, implementation, testing, documentation, dependencies]
      .filter(review => review && review.recommendations)
      .forEach(review => {
        review.recommendations.forEach(rec => {
          recommendations.suggested.push({
            action: rec,
            priority: 'medium',
            timeline: '2-3 days',
            impact: 'improves story quality'
          });
        });
      });

    return recommendations;
  },

  async generateApprovalStatus(context, assessment, recommendations) {
    let status = 'pending';
    let message = '';
    const blockers = [];

    if (assessment.criticalIssues > 0) {
      status = 'rejected';
      message = 'Story has critical issues that must be resolved';
      blockers.push(`${assessment.criticalIssues} critical issues found`);
    } else if (assessment.score < 70) {
      status = 'conditional';
      message = 'Story needs improvements before approval';
      blockers.push('Overall quality score below 70%');
    } else if (assessment.score >= 90 && assessment.criticalIssues === 0) {
      status = 'approved';
      message = 'Story meets all quality criteria and is ready for implementation';
    } else {
      status = 'conditional';
      message = 'Story is acceptable but could be improved';
    }

    return {
      status,
      message,
      blockers,
      approvalScore: assessment.score,
      canProceed: status === 'approved' || (status === 'conditional' && assessment.score >= 70),
      nextActions: this.generateNextActions(status, recommendations)
    };
  },

  generateNextActions(status, recommendations) {
    const actions = [];

    if (status === 'rejected') {
      actions.push('Address all critical issues immediately');
      actions.push('Request re-review after fixes');
    } else if (status === 'conditional') {
      actions.push('Address high-priority recommendations');
      actions.push('Improve story quality score');
      actions.push('Consider addressing suggested improvements');
    } else if (status === 'approved') {
      actions.push('Proceed with implementation');
      actions.push('Monitor progress against acceptance criteria');
      actions.push('Schedule follow-up review during implementation');
    }

    return actions;
  },

  async generateStoryReviewReport(context, analysis, assessment, completeness, acceptanceCriteria, implementation, testing, documentation, dependencies, recommendations, approval) {
    return {
      metadata: {
        storyId: context.storyId,
        storyTitle: context.storyTitle,
        reviewLevel: context.reviewLevel,
        reviewer: context.reviewer,
        reviewDate: context.timestamp,
        reviewId: context.reviewId
      },
      summary: {
        overallScore: assessment.score,
        qualityGrade: assessment.qualityGrade,
        approvalStatus: approval.status,
        criticalIssues: assessment.criticalIssues,
        totalIssues: assessment.totalIssues,
        totalWarnings: assessment.totalWarnings,
        readyForImplementation: assessment.readyForImplementation,
        readyForDeployment: assessment.readyForDeployment
      },
      story: analysis.story,
      categoryResults: {
        completeness,
        acceptanceCriteria,
        implementation,
        testing,
        documentation,
        dependencies
      },
      recommendations,
      approval,
      actionPlan: this.createStoryActionPlan(recommendations, approval)
    };
  },

  createStoryActionPlan(recommendations, approval) {
    return {
      immediate: recommendations.critical || [],
      shortTerm: recommendations.important || [],
      longTerm: recommendations.suggested || [],
      nextSteps: approval.nextActions || []
    };
  },

  async formatStoryReviewOutput(context, assessment, completeness, acceptanceCriteria, implementation, testing, documentation, dependencies, recommendations, approval) {
    let output = `📋 **Story Review: ${context.storyTitle}**\n\n`;
    output += `🎯 **Story ID:** ${context.storyId}\n`;
    output += `📊 **Review Level:** ${context.reviewLevel}\n`;
    output += `⭐ **Overall Score:** ${assessment.score}/100 (Grade: ${assessment.qualityGrade})\n`;
    output += `✅ **Approval Status:** ${approval.status.toUpperCase()}\n`;
    output += `🆔 **Review ID:** ${context.reviewId}\n\n`;

    // Approval Status
    const statusEmoji = approval.status === 'approved' ? '✅' : approval.status === 'conditional' ? '⚠️' : '❌';
    output += `## ${statusEmoji} Approval Status\n\n`;
    output += `**Status:** ${approval.status.toUpperCase()}\n`;
    output += `**Message:** ${approval.message}\n`;
    if (approval.blockers.length > 0) {
      output += `**Blockers:**\n`;
      approval.blockers.forEach(blocker => {
        output += `• ${blocker}\n`;
      });
    }
    output += `**Can Proceed:** ${approval.canProceed ? 'Yes' : 'No'}\n\n`;

    // Review Summary
    output += `## 📊 Review Summary\n\n`;
    output += `**Quality Metrics:**\n`;
    output += `• Overall Score: ${assessment.score}/100\n`;
    output += `• Quality Grade: ${assessment.qualityGrade}\n`;
    output += `• Critical Issues: ${assessment.criticalIssues}\n`;
    output += `• Total Issues: ${assessment.totalIssues}\n`;
    output += `• Warnings: ${assessment.totalWarnings}\n`;
    output += `• Ready for Implementation: ${assessment.readyForImplementation ? '✅' : '❌'}\n`;
    output += `• Ready for Deployment: ${assessment.readyForDeployment ? '✅' : '❌'}\n\n`;

    // Category Scores
    if (Object.keys(assessment.categoryScores).length > 0) {
      output += `**Category Scores:**\n`;
      Object.entries(assessment.categoryScores).forEach(([category, score]) => {
        const status = score >= 80 ? '✅' : score >= 70 ? '⚠️' : '❌';
        output += `• ${status} **${category.replace('-', ' ').toUpperCase()}:** ${score}/100\n`;
      });
      output += '\n';
    }

    // Critical Issues
    if (assessment.criticalIssues > 0) {
      output += `## 🚨 Critical Issues\n\n`;
      let issueIndex = 1;
      [completeness, acceptanceCriteria, implementation, testing, documentation, dependencies]
        .filter(review => review && review.issues)
        .forEach(review => {
          review.issues.filter(issue => issue.severity === 'critical').forEach(issue => {
            output += `${issueIndex}. **${issue.type.toUpperCase()}**\n`;
            output += `   *${issue.message}*\n`;
            output += `   💡 ${issue.suggestion}\n\n`;
            issueIndex++;
          });
        });
    }

    // Key Findings
    output += `## 🔍 Key Findings\n\n`;
    
    if (completeness) {
      output += `**Story Completeness:** ${completeness.completenessLevel}\n`;
      if (completeness.issues.length > 0 || completeness.warnings.length > 0) {
        output += `• Issues: ${completeness.issues.length}, Warnings: ${completeness.warnings.length}\n`;
      }
    }
    
    if (acceptanceCriteria) {
      output += `**Acceptance Criteria:** ${acceptanceCriteria.qualityLevel} (${acceptanceCriteria.criteriaCount} criteria)\n`;
      output += `• Testability Score: ${acceptanceCriteria.testabilityScore}%\n`;
    }
    
    if (implementation) {
      output += `**Implementation:** ${implementation.implementationLevel}\n`;
      output += `• Files Changed: ${implementation.filesChanged}\n`;
      output += `• Has Code Review: ${implementation.hasCodeReview ? 'Yes' : 'No'}\n`;
    }
    
    if (testing) {
      output += `**Testing:** ${testing.testCoverageLevel}\n`;
      output += `• Test Files: ${testing.testFilesCount}\n`;
      output += `• Test-to-Implementation Ratio: ${testing.testToImplementationRatio.toFixed(2)}\n`;
    }
    
    output += '\n';

    // Top Recommendations
    const criticalRecs = recommendations.critical || [];
    const importantRecs = recommendations.important || [];
    
    if (criticalRecs.length > 0 || importantRecs.length > 0) {
      output += `## 💡 Key Recommendations\n\n`;
      
      if (criticalRecs.length > 0) {
        output += `**Critical Actions:**\n`;
        criticalRecs.forEach((rec, index) => {
          output += `${index + 1}. ${rec.action} (${rec.timeline})\n`;
        });
        output += '\n';
      }
      
      if (importantRecs.length > 0) {
        output += `**Important Actions:**\n`;
        importantRecs.forEach((rec, index) => {
          output += `${index + 1}. ${rec.action} (${rec.timeline})\n`;
        });
        output += '\n';
      }
    }

    // Next Steps
    if (approval.nextActions.length > 0) {
      output += `## 🚀 Next Steps\n\n`;
      approval.nextActions.forEach((action, index) => {
        output += `${index + 1}. ${action}\n`;
      });
      output += '\n';
    }

    // Review Best Practices
    output += `## 💡 Story Review Best Practices\n\n`;
    output += `• Define clear, testable acceptance criteria\n`;
    output += `• Ensure story has adequate detail for implementation\n`;
    output += `• Validate implementation against acceptance criteria\n`;
    output += `• Include comprehensive testing strategy\n`;
    output += `• Address all critical issues before proceeding\n`;
    output += `• Regular reviews prevent quality degradation\n\n`;

    output += `📁 **Complete story review report and recommendations saved to project.**`;

    return output;
  },

  async saveStoryReviewToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const reviewsDir = join(saDir, 'story-reviews');
      if (!existsSync(reviewsDir)) {
        require('fs').mkdirSync(reviewsDir, { recursive: true });
      }
      
      const filename = `story-review-${context.storyId}-${Date.now()}.json`;
      const filepath = join(reviewsDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save story review results:', error.message);
    }
  }
};