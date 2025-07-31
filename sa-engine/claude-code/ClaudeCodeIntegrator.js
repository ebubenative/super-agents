import { EventEmitter } from 'events';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import MCPServer from '../mcp-server/MCPServer.js';
import ToolRegistry from '../mcp-server/ToolRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Claude Code Integrator - Manages integration with Claude Code IDE
 * Provides MCP server integration and standalone setup capabilities
 */
export default class ClaudeCodeIntegrator extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      claudeConfigPath: options.claudeConfigPath || '.claude',
      mcpConfigFile: options.mcpConfigFile || 'mcp-config.json',
      standaloneMode: options.standaloneMode || false,
      autoGenerateCommands: options.autoGenerateCommands !== false,
      includeHooks: options.includeHooks !== false,
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.mcpServer = null;
    this.toolRegistry = null;
    this.isIntegrated = false;
    this.generatedFiles = new Map();
    
    this.log('Claude Code Integrator initialized', { options: this.options });
  }

  /**
   * Initialize Claude Code integration
   * @param {Object} config - Integration configuration
   * @returns {Promise<void>}
   */
  async initialize(config = {}) {
    try {
      this.log('Initializing Claude Code integration');
      this.emit('integrationStarting', { config });

      // Merge configuration
      const integrationConfig = { ...this.options, ...config };
      
      // Initialize tool registry
      this.toolRegistry = new ToolRegistry({
        toolsPath: join(this.options.projectRoot, 'sa-engine/mcp-server/tools'),
        logLevel: integrationConfig.logLevel
      });

      await this.toolRegistry.initialize();

      // Setup MCP server if not in standalone mode
      if (!integrationConfig.standaloneMode) {
        await this.setupMCPIntegration(integrationConfig);
      }

      // Setup standalone integration
      await this.setupStandaloneIntegration(integrationConfig);

      this.isIntegrated = true;
      this.log('Claude Code integration completed successfully');
      this.emit('integrationCompleted', { 
        toolCount: this.toolRegistry?.tools?.size || 0,
        generatedFiles: this.generatedFiles.size
      });

    } catch (error) {
      this.log('Failed to initialize Claude Code integration', { error: error.message });
      this.emit('integrationError', { error, context: 'initialization' });
      throw error;
    }
  }

  /**
   * Setup MCP server integration
   * @param {Object} config - MCP configuration
   * @returns {Promise<void>}
   */
  async setupMCPIntegration(config) {
    try {
      this.log('Setting up MCP server integration');

      // Create MCP server instance
      this.mcpServer = new MCPServer({
        name: 'super-agents-claude-code',
        version: '1.0.0',
        description: 'Super Agents MCP Server for Claude Code integration',
        toolsPath: join(config.projectRoot, 'sa-engine/mcp-server/tools'),
        logLevel: config.logLevel
      });

      // Register all tools from the tool registry
      if (this.toolRegistry && this.toolRegistry.tools) {
        const tools = Array.from(this.toolRegistry.tools.values());
        for (const tool of tools) {
          this.mcpServer.registerTool(tool);
        }
      }

      // Generate MCP configuration file
      await this.generateMCPConfig(config);

      this.log('MCP server integration setup completed', {
        toolCount: this.mcpServer.registeredTools.size
      });

    } catch (error) {
      this.log('Failed to setup MCP integration', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup standalone integration with custom commands and files
   * @param {Object} config - Standalone configuration
   * @returns {Promise<void>}
   */
  async setupStandaloneIntegration(config) {
    try {
      this.log('Setting up standalone integration');

      const claudeDir = join(config.projectRoot, config.claudeConfigPath);
      
      // Create .claude directory structure
      await this.createClaudeDirectoryStructure(claudeDir);

      // Note: Claude Code settings are managed by Claude Code itself
      // We no longer generate settings.json to avoid conflicts with permissions

      // Generate custom slash commands
      if (config.autoGenerateCommands) {
        await this.generateSlashCommands(claudeDir, config);
      }

      // Generate agent files
      await this.generateAgentFiles(claudeDir, config);

      // Generate hooks
      if (config.includeHooks) {
        await this.generateHooks(claudeDir, config);
      }

      // Generate CLAUDE.md memory file
      await this.generateClaudeMemoryFile(config.projectRoot, config);

      this.log('Standalone integration setup completed', {
        generatedFiles: this.generatedFiles.size
      });

    } catch (error) {
      this.log('Failed to setup standalone integration', { error: error.message });
      throw error;
    }
  }

  /**
   * Create Claude Code directory structure
   * @param {string} claudeDir - Claude directory path
   * @returns {Promise<void>}
   */
  async createClaudeDirectoryStructure(claudeDir) {
    const subdirs = ['commands', 'hooks', 'agents'];
    
    if (!existsSync(claudeDir)) {
      await mkdir(claudeDir, { recursive: true });
    }

    for (const subdir of subdirs) {
      const subdirPath = join(claudeDir, subdir);
      if (!existsSync(subdirPath)) {
        await mkdir(subdirPath, { recursive: true });
      }
    }

    this.log('Claude directory structure created', { claudeDir, subdirs });
  }

  /**
   * Generate MCP configuration file
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async generateMCPConfig(config) {
    try {
      const mcpConfig = {
        mcpServers: {
          "super-agents": {
            command: "node",
            args: ["sa-engine/mcp-server/index.js"],
            env: {
              SA_PROJECT_ROOT: ".",
              ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}",
              OPENAI_API_KEY: "${OPENAI_API_KEY}",
              SA_LOG_LEVEL: config.logLevel || "info"
            }
          }
        }
      };

      // Place mcp-config.json in .claude directory instead of project root
      const configPath = join(config.projectRoot, config.claudeConfigPath, config.mcpConfigFile);
      
      // Ensure the .claude directory exists before writing the config file
      const configDir = dirname(configPath);
      if (!existsSync(configDir)) {
        await mkdir(configDir, { recursive: true });
        this.log('Created Claude config directory', { configDir });
      }
      
      await writeFile(configPath, JSON.stringify(mcpConfig, null, 2));
      
      this.generatedFiles.set(configPath, 'mcp-config');
      this.log('MCP configuration generated', { configPath });
      
    } catch (error) {
      this.log('Failed to generate MCP configuration', { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Generate Claude Code settings
   * @deprecated This function is kept for backward compatibility but should not be used.
   * Claude Code manages its own settings.json file and permissions.
   * @param {string} claudeDir - Claude directory path  
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async generateClaudeSettings(claudeDir, config) {
    const settings = {
      "mcp": {
        "servers": {
          "super-agents": {
            "command": "node",
            "args": ["sa-engine/mcp-server/index.js"],
            "env": {
              "SA_PROJECT_ROOT": ".",
              "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
              "OPENAI_API_KEY": "${OPENAI_API_KEY}",
              "SA_LOG_LEVEL": config.logLevel || "info"
            }
          }
        }
      },
      "tools": {
        "allowlist": ["super-agents:*"]
      },
      "hooks": {
        "enabled": config.includeHooks
      }
    };

    const settingsPath = join(claudeDir, 'settings.json');
    await writeFile(settingsPath, JSON.stringify(settings, null, 2));
    
    this.generatedFiles.set(settingsPath, 'settings');
    this.log('Claude settings generated', { settingsPath });
  }

  /**
   * Generate custom slash commands
   * @param {string} claudeDir - Claude directory path
   * @param {Object} config - Configuration  
   * @returns {Promise<void>}
   */
  async generateSlashCommands(claudeDir, config) {
    const commandsDir = join(claudeDir, 'commands');
    
    // Get all tools from registry
    const tools = this.toolRegistry && this.toolRegistry.tools ? 
      Array.from(this.toolRegistry.tools.values()) : [];
    
    // Group tools by agent/category
    const toolsByCategory = new Map();
    
    for (const tool of tools) {
      const category = tool.category || 'general';
      if (!toolsByCategory.has(category)) {
        toolsByCategory.set(category, []);
      }
      toolsByCategory.get(category).push({ name: tool.name, tool });
    }

    // Generate commands for each category
    for (const [category, categoryTools] of toolsByCategory) {
      await this.generateCategoryCommands(commandsDir, category, categoryTools);
    }

    // Generate workflow commands
    await this.generateWorkflowCommands(commandsDir);

    this.log('Slash commands generated', { 
      categories: toolsByCategory.size,
      commandsDir 
    });
  }

  /**
   * Generate commands for a specific category/agent
   * @param {string} commandsDir - Commands directory path
   * @param {string} category - Tool category
   * @param {Array} tools - Tools in the category
   * @returns {Promise<void>}
   */
  async generateCategoryCommands(commandsDir, category, tools) {
    for (const { name, tool } of tools) {
      const commandName = name.replace('sa-', '');
      const commandFile = `sa-${category}-${commandName}.md`;
      const commandPath = join(commandsDir, commandFile);

      const commandContent = `# Super Agents ${category.toUpperCase()} - ${tool.description}

Use the MCP tool \`${name}\` to ${tool.description.toLowerCase()}.

## Usage
Execute the ${name} tool with the following parameters:

${this.generateParameterDocs(tool.inputSchema)}

## Example
\`\`\`
${name}${this.generateExampleCall(tool.inputSchema)}
\`\`\`

This command leverages the Super Agents framework to provide ${category} capabilities through the ${name} tool.
`;

      await writeFile(commandPath, commandContent);
      this.generatedFiles.set(commandPath, 'command');
    }
  }

  /**
   * Generate workflow-specific commands
   * @param {string} commandsDir - Commands directory path
   * @returns {Promise<void>}
   */
  async generateWorkflowCommands(commandsDir) {
    const workflowCommands = [
      {
        name: 'sa-start-project',
        description: 'Start a new Super Agents project workflow',
        content: `# Start Super Agents Project Workflow

Initialize a new project using the Super Agents methodology.

Use the \`sa-initialize-project\` tool to set up the project structure and begin the development workflow.

## Usage
Execute \`sa-initialize-project\` with project details to create tasks, setup agents, and initialize the workflow.

This will create a comprehensive project structure with tasks, dependencies, and agent assignments following the Super Agents methodology.
`
      },
      {
        name: 'sa-track-progress',
        description: 'Track current workflow progress',
        content: `# Track Super Agents Workflow Progress

Monitor the current state of your Super Agents project workflow.

Use the \`sa-track-progress\` tool to get detailed information about task completion, agent status, and workflow phases.

## Usage
Execute \`sa-track-progress\` to see:
- Current workflow phase
- Completed and pending tasks
- Agent assignments and status
- Next recommended actions

This provides comprehensive visibility into your project's progress using the Super Agents framework.
`
      }
    ];

    for (const cmd of workflowCommands) {
      const commandPath = join(commandsDir, `${cmd.name}.md`);
      await writeFile(commandPath, cmd.content);
      this.generatedFiles.set(commandPath, 'workflow-command');
    }
  }

  /**
   * Generate agent documentation files
   * @param {string} claudeDir - Claude directory path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async generateAgentFiles(claudeDir, config) {
    const agentsDir = join(claudeDir, 'agents');
    const agentConfigsPath = join(config.projectRoot, 'sa-engine/agents');

    // Read agent configurations
    const agentFiles = [
      'analyst.json', 'architect.json', 'developer.json', 'pm.json',
      'product-owner.json', 'qa.json', 'scrum-master.json', 'ux-expert.json'
    ];

    for (const agentFile of agentFiles) {
      const agentConfigPath = join(agentConfigsPath, agentFile);
      
      if (existsSync(agentConfigPath)) {
        const agentConfig = JSON.parse(await readFile(agentConfigPath, 'utf-8'));
        const agentName = agentFile.replace('.json', '');
        
        await this.generateAgentDocumentation(agentsDir, agentName, agentConfig);
      }
    }

    this.log('Agent files generated', { agentsDir });
  }

  /**
   * Generate documentation for a specific agent
   * @param {string} agentsDir - Agents directory path
   * @param {string} agentName - Agent name
   * @param {Object} agentConfig - Agent configuration
   * @returns {Promise<void>}
   */
  async generateAgentDocumentation(agentsDir, agentName, agentConfig) {
    // Get available tools for this agent
    const agentTools = this.getAgentTools(agentName);
    const toolNames = agentTools.map(tool => tool.name.replace('sa-', '')).join(', ');
    
    // Generate 2025 Claude Code subagent format with YAML frontmatter
    const agentDoc = `---
name: ${agentName}
description: Use proactively for ${agentConfig.agent?.whenToUse || agentConfig.persona?.identity || `${agentName} tasks`}
tools: ${toolNames || 'core, workflow'}
---

# ${agentConfig.agent?.name || agentConfig.name} - ${agentConfig.agent?.title || 'Super Agents Specialist'}

You are ${agentConfig.persona?.identity || `a specialized ${agentName} agent`} within the Super Agents framework.

## Your Role
${agentConfig.persona?.role || agentConfig.role || `Expert ${agentName} specializing in ${agentName}-specific tasks`}

## Your Core Principles
${agentConfig.persona?.core_principles ? agentConfig.persona.core_principles.map(p => `- ${p}`).join('\n') : 
  agentConfig.responsibilities ? agentConfig.responsibilities.map(r => `- ${r}`).join('\n') :
  `- Provide expert ${agentName} guidance and solutions
- Follow Super Agents methodology and best practices
- Collaborate effectively with other agents in the framework
- Deliver high-quality, actionable results`}

## Your Capabilities
${agentConfig.capabilities?.commands ? 
  agentConfig.capabilities.commands.map(cmd => `- **${cmd.name}**: ${cmd.description}`).join('\n') :
  agentTools.length > 0 ? 
  agentTools.map(tool => `- **${tool.name}**: ${tool.description}`).join('\n') :
  `- Specialized ${agentName} functionality within Super Agents framework`}

## Your Approach
- **${agentConfig.persona?.style || 'Professional, thorough, collaborative'}**
- **Focus**: ${agentConfig.persona?.focus || `${agentName} excellence and quality delivery`}
- **Methodology**: Follow Super Agents structured approach for ${agentName} tasks
- **Collaboration**: Work seamlessly with other Super Agents team members

## When to Use This Agent
${agentConfig.agent?.whenToUse || `Use proactively when ${agentName} expertise is needed for project success`}

## Workflow Integration
As a Super Agents team member, you integrate with:
- **Analyst**: For research and requirements gathering
- **PM**: For product requirements and planning
- **Architect**: For system design and technical decisions
- **Developer**: For implementation and coding tasks
- **QA**: For quality assurance and testing
- **Product Owner**: For story validation and acceptance
- **UX Expert**: For user experience and interface design
- **Scrum Master**: For workflow management and coordination

Always maintain your specialized focus while supporting the overall Super Agents methodology and team collaboration.
`;

    const agentPath = join(agentsDir, `${agentName}.md`);
    await writeFile(agentPath, agentDoc);
    this.generatedFiles.set(agentPath, 'agent-subagent');
  }

  /**
   * Get tools available for a specific agent
   * @param {string} agentName - Agent name
   * @returns {Array} Array of tools
   */
  getAgentTools(agentName) {
    if (!this.toolRegistry || !this.toolRegistry.tools) return [];
    
    const tools = Array.from(this.toolRegistry.tools.values());
    const agentTools = [];
    
    for (const tool of tools) {
      if (tool.category === agentName || tool.name.includes(agentName)) {
        agentTools.push({ name: tool.name, description: tool.description });
      }
    }
    
    return agentTools;
  }

  /**
   * Generate event hooks for workflow integration
   * @param {string} claudeDir - Claude directory path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async generateHooks(claudeDir, config) {
    const hooksDir = join(claudeDir, 'hooks');
    
    const hooks = [
      {
        name: 'sa-task-tracker.js',
        content: `// Super Agents Task Tracker Hook
// Executes when tasks are completed to update workflow status

export default function taskTrackerHook(event) {
  if (event.type === 'tool_call' && event.toolName.startsWith('sa-')) {
    console.log(\`Super Agents tool executed: \${event.toolName}\`);
    
    // Track task completion
    if (event.toolName.includes('task') || event.toolName.includes('story')) {
      console.log('Task-related tool executed - checking workflow progress');
    }
  }
}
`
      },
      {
        name: 'sa-workflow-monitor.js',
        content: `// Super Agents Workflow Monitor Hook
// Monitors workflow phase transitions and progress

export default function workflowMonitorHook(event) {
  if (event.type === 'tool_call' && event.toolName.startsWith('sa-workflow')) {
    console.log(\`Workflow tool executed: \${event.toolName}\`);
    
    // Monitor workflow state changes
    if (event.result && event.result.phase) {
      console.log(\`Workflow phase: \${event.result.phase}\`);
    }
  }
}
`
      }
    ];

    for (const hook of hooks) {
      const hookPath = join(hooksDir, hook.name);
      await writeFile(hookPath, hook.content);
      this.generatedFiles.set(hookPath, 'hook');
    }

    this.log('Hooks generated', { hooksDir });
  }

  /**
   * Generate CLAUDE.md memory file
   * @param {string} projectRoot - Project root path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async generateClaudeMemoryFile(projectRoot, config) {
    const claudeMemoryContent = `# Super Agents Framework - Claude Code Integration

This project uses the Super Agents framework to provide AI-powered development assistance through specialized agents and automated workflows.

## Available Agents

### Core Development Agents
- **Analyst**: Market research, competitive analysis, brainstorming sessions, and requirements gathering
- **PM (Product Manager)**: PRD generation, epic creation, feature prioritization, and stakeholder analysis  
- **Architect**: System design, technology recommendations, architecture analysis, and design patterns
- **Developer**: Implementation, testing, debugging, and code validation
- **QA**: Code review, refactoring, quality validation, and test creation
- **Product Owner**: Checklist execution, story validation, course correction, and document management
- **UX Expert**: Frontend specifications, UI prompts, wireframes, and accessibility audits
- **Scrum Master**: Story creation, workflow management, progress tracking, and team coordination

## MCP Tools Available

${this.generateToolDocumentation()}

## Usage Patterns

### Starting a New Project
1. Use \`sa-initialize-project\` to set up the project structure
2. Use \`sa-generate-prd\` with the PM agent to create requirements
3. Use \`sa-create-architecture\` with the Architect to design the system
4. Use \`sa-generate-tasks\` to break down work into manageable tasks

### Development Workflow  
1. Use \`sa-create-story\` to create user stories
2. Use \`sa-implement-story\` with the Developer agent to build features
3. Use \`sa-review-code\` with the QA agent for quality assurance
4. Use \`sa-track-progress\` to monitor workflow status

### Collaboration Patterns
- Analysts gather requirements → PMs create PRDs → Architects design systems → Developers implement
- QA agents review code → Product Owners validate stories → Scrum Masters track progress
- UX Experts create specifications → Developers implement UI → QA validates accessibility

## Best Practices

### Agent Usage
- Use specific agents for their specialized tasks
- Leverage agent collaboration for complex workflows
- Follow the Super Agents methodology for optimal results

### Workflow Optimization  
- Initialize projects properly with \`sa-initialize-project\`
- Track dependencies using \`sa-dependency-graph\`
- Monitor progress regularly with \`sa-track-progress\`
- Validate implementations with appropriate QA tools

### Performance Considerations
- Use task-specific tools rather than general-purpose ones
- Break complex work into smaller, manageable tasks
- Leverage agent specializations for efficiency

## Common Commands

- \`/sa-start-project\` - Initialize a new Super Agents project
- \`/sa-track-progress\` - Check current workflow status  
- \`/sa-research <topic>\` - Run analyst research on a topic
- \`/sa-create-prd <feature>\` - Generate PRD with PM agent
- \`/sa-implement <story>\` - Implement feature with developer agent

## Integration Details

This Claude Code integration provides:
- Full MCP server support with all Super Agents tools
- Custom slash commands for common workflows
- Agent-specific documentation and usage patterns
- Event hooks for workflow monitoring
- Comprehensive tool registration and validation

For support and documentation, refer to the Super Agents framework documentation in the project repository.
`;

    const claudeMemoryPath = join(projectRoot, 'CLAUDE.md');
    await writeFile(claudeMemoryPath, claudeMemoryContent);
    this.generatedFiles.set(claudeMemoryPath, 'memory-file');

    this.log('CLAUDE.md memory file generated', { claudeMemoryPath });
  }

  /**
   * Generate tool documentation for CLAUDE.md
   * @returns {string} Tool documentation
   */
  generateToolDocumentation() {
    if (!this.toolRegistry || !this.toolRegistry.tools) return 'Tools will be available after MCP server initialization.';

    const tools = Array.from(this.toolRegistry.tools.values());
    const toolsByCategory = new Map();

    // Group tools by category
    for (const tool of tools) {
      const category = tool.category || 'general';
      if (!toolsByCategory.has(category)) {
        toolsByCategory.set(category, []);
      }
      toolsByCategory.get(category).push({ name: tool.name, tool });
    }

    let documentation = '';
    
    for (const [category, categoryTools] of toolsByCategory) {
      documentation += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)} Tools\n`;
      
      for (const { name, tool } of categoryTools) {
        documentation += `- **${name}**: ${tool.description}\n`;
      }
    }

    return documentation;
  }

  /**
   * Generate parameter documentation for tool schemas
   * @param {Object} schema - Tool input schema
   * @returns {string} Parameter documentation
   */
  generateParameterDocs(schema) {
    if (!schema || !schema.properties) return 'No parameters required.';

    let docs = '';
    for (const [param, def] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(param) ? ' (required)' : ' (optional)';
      docs += `- **${param}**${required}: ${def.description || 'No description available'}\n`;
    }
    
    return docs;
  }

  /**
   * Generate example tool call
   * @param {Object} schema - Tool input schema  
   * @returns {string} Example call
   */
  generateExampleCall(schema) {
    if (!schema || !schema.properties) return '';

    const params = [];
    for (const [param, def] of Object.entries(schema.properties)) {
      if (schema.required?.includes(param)) {
        const example = def.example || `"example_${param}"`;
        params.push(`"${param}": ${example}`);
      }
    }

    if (params.length === 0) return '';
    return `({ ${params.join(', ')} })`;
  }

  /**
   * Get integration status and statistics
   * @returns {Object} Integration status
   */
  getIntegrationStatus() {
    return {
      isIntegrated: this.isIntegrated,
      mcpServerActive: this.mcpServer?.isRunning || false,
      toolCount: this.toolRegistry?.tools?.size || 0,
      generatedFiles: this.generatedFiles.size,
      generatedFileTypes: Array.from(new Set(this.generatedFiles.values())),
      options: this.options
    };
  }

  /**
   * Clean up generated files and stop services
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      this.log('Cleaning up Claude Code integration');

      // Stop MCP server if running
      if (this.mcpServer?.isRunning) {
        await this.mcpServer.stopServer();
      }

      // Could implement file cleanup here if needed
      
      this.isIntegrated = false;
      this.log('Claude Code integration cleanup completed');
      
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
      component: 'ClaudeCodeIntegrator',
      ...data
    };
    
    this.emit('log', logEntry);
    
    switch (level) {
      case 'error':
        console.error(`[ClaudeCode ERROR] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[ClaudeCode WARN] ${message}`, data);
        break;
      default:
        console.log(`[ClaudeCode INFO] ${message}`, data);
    }
  }
}