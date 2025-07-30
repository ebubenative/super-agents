import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import AgentSystem from '../agents/AgentSystem.js';
import TemplateEngine from '../templates/TemplateEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AgentExporter - Export agents for manual IDE setup
 * Supports multiple output formats for different IDEs and AI assistants
 */
class AgentExporter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            agentsPath: options.agentsPath || path.join(__dirname, '../agents'),
            templatesPath: options.templatesPath || path.join(__dirname, '../templates'),
            outputPath: options.outputPath || process.cwd(),
            logLevel: options.logLevel || 'info',
            ...options
        };
        
        this.agentSystem = null;
        this.templateEngine = null;
        this.supportedFormats = [
            'claude-code',
            'cursor',
            'vscode',
            'windsurf',
            'generic',
            'markdown',
            'json'
        ];
        
        this.formatHandlers = {
            'claude-code': this.exportClaudeCode.bind(this),
            'cursor': this.exportCursor.bind(this),
            'vscode': this.exportVSCode.bind(this),
            'windsurf': this.exportWindsurf.bind(this),
            'generic': this.exportGeneric.bind(this),
            'markdown': this.exportMarkdown.bind(this),
            'json': this.exportJSON.bind(this)
        };
        
        this.log('AgentExporter initialized', { options: this.options });
    }

    /**
     * Initialize the exporter
     * @returns {Promise<void>}
     */
    async initialize() {
        this.log('Initializing AgentExporter');
        
        this.agentSystem = new AgentSystem(this.options.agentsPath);
        await this.agentSystem.loadAllAgents();
        
        this.templateEngine = new TemplateEngine(this.options.templatesPath);
        await this.templateEngine.initialize();
        
        this.log('AgentExporter initialized successfully', {
            agentsLoaded: this.agentSystem.listAgents().length,
            templatesAvailable: this.templateEngine.listTemplates().length
        });
        
        this.emit('initialized');
    }

    /**
     * Export agents in specified format
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportAgents(config = {}) {
        const startTime = Date.now();
        
        try {
            this.log('Starting agent export', { config });
            this.emit('exportStarted', { config });
            
            // Validate configuration
            this.validateExportConfig(config);
            
            // Get agents to export
            const agents = this.selectAgents(config);
            
            // Export agents
            const exportResult = await this.performExport(agents, config);
            
            const duration = Date.now() - startTime;
            
            this.log('Export completed successfully', { 
                duration,
                agentsExported: exportResult.exported.length,
                format: config.format
            });
            
            this.emit('exportCompleted', { result: exportResult, duration });
            
            return {
                success: true,
                duration,
                format: config.format,
                exported: exportResult.exported,
                outputPath: exportResult.outputPath,
                files: exportResult.files
            };
            
        } catch (error) {
            this.log('Export failed', { error: error.message }, 'error');
            this.emit('exportFailed', { error });
            throw error;
        }
    }

    /**
     * Validate export configuration
     * @param {Object} config - Export configuration
     */
    validateExportConfig(config) {
        if (!config.format) {
            throw new Error('Export format is required');
        }
        
        if (!this.supportedFormats.includes(config.format)) {
            throw new Error(`Unsupported format: ${config.format}. Supported formats: ${this.supportedFormats.join(', ')}`);
        }
        
        if (config.agents && !Array.isArray(config.agents)) {
            throw new Error('Agents must be an array');
        }
        
        if (config.bundle && typeof config.bundle !== 'string') {
            throw new Error('Bundle must be a string');
        }
    }

    /**
     * Select agents to export based on configuration
     * @param {Object} config - Export configuration
     * @returns {Array} Selected agents
     */
    selectAgents(config) {
        let agents = this.agentSystem.listAgents();
        
        // Filter by specific agents
        if (config.agents && config.agents.length > 0) {
            agents = agents.filter(agent => 
                config.agents.includes(agent.agent.id) || 
                config.agents.includes(agent.agent.name)
            );
        }
        
        // Filter by bundle
        if (config.bundle) {
            agents = this.selectAgentsByBundle(agents, config.bundle);
        }
        
        // Filter by type
        if (config.type) {
            agents = agents.filter(agent => agent.agent.type === config.type);
        }
        
        // Filter by status
        if (config.status) {
            agents = agents.filter(agent => agent.agent.status === config.status);
        }
        
        if (agents.length === 0) {
            throw new Error('No agents selected for export');
        }
        
        this.log(`Selected ${agents.length} agents for export`);
        return agents;
    }

    /**
     * Select agents by bundle
     * @param {Array} agents - Available agents
     * @param {string} bundleName - Bundle name
     * @returns {Array} Filtered agents
     */
    selectAgentsByBundle(agents, bundleName) {
        const bundles = {
            'fullstack': ['analyst', 'pm', 'architect', 'developer', 'qa', 'product-owner', 'ux-expert', 'scrum-master'],
            'backend': ['pm', 'architect', 'developer', 'qa'],
            'frontend': ['ux-expert', 'developer', 'qa', 'product-owner'],
            'minimal': ['pm', 'developer', 'qa'],
            'enterprise': ['analyst', 'pm', 'architect', 'developer', 'qa', 'product-owner', 'ux-expert', 'scrum-master', 'bmad-master', 'bmad-orchestrator'],
            'all': agents.map(a => a.agent.id)
        };
        
        const bundleAgents = bundles[bundleName];
        if (!bundleAgents) {
            throw new Error(`Unknown bundle: ${bundleName}. Available bundles: ${Object.keys(bundles).join(', ')}`);
        }
        
        return agents.filter(agent => bundleAgents.includes(agent.agent.id));
    }

    /**
     * Perform the actual export
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async performExport(agents, config) {
        const handler = this.formatHandlers[config.format];
        if (!handler) {
            throw new Error(`No handler for format: ${config.format}`);
        }
        
        return await handler(agents, config);
    }

    /**
     * Export for Claude Code
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportClaudeCode(agents, config) {
        const outputDir = path.join(this.options.outputPath, 'claude-code-export');
        fs.mkdirSync(outputDir, { recursive: true });
        
        const exported = [];
        const files = [];
        
        // Generate CLAUDE.md memory file
        const claudeMemoryContent = this.generateClaudeMemoryFile(agents, config);
        const claudeMemoryPath = path.join(outputDir, 'CLAUDE.md');
        fs.writeFileSync(claudeMemoryPath, claudeMemoryContent);
        files.push(claudeMemoryPath);
        
        // Generate MCP server configuration
        const mcpConfig = this.generateMCPServerConfig(agents, config);
        const mcpConfigPath = path.join(outputDir, 'mcp_servers.json');
        fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        files.push(mcpConfigPath);
        
        // Generate individual agent files
        for (const agent of agents) {
            const agentContent = this.generateClaudeCodeAgentFile(agent, config);
            const agentPath = path.join(outputDir, `${agent.agent.id}.md`);
            fs.writeFileSync(agentPath, agentContent);
            files.push(agentPath);
            
            exported.push({
                id: agent.agent.id,
                name: agent.agent.name,
                file: agentPath
            });
        }
        
        // Generate setup instructions
        const setupInstructions = this.generateClaudeCodeSetupInstructions(agents, config);
        const setupPath = path.join(outputDir, 'SETUP.md');
        fs.writeFileSync(setupPath, setupInstructions);
        files.push(setupPath);
        
        return {
            exported,
            outputPath: outputDir,
            files,
            format: 'claude-code'
        };
    }

    /**
     * Generate Claude memory file
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Memory file content
     */
    generateClaudeMemoryFile(agents, config) {
        return `# Super Agents Framework - Claude Code Integration

## Overview
This Claude Code workspace is integrated with the Super Agents framework, providing access to ${agents.length} specialized AI agents for software development workflows.

## Available Agents

${agents.map(agent => `### ${agent.agent.title} (${agent.agent.id})
**Role**: ${agent.persona.role}
**Focus**: ${agent.persona.focus}
**When to use**: ${agent.agent.whenToUse || 'Use for ' + agent.persona.focus}

**Core Principles**:
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

**Available Commands**:
${agent.capabilities.commands.map(cmd => `- \`${cmd.name}\`: ${cmd.description}`).join('\n')}
`).join('\n---\n\n')}

## Task Management

The Super Agents framework uses a hierarchical task management system:

- **Task IDs**: Use format 1.2.3 (hierarchical numbering)
- **Status Flow**: pending → in-progress → review → done
- **Priorities**: low, medium, high, critical
- **Types**: feature, bug, enhancement, documentation, infrastructure, research

## Templates Available

The framework includes templates for:
- Project Requirements Documents (PRD)
- System Architecture Documentation
- User Stories and Epics
- Project Briefs
- Market Research Reports
- Competitive Analysis

## MCP Tools

Use the following MCP tools to interact with the Super Agents framework:
- \`sa_initialize_project\` - Initialize new projects
- \`sa_list_tasks\` - List current tasks
- \`sa_get_task\` - Get task details
- \`sa_update_task_status\` - Update task status
- \`sa_create_story\` - Create user stories
- \`sa_generate_prd\` - Generate PRD documents
- \`sa_design_system\` - Create system designs

## Best Practices

1. **Agent Selection**: Choose the right agent for each task type
2. **Task Breakdown**: Use hierarchical task structure for complex work
3. **Template Usage**: Leverage templates for consistent documentation
4. **Status Tracking**: Keep task statuses updated throughout development
5. **Agent Collaboration**: Multiple agents can work on related tasks

## Getting Started

1. Use \`sa_initialize_project\` to set up a new project
2. Create initial tasks with appropriate agent assignments
3. Use agent-specific commands for specialized work
4. Track progress with task management tools
5. Generate documentation using templates

Generated on: ${new Date().toISOString()}
Agents included: ${agents.map(a => a.agent.id).join(', ')}
`;
    }

    /**
     * Generate MCP server configuration
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Object} MCP server configuration
     */
    generateMCPServerConfig(agents, config) {
        return {
            mcpServers: {
                "super-agents": {
                    command: "node",
                    args: ["path/to/super-agents/mcp-server/index.js"],
                    env: {
                        "SA_AGENTS_PATH": "path/to/super-agents/agents",
                        "SA_TEMPLATES_PATH": "path/to/super-agents/templates",
                        "SA_TASKS_PATH": "path/to/super-agents/tasks"
                    }
                }
            }
        };
    }

    /**
     * Generate Claude Code agent file
     * @param {Object} agent - Agent data
     * @param {Object} config - Export configuration
     * @returns {string} Agent file content
     */
    generateClaudeCodeAgentFile(agent, config) {
        return `# ${agent.agent.title}

## Identity
${agent.persona.identity}

## Role
${agent.persona.role}

## Communication Style
${agent.persona.style}

## Focus Areas
${agent.persona.focus}

## Core Principles
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

## Available Commands

${agent.capabilities.commands.map(cmd => `### ${cmd.name}
**Description**: ${cmd.description}
**Usage**: ${cmd.usage}
${cmd.mcp_tool ? `**MCP Tool**: ${cmd.mcp_tool}` : ''}
`).join('\n')}

## Dependencies
${agent.dependencies ? Object.entries(agent.dependencies).map(([type, deps]) => 
    `**${type}**: ${deps.join(', ')}`
).join('\n') : 'None'}

## When to Use This Agent
${agent.agent.whenToUse || `Use this agent when you need ${agent.persona.focus.toLowerCase()}`}

---
*Generated by Super Agents Framework*
`;
    }

    /**
     * Generate Claude Code setup instructions
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Setup instructions
     */
    generateClaudeCodeSetupInstructions(agents, config) {
        return `# Super Agents - Claude Code Setup Instructions

## Prerequisites
- Claude Code installed and configured
- Node.js 18+ installed
- Super Agents framework downloaded

## Installation Steps

### 1. Install Super Agents Framework
\`\`\`bash
# Download and install Super Agents
git clone <super-agents-repo>
cd super-agents
npm install
\`\`\`

### 2. Configure MCP Server
Copy the \`mcp_servers.json\` file to your Claude Code configuration directory:

**macOS/Linux:**
\`\`\`bash
cp mcp_servers.json ~/.config/claude-code/
\`\`\`

**Windows:**
\`\`\`bash
cp mcp_servers.json %APPDATA%/claude-code/
\`\`\`

### 3. Update MCP Server Paths
Edit the \`mcp_servers.json\` file and update the paths:
- Replace \`path/to/super-agents\` with your actual Super Agents installation path

### 4. Add Memory File
Copy the \`CLAUDE.md\` file to your project root or Claude Code workspace.

### 5. Test Installation
Open Claude Code and test the installation:
1. Open a new chat
2. Try using an MCP tool: \`sa_list_tasks\`
3. Verify agents are accessible

## Available Agents
${agents.map(agent => `- **${agent.agent.title}** (\`${agent.agent.id}\`): ${agent.persona.role}`).join('\n')}

