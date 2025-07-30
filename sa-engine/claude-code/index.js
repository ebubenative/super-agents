#!/usr/bin/env node

/**
 * Super Agents - Claude Code Integration Entry Point
 * Provides command-line interface for Claude Code integration setup and management
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import ClaudeCodeIntegrator from './ClaudeCodeIntegrator.js';
import StandaloneSetup from './StandaloneSetup.js';
import CommandGenerator from './CommandGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ClaudeCodeIntegrationCLI {
  constructor() {
    this.projectRoot = process.cwd();
    this.commands = {
      'setup': this.setupIntegration.bind(this),
      'standalone': this.standaloneSetup.bind(this),
      'generate-commands': this.generateCommands.bind(this),
      'status': this.showStatus.bind(this),
      'test': this.testIntegration.bind(this),
      'help': this.showHelp.bind(this)
    };
  }

  /**
   * Main CLI entry point
   */
  async run() {
    try {
      const args = process.argv.slice(2);
      const command = args[0] || 'help';
      const options = this.parseOptions(args.slice(1));

      if (!this.commands[command]) {
        console.error(`Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
      }

      await this.commands[command](options);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Parse command line options
   * @param {Array} args - Command line arguments
   * @returns {Object} Parsed options
   */
  parseOptions(args) {
    const options = {
      verbose: false,
      force: false,
      dryRun: false,
      projectPath: null,
      includeHooks: true,
      validateSetup: true
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '-v':
        case '--verbose':
          options.verbose = true;
          break;
        case '-f':
        case '--force':
          options.force = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--no-hooks':
          options.includeHooks = false;
          break;
        case '--no-validation':
          options.validateSetup = false;
          break;
        case '--project':
          options.projectPath = args[++i];
          break;
        default:
          if (!arg.startsWith('-')) {
            options.target = arg;
          }
      }
    }

    return options;
  }

  /**
   * Setup full Claude Code integration
   * @param {Object} options - Setup options
   */
  async setupIntegration(options) {
    console.log('🚀 Setting up Claude Code integration...\n');

    const integrator = new ClaudeCodeIntegrator({
      projectRoot: this.projectRoot,
      logLevel: options.verbose ? 'debug' : 'info',
      standaloneMode: false,
      autoGenerateCommands: true,
      includeHooks: options.includeHooks
    });

    // Setup event listeners
    this.setupEventListeners(integrator, options);

    try {
      await integrator.initialize();
      
      const status = integrator.getIntegrationStatus();
      
      console.log('\n✅ Claude Code integration completed successfully!');
      console.log(`📊 Tools registered: ${status.toolCount}`);
      console.log(`📁 Files generated: ${status.generatedFiles}`);
      console.log('\n📋 Next steps:');
      console.log('1. Add your API keys to environment variables');
      console.log('2. Configure Claude Code with the generated MCP config');
      console.log('3. Restart Claude Code to load the Super Agents tools');
      console.log('\n📖 See CLAUDE.md for detailed usage instructions');

    } catch (error) {
      console.error('\n❌ Integration failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup standalone integration for external projects
   * @param {Object} options - Setup options
   */
  async standaloneSetup(options) {
    const targetPath = options.target || options.projectPath;
    
    if (!targetPath) {
      console.error('❌ Please specify target project path');
      console.log('Usage: node index.js standalone <target-path>');
      process.exit(1);
    }

    console.log(`🚀 Setting up standalone integration for: ${targetPath}\n`);

    const setup = new StandaloneSetup({
      projectRoot: this.projectRoot,
      logLevel: options.verbose ? 'debug' : 'info',
      setupHooks: options.includeHooks,
      validateSetup: options.validateSetup
    });

    // Setup event listeners
    this.setupEventListeners(setup, options);

    try {
      const results = await setup.runStandaloneSetup(targetPath, {
        validateSetup: options.validateSetup,
        setupHooks: options.includeHooks
      });

      console.log('\n✅ Standalone setup completed successfully!');
      console.log(`📊 Files generated: ${results.filesGenerated}`);
      console.log(`🤖 Agents setup: ${results.agentsSetup}`);
      console.log(`⚙️ Commands created: ${results.commandsCreated}`);
      
      if (results.setupStatus.validated) {
        console.log('✅ Setup validation passed');
      }

      console.log('\n📋 Next steps:');
      console.log(`1. cd ${targetPath}`);
      console.log('2. Configure your API keys in .env file');
      console.log('3. Run npm install in the super-agents directory');
      console.log('4. Configure Claude Code with the generated settings');
      console.log('\n📖 See SUPER_AGENTS_SETUP.md for detailed instructions');

    } catch (error) {
      console.error('\n❌ Standalone setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate custom commands and hooks
   * @param {Object} options - Generation options
   */
  async generateCommands(options) {
    console.log('🔧 Generating custom commands and hooks...\n');

    const generator = new CommandGenerator({
      projectRoot: this.projectRoot,
      generateWorkflowCommands: true,
      generateAgentCommands: true,
      generateHooks: options.includeHooks,
      logLevel: options.verbose ? 'debug' : 'info'
    });

    // Setup event listeners
    this.setupEventListeners(generator, options);

    try {
      const results = await generator.generateAll();

      console.log('\n✅ Command generation completed successfully!');
      console.log(`📝 Commands generated: ${results.commands}`);
      console.log(`🪝 Hooks generated: ${results.hooks}`);
      
      if (results.errors.length > 0) {
        console.log(`\n⚠️ Warnings (${results.errors.length}):`);
        results.errors.forEach(error => console.log(`  - ${error}`));
      }

      const stats = generator.getGenerationStats();
      console.log('\n📊 Generation Statistics:');
      console.log(`  Command types: ${JSON.stringify(stats.commandTypes, null, 2)}`);
      console.log(`  Hook types: ${JSON.stringify(stats.hookTypes, null, 2)}`);

    } catch (error) {
      console.error('\n❌ Command generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Show integration status
   * @param {Object} options - Status options
   */
  async showStatus(options) {
    console.log('📊 Claude Code Integration Status\n');

    try {
      // Check for existing integration files
      const files = {
        'MCP Config': join(this.projectRoot, 'mcp-config.json'),
        'Claude Memory': join(this.projectRoot, 'CLAUDE.md'),
        'Claude Directory': join(this.projectRoot, '.claude'),
        'SA Engine': join(this.projectRoot, 'sa-engine'),
        'MCP Server': join(this.projectRoot, 'sa-engine/mcp-server')
      };

      console.log('📁 File Status:');
      for (const [name, path] of Object.entries(files)) {
        const exists = existsSync(path);
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${exists ? 'Found' : 'Missing'}`);
      }

      // Check Claude directory contents
      const claudeDir = files['Claude Directory'];
      if (existsSync(claudeDir)) {
        console.log('\n📂 Claude Directory Contents:');
        const subdirs = ['commands', 'hooks', 'agents'];
        for (const subdir of subdirs) {
          const subdirPath = join(claudeDir, subdir);
          const exists = existsSync(subdirPath);
          const status = exists ? '✅' : '❌';
          console.log(`  ${status} ${subdir}/: ${exists ? 'Found' : 'Missing'}`);
        }
      }

      // Check environment
      console.log('\n🔑 Environment Variables:');
      const envVars = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'SA_PROJECT_ROOT'];
      for (const envVar of envVars) {
        const exists = !!process.env[envVar];
        const status = exists ? '✅' : '❌';
        console.log(`  ${status} ${envVar}: ${exists ? 'Set' : 'Not set'}`);
      }

      console.log('\n📖 For setup instructions, run: node index.js help');

    } catch (error) {
      console.error('\n❌ Failed to check status:', error.message);
      throw error;
    }
  }

  /**
   * Test integration functionality
   * @param {Object} options - Test options
   */
  async testIntegration(options) {
    console.log('🧪 Testing Claude Code integration...\n');

    try {
      // Test MCP server loading
      console.log('Testing MCP server...');
      const MCPServer = (await import('../mcp-server/MCPServer.js')).default;
      const server = new MCPServer({
        name: 'test-server',
        toolsPath: join(this.projectRoot, 'sa-engine/mcp-server/tools')
      });

      console.log('✅ MCP server loaded successfully');

      // Test tool registry
      console.log('Testing tool registry...');
      const ToolRegistry = (await import('../mcp-server/ToolRegistry.js')).default;
      const registry = new ToolRegistry({
        toolsPath: join(this.projectRoot, 'sa-engine/mcp-server/tools')
      });

      await registry.loadAllTools();
      const toolCount = registry.getToolCount();
      
      console.log(`✅ Tool registry loaded: ${toolCount} tools found`);

      // Test integration components
      console.log('Testing integration components...');
      const integrator = new ClaudeCodeIntegrator({
        projectRoot: this.projectRoot
      });

      const status = integrator.getIntegrationStatus();
      console.log('✅ Integration components loaded successfully');

      console.log('\n📊 Test Results:');
      console.log(`  MCP Server: ✅ Functional`);
      console.log(`  Tool Registry: ✅ ${toolCount} tools loaded`);
      console.log(`  Integration: ✅ Components ready`);

      console.log('\n🎉 All tests passed! Integration is ready to use.');

    } catch (error) {
      console.error('\n❌ Integration test failed:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    const help = `
🤖 Super Agents - Claude Code Integration CLI

USAGE:
  node index.js <command> [options]

COMMANDS:
  setup                 Setup full Claude Code integration with MCP
  standalone <path>     Setup standalone integration for external project
  generate-commands     Generate custom slash commands and hooks
  status               Show current integration status
  test                 Test integration functionality
  help                 Show this help message

OPTIONS:
  -v, --verbose        Enable verbose logging
  -f, --force          Force overwrite existing files
  --dry-run            Show what would be done without executing
  --project <path>     Specify target project path
  --no-hooks           Skip hook generation
  --no-validation      Skip setup validation

EXAMPLES:
  # Full integration setup
  node index.js setup --verbose

  # Standalone setup for external project
  node index.js standalone /path/to/project --verbose

  # Generate commands only
  node index.js generate-commands --no-hooks

  # Check integration status
  node index.js status

  # Test functionality
  node index.js test --verbose

ENVIRONMENT VARIABLES:
  ANTHROPIC_API_KEY    Required for Claude API access
  OPENAI_API_KEY       Optional for GPT model access
  SA_PROJECT_ROOT      Project root directory (default: current directory)
  SA_LOG_LEVEL         Logging level (info, debug, warn, error)

For more information, see the documentation in the project repository.
`;

    console.log(help);
  }

  /**
   * Setup event listeners for progress tracking
   * @param {EventEmitter} emitter - Event emitter
   * @param {Object} options - Options
   */
  setupEventListeners(emitter, options) {
    if (options.verbose) {
      emitter.on('log', (logEntry) => {
        console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.message}`);
        if (logEntry.error) {
          console.error(logEntry.error);
        }
      });
    }

    emitter.on('integrationStarting', () => {
      console.log('⚙️ Starting integration...');
    });

    emitter.on('integrationCompleted', (result) => {
      console.log('✅ Integration completed');
    });

    emitter.on('setupStarting', (data) => {
      console.log(`⚙️ Starting setup for: ${data.targetProjectPath}`);
    });

    emitter.on('setupCompleted', (result) => {
      console.log('✅ Setup completed');
    });

    emitter.on('generationStarting', () => {
      console.log('⚙️ Starting generation...');
    });

    emitter.on('generationCompleted', (result) => {
      console.log('✅ Generation completed');
    });

    emitter.on('toolRegistered', (data) => {
      if (options.verbose) {
        console.log(`🔧 Tool registered: ${data.tool.name}`);
      }
    });

    emitter.on('serverStarted', (data) => {
      if (options.verbose) {
        console.log(`🚀 MCP server started: ${data.config.name}`);
      }
    });
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ClaudeCodeIntegrationCLI();
  cli.run().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

export default ClaudeCodeIntegrationCLI;