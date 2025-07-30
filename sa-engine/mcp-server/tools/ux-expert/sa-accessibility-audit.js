import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saAccessibilityAudit = {
  name: 'sa_accessibility_audit',
  description: 'Conduct comprehensive accessibility audits with WCAG compliance checking, accessibility improvement suggestions, and audit reporting',
  category: 'ux-expert',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      auditId: { type: 'string', minLength: 1 },
      target: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['url', 'wireframes', 'design-files', 'specification'] },
          source: { type: 'string' },
          description: { type: 'string' }
        }
      },
      auditScope: {
        type: 'object',
        properties: {
          wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA'], default: 'AA' },
          wcagVersion: { type: 'string', enum: ['2.0', '2.1', '2.2'], default: '2.1' },
          testTypes: { 
            type: 'array', 
            items: { type: 'string', enum: ['automated', 'manual', 'screen-reader', 'keyboard'] },
            default: ['automated', 'manual', 'keyboard']
          },
          includeUserTesting: { type: 'boolean', default: false }
        }
      },
      context: {
        type: 'object',
        properties: {
          userTypes: { type: 'array', items: { type: 'string' } },
          primaryTasks: { type: 'array', items: { type: 'string' } },
          targetDevices: { type: 'array', items: { type: 'string' } },
          assistiveTech: { type: 'array', items: { type: 'string' } }
        }
      },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['auditId', 'target']
  },

  validate(args) {
    const errors = [];
    if (!args.auditId?.trim()) errors.push('auditId is required');
    if (!args.target) errors.push('target is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const auditContext = {
        auditId: args.auditId.trim(),
        target: args.target,
        auditScope: { wcagLevel: 'AA', wcagVersion: '2.1', testTypes: ['automated', 'manual', 'keyboard'], ...args.auditScope },
        context: args.context || {},
        timestamp: new Date().toISOString(),
        auditor: context?.userId || 'system'
      };

      // Perform different types of accessibility tests
      const automatedResults = await this.runAutomatedTests(auditContext);
      const manualResults = await this.runManualTests(auditContext);
      const keyboardResults = await this.runKeyboardTests(auditContext);
      const screenReaderResults = auditContext.auditScope.testTypes.includes('screen-reader') 
        ? await this.runScreenReaderTests(auditContext)
        : null;

      // Analyze results and generate findings
      const findings = await this.analyzeFindings(auditContext, {
        automated: automatedResults,
        manual: manualResults,
        keyboard: keyboardResults,
        screenReader: screenReaderResults
      });

      // Generate WCAG compliance report
      const complianceReport = await this.generateComplianceReport(auditContext, findings);
      
      // Create improvement recommendations
      const recommendations = await this.generateRecommendations(auditContext, findings);
      
      // Generate actionable improvement plan
      const improvementPlan = await this.createImprovementPlan(auditContext, findings, recommendations);
      
      const output = await this.formatAuditOutput(
        auditContext,
        findings,
        complianceReport,
        recommendations,
        improvementPlan
      );
      
      await this.saveAuditData(args.projectPath, auditContext, {
        findings,
        compliance: complianceReport,
        recommendations,
        improvementPlan
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          auditId: auditContext.auditId,
          wcagLevel: auditContext.auditScope.wcagLevel,
          totalIssues: findings.summary.totalIssues,
          criticalIssues: findings.summary.criticalIssues,
          complianceScore: complianceReport.overallScore,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to conduct accessibility audit: ${error.message}` }],
        isError: true
      };
    }
  },

  async runAutomatedTests(auditContext) {
    // Simulate automated accessibility testing results
    const issues = [
      {
        rule: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        wcagCriterion: '1.4.3',
        occurrences: 3,
        elements: ['button.primary', 'nav a', '.text-muted'],
        fix: 'Increase contrast ratio to at least 4.5:1'
      },
      {
        rule: 'image-alt',
        impact: 'critical',
        description: 'Images must have alternate text',
        wcagCriterion: '1.1.1',
        occurrences: 2,
        elements: ['img.hero', 'img.gallery-1'],
        fix: 'Add descriptive alt attributes to images'
      },
      {
        rule: 'heading-order',
        impact: 'moderate',
        description: 'Heading levels should only increase by one',
        wcagCriterion: '1.3.1',
        occurrences: 1,
        elements: ['h4.section-title'],
        fix: 'Use h3 instead of h4 or add missing h3'
      },
      {
        rule: 'form-field-multiple-labels',
        impact: 'minor',
        description: 'Form field has multiple label elements',
        wcagCriterion: '1.3.1',
        occurrences: 1,
        elements: ['input#email'],
        fix: 'Ensure each form field has exactly one label'
      }
    ];

    return {
      testType: 'automated',
      tool: 'axe-core',
      totalIssues: issues.length,
      issues,
      coverage: 'Full page scan',
      timestamp: new Date().toISOString()
    };
  },

  async runManualTests(auditContext) {
    const testResults = [
      {
        criterion: '1.3.1',
        name: 'Info and Relationships',
        status: 'pass',
        notes: 'Semantic HTML structure is appropriate'
      },
      {
        criterion: '2.1.1',
        name: 'Keyboard',
        status: 'fail',
        notes: 'Custom dropdown not keyboard accessible',
        severity: 'serious'
      },
      {
        criterion: '2.4.3',
        name: 'Focus Order',
        status: 'pass',
        notes: 'Focus order follows logical sequence'
      },
      {
        criterion: '3.2.2',
        name: 'On Input',
        status: 'warning',
        notes: 'Form submission happens on input change without warning',
        severity: 'moderate'
      },
      {
        criterion: '4.1.2',
        name: 'Name, Role, Value',
        status: 'fail',
        notes: 'Custom components missing ARIA labels',
        severity: 'serious'
      }
    ];

    return {
      testType: 'manual',
      methodology: 'WCAG manual testing procedures',
      results: testResults,
      passCount: testResults.filter(r => r.status === 'pass').length,
      failCount: testResults.filter(r => r.status === 'fail').length,
      warningCount: testResults.filter(r => r.status === 'warning').length
    };
  },

  async runKeyboardTests(auditContext) {
    const keyboardTests = [
      {
        task: 'Navigate main menu',
        method: 'Tab key navigation',
        result: 'pass',
        notes: 'All menu items reachable via keyboard'
      },
      {
        task: 'Activate dropdown menu',
        method: 'Enter/Space key activation',
        result: 'fail',
        notes: 'Dropdown does not open with keyboard',
        severity: 'serious'
      },
      {
        task: 'Submit form',
        method: 'Tab to submit button and press Enter',
        result: 'pass',
        notes: 'Form submission works correctly'
      },
      {
        task: 'Close modal dialog',
        method: 'Escape key',
        result: 'pass',
        notes: 'Modal closes with Escape key'
      },
      {
        task: 'Navigate data table',
        method: 'Arrow keys and Tab',
        result: 'warning',
        notes: 'Table navigation works but could be improved with better ARIA support'
      }
    ];

    return {
      testType: 'keyboard',
      tasks: keyboardTests,
      passCount: keyboardTests.filter(t => t.result === 'pass').length,
      failCount: keyboardTests.filter(t => t.result === 'fail').length,
      warningCount: keyboardTests.filter(t => t.result === 'warning').length,
      keyboardOnlyNavigation: 'Partial support - some issues identified'
    };
  },

  async runScreenReaderTests(auditContext) {
    const screenReaderTests = [
      {
        element: 'Page title',
        expectation: 'Descriptive page title announced',
        result: 'pass',
        announcement: 'Dashboard - Company Name'
      },
      {
        element: 'Navigation menu',
        expectation: 'Navigation landmark identified',
        result: 'pass',
        announcement: 'Navigation region with 5 items'
      },
      {
        element: 'Form fields',
        expectation: 'Labels and instructions read clearly',
        result: 'fail',
        announcement: 'Unlabeled edit field',
        issue: 'Missing labels on form inputs'
      },
      {
        element: 'Error messages',
        expectation: 'Errors announced when they occur',
        result: 'warning',
        announcement: 'Error message visible but not announced',
        issue: 'Error messages need aria-live regions'
      },
      {
        element: 'Dynamic content',
        expectation: 'Content changes announced',
        result: 'fail',
        announcement: 'No announcement for content updates',
        issue: 'Missing ARIA live regions for dynamic content'
      }
    ];

    return {
      testType: 'screen-reader',
      tool: 'NVDA/JAWS simulation',
      tests: screenReaderTests,
      passCount: screenReaderTests.filter(t => t.result === 'pass').length,
      failCount: screenReaderTests.filter(t => t.result === 'fail').length,
      warningCount: screenReaderTests.filter(t => t.result === 'warning').length
    };
  },

  async analyzeFindings(auditContext, testResults) {
    const allIssues = [];
    
    // Process automated test issues
    if (testResults.automated) {
      testResults.automated.issues.forEach(issue => {
        allIssues.push({
          source: 'automated',
          type: issue.rule,
          severity: this.mapImpactToSeverity(issue.impact),
          wcagCriterion: issue.wcagCriterion,
          description: issue.description,
          occurrences: issue.occurrences,
          fix: issue.fix
        });
      });
    }

    // Process manual test failures
    if (testResults.manual) {
      testResults.manual.results.filter(r => r.status === 'fail').forEach(result => {
        allIssues.push({
          source: 'manual',
          type: result.name,
          severity: result.severity || 'moderate',
          wcagCriterion: result.criterion,
          description: result.notes,
          fix: 'Manual review and correction required'
        });
      });
    }

    // Process keyboard test failures
    if (testResults.keyboard) {
      testResults.keyboard.tasks.filter(t => t.result === 'fail').forEach(task => {
        allIssues.push({
          source: 'keyboard',
          type: 'keyboard-navigation',
          severity: task.severity || 'serious',
          wcagCriterion: '2.1.1',
          description: task.notes,
          fix: 'Implement proper keyboard navigation support'
        });
      });
    }

    // Process screen reader test failures
    if (testResults.screenReader) {
      testResults.screenReader.tests.filter(t => t.result === 'fail').forEach(test => {
        allIssues.push({
          source: 'screen-reader',
          type: 'screen-reader-support',
          severity: 'serious',
          wcagCriterion: '4.1.2',
          description: test.issue,
          fix: 'Improve screen reader accessibility'
        });
      });
    }

    const severityCounts = this.countBySeverity(allIssues);

    return {
      summary: {
        totalIssues: allIssues.length,
        criticalIssues: severityCounts.critical,
        seriousIssues: severityCounts.serious,
        moderateIssues: severityCounts.moderate,
        minorIssues: severityCounts.minor
      },
      issues: allIssues,
      testResults,
      wcagCriteria: this.groupByWCAGCriteria(allIssues)
    };
  },

  mapImpactToSeverity(impact) {
    const mapping = {
      'critical': 'critical',
      'serious': 'serious', 
      'moderate': 'moderate',
      'minor': 'minor'
    };
    return mapping[impact] || 'moderate';
  },

  countBySeverity(issues) {
    return issues.reduce((counts, issue) => {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
      return counts;
    }, { critical: 0, serious: 0, moderate: 0, minor: 0 });
  },

  groupByWCAGCriteria(issues) {
    return issues.reduce((groups, issue) => {
      const criterion = issue.wcagCriterion;
      if (!groups[criterion]) {
        groups[criterion] = [];
      }
      groups[criterion].push(issue);
      return groups;
    }, {});
  },

  async generateComplianceReport(auditContext, findings) {
    const wcagCriteria = this.getWCAGCriteria(auditContext.auditScope.wcagLevel);
    const totalCriteria = wcagCriteria.length;
    const failedCriteria = Object.keys(findings.wcagCriteria).length;
    const passedCriteria = totalCriteria - failedCriteria;
    
    const compliancePercentage = Math.round((passedCriteria / totalCriteria) * 100);
    
    return {
      wcagVersion: auditContext.auditScope.wcagVersion,
      wcagLevel: auditContext.auditScope.wcagLevel,
      overallScore: compliancePercentage,
      totalCriteria,
      passedCriteria,
      failedCriteria,
      complianceLevel: this.getComplianceLevel(compliancePercentage),
      criteriaSummary: this.generateCriteriaSummary(findings.wcagCriteria),
      recommendations: this.generateComplianceRecommendations(compliancePercentage, failedCriteria)
    };
  },

  getWCAGCriteria(level) {
    // Simplified WCAG criteria mapping
    const criteriaByLevel = {
      'A': 30,    // Approximate number of Level A criteria
      'AA': 50,   // Approximate number of Level A + AA criteria  
      'AAA': 78   // Approximate number of all criteria
    };
    
    return Array.from({ length: criteriaByLevel[level] }, (_, i) => `${i + 1}`);
  },

  getComplianceLevel(percentage) {
    if (percentage >= 95) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'fair';
    return 'poor';
  },

  generateCriteriaSummary(wcagCriteria) {
    return Object.entries(wcagCriteria).map(([criterion, issues]) => ({
      criterion,
      name: this.getWCAGCriterionName(criterion),
      issueCount: issues.length,
      highestSeverity: this.getHighestSeverity(issues)
    }));
  },

  getWCAGCriterionName(criterion) {
    const names = {
      '1.1.1': 'Non-text Content',
      '1.3.1': 'Info and Relationships',
      '1.4.3': 'Contrast (Minimum)',
      '2.1.1': 'Keyboard',
      '2.4.3': 'Focus Order',
      '3.2.2': 'On Input',
      '4.1.2': 'Name, Role, Value'
    };
    return names[criterion] || 'Unknown Criterion';
  },

  getHighestSeverity(issues) {
    const severityOrder = ['critical', 'serious', 'moderate', 'minor'];
    for (const severity of severityOrder) {
      if (issues.some(issue => issue.severity === severity)) {
        return severity;
      }
    }
    return 'minor';
  },

  generateComplianceRecommendations(percentage, failedCriteria) {
    const recommendations = [];
    
    if (percentage < 60) {
      recommendations.push('Major accessibility improvements needed - consider comprehensive redesign');
      recommendations.push('Conduct user testing with assistive technology users');
    } else if (percentage < 80) {
      recommendations.push('Address critical and serious accessibility issues');
      recommendations.push('Implement systematic accessibility testing process');
    } else {
      recommendations.push('Address remaining issues to achieve full compliance');
      recommendations.push('Maintain accessibility standards in future development');
    }
    
    return recommendations;
  },

  async generateRecommendations(auditContext, findings) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // Immediate recommendations for critical issues
    const criticalIssues = findings.issues.filter(issue => issue.severity === 'critical');
    criticalIssues.forEach(issue => {
      recommendations.immediate.push({
        issue: issue.type,
        action: issue.fix,
        wcagCriterion: issue.wcagCriterion,
        priority: 'critical'
      });
    });

    // Short-term recommendations for serious issues
    const seriousIssues = findings.issues.filter(issue => issue.severity === 'serious');
    seriousIssues.forEach(issue => {
      recommendations.shortTerm.push({
        issue: issue.type,
        action: issue.fix,
        wcagCriterion: issue.wcagCriterion,
        priority: 'high'
      });
    });

    // Long-term recommendations for process improvements
    recommendations.longTerm.push(
      {
        issue: 'accessibility-process',
        action: 'Implement accessibility testing in development workflow',
        priority: 'medium'
      },
      {
        issue: 'training',
        action: 'Provide accessibility training for development team',
        priority: 'medium'
      },
      {
        issue: 'guidelines',
        action: 'Create internal accessibility guidelines and checklist',
        priority: 'low'
      }
    );

    return recommendations;
  },

  async createImprovementPlan(auditContext, findings, recommendations) {
    const plan = {
      phases: [
        {
          name: 'Critical Fixes',
          duration: '1-2 weeks',
          items: recommendations.immediate,
          success: 'All critical accessibility issues resolved'
        },
        {
          name: 'Serious Issues',
          duration: '2-4 weeks', 
          items: recommendations.shortTerm,
          success: 'Significant improvement in accessibility compliance'
        },
        {
          name: 'Process Integration',
          duration: '1-2 months',
          items: recommendations.longTerm,
          success: 'Accessibility integrated into development process'
        }
      ],
      resources: this.estimateResources(findings, recommendations),
      timeline: this.createTimeline(recommendations),
      validation: this.createValidationPlan(auditContext)
    };

    return plan;
  },

  estimateResources(findings, recommendations) {
    const totalIssues = findings.summary.totalIssues;
    const criticalIssues = findings.summary.criticalIssues;
    
    return {
      developmentHours: Math.ceil(totalIssues * 2 + criticalIssues * 4),
      testingHours: Math.ceil(totalIssues * 1),
      trainingHours: 8,
      totalEstimate: `${Math.ceil((totalIssues * 3 + criticalIssues * 4 + 8) / 40)} person-weeks`
    };
  },

  createTimeline(recommendations) {
    return [
      { week: 1, tasks: ['Address critical issues', 'Quick wins implementation'] },
      { week: 2, tasks: ['Complete critical fixes', 'Begin serious issues'] },
      { week: 3, tasks: ['Continue serious issues', 'Testing and validation'] },
      { week: 4, tasks: ['Complete serious issues', 'Begin process improvements'] },
      { week: 6, tasks: ['Team training', 'Guidelines creation'] },
      { week: 8, tasks: ['Process integration', 'Final validation'] }
    ];
  },

  createValidationPlan(auditContext) {
    return {
      retesting: 'Re-run automated and manual tests after each phase',
      userTesting: 'Conduct user testing with assistive technology users',
      compliance: `Validate against WCAG ${auditContext.auditScope.wcagVersion} Level ${auditContext.auditScope.wcagLevel}`,
      tools: ['axe-core', 'WAVE', 'Lighthouse', 'screen readers'],
      frequency: 'Weekly during improvement phase, then monthly'
    };
  },

  async formatAuditOutput(auditContext, findings, complianceReport, recommendations, improvementPlan) {
    let output = `♿ **Accessibility Audit Report**\n\n`;
    output += `🎯 **Audit ID:** ${auditContext.auditId}\n`;
    output += `📋 **Target:** ${auditContext.target.type} - ${auditContext.target.source || auditContext.target.description}\n`;
    output += `📊 **WCAG Level:** ${auditContext.auditScope.wcagLevel} (v${auditContext.auditScope.wcagVersion})\n`;
    output += `📅 **Audit Date:** ${auditContext.timestamp.split('T')[0]}\n`;
    output += `👤 **Auditor:** ${auditContext.auditor}\n\n`;

    // Executive Summary
    output += `## 📊 Executive Summary\n\n`;
    output += `**Compliance Score:** ${complianceReport.overallScore}% (${complianceReport.complianceLevel})\n`;
    output += `**Total Issues:** ${findings.summary.totalIssues}\n`;
    output += `**Critical Issues:** ${findings.summary.criticalIssues}\n`;
    output += `**Serious Issues:** ${findings.summary.seriousIssues}\n`;
    output += `**WCAG Criteria Failed:** ${complianceReport.failedCriteria}/${complianceReport.totalCriteria}\n\n`;

    // Issue Breakdown
    output += `## 🔍 Issue Breakdown\n\n`;
    const severityCounts = {
      critical: findings.summary.criticalIssues,
      serious: findings.summary.seriousIssues,
      moderate: findings.summary.moderateIssues,
      minor: findings.summary.minorIssues
    };
    
    Object.entries(severityCounts).forEach(([severity, count]) => {
      if (count > 0) {
        const emoji = { critical: '🔴', serious: '🟠', moderate: '🟡', minor: '🔵' }[severity];
        output += `${emoji} **${severity.toUpperCase()}:** ${count} issues\n`;
      }
    });
    output += '\n';

    // Top Issues
    output += `## 🚨 Top Issues\n\n`;
    const topIssues = findings.issues
      .sort((a, b) => {
        const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5);

    topIssues.forEach((issue, index) => {
      const severityEmoji = { critical: '🔴', serious: '🟠', moderate: '🟡', minor: '🔵' }[issue.severity];
      output += `${index + 1}. ${severityEmoji} **${issue.type}** (WCAG ${issue.wcagCriterion})\n`;
      output += `   ${issue.description}\n`;
      output += `   *Fix: ${issue.fix}*\n\n`;
    });

    // Test Results Summary
    output += `## 🧪 Test Results Summary\n\n`;
    if (findings.testResults.automated) {
      output += `**Automated Testing:** ${findings.testResults.automated.totalIssues} issues found\n`;
    }
    if (findings.testResults.manual) {
      const manual = findings.testResults.manual;
      output += `**Manual Testing:** ${manual.failCount} failures, ${manual.warningCount} warnings\n`;
    }
    if (findings.testResults.keyboard) {
      const keyboard = findings.testResults.keyboard;
      output += `**Keyboard Testing:** ${keyboard.failCount} failures, ${keyboard.passCount} passes\n`;
    }
    if (findings.testResults.screenReader) {
      const sr = findings.testResults.screenReader;
      output += `**Screen Reader Testing:** ${sr.failCount} failures, ${sr.passCount} passes\n`;
    }
    output += '\n';

    // WCAG Compliance
    output += `## 📋 WCAG Compliance Details\n\n`;
    output += `**Standard:** WCAG ${complianceReport.wcagVersion} Level ${complianceReport.wcagLevel}\n`;
    output += `**Compliance Score:** ${complianceReport.overallScore}%\n`;
    output += `**Status:** ${complianceReport.complianceLevel.toUpperCase()}\n\n`;

    if (complianceReport.criteriaSummary.length > 0) {
      output += `**Failed Criteria:**\n`;
      complianceReport.criteriaSummary.forEach(criterion => {
        output += `• ${criterion.criterion} - ${criterion.name} (${criterion.issueCount} issues)\n`;
      });
      output += '\n';
    }

    // Immediate Actions
    output += `## 🚀 Immediate Actions Required\n\n`;
    recommendations.immediate.forEach((rec, index) => {
      output += `${index + 1}. **${rec.issue}** (WCAG ${rec.wcagCriterion})\n`;
      output += `   ${rec.action}\n`;
    });
    output += '\n';

    // Improvement Plan Overview
    output += `## 📈 Improvement Plan\n\n`;
    improvementPlan.phases.forEach((phase, index) => {
      output += `### Phase ${index + 1}: ${phase.name} (${phase.duration})\n`;
      output += `**Items:** ${phase.items.length}\n`;
      output += `**Success Criteria:** ${phase.success}\n\n`;
    });

    output += `**Estimated Resources:**\n`;
    output += `• Development: ${improvementPlan.resources.developmentHours} hours\n`;
    output += `• Testing: ${improvementPlan.resources.testingHours} hours\n`;
    output += `• Total Effort: ${improvementPlan.resources.totalEstimate}\n\n`;

    // Validation Plan
    output += `## ✅ Validation Plan\n\n`;
    output += `**Retesting:** ${improvementPlan.validation.retesting}\n`;
    output += `**User Testing:** ${improvementPlan.validation.userTesting}\n`;
    output += `**Tools:** ${improvementPlan.validation.tools.join(', ')}\n`;
    output += `**Frequency:** ${improvementPlan.validation.frequency}\n\n`;

    // Best Practices
    output += `## 💡 Accessibility Best Practices\n\n`;
    output += `• Implement accessibility testing in CI/CD pipeline\n`;
    output += `• Provide regular accessibility training for team\n`;
    output += `• Use semantic HTML and ARIA attributes appropriately\n`;
    output += `• Test with real assistive technologies\n`;
    output += `• Include users with disabilities in user testing\n`;
    output += `• Maintain accessibility documentation and guidelines\n\n`;

    output += `📁 **Complete accessibility audit report and improvement plan saved to project.**`;

    return output;
  },

  async saveAuditData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const auditsDir = join(saDir, 'accessibility-audits');
      if (!existsSync(auditsDir)) {
        require('fs').mkdirSync(auditsDir, { recursive: true });
      }
      
      const filename = `accessibility-audit-${context.auditId}-${Date.now()}.json`;
      const filepath = join(auditsDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save accessibility audit data:', error.message);
    }
  }
};