## Usage Examples

### Initialize a New Project
\`\`\`
Use the sa_initialize_project tool to create a new project with Super Agents integration.
\`\`\`

### Create a Task
\`\`\`
Ask the PM agent to create a project task, or use sa_create_story to generate user stories.
\`\`\`

### Generate Documentation
\`\`\`
Use the analyst agent with sa_generate_prd to create a Product Requirements Document.
\`\`\`

## Troubleshooting

### MCP Server Not Found
- Verify the path in \`mcp_servers.json\` is correct
- Ensure Node.js is in your PATH
- Check Claude Code logs for errors

### Agents Not Responding
- Verify agent files are in the correct location
- Check that MCP server is running
- Restart Claude Code

### Tool Execution Errors
- Ensure all dependencies are installed
- Check file permissions
- Verify configuration paths

## Support
For issues and questions:
- Check the Super Agents documentation
- Review Claude Code MCP integration guide
- File issues in the Super Agents repository

Generated on: ${new Date().toISOString()}
`;
    }

    /**
     * Export for Cursor
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportCursor(agents, config) {
        const outputDir = path.join(this.options.outputPath, 'cursor-export');
        fs.mkdirSync(outputDir, { recursive: true });
        
        const exported = [];
        const files = [];
        
        // Generate main rules file
        const rulesContent = this.generateCursorRulesFile(agents, config);
        const rulesPath = path.join(outputDir, 'super-agents.md');
        fs.writeFileSync(rulesPath, rulesContent);
        files.push(rulesPath);
        
        // Generate individual agent rules
        const agentRulesDir = path.join(outputDir, 'agents');
        fs.mkdirSync(agentRulesDir, { recursive: true });
        
        for (const agent of agents) {
            const agentRules = this.generateCursorAgentRules(agent, config);
            const agentRulesPath = path.join(agentRulesDir, `${agent.agent.id}.md`);
            fs.writeFileSync(agentRulesPath, agentRules);
            files.push(agentRulesPath);
            
            exported.push({
                id: agent.agent.id,
                name: agent.agent.name,
                file: agentRulesPath
            });
        }
        
        // Generate setup instructions
        const setupInstructions = this.generateCursorSetupInstructions(agents, config);
        const setupPath = path.join(outputDir, 'SETUP.md');
        fs.writeFileSync(setupPath, setupInstructions);
        files.push(setupPath);
        
        return {
            exported,
            outputPath: outputDir,
            files,
            format: 'cursor'
        };
    }

    /**
     * Generate Cursor rules file
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Rules file content
     */
    generateCursorRulesFile(agents, config) {
        return `# Super Agents Framework Rules for Cursor

## Framework Overview
Super Agents is a comprehensive development framework that provides specialized AI agents for different aspects of software development. This workspace has ${agents.length} agents configured.

## Agent Personas

${agents.map(agent => `### ${agent.agent.title} (Role: ${agent.agent.id})

**Identity**: ${agent.persona.identity}

**Communication Style**: ${agent.persona.style}

**Responsibilities**:
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

**When to activate this persona**:
${agent.agent.whenToUse || `When working on ${agent.persona.focus.toLowerCase()}`}

**Available capabilities**:
${agent.capabilities.commands.map(cmd => `- ${cmd.name}: ${cmd.description}`).join('\n')}
`).join('\n---\n\n')}

## Task Management Rules

### Task Structure
- Use hierarchical task IDs (1, 1.1, 1.1.1, etc.)
- Maintain clear parent-child relationships
- Include acceptance criteria for all tasks

### Status Workflow
- **pending**: Task created but not started
- **in-progress**: Actively being worked on
- **blocked**: Waiting for dependencies or external factors
- **review**: Ready for review or validation
- **done**: Completed and verified

### Priority Levels
- **critical**: Urgent issues blocking progress
- **high**: Important features or fixes
- **medium**: Standard development tasks
- **low**: Nice-to-have improvements

### Task Types
- **feature**: New functionality
- **bug**: Error fixes
- **enhancement**: Improvements to existing features
- **documentation**: Documentation updates
- **infrastructure**: System setup and configuration
- **research**: Investigation and analysis tasks

## Development Workflow Rules

### Code Quality
- Follow established coding standards
- Write comprehensive tests for new features
- Document architectural decisions
- Use meaningful commit messages

### Agent Collaboration
- Choose appropriate agent persona for each task type
- Maintain consistency in communication style per agent
- Use agent-specific expertise for specialized tasks

### Template Usage
- Use Super Agents templates for consistent documentation
- Variables should be clearly defined and documented
- Templates available: PRD, Architecture, Stories, Briefs

### Documentation Standards
- Maintain up-to-date README files
- Document API endpoints and interfaces
- Keep architectural diagrams current
- Update deployment and setup instructions

## Project Structure Rules

### Directory Organization
- Follow established project structure
- Keep Super Agents configuration in \`.super-agents/\` directory
- Maintain separate directories for different asset types

### Configuration Management
- Keep environment-specific configs separate
- Use Super Agents configuration for agent and template settings
- Maintain version control for all configuration files

## Communication Guidelines

### Agent Responses
- Provide clear, actionable recommendations
- Include relevant examples and code snippets
- Reference applicable templates and procedures
- Maintain professional but approachable tone

### Error Handling
- Provide specific error messages with context
- Suggest concrete steps for resolution
- Include relevant documentation links
- Escalate complex issues appropriately

Generated on: ${new Date().toISOString()}
Export configuration: ${JSON.stringify(config, null, 2)}
`;
    }

    /**
     * Generate Cursor agent rules
     * @param {Object} agent - Agent data
     * @param {Object} config - Export configuration
     * @returns {string} Agent rules content
     */
    generateCursorAgentRules(agent, config) {
        return `# ${agent.agent.title} - Cursor Rules

## Agent Activation
When the user requests work that involves ${agent.persona.focus.toLowerCase()}, activate this ${agent.agent.title} persona.

## Identity and Style
${agent.persona.identity}

Communication approach: ${agent.persona.style}

## Core Responsibilities
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

## Specialized Capabilities

${agent.capabilities.commands.map(cmd => `### ${cmd.name}
${cmd.description}

**Usage pattern**: ${cmd.usage}
${cmd.examples ? cmd.examples.map(ex => `**Example**: ${ex}`).join('\n') : ''}
`).join('\n')}

## Decision Making Framework
When acting as ${agent.agent.title}:

1. **Assess the request** - Determine if it aligns with this agent's expertise
2. **Apply core principles** - Use the established principles to guide decisions
3. **Provide structured responses** - Follow the communication style defined above
4. **Suggest next steps** - Always include actionable recommendations
5. **Reference resources** - Point to relevant templates, procedures, or documentation

## Integration Points
${agent.dependencies ? `
**Dependencies on other components**:
${Object.entries(agent.dependencies).map(([type, deps]) => 
    `- ${type}: ${deps.join(', ')}`
).join('\n')}
` : ''}

## Quality Standards
- Ensure all recommendations follow best practices
- Provide specific, actionable advice
- Include relevant examples and code snippets when applicable
- Maintain consistency with other agents in the framework

---
*Part of Super Agents Framework - Generated ${new Date().toISOString()}*
`;
    }

    /**
     * Generate Cursor setup instructions
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Setup instructions
     */
    generateCursorSetupInstructions(agents, config) {
        return `# Super Agents - Cursor Setup Instructions

## Installation Steps

### 1. Copy Rules Files
Copy the generated rules files to your Cursor workspace:

\`\`\`bash
# Copy main rules file
cp super-agents.md .cursor/rules/

# Copy individual agent rules (optional)
cp -r agents/ .cursor/rules/agents/
\`\`\`

### 2. Update Workspace Settings
Add to your \`.cursor/settings.json\`:

\`\`\`json
{
  "cursor.general.enableRules": true,
  "cursor.rules.customRulesPath": ".cursor/rules/super-agents.md"
}
\`\`\`

### 3. Verify Installation
1. Open Cursor in your project directory
2. The Super Agents rules should be active
3. Test by asking for help with a task that matches one of the agent personas

## Available Agents
${agents.map(agent => `- **${agent.agent.title}**: ${agent.persona.role}`).join('\n')}

## Usage Examples

### Request PM Work
\`\`\`
I need help creating a product requirements document for a new user authentication feature.
\`\`\`
*This should activate the PM agent persona*

### Request Architecture Work  
\`\`\`
How should I structure the database schema for a multi-tenant SaaS application?
\`\`\`
*This should activate the Architect agent persona*

### Request Development Work
\`\`\`
I need to implement a REST API endpoint for user registration with proper validation.
\`\`\`
*This should activate the Developer agent persona*

## Customization

### Modify Agent Behavior
Edit the rules files to customize agent responses:
- Update core principles
- Add new capabilities
- Modify communication styles

### Add Project-Specific Rules
Create additional rules files for project-specific guidance:
- \`.cursor/rules/project-specific.md\`
- \`.cursor/rules/coding-standards.md\`

## Troubleshooting

### Rules Not Loading
- Verify file paths are correct
- Check \`.cursor/settings.json\` configuration
- Restart Cursor

### Agents Not Responding Correctly
- Review the rules file for syntax errors
- Ensure persona descriptions are clear
- Test with specific, targeted requests

### Performance Issues
- Consider using only essential agents
- Remove unused agent rules files
- Optimize rules file size

Generated on: ${new Date().toISOString()}
`;
    }

    /**
     * Export for VS Code
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportVSCode(agents, config) {
        const outputDir = path.join(this.options.outputPath, 'vscode-export');
        fs.mkdirSync(outputDir, { recursive: true });
        
        const exported = [];
        const files = [];
        
        // Generate workspace settings
        const workspaceSettings = this.generateVSCodeWorkspaceSettings(agents, config);
        const settingsPath = path.join(outputDir, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(workspaceSettings, null, 2));
        files.push(settingsPath);
        
        // Generate agent snippets
        const snippets = this.generateVSCodeSnippets(agents, config);
        const snippetsPath = path.join(outputDir, 'super-agents.code-snippets');
        fs.writeFileSync(snippetsPath, JSON.stringify(snippets, null, 2));
        files.push(snippetsPath);
        
        // Generate README for agents
        const agentReadme = this.generateVSCodeAgentReadme(agents, config);
        const readmePath = path.join(outputDir, 'AGENTS.md');
        fs.writeFileSync(readmePath, agentReadme);
        files.push(readmePath);
        
        for (const agent of agents) {
            exported.push({
                id: agent.agent.id,
                name: agent.agent.name,
                included: true
            });
        }
        
        // Generate setup instructions
        const setupInstructions = this.generateVSCodeSetupInstructions(agents, config);
        const setupPath = path.join(outputDir, 'SETUP.md');
        fs.writeFileSync(setupPath, setupInstructions);
        files.push(setupPath);
        
        return {
            exported,
            outputPath: outputDir,
            files,
            format: 'vscode'
        };
    }

    /**
     * Generate VS Code workspace settings
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Object} Workspace settings
     */
    generateVSCodeWorkspaceSettings(agents, config) {
        return {
            "super-agents.enabled": true,
            "super-agents.agents": agents.map(agent => ({
                id: agent.agent.id,
                name: agent.agent.title,
                role: agent.persona.role,
                enabled: true
            })),
            "super-agents.taskManagement": {
                "enabled": true,
                "hierarchicalIds": true,
                "statusTransitions": {
                    "pending": ["in-progress", "deferred", "cancelled"],
                    "in-progress": ["blocked", "review", "done", "deferred", "cancelled"],
                    "blocked": ["in-progress", "deferred", "cancelled"],
                    "review": ["in-progress", "done", "deferred"],
                    "done": [],
                    "deferred": ["pending", "cancelled"],
                    "cancelled": []
                }
            },
            "super-agents.templates": {
                "enabled": true,
                "autoSuggest": true
            }
        };
    }

    /**
     * Generate VS Code snippets
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Object} Code snippets
     */
    generateVSCodeSnippets(agents, config) {
        const snippets = {};
        
        // Add task creation snippets
        snippets["Create Task"] = {
            "prefix": "sa-task",
            "body": [
                "## Task: ${1:Task Title}",
                "",
                "**ID**: ${2:1.1}",
                "**Status**: ${3|pending,in-progress,blocked,review,done|}",
                "**Priority**: ${4|low,medium,high,critical|}",
                "**Type**: ${5|feature,bug,enhancement,documentation,infrastructure,research|}",
                "**Assignee**: ${6:Agent or Person}",
                "",
                "### Description",
                "${7:Detailed task description}",
                "",
                "### Acceptance Criteria",
                "- [ ] ${8:Criterion 1}",
                "- [ ] ${9:Criterion 2}",
                "",
                "### Dependencies",
                "${10:List any dependencies}"
            ],
            "description": "Create a Super Agents task"
        };
        
        // Add agent-specific snippets
        for (const agent of agents) {
            const snippetKey = `${agent.agent.title} Agent`;
            snippets[snippetKey] = {
                "prefix": `sa-${agent.agent.id}`,
                "body": [
                    `## ${agent.agent.title} Request`,
                    "",
                    `**Agent**: ${agent.agent.title}`,
                    `**Role**: ${agent.persona.role}`,
                    "",
                    "### Request",
                    "${1:Describe what you need from this agent}",
                    "",
                    "### Context",
                    "${2:Provide relevant context}",
                    "",
                    "### Deliverables",
                    "- ${3:Expected output 1}",
                    "- ${4:Expected output 2}"
                ],
                "description": `Request work from ${agent.agent.title} agent`
            };
        }
        
        return snippets;
    }

    /**
     * Generate VS Code agent readme
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Agent readme content
     */
    generateVSCodeAgentReadme(agents, config) {
        return `# Super Agents - VS Code Integration

## Available Agents

${agents.map(agent => `### ${agent.agent.title}
**Role**: ${agent.persona.role}
**Focus**: ${agent.persona.focus}

${agent.persona.identity}

**Core Principles**:
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

**Capabilities**:
${agent.capabilities.commands.map(cmd => `- **${cmd.name}**: ${cmd.description}`).join('\n')}

**Use this agent when**: ${agent.agent.whenToUse || agent.persona.focus}

---
`).join('\n')}

## Code Snippets

Use the following snippets to interact with Super Agents:

### Task Creation
- Type \`sa-task\` to create a new task
- Fill in the template with task details
- Assign to appropriate agent

### Agent Requests
${agents.map(agent => `- Type \`sa-${agent.agent.id}\` to request work from ${agent.agent.title}`).join('\n')}

