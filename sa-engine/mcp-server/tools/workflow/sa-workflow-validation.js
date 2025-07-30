/**
 * SA Workflow Validation Tool
 * Workflow integrity checking, dependency validation, quality gate assessment, and compliance verification
 */

export const saWorkflowValidation = {
  name: 'sa_workflow_validation',
  description: 'Workflow validation tool for integrity checking, dependency validation, quality gates, and compliance verification',
  category: 'workflow',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      validationType: {
        type: 'string',
        enum: ['integrity', 'dependencies', 'quality-gates', 'compliance', 'all'],
        description: 'Type of validation to perform',
        default: 'all'
      },
      severity: {
        type: 'string',
        enum: ['info', 'warning', 'error', 'critical'],
        description: 'Minimum severity level to report',
        default: 'warning'
      },
      autoFix: {
        type: 'boolean',
        description: 'Attempt to automatically fix issues where possible',
        default: false
      },
      generateReport: {
        type: 'boolean',
        description: 'Generate a detailed validation report',
        default: true
      },
      customRules: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            validation: { type: 'string' },
            severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] }
          }
        },
        description: 'Custom validation rules to apply'
      }
    },
    required: ['projectRoot']
  },
  
  async execute({ projectRoot, validationType = 'all', severity = 'warning', autoFix = false, generateReport = true, customRules = [] }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const workflowDir = path.join(projectRoot, '.sa-workflow');
      
      // Check if workflow exists
      try {
        await fs.access(workflowDir);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: 'No workflow found to validate. Use sa_start_workflow to begin a new workflow.'
          }],
          metadata: {
            hasWorkflow: false,
            projectRoot
          }
        };
      }
      
      // Load workflow state
      const stateFile = path.join(workflowDir, 'workflow-state.json');
      let workflowState;
      
      try {
        const stateContent = await fs.readFile(stateFile, 'utf-8');
        workflowState = JSON.parse(stateContent);
      } catch (error) {
        throw new Error('Failed to load workflow state: ' + error.message);
      }
      
      // Perform validations
      const validationResults = {
        workflowId: workflowState.id,
        projectName: workflowState.projectName,
        validatedAt: new Date().toISOString(),
        validationType,
        issues: [],
        fixes: [],
        summary: {
          total: 0,
          critical: 0,
          error: 0,
          warning: 0,
          info: 0
        }
      };
      
      // Run specific validations
      if (validationType === 'all' || validationType === 'integrity') {
        await this.validateWorkflowIntegrity(workflowState, workflowDir, validationResults);
      }
      
      if (validationType === 'all' || validationType === 'dependencies') {
        await this.validateDependencies(workflowState, workflowDir, validationResults);
      }
      
      if (validationType === 'all' || validationType === 'quality-gates') {
        await this.validateQualityGates(workflowState, workflowDir, validationResults);
      }
      
      if (validationType === 'all' || validationType === 'compliance') {
        await this.validateCompliance(workflowState, workflowDir, validationResults);
      }
      
      // Apply custom rules
      if (customRules.length > 0) {
        await this.applyCustomRules(workflowState, workflowDir, customRules, validationResults);
      }
      
      // Filter by severity
      validationResults.issues = validationResults.issues.filter(issue => 
        this.getSeverityLevel(issue.severity) >= this.getSeverityLevel(severity)
      );
      
      // Update summary
      validationResults.issues.forEach(issue => {
        validationResults.summary.total++;
        validationResults.summary[issue.severity]++;
      });
      
      // Auto-fix if requested
      if (autoFix && validationResults.issues.length > 0) {
        await this.attemptAutoFix(workflowState, workflowDir, validationResults);
      }
      
      // Generate report
      let reportContent = '';
      if (generateReport) {
        reportContent = await this.generateValidationReport(validationResults);
        
        // Save report
        const reportsDir = path.join(workflowDir, 'reports');
        await fs.mkdir(reportsDir, { recursive: true });
        const reportFile = path.join(reportsDir, `validation-report-${new Date().toISOString().split('T')[0]}.md`);
        await fs.writeFile(reportFile, reportContent);
      }
      
      // Build response text
      const responseText = this.buildValidationResponse(validationResults, reportContent);
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        metadata: {
          workflowId: workflowState.id,
          validationType,
          totalIssues: validationResults.summary.total,
          criticalIssues: validationResults.summary.critical,
          errorIssues: validationResults.summary.error,
          warningIssues: validationResults.summary.warning,
          infoIssues: validationResults.summary.info,
          fixesApplied: validationResults.fixes.length,
          validatedAt: validationResults.validatedAt
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error validating workflow: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'workflow_validation_error'
        }
      };
    }
  },
  
  async validateWorkflowIntegrity(workflowState, workflowDir, results) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check required files and directories
    const requiredFiles = [
      'workflow-state.json',
      'README.md',
      'monitoring-config.json'
    ];
    
    const requiredDirs = [
      'phases',
      'artifacts', 
      'reports',
      'logs'
    ];
    
    // Validate required files
    for (const file of requiredFiles) {
      const filePath = path.join(workflowDir, file);
      try {
        await fs.access(filePath);
      } catch (error) {
        results.issues.push({
          type: 'integrity',
          severity: 'error',
          message: `Missing required file: ${file}`,
          location: filePath,
          suggestion: `Create the missing file: ${file}`
        });
      }
    }
    
    // Validate required directories
    for (const dir of requiredDirs) {
      const dirPath = path.join(workflowDir, dir);
      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) {
          results.issues.push({
            type: 'integrity',
            severity: 'error',
            message: `Expected directory but found file: ${dir}`,
            location: dirPath,
            suggestion: `Remove file and create directory: ${dir}`
          });
        }
      } catch (error) {
        results.issues.push({
          type: 'integrity',
          severity: 'warning',
          message: `Missing required directory: ${dir}`,
          location: dirPath,
          suggestion: `Create the missing directory: ${dir}`
        });
      }
    }
    
    // Validate workflow state structure
    const requiredFields = ['id', 'type', 'projectName', 'status', 'phases', 'progress'];
    for (const field of requiredFields) {
      if (!workflowState[field]) {
        results.issues.push({
          type: 'integrity',
          severity: 'critical',
          message: `Missing required field in workflow state: ${field}`,
          location: 'workflow-state.json',
          suggestion: `Add missing field: ${field}`
        });
      }
    }
    
    // Validate phases structure
    if (workflowState.phases && Array.isArray(workflowState.phases)) {
      workflowState.phases.forEach((phase, index) => {
        const requiredPhaseFields = ['name', 'description', 'status'];
        for (const field of requiredPhaseFields) {
          if (!phase[field]) {
            results.issues.push({
              type: 'integrity',
              severity: 'error',
              message: `Phase ${index + 1} missing required field: ${field}`,
              location: `workflow-state.json:phases[${index}]`,
              suggestion: `Add missing field to phase ${index + 1}: ${field}`
            });
          }
        }
        
        // Validate phase status values
        const validStatuses = ['pending', 'in-progress', 'completed', 'blocked', 'cancelled'];
        if (phase.status && !validStatuses.includes(phase.status)) {
          results.issues.push({
            type: 'integrity',
            severity: 'warning',
            message: `Phase ${index + 1} has invalid status: ${phase.status}`,
            location: `workflow-state.json:phases[${index}].status`,
            suggestion: `Use valid status: ${validStatuses.join(', ')}`
          });
        }
      });
    } else {
      results.issues.push({
        type: 'integrity',
        severity: 'critical',
        message: 'Phases field is missing or not an array',
        location: 'workflow-state.json:phases',
        suggestion: 'Ensure phases is a valid array of phase objects'
      });
    }
    
    // Check for orphaned phase directories
    try {
      const phasesDir = path.join(workflowDir, 'phases');
      const phaseEntries = await fs.readdir(phasesDir);
      const expectedPhases = workflowState.phases?.length || 0;
      
      if (phaseEntries.length > expectedPhases) {
        results.issues.push({
          type: 'integrity',
          severity: 'warning',
          message: `Found ${phaseEntries.length} phase directories but only ${expectedPhases} phases defined`,
          location: 'phases/',
          suggestion: 'Remove orphaned phase directories or update workflow state'
        });
      }
    } catch (error) {
      // Directory doesn't exist, already reported above
    }
  },
  
  async validateDependencies(workflowState, workflowDir, results) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check if phases have logical dependencies
    if (workflowState.phases && workflowState.phases.length > 1) {
      for (let i = 1; i < workflowState.phases.length; i++) {
        const currentPhase = workflowState.phases[i];
        const previousPhase = workflowState.phases[i - 1];
        
        // Check if a phase is completed before its predecessor
        if (currentPhase.status === 'completed' && previousPhase.status !== 'completed') {
          results.issues.push({
            type: 'dependencies',
            severity: 'warning',
            message: `Phase ${i + 1} (${currentPhase.name}) is completed but previous phase is not`,
            location: `workflow-state.json:phases[${i}]`,
            suggestion: 'Review phase completion order for logical consistency'
          });
        }
        
        // Check if a phase is in-progress while previous phase is pending
        if (currentPhase.status === 'in-progress' && previousPhase.status === 'pending') {
          results.issues.push({
            type: 'dependencies',
            severity: 'info',
            message: `Phase ${i + 1} (${currentPhase.name}) is in progress while previous phase is pending`,
            location: `workflow-state.json:phases[${i}]`,
            suggestion: 'Consider starting phases in sequential order for better workflow management'
          });
        }
      }
    }
    
    // Check current phase consistency
    if (workflowState.currentPhase !== undefined) {
      const currentPhaseIndex = workflowState.currentPhase;
      if (currentPhaseIndex >= 0 && currentPhaseIndex < workflowState.phases.length) {
        const currentPhase = workflowState.phases[currentPhaseIndex];
        
        if (currentPhase.status === 'pending') {
          results.issues.push({
            type: 'dependencies',
            severity: 'warning',
            message: `Current phase (${currentPhaseIndex + 1}) is marked as pending but set as active`,
            location: `workflow-state.json:currentPhase`,
            suggestion: 'Update current phase status to in-progress or adjust currentPhase index'
          });
        }
        
        if (currentPhase.status === 'completed') {
          // Check if there's a next phase that should be current
          if (currentPhaseIndex + 1 < workflowState.phases.length) {
            results.issues.push({
              type: 'dependencies',
              severity: 'info',
              message: `Current phase is completed but workflow hasn't advanced to next phase`,
              location: `workflow-state.json:currentPhase`,
              suggestion: 'Consider advancing to the next phase'
            });
          }
        }
      } else {
        results.issues.push({
          type: 'dependencies',
          severity: 'error',
          message: `Current phase index (${currentPhaseIndex}) is out of bounds`,
          location: `workflow-state.json:currentPhase`,
          suggestion: `Set currentPhase to a value between 0 and ${workflowState.phases.length - 1}`
        });
      }
    }
    
    // Check for missing agent dependencies
    if (workflowState.agents && workflowState.agents.length > 0) {
      const agentDir = path.join(process.cwd(), 'sa-engine', 'agents');
      for (const agentName of workflowState.agents) {
        const agentFile = path.join(agentDir, `${agentName}.json`);
        try {
          await fs.access(agentFile);
        } catch (error) {
          results.issues.push({
            type: 'dependencies',
            severity: 'warning',
            message: `Referenced agent not found: ${agentName}`,
            location: agentFile,
            suggestion: `Ensure agent definition exists: ${agentName}.json`
          });
        }
      }
    }
    
    // Check for milestone dependencies
    try {
      const milestonesFile = path.join(workflowDir, 'milestones.json');
      const milestonesContent = await fs.readFile(milestonesFile, 'utf-8');
      const milestones = JSON.parse(milestonesContent);
      
      milestones.forEach(milestone => {
        if (milestone.phaseId !== undefined) {
          if (milestone.phaseId < 0 || milestone.phaseId >= workflowState.phases.length) {
            results.issues.push({
              type: 'dependencies',
              severity: 'error',
              message: `Milestone "${milestone.name}" references invalid phase ID: ${milestone.phaseId}`,
              location: 'milestones.json',
              suggestion: `Update milestone phase ID to valid range: 0-${workflowState.phases.length - 1}`
            });
          }
        }
      });
    } catch (error) {
      // Milestones file doesn't exist, not an error
    }
  },
  
  async validateQualityGates(workflowState, workflowDir, results) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check if phases have quality gates defined
    workflowState.phases.forEach((phase, index) => {
      if (phase.status === 'completed' && !phase.completedAt) {
        results.issues.push({
          type: 'quality-gates',
          severity: 'warning',
          message: `Completed phase ${index + 1} (${phase.name}) missing completion timestamp`,
          location: `workflow-state.json:phases[${index}]`,
          suggestion: 'Add completedAt timestamp to completed phases'
        });
      }
      
      if (phase.status === 'in-progress' && !phase.startedAt) {
        results.issues.push({
          type: 'quality-gates',
          severity: 'warning',
          message: `In-progress phase ${index + 1} (${phase.name}) missing start timestamp`,
          location: `workflow-state.json:phases[${index}]`,
          suggestion: 'Add startedAt timestamp to in-progress phases'
        });
      }
      
      // Check for long-running phases
      if (phase.status === 'in-progress' && phase.startedAt) {
        const startTime = new Date(phase.startedAt);
        const currentTime = new Date();
        const daysSinceStart = (currentTime - startTime) / (1000 * 60 * 60 * 24);
        
        if (daysSinceStart > 14) { // More than 2 weeks
          results.issues.push({
            type: 'quality-gates',
            severity: 'warning',
            message: `Phase ${index + 1} (${phase.name}) has been in progress for ${Math.round(daysSinceStart)} days`,
            location: `workflow-state.json:phases[${index}]`,
            suggestion: 'Review phase progress and consider breaking into smaller tasks'
          });
        }
      }
    });
    
    // Check for stale workflow
    const lastUpdate = new Date(workflowState.updatedAt);
    const currentTime = new Date();
    const daysSinceUpdate = (currentTime - lastUpdate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 7 && workflowState.status === 'active') {
      results.issues.push({
        type: 'quality-gates',
        severity: 'info',
        message: `Workflow has not been updated for ${Math.round(daysSinceUpdate)} days`,
        location: 'workflow-state.json:updatedAt',
        suggestion: 'Review workflow status and update progress if needed'
      });
    }
    
    // Check progress consistency
    if (workflowState.progress && workflowState.phases) {
      const calculatedProgress = Math.round(
        workflowState.phases.reduce((sum, phase) => sum + (phase.progress || 0), 0) / workflowState.phases.length
      );
      
      if (Math.abs(calculatedProgress - workflowState.progress.overall) > 5) {
        results.issues.push({
          type: 'quality-gates',
          severity: 'warning',
          message: `Overall progress (${workflowState.progress.overall}%) doesn't match calculated progress (${calculatedProgress}%)`,
          location: 'workflow-state.json:progress.overall',
          suggestion: 'Recalculate and update overall progress percentage'
        });
      }
    }
    
    // Check for missing artifacts in completed phases
    for (let i = 0; i < workflowState.phases.length; i++) {
      const phase = workflowState.phases[i];
      if (phase.status === 'completed') {
        const phaseDir = path.join(workflowDir, 'phases', `phase-${i + 1}-${phase.name.toLowerCase().replace(/\\s+/g, '-')}`);
        try {
          const phaseFiles = await fs.readdir(phaseDir);
          if (phaseFiles.length === 0) {
            results.issues.push({
              type: 'quality-gates',
              severity: 'info',
              message: `Completed phase ${i + 1} (${phase.name}) has no artifacts`,
              location: phaseDir,
              suggestion: 'Consider adding deliverables or documentation for completed phases'
            });
          }
        } catch (error) {
          results.issues.push({
            type: 'quality-gates',
            severity: 'warning',
            message: `Missing directory for completed phase ${i + 1} (${phase.name})`,
            location: phaseDir,
            suggestion: 'Create phase directory and add relevant artifacts'
          });
        }
      }
    }
  },
  
  async validateCompliance(workflowState, workflowDir, results) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Check for required documentation
    const requiredDocs = ['README.md'];
    for (const doc of requiredDocs) {
      const docPath = path.join(workflowDir, doc);
      try {
        const content = await fs.readFile(docPath, 'utf-8');
        if (content.length < 100) {
          results.issues.push({
            type: 'compliance',
            severity: 'warning',
            message: `Required documentation ${doc} appears to be incomplete (< 100 characters)`,
            location: docPath,
            suggestion: `Expand documentation in ${doc} with comprehensive project information`
          });
        }
      } catch (error) {
        results.issues.push({
          type: 'compliance',
          severity: 'error',
          message: `Missing required documentation: ${doc}`,
          location: docPath,
          suggestion: `Create required documentation file: ${doc}`
        });
      }
    }
    
    // Check for proper logging
    const logsDir = path.join(workflowDir, 'logs');
    try {
      const logFiles = await fs.readdir(logsDir);
      if (logFiles.length === 0) {
        results.issues.push({
          type: 'compliance',
          severity: 'warning',
          message: 'No log files found in workflow',
          location: logsDir,
          suggestion: 'Ensure workflow activities are being logged properly'
        });
      }
    } catch (error) {
      results.issues.push({
        type: 'compliance',
        severity: 'warning',
        message: 'Logs directory is missing',
        location: logsDir,
        suggestion: 'Create logs directory and ensure proper logging'
      });
    }
    
    // Check workflow naming conventions
    if (workflowState.projectName) {
      const namePattern = /^[a-zA-Z0-9\\s\\-_]+$/;
      if (!namePattern.test(workflowState.projectName)) {
        results.issues.push({
          type: 'compliance',
          severity: 'info',
          message: 'Project name contains special characters that may cause issues',
          location: 'workflow-state.json:projectName',
          suggestion: 'Use alphanumeric characters, spaces, hyphens, and underscores only'
        });
      }
    }
    
    // Check for version information
    if (!workflowState.version && !workflowState.workflowVersion) {
      results.issues.push({
        type: 'compliance',
        severity: 'info',
        message: 'Workflow lacks version information',
        location: 'workflow-state.json',
        suggestion: 'Add version field to track workflow evolution'
      });
    }
    
    // Check for proper status transitions
    const statusTransitions = {
      'pending': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'blocked', 'cancelled'],
      'completed': [], // Terminal state
      'blocked': ['in-progress', 'cancelled'],
      'cancelled': [] // Terminal state
    };
    
    workflowState.phases.forEach((phase, index) => {
      if (phase.previousStatus && phase.status) {
        const validTransitions = statusTransitions[phase.previousStatus] || [];
        if (!validTransitions.includes(phase.status)) {
          results.issues.push({
            type: 'compliance',
            severity: 'warning',
            message: `Phase ${index + 1} (${phase.name}) has invalid status transition: ${phase.previousStatus} → ${phase.status}`,
            location: `workflow-state.json:phases[${index}]`,
            suggestion: `Use valid status transitions for ${phase.previousStatus}: ${validTransitions.join(', ')}`
          });
        }
      }
    });
  },
  
  async applyCustomRules(workflowState, workflowDir, customRules, results) {
    for (const rule of customRules) {
      try {
        // Simple rule evaluation (in a real implementation, this would be more sophisticated)
        const ruleResult = await this.evaluateCustomRule(rule, workflowState, workflowDir);
        if (!ruleResult.passed) {
          results.issues.push({
            type: 'custom',
            severity: rule.severity || 'warning',
            message: `Custom rule violation: ${rule.name} - ${ruleResult.message}`,
            location: ruleResult.location || 'custom-rule',
            suggestion: rule.description || 'Review custom rule requirements'
          });
        }
      } catch (error) {
        results.issues.push({
          type: 'custom',
          severity: 'error',
          message: `Failed to evaluate custom rule "${rule.name}": ${error.message}`,
          location: 'custom-rule',
          suggestion: 'Check custom rule syntax and logic'
        });
      }
    }
  },
  
  async evaluateCustomRule(rule, workflowState, workflowDir) {
    // This is a simplified implementation
    // In a production system, you'd want a more robust rule evaluation engine
    
    const context = {
      workflow: workflowState,
      workflowDir,
      phases: workflowState.phases || [],
      progress: workflowState.progress || {}
    };
    
    // Simple string-based rule evaluation
    if (rule.validation.includes('phases.length')) {
      const minPhases = parseInt(rule.validation.match(/phases\\.length\\s*>=\\s*(\\d+)/)?.[1] || '0');
      if (context.phases.length < minPhases) {
        return {
          passed: false,
          message: `Workflow has ${context.phases.length} phases, expected at least ${minPhases}`,
          location: 'workflow-state.json:phases'
        };
      }
    }
    
    return { passed: true };
  },
  
  async attemptAutoFix(workflowState, workflowDir, results) {
    const fs = await import('fs/promises');
    const path = await import('path');
    let stateUpdated = false;
    
    for (const issue of results.issues) {
      try {
        let fixApplied = false;
        
        switch (issue.type) {
          case 'integrity':
            if (issue.message.includes('Missing required directory')) {
              const dirName = issue.message.split(': ')[1];
              const dirPath = path.join(workflowDir, dirName);
              await fs.mkdir(dirPath, { recursive: true });
              fixApplied = true;
            }
            break;
            
          case 'quality-gates':
            if (issue.message.includes('missing completion timestamp') && workflowState.phases) {
              const phaseIndex = parseInt(issue.location.match(/phases\\[(\\d+)\\]/)?.[1]);
              if (!isNaN(phaseIndex) && workflowState.phases[phaseIndex]) {
                workflowState.phases[phaseIndex].completedAt = new Date().toISOString();
                stateUpdated = true;
                fixApplied = true;
              }
            }
            
            if (issue.message.includes('missing start timestamp') && workflowState.phases) {
              const phaseIndex = parseInt(issue.location.match(/phases\\[(\\d+)\\]/)?.[1]);
              if (!isNaN(phaseIndex) && workflowState.phases[phaseIndex]) {
                workflowState.phases[phaseIndex].startedAt = new Date().toISOString();
                stateUpdated = true;
                fixApplied = true;
              }
            }
            break;
        }
        
        if (fixApplied) {
          results.fixes.push({
            issue: issue.message,
            fix: 'Auto-fixed',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        // Auto-fix failed, continue with other issues
      }
    }
    
    // Save updated workflow state if changes were made
    if (stateUpdated) {
      workflowState.updatedAt = new Date().toISOString();
      const stateFile = path.join(workflowDir, 'workflow-state.json');
      await fs.writeFile(stateFile, JSON.stringify(workflowState, null, 2));
    }
  },
  
  async generateValidationReport(results) {
    let report = `# Workflow Validation Report\\n\\n`;
    report += `**Project:** ${results.projectName}\\n`;
    report += `**Workflow ID:** ${results.workflowId}\\n`;
    report += `**Validation Type:** ${results.validationType}\\n`;
    report += `**Generated:** ${new Date(results.validatedAt).toLocaleString()}\\n\\n`;
    
    // Summary
    report += `## Summary\\n`;
    report += `- **Total Issues:** ${results.summary.total}\\n`;
    report += `- **Critical:** ${results.summary.critical}\\n`;
    report += `- **Error:** ${results.summary.error}\\n`;
    report += `- **Warning:** ${results.summary.warning}\\n`;
    report += `- **Info:** ${results.summary.info}\\n`;
    
    if (results.fixes.length > 0) {
      report += `- **Auto-fixes Applied:** ${results.fixes.length}\\n`;
    }
    report += '\\n';
    
    // Issues by type
    const issuesByType = {};
    results.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    Object.entries(issuesByType).forEach(([type, issues]) => {
      report += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Issues\\n\\n`;
      
      issues.forEach((issue, index) => {
        const severityIcon = {
          critical: '🚨',
          error: '❌',
          warning: '⚠️',
          info: 'ℹ️'
        }[issue.severity] || '•';
        
        report += `### ${severityIcon} ${issue.message}\\n`;
        report += `- **Severity:** ${issue.severity}\\n`;
        report += `- **Location:** ${issue.location}\\n`;
        report += `- **Suggestion:** ${issue.suggestion}\\n\\n`;
      });
    });
    
    // Auto-fixes applied
    if (results.fixes.length > 0) {
      report += `## Auto-Fixes Applied\\n\\n`;
      results.fixes.forEach(fix => {
        report += `- **${fix.timestamp}:** ${fix.issue} - ${fix.fix}\\n`;
      });
      report += '\\n';
    }
    
    report += '---\\n';
    report += '*Generated by SA Workflow Management System*\\n';
    
    return report;
  },
  
  buildValidationResponse(results, reportContent) {
    let response = `# Workflow Validation Results\\n\\n`;
    
    if (results.summary.total === 0) {
      response += `✅ **Validation Passed** - No issues found\\n\\n`;
      response += `Workflow "${results.projectName}" passed all validation checks.`;
    } else {
      response += `🔍 **Validation Complete** - ${results.summary.total} issues found\\n\\n`;
      
      if (results.summary.critical > 0) {
        response += `🚨 **${results.summary.critical} Critical Issues** - Immediate attention required\\n`;
      }
      if (results.summary.error > 0) {
        response += `❌ **${results.summary.error} Errors** - Should be fixed\\n`;
      }
      if (results.summary.warning > 0) {
        response += `⚠️ **${results.summary.warning} Warnings** - Recommended fixes\\n`;
      }
      if (results.summary.info > 0) {
        response += `ℹ️ **${results.summary.info} Info** - Suggestions for improvement\\n`;
      }
      
      response += '\\n';
      
      if (results.fixes.length > 0) {
        response += `🔧 **${results.fixes.length} Auto-fixes Applied**\\n\\n`;
      }
      
      // Show top issues
      const topIssues = results.issues
        .sort((a, b) => this.getSeverityLevel(b.severity) - this.getSeverityLevel(a.severity))
        .slice(0, 5);
      
      if (topIssues.length > 0) {
        response += `## Top Issues\\n`;
        topIssues.forEach((issue, index) => {
          const severityIcon = {
            critical: '🚨',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
          }[issue.severity] || '•';
          
          response += `${index + 1}. ${severityIcon} ${issue.message}\\n`;
        });
        response += '\\n';
      }
    }
    
    response += `**Validation completed at:** ${new Date(results.validatedAt).toLocaleString()}`;
    
    return response;
  },
  
  getSeverityLevel(severity) {
    const levels = {
      info: 1,
      warning: 2,
      error: 3,
      critical: 4
    };
    return levels[severity] || 0;
  }
};