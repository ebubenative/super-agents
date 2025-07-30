import { Logger } from './Logger.js';

export class ErrorHandler {
  constructor(options = {}) {
    this.logger = new Logger('ErrorHandler');
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.enableFallbacks = options.enableFallbacks !== false;
  }

  async handleToolError(error, context = {}) {
    const errorContext = {
      toolName: context.toolName || 'unknown',
      params: context.params || {},
      attempt: context.attempt || 1,
      timestamp: new Date().toISOString(),
      ...context
    };

    this.logger.error('Tool execution error', {
      error: error.message,
      stack: error.stack,
      context: errorContext
    });

    // Classify error type
    const errorType = this.classifyError(error);
    
    // Handle based on error type
    switch (errorType) {
      case 'NETWORK_ERROR':
        return await this.handleNetworkError(error, errorContext);
      case 'TIMEOUT_ERROR':
        return await this.handleTimeoutError(error, errorContext);
      case 'VALIDATION_ERROR':
        return this.handleValidationError(error, errorContext);
      case 'API_ERROR':
        return await this.handleAPIError(error, errorContext);
      case 'SYSTEM_ERROR':
        return this.handleSystemError(error, errorContext);
      default:
        return this.handleGenericError(error, errorContext);
    }
  }

  classifyError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
      return 'NETWORK_ERROR';
    }
    
    if (message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return 'TIMEOUT_ERROR';
    }
    
    if (message.includes('validation') || message.includes('invalid') || error.code === 'VALIDATION_ERROR') {
      return 'VALIDATION_ERROR';
    }
    
    if (message.includes('api') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'API_ERROR';
    }
    
    if (message.includes('enoent') || message.includes('permission') || message.includes('eacces')) {
      return 'SYSTEM_ERROR';
    }
    
    return 'GENERIC_ERROR';
  }

  async handleNetworkError(error, context) {
    if (context.attempt < this.retryAttempts) {
      this.logger.info(`Retrying network operation (attempt ${context.attempt + 1}/${this.retryAttempts})`);
      
      // Exponential backoff
      await this.delay(this.retryDelay * Math.pow(2, context.attempt - 1));
      
      return {
        retry: true,
        attempt: context.attempt + 1
      };
    }

    return {
      success: false,
      error: 'Network connection failed after multiple attempts. Please check your internet connection and try again.',
      errorType: 'NETWORK_ERROR',
      recoverable: true,
      suggestions: [
        'Check your internet connection',
        'Verify firewall settings',
        'Try again in a few minutes'
      ]
    };
  }

  async handleTimeoutError(error, context) {
    if (context.attempt < this.retryAttempts) {
      this.logger.info(`Retrying timed out operation (attempt ${context.attempt + 1}/${this.retryAttempts})`);
      
      await this.delay(this.retryDelay);
      
      return {
        retry: true,
        attempt: context.attempt + 1
      };
    }

    return {
      success: false,
      error: 'Operation timed out. The service may be experiencing high load.',
      errorType: 'TIMEOUT_ERROR',
      recoverable: true,
      suggestions: [
        'Try again with simpler parameters',
        'Break down the request into smaller parts',
        'Try again during off-peak hours'
      ]
    };
  }

  handleValidationError(error, context) {
    return {
      success: false,
      error: `Invalid input: ${error.message}`,
      errorType: 'VALIDATION_ERROR',
      recoverable: true,
      context: {
        toolName: context.toolName,
        invalidParams: this.identifyInvalidParams(error, context.params)
      },
      suggestions: [
        'Check the parameter format and values',
        'Refer to the tool documentation',
        'Use the help command for parameter examples'
      ]
    };
  }

  async handleAPIError(error, context) {
    const statusCode = error.status || error.statusCode;
    
    if (statusCode === 401) {
      return {
        success: false,
        error: 'Authentication failed. Please check your API keys.',
        errorType: 'AUTH_ERROR',
        recoverable: true,
        suggestions: [
          'Verify your API keys are correct',
          'Check if your API keys have expired',
          'Ensure you have the required permissions'
        ]
      };
    }
    
    if (statusCode === 429) {
      if (context.attempt < this.retryAttempts) {
        const backoffTime = this.calculateBackoffTime(error.headers);
        this.logger.info(`Rate limited, backing off for ${backoffTime}ms`);
        
        await this.delay(backoffTime);
        
        return {
          retry: true,
          attempt: context.attempt + 1
        };
      }
    }

    return {
      success: false,
      error: `API error: ${error.message}`,
      errorType: 'API_ERROR',
      recoverable: statusCode < 500,
      suggestions: this.getAPIErrorSuggestions(statusCode)
    };
  }

  handleSystemError(error, context) {
    return {
      success: false,
      error: `System error: ${error.message}`,
      errorType: 'SYSTEM_ERROR',
      recoverable: false,
      suggestions: [
        'Check file permissions',
        'Verify required files exist',
        'Contact system administrator if problem persists'
      ]
    };
  }

  handleGenericError(error, context) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
      errorType: 'GENERIC_ERROR',
      recoverable: true,
      suggestions: [
        'Try the operation again',
        'Check the console for more details',
        'Report this issue if it persists'
      ]
    };
  }

  identifyInvalidParams(error, params) {
    // Try to extract parameter names from error message
    const paramRegex = /parameter[s]?\s*['"`]?(\w+)['"`]?/gi;
    const matches = error.message.match(paramRegex);
    
    if (matches) {
      return matches.map(match => match.replace(/parameter[s]?\s*['"`]?/gi, '').replace(/['"`]/g, ''));
    }
    
    return Object.keys(params || {});
  }

  calculateBackoffTime(headers) {
    // Check for Retry-After header
    if (headers && headers['retry-after']) {
      return parseInt(headers['retry-after']) * 1000;
    }
    
    // Default exponential backoff
    return Math.min(this.retryDelay * 8, 30000); // Max 30 seconds
  }

  getAPIErrorSuggestions(statusCode) {
    const suggestions = {
      400: ['Check request parameters', 'Verify data format'],
      401: ['Check API keys', 'Verify authentication'],
      403: ['Check permissions', 'Verify access rights'],
      404: ['Check resource exists', 'Verify endpoint URL'],
      429: ['Reduce request frequency', 'Try again later'],
      500: ['Try again later', 'Contact support if persistent'],
      502: ['Service temporarily unavailable', 'Try again in a few minutes'],
      503: ['Service under maintenance', 'Check service status']
    };
    
    return suggestions[statusCode] || ['Try again later', 'Contact support if issue persists'];
  }

  async withRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await operation();
        return { success: true, data: result };
      } catch (error) {
        lastError = error;
        
        const errorResult = await this.handleToolError(error, {
          ...context,
          attempt
        });
        
        if (!errorResult.retry) {
          return errorResult;
        }
        
        // Continue with retry
        continue;
      }
    }
    
    // All retries exhausted
    return await this.handleToolError(lastError, {
      ...context,
      attempt: this.retryAttempts
    });
  }

  async gracefulShutdown(error, context) {
    this.logger.error('Initiating graceful shutdown due to critical error', {
      error: error.message,
      context
    });
    
    // Save current state
    if (context.stateManager) {
      try {
        await context.stateManager.saveState();
        this.logger.info('State saved successfully before shutdown');
      } catch (saveError) {
        this.logger.error('Failed to save state during shutdown', saveError);
      }
    }
    
    // Clean up resources
    if (context.cleanup) {
      try {
        await context.cleanup();
        this.logger.info('Cleanup completed successfully');
      } catch (cleanupError) {
        this.logger.error('Cleanup failed during shutdown', cleanupError);
      }
    }
    
    return {
      success: false,
      error: 'System shutdown due to critical error',
      shutdown: true
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}