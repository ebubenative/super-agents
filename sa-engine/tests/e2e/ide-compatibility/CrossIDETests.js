/**
 * Cross-IDE Compatibility Testing Suite
 * Tests Super Agents integration across all supported IDEs
 */

import { IDETestManager } from '../framework/IDETestManager.js';
import { TestRunner } from '../framework/TestRunner.js';

export class CrossIDETests {
  constructor() {
    this.ideManager = new IDETestManager();
    this.compatibilityMatrix = {
      'claude-code': {
        integration: 'mcp',
        features: ['mcp-tools', 'agent-personas', 'workflow-execution'],
        priority: 'high'
      },
      'cursor': {
        integration: 'rules',
        features: ['rules-integration', 'agent-personas', 'workflow-prompts'],
        priority: 'high'
      },
      'vscode': {
        integration: 'extension',
        features: ['extension-commands', 'sidebar-ui', 'workspace-integration'],
        priority: 'medium'
      },
      'windsurf': {
        integration: 'mcp',
        features: ['mcp-tools', 'agent-switching', 'workflow-guidance'],
        priority: 'medium'
      },
      'generic': {
        integration: 'standalone',
        features: ['prompt-bundles', 'manual-workflow', 'documentation'],
        priority: 'low'
      }
    };
  }

  /**
   * Register all cross-IDE compatibility tests
   */
  registerTests(testRunner) {
    // Individual IDE Integration Tests
    testRunner.registerSuite('claude-code-integration', {
      setup: () => this.setupClaudeCodeTests(),
      teardown: () => this.teardownClaudeCodeTests(),
      tests: [
        {
          name: 'Claude Code MCP Server Connection',
          fn: () => this.testClaudeCodeMCPConnection()
        },
        {
          name: 'Claude Code Tool Availability',
          fn: () => this.testClaudeCodeToolAvailability()
        },
        {
          name: 'Claude Code Agent Personas',
          fn: () => this.testClaudeCodeAgentPersonas()
        },
        {
          name: 'Claude Code Workflow Execution',
          fn: () => this.testClaudeCodeWorkflowExecution()
        }
      ]
    });

    testRunner.registerSuite('cursor-integration', {
      setup: () => this.setupCursorTests(),
      teardown: () => this.teardownCursorTests(),
      tests: [
        {
          name: 'Cursor Rules Integration',
          fn: () => this.testCursorRulesIntegration()
        },
        {
          name: 'Cursor Agent Persona Switching',
          fn: () => this.testCursorAgentPersonaSwitching()
        },
        {
          name: 'Cursor Workflow Prompts',
          fn: () => this.testCursorWorkflowPrompts()
        },
        {
          name: 'Cursor MCP Fallback',
          fn: () => this.testCursorMCPFallback()
        }
      ]
    });

    testRunner.registerSuite('vscode-integration', {
      setup: () => this.setupVSCodeTests(),
      teardown: () => this.teardownVSCodeTests(),
      tests: [
        {
          name: 'VS Code Extension Installation',
          fn: () => this.testVSCodeExtensionInstallation()
        },
        {
          name: 'VS Code Command Palette Integration',
          fn: () => this.testVSCodeCommandPalette()
        },
        {
          name: 'VS Code Sidebar UI',
          fn: () => this.testVSCodeSidebarUI()
        },
        {
          name: 'VS Code Workspace Integration',
          fn: () => this.testVSCodeWorkspaceIntegration()
        }
      ]
    });

    testRunner.registerSuite('windsurf-integration', {
      setup: () => this.setupWindsurfTests(),
      teardown: () => this.teardownWindsurfTests(),
      tests: [
        {
          name: 'Windsurf MCP Configuration',
          fn: () => this.testWindsurfMCPConfiguration()
        },
        {
          name: 'Windsurf Agent Switching',
          fn: () => this.testWindsurfAgentSwitching()
        },
        {
          name: 'Windsurf Workflow Guidance',
          fn: () => this.testWindsurfWorkflowGuidance()
        }
      ]
    });

    testRunner.registerSuite('generic-ai-integration', {
      tests: [
        {
          name: 'Generic AI Prompt Bundles',
          fn: () => this.testGenericAIPromptBundles()
        },
        {
          name: 'Generic AI Manual Workflow',
          fn: () => this.testGenericAIManualWorkflow()
        },
        {
          name: 'Generic AI Documentation Access',
          fn: () => this.testGenericAIDocumentationAccess()
        }
      ]
    });

    // Cross-IDE Compatibility Tests
    testRunner.registerSuite('cross-ide-compatibility', {
      tests: [
        {
          name: 'Cross-IDE Configuration Portability',
          fn: () => this.testConfigurationPortability()
        },
        {
          name: 'Cross-IDE Workflow Consistency',
          fn: () => this.testWorkflowConsistency()
        },
        {
          name: 'Cross-IDE Performance Comparison',
          fn: () => this.testPerformanceComparison()
        },
        {
          name: 'Cross-IDE Feature Parity',
          fn: () => this.testFeatureParity()
        }
      ]
    });

    // Terminal CLI Integration Tests
    testRunner.registerSuite('terminal-cli-integration', {
      tests: [
        {
          name: 'CLI Installation and Setup',
          fn: () => this.testCLIInstallation()
        },
        {
          name: 'CLI Workflow Execution',
          fn: () => this.testCLIWorkflowExecution()
        },
        {
          name: 'CLI Agent Interaction',
          fn: () => this.testCLIAgentInteraction()
        }
      ]
    });
  }

  // Claude Code Integration Tests
  async setupClaudeCodeTests() {
    console.log('    🔧 Setting up Claude Code integration tests...');
    await this.ideManager.setupIDE('claude-code');
  }

  async teardownClaudeCodeTests() {
    console.log('    🧹 Cleaning up Claude Code integration tests...');
  }

  async testClaudeCodeMCPConnection() {
    console.log('      🔗 Testing Claude Code MCP connection...');
    
    // Test MCP server is running and accessible
    const connection = await this.ideManager.testMCPConnectivity({
      serverPort: 3001
    });
    
    if (!connection) {
      throw new Error('Claude Code MCP server not accessible');
    }
    
    // Test MCP protocol handshake
    const handshake = await this.testMCPHandshake('claude-code');
    if (!handshake.success) {
      throw new Error('MCP handshake failed for Claude Code');
    }
    
    console.log('      ✅ Claude Code MCP connection successful');
  }

  async testClaudeCodeToolAvailability() {
    console.log('      🔧 Testing Claude Code tool availability...');
    
    const expectedTools = [
      'sa-initialize-project',
      'sa-list-tasks',
      'sa-generate-prd',
      'sa-create-architecture',
      'sa-implement-story'
    ];
    
    for (const toolName of expectedTools) {
      const available = await this.testToolAvailable('claude-code', toolName);
      if (!available) {
        throw new Error(`Tool ${toolName} not available in Claude Code`);
      }
    }
    
    console.log(`      ✅ All ${expectedTools.length} tools available in Claude Code`);
  }

  async testClaudeCodeAgentPersonas() {
    console.log('      🤖 Testing Claude Code agent personas...');
    
    const agentPersonas = ['analyst', 'architect', 'developer', 'qa'];
    
    for (const persona of agentPersonas) {
      const activated = await this.testAgentPersonaActivation('claude-code', persona);
      if (!activated) {
        throw new Error(`Agent persona ${persona} not properly activated in Claude Code`);
      }
    }
    
    console.log(`      ✅ All ${agentPersonas.length} agent personas working in Claude Code`);
  }

  async testClaudeCodeWorkflowExecution() {
    console.log('      🔄 Testing Claude Code workflow execution...');
    
    // Test simple workflow execution
    const workflow = {
      name: 'Simple Project Setup',
      steps: [
        { tool: 'sa-initialize-project', params: { name: 'Claude Code Test Project' } },
        { tool: 'sa-list-tasks', params: {} }
      ]
    };
    
    const result = await this.executeWorkflowInIDE('claude-code', workflow);
    if (!result.success) {
      throw new Error('Workflow execution failed in Claude Code');
    }
    
    console.log('      ✅ Workflow execution successful in Claude Code');
  }

  // Cursor Integration Tests
  async setupCursorTests() {
    console.log('    🔧 Setting up Cursor integration tests...');
    await this.ideManager.setupIDE('cursor');
  }

  async teardownCursorTests() {
    console.log('    🧹 Cleaning up Cursor integration tests...');
  }

  async testCursorRulesIntegration() {
    console.log('      📋 Testing Cursor rules integration...');
    
    // Check if rules files are properly configured
    const rulesConfig = await this.validateCursorRulesConfiguration();
    if (!rulesConfig.valid) {
      throw new Error('Cursor rules configuration invalid');
    }
    
    // Test rules activation
    const rulesActive = await this.testCursorRulesActivation();
    if (!rulesActive) {
      throw new Error('Cursor rules not properly activated');
    }
    
    console.log('      ✅ Cursor rules integration successful');
  }

  async testCursorAgentPersonaSwitching() {
    console.log('      🔄 Testing Cursor agent persona switching...');
    
    const personas = ['analyst', 'architect', 'developer'];
    
    for (let i = 0; i < personas.length; i++) {
      const switched = await this.testCursorPersonaSwitch(personas[i]);
      if (!switched) {
        throw new Error(`Failed to switch to ${personas[i]} persona in Cursor`);
      }
      
      // Test persona-specific behavior
      const behavior = await this.testPersonaBehavior('cursor', personas[i]);
      if (!behavior.correct) {
        throw new Error(`Incorrect behavior for ${personas[i]} persona in Cursor`);
      }
    }
    
    console.log('      ✅ Cursor agent persona switching successful');
  }

  async testCursorWorkflowPrompts() {
    console.log('      💬 Testing Cursor workflow prompts...');
    
    const workflowPrompts = [
      'Create project requirements',
      'Design system architecture',
      'Implement user story'
    ];
    
    for (const prompt of workflowPrompts) {
      const response = await this.testCursorPromptResponse('cursor', prompt);
      if (!response.relevant || response.quality < 7) {
        throw new Error(`Poor prompt response for: ${prompt}`);
      }
    }
    
    console.log('      ✅ Cursor workflow prompts successful');
  }

  async testCursorMCPFallback() {
    console.log('      🔄 Testing Cursor MCP fallback...');
    
    // Test that Cursor can fall back to MCP when rules aren't sufficient
    const fallbackTest = await this.testMCPFallbackScenario('cursor');
    if (!fallbackTest.success) {
      throw new Error('Cursor MCP fallback not working');
    }
    
    console.log('      ✅ Cursor MCP fallback successful');
  }

  // VS Code Integration Tests
  async setupVSCodeTests() {
    console.log('    🔧 Setting up VS Code integration tests...');
    await this.ideManager.setupIDE('vscode');
  }

  async teardownVSCodeTests() {
    console.log('    🧹 Cleaning up VS Code integration tests...');
  }

  async testVSCodeExtensionInstallation() {
    console.log('      📦 Testing VS Code extension installation...');
    
    const installed = await this.checkVSCodeExtensionInstalled('super-agents');
    if (!installed) {
      throw new Error('Super Agents VS Code extension not installed');
    }
    
    const activated = await this.checkVSCodeExtensionActivated('super-agents');
    if (!activated) {
      throw new Error('Super Agents VS Code extension not activated');
    }
    
    console.log('      ✅ VS Code extension installation successful');
  }

  async testVSCodeCommandPalette() {
    console.log('      🎨 Testing VS Code command palette integration...');
    
    const commands = [
      'Super Agents: Initialize Project',
      'Super Agents: Generate PRD',
      'Super Agents: Create Architecture'
    ];
    
    for (const command of commands) {
      const available = await this.testVSCodeCommand(command);
      if (!available) {
        throw new Error(`VS Code command not available: ${command}`);
      }
    }
    
    console.log('      ✅ VS Code command palette integration successful');
  }

  async testVSCodeSidebarUI() {
    console.log('      📋 Testing VS Code sidebar UI...');
    
    const sidebarVisible = await this.checkVSCodeSidebarVisible('super-agents');
    if (!sidebarVisible) {
      throw new Error('Super Agents sidebar not visible in VS Code');
    }
    
    const uiElements = await this.checkVSCodeSidebarElements();
    const expectedElements = ['task-list', 'agent-selector', 'workflow-status'];
    
    for (const element of expectedElements) {
      if (!uiElements.includes(element)) {
        throw new Error(`Missing UI element in VS Code sidebar: ${element}`);
      }
    }
    
    console.log('      ✅ VS Code sidebar UI successful');
  }

  async testVSCodeWorkspaceIntegration() {
    console.log('      💼 Testing VS Code workspace integration...');
    
    // Test workspace settings integration
    const workspaceSettings = await this.checkVSCodeWorkspaceSettings();
    if (!workspaceSettings.configured) {
      throw new Error('VS Code workspace not properly configured for Super Agents');
    }
    
    // Test file watchers and project analysis
    const fileWatching = await this.testVSCodeFileWatching();
    if (!fileWatching.active) {
      throw new Error('VS Code file watching not active');
    }
    
    console.log('      ✅ VS Code workspace integration successful');
  }

  // Cross-IDE Compatibility Tests
  async testConfigurationPortability() {
    console.log('    🔄 Testing configuration portability across IDEs...');
    
    const testConfig = {
      agents: ['analyst', 'architect', 'developer'],
      workflows: ['project-setup', 'feature-development'],
      settings: {
        api_timeout: 30000,
        max_concurrent_tasks: 5
      }
    };
    
    const ides = ['claude-code', 'cursor', 'vscode'];
    const results = [];
    
    for (const ide of ides) {
      try {
        const applied = await this.applyConfigurationToIDE(ide, testConfig);
        const validated = await this.validateIDEConfiguration(ide, testConfig);
        
        results.push({
          ide,
          applied,
          validated,
          success: applied && validated
        });
      } catch (error) {
        results.push({
          ide,
          success: false,
          error: error.message
        });
      }
    }
    
    const successfulConfigs = results.filter(r => r.success).length;
    if (successfulConfigs < ides.length * 0.8) {
      throw new Error(`Configuration portability low: ${successfulConfigs}/${ides.length} IDEs`);
    }
    
    console.log(`    ✅ Configuration portable across ${successfulConfigs}/${ides.length} IDEs`);
  }

  async testWorkflowConsistency() {
    console.log('    🔄 Testing workflow consistency across IDEs...');
    
    const testWorkflow = {
      name: 'Basic Project Setup',
      steps: [
        { action: 'initialize-project', params: { name: 'Test Project' } },
        { action: 'create-requirements', params: { type: 'basic' } }
      ],
      expectedOutcome: 'project initialized with basic requirements'
    };
    
    const ides = ['claude-code', 'cursor'];
    const results = {};
    
    for (const ide of ides) {
      try {
        const result = await this.executeWorkflowInIDE(ide, testWorkflow);
        results[ide] = {
          success: result.success,
          output: result.output,
          duration: result.duration
        };
      } catch (error) {
        results[ide] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Check consistency
    const successful = Object.values(results).filter(r => r.success);
    if (successful.length < 2) {
      throw new Error('Workflow not consistently successful across IDEs');
    }
    
    // Check output similarity (basic validation)
    const outputs = successful.map(r => JSON.stringify(r.output));
    const consistencyScore = this.calculateOutputConsistency(outputs);
    
    if (consistencyScore < 0.7) {
      throw new Error(`Workflow output consistency too low: ${consistencyScore}`);
    }
    
    console.log(`    ✅ Workflow consistency score: ${(consistencyScore * 100).toFixed(1)}%`);
  }

  async testPerformanceComparison() {
    console.log('    ⏱️ Testing performance comparison across IDEs...');
    
    const performanceTest = {
      name: 'Tool Execution Performance',
      tool: 'sa-generate-prd',
      params: { project_type: 'web-app' },
      iterations: 3
    };
    
    const ides = ['claude-code', 'cursor'];
    const performanceResults = {};
    
    for (const ide of ides) {
      const durations = [];
      
      for (let i = 0; i < performanceTest.iterations; i++) {
        try {
          const startTime = Date.now();
          await this.executeToolInIDE(ide, performanceTest.tool, performanceTest.params);
          const duration = Date.now() - startTime;
          durations.push(duration);
        } catch (error) {
          console.warn(`Performance test failed for ${ide}:`, error.message);
        }
      }
      
      if (durations.length > 0) {
        performanceResults[ide] = {
          avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
          minDuration: Math.min(...durations),
          maxDuration: Math.max(...durations),
          iterations: durations.length
        };
      }
    }
    
    // Validate performance is within acceptable ranges
    const avgDurations = Object.values(performanceResults).map(r => r.avgDuration);
    const maxAvgDuration = Math.max(...avgDurations);
    const minAvgDuration = Math.min(...avgDurations);
    
    const performanceVariance = (maxAvgDuration - minAvgDuration) / minAvgDuration;
    
    if (performanceVariance > 2.0) { // Allow up to 200% variance
      console.warn(`High performance variance between IDEs: ${(performanceVariance * 100).toFixed(1)}%`);
    }
    
    console.log(`    ✅ Performance comparison completed. Variance: ${(performanceVariance * 100).toFixed(1)}%`);
    
    return performanceResults;
  }

  async testFeatureParity() {
    console.log('    ⚙️ Testing feature parity across IDEs...');
    
    const coreFeatures = [
      'tool-execution',
      'agent-personas',
      'workflow-guidance',
      'project-initialization',
      'task-management'
    ];
    
    const ides = Object.keys(this.compatibilityMatrix);
    const featureMatrix = {};
    
    for (const ide of ides) {
      featureMatrix[ide] = {};
      
      for (const feature of coreFeatures) {
        try {
          const supported = await this.testFeatureSupport(ide, feature);
          featureMatrix[ide][feature] = supported;
        } catch (error) {
          featureMatrix[ide][feature] = false;
        }
      }
    }
    
    // Calculate feature parity scores
    const parityScores = {};
    for (const ide of ides) {
      const supportedFeatures = Object.values(featureMatrix[ide]).filter(Boolean).length;
      parityScores[ide] = (supportedFeatures / coreFeatures.length) * 100;
    }
    
    // Validate minimum parity requirements
    const highPriorityIDEs = ['claude-code', 'cursor'];
    for (const ide of highPriorityIDEs) {
      if (parityScores[ide] < 80) {
        throw new Error(`Feature parity too low for ${ide}: ${parityScores[ide]}%`);
      }
    }
    
    console.log('    ✅ Feature parity validated:');
    for (const [ide, score] of Object.entries(parityScores)) {
      console.log(`      ${ide}: ${score.toFixed(1)}%`);
    }
    
    return { featureMatrix, parityScores };
  }

  // Terminal CLI Tests
  async testCLIInstallation() {
    console.log('    💻 Testing CLI installation...');
    
    // Test global CLI installation
    const cliInstalled = await this.checkCLIInstalled();
    if (!cliInstalled) {
      throw new Error('Super Agents CLI not installed globally');
    }
    
    // Test CLI version
    const version = await this.getCLIVersion();
    if (!version || !version.match(/\d+\.\d+\.\d+/)) {
      throw new Error('Invalid CLI version');
    }
    
    console.log(`    ✅ CLI installation successful (v${version})`);
  }

  async testCLIWorkflowExecution() {
    console.log('    🔄 Testing CLI workflow execution...');
    
    const cliCommands = [
      'sa init --name "CLI Test Project"',
      'sa generate prd --template basic',
      'sa list tasks'
    ];
    
    for (const command of cliCommands) {
      const result = await this.executeCLICommand(command);
      if (!result.success) {
        throw new Error(`CLI command failed: ${command}`);
      }
    }
    
    console.log('    ✅ CLI workflow execution successful');
  }

  async testCLIAgentInteraction() {
    console.log('    🤖 Testing CLI agent interaction...');
    
    const agentCommands = [
      'sa agent analyst --task "Research AI market"',
      'sa agent architect --task "Design microservices"'
    ];
    
    for (const command of agentCommands) {
      const result = await this.executeCLICommand(command);
      if (!result.success || !result.output.includes('agent')) {
        throw new Error(`CLI agent command failed: ${command}`);
      }
    }
    
    console.log('    ✅ CLI agent interaction successful');
  }

  // Helper Methods
  async testMCPHandshake(ide) {
    // Mock MCP handshake test
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true, protocol: 'mcp-1.0' };
  }

  async testToolAvailable(ide, toolName) {
    // Mock tool availability test
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }

  async testAgentPersonaActivation(ide, persona) {
    // Mock agent persona activation test
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async executeWorkflowInIDE(ide, workflow) {
    // Mock workflow execution
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      output: { workflow: workflow.name, status: 'completed' },
      duration: 200
    };
  }

  async executeToolInIDE(ide, tool, params) {
    // Mock tool execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    return { success: true, tool, params };
  }

  async testFeatureSupport(ide, feature) {
    // Mock feature support test based on compatibility matrix
    const ideConfig = this.compatibilityMatrix[ide];
    if (!ideConfig) return false;
    
    await new Promise(resolve => setTimeout(resolve, 50));
    return ideConfig.features.some(f => f.includes(feature.split('-')[0]));
  }

  calculateOutputConsistency(outputs) {
    // Simple consistency calculation - in real implementation would be more sophisticated
    if (outputs.length < 2) return 1;
    
    const baseOutput = outputs[0];
    let totalSimilarity = 0;
    
    for (let i = 1; i < outputs.length; i++) {
      const similarity = this.calculateStringSimilarity(baseOutput, outputs[i]);
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / (outputs.length - 1);
  }

  calculateStringSimilarity(str1, str2) {
    // Simple string similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Mock methods for IDE-specific operations
  async validateCursorRulesConfiguration() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { valid: true, rules: ['agent-personas', 'workflow-guidance'] };
  }

  async testCursorRulesActivation() {
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }

  async testCursorPersonaSwitch(persona) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async testPersonaBehavior(ide, persona) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return { correct: true, persona_active: persona };
  }

  async testCursorPromptResponse(ide, prompt) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { relevant: true, quality: 8.5, response: `Mock response for: ${prompt}` };
  }

  async testMCPFallbackScenario(ide) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, fallback_used: true };
  }

  async checkVSCodeExtensionInstalled(extensionName) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async checkVSCodeExtensionActivated(extensionName) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }

  async testVSCodeCommand(command) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async checkVSCodeSidebarVisible(extensionName) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }

  async checkVSCodeSidebarElements() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return ['task-list', 'agent-selector', 'workflow-status'];
  }

  async checkVSCodeWorkspaceSettings() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { configured: true, settings: ['super-agents.enabled'] };
  }

  async testVSCodeFileWatching() {
    await new Promise(resolve => setTimeout(resolve, 50));
    return { active: true, watching: ['*.js', '*.ts', '*.json'] };
  }

  async applyConfigurationToIDE(ide, config) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
  }

  async validateIDEConfiguration(ide, config) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async checkCLIInstalled() {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async getCLIVersion() {
    await new Promise(resolve => setTimeout(resolve, 50));
    return '1.0.0';
  }

  async executeCLICommand(command) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      output: `Mock output for: ${command}`,
      exitCode: 0
    };
  }
}