## VS Code Integration

### Settings
Super Agents settings are configured in your workspace settings.json:
- Enable/disable agents
- Configure task management
- Set template preferences

### Snippets
Code snippets are available for:
- Task creation and management
- Agent-specific requests
- Template usage

### Future Extensions
Planned VS Code extension features:
- Task management sidebar
- Agent chat interface
- Template integration
- MCP server support

Generated on: ${new Date().toISOString()}
`;
    }

    /**
     * Generate VS Code setup instructions
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Setup instructions
     */
    generateVSCodeSetupInstructions(agents, config) {
        return `# Super Agents - VS Code Setup Instructions

## Installation Steps

### 1. Copy Configuration Files
Copy the generated files to your VS Code workspace:

\`\`\`bash
# Copy workspace settings
cp settings.json .vscode/

# Copy code snippets
cp super-agents.code-snippets .vscode/

# Copy agent documentation
cp AGENTS.md docs/
\`\`\`

### 2. Install Recommended Extensions
While not required, these extensions enhance the Super Agents experience:
- Markdown All in One
- YAML
- Code Spell Checker
- GitLens

### 3. Configure Workspace
1. Open your project in VS Code
2. The Super Agents settings should be active
3. Access snippets by typing \`sa-\` followed by Tab

## Available Features

### Code Snippets
${agents.map(agent => `- \`sa-${agent.agent.id}\`: ${agent.agent.title} request template`).join('\n')}
- \`sa-task\`: Task creation template

### Workspace Settings
- Agent configuration and enablement
- Task management rules
- Template preferences

### Documentation
- Agent roles and capabilities in \`docs/AGENTS.md\`
- Integration guide in this file

## Usage Examples

### Create a Task
1. Type \`sa-task\` in a Markdown file
2. Press Tab to expand the snippet
3. Fill in the task details

### Request Agent Work
1. Type \`sa-pm\` for PM agent
2. Press Tab to expand
3. Describe your request

### Manage Tasks
Use the task template to create structured tasks:
- Clear IDs and hierarchy
- Defined status and priority
- Specific acceptance criteria

## Troubleshooting

### Snippets Not Working
- Verify \`.vscode/super-agents.code-snippets\` exists
- Check file permissions
- Restart VS Code

### Settings Not Applied
- Confirm \`.vscode/settings.json\` is correct
- Check for JSON syntax errors
- Reload workspace

### Missing Documentation
- Ensure \`docs/AGENTS.md\` is accessible
- Check file paths in settings
- Update documentation references

## Future Enhancements

### Planned Features
- VS Code extension for full integration
- Sidebar for task management
- Agent chat interface
- Template gallery
- MCP server integration

### Community Contributions
- Custom agent definitions
- Additional code snippets
- Workflow improvements
- Documentation updates

Generated on: ${new Date().toISOString()}
`;
    }

    /**
     * Export for Windsurf
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportWindsurf(agents, config) {
        // Similar to generic export but with Windsurf-specific formatting
        return await this.exportGeneric(agents, { ...config, format: 'windsurf' });
    }

    /**
     * Export in generic format
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportGeneric(agents, config) {
        const outputDir = path.join(this.options.outputPath, 'generic-export');
        fs.mkdirSync(outputDir, { recursive: true });
        
        const exported = [];
        const files = [];
        
        // Generate master prompt file
        const masterPrompt = this.generateGenericMasterPrompt(agents, config);
        const masterPath = path.join(outputDir, 'super-agents-prompt.md');
        fs.writeFileSync(masterPath, masterPrompt);
        files.push(masterPath);
        
        // Generate individual agent prompts
        const agentDir = path.join(outputDir, 'agents');
        fs.mkdirSync(agentDir, { recursive: true });
        
        for (const agent of agents) {
            const agentPrompt = this.generateGenericAgentPrompt(agent, config);
            const agentPath = path.join(agentDir, `${agent.agent.id}.md`);
            fs.writeFileSync(agentPath, agentPrompt);
            files.push(agentPath);
            
            exported.push({
                id: agent.agent.id,
                name: agent.agent.name,
                file: agentPath
            });
        }
        
        // Generate usage guide
        const usageGuide = this.generateGenericUsageGuide(agents, config);
        const guidePath = path.join(outputDir, 'USAGE.md');
        fs.writeFileSync(guidePath, usageGuide);
        files.push(guidePath);
        
        return {
            exported,
            outputPath: outputDir,
            files,
            format: config.format || 'generic'
        };
    }

    /**
     * Generate generic master prompt
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Master prompt content
     */
    generateGenericMasterPrompt(agents, config) {
        return `# Super Agents Framework - Universal AI Assistant Prompt

You are a specialized AI assistant integrated with the Super Agents framework. You have access to ${agents.length} distinct agent personas, each with specific expertise and capabilities.

## Agent Selection Protocol

When responding to user requests, first determine which agent persona is most appropriate:

${agents.map((agent, index) => `${index + 1}. **${agent.agent.title}** - Use when: ${agent.agent.whenToUse || agent.persona.focus}`).join('\n')}

## Agent Personas

${agents.map(agent => `### ${agent.agent.title}

**Identity**: ${agent.persona.identity}

**Communication Style**: ${agent.persona.style}

**Core Principles**:
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

**Specialized Knowledge Areas**:
- ${agent.persona.focus}
- ${agent.capabilities.commands.map(cmd => cmd.name).join(', ')}

**Activation Triggers**: ${agent.agent.whenToUse || 'When working with ' + agent.persona.focus.toLowerCase()}
`).join('\n---\n\n')}

## Task Management Framework

Use this structured approach for all tasks:

### Task Structure
- **ID**: Hierarchical format (1, 1.1, 1.1.1)
- **Title**: Clear, action-oriented description
- **Status**: pending → in-progress → review → done
- **Priority**: critical, high, medium, low
- **Type**: feature, bug, enhancement, documentation, infrastructure, research

### Documentation Standards
- Use templates for consistent output
- Include acceptance criteria
- Reference dependencies
- Track progress and blockers

## Response Protocol

For each user request:

1. **Identify the most appropriate agent persona**
2. **Adopt that agent's identity and communication style**
3. **Apply the agent's core principles**
4. **Provide structured, actionable responses**
5. **Reference relevant templates or procedures**
6. **Suggest next steps or follow-up actions**

## Quality Standards

- Maintain consistency with chosen agent persona
- Provide specific, actionable advice
- Include relevant examples when helpful
- Reference Super Agents framework components
- Ensure all outputs follow established templates

Generated on: ${new Date().toISOString()}
Configuration: ${JSON.stringify(config, null, 2)}
`;
    }

    /**
     * Generate generic agent prompt
     * @param {Object} agent - Agent data
     * @param {Object} config - Export configuration
     * @returns {string} Agent prompt content
     */
    generateGenericAgentPrompt(agent, config) {
        return `# ${agent.agent.title} - AI Agent Persona

## Activation Protocol
Use this persona when the user's request involves: ${agent.agent.whenToUse || agent.persona.focus}

## Identity and Approach
${agent.persona.identity}

**Communication Style**: ${agent.persona.style}

## Core Operating Principles
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

## Specialized Capabilities

${agent.capabilities.commands.map(cmd => `### ${cmd.name}
${cmd.description}
**Usage**: ${cmd.usage}
`).join('\n')}

## Response Framework

When operating as ${agent.agent.title}:

1. **Assessment Phase**
   - Understand the user's specific need
   - Confirm it aligns with this agent's expertise
   - Identify any missing information

2. **Analysis Phase**
   - Apply specialized knowledge and principles
   - Consider best practices and standards
   - Evaluate options and approaches

3. **Response Phase**
   - Provide clear, structured recommendations
   - Include specific examples or templates
   - Suggest concrete next steps
   - Reference relevant resources

## Quality Checklist

Before finalizing responses, ensure:
- [ ] Response aligns with agent's core principles
- [ ] Communication style matches persona
- [ ] Advice is specific and actionable
- [ ] Examples or templates are included when relevant
- [ ] Next steps are clearly defined

## Integration Points
${agent.dependencies ? `
**Framework Dependencies**:
${Object.entries(agent.dependencies).map(([type, deps]) => 
    `- ${type}: ${deps.join(', ')}`
).join('\n')}
` : 'This agent operates independently within the Super Agents framework.'}

---
*Super Agents Framework - ${agent.agent.title} Persona*
*Generated: ${new Date().toISOString()}*
`;
    }

    /**
     * Generate generic usage guide
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Usage guide content
     */
    generateGenericUsageGuide(agents, config) {
        return `# Super Agents Framework - Universal Usage Guide

## Overview
This export provides ${agents.length} specialized AI agent personas that can be used with any AI assistant or chat interface.

## Quick Setup

### Option 1: Master Prompt
Use the \`super-agents-prompt.md\` file as a system prompt or context for your AI assistant.

### Option 2: Individual Agents
Use individual agent files from the \`agents/\` directory for specific use cases.

### Option 3: Hybrid Approach
Start with the master prompt and reference specific agent files as needed.

## Usage Examples

### Project Management Request
\`\`\`
I need help creating a product requirements document for a new feature.
\`\`\`
*Expected: PM Agent persona activation*

### Technical Architecture Question
\`\`\`
How should I design the database schema for a multi-tenant application?
\`\`\`
*Expected: Architect Agent persona activation*

### Code Development Help
\`\`\`
I need to implement user authentication with JWT tokens.
\`\`\`
*Expected: Developer Agent persona activation*

## Available Agents

${agents.map(agent => `### ${agent.agent.title}
**Focus**: ${agent.persona.focus}
**Use for**: ${agent.agent.whenToUse || 'Working with ' + agent.persona.focus.toLowerCase()}
**File**: \`agents/${agent.agent.id}.md\`
`).join('\n')}

