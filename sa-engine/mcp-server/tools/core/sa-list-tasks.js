import { join } from 'path';
import { existsSync } from 'fs';
import TaskManager from '../../../tasks/TaskManager.js';

/**
 * sa_list_tasks MCP Tool
 * Lists and filters tasks from the Super Agents task management system
 */
export const saListTasks = {
  name: 'sa_list_tasks',
  description: 'List and filter tasks from the Super Agents task management system',
  category: 'tasks',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      status: {
        type: 'string',
        description: 'Filter tasks by status',
        enum: ['pending', 'in-progress', 'completed', 'cancelled', 'blocked']
      },
      assignee: {
        type: 'string',
        description: 'Filter tasks by assignee'
      },
      priority: {
        type: 'string',
        description: 'Filter tasks by priority',
        enum: ['low', 'medium', 'high', 'critical']
      },
      type: {
        type: 'string',
        description: 'Filter tasks by type',
        enum: ['feature', 'bug', 'task', 'epic', 'story', 'setup', 'review', 'testing', 'devops', 'research', 'design', 'documentation']
      },
      tags: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Filter tasks by tags'
      },
      search: {
        type: 'string',
        description: 'Search tasks by title or description'
      },
      limit: {
        type: 'integer',
        description: 'Maximum number of tasks to return',
        minimum: 1,
        maximum: 100,
        default: 20
      },
      sortBy: {
        type: 'string',
        description: 'Sort tasks by field',
        enum: ['createdAt', 'updatedAt', 'priority', 'title', 'status', 'dueDate'],
        default: 'updatedAt'
      },
      sortOrder: {
        type: 'string',
        description: 'Sort order',
        enum: ['asc', 'desc'],
        default: 'desc'
      },
      includeCompleted: {
        type: 'boolean',
        description: 'Include completed tasks in results',
        default: true
      },
      includeArchived: {
        type: 'boolean',
        description: 'Include archived tasks in results',
        default: false
      },
      format: {
        type: 'string',
        description: 'Output format',
        enum: ['table', 'json', 'summary', 'detailed'],
        default: 'table'
      }
    },
    required: []
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (args.projectPath && typeof args.projectPath !== 'string') {
      errors.push('projectPath must be a string');
    }
    
    if (args.limit && (typeof args.limit !== 'number' || args.limit < 1 || args.limit > 100)) {
      errors.push('limit must be a number between 1 and 100');
    }
    
    if (args.tags && !Array.isArray(args.tags)) {
      errors.push('tags must be an array of strings');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute the task listing
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    
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
      
      // Apply filters
      const filters = this.buildFilters(args);
      const tasks = await taskManager.listTasks(filters);
      
      // Apply sorting
      const sortedTasks = this.sortTasks(tasks, args.sortBy || 'updatedAt', args.sortOrder || 'desc');
      
      // Apply limit
      const limitedTasks = sortedTasks.slice(0, args.limit || 20);
      
      // Generate output based on format
      const output = await this.formatOutput(limitedTasks, args.format || 'table', {
        totalCount: tasks.length,
        filteredCount: sortedTasks.length,
        displayedCount: limitedTasks.length,
        filters: args
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          projectPath,
          totalTasks: tasks.length,
          filteredTasks: sortedTasks.length,
          displayedTasks: limitedTasks.length,
          filters: args,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to list tasks: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          projectPath
        }
      };
    }
  },

  /**
   * Build filters object from arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Filters object
   */
  buildFilters(args) {
    const filters = {};
    
    if (args.status) {
      filters.status = args.status;
    }
    
    if (args.assignee) {
      filters.assignee = args.assignee;
    }
    
    if (args.priority) {
      filters.priority = args.priority;
    }
    
    if (args.type) {
      filters.type = args.type;
    }
    
    if (args.tags && args.tags.length > 0) {
      filters.tags = args.tags;
    }
    
    if (args.search) {
      filters.search = args.search;
    }
    
    if (!args.includeCompleted) {
      filters.excludeStatus = ['completed'];
    }
    
    if (!args.includeArchived) {
      filters.excludeArchived = true;
    }
    
    return filters;
  },

  /**
   * Sort tasks by specified field and order
   * @param {Array} tasks - Tasks to sort
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (asc/desc)
   * @returns {Array} Sorted tasks
   */
  sortTasks(tasks, sortBy, sortOrder) {
    const sortedTasks = [...tasks];
    
    sortedTasks.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle special cases
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
      } else if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'dueDate') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sortedTasks;
  },

  /**
   * Format output based on specified format
   * @param {Array} tasks - Tasks to format
   * @param {string} format - Output format
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Formatted output
   */
  async formatOutput(tasks, format, metadata) {
    switch (format) {
      case 'json':
        return JSON.stringify({
          tasks,
          metadata
        }, null, 2);
        
      case 'summary':
        return this.formatSummary(tasks, metadata);
        
      case 'detailed':
        return this.formatDetailed(tasks, metadata);
        
      default:
        return this.formatTable(tasks, metadata);
    }
  },

  /**
   * Format tasks as a table
   * @param {Array} tasks - Tasks to format
   * @param {Object} metadata - Additional metadata
   * @returns {string} Table formatted output
   */
  formatTable(tasks, metadata) {
    if (tasks.length === 0) {
      return `📋 No tasks found\n\n` +
             `Filters applied: ${JSON.stringify(metadata.filters, null, 2)}`;
    }
    
    const header = `📋 Tasks (${metadata.displayedCount}/${metadata.totalTasks})\n\n`;
    
    // Table headers
    const table = [
      '| ID | Title | Status | Priority | Type | Assignee | Updated |',
      '|----|-------|--------|----------|------|----------|---------|'
    ];
    
    // Table rows
    tasks.forEach(task => {
      const updatedAt = task.updatedAt ? 
        new Date(task.updatedAt).toLocaleDateString() : 
        'Never';
      
      table.push(
        `| ${task.id} | ${this.truncate(task.title, 25)} | ${this.formatStatus(task.status)} | ${this.formatPriority(task.priority)} | ${task.type || 'task'} | ${task.assignee || 'unassigned'} | ${updatedAt} |`
      );
    });
    
    // Summary footer
    const statusCounts = this.getStatusCounts(tasks);
    const footer = `\n📊 Status Summary:\n` +
                  Object.entries(statusCounts)
                    .map(([status, count]) => `  ${this.formatStatus(status)}: ${count}`)
                    .join('\n');
    
    return header + table.join('\n') + footer;
  },

  /**
   * Format tasks as a summary
   * @param {Array} tasks - Tasks to format
   * @param {Object} metadata - Additional metadata
   * @returns {string} Summary formatted output
   */
  formatSummary(tasks, metadata) {
    const statusCounts = this.getStatusCounts(tasks);
    const priorityCounts = this.getPriorityCounts(tasks);
    const typeCounts = this.getTypeCounts(tasks);
    
    return `📋 Task Summary (${metadata.totalTasks} total, ${metadata.displayedCount} shown)\n\n` +
           `📊 By Status:\n${this.formatCounts(statusCounts, this.formatStatus)}\n\n` +
           `🔥 By Priority:\n${this.formatCounts(priorityCounts, this.formatPriority)}\n\n` +
           `📝 By Type:\n${this.formatCounts(typeCounts)}\n\n` +
           `🔍 Filters Applied:\n${this.formatFilters(metadata.filters)}`;
  },

  /**
   * Format tasks with detailed information
   * @param {Array} tasks - Tasks to format
   * @param {Object} metadata - Additional metadata
   * @returns {string} Detailed formatted output
   */
  formatDetailed(tasks, metadata) {
    if (tasks.length === 0) {
      return `📋 No tasks found\n\nFilters: ${this.formatFilters(metadata.filters)}`;
    }
    
    const header = `📋 Detailed Tasks (${metadata.displayedCount}/${metadata.totalTasks})\n\n`;
    
    const taskDetails = tasks.map((task, index) => {
      const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown';
      const updatedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'Never';
      const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
      
      return `${index + 1}. **${task.title}** (${task.id})\n` +
             `   Status: ${this.formatStatus(task.status)} | Priority: ${this.formatPriority(task.priority)} | Type: ${task.type || 'task'}\n` +
             `   Assignee: ${task.assignee || 'Unassigned'} | Due: ${dueDate}\n` +
             `   Created: ${createdAt} | Updated: ${updatedAt}\n` +
             `   Description: ${task.description || 'No description'}\n` +
             (task.tags && task.tags.length > 0 ? `   Tags: ${task.tags.join(', ')}\n` : '') +
             (task.dependencies && task.dependencies.length > 0 ? `   Dependencies: ${task.dependencies.join(', ')}\n` : '') +
             '\n';
    }).join('');
    
    return header + taskDetails;
  },

  /**
   * Get status counts from tasks
   * @param {Array} tasks - Tasks to analyze
   * @returns {Object} Status count object
   */
  getStatusCounts(tasks) {
    return tasks.reduce((counts, task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      return counts;
    }, {});
  },

  /**
   * Get priority counts from tasks
   * @param {Array} tasks - Tasks to analyze
   * @returns {Object} Priority count object
   */
  getPriorityCounts(tasks) {
    return tasks.reduce((counts, task) => {
      const priority = task.priority || 'unspecified';
      counts[priority] = (counts[priority] || 0) + 1;
      return counts;
    }, {});
  },

  /**
   * Get type counts from tasks
   * @param {Array} tasks - Tasks to analyze
   * @returns {Object} Type count object
   */
  getTypeCounts(tasks) {
    return tasks.reduce((counts, task) => {
      const type = task.type || 'task';
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
  },

  /**
   * Format counts object as string
   * @param {Object} counts - Counts object
   * @param {Function} formatter - Optional formatter function
   * @returns {string} Formatted counts
   */
  formatCounts(counts, formatter = null) {
    return Object.entries(counts)
      .map(([key, count]) => `  ${formatter ? formatter(key) : key}: ${count}`)
      .join('\n');
  },

  /**
   * Format filters object as string
   * @param {Object} filters - Filters object
   * @returns {string} Formatted filters
   */
  formatFilters(filters) {
    if (Object.keys(filters).length === 0) {
      return '  None';
    }
    
    return Object.entries(filters)
      .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');
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
  },

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  truncate(text, length) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length - 3) + '...' : text;
  }
};