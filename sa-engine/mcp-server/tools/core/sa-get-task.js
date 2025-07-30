import { join } from 'path';
import { existsSync } from 'fs';
import TaskManager from '../../../tasks/TaskManager.js';
import TaskDependencyManager from '../../../tasks/TaskDependencyManager.js';

/**
 * sa_get_task MCP Tool
 * Retrieves detailed information about a specific task including dependencies and history
 */
export const saGetTask = {
  name: 'sa_get_task',
  description: 'Get detailed information about a specific task including dependencies, history, and related files',
  category: 'tasks',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task to retrieve',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      includeHistory: {
        type: 'boolean',
        description: 'Include task change history',
        default: true
      },
      includeDependencies: {
        type: 'boolean',
        description: 'Include task dependencies and dependents',
        default: true
      },
      includeFiles: {
        type: 'boolean',
        description: 'Include associated files and resources',
        default: true
      },
      includeRelated: {
        type: 'boolean',
        description: 'Include related tasks (same assignee, similar tags)',
        default: false
      },
      format: {
        type: 'string',
        description: 'Output format',
        enum: ['detailed', 'json', 'summary'],
        default: 'detailed'
      }
    },
    required: ['taskId']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.taskId || typeof args.taskId !== 'string') {
      errors.push('taskId is required and must be a string');
    }
    
    if (args.taskId && args.taskId.trim().length === 0) {
      errors.push('taskId cannot be empty');
    }
    
    if (args.projectPath && typeof args.projectPath !== 'string') {
      errors.push('projectPath must be a string');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute the task retrieval
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const taskId = args.taskId.trim();
    
    try {
      // Find Super Agents config
      const saConfigPath = join(projectPath, '.super-agents', 'config.json');
      const tasksPath = join(projectPath, '.super-agents', 'tasks.json');
      
      if (!existsSync(saConfigPath) || !existsSync(tasksPath)) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No Super Agents project found at ${projectPath}\n\n` +
                    `To initialize a Super Agents project, run:\n` +
                    `sa_initialize_project with projectName="${projectPath.split('/').pop()}"`
            }
          ],
          isError: true,
          metadata: {
            error: 'Project not found',
            projectPath
          }
        };
      }

      // Initialize TaskManager
      const taskManager = new TaskManager({
        dataPath: tasksPath
      });
      
      await taskManager.initialize();
      
      // Get the task
      const task = await taskManager.getTask(taskId);
      
      if (!task) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Task not found: ${taskId}\n\n` +
                    `Use sa_list_tasks to see available tasks.`
            }
          ],
          isError: true,
          metadata: {
            error: 'Task not found',
            taskId,
            projectPath
          }
        };
      }

      // Gather additional information
      const taskInfo = {
        task,
        history: [],
        dependencies: { dependsOn: [], dependents: [] },
        relatedTasks: [],
        associatedFiles: []
      };

      // Get task history if requested
      if (args.includeHistory) {
        taskInfo.history = await this.getTaskHistory(taskManager, taskId);
      }

      // Get dependencies if requested
      if (args.includeDependencies) {
        taskInfo.dependencies = await this.getTaskDependencies(tasksPath, taskId);
      }

      // Get related tasks if requested
      if (args.includeRelated) {
        taskInfo.relatedTasks = await this.getRelatedTasks(taskManager, task);
      }

      // Get associated files if requested
      if (args.includeFiles) {
        taskInfo.associatedFiles = await this.getAssociatedFiles(projectPath, task);
      }

      // Format output
      const output = await this.formatOutput(taskInfo, args.format || 'detailed');
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          taskId,
          projectPath,
          taskFound: true,
          includeHistory: args.includeHistory,
          includeDependencies: args.includeDependencies,
          includeRelated: args.includeRelated,
          includeFiles: args.includeFiles,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get task ${taskId}: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          taskId,
          projectPath
        }
      };
    }
  },

  /**
   * Get task change history
   * @param {TaskManager} taskManager - Task manager instance
   * @param {string} taskId - Task ID
   * @returns {Promise<Array>} Task history
   */
  async getTaskHistory(taskManager, taskId) {
    try {
      // Get history from task manager (if it tracks history)
      const history = await taskManager.getTaskHistory(taskId);
      return history || [];
    } catch (error) {
      // History may not be available in all implementations
      return [];
    }
  },

  /**
   * Get task dependencies and dependents
   * @param {string} tasksPath - Path to tasks file
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Dependencies object
   */
  async getTaskDependencies(tasksPath, taskId) {
    try {
      const dependencyManager = new TaskDependencyManager({
        dataPath: tasksPath
      });
      
      await dependencyManager.initialize();
      
      const dependsOn = await dependencyManager.getDependencies(taskId);
      const dependents = await dependencyManager.getDependents(taskId);
      
      return {
        dependsOn: dependsOn || [],
        dependents: dependents || []
      };
      
    } catch (error) {
      return {
        dependsOn: [],
        dependents: []
      };
    }
  },

  /**
   * Get tasks related to the current task
   * @param {TaskManager} taskManager - Task manager instance
   * @param {Object} task - Current task
   * @returns {Promise<Array>} Related tasks
   */
  async getRelatedTasks(taskManager, task) {
    try {
      const allTasks = await taskManager.listTasks();
      const relatedTasks = [];
      
      // Find tasks with same assignee
      if (task.assignee) {
        const sameAssignee = allTasks.filter(t => 
          t.id !== task.id && 
          t.assignee === task.assignee &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
        );
        relatedTasks.push(...sameAssignee.slice(0, 3)); // Limit to 3
      }
      
      // Find tasks with similar tags
      if (task.tags && task.tags.length > 0) {
        const similarTags = allTasks.filter(t => {
          if (t.id === task.id || !t.tags || t.tags.length === 0) return false;
          
          const commonTags = t.tags.filter(tag => task.tags.includes(tag));
          return commonTags.length > 0;
        });
        
        // Add up to 3 tasks with similar tags that aren't already included
        similarTags.slice(0, 3).forEach(relatedTask => {
          if (!relatedTasks.find(rt => rt.id === relatedTask.id)) {
            relatedTasks.push(relatedTask);
          }
        });
      }
      
      return relatedTasks.slice(0, 5); // Limit total to 5
      
    } catch (error) {
      return [];
    }
  },

  /**
   * Get files associated with the task
   * @param {string} projectPath - Project path
   * @param {Object} task - Task object
   * @returns {Promise<Array>} Associated files
   */
  async getAssociatedFiles(projectPath, task) {
    try {
      const associatedFiles = [];
      
      // Check if task has explicit file references
      if (task.files && Array.isArray(task.files)) {
        task.files.forEach(file => {
          const filePath = join(projectPath, file);
          if (existsSync(filePath)) {
            associatedFiles.push({
              path: file,
              exists: true,
              type: 'explicit'
            });
          } else {
            associatedFiles.push({
              path: file,
              exists: false,
              type: 'explicit'
            });
          }
        });
      }
      
      // Look for files that might be related by naming convention
      // This is a simple heuristic - in practice you might want more sophisticated matching
      if (task.title) {
        const titleSlug = task.title.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        const potentialFiles = [
          `src/${titleSlug}.js`,
          `src/${titleSlug}.ts`,
          `docs/${titleSlug}.md`,
          `tests/${titleSlug}.test.js`,
          `tests/${titleSlug}.test.ts`
        ];
        
        potentialFiles.forEach(file => {
          const filePath = join(projectPath, file);
          if (existsSync(filePath)) {
            associatedFiles.push({
              path: file,
              exists: true,
              type: 'inferred'
            });
          }
        });
      }
      
      return associatedFiles;
      
    } catch (error) {
      return [];
    }
  },

  /**
   * Format output based on specified format
   * @param {Object} taskInfo - Complete task information
   * @param {string} format - Output format
   * @returns {Promise<string>} Formatted output
   */
  async formatOutput(taskInfo, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(taskInfo, null, 2);
        
      case 'summary':
        return this.formatSummary(taskInfo);
        
      default:
        return this.formatDetailed(taskInfo);
    }
  },

  /**
   * Format task as summary
   * @param {Object} taskInfo - Task information
   * @returns {string} Summary formatted output
   */
  formatSummary(taskInfo) {
    const { task } = taskInfo;
    const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown';
    const updatedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Never';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    
    return `📋 **${task.title}** (${task.id})\n\n` +
           `${this.formatStatus(task.status)} | ${this.formatPriority(task.priority)} | ${task.type || 'task'}\n` +
           `👤 ${task.assignee || 'Unassigned'} | 📅 Due: ${dueDate}\n` +
           `📝 ${task.description || 'No description'}\n\n` +
           `📊 **Quick Stats:**\n` +
           `  • Created: ${createdAt}\n` +
           `  • Updated: ${updatedAt}\n` +
           `  • Dependencies: ${taskInfo.dependencies.dependsOn.length} required, ${taskInfo.dependencies.dependents.length} dependent\n` +
           `  • Related tasks: ${taskInfo.relatedTasks.length}\n` +
           `  • Associated files: ${taskInfo.associatedFiles.length}`;
  },

  /**
   * Format task with detailed information
   * @param {Object} taskInfo - Task information
   * @returns {string} Detailed formatted output
   */
  formatDetailed(taskInfo) {
    const { task, history, dependencies, relatedTasks, associatedFiles } = taskInfo;
    
    let output = `📋 **${task.title}**\n`;
    output += `🆔 **ID:** ${task.id}\n`;
    output += `📊 **Status:** ${this.formatStatus(task.status)}\n`;
    output += `🔥 **Priority:** ${this.formatPriority(task.priority)}\n`;
    output += `📝 **Type:** ${task.type || 'task'}\n`;
    output += `👤 **Assignee:** ${task.assignee || 'Unassigned'}\n\n`;
    
    // Dates
    const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown';
    const updatedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'Never';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    
    output += `📅 **Timeline:**\n`;
    output += `  • Created: ${createdAt}\n`;
    output += `  • Updated: ${updatedAt}\n`;
    output += `  • Due Date: ${dueDate}\n\n`;
    
    // Description
    output += `📄 **Description:**\n${task.description || 'No description provided'}\n\n`;
    
    // Tags
    if (task.tags && task.tags.length > 0) {
      output += `🏷️ **Tags:** ${task.tags.join(', ')}\n\n`;
    }
    
    // Metadata
    if (task.metadata && Object.keys(task.metadata).length > 0) {
      output += `ℹ️ **Metadata:**\n`;
      Object.entries(task.metadata).forEach(([key, value]) => {
        output += `  • ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
      });
      output += '\n';
    }
    
    // Dependencies
    if (dependencies.dependsOn.length > 0 || dependencies.dependents.length > 0) {
      output += `🔗 **Dependencies:**\n`;
      
      if (dependencies.dependsOn.length > 0) {
        output += `  📥 **Depends on:** ${dependencies.dependsOn.join(', ')}\n`;
      }
      
      if (dependencies.dependents.length > 0) {
        output += `  📤 **Required by:** ${dependencies.dependents.join(', ')}\n`;
      }
      
      output += '\n';
    }
    
    // Associated files
    if (associatedFiles.length > 0) {
      output += `📁 **Associated Files:**\n`;
      associatedFiles.forEach(file => {
        const status = file.exists ? '✅' : '❌';
        const type = file.type === 'explicit' ? '(explicit)' : '(inferred)';
        output += `  ${status} ${file.path} ${type}\n`;
      });
      output += '\n';
    }
    
    // History
    if (history.length > 0) {
      output += `📜 **Change History:**\n`;
      history.slice(0, 5).forEach(change => { // Show last 5 changes
        const changeDate = new Date(change.timestamp).toLocaleString();
        output += `  • ${changeDate}: ${change.description}\n`;
      });
      if (history.length > 5) {
        output += `  ... and ${history.length - 5} more changes\n`;
      }
      output += '\n';
    }
    
    // Related tasks
    if (relatedTasks.length > 0) {
      output += `🔄 **Related Tasks:**\n`;
      relatedTasks.forEach(relatedTask => {
        output += `  • ${relatedTask.id}: ${relatedTask.title} (${this.formatStatus(relatedTask.status)})\n`;
      });
      output += '\n';
    }
    
    // Next actions
    output += `🎯 **Next Actions:**\n`;
    if (task.status === 'pending') {
      output += `  • Start working on this task\n`;
      output += `  • Use sa_update_task_status to mark as in-progress\n`;
    } else if (task.status === 'in-progress') {
      output += `  • Continue working on this task\n`;
      output += `  • Update progress regularly\n`;
      output += `  • Mark as completed when done\n`;
    } else if (task.status === 'blocked') {
      output += `  • Identify and resolve blocking issues\n`;
      output += `  • Check dependency tasks\n`;
    } else if (task.status === 'completed') {
      output += `  • Task is complete\n`;
      output += `  • Review related or dependent tasks\n`;
    }
    
    return output;
  },

  /**
   * Format status with emoji
   * @param {string} status - Task status
   * @returns {string} Formatted status
   */
  formatStatus(status) {
    const statusEmojis = {
      pending: '⏳ Pending',
      'in-progress': '🔄 In Progress',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled',
      blocked: '🚫 Blocked'
    };
    
    return statusEmojis[status] || `❓ ${status}`;
  },

  /**
   * Format priority with emoji
   * @param {string} priority - Task priority
   * @returns {string} Formatted priority
   */
  formatPriority(priority) {
    const priorityEmojis = {
      critical: '🔴 Critical',
      high: '🟠 High',
      medium: '🟡 Medium',
      low: '🟢 Low'
    };
    
    return priorityEmojis[priority] || `⚪ ${priority || 'unspecified'}`;
  }
};