## Integration Strategies

### Chat Interfaces
1. Load the master prompt as system context
2. Reference specific agents in conversations
3. Use agent terminology to trigger personas

### AI Development Tools
1. Import agent definitions as custom assistants
2. Create workflows based on agent capabilities
3. Use templates for consistent outputs

### Team Workflows
1. Share agent files with team members
2. Use consistent agent terminology
3. Reference agent principles in code reviews

## Customization

### Modify Agent Behavior
Edit the agent files to:
- Adjust communication styles
- Add project-specific knowledge
- Include company standards
- Update core principles

### Create Custom Agents
Use existing agents as templates to create:
- Domain-specific experts
- Project-specific roles
- Team-specific assistants

### Extend Capabilities
Add new capabilities by:
- Defining new commands
- Creating templates
- Establishing procedures
- Building workflows

## Best Practices

### Agent Selection
- Choose the most appropriate agent for each task
- Use multiple agents for complex projects
- Switch agents as focus areas change

### Task Management
- Use hierarchical task IDs (1.2.3)
- Maintain clear status tracking
- Document dependencies and blockers

### Documentation
- Use agent-generated templates
- Maintain consistency across outputs
- Keep documentation current

### Quality Assurance
- Verify agent responses align with principles
- Check for completeness and accuracy
- Review generated content before use

