#!/usr/bin/env node

import MCPServer from './MCPServer.js';
import ToolRegistry from './ToolRegistry.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import core tools
import { saInitializeProject } from './tools/core/sa-initialize-project.js';
import { saListTasks } from './tools/core/sa-list-tasks.js';
import { saGetTask } from './tools/core/sa-get-task.js';
import { saUpdateTaskStatus } from './tools/core/sa-update-task-status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Super Agents MCP Server Launcher
 * Initializes and starts the MCP server with all core tools
 */
class SuperAgentsMCPLauncher {
  constructor() {
    this.mcpServer = null;
    this.toolRegistry = null;
    this.isShuttingDown = false;
  }

  /**
   * Start the Super Agents MCP server
   */
  async start() {
    try {
      console.log('🚀 Starting Super Agents MCP Server...');
      
      // Initialize tool registry
      await this.initializeToolRegistry();
      
      // Initialize MCP server
      await this.initializeMCPServer();
      
      // Register core tools
      await this.registerCoreTools();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('✅ Super Agents MCP Server started successfully!');
      console.log(`📊 Registered ${this.toolRegistry.getStats().totalTools} tools`);
      console.log('🔌 Ready for IDE connections via Model Context Protocol');
      
    } catch (error) {
      console.error('❌ Failed to start Super Agents MCP Server:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize the tool registry
   */
  async initializeToolRegistry() {
    console.log('📋 Initializing tool registry...');
    
    this.toolRegistry = new ToolRegistry({
      toolsPath: join(__dirname, 'tools'),
      enableHotReload: true,
      enableCaching: true,
      validateOnLoad: true,
      generateDocs: true,
      enableMetrics: true,
      enableLogging: true
    });

    // Setup event listeners
    this.toolRegistry.on('toolRegistered', ({ tool }) => {
      console.log(`✅ Tool registered: ${tool.name} (${tool.category})`);
    });

    this.toolRegistry.on('toolLoadError', ({ filePath, error }) => {
      console.warn(`⚠️  Failed to load tool from ${filePath}: ${error.message}`);
    });

    this.toolRegistry.on('toolsReloaded', ({ filePath }) => {
      console.log(`🔄 Reloaded tools from ${filePath}`);
    });

    await this.toolRegistry.initialize();
  }

  /**
   * Initialize the MCP server
   */
  async initializeMCPServer() {
    console.log('🖥️  Initializing MCP server...');
    
    this.mcpServer = new MCPServer({
      name: 'super-agents-mcp',
      version: '1.0.0',
      description: 'Super Agents MCP Server for IDE integration',
      transport: 'stdio',
      enableLogging: true,
      autoLoadTools: false // We'll manually register tools
    });

    // Setup event listeners
    this.mcpServer.on('serverStarted', ({ config, toolCount }) => {
      console.log(`🎯 MCP server started: ${config.name} v${config.version}`);
    });

    this.mcpServer.on('toolExecuted', ({ name, result }) => {
      console.log(`⚡ Tool executed: ${name}`);
    });

    this.mcpServer.on('toolError', ({ name, error }) => {
      console.error(`❌ Tool execution error (${name}): ${error.message}`);
    });

    this.mcpServer.on('log', (logEntry) => {
      if (logEntry.level === 'error') {
        console.error(`[${logEntry.component}] ${logEntry.message}`, logEntry);
      }
    });

    // Start the server
    await this.mcpServer.startServer();
  }

  /**
   * Register core MCP tools
   */
  async registerCoreTools() {
    console.log('🔧 Registering core tools...');
    
    const coreTools = [
      saInitializeProject,
      saListTasks,
      saGetTask,
      saUpdateTaskStatus
    ];

    for (const tool of coreTools) {
      // Register with tool registry
      await this.toolRegistry.registerTool(tool);
      
      // Register with MCP server
      this.mcpServer.registerTool(tool);
    }

    console.log(`✅ Registered ${coreTools.length} core tools`);
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) {
        return;
      }
      
      this.isShuttingDown = true;
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        if (this.mcpServer) {
          await this.mcpServer.stopServer();
        }
        
        if (this.toolRegistry) {
          await this.toolRegistry.cleanup();
        }
        
        console.log('✅ Shutdown completed successfully');
        process.exit(0);
        
      } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Get server status and statistics
   */
  getStatus() {
    const mcpStatus = this.mcpServer ? this.mcpServer.getServerStatus() : null;
    const registryStats = this.toolRegistry ? this.toolRegistry.getStats() : null;

    return {
      mcp: mcpStatus,
      registry: registryStats,
      launcher: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
  }
}

/**
 * Main entry point
 */
async function main() {
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Super Agents MCP Server

Usage:
  node index.js [options]

Options:
  --help, -h     Show this help message
  --version, -v  Show version information
  --status       Show server status (if running)

Environment Variables:
  SA_MCP_LOG_LEVEL    Set logging level (debug, info, warn, error)
  SA_MCP_TOOLS_PATH   Override tools directory path
  SA_MCP_PORT         Set server port (for non-stdio transport)

Examples:
  node index.js                    # Start MCP server with stdio transport
  SA_MCP_LOG_LEVEL=debug node index.js  # Start with debug logging
`);
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    const packageJson = await import('../../package.json', { 
      assert: { type: 'json' } 
    });
    console.log(`Super Agents MCP Server v${packageJson.default.version}`);
    process.exit(0);
  }

  // Create and start the launcher
  const launcher = new SuperAgentsMCPLauncher();
  
  // Handle status command (would require IPC in real implementation)
  if (args.includes('--status')) {
    console.log('📊 Server Status:');
    console.log(JSON.stringify(launcher.getStatus(), null, 2));
    return;
  }

  // Start the server
  await launcher.start();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Failed to start Super Agents MCP Server:', error);
    process.exit(1);
  });
}

export default SuperAgentsMCPLauncher;