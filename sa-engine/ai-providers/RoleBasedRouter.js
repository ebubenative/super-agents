import { EventEmitter } from 'events';

/**
 * RoleBasedRouter - Advanced role-based routing for AI providers
 * Provides intelligent provider selection based on role, context, and performance
 */
export default class RoleBasedRouter extends EventEmitter {
  constructor(providerRegistry, options = {}) {
    super();
    
    this.providerRegistry = providerRegistry;
    this.options = {
      enableContextAwareRouting: options.enableContextAwareRouting !== false,
      enablePerformanceRouting: options.enablePerformanceRouting !== false,
      enableCostOptimization: options.enableCostOptimization !== false,
      defaultFallbackStrategy: options.defaultFallbackStrategy || 'cascade',
      routingMetrics: options.routingMetrics !== false,
      ...options
    };

    this.routingRules = new Map();
    this.contextPatterns = new Map();
    this.performanceMetrics = new Map();
    this.costThresholds = new Map();
    
    // Initialize default routing rules
    this.initializeDefaultRules();
    
    this.log('Role-based router initialized');
  }

  /**
   * Initialize default routing rules for different roles
   */
  initializeDefaultRules() {
    // Main role - balanced performance and capability
    this.addRoutingRule('main', {
      strategy: 'performance_weighted',
      providers: [
        { 
          name: 'openai', 
          priority: 3, 
          weight: 3,
          models: ['gpt-4o', 'gpt-4o-mini'],
          contextPatterns: ['coding', 'general', 'problem-solving']
        },
        { 
          name: 'anthropic', 
          priority: 2, 
          weight: 2,
          models: ['claude-3-5-sonnet-20241022'],
          contextPatterns: ['analysis', 'writing', 'research']
        }
      ],
      fallbackStrategy: 'cascade',
      maxCostPerRequest: 0.10,
      performanceWeights: {
        responseTime: 0.3,
        successRate: 0.4,
        costEfficiency: 0.3
      }
    });

    // Research role - optimized for deep analysis
    this.addRoutingRule('research', {
      strategy: 'capability_focused',
      providers: [
        { 
          name: 'anthropic', 
          priority: 3, 
          weight: 3,
          models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
          contextPatterns: ['research', 'analysis', 'comprehensive']
        },
        { 
          name: 'openai', 
          priority: 2, 
          weight: 2,
          models: ['gpt-4o', 'gpt-4-turbo'],
          contextPatterns: ['data-analysis', 'technical-research']
        }
      ],
      fallbackStrategy: 'best_available',
      maxCostPerRequest: 0.25,
      performanceWeights: {
        accuracy: 0.5,
        comprehensiveness: 0.3,
        responseTime: 0.2
      }
    });

    // Fallback role - fast and cost-effective
    this.addRoutingRule('fallback', {
      strategy: 'cost_optimized',
      providers: [
        { 
          name: 'openai', 
          priority: 3, 
          weight: 3,
          models: ['gpt-4o-mini', 'gpt-3.5-turbo'],
          contextPatterns: ['simple', 'quick', 'basic']
        },
        { 
          name: 'anthropic', 
          priority: 2, 
          weight: 2,
          models: ['claude-3-5-haiku-20241022'],
          contextPatterns: ['efficient', 'lightweight']
        }
      ],
      fallbackStrategy: 'fastest_available',
      maxCostPerRequest: 0.05,
      performanceWeights: {
        costEfficiency: 0.5,
        responseTime: 0.4,
        availability: 0.1
      }
    });

    // Specialized roles
    this.addRoutingRule('creative', {
      strategy: 'capability_focused',
      providers: [
        { 
          name: 'anthropic', 
          priority: 3, 
          weight: 3,
          models: ['claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'],
          contextPatterns: ['creative', 'artistic', 'storytelling']
        }
      ],
      fallbackStrategy: 'main',
      maxCostPerRequest: 0.20
    });

    this.addRoutingRule('coding', {
      strategy: 'performance_weighted',
      providers: [
        { 
          name: 'openai', 
          priority: 3, 
          weight: 3,
          models: ['gpt-4o', 'gpt-4o-mini'],
          contextPatterns: ['code', 'programming', 'debugging', 'technical']
        },
        { 
          name: 'anthropic', 
          priority: 2, 
          weight: 2,
          models: ['claude-3-5-sonnet-20241022'],
          contextPatterns: ['code-review', 'architecture']
        }
      ],
      fallbackStrategy: 'main',
      maxCostPerRequest: 0.15
    });
  }

