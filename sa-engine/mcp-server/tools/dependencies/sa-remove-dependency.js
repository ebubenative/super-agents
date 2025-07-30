/**
 * SA Remove Dependency Tool
 * Remove task dependencies with impact analysis and cascade handling
 */

export const saRemoveDependency = {
  name: 'sa_remove_dependency',
  description: 'Remove dependencies between tasks with impact analysis and safe cascade handling',
  category: 'dependencies',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      taskId: {
        type: 'string',
        description: 'ID of the task to remove dependency from'
      },
      dependsOn: {
        type: 'string',
        description: 'ID of the dependency task to remove'
      },
      tasksFile: {
        type: 'string',
        description: 'Path to tasks file (optional, will use project tasks.json)'
      },
      reason: {
        type: 'string',
        description: 'Reason for removing the dependency (optional but recommended)'
      },
      force: {
        type: 'boolean',
        description: 'Force removal even if warnings exist',
        default: false
      },
      cascadeRemoval: {
        type: 'boolean',
        description: 'Remove dependent relationships that become invalid',
        default: false
      },
      analyzeImpact: {
        type: 'boolean',
        description: 'Perform impact analysis before removal',
        default: true
      }
    },
    required: ['projectRoot', 'taskId', 'dependsOn']
  },
  
  async execute({ projectRoot, taskId, dependsOn, tasksFile, reason, force = false, cascadeRemoval = false, analyzeImpact = true }) {
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
      
      // Find the tasks
      const task = tasksData.tasks.find(t => t.id === taskId);
      const dependencyTask = tasksData.tasks.find(t => t.id === dependsOn);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      if (!dependencyTask) {
        throw new Error(`Dependency task not found: ${dependsOn}`);
      }
      
      // Check if dependency exists
      const hasDependency = task.dependencies && task.dependencies.includes(dependsOn);
      if (!hasDependency) {
        return {
          content: [{
            type: 'text',
            text: `Dependency does not exist: Task "${task.title}" does not depend on "${dependencyTask.title}"`
          }],
          metadata: {
            taskId,
            dependsOn,
            dependencyExists: false
          }
        };
      }
      
      // Perform impact analysis if requested
      let impactAnalysis = '';
      if (analyzeImpact) {
        const impact = await this.analyzeRemovalImpact(tasksData.tasks, taskId, dependsOn);
        impactAnalysis = impact.analysis;
        
        if (impact.hasWarnings && !force) {
          return {
            content: [{
              type: 'text',
              text: `Cannot remove dependency due to potential issues:\\n\\n${impact.analysis}\\n\\nUse force=true to proceed despite warnings`
            }],
            metadata: {
              error: true,
              errorType: 'removal_warnings',
              warnings: impact.warnings,
              taskId,
              dependsOn
            }
          };
        }
      }
      
      // Remove the dependency
      const originalDependencyCount = task.dependencies.length;
      task.dependencies = task.dependencies.filter(dep => dep !== dependsOn);
      
      // Remove detailed dependency information if it exists
      if (task.detailed_dependencies) {
        task.detailed_dependencies = task.detailed_dependencies.filter(dep => dep.taskId !== dependsOn);
      }
      
      // Update task metadata
      task.updated_at = new Date().toISOString();
      
      // Handle cascade removal if requested
      let cascadeResults = [];
      if (cascadeRemoval) {
        cascadeResults = await this.performCascadeRemoval(tasksData.tasks, taskId, dependsOn);
      }
      
      // Update project metadata
      if (!tasksData.metadata) {
        tasksData.metadata = {};
      }
      
      if (!tasksData.metadata.dependencies) {
        tasksData.metadata.dependencies = {
          totalDependencies: 0,
          lastUpdated: new Date().toISOString()
        };
      }
      
      tasksData.metadata.dependencies.totalDependencies--;
      tasksData.metadata.dependencies.lastUpdated = new Date().toISOString();
      
      // Log dependency removal
      await this.logDependencyChange(projectRoot, {
        action: 'remove',
        taskId,
        dependsOn,
        reason,
        cascadeRemoval,
        cascadeResults,
        timestamp: new Date().toISOString()
      });
      
      // Save updated tasks
      await fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Build response message
      let responseText = `Successfully removed dependency:\\n\\n`;
      responseText += `**Task:** ${task.title} (${taskId})\\n`;
      responseText += `**Removed Dependency:** ${dependencyTask.title} (${dependsOn})\\n`;
      responseText += `**Dependencies Remaining:** ${task.dependencies.length}\\n`;
      
      if (reason) {
        responseText += `**Reason:** ${reason}\\n`;
      }
      
      if (cascadeResults.length > 0) {
        responseText += `\\n**Cascade Removals:** ${cascadeResults.length} additional dependencies removed\\n`;
        cascadeResults.forEach(result => {
          responseText += `- ${result.fromTask} no longer depends on ${result.removedDep}\\n`;
        });
      }
      
      if (impactAnalysis) {
        responseText += `\\n${impactAnalysis}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        metadata: {
          taskId,
          taskTitle: task.title,
          dependsOn,
          dependsOnTitle: dependencyTask.title,
          reason,
          remainingDependencies: task.dependencies.length,
          originalDependencyCount,
          cascadeRemovals: cascadeResults.length,
          removedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error removing dependency: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'dependency_removal_error'
        }
      };
    }
  },
  
  async analyzeRemovalImpact(tasks, taskId, dependsOn) {
    const task = tasks.find(t => t.id === taskId);
    const dependencyTask = tasks.find(t => t.id === dependsOn);
    
    const analysis = {
      analysis: '',
      hasWarnings: false,
      warnings: []
    };
    
    let impactText = `**Impact Analysis:**\\n`;
    
    // Check if the dependent task is currently blocked by this dependency
    if (task.status === 'blocked' || task.status === 'pending') {
      const dependencyCompleted = dependencyTask.status === 'completed';
      if (!dependencyCompleted) {
        analysis.warnings.push('Task may become unblocked prematurely');
        impactText += `⚠️ Warning: Task "${task.title}" may become unblocked before "${dependencyTask.title}" is completed\\n`;
        analysis.hasWarnings = true;
      }
    }
    
    // Check for logical dependencies based on task content
    const logicalDependency = this.checkLogicalDependency(task, dependencyTask);
    if (logicalDependency.isLogical) {
      analysis.warnings.push('Logical dependency exists');
      impactText += `⚠️ Warning: ${logicalDependency.reason}\\n`;
      analysis.hasWarnings = true;
    }
    
    // Check if this creates orphaned tasks
    const orphanedTasks = this.findOrphanedTasks(tasks, taskId, dependsOn);
    if (orphanedTasks.length > 0) {
      impactText += `📋 Info: ${orphanedTasks.length} tasks may become orphaned\\n`;
    }
    
    // Check critical path impact
    const criticalPathImpact = this.analyzeCriticalPathImpact(tasks, taskId, dependsOn);
    if (criticalPathImpact.affectsCriticalPath) {
      analysis.warnings.push('Affects critical path');
      impactText += `🎯 Warning: Removal may affect the critical path\\n`;
      analysis.hasWarnings = true;
    }
    
    // Check for cascade effects
    const cascadeEffects = this.analyzeCascadeEffects(tasks, taskId, dependsOn);
    if (cascadeEffects.length > 0) {
      impactText += `🔗 Info: ${cascadeEffects.length} other dependencies may be affected\\n`;
    }
    
    // Resource and timeline impact
    const resourceImpact = this.analyzeResourceImpact(task, dependencyTask);
    if (resourceImpact.hasImpact) {
      impactText += `👥 Info: Resource allocation may need adjustment\\n`;
    }
    
    if (!analysis.hasWarnings) {
      impactText += `✅ Safe to remove - no significant warnings detected\\n`;
    }
    
    analysis.analysis = impactText;
    return analysis;
  },
  
  checkLogicalDependency(task, dependencyTask) {
    const taskTitle = task.title.toLowerCase();
    const depTitle = dependencyTask.title.toLowerCase();
    const taskDesc = (task.description || '').toLowerCase();
    const depDesc = (dependencyTask.description || '').toLowerCase();
    
    // Check for logical dependency keywords
    const dependencyKeywords = [
      'setup', 'configure', 'install', 'initialize',
      'design', 'architecture', 'plan',
      'database', 'api', 'service'
    ];
    
    const setupKeywords = ['setup', 'configure', 'install', 'initialize'];
    const designKeywords = ['design', 'architecture', 'plan'];
    
    // If dependency is setup/config and task is implementation
    if (setupKeywords.some(kw => depTitle.includes(kw)) && 
        (taskTitle.includes('implement') || taskTitle.includes('develop'))) {
      return {
        isLogical: true,
        reason: 'Setup/configuration tasks typically should complete before implementation'
      };
    }
    
    // If dependency is design and task is implementation
    if (designKeywords.some(kw => depTitle.includes(kw)) && 
        (taskTitle.includes('implement') || taskTitle.includes('build'))) {
      return {
        isLogical: true,
        reason: 'Design tasks should typically complete before implementation'
      };
    }
    
    // Check for shared resources or components
    const sharedComponents = this.findSharedComponents(taskDesc, depDesc);
    if (sharedComponents.length > 0) {
      return {
        isLogical: true,
        reason: `Tasks share common components: ${sharedComponents.join(', ')}`
      };
    }
    
    return { isLogical: false };
  },
  
  findSharedComponents(taskDesc, depDesc) {
    const components = ['database', 'api', 'service', 'interface', 'component', 'module', 'system'];
    const shared = [];
    
    components.forEach(comp => {
      if (taskDesc.includes(comp) && depDesc.includes(comp)) {
        shared.push(comp);
      }
    });
    
    return shared;
  },
  
  findOrphanedTasks(tasks, taskId, dependsOn) {
    // Find tasks that only depended on the removed dependency through this task
    const orphaned = [];
    
    tasks.forEach(t => {
      if (t.dependencies && t.dependencies.includes(taskId)) {
        // Check if this task has other paths to the dependency
        const hasAlternatePath = this.hasAlternatePath(tasks, t.id, dependsOn, [taskId]);
        if (!hasAlternatePath) {
          orphaned.push(t.id);
        }
      }
    });
    
    return orphaned;
  },
  
  hasAlternatePath(tasks, fromId, toId, exclude = []) {
    const visited = new Set(exclude);
    const queue = [fromId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      const currentTask = tasks.find(t => t.id === currentId);
      
      if (!currentTask || !currentTask.dependencies) continue;
      
      for (const depId of currentTask.dependencies) {
        if (depId === toId) return true;
        if (!visited.has(depId)) {
          queue.push(depId);
        }
      }
    }
    
    return false;
  },
  
  analyzeCriticalPathImpact(tasks, taskId, dependsOn) {
    const task = tasks.find(t => t.id === taskId);
    const dependencyTask = tasks.find(t => t.id === dependsOn);
    
    // Simple heuristic for critical path
    const isTaskCritical = task.priority === 'high' || 
                          (task.effort && task.effort >= 4) ||
                          tasks.filter(t => t.dependencies && t.dependencies.includes(taskId)).length > 2;
    
    const isDependencyCritical = dependencyTask.priority === 'high' ||
                                (dependencyTask.effort && dependencyTask.effort >= 4);
    
    return {
      affectsCriticalPath: isTaskCritical && isDependencyCritical,
      task: { id: taskId, isCritical: isTaskCritical },
      dependency: { id: dependsOn, isCritical: isDependencyCritical }
    };
  },
  
  analyzeCascadeEffects(tasks, taskId, dependsOn) {
    const effects = [];
    
    // Find tasks that depend on both the task and its dependency
    tasks.forEach(t => {
      if (t.dependencies && 
          t.dependencies.includes(taskId) && 
          t.dependencies.includes(dependsOn)) {
        effects.push({
          taskId: t.id,
          type: 'redundant_dependency',
          description: 'Task depends on both the task and its former dependency'
        });
      }
    });
    
    return effects;
  },
  
  analyzeResourceImpact(task, dependencyTask) {
    const taskSkills = task.skills || [];
    const depSkills = dependencyTask.skills || [];
    
    // Check for shared skills/resources
    const sharedSkills = taskSkills.filter(skill => depSkills.includes(skill));
    
    return {
      hasImpact: sharedSkills.length > 0,
      sharedSkills,
      reasoning: sharedSkills.length > 0 ? 
        'Tasks share common skills, removing dependency may affect resource scheduling' : 
        'No significant resource impact detected'
    };
  },
  
  async performCascadeRemoval(tasks, taskId, dependsOn) {
    const cascadeResults = [];
    
    // Find tasks that may need cascade removal
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.includes(dependsOn)) {
        // Check if this dependency is now redundant
        const hasDirectDependency = task.dependencies.includes(taskId);
        if (hasDirectDependency) {
          // Remove the indirect dependency since task already depends on taskId
          task.dependencies = task.dependencies.filter(dep => dep !== dependsOn);
          
          if (task.detailed_dependencies) {
            task.detailed_dependencies = task.detailed_dependencies.filter(dep => dep.taskId !== dependsOn);
          }
          
          cascadeResults.push({
            taskId: task.id,
            fromTask: task.title || task.id,
            removedDep: dependsOn,
            reason: 'Redundant dependency removed'
          });
        }
      }
    });
    
    return cascadeResults;
  },
  
  async logDependencyChange(projectRoot, changeInfo) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const logsDir = path.join(projectRoot, 'sa-engine', 'data', 'logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      const logFile = path.join(logsDir, 'dependencies.log');
      const logEntry = JSON.stringify(changeInfo) + '\\n';
      
      await fs.appendFile(logFile, logEntry);
    } catch (error) {
      console.warn('Failed to log dependency change:', error.message);
    }
  }
};