import { EventEmitter } from 'events';

/**
 * RetryManager - Intelligent retry logic with exponential backoff, circuit breaker, and error classification
 * Provides sophisticated retry strategies for AI provider requests
 */
export default class RetryManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      // Basic retry settings
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffFactor: options.backoffFactor || 2,
      jitter: options.jitter !== false, // Add randomness to prevent thundering herd
      
      // Circuit breaker settings
      circuitBreakerEnabled: options.circuitBreakerEnabled !== false,
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000,
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,
      
      // Error classification
      retryableErrors: options.retryableErrors || [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'NETWORK_ERROR',
        'RATE_LIMIT',
        'SERVER_OVERLOADED',
        'TEMPORARY_FAILURE'
      ],
      
      // Status code handling
      retryableStatusCodes: options.retryableStatusCodes || [
        408, // Request Timeout
        429, // Too Many Requests
        500, // Internal Server Error
        502, // Bad Gateway
        503, // Service Unavailable
        504  // Gateway Timeout
      ],
      
      // Logging
      enableLogging: options.enableLogging !== false,
      logLevel: options.logLevel || 'info',
      
      ...options
    };

    // Circuit breaker state
    this.circuitStates = new Map(); // providerName -> state
    this.failureCounts = new Map(); // providerName -> count
    this.lastFailureTimes = new Map(); // providerName -> timestamp
    this.halfOpenCalls = new Map(); // providerName -> count

    // Retry statistics
    this.retryStats = new Map(); // providerName -> stats

    this.log('RetryManager initialized', { options: this.options });
  }

  /**
   * Execute function with intelligent retry logic
   * @param {Function} fn - Function to execute
   * @param {Object} context - Execution context
   * @returns {Promise<any>} Function result
   */
  async executeWithRetry(fn, context = {}) {
    const { 
      provider = 'unknown',
      operation = 'unknown',
      customRetryOptions = {},
      metadata = {}
    } = context;

    // Merge custom options with defaults
    const retryOptions = {
      ...this.options,
      ...customRetryOptions
    };

    // Check circuit breaker
    if (this.options.circuitBreakerEnabled) {
      const circuitState = this.getCircuitState(provider);
      if (circuitState === 'OPEN') {
        throw new Error(`Circuit breaker is OPEN for provider: ${provider}`);
      }
      
      if (circuitState === 'HALF_OPEN') {
        const halfOpenCalls = this.halfOpenCalls.get(provider) || 0;
        if (halfOpenCalls >= this.options.halfOpenMaxCalls) {
          throw new Error(`Circuit breaker HALF_OPEN call limit exceeded for provider: ${provider}`);
        }
        this.halfOpenCalls.set(provider, halfOpenCalls + 1);
      }
    }

    let lastError;
    let attempt = 0;
    const startTime = Date.now();

    // Initialize stats if not exists
    if (!this.retryStats.has(provider)) {
      this.retryStats.set(provider, {
        totalAttempts: 0,
        totalRetries: 0,
        successfulRetries: 0,
        failedOperations: 0,
        avgRetryTime: 0,
        lastSuccess: null,
        lastFailure: null
      });
    }

    const stats = this.retryStats.get(provider);

    while (attempt <= retryOptions.maxRetries) {
      try {
        this.emit('attemptStarting', {
          provider,
          operation,
          attempt,
          maxRetries: retryOptions.maxRetries,
          metadata
        });

        // Execute the function
        const result = await fn();

        // Success - update circuit breaker and stats
        this.handleSuccess(provider);
        this.updateSuccessStats(stats, startTime, attempt);

        this.emit('operationSucceeded', {
          provider,
          operation,
          attempt,
          totalTime: Date.now() - startTime,
          metadata
        });

        return result;

      } catch (error) {
        lastError = error;
        attempt++;
        stats.totalAttempts++;

        this.emit('attemptFailed', {
          provider,
          operation,
          attempt,
          error: error.message,
          metadata
        });

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          this.log(`Non-retryable error for ${provider}:${operation}`, {
            error: error.message,
            attempt
          }, 'warn');
          
          this.handleFailure(provider, error);
          this.updateFailureStats(stats, startTime, false);
          throw error;
        }

        // Check if we should retry
        if (attempt > retryOptions.maxRetries) {
          this.log(`Max retries exceeded for ${provider}:${operation}`, {
            maxRetries: retryOptions.maxRetries,
            error: error.message
          }, 'error');
          
          this.handleFailure(provider, error);
          this.updateFailureStats(stats, startTime, true);
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, retryOptions);
        
        this.log(`Retrying ${provider}:${operation} in ${delay}ms`, {
          attempt,
          maxRetries: retryOptions.maxRetries,
          error: error.message
        });

        this.emit('retryScheduled', {
          provider,
          operation,
          attempt,
          delay,
          error: error.message,
          metadata
        });

        // Wait before retrying
        await this.sleep(delay);
        stats.totalRetries++;
      }
    }

    // All retries failed
    this.emit('operationFailed', {
      provider,
      operation,
      attempts: attempt,
      totalTime: Date.now() - startTime,
      finalError: lastError.message,
      metadata
    });

    throw lastError;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;
    const statusCode = error.status || error.statusCode;

    // Check error codes
    if (errorCode && this.options.retryableErrors.some(code => 
      errorMessage.includes(code.toLowerCase()) || errorCode === code
    )) {
      return true;
    }

    // Check HTTP status codes
    if (statusCode && this.options.retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    // Check common error patterns
    const retryablePatterns = [
      'timeout',
      'connection',
      'network',
      'rate limit',
      'quota',
      'server error',
      'service unavailable',
      'too many requests',
      'temporary',
      'throttled'
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate delay for next retry attempt
   * @param {number} attempt - Current attempt number
   * @param {Object} options - Retry options
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attempt, options) {
    // Exponential backoff
    let delay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
    
    // Apply maximum delay
    delay = Math.min(delay, options.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (options.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(100, Math.floor(delay)); // Minimum 100ms delay
  }

  /**
   * Get circuit breaker state for provider
   * @param {string} provider - Provider name
   * @returns {string} Circuit state: CLOSED, OPEN, or HALF_OPEN
   */
  getCircuitState(provider) {
    const state = this.circuitStates.get(provider) || 'CLOSED';
    
    if (state === 'OPEN') {
      const lastFailureTime = this.lastFailureTimes.get(provider) || 0;
      const now = Date.now();
      
      // Check if recovery timeout has passed
      if (now - lastFailureTime >= this.options.recoveryTimeout) {
        this.circuitStates.set(provider, 'HALF_OPEN');
        this.halfOpenCalls.set(provider, 0);
        this.log(`Circuit breaker moving to HALF_OPEN for provider: ${provider}`);
        this.emit('circuitBreakerHalfOpen', { provider });
        return 'HALF_OPEN';
      }
    }
    
    return state;
  }

  /**
   * Handle successful operation
   * @param {string} provider - Provider name
   */
  handleSuccess(provider) {
    const currentState = this.circuitStates.get(provider) || 'CLOSED';
    
    if (currentState === 'HALF_OPEN') {
      // Success in half-open state - close circuit
      this.circuitStates.set(provider, 'CLOSED');
      this.failureCounts.delete(provider);
      this.halfOpenCalls.delete(provider);
      this.log(`Circuit breaker CLOSED for provider: ${provider}`);
      this.emit('circuitBreakerClosed', { provider });
    } else if (currentState === 'CLOSED') {
      // Reset failure count on success
      this.failureCounts.set(provider, 0);
    }
  }

  /**
   * Handle failed operation
   * @param {string} provider - Provider name
   * @param {Error} error - Error that occurred
   */
  handleFailure(provider, error) {
    if (!this.options.circuitBreakerEnabled) return;

    const currentFailures = this.failureCounts.get(provider) || 0;
    const newFailureCount = currentFailures + 1;
    
    this.failureCounts.set(provider, newFailureCount);
    this.lastFailureTimes.set(provider, Date.now());

    const currentState = this.circuitStates.get(provider) || 'CLOSED';

    if (currentState === 'HALF_OPEN') {
      // Failure in half-open state - open circuit immediately
      this.circuitStates.set(provider, 'OPEN');
      this.log(`Circuit breaker OPENED from HALF_OPEN for provider: ${provider}`, {
        error: error.message
      });
      this.emit('circuitBreakerOpened', { provider, reason: 'half_open_failure', error });
      
    } else if (currentState === 'CLOSED' && newFailureCount >= this.options.failureThreshold) {
      // Threshold exceeded - open circuit
      this.circuitStates.set(provider, 'OPEN');
      this.log(`Circuit breaker OPENED for provider: ${provider}`, {
        failures: newFailureCount,
        threshold: this.options.failureThreshold,
        error: error.message
      });
      this.emit('circuitBreakerOpened', { provider, reason: 'threshold_exceeded', failures: newFailureCount, error });
    }
  }

  /**
   * Update success statistics
   * @param {Object} stats - Statistics object
   * @param {number} startTime - Operation start time
   * @param {number} attempts - Number of attempts made
   */
  updateSuccessStats(stats, startTime, attempts) {
    const duration = Date.now() - startTime;
    
    if (attempts > 1) {
      stats.successfulRetries++;
      
      // Update average retry time
      const totalRetryOperations = stats.successfulRetries + stats.failedOperations;
      stats.avgRetryTime = (stats.avgRetryTime * (totalRetryOperations - 1) + duration) / totalRetryOperations;
    }
    
    stats.lastSuccess = new Date().toISOString();
  }

  /**
   * Update failure statistics
   * @param {Object} stats - Statistics object
   * @param {number} startTime - Operation start time
   * @param {boolean} wasRetried - Whether operation was retried
   */
  updateFailureStats(stats, startTime, wasRetried) {
    const duration = Date.now() - startTime;
    
    if (wasRetried) {
      stats.failedOperations++;
      
      // Update average retry time
      const totalRetryOperations = stats.successfulRetries + stats.failedOperations;
      stats.avgRetryTime = (stats.avgRetryTime * (totalRetryOperations - 1) + duration) / totalRetryOperations;
    }
    
    stats.lastFailure = new Date().toISOString();
  }

  /**
   * Get retry statistics for provider
   * @param {string} provider - Provider name
   * @returns {Object} Retry statistics
   */
  getRetryStats(provider) {
    const stats = this.retryStats.get(provider);
    if (!stats) return null;

    return {
      ...stats,
      circuitState: this.getCircuitState(provider),
      currentFailures: this.failureCounts.get(provider) || 0,
      retrySuccessRate: stats.totalRetries > 0 ? stats.successfulRetries / stats.totalRetries : 0
    };
  }

  /**
   * Get all retry statistics
   * @returns {Object} All retry statistics
   */
  getAllStats() {
    const allStats = {};
    
    for (const [provider, stats] of this.retryStats) {
      allStats[provider] = this.getRetryStats(provider);
    }
    
    return {
      providers: allStats,
      globalStats: {
        totalProviders: this.retryStats.size,
        openCircuits: Array.from(this.circuitStates.values()).filter(state => state === 'OPEN').length,
        halfOpenCircuits: Array.from(this.circuitStates.values()).filter(state => state === 'HALF_OPEN').length
      }
    };
  }

  /**
   * Reset circuit breaker for provider
   * @param {string} provider - Provider name
   */
  resetCircuitBreaker(provider) {
    this.circuitStates.set(provider, 'CLOSED');
    this.failureCounts.set(provider, 0);
    this.halfOpenCalls.delete(provider);
    this.lastFailureTimes.delete(provider);
    
    this.log(`Circuit breaker manually reset for provider: ${provider}`);
    this.emit('circuitBreakerReset', { provider });
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    const providers = Array.from(this.circuitStates.keys());
    
    this.circuitStates.clear();
    this.failureCounts.clear();
    this.halfOpenCalls.clear();
    this.lastFailureTimes.clear();
    
    this.log('All circuit breakers manually reset');
    this.emit('allCircuitBreakersReset', { resetProviders: providers });
  }

  /**
   * Check provider health based on retry patterns
   * @param {string} provider - Provider name
   * @returns {Object} Health assessment
   */
  assessProviderHealth(provider) {
    const stats = this.getRetryStats(provider);
    if (!stats) {
      return { status: 'unknown', reason: 'No statistics available' };
    }

    const circuitState = stats.circuitState;
    
    if (circuitState === 'OPEN') {
      return { status: 'unhealthy', reason: 'Circuit breaker is open' };
    }
    
    if (circuitState === 'HALF_OPEN') {
      return { status: 'recovering', reason: 'Circuit breaker is half-open' };
    }

    // Analyze retry patterns
    const recentFailures = stats.currentFailures;
    const retrySuccessRate = stats.retrySuccessRate;
    
    if (recentFailures >= this.options.failureThreshold * 0.7) {
      return { status: 'degraded', reason: 'High failure rate detected' };
    }
    
    if (retrySuccessRate < 0.5 && stats.totalRetries > 10) {
      return { status: 'degraded', reason: 'Low retry success rate' };
    }
    
    return { status: 'healthy', reason: 'Operating normally' };
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
   * Logging utility
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {string} level - Log level
   */
  log(message, data = {}, level = 'info') {
    if (!this.options.enableLogging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      component: 'RetryManager',
      level,
      message,
      ...data
    };
    
    this.emit('log', logEntry);
    
    if (level === 'error') {
      console.error(`[RetryManager] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[RetryManager] WARN: ${message}`, data);
    } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
      console.debug(`[RetryManager] DEBUG: ${message}`, data);
    } else if (level === 'info') {
      console.log(`[RetryManager] INFO: ${message}`, data);
    }
  }

  /**
   * Shutdown retry manager
   */
  shutdown() {
    this.log('Shutting down RetryManager');
    
    this.circuitStates.clear();
    this.failureCounts.clear();
    this.halfOpenCalls.clear();
    this.lastFailureTimes.clear();
    this.retryStats.clear();
    
    this.emit('shutdown');
  }
}