  /**
   * Add a routing rule for a specific role
   * @param {string} role - Role name
   * @param {Object} rule - Routing rule configuration
   */
  addRoutingRule(role, rule) {
    this.routingRules.set(role, {
      strategy: rule.strategy || 'priority',
      providers: rule.providers || [],
      fallbackStrategy: rule.fallbackStrategy || 'cascade',
      maxCostPerRequest: rule.maxCostPerRequest || 1.0,
      performanceWeights: rule.performanceWeights || {},
      contextPatterns: rule.contextPatterns || [],
      conditions: rule.conditions || {},
      ...rule
    });

    this.log('Routing rule added', { role, rule });
    this.emit('routingRuleAdded', { role, rule });
  }

  /**
   * Route request to best provider based on role and context
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} Routing decision
   */
  async routeRequest(params = {}) {
    const startTime = Date.now();
    const role = params.role || 'main';
    const context = this.analyzeContext(params);
    
    try {
      this.emit('routingStarted', { role, context, params });

      // Get routing rule for role
      const rule = this.routingRules.get(role);
      if (!rule) {
        throw new Error(`No routing rule found for role: ${role}`);
      }

      // Apply context-aware filtering
      let candidateProviders = rule.providers;
      if (this.options.enableContextAwareRouting && context.patterns.length > 0) {
        candidateProviders = this.filterByContext(candidateProviders, context);
      }

      // Apply performance-based selection
      let selectedProvider;
      if (this.options.enablePerformanceRouting) {
        selectedProvider = await this.selectByPerformance(candidateProviders, rule, context);
      } else {
        selectedProvider = this.selectByPriority(candidateProviders);
      }

      // Apply cost optimization if enabled
      if (this.options.enableCostOptimization) {
        selectedProvider = await this.optimizeForCost(selectedProvider, rule, params);
      }

      // Validate provider availability
      const isAvailable = await this.validateProviderAvailability(selectedProvider);
      if (!isAvailable) {
        selectedProvider = await this.handleFallback(rule, candidateProviders, context);
      }

      const routingTime = Date.now() - startTime;
      const decision = {
        role,
        provider: selectedProvider,
        context,
        routingTime,
        strategy: rule.strategy,
        fallbackUsed: !isAvailable
      };

      // Track routing metrics
      if (this.options.routingMetrics) {
        this.trackRoutingMetrics(decision);
      }

      this.emit('routingCompleted', decision);
      this.log('Request routed successfully', decision);

      return decision;

    } catch (error) {
      const routingTime = Date.now() - startTime;
      this.emit('routingError', { role, context, error, routingTime });
      this.log('Routing failed', { role, error: error.message, routingTime }, 'error');
      throw error;
    }
  }

  /**
   * Analyze request context for intelligent routing
   * @param {Object} params - Request parameters
   * @returns {Object} Context analysis
   */
  analyzeContext(params) {
    const context = {
      patterns: [],
      complexity: 'medium',
      urgency: 'normal',
      contentType: 'text',
      estimatedTokens: 0
    };

    // Analyze message content for patterns
    if (params.messages && Array.isArray(params.messages)) {
      const allContent = params.messages.map(m => m.content || '').join(' ').toLowerCase();
      
      // Detect patterns
      const patterns = {
        coding: /\b(code|function|class|algorithm|debug|programming|javascript|python|react|api)\b/g,
        research: /\b(research|analyze|study|investigate|examine|comprehensive|detailed)\b/g,
        creative: /\b(creative|story|artistic|design|imaginative|innovative|brainstorm)\b/g,
        technical: /\b(technical|system|architecture|database|server|deployment)\b/g,
        simple: /\b(simple|quick|basic|easy|brief|short)\b/g,
        complex: /\b(complex|comprehensive|detailed|thorough|extensive)\b/g
      };

      for (const [pattern, regex] of Object.entries(patterns)) {
        const matches = allContent.match(regex);
        if (matches && matches.length > 0) {
          context.patterns.push(pattern);
        }
      }

      // Estimate complexity
      const wordCount = allContent.split(/\s+/).length;
      if (wordCount > 500) {
        context.complexity = 'high';
      } else if (wordCount < 50) {
        context.complexity = 'low';
      }

      // Estimate token usage
      context.estimatedTokens = Math.ceil(wordCount * 1.3); // Rough estimate
    }

    // Analyze other parameters
    if (params.maxTokens && params.maxTokens > 8000) {
      context.complexity = 'high';
    }

    if (params.temperature && params.temperature > 0.8) {
      context.patterns.push('creative');
    }

    return context;
  }

