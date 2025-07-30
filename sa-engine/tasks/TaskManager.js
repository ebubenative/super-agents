import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import TaskSchema from './TaskSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TaskManager extends EventEmitter {
    constructor(dataDir = path.join(__dirname, '../data/tasks')) {
        super();
        this.dataDir = dataDir;
        this.tasksFile = path.join(dataDir, 'tasks.json');
        this.backupDir = path.join(dataDir, 'backups');
        this.currentTag = 'main';
        this.tasks = null;
        this.autoSave = true;
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async initialize() {
        try {
            await this.loadTasks();
            this.emit('initialized');
            return { success: true, message: 'TaskManager initialized successfully' };
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async loadTasks() {
        try {
            if (fs.existsSync(this.tasksFile)) {
                const data = fs.readFileSync(this.tasksFile, 'utf8');
                let taskData = JSON.parse(data);

                if (taskData.tasks && !taskData.tags) {
                    taskData = this.migrateLegacyFormat(taskData);
                }

                this.tasks = TaskSchema.validateTaskCollection(taskData);
                this.emit('tasks_loaded', { 
                    totalTasks: this.getTotalTaskCount(),
                    tags: Object.keys(this.tasks.tags)
                });
            } else {
                this.tasks = TaskSchema.createEmptyTaskCollection();
                await this.saveTasks();
                this.emit('tasks_created');
            }
        } catch (error) {
            this.emit('load_error', error);
            throw new Error(`Failed to load tasks: ${error.message}`);
        }
    }

    migrateLegacyFormat(legacyData) {
        const migratedData = TaskSchema.createEmptyTaskCollection();
        migratedData.tags.main.tasks = legacyData.tasks || [];
        migratedData.tags.main.metadata.taskCount = migratedData.tags.main.tasks.length;
        migratedData.metadata.totalTasks = migratedData.tags.main.tasks.length;
        
        this.emit('legacy_migration', { taskCount: migratedData.tags.main.tasks.length });
        return migratedData;
    }

    async saveTasks() {
        if (!this.autoSave) return;

        try {
            await this.createBackup();
            
            this.tasks.metadata.modified = new Date();
            this.updateTaskCounts();
            
            const dataToSave = JSON.stringify(this.tasks, null, 2);
            fs.writeFileSync(this.tasksFile, dataToSave, 'utf8');
            
            this.emit('tasks_saved', { timestamp: new Date() });
        } catch (error) {
            this.emit('save_error', error);
            throw new Error(`Failed to save tasks: ${error.message}`);
        }
    }

    async createBackup() {
        if (!fs.existsSync(this.tasksFile)) return;

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `tasks-${timestamp}.json`);
            fs.copyFileSync(this.tasksFile, backupFile);

            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('tasks-') && file.endsWith('.json'))
                .sort()
                .reverse();

            if (backupFiles.length > 10) {
                for (const file of backupFiles.slice(10)) {
                    fs.unlinkSync(path.join(this.backupDir, file));
                }
            }
        } catch (error) {
            console.warn('Failed to create backup:', error.message);
        }
    }

    updateTaskCounts() {
        let totalTasks = 0;
        let maxDepth = 0;

        for (const [tagName, tagData] of Object.entries(this.tasks.tags)) {
            const taskCount = this.countTasksRecursively(tagData.tasks);
            tagData.metadata.taskCount = taskCount;
            tagData.metadata.modified = new Date();
            totalTasks += taskCount;

            const tagMaxDepth = this.calculateMaxDepth(tagData.tasks);
            if (tagMaxDepth > maxDepth) {
                maxDepth = tagMaxDepth;
            }
        }

        this.tasks.metadata.totalTasks = totalTasks;
        this.tasks.metadata.maxDepth = maxDepth;
    }

    countTasksRecursively(tasks) {
        let count = tasks.length;
        for (const task of tasks) {
            if (task.subtasks && task.subtasks.length > 0) {
                count += this.countTasksRecursively(task.subtasks);
            }
        }
        return count;
    }

    calculateMaxDepth(tasks, currentDepth = 1) {
        let maxDepth = currentDepth;
        for (const task of tasks) {
            if (task.subtasks && task.subtasks.length > 0) {
                const subtaskDepth = this.calculateMaxDepth(task.subtasks, currentDepth + 1);
                if (subtaskDepth > maxDepth) {
                    maxDepth = subtaskDepth;
                }
            }
        }
        return maxDepth;
    }

    async createTask(taskData, tag = null) {
        try {
            const targetTag = tag || this.currentTag;
            if (!this.tasks.tags[targetTag]) {
                throw new Error(`Tag '${targetTag}' does not exist`);
            }

            const existingIds = this.getAllTaskIds(targetTag);
            const newTask = TaskSchema.createEmptyTask(taskData);
            
            if (!newTask.id) {
                newTask.id = TaskSchema.generateTaskId(null, existingIds);
            } else if (existingIds.includes(newTask.id)) {
                throw new Error(`Task ID '${newTask.id}' already exists in tag '${targetTag}'`);
            }

            newTask.metadata.created = new Date();
            newTask.metadata.modified = new Date();
            
            const validatedTask = TaskSchema.validateTask(newTask);
            this.tasks.tags[targetTag].tasks.push(validatedTask);
            
            if (this.autoSave) {
                await this.saveTasks();
            }
            
            this.emit('task_created', { 
                taskId: validatedTask.id, 
                tag: targetTag,
                task: validatedTask 
            });
            
            return validatedTask;
        } catch (error) {
            this.emit('task_create_error', { error, taskData });
            throw error;
        }
    }

    async createSubtask(parentTaskId, subtaskData, tag = null) {
        try {
            const targetTag = tag || this.currentTag;
            const parentTask = this.getTask(parentTaskId, targetTag);
            
            if (!parentTask) {
                throw new Error(`Parent task '${parentTaskId}' not found in tag '${targetTag}'`);
            }

            const existingIds = this.getAllTaskIds(targetTag);
            const newSubtask = TaskSchema.createEmptyTask(subtaskData);
            
            if (!newSubtask.id) {
                newSubtask.id = TaskSchema.generateTaskId(parentTaskId, existingIds);
            }

            newSubtask.metadata.created = new Date();
            newSubtask.metadata.modified = new Date();
            
            const validatedSubtask = TaskSchema.validateTask(newSubtask);
            parentTask.subtasks.push(validatedSubtask);
            parentTask.metadata.modified = new Date();
            
            if (this.autoSave) {
                await this.saveTasks();
            }
            
            this.emit('subtask_created', { 
                parentTaskId,
                subtaskId: validatedSubtask.id,
                tag: targetTag,
                subtask: validatedSubtask
            });
            
            return validatedSubtask;
        } catch (error) {
            this.emit('subtask_create_error', { error, parentTaskId, subtaskData });
            throw error;
        }
    }

    getTask(taskId, tag = null) {
        const targetTag = tag || this.currentTag;
        if (!this.tasks.tags[targetTag]) {
            return null;
        }

        return this.findTaskRecursively(this.tasks.tags[targetTag].tasks, taskId);
    }

    findTaskRecursively(tasks, taskId) {
        for (const task of tasks) {
            if (task.id === taskId) {
                return task;
            }
            if (task.subtasks && task.subtasks.length > 0) {
                const found = this.findTaskRecursively(task.subtasks, taskId);
                if (found) return found;
            }
        }
        return null;
    }

    async updateTask(taskId, updates, tag = null) {
        try {
            const targetTag = tag || this.currentTag;
            const task = this.getTask(taskId, targetTag);
            
            if (!task) {
                throw new Error(`Task '${taskId}' not found in tag '${targetTag}'`);
            }

            const oldStatus = task.status;
            Object.assign(task, updates);
            task.metadata.modified = new Date();

            if (updates.status && updates.status !== oldStatus) {
                if (!TaskSchema.isValidStatusTransition(oldStatus, updates.status)) {
                    throw new Error(`Invalid status transition from '${oldStatus}' to '${updates.status}'`);
                }
                
                if (updates.status === 'done' && !task.completedDate) {
                    task.completedDate = new Date();
                }
            }

            const validatedTask = TaskSchema.validateTask(task);
            Object.assign(task, validatedTask);
            
            if (this.autoSave) {
                await this.saveTasks();
            }
            
            this.emit('task_updated', { 
                taskId,
                tag: targetTag,
                updates,
                task: validatedTask
            });
            
            return validatedTask;
        } catch (error) {
            this.emit('task_update_error', { error, taskId, updates });
            throw error;
        }
    }

    async deleteTask(taskId, tag = null) {
        try {
            const targetTag = tag || this.currentTag;
            const result = this.deleteTaskRecursively(this.tasks.tags[targetTag].tasks, taskId);
            
            if (!result.found) {
                throw new Error(`Task '${taskId}' not found in tag '${targetTag}'`);
            }

            this.removeTaskFromDependencies(taskId, targetTag);
            
            if (this.autoSave) {
                await this.saveTasks();
            }
            
            this.emit('task_deleted', { 
                taskId,
                tag: targetTag,
                task: result.task
            });
            
            return result.task;
        } catch (error) {
            this.emit('task_delete_error', { error, taskId });
            throw error;
        }
    }

    deleteTaskRecursively(tasks, taskId) {
        for (let i = 0; i < tasks.length; i++) {
            if (tasks[i].id === taskId) {
                const deletedTask = tasks.splice(i, 1)[0];
                return { found: true, task: deletedTask };
            }
            
            if (tasks[i].subtasks && tasks[i].subtasks.length > 0) {
                const result = this.deleteTaskRecursively(tasks[i].subtasks, taskId);
                if (result.found) {
                    tasks[i].metadata.modified = new Date();
                    return result;
                }
            }
        }
        return { found: false, task: null };
    }

    removeTaskFromDependencies(deletedTaskId, tag) {
        const allTasks = this.getAllTasks(tag);
        
        for (const task of allTasks) {
            let modified = false;
            
            if (task.dependencies.includes(deletedTaskId)) {
                task.dependencies = task.dependencies.filter(id => id !== deletedTaskId);
                modified = true;
            }
            
            if (task.blockedBy.includes(deletedTaskId)) {
                task.blockedBy = task.blockedBy.filter(id => id !== deletedTaskId);
                modified = true;
            }
            
            if (task.blocks.includes(deletedTaskId)) {
                task.blocks = task.blocks.filter(id => id !== deletedTaskId);
                modified = true;
            }
            
            if (modified) {
                task.metadata.modified = new Date();
            }
        }
    }

    listTasks(filters = {}, tag = null) {
        const targetTag = tag || this.currentTag;
        if (!this.tasks.tags[targetTag]) {
            return [];
        }

        let allTasks = this.getAllTasks(targetTag);
        return this.applyFilters(allTasks, filters);
    }

    getAllTasks(tag = null) {
        const targetTag = tag || this.currentTag;
        if (!this.tasks.tags[targetTag]) {
            return [];
        }

        return this.flattenTasks(this.tasks.tags[targetTag].tasks);
    }

    flattenTasks(tasks, result = []) {
        for (const task of tasks) {
            result.push(task);
            if (task.subtasks && task.subtasks.length > 0) {
                this.flattenTasks(task.subtasks, result);
            }
        }
        return result;
    }

    applyFilters(tasks, filters) {
        return tasks.filter(task => {
            if (filters.status && task.status !== filters.status) {
                return false;
            }
            
            if (filters.priority && task.priority !== filters.priority) {
                return false;
            }
            
            if (filters.type && task.type !== filters.type) {
                return false;
            }
            
            if (filters.assignee && task.assignee?.id !== filters.assignee) {
                return false;
            }
            
            if (filters.tags && filters.tags.length > 0) {
                if (!filters.tags.some(tag => task.tags.includes(tag))) {
                    return false;
                }
            }
            
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = [
                    task.title,
                    task.description,
                    task.details || '',
                    task.notes || ''
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            if (filters.dateRange) {
                if (filters.dateRange.start && task.metadata.created < filters.dateRange.start) {
                    return false;
                }
                if (filters.dateRange.end && task.metadata.created > filters.dateRange.end) {
                    return false;
                }
            }
            
            return true;
        });
    }

    getAllTaskIds(tag = null) {
        return this.getAllTasks(tag).map(task => task.id);
    }

    getTotalTaskCount(tag = null) {
        if (tag) {
            return this.tasks.tags[tag]?.metadata.taskCount || 0;
        }
        return this.tasks.metadata.totalTasks;
    }

    async setCurrentTag(tagName) {
        if (!this.tasks.tags[tagName]) {
            throw new Error(`Tag '${tagName}' does not exist`);
        }
        
        this.currentTag = tagName;
        this.emit('tag_changed', { tag: tagName });
    }

    async createTag(tagName, description = '') {
        if (this.tasks.tags[tagName]) {
            throw new Error(`Tag '${tagName}' already exists`);
        }
        
        this.tasks.tags[tagName] = {
            name: tagName,
            description,
            tasks: [],
            metadata: {
                created: new Date(),
                modified: new Date(),
                taskCount: 0
            }
        };
        
        if (this.autoSave) {
            await this.saveTasks();
        }
        
        this.emit('tag_created', { tag: tagName });
        return this.tasks.tags[tagName];
    }

    async deleteTag(tagName) {
        if (tagName === 'main') {
            throw new Error('Cannot delete the main tag');
        }
        
        if (!this.tasks.tags[tagName]) {
            throw new Error(`Tag '${tagName}' does not exist`);
        }
        
        const deletedTag = this.tasks.tags[tagName];
        delete this.tasks.tags[tagName];
        
        if (this.currentTag === tagName) {
            this.currentTag = 'main';
        }
        
        if (this.autoSave) {
            await this.saveTasks();
        }
        
        this.emit('tag_deleted', { tag: tagName, taskCount: deletedTag.metadata.taskCount });
        return deletedTag;
    }

    getStats(tag = null) {
        const tasks = this.getAllTasks(tag);
        
        const stats = {
            total: tasks.length,
            byStatus: {},
            byPriority: {},
            byType: {},
            byAssignee: {},
            completed: 0,
            inProgress: 0,
            blocked: 0,
            overdue: 0
        };

        const now = new Date();
        
        for (const task of tasks) {
            stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
            stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
            stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;
            
            if (task.assignee) {
                const assigneeKey = task.assignee.name || task.assignee.id || 'Unassigned';
                stats.byAssignee[assigneeKey] = (stats.byAssignee[assigneeKey] || 0) + 1;
            }
            
            if (task.status === 'done') stats.completed++;
            if (task.status === 'in-progress') stats.inProgress++;
            if (task.status === 'blocked') stats.blocked++;
            
            if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'done') {
                stats.overdue++;
            }
        }
        
        return stats;
    }

    async exportTasks(format = 'json', tag = null) {
        const tasks = tag ? { [tag]: this.tasks.tags[tag] } : this.tasks;
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(tasks, null, 2);
            
            case 'csv':
                return this.exportToCSV(this.getAllTasks(tag));
            
            case 'markdown':
                return this.exportToMarkdown(this.getAllTasks(tag), tag);
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    exportToCSV(tasks) {
        const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Type', 'Assignee', 'Created', 'Due Date'];
        const rows = [headers.join(',')];
        
        for (const task of tasks) {
            const row = [
                task.id,
                `"${task.title}"`,
                `"${task.description}"`,
                task.status,
                task.priority,
                task.type,
                task.assignee?.name || '',
                task.metadata.created.toISOString().split('T')[0],
                task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
            ];
            rows.push(row.join(','));
        }
        
        return rows.join('\n');
    }

    exportToMarkdown(tasks, tag) {
        let markdown = `# Tasks${tag ? ` - ${tag}` : ''}\n\n`;
        
        const tasksByStatus = {};
        for (const task of tasks) {
            if (!tasksByStatus[task.status]) {
                tasksByStatus[task.status] = [];
            }
            tasksByStatus[task.status].push(task);
        }
        
        for (const [status, statusTasks] of Object.entries(tasksByStatus)) {
            markdown += `## ${status.charAt(0).toUpperCase() + status.slice(1)} (${statusTasks.length})\n\n`;
            
            for (const task of statusTasks) {
                markdown += `### ${task.id}: ${task.title}\n\n`;
                markdown += `**Priority:** ${task.priority} | **Type:** ${task.type}\n\n`;
                markdown += `${task.description}\n\n`;
                
                if (task.details) {
                    markdown += `**Details:** ${task.details}\n\n`;
                }
                
                if (task.dependencies.length > 0) {
                    markdown += `**Dependencies:** ${task.dependencies.join(', ')}\n\n`;
                }
                
                markdown += '---\n\n';
            }
        }
        
        return markdown;
    }

    async cleanup() {
        this.removeAllListeners();
        this.tasks = null;
    }
}

export default TaskManager;