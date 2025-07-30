import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { EventEmitter } from 'events';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCPServer - Super Agents MCP Server implementation
 * Provides MCP protocol support for IDE integration with Super Agents framework
 */
export default class MCPServer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      name: options.name || 'super-agents-mcp',
      version: options.version || '1.0.0',
      description: options.description || 'Super Agents MCP Server for IDE integration',
      host: options.host || 'localhost',
      port: options.port || 3000,
      transport: options.transport || 'stdio',
      logLevel: options.logLevel || 'info',
      toolsPath: options.toolsPath || join(__dirname, 'tools'),
      configPath: options.configPath || join(__dirname, 'config.json'),
      enableLogging: options.enableLogging !== false,
      autoLoadTools: options.autoLoadTools !== false,
      maxConcurrentTools: options.maxConcurrentTools || 10,
      toolTimeout: options.toolTimeout || 30000,
      ...options
    };

    this.server = null;
    this.transport = null;
    this.isRunning = false;
    this.registeredTools = new Map();
    this.toolRegistry = null;
    this.startTime = null;
    this.metrics = {
      toolCalls: 0,
      errors: 0,
      uptime: 0
    };

    this.log('MCPServer initialized', { options: this.options });
  }

  /**
   * Start the MCP server with the specified configuration
   * @param {Object} config - Server configuration overrides
   * @returns {Promise<void>}
   */
  async startServer(config = {}) {
    try {
      if (this.isRunning) {
        throw new Error('Server is already running');
      }

      // Merge configuration
      const serverConfig = { ...this.options, ...config };
      
      this.log('Starting MCP server', { config: serverConfig });
      this.emit('serverStarting', { config: serverConfig });

      // Create server instance
      this.server = new Server(
        {
          name: serverConfig.name,
          version: serverConfig.version,
          description: serverConfig.description
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      // Setup transport
      await this.setupTransport(serverConfig);
      
      // Setup request handlers
      this.setupRequestHandlers();
      
      // Load configuration
      await this.loadConfiguration();
      
      // Auto-load tools if enabled
      if (serverConfig.autoLoadTools) {
        await this.loadDefaultTools();
      }

      // Start server
      await this.server.connect(this.transport);
      
      this.isRunning = true;
      this.startTime = new Date();
      
      this.log('MCP server started successfully', { 
        name: serverConfig.name,
        version: serverConfig.version,
        toolCount: this.registeredTools.size
      });
      
      this.emit('serverStarted', { 
        config: serverConfig,
        toolCount: this.registeredTools.size 
      });

    } catch (error) {
      this.log('Failed to start MCP server', { error: error.message });
      this.emit('serverError', { error, context: 'startup' });
      throw error;
    }
  }

  /**
   * Stop the MCP server gracefully
   * @returns {Promise<void>}
   */
  async stopServer() {
    try {
      if (!this.isRunning) {
        this.log('Server is not running');
        return;
      }

      this.log('Stopping MCP server');
      this.emit('serverStopping');

      // Close server connection
      if (this.server) {
        await this.server.close();
      }

      // Close transport
      if (this.transport) {
        await this.transport.close();
      }

      this.isRunning = false;
      this.server = null;
      this.transport = null;

      this.log('MCP server stopped successfully');
      this.emit('serverStopped');

    } catch (error) {
      this.log('Error stopping MCP server', { error: error.message });
      this.emit('serverError', { error, context: 'shutdown' });
      throw error;
    }
  }

  /**
   * Restart the server with new configuration
   * @param {Object} config - New server configuration
   * @returns {Promise<void>}
   */
  async restartServer(config = {}) {
    this.log('Restarting MCP server', { config });
    this.emit('serverRestarting', { config });

    await this.stopServer();
    await this.startServer(config);
  }

  /**
   * Get current server status and health information
   * @returns {Object} Server status object
   */
  getServerStatus() {
    const status = {
      isRunning: this.isRunning,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      toolCount: this.registeredTools.size,
      metrics: {
        ...this.metrics,
        uptime: this.startTime ? Date.now() - this.startTime : 0
      },
      config: {
        name: this.options.name,
        version: this.options.version,
        transport: this.options.transport,
        toolsPath: this.options.toolsPath
      }
    };

    return status;
  }

  /**
   * Setup transport layer based on configuration
   * @param {Object} config - Server configuration
   * @returns {Promise<void>}
   */
  async setupTransport(config) {
    switch (config.transport) {
      case 'stdio':
        this.transport = new StdioServerTransport();
        break;
      default:
        throw new Error(`Unsupported transport: ${config.transport}`);
    }

    this.log('Transport setup completed', { transport: config.transport });
  }

  /**
   * Setup MCP request handlers
   */
  setupRequestHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.registeredTools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      this.log('Listed tools', { count: tools.length });
      return { tools };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        this.log('Executing tool', { name, args });
        this.metrics.toolCalls++;
        
        const result = await this.executeTool(name, args);
        
        this.log('Tool executed successfully', { name, result });
        this.emit('toolExecuted', { name, args, result });
        
        return result;
        
      } catch (error) {
        this.metrics.errors++;
        this.log('Tool execution failed', { name, args, error: error.message });
        this.emit('toolError', { name, args, error });
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    this.log('Request handlers setup completed');
  }

  /**
   * Execute a tool by name with provided arguments
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolName, args = {}) {
    const tool = this.registeredTools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Validate arguments if schema is provided
    if (tool.inputSchema && tool.validate) {
      const validation = tool.validate(args);
      if (!validation.isValid) {
        throw new Error(`Invalid arguments: ${validation.errors.join(', ')}`);
      }
    }

    // Execute tool with timeout
    const executionPromise = tool.execute(args, {
      server: this,
      timestamp: new Date(),
      toolName
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool execution timeout: ${toolName}`));
      }, this.options.toolTimeout);
    });

    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Register a new tool with the server
   * @param {Object} tool - Tool definition
   * @returns {boolean} Registration success
   */
  registerTool(tool) {
    try {
      // Validate tool definition
      this.validateToolDefinition(tool);
      
      // Register tool
      this.registeredTools.set(tool.name, tool);
      
      this.log('Tool registered', { 
        name: tool.name, 
        description: tool.description 
      });
      
      this.emit('toolRegistered', { tool });
      return true;
      
    } catch (error) {
      this.log('Failed to register tool', { 
        toolName: tool?.name || 'unknown', 
        error: error.message 
      });
      
      this.emit('toolRegistrationError', { tool, error });
      return false;
    }
  }

  /**
   * Unregister a tool from the server
   * @param {string} toolName - Name of the tool to unregister
   * @returns {boolean} Unregistration success
   */
  unregisterTool(toolName) {
    if (this.registeredTools.has(toolName)) {
      const tool = this.registeredTools.get(toolName);
      this.registeredTools.delete(toolName);
      
      this.log('Tool unregistered', { name: toolName });
      this.emit('toolUnregistered', { tool });
      return true;
    }
    
    return false;
  }

  /**
   * Get list of registered tools
   * @param {Object} filters - Optional filters
   * @returns {Array} List of registered tools
   */
  listTools(filters = {}) {
    let tools = Array.from(this.registeredTools.values());
    
    // Apply filters
    if (filters.category) {
      tools = tools.filter(tool => tool.category === filters.category);
    }
    
    if (filters.enabled !== undefined) {
      tools = tools.filter(tool => tool.enabled === filters.enabled);
    }
    
    return tools;
  }

  /**
   * Validate tool definition
   * @param {Object} tool - Tool to validate
   * @throws {Error} If tool definition is invalid
   */
  validateToolDefinition(tool) {
    if (!tool || typeof tool !== 'object') {
      throw new Error('Tool must be an object');
    }
    
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool must have a valid name');
    }
    
    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool must have a valid description');
    }
    
    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error('Tool must have an execute function');
    }
    
    if (this.registeredTools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
  }

  /**
   * Load default tools from the tools directory
   * @returns {Promise<void>}
   */
  async loadDefaultTools() {
    try {
      this.log('Loading default tools', { toolsPath: this.options.toolsPath });
      
      // Load core tools
      const coreToolsPath = join(this.options.toolsPath, 'core');
      if (existsSync(coreToolsPath)) {
        await this.loadToolsFromDirectory(coreToolsPath);
      }
      
      this.log('Default tools loaded', { 
        toolCount: this.registeredTools.size 
      });
      
    } catch (error) {
      this.log('Failed to load default tools', { error: error.message });
      throw error;
    }
  }

  /**
   * Load tools from a directory
   * @param {string} directory - Directory path
   * @returns {Promise<void>}
   */
  async loadToolsFromDirectory(directory) {
    // This would be implemented to dynamically load tool modules
    // For now, we'll manually import known tools
    this.log('Loading tools from directory', { directory });
    
    // Tools will be registered manually for now
    // In a full implementation, this would scan for .js files and import them
  }

  /**
   * Load server configuration from file
   * @returns {Promise<void>}
   */
  async loadConfiguration() {
    try {
      if (existsSync(this.options.configPath)) {
        const configData = await readFile(this.options.configPath, 'utf-8');
        const config = JSON.parse(configData);
        
        // Apply configuration
        Object.assign(this.options, config);
        
        this.log('Configuration loaded', { configPath: this.options.configPath });
        this.emit('configurationLoaded', { config });
      }
    } catch (error) {
      this.log('Failed to load configuration', { error: error.message });
      // Don't throw - use defaults
    }
  }

  /**
   * Save current configuration to file
   * @returns {Promise<void>}
   */
  async saveConfiguration() {
    try {
      const config = {
        name: this.options.name,
        version: this.options.version,
        description: this.options.description,
        logLevel: this.options.logLevel,
        autoLoadTools: this.options.autoLoadTools,
        maxConcurrentTools: this.options.maxConcurrentTools,
        toolTimeout: this.options.toolTimeout
      };
      
      await writeFile(this.options.configPath, JSON.stringify(config, null, 2));
      
      this.log('Configuration saved', { configPath: this.options.configPath });
      this.emit('configurationSaved', { config });
      
    } catch (error) {
      this.log('Failed to save configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle graceful shutdown
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    this.log('Initiating graceful shutdown');
    
    try {
      // Stop accepting new requests
      this.isRunning = false;
      
      // Wait a moment for pending requests to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Stop the server
      await this.stopServer();
      
      this.log('Graceful shutdown completed');
      
    } catch (error) {
      this.log('Error during graceful shutdown', { error: error.message });
      throw error;
    }
  }

  /**
   * Get server metrics and statistics
   * @returns {Object} Server metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      toolCount: this.registeredTools.size,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    };
  }

  /**
   * Logging utility with different levels
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   * @param {string} level - Log level (info, warn, error, debug)
   */
  log(message, data = {}, level = 'info') {
    if (!this.options.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      component: 'MCPServer',
      ...data
    };
    
    // Emit log event for external logging systems
    this.emit('log', logEntry);
    
    // Console logging based on level
    switch (level) {
      case 'error':
        console.error(`[MCPServer ERROR] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[MCPServer WARN] ${message}`, data);
        break;
      case 'debug':
        if (this.options.logLevel === 'debug') {
          console.debug(`[MCPServer DEBUG] ${message}`, data);
        }
        break;
      default:
        console.log(`[MCPServer INFO] ${message}`, data);
    }
  }
}