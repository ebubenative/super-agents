import { EventEmitter } from 'events';

class TaskDependencyManager extends EventEmitter {
    constructor(taskManager) {
        super();
        this.taskManager = taskManager;
        this.dependencyGraph = new Map();
        this.initialized = false;
    }

    async initialize() {
        try {
            this.buildDependencyGraph();
            this.initialized = true;
            this.emit('initialized');
            return { success: true, message: 'TaskDependencyManager initialized successfully' };
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    buildDependencyGraph() {
        this.dependencyGraph.clear();
        
        for (const tagName of Object.keys(this.taskManager.tasks.tags)) {
            const tasks = this.taskManager.getAllTasks(tagName);
            
            for (const task of tasks) {
                if (!this.dependencyGraph.has(task.id)) {
                    this.dependencyGraph.set(task.id, {
                        task,
                        dependencies: new Set(),
                        dependents: new Set(),
                        blockedBy: new Set(),
                        blocks: new Set()
                    });
                }
                
                const node = this.dependencyGraph.get(task.id);
                
                for (const depId of task.dependencies) {
                    node.dependencies.add(depId);
                    
                    if (!this.dependencyGraph.has(depId)) {
                        const depTask = this.taskManager.getTask(depId, tagName);
                        if (depTask) {
                            this.dependencyGraph.set(depId, {
                                task: depTask,
                                dependencies: new Set(),
                                dependents: new Set(),
                                blockedBy: new Set(),
                                blocks: new Set()
                            });
                        }
                    }
                    
                    if (this.dependencyGraph.has(depId)) {
                        this.dependencyGraph.get(depId).dependents.add(task.id);
                    }
                }
                
                for (const blockerId of task.blockedBy) {
                    node.blockedBy.add(blockerId);
                    
                    if (!this.dependencyGraph.has(blockerId)) {
                        const blockerTask = this.taskManager.getTask(blockerId, tagName);
                        if (blockerTask) {
                            this.dependencyGraph.set(blockerId, {
                                task: blockerTask,
                                dependencies: new Set(),
                                dependents: new Set(),
                                blockedBy: new Set(),
                                blocks: new Set()
                            });
                        }
                    }
                    
                    if (this.dependencyGraph.has(blockerId)) {
                        this.dependencyGraph.get(blockerId).blocks.add(task.id);
                    }
                }
                
                for (const blockedId of task.blocks) {
                    node.blocks.add(blockedId);
                    
                    if (!this.dependencyGraph.has(blockedId)) {
                        const blockedTask = this.taskManager.getTask(blockedId, tagName);
                        if (blockedTask) {
                            this.dependencyGraph.set(blockedId, {
                                task: blockedTask,
                                dependencies: new Set(),
                                dependents: new Set(),
                                blockedBy: new Set(),
                                blocks: new Set()
                            });
                        }
                    }
                    
                    if (this.dependencyGraph.has(blockedId)) {
                        this.dependencyGraph.get(blockedId).blockedBy.add(task.id);
                    }
                }
            }
        }
    }

    async addDependency(taskId, dependsOnTaskId, tag = null) {
        try {
            const task = this.taskManager.getTask(taskId, tag);
            const dependencyTask = this.taskManager.getTask(dependsOnTaskId, tag);
            
            if (!task) {
                throw new Error(`Task '${taskId}' not found`);
            }
            
            if (!dependencyTask) {
                throw new Error(`Dependency task '${dependsOnTaskId}' not found`);
            }
            
            if (taskId === dependsOnTaskId) {
                throw new Error('Task cannot depend on itself');
            }
            
            if (task.dependencies.includes(dependsOnTaskId)) {
                throw new Error(`Dependency '${dependsOnTaskId}' already exists for task '${taskId}'`);
            }
            
            if (this.wouldCreateCycle(taskId, dependsOnTaskId)) {
                throw new Error(`Adding dependency '${dependsOnTaskId}' to task '${taskId}' would create a circular dependency`);
            }
            
            task.dependencies.push(dependsOnTaskId);
            task.metadata.modified = new Date();
            
            if (!dependencyTask.blocks.includes(taskId)) {
                dependencyTask.blocks.push(taskId);
                dependencyTask.metadata.modified = new Date();
            }
            
            if (!task.blockedBy.includes(dependsOnTaskId)) {
                task.blockedBy.push(dependsOnTaskId);
            }
            
            this.buildDependencyGraph();
            
            if (this.taskManager.autoSave) {
                await this.taskManager.saveTasks();
            }
            
            this.emit('dependency_added', { taskId, dependsOnTaskId });
            return { success: true, message: `Dependency added: ${taskId} depends on ${dependsOnTaskId}` };
            
        } catch (error) {
            this.emit('dependency_add_error', { error, taskId, dependsOnTaskId });
            throw error;
        }
    }

    async removeDependency(taskId, dependsOnTaskId, tag = null) {
        try {
            const task = this.taskManager.getTask(taskId, tag);
            const dependencyTask = this.taskManager.getTask(dependsOnTaskId, tag);
            
            if (!task) {
                throw new Error(`Task '${taskId}' not found`);
            }
            
            if (!task.dependencies.includes(dependsOnTaskId)) {
                throw new Error(`Dependency '${dependsOnTaskId}' does not exist for task '${taskId}'`);
            }
            
            task.dependencies = task.dependencies.filter(id => id !== dependsOnTaskId);
            task.blockedBy = task.blockedBy.filter(id => id !== dependsOnTaskId);
            task.metadata.modified = new Date();
            
            if (dependencyTask) {
                dependencyTask.blocks = dependencyTask.blocks.filter(id => id !== taskId);
                dependencyTask.metadata.modified = new Date();
            }
            
            this.buildDependencyGraph();
            
            if (this.taskManager.autoSave) {
                await this.taskManager.saveTasks();
            }
            
            this.emit('dependency_removed', { taskId, dependsOnTaskId });
            return { success: true, message: `Dependency removed: ${taskId} no longer depends on ${dependsOnTaskId}` };
            
        } catch (error) {
            this.emit('dependency_remove_error', { error, taskId, dependsOnTaskId });
            throw error;
        }
    }

    getDependencies(taskId) {
        const node = this.dependencyGraph.get(taskId);
        if (!node) {
            return [];
        }
        
        return Array.from(node.dependencies).map(depId => {
            const depNode = this.dependencyGraph.get(depId);
            return {
                id: depId,
                task: depNode?.task || null,
                status: depNode?.task?.status || 'unknown'
            };
        });
    }

    getDependents(taskId) {
        const node = this.dependencyGraph.get(taskId);
        if (!node) {
            return [];
        }
        
        return Array.from(node.dependents).map(depId => {
            const depNode = this.dependencyGraph.get(depId);
            return {
                id: depId,
                task: depNode?.task || null,
                status: depNode?.task?.status || 'unknown'
            };
        });
    }

    getBlockedTasks(taskId) {
        const node = this.dependencyGraph.get(taskId);
        if (!node) {
            return [];
        }
        
        return Array.from(node.blocks).map(blockedId => {
            const blockedNode = this.dependencyGraph.get(blockedId);
            return {
                id: blockedId,
                task: blockedNode?.task || null,
                status: blockedNode?.task?.status || 'unknown'
            };
        });
    }

    getBlockingTasks(taskId) {
        const node = this.dependencyGraph.get(taskId);
        if (!node) {
            return [];
        }
        
        return Array.from(node.blockedBy).map(blockerId => {
            const blockerNode = this.dependencyGraph.get(blockerId);
            return {
                id: blockerId,
                task: blockerNode?.task || null,
                status: blockerNode?.task?.status || 'unknown'
            };
        });
    }

    wouldCreateCycle(fromTaskId, toTaskId) {
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId)) {
                return true;
            }
            
            if (visited.has(nodeId)) {
                return false;
            }
            
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const node = this.dependencyGraph.get(nodeId);
            if (node) {
                for (const depId of node.dependencies) {
                    if (hasCycle(depId)) {
                        return true;
                    }
                }
            }
            
            recursionStack.delete(nodeId);
            return false;
        };
        
