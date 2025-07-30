import { EventEmitter } from 'events';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ToolRegistry - Dynamic MCP tool registration and management system
 * Handles tool discovery, loading, validation, and documentation generation
 */
export default class ToolRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      toolsPath: options.toolsPath || join(__dirname, 'tools'),
      enableHotReload: options.enableHotReload !== false,
      enableCaching: options.enableCaching !== false,
      validateOnLoad: options.validateOnLoad !== false,
      generateDocs: options.generateDocs !== false,
      maxTools: options.maxTools || 100,
      toolTimeout: options.toolTimeout || 30000,
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false,
      configPath: options.configPath || join(__dirname, 'tools-config.json'),
      ...options
    };

    this.tools = new Map();
    this.toolCategories = new Map();
    this.toolMetrics = new Map();
    this.loadedModules = new Map();
    this.watchers = new Map();
    this.cache = new Map();
    
    this.stats = {
      totalTools: 0,
      enabledTools: 0,
      disabledTools: 0,
      loadErrors: 0,
      lastScan: null
    };

    this.log('ToolRegistry initialized', { options: this.options });
  }

  /**
   * Initialize the tool registry
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.log('Initializing tool registry');
      
      // Load configuration
      await this.loadConfiguration();
      
      // Discover and load tools
      await this.discoverTools();
      
      // Setup hot reloading if enabled
      if (this.options.enableHotReload) {
        await this.setupHotReload();
      }
      
      // Generate documentation if enabled
      if (this.options.generateDocs) {
        await this.generateDocumentation();
      }
      
      this.log('Tool registry initialized successfully', {
        totalTools: this.stats.totalTools,
        enabledTools: this.stats.enabledTools
      });
      
      this.emit('initialized', { stats: this.stats });
      
    } catch (error) {
      this.log('Failed to initialize tool registry', { error: error.message });
      throw error;
    }
  }

  /**
   * Register a new tool
   * @param {Object} toolDefinition - Tool definition object
   * @returns {Promise<boolean>} Registration success
   */
  async registerTool(toolDefinition) {
    try {
      // Validate tool definition
      const validation = await this.validateTool(toolDefinition);
      if (!validation.isValid) {
        throw new Error(`Tool validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if tool already exists
      if (this.tools.has(toolDefinition.name)) {
        throw new Error(`Tool already registered: ${toolDefinition.name}`);
      }

      // Add metadata
      const enrichedTool = {
        ...toolDefinition,
        registeredAt: new Date().toISOString(),
        version: toolDefinition.version || '1.0.0',
        enabled: toolDefinition.enabled !== false,
        category: toolDefinition.category || 'general',
        metrics: {
          callCount: 0,
          errorCount: 0,
          avgExecutionTime: 0,
          lastCalled: null
        }
      };

      // Register tool
      this.tools.set(toolDefinition.name, enrichedTool);
      
      // Update category tracking
      this.updateCategoryTracking(enrichedTool);
      
      // Initialize metrics tracking
      if (this.options.enableMetrics) {
        this.toolMetrics.set(toolDefinition.name, {
          callCount: 0,
          errorCount: 0,
          totalExecutionTime: 0,
          avgExecutionTime: 0,
          lastCalled: null,
          errors: []
        });
      }
      
      // Update stats
      this.updateStats();
      
      this.log('Tool registered successfully', { 
        name: toolDefinition.name,
        category: enrichedTool.category,
        version: enrichedTool.version
      });
      
      this.emit('toolRegistered', { tool: enrichedTool });
      
      return true;
      
    } catch (error) {
      this.log('Failed to register tool', { 
        toolName: toolDefinition?.name || 'unknown',
        error: error.message 
      });
      
      this.emit('toolRegistrationError', { tool: toolDefinition, error });
      return false;
    }
  }

  /**
   * Unregister a tool
   * @param {string} toolName - Name of tool to unregister
   * @returns {boolean} Unregistration success
   */
  unregisterTool(toolName) {
    try {
      const tool = this.tools.get(toolName);
      if (!tool) {
        return false;
      }

      // Remove from registry
      this.tools.delete(toolName);
      this.toolMetrics.delete(toolName);
      
      // Update category tracking
      this.removeCategoryTracking(tool);
      
      // Update stats
      this.updateStats();
      
      this.log('Tool unregistered', { name: toolName });
      this.emit('toolUnregistered', { tool });
      
      return true;
      
    } catch (error) {
      this.log('Failed to unregister tool', { toolName, error: error.message });
      return false;
    }
  }

  /**
   * Get a tool by name
   * @param {string} toolName - Name of the tool
   * @returns {Object|null} Tool definition or null if not found
   */
  getTool(toolName) {
    return this.tools.get(toolName) || null;
  }

  /**
   * List all tools with optional filtering
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of tool definitions
   */
  listTools(filters = {}) {
    let toolList = Array.from(this.tools.values());
    
    // Apply filters
    if (filters.category) {
      toolList = toolList.filter(tool => tool.category === filters.category);
    }
    
    if (filters.enabled !== undefined) {
      toolList = toolList.filter(tool => tool.enabled === filters.enabled);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      toolList = toolList.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.version) {
      toolList = toolList.filter(tool => tool.version === filters.version);
    }
    
    // Sort by name by default
    toolList.sort((a, b) => a.name.localeCompare(b.name));
    
    return toolList;
  }

  /**
   * Discover tools from the tools directory
   * @returns {Promise<void>}
   */
  async discoverTools() {
    try {
      this.log('Discovering tools', { toolsPath: this.options.toolsPath });
      
      if (!existsSync(this.options.toolsPath)) {
        this.log('Tools directory does not exist', { path: this.options.toolsPath });
        return;
      }

      await this.scanDirectory(this.options.toolsPath);
      
      this.stats.lastScan = new Date().toISOString();
      
      this.log('Tool discovery completed', {
        toolsFound: this.stats.totalTools,
        enabledTools: this.stats.enabledTools
      });
      
    } catch (error) {
      this.log('Tool discovery failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Scan directory for tool files
   * @param {string} directory - Directory to scan
   * @returns {Promise<void>}
   */
  async scanDirectory(directory) {
    try {
      const entries = await readdir(directory);
      
      for (const entry of entries) {
        const fullPath = join(directory, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanDirectory(fullPath);
        } else if (stats.isFile() && this.isToolFile(entry)) {
          await this.loadToolFromFile(fullPath);
        }
      }
      
    } catch (error) {
      this.log('Directory scan failed', { directory, error: error.message });
    }
  }

  /**
   * Check if file is a potential tool file
   * @param {string} filename - File name to check
   * @returns {boolean} Whether file could contain tools
   */
  isToolFile(filename) {
    const ext = extname(filename);
    return ext === '.js' && !filename.startsWith('.') && !filename.includes('.test.');
  }

  /**
   * Load tool from file
   * @param {string} filePath - Path to tool file
   * @returns {Promise<void>}
   */
  async loadToolFromFile(filePath) {
    try {
      this.log('Loading tool from file', { filePath });
      
      // Convert to file URL for import
      const fileUrl = pathToFileURL(filePath).href;
      
      // Dynamic import
      const module = await import(fileUrl);
      
      // Store module reference for hot reloading
      this.loadedModules.set(filePath, module);
      
      // Extract tool definitions from module
      const tools = this.extractToolsFromModule(module);
      
      // Register each tool
      for (const tool of tools) {
        await this.registerTool({
          ...tool,
          filePath,
          moduleUrl: fileUrl
        });
      }
      
    } catch (error) {
      this.stats.loadErrors++;
      this.log('Failed to load tool from file', { 
        filePath, 
        error: error.message 
      });
      
      this.emit('toolLoadError', { filePath, error });
    }
  }

  /**
   * Extract tool definitions from imported module
   * @param {Object} module - Imported module
   * @returns {Array} Array of tool definitions
   */
  extractToolsFromModule(module) {
    const tools = [];
    
    // Look for exported tool objects
    Object.values(module).forEach(exportedValue => {
      if (this.isValidToolDefinition(exportedValue)) {
        tools.push(exportedValue);
      }
    });
    
    return tools;
  }

  /**
   * Check if object is a valid tool definition
   * @param {any} obj - Object to check
   * @returns {boolean} Whether object is a valid tool definition
   */
  isValidToolDefinition(obj) {
    return obj &&
           typeof obj === 'object' &&
           typeof obj.name === 'string' &&
           typeof obj.description === 'string' &&
           typeof obj.execute === 'function';
  }

  /**
   * Validate tool definition
   * @param {Object} tool - Tool to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateTool(tool) {
    const errors = [];
    
    // Required fields
    if (!tool.name || typeof tool.name !== 'string') {
      errors.push('Tool must have a valid name');
    }
    
    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool must have a valid description');
    }
    
    if (!tool.execute || typeof tool.execute !== 'function') {
      errors.push('Tool must have an execute function');
    }
    
    // Name format validation
    if (tool.name && !/^[a-zA-Z0-9_-]+$/.test(tool.name)) {
      errors.push('Tool name must contain only alphanumeric characters, underscores, and hyphens');
    }
    
    // Input schema validation
    if (tool.inputSchema && typeof tool.inputSchema !== 'object') {
      errors.push('Tool inputSchema must be an object');
    }
    
    // Version validation
    if (tool.version && typeof tool.version !== 'string') {
      errors.push('Tool version must be a string');
    }
    
    // Category validation
    if (tool.category && typeof tool.category !== 'string') {
      errors.push('Tool category must be a string');
    }
    
    // Function validation
    if (tool.validate && typeof tool.validate !== 'function') {
      errors.push('Tool validate property must be a function');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Setup hot reloading for tool files
   * @returns {Promise<void>}
   */
  async setupHotReload() {
    try {
      const { watch } = await import('fs');
      
      const watcher = watch(this.options.toolsPath, { 
        recursive: true 
      }, (eventType, filename) => {
        if (filename && this.isToolFile(filename)) {
          this.handleFileChange(eventType, join(this.options.toolsPath, filename));
        }
      });
      
      this.watchers.set(this.options.toolsPath, watcher);
      
      this.log('Hot reload setup completed', { toolsPath: this.options.toolsPath });
      
    } catch (error) {
      this.log('Failed to setup hot reload', { error: error.message });
    }
  }

  /**
   * Handle file change for hot reloading
   * @param {string} eventType - Type of file event
   * @param {string} filePath - Path to changed file
   */
  async handleFileChange(eventType, filePath) {
    try {
      this.log('File change detected', { eventType, filePath });
      
      if (eventType === 'change' || eventType === 'rename') {
        // Remove existing tools from this file
        const toolsToRemove = Array.from(this.tools.values())
          .filter(tool => tool.filePath === filePath);
        
        toolsToRemove.forEach(tool => {
          this.unregisterTool(tool.name);
        });
        
        // Reload tools from file if it still exists
        if (existsSync(filePath)) {
          await this.loadToolFromFile(filePath);
        }
        
        this.emit('toolsReloaded', { filePath, eventType });
      }
      
    } catch (error) {
      this.log('Failed to handle file change', { filePath, error: error.message });
    }
  }

  /**
   * Update category tracking
   * @param {Object} tool - Tool to track
   */
  updateCategoryTracking(tool) {
    const category = tool.category || 'general';
    
    if (!this.toolCategories.has(category)) {
      this.toolCategories.set(category, {
        name: category,
        tools: [],
        count: 0
      });
    }
    
    const categoryInfo = this.toolCategories.get(category);
    categoryInfo.tools.push(tool.name);
    categoryInfo.count = categoryInfo.tools.length;
  }

  /**
   * Remove tool from category tracking
   * @param {Object} tool - Tool to remove
   */
  removeCategoryTracking(tool) {
    const category = tool.category || 'general';
    const categoryInfo = this.toolCategories.get(category);
    
    if (categoryInfo) {
      categoryInfo.tools = categoryInfo.tools.filter(name => name !== tool.name);
      categoryInfo.count = categoryInfo.tools.length;
      
      if (categoryInfo.count === 0) {
        this.toolCategories.delete(category);
      }
    }
  }

  /**
   * Update registry statistics
   */
  updateStats() {
    const tools = Array.from(this.tools.values());
    
    this.stats.totalTools = tools.length;
    this.stats.enabledTools = tools.filter(tool => tool.enabled).length;
    this.stats.disabledTools = tools.filter(tool => !tool.enabled).length;
  }

  /**
   * Get registry statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    return {
      ...this.stats,
      categories: Array.from(this.toolCategories.values()),
      toolsPath: this.options.toolsPath,
      hotReloadEnabled: this.options.enableHotReload,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Enable or disable a tool
   * @param {string} toolName - Name of the tool
   * @param {boolean} enabled - Enable or disable
   * @returns {boolean} Success
   */
  setToolEnabled(toolName, enabled) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }
    
    tool.enabled = enabled;
    this.updateStats();
    
    this.log('Tool enabled state changed', { toolName, enabled });
    this.emit('toolEnabledChanged', { tool, enabled });
    
    return true;
  }

  /**
   * Generate documentation for all tools
   * @returns {Promise<void>}
   */
  async generateDocumentation() {
    try {
      this.log('Generating tool documentation');
      
      const tools = this.listTools();
      const documentation = this.buildDocumentation(tools);
      
      // Save documentation
      const docsPath = join(this.options.toolsPath, 'TOOLS.md');
      await writeFile(docsPath, documentation);
      
      // Generate JSON schema
      const schema = this.generateOpenAPISchema(tools);
      const schemaPath = join(this.options.toolsPath, 'tools-schema.json');
      await writeFile(schemaPath, JSON.stringify(schema, null, 2));
      
      this.log('Documentation generated', { docsPath, schemaPath });
      this.emit('documentationGenerated', { docsPath, schemaPath });
      
    } catch (error) {
      this.log('Failed to generate documentation', { error: error.message });
    }
  }

  /**
   * Build markdown documentation
   * @param {Array} tools - Tools to document
   * @returns {string} Markdown documentation
   */
  buildDocumentation(tools) {
    let docs = `# Super Agents MCP Tools\n\n`;
    docs += `Generated: ${new Date().toISOString()}\n`;
    docs += `Total Tools: ${tools.length}\n\n`;
    
    // Group by category
    const categories = new Map();
    tools.forEach(tool => {
      const category = tool.category || 'general';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(tool);
    });
    
    // Generate documentation for each category
    Array.from(categories.entries()).forEach(([categoryName, categoryTools]) => {
      docs += `## ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Tools\n\n`;
      
      categoryTools.forEach(tool => {
        docs += `### ${tool.name}\n\n`;
        docs += `**Description:** ${tool.description}\n\n`;
        docs += `**Version:** ${tool.version || '1.0.0'}\n\n`;
        docs += `**Status:** ${tool.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n`;
        
        if (tool.inputSchema) {
          docs += `**Input Schema:**\n`;
          docs += `\`\`\`json\n${JSON.stringify(tool.inputSchema, null, 2)}\n\`\`\`\n\n`;
        }
        
        docs += `---\n\n`;
      });
    });
    
    return docs;
  }

  /**
   * Generate OpenAPI schema for tools
   * @param {Array} tools - Tools to generate schema for
   * @returns {Object} OpenAPI schema
   */
  generateOpenAPISchema(tools) {
    const schema = {
      openapi: '3.0.0',
      info: {
        title: 'Super Agents MCP Tools',
        version: '1.0.0',
        description: 'MCP tools for Super Agents framework'
      },
      paths: {},
      components: {
        schemas: {}
      }
    };
    
    tools.forEach(tool => {
      if (tool.inputSchema) {
        schema.components.schemas[`${tool.name}Input`] = tool.inputSchema;
      }
      
      schema.paths[`/tools/${tool.name}`] = {
        post: {
          summary: tool.description,
          operationId: tool.name,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${tool.name}Input`
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Tool execution result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      content: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      metadata: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
    });
    
    return schema;
  }

  /**
   * Load configuration from file
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
      }
    } catch (error) {
      this.log('Failed to load configuration', { error: error.message });
    }
  }

  /**
   * Save configuration to file
   * @returns {Promise<void>}
   */
  async saveConfiguration() {
    try {
      const config = {
        enableHotReload: this.options.enableHotReload,
        enableCaching: this.options.enableCaching,
        validateOnLoad: this.options.validateOnLoad,
        generateDocs: this.options.generateDocs,
        maxTools: this.options.maxTools,
        toolTimeout: this.options.toolTimeout,
        enableMetrics: this.options.enableMetrics
      };
      
      await writeFile(this.options.configPath, JSON.stringify(config, null, 2));
      
      this.log('Configuration saved', { configPath: this.options.configPath });
      
    } catch (error) {
      this.log('Failed to save configuration', { error: error.message });
    }
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      // Close file watchers
      for (const [path, watcher] of this.watchers) {
        watcher.close();
      }
      this.watchers.clear();
      
      // Clear caches
      this.cache.clear();
      this.loadedModules.clear();
      
      this.log('Tool registry cleanup completed');
      
    } catch (error) {
      this.log('Cleanup failed', { error: error.message });
    }
  }

  /**
   * Logging utility
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(message, data = {}) {
    if (!this.options.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: 'ToolRegistry',
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    console.log(`[ToolRegistry] ${message}`, data);
  }
}