## Troubleshooting

### Agent Not Responding Correctly
- Verify the prompt is loaded correctly
- Check for conflicting instructions
- Ensure request matches agent expertise

### Inconsistent Outputs
- Review agent core principles
- Check communication style guidelines
- Verify template usage

### Missing Capabilities
- Check agent command definitions
- Review available templates
- Consider using multiple agents

## Support and Updates

### Documentation
- Review individual agent files for detailed capabilities
- Check the master prompt for overall framework guidance
- Reference this usage guide for implementation help

### Updates
- Regenerate exports when agents are updated
- Review new capabilities and commands
- Update custom modifications as needed

Generated on: ${new Date().toISOString()}
Export Format: ${config.format || 'generic'}
Total Agents: ${agents.length}
`;
    }

    /**
     * Export in Markdown format
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportMarkdown(agents, config) {
        const outputDir = path.join(this.options.outputPath, 'markdown-export');
        fs.mkdirSync(outputDir, { recursive: true });
        
        const exported = [];
        const files = [];
        
        // Generate comprehensive markdown documentation
        const markdownContent = this.generateMarkdownDocumentation(agents, config);
        const markdownPath = path.join(outputDir, 'super-agents-documentation.md');
        fs.writeFileSync(markdownPath, markdownContent);
        files.push(markdownPath);
        
        for (const agent of agents) {
            exported.push({
                id: agent.agent.id,
                name: agent.agent.name,
                included: true
            });
        }
        
        return {
            exported,
            outputPath: outputDir,
            files,
            format: 'markdown'
        };
    }

    /**
     * Generate markdown documentation
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {string} Markdown documentation
     */
    generateMarkdownDocumentation(agents, config) {
        return `# Super Agents Framework Documentation

