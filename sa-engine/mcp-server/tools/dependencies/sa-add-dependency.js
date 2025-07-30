/**
 * SA Add Dependency Tool
 * Add task dependencies with cycle detection and validation
 */

export const saAddDependency = {
  name: 'sa_add_dependency',
  description: 'Add dependencies between tasks with cycle detection and dependency type specification',
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
        description: 'ID of the task that depends on another task'
      },
      dependsOn: {
        type: 'string',
        description: 'ID of the task that this task depends on'
      },
      dependencyType: {
        type: 'string',
        enum: ['blocking', 'related', 'optional', 'finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
        description: 'Type of dependency relationship',
        default: 'blocking'
      },
      tasksFile: {
        type: 'string',
        description: 'Path to tasks file (optional, will use project tasks.json)'
      },
      reason: {
        type: 'string',
        description: 'Reason for the dependency (optional but recommended)'
      },
      force: {
        type: 'boolean',
        description: 'Force dependency creation even if warnings exist',
        default: false
      },
      validateCycles: {
        type: 'boolean',
        description: 'Perform cycle detection before adding dependency',
        default: true
      }
    },
    required: ['projectRoot', 'taskId', 'dependsOn']
  },
  
  async execute({ projectRoot, taskId, dependsOn, dependencyType = 'blocking', tasksFile, reason, force = false, validateCycles = true }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Validate inputs
      if (taskId === dependsOn) {
        throw new Error('A task cannot depend on itself');
      }
      
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
      
      // Check if dependency already exists
      if (task.dependencies && task.dependencies.includes(dependsOn)) {
        return {
          content: [{
            type: 'text',
            text: `Dependency already exists: Task "${task.title}" already depends on "${dependencyTask.title}"`
          }],
          metadata: {
            taskId,
            dependsOn,
            alreadyExists: true,
            dependencyType
          }
        };
      }
      
      // Perform cycle detection if enabled
      if (validateCycles) {
        const cycleCheck = await this.detectCycle(tasksData.tasks, taskId, dependsOn);
        if (cycleCheck.hasCycle) {
          if (!force) {
            return {
              content: [{
                type: 'text',
                text: `Cannot add dependency: Would create a circular dependency\\n\\nCycle path: ${cycleCheck.cyclePath.join(' → ')}\\n\\nUse force=true to override this check (not recommended)`
              }],
              metadata: {
                error: true,
                errorType: 'circular_dependency',
                cyclePath: cycleCheck.cyclePath,
                taskId,
                dependsOn
              }
            };
          } else {
            console.warn(`Warning: Adding dependency despite circular dependency risk: ${cycleCheck.cyclePath.join(' → ')}`);
          }
        }
      }
      
      // Validate dependency type constraints
      const validation = await this.validateDependencyType(task, dependencyTask, dependencyType, tasksData.tasks);
      if (!validation.isValid && !force) {
        return {
          content: [{
            type: 'text',
            text: `Cannot add dependency: ${validation.reason}\\n\\nUse force=true to override this check`
          }],
          metadata: {
            error: true,
            errorType: 'dependency_validation_failed',
            reason: validation.reason,
            taskId,
            dependsOn,
            dependencyType
          }
        };
      }
      
      // Add the dependency
      if (!task.dependencies) {
        task.dependencies = [];
      }
      
      // Store dependency with metadata
      const dependencyInfo = {
        taskId: dependsOn,
        type: dependencyType,
        addedAt: new Date().toISOString(),
        reason: reason || `${dependencyType} dependency`,
        addedBy: 'sa_add_dependency'
      };
      
      // Check if we're storing simple or detailed dependencies
      const useDetailedDependencies = tasksData.metadata?.useDetailedDependencies !== false;
      
      if (useDetailedDependencies) {
        // Add detailed dependency information
        if (!task.detailed_dependencies) {
          task.detailed_dependencies = [];
        }
        task.detailed_dependencies.push(dependencyInfo);
        
        // Also maintain simple dependencies array for compatibility
        task.dependencies.push(dependsOn);
      } else {
        // Simple dependency storage
        task.dependencies.push(dependsOn);
      }
      
      // Update task metadata
      task.updated_at = new Date().toISOString();
      
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
      
      tasksData.metadata.dependencies.totalDependencies++;
      tasksData.metadata.dependencies.lastUpdated = new Date().toISOString();
      
      // Log dependency addition
      await this.logDependencyChange(projectRoot, {
        action: 'add',
        taskId,
        dependsOn,
        dependencyType,
        reason,
        timestamp: new Date().toISOString()
      });
      
      // Save updated tasks
      await fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Generate impact analysis
      const impactAnalysis = await this.analyzeImpact(tasksData.tasks, taskId, dependsOn, 'add');
      
      return {
        content: [{
          type: 'text',
          text: `Successfully added ${dependencyType} dependency:\\n\\n**Task:** ${task.title} (${taskId})\\n**Depends On:** ${dependencyTask.title} (${dependsOn})\\n**Type:** ${dependencyType}\\n${reason ? `**Reason:** ${reason}\\n` : ''}\\n${impactAnalysis}`
        }],
        metadata: {
          taskId,
          taskTitle: task.title,
          dependsOn,
          dependsOnTitle: dependencyTask.title,
          dependencyType,
          reason,
          totalDependencies: task.dependencies.length,
          addedAt: new Date().toISOString(),
          impactAnalysis: {
            affectedTasks: impactAnalysis.match(/\\d+/) ? parseInt(impactAnalysis.match(/\\d+/)[0]) : 0
          }
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error adding dependency: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'dependency_add_error'
        }
      };
    }
  },
  
  async detectCycle(tasks, fromTaskId, toTaskId) {
    // Build adjacency list from current dependencies
    const graph = new Map();
    
    tasks.forEach(task => {
      graph.set(task.id, task.dependencies || []);
    });
    
    // Add the proposed new dependency temporarily
    const existingDeps = graph.get(fromTaskId) || [];
    graph.set(fromTaskId, [...existingDeps, toTaskId]);
    
    // Perform DFS to detect cycles
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];
    
    const dfs = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle, extract the cycle path
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = [...path.slice(cycleStart), nodeId];
        return { hasCycle: true, cyclePath };
      }
      
      if (visited.has(nodeId)) {
        return { hasCycle: false };
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const result = dfs(neighbor);
        if (result.hasCycle) {
          return result;
        }
      }
      
      recursionStack.delete(nodeId);
      path.pop();
      
      return { hasCycle: false };
    };
    
    // Check for cycles starting from any unvisited node
    for (const taskId of graph.keys()) {
      if (!visited.has(taskId)) {
        const result = dfs(taskId);
        if (result.hasCycle) {
          return result;
        }
      }
    }
    
    return { hasCycle: false };
  },
  
  async validateDependencyType(task, dependencyTask, dependencyType, allTasks) {
    const validation = { isValid: true, reason: '' };
    
    switch (dependencyType) {
      case 'blocking':
        // Blocking dependencies should not create logical conflicts
        if (task.priority === 'high' && dependencyTask.priority === 'low') {
          validation.isValid = false;
          validation.reason = 'High priority task should not be blocked by low priority task';
        }
        break;
        
      case 'finish-to-start':
        // Most common type, dependency task must finish before this task starts
        if (dependencyTask.status === 'pending' && task.status === 'completed') {
          validation.isValid = false;
          validation.reason = 'Cannot create finish-to-start dependency: dependent task is completed while dependency is pending';
        }
        break;
        
      case 'start-to-start':
        // Both tasks can start at the same time, but dependency must start first
        if (task.status !== 'pending' && dependencyTask.status === 'pending') {
          validation.isValid = false;
          validation.reason = 'Cannot create start-to-start dependency: task has started but dependency has not';
        }
        break;
        
      case 'finish-to-finish':
        // Dependency task must finish before this task can finish
        if (task.status === 'completed' && dependencyTask.status !== 'completed') {
          validation.isValid = false;
          validation.reason = 'Cannot create finish-to-finish dependency: task is completed but dependency is not';
        }
        break;
        
      case 'start-to-finish':
        // This task cannot finish until dependency task starts (rare)
        if (task.status === 'completed' && dependencyTask.status === 'pending') {
          validation.isValid = false;
          validation.reason = 'Cannot create start-to-finish dependency: task is completed but dependency has not started';
        }
        break;
        
      case 'related':
        // Related dependencies are informational, no strict validation needed
        break;
        
      case 'optional':
        // Optional dependencies don't block progress, no strict validation needed
        break;
        
      default:
        validation.isValid = false;
        validation.reason = `Unknown dependency type: ${dependencyType}`;
    }
    
    return validation;
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
  },
  
  async analyzeImpact(tasks, taskId, dependsOn, action) {
    // Simple impact analysis
    const task = tasks.find(t => t.id === taskId);
    const dependencyTask = tasks.find(t => t.id === dependsOn);
    
    if (!task || !dependencyTask) {
      return 'Impact analysis unavailable';
    }
    
    // Count tasks that might be affected
    let affectedCount = 0;
    
    // Tasks that depend on the current task
    const dependentTasks = tasks.filter(t => 
      t.dependencies && t.dependencies.includes(taskId)
    );
    affectedCount += dependentTasks.length;
    
    // Tasks in the dependency chain
    const chainTasks = this.findDependencyChain(tasks, dependsOn);
    affectedCount += chainTasks.length;
    
    let impact = `\\n**Impact Analysis:**\\n`;
    impact += `- Tasks potentially affected: ${affectedCount}\\n`;
    
    if (dependentTasks.length > 0) {
      impact += `- Tasks dependent on "${task.title}": ${dependentTasks.length}\\n`;
    }
    
    if (chainTasks.length > 0) {
      impact += `- Tasks in dependency chain: ${chainTasks.length}\\n`;
    }
    
    // Critical path analysis
    const isOnCriticalPath = this.isOnCriticalPath(tasks, taskId) || this.isOnCriticalPath(tasks, dependsOn);
    if (isOnCriticalPath) {
      impact += `- ⚠️ This dependency affects the critical path\\n`;
    }
    
    return impact;
  },
  
  findDependencyChain(tasks, taskId, visited = new Set()) {
    if (visited.has(taskId)) {
      return [];
    }
    
    visited.add(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies) {
      return [];
    }
    
    let chain = [];
    for (const depId of task.dependencies) {
      chain.push(depId);
      chain = chain.concat(this.findDependencyChain(tasks, depId, visited));
    }
    
    return [...new Set(chain)]; // Remove duplicates
  },
  
  isOnCriticalPath(tasks, taskId) {
    // Simple heuristic: task is on critical path if it has high priority and dependencies
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    
    const hasHighPriority = task.priority === 'high';
    const hasDependencies = task.dependencies && task.dependencies.length > 0;
    const hasDependents = tasks.some(t => t.dependencies && t.dependencies.includes(taskId));
    
    return hasHighPriority && (hasDependencies || hasDependents);
  }
};