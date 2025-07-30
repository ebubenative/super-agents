import { EventEmitter } from 'events';

/**
 * BaseAIProvider - Abstract base class for all AI providers in Super Agents
 * Provides standardized interface and common functionality for AI service integration
 */
export default class BaseAIProvider extends EventEmitter {
  constructor(options = {}) {
    super();
    
    if (this.constructor === BaseAIProvider) {
      throw new Error('BaseAIProvider cannot be instantiated directly');
    }

    this.options = {
      name: options.name || this.constructor.name,
      version: options.version || '1.0.0',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false,
      defaultModel: options.defaultModel || null,
      supportedRoles: options.supportedRoles || ['main', 'research', 'fallback'],
      ...options
    };

    this.name = this.options.name;
    this.version = this.options.version;
    this.isConnected = false;
    this.lastError = null;
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalTokensUsed: 0,
      avgResponseTime: 0,
      lastUsed: null,
      successRate: 0
    };

    // Model configurations for different roles
    this.modelConfigs = new Map();
    this.rateLimits = new Map();
    this.client = null;
  }

  /**
   * Initialize the AI provider
   * Must be implemented by subclasses
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Test connection to the AI service
   * @returns {Promise<boolean>} Connection test result
   */
  async testConnection() {
    try {
      this.emit('connectionTesting');
      
      const testMessage = 'Hello, this is a connection test. Please respond with "OK".';
      const response = await this.generateText({
        messages: [{ role: 'user', content: testMessage }],
        maxTokens: 10,
        temperature: 0
      });

      this.isConnected = !!response?.text;
      this.emit('connectionTested', { success: this.isConnected });
      
      return this.isConnected;

    } catch (error) {
      this.isConnected = false;
      this.lastError = error;
      this.emit('connectionError', { error });
      return false;
    }
  }

  /**
   * Generate text using the AI provider
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generated text response
   */
  async generateText(params = {}) {
    const startTime = Date.now();
    
    try {
      this.validateTextParams(params);
      this.emit('textGenerationStarting', params);

      // Apply role-based model selection
      const enhancedParams = this.applyRoleConfig(params);
      
      // Track metrics
      this.metrics.requestCount++;
      
      // Perform generation with retry logic
      const result = await this.withRetry(() => this._generateText(enhancedParams));
      
      // Process and enrich result
      const enrichedResult = this.enrichResult(result, startTime);
      
      // Update metrics
      this.updateMetrics(startTime, true);
      this.emit('textGenerationCompleted', { params, result: enrichedResult });
      
      return enrichedResult;

    } catch (error) {
      this.metrics.errorCount++;
      this.lastError = error;
      this.updateMetrics(startTime, false);
      this.emit('textGenerationError', { params, error });
      throw error;
    }
  }

  /**
   * Generate structured object using the AI provider
   * @param {Object} params - Generation parameters with schema
   * @returns {Promise<Object>} Generated object response
   */
  async generateObject(params = {}) {
    const startTime = Date.now();
    
    try {
      this.validateObjectParams(params);
      this.emit('objectGenerationStarting', params);

      // Apply role-based model selection
      const enhancedParams = this.applyRoleConfig(params);
      
      // Track metrics
      this.metrics.requestCount++;
      
      // Perform generation with retry logic
      const result = await this.withRetry(() => this._generateObject(enhancedParams));
      
      // Process and enrich result
      const enrichedResult = this.enrichResult(result, startTime);
      
      // Update metrics
      this.updateMetrics(startTime, true);
      this.emit('objectGenerationCompleted', { params, result: enrichedResult });
      
      return enrichedResult;

    } catch (error) {
      this.metrics.errorCount++;
      this.lastError = error;
      this.updateMetrics(startTime, false);
      this.emit('objectGenerationError', { params, error });
      throw error;
    }
  }

  /**
   * Stream text generation (for real-time responses)
   * @param {Object} params - Generation parameters
   * @returns {Promise<AsyncIterable>} Text stream
   */
  async streamText(params = {}) {
    try {
      this.validateTextParams(params);
      this.emit('textStreamStarting', params);

      // Apply role-based model selection
      const enhancedParams = this.applyRoleConfig(params);
      
      // Track metrics
      this.metrics.requestCount++;
      
      const stream = await this._streamText(enhancedParams);
      this.emit('textStreamStarted', { params });
      
      return stream;

    } catch (error) {
      this.metrics.errorCount++;
      this.lastError = error;
      this.emit('textStreamError', { params, error });
      throw error;
    }
  }

  /**
   * Configure model for specific role
   * @param {string} role - Role name (main, research, fallback)
   * @param {Object} config - Model configuration
   */
  configureRole(role, config) {
    if (!this.options.supportedRoles.includes(role)) {
      throw new Error(`Unsupported role: ${role}`);
    }

    this.modelConfigs.set(role, {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      ...config
    });

    this.emit('roleConfigured', { role, config });
  }

  /**
   * Get model configuration for role
   * @param {string} role - Role name
   * @returns {Object} Model configuration
   */
  getRoleConfig(role) {
    return this.modelConfigs.get(role) || this.getDefaultConfig();
  }

  /**
   * Apply role-based configuration to parameters
   * @param {Object} params - Original parameters
   * @returns {Object} Enhanced parameters
   */
  applyRoleConfig(params) {
    const role = params.role || 'main';
    const roleConfig = this.getRoleConfig(role);
    
    return {
      ...roleConfig,
      ...params,
      model: params.model || roleConfig.model || this.options.defaultModel
    };
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} Function result
   */
  async withRetry(fn) {
    let lastError;
    
    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.options.maxRetries - 1) {
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          this.emit('retryAttempt', { attempt: attempt + 1, delay, error });
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate text generation parameters
   * @param {Object} params - Parameters to validate
   */
  validateTextParams(params) {
    if (!params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
      throw new Error('Messages array is required and must not be empty');
    }

    for (const message of params.messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content');
      }
    }

    this.validateCommonParams(params);
  }

  /**
   * Validate object generation parameters
   * @param {Object} params - Parameters to validate
   */
  validateObjectParams(params) {
    this.validateTextParams(params);
    
    if (!params.schema) {
      throw new Error('Schema is required for object generation');
    }
  }

  /**
   * Validate common parameters
   * @param {Object} params - Parameters to validate
   */
  validateCommonParams(params) {
    if (params.temperature !== undefined) {
      if (typeof params.temperature !== 'number' || params.temperature < 0 || params.temperature > 2) {
        throw new Error('Temperature must be a number between 0 and 2');
      }
    }

    if (params.maxTokens !== undefined) {
      if (typeof params.maxTokens !== 'number' || params.maxTokens <= 0) {
        throw new Error('maxTokens must be a positive number');
      }
    }

    if (params.topP !== undefined) {
      if (typeof params.topP !== 'number' || params.topP <= 0 || params.topP > 1) {
        throw new Error('topP must be a number between 0 and 1');
      }
    }
  }

  /**
   * Enrich result with metadata and timing
   * @param {Object} result - Original result
   * @param {number} startTime - Request start time
   * @returns {Object} Enriched result
   */
  enrichResult(result, startTime) {
    const responseTime = Date.now() - startTime;
    
    return {
      ...result,
      provider: this.name,
      model: result.model || 'unknown',
      responseTime,
      timestamp: new Date().toISOString(),
      tokenUsage: result.usage || result.tokenUsage || null
    };
  }

  /**
   * Update provider metrics
   * @param {number} startTime - Request start time
   * @param {boolean} success - Request success status
   */
  updateMetrics(startTime, _success) {
    const responseTime = Date.now() - startTime;
    
    // Update average response time
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + responseTime) /
      this.metrics.requestCount
    );
    
    // Update success rate
    const successCount = this.metrics.requestCount - this.metrics.errorCount;
    this.metrics.successRate = successCount / this.metrics.requestCount;
    
    this.metrics.lastUsed = new Date().toISOString();
    
    if (this.options.enableMetrics) {
      this.emit('metricsUpdated', { metrics: this.metrics });
    }
  }

  /**
   * Get provider capabilities
   * @returns {Object} Provider capabilities
   */
  getCapabilities() {
    return {
      textGeneration: true,
      objectGeneration: false,
      streaming: false,
      imageGeneration: false,
      imageAnalysis: false,
      functionCalling: false,
      supportedRoles: this.options.supportedRoles,
      maxTokens: this.getMaxTokens(),
      supportedFormats: ['text'],
      rateLimits: this.getRateLimits()
    };
  }

  /**
   * Get provider status and health information
   * @returns {Object} Provider status
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      isConnected: this.isConnected,
      lastError: this.lastError?.message || null,
      metrics: this.metrics,
      capabilities: this.getCapabilities(),
      modelConfigs: Object.fromEntries(this.modelConfigs),
      options: {
        timeout: this.options.timeout,
        maxRetries: this.options.maxRetries,
        defaultModel: this.options.defaultModel
      }
    };
  }

  /**
   * Get available models for this provider
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    // Override in subclasses to provide actual model list
    return [this.options.defaultModel].filter(Boolean);
  }

  /**
   * Get maximum tokens supported by provider
   * @returns {number} Maximum tokens
   */
  getMaxTokens() {
    return 4096; // Override in subclasses
  }

  /**
   * Get rate limits for provider
   * @returns {Object} Rate limit information
   */
  getRateLimits() {
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 60000,
      requestsPerDay: 1000
    };
  }

  /**
   * Get default configuration
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    };
  }

  /**
   * Check if API key is required
   * @returns {boolean} True if API key is required
   */
  requiresApiKey() {
    return true;
  }

  /**
   * Get required environment variable name for API key
   * @returns {string} Environment variable name
   */
  getApiKeyEnvVar() {
    return `${this.name.toUpperCase()}_API_KEY`;
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log utility function
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} level - Log level
   */
  log(message, data = {}, level = 'info') {
    if (!this.options.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      provider: this.name,
      level,
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      console.error(`[${this.name}] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[${this.name}] WARN: ${message}`, data);
    } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
      console.debug(`[${this.name}] DEBUG: ${message}`, data);
    } else if (level === 'info') {
      console.log(`[${this.name}] INFO: ${message}`, data);
    }
  }

  // Abstract methods to be implemented by subclasses
  
  /**
   * Internal text generation implementation
   * @param {Object} _params - Generation parameters
   * @returns {Promise<Object>} Generation result
   * @abstract
   */
  async _generateText(_params) {
    throw new Error('_generateText() must be implemented by subclass');
  }

  /**
   * Internal object generation implementation
   * @param {Object} _params - Generation parameters
   * @returns {Promise<Object>} Generation result
   * @abstract
   */
  async _generateObject(_params) {
    throw new Error('_generateObject() must be implemented by subclass');
  }

  /**
   * Internal text streaming implementation
   * @param {Object} _params - Generation parameters
   * @returns {Promise<AsyncIterable>} Text stream
   * @abstract
   */
  async _streamText(_params) {
    throw new Error('_streamText() must be implemented by subclass');
  }
}