Generated on: ${new Date().toISOString()}
Export Configuration: ${JSON.stringify(config, null, 2)}

## Table of Contents
- [Overview](#overview)
- [Framework Architecture](#framework-architecture)
- [Agent Catalog](#agent-catalog)
- [Task Management](#task-management)
- [Templates and Procedures](#templates-and-procedures)
- [Integration Guide](#integration-guide)
- [API Reference](#api-reference)

## Overview

Super Agents is a comprehensive development framework that provides specialized AI agents for different aspects of software development. This documentation covers ${agents.length} configured agents.

### Key Features
- **Specialized Agents**: Each agent has specific expertise and capabilities
- **Task Management**: Hierarchical task structure with status tracking
- **Template System**: Consistent document generation
- **Multi-IDE Support**: Integration with various development environments
- **MCP Protocol**: Model Context Protocol support for IDE integration

## Framework Architecture

### Core Components
1. **Agent System**: Manages agent definitions and interactions
2. **Task Manager**: Handles task creation, tracking, and dependencies
3. **Template Engine**: Provides document generation capabilities
4. **MCP Server**: Enables IDE integration through MCP protocol
5. **Export System**: Generates IDE-specific configurations

### Data Flow
\`\`\`
User Request → Agent Selection → Task Creation → Template Usage → Output Generation
\`\`\`

## Agent Catalog

${agents.map((agent, index) => `### ${index + 1}. ${agent.agent.title}

**Agent ID**: \`${agent.agent.id}\`
**Type**: ${agent.agent.type}
**Status**: ${agent.agent.status}

#### Identity
${agent.persona.identity}

#### Role and Responsibilities
${agent.persona.role}

#### Communication Style
${agent.persona.style}

#### Core Principles
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

#### Capabilities
${agent.capabilities.commands.map(cmd => `- **${cmd.name}**: ${cmd.description}
  - Usage: ${cmd.usage}
  ${cmd.mcp_tool ? `- MCP Tool: \`${cmd.mcp_tool}\`` : ''}`).join('\n')}

#### When to Use
${agent.agent.whenToUse || `Use this agent when working with ${agent.persona.focus.toLowerCase()}`}

#### Dependencies
${agent.dependencies ? Object.entries(agent.dependencies).map(([type, deps]) => 
    `- **${type}**: ${deps.join(', ')}`
).join('\n') : 'None'}

---
`).join('\n')}

## Task Management

### Task Structure
Tasks in the Super Agents framework follow a hierarchical structure:

- **ID Format**: 1.2.3 (hierarchical numbering)
- **Status Flow**: pending → in-progress → blocked → review → done
- **Priority Levels**: critical, high, medium, low
- **Task Types**: feature, bug, enhancement, documentation, infrastructure, research

### Status Transitions
\`\`\`
pending ────→ in-progress ────→ review ────→ done
   │              │                │
   ↓              ↓                ↓
deferred       blocked         in-progress
   │              │
   ↓              ↓
cancelled      deferred
\`\`\`

### Task Properties
- **Title**: Clear, action-oriented description
- **Description**: Detailed explanation of requirements
- **Acceptance Criteria**: Specific conditions for completion
- **Dependencies**: Other tasks that must be completed first
- **Assignee**: Agent or person responsible
- **Estimated Hours**: Time estimate for completion
- **Tags**: Categories and labels for organization

## Templates and Procedures

### Available Templates
The framework includes templates for:
- **Product Requirements Document (PRD)**
- **System Architecture Documentation**
- **User Stories and Epics**
- **Project Briefs**
- **Market Research Reports**
- **Competitive Analysis**
- **Technical Specifications**

### Template Features
- **Variable Substitution**: Handlebars-based templating
- **Inheritance**: Templates can extend other templates
- **Validation**: Schema-based template validation
- **Rendering**: Multiple output formats supported

## Integration Guide

### IDE Integration Options

#### Claude Code
- MCP server integration
- Custom memory files (CLAUDE.md)
- Agent-specific commands
- Template integration

#### Cursor
- Rules-based integration
- Agent persona definitions
- Workflow guidelines
- Custom rules files

#### VS Code
- Workspace settings
- Code snippets
- Extension support (planned)
- Custom configuration

#### Generic Integration
- Universal agent prompts
- Markdown documentation
- Template exports
- Configuration files

### Setup Requirements
- Node.js 18+ for MCP server
- IDE-specific configuration
- Agent definition files
- Template library

## API Reference

### Agent System API
\`\`\`javascript
// Load all agents
const agentSystem = new AgentSystem('./agents');
await agentSystem.loadAllAgents();

// Get specific agent
const agent = agentSystem.getAgent('pm');

// List agents with filters
const agents = agentSystem.listAgents({ type: 'primary' });
\`\`\`

### Task Manager API
\`\`\`javascript
// Initialize task manager
const taskManager = new TaskManager('./tasks');
await taskManager.initialize();

// Create task
const task = await taskManager.createTask({
  title: 'Implement feature',
  description: 'Add new functionality',
  type: 'feature',
  priority: 'high'
});

// Update task status
await taskManager.updateTask(task.id, { status: 'in-progress' });
\`\`\`

### Template Engine API
\`\`\`javascript
// Initialize template engine
const templateEngine = new TemplateEngine('./templates');

// Render template
const result = await templateEngine.renderTemplate('prd-tmpl', {
  projectName: 'My Project',
  features: ['auth', 'dashboard']
});
\`\`\`

### MCP Tools
Available MCP tools for IDE integration:

${agents.flatMap(agent => 
    agent.capabilities.commands
        .filter(cmd => cmd.mcp_tool)
        .map(cmd => `- **${cmd.mcp_tool}**: ${cmd.description}`)
).join('\n')}

## Conclusion

The Super Agents framework provides a comprehensive solution for AI-assisted software development. With ${agents.length} specialized agents, hierarchical task management, and multi-IDE support, it enables efficient and consistent development workflows.

For more information, please refer to the individual agent files and integration guides provided with this export.

---
*Generated by Super Agents Framework - ${new Date().toISOString()}*
`;
    }

    /**
     * Export in JSON format
     * @param {Array} agents - Agents to export
     * @param {Object} config - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportJSON(agents, config) {
        const outputDir = path.join(this.options.outputPath, 'json-export');
        fs.mkdirSync(outputDir, { recursive: true });
        
        const exported = [];
        const files = [];
        
        // Export agents as JSON
        const agentsData = {
            metadata: {
                exportDate: new Date().toISOString(),
                exportConfig: config,
                agentCount: agents.length,
                framework: 'super-agents',
                version: '1.0.0'
            },
            agents: agents.map(agent => ({
                ...agent,
                exportedAt: new Date().toISOString()
            }))
        };
        
        const agentsPath = path.join(outputDir, 'agents.json');
        fs.writeFileSync(agentsPath, JSON.stringify(agentsData, null, 2));
        files.push(agentsPath);
        
        // Export individual agent files
        const individualDir = path.join(outputDir, 'individual');
        fs.mkdirSync(individualDir, { recursive: true });
        
        for (const agent of agents) {
            const agentPath = path.join(individualDir, `${agent.agent.id}.json`);
            fs.writeFileSync(agentPath, JSON.stringify(agent, null, 2));
            files.push(agentPath);
            
            exported.push({
                id: agent.agent.id,
                name: agent.agent.name,
                file: agentPath
            });
        }
        
        // Export schema
        const schema = this.generateJSONSchema();
        const schemaPath = path.join(outputDir, 'schema.json');
        fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
        files.push(schemaPath);
        
        return {
            exported,
            outputPath: outputDir,
            files,
            format: 'json'
        };
    }

    /**
     * Generate JSON schema for agents
     * @returns {Object} JSON schema
     */
    generateJSONSchema() {
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Super Agents Framework - Agent Schema",
            "type": "object",
            "properties": {
                "metadata": {
                    "type": "object",
                    "properties": {
                        "version": { "type": "string" },
                        "created": { "type": "string", "format": "date-time" },
                        "framework": { "type": "string" }
                    }
                },
                "agent": {
                    "type": "object",
                    "properties": {
                        "id": { "type": "string" },
                        "name": { "type": "string" },
                        "title": { "type": "string" },
                        "type": { "enum": ["primary", "secondary", "utility", "meta"] },
                        "status": { "enum": ["active", "inactive", "deprecated"] },
                        "whenToUse": { "type": "string" }
                    },
                    "required": ["id", "name", "title", "type", "status"]
                },
                "persona": {
                    "type": "object",
                    "properties": {
                        "role": { "type": "string" },
                        "style": { "type": "string" },
                        "identity": { "type": "string" },
                        "focus": { "type": "string" },
                        "core_principles": { 
                            "type": "array", 
                            "items": { "type": "string" } 
                        }
                    },
                    "required": ["role", "style", "identity", "focus", "core_principles"]
                },
                "capabilities": {
                    "type": "object",
                    "properties": {
                        "commands": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": { "type": "string" },
                                    "description": { "type": "string" },
                                    "usage": { "type": "string" },
                                    "mcp_tool": { "type": "string" }
                                },
                                "required": ["name", "description", "usage"]
                            }
                        }
                    },
                    "required": ["commands"]
                }
            },
            "required": ["agent", "persona", "capabilities"]
        };
    }

    /**
     * List supported export formats
     * @returns {Array} Supported formats
     */
    listFormats() {
        return this.supportedFormats.map(format => ({
            name: format,
            description: this.getFormatDescription(format),
            handler: this.formatHandlers[format] ? 'available' : 'not implemented'
        }));
    }

    /**
     * Get format description
     * @param {string} format - Format name
     * @returns {string} Format description
     */
    getFormatDescription(format) {
        const descriptions = {
            'claude-code': 'Claude Code IDE with MCP server integration',
            'cursor': 'Cursor IDE with rules-based integration',
            'vscode': 'Visual Studio Code with workspace settings',
            'windsurf': 'Windsurf IDE integration',
            'generic': 'Universal AI assistant prompts',
            'markdown': 'Comprehensive markdown documentation',
            'json': 'Raw JSON data export'
        };
        
        return descriptions[format] || 'No description available';
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
            component: 'AgentExporter',
            ...data
        };
        
        this.emit('log', logEntry);
        
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.options.logLevel] || 1;
        const messageLevel = logLevels[level] || 1;
        
        if (messageLevel >= currentLevel) {
            const prefix = `[AgentExporter ${level.toUpperCase()}]`;
            console.log(`${prefix} ${message}`, Object.keys(data).length > 0 ? data : '');
        }
    }

    /**
     * Cleanup resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        this.removeAllListeners();
        
        if (this.agentSystem) {
            await this.agentSystem.cleanup();
        }
        
        if (this.templateEngine) {
            await this.templateEngine.cleanup();
        }
    }
}

export default AgentExporter;