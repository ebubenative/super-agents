import { join } from 'path';
import { existsSync } from 'fs';
import TaskManager from '../../../tasks/TaskManager.js';

/**
 * sa_update_task_status MCP Tool
 * Updates the status of a task with validation and change logging
 */
export const saUpdateTaskStatus = {
  name: 'sa_update_task_status',
  description: 'Update the status of a task with validation, notifications, and change tracking',
  category: 'tasks',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'ID of the task to update',
        minLength: 1
      },
      status: {
        type: 'string',
        description: 'New status for the task',
        enum: ['pending', 'in-progress', 'completed', 'cancelled', 'blocked']
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      comment: {
        type: 'string',
        description: 'Optional comment explaining the status change'
      },
      assignee: {
        type: 'string',
        description: 'Update assignee along with status (optional)'
      },
      priority: {
        type: 'string',
        description: 'Update priority along with status (optional)',
        enum: ['low', 'medium', 'high', 'critical']
      },
      completionNotes: {
        type: 'string',
        description: 'Notes about task completion (when marking as completed)'
      },
      blockingReason: {
        type: 'string',
        description: 'Reason for blocking the task (when marking as blocked)'
      },
      estimatedHours: {
        type: 'number',
        description: 'Update estimated hours (optional)',
        minimum: 0
      },
      actualHours: {
        type: 'number',
        description: 'Actual hours spent (when completing task)',
        minimum: 0
      },
      notifyAssignee: {
        type: 'boolean',
        description: 'Send notification to assignee about status change',
        default: false
      },
      validateTransition: {
        type: 'boolean',
        description: 'Validate that status transition is allowed',
        default: true
      }
    },
    required: ['taskId', 'status']
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
    
    if (!args.status || typeof args.status !== 'string') {
      errors.push('status is required and must be a string');
    }
    
    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled', 'blocked'];
    if (args.status && !validStatuses.includes(args.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
    
    if (args.projectPath && typeof args.projectPath !== 'string') {
      errors.push('projectPath must be a string');
    }
    
    if (args.estimatedHours && (typeof args.estimatedHours !== 'number' || args.estimatedHours < 0)) {
      errors.push('estimatedHours must be a non-negative number');
    }
    
    if (args.actualHours && (typeof args.actualHours !== 'number' || args.actualHours < 0)) {
      errors.push('actualHours must be a non-negative number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute the task status update
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const taskId = args.taskId.trim();
    const newStatus = args.status;
    
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
      
      // Get the current task
      const currentTask = await taskManager.getTask(taskId);
      
      if (!currentTask) {
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

      // Validate status transition if requested
      if (args.validateTransition) {
        const transitionValidation = this.validateStatusTransition(currentTask.status, newStatus);
        if (!transitionValidation.isValid) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid status transition: ${this.formatStatus(currentTask.status)} → ${this.formatStatus(newStatus)}\n\n` +
                      `${transitionValidation.reason}\n\n` +
                      `Current status: ${this.formatStatus(currentTask.status)}\n` +
                      `Allowed transitions: ${transitionValidation.allowedTransitions.map(s => this.formatStatus(s)).join(', ')}`
              }
            ],
            isError: true,
            metadata: {
              error: 'Invalid status transition',
              currentStatus: currentTask.status,
              newStatus,
              allowedTransitions: transitionValidation.allowedTransitions
            }
          };
        }
      }

      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      // Add optional fields
      if (args.comment) {
        updateData.lastComment = args.comment;
      }
      
      if (args.assignee) {
        updateData.assignee = args.assignee;
      }
      
      if (args.priority) {
        updateData.priority = args.priority;
      }
      
      if (args.estimatedHours !== undefined) {
        updateData.estimatedHours = args.estimatedHours;
      }
      
      if (args.actualHours !== undefined) {
        updateData.actualHours = args.actualHours;
      }

      // Status-specific updates
      if (newStatus === 'completed') {
        updateData.completedAt = new Date().toISOString();
        if (args.completionNotes) {
          updateData.completionNotes = args.completionNotes;
        }
      } else if (newStatus === 'blocked') {
        updateData.blockedAt = new Date().toISOString();
        if (args.blockingReason) {
          updateData.blockingReason = args.blockingReason;
        }
      } else if (newStatus === 'in-progress') {
        updateData.startedAt = updateData.startedAt || new Date().toISOString();
      }

      // Add change history entry
      if (!updateData.changeHistory) {
        updateData.changeHistory = currentTask.changeHistory || [];
      }
      
      updateData.changeHistory.push({
        timestamp: new Date().toISOString(),
        field: 'status',
        oldValue: currentTask.status,
        newValue: newStatus,
        comment: args.comment || `Status changed from ${currentTask.status} to ${newStatus}`,
        changedBy: 'sa_update_task_status'
      });

      // Update the task
      const updatedTask = await taskManager.updateTask(taskId, updateData);
      
      // Generate status change summary
      const summary = this.generateUpdateSummary(currentTask, updatedTask, args);
      
      // Handle notifications (if implemented)
      if (args.notifyAssignee && updatedTask.assignee) {
        await this.sendNotification(updatedTask, args, summary);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: summary
          }
        ],
        metadata: {
          taskId,
          projectPath,
          oldStatus: currentTask.status,
          newStatus: updatedTask.status,
          updatedFields: Object.keys(updateData),
          duration,
          notificationSent: args.notifyAssignee && updatedTask.assignee
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to update task ${taskId}: ${error.message}`
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
   * Validate status transition
   * @param {string} currentStatus - Current task status
   * @param {string} newStatus - Proposed new status
   * @returns {Object} Validation result
   */
  validateStatusTransition(currentStatus, newStatus) {
    // Define allowed transitions
    const transitions = {
      pending: ['in-progress', 'cancelled', 'blocked'],
      'in-progress': ['completed', 'pending', 'blocked', 'cancelled'],
      completed: ['in-progress'], // Allow reopening completed tasks
      cancelled: ['pending'], // Allow reactivating cancelled tasks
      blocked: ['pending', 'in-progress', 'cancelled']
    };

    const allowedTransitions = transitions[currentStatus] || [];
    
    if (currentStatus === newStatus) {
      return {
        isValid: false,
        reason: 'Task is already in the requested status',
        allowedTransitions
      };
    }
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
        allowedTransitions
      };
    }

    return {
      isValid: true,
      allowedTransitions
    };
  },

  /**
   * Generate update summary message
   * @param {Object} currentTask - Task before update
   * @param {Object} updatedTask - Task after update
   * @param {Object} args - Update arguments
   * @returns {string} Summary message
   */
  generateUpdateSummary(currentTask, updatedTask, args) {
    let summary = `✅ **Task Updated Successfully**\n\n`;
    summary += `📋 **${updatedTask.title}** (${updatedTask.id})\n\n`;
    
    // Status change
    summary += `📊 **Status Change:**\n`;
    summary += `  ${this.formatStatus(currentTask.status)} → ${this.formatStatus(updatedTask.status)}\n\n`;
    
    // Other changes
    const changes = [];
    
    if (args.assignee && args.assignee !== currentTask.assignee) {
      changes.push(`👤 Assignee: ${currentTask.assignee || 'Unassigned'} → ${args.assignee}`);
    }
    
    if (args.priority && args.priority !== currentTask.priority) {
      changes.push(`🔥 Priority: ${this.formatPriority(currentTask.priority)} → ${this.formatPriority(args.priority)}`);
    }
    
    if (args.estimatedHours !== undefined && args.estimatedHours !== currentTask.estimatedHours) {
      changes.push(`⏱️ Estimated Hours: ${currentTask.estimatedHours || 'Not set'} → ${args.estimatedHours}`);
    }
    
    if (args.actualHours !== undefined) {
      changes.push(`⏲️ Actual Hours: ${args.actualHours}`);
    }
    
    if (changes.length > 0) {
      summary += `📝 **Additional Changes:**\n`;
      changes.forEach(change => {
        summary += `  • ${change}\n`;
      });
      summary += '\n';
    }
    
    // Comments and notes
    if (args.comment) {
      summary += `💬 **Comment:** ${args.comment}\n\n`;
    }
    
    if (args.completionNotes && updatedTask.status === 'completed') {
      summary += `📋 **Completion Notes:** ${args.completionNotes}\n\n`;
    }
    
    if (args.blockingReason && updatedTask.status === 'blocked') {
      summary += `🚫 **Blocking Reason:** ${args.blockingReason}\n\n`;
    }
    
    // Status-specific information
    if (updatedTask.status === 'completed') {
      summary += `🎉 **Task Completed!**\n`;
      if (updatedTask.actualHours) {
        summary += `  Time spent: ${updatedTask.actualHours} hours\n`;
      }
      summary += `  Completed at: ${new Date(updatedTask.completedAt).toLocaleString()}\n\n`;
      
      summary += `🎯 **Next Steps:**\n`;
      summary += `  • Review completed work\n`;
      summary += `  • Check for dependent tasks that can now be started\n`;
      summary += `  • Update project documentation if needed\n`;
      
    } else if (updatedTask.status === 'in-progress') {
      summary += `🚀 **Task In Progress**\n`;
      summary += `  Started at: ${new Date(updatedTask.startedAt || updatedTask.updatedAt).toLocaleString()}\n\n`;
      
      summary += `🎯 **Next Steps:**\n`;
      summary += `  • Continue working on the task\n`;
      summary += `  • Update progress regularly\n`;
      summary += `  • Mark as completed when done\n`;
      
    } else if (updatedTask.status === 'blocked') {
      summary += `🚫 **Task Blocked**\n`;
      summary += `  Blocked at: ${new Date(updatedTask.blockedAt).toLocaleString()}\n`;
      if (updatedTask.blockingReason) {
        summary += `  Reason: ${updatedTask.blockingReason}\n`;
      }
      summary += '\n';
      
      summary += `🎯 **Next Steps:**\n`;
      summary += `  • Identify and resolve blocking issues\n`;
      summary += `  • Check if dependent tasks need to be completed first\n`;
      summary += `  • Consider alternative approaches\n`;
      
    } else if (updatedTask.status === 'cancelled') {
      summary += `❌ **Task Cancelled**\n`;
      summary += `  Cancelled at: ${new Date(updatedTask.updatedAt).toLocaleString()}\n\n`;
      
      summary += `🎯 **Next Steps:**\n`;
      summary += `  • Update dependent tasks if needed\n`;
      summary += `  • Archive related work\n`;
      summary += `  • Consider creating replacement tasks if necessary\n`;
    }
    
    // Timestamp
    summary += `\n⏰ Updated: ${new Date(updatedTask.updatedAt).toLocaleString()}`;
    
    return summary;
  },

  /**
   * Send notification about status change (placeholder implementation)
   * @param {Object} task - Updated task
   * @param {Object} args - Update arguments
   * @param {string} summary - Update summary
   * @returns {Promise<void>}
   */
  async sendNotification(task, args, summary) {
    // This is a placeholder for notification functionality
    // In a real implementation, this might send emails, Slack messages, etc.
    console.log(`Notification would be sent to ${task.assignee} about task ${task.id} status change`);
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