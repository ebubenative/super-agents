/**
 * SA Validate Dependencies Tool
 * Comprehensive dependency validation including cycle detection, logical consistency, and health assessment
 */

export const saValidateDependencies = {
  name: 'sa_validate_dependencies',
  description: 'Comprehensive dependency validation with cycle detection, logical consistency checking, and dependency health assessment',
  category: 'dependencies',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      tasksFile: {
        type: 'string',
        description: 'Path to tasks file (optional, will use project tasks.json)'
      },
      validationType: {
        type: 'string',
        enum: ['full', 'cycles', 'logical', 'orphans', 'redundant', 'critical-path'],
        description: 'Type of validation to perform',
        default: 'full'
      },
      fixIssues: {
        type: 'boolean',
        description: 'Automatically fix issues where possible',
        default: false
      },
      generateReport: {
        type: 'boolean',
        description: 'Generate detailed validation report',
        default: true
      },
      severity: {
        type: 'string',
        enum: ['all', 'critical', 'warning', 'info'],
        description: 'Minimum severity level to report',
        default: 'warning'
      },
      includeMetrics: {
        type: 'boolean',
        description: 'Include dependency metrics in output',
        default: true
      }
    },
    required: ['projectRoot']
  },
  
  async execute({ projectRoot, tasksFile, validationType = 'full', fixIssues = false, generateReport = true, severity = 'warning', includeMetrics = true }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Determine tasks file path
      const tasksPath = tasksFile || path.join(projectRoot, 'sa-engine', 'data', 'tasks', 'tasks.json');
      
      // Load tasks
      let tasksData;
      try {
        const tasksContent = await fs.readFile(tasksPath, 'utf-8');
        tasksData = JSON.parse(tasksContent);
      } catch (error) {
        throw new Error(`Failed to load tasks file: ${error.message}`);
      }
      
      if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
        throw new Error('Invalid tasks file format');
      }
      
      // Perform validation
      const validationResults = await this.performValidation(tasksData.tasks, validationType);
      
      // Filter results by severity
      const filteredIssues = this.filterIssuesBySeverity(validationResults.issues, severity);
      
      // Auto-fix issues if requested
      let fixResults = [];
      if (fixIssues && filteredIssues.length > 0) {
        fixResults = await this.autoFixIssues(tasksData.tasks, filteredIssues);
        
        // Save updated tasks if fixes were applied
        if (fixResults.some(fix => fix.applied)) {
          await fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2));
          
          // Update validation results after fixes
          const updatedValidation = await this.performValidation(tasksData.tasks, validationType);
          validationResults.issues = this.filterIssuesBySeverity(updatedValidation.issues, severity);
          validationResults.summary = updatedValidation.summary;
        }
      }
      
      // Generate metrics if requested
      let metrics = {};
      if (includeMetrics) {
        metrics = this.calculateDependencyMetrics(tasksData.tasks);
      }
      
      // Generate report if requested
      let reportContent = '';
      let reportPath = '';
      if (generateReport) {
        reportContent = this.generateValidationReport(validationResults, metrics, fixResults);
        
        // Save report
        const reportsDir = path.join(projectRoot, 'sa-engine', 'data', 'reports');
        await fs.mkdir(reportsDir, { recursive: true });
        reportPath = path.join(reportsDir, `dependency-validation-${new Date().toISOString().split('T')[0]}.md`);
        await fs.writeFile(reportPath, reportContent);
      }
      
      // Build response
      const summary = this.buildValidationSummary(validationResults, fixResults, metrics);
      const responseText = generateReport ? `${summary}\\n\\n${reportContent}` : summary;
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        metadata: {
          validationType,
          totalTasks: tasksData.tasks.length,
          totalIssues: filteredIssues.length,
          criticalIssues: filteredIssues.filter(i => i.severity === 'critical').length,
          warningIssues: filteredIssues.filter(i => i.severity === 'warning').length,
          infoIssues: filteredIssues.filter(i => i.severity === 'info').length,
          fixesApplied: fixResults.filter(f => f.applied).length,
          reportPath,
          validatedAt: new Date().toISOString(),
          metrics: includeMetrics ? metrics : null
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error validating dependencies: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'dependency_validation_error'
        }
      };
    }
  },
  
  async performValidation(tasks, validationType) {
    const results = {
      validationType,
      validatedAt: new Date().toISOString(),
      issues: [],
      summary: {
        totalTasks: tasks.length,
        tasksWithDependencies: 0,
        totalDependencies: 0,
        cyclesFound: 0,
        orphanedTasks: 0,
        redundantDependencies: 0
      }
    };
    
    // Calculate basic metrics
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.length > 0) {
        results.summary.tasksWithDependencies++;
        results.summary.totalDependencies += task.dependencies.length;
      }
    });
    
    // Perform specific validations based on type
    if (validationType === 'full' || validationType === 'cycles') {
      await this.validateCycles(tasks, results);
    }
    
    if (validationType === 'full' || validationType === 'logical') {
      await this.validateLogicalConsistency(tasks, results);
    }
    
    if (validationType === 'full' || validationType === 'orphans') {
      await this.validateOrphans(tasks, results);
    }
    
    if (validationType === 'full' || validationType === 'redundant') {
      await this.validateRedundancy(tasks, results);
    }
    
    if (validationType === 'full' || validationType === 'critical-path') {
      await this.validateCriticalPath(tasks, results);
    }
    
    return results;
  },
  
  async validateCycles(tasks, results) {
    const cycles = this.findAllCycles(tasks);
    results.summary.cyclesFound = cycles.length;
    
    cycles.forEach(cycle => {
      results.issues.push({
        type: 'cycle',
        severity: 'critical',
        title: 'Circular Dependency Detected',
        description: `Circular dependency found in task chain: ${cycle.path.join(' → ')}`,
        affectedTasks: cycle.path,
        cyclePath: cycle.path,
        suggestion: 'Remove one or more dependencies to break the cycle',
        autoFixable: false
      });
    });
  },
  
  async validateLogicalConsistency(tasks, results) {
    tasks.forEach(task => {
      if (!task.dependencies || task.dependencies.length === 0) return;
      
      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (!depTask) {
          results.issues.push({
            type: 'missing-dependency',
            severity: 'critical',
            title: 'Missing Dependency Task',
            description: `Task "${task.title}" depends on non-existent task: ${depId}`,
            affectedTasks: [task.id],
            missingTaskId: depId,
            suggestion: 'Remove the dependency or create the missing task',
            autoFixable: true,
            autoFixAction: 'remove-dependency'
          });
          return;
        }
        
        // Check for logical inconsistencies
        this.checkLogicalInconsistency(task, depTask, results);
        
        // Check status inconsistencies
        this.checkStatusInconsistency(task, depTask, results);
        
        // Check priority inconsistencies
        this.checkPriorityInconsistency(task, depTask, results);
      });
    });
  },
  
  checkLogicalInconsistency(task, depTask, results) {
    const taskTitle = task.title.toLowerCase();
    const depTitle = depTask.title.toLowerCase();
    
    // Check for backwards dependencies (implementation depending on testing)
    if (taskTitle.includes('test') && 
        (depTitle.includes('implement') || depTitle.includes('develop'))) {
      results.issues.push({
        type: 'logical-inconsistency',
        severity: 'warning',
        title: 'Questionable Dependency Order',
        description: `Testing task "${task.title}" depends on implementation task "${depTask.title}" - this may be backwards`,
        affectedTasks: [task.id, depTask.id],
        suggestion: 'Consider if the implementation should depend on the test specification instead',
        autoFixable: false
      });
    }
    
    // Check for setup dependencies after implementation
    if (taskTitle.includes('implement') && 
        (depTitle.includes('setup') || depTitle.includes('configure'))) {
      // This is actually correct, but check if it's really needed
      if (task.status === 'completed' && depTask.status === 'pending') {
        results.issues.push({
          type: 'logical-inconsistency',
          severity: 'warning',
          title: 'Implementation Completed Before Setup',
          description: `Implementation task "${task.title}" is completed but setup dependency "${depTask.title}" is still pending`,
          affectedTasks: [task.id, depTask.id],
          suggestion: 'Verify if the setup was actually completed and update task status',
          autoFixable: false
        });
      }
    }
  },
  
  checkStatusInconsistency(task, depTask, results) {
    // Task is completed but dependency is not
    if (task.status === 'completed' && 
        depTask.status !== 'completed' && 
        depTask.status !== 'cancelled') {
      results.issues.push({
        type: 'status-inconsistency',
        severity: 'warning',
        title: 'Completed Task with Incomplete Dependency',
        description: `Task "${task.title}" is completed but dependency "${depTask.title}" is ${depTask.status}`,
        affectedTasks: [task.id, depTask.id],
        suggestion: 'Verify task completion or update dependency status',
        autoFixable: false
      });
    }
    
    // Task is in progress but dependency is pending
    if (task.status === 'in-progress' && depTask.status === 'pending') {
      results.issues.push({
        type: 'status-inconsistency',
        severity: 'info',
        title: 'Task Started Before Dependency',
        description: `Task "${task.title}" is in progress but dependency "${depTask.title}" is still pending`,
        affectedTasks: [task.id, depTask.id],
        suggestion: 'Consider starting the dependency task if this is a blocking relationship',
        autoFixable: false
      });
    }
  },
  
  checkPriorityInconsistency(task, depTask, results) {
    // High priority task depending on low priority task
    if (task.priority === 'high' && depTask.priority === 'low') {
      results.issues.push({
        type: 'priority-inconsistency',
        severity: 'info',
        title: 'Priority Mismatch',
        description: `High priority task "${task.title}" depends on low priority task "${depTask.title}"`,
        affectedTasks: [task.id, depTask.id],
        suggestion: 'Consider increasing dependency priority or reviewing task priorities',
        autoFixable: true,
        autoFixAction: 'adjust-priority'
      });
    }
  },
  
  async validateOrphans(tasks, results) {
    const orphanedTasks = this.findOrphanedTasks(tasks);
    results.summary.orphanedTasks = orphanedTasks.length;
    
    orphanedTasks.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        results.issues.push({
          type: 'orphaned-task',
          severity: 'info',
          title: 'Orphaned Task',
          description: `Task "${task.title}" has no dependencies and no other tasks depend on it`,
          affectedTasks: [taskId],
          suggestion: 'Review if this task needs dependencies or if other tasks should depend on it',
          autoFixable: false
        });
      }
    });
  },
  
  async validateRedundancy(tasks, results) {
    const redundantDependencies = this.findRedundantDependencies(tasks);
    results.summary.redundantDependencies = redundantDependencies.length;
    
    redundantDependencies.forEach(redundancy => {
      results.issues.push({
        type: 'redundant-dependency',
        severity: 'info',
        title: 'Redundant Dependency',
        description: `Task "${redundancy.taskTitle}" has redundant dependency on "${redundancy.redundantDepTitle}" via path: ${redundancy.path.join(' → ')}`,
        affectedTasks: [redundancy.taskId, redundancy.redundantDep],
        redundancyPath: redundancy.path,
        suggestion: 'Consider removing the direct dependency as an indirect path exists',
        autoFixable: true,
        autoFixAction: 'remove-redundant-dependency'
      });
    });
  },
  
  async validateCriticalPath(tasks, results) {
    const criticalPathIssues = this.analyzeCriticalPath(tasks);
    
    criticalPathIssues.forEach(issue => {
      results.issues.push({
        type: 'critical-path',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        affectedTasks: issue.affectedTasks,
        suggestion: issue.suggestion,
        autoFixable: false
      });
    });
  },
  
  findAllCycles(tasks) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];
    
    // Build adjacency list
    const graph = new Map();
    tasks.forEach(task => {
      graph.set(task.id, task.dependencies || []);
    });
    
    const dfs = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = [...path.slice(cycleStart), nodeId];
        cycles.push({ path: cyclePath });
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor);
      }
      
      recursionStack.delete(nodeId);
      path.pop();
    };
    
    // Check for cycles starting from each unvisited node
    for (const taskId of graph.keys()) {
      if (!visited.has(taskId)) {
        dfs(taskId);
      }
    }
    
    return cycles;
  },
  
  findOrphanedTasks(tasks) {
    const orphaned = [];
    
    tasks.forEach(task => {
      const hasDependencies = task.dependencies && task.dependencies.length > 0;
      const hasDependent = tasks.some(t => 
        t.dependencies && t.dependencies.includes(task.id)
      );
      
      if (!hasDependencies && !hasDependent) {
        orphaned.push(task.id);
      }
    });
    
    return orphaned;
  },
  
  findRedundantDependencies(tasks) {
    const redundant = [];
    
    tasks.forEach(task => {
      if (!task.dependencies || task.dependencies.length <= 1) return;
      
      task.dependencies.forEach(depId => {
        // Check if there's an indirect path to this dependency
        const indirectPath = this.findIndirectPath(tasks, task.id, depId, [depId]);
        if (indirectPath.length > 0) {
          const depTask = tasks.find(t => t.id === depId);
          redundant.push({
            taskId: task.id,
            taskTitle: task.title,
            redundantDep: depId,
            redundantDepTitle: depTask ? depTask.title : depId,
            path: indirectPath
          });
        }
      });
    });
    
    return redundant;
  },
  
  findIndirectPath(tasks, fromId, toId, exclude = []) {
    const visited = new Set(exclude);
    const queue = [{ id: fromId, path: [fromId] }];
    
    while (queue.length > 0) {
      const { id: currentId, path } = queue.shift();
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const currentTask = tasks.find(t => t.id === currentId);
      if (!currentTask || !currentTask.dependencies) continue;
      
      for (const depId of currentTask.dependencies) {
        if (exclude.includes(depId)) continue;
        
        const newPath = [...path, depId];
        
        if (depId === toId && newPath.length > 2) {
          return newPath; // Found indirect path
        }
        
        if (!visited.has(depId)) {
          queue.push({ id: depId, path: newPath });
        }
      }
    }
    
    return [];
  },
  
  analyzeCriticalPath(tasks) {
    const issues = [];
    
    // Find potential critical path issues
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const highEffortTasks = tasks.filter(t => t.effort && t.effort >= 4);
    
    // Check for bottlenecks (tasks with many dependents)
    tasks.forEach(task => {
      const dependentCount = tasks.filter(t => 
        t.dependencies && t.dependencies.includes(task.id)
      ).length;
      
      if (dependentCount >= 3) {
        issues.push({
          severity: 'warning',
          title: 'Potential Bottleneck',
          description: `Task "${task.title}" has ${dependentCount} dependent tasks, creating a potential bottleneck`,
          affectedTasks: [task.id],
          suggestion: 'Consider parallelizing some dependent tasks or breaking down this task'
        });
      }
    });
    
    // Check for long dependency chains
    tasks.forEach(task => {
      const chainLength = this.calculateDependencyChainLength(tasks, task.id);
      if (chainLength >= 5) {
        issues.push({
          severity: 'info',
          title: 'Long Dependency Chain',
          description: `Task "${task.title}" has a dependency chain of ${chainLength} tasks`,
          affectedTasks: [task.id],
          suggestion: 'Review if some dependencies can be parallelized'
        });
      }
    });
    
    return issues;
  },
  
  calculateDependencyChainLength(tasks, taskId, visited = new Set()) {
    if (visited.has(taskId)) return 0;
    
    visited.add(taskId);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || !task.dependencies || task.dependencies.length === 0) {
      return 1;
    }
    
    let maxChainLength = 0;
    for (const depId of task.dependencies) {
      const chainLength = this.calculateDependencyChainLength(tasks, depId, new Set(visited));
      maxChainLength = Math.max(maxChainLength, chainLength);
    }
    
    return maxChainLength + 1;
  },
  
  filterIssuesBySeverity(issues, severity) {
    const severityLevels = { critical: 3, warning: 2, info: 1, all: 0 };
    const minLevel = severityLevels[severity] || 2;
    
    return issues.filter(issue => {
      const issueLevel = severityLevels[issue.severity] || 1;
      return issueLevel >= minLevel;
    });
  },
  
  async autoFixIssues(tasks, issues) {
    const fixResults = [];
    
    for (const issue of issues) {
      if (!issue.autoFixable) {
        fixResults.push({
          issueType: issue.type,
          applied: false,
          reason: 'Issue is not auto-fixable'
        });
        continue;
      }
      
      try {
        let fixed = false;
        
        switch (issue.autoFixAction) {
          case 'remove-dependency':
            fixed = await this.fixRemoveDependency(tasks, issue);
            break;
          case 'adjust-priority':
            fixed = await this.fixAdjustPriority(tasks, issue);
            break;
          case 'remove-redundant-dependency':
            fixed = await this.fixRemoveRedundantDependency(tasks, issue);
            break;
        }
        
        fixResults.push({
          issueType: issue.type,
          applied: fixed,
          reason: fixed ? 'Auto-fix applied successfully' : 'Auto-fix failed'
        });
        
      } catch (error) {
        fixResults.push({
          issueType: issue.type,
          applied: false,
          reason: `Auto-fix error: ${error.message}`
        });
      }
    }
    
    return fixResults;
  },
  
  async fixRemoveDependency(tasks, issue) {
    // Remove missing dependency
    if (issue.type === 'missing-dependency') {
      const task = tasks.find(t => t.id === issue.affectedTasks[0]);
      if (task && task.dependencies) {
        task.dependencies = task.dependencies.filter(dep => dep !== issue.missingTaskId);
        return true;
      }
    }
    return false;
  },
  
  async fixAdjustPriority(tasks, issue) {
    // Adjust priority inconsistency
    if (issue.type === 'priority-inconsistency' && issue.affectedTasks.length === 2) {
      const depTask = tasks.find(t => t.id === issue.affectedTasks[1]);
      if (depTask && depTask.priority === 'low') {
        depTask.priority = 'medium'; // Increase dependency priority
        return true;
      }
    }
    return false;
  },
  
  async fixRemoveRedundantDependency(tasks, issue) {
    // Remove redundant dependency
    if (issue.type === 'redundant-dependency') {
      const task = tasks.find(t => t.id === issue.affectedTasks[0]);
      if (task && task.dependencies) {
        task.dependencies = task.dependencies.filter(dep => dep !== issue.redundantDep);
        return true;
      }
    }
    return false;
  },
  
  calculateDependencyMetrics(tasks) {
    const metrics = {
      totalTasks: tasks.length,
      tasksWithDependencies: 0,
      totalDependencies: 0,
      averageDependenciesPerTask: 0,
      maxDependencies: 0,
      tasksWithNoDependencies: 0,
      tasksWithNoDependents: 0,
      longestDependencyChain: 0,
      dependencyDistribution: {}
    };
    
    let dependencyCounts = [];
    
    tasks.forEach(task => {
      const depCount = task.dependencies ? task.dependencies.length : 0;
      dependencyCounts.push(depCount);
      
      if (depCount > 0) {
        metrics.tasksWithDependencies++;
        metrics.totalDependencies += depCount;
        metrics.maxDependencies = Math.max(metrics.maxDependencies, depCount);
      } else {
        metrics.tasksWithNoDependencies++;
      }
      
      // Check if task has no dependents
      const hasDependents = tasks.some(t => 
        t.dependencies && t.dependencies.includes(task.id)
      );
      if (!hasDependents) {
        metrics.tasksWithNoDependents++;
      }
      
      // Calculate longest chain
      const chainLength = this.calculateDependencyChainLength(tasks, task.id);
      metrics.longestDependencyChain = Math.max(metrics.longestDependencyChain, chainLength);
    });
    
    metrics.averageDependenciesPerTask = metrics.totalTasks > 0 ? 
      (metrics.totalDependencies / metrics.totalTasks).toFixed(2) : 0;
    
    // Dependency distribution
    dependencyCounts.forEach(count => {
      metrics.dependencyDistribution[count] = (metrics.dependencyDistribution[count] || 0) + 1;
    });
    
    return metrics;
  },
  
  buildValidationSummary(validationResults, fixResults, metrics) {
    const { issues, summary } = validationResults;
    
    let summaryText = `# Dependency Validation Summary\\n\\n`;
    
    if (issues.length === 0) {
      summaryText += `✅ **Validation Passed** - No dependency issues found\\n\\n`;
    } else {
      summaryText += `🔍 **Validation Results** - ${issues.length} issues found\\n\\n`;
      
      const criticalCount = issues.filter(i => i.severity === 'critical').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;
      const infoCount = issues.filter(i => i.severity === 'info').length;
      
      if (criticalCount > 0) summaryText += `🚨 **Critical:** ${criticalCount} issues\\n`;
      if (warningCount > 0) summaryText += `⚠️ **Warning:** ${warningCount} issues\\n`;
      if (infoCount > 0) summaryText += `ℹ️ **Info:** ${infoCount} issues\\n`;
    }
    
    if (fixResults && fixResults.length > 0) {
      const fixedCount = fixResults.filter(f => f.applied).length;
      summaryText += `\\n🔧 **Auto-fixes Applied:** ${fixedCount}/${fixResults.length}\\n`;
    }
    
    if (metrics && Object.keys(metrics).length > 0) {
      summaryText += `\\n## Dependency Metrics\\n`;
      summaryText += `- **Total Tasks:** ${metrics.totalTasks}\\n`;
      summaryText += `- **Tasks with Dependencies:** ${metrics.tasksWithDependencies}\\n`;
      summaryText += `- **Total Dependencies:** ${metrics.totalDependencies}\\n`;
      summaryText += `- **Average Dependencies per Task:** ${metrics.averageDependenciesPerTask}\\n`;
      summaryText += `- **Longest Dependency Chain:** ${metrics.longestDependencyChain}\\n`;
    }
    
    summaryText += `\\n**Validated:** ${new Date().toLocaleString()}`;
    
    return summaryText;
  },
  
  generateValidationReport(validationResults, metrics, fixResults) {
    let report = `# Dependency Validation Report\\n\\n`;
    
    report += `**Validation Type:** ${validationResults.validationType}\\n`;
    report += `**Generated:** ${new Date(validationResults.validatedAt).toLocaleString()}\\n`;
    report += `**Total Issues:** ${validationResults.issues.length}\\n\\n`;
    
    // Issues by type
    const issuesByType = {};
    validationResults.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    Object.entries(issuesByType).forEach(([type, issues]) => {
      report += `## ${type.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())} Issues\\n\\n`;
      
      issues.forEach((issue, index) => {
        const severityIcon = {
          critical: '🚨',
          warning: '⚠️',
          info: 'ℹ️'
        }[issue.severity] || '•';
        
        report += `### ${severityIcon} ${issue.title}\\n`;
        report += `**Description:** ${issue.description}\\n`;
        report += `**Severity:** ${issue.severity}\\n`;
        report += `**Affected Tasks:** ${issue.affectedTasks.join(', ')}\\n`;
        report += `**Suggestion:** ${issue.suggestion}\\n`;
        
        if (issue.autoFixable) {
          report += `**Auto-fixable:** Yes\\n`;
        }
        
        report += '\\n';
      });
    });
    
    if (metrics && Object.keys(metrics).length > 0) {
      report += `## Dependency Metrics\\n\\n`;
      Object.entries(metrics).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (typeof value === 'object') {
          report += `**${formattedKey}:**\\n`;
          Object.entries(value).forEach(([k, v]) => {
            report += `  - ${k}: ${v}\\n`;
          });
        } else {
          report += `**${formattedKey}:** ${value}\\n`;
        }
      });
      report += '\\n';
    }
    
    if (fixResults && fixResults.length > 0) {
      report += `## Auto-fix Results\\n\\n`;
      fixResults.forEach(fix => {
        const status = fix.applied ? '✅' : '❌';
        report += `${status} **${fix.issueType}** - ${fix.reason}\\n`;
      });
      report += '\\n';
    }
    
    report += `---\\n*Generated by SA Dependency Validation System*\\n`;
    
    return report;
  }
};