const path = require('path');
const os = require('os');

/**
 * Windsurf MCP Server Configuration
 * Provides Windsurf-specific configurations for the Super Agents MCP server
 */
class WindsurfMCPConfig {
  constructor() {
    this.projectRoot = process.env.SA_PROJECT_ROOT || process.cwd();
    this.ideContext = process.env.SA_IDE_CONTEXT || 'windsurf';
  }

  /**
   * Get Windsurf-specific MCP configuration
   */
  getConfig() {
    return {
      server: {
        name: 'super-agents-windsurf',
        version: '1.0.0',
        description: 'Super Agents Framework for Windsurf IDE'
      },
      tools: {
        // Windsurf-optimized tool configurations
        responseFormat: 'windsurf-optimized',
        contextAware: true,
        aiIntegration: true
      },
      windsurf: {
        // Windsurf-specific optimizations
        aiCapabilities: {
          codeGeneration: true,
          contextUnderstanding: true,
          multiFileEditing: true,
          intelligentSuggestions: true
        },
        interface: {
          streamingResponses: true,
          progressIndicators: true,
          errorHandling: 'windsurf-native',
          toolTips: true
        },
        performance: {
          caching: true,
          batchOperations: true,
          asyncProcessing: true,
          memoryOptimization: true
        }
      },
      environment: {
        projectRoot: this.projectRoot,
        ideContext: this.ideContext,
        platform: os.platform(),
        nodeVersion: process.version
      }
    };
  }

  /**
   * Get Windsurf MCP server configuration path
   */
  getConfigPath() {
    const homeDir = os.homedir();
    const windsurfDir = path.join(homeDir, '.windsurf');
    return path.join(windsurfDir, 'mcp_servers.json');
  }

  /**
   * Generate Windsurf MCP server registration
   */
  generateServerRegistration() {
    const serverPath = path.resolve(__dirname, '../../../sa-engine/mcp-server/index.js');
    
    return {
      "super-agents": {
        "command": "node",
        "args": [serverPath],
        "env": {
          "SA_PROJECT_ROOT": this.projectRoot,
          "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
          "OPENAI_API_KEY": "${OPENAI_API_KEY}",
          "SA_LOG_LEVEL": "info",
          "SA_IDE_CONTEXT": "windsurf"
        }
      }
    };
  }

  /**
   * Validate Windsurf environment
   */
  validateEnvironment() {
    const validation = {
      valid: true,
      issues: [],
      warnings: []
    };

    // Check for required environment variables
    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      validation.issues.push('Missing AI provider API keys (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
      validation.valid = false;
    }

    // Check project structure
    const requiredPaths = [
      path.join(this.projectRoot, 'sa-engine'),
      path.join(this.projectRoot, 'sa-engine/mcp-server'),
      path.join(this.projectRoot, 'sa-engine/mcp-server/index.js')
    ];

    for (const requiredPath of requiredPaths) {
      try {
        require('fs').accessSync(requiredPath);
      } catch (error) {
        validation.issues.push(`Missing required path: ${requiredPath}`);
        validation.valid = false;
      }
    }

    return validation;
  }
}

module.exports = WindsurfMCPConfig;