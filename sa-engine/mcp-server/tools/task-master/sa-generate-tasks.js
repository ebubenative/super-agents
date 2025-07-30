/**
 * SA Generate Tasks Tool
 * AI-powered task generation from various inputs - context-aware task creation with templates
 */

export const saGenerateTasks = {
  name: 'sa_generate_tasks',
  description: 'AI-powered task generation from requirements, contexts, or templates with intelligent task creation',
  category: 'task-master',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      generationType: {
        type: 'string',
        enum: ['requirements', 'template', 'context', 'feature', 'bug-fix', 'enhancement'],
        description: 'Type of task generation to perform',
        default: 'requirements'
      },
      input: {
        type: 'string',
        description: 'Input text for task generation (requirements, feature description, bug report, etc.)'
      },
      templateName: {
        type: 'string',
        description: 'Name of template to use for template-based generation'
      },
      numTasks: {
        type: 'number',
        description: 'Number of tasks to generate (default: auto-determine)',
        minimum: 1,
        maximum: 25,
        default: 5
      },
      outputFile: {
        type: 'string',
        description: 'Output file path (optional, will use project tasks.json)'
      },
      priority: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Default priority for generated tasks',
        default: 'medium'
      },
      complexity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Target complexity level for generated tasks',
        default: 'medium'
      },
      useResearch: {
        type: 'boolean',
        description: 'Enable AI research mode for enhanced task generation',
        default: false
      },
      append: {
        type: 'boolean',
        description: 'Append generated tasks to existing tasks',
        default: false
      },
      teamSize: {
        type: 'number',
        description: 'Team size for task scoping',
        minimum: 1,
        maximum: 20,
        default: 3
      },
      timeline: {
        type: 'string',
        description: 'Project timeline for effort estimation (e.g., "2 weeks", "1 month")',
        default: '4 weeks'
      },
      technologies: {
        type: 'array',
        items: { type: 'string' },
        description: 'Technologies being used in the project'
      }
    },
    required: ['projectRoot', 'generationType']
  },
  
  async execute({ projectRoot, generationType, input, templateName, numTasks = 5, outputFile, priority = 'medium', complexity = 'medium', useResearch = false, append = false, teamSize = 3, timeline = '4 weeks', technologies = [] }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Validate inputs
      if (generationType === 'template' && !templateName) {
        throw new Error('Template name is required for template-based generation');
      }
      
      if (['requirements', 'context', 'feature', 'bug-fix', 'enhancement'].includes(generationType) && !input) {
        throw new Error(`Input text is required for ${generationType} generation`);
      }
      
      // Determine output file path
      const tasksPath = outputFile || path.join(projectRoot, 'sa-engine', 'data', 'tasks', 'tasks.json');
      
      // Load existing tasks if appending
      let existingTasks = [];
      let existingMetadata = {};
      if (append) {
        try {
          const existingContent = await fs.readFile(tasksPath, 'utf-8');
          const tasksData = JSON.parse(existingContent);
          existingTasks = tasksData.tasks || [];
          existingMetadata = tasksData.metadata || {};
        } catch (error) {
          // File doesn't exist, start with empty array
        }
      }
      
      // Generate tasks based on type
      let generatedTasks;
      switch (generationType) {
        case 'template':
          generatedTasks = await this.generateFromTemplate(templateName, {
            numTasks, priority, complexity, teamSize, timeline, technologies, projectRoot
          });
          break;
        case 'requirements':
          generatedTasks = await this.generateFromRequirements(input, {
            numTasks, priority, complexity, useResearch, teamSize, timeline, technologies, projectRoot
          });
          break;
        case 'feature':
          generatedTasks = await this.generateFromFeature(input, {
            numTasks, priority, complexity, useResearch, teamSize, timeline, technologies, projectRoot
          });
          break;
        case 'bug-fix':
          generatedTasks = await this.generateFromBugFix(input, {
            numTasks, priority, complexity, teamSize, timeline, technologies, projectRoot
          });
          break;
        case 'enhancement':
          generatedTasks = await this.generateFromEnhancement(input, {
            numTasks, priority, complexity, useResearch, teamSize, timeline, technologies, projectRoot
          });
          break;
        case 'context':
          generatedTasks = await this.generateFromContext(input, {
            numTasks, priority, complexity, useResearch, teamSize, timeline, technologies, projectRoot
          });
          break;
        default:
          throw new Error(`Unknown generation type: ${generationType}`);
      }
      
      // Combine with existing tasks if appending
      const allTasks = append ? [...existingTasks, ...generatedTasks] : generatedTasks;
      
      // Create tasks structure
      const tasksStructure = {
        metadata: {
          ...existingMetadata,
          projectName: path.basename(projectRoot),
          lastGeneratedAt: new Date().toISOString(),
          generationType,
          totalTasks: allTasks.length,
          generatedTasks: generatedTasks.length,
          complexity,
          teamSize,
          timeline,
          technologies
        },
        tasks: allTasks
      };
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(tasksPath), { recursive: true });
      
      // Save tasks
      await fs.writeFile(tasksPath, JSON.stringify(tasksStructure, null, 2));
      
      // Generate summary
      const summary = this.generateTasksSummary(generatedTasks, existingTasks.length, generationType);
      
      return {
        content: [{
          type: 'text',
          text: `Successfully generated ${generatedTasks.length} tasks using ${generationType} generation${append ? ` (appended to ${existingTasks.length} existing tasks)` : ''}\\n\\n${summary}`
        }],
        metadata: {
          generationType,
          tasksGenerated: generatedTasks.length,
          totalTasks: allTasks.length,
          existingTasks: existingTasks.length,
          complexity,
          priority,
          outputFile: tasksPath,
          generatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating tasks: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'task_generation_error'
        }
      };
    }
  },
  
  async generateFromTemplate(templateName, options) {
    const templates = await this.loadTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}. Available templates: ${Object.keys(templates).join(', ')}`);
    }
    
    // Generate tasks based on template
    const tasks = [];
    const templateTasks = template.tasks || [];
    const maxTasks = Math.min(options.numTasks, templateTasks.length);
    
    for (let i = 0; i < maxTasks; i++) {
      const templateTask = templateTasks[i];
      const task = {
        id: `task-${Date.now()}-${i + 1}`,
        title: this.interpolateTemplate(templateTask.title, options),
        description: this.interpolateTemplate(templateTask.description, options),
        priority: templateTask.priority || options.priority,
        effort: templateTask.effort || this.calculateEffortFromComplexity(options.complexity),
        estimated_hours: templateTask.estimated_hours || this.calculateHoursFromEffort(templateTask.effort || 3, options.teamSize),
        skills: templateTask.skills || [],
        dependencies: [],
        acceptance_criteria: templateTask.acceptance_criteria || [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [templateName, 'template-generated'],
        assignee: null,
        subtasks: []
      };
      
      tasks.push(task);
    }
    
    return tasks;
  },
  
  async generateFromRequirements(requirements, options) {
    // Create AI prompt for requirements-based generation
    const prompt = this.buildRequirementsPrompt(requirements, options);
    
    try {
      // Use AI provider to generate tasks
      const aiResponse = await this.callAIProvider(prompt, options.useResearch);
      const tasks = this.parseAIResponse(aiResponse);
      return this.structureTasks(tasks);
    } catch (error) {
      console.warn('AI provider failed, using template-based fallback:', error.message);
      return this.generateFallbackTasks('requirements', requirements, options);
    }
  },
  
  async generateFromFeature(featureDescription, options) {
    const prompt = this.buildFeaturePrompt(featureDescription, options);
    
    try {
      const aiResponse = await this.callAIProvider(prompt, options.useResearch);
      const tasks = this.parseAIResponse(aiResponse);
      return this.structureTasks(tasks);
    } catch (error) {
      console.warn('AI provider failed, using template-based fallback:', error.message);
      return this.generateFallbackTasks('feature', featureDescription, options);
    }
  },
  
  async generateFromBugFix(bugReport, options) {
    const prompt = this.buildBugFixPrompt(bugReport, options);
    
    try {
      const aiResponse = await this.callAIProvider(prompt, options.useResearch);
      const tasks = this.parseAIResponse(aiResponse);
      return this.structureTasks(tasks);
    } catch (error) {
      console.warn('AI provider failed, using template-based fallback:', error.message);
      return this.generateFallbackTasks('bug-fix', bugReport, options);
    }
  },
  
  async generateFromEnhancement(enhancementDescription, options) {
    const prompt = this.buildEnhancementPrompt(enhancementDescription, options);
    
    try {
      const aiResponse = await this.callAIProvider(prompt, options.useResearch);
      const tasks = this.parseAIResponse(aiResponse);
      return this.structureTasks(tasks);
    } catch (error) {
      console.warn('AI provider failed, using template-based fallback:', error.message);
      return this.generateFallbackTasks('enhancement', enhancementDescription, options);
    }
  },
  
  async generateFromContext(contextDescription, options) {
    const prompt = this.buildContextPrompt(contextDescription, options);
    
    try {
      const aiResponse = await this.callAIProvider(prompt, options.useResearch);
      const tasks = this.parseAIResponse(aiResponse);
      return this.structureTasks(tasks);
    } catch (error) {
      console.warn('AI provider failed, using template-based fallback:', error.message);
      return this.generateFallbackTasks('context', contextDescription, options);
    }
  },
  
  buildRequirementsPrompt(requirements, options) {
    return `You are an expert project manager generating development tasks from requirements.