  /**
   * Filter providers by context patterns
   * @param {Array} providers - Candidate providers
   * @param {Object} context - Request context
   * @returns {Array} Filtered providers
   */
  filterByContext(providers, context) {
    if (context.patterns.length === 0) {
      return providers;
    }

    return providers.filter(provider => {
      if (!provider.contextPatterns || provider.contextPatterns.length === 0) {
        return true; // Include providers without specific patterns
      }

      // Check if any context pattern matches provider patterns
      return context.patterns.some(pattern => 
        provider.contextPatterns.includes(pattern)
      );
    });
  }

  /**
   * Select provider based on performance metrics
   * @param {Array} providers - Candidate providers
   * @param {Object} rule - Routing rule
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Selected provider
   */
  async selectByPerformance(providers, rule, context) {
    const scores = [];

    for (const provider of providers) {
      const metrics = await this.getProviderMetrics(provider.name);
      const weights = rule.performanceWeights || {};
      
      let score = provider.priority || 1;
      
      // Apply performance weights
      if (weights.responseTime && metrics.avgResponseTime) {
        score += (1000 / metrics.avgResponseTime) * weights.responseTime;
      }
      
      if (weights.successRate && metrics.successRate) {
        score += metrics.successRate * weights.successRate;
      }
      
      if (weights.costEfficiency && metrics.avgCost) {
        score += (1 / metrics.avgCost) * weights.costEfficiency;
      }
      
      // Context-based scoring
      if (context.complexity === 'high' && provider.models) {
        const hasHighCapabilityModel = provider.models.some(model => 
          model.includes('4o') || model.includes('opus') || model.includes('sonnet')
        );
        if (hasHighCapabilityModel) {
          score += 1;
        }
      }

      scores.push({ provider, score, metrics });
    }

    // Sort by score and return best provider
    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.provider || providers[0];
  }

  /**
   * Select provider by priority (fallback method)
   * @param {Array} providers - Candidate providers
   * @returns {Object} Selected provider
   */
  selectByPriority(providers) {
    if (providers.length === 0) {
      throw new Error('No providers available for selection');
    }

    return providers.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  }