        const tempGraph = new Map(this.dependencyGraph);
        
        if (!tempGraph.has(fromTaskId)) {
            tempGraph.set(fromTaskId, {
                dependencies: new Set(),
                dependents: new Set(),
                blockedBy: new Set(),
                blocks: new Set()
            });
        }
        
        tempGraph.get(fromTaskId).dependencies.add(toTaskId);
        
        const originalGraph = this.dependencyGraph;
        this.dependencyGraph = tempGraph;
        
        const cycleExists = hasCycle(fromTaskId);
        
        this.dependencyGraph = originalGraph;
        
        return cycleExists;
    }

    detectCycles() {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];
        
        const detectCycleFromNode = (nodeId, path = []) => {
            if (recursionStack.has(nodeId)) {
                const cycleStart = path.indexOf(nodeId);
                if (cycleStart !== -1) {
                    cycles.push([...path.slice(cycleStart), nodeId]);
                }
                return;
            }
            
            if (visited.has(nodeId)) {
                return;
            }
            
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            
            const node = this.dependencyGraph.get(nodeId);
            if (node) {
                for (const depId of node.dependencies) {
                    detectCycleFromNode(depId, [...path]);
                }
            }
            
            recursionStack.delete(nodeId);
        };
        
        for (const nodeId of this.dependencyGraph.keys()) {
            if (!visited.has(nodeId)) {
                detectCycleFromNode(nodeId);
            }
        }
        
        return cycles;
    }

    validateDependencies() {
        const errors = [];
        const warnings = [];
        
        for (const [taskId, node] of this.dependencyGraph.entries()) {
            if (!node.task) {
                errors.push(`Task node '${taskId}' exists in dependency graph but task not found`);
                continue;
            }
            
            for (const depId of node.dependencies) {
                const depTask = this.taskManager.getTask(depId);
                if (!depTask) {
                    errors.push(`Task '${taskId}' depends on non-existent task '${depId}'`);
                } else if (depTask.status === 'cancelled') {
                    warnings.push(`Task '${taskId}' depends on cancelled task '${depId}'`);
                }
            }
            
            for (const blockerId of node.blockedBy) {
                const blockerTask = this.taskManager.getTask(blockerId);
                if (!blockerTask) {
                    errors.push(`Task '${taskId}' is blocked by non-existent task '${blockerId}'`);
                }
            }
        }
        
        const cycles = this.detectCycles();
        for (const cycle of cycles) {
            errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            cycles
        };
    }

    getTopologicalSort(tag = null) {
        const tasks = this.taskManager.getAllTasks(tag);
        const inDegree = new Map();
        const graph = new Map();
        
        for (const task of tasks) {
            inDegree.set(task.id, 0);
            graph.set(task.id, []);
        }
        
        for (const task of tasks) {
            for (const depId of task.dependencies) {
                if (graph.has(depId)) {
                    graph.get(depId).push(task.id);
                    inDegree.set(task.id, inDegree.get(task.id) + 1);
                }
            }
        }
        
        const queue = [];
        for (const [taskId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(taskId);
            }
        }
        
        const result = [];
        while (queue.length > 0) {
            const taskId = queue.shift();
            result.push(taskId);
            
            for (const dependentId of graph.get(taskId)) {
                inDegree.set(dependentId, inDegree.get(dependentId) - 1);
                if (inDegree.get(dependentId) === 0) {
                    queue.push(dependentId);
                }
            }
        }
        
        if (result.length !== tasks.length) {
            throw new Error('Cannot create topological sort due to circular dependencies');
        }
        
        return result.map(taskId => this.taskManager.getTask(taskId, tag));
    }

    getReadyTasks(tag = null) {
        const tasks = this.taskManager.getAllTasks(tag);
        const readyTasks = [];
        
        for (const task of tasks) {
            if (task.status === 'pending' || task.status === 'in-progress') {
                const dependencies = this.getDependencies(task.id);
                const allDependenciesComplete = dependencies.every(dep => 
                    dep.status === 'done' || dep.status === 'cancelled'
                );
                
                if (allDependenciesComplete) {
                    readyTasks.push({
                        task,
                        priority: this.calculateTaskPriority(task),
                        urgency: this.calculateTaskUrgency(task)
                    });
                }
            }
        }
        
        return readyTasks.sort((a, b) => {
            if (a.urgency !== b.urgency) return b.urgency - a.urgency;
            if (a.priority !== b.priority) return b.priority - a.priority;
            return a.task.id.localeCompare(b.task.id);
        }).map(item => item.task);
    }

    calculateTaskPriority(task) {
        const priorityValues = { low: 1, medium: 2, high: 3, critical: 4 };
        return priorityValues[task.priority] || 2;
    }

    calculateTaskUrgency(task) {
        let urgency = 0;
        
        if (task.dueDate) {
            const now = new Date();
            const dueDate = new Date(task.dueDate);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDue < 0) urgency += 10;
            else if (daysUntilDue <= 1) urgency += 8;
            else if (daysUntilDue <= 3) urgency += 6;
            else if (daysUntilDue <= 7) urgency += 4;
        }
        
        const dependents = this.getDependents(task.id);
        urgency += dependents.length;
        
        return urgency;
    }

    getDependencyChain(taskId) {
        const chain = [];
        const visited = new Set();
        
        const buildChain = (currentId) => {
            if (visited.has(currentId)) {
                return;
            }
            
            visited.add(currentId);
            const dependencies = this.getDependencies(currentId);
            
            for (const dep of dependencies) {
                buildChain(dep.id);
                chain.push({
                    from: dep.id,
                    to: currentId,
                    fromTask: dep.task,
                    toTask: this.taskManager.getTask(currentId),
                    status: dep.status
                });
            }
        };
        
        buildChain(taskId);
        return chain;
    }

    analyzeDependencyImpact(taskId) {
        const task = this.taskManager.getTask(taskId);
        if (!task) {
            return null;
        }
        
        const dependents = this.getDependents(taskId);
        const directlyAffected = dependents.length;
        
        const getAllAffected = (id, affected = new Set()) => {
            if (affected.has(id)) {
                return affected;
            }
            
            affected.add(id);
            const deps = this.getDependents(id);
            
            for (const dep of deps) {
                getAllAffected(dep.id, affected);
            }
            
            return affected;
        };
        
        const allAffected = getAllAffected(taskId);
        allAffected.delete(taskId);
        
        return {
            task,
            directlyAffected,
            totalAffected: allAffected.size,
            affectedTasks: Array.from(allAffected).map(id => this.taskManager.getTask(id)),
            criticalPath: this.isOnCriticalPath(taskId),
            riskLevel: this.calculateRiskLevel(directlyAffected, allAffected.size)
        };
    }

    isOnCriticalPath(taskId) {
        const longestPath = this.findLongestPath();
        return longestPath.includes(taskId);
    }

    findLongestPath() {
        const sortedTasks = this.getTopologicalSort();
        const distances = new Map();
        const previous = new Map();
        
        for (const task of sortedTasks) {
            distances.set(task.id, 0);
        }
        
        for (const task of sortedTasks) {
            const deps = this.getDependencies(task.id);
            for (const dep of deps) {
                const newDistance = distances.get(dep.id) + 1;
                if (newDistance > distances.get(task.id)) {
                    distances.set(task.id, newDistance);
                    previous.set(task.id, dep.id);
                }
            }
        }
        
        let maxDistance = 0;
        let endTask = null;
        
        for (const [taskId, distance] of distances.entries()) {
            if (distance > maxDistance) {
                maxDistance = distance;
                endTask = taskId;
            }
        }
        
        const path = [];
        let current = endTask;
        
        while (current) {
            path.unshift(current);
            current = previous.get(current);
        }
        
        return path;
    }

    calculateRiskLevel(directlyAffected, totalAffected) {
        if (totalAffected >= 10) return 'critical';
        if (totalAffected >= 5) return 'high';
        if (totalAffected >= 2) return 'medium';
        return 'low';
    }

    visualizeDependencies(taskId, format = 'ascii') {
        switch (format.toLowerCase()) {
            case 'ascii':
                return this.generateASCIIGraph(taskId);
            case 'json':
                return this.generateJSONGraph(taskId);
            case 'dot':
                return this.generateDOTGraph(taskId);
            default:
                throw new Error(`Unsupported visualization format: ${format}`);
        }
    }

    generateASCIIGraph(taskId) {
        const visited = new Set();
        const lines = [];
        
        const traverse = (currentId, prefix = '', isLast = true) => {
            if (visited.has(currentId)) {
                lines.push(`${prefix}${isLast ? '└── ' : '├── '}${currentId} (already shown)`);
                return;
            }
            
            visited.add(currentId);
            const task = this.taskManager.getTask(currentId);
            const statusIcon = this.getStatusIcon(task?.status || 'unknown');
            lines.push(`${prefix}${isLast ? '└── ' : '├── '}${statusIcon} ${currentId}: ${task?.title || 'Unknown'}`);
            
            const dependencies = this.getDependencies(currentId);
            if (dependencies.length > 0) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                dependencies.forEach((dep, index) => {
                    const isLastDep = index === dependencies.length - 1;
                    traverse(dep.id, newPrefix, isLastDep);
                });
            }
        };
        
        traverse(taskId);
        return lines.join('\n');
    }

    generateJSONGraph(taskId) {
        const visited = new Set();
        
        const buildGraph = (currentId) => {
            if (visited.has(currentId)) {
                return { id: currentId, circular: true };
            }
            
            visited.add(currentId);
            const task = this.taskManager.getTask(currentId);
            const dependencies = this.getDependencies(currentId);
            
            return {
                id: currentId,
                title: task?.title || 'Unknown',
                status: task?.status || 'unknown',
                dependencies: dependencies.map(dep => buildGraph(dep.id))
            };
        };
        
        return JSON.stringify(buildGraph(taskId), null, 2);
    }

    generateDOTGraph(taskId) {
        const visited = new Set();
        const edges = [];
        const nodes = [];
        
        const traverse = (currentId) => {
            if (visited.has(currentId)) {
                return;
            }
            
            visited.add(currentId);
            const task = this.taskManager.getTask(currentId);
            const statusColor = this.getStatusColor(task?.status || 'unknown');
            
            nodes.push(`  "${currentId}" [label="${currentId}\\n${task?.title || 'Unknown'}" fillcolor="${statusColor}" style="filled"];`);
            
            const dependencies = this.getDependencies(currentId);
            for (const dep of dependencies) {
                edges.push(`  "${dep.id}" -> "${currentId}";`);
                traverse(dep.id);
            }
        };
        
        traverse(taskId);
        
        return [
            'digraph TaskDependencies {',
            '  node [shape=box];',
            ...nodes,
            ...edges,
            '}'
        ].join('\n');
    }

    getStatusIcon(status) {
        const icons = {
            'pending': '⏳',
            'in-progress': '🔄',
            'blocked': '🚫',
            'review': '👀',
            'done': '✅',
            'deferred': '⏸️',
            'cancelled': '❌',
            'unknown': '❓'
        };
        return icons[status] || '❓';
    }

    getStatusColor(status) {
        const colors = {
            'pending': 'lightgray',
            'in-progress': 'lightblue',
            'blocked': 'salmon',
            'review': 'yellow',
            'done': 'lightgreen',
            'deferred': 'orange',
            'cancelled': 'red',
            'unknown': 'white'
        };
        return colors[status] || 'white';
    }

    async cleanup() {
        this.removeAllListeners();
        this.dependencyGraph.clear();
        this.initialized = false;
    }
}

export default TaskDependencyManager;