import { EventEmitter } from 'events';
import ProviderManager from './ProviderManager.js';
import AnthropicProvider from './AnthropicProvider.js';
import OpenAIProvider from './OpenAIProvider.js';

/**
 * ProviderRegistry - Central registry for AI providers with role-based routing
 * Manages provider registration, configuration, and intelligent routing
 */
export default class ProviderRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableAutoRegistration: options.enableAutoRegistration !== false,
      enableHealthChecks: options.enableHealthChecks !== false,
      enableFallbackRouting: options.enableFallbackRouting !== false,
      defaultTimeout: options.defaultTimeout || 30000,
      ...options
    };

    this.providerManager = new ProviderManager(this.options);
    this.registeredProviders = new Map();
    this.roleRouting = new Map();
    this.providerClasses = new Map();
    
    // Register built-in provider classes
    this.registerProviderClass('anthropic', AnthropicProvider);
    this.registerProviderClass('openai', OpenAIProvider);
    
    // Set up default role routing
    this.setupDefaultRoleRouting();
    
    // Forward events from provider manager
    this.setupEventForwarding();
    
    this.log('Provider Registry initialized');
  }

  /**
   * Register a provider class for dynamic instantiation
   * @param {string} name - Provider name
   * @param {class} ProviderClass - Provider class constructor
   */
  registerProviderClass(name, ProviderClass) {
    this.providerClasses.set(name, ProviderClass);
    this.log('Provider class registered', { provider: name });
  }

  /**
   * Auto-register providers based on available API keys
   */
  async autoRegisterProviders() {
    if (!this.options.enableAutoRegistration) {
      return;
    }

    this.log('Starting auto-registration of providers');
    
    const registrationResults = [];

    // Check for Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await this.registerProvider('anthropic', {
          apiKey: process.env.ANTHROPIC_API_KEY,
          roles: {
            main: { priority: 2, weight: 2 },
            research: { priority: 3, weight: 3 },
            fallback: { priority: 2, weight: 2 }
          }
        });
        registrationResults.push({ provider: 'anthropic', success: result });
      } catch (error) {
        this.log('Failed to auto-register Anthropic', { error: error.message }, 'warn');
        registrationResults.push({ provider: 'anthropic', success: false, error });
      }
    }

    // Check for OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await this.registerProvider('openai', {
          apiKey: process.env.OPENAI_API_KEY,
          organization: process.env.OPENAI_ORGANIZATION,
          project: process.env.OPENAI_PROJECT,
          roles: {
            main: { priority: 3, weight: 3 },
            research: { priority: 2, weight: 2 },
            fallback: { priority: 3, weight: 3 }
          }
        });
        registrationResults.push({ provider: 'openai', success: result });
      } catch (error) {
        this.log('Failed to auto-register OpenAI', { error: error.message }, 'warn');
        registrationResults.push({ provider: 'openai', success: false, error });
      }
    }

    const successCount = registrationResults.filter(r => r.success).length;
    this.log(`Auto-registration completed`, { 
      total: registrationResults.length, 
      successful: successCount,
      results: registrationResults 
    });

    this.emit('autoRegistrationCompleted', { results: registrationResults });
    
    return registrationResults;
  }

  /**
   * Register a provider instance
   * @param {string} name - Provider name
   * @param {Object} config - Provider configuration
   * @returns {Promise<boolean>} Registration success
   */
  async registerProvider(name, config = {}) {
    try {
      // Create provider instance if not provided
      let provider;
      
      if (config.instance) {
        provider = config.instance;
      } else {
        const ProviderClass = this.providerClasses.get(name);
        if (!ProviderClass) {
          throw new Error(`Unknown provider class: ${name}`);
        }
        
        provider = new ProviderClass(config);
      }

      // Register with provider manager
      const result = await this.providerManager.registerProvider(provider, config);
      
      if (result) {
        this.registeredProviders.set(name, {
          provider,
          config,
          registeredAt: new Date().toISOString()
        });
        
        this.emit('providerRegistered', { name, provider, config });
      }
      
      return result;

    } catch (error) {
      this.log('Provider registration failed', { provider: name, error: error.message }, 'error');
      this.emit('providerRegistrationFailed', { name, error });
      return false;
    }
  }

  /**
   * Configure role-based routing
   * @param {string} role - Role name (main, research, fallback)
   * @param {Object} config - Role configuration
   */
  configureRoleRouting(role, config) {
    this.roleRouting.set(role, {
      providers: config.providers || [],
      strategy: config.strategy || 'priority', // priority, round-robin, load-balance
      fallbackEnabled: config.fallbackEnabled !== false,
      ...config
    });

    this.log('Role routing configured', { role, config });
    this.emit('roleRoutingConfigured', { role, config });
  }

  /**
   * Generate text using intelligent provider selection
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Generation result
   */
  async generateText(params = {}) {
    return await this.providerManager.generateText(params);
  }

  /**
   * Generate structured object using intelligent provider selection
   * @param {Object} params - Generation parameters with schema
   * @returns {Promise<Object>} Generation result
   */
  async generateObject(params = {}) {
    return await this.providerManager.generateObject(params);
  }

  /**
   * Stream text using intelligent provider selection
   * @param {Object} params - Generation parameters
   * @returns {Promise<AsyncIterable>} Text stream
   */
  async streamText(params = {}) {
    return await this.providerManager.streamText(params);
  }

  /**
   * Get best provider for role and capability
   * @param {string} role - Role name
   * @param {string} capability - Required capability
   * @returns {Object|null} Selected provider info
   */
  getProviderForRole(role, capability = 'textGeneration') {
    const providers = this.providerManager.getProviders();
    const roleRouting = this.roleRouting.get(role);
    
    if (!roleRouting) {
      // Default selection
      for (const providerName of providers) {
        const provider = this.providerManager.getProvider(providerName);
        const capabilities = provider?.getCapabilities();
        
        if (capabilities?.[capability]) {
          return {
            name: providerName,
            provider,
            capabilities
          };
        }
      }
      return null;
    }

    // Role-specific selection
    const availableProviders = roleRouting.providers
      .filter(p => providers.includes(p.name))
      .map(p => ({
        ...p,
        provider: this.providerManager.getProvider(p.name),
        capabilities: this.providerManager.getProvider(p.name)?.getCapabilities()
      }))
      .filter(p => p.capabilities?.[capability])
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return availableProviders[0] || null;
  }

  /**
   * Get registry status and metrics
   * @returns {Object} Registry status
   */
  getStatus() {
    const providerManagerStatus = this.providerManager.getStatus();
    
    return {
      ...providerManagerStatus,
      registeredProviders: this.registeredProviders.size,
      roleRouting: Object.fromEntries(this.roleRouting),
      availableProviderClasses: Array.from(this.providerClasses.keys()),
      options: this.options
    };
  }

  /**
   * Setup default role routing configuration
   */
  setupDefaultRoleRouting() {
    // Main role - primary development assistance
    this.configureRoleRouting('main', {
      providers: [
        { name: 'openai', priority: 3, weight: 3 },
        { name: 'anthropic', priority: 2, weight: 2 }
      ],
      strategy: 'priority',
      fallbackEnabled: true
    });

    // Research role - specialized for analysis and research
    this.configureRoleRouting('research', {
      providers: [
        { name: 'anthropic', priority: 3, weight: 3 },
        { name: 'openai', priority: 2, weight: 2 }
      ],
      strategy: 'priority',
      fallbackEnabled: true
    });

    // Fallback role - fast and reliable
    this.configureRoleRouting('fallback', {
      providers: [
        { name: 'openai', priority: 3, weight: 3, model: 'gpt-4o-mini' },
        { name: 'anthropic', priority: 2, weight: 2, model: 'claude-3-5-haiku-20241022' }
      ],
      strategy: 'priority',
      fallbackEnabled: false
    });
  }

  /**
   * Setup event forwarding from provider manager
   */
  setupEventForwarding() {
    // Forward all provider manager events
    this.providerManager.on('providerRegistered', (data) => {
      this.emit('providerRegistered', data);
    });

    this.providerManager.on('providerError', (data) => {
      this.emit('providerError', data);
    });

    this.providerManager.on('textGenerationCompleted', (data) => {
      this.emit('textGenerationCompleted', data);
    });

    this.providerManager.on('objectGenerationCompleted', (data) => {
      this.emit('objectGenerationCompleted', data);
    });

    this.providerManager.on('providerUnhealthy', (data) => {
      this.emit('providerUnhealthy', data);
    });

    this.providerManager.on('providerRecovered', (data) => {
      this.emit('providerRecovered', data);
    });

    this.providerManager.on('log', (data) => {
      this.emit('log', { ...data, source: 'ProviderManager' });
    });
  }

  /**
   * Start health monitoring
   */
  startHealthCheck() {
    if (this.options.enableHealthChecks) {
      this.providerManager.startHealthCheck();
      this.log('Health check monitoring started');
    }
  }

  /**
   * Stop health monitoring
   */
  stopHealthCheck() {
    this.providerManager.stopHealthCheck();
    this.log('Health check monitoring stopped');
  }

  /**
   * Shutdown registry and all providers
   */
  async shutdown() {
    this.log('Shutting down provider registry');
    
    await this.providerManager.shutdown();
    
    this.registeredProviders.clear();
    this.roleRouting.clear();
    
    this.emit('shutdown');
    this.log('Provider registry shutdown complete');
  }

  /**
   * Get list of available provider classes
   * @returns {Array} Provider class names
   */
  getAvailableProviderClasses() {
    return Array.from(this.providerClasses.keys());
  }

  /**
   * Get registered providers
   * @returns {Array} Registered provider names
   */
  getRegisteredProviders() {
    return Array.from(this.registeredProviders.keys());
  }

  /**
   * Check if provider is registered
   * @param {string} name - Provider name
   * @returns {boolean} Registration status
   */
  isProviderRegistered(name) {
    return this.registeredProviders.has(name);
  }

  /**
   * Remove provider from registry
   * @param {string} name - Provider name
   * @returns {boolean} Removal success
   */
  async removeProvider(name) {
    if (!this.isProviderRegistered(name)) {
      return false;
    }

    const result = this.providerManager.removeProvider(name);
    
    if (result) {
      this.registeredProviders.delete(name);
      this.emit('providerRemoved', { name });
      this.log('Provider removed from registry', { provider: name });
    }
    
    return result;
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
      component: 'ProviderRegistry',
      level,
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      console.error(`[ProviderRegistry] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[ProviderRegistry] WARN: ${message}`, data);
    } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
      console.debug(`[ProviderRegistry] DEBUG: ${message}`, data);
    } else if (level === 'info') {
      console.log(`[ProviderRegistry] INFO: ${message}`, data);
    }
  }
}