**Requirements:**
${requirements}

**Project Context:**
- Complexity Level: ${options.complexity}
- Team Size: ${options.teamSize}
- Timeline: ${options.timeline}
- Technologies: ${options.technologies.join(', ') || 'Not specified'}
- Default Priority: ${options.priority}

**Task Generation Instructions:**
Generate ${options.numTasks} development tasks that comprehensively address these requirements. Each task should be:
- Clearly defined and actionable
- Appropriately scoped for the team size and timeline
- Logically sequenced with appropriate dependencies
- Sized appropriately for the complexity level

**Output Format:**
Return a JSON array of tasks with this structure:
[
  {
    "title": "Task Title (max 60 characters)",
    "description": "Detailed description (200-400 words)",
    "priority": "high|medium|low",
    "effort": 1-5,
    "estimated_hours": 20,
    "skills": ["skill1", "skill2"],
    "dependencies": [],
    "acceptance_criteria": ["criteria 1", "criteria 2"],
    "tags": ["requirements-based"]
  }
]

Generate the tasks now:`;
  },
  
  buildFeaturePrompt(featureDescription, options) {
    return `You are an expert product manager breaking down a feature into development tasks.

**Feature Description:**
${featureDescription}

**Project Context:**
- Complexity Level: ${options.complexity}
- Team Size: ${options.teamSize}
- Timeline: ${options.timeline}
- Technologies: ${options.technologies.join(', ') || 'Not specified'}

