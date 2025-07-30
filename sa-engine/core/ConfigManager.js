import fs from 'fs/promises';
import path from 'path';
import { Logger } from './Logger.js';

export class ConfigManager {
  constructor(options = {}) {
    this.logger = new Logger('ConfigManager');
    this.configPath = options.configPath || path.join(process.cwd(), 'sa-config.json');
    this.envPrefix = options.envPrefix || 'SA_';
    this.config = {};
    this.defaultConfig = this.getDefaultConfig();
    this.validationRules = this.getValidationRules();
  }

  getDefaultConfig() {
    return {
      // Core settings
      projectRoot: process.cwd(),
      logLevel: 'info',
      maxRetries: 3,
      timeout: 30000,
      
      // API Configuration
      apis: {
        anthropic: {
          model: 'claude-3-sonnet-20240229',
          maxTokens: 4000,
          temperature: 0.7
        },
        openai: {
          model: 'gpt-4',
          maxTokens: 4000,
          temperature: 0.7
        }
      },
      
      // MCP Server settings
      mcpServer: {
        port: 3000,
        host: 'localhost',
        enableWebSocket: true,
        requestTimeout: 30000
      },
      
      // Agent settings
      agents: {
        enabledAgents: ['analyst', 'architect', 'developer', 'pm', 'qa'],
        defaultAgent: 'developer',
        agentTimeout: 60000
      },
      
      // Task management
      taskManagement: {
        maxTaskDepth: 5,
        autoSave: true,
        saveInterval: 30000,
        backupCount: 5
      },
      
      // Performance settings
      performance: {
        enableMetrics: true,
        maxConcurrentTasks: 10,
        cacheEnabled: true,
        cacheTTL: 300000 // 5 minutes
      },
      
      // Security settings
      security: {
        validateApiKeys: true,
        sanitizeInputs: true,
        enableRateLimit: true,
        rateLimitWindow: 60000,
        rateLimitMax: 100
      },
      
      // Development settings
      development: {
        enableDebugMode: false,
        mockApiCalls: false,
        verboseLogging: false
      }
    };
  }

