import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let TaskManager, TaskDependencyManager;
try {
  const TaskManagerModule = await import('../../sa-engine/tasks/TaskManager.js');
  const TaskDependencyManagerModule = await import('../../sa-engine/tasks/TaskDependencyManager.js');
  TaskManager = TaskManagerModule.default;
  TaskDependencyManager = TaskDependencyManagerModule.default;
} catch (error) {
  console.error('Failed to load TaskManager:', error.message);
}

function getStatusIcon(status) {
  const icons = {
    'pending': '⏳',
    'in-progress': '🔄',
    'blocked': '🚫',
    'review': '👀',
    'done': '✅',
    'deferred': '⏸️',
    'cancelled': '❌'
  };
  return icons[status] || '❓';
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'critical': return chalk.red;
    case 'high': return chalk.yellow;
    case 'medium': return chalk.blue;
    case 'low': return chalk.gray;
    default: return chalk.white;
  }
}

export const taskCommand = {
  async list(options = {}) {
    try {
      if (!TaskManager) {
        throw new Error('TaskManager not available');
      }

      const taskManager = new TaskManager(path.join(__dirname, '../../sa-engine/data/tasks'));
      await taskManager.initialize();

      console.log(chalk.blue('📋 Task Management System\n'));

      const filters = {};
      if (options.status) filters.status = options.status;
      if (options.priority) filters.priority = options.priority;
      if (options.type) filters.type = options.type;
      if (options.assignee) filters.assignee = options.assignee;
      if (options.search) filters.search = options.search;
      if (options.tags) filters.tags = options.tags.split(',');

      const tasks = taskManager.listTasks(filters, options.tag);
      const stats = taskManager.getStats(options.tag);

      if (tasks.length === 0) {
        console.log(chalk.yellow('No tasks found matching the criteria.'));
        console.log(chalk.gray('\nTip: Try creating a task with: sa task create "Task title"'));
        return;
      }

      console.log(chalk.gray(`Total: ${stats.total} | Done: ${stats.completed} | In Progress: ${stats.inProgress} | Blocked: ${stats.blocked}\n`));

      if (options.tree) {
        taskCommand.displayTaskTree(taskManager, options.tag);
      } else {
        const grouped = taskCommand.groupTasksByStatus(tasks);
        for (const [status, statusTasks] of Object.entries(grouped)) {
          if (statusTasks.length === 0) continue;
          
          console.log(chalk.white.bold(`${getStatusIcon(status)} ${status.toUpperCase()} (${statusTasks.length})`));
          statusTasks.forEach(task => {
            const priorityColor = getPriorityColor(task.priority);
            const assigneeText = task.assignee ? `@${task.assignee.name || task.assignee.id}` : '';
            
            console.log(`  ${priorityColor(task.id.padEnd(8))} ${task.title}`);
            if (assigneeText || task.dueDate) {
              console.log(`  ${' '.repeat(8)} ${chalk.gray(assigneeText)} ${task.dueDate ? chalk.red('Due: ' + new Date(task.dueDate).toLocaleDateString()) : ''}`);
            }
            if (task.dependencies.length > 0) {
              console.log(`  ${' '.repeat(8)} ${chalk.cyan('Depends on:')} ${task.dependencies.join(', ')}`);
            }
          });
          console.log();
        }
      }

      if (options.stats) {
        console.log(chalk.blue('\n📊 Statistics:'));
        console.log(`${chalk.gray('By Priority:')} Critical: ${stats.byPriority.critical || 0}, High: ${stats.byPriority.high || 0}, Medium: ${stats.byPriority.medium || 0}, Low: ${stats.byPriority.low || 0}`);
        console.log(`${chalk.gray('By Type:')} ${Object.entries(stats.byType).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
        if (stats.overdue > 0) {
          console.log(`${chalk.red('Overdue:')} ${stats.overdue} tasks`);
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Error listing tasks:'), error.message);
    }
  },

  groupTasksByStatus(tasks) {
    const grouped = {
      'pending': [],
      'in-progress': [],
      'blocked': [],
      'review': [],
      'done': [],
      'deferred': [],
      'cancelled': []
    };

    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }

    return grouped;
  },

  displayTaskTree(taskManager, tag) {
    const rootTasks = taskManager.tasks.tags[tag || taskManager.currentTag].tasks;
    
    const displayTask = (task, indent = '') => {
      const statusIcon = getStatusIcon(task.status);
      const priorityColor = getPriorityColor(task.priority);
      console.log(`${indent}${statusIcon} ${priorityColor(task.id)} ${task.title}`);
      
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask, index) => {
          const isLast = index === task.subtasks.length - 1;
          const newIndent = indent + (isLast ? '  └─ ' : '  ├─ ');
          displayTask(subtask, newIndent);
        });
      }
    };

    rootTasks.forEach(task => displayTask(task));
  },

  async show(id, options = {}) {
    try {
      if (!TaskManager) {
        throw new Error('TaskManager not available');
      }

      if (!id) {
        console.log(chalk.red('❌ Task ID is required'));
        return;
      }

      const taskManager = new TaskManager(path.join(__dirname, '../../sa-engine/data/tasks'));
      await taskManager.initialize();

      const task = taskManager.getTask(id, options.tag);
      if (!task) {
        console.log(chalk.red(`❌ Task '${id}' not found`));
        return;
      }

      console.log(chalk.blue(`📋 Task Details: ${task.title}\n`));

      console.log(chalk.white.bold('Basic Information:'));
      console.log(`${chalk.gray('ID:')} ${task.id}`);
      console.log(`${chalk.gray('Title:')} ${task.title}`);
      console.log(`${chalk.gray('Status:')} ${getStatusIcon(task.status)} ${task.status}`);
      console.log(`${chalk.gray('Priority:')} ${getPriorityColor(task.priority)(task.priority)}`);
      console.log(`${chalk.gray('Type:')} ${task.type}`);

      if (task.assignee) {
        console.log(`${chalk.gray('Assignee:')} ${task.assignee.name || task.assignee.id} (${task.assignee.type})`);
      }

      console.log(`${chalk.gray('Description:')} ${task.description}\n`);

      if (task.details) {
        console.log(chalk.white.bold('Details:'));
        console.log(task.details + '\n');
      }

      if (task.acceptanceCriteria.length > 0) {
        console.log(chalk.white.bold('Acceptance Criteria:'));
        task.acceptanceCriteria.forEach((criteria, index) => {
          console.log(`${index + 1}. ${criteria}`);
        });
        console.log();
      }

      if (task.dependencies.length > 0) {
        console.log(chalk.white.bold('Dependencies:'));
        for (const depId of task.dependencies) {
          const depTask = taskManager.getTask(depId, options.tag);
          const statusIcon = getStatusIcon(depTask?.status || 'unknown');
          console.log(`  ${statusIcon} ${depId}: ${depTask?.title || 'Unknown task'}`);
        }
        console.log();
      }

      if (task.subtasks && task.subtasks.length > 0) {
        console.log(chalk.white.bold(`Subtasks (${task.subtasks.length}):`));
        task.subtasks.forEach(subtask => {
          const statusIcon = getStatusIcon(subtask.status);
          console.log(`  ${statusIcon} ${subtask.id}: ${subtask.title}`);
        });
        console.log();
      }

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < new Date() && task.status !== 'done';
        console.log(`${chalk.gray('Due Date:')} ${isOverdue ? chalk.red(dueDate.toLocaleDateString()) : dueDate.toLocaleDateString()}`);
      }

      console.log(chalk.white.bold('\nMetadata:'));
      console.log(`${chalk.gray('Created:')} ${new Date(task.metadata.created).toLocaleDateString()}`);
      console.log(`${chalk.gray('Modified:')} ${new Date(task.metadata.modified).toLocaleDateString()}`);
      
      if (task.estimatedHours) {
        console.log(`${chalk.gray('Estimated Hours:')} ${task.estimatedHours}`);
      }
      if (task.actualHours) {
        console.log(`${chalk.gray('Actual Hours:')} ${task.actualHours}`);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error showing task:'), error.message);
    }
  },

  async create(title, options = {}) {
    try {
      if (!TaskManager) {
        throw new Error('TaskManager not available');
      }

      if (!title) {
        console.log(chalk.red('❌ Task title is required'));
        return;
      }

      const taskManager = new TaskManager(path.join(__dirname, '../../sa-engine/data/tasks'));
      await taskManager.initialize();

      const taskData = {
        title,
        description: options.description || title,
        priority: options.priority || 'medium',
        type: options.type || 'feature',
        status: 'pending'
      };

      if (options.assignee) {
        taskData.assignee = {
          type: 'agent',
          id: options.assignee,
          name: options.assignee
        };
      }

      if (options.due) {
        taskData.dueDate = new Date(options.due);
      }

      if (options.tags) {
        taskData.tags = options.tags.split(',').map(tag => tag.trim());
      }

      if (options.depends) {
        taskData.dependencies = options.depends.split(',').map(dep => dep.trim());
      }

      let createdTask;
      if (options.parent) {
        createdTask = await taskManager.createSubtask(options.parent, taskData, options.tag);
        console.log(chalk.green(`✅ Subtask created: ${createdTask.id}`));
      } else {
        createdTask = await taskManager.createTask(taskData, options.tag);
        console.log(chalk.green(`✅ Task created: ${createdTask.id}`));
      }

      console.log(chalk.gray(`Title: ${createdTask.title}`));
      console.log(chalk.gray(`Status: ${createdTask.status}`));
      console.log(chalk.gray(`Priority: ${createdTask.priority}`));

    } catch (error) {
      console.error(chalk.red('❌ Error creating task:'), error.message);
    }
  },

  async update(id, options = {}) {
    try {
      if (!TaskManager) {
        throw new Error('TaskManager not available');
      }

      if (!id) {
        console.log(chalk.red('❌ Task ID is required'));
        return;
      }

      const taskManager = new TaskManager(path.join(__dirname, '../../sa-engine/data/tasks'));
      await taskManager.initialize();

      const updates = {};
      if (options.title) updates.title = options.title;
      if (options.description) updates.description = options.description;
      if (options.status) updates.status = options.status;
      if (options.priority) updates.priority = options.priority;
      if (options.type) updates.type = options.type;
      if (options.due) updates.dueDate = new Date(options.due);
      if (options.notes) updates.notes = (updates.notes || '') + '\n' + options.notes;

      if (Object.keys(updates).length === 0) {
        console.log(chalk.yellow('⚠️  No updates specified'));
        return;
      }

      const updatedTask = await taskManager.updateTask(id, updates, options.tag);
      console.log(chalk.green(`✅ Task updated: ${updatedTask.id}`));
      console.log(chalk.gray(`Title: ${updatedTask.title}`));
      console.log(chalk.gray(`Status: ${getStatusIcon(updatedTask.status)} ${updatedTask.status}`));
      console.log(chalk.gray(`Priority: ${updatedTask.priority}`));

    } catch (error) {
      console.error(chalk.red('❌ Error updating task:'), error.message);
    }
  },

  async delete(id, options = {}) {
    try {
      if (!TaskManager) {
        throw new Error('TaskManager not available');
      }

      if (!id) {
        console.log(chalk.red('❌ Task ID is required'));
        return;
      }

      const taskManager = new TaskManager(path.join(__dirname, '../../sa-engine/data/tasks'));
      await taskManager.initialize();

      const task = taskManager.getTask(id, options.tag);
      if (!task) {
        console.log(chalk.red(`❌ Task '${id}' not found`));
        return;
      }

      if (!options.force) {
        console.log(chalk.yellow(`⚠️  This will delete task '${id}: ${task.title}'`));
        console.log(chalk.gray('Use --force to confirm deletion'));
        return;
      }

      await taskManager.deleteTask(id, options.tag);
      console.log(chalk.green(`✅ Task deleted: ${id}`));

    } catch (error) {
      console.error(chalk.red('❌ Error deleting task:'), error.message);
    }
  },

  async deps(id, options = {}) {
    try {
      if (!TaskManager || !TaskDependencyManager) {
        throw new Error('TaskManager or TaskDependencyManager not available');
      }

      const taskManager = new TaskManager(path.join(__dirname, '../../sa-engine/data/tasks'));
      await taskManager.initialize();

      const depManager = new TaskDependencyManager(taskManager);
      await depManager.initialize();

      if (options.add) {
        await depManager.addDependency(id, options.add, options.tag);
        console.log(chalk.green(`✅ Added dependency: ${id} depends on ${options.add}`));
        return;
      }

      if (options.remove) {
        await depManager.removeDependency(id, options.remove, options.tag);
        console.log(chalk.green(`✅ Removed dependency: ${id} no longer depends on ${options.remove}`));
        return;
      }

      if (options.validate) {
        const validation = depManager.validateDependencies();
        console.log(chalk.blue('🔍 Dependency Validation:\n'));
        
        if (validation.isValid) {
          console.log(chalk.green('✅ All dependencies are valid'));
        } else {
          console.log(chalk.red(`❌ Found ${validation.errors.length} errors:`));
          validation.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (validation.warnings.length > 0) {
          console.log(chalk.yellow(`⚠️  ${validation.warnings.length} warnings:`));
          validation.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        if (validation.cycles.length > 0) {
          console.log(chalk.red(`🔄 ${validation.cycles.length} circular dependencies:`));
          validation.cycles.forEach(cycle => console.log(`  • ${cycle.join(' → ')}`));
        }
        return;
      }

      if (options.visualize) {
        const format = options.format || 'ascii';
        const visualization = depManager.visualizeDependencies(id, format);
        console.log(chalk.blue(`📊 Dependency Graph (${format}):\n`));
        console.log(visualization);
        return;
      }

      const dependencies = depManager.getDependencies(id);
      const dependents = depManager.getDependents(id);

      console.log(chalk.blue(`🔗 Dependencies for Task: ${id}\n`));

      if (dependencies.length > 0) {
        console.log(chalk.white.bold('Dependencies (this task depends on):'));
        dependencies.forEach(dep => {
          const statusIcon = getStatusIcon(dep.status);
          console.log(`  ${statusIcon} ${dep.id}: ${dep.task?.title || 'Unknown'}`);
        });
        console.log();
      }

      if (dependents.length > 0) {
        console.log(chalk.white.bold('Dependents (tasks that depend on this):'));
        dependents.forEach(dep => {
          const statusIcon = getStatusIcon(dep.status);
          console.log(`  ${statusIcon} ${dep.id}: ${dep.task?.title || 'Unknown'}`);
        });
        console.log();
      }

      if (dependencies.length === 0 && dependents.length === 0) {
        console.log(chalk.gray('No dependencies found for this task.'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error managing dependencies:'), error.message);
    }
  }
};