**Task Generation Instructions:**
Generate ${options.numTasks} tasks to implement this feature completely. Consider:
- User experience and interface requirements
- Backend/API requirements
- Data storage and management
- Testing and validation
- Documentation and deployment

Focus on creating a complete feature implementation plan.

**Output Format:**
Return a JSON array of tasks following the standard structure with "feature-implementation" tag.

Generate the tasks now:`;
  },
  
  buildBugFixPrompt(bugReport, options) {
    return `You are an expert developer creating tasks to fix a reported bug.

**Bug Report:**
${bugReport}

**Project Context:**
- Team Size: ${options.teamSize}
- Timeline: ${options.timeline}
- Technologies: ${options.technologies.join(', ') || 'Not specified'}

**Task Generation Instructions:**
Generate ${options.numTasks} tasks to investigate, fix, and prevent this bug. Consider:
- Root cause analysis
- Fix implementation
- Testing to verify fix
- Regression testing
- Prevention measures

Focus on thorough bug resolution and prevention.

**Output Format:**
Return a JSON array of tasks with "bug-fix" tag and high priority where appropriate.

Generate the tasks now:`;
  },
  
  buildEnhancementPrompt(enhancementDescription, options) {
    return `You are an expert product manager planning an enhancement to existing functionality.

**Enhancement Description:**
${enhancementDescription}