  getValidationRules() {
    return {
      projectRoot: {
        required: true,
        type: 'string',
        validate: async (value) => {
          try {
            const stats = await fs.stat(value);
            return stats.isDirectory();
          } catch {
            return false;
          }
        },
        message: 'Project root must be a valid directory path'
      },
      
      logLevel: {
        required: true,
        type: 'string',
        enum: ['error', 'warn', 'info', 'debug'],
        message: 'Log level must be one of: error, warn, info, debug'
      },
      
      maxRetries: {
        required: true,
        type: 'number',
        min: 0,
        max: 10,
        message: 'Max retries must be between 0 and 10'
      },
      
      timeout: {
        required: true,
        type: 'number',
        min: 1000,
        max: 300000,
        message: 'Timeout must be between 1000ms and 300000ms'
      },
      
      'apis.anthropic.model': {
        type: 'string',
        enum: ['claude-3-sonnet-20240229', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
        message: 'Invalid Anthropic model specified'
      },
      
      'apis.openai.model': {
        type: 'string',
        enum: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        message: 'Invalid OpenAI model specified'
      },
      
      'mcpServer.port': {
        type: 'number',
        min: 1000,
        max: 65535,
        message: 'MCP server port must be between 1000 and 65535'
      },
      
      'taskManagement.maxTaskDepth': {
        type: 'number',
        min: 1,
        max: 10,
        message: 'Max task depth must be between 1 and 10'
      },
      
      'performance.maxConcurrentTasks': {
        type: 'number',
        min: 1,
        max: 50,
        message: 'Max concurrent tasks must be between 1 and 50'
      }
    };
  }

  async loadConfig() {
    try {
      // Start with default configuration
      this.config = { ...this.defaultConfig };
      
      // Load from file if exists
      try {
        const configFile = await fs.readFile(this.configPath, 'utf8');
        const fileConfig = JSON.parse(configFile);
        this.config = this.mergeConfigs(this.config, fileConfig);
        this.logger.info('Configuration loaded from file', { configPath: this.configPath });
      } catch (fileError) {
        if (fileError.code !== 'ENOENT') {
          this.logger.warn('Failed to load config file, using defaults', { error: fileError.message });
        }
      }
      
      // Override with environment variables
      this.loadEnvironmentConfig();
      
      // Validate the final configuration
      const validation = await this.validateConfig();
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
      
      this.logger.info('Configuration loaded and validated successfully');
      return this.config;
      
    } catch (error) {
      this.logger.error('Failed to load configuration', { error: error.message });
      throw error;
    }
  }

  async saveConfig(config = null) {
    try {
      const configToSave = config || this.config;
      
      // Validate before saving
      const validation = await this.validateConfig(configToSave);
      if (!validation.isValid) {
        throw new Error(`Cannot save invalid configuration: ${validation.errors.join(', ')}`);
      }
      
      // Create backup of existing config
      await this.createConfigBackup();
      
      // Save new configuration
      await fs.writeFile(this.configPath, JSON.stringify(configToSave, null, 2));
      
      this.config = configToSave;
      this.logger.info('Configuration saved successfully', { configPath: this.configPath });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to save configuration', { error: error.message });
      throw error;
    }
  }

  async createConfigBackup() {
    try {
      const stats = await fs.stat(this.configPath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = this.configPath.replace('.json', `-backup-${timestamp}.json`);
      
      await fs.copyFile(this.configPath, backupPath);
      this.logger.debug('Configuration backup created', { backupPath });
      
      // Clean up old backups
      await this.cleanupOldBackups();
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.warn('Failed to create config backup', { error: error.message });
      }
    }
  }

  async cleanupOldBackups() {
    try {
      const configDir = path.dirname(this.configPath);
      const configName = path.basename(this.configPath, '.json');
      const files = await fs.readdir(configDir);
      
      const backupFiles = files
        .filter(file => file.startsWith(`${configName}-backup-`) && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(configDir, file)
        }));
      
      if (backupFiles.length > this.config.taskManagement?.backupCount || 5) {
        // Sort by creation time and remove oldest
        const fileStats = await Promise.all(
          backupFiles.map(async file => ({
            ...file,
            stats: await fs.stat(file.path)
          }))
        );
        
        fileStats.sort((a, b) => a.stats.mtime - b.stats.mtime);
        
        const maxBackups = this.config.taskManagement?.backupCount || 5;
        const filesToDelete = fileStats.slice(0, fileStats.length - maxBackups);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          this.logger.debug('Deleted old config backup', { file: file.name });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to cleanup old config backups', { error: error.message });
    }
  }

