/**
 * SA Expand Task Tool
 * AI-powered task expansion - break down high-level tasks into subtasks
 */

export const saExpandTask = {
  name: 'sa_expand_task',
  description: 'AI-powered task expansion to break down high-level tasks into detailed subtasks',
  category: 'task-master',
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
        description: 'ID of the task to expand into subtasks'
      },
      numSubtasks: {
        type: 'number',
        description: 'Number of subtasks to generate (default: auto-determine)',
        minimum: 2,
        maximum: 20
      },
      tasksFile: {
        type: 'string',
        description: 'Path to tasks file (optional, will use project tasks.json)'
      },
      useResearch: {
        type: 'boolean',
        description: 'Enable AI research mode for enhanced subtask generation',
        default: false
      },
      force: {
        type: 'boolean',
        description: 'Force expansion even if subtasks already exist',
        default: false
      },
      contextPrompt: {
        type: 'string',
        description: 'Additional context or specific requirements for subtask generation'
      },
      skillLevel: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced'],
        description: 'Target skill level for subtask complexity',
        default: 'intermediate'
      }
    },
    required: ['projectRoot', 'taskId']
  },
  
  async execute({ projectRoot, taskId, numSubtasks, tasksFile, useResearch = false, force = false, contextPrompt, skillLevel = 'intermediate' }) {
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
      
      // Find the task to expand
      const task = tasksData.tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Check if task already has subtasks
      if (task.subtasks && task.subtasks.length > 0 && !force) {
        return {
          content: [{
            type: 'text',
            text: `Task "${task.title}" already has ${task.subtasks.length} subtasks. Use force=true to regenerate subtasks.`
          }],
          metadata: {
            taskId,
            existingSubtasks: task.subtasks.length,
            requiresForce: true
          }
        };
      }
      
      // Generate subtasks using AI
      const generatedSubtasks = await this.generateSubtasks(task, {
        numSubtasks,
        useResearch,
        contextPrompt,
        skillLevel,
        projectContext: tasksData.metadata
      });
      
      // Update task with new subtasks
      task.subtasks = generatedSubtasks;
      task.updated_at = new Date().toISOString();
      
      // Update metadata
      if (!tasksData.metadata) {
        tasksData.metadata = {};
      }
      tasksData.metadata.lastExpanded = {
        taskId,
        expandedAt: new Date().toISOString(),
        subtasksGenerated: generatedSubtasks.length
      };
      
      // Save updated tasks
      await fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Generate summary
      const summary = this.generateExpansionSummary(task, generatedSubtasks);
      
      return {
        content: [{
          type: 'text',
          text: `Successfully expanded task "${task.title}" into ${generatedSubtasks.length} subtasks\\n\\n${summary}`
        }],
        metadata: {
          taskId,
          taskTitle: task.title,
          subtasksGenerated: generatedSubtasks.length,
          skillLevel,
          useResearch,
          expandedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error expanding task: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'task_expansion_error'
        }
      };
    }
  },
  
  async generateSubtasks(task, options) {
    const { numSubtasks, useResearch, contextPrompt, skillLevel, projectContext } = options;
    
    // Create AI prompt for task expansion
    const prompt = this.buildTaskExpansionPrompt(task, {
      numSubtasks,
      skillLevel,
      contextPrompt,
      projectContext,
      useResearch
    });
    
    try {
      // Use AI provider to generate subtasks
      const aiResponse = await this.callAIProvider(prompt, useResearch);
      
      // Parse AI response and extract subtasks
      const subtasks = this.parseAIResponse(aiResponse);
      
      // Validate and structure subtasks
      const structuredSubtasks = this.structureSubtasks(subtasks, task.id);
      
      return structuredSubtasks;
      
    } catch (error) {
      console.warn('AI provider failed, using template-based expansion:', error.message);
      return this.generateSubtasksFromTemplate(task, options);
    }
  },
  
  buildTaskExpansionPrompt(task, options) {
    const { numSubtasks, skillLevel, contextPrompt, projectContext, useResearch } = options;
    
    const skillInstructions = {
      beginner: 'Create simple, clearly defined subtasks that are easy to understand and execute. Provide detailed step-by-step guidance.',
      intermediate: 'Create moderately complex subtasks that assume some technical knowledge. Balance detail with autonomy.',
      advanced: 'Create sophisticated subtasks that assume high technical competency. Focus on outcomes rather than detailed steps.'
    };
    
    const researchNote = useResearch ? 'Consider current industry best practices, latest technologies, and proven methodologies.' : '';
    
    let prompt = `You are an expert project manager breaking down a high-level task into actionable subtasks.

**Parent Task Information:**
- **ID:** ${task.id}
- **Title:** ${task.title}
- **Description:** ${task.description}
- **Priority:** ${task.priority}
- **Effort Level:** ${task.effort}/5
- **Estimated Hours:** ${task.estimated_hours || 'Not specified'}
- **Skills Required:** ${task.skills?.join(', ') || 'Not specified'}
- **Acceptance Criteria:** ${task.acceptance_criteria?.join(' | ') || 'Not specified'}

**Project Context:**
${projectContext ? `- Project: ${projectContext.projectName || 'Unknown'}
- Generated: ${projectContext.generatedAt || 'Unknown'}
- Complexity: ${projectContext.complexity || 'Medium'}` : 'No additional context available'}

**Expansion Parameters:**
- Target skill level: ${skillLevel}
- ${skillInstructions[skillLevel]}
- ${numSubtasks ? `Generate exactly ${numSubtasks} subtasks` : 'Generate an appropriate number of subtasks (4-8 recommended)'}
- ${researchNote}

${contextPrompt ? `**Additional Context:**
${contextPrompt}` : ''}

**Subtask Requirements:**
1. Break down the parent task into logical, sequential subtasks
2. Each subtask should be independently executable
3. Maintain clear dependencies between subtasks
4. Ensure subtasks collectively accomplish the parent task
5. Provide realistic time estimates
6. Include specific acceptance criteria for each subtask

**Output Format:**
Return a JSON array of subtasks with this structure:
[
  {
    "id": "${task.id}.1",
    "title": "Subtask Title (max 60 chars)",
    "description": "Detailed description (150-400 words)",
    "priority": "high|medium|low",
    "effort": 1-5,
    "estimated_hours": 8,
    "skills": ["skill1", "skill2"],
    "dependencies": ["${task.id}.previous-subtask-id"],
    "acceptance_criteria": ["criteria 1", "criteria 2"],
    "notes": "Any specific implementation notes or considerations"
  }
]

**Guidelines:**
- Subtask IDs should follow pattern: ${task.id}.1, ${task.id}.2, etc.
- First subtask typically has no dependencies within the group
- Later subtasks may depend on earlier ones
- Total estimated hours of subtasks should roughly equal parent task hours
- Maintain or slightly increase the detail level from parent task
- Consider different skill sets that might be needed

Generate the subtasks now:`;
    
    return prompt;
  },
  
  async callAIProvider(prompt, useResearch = false) {
    try {
      // Check if we have AI provider configuration
      const aiConfig = await this.loadAIConfig();
      
      if (!aiConfig || !aiConfig.provider) {
        throw new Error('No AI provider configured');
      }
      
      // Make AI request (simplified implementation)
      const response = await this.makeAIRequest(prompt, aiConfig, useResearch);
      return response;
      
    } catch (error) {
      throw error;
    }
  },
  
  async loadAIConfig() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Try to load from sa-engine config
      const configPath = path.join(process.cwd(), 'sa-engine', 'config', 'ai-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      // Try environment variables
      if (process.env.OPENAI_API_KEY) {
        return {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4'
        };
      }
      if (process.env.ANTHROPIC_API_KEY) {
        return {
          provider: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-sonnet-20240229'
        };
      }
      return null;
    }
  },
  
  async makeAIRequest(prompt, config, useResearch) {
    // This would be implemented with actual AI provider SDKs
    // For now, throw error to use template fallback
    throw new Error('AI provider not implemented');
  },
  
  generateSubtasksFromTemplate(task, options) {
    const { numSubtasks = 5, skillLevel } = options;
    
    // Template-based subtask generation based on common patterns
    const subtaskTemplates = {
      planning: [
        'Requirements Analysis',
        'Technical Specification',
        'Resource Planning',
        'Risk Assessment',
        'Timeline Creation'
      ],
      design: [
        'Research and Discovery',
        'Concept Development', 
        'Detailed Design',
        'Design Review',
        'Design Documentation'
      ],
      implementation: [
        'Setup and Configuration',
        'Core Implementation',
        'Feature Development',
        'Integration',
        'Testing and Validation'
      ],
      testing: [
        'Test Planning',
        'Test Case Development',
        'Test Environment Setup',
        'Test Execution',
        'Bug Fixing and Retesting'
      ]
    };
    
    // Determine task type based on title and description
    const taskType = this.determineTaskType(task);
    const templates = subtaskTemplates[taskType] || subtaskTemplates.implementation;
    
    // Generate subtasks based on templates
    const subtasks = [];
    const maxSubtasks = Math.min(numSubtasks, templates.length);
    
    for (let i = 0; i < maxSubtasks; i++) {
      const subtask = {
        id: `${task.id}.${i + 1}`,
        title: templates[i],
        description: this.generateSubtaskDescription(templates[i], task, skillLevel),
        priority: this.deriveSubtaskPriority(task.priority, i, maxSubtasks),
        effort: this.calculateSubtaskEffort(task.effort, maxSubtasks, i),
        estimated_hours: Math.round((task.estimated_hours || 20) / maxSubtasks),
        skills: this.deriveSubtaskSkills(task.skills, templates[i]),
        dependencies: i > 0 ? [`${task.id}.${i}`] : [],
        acceptance_criteria: this.generateAcceptanceCriteria(templates[i], skillLevel),
        notes: `Subtask generated from parent task: ${task.title}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      subtasks.push(subtask);
    }
    
    return subtasks;
  },
  
  determineTaskType(task) {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    const text = title + ' ' + description;
    
    if (text.includes('plan') || text.includes('analysis') || text.includes('requirement')) {
      return 'planning';
    }
    if (text.includes('design') || text.includes('architecture') || text.includes('ui') || text.includes('ux')) {
      return 'design';
    }
    if (text.includes('test') || text.includes('qa') || text.includes('quality')) {
      return 'testing';
    }
    return 'implementation';
  },
  
  generateSubtaskDescription(templateName, parentTask, skillLevel) {
    const descriptions = {
      'Requirements Analysis': {
        beginner: 'Review and document all requirements for this task. Create a detailed list of what needs to be accomplished, including functional and non-functional requirements. Gather clarifications from stakeholders if needed.',
        intermediate: 'Analyze requirements thoroughly, identify gaps or ambiguities, and create comprehensive requirement specifications. Consider edge cases and integration points.',
        advanced: 'Conduct deep requirements analysis including stakeholder mapping, requirement prioritization, and feasibility assessment. Define acceptance criteria and success metrics.'
      },
      'Technical Specification': {
        beginner: 'Create a simple technical plan outlining the approach, tools, and steps needed to complete the task. Include basic architecture decisions and technology choices.',
        intermediate: 'Develop detailed technical specifications including system design, API definitions, data models, and implementation approach with consideration for scalability and maintainability.',
        advanced: 'Architect comprehensive technical solution with detailed specifications, performance considerations, security implications, and integration patterns. Include technical trade-offs and decision rationale.'
      },
      'Setup and Configuration': {
        beginner: 'Set up the development environment, install necessary tools and dependencies, and configure basic project structure following provided guidelines.',
        intermediate: 'Configure development environment with appropriate tooling, set up build processes, configure testing frameworks, and establish code quality tools.',
        advanced: 'Establish sophisticated development environment with automated tooling, CI/CD pipeline configuration, advanced debugging setup, and performance monitoring tools.'
      },
      'Core Implementation': {
        beginner: 'Implement the main functionality following the technical specification. Focus on getting the core features working correctly with proper error handling.',
        intermediate: 'Develop core functionality with attention to code quality, performance, and maintainability. Implement proper abstraction layers and follow design patterns.',
        advanced: 'Architect and implement sophisticated core functionality with advanced patterns, optimization strategies, and extensibility considerations. Focus on scalable and maintainable solutions.'
      }
    };
    
    const defaultDescription = `Complete the "${templateName}" phase of the parent task: ${parentTask.title}. This involves systematic work to ensure the overall objective is met with high quality standards.`;
    
    return descriptions[templateName]?.[skillLevel] || defaultDescription;
  },
  
  deriveSubtaskPriority(parentPriority, index, totalSubtasks) {
    // First few subtasks inherit parent priority, later ones can be lower
    if (index < totalSubtasks / 2) {
      return parentPriority;
    }
    
    const priorityMap = { high: 'medium', medium: 'medium', low: 'low' };
    return priorityMap[parentPriority] || 'medium';
  },
  
  calculateSubtaskEffort(parentEffort, totalSubtasks, index) {
    // Distribute effort across subtasks with some variation
    const baseEffort = Math.max(1, Math.round(parentEffort / 2));
    const variation = index % 2 === 0 ? 0 : 1; // Alternate between base and base+1
    return Math.min(5, baseEffort + variation);
  },
  
  deriveSubtaskSkills(parentSkills, templateName) {
    const skillMap = {
      'Requirements Analysis': ['analysis', 'documentation', 'communication'],
      'Technical Specification': ['architecture', 'design', 'technical-writing'],
      'Setup and Configuration': ['configuration', 'tools', 'environment-setup'],
      'Core Implementation': ['development', 'programming', 'problem-solving'],
      'Feature Development': ['development', 'programming', 'testing'],
      'Testing and Validation': ['testing', 'qa', 'validation'],
      'Design Review': ['review', 'analysis', 'quality-assurance'],
      'Documentation': ['documentation', 'technical-writing', 'communication']
    };
    
    const templateSkills = skillMap[templateName] || ['development'];
    const combinedSkills = [...(parentSkills || []), ...templateSkills];
    
    // Remove duplicates and limit to 3-4 skills
    return [...new Set(combinedSkills)].slice(0, 4);
  },
  
  generateAcceptanceCriteria(templateName, skillLevel) {
    const criteriaMap = {
      'Requirements Analysis': [
        'All requirements are clearly documented',
        'Stakeholder sign-off obtained',
        'Requirements are testable and measurable'
      ],
      'Technical Specification': [
        'Technical approach is well-defined',
        'Architecture decisions are documented',
        'Specification is reviewed and approved'
      ],
      'Setup and Configuration': [
        'Development environment is properly configured',
        'All dependencies are installed and working',
        'Configuration is documented and repeatable'
      ],
      'Core Implementation': [
        'Core functionality is implemented and working',
        'Code follows established standards',
        'Basic testing is completed'
      ]
    };
    
    const defaultCriteria = [
      'Task objectives are fully met',
      'Quality standards are maintained',
      'Documentation is updated as needed'
    ];
    
    return criteriaMap[templateName] || defaultCriteria;
  },
  
  parseAIResponse(aiResponse) {
    // If aiResponse is already an array, return it
    if (Array.isArray(aiResponse)) {
      return aiResponse;
    }
    
    // Try to parse as JSON
    try {
      if (typeof aiResponse === 'string') {
        // Look for JSON array in the response
        const jsonMatch = aiResponse.match(/\\[[\\s\\S]*\\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // Try parsing the entire response
        return JSON.parse(aiResponse);
      }
      
      return aiResponse;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  },
  
  structureSubtasks(subtasks, parentTaskId) {
    const currentTime = new Date().toISOString();
    
    return subtasks.map((subtask, index) => ({
      id: subtask.id || `${parentTaskId}.${index + 1}`,
      title: subtask.title || `Subtask ${index + 1}`,
      description: subtask.description || 'No description provided',
      status: 'pending',
      priority: this.validatePriority(subtask.priority),
      effort: this.validateEffort(subtask.effort),
      estimated_hours: subtask.estimated_hours || 8,
      skills: Array.isArray(subtask.skills) ? subtask.skills : [],
      dependencies: Array.isArray(subtask.dependencies) ? subtask.dependencies : [],
      acceptance_criteria: Array.isArray(subtask.acceptance_criteria) ? subtask.acceptance_criteria : [],
      notes: subtask.notes || '',
      created_at: currentTime,
      updated_at: currentTime,
      assignee: null,
      tags: []
    }));
  },
  
  validatePriority(priority) {
    const validPriorities = ['high', 'medium', 'low'];
    return validPriorities.includes(priority) ? priority : 'medium';
  },
  
  validateEffort(effort) {
    const numEffort = Number(effort);
    if (isNaN(numEffort) || numEffort < 1 || numEffort > 5) {
      return 3;
    }
    return Math.round(numEffort);
  },
  
  generateExpansionSummary(task, subtasks) {
    const totalHours = subtasks.reduce((sum, subtask) => sum + (subtask.estimated_hours || 0), 0);
    const priorities = { high: 0, medium: 0, low: 0 };
    const avgEffort = subtasks.reduce((sum, subtask) => sum + (subtask.effort || 0), 0) / subtasks.length;
    
    subtasks.forEach(subtask => {
      priorities[subtask.priority]++;
    });
    
    let summary = `## Task Expansion Summary\\n\\n`;
    summary += `**Parent Task:** ${task.title}\\n`;
    summary += `**Subtasks Generated:** ${subtasks.length}\\n`;
    summary += `**Total Estimated Hours:** ${totalHours}\\n`;
    summary += `**Average Effort Level:** ${avgEffort.toFixed(1)}/5\\n\\n`;
    
    summary += `**Priority Distribution:**\\n`;
    summary += `- High: ${priorities.high} subtasks\\n`;
    summary += `- Medium: ${priorities.medium} subtasks\\n`;
    summary += `- Low: ${priorities.low} subtasks\\n\\n`;
    
    summary += `**Generated Subtasks:**\\n`;
    subtasks.forEach((subtask, index) => {
      summary += `${index + 1}. **${subtask.title}** (${subtask.priority} priority, ${subtask.estimated_hours}h)\\n`;
      summary += `   ${subtask.description.substring(0, 100)}${subtask.description.length > 100 ? '...' : ''}\\n`;
    });
    
    return summary;
  }
};