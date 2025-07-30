import { EventEmitter } from 'events';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Command Generator for Claude Code Integration
 * Generates custom slash commands and hooks for Claude Code
 */
export default class CommandGenerator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      commandsPath: options.commandsPath || '.claude/commands',
      hooksPath: options.hooksPath || '.claude/hooks',
      generateWorkflowCommands: options.generateWorkflowCommands !== false,
      generateAgentCommands: options.generateAgentCommands !== false,
      generateHooks: options.generateHooks !== false,
      customCommands: options.customCommands || [],
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.generatedCommands = new Map();
    this.generatedHooks = new Map();
    this.commandTemplates = new Map();
    this.hookTemplates = new Map();

    this.initializeTemplates();
    this.log('Command Generator initialized', { options: this.options });
  }

  /**
   * Initialize command and hook templates
   */
  initializeTemplates() {
    // Command templates
    this.commandTemplates.set('agent-tool', this.getAgentToolTemplate());
    this.commandTemplates.set('workflow', this.getWorkflowTemplate());
    this.commandTemplates.set('utility', this.getUtilityTemplate());
    this.commandTemplates.set('composite', this.getCompositeTemplate());

    // Hook templates
    this.hookTemplates.set('task-tracker', this.getTaskTrackerHookTemplate());
    this.hookTemplates.set('workflow-monitor', this.getWorkflowMonitorHookTemplate());
    this.hookTemplates.set('error-handler', this.getErrorHandlerHookTemplate());
    this.hookTemplates.set('progress-tracker', this.getProgressTrackerHookTemplate());
  }

  /**
   * Generate all commands and hooks
   * @param {Object} config - Generation configuration
   * @returns {Promise<Object>} Generation results
   */
  async generateAll(config = {}) {
    try {
      this.log('Starting command and hook generation');
      this.emit('generationStarting', { config });

      const generationConfig = { ...this.options, ...config };
      const results = {
        commands: 0,
        hooks: 0,
        errors: []
      };

      // Create directory structure
      await this.createDirectories(generationConfig);

      // Generate agent commands
      if (generationConfig.generateAgentCommands) {
        const agentResults = await this.generateAgentCommands(generationConfig);
        results.commands += agentResults.count;
        results.errors.push(...agentResults.errors);
      }

      // Generate workflow commands
      if (generationConfig.generateWorkflowCommands) {
        const workflowResults = await this.generateWorkflowCommands(generationConfig);
        results.commands += workflowResults.count;
        results.errors.push(...workflowResults.errors);
      }

      // Generate custom commands
      if (generationConfig.customCommands.length > 0) {
        const customResults = await this.generateCustomCommands(generationConfig);
        results.commands += customResults.count;
        results.errors.push(...customResults.errors);
      }

      // Generate hooks
      if (generationConfig.generateHooks) {
        const hookResults = await this.generateHooks(generationConfig);
        results.hooks += hookResults.count;
        results.errors.push(...hookResults.errors);
      }

      this.log('Command and hook generation completed', results);
      this.emit('generationCompleted', results);

      return results;

    } catch (error) {
      this.log('Failed to generate commands and hooks', { error: error.message });
      this.emit('generationError', { error, context: 'generation' });
      throw error;
    }
  }

  /**
   * Create necessary directories
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async createDirectories(config) {
    const commandsDir = join(config.projectRoot, config.commandsPath);
    const hooksDir = join(config.projectRoot, config.hooksPath);

    if (!existsSync(commandsDir)) {
      await mkdir(commandsDir, { recursive: true });
    }

    if (!existsSync(hooksDir)) {
      await mkdir(hooksDir, { recursive: true });
    }

    this.log('Directories created', { commandsDir, hooksDir });
  }

  /**
   * Generate agent-specific commands
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Generation results
   */
  async generateAgentCommands(config) {
    const results = { count: 0, errors: [] };

    try {
      this.log('Generating agent commands');

      const agentTools = {
        analyst: [
          { name: 'sa-research-market', description: 'Conduct market research and analysis', example: 'AI chatbots market' },
          { name: 'sa-competitor-analysis', description: 'Analyze competitors and market position', example: 'OpenAI ChatGPT' },
          { name: 'sa-brainstorm-session', description: 'Facilitate brainstorming sessions', example: 'mobile app features' },
          { name: 'sa-create-brief', description: 'Create project briefs and summaries', example: 'e-commerce platform' }
        ],
        pm: [
          { name: 'sa-generate-prd', description: 'Generate Product Requirements Document', example: 'user authentication system' },
          { name: 'sa-create-epic', description: 'Create comprehensive project epics', example: 'payment processing' },
          { name: 'sa-prioritize-features', description: 'Prioritize features and create roadmaps', example: 'mobile app features' },
          { name: 'sa-stakeholder-analysis', description: 'Analyze stakeholders and requirements', example: 'B2B SaaS platform' }
        ],
        architect: [
          { name: 'sa-create-architecture', description: 'Design system architecture', example: 'microservices e-commerce' },
          { name: 'sa-tech-recommendations', description: 'Provide technology recommendations', example: 'React vs Vue.js for dashboard' },
          { name: 'sa-design-system', description: 'Create design systems and patterns', example: 'component library' },
          { name: 'sa-analyze-brownfield', description: 'Analyze existing systems', example: 'legacy PHP application' }
        ],
        developer: [
          { name: 'sa-implement-story', description: 'Implement user stories and features', example: 'user login functionality' },
          { name: 'sa-debug-issue', description: 'Debug and troubleshoot problems', example: 'authentication timeout error' },
          { name: 'sa-run-tests', description: 'Execute test suites and validation', example: 'API endpoint tests' },
          { name: 'sa-validate-implementation', description: 'Validate code against requirements', example: 'security compliance check' }
        ],
        qa: [
          { name: 'sa-review-code', description: 'Perform comprehensive code reviews', example: 'React component security' },
          { name: 'sa-refactor-code', description: 'Refactor code for quality improvement', example: 'database query optimization' },
          { name: 'sa-validate-quality', description: 'Validate code quality standards', example: 'TypeScript type safety' },
          { name: 'sa-review-story', description: 'Review user stories for completeness', example: 'payment processing story' }
        ],
        'product-owner': [
          { name: 'sa-validate-story-draft', description: 'Validate user story drafts', example: 'shopping cart functionality' },
          { name: 'sa-execute-checklist', description: 'Execute project checklists', example: 'pre-deployment checklist' },
          { name: 'sa-correct-course', description: 'Provide project course correction', example: 'scope creep management' },
          { name: 'sa-shard-document', description: 'Break down large documents', example: 'technical specification' }
        ],
        'ux-expert': [
          { name: 'sa-create-frontend-spec', description: 'Create frontend specifications', example: 'dashboard UI components' },
          { name: 'sa-design-wireframes', description: 'Design wireframes and mockups', example: 'mobile app onboarding' },
          { name: 'sa-generate-ui-prompt', description: 'Generate UI design prompts', example: 'admin panel layout' },
          { name: 'sa-accessibility-audit', description: 'Conduct accessibility audits', example: 'WCAG compliance check' }
        ],
        'scrum-master': [
          { name: 'sa-create-story', description: 'Create detailed user stories', example: 'user profile management' },
          { name: 'sa-track-progress', description: 'Track project progress and velocity', example: 'sprint 3 status' },
          { name: 'sa-update-workflow', description: 'Update workflow and processes', example: 'CI/CD pipeline improvement' },
          { name: 'sa-create-next-story', description: 'Create next stories in sequence', example: 'follow-up to user registration' }
        ]
      };

      for (const [agent, tools] of Object.entries(agentTools)) {
        for (const tool of tools) {
          await this.generateAgentCommand(config, agent, tool);
          results.count++;
        }
      }

      this.log('Agent commands generated', { count: results.count });

    } catch (error) {
      results.errors.push(error.message);
      this.log('Error generating agent commands', { error: error.message });
    }

    return results;
  }

  /**
   * Generate a specific agent command
   * @param {Object} config - Configuration
   * @param {string} agent - Agent name
   * @param {Object} tool - Tool definition
   * @returns {Promise<void>}
   */
  async generateAgentCommand(config, agent, tool) {
    const template = this.commandTemplates.get('agent-tool');
    const commandName = `${agent}-${tool.name.replace('sa-', '')}`;
    const commandContent = template
      .replace(/{{AGENT_NAME}}/g, agent.toUpperCase())
      .replace(/{{TOOL_NAME}}/g, tool.name)
      .replace(/{{TOOL_DESCRIPTION}}/g, tool.description)
      .replace(/{{EXAMPLE_INPUT}}/g, tool.example)
      .replace(/{{COMMAND_NAME}}/g, commandName);

    const commandPath = join(config.projectRoot, config.commandsPath, `${commandName}.md`);
    await writeFile(commandPath, commandContent);
    
    this.generatedCommands.set(commandName, {
      path: commandPath,
      type: 'agent-tool',
      agent,
      tool: tool.name
    });
  }

  /**
   * Generate workflow commands
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Generation results
   */
  async generateWorkflowCommands(config) {
    const results = { count: 0, errors: [] };

    try {
      this.log('Generating workflow commands');

      const workflowCommands = [
        {
          name: 'start-project',
          title: 'Start Super Agents Project',
          description: 'Initialize a new project using Super Agents methodology',
          tools: ['sa-initialize-project', 'sa-generate-tasks'],
          workflow: 'project-initialization'
        },
        {
          name: 'research-phase',
          title: 'Research and Analysis Phase',
          description: 'Conduct comprehensive research and market analysis',
          tools: ['sa-research-market', 'sa-competitor-analysis', 'sa-stakeholder-analysis'],
          workflow: 'research-and-analysis'
        },
        {
          name: 'planning-phase',
          title: 'Planning and Requirements Phase',
          description: 'Create PRDs, epics, and project planning documents',
          tools: ['sa-generate-prd', 'sa-create-epic', 'sa-prioritize-features'],
          workflow: 'planning-and-requirements'
        },
        {
          name: 'design-phase',
          title: 'Architecture and Design Phase',
          description: 'Design system architecture and technical specifications',
          tools: ['sa-create-architecture', 'sa-design-system', 'sa-tech-recommendations'],
          workflow: 'architecture-and-design'
        },
        {
          name: 'development-phase',
          title: 'Development and Implementation Phase',
          description: 'Implement features and develop the system',
          tools: ['sa-create-story', 'sa-implement-story', 'sa-run-tests'],
          workflow: 'development-and-implementation'
        },
        {
          name: 'qa-phase',
          title: 'Quality Assurance Phase',
          description: 'Review code quality and validate implementation',
          tools: ['sa-review-code', 'sa-validate-quality', 'sa-refactor-code'],
          workflow: 'quality-assurance'
        },
        {
          name: 'track-progress',
          title: 'Track Project Progress',
          description: 'Monitor workflow progress and team velocity',
          tools: ['sa-track-progress', 'sa-workflow-status', 'sa-dependency-graph'],
          workflow: 'progress-tracking'
        },
        {
          name: 'complete-workflow',
          title: 'Complete Workflow Validation',
          description: 'Validate complete workflow and deliverables',
          tools: ['sa-workflow-validation', 'sa-validate-story-draft', 'sa-execute-checklist'],
          workflow: 'workflow-validation'
        }
      ];

      for (const command of workflowCommands) {
        await this.generateWorkflowCommand(config, command);
        results.count++;
      }

      this.log('Workflow commands generated', { count: results.count });

    } catch (error) {
      results.errors.push(error.message);
      this.log('Error generating workflow commands', { error: error.message });
    }

    return results;
  }

  /**
   * Generate a specific workflow command
   * @param {Object} config - Configuration
   * @param {Object} command - Command definition
   * @returns {Promise<void>}
   */
  async generateWorkflowCommand(config, command) {
    const template = this.commandTemplates.get('workflow');
    const commandName = `sa-${command.name}`;
    const toolsList = command.tools.map(tool => `- **${tool}**: Execute ${tool.replace('sa-', '').replace('-', ' ')}`).join('\n');
    
    const commandContent = template
      .replace(/{{WORKFLOW_TITLE}}/g, command.title)
      .replace(/{{WORKFLOW_DESCRIPTION}}/g, command.description)
      .replace(/{{WORKFLOW_TOOLS}}/g, toolsList)
      .replace(/{{WORKFLOW_NAME}}/g, command.workflow)
      .replace(/{{COMMAND_NAME}}/g, commandName);

    const commandPath = join(config.projectRoot, config.commandsPath, `${commandName}.md`);
    await writeFile(commandPath, commandContent);
    
    this.generatedCommands.set(commandName, {
      path: commandPath,
      type: 'workflow',
      workflow: command.workflow,
      tools: command.tools
    });
  }

  /**
   * Generate custom commands
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Generation results
   */
  async generateCustomCommands(config) {
    const results = { count: 0, errors: [] };

    try {
      this.log('Generating custom commands');

      for (const customCommand of config.customCommands) {
        await this.generateCustomCommand(config, customCommand);
        results.count++;
      }

      this.log('Custom commands generated', { count: results.count });

    } catch (error) {
      results.errors.push(error.message);
      this.log('Error generating custom commands', { error: error.message });
    }

    return results;
  }

  /**
   * Generate a custom command
   * @param {Object} config - Configuration
   * @param {Object} command - Custom command definition
   * @returns {Promise<void>}
   */
  async generateCustomCommand(config, command) {
    const template = this.commandTemplates.get(command.type || 'utility');
    const commandContent = this.populateTemplate(template, command);

    const commandPath = join(config.projectRoot, config.commandsPath, `${command.name}.md`);
    await writeFile(commandPath, commandContent);
    
    this.generatedCommands.set(command.name, {
      path: commandPath,
      type: 'custom',
      definition: command
    });
  }

  /**
   * Generate hooks for workflow integration
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Generation results
   */
  async generateHooks(config) {
    const results = { count: 0, errors: [] };

    try {
      this.log('Generating hooks');

      const hooks = [
        {
          name: 'sa-task-tracker',
          type: 'task-tracker',
          description: 'Track task completion and workflow progress',
          events: ['tool_call', 'task_complete']
        },
        {
          name: 'sa-workflow-monitor',
          type: 'workflow-monitor',
          description: 'Monitor workflow phase transitions and status',
          events: ['workflow_phase_change', 'workflow_complete']
        },
        {
          name: 'sa-error-handler',
          type: 'error-handler',
          description: 'Handle tool execution errors and recovery',
          events: ['tool_error', 'execution_failed']
        },
        {
          name: 'sa-progress-tracker',
          type: 'progress-tracker',
          description: 'Track overall project progress and metrics',
          events: ['progress_update', 'milestone_reached']
        }
      ];

      for (const hook of hooks) {
        await this.generateHook(config, hook);
        results.count++;
      }

      this.log('Hooks generated', { count: results.count });

    } catch (error) {
      results.errors.push(error.message);
      this.log('Error generating hooks', { error: error.message });
    }

    return results;
  }

  /**
   * Generate a specific hook
   * @param {Object} config - Configuration
   * @param {Object} hook - Hook definition
   * @returns {Promise<void>}
   */
  async generateHook(config, hook) {
    const template = this.hookTemplates.get(hook.type);
    const hookContent = template
      .replace(/{{HOOK_NAME}}/g, hook.name)
      .replace(/{{HOOK_DESCRIPTION}}/g, hook.description)
      .replace(/{{HOOK_EVENTS}}/g, hook.events.join(', '));

    const hookPath = join(config.projectRoot, config.hooksPath, `${hook.name}.js`);
    await writeFile(hookPath, hookContent);
    
    this.generatedHooks.set(hook.name, {
      path: hookPath,
      type: hook.type,
      events: hook.events
    });
  }

  /**
   * Populate template with command data
   * @param {string} template - Template string
   * @param {Object} data - Data to populate
   * @returns {string} Populated template
   */
  populateTemplate(template, data) {
    let content = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key.toUpperCase()}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return content;
  }

  /**
   * Get agent tool command template
   * @returns {string} Template content
   */
  getAgentToolTemplate() {
    return `# Super Agents {{AGENT_NAME}} - {{TOOL_DESCRIPTION}}

Execute the {{TOOL_NAME}} tool for specialized {{AGENT_NAME}} functionality.

## Description
{{TOOL_DESCRIPTION}} using the Super Agents {{AGENT_NAME}} agent.

## Usage
Use the MCP tool \`{{TOOL_NAME}}\` to perform this {{AGENT_NAME}} task:

\`\`\`
{{TOOL_NAME}}("{{EXAMPLE_INPUT}}")
\`\`\`

## What This Does
- Leverages the {{AGENT_NAME}} agent's specialized capabilities
- Uses the Super Agents framework for consistent results  
- Integrates with the overall project workflow
- Provides structured output following {{AGENT_NAME}} best practices

## Example Output
The tool will provide {{AGENT_NAME}}-specific analysis and recommendations based on the input provided.

## Integration
This command is part of the Super Agents {{AGENT_NAME}} workflow and works best when used in conjunction with other {{AGENT_NAME}} tools and the broader project methodology.
`;
  }

  /**
   * Get workflow command template
   * @returns {string} Template content
   */
  getWorkflowTemplate() {
    return `# {{WORKFLOW_TITLE}}

{{WORKFLOW_DESCRIPTION}}

## Overview
This workflow command orchestrates multiple Super Agents tools to complete the {{WORKFLOW_NAME}} phase of your project.

## Tools Executed
{{WORKFLOW_TOOLS}}

## Usage
Execute this workflow to:
1. Run the {{WORKFLOW_NAME}} phase
2. Coordinate multiple agents and tools
3. Ensure proper workflow progression
4. Generate comprehensive deliverables

## Workflow Integration
This command is part of the Super Agents methodology and should be executed in the proper sequence with other workflow phases.

## Expected Outcomes
- Completion of {{WORKFLOW_NAME}} phase
- Generated deliverables for next phase
- Updated project status and documentation
- Validated workflow progression
`;
  }

  /**
   * Get utility command template
   * @returns {string} Template content
   */
  getUtilityTemplate() {
    return `# {{TITLE}}

{{DESCRIPTION}}

## Usage
{{USAGE_INSTRUCTIONS}}

## Parameters
{{PARAMETERS}}

## Example
{{EXAMPLE}}
`;
  }

  /**
   * Get composite command template
   * @returns {string} Template content
   */
  getCompositeTemplate() {
    return `# {{TITLE}} - Composite Workflow

{{DESCRIPTION}}

## Workflow Steps
{{WORKFLOW_STEPS}}

## Tools Used
{{TOOLS_LIST}}

## Usage
{{USAGE_INSTRUCTIONS}}

## Integration
This composite command combines multiple Super Agents capabilities for comprehensive workflow execution.
`;
  }

  /**
   * Get task tracker hook template
   * @returns {string} Template content
   */
  getTaskTrackerHookTemplate() {
    return `// {{HOOK_NAME}} - {{HOOK_DESCRIPTION}}
// Events: {{HOOK_EVENTS}}

export default function {{HOOK_NAME}}Hook(event) {
  console.log(\`[{{HOOK_NAME}}] Event received: \${event.type}\`);
  
  // Track Super Agents tool executions
  if (event.type === 'tool_call' && event.toolName?.startsWith('sa-')) {
    console.log(\`Super Agents tool executed: \${event.toolName}\`);
    
    // Update task status if task-related tool
    if (event.toolName.includes('task') || event.toolName.includes('story')) {
      console.log('Task-related tool executed - updating workflow progress');
      
      // Could integrate with external task tracking systems here
      // Example: updateTaskStatus(event.toolName, event.result);
    }
    
    // Track workflow progression
    if (event.toolName.includes('workflow')) {
      console.log(\`Workflow tool executed: \${event.toolName}\`);
      
      if (event.result?.phase) {
        console.log(\`Current workflow phase: \${event.result.phase}\`);
      }
    }
  }
  
  // Handle task completion events
  if (event.type === 'task_complete') {
    console.log(\`Task completed: \${event.taskId || 'unknown'}\`);
    
    // Could trigger notifications or updates here
    // Example: notifyTaskComplete(event);
  }
}
`;
  }

  /**
   * Get workflow monitor hook template
   * @returns {string} Template content
   */
  getWorkflowMonitorHookTemplate() {
    return `// {{HOOK_NAME}} - {{HOOK_DESCRIPTION}}
// Events: {{HOOK_EVENTS}}

export default function {{HOOK_NAME}}Hook(event) {
  console.log(\`[{{HOOK_NAME}}] Event received: \${event.type}\`);
  
  // Monitor workflow phase changes
  if (event.type === 'workflow_phase_change') {
    console.log(\`Workflow phase changed: \${event.fromPhase} -> \${event.toPhase}\`);
    
    // Log phase transition
    console.log(\`Phase transition at: \${new Date().toISOString()}\`);
    
    // Could integrate with project management tools here
    // Example: updateProjectPhase(event.toPhase);
  }
  
  // Handle workflow completion
  if (event.type === 'workflow_complete') {
    console.log(\`Workflow completed: \${event.workflowName}\`);
    
    if (event.metrics) {
      console.log(\`Workflow metrics:\`, event.metrics);
    }
    
    // Could trigger completion notifications here
    // Example: notifyWorkflowComplete(event);
  }
  
  // Monitor Super Agents workflow tools
  if (event.type === 'tool_call' && event.toolName?.startsWith('sa-workflow')) {
    console.log(\`Workflow tool executed: \${event.toolName}\`);
    
    if (event.result?.status) {
      console.log(\`Workflow status: \${event.result.status}\`);
    }
    
    if (event.result?.nextSteps) {
      console.log(\`Next steps: \${event.result.nextSteps.join(', ')}\`);
    }
  }
}
`;
  }

  /**
   * Get error handler hook template
   * @returns {string} Template content
   */
  getErrorHandlerHookTemplate() {
    return `// {{HOOK_NAME}} - {{HOOK_DESCRIPTION}}
// Events: {{HOOK_EVENTS}}

export default function {{HOOK_NAME}}Hook(event) {
  console.log(\`[{{HOOK_NAME}}] Event received: \${event.type}\`);
  
  // Handle tool execution errors
  if (event.type === 'tool_error') {
    console.error(\`Tool execution error: \${event.toolName}\`);
    console.error(\`Error message: \${event.error?.message}\`);
    
    // Log error details for debugging
    if (event.error?.stack) {
      console.error(\`Error stack:\`, event.error.stack);
    }
    
    if (event.arguments) {
      console.error(\`Tool arguments:\`, event.arguments);
    }
    
    // Could implement error recovery strategies here
    // Example: attemptErrorRecovery(event);
  }
  
  // Handle execution failures
  if (event.type === 'execution_failed') {
    console.error(\`Execution failed: \${event.context}\`);
    
    if (event.retryCount) {
      console.error(\`Retry count: \${event.retryCount}\`);
    }
    
    // Could trigger fallback mechanisms here
    // Example: triggerFallback(event);
  }
  
  // Monitor Super Agents tool errors specifically
  if (event.toolName?.startsWith('sa-') && event.type === 'tool_error') {
    console.error(\`Super Agents tool error: \${event.toolName}\`);
    
    // Could implement SA-specific error handling
    // Example: handleSuperAgentsError(event);
  }
}
`;
  }

  /**
   * Get progress tracker hook template
   * @returns {string} Template content
   */
  getProgressTrackerHookTemplate() {
    return `// {{HOOK_NAME}} - {{HOOK_DESCRIPTION}}
// Events: {{HOOK_EVENTS}}

export default function {{HOOK_NAME}}Hook(event) {
  console.log(\`[{{HOOK_NAME}}] Event received: \${event.type}\`);
  
  // Track progress updates
  if (event.type === 'progress_update') {
    console.log(\`Progress update: \${event.progress}% complete\`);
    
    if (event.milestone) {
      console.log(\`Current milestone: \${event.milestone}\`);
    }
    
    if (event.tasksCompleted && event.totalTasks) {
      console.log(\`Tasks: \${event.tasksCompleted}/\${event.totalTasks} completed\`);
    }
    
    // Could update progress tracking systems here
    // Example: updateProgressDashboard(event);
  }
  
  // Handle milestone reached events
  if (event.type === 'milestone_reached') {
    console.log(\`Milestone reached: \${event.milestone}\`);
    
    if (event.completionTime) {
      console.log(\`Completion time: \${event.completionTime}\`);
    }
    
    // Could trigger milestone notifications here
    // Example: notifyMilestoneReached(event);
  }
  
  // Track Super Agents progress tools
  if (event.type === 'tool_call' && event.toolName === 'sa-track-progress') {
    console.log('Progress tracking tool executed');
    
    if (event.result?.progress) {
      console.log(\`Current progress:\`, event.result.progress);
    }
    
    if (event.result?.velocity) {
      console.log(\`Team velocity: \${event.result.velocity}\`);
    }
  }
}
`;
  }

  /**
   * Get generation statistics
   * @returns {Object} Statistics
   */
  getGenerationStats() {
    return {
      commandsGenerated: this.generatedCommands.size,
      hooksGenerated: this.generatedHooks.size,
      commandTypes: this.getCommandTypes(),
      hookTypes: this.getHookTypes(),
      timestamp: new Date()
    };
  }

  /**
   * Get command types breakdown
   * @returns {Object} Command types
   */
  getCommandTypes() {
    const types = {};
    for (const command of this.generatedCommands.values()) {
      types[command.type] = (types[command.type] || 0) + 1;
    }
    return types;
  }

  /**
   * Get hook types breakdown
   * @returns {Object} Hook types
   */
  getHookTypes() {
    const types = {};
    for (const hook of this.generatedHooks.values()) {
      types[hook.type] = (types[hook.type] || 0) + 1;
    }
    return types;
  }

  /**
   * Clean up generated files
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      this.log('Cleaning up generated commands and hooks');

      // Could implement file cleanup here if needed
      
      this.generatedCommands.clear();
      this.generatedHooks.clear();
      
      this.log('Command generator cleanup completed');
      
    } catch (error) {
      this.log('Error during cleanup', { error: error.message });
      throw error;
    }
  }

  /**
   * Logging utility
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} level - Log level
   */
  log(message, data = {}, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      component: 'CommandGenerator',
      ...data
    };
    
    this.emit('log', logEntry);
    
    switch (level) {
      case 'error':
        console.error(`[CommandGenerator ERROR] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[CommandGenerator WARN] ${message}`, data);
        break;
      default:
        console.log(`[CommandGenerator INFO] ${message}`, data);
    }
  }
}