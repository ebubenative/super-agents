import { join, dirname } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Cursor IDE Integration for Super Agents Framework
 * Handles MCP integration and rules file generation for Cursor IDE
 */
export default class CursorIntegrator {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      enableLogging: options.enableLogging !== false,
      enableMCP: options.enableMCP !== false,
      enableRules: options.enableRules !== false,
      cursorConfigPath: options.cursorConfigPath || null,
      ...options
    };
    
    this.logger = this.options.enableLogging ? console : { log: () => {}, error: () => {}, warn: () => {} };
    this.projectRoot = this.options.projectRoot;
    this.cursorDir = join(this.projectRoot, '.cursor');
    this.rulesDir = join(this.cursorDir, 'rules');
  }

  /**
   * Initialize Cursor integration
   * @returns {Promise<Object>} Integration result
   */
  async initialize() {
    try {
      this.logger.log('🎯 Initializing Cursor integration...');
      
      const results = {
        mcpIntegration: null,
        rulesGeneration: null,
        configValidation: null,
        timestamp: new Date().toISOString()
      };

      // Ensure .cursor directory exists
      this.ensureCursorDirectories();

      // Setup MCP integration if enabled
      if (this.options.enableMCP) {
        results.mcpIntegration = await this.setupMCPIntegration();
      }

      // Generate rules files if enabled
      if (this.options.enableRules) {
        results.rulesGeneration = await this.generateRulesFiles();
      }

      // Validate configuration
      results.configValidation = await this.validateConfiguration();

      this.logger.log('✅ Cursor integration initialized successfully');
      return {
        success: true,
        results,
        integrationPath: this.cursorDir
      };

    } catch (error) {
      this.logger.error('❌ Failed to initialize Cursor integration:', error.message);
      return {
        success: false,
        error: error.message,
        integrationPath: this.cursorDir
      };
    }
  }

  /**
   * Ensure Cursor directories exist
   */
  ensureCursorDirectories() {
    const directories = [this.cursorDir, this.rulesDir];
    
    directories.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        this.logger.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * Setup MCP integration for Cursor
   * @returns {Promise<Object>} MCP integration result
   */
  async setupMCPIntegration() {
    try {
      this.logger.log('⚙️ Setting up Cursor MCP integration...');

      // Generate MCP configuration
      const mcpConfig = this.generateMCPConfiguration();
      
      // Write MCP configuration file
      const mcpConfigPath = join(this.cursorDir, 'mcp-config.json');
      writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

      // Create environment configuration
      const envConfig = this.generateEnvironmentConfiguration();
      const envConfigPath = join(this.cursorDir, 'env-config.json');
      writeFileSync(envConfigPath, JSON.stringify(envConfig, null, 2));

      // Generate MCP server startup script
      const startupScript = this.generateMCPStartupScript();
      const startupScriptPath = join(this.cursorDir, 'start-mcp-server.js');
      writeFileSync(startupScriptPath, startupScript);

      return {
        success: true,
        configPath: mcpConfigPath,
        envConfigPath,
        startupScriptPath,
        serverConfig: mcpConfig
      };

    } catch (error) {
      this.logger.error('❌ Failed to setup MCP integration:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate MCP configuration for Cursor
   * @returns {Object} MCP configuration
   */
  generateMCPConfiguration() {
    const saEnginePath = join(this.projectRoot, 'sa-engine', 'mcp-server', 'index.js');
    
    return {
      mcpServers: {
        "super-agents": {
          command: "node",
          args: [saEnginePath],
          env: {
            SA_PROJECT_ROOT: this.projectRoot,
            SA_IDE: "cursor",
            SA_LOG_LEVEL: "info",
            ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}",
            OPENAI_API_KEY: "${OPENAI_API_KEY}",
            GOOGLE_API_KEY: "${GOOGLE_API_KEY}"
          }
        }
      }
    };
  }

  /**
   * Generate environment configuration
   * @returns {Object} Environment configuration
   */
  generateEnvironmentConfiguration() {
    return {
      description: "Super Agents Framework - Cursor Integration Environment Configuration",
      requiredVariables: [
        {
          name: "ANTHROPIC_API_KEY",
          description: "Anthropic Claude API key for AI agents",
          required: true,
          example: "sk-ant-api03-..."
        },
        {
          name: "OPENAI_API_KEY", 
          description: "OpenAI API key for GPT models",
          required: false,
          example: "sk-..."
        },
        {
          name: "GOOGLE_API_KEY",
          description: "Google AI API key for Gemini models",
          required: false,
          example: "AIza..."
        }
      ],
      setupInstructions: [
        "1. Copy your API keys to your environment variables",
        "2. Restart Cursor IDE to load new environment",
        "3. Verify MCP server connection in Cursor",
        "4. Test Super Agents tools in Cursor chat"
      ]
    };
  }

  /**
   * Generate MCP server startup script
   * @returns {string} Startup script content
   */
  generateMCPStartupScript() {
    return `#!/usr/bin/env node

/**
 * Super Agents MCP Server Startup Script for Cursor
 * This script starts the MCP server with Cursor-specific optimizations
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROJECT_ROOT = process.env.SA_PROJECT_ROOT || join(__dirname, '..');
const MCP_SERVER_PATH = join(PROJECT_ROOT, 'sa-engine', 'mcp-server', 'index.js');

console.log('🚀 Starting Super Agents MCP Server for Cursor...');
console.log('Project Root:', PROJECT_ROOT);
console.log('MCP Server Path:', MCP_SERVER_PATH);

// Set environment variables for Cursor integration
process.env.SA_IDE = 'cursor';
process.env.SA_LOG_LEVEL = process.env.SA_LOG_LEVEL || 'info';

// Start MCP server
const mcpServer = spawn('node', [MCP_SERVER_PATH], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SA_PROJECT_ROOT: PROJECT_ROOT,
    SA_IDE: 'cursor'
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error.message);
  process.exit(1);
});

mcpServer.on('close', (code) => {
  console.log(\`🔄 MCP server exited with code \${code}\`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n👋 Shutting down MCP server...');
  mcpServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\\n👋 Shutting down MCP server...');
  mcpServer.kill('SIGTERM');
});
`;
  }

  /**
   * Generate rules files for Cursor
   * @returns {Promise<Object>} Rules generation result
   */
  async generateRulesFiles() {
    try {
      this.logger.log('📋 Generating Cursor rules files...');

      // Generate main Super Agents rules file
      const superAgentsRules = await this.generateSuperAgentsRules();
      const superAgentsRulesPath = join(this.rulesDir, 'super-agents.md');
      writeFileSync(superAgentsRulesPath, superAgentsRules);

      return {
        success: true,
        mainRulesPath: superAgentsRulesPath,
        rulesCount: 1
      };

    } catch (error) {
      this.logger.error('❌ Failed to generate rules files:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate main Super Agents rules file
   * @returns {Promise<string>} Rules file content
   */
  async generateSuperAgentsRules() {
    const agents = await this.getAvailableAgents();

    return `# Super Agents Framework - Cursor Integration

## Overview
You are working with the Super Agents Framework, a comprehensive AI-powered development assistance system. This framework provides specialized agents and 50+ tools to enhance your development workflow.

## Project Context
When working on projects, you have access to specialized AI agents that can help with different aspects of development:
- Analysis and research
- Product management and planning  
- System architecture and design
- Implementation and coding
- Quality assurance and testing
- UX/UI design and specification
- Project management and coordination

## Available Agents
${agents.map(agent => `
### ${agent.name} Agent
**Role**: ${agent.role}
**Capabilities**: ${agent.capabilities.join(', ')}
**When to use**: ${agent.whenToUse}
**Key tools**: ${agent.tools.slice(0, 3).join(', ')}${agent.tools.length > 3 ? ', ...' : ''}
`).join('\n')}

## How to Use Super Agents in Cursor

### Method 1: MCP Integration (Recommended)
If MCP is configured, you can directly use Super Agents tools:
\`\`\`
@sa-research-market topic="AI development tools"
@sa-generate-prd requirements="user authentication system"
@sa-create-architecture prd="docs/prd.md"
@sa-implement-story story="user login functionality"
\`\`\`

### Method 2: Agent Personas (Manual)
Use agent personas by prefixing requests:
\`\`\`
@analyst: Research the competitive landscape for project management tools
@pm: Create a PRD for user authentication with social login
@architect: Design a scalable microservices architecture for our app
@developer: Implement the user registration endpoint with validation
@qa: Review this authentication code for security issues
\`\`\`

## Workflow Integration

### Standard Development Workflow
1. **Analysis Phase**: Use \`@analyst\` for market research and requirements gathering
2. **Planning Phase**: Use \`@pm\` for PRD creation and feature prioritization  
3. **Architecture Phase**: Use \`@architect\` for system design and tech recommendations
4. **Implementation Phase**: Use \`@developer\` for coding and debugging
5. **Quality Phase**: Use \`@qa\` for code review and testing
6. **UX Phase**: Use \`@ux-expert\` for frontend specs and accessibility

### Agent Collaboration Patterns
- **Sequential**: Use agents in sequence for complete workflows
- **Parallel**: Use multiple agents simultaneously for different aspects
- **Iterative**: Switch between agents as needs evolve
- **Consultative**: Ask multiple agents for different perspectives

## Task Management
When working with Super Agents, follow these patterns:

### Task Creation
- Break down large tasks into smaller, manageable pieces
- Use specific, actionable task descriptions
- Include acceptance criteria and success metrics
- Assign appropriate agents based on task type

### Task Tracking  
- Update task status as work progresses
- Document decisions and assumptions
- Track dependencies between tasks
- Regular progress reviews and adjustments

### Task Completion
- Validate completion against acceptance criteria
- Get appropriate agent reviews before marking complete
- Document learnings and best practices
- Plan follow-up tasks as needed

## Best Practices

### Agent Selection
- Choose the right agent for each task type
- Consider agent expertise and capabilities
- Use multiple agents for complex problems
- Validate agent recommendations with domain experts

### Communication
- Be specific and clear in requests
- Provide necessary context and background
- Ask follow-up questions for clarification
- Document important decisions and rationale

### Workflow Optimization
- Establish consistent patterns and processes
- Automate repetitive tasks where possible
- Regular review and improvement of workflows
- Share learnings with team members

## Examples

### Complete Project Workflow
\`\`\`markdown
# New Feature Development Example

## 1. Research Phase (@analyst)
@analyst: Research market trends for mobile payment solutions

## 2. Planning Phase (@pm)  
@pm: Create a PRD for mobile payment integration with Apple Pay and Google Pay

## 3. Architecture Phase (@architect)
@architect: Design secure payment processing architecture with PCI compliance

## 4. Implementation Phase (@developer)
@developer: Implement payment gateway integration with error handling

## 5. Quality Phase (@qa)
@qa: Review payment code for security vulnerabilities and edge cases

## 6. UX Phase (@ux-expert)
@ux-expert: Create payment flow wireframes and accessibility audit
\`\`\`

### Quick Task Examples
\`\`\`markdown
# Quick Development Tasks

## Code Review
@qa: Review this React component for performance and best practices

## Bug Investigation  
@developer: Debug why the authentication middleware is failing

## Market Research
@analyst: Research competitors in the AI-powered IDE space

## Feature Specification
@pm: Create user stories for the dashboard redesign project
\`\`\`

---

*Super Agents Framework v1.0 - Cursor Integration*
*Generated: ${new Date().toISOString()}*
`;
  }

  /**
   * Get available agents information
   * @returns {Promise<Array>} Agent information
   */
  async getAvailableAgents() {
    return [
      {
        name: 'Analyst',
        role: 'Business Analyst and Researcher',
        capabilities: ['Market research', 'Competitive analysis', 'Requirements gathering'],
        whenToUse: 'For research, analysis, and strategic planning tasks',
        tools: ['sa-research-market', 'sa-competitor-analysis', 'sa-brainstorm-session']
      },
      {
        name: 'PM',
        role: 'Product Manager',
        capabilities: ['PRD creation', 'Feature prioritization', 'Stakeholder analysis'],
        whenToUse: 'For product planning and management tasks',
        tools: ['sa-generate-prd', 'sa-create-epic', 'sa-prioritize-features']
      },
      {
        name: 'Architect',
        role: 'System Architect',
        capabilities: ['System design', 'Technology recommendations', 'Architecture analysis'],
        whenToUse: 'For system design and technical architecture decisions',
        tools: ['sa-create-architecture', 'sa-analyze-brownfield', 'sa-tech-recommendations']
      },
      {
        name: 'Developer',
        role: 'Software Developer',
        capabilities: ['Code implementation', 'Debugging', 'Testing'],
        whenToUse: 'For coding, implementation, and development tasks',
        tools: ['sa-implement-story', 'sa-debug-issue', 'sa-run-tests']
      },
      {
        name: 'QA',
        role: 'Quality Assurance Engineer',
        capabilities: ['Code review', 'Quality validation', 'Testing'],
        whenToUse: 'For quality assurance and code review tasks',
        tools: ['sa-review-code', 'sa-validate-quality', 'sa-refactor-code']
      },
      {
        name: 'UX-Expert',
        role: 'UX/UI Designer',
        capabilities: ['UI design', 'Accessibility', 'User experience'],
        whenToUse: 'For frontend design and user experience tasks',
        tools: ['sa-create-frontend-spec', 'sa-design-wireframes', 'sa-accessibility-audit']
      }
    ];
  }

  /**
   * Validate Cursor configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateConfiguration() {
    try {
      this.logger.log('✅ Validating Cursor configuration...');

      const validations = {
        directoriesExist: this.validateDirectories(),
        mcpConfigExists: this.validateMCPConfig(),
        rulesFilesExist: this.validateRulesFiles()
      };

      const allValid = Object.values(validations).every(v => v.success);

      return {
        success: allValid,
        validations,
        issues: Object.entries(validations)
          .filter(([_, v]) => !v.success)
          .map(([key, v]) => ({ check: key, issue: v.error }))
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate directories exist
   * @returns {Object} Validation result
   */
  validateDirectories() {
    try {
      const requiredDirs = [this.cursorDir, this.rulesDir];
      const missingDirs = requiredDirs.filter(dir => !existsSync(dir));

      return {
        success: missingDirs.length === 0,
        directories: requiredDirs,
        missing: missingDirs,
        error: missingDirs.length > 0 ? `Missing directories: ${missingDirs.join(', ')}` : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate MCP configuration
   * @returns {Object} Validation result
   */
  validateMCPConfig() {
    try {
      const mcpConfigPath = join(this.cursorDir, 'mcp-config.json');
      const exists = existsSync(mcpConfigPath);

      if (!exists) {
        return {
          success: false,
          error: 'MCP configuration file not found'
        };
      }

      const config = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
      const hasServers = config.mcpServers && Object.keys(config.mcpServers).length > 0;

      return {
        success: hasServers,
        configPath: mcpConfigPath,
        servers: hasServers ? Object.keys(config.mcpServers) : [],
        error: hasServers ? null : 'No MCP servers configured'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate rules files exist
   * @returns {Object} Validation result
   */
  validateRulesFiles() {
    try {
      const expectedRules = ['super-agents.md'];

      const existingRules = expectedRules.filter(file => 
        existsSync(join(this.rulesDir, file))
      );

      const missing = expectedRules.filter(file => 
        !existsSync(join(this.rulesDir, file))
      );

      return {
        success: missing.length === 0,
        expected: expectedRules,
        existing: existingRules,
        missing,
        error: missing.length > 0 ? `Missing rules files: ${missing.join(', ')}` : null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate setup instructions
   * @returns {string} Setup instructions
   */
  generateSetupInstructions() {
    return `# Super Agents - Cursor Setup Instructions

## Quick Setup

### 1. MCP Integration (Recommended)
If your Cursor supports MCP (Model Context Protocol):

1. **Copy MCP Configuration**:
   - Copy \`.cursor/mcp-config.json\` to your Cursor settings
   - Or manually add the MCP server configuration

2. **Set Environment Variables**:
   - Add \`ANTHROPIC_API_KEY\` to your environment
   - Optionally add \`OPENAI_API_KEY\` and \`GOOGLE_API_KEY\`

3. **Restart Cursor**:
   - Restart Cursor IDE to load new configuration
   - MCP server should connect automatically

4. **Test Integration**:
   - Try using Super Agents tools in Cursor chat
   - Example: \`@sa-research-market topic="AI tools"\`

### 2. Rules-Based Integration (Manual)
If MCP is not available or preferred:

1. **Install Rules Files**:
   - Cursor automatically loads rules from \`.cursor/rules/\`
   - Rules files are already generated in this directory

2. **Use Agent Personas**:
   - Prefix requests with agent names
   - Example: \`@analyst: Research competitive landscape\`

3. **Follow Workflow Patterns**:
   - Use the workflow patterns defined in rules
   - Sequential: \`@analyst → @pm → @architect → @developer\`

## Usage Examples

### MCP Tool Usage
\`\`\`
@sa-research-market topic="project management tools"
@sa-generate-prd requirements="user authentication system"
@sa-create-architecture prd="docs/prd.md"
@sa-implement-story story="user login functionality"
@sa-review-code files="src/auth/"
\`\`\`

### Agent Persona Usage
\`\`\`
@analyst: Research the competitive landscape for our product idea
@pm: Create a PRD for mobile payment integration  
@architect: Design a scalable microservices architecture
@developer: Implement user registration with email verification
@qa: Review this authentication code for security issues
\`\`\`

---
*Setup Instructions - Super Agents Framework for Cursor*
*Generated: ${new Date().toISOString()}*
`;
  }
}