**Project Context:**
- Complexity Level: ${options.complexity}
- Team Size: ${options.teamSize}
- Timeline: ${options.timeline}
- Technologies: ${options.technologies.join(', ') || 'Not specified'}

**Task Generation Instructions:**
Generate ${options.numTasks} tasks to implement this enhancement. Consider:
- Impact analysis on existing functionality
- Backward compatibility
- User experience improvements
- Performance considerations
- Testing existing and new functionality

Focus on enhancing without breaking existing features.

**Output Format:**
Return a JSON array of tasks with "enhancement" tag.

Generate the tasks now:`;
  },
  
  buildContextPrompt(contextDescription, options) {
    return `You are an expert project manager generating tasks based on project context.

**Context:**
${contextDescription}

**Project Parameters:**
- Complexity Level: ${options.complexity}
- Team Size: ${options.teamSize}
- Timeline: ${options.timeline}
- Technologies: ${options.technologies.join(', ') || 'Not specified'}
- Priority Level: ${options.priority}

**Task Generation Instructions:**
Generate ${options.numTasks} appropriate tasks based on the provided context. Adapt task types and complexity to match the context provided.

**Output Format:**
Return a JSON array of tasks with "context-generated" tag.

Generate the tasks now:`;
  },
  
  async callAIProvider(prompt, useResearch = false) {
    try {
      const aiConfig = await this.loadAIConfig();
      if (!aiConfig || !aiConfig.provider) {
        throw new Error('No AI provider configured');
      }
      
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
      
      const configPath = path.join(process.cwd(), 'sa-engine', 'config', 'ai-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      if (process.env.OPENAI_API_KEY) {
        return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4' };
      }
      if (process.env.ANTHROPIC_API_KEY) {
        return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-sonnet-20240229' };
      }
      return null;
    }
  },
  
  async makeAIRequest(prompt, config, useResearch) {
    // This would be implemented with actual AI provider SDKs
    throw new Error('AI provider not implemented');
  },
  
  generateFallbackTasks(type, input, options) {
    const tasks = [];
    const { numTasks, priority, complexity, teamSize, timeline } = options;
    
    // Template-based fallback generation
    const taskTemplates = this.getFallbackTemplates(type);
    const selectedTemplates = taskTemplates.slice(0, Math.min(numTasks, taskTemplates.length));
    
    selectedTemplates.forEach((template, index) => {
      const task = {
        id: `task-${Date.now()}-${index + 1}`,
        title: template.title.replace('{input}', this.extractKeywords(input).slice(0, 3).join(' ')),
        description: this.generateFallbackDescription(template, input, options),
        priority: template.priority || priority,
        effort: this.calculateEffortFromComplexity(complexity),
        estimated_hours: this.calculateHoursFromEffort(template.effort || 3, teamSize),
        skills: template.skills || [],
        dependencies: index > 0 ? [`task-${Date.now()}-${index}`] : [],
        acceptance_criteria: template.acceptance_criteria || [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: [type, 'fallback-generated'],
        assignee: null,
        subtasks: []
      };
      
      tasks.push(task);
    });
    
    return tasks;
  },
  
  getFallbackTemplates(type) {
    const templates = {
      requirements: [
        { title: 'Requirements Analysis for {input}', skills: ['analysis', 'documentation'], effort: 2, priority: 'high', acceptance_criteria: ['All requirements documented', 'Stakeholder approval obtained'] },
        { title: 'Technical Design and Architecture', skills: ['architecture', 'design'], effort: 4, priority: 'high', acceptance_criteria: ['Architecture documented', 'Technical decisions recorded'] },
        { title: 'Core Implementation', skills: ['development', 'programming'], effort: 4, priority: 'high', acceptance_criteria: ['Core functionality implemented', 'Code reviewed and approved'] },
        { title: 'Testing and Quality Assurance', skills: ['testing', 'qa'], effort: 3, priority: 'medium', acceptance_criteria: ['Test cases created', 'Tests passing', 'Quality gates met'] },
        { title: 'Documentation and Deployment', skills: ['documentation', 'deployment'], effort: 2, priority: 'medium', acceptance_criteria: ['Documentation complete', 'Deployment successful'] }
      ],
      feature: [
        { title: 'Feature Specification for {input}', skills: ['analysis', 'design'], effort: 2, priority: 'high', acceptance_criteria: ['Feature requirements clear', 'Design approved'] },
        { title: 'UI/UX Design Implementation', skills: ['frontend', 'ui-design'], effort: 3, priority: 'high', acceptance_criteria: ['UI components created', 'UX validated'] },
        { title: 'Backend API Development', skills: ['backend', 'api-development'], effort: 4, priority: 'high', acceptance_criteria: ['API endpoints implemented', 'Data models created'] },
        { title: 'Frontend Integration', skills: ['frontend', 'integration'], effort: 3, priority: 'medium', acceptance_criteria: ['Frontend connected to API', 'Data flow working'] },
        { title: 'Feature Testing and Validation', skills: ['testing', 'validation'], effort: 2, priority: 'medium', acceptance_criteria: ['Feature tests passing', 'User acceptance criteria met'] }
      ],
      'bug-fix': [
        { title: 'Bug Investigation and Root Cause Analysis', skills: ['debugging', 'analysis'], effort: 2, priority: 'high', acceptance_criteria: ['Root cause identified', 'Impact assessed'] },
        { title: 'Bug Fix Implementation', skills: ['development', 'debugging'], effort: 3, priority: 'high', acceptance_criteria: ['Bug fixed', 'Solution tested'] },
        { title: 'Regression Testing', skills: ['testing', 'qa'], effort: 2, priority: 'high', acceptance_criteria: ['No new bugs introduced', 'Existing functionality intact'] },
        { title: 'Fix Validation and Monitoring', skills: ['validation', 'monitoring'], effort: 1, priority: 'medium', acceptance_criteria: ['Fix validated in production', 'Monitoring in place'] }
      ],
      enhancement: [
        { title: 'Enhancement Analysis for {input}', skills: ['analysis', 'planning'], effort: 2, priority: 'medium', acceptance_criteria: ['Enhancement scope defined', 'Impact analyzed'] },
        { title: 'Backward Compatibility Assessment', skills: ['analysis', 'testing'], effort: 2, priority: 'high', acceptance_criteria: ['Compatibility ensured', 'Migration plan created'] },
        { title: 'Enhancement Implementation', skills: ['development', 'programming'], effort: 4, priority: 'medium', acceptance_criteria: ['Enhancement implemented', 'Code quality maintained'] },
        { title: 'Performance and Security Review', skills: ['performance', 'security'], effort: 2, priority: 'medium', acceptance_criteria: ['Performance validated', 'Security assessed'] },
        { title: 'Enhancement Testing and Documentation', skills: ['testing', 'documentation'], effort: 2, priority: 'low', acceptance_criteria: ['Tests updated', 'Documentation complete'] }
      ],
      context: [
        { title: 'Context Analysis and Planning', skills: ['analysis', 'planning'], effort: 2, priority: 'medium', acceptance_criteria: ['Context understood', 'Plan created'] },
        { title: 'Implementation Phase 1', skills: ['development'], effort: 3, priority: 'medium', acceptance_criteria: ['First phase complete', 'Quality validated'] },
        { title: 'Implementation Phase 2', skills: ['development'], effort: 3, priority: 'medium', acceptance_criteria: ['Second phase complete', 'Integration tested'] },
        { title: 'Final Integration and Testing', skills: ['integration', 'testing'], effort: 2, priority: 'low', acceptance_criteria: ['Full integration complete', 'All tests passing'] }
      ]
    };
    
    return templates[type] || templates.requirements;
  },
  
  generateFallbackDescription(template, input, options) {
    const baseDescription = `This task focuses on ${template.title.toLowerCase()} as part of the ${options.complexity} complexity project. `;
    
    let contextDescription = '';
    if (input && input.length > 20) {
      const keywords = this.extractKeywords(input);
      contextDescription = `Key focus areas include: ${keywords.slice(0, 5).join(', ')}. `;
    }
    
    const teamDescription = `With a team of ${options.teamSize} members and a ${options.timeline} timeline, this task should be completed efficiently while maintaining quality standards. `;
    
    const skillsDescription = template.skills && template.skills.length > 0 
      ? `Required skills: ${template.skills.join(', ')}. `
      : '';
    
    return baseDescription + contextDescription + teamDescription + skillsDescription + 'Ensure all acceptance criteria are met before marking as complete.';
  },
  
  extractKeywords(text) {
    if (!text) return [];
    
    const words = text.toLowerCase()
      .split(/\\W+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'new', 'years', 'way', 'may', 'say', 'come', 'its', 'now', 'find', 'long', 'down', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'does', 'she', 'use', 'her', 'many', 'oil', 'sit', 'set', 'had'].includes(word));
    
    // Count frequency and return most common
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10);
  },
  
  calculateEffortFromComplexity(complexity) {
    const complexityMap = { low: 2, medium: 3, high: 4 };
    return complexityMap[complexity] || 3;
  },
  
  calculateHoursFromEffort(effort, teamSize) {
    const baseHours = effort * 8; // 8 hours per effort point
    const teamFactor = Math.max(0.7, 1 / Math.sqrt(teamSize)); // Diminishing returns for larger teams
    return Math.round(baseHours * teamFactor);
  },
  
  async loadTemplates() {
    // Predefined templates for common project types
    return {
      'web-application': {
        description: 'Full-stack web application development',
        tasks: [
          { title: 'Setup Development Environment', description: 'Configure development tools, dependencies, and project structure', effort: 2, skills: ['setup', 'configuration'], acceptance_criteria: ['Development environment ready', 'Dependencies installed'] },
          { title: 'Database Design and Setup', description: 'Design database schema and set up database infrastructure', effort: 3, skills: ['database', 'design'], acceptance_criteria: ['Database schema created', 'Database connected'] },
          { title: 'Backend API Development', description: 'Implement REST API endpoints and business logic', effort: 4, skills: ['backend', 'api'], acceptance_criteria: ['API endpoints working', 'Business logic implemented'] },
          { title: 'Frontend UI Implementation', description: 'Create user interface components and pages', effort: 4, skills: ['frontend', 'ui'], acceptance_criteria: ['UI components created', 'Pages responsive'] },
          { title: 'Integration and Testing', description: 'Integrate frontend with backend and perform comprehensive testing', effort: 3, skills: ['integration', 'testing'], acceptance_criteria: ['Frontend-backend integrated', 'Tests passing'] }
        ]
      },
      'mobile-app': {
        description: 'Mobile application development',
        tasks: [
          { title: 'Mobile App Architecture', description: 'Design mobile app architecture and choose frameworks', effort: 3, skills: ['mobile', 'architecture'], acceptance_criteria: ['Architecture documented', 'Framework selected'] },
          { title: 'Core App Development', description: 'Implement core mobile app functionality', effort: 4, skills: ['mobile', 'development'], acceptance_criteria: ['Core features implemented', 'App navigation working'] },
          { title: 'API Integration', description: 'Connect mobile app to backend services', effort: 3, skills: ['mobile', 'api'], acceptance_criteria: ['API calls working', 'Data sync implemented'] },
          { title: 'Device Testing', description: 'Test app on multiple devices and screen sizes', effort: 2, skills: ['mobile', 'testing'], acceptance_criteria: ['Multi-device testing complete', 'Performance validated'] }
        ]
      },
      'api-service': {
        description: 'Backend API service development',
        tasks: [
          { title: 'API Specification Design', description: 'Design API endpoints, data models, and documentation', effort: 2, skills: ['api', 'design'], acceptance_criteria: ['API spec documented', 'Data models defined'] },
          { title: 'Core Service Implementation', description: 'Implement business logic and data processing', effort: 4, skills: ['backend', 'programming'], acceptance_criteria: ['Business logic implemented', 'Data processing working'] },
          { title: 'Authentication and Security', description: 'Implement authentication, authorization, and security measures', effort: 3, skills: ['security', 'authentication'], acceptance_criteria: ['Auth implemented', 'Security validated'] },
          { title: 'Performance and Monitoring', description: 'Optimize performance and set up monitoring', effort: 2, skills: ['performance', 'monitoring'], acceptance_criteria: ['Performance optimized', 'Monitoring active'] }
        ]
      }
    };
  },
  
  interpolateTemplate(template, options) {
    return template
      .replace('{complexity}', options.complexity)
      .replace('{teamSize}', options.teamSize)
      .replace('{timeline}', options.timeline)
      .replace('{technologies}', options.technologies.join(', ') || 'modern technologies');
  },
  
  parseAIResponse(aiResponse) {
    if (Array.isArray(aiResponse)) {
      return aiResponse;
    }
    
    try {
      if (typeof aiResponse === 'string') {
        const jsonMatch = aiResponse.match(/\\[[\\s\\S]*\\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
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
      id: task.id || `task-${Date.now()}-${index + 1}`,
      title: task.title || `Task ${index + 1}`,
      description: task.description || 'No description provided',
      status: 'pending',
      priority: this.validatePriority(task.priority),
      effort: this.validateEffort(task.effort),
      estimated_hours: task.estimated_hours || 20,
      skills: Array.isArray(task.skills) ? task.skills : [],
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      acceptance_criteria: Array.isArray(task.acceptance_criteria) ? task.acceptance_criteria : [],
      tags: Array.isArray(task.tags) ? task.tags : [],
      created_at: currentTime,
      updated_at: currentTime,
      assignee: null,
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
  
  generateTasksSummary(tasks, existingTasksCount, generationType) {
    const priorities = { high: 0, medium: 0, low: 0 };
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const avgEffort = tasks.reduce((sum, task) => sum + (task.effort || 0), 0) / tasks.length;
    
    tasks.forEach(task => {
      priorities[task.priority]++;
    });
    
    let summary = `## Task Generation Summary\\n\\n`;
    summary += `**Generation Type:** ${generationType}\\n`;
    summary += `**Generated Tasks:** ${tasks.length}\\n`;
    if (existingTasksCount > 0) {
      summary += `**Existing Tasks:** ${existingTasksCount}\\n`;
      summary += `**Total Tasks:** ${tasks.length + existingTasksCount}\\n`;
    }
    summary += `**Total Estimated Hours:** ${totalHours}\\n`;
    summary += `**Average Effort Level:** ${avgEffort.toFixed(1)}/5\\n\\n`;
    
    summary += `**Priority Distribution:**\\n`;
    summary += `- High: ${priorities.high} tasks\\n`;
    summary += `- Medium: ${priorities.medium} tasks\\n`;
    summary += `- Low: ${priorities.low} tasks\\n\\n`;
    
    summary += `**Generated Tasks:**\\n`;
    tasks.slice(0, 5).forEach((task, index) => {
      summary += `${index + 1}. **${task.title}** (${task.priority} priority, ${task.effort}/5 effort, ${task.estimated_hours}h)\\n`;
    });
    
    if (tasks.length > 5) {
      summary += `... and ${tasks.length - 5} more tasks\\n`;
    }
    
    return summary;
  }
};