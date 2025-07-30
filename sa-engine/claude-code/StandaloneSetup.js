import { EventEmitter } from 'events';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import ClaudeCodeIntegrator from './ClaudeCodeIntegrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Standalone Setup for Claude Code Integration
 * Provides manual installation and setup capabilities for Claude Code
 */
export default class StandaloneSetup extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      targetProject: options.targetProject || null,
      includeAllAgents: options.includeAllAgents !== false,
      includeAllTools: options.includeAllTools !== false,
      customCommands: options.customCommands || [],
      setupHooks: options.setupHooks !== false,
      validateSetup: options.validateSetup !== false,
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.integrator = null;
    this.setupStatus = {
      initialized: false,
      filesGenerated: 0,
      commandsCreated: 0,
      agentsSetup: 0,
      hooksInstalled: 0,
      validated: false
    };

    this.log('Standalone Setup initialized', { options: this.options });
  }

  /**
   * Run complete standalone setup for a target project
   * @param {string} targetProjectPath - Path to target project
   * @param {Object} config - Setup configuration
   * @returns {Promise<Object>} Setup results
   */
  async runStandaloneSetup(targetProjectPath, config = {}) {
    try {
      this.log('Starting standalone setup', { targetProjectPath, config });
      this.emit('setupStarting', { targetProjectPath, config });

      // Validate target project
      await this.validateTargetProject(targetProjectPath);

      // Initialize integrator for standalone mode
      this.integrator = new ClaudeCodeIntegrator({
        projectRoot: this.options.projectRoot,
        standaloneMode: true,
        autoGenerateCommands: true,
        includeHooks: config.setupHooks || this.options.setupHooks,
        logLevel: this.options.logLevel
      });

      // Setup integration in target project
      const setupConfig = {
        ...config,
        claudeConfigPath: join(targetProjectPath, '.claude'),
        targetProjectPath
      };

      await this.integrator.initialize(setupConfig);

      // Copy Super Agents resources to target project
      await this.copyResourcesTo(targetProjectPath, config);

      // Create project-specific configurations
      await this.createProjectConfigurations(targetProjectPath, config);

      // Generate installation instructions
      await this.generateInstallationInstructions(targetProjectPath);

      // Validate setup if requested
      if (config.validateSetup || this.options.validateSetup) {
        await this.validateSetup(targetProjectPath);
      }

      this.setupStatus.initialized = true;
      const results = this.getSetupResults(targetProjectPath);

      this.log('Standalone setup completed successfully', results);
      this.emit('setupCompleted', results);

      return results;

    } catch (error) {
      this.log('Failed to run standalone setup', { error: error.message });
      this.emit('setupError', { error, context: 'standalone_setup' });
      throw error;
    }
  }

  /**
   * Validate target project structure and requirements
   * @param {string} targetProjectPath - Target project path
   * @returns {Promise<void>}
   */
  async validateTargetProject(targetProjectPath) {
    if (!existsSync(targetProjectPath)) {
      throw new Error(`Target project path does not exist: ${targetProjectPath}`);
    }

    // Check if it's a valid project directory
    const packageJsonPath = join(targetProjectPath, 'package.json');
    const hasPackageJson = existsSync(packageJsonPath);
    
    if (!hasPackageJson) {
      this.log('Warning: No package.json found in target project', { targetProjectPath });
    }

    this.log('Target project validated', { targetProjectPath, hasPackageJson });
  }

  /**
   * Copy Super Agents resources to target project
   * @param {string} targetProjectPath - Target project path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async copyResourcesTo(targetProjectPath, config) {
    this.log('Copying Super Agents resources', { targetProjectPath });

    // Create Super Agents directory in target project
    const saTargetPath = join(targetProjectPath, 'super-agents');
    if (!existsSync(saTargetPath)) {
      await mkdir(saTargetPath, { recursive: true });
    }

    // Copy essential files
    await this.copyEssentialFiles(saTargetPath, config);

    // Copy agent configurations
    await this.copyAgentConfigurations(saTargetPath, config);

    // Copy tool definitions
    await this.copyToolDefinitions(saTargetPath, config);

    this.setupStatus.filesGenerated += 10; // Approximate file count
    this.log('Resources copied successfully', { saTargetPath });
  }

  /**
   * Copy essential Super Agents files
   * @param {string} saTargetPath - Super Agents target path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async copyEssentialFiles(saTargetPath, config) {
    const essentialFiles = [
      'sa-engine/mcp-server/index.js',
      'sa-engine/mcp-server/MCPServer.js',
      'sa-engine/mcp-server/ToolRegistry.js'
    ];

    for (const file of essentialFiles) {
      const sourcePath = join(this.options.projectRoot, file);
      const targetPath = join(saTargetPath, file);
      
      if (existsSync(sourcePath)) {
        // Ensure target directory exists
        await mkdir(dirname(targetPath), { recursive: true });
        
        // Copy file content
        const content = await readFile(sourcePath, 'utf-8');
        await writeFile(targetPath, content);
      }
    }
  }

  /**
   * Copy agent configurations
   * @param {string} saTargetPath - Super Agents target path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async copyAgentConfigurations(saTargetPath, config) {
    const agentsSourcePath = join(this.options.projectRoot, 'sa-engine/agents');
    const agentsTargetPath = join(saTargetPath, 'agents');

    if (!existsSync(agentsTargetPath)) {
      await mkdir(agentsTargetPath, { recursive: true });
    }

    const agentFiles = [
      'analyst.json', 'architect.json', 'developer.json', 'pm.json',
      'product-owner.json', 'qa.json', 'scrum-master.json', 'ux-expert.json'
    ];

    for (const agentFile of agentFiles) {
      const sourcePath = join(agentsSourcePath, agentFile);
      const targetPath = join(agentsTargetPath, agentFile);
      
      if (existsSync(sourcePath)) {
        const content = await readFile(sourcePath, 'utf-8');
        await writeFile(targetPath, content);
        this.setupStatus.agentsSetup++;
      }
    }
  }

  /**
   * Copy tool definitions
   * @param {string} saTargetPath - Super Agents target path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async copyToolDefinitions(saTargetPath, config) {
    const toolsSourcePath = join(this.options.projectRoot, 'sa-engine/mcp-server/tools');
    const toolsTargetPath = join(saTargetPath, 'tools');

    if (!existsSync(toolsTargetPath)) {
      await mkdir(toolsTargetPath, { recursive: true });
    }

    // Copy tool directories
    const toolCategories = [
      'analyst', 'architect', 'core', 'dependencies', 'developer',
      'pm', 'product-owner', 'qa', 'scrum-master', 'task-master',
      'ux-expert', 'workflow'
    ];

    for (const category of toolCategories) {
      const categorySourcePath = join(toolsSourcePath, category);
      const categoryTargetPath = join(toolsTargetPath, category);
      
      if (existsSync(categorySourcePath)) {
        await mkdir(categoryTargetPath, { recursive: true });
        await this.copyDirectoryContents(categorySourcePath, categoryTargetPath);
      }
    }
  }

  /**
   * Copy directory contents recursively
   * @param {string} sourcePath - Source directory
   * @param {string} targetPath - Target directory
   * @returns {Promise<void>}
   */
  async copyDirectoryContents(sourcePath, targetPath) {
    const { readdir, stat } = await import('fs/promises');
    
    const items = await readdir(sourcePath);
    
    for (const item of items) {
      const sourceItemPath = join(sourcePath, item);
      const targetItemPath = join(targetPath, item);
      
      const itemStat = await stat(sourceItemPath);
      
      if (itemStat.isDirectory()) {
        await mkdir(targetItemPath, { recursive: true });
        await this.copyDirectoryContents(sourceItemPath, targetItemPath);
      } else {
        const content = await readFile(sourceItemPath, 'utf-8');
        await writeFile(targetItemPath, content);
      }
    }
  }

  /**
   * Create project-specific configurations
   * @param {string} targetProjectPath - Target project path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async createProjectConfigurations(targetProjectPath, config) {
    this.log('Creating project-specific configurations', { targetProjectPath });

    // Create package.json scripts if package.json exists
    await this.updatePackageJsonScripts(targetProjectPath);

    // Create .env template
    await this.createEnvironmentTemplate(targetProjectPath);

    // Create MCP configuration
    await this.createMCPConfiguration(targetProjectPath, config);

    this.log('Project configurations created');
  }

  /**
   * Update package.json with Super Agents scripts
   * @param {string} targetProjectPath - Target project path
   * @returns {Promise<void>}
   */
  async updatePackageJsonScripts(targetProjectPath) {
    const packageJsonPath = join(targetProjectPath, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      // Create basic package.json
      const basicPackageJson = {
        name: "super-agents-project",
        version: "1.0.0",
        description: "Project with Super Agents integration",
        scripts: {},
        dependencies: {}
      };
      
      await writeFile(packageJsonPath, JSON.stringify(basicPackageJson, null, 2));
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    
    // Add Super Agents scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "sa:mcp": "node super-agents/sa-engine/mcp-server/index.js",
      "sa:init": "node super-agents/scripts/init-project.js",
      "sa:status": "node super-agents/scripts/check-status.js"
    };

    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log('Package.json updated with Super Agents scripts');
  }

  /**
   * Create environment template
   * @param {string} targetProjectPath - Target project path
   * @returns {Promise<void>}
   */
  async createEnvironmentTemplate(targetProjectPath) {
    const envTemplate = `# Super Agents Environment Configuration

# Required API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Super Agents Configuration
SA_PROJECT_ROOT=.
SA_LOG_LEVEL=info
SA_ENABLE_ANALYTICS=false

# Claude Code Integration
CLAUDE_CODE_MCP_ENABLED=true
CLAUDE_CODE_TOOLS_ALLOWLIST=super-agents:*
`;

    const envPath = join(targetProjectPath, '.env.super-agents');
    await writeFile(envPath, envTemplate);
    this.log('Environment template created', { envPath });
  }

  /**
   * Create MCP configuration for the target project
   * @param {string} targetProjectPath - Target project path
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async createMCPConfiguration(targetProjectPath, config) {
    const mcpConfig = {
      mcpServers: {
        "super-agents": {
          command: "node",
          args: ["super-agents/sa-engine/mcp-server/index.js"],
          env: {
            SA_PROJECT_ROOT: ".",
            ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}",
            OPENAI_API_KEY: "${OPENAI_API_KEY}",
            SA_LOG_LEVEL: "${SA_LOG_LEVEL:-info}"
          }
        }
      }
    };

    const mcpConfigPath = join(targetProjectPath, '.claude', 'mcp.json');
    await mkdir(dirname(mcpConfigPath), { recursive: true });
    await writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    
    this.log('MCP configuration created', { mcpConfigPath });
  }

  /**
   * Generate installation instructions
   * @param {string} targetProjectPath - Target project path
   * @returns {Promise<void>}
   */
  async generateInstallationInstructions(targetProjectPath) {
    const instructions = `# Super Agents - Claude Code Integration Setup

## Installation Complete! 🎉

Your project has been configured with Super Agents framework integration for Claude Code.

## Quick Start

### 1. Configure API Keys
Copy the API key template and add your keys:
\`\`\`bash
cp .env.super-agents .env
# Edit .env with your API keys
\`\`\`

### 2. Install Dependencies
\`\`\`bash
cd super-agents
npm install
\`\`\`

### 3. Test MCP Server
\`\`\`bash
npm run sa:mcp
\`\`\`

### 4. Configure Claude Code
Add this to your Claude Code settings:
\`\`\`json
{
  "mcp": {
    "servers": {
      "super-agents": {
        "command": "node",
        "args": ["super-agents/sa-engine/mcp-server/index.js"],
        "env": {
          "SA_PROJECT_ROOT": ".",
          "ANTHROPIC_API_KEY": "\${ANTHROPIC_API_KEY}",
          "OPENAI_API_KEY": "\${OPENAI_API_KEY}"
        }
      }
    }
  }
}
\`\`\`

## Available Features

### Agents
- **Analyst**: Market research and competitive analysis
- **PM**: Product requirements and feature planning  
- **Architect**: System design and technical architecture
- **Developer**: Implementation and code development
- **QA**: Code review and quality assurance
- **Product Owner**: Story validation and project management
- **UX Expert**: Frontend design and user experience
- **Scrum Master**: Workflow management and progress tracking

### Custom Commands
Available in Claude Code with \`/sa-*\` prefix:
- \`/sa-start-project\` - Initialize new project workflow
- \`/sa-track-progress\` - Monitor workflow status
- \`/sa-research <topic>\` - Run analyst research
- \`/sa-create-prd <feature>\` - Generate product requirements
- \`/sa-implement <story>\` - Implement features with developer agent

### MCP Tools
40+ specialized tools for development workflows:
- Task management and dependency tracking
- Agent-specific functionality
- Workflow automation and monitoring
- Quality assurance and testing

## Documentation
- Check \`CLAUDE.md\` for comprehensive usage guide
- Review \`.claude/\` directory for commands and agent docs
- See \`super-agents/\` for tool implementations

## Support
For questions and support, refer to the Super Agents framework documentation.

---
*Generated by Super Agents Standalone Setup*
`;

    const instructionsPath = join(targetProjectPath, 'SUPER_AGENTS_SETUP.md');
    await writeFile(instructionsPath, instructions);
    
    this.log('Installation instructions generated', { instructionsPath });
  }

  /**
   * Validate the completed setup
   * @param {string} targetProjectPath - Target project path
   * @returns {Promise<Object>} Validation results
   */
  async validateSetup(targetProjectPath) {
    this.log('Validating setup', { targetProjectPath });

    const validation = {
      claudeConfigExists: false,
      mcpConfigExists: false,
      agentFilesExist: false,
      toolsExist: false,
      scriptsAdded: false,
      envTemplateExists: false,
      errors: []
    };

    try {
      // Check .claude directory
      const claudeDir = join(targetProjectPath, '.claude');
      validation.claudeConfigExists = existsSync(claudeDir);

      // Check MCP config
      const mcpConfigPath = join(claudeDir, 'mcp.json');
      validation.mcpConfigExists = existsSync(mcpConfigPath);

      // Check agent files
      const agentsDir = join(claudeDir, 'agents');
      validation.agentFilesExist = existsSync(agentsDir);

      // Check tools
      const toolsDir = join(targetProjectPath, 'super-agents', 'tools');
      validation.toolsExist = existsSync(toolsDir);

      // Check package.json scripts
      const packageJsonPath = join(targetProjectPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
        validation.scriptsAdded = packageJson.scripts && packageJson.scripts['sa:mcp'];
      }

      // Check environment template
      const envTemplatePath = join(targetProjectPath, '.env.super-agents');
      validation.envTemplateExists = existsSync(envTemplatePath);

      this.setupStatus.validated = Object.values(validation).every(v => 
        Array.isArray(v) ? v.length === 0 : v === true
      );

      this.log('Setup validation completed', validation);
      return validation;

    } catch (error) {
      validation.errors.push(error.message);
      this.log('Setup validation failed', { error: error.message });
      return validation;
    }
  }

  /**
   * Get setup results and statistics
   * @param {string} targetProjectPath - Target project path
   * @returns {Object} Setup results
   */
  getSetupResults(targetProjectPath) {
    return {
      targetProject: targetProjectPath,
      setupStatus: this.setupStatus,
      integrationStatus: this.integrator ? this.integrator.getIntegrationStatus() : null,
      filesGenerated: this.setupStatus.filesGenerated,
      commandsCreated: this.setupStatus.commandsCreated,
      agentsSetup: this.setupStatus.agentsSetup,
      timestamp: new Date(),
      success: this.setupStatus.initialized
    };
  }

  /**
   * Clean up setup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      this.log('Cleaning up standalone setup');

      if (this.integrator) {
        await this.integrator.cleanup();
      }

      this.setupStatus = {
        initialized: false,
        filesGenerated: 0,
        commandsCreated: 0,
        agentsSetup: 0,
        hooksInstalled: 0,
        validated: false
      };

      this.log('Standalone setup cleanup completed');

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
      component: 'StandaloneSetup',
      ...data
    };
    
    this.emit('log', logEntry);
    
    switch (level) {
      case 'error':
        console.error(`[StandaloneSetup ERROR] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[StandaloneSetup WARN] ${message}`, data);
        break;
      default:
        console.log(`[StandaloneSetup INFO] ${message}`, data);
    }
  }
}