  loadEnvironmentConfig() {
    const envConfig = {};
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(this.envPrefix)) {
        const configKey = key.substring(this.envPrefix.length).toLowerCase();
        const configPath = this.envKeyToConfigPath(configKey);
        
        if (configPath) {
          this.setNestedValue(envConfig, configPath, this.parseEnvValue(value));
        }
      }
    }
    
    if (Object.keys(envConfig).length > 0) {
      this.config = this.mergeConfigs(this.config, envConfig);
      this.logger.debug('Environment configuration applied', { envConfig });
    }
  }

  envKeyToConfigPath(envKey) {
    const keyMappings = {
      'log_level': 'logLevel',
      'max_retries': 'maxRetries',
      'anthropic_api_key': 'apis.anthropic.apiKey',
      'openai_api_key': 'apis.openai.apiKey',
      'anthropic_model': 'apis.anthropic.model',
      'openai_model': 'apis.openai.model',
      'mcp_port': 'mcpServer.port',
      'mcp_host': 'mcpServer.host',
      'project_root': 'projectRoot',
      'timeout': 'timeout',
      'debug_mode': 'development.enableDebugMode',
      'mock_api': 'development.mockApiCalls'
    };
    
    return keyMappings[envKey] || null;
  }

  parseEnvValue(value) {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // Handle boolean strings
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      
      // Handle numeric strings
      if (!isNaN(value) && !isNaN(parseFloat(value))) {
        return parseFloat(value);
      }
      
      // Return as string
      return value;
    }
  }

  mergeConfigs(target, source) {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.mergeConfigs(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  async validateConfig(config = null) {
    const configToValidate = config || this.config;
    const errors = [];
    
    for (const [rulePath, rule] of Object.entries(this.validationRules)) {
      const value = this.getNestedValue(configToValidate, rulePath);
      
      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${rulePath} is required`);
        continue;
      }
      
      // Skip validation if value is undefined and not required
      if (value === undefined) continue;
      
      // Type validation
      if (rule.type && typeof value !== rule.type) {
        errors.push(`${rulePath} must be of type ${rule.type}, got ${typeof value}`);
        continue;
      }
      
      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${rulePath} must be one of: ${rule.enum.join(', ')}`);
        continue;
      }
      
      // Numeric range validation
      if (rule.type === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rulePath} must be at least ${rule.min}`);
          continue;
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rulePath} must be at most ${rule.max}`);
          continue;
        }
      }
      
      // Custom validation function
      if (rule.validate) {
        try {
          const isValid = await rule.validate(value);
          if (!isValid) {
            errors.push(rule.message || `${rulePath} failed custom validation`);
          }
        } catch (error) {
          errors.push(`${rulePath} validation error: ${error.message}`);
        }
      }
    }
    
    // Validate API keys if required
    await this.validateApiKeys(configToValidate, errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateApiKeys(config, errors) {
    if (!config.security?.validateApiKeys) return;
    
    // Check Anthropic API key
    if (config.apis?.anthropic?.apiKey) {
      const anthropicValid = await this.testApiKey('anthropic', config.apis.anthropic.apiKey);
      if (!anthropicValid) {
        errors.push('Invalid or expired Anthropic API key');
      }
    }
    
    // Check OpenAI API key
    if (config.apis?.openai?.apiKey) {
      const openaiValid = await this.testApiKey('openai', config.apis.openai.apiKey);
      if (!openaiValid) {
        errors.push('Invalid or expired OpenAI API key');
      }
    }
  }

  async testApiKey(provider, apiKey) {
    try {
      // Simple API key format validation
      if (provider === 'anthropic') {
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
      } else if (provider === 'openai') {
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      }
      return false;
    } catch (error) {
      this.logger.warn(`Failed to validate ${provider} API key`, { error: error.message });
      return false;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  get(path) {
    return this.getNestedValue(this.config, path);
  }

  set(path, value) {
    this.setNestedValue(this.config, path, value);
    this.logger.debug('Configuration value updated', { path, value });
  }

  has(path) {
    return this.getNestedValue(this.config, path) !== undefined;
  }

  getApiConfig(provider) {
    return this.config.apis?.[provider] || {};
  }

  getAgentConfig(agentName = null) {
    if (agentName) {
      return this.config.agents?.[agentName] || {};
    }
    return this.config.agents || {};
  }

  getMCPConfig() {
    return this.config.mcpServer || {};
  }

  isDebugMode() {
    return this.config.development?.enableDebugMode || false;
  }

  isMockMode() {
    return this.config.development?.mockApiCalls || false;
  }

  async reset() {
    this.config = { ...this.defaultConfig };
    await this.saveConfig();
    this.logger.info('Configuration reset to defaults');
  }

  async generateConfigTemplate() {
    const template = {
      ...this.defaultConfig,
      // Add comments and examples
      _comments: {
        apis: 'Configure your AI provider API keys and models',
        mcpServer: 'MCP server configuration for IDE integration',
        agents: 'Agent behavior and capabilities settings',
        taskManagement: 'Task handling and persistence settings',
        performance: 'Performance optimization settings',
        security: 'Security and validation settings'
      }
    };
    
    const templatePath = path.join(path.dirname(this.configPath), 'sa-config.template.json');
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
    
    this.logger.info('Configuration template generated', { templatePath });
    return templatePath;
  }

  getHealth() {
    const validation = this.validateConfig();
    return {
      configValid: validation.isValid,
      configPath: this.configPath,
      loadedAt: this.loadedAt,
      hasApiKeys: !!(this.config.apis?.anthropic?.apiKey || this.config.apis?.openai?.apiKey),
      debugMode: this.isDebugMode(),
      mockMode: this.isMockMode()
    };
  }
}