  /**
   * Optimize provider selection for cost
   * @param {Object} provider - Selected provider
   * @param {Object} rule - Routing rule
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} Cost-optimized provider
   */
  async optimizeForCost(provider, rule, params) {
    const estimatedCost = await this.estimateRequestCost(provider, params);
    
    if (estimatedCost <= rule.maxCostPerRequest) {
      return provider;
    }

    // Find more cost-effective alternative
    const alternatives = rule.providers
      .filter(p => p.name !== provider.name)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0)); // Sort by cost efficiency

    for (const alternative of alternatives) {
      const altCost = await this.estimateRequestCost(alternative, params);
      if (altCost <= rule.maxCostPerRequest) {
        this.log('Switched to cost-effective alternative', {
          original: provider.name,
          alternative: alternative.name,
          estimatedSavings: estimatedCost - altCost
        });
        return alternative;
      }
    }

    return provider; // Return original if no cost-effective alternative found
  }

  /**
   * Validate provider availability
   * @param {Object} provider - Provider to validate
   * @returns {Promise<boolean>} Availability status
   */
  async validateProviderAvailability(provider) {
    try {
      const providerInstance = this.providerRegistry.getProvider(provider.name);
      if (!providerInstance) {
        return false;
      }

      const status = providerInstance.getStatus();
      return status.isConnected && !status.lastError;

    } catch (error) {
      this.log('Error validating provider availability', { 
        provider: provider.name, 
        error: error.message 
      }, 'warn');
      return false;
    }
  }

  /**
   * Handle fallback routing when primary provider is unavailable
   * @param {Object} rule - Routing rule
   * @param {Array} providers - Available providers
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Fallback provider
   */
  async handleFallback(rule, providers, context) {
    const fallbackStrategy = rule.fallbackStrategy;

    switch (fallbackStrategy) {
      case 'cascade':
        // Try providers in priority order
        for (const provider of providers.sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
          const isAvailable = await this.validateProviderAvailability(provider);
          if (isAvailable) {
            return provider;
          }
        }
        break;

      case 'fastest_available':
        // Select provider with best response time
        const metrics = await Promise.all(
          providers.map(async p => ({
            provider: p,
            metrics: await this.getProviderMetrics(p.name)
          }))
        );
        
        const fastest = metrics
          .filter(m => m.metrics.isAvailable)
          .sort((a, b) => a.metrics.avgResponseTime - b.metrics.avgResponseTime)[0];
        
        if (fastest) {
          return fastest.provider;
        }
        break;

      case 'best_available':
        // Select highest priority available provider
        for (const provider of providers.sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
          const isAvailable = await this.validateProviderAvailability(provider);
          if (isAvailable) {
            return provider;
          }
        }
        break;

      case 'main':
        // Fallback to main role
        if (rule !== this.routingRules.get('main')) {
          return await this.routeRequest({ ...context, role: 'main' });
        }
        break;
    }

    throw new Error('No available providers for fallback routing');
  }

  /**
   * Get provider performance metrics
   * @param {string} providerName - Provider name
   * @returns {Promise<Object>} Provider metrics
   */
  async getProviderMetrics(providerName) {
    const providerInstance = this.providerRegistry.getProvider(providerName);
    if (!providerInstance) {
      return { isAvailable: false };
    }

    const status = providerInstance.getStatus();
    return {
      isAvailable: status.isConnected,
      avgResponseTime: status.metrics?.avgResponseTime || 1000,
      successRate: status.metrics?.successRate || 1.0,
      avgCost: 0.01, // Default placeholder
      ...status.metrics
    };
  }

  /**
   * Estimate request cost
   * @param {Object} provider - Provider configuration
   * @param {Object} params - Request parameters
   * @returns {Promise<number>} Estimated cost
   */
  async estimateRequestCost(provider, params) {
    const providerInstance = this.providerRegistry.getProvider(provider.name);
    if (!providerInstance || typeof providerInstance.calculateCost !== 'function') {
      return 0.01; // Default estimate
    }

    const estimatedTokens = params.maxTokens || 1000;
    const mockUsage = {
      inputTokens: Math.ceil(estimatedTokens * 0.7),
      outputTokens: Math.ceil(estimatedTokens * 0.3),
      totalTokens: estimatedTokens
    };

    const costInfo = providerInstance.calculateCost(mockUsage, provider.models?.[0]);
    return costInfo?.totalCost || 0.01;
  }

  /**
   * Track routing metrics for analytics
   * @param {Object} decision - Routing decision
   */
  trackRoutingMetrics(decision) {
    const key = `${decision.role}-${decision.provider.name}`;
    
    if (!this.performanceMetrics.has(key)) {
      this.performanceMetrics.set(key, {
        requestCount: 0,
        totalRoutingTime: 0,
        fallbackCount: 0,
        avgRoutingTime: 0
      });
    }

    const metrics = this.performanceMetrics.get(key);
    metrics.requestCount++;
    metrics.totalRoutingTime += decision.routingTime;
    metrics.avgRoutingTime = metrics.totalRoutingTime / metrics.requestCount;
    
    if (decision.fallbackUsed) {
      metrics.fallbackCount++;
    }

    this.emit('metricsUpdated', { key, metrics });
  }

  /**
   * Get routing statistics
   * @returns {Object} Routing statistics
   */
  getRoutingStats() {
    const stats = {
      totalRequests: 0,
      avgRoutingTime: 0,
      fallbackRate: 0,
      providerDistribution: {},
      roleDistribution: {}
    };

    for (const [key, metrics] of this.performanceMetrics) {
      const [role, provider] = key.split('-');
      
      stats.totalRequests += metrics.requestCount;
      stats.avgRoutingTime += metrics.avgRoutingTime * metrics.requestCount;
      
      if (!stats.providerDistribution[provider]) {
        stats.providerDistribution[provider] = 0;
      }
      stats.providerDistribution[provider] += metrics.requestCount;
      
      if (!stats.roleDistribution[role]) {
        stats.roleDistribution[role] = 0;
      }
      stats.roleDistribution[role] += metrics.requestCount;
    }

    if (stats.totalRequests > 0) {
      stats.avgRoutingTime /= stats.totalRequests;
    }

    return stats;
  }

  /**
   * Get status and configuration
   * @returns {Object} Router status
   */
  getStatus() {
    return {
      routingRules: Object.fromEntries(this.routingRules),
      options: this.options,
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      stats: this.getRoutingStats()
    };
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
      component: 'RoleBasedRouter',
      level,
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      console.error(`[RoleBasedRouter] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[RoleBasedRouter] WARN: ${message}`, data);
    } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
      console.debug(`[RoleBasedRouter] DEBUG: ${message}`, data);
    } else if (level === 'info') {
      console.log(`[RoleBasedRouter] INFO: ${message}`, data);
    }
  }
}