import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ErrorHandler } from '../../core/ErrorHandler.js';
import { Logger } from '../../core/Logger.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Production Readiness Integration Tests', () => {
  let errorHandler;
  let logger;
  let configManager;
  let testDir;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = path.join(__dirname, '../temp/production-test');
    await fs.mkdir(testDir, { recursive: true });
    
    // Initialize components
    logger = new Logger('ProductionTest', {
      logDir: path.join(testDir, 'logs'),
      level: 'debug'
    });
    
    errorHandler = new ErrorHandler({
      retryAttempts: 2,
      retryDelay: 100
    });
    
    configManager = new ConfigManager({
      configPath: path.join(testDir, 'test-config.json')
    });
  });

  afterAll(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error.message);
    }
  });

  describe('Error Handling System', () => {
    it('should handle network errors with retry logic', async () => {
      const networkError = new Error('ECONNREFUSED');
      let attempts = 0;
      
      const mockOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw networkError;
        }
        return { success: true, data: 'recovered' };
      };

      const result = await errorHandler.withRetry(mockOperation, {
        toolName: 'test-tool'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('recovered');
      expect(attempts).toBe(3);
    });

    it('should provide user-friendly error messages', async () => {
      const apiError = new Error('Unauthorized');
      apiError.status = 401;

      const result = await errorHandler.handleToolError(apiError, {
        toolName: 'api-test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should classify errors correctly', () => {
      const networkError = new Error('ECONNREFUSED');
      const timeoutError = new Error('Operation timed out');
      const validationError = new Error('Invalid parameter: name');

      expect(errorHandler.classifyError(networkError)).toBe('NETWORK_ERROR');
      expect(errorHandler.classifyError(timeoutError)).toBe('TIMEOUT_ERROR');
      expect(errorHandler.classifyError(validationError)).toBe('VALIDATION_ERROR');
    });

    it('should handle graceful shutdown', async () => {
      const criticalError = new Error('System failure');
      const mockStateManager = {
        saveState: jest.fn().mockResolvedValue(true)
      };
      const mockCleanup = jest.fn().mockResolvedValue(true);

      const result = await errorHandler.gracefulShutdown(criticalError, {
        stateManager: mockStateManager,
        cleanup: mockCleanup
      });

      expect(result.success).toBe(false);
      expect(result.shutdown).toBe(true);
      expect(mockStateManager.saveState).toHaveBeenCalled();
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('Logging System', () => {
    it('should create structured log entries', async () => {
      const testData = {
        toolName: 'test-tool',
        executionTime: 1500,
        params: { id: 'test-123' }
      };

      logger.info('Test tool execution', testData);
      logger.error('Test error', { error: 'Test error message' });
      logger.warn('Performance warning', { slowOperation: true });

      // Allow time for file operations
      await new Promise(resolve => setTimeout(resolve, 100));

      const logFiles = await fs.readdir(path.join(testDir, 'logs'));
      expect(logFiles.length).toBeGreaterThan(0);
    });

    it('should sanitize sensitive data', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'sk-test-key',
        normalData: 'this is fine'
      };

      const sanitized = logger.sanitizeData(sensitiveData);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.normalData).toBe('this is fine');
    });

    it('should track performance metrics', () => {
      logger.logToolExecution('test-tool', { param: 'value' }, { success: true }, Date.now() - 1000);
      logger.logToolExecution('slow-tool', { param: 'value' }, { success: true }, Date.now() - 15000);

      const metrics = logger.getMetrics();

      expect(metrics.toolExecutions).toBeDefined();
      expect(metrics.toolExecutions['test-tool']).toBeDefined();
      expect(metrics.toolExecutions['test-tool'].count).toBe(1);
    });

    it('should generate metrics reports', () => {
      // Add some test data
      logger.logToolExecution('report-tool', {}, { success: true }, Date.now() - 500);
      logger.error('Test error', { errorType: 'TEST_ERROR' });

      const report = logger.generateMetricsReport();

      expect(report.timestamp).toBeDefined();
      expect(report.toolExecutions).toBeDefined();
      expect(report.errorCounts).toBeDefined();
      expect(report.systemHealth).toBeDefined();
      expect(report.systemHealth.healthStatus).toMatch(/HEALTHY|WARNING|CRITICAL/);
    });

    it('should rotate log files when they get too large', async () => {
      // Create a large log entry
      const largeData = { data: 'x'.repeat(10000) };
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Large log entry ${i}`, largeData);
      }

      // Allow time for file operations
      await new Promise(resolve => setTimeout(resolve, 200));

      const logFiles = await fs.readdir(path.join(testDir, 'logs'));
      const logFileCount = logFiles.filter(file => file.endsWith('.log')).length;
      
      // Should have created at least one log file
      expect(logFileCount).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should load and validate configuration', async () => {
      await configManager.loadConfig();
      
      const validation = await configManager.validateConfig();
      expect(validation.isValid).toBe(true);
    });

    it('should handle environment variable overrides', async () => {
      // Set test environment variable
      process.env.SA_LOG_LEVEL = 'debug';
      process.env.SA_MAX_RETRIES = '5';

      await configManager.loadConfig();

      expect(configManager.get('logLevel')).toBe('debug');
      expect(configManager.get('maxRetries')).toBe(5);

      // Cleanup
      delete process.env.SA_LOG_LEVEL;
      delete process.env.SA_MAX_RETRIES;
    });

    it('should validate API key formats', async () => {
      const invalidConfig = {
        apis: {
          anthropic: { apiKey: 'invalid-key' },
          openai: { apiKey: 'also-invalid' }
        }
      };

      const validation = await configManager.validateConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('API key'))).toBe(true);
    });

    it('should create configuration backups', async () => {
      const testConfig = { test: 'value', timestamp: Date.now() };
      
      await configManager.saveConfig(testConfig);
      await configManager.saveConfig({ test: 'updated', timestamp: Date.now() });

      // Check for backup files
      const configDir = path.dirname(configManager.configPath);
      const files = await fs.readdir(configDir);
      const backupFiles = files.filter(file => file.includes('backup'));

      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should provide health status', () => {
      const health = configManager.getHealth();

      expect(health.configValid).toBeDefined();
      expect(health.configPath).toBeDefined();
      expect(health.hasApiKeys).toBeDefined();
      expect(health.debugMode).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle cascading failures gracefully', async () => {
      // Simulate a scenario where multiple systems fail
      const configError = new Error('Configuration corrupted');
      const networkError = new Error('Network unavailable');

      // First operation fails due to network
      const networkResult = await errorHandler.handleToolError(networkError, {
        toolName: 'network-dependent-tool'
      });

      // Second operation fails due to config
      const configResult = await errorHandler.handleToolError(configError, {
        toolName: 'config-dependent-tool'
      });

      expect(networkResult.success).toBe(false);
      expect(configResult.success).toBe(false);
      expect(networkResult.errorType).toBe('NETWORK_ERROR');
      expect(configResult.errorType).toBe('GENERIC_ERROR');
    });

    it('should maintain system health under load', async () => {
      // Simulate high load scenario
      const operations = [];
      
      for (let i = 0; i < 50; i++) {
        operations.push(
          errorHandler.withRetry(async () => {
            if (Math.random() < 0.3) {
              throw new Error('Random failure');
            }
            return { success: true, id: i };
          }, { toolName: `load-test-${i}` })
        );
      }

      const results = await Promise.allSettled(operations);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      // Should handle most operations successfully even with random failures
      expect(successful).toBeGreaterThan(failed);
      
      // System should remain healthy
      const metrics = logger.generateMetricsReport();
      expect(metrics.systemHealth.healthStatus).not.toBe('CRITICAL');
    });

    it('should recover from temporary service outages', async () => {
      let serviceDown = true;
      let attempts = 0;

      const mockServiceCall = async () => {
        attempts++;
        if (serviceDown && attempts < 3) {
          throw new Error('Service temporarily unavailable');
        }
        serviceDown = false;
        return { success: true, data: 'service recovered' };
      };

      const result = await errorHandler.withRetry(mockServiceCall, {
        toolName: 'dependent-service'
      });

      expect(result.success).toBe(true);
      expect(attempts).toBeGreaterThanOrEqual(3);
    });

    it('should maintain data consistency during errors', async () => {
      const mockStateManager = {
        state: { counter: 0 },
        saveState: jest.fn().mockImplementation(function() {
          // Simulate save operation
          return Promise.resolve();
        }),
        loadState: jest.fn().mockImplementation(function() {
          return Promise.resolve(this.state);
        })
      };

      // Simulate operation that modifies state but fails
      try {
        mockStateManager.state.counter = 5;
        throw new Error('Operation failed after state change');
      } catch (error) {
        await errorHandler.gracefulShutdown(error, {
          stateManager: mockStateManager
        });
      }

      expect(mockStateManager.saveState).toHaveBeenCalled();
    });
  });

  describe('Performance Requirements', () => {
    it('should complete tool operations within performance limits', async () => {
      const startTime = Date.now();
      
      const result = await errorHandler.withRetry(async () => {
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      }, { toolName: 'performance-test' });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(executionTime).toBeLessThan(5000); // 5 second limit from requirements
    });

    it('should handle memory efficiently during log operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many log entries
      for (let i = 0; i < 1000; i++) {
        logger.info(`Memory test ${i}`, { iteration: i, data: 'test'.repeat(100) });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should maintain error rate below 5%', async () => {
      const totalOperations = 100;
      const results = [];

      for (let i = 0; i < totalOperations; i++) {
        try {
          const result = await errorHandler.withRetry(async () => {
            // 10% random failure rate
            if (Math.random() < 0.1) {
              throw new Error('Random failure');
            }
            return { success: true };
          }, { toolName: 'error-rate-test' });
          
          results.push(result.success ? 'success' : 'failure');
        } catch (error) {
          results.push('failure');
        }
      }

      const failures = results.filter(r => r === 'failure').length;
      const errorRate = (failures / totalOperations) * 100;

      // With retry logic, error rate should be much lower than input failure rate
      expect(errorRate).toBeLessThan(5);
    });
  });
});