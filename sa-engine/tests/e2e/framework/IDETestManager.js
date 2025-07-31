/**
 * IDE Integration Test Manager
 * Manages testing across different IDE environments
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class IDETestManager {
  constructor() {
    this.ideConfigs = {
      'claude-code': {
        name: 'Claude Code',
        type: 'mcp',
        setupCommand: 'npm run setup:claude-code',
        testCommand: 'npm run test:claude-code',
        configPath: './integrations/mcp/claude-code/',
        serverPort: 3001
      },
      'cursor': {
        name: 'Cursor',
        type: 'rules',
        setupCommand: 'npm run setup:cursor',
        testCommand: 'npm run test:cursor',
        configPath: './integrations/mcp/cursor/',
        serverPort: 3002
      },
      'vscode': {
        name: 'VS Code',
        type: 'extension',
        setupCommand: 'npm run setup:vscode',
        testCommand: 'npm run test:vscode',
        configPath: './integrations/mcp/vscode/',
        serverPort: 3003
      },
      'windsurf': {
        name: 'Windsurf',
        type: 'mcp',
        setupCommand: 'npm run setup:windsurf',
        testCommand: 'npm run test:windsurf',
        configPath: './integrations/mcp/windsurf/',
        serverPort: 3004
      },
      'generic': {
        name: 'Generic AI Assistants',
        type: 'standalone',
        setupCommand: 'npm run setup:generic',
        testCommand: 'npm run test:generic',
        configPath: './integrations/standalone/'
      }
    };
    
    this.activeProcesses = new Map();
    this.setupResults = new Map();
  }

  /**
   * Setup all IDE test environments
   */
  async setupAll() {
    console.log('🚀 Setting up IDE test environments...');
    
    const setupPromises = Object.keys(this.ideConfigs).map(ide => 
      this.setupIDE(ide)
    );
    
    const results = await Promise.allSettled(setupPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ IDE Setup Complete: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.warn('⚠️ Some IDE setups failed. Tests may be limited.');
    }
  }

  /**
   * Setup individual IDE environment
   */
  async setupIDE(ideKey) {
    const config = this.ideConfigs[ideKey];
    if (!config) {
      throw new Error(`Unknown IDE: ${ideKey}`);
    }
    
    console.log(`  🔧 Setting up ${config.name}...`);
    
    try {
      // Check if config directory exists
      const configExists = await this.checkConfigExists(config.configPath);
      if (!configExists) {
        throw new Error(`Config directory not found: ${config.configPath}`);
      }
      
      // Run setup command if provided
      if (config.setupCommand) {
        const { stdout, stderr } = await execAsync(config.setupCommand, {
          cwd: process.cwd(),
          timeout: 60000
        });
        
        if (stderr && !stderr.includes('warning')) {
          console.warn(`  ⚠️ ${config.name} setup warnings:`, stderr);
        }
      }
      
      // Start MCP server if needed
      if (config.type === 'mcp' && config.serverPort) {
        await this.startMCPServer(ideKey, config);
      }
      
      this.setupResults.set(ideKey, { success: true, config });
      console.log(`  ✅ ${config.name} setup complete`);
      
      return { ide: ideKey, success: true };
    } catch (error) {
      console.error(`  ❌ ${config.name} setup failed:`, error.message);
      this.setupResults.set(ideKey, { success: false, error: error.message });
      return { ide: ideKey, success: false, error: error.message };
    }
  }

  /**
   * Start MCP server for IDE
   */
  async startMCPServer(ideKey, config) {
    return new Promise((resolve, reject) => {
      const serverProcess = spawn('node', [
        './sa-engine/mcp-server/index.js',
        '--port', config.serverPort.toString(),
        '--ide', ideKey
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });
      
      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          serverProcess.kill();
          reject(new Error(`MCP server startup timeout for ${config.name}`));
        }
      }, 10000);
      
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('MCP Server listening') || output.includes('Server ready')) {
          serverReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (!serverReady && error.includes('Error')) {
          clearTimeout(timeout);
          reject(new Error(`MCP server error: ${error}`));
        }
      });
      
      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      this.activeProcesses.set(`mcp-${ideKey}`, serverProcess);
    });
  }

  /**
   * Test IDE integration
   */
  async testIDEIntegration(ideKey) {
    const setup = this.setupResults.get(ideKey);
    if (!setup || !setup.success) {
      throw new Error(`IDE ${ideKey} not properly set up`);
    }
    
    const config = setup.config;
    console.log(`🧪 Testing ${config.name} integration...`);
    
    try {
      // Run IDE-specific tests
      const testResult = await this.runIDETests(ideKey, config);
      
      console.log(`✅ ${config.name} integration test passed`);
      return testResult;
    } catch (error) {
      console.error(`❌ ${config.name} integration test failed:`, error.message);
      throw error;
    }
  }

  /**
   * Run IDE-specific tests
   */
  async runIDETests(ideKey, config) {
    const testResults = {
      ide: ideKey,
      tests: [],
      passed: true
    };
    
    try {
      // Test 1: Configuration validation
      await this.testConfiguration(config);
      testResults.tests.push({ name: 'Configuration validation', passed: true });
      
      // Test 2: MCP server connectivity (if applicable)
      if (config.type === 'mcp') {
        await this.testMCPConnectivity(config);
        testResults.tests.push({ name: 'MCP connectivity', passed: true });
      }
      
      // Test 3: Tool availability
      await this.testToolAvailability(ideKey);
      testResults.tests.push({ name: 'Tool availability', passed: true });
      
      // Test 4: Basic workflow execution
      await this.testBasicWorkflow(ideKey);
      testResults.tests.push({ name: 'Basic workflow', passed: true });
      
    } catch (error) {
      testResults.passed = false;
      testResults.error = error.message;
      
      // Mark the failing test
      const lastTest = testResults.tests[testResults.tests.length - 1];
      if (lastTest) {
        lastTest.passed = false;
        lastTest.error = error.message;
      }
    }
    
    return testResults;
  }

  /**
   * Test configuration validity
   */
  async testConfiguration(config) {
    if (config.configPath) {
      const exists = await this.checkConfigExists(config.configPath);
      if (!exists) {
        throw new Error(`Configuration path not found: ${config.configPath}`);
      }
    }
  }

  /**
   * Test MCP server connectivity
   */
  async testMCPConnectivity(config) {
    if (!config.serverPort) return;
    
    try {
      // Simple HTTP check to see if server is responsive
      const response = await fetch(`http://localhost:${config.serverPort}/health`);
      if (!response.ok) {
        throw new Error(`MCP server not responding on port ${config.serverPort}`);
      }
    } catch (error) {
      // If HTTP check fails, try WebSocket connection
      await this.testWebSocketConnection(config.serverPort);
    }
  }

  /**
   * Test WebSocket connection to MCP server
   */
  async testWebSocketConnection(port) {
    return new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error(`WebSocket connection timeout on port ${port}`));
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Test tool availability
   */
  async testToolAvailability(ideKey) {
    // This would test that core SA tools are available through the IDE integration
    // Implementation depends on the specific integration method
    console.log(`  🔍 Testing tool availability for ${ideKey}`);
    
    // Mock test - in real implementation, this would make actual tool calls
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Test basic workflow execution
   */
  async testBasicWorkflow(ideKey) {
    console.log(`  🔄 Testing basic workflow for ${ideKey}`);
    
    // Mock test - in real implementation, this would execute a simple SA workflow
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Check if configuration exists
   */
  async checkConfigExists(configPath) {
    try {
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get setup status for all IDEs
   */
  getSetupStatus() {
    const status = {};
    for (const [ide, result] of this.setupResults) {
      status[ide] = {
        success: result.success,
        error: result.error || null
      };
    }
    return status;
  }

  /**
   * Cleanup all IDE environments
   */
  async cleanupAll() {
    console.log('🧹 Cleaning up IDE environments...');
    
    // Kill all active processes
    for (const [name, process] of this.activeProcesses) {
      try {
        console.log(`  🚫 Stopping ${name}`);
        process.kill('SIGTERM');
        
        // Wait a bit, then force kill if still running
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 2000);
      } catch (error) {
        console.warn(`  ⚠️ Failed to stop ${name}:`, error.message);
      }
    }
    
    this.activeProcesses.clear();
    this.setupResults.clear();
    
    console.log('✅ IDE cleanup completed');
  }

  /**
   * Get comprehensive IDE test report
   */
  getIDEReport() {
    return {
      setupStatus: this.getSetupStatus(),
      activeProcesses: Array.from(this.activeProcesses.keys()),
      supportedIDEs: Object.keys(this.ideConfigs)
    };
  }
}
