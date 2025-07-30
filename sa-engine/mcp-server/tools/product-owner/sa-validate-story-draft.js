import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_validate_story_draft MCP Tool
 * Story completeness validation, quality criteria checking, dependency validation, and approval workflow
 */
export const saValidateStoryDraft = {
  name: 'sa_validate_story_draft',
  description: 'Validate story draft completeness, check quality criteria, validate dependencies, and manage approval workflow for user stories',
  category: 'product-owner',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      storyId: {
        type: 'string',
        description: 'Unique identifier for the story being validated',
        minLength: 1
      },
      storyDraft: {
        type: 'object',
        description: 'The story draft to validate',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          userRole: { type: 'string' },
          action: { type: 'string' },
          value: { type: 'string' },
          acceptanceCriteria: { type: 'array', items: { type: 'string' } },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          storyPoints: { type: 'number' },
          assignee: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
          epicId: { type: 'string' },
          sprintId: { type: 'string' }
        },
        required: ['title']
      },
      validationCriteria: {
        type: 'object',
        description: 'Criteria for story validation',
        properties: {
          requireUserStoryFormat: { type: 'boolean', default: true },
          requireAcceptanceCriteria: { type: 'boolean', default: true },
          requireEstimation: { type: 'boolean', default: true },
          requireDependencyCheck: { type: 'boolean', default: true },
          minimumDescriptionLength: { type: 'number', default: 50 },
          minimumAcceptanceCriteria: { type: 'number', default: 2 },
          qualityThreshold: { type: 'number', default: 80 }
        }
      },
      dependencies: {
        type: 'object',
        description: 'Story dependencies to validate',
        properties: {
          blockedBy: { type: 'array', items: { type: 'string' } },
          blocks: { type: 'array', items: { type: 'string' } },
          relatedTo: { type: 'array', items: { type: 'string' } },
          childOf: { type: 'string' },
          parentOf: { type: 'array', items: { type: 'string' } }
        }
      },
      projectContext: {
        type: 'object',
        description: 'Project context for validation',
        properties: {
          projectId: { type: 'string' },
          teamCapacity: { type: 'number' },
          sprintCapacity: { type: 'number' },
          techStack: { type: 'array', items: { type: 'string' } },
          businessRules: { type: 'array', items: { type: 'string' } }
        }
      },
      approvalWorkflow: {
        type: 'object',
        description: 'Approval workflow configuration',
        properties: {
          requireStakeholderApproval: { type: 'boolean', default: false },
          requiredApprovers: { type: 'array', items: { type: 'string' } },
          approvalCriteria: { type: 'array', items: { type: 'string' } },
          autoApprovalThreshold: { type: 'number', default: 95 }
        }
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      }
    },
    required: ['storyId', 'storyDraft']
  },

  validate(args) {
    const errors = [];
    
    if (!args.storyId || typeof args.storyId !== 'string') {
      errors.push('storyId is required and must be a string');
    }
    
    if (args.storyId && args.storyId.trim().length === 0) {
      errors.push('storyId cannot be empty');
    }
    
    if (!args.storyDraft || typeof args.storyDraft !== 'object') {
      errors.push('storyDraft is required and must be an object');
    }
    
    if (args.storyDraft && !args.storyDraft.title) {
      errors.push('storyDraft.title is required');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const storyId = args.storyId.trim();
    
    try {
      const validationContext = {
        storyId,
        storyDraft: args.storyDraft,
        criteria: args.validationCriteria || {},
        dependencies: args.dependencies || {},
        projectContext: args.projectContext || {},
        approvalWorkflow: args.approvalWorkflow || {},
        timestamp: new Date().toISOString(),
        validator: context?.userId || 'system',
        validationId: `story-validation-${Date.now()}`
      };

      // Story format validation
      const formatValidation = await this.validateStoryFormat(validationContext);
      
      // Content quality validation
      const contentValidation = await this.validateContentQuality(validationContext);
      
      // Acceptance criteria validation
      const criteriaValidation = await this.validateAcceptanceCriteria(validationContext);
      
      // Business rules validation
      const businessValidation = await this.validateBusinessRules(validationContext);
      
      // Technical feasibility validation
      const technicalValidation = await this.validateTechnicalFeasibility(validationContext);
      
      // Dependency validation
      const dependencyValidation = await this.validateDependencies(validationContext);
      
      // Estimation validation
      const estimationValidation = await this.validateEstimation(validationContext);
      
      // Overall assessment
      const overallAssessment = await this.performOverallAssessment(
        validationContext,
        formatValidation,
        contentValidation,
        criteriaValidation,
        businessValidation,
        technicalValidation,
        dependencyValidation,
        estimationValidation
      );
      
      // Approval workflow
      const approvalStatus = await this.processApprovalWorkflow(validationContext, overallAssessment);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        validationContext,
        overallAssessment,
        [formatValidation, contentValidation, criteriaValidation, businessValidation, 
         technicalValidation, dependencyValidation, estimationValidation]
      );
      
      // Create validation report
      const validationReport = await this.generateValidationReport(
        validationContext,
        overallAssessment,
        formatValidation,
        contentValidation,
        criteriaValidation,
        businessValidation,
        technicalValidation,
        dependencyValidation,
        estimationValidation,
        approvalStatus,
        recommendations
      );
      
      // Format output
      const output = await this.formatValidationOutput(
        validationContext,
        overallAssessment,
        approvalStatus,
        recommendations,
        validationReport
      );
      
      // Save validation results
      await this.saveValidationResults(projectPath, validationContext, {
        format: formatValidation,
        content: contentValidation,
        criteria: criteriaValidation,
        business: businessValidation,
        technical: technicalValidation,
        dependencies: dependencyValidation,
        estimation: estimationValidation,
        assessment: overallAssessment,
        approval: approvalStatus,
        recommendations,
        report: validationReport
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          storyId,
          validationScore: overallAssessment.score,
          qualityGrade: overallAssessment.grade,
          approvalStatus: approvalStatus.status,
          criticalIssues: overallAssessment.criticalIssues,
          canProceed: approvalStatus.canProceed,
          validationId: validationContext.validationId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to validate story draft ${storyId}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, storyId, projectPath }
      };
    }
  },

  async validateStoryFormat(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const story = context.storyDraft;

    // Check user story format (As a... I want... So that...)
    if (context.criteria.requireUserStoryFormat !== false) {
      const hasUserRole = story.userRole || (story.description && /as\s+a/i.test(story.description));
      const hasAction = story.action || (story.description && /i\s+want|i\s+need|i\s+should/i.test(story.description));
      const hasValue = story.value || (story.description && /so\s+that|in\s+order\s+to|because/i.test(story.description));

      if (!hasUserRole) {
        issues.push({
          type: 'missing-user-role',
          severity: 'high',
          message: 'Story lacks clear user role definition',
          suggestion: 'Add "As a [user role]" or specify userRole field'
        });
        score -= 25;
      }

      if (!hasAction) {
        issues.push({
          type: 'missing-action',
          severity: 'high',
          message: 'Story lacks clear action definition',
          suggestion: 'Add "I want to [action]" or specify action field'
        });
        score -= 25;
      }

      if (!hasValue) {
        warnings.push({
          type: 'missing-value',
          severity: 'medium',
          message: 'Story lacks clear value proposition',
          suggestion: 'Add "So that [value]" or specify value field'
        });
        score -= 15;
      }
    }

    // Check title quality
    if (!story.title || story.title.trim().length === 0) {
      issues.push({
        type: 'missing-title',
        severity: 'critical',
        message: 'Story has no title',
        suggestion: 'Add a clear, descriptive title'
      });
      score -= 30;
    } else {
      if (story.title.length < 10) {
        warnings.push({
          type: 'title-too-short',
          severity: 'low',
          message: 'Story title is very short',
          suggestion: 'Consider a more descriptive title'
        });
        score -= 5;
      }

      if (story.title.length > 100) {
        warnings.push({
          type: 'title-too-long',
          severity: 'low',
          message: 'Story title is very long',
          suggestion: 'Consider shortening the title'
        });
        score -= 5;
      }
    }

    // Check description quality
    const minDescLength = context.criteria.minimumDescriptionLength || 50;
    if (!story.description || story.description.trim().length === 0) {
      issues.push({
        type: 'missing-description',
        severity: 'high',
        message: 'Story has no description',
        suggestion: 'Add a detailed description following user story format'
      });
      score -= 20;
    } else if (story.description.length < minDescLength) {
      warnings.push({
        type: 'description-too-short',
        severity: 'medium',
        message: `Description is shorter than recommended (${story.description.length} < ${minDescLength} characters)`,
        suggestion: 'Provide more detailed description'
      });
      score -= 10;
    }

    return {
      category: 'format',
      score: Math.max(0, score),
      issues,
      warnings,
      checks: {
        hasUserRole: !!(story.userRole || (story.description && /as\s+a/i.test(story.description))),
        hasAction: !!(story.action || (story.description && /i\s+want|i\s+need|i\s+should/i.test(story.description))),
        hasValue: !!(story.value || (story.description && /so\s+that|in\s+order\s+to|because/i.test(story.description))),
        hasTitle: !!(story.title && story.title.trim()),
        hasDescription: !!(story.description && story.description.trim()),
        titleLength: story.title ? story.title.length : 0,
        descriptionLength: story.description ? story.description.length : 0
      },
      recommendations: this.generateFormatRecommendations(issues, warnings)
    };
  },

  generateFormatRecommendations(issues, warnings) {
    const recommendations = [];
    
    const hasUserRoleIssue = issues.some(i => i.type === 'missing-user-role');
    const hasActionIssue = issues.some(i => i.type === 'missing-action');
    const hasValueIssue = warnings.some(w => w.type === 'missing-value');

    if (hasUserRoleIssue || hasActionIssue || hasValueIssue) {
      recommendations.push('Use the standard user story format: "As a [user role], I want [action] so that [value]"');
    }

    if (issues.some(i => i.type === 'missing-title')) {
      recommendations.push('Add a clear, concise title that summarizes the story');
    }

    if (issues.some(i => i.type === 'missing-description')) {
      recommendations.push('Provide a detailed description explaining the story context and requirements');
    }

    return recommendations;
  },

  async validateContentQuality(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const story = context.storyDraft;

    // Check for clarity and specificity
    const clarityScore = this.assessClarity(story);
    if (clarityScore < 70) {
      warnings.push({
        type: 'unclear-content',
        severity: 'medium',
        message: 'Story content lacks clarity or specificity',
        suggestion: 'Use more specific language and clear requirements'
      });
      score -= 15;
    }

    // Check for ambiguous terms
    const ambiguousTerms = this.findAmbiguousTerms(story);
    if (ambiguousTerms.length > 0) {
      warnings.push({
        type: 'ambiguous-terms',
        severity: 'low',
        message: `Found potentially ambiguous terms: ${ambiguousTerms.join(', ')}`,
        suggestion: 'Define or replace ambiguous terms with specific requirements'
      });
      score -= ambiguousTerms.length * 3;
    }

    // Check for completeness
    const completenessScore = this.assessCompleteness(story);
    if (completenessScore < 80) {
      warnings.push({
        type: 'incomplete-content',
        severity: 'medium',
        message: 'Story appears to be missing important details',
        suggestion: 'Review and add missing context or requirements'
      });
      score -= 10;
    }

    // Check for testability
    const testabilityScore = this.assessTestability(story);
    if (testabilityScore < 70) {
      issues.push({
        type: 'low-testability',
        severity: 'high',
        message: 'Story requirements are difficult to test',
        suggestion: 'Make requirements more specific and measurable'
      });
      score -= 20;
    }

    return {
      category: 'content',
      score: Math.max(0, score),
      issues,
      warnings,
      metrics: {
        clarityScore,
        completenessScore,
        testabilityScore,
        ambiguousTermsCount: ambiguousTerms.length
      },
      analysis: {
        ambiguousTerms,
        suggestedImprovements: this.suggestContentImprovements(story, clarityScore, completenessScore, testabilityScore)
      },
      recommendations: this.generateContentRecommendations(issues, warnings, ambiguousTerms)
    };
  },

  assessClarity(story) {
    let score = 100;
    const text = (story.description || '') + ' ' + (story.title || '');
    
    // Check for vague words
    const vagueWords = ['some', 'many', 'few', 'several', 'various', 'different', 'better', 'improved', 'enhanced'];
    const vagueCount = vagueWords.reduce((count, word) => {
      return count + (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);
    
    score -= vagueCount * 10;
    
    // Check for specific measurable terms
    const specificTerms = ['exactly', 'within', 'must', 'should', 'will', 'can'];
    const specificCount = specificTerms.reduce((count, word) => {
      return count + (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);
    
    score += specificCount * 5;
    
    return Math.max(0, Math.min(100, score));
  },

  findAmbiguousTerms(story) {
    const text = (story.description || '') + ' ' + (story.title || '');
    const ambiguous = ['user-friendly', 'fast', 'slow', 'easy', 'hard', 'simple', 'complex', 'better', 'worse', 'good', 'bad'];
    
    return ambiguous.filter(term => 
      new RegExp(`\\b${term}\\b`, 'i').test(text)
    );
  },

  assessCompleteness(story) {
    let score = 0;
    const maxScore = 100;
    const checks = [
      { field: 'title', weight: 15, check: () => !!(story.title && story.title.trim()) },
      { field: 'description', weight: 25, check: () => !!(story.description && story.description.trim()) },
      { field: 'priority', weight: 10, check: () => !!story.priority },
      { field: 'storyPoints', weight: 10, check: () => typeof story.storyPoints === 'number' },
      { field: 'assignee', weight: 5, check: () => !!story.assignee },
      { field: 'labels', weight: 5, check: () => Array.isArray(story.labels) && story.labels.length > 0 },
      { field: 'epicId', weight: 10, check: () => !!story.epicId },
      { field: 'acceptanceCriteria', weight: 20, check: () => Array.isArray(story.acceptanceCriteria) && story.acceptanceCriteria.length > 0 }
    ];
    
    checks.forEach(check => {
      if (check.check()) {
        score += check.weight;
      }
    });
    
    return Math.min(maxScore, score);
  },

  assessTestability(story) {
    let score = 100;
    const text = (story.description || '');
    
    // Check for testable language
    const testableTerms = ['when', 'then', 'given', 'should', 'must', 'will', 'display', 'show', 'return'];
    const testableCount = testableTerms.reduce((count, term) => {
      return count + (text.toLowerCase().match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
    }, 0);
    
    if (testableCount === 0) {
      score -= 30;
    }
    
    // Check acceptance criteria
    if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
      score -= 40;
    } else {
      // Assess acceptance criteria testability
      const testableACs = story.acceptanceCriteria.filter(ac => 
        testableTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(ac))
      );
      
      const testabilityRatio = testableACs.length / story.acceptanceCriteria.length;
      score = score * testabilityRatio;
    }
    
    return Math.max(0, Math.min(100, score));
  },

  suggestContentImprovements(story, clarityScore, completenessScore, testabilityScore) {
    const improvements = [];
    
    if (clarityScore < 70) {
      improvements.push('Replace vague terms with specific, measurable requirements');
      improvements.push('Use concrete examples to illustrate expected behavior');
    }
    
    if (completenessScore < 80) {
      improvements.push('Add missing story fields (priority, estimation, assignee)');
      improvements.push('Include relevant labels and epic association');
    }
    
    if (testabilityScore < 70) {
      improvements.push('Use Given-When-Then format for acceptance criteria');
      improvements.push('Make requirements more specific and verifiable');
    }
    
    return improvements;
  },

  generateContentRecommendations(issues, warnings, ambiguousTerms) {
    const recommendations = [];
    
    if (issues.some(i => i.type === 'low-testability')) {
      recommendations.push('Rewrite requirements to be more specific and testable');
    }
    
    if (warnings.some(w => w.type === 'unclear-content')) {
      recommendations.push('Improve clarity by using specific, unambiguous language');
    }
    
    if (ambiguousTerms.length > 0) {
      recommendations.push(`Define or replace these ambiguous terms: ${ambiguousTerms.join(', ')}`);
    }
    
    return recommendations;
  },

  async validateAcceptanceCriteria(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const story = context.storyDraft;
    const minCriteria = context.criteria.minimumAcceptanceCriteria || 2;

    // Check if acceptance criteria exist
    if (!story.acceptanceCriteria || !Array.isArray(story.acceptanceCriteria)) {
      issues.push({
        type: 'missing-acceptance-criteria',
        severity: 'critical',
        message: 'Story has no acceptance criteria',
        suggestion: 'Add at least 2-3 specific acceptance criteria'
      });
      return {
        category: 'acceptance-criteria',
        score: 0,
        issues,
        warnings,
        criteriaCount: 0,
        recommendations: ['Add clear, testable acceptance criteria using Given-When-Then format']
      };
    }

    const criteria = story.acceptanceCriteria;
    
    // Check minimum number of criteria
    if (criteria.length < minCriteria) {
      warnings.push({
        type: 'insufficient-criteria',
        severity: 'medium',
        message: `Only ${criteria.length} acceptance criteria provided, minimum ${minCriteria} recommended`,
        suggestion: 'Add more acceptance criteria to cover edge cases'
      });
      score -= 20;
    }

    // Validate each criterion
    let validCriteria = 0;
    criteria.forEach((criterion, index) => {
      const validation = this.validateSingleCriterion(criterion, index);
      
      if (validation.isValid) {
        validCriteria++;
      } else {
        issues.push(...validation.issues);
        warnings.push(...validation.warnings);
        score -= validation.penaltyScore;
      }
    });

    // Check overall criteria quality
    const qualityScore = this.assessCriteriaQuality(criteria);
    if (qualityScore < 70) {
      warnings.push({
        type: 'low-criteria-quality',
        severity: 'medium',
        message: 'Acceptance criteria could be more specific and testable',
        suggestion: 'Use Given-When-Then format and be more specific'
      });
      score -= 15;
    }

    return {
      category: 'acceptance-criteria',
      score: Math.max(0, score),
      issues,
      warnings,
      criteriaCount: criteria.length,
      validCriteria,
      qualityScore,
      analysis: {
        criteriaAnalysis: criteria.map((c, i) => this.analyzeCriterion(c, i)),
        overallQuality: qualityScore,
        testability: this.assessCriteriaTestability(criteria)
      },
      recommendations: this.generateCriteriaRecommendations(issues, warnings, criteria)
    };
  },

  validateSingleCriterion(criterion, index) {
    const issues = [];
    const warnings = [];
    let penaltyScore = 0;
    let isValid = true;

    if (!criterion || typeof criterion !== 'string' || criterion.trim().length === 0) {
      issues.push({
        type: 'empty-criterion',
        severity: 'high',
        message: `Acceptance criterion ${index + 1} is empty`,
        suggestion: 'Provide a clear, specific acceptance criterion'
      });
      penaltyScore += 20;
      isValid = false;
    } else {
      // Check length
      if (criterion.length < 10) {
        warnings.push({
          type: 'criterion-too-short',
          severity: 'low',
          message: `Acceptance criterion ${index + 1} is very short`,
          suggestion: 'Provide more detailed acceptance criterion'
        });
        penaltyScore += 5;
      }

      // Check for Given-When-Then format
      const hasGivenWhenThen = /given|when|then/i.test(criterion);
      if (!hasGivenWhenThen) {
        warnings.push({
          type: 'missing-gwt-format',
          severity: 'low',
          message: `Acceptance criterion ${index + 1} doesn't use Given-When-Then format`,
          suggestion: 'Consider using Given-When-Then format for clarity'
        });
        penaltyScore += 3;
      }

      // Check for testable language
      const testableTerms = ['should', 'must', 'will', 'can', 'display', 'show', 'return', 'redirect'];
      const hasTestableLanguage = testableTerms.some(term => 
        new RegExp(`\\b${term}\\b`, 'i').test(criterion)
      );
      
      if (!hasTestableLanguage) {
        warnings.push({
          type: 'not-testable',
          severity: 'medium',
          message: `Acceptance criterion ${index + 1} may not be easily testable`,
          suggestion: 'Use more specific, testable language'
        });
        penaltyScore += 10;
      }
    }

    return { isValid, issues, warnings, penaltyScore };
  },

  analyzeCriterion(criterion, index) {
    return {
      index: index + 1,
      text: criterion,
      length: criterion.length,
      hasGivenWhenThen: /given|when|then/i.test(criterion),
      isTestable: this.isCriterionTestable(criterion),
      complexity: this.assessCriterionComplexity(criterion),
      clarity: this.assessCriterionClarity(criterion)
    };
  },

  isCriterionTestable(criterion) {
    const testableTerms = ['should', 'must', 'will', 'can', 'display', 'show', 'return', 'redirect', 'when', 'then'];
    return testableTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(criterion));
  },

  assessCriterionComplexity(criterion) {
    // Simple complexity assessment based on logical operators and conditions
    const complexityIndicators = ['and', 'or', 'but', 'if', 'unless', 'except', 'however'];
    const count = complexityIndicators.reduce((sum, indicator) => {
      return sum + (criterion.toLowerCase().match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
    }, 0);
    
    if (count === 0) return 'simple';
    if (count <= 2) return 'moderate';
    return 'complex';  
  },

  assessCriterionClarity(criterion) {
    const vagueTerms = ['some', 'many', 'few', 'better', 'good', 'fast', 'easy'];
    const hasVagueTerms = vagueTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(criterion));
    
    if (hasVagueTerms) return 'unclear';
    if (criterion.length < 20) return 'brief';
    return 'clear';
  },

  assessCriteriaQuality(criteria) {
    let totalScore = 0;
    
    criteria.forEach(criterion => {
      let criterionScore = 100;
      
      // Length check
      if (criterion.length < 10) criterionScore -= 20;
      if (criterion.length > 200) criterionScore -= 10;
      
      // Testability
      if (!this.isCriterionTestable(criterion)) criterionScore -= 30;
      
      // Given-When-Then format
      if (!/given|when|then/i.test(criterion)) criterionScore -= 10;
      
      // Clarity
      if (this.assessCriterionClarity(criterion) === 'unclear') criterionScore -= 15;
      
      totalScore += Math.max(0, criterionScore);
    });
    
    return criteria.length > 0 ? Math.round(totalScore / criteria.length) : 0;
  },

  assessCriteriaTestability(criteria) {
    const testableCriteria = criteria.filter(criterion => this.isCriterionTestable(criterion));
    return criteria.length > 0 ? Math.round((testableCriteria.length / criteria.length) * 100) : 0;
  },

  generateCriteriaRecommendations(issues, warnings, criteria) {
    const recommendations = [];
    
    if (issues.some(i => i.type === 'missing-acceptance-criteria')) {
      recommendations.push('Add specific, testable acceptance criteria');
      recommendations.push('Use Given-When-Then format for clarity');
    }
    
    if (warnings.some(w => w.type === 'insufficient-criteria')) {
      recommendations.push('Add more acceptance criteria to cover edge cases and error scenarios');
    }
    
    if (warnings.some(w => w.type === 'low-criteria-quality')) {
      recommendations.push('Improve acceptance criteria specificity and testability');
    }
    
    const nonTestable = criteria.filter(c => !this.isCriterionTestable(c));
    if (nonTestable.length > 0) {
      recommendations.push('Make acceptance criteria more testable with specific expected outcomes');
    }
    
    return recommendations;
  },

  async validateBusinessRules(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const story = context.storyDraft;
    const businessRules = context.projectContext.businessRules || [];

    // Check priority alignment
    if (!story.priority) {
      warnings.push({
        type: 'missing-priority',
        severity: 'medium',
        message: 'Story priority not specified',
        suggestion: 'Assign appropriate priority based on business value'
      });
      score -= 15;
    }

    // Check against business rules
    const ruleViolations = this.checkBusinessRuleCompliance(story, businessRules);
    if (ruleViolations.length > 0) {
      ruleViolations.forEach(violation => {
        issues.push({
          type: 'business-rule-violation',
          severity: violation.severity,
          message: violation.message,
          suggestion: violation.suggestion
        });
        score -= violation.penalty;
      });
    }

    // Check value proposition
    const hasValueProposition = this.hasValueProposition(story);
    if (!hasValueProposition) {
      warnings.push({
        type: 'missing-value-proposition',
        severity: 'medium',
        message: 'Story lacks clear business value proposition',
        suggestion: 'Add business value explanation in description'
      });
      score -= 10;
    }

    return {
      category: 'business-rules',
      score: Math.max(0, score),
      issues,
      warnings,
      compliance: {
        rulesChecked: businessRules.length,
        violations: ruleViolations.length,
        hasValueProposition,
        hasPriority: !!story.priority
      },
      recommendations: this.generateBusinessRecommendations(issues, warnings, hasValueProposition)
    };
  },

  checkBusinessRuleCompliance(story, businessRules) {
    const violations = [];
    
    // Simulate business rule checking
    businessRules.forEach(rule => {
      // Example: Check for security-related stories
      if (rule.includes('security') && story.description && story.description.toLowerCase().includes('password')) {
        if (!story.description.toLowerCase().includes('encrypt')) {
          violations.push({
            rule,
            severity: 'high',
            message: 'Password-related stories must specify encryption requirements',
            suggestion: 'Add encryption and security requirements to the story',
            penalty: 20
          });
        }
      }
      
      // Example: Check for API stories
      if (rule.includes('api') && story.description && story.description.toLowerCase().includes('api')) {
        if (!story.description.toLowerCase().includes('authentication')) {
          violations.push({
            rule,
            severity: 'medium',
            message: 'API stories should consider authentication requirements',
            suggestion: 'Review authentication requirements for API access',
            penalty: 10
          });
        }
      }
    });
    
    return violations;
  },

  hasValueProposition(story) {
    const valueIndicators = ['so that', 'because', 'in order to', 'to enable', 'value', 'benefit', 'improve'];
    const text = (story.description || '').toLowerCase();
    
    return valueIndicators.some(indicator => text.includes(indicator));
  },

  generateBusinessRecommendations(issues, warnings, hasValueProposition) {
    const recommendations = [];
    
    if (issues.some(i => i.type === 'business-rule-violation')) {
      recommendations.push('Address business rule violations before proceeding');
    }
    
    if (!hasValueProposition) {
      recommendations.push('Clearly articulate the business value and user benefit');
    }
    
    if (warnings.some(w => w.type === 'missing-priority')) {
      recommendations.push('Assign story priority based on business value and urgency');
    }
    
    return recommendations;
  },

  async validateTechnicalFeasibility(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const story = context.storyDraft;
    const techStack = context.projectContext.techStack || [];

    // Check technical complexity
    const complexityAssessment = this.assessTechnicalComplexity(story, techStack);
    if (complexityAssessment.score < 70) {
      warnings.push({
        type: 'high-technical-complexity',
        severity: 'medium',
        message: 'Story appears technically complex',
        suggestion: 'Consider breaking down into smaller, more manageable stories'
      });
      score -= 15;
    }

    // Check technology alignment
    const techAlignment = this.checkTechnologyAlignment(story, techStack);
    if (!techAlignment.isAligned) {
      issues.push({
        type: 'technology-mismatch',
        severity: 'high',
        message: 'Story requirements may not align with current technology stack',
        suggestion: 'Review technical requirements against available technology stack'
      });
      score -= 25;
    }

    // Check for breaking changes
    const breakingChanges = this.identifyBreakingChanges(story);
    if (breakingChanges.length > 0) {
      warnings.push({
        type: 'potential-breaking-changes',
        severity: 'high',
        message: 'Story may introduce breaking changes',
        suggestion: 'Plan migration strategy and consider versioning'
      });
      score -= 20;
    }

    return {
      category: 'technical-feasibility',
      score: Math.max(0, score),
      issues,
      warnings,
      assessment: {
        complexityScore: complexityAssessment.score,
        complexityLevel: complexityAssessment.level,
        technologyAlignment: techAlignment,
        breakingChanges,
        estimatedEffort: this.estimateTechnicalEffort(story, complexityAssessment)
      },
      recommendations: this.generateTechnicalRecommendations(issues, warnings, complexityAssessment)
    };
  },

  assessTechnicalComplexity(story, techStack) {
    let complexityScore = 50; // Base score
    const text = (story.description || '').toLowerCase();
    
    // High complexity indicators
    const highComplexityTerms = ['integration', 'migration', 'performance', 'scalability', 'security', 'real-time', 'synchronization'];
    const highComplexityCount = highComplexityTerms.reduce((count, term) => {
      return count + (text.includes(term) ? 1 : 0);
    }, 0);
    
    complexityScore += highComplexityCount * 15;
    
    // Medium complexity indicators  
    const mediumComplexityTerms = ['database', 'api', 'authentication', 'validation', 'workflow', 'reporting'];
    const mediumComplexityCount = mediumComplexityTerms.reduce((count, term) => {
      return count + (text.includes(term) ? 1 : 0);
    }, 0);
    
    complexityScore += mediumComplexityCount * 10;
    
    // Simple indicators (reduce complexity)
    const simpleTerms = ['display', 'show', 'hide', 'button', 'form', 'text', 'color'];
    const simpleCount = simpleTerms.reduce((count, term) => {
      return count + (text.includes(term) ? 1 : 0);
    }, 0);
    
    complexityScore -= simpleCount * 5;
    
    const finalScore = Math.max(0, Math.min(100, complexityScore));
    
    let level;
    if (finalScore < 30) level = 'low';
    else if (finalScore < 70) level = 'medium';
    else level = 'high';
    
    return { score: finalScore, level };
  },

  checkTechnologyAlignment(story, techStack) {
    const text = (story.description || '').toLowerCase();
    const technologies = techStack.map(tech => tech.toLowerCase());
    
    // Check if story mentions technologies not in the stack
    const mentionedTechs = [];
    const commonTechs = ['react', 'vue', 'angular', 'node', 'python', 'java', 'mysql', 'mongodb', 'redis', 'docker'];
    
    commonTechs.forEach(tech => {
      if (text.includes(tech)) {
        mentionedTechs.push(tech);
      }
    });
    
    const unsupportedTechs = mentionedTechs.filter(tech => !technologies.includes(tech));
    
    return {
      isAligned: unsupportedTechs.length === 0,
      mentionedTechnologies: mentionedTechs,
      unsupportedTechnologies: unsupportedTechs,
      currentStack: techStack
    };
  },

  identifyBreakingChanges(story) {
    const text = (story.description || '').toLowerCase();
    const breakingChangeIndicators = [
      'remove', 'delete', 'deprecate', 'change api', 'modify endpoint', 
      'alter database', 'update schema', 'breaking change', 'incompatible'
    ];
    
    return breakingChangeIndicators.filter(indicator => text.includes(indicator));
  },

  estimateTechnicalEffort(story, complexityAssessment) {
    const baseEffort = story.storyPoints || 5;
    const complexityMultiplier = {
      'low': 1.0,
      'medium': 1.5,
      'high': 2.0
    };
    
    return Math.round(baseEffort * complexityMultiplier[complexityAssessment.level]);
  },

  generateTechnicalRecommendations(issues, warnings, complexityAssessment) {
    const recommendations = [];
    
    if (issues.some(i => i.type === 'technology-mismatch')) {
      recommendations.push('Review and align technical requirements with current technology stack');
    }
    
    if (complexityAssessment.level === 'high') {
      recommendations.push('Consider breaking down this high-complexity story into smaller stories');
      recommendations.push('Involve technical leads in story planning and estimation');
    }
    
    if (warnings.some(w => w.type === 'potential-breaking-changes')) {
      recommendations.push('Plan for breaking changes and API versioning strategy');
    }
    
    return recommendations;
  },

  async validateDependencies(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const dependencies = context.dependencies;

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(context.storyId, dependencies);
    if (circularDeps.length > 0) {
      issues.push({
        type: 'circular-dependency',
        severity: 'critical',
        message: `Circular dependencies detected: ${circularDeps.join(' -> ')}`,
        suggestion: 'Resolve circular dependencies by refactoring story breakdown'
      });
      score -= 40;
    }

    // Check for blocked dependencies
    const blockedDeps = dependencies.blockedBy || [];
    if (blockedDeps.length > 0) {
      warnings.push({
        type: 'blocked-dependencies',
        severity: 'high',
        message: `Story is blocked by ${blockedDeps.length} dependencies`,
        suggestion: 'Ensure blocking dependencies are resolved before starting this story'
      });
      score -= blockedDeps.length * 10;
    }

    // Check dependency chain depth
    const chainDepth = this.calculateDependencyChainDepth(context.storyId, dependencies);
    if (chainDepth > 3) {
      warnings.push({
        type: 'deep-dependency-chain',
        severity: 'medium',
        message: `Deep dependency chain detected (depth: ${chainDepth})`,
        suggestion: 'Consider simplifying dependency structure'
      });
      score -= 10;
    }

    return {
      category: 'dependencies',
      score: Math.max(0, score),
      issues,
      warnings,
      analysis: {
        blockedByCount: blockedDeps.length,
        blocksCount: (dependencies.blocks || []).length,
        relatedCount: (dependencies.relatedTo || []).length,
        chainDepth,
        circularDependencies: circularDeps,
        dependencyHealth: this.assessDependencyHealth(dependencies)
      },
      recommendations: this.generateDependencyRecommendations(issues, warnings, dependencies)
    };
  },

  detectCircularDependencies(storyId, dependencies) {
    // Simplified circular dependency detection
    const visited = new Set();
    const path = [];
    
    const dfs = (currentId) => {
      if (path.includes(currentId)) {
        // Found circular dependency
        const circleStart = path.indexOf(currentId);
        return path.slice(circleStart).concat([currentId]);
      }
      
      if (visited.has(currentId)) {
        return [];
      }
      
      visited.add(currentId);
      path.push(currentId);
      
      // Check dependencies (simplified - in real implementation would traverse actual dependency graph)
      const deps = dependencies.blockedBy || [];
      for (const dep of deps) {
        if (dep === storyId) {
          return [currentId, storyId];
        }
      }
      
      path.pop();
      return [];
    };
    
    return dfs(storyId);
  },

  calculateDependencyChainDepth(storyId, dependencies) {
    // Simplified chain depth calculation
    let depth = 0;
    const blockedBy = dependencies.blockedBy || [];
    
    if (blockedBy.length > 0) {
      depth = 1 + Math.max(...blockedBy.map(() => 1)); // Simplified
    }
    
    return depth;
  },

  assessDependencyHealth(dependencies) {
    const blocked = (dependencies.blockedBy || []).length;
    const blocks = (dependencies.blocks || []).length;
    const related = (dependencies.relatedTo || []).length;
    
    const totalDeps = blocked + blocks + related;
    
    if (totalDeps === 0) return 'independent';
    if (blocked > 3) return 'highly-dependent';
    if (blocks > 5) return 'blocking-many';
    if (totalDeps > 8) return 'complex';
    return 'normal';
  },

  generateDependencyRecommendations(issues, warnings, dependencies) {
    const recommendations = [];
    
    if (issues.some(i => i.type === 'circular-dependency')) {
      recommendations.push('Resolve circular dependencies by restructuring story relationships');
    }
    
    const blockedCount = (dependencies.blockedBy || []).length;
    if (blockedCount > 0) {
      recommendations.push(`Ensure ${blockedCount} blocking dependencies are completed first`);
    }
    
    if (warnings.some(w => w.type === 'deep-dependency-chain')) {
      recommendations.push('Consider simplifying the dependency chain structure');
    }
    
    return recommendations;
  },

  async validateEstimation(context) {
    const issues = [];
    const warnings = [];
    let score = 100;
    const story = context.storyDraft;

    // Check if story is estimated
    if (typeof story.storyPoints !== 'number') {
      if (context.criteria.requireEstimation !== false) {
        issues.push({
          type: 'missing-estimation',
          severity: 'high',
          message: 'Story lacks estimation (story points)',
          suggestion: 'Estimate story complexity using story points'
        });
        score -= 30;
      }
    } else {
      // Validate estimation reasonableness
      const estimationValidation = this.validateEstimationReasonableness(story);
      if (!estimationValidation.isReasonable) {
        warnings.push({
          type: 'unreasonable-estimation',
          severity: 'medium',
          message: estimationValidation.message,
          suggestion: estimationValidation.suggestion
        });
        score -= 15;
      }
    }

    // Check capacity alignment
    const capacityCheck = this.checkCapacityAlignment(story, context.projectContext);
    if (!capacityCheck.fitsCapacity) {
      warnings.push({
        type: 'capacity-mismatch',
        severity: 'medium',
        message: capacityCheck.message,
        suggestion: 'Review story size against team/sprint capacity'
      });
      score -= 10;
    }

    return {
      category: 'estimation',
      score: Math.max(0, score),
      issues,
      warnings,
      analysis: {
        hasEstimation: typeof story.storyPoints === 'number',
        storyPoints: story.storyPoints || null,
        estimationLevel: this.getEstimationLevel(story.storyPoints),
        capacityAlignment: capacityCheck,
        confidence: this.assessEstimationConfidence(story)
      },
      recommendations: this.generateEstimationRecommendations(issues, warnings, story)
    };
  },

  validateEstimationReasonableness(story) {
    const points = story.storyPoints;
    
    if (points < 1) {
      return {
        isReasonable: false,
        message: 'Story points too low (< 1)',
        suggestion: 'Consider minimum 1 story point for trackable work'
      };
    }
    
    if (points > 13) {
      return {
        isReasonable: false,
        message: 'Story points too high (> 13)',
        suggestion: 'Consider breaking down into smaller stories'
      };
    }
    
    // Check if it's a valid Fibonacci number (common in story pointing)
    const fibSequence = [1, 2, 3, 5, 8, 13];
    if (!fibSequence.includes(points)) {
      return {
        isReasonable: false,
        message: 'Story points not following Fibonacci sequence',
        suggestion: 'Consider using Fibonacci numbers (1, 2, 3, 5, 8, 13)'
      };
    }
    
    return { isReasonable: true };
  },

  checkCapacityAlignment(story, projectContext) {
    const points = story.storyPoints;
    const teamCapacity = projectContext.teamCapacity || 40; // Default sprint capacity
    const sprintCapacity = projectContext.sprintCapacity || teamCapacity;
    
    if (!points) {
      return {
        fitsCapacity: true,
        message: 'No estimation to check against capacity'
      };
    }
    
    if (points > sprintCapacity * 0.5) {
      return {
        fitsCapacity: false,
        message: `Story (${points} points) is large relative to sprint capacity (${sprintCapacity})`
      };
    }
    
    return { fitsCapacity: true };
  },

  getEstimationLevel(storyPoints) {
    if (!storyPoints) return 'unestimated';
    if (storyPoints <= 2) return 'small';
    if (storyPoints <= 5) return 'medium';
    if (storyPoints <= 8) return 'large';
    return 'extra-large';
  },

  assessEstimationConfidence(story) {
    let confidence = 100;
    
    // Reduce confidence if no description
    if (!story.description || story.description.length < 50) {
      confidence -= 20;
    }
    
    // Reduce confidence if no acceptance criteria
    if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
      confidence -= 30;
    }
    
    // Reduce confidence if no technical details
    const text = (story.description || '').toLowerCase();
    const technicalTerms = ['api', 'database', 'integration', 'performance'];
    const hasTechnicalDetails = technicalTerms.some(term => text.includes(term));
    
    if (!hasTechnicalDetails && story.storyPoints > 5) {
      confidence -= 15;
    }
    
    return Math.max(0, confidence);
  },

  generateEstimationRecommendations(issues, warnings, story) {
    const recommendations = [];
    
    if (issues.some(i => i.type === 'missing-estimation')) {
      recommendations.push('Conduct story pointing session with the development team');
    }
    
    if (warnings.some(w => w.type === 'unreasonable-estimation')) {
      recommendations.push('Review and adjust story point estimation');
    }
    
    if (warnings.some(w => w.type === 'capacity-mismatch')) {
      recommendations.push('Consider breaking down large stories to fit sprint capacity');
    }
    
    return recommendations;
  },

  async performOverallAssessment(context, ...validations) {
    const scores = [];
    const allIssues = [];
    const allWarnings = [];
    const categoryResults = {};

    // Collect all validation results
    validations.forEach(validation => {
      if (validation) {
        scores.push({
          category: validation.category,
          score: validation.score,
          weight: this.getCategoryWeight(validation.category)
        });
        
        allIssues.push(...validation.issues);
        allWarnings.push(...validation.warnings);
        categoryResults[validation.category] = validation;
      }
    });

    // Calculate weighted overall score
    let weightedScore = 0;
    let totalWeight = 0;
    
    scores.forEach(({ score, weight }) => {
      weightedScore += score * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    const grade = this.calculateGrade(overallScore, allIssues.length);
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical').length;

    return {
      score: overallScore,
      grade,
      criticalIssues,
      totalIssues: allIssues.length,
      totalWarnings: allWarnings.length,
      categoryScores: scores.reduce((acc, { category, score }) => {
        acc[category] = score;
        return acc;
      }, {}),
      readyForDevelopment: this.assessReadinessForDevelopment(overallScore, criticalIssues, context),
      qualityLevel: this.getQualityLevel(overallScore),
      improvementAreas: this.identifyImprovementAreas(categoryResults),
      issues: allIssues,
      warnings: allWarnings
    };
  },

  getCategoryWeight(category) {
    const weights = {
      'format': 0.20,
      'content': 0.15,
      'acceptance-criteria': 0.25,
      'business-rules': 0.15,
      'technical-feasibility': 0.10,
      'dependencies': 0.10,
      'estimation': 0.05
    };
    return weights[category] || 0.10;
  },

  calculateGrade(score, issueCount) {
    if (issueCount > 5) return 'F';
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  assessReadinessForDevelopment(score, criticalIssues, context) {
    const qualityThreshold = context.criteria.qualityThreshold || 80;
    return score >= qualityThreshold && criticalIssues === 0;
  },

  getQualityLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    if (score >= 60) return 'poor';
    return 'inadequate';
  },

  identifyImprovementAreas(categoryResults) {
    const areas = [];
    
    Object.entries(categoryResults).forEach(([category, result]) => {
      if (result.score < 80) {
        areas.push({
          category,
          score: result.score,
          priority: result.score < 60 ? 'high' : 'medium',
          issues: result.issues.length,
          warnings: result.warnings.length
        });
      }
    });
    
    return areas.sort((a, b) => a.score - b.score);
  },

  async processApprovalWorkflow(context, assessment) {
    const workflow = context.approvalWorkflow;
    let status = 'pending';
    let message = '';
    const blockers = [];
    const requiredActions = [];

    // Check auto-approval threshold
    const autoThreshold = workflow.autoApprovalThreshold || 95;
    if (assessment.score >= autoThreshold && assessment.criticalIssues === 0) {
      status = 'auto-approved';
      message = 'Story meets auto-approval criteria';
    } else if (assessment.criticalIssues > 0) {
      status = 'rejected';
      message = 'Story has critical issues that must be resolved';
      blockers.push(`${assessment.criticalIssues} critical issues found`);
      requiredActions.push('Resolve all critical issues');
    } else if (assessment.score < (context.criteria.qualityThreshold || 80)) {
      status = 'needs-improvement';
      message = 'Story quality below threshold - improvements needed';
      blockers.push(`Quality score ${assessment.score} below threshold`);
      requiredActions.push('Improve story quality');
    } else {
      status = 'ready-for-approval';
      message = 'Story ready for stakeholder approval';
      
      if (workflow.requireStakeholderApproval) {
        requiredActions.push('Obtain stakeholder approval');
      }
    }

    return {
      status,
      message,
      blockers,
      requiredActions,
      approvalScore: assessment.score,
      canProceed: status === 'auto-approved' || status === 'ready-for-approval',
      nextSteps: this.generateApprovalNextSteps(status, workflow, assessment)
    };
  },

  generateApprovalNextSteps(status, workflow, assessment) {
    const steps = [];
    
    switch (status) {
      case 'rejected':
        steps.push('Address all critical issues immediately');
        steps.push('Request re-validation after fixes');
        break;
        
      case 'needs-improvement':
        steps.push('Improve story quality based on feedback');
        steps.push('Focus on lowest-scoring categories first');
        steps.push('Re-submit for validation');
        break;
        
      case 'ready-for-approval':
        if (workflow.requireStakeholderApproval) {
          steps.push('Submit to stakeholders for approval');
          steps.push('Address any stakeholder feedback');
        } else {
          steps.push('Proceed to sprint planning');
        }
        break;
        
      case 'auto-approved':
        steps.push('Add to sprint backlog');
        steps.push('Begin development when capacity allows');
        break;
    }
    
    return steps;
  },

  async generateRecommendations(context, assessment, validations) {
    const recommendations = {
      critical: [],
      important: [],
      suggested: []
    };

    // Critical recommendations
    if (assessment.criticalIssues > 0) {
      recommendations.critical.push({
        action: 'Resolve all critical issues immediately',
        priority: 'critical',
        timeline: 'immediate'
      });
    }

    // Important recommendations based on lowest scores
    const lowScoreCategories = Object.entries(assessment.categoryScores)
      .filter(([_, score]) => score < 70)
      .sort((a, b) => a[1] - b[1]);

    lowScoreCategories.forEach(([category, score]) => {
      recommendations.important.push({
        action: `Improve ${category.replace('-', ' ')} (score: ${score})`,
        priority: 'high',
        timeline: '1-2 days'
      });
    });

    // Collect specific recommendations from validations
    validations.forEach(validation => {
      if (validation && validation.recommendations) {
        validation.recommendations.forEach(rec => {
          recommendations.suggested.push({
            action: rec,
            category: validation.category,
            priority: 'medium',
            timeline: '2-3 days'
          });
        });
      }
    });

    return recommendations;
  },

  async generateValidationReport(context, assessment, ...validations) {
    const report = {
      metadata: {
        storyId: context.storyId,
        validationId: context.validationId,
        validator: context.validator,
        timestamp: context.timestamp
      },
      story: {
        title: context.storyDraft.title,
        priority: context.storyDraft.priority,
        storyPoints: context.storyDraft.storyPoints,
        status: 'draft'
      },
      summary: {
        overallScore: assessment.score,
        grade: assessment.grade,
        criticalIssues: assessment.criticalIssues,
        totalIssues: assessment.totalIssues,
        totalWarnings: assessment.totalWarnings,
        readyForDevelopment: assessment.readyForDevelopment,
        qualityLevel: assessment.qualityLevel
      },
      categories: {},
      improvementAreas: assessment.improvementAreas,
      trends: this.analyzeTrends(assessment)
    };

    // Add category details
    const categoryNames = ['format', 'content', 'acceptance-criteria', 'business-rules', 
                          'technical-feasibility', 'dependencies', 'estimation'];
    
    validations.forEach((validation, index) => {
      if (validation && categoryNames[index]) {
        report.categories[categoryNames[index]] = {
          score: validation.score,
          issues: validation.issues.length,
          warnings: validation.warnings.length,
          recommendations: validation.recommendations || []
        };
      }
    });

    return report;
  },

  analyzeTrends(assessment) {
    // Simplified trend analysis
    return {
      qualityTrend: assessment.score >= 80 ? 'improving' : 'needs-attention',
      complexityLevel: assessment.categoryScores['technical-feasibility'] >= 70 ? 'manageable' : 'high',
      readinessLevel: assessment.readyForDevelopment ? 'ready' : 'not-ready'
    };
  },

  async formatValidationOutput(context, assessment, approval, recommendations, report) {
    let output = `📋 **Story Draft Validation: ${context.storyDraft.title}**\n\n`;
    output += `🎯 **Story ID:** ${context.storyId}\n`;
    output += `⭐ **Overall Score:** ${assessment.score}/100 (Grade: ${assessment.grade})\n`;
    output += `✅ **Approval Status:** ${approval.status.toUpperCase()}\n`;
    output += `🔍 **Quality Level:** ${assessment.qualityLevel}\n`;
    output += `🆔 **Validation ID:** ${context.validationId}\n\n`;

    // Approval Status
    const statusEmoji = approval.status === 'auto-approved' ? '✅' : 
                       approval.status === 'ready-for-approval' ? '⚠️' : '❌';
    output += `## ${statusEmoji} Approval Status\n\n`;
    output += `**Status:** ${approval.status.toUpperCase()}\n`;
    output += `**Message:** ${approval.message}\n`;
    output += `**Can Proceed:** ${approval.canProceed ? 'Yes' : 'No'}\n`;
    
    if (approval.blockers.length > 0) {
      output += `**Blockers:**\n`;
      approval.blockers.forEach(blocker => {
        output += `• ${blocker}\n`;
      });
    }
    output += '\n';

    // Validation Summary
    output += `## 📊 Validation Summary\n\n`;
    output += `**Quality Metrics:**\n`;
    output += `• Overall Score: ${assessment.score}/100\n`;
    output += `• Quality Grade: ${assessment.grade}\n`;
    output += `• Critical Issues: ${assessment.criticalIssues}\n`;
    output += `• Total Issues: ${assessment.totalIssues}\n`;
    output += `• Warnings: ${assessment.totalWarnings}\n`;
    output += `• Ready for Development: ${assessment.readyForDevelopment ? '✅' : '❌'}\n\n`;

    // Category Scores
    output += `**Category Scores:**\n`;
    Object.entries(assessment.categoryScores).forEach(([category, score]) => {
      const status = score >= 80 ? '✅' : score >= 70 ? '⚠️' : '❌';
      output += `• ${status} **${category.replace('-', ' ').toUpperCase()}:** ${score}/100\n`;
    });
    output += '\n';

    // Critical Issues
    if (assessment.criticalIssues > 0) {
      output += `## 🚨 Critical Issues\n\n`;
      const criticalIssues = assessment.issues.filter(issue => issue.severity === 'critical');
      criticalIssues.forEach((issue, index) => {
        output += `${index + 1}. **${issue.type.toUpperCase()}**\n`;
        output += `   *${issue.message}*\n`;
        output += `   💡 ${issue.suggestion}\n\n`;
      });
    }

    // Improvement Areas
    if (assessment.improvementAreas.length > 0) {
      output += `## 📈 Areas for Improvement\n\n`;
      assessment.improvementAreas.slice(0, 3).forEach(area => {
        const priorityEmoji = area.priority === 'high' ? '🔴' : '🟡';
        output += `${priorityEmoji} **${area.category.replace('-', ' ').toUpperCase()}** (${area.score}/100)\n`;
        output += `   Issues: ${area.issues}, Warnings: ${area.warnings}\n`;
      });
      output += '\n';
    }

    // Key Recommendations
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
        importantRecs.slice(0, 3).forEach((rec, index) => {
          output += `${index + 1}. ${rec.action} (${rec.timeline})\n`;
        });
        output += '\n';
      }
    }

    // Next Steps
    if (approval.nextSteps.length > 0) {
      output += `## 🚀 Next Steps\n\n`;
      approval.nextSteps.forEach((step, index) => {
        output += `${index + 1}. ${step}\n`;
      });
      output += '\n';
    }

    // Story Details
    output += `## 📝 Story Details\n\n`;
    output += `**Title:** ${context.storyDraft.title}\n`;
    if (context.storyDraft.priority) {
      output += `**Priority:** ${context.storyDraft.priority}\n`;
    }
    if (context.storyDraft.storyPoints) {
      output += `**Story Points:** ${context.storyDraft.storyPoints}\n`;
    }
    if (context.storyDraft.assignee) {
      output += `**Assignee:** ${context.storyDraft.assignee}\n`;
    }
    
    const acCount = (context.storyDraft.acceptanceCriteria || []).length;
    output += `**Acceptance Criteria:** ${acCount} defined\n`;
    output += '\n';

    // Validation Best Practices
    output += `## 💡 Story Validation Best Practices\n\n`;
    output += `• Use clear user story format: "As a... I want... So that..."\n`;
    output += `• Define specific, testable acceptance criteria\n`;
    output += `• Ensure story is appropriately sized and estimated\n`;
    output += `• Validate business value and technical feasibility\n`;
    output += `• Check dependencies and resolve blockers\n`;
    output += `• Address all critical issues before development\n\n`;

    output += `📁 **Complete validation report and recommendations saved to project.**`;

    return output;
  },

  async saveValidationResults(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const validationsDir = join(saDir, 'story-validations');
      if (!existsSync(validationsDir)) {
        require('fs').mkdirSync(validationsDir, { recursive: true });
      }
      
      const filename = `story-validation-${context.storyId}-${Date.now()}.json`;
      const filepath = join(validationsDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save validation results:', error.message);
    }
  }
};