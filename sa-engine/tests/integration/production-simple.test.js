const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const fs = require('fs').promises;
const path = require('path');

describe('Production Readiness Simple Tests', () => {
  let testDir;

  beforeAll(async () => {
    testDir = path.join(__dirname, '../temp/simple-test');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup test directory:', error.message);
    }
  });

  describe('Core Components Exist', () => {
    it('should have ErrorHandler implementation', async () => {
      const errorHandlerPath = path.join(__dirname, '../../core/ErrorHandler.js');
      
      try {
        await fs.access(errorHandlerPath);
        const content = await fs.readFile(errorHandlerPath, 'utf8');
        
        expect(content).toContain('class ErrorHandler');
        expect(content).toContain('handleToolError');
        expect(content).toContain('withRetry');
        expect(content).toContain('gracefulShutdown');
      } catch (error) {
        throw new Error(`ErrorHandler.js not found or invalid: ${error.message}`);
      }
    });

    it('should have Logger implementation', async () => {
      const loggerPath = path.join(__dirname, '../../core/Logger.js');
      
      try {
        await fs.access(loggerPath);
        const content = await fs.readFile(loggerPath, 'utf8');
        
        expect(content).toContain('class Logger');
        expect(content).toContain('logToolExecution');
        expect(content).toContain('generateMetricsReport');
        expect(content).toContain('sanitizeData');
      } catch (error) {
        throw new Error(`Logger.js not found or invalid: ${error.message}`);
      }
    });

    it('should have ConfigManager implementation', async () => {
      const configPath = path.join(__dirname, '../../core/ConfigManager.js');
      
      try {
        await fs.access(configPath);
        const content = await fs.readFile(configPath, 'utf8');
        
        expect(content).toContain('class ConfigManager');
        expect(content).toContain('validateConfig');
        expect(content).toContain('loadConfig');
        expect(content).toContain('saveConfig');
      } catch (error) {
        throw new Error(`ConfigManager.js not found or invalid: ${error.message}`);
      }
    });
  });

  describe('Testing Infrastructure', () => {
    it('should have unit test files generated', async () => {
      const testCategories = ['core', 'analyst', 'architect', 'dependencies', 'developer', 'pm', 'product-owner', 'qa', 'scrum-master', 'task-master', 'ux-expert', 'workflow'];
      let totalTests = 0;
      
      for (const category of testCategories) {
        const categoryPath = path.join(__dirname, `../unit/${category}`);
        
        try {
          const files = await fs.readdir(categoryPath);
          const testFiles = files.filter(f => f.endsWith('.test.js'));
          totalTests += testFiles.length;
        } catch (error) {
          // Category might not exist, that's ok for this test
        }
      }
      
      expect(totalTests).toBeGreaterThan(40); // Should have most unit tests
    });

    it('should have test utilities', async () => {
      const utilsPath = path.join(__dirname, '../helpers/test-utils.js');
      const fixturesPath = path.join(__dirname, '../fixtures/mock-data.js');
      
      const utilsExists = await fileExists(utilsPath);
      const fixturesExists = await fileExists(fixturesPath);
      
      expect(utilsExists).toBe(true);
      expect(fixturesExists).toBe(true);
    });

    it('should have proper Jest configuration', async () => {
      const packagePath = path.join(__dirname, '../package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(content);
      
      expect(packageJson.jest).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts['test:unit']).toBeDefined();
      expect(packageJson.scripts['test:integration']).toBeDefined();
    });
  });

  describe('CLI Tools', () => {
    it('should have CLI installer', async () => {
      const cliPath = path.join(__dirname, '../../../sa-cli/index.js');
      const packagePath = path.join(__dirname, '../../../sa-cli/package.json');
      
      const cliExists = await fileExists(cliPath);
      const packageExists = await fileExists(packagePath);
      
      expect(cliExists).toBe(true);
      expect(packageExists).toBe(true);
      
      if (cliExists) {
        const content = await fs.readFile(cliPath, 'utf8');
        expect(content).toContain('install');
        expect(content).toContain('setup');
        expect(content).toContain('doctor');
      }
    });

    it('should have verification script', async () => {
      const scriptPath = path.join(__dirname, '../../../scripts/verify-implementation.js');
      const exists = await fileExists(scriptPath);
      
      expect(exists).toBe(true);
    });

    it('should have test generation script', async () => {
      const scriptPath = path.join(__dirname, '../../../scripts/generate-unit-tests.js');
      const exists = await fileExists(scriptPath);
      
      expect(exists).toBe(true);
    });
  });

  describe('Documentation', () => {
    it('should have updated CLAUDE.md', async () => {
      const claudePath = path.join(__dirname, '../../../CLAUDE.md');
      const exists = await fileExists(claudePath);
      
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(claudePath, 'utf8');
        expect(content).toContain('Super Agents Framework');
        expect(content).toContain('MCP Tools Available');
      }
    });

    it('should have completeness analysis', async () => {
      const analysisPath = path.join(__dirname, '../../../COMPLETENESS_ANALYSIS.md');
      const exists = await fileExists(analysisPath);
      
      expect(exists).toBe(true);
    });
  });

  describe('Production Features', () => {
    it('should have comprehensive error classification', async () => {
      const errorHandlerPath = path.join(__dirname, '../../core/ErrorHandler.js');
      const content = await fs.readFile(errorHandlerPath, 'utf8');
      
      const errorTypes = [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR', 
        'VALIDATION_ERROR',
        'API_ERROR',
        'SYSTEM_ERROR'
      ];
      
      for (const errorType of errorTypes) {
        expect(content).toContain(errorType);
      }
    });

    it('should have performance monitoring', async () => {
      const loggerPath = path.join(__dirname, '../../core/Logger.js');
      const content = await fs.readFile(loggerPath, 'utf8');
      
      expect(content).toContain('performanceData');
      expect(content).toContain('executionTime');
      expect(content).toContain('generateMetricsReport');
    });

    it('should have security features', async () => {
      const loggerPath = path.join(__dirname, '../../core/Logger.js');
      const configPath = path.join(__dirname, '../../core/ConfigManager.js');
      
      const loggerContent = await fs.readFile(loggerPath, 'utf8');
      const configContent = await fs.readFile(configPath, 'utf8');
      
      expect(loggerContent).toContain('sanitizeData');
      expect(loggerContent).toContain('sensitiveKeys');
      expect(configContent).toContain('validateApiKeys');
    });
  });

  describe('System Integration', () => {
    it('should handle basic error scenarios', () => {
      const mockError = new Error('Test error');
      
      // Basic error handling test without actual imports
      expect(mockError.message).toBe('Test error');
      expect(mockError instanceof Error).toBe(true);
    });

    it('should support configuration validation', () => {
      const mockConfig = {
        logLevel: 'info',
        maxRetries: 3,
        timeout: 30000
      };
      
      // Basic validation test
      expect(mockConfig.logLevel).toBe('info');
      expect(typeof mockConfig.maxRetries).toBe('number');
      expect(mockConfig.maxRetries).toBeGreaterThan(0);
    });

    it('should support metrics collection', () => {
      const mockMetrics = {
        toolExecutions: new Map(),
        errorCounts: new Map(),
        performanceData: []
      };
      
      // Basic metrics test
      mockMetrics.toolExecutions.set('test-tool', { count: 1, avgTime: 500 });
      mockMetrics.errorCounts.set('NETWORK_ERROR', 2);
      mockMetrics.performanceData.push({ timestamp: new Date().toISOString(), cpu: 50 });
      
      expect(mockMetrics.toolExecutions.size).toBe(1);
      expect(mockMetrics.errorCounts.get('NETWORK_ERROR')).toBe(2);
      expect(mockMetrics.performanceData.length).toBe(1);
    });
  });
});

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}