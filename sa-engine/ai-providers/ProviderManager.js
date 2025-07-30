import { EventEmitter } from 'events';

/**
 * ProviderManager - Manages multiple AI providers with role-based selection
 * Provides intelligent provider selection, failover, and role-based routing
 */
export default class ProviderManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableFallback: options.enableFallback !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      enableMetrics: options.enableMetrics !== false,
      healthCheckInterval: options.healthCheckInterval || 300000, // 5 minutes
      failoverTimeout: options.failoverTimeout || 5000,
      maxConcurrentRequests: options.maxConcurrentRequests || 10,
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.providers = new Map();
    this.roleProviders = new Map();
    this.providerMetrics = new Map();
    this.healthStatus = new Map();
    this.activeRequests = new Map();
    this.healthCheckInterval = null;
    
    this.defaultRoles = {
      main: null,
      research: null,
      fallback: null
    };

    this.log('Provider Manager initialized', { options: this.options });
  }

  /**
   * Register an AI provider
   * @param {BaseAIProvider} provider - Provider instance
   * @param {Object} config - Provider configuration
   * @returns {Promise<boolean>} Registration success
   */
  async registerProvider(provider, config = {}) {
    try {
      const providerName = provider.name;
      
      if (this.providers.has(providerName)) {
        throw new Error(`Provider ${providerName} is already registered`);
      }

      // Initialize provider
      await provider.initialize();
      
      // Setup event forwarding
      this.setupProviderEvents(provider);
      
      // Register provider
      this.providers.set(providerName, provider);
      
      // Initialize metrics
      this.providerMetrics.set(providerName, {
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        successRate: 0,
        lastUsed: null,
        isAvailable: true
      });
      
      // Set initial health status
      this.healthStatus.set(providerName, {
        isHealthy: true,
        lastHealthCheck: new Date().toISOString(),
        consecutiveFailures: 0,
        status: 'healthy'
      });

      // Configure roles if specified
      if (config.roles) {
        for (const [role, roleConfig] of Object.entries(config.roles)) {
          this.configureProviderRole(providerName, role, roleConfig);
        }
      }

      // Set as default role providers if none are set
      this.updateDefaultRoleProviders(providerName, config);

      this.log('Provider registered successfully', { 
        provider: providerName,
        capabilities: provider.getCapabilities()
      });
      
      this.emit('providerRegistered', { provider, config });
      return true;

    } catch (error) {
      this.log('Failed to register provider', { 
        provider: provider?.name || 'unknown',
        error: error.message 
      }, 'error');
      
      this.emit('providerRegistrationError', { provider, error });
      return false;
    }
  }

  /**
   * Configure provider for specific role
   * @param {string} providerName - Provider name
   * @param {string} role - Role name
   * @param {Object} config - Role configuration
   */
  configureProviderRole(providerName, role, config) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Configure role on provider
    provider.configureRole(role, config);
    
    // Set role provider mapping
    if (!this.roleProviders.has(role)) {
      this.roleProviders.set(role, []);
    }
    
    const roleProviders = this.roleProviders.get(role);
    if (!roleProviders.find(rp => rp.provider === providerName)) {
      roleProviders.push({
        provider: providerName,
        priority: config.priority || 1,
        weight: config.weight || 1,
        enabled: config.enabled !== false
      });
      
      // Sort by priority
      roleProviders.sort((a, b) => b.priority - a.priority);
    }

    this.log('Provider role configured', { provider: providerName, role, config });
    this.emit('roleConfigured', { provider: providerName, role, config });
  }

  /**
   * Generate text using role-based provider selection
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generation result
   */
  async generateText(params = {}) {
    const role = params.role || 'main';
    const startTime = Date.now();
    
    try {
      this.emit('textGenerationStarting', { params, role });

      // Select provider for role
      const provider = await this.selectProvider(role, 'textGeneration');
      if (!provider) {
        throw new Error(`No available provider for role: ${role}`);
      }

      // Track active request
      const requestId = this.trackRequest(provider.name, 'generateText');
      
      try {
        // Generate text
        const result = await provider.generateText(params);
        
        // Update metrics
        this.updateProviderMetrics(provider.name, startTime, true);
        
        // Add provider metadata
        const enrichedResult = {
          ...result,
          provider: provider.name,
          role,
          requestId
        };

        this.emit('textGenerationCompleted', { params, result: enrichedResult, provider: provider.name });
        return enrichedResult;

      } finally {
        this.untrackRequest(requestId);
      }

    } catch (error) {
      this.updateProviderMetrics(provider?.name, startTime, false);
      
      // Try fallback if enabled and this wasn't already a fallback attempt
      if (this.options.enableFallback && role !== 'fallback') {
        this.log('Attempting fallback for failed text generation', { originalRole: role, error: error.message });
        
        try {
          return await this.generateText({ ...params, role: 'fallback' });
        } catch (fallbackError) {
          this.log('Fallback also failed', { fallbackError: fallbackError.message }, 'error');
        }
      }

      this.emit('textGenerationError', { params, error, role });
      throw error;
    }
  }

  /**
   * Generate object using role-based provider selection
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generation result
   */
  async generateObject(params = {}) {
    const role = params.role || 'main';
    const startTime = Date.now();
    
    try {
      this.emit('objectGenerationStarting', { params, role });

      // Select provider for role
      const provider = await this.selectProvider(role, 'objectGeneration');
      if (!provider) {
        throw new Error(`No available provider for role: ${role}`);
      }

      // Track active request
      const requestId = this.trackRequest(provider.name, 'generateObject');
      
      try {
        // Generate object
        const result = await provider.generateObject(params);
        
        // Update metrics
        this.updateProviderMetrics(provider.name, startTime, true);
        
        // Add provider metadata
        const enrichedResult = {
          ...result,
          provider: provider.name,
          role,
          requestId
        };

        this.emit('objectGenerationCompleted', { params, result: enrichedResult, provider: provider.name });
        return enrichedResult;

      } finally {
        this.untrackRequest(requestId);
      }

    } catch (error) {
      this.updateProviderMetrics(provider?.name, startTime, false);
      
      // Try fallback if enabled
      if (this.options.enableFallback && role !== 'fallback') {
        this.log('Attempting fallback for failed object generation', { originalRole: role, error: error.message });
        
        try {
          return await this.generateObject({ ...params, role: 'fallback' });
        } catch (fallbackError) {
          this.log('Fallback also failed', { fallbackError: fallbackError.message }, 'error');
        }
      }

      this.emit('objectGenerationError', { params, error, role });
      throw error;
    }
  }

  /**
   * Stream text using role-based provider selection
   * @param {Object} params - Generation parameters
   * @returns {Promise<AsyncIterable>} Text stream
   */
  async streamText(params = {}) {
    const role = params.role || 'main';
    
    try {
      this.emit('textStreamingStarting', { params, role });

      // Select provider for role
      const provider = await this.selectProvider(role, 'streaming');
      if (!provider) {
        throw new Error(`No available provider for role: ${role}`);
      }

      // Track active request
      const requestId = this.trackRequest(provider.name, 'streamText');
      
      // Stream text
      const stream = await provider.streamText(params);
      
      this.emit('textStreamingStarted', { params, provider: provider.name, requestId });
      
      // Wrap stream to handle cleanup
      return this.wrapStream(stream, requestId, provider.name);

    } catch (error) {
      // Try fallback if enabled
      if (this.options.enableFallback && role !== 'fallback') {
        this.log('Attempting fallback for failed text streaming', { originalRole: role, error: error.message });
        
        try {
          return await this.streamText({ ...params, role: 'fallback' });
        } catch (fallbackError) {
          this.log('Fallback also failed', { fallbackError: fallbackError.message }, 'error');
        }
      }

      this.emit('textStreamingError', { params, error, role });
      throw error;
    }
  }

  /**
   * Select best provider for role and capability
   * @param {string} role - Role name
   * @param {string} capability - Required capability
   * @returns {Promise<BaseAIProvider>} Selected provider
   */
  async selectProvider(role, capability) {
    // Get providers for role
    const roleProviders = this.roleProviders.get(role) || [];
    
    // Filter by capability and health
    const availableProviders = [];
    
    for (const roleProvider of roleProviders) {
      if (!roleProvider.enabled) continue;
      
      const provider = this.providers.get(roleProvider.provider);
      if (!provider) continue;
      
      const health = this.healthStatus.get(roleProvider.provider);
      if (!health?.isHealthy) continue;
      
      const capabilities = provider.getCapabilities();
      if (!capabilities[capability]) continue;
      
      availableProviders.push({
        ...roleProvider,
        providerInstance: provider,
        health,
        metrics: this.providerMetrics.get(roleProvider.provider)
      });
    }

    if (availableProviders.length === 0) {
      // Fallback to any available provider if role-specific providers are unavailable
      return this.selectFallbackProvider(capability);
    }

    // Load balancing logic
    if (this.options.enableLoadBalancing && availableProviders.length > 1) {
      return this.selectProviderByLoadBalancing(availableProviders);
    }

    // Return highest priority provider
    return availableProviders[0].providerInstance;
  }

  /**
   * Select fallback provider when role-specific providers are unavailable
   * @param {string} capability - Required capability
   * @returns {BaseAIProvider|null} Fallback provider
   */
  selectFallbackProvider(capability) {
    for (const [providerName, provider] of this.providers) {
      const health = this.healthStatus.get(providerName);
      if (!health?.isHealthy) continue;
      
      const capabilities = provider.getCapabilities();
      if (!capabilities[capability]) continue;
      
      this.log('Using fallback provider', { provider: providerName, capability });
      return provider;
    }
    
    return null;
  }

  /**
   * Select provider using load balancing algorithm
   * @param {Array} availableProviders - Available providers
   * @returns {BaseAIProvider} Selected provider
   */
  selectProviderByLoadBalancing(availableProviders) {
    // Weighted round-robin based on success rate and response time
    let bestProvider = availableProviders[0];
    let bestScore = 0;
    
    for (const providerInfo of availableProviders) {
      const metrics = providerInfo.metrics;
      
      // Calculate score based on success rate and response time
      const successScore = metrics.successRate || 1;
      const timeScore = metrics.avgResponseTime ? 1000 / metrics.avgResponseTime : 1;
      const weightScore = providerInfo.weight || 1;
      
      const totalScore = (successScore * 0.4 + timeScore * 0.3 + weightScore * 0.3);
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestProvider = providerInfo;
      }
    }
    
    return bestProvider.providerInstance;
  }

  /**
   * Track active request
   * @param {string} providerName - Provider name
   * @param {string} operation - Operation type
   * @returns {string} Request ID
   */
  trackRequest(providerName, operation) {
    const requestId = `${providerName}-${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeRequests.set(requestId, {
      provider: providerName,
      operation,
      startTime: Date.now()
    });
    
    return requestId;
  }

  /**
   * Untrack request
   * @param {string} requestId - Request ID
   */
  untrackRequest(requestId) {
    this.activeRequests.delete(requestId);
  }

  /**
   * Update provider metrics
   * @param {string} providerName - Provider name
   * @param {number} startTime - Request start time
   * @param {boolean} success - Request success status
   */
  updateProviderMetrics(providerName, startTime, success) {
    if (!providerName) return;
    
    const metrics = this.providerMetrics.get(providerName);
    if (!metrics) return;
    
    const responseTime = Date.now() - startTime;
    
    metrics.requestCount++;
    if (!success) {
      metrics.errorCount++;
    }
    
    // Update average response time
    metrics.avgResponseTime = (
      (metrics.avgResponseTime * (metrics.requestCount - 1) + responseTime) /
      metrics.requestCount
    );
    
    // Update success rate
    metrics.successRate = (metrics.requestCount - metrics.errorCount) / metrics.requestCount;
    metrics.lastUsed = new Date().toISOString();
    
    this.emit('metricsUpdated', { provider: providerName, metrics });
  }

  /**
   * Wrap stream to handle cleanup and metrics
   * @param {AsyncIterable} stream - Original stream
   * @param {string} requestId - Request ID
   * @param {string} providerName - Provider name
   * @returns {AsyncIterable} Wrapped stream
   */
  wrapStream(stream, requestId, providerName) {
    const self = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          for await (const chunk of stream) {
            yield chunk;
          }
        } finally {
          self.untrackRequest(requestId);
          self.emit('streamingCompleted', { requestId, provider: providerName });
        }
      }
    };
  }

  /**
   * Setup event forwarding from provider
   * @param {BaseAIProvider} provider - Provider instance
   */
  setupProviderEvents(provider) {
    const providerName = provider.name;
    
    provider.on('log', (logEntry) => {
      this.emit('providerLog', { ...logEntry, provider: providerName });
    });
    
    provider.on('metricsUpdated', (data) => {
      this.emit('providerMetricsUpdated', { ...data, provider: providerName });
    });
    
    provider.on('error', (error) => {
      this.handleProviderError(providerName, error);
    });
  }

  /**
   * Handle provider errors
   * @param {string} providerName - Provider name
   * @param {Error} error - Error object
   */
  handleProviderError(providerName, error) {
    const health = this.healthStatus.get(providerName);
    if (health) {
      health.consecutiveFailures++;
      
      if (health.consecutiveFailures >= 3) {
        health.isHealthy = false;
        health.status = 'unhealthy';
        this.log('Provider marked as unhealthy', { provider: providerName, failures: health.consecutiveFailures }, 'warn');
        this.emit('providerUnhealthy', { provider: providerName, error });
      }
    }
    
    this.emit('providerError', { provider: providerName, error });
  }

  /**
   * Update default role providers
   * @param {string} providerName - Provider name 
   * @param {Object} config - Provider configuration
   */
  updateDefaultRoleProviders(providerName, config) {
    const provider = this.providers.get(providerName);
    const capabilities = provider.getCapabilities();
    
    // Set as default for supported roles if none are set
    for (const role of capabilities.supportedRoles || ['main']) {
      if (!this.defaultRoles[role]) {
        this.defaultRoles[role] = providerName;
        this.configureProviderRole(providerName, role, config.roles?.[role] || {});
      }
    }
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck() {
    if (this.healthCheckInterval) {
      return; // Already running
    }
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.options.healthCheckInterval);
    
    this.log('Health check monitoring started', { interval: this.options.healthCheckInterval });
  }

  /**
   * Stop health check monitoring
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.log('Health check monitoring stopped');
    }
  }

  /**
   * Perform health check on all providers
   */
  async performHealthCheck() {
    this.log('Performing provider health check');
    
    const healthPromises = Array.from(this.providers.entries()).map(async ([providerName, provider]) => {
      try {
        const isHealthy = await provider.testConnection();
        const health = this.healthStatus.get(providerName);
        
        if (health) {
          if (isHealthy && !health.isHealthy) {
            // Provider recovered
            health.consecutiveFailures = 0;
            health.isHealthy = true;
            health.status = 'healthy';
            this.log('Provider recovered', { provider: providerName });
            this.emit('providerRecovered', { provider: providerName });
          }
          
          health.lastHealthCheck = new Date().toISOString();
        }
        
      } catch (error) {
        this.handleProviderError(providerName, error);
      }
    });
    
    await Promise.allSettled(healthPromises);
    this.emit('healthCheckCompleted');
  }

  /**
   * Get provider status and metrics
   * @returns {Object} Provider status information
   */
  getStatus() {
    const providerStatus = {};
    
    for (const [providerName, provider] of this.providers) {
      providerStatus[providerName] = {
        ...provider.getStatus(),
        health: this.healthStatus.get(providerName),
        metrics: this.providerMetrics.get(providerName),
        activeRequests: Array.from(this.activeRequests.values())
          .filter(req => req.provider === providerName).length
      };
    }
    
    return {
      totalProviders: this.providers.size,
      healthyProviders: Array.from(this.healthStatus.values()).filter(h => h.isHealthy).length,
      activeRequests: this.activeRequests.size,
      roleProviders: Object.fromEntries(this.roleProviders),
      defaultRoles: this.defaultRoles,
      options: this.options,
      providers: providerStatus
    };
  }

  /**
   * Get list of registered providers
   * @returns {Array} Provider list
   */
  getProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider by name
   * @param {string} name - Provider name
   * @returns {BaseAIProvider|null} Provider instance
   */
  getProvider(name) {
    return this.providers.get(name) || null;
  }

  /**
   * Remove provider
   * @param {string} name - Provider name
   * @returns {boolean} Removal success
   */
  removeProvider(name) {
    if (!this.providers.has(name)) {
      return false;
    }
    
    // Clean up
    this.providers.delete(name);
    this.providerMetrics.delete(name);
    this.healthStatus.delete(name);
    
    // Remove from role mappings
    for (const [role, providers] of this.roleProviders) {
      const index = providers.findIndex(p => p.provider === name);
      if (index >= 0) {
        providers.splice(index, 1);
      }
    }
    
    // Update default roles
    for (const [role, providerName] of Object.entries(this.defaultRoles)) {
      if (providerName === name) {
        this.defaultRoles[role] = null;
      }
    }
    
    this.log('Provider removed', { provider: name });
    this.emit('providerRemoved', { provider: name });
    
    return true;
  }

  /**
   * Shutdown provider manager
   */
  async shutdown() {
    this.log('Shutting down provider manager');
    
    // Stop health check
    this.stopHealthCheck();
    
    // Shutdown all providers
    const shutdownPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        if (typeof provider.shutdown === 'function') {
          await provider.shutdown();
        }
      } catch (error) {
        this.log('Error shutting down provider', { provider: provider.name, error: error.message }, 'error');
      }
    });
    
    await Promise.allSettled(shutdownPromises);
    
    // Clear state
    this.providers.clear();
    this.roleProviders.clear();
    this.providerMetrics.clear();
    this.healthStatus.clear();
    this.activeRequests.clear();
    
    this.emit('shutdown');
    this.log('Provider manager shutdown complete');
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
      component: 'ProviderManager',
      level,
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      console.error(`[ProviderManager] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[ProviderManager] WARN: ${message}`, data);
    } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
      console.debug(`[ProviderManager] DEBUG: ${message}`, data);
    } else if (level === 'info') {
      console.log(`[ProviderManager] INFO: ${message}`, data);
    }
  }
}