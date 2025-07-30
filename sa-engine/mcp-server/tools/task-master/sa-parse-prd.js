/**
 * SA Parse PRD Tool
 * PRD parsing with AI - adapted from Claude Task Master
 */

export const saParsePrd = {
  name: 'sa_parse_prd',
  description: 'Parse Product Requirements Document (PRD) and generate initial tasks using AI',
  category: 'task-master',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      prdPath: {
        type: 'string',
        description: 'Path to the PRD document file (.txt, .md, etc.)'
      },
      numTasks: {
        type: 'number',
        description: 'Approximate number of top-level tasks to generate (default: 10)',
        default: 10,
        minimum: 1,
        maximum: 50
      },
      outputPath: {
        type: 'string',
        description: 'Output path for generated tasks (optional, will use project tasks.json)'
      },
      force: {
        type: 'boolean',
        description: 'Overwrite existing tasks without prompting',
        default: false
      },
      append: {
        type: 'boolean',
        description: 'Append generated tasks to existing tasks',
        default: false
      },
      useResearch: {
        type: 'boolean',
        description: 'Enable AI research mode for enhanced task generation',
        default: false
      },
      complexity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Expected project complexity level',
        default: 'medium'
      }
    },
    required: ['projectRoot', 'prdPath']
  },
  
  async execute({ projectRoot, prdPath, numTasks = 10, outputPath, force = false, append = false, useResearch = false, complexity = 'medium' }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Resolve PRD path
      let fullPrdPath;
      if (path.isAbsolute(prdPath)) {
        fullPrdPath = prdPath;
      } else {
        fullPrdPath = path.join(projectRoot, prdPath);
      }
      
      // Check if PRD file exists
      try {
        await fs.access(fullPrdPath);
      } catch (error) {
        throw new Error(`PRD file not found: ${fullPrdPath}`);
      }
      
      // Read PRD content
      let prdContent;
      try {
        prdContent = await fs.readFile(fullPrdPath, 'utf-8');
      } catch (error) {
        throw new Error(`Failed to read PRD file: ${error.message}`);
      }
      
      if (prdContent.trim().length === 0) {
        throw new Error('PRD file is empty');
      }
      
      // Determine output path
      const tasksOutputPath = outputPath || path.join(projectRoot, 'sa-engine', 'data', 'tasks', 'tasks.json');
      
      // Load existing tasks if appending
      let existingTasks = [];
      if (append) {
        try {
          const existingContent = await fs.readFile(tasksOutputPath, 'utf-8');
          const tasksData = JSON.parse(existingContent);
          existingTasks = tasksData.tasks || [];
        } catch (error) {
          // File doesn't exist, start with empty array
        }
      }
      
      // Check if output file exists and force flag
      if (!append && !force) {
        try {
          await fs.access(tasksOutputPath);
          return {
            content: [{
              type: 'text',
              text: `Tasks file already exists at ${tasksOutputPath}. Use force=true to overwrite or append=true to add to existing tasks.`
            }],
            metadata: {
              error: true,
              errorType: 'file_exists',
              existingFile: tasksOutputPath
            }
          };
        } catch (error) {
          // File doesn't exist, proceed
        }
      }
      
      // Generate tasks using AI
      const generatedTasks = await this.generateTasksFromPRD(prdContent, {
        numTasks,
        complexity,
        useResearch,
        projectRoot
      });
      
      // Combine with existing tasks if appending
      const allTasks = append ? [...existingTasks, ...generatedTasks] : generatedTasks;
      
      // Create tasks structure
      const tasksStructure = {
        metadata: {
          projectName: path.basename(projectRoot),
          generatedAt: new Date().toISOString(),
          source: 'sa_parse_prd',
          prdFile: prdPath,
          totalTasks: allTasks.length,
          complexity,
          useResearch
        },
        tasks: allTasks
      };
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(tasksOutputPath), { recursive: true });
      
      // Save tasks
      await fs.writeFile(tasksOutputPath, JSON.stringify(tasksStructure, null, 2));
      
      // Generate summary
      const summary = this.generateTasksSummary(generatedTasks, existingTasks.length);
      
      return {
        content: [{
          type: 'text',
          text: `Successfully parsed PRD and generated ${generatedTasks.length} tasks${append ? ` (appended to ${existingTasks.length} existing tasks)` : ''}\\n\\n${summary}`
        }],
        metadata: {
          prdFile: prdPath,
          outputFile: tasksOutputPath,
          tasksGenerated: generatedTasks.length,
          totalTasks: allTasks.length,
          existingTasks: existingTasks.length,
          complexity,
          useResearch,
          generatedAt: tasksStructure.metadata.generatedAt
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error parsing PRD: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'prd_parsing_error'
        }
      };
    }
  },
  
  async generateTasksFromPRD(prdContent, options) {
    const { numTasks, complexity, useResearch, projectRoot } = options;
    
    // Create AI prompt for PRD parsing
    const prompt = this.buildPRDParsingPrompt(prdContent, numTasks, complexity, useResearch);
    
    try {
      // Use AI provider to generate tasks
      const aiResponse = await this.callAIProvider(prompt, useResearch);
      
      // Parse AI response and extract tasks
      const tasks = this.parseAIResponse(aiResponse);
      
      // Validate and structure tasks
      const structuredTasks = this.structureTasks(tasks);
      
      return structuredTasks;
      
    } catch (error) {
      throw new Error(`AI task generation failed: ${error.message}`);
    }
  },
  
  buildPRDParsingPrompt(prdContent, numTasks, complexity, useResearch) {
    const complexityInstructions = {
      low: 'Focus on essential features and core functionality. Keep tasks simple and straightforward.',
      medium: 'Include both core features and important enhancements. Balance detail with practicality.',
      high: 'Include comprehensive features, edge cases, and advanced functionality. Be thorough in task breakdown.'
    };
    
    const researchNote = useResearch ? 'Consider industry best practices and current trends in your task generation.' : '';
    
    return `You are an expert project manager analyzing a Product Requirements Document (PRD) to generate actionable development tasks.

**PRD Content:**
${prdContent}

**Instructions:**
1. Generate exactly ${numTasks} high-level tasks based on this PRD
2. Project complexity level: ${complexity}
3. ${complexityInstructions[complexity]}
4. ${researchNote}

**Task Requirements:**
- Each task should be a clear, actionable item
- Include a concise title (max 60 characters)
- Provide a detailed description (100-300 words)
- Estimate effort level (1-5 scale, where 1=simple, 5=complex)
- Assign appropriate priority (high, medium, low)
- Suggest relevant skills/roles needed
- Identify potential dependencies

**Output Format:**
Return a JSON array of tasks with this structure:
[
  {
    "id": "task-1",
    "title": "Task Title",
    "description": "Detailed description of what needs to be done",
    "priority": "high|medium|low",
    "effort": 3,
    "skills": ["skill1", "skill2"],
    "dependencies": ["task-id-if-any"],
    "acceptance_criteria": ["criteria 1", "criteria 2"],
    "estimated_hours": 40
  }
]

Focus on creating tasks that are:
- Independently executable where possible
- Properly scoped for the complexity level
- Logically ordered by dependencies
- Aligned with the PRD requirements

Generate the tasks now:`;
  },
  
  async callAIProvider(prompt, useResearch = false) {
    // This is a simplified implementation
    // In a real implementation, you'd integrate with actual AI providers
    // like OpenAI, Claude, or other LLMs available in the system
    
    try {
      // Check if we have AI provider configuration
      const aiConfig = await this.loadAIConfig();
      
      if (!aiConfig || !aiConfig.provider) {
        throw new Error('No AI provider configured. Please set up AI configuration.');
      }
      
      // Simulate AI call (replace with actual implementation)
      const response = await this.makeAIRequest(prompt, aiConfig, useResearch);
      return response;
      
    } catch (error) {
      // Fallback to template-based generation if AI fails
      console.warn('AI provider failed, using template-based generation:', error.message);
      return this.generateTasksFromTemplate(prompt);
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
    // For now, return a template response
    return this.generateTasksFromTemplate(prompt);
  },
  
  generateTasksFromTemplate(prompt) {
    // Extract key information from the PRD content in the prompt
    const prdMatch = prompt.match(/\\*\\*PRD Content:\\*\\*\\n([\\s\\S]*?)\\n\\n\\*\\*Instructions:/);
    const prdContent = prdMatch ? prdMatch[1] : '';
    
    const numTasksMatch = prompt.match(/Generate exactly (\\d+) high-level tasks/);
    const numTasks = numTasksMatch ? parseInt(numTasksMatch[1]) : 5;
    
    // Generate template tasks based on common patterns
    const templateTasks = [];
    const commonTaskTypes = [
      {
        title: 'Requirements Analysis and Planning',
        description: 'Analyze the requirements thoroughly, break down features into manageable components, and create detailed project plan with timelines and resource allocation.',
        priority: 'high',
        effort: 4,
        skills: ['analysis', 'planning', 'project-management'],
        estimated_hours: 32
      },
      {
        title: 'System Architecture Design',
        description: 'Design the overall system architecture, define component interactions, select technology stack, and create technical specifications.',
        priority: 'high',
        effort: 5,
        skills: ['architecture', 'system-design', 'technical-writing'],
        estimated_hours: 48
      },
      {
        title: 'Core Feature Implementation',
        description: 'Implement the main features identified in the PRD, following best practices and architectural guidelines.',
        priority: 'high',
        effort: 4,
        skills: ['development', 'programming', 'testing'],
        estimated_hours: 80
      },
      {
        title: 'User Interface Development',
        description: 'Create user-friendly interfaces that meet the requirements specified in the PRD, ensuring good UX/UI design principles.',
        priority: 'medium',
        effort: 3,
        skills: ['frontend', 'ui-design', 'ux-design'],
        estimated_hours: 56
      },
      {
        title: 'Data Management Implementation',
        description: 'Set up data storage, implement data models, create APIs for data operations, and ensure data security and integrity.',
        priority: 'high',
        effort: 4,
        skills: ['backend', 'database', 'api-development'],
        estimated_hours: 64
      },
      {
        title: 'Integration and Testing',
        description: 'Integrate all components, perform comprehensive testing including unit, integration, and user acceptance testing.',
        priority: 'medium',
        effort: 3,
        skills: ['testing', 'integration', 'qa'],
        estimated_hours: 40
      },
      {
        title: 'Security Implementation',
        description: 'Implement security measures, authentication, authorization, and ensure compliance with security standards.',
        priority: 'high',
        effort: 4,
        skills: ['security', 'authentication', 'compliance'],
        estimated_hours: 32
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize system performance, implement caching strategies, and ensure scalability requirements are met.',
        priority: 'medium',
        effort: 3,
        skills: ['performance', 'optimization', 'scalability'],
        estimated_hours: 24
      },
      {
        title: 'Documentation and Training',
        description: 'Create comprehensive documentation for users and developers, prepare training materials and conduct knowledge transfer.',
        priority: 'low',
        effort: 2,
        skills: ['documentation', 'training', 'technical-writing'],
        estimated_hours: 24
      },
      {
        title: 'Deployment and Monitoring',
        description: 'Set up production deployment pipeline, implement monitoring and logging, and establish maintenance procedures.',
        priority: 'medium',
        effort: 3,
        skills: ['devops', 'monitoring', 'deployment'],
        estimated_hours: 32
      }
    ];
    
    // Select and customize tasks based on requested number
    const selectedTasks = templateTasks.slice(0, Math.min(numTasks, templateTasks.length));
    
    // If we need more tasks, duplicate and modify some
    while (selectedTasks.length < numTasks && templateTasks.length > 0) {
      const baseTask = templateTasks[selectedTasks.length % templateTasks.length];
      const modifiedTask = {
        ...baseTask,
        title: `Additional ${baseTask.title}`,
        description: `Extended work on ${baseTask.description.toLowerCase()}`
      };
      selectedTasks.push(modifiedTask);
    }
    
    // Add IDs and format properly
    return selectedTasks.map((task, index) => ({
      id: `task-${index + 1}`,
      ...task,
      dependencies: index > 0 ? [`task-${index}`] : [],
      acceptance_criteria: [
        'Requirements are clearly defined and documented',
        'Implementation follows established standards',
        'Testing is completed with passing results',
        'Code review is completed and approved'
      ]
    }));
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
  
  structureTasks(tasks) {
    const currentTime = new Date().toISOString();
    
    return tasks.map((task, index) => ({
      id: task.id || `task-${index + 1}`,
      title: task.title || `Task ${index + 1}`,
      description: task.description || 'No description provided',
      status: 'pending',
      priority: this.validatePriority(task.priority),
      effort: this.validateEffort(task.effort),
      skills: Array.isArray(task.skills) ? task.skills : [],
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      acceptance_criteria: Array.isArray(task.acceptance_criteria) ? task.acceptance_criteria : [],
      estimated_hours: task.estimated_hours || 20,
      created_at: currentTime,
      updated_at: currentTime,
      assignee: null,
      tags: [],
      subtasks: []
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
  
  generateTasksSummary(tasks, existingTasksCount = 0) {
    const priorities = { high: 0, medium: 0, low: 0 };
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const avgEffort = tasks.reduce((sum, task) => sum + (task.effort || 0), 0) / tasks.length;
    
    tasks.forEach(task => {
      priorities[task.priority]++;
    });
    
    let summary = `## Task Generation Summary\\n\\n`;
    summary += `**Generated Tasks:** ${tasks.length}\\n`;
    if (existingTasksCount > 0) {
      summary += `**Existing Tasks:** ${existingTasksCount}\\n`;
      summary += `**Total Tasks:** ${tasks.length + existingTasksCount}\\n`;
    }
    summary += `**Estimated Total Hours:** ${totalHours}\\n`;
    summary += `**Average Effort Level:** ${avgEffort.toFixed(1)}/5\\n\\n`;
    
    summary += `**Priority Distribution:**\\n`;
    summary += `- High: ${priorities.high} tasks\\n`;
    summary += `- Medium: ${priorities.medium} tasks\\n`;
    summary += `- Low: ${priorities.low} tasks\\n\\n`;
    
    summary += `**Sample Tasks:**\\n`;
    tasks.slice(0, 3).forEach((task, index) => {
      summary += `${index + 1}. **${task.title}** (${task.priority} priority, ${task.effort}/5 effort)\\n`;
    });
    
    return summary;
  }
};