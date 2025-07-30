import Joi from 'joi';

class TaskSchema {
    static getTaskSchema() {
        return Joi.object({
            id: Joi.string().required().description('Hierarchical task ID (e.g., "1", "1.2", "1.2.3")'),
            title: Joi.string().required().min(1).max(200).description('Brief, descriptive title'),
            description: Joi.string().required().min(1).max(1000).description('Detailed description of the task'),
            status: Joi.string().valid(
                'pending',
                'in-progress', 
                'blocked',
                'review',
                'done',
                'deferred',
                'cancelled'
            ).default('pending').description('Current task status'),
            priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium').description('Task priority level'),
            complexity: Joi.number().integer().min(1).max(10).optional().description('Task complexity score (1-10)'),
            type: Joi.string().valid(
                'feature',
                'bug',
                'enhancement',
                'documentation',
                'infrastructure',
                'research',
                'maintenance',
                'refactor'
            ).default('feature').description('Type of task'),
            
            dependencies: Joi.array().items(Joi.string()).default([]).description('Array of task IDs this task depends on'),
            blockedBy: Joi.array().items(Joi.string()).default([]).description('Array of task IDs blocking this task'),
            blocks: Joi.array().items(Joi.string()).default([]).description('Array of task IDs this task blocks'),
            
            assignee: Joi.object({
                type: Joi.string().valid('agent', 'human', 'team').default('agent'),
                id: Joi.string().optional().description('Agent ID, user ID, or team ID'),
                name: Joi.string().optional().description('Display name of assignee')
            }).optional().description('Task assignee information'),
            
            owner: Joi.object({
                type: Joi.string().valid('agent', 'human', 'team').default('human'),
                id: Joi.string().optional(),
                name: Joi.string().optional()
            }).optional().description('Task owner information'),
            
            metadata: Joi.object({
                created: Joi.date().default(Date.now).description('Task creation timestamp'),
                modified: Joi.date().default(Date.now).description('Last modification timestamp'),
                createdBy: Joi.object({
                    type: Joi.string().valid('agent', 'human', 'system').default('system'),
                    id: Joi.string().optional(),
                    name: Joi.string().optional()
                }).optional(),
                modifiedBy: Joi.object({
                    type: Joi.string().valid('agent', 'human', 'system').default('system'),
                    id: Joi.string().optional(),
                    name: Joi.string().optional()
                }).optional(),
                version: Joi.string().default('1.0.0').description('Task schema version'),
                framework: Joi.string().default('super-agents').description('Framework identifier'),
                source: Joi.string().optional().description('Source system or process that created the task')
            }).default({}),
            
            details: Joi.string().optional().description('Detailed implementation instructions'),
            notes: Joi.string().optional().description('Additional notes and observations'),
            context: Joi.object().optional().description('Additional context data'),
            
            testStrategy: Joi.string().optional().description('How to verify task completion'),
            acceptanceCriteria: Joi.array().items(Joi.string()).default([]).description('Specific criteria for task completion'),
            
            tags: Joi.array().items(Joi.string()).default([]).description('Categorization tags'),
            labels: Joi.array().items(Joi.string()).default([]).description('Additional labels for organization'),
            
            estimatedHours: Joi.number().positive().optional().description('Estimated hours to complete'),
            actualHours: Joi.number().positive().optional().description('Actual hours spent'),
            
            dueDate: Joi.date().optional().description('Task due date'),
            startDate: Joi.date().optional().description('Task start date'),
            completedDate: Joi.date().optional().description('Task completion date'),
            
            subtasks: Joi.array().items(Joi.link('#task')).default([]).description('Array of subtasks'),
            
            workflow: Joi.object({
                stage: Joi.string().optional().description('Current workflow stage'),
                phases: Joi.array().items(Joi.object({
                    name: Joi.string().required(),
                    status: Joi.string().valid('pending', 'in-progress', 'completed', 'skipped').default('pending'),
                    startDate: Joi.date().optional(),
                    endDate: Joi.date().optional()
                })).default([]).description('Workflow phases')
            }).optional(),
            
            resources: Joi.object({
                files: Joi.array().items(Joi.string()).default([]).description('Related files'),
                urls: Joi.array().items(Joi.string().uri()).default([]).description('Related URLs'),
                documents: Joi.array().items(Joi.string()).default([]).description('Related documents'),
                tools: Joi.array().items(Joi.string()).default([]).description('Required tools')
            }).default({}),
            
            bmadIntegration: Joi.object({
                templateUsed: Joi.string().optional().description('BMAD template used'),
                elicitationRequired: Joi.boolean().default(false).description('Whether elicitation is required'),
                checklistsUsed: Joi.array().items(Joi.string()).default([]).description('BMAD checklists used'),
                workflowUsed: Joi.string().optional().description('BMAD workflow used')
            }).optional(),
            
            taskMasterIntegration: Joi.object({
                originalId: Joi.alternatives().try(Joi.number(), Joi.string()).optional().description('Original Task Master ID'),
                expansionLevel: Joi.number().integer().min(0).default(0).description('How many times expanded'),
                complexityScore: Joi.number().min(1).max(10).optional().description('Task Master complexity score'),
                researchMode: Joi.boolean().default(false).description('Whether research mode was used')
            }).optional()
        }).id('task');
    }

    static getTaskCollectionSchema() {
        return Joi.object({
            metadata: Joi.object({
                version: Joi.string().default('1.0.0'),
                created: Joi.date().default(Date.now),
                modified: Joi.date().default(Date.now),
                framework: Joi.string().default('super-agents'),
                totalTasks: Joi.number().integer().min(0).default(0),
                maxDepth: Joi.number().integer().min(0).default(0)
            }).default({}),
            
            configuration: Joi.object({
                taggedLists: Joi.boolean().default(true).description('Whether to use tagged task lists'),
                defaultTag: Joi.string().default('main').description('Default tag for new tasks'),
                statusTransitions: Joi.object().pattern(
                    Joi.string(),
                    Joi.array().items(Joi.string())
                ).default({
                    'pending': ['in-progress', 'deferred', 'cancelled'],
                    'in-progress': ['blocked', 'review', 'done', 'deferred', 'cancelled'],
                    'blocked': ['in-progress', 'deferred', 'cancelled'],
                    'review': ['in-progress', 'done', 'deferred'],
                    'done': [],
                    'deferred': ['pending', 'cancelled'],
                    'cancelled': []
                }).description('Valid status transitions'),
                autoNumbering: Joi.boolean().default(true).description('Auto-generate hierarchical IDs'),
                dependencyValidation: Joi.boolean().default(true).description('Validate dependencies')
            }).default({}),
            
            tags: Joi.object().pattern(
                Joi.string(),
                Joi.object({
                    name: Joi.string().required(),
                    description: Joi.string().optional(),
                    tasks: Joi.array().items(this.getTaskSchema()).default([]),
                    metadata: Joi.object({
                        created: Joi.date().default(Date.now),
                        modified: Joi.date().default(Date.now),
                        taskCount: Joi.number().integer().min(0).default(0)
                    }).default({})
                })
            ).default({
                main: {
                    name: 'Main Tasks',
                    description: 'Primary task list',
                    tasks: [],
                    metadata: {
                        created: new Date(),
                        modified: new Date(),
                        taskCount: 0
                    }
                }
            })
        });
    }

    static validateTask(taskData) {
        const schema = this.getTaskSchema();
        const { error, value } = schema.validate(taskData, { 
            allowUnknown: false,
            stripUnknown: true,
            abortEarly: false
        });
        
        if (error) {
            throw new Error(`Task validation failed: ${error.details.map(d => d.message).join(', ')}`);
        }
        
        return value;
    }

    static validateTaskCollection(collectionData) {
        const schema = this.getTaskCollectionSchema();
        const { error, value } = schema.validate(collectionData, {
            allowUnknown: false,
            stripUnknown: true,
            abortEarly: false
        });
        
        if (error) {
            throw new Error(`Task collection validation failed: ${error.details.map(d => d.message).join(', ')}`);
        }
        
        return value;
    }

    static getStatusTransitions() {
        return {
            'pending': ['in-progress', 'deferred', 'cancelled'],
            'in-progress': ['blocked', 'review', 'done', 'deferred', 'cancelled'],
            'blocked': ['in-progress', 'deferred', 'cancelled'],
            'review': ['in-progress', 'done', 'deferred'],
            'done': [],
            'deferred': ['pending', 'cancelled'],
            'cancelled': []
        };
    }

    static isValidStatusTransition(fromStatus, toStatus) {
        const transitions = this.getStatusTransitions();
        return transitions[fromStatus]?.includes(toStatus) || false;
    }

    static generateTaskId(parentId = null, existingIds = []) {
        if (!parentId) {
            let id = 1;
            while (existingIds.includes(id.toString())) {
                id++;
            }
            return id.toString();
        }
        
        const parts = parentId.split('.');
        const prefix = parentId + '.';
        let subId = 1;
        
        while (existingIds.includes(prefix + subId)) {
            subId++;
        }
        
        return prefix + subId;
    }

    static parseTaskId(taskId) {
        const parts = taskId.split('.');
        return {
            parts,
            depth: parts.length,
            parentId: parts.length > 1 ? parts.slice(0, -1).join('.') : null,
            rootId: parts[0],
            leafId: parts[parts.length - 1]
        };
    }

    static createEmptyTask(overrides = {}) {
        const defaultTask = {
            id: '',
            title: '',
            description: '',
            status: 'pending',
            priority: 'medium',
            type: 'feature',
            dependencies: [],
            blockedBy: [],
            blocks: [],
            metadata: {
                created: new Date(),
                modified: new Date(),
                version: '1.0.0',
                framework: 'super-agents'
            },
            tags: [],
            labels: [],
            acceptanceCriteria: [],
            subtasks: [],
            resources: {
                files: [],
                urls: [],
                documents: [],
                tools: []
            }
        };
        
        return { ...defaultTask, ...overrides };
    }

    static createEmptyTaskCollection() {
        return {
            metadata: {
                version: '1.0.0',
                created: new Date(),
                modified: new Date(),
                framework: 'super-agents',
                totalTasks: 0,
                maxDepth: 0
            },
            configuration: {
                taggedLists: true,
                defaultTag: 'main',
                statusTransitions: this.getStatusTransitions(),
                autoNumbering: true,
                dependencyValidation: true
            },
            tags: {
                main: {
                    name: 'Main Tasks',
                    description: 'Primary task list',
                    tasks: [],
                    metadata: {
                        created: new Date(),
                        modified: new Date(),
                        taskCount: 0
                    }
                }
            }
        };
    }
}

export default TaskSchema;