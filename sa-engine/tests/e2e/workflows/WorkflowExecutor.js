/**
 * Workflow Executor for Testing
 * Executes agent workflows and validates outputs
 */

import { MCPClient } from '../../helpers/MCPClient.js';
import { AgentContext } from '../fixtures/AgentContext.js';

export class WorkflowExecutor {
  constructor() {
    this.mcpClient = null;
    this.agentContext = new AgentContext();
    this.activeWorkflows = new Map();
    this.executionHistory = [];
  }

  /**
   * Initialize workflow executor
   */
  async initialize() {
    console.log('    🔧 Initializing workflow executor...');
    
    // Initialize MCP client connection
    this.mcpClient = new MCPClient({
      serverUrl: 'ws://localhost:3001',
      timeout: 30000
    });
    
    await this.mcpClient.connect();
    
    // Initialize agent contexts
    await this.agentContext.initialize();
    
    console.log('    ✅ Workflow executor initialized');
  }

  /**
   * Cleanup workflow executor
   */
  async cleanup() {
    console.log('    🧹 Cleaning up workflow executor...');
    
    if (this.mcpClient) {
      await this.mcpClient.disconnect();
    }
    
    await this.agentContext.cleanup();
    this.activeWorkflows.clear();
    
    console.log('    ✅ Workflow executor cleaned up');
  }

  /**
   * Initialize agent contexts
   */
  async initializeAgents() {
    await this.agentContext.initializeAllAgents();
  }

  /**
   * Cleanup agent contexts
   */
  async cleanupAgents() {
    await this.agentContext.cleanupAllAgents();
  }

  /**
   * Execute analyst workflow
   */
  async executeAnalystWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('analyst', workflowConfig);
  }

  /**
   * Execute PM workflow
   */
  async executePMWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('pm', workflowConfig);
  }

  /**
   * Execute architect workflow
   */
  async executeArchitectWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('architect', workflowConfig);
  }

  /**
   * Execute UX workflow
   */
  async executeUXWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('ux-expert', workflowConfig);
  }

  /**
   * Execute scrum master workflow
   */
  async executeScrumMasterWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('scrum-master', workflowConfig);
  }

  /**
   * Execute developer workflow
   */
  async executeDeveloperWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('developer', workflowConfig);
  }

  /**
   * Execute QA workflow
   */
  async executeQAWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('qa', workflowConfig);
  }

  /**
   * Execute product owner workflow
   */
  async executeProductOwnerWorkflow(workflowConfig) {
    return this.executeAgentWorkflow('product-owner', workflowConfig);
  }

  /**
   * Execute agent workflow
   */
  async executeAgentWorkflow(agentType, workflowConfig) {
    const workflowId = `${agentType}-${Date.now()}`;
    const startTime = Date.now();
    
    console.log(`      🤖 Executing ${agentType} workflow: ${workflowConfig.tool}`);
    
    try {
      // Set agent context
      await this.agentContext.setActiveAgent(agentType);
      
      // Track active workflow
      this.activeWorkflows.set(workflowId, {
        agentType,
        tool: workflowConfig.tool,
        startTime,
        status: 'running'
      });
      
      // Execute the tool through MCP
      const result = await this.mcpClient.callTool(
        workflowConfig.tool,
        workflowConfig.params || {}
      );
      
      const duration = Date.now() - startTime;
      
      // Validate result structure
      const validatedResult = this.validateToolResult(result, workflowConfig.tool);
      
      // Update workflow status
      this.activeWorkflows.set(workflowId, {
        ...this.activeWorkflows.get(workflowId),
        status: 'completed',
        duration,
        result: validatedResult
      });
      
      // Add to execution history
      this.executionHistory.push({
        workflowId,
        agentType,
        tool: workflowConfig.tool,
        params: workflowConfig.params,
        result: validatedResult,
        duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`      ✅ ${agentType} workflow completed (${duration}ms)`);
      
      return {
        success: true,
        agentType,
        tool: workflowConfig.tool,
        input: workflowConfig.params,
        output: validatedResult,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update workflow status with error
      this.activeWorkflows.set(workflowId, {
        ...this.activeWorkflows.get(workflowId),
        status: 'failed',
        duration,
        error: error.message
      });
      
      console.error(`      ❌ ${agentType} workflow failed: ${error.message}`);
      
      return {
        success: false,
        agentType,
        tool: workflowConfig.tool,
        input: workflowConfig.params,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Execute sequential dependencies
   */
  async executeSequentialDependencies(dependencyChain) {
    const results = [];
    let previousOutput = null;
    
    for (const task of dependencyChain) {
      // Merge previous output into current params if dependency exists
      let params = { ...task.params };
      
      if (task.dependsOn && previousOutput) {
        params = {
          ...params,
          dependency_input: previousOutput,
          previous_step_output: previousOutput
        };
      }
      
      const result = await this.executeSingleTask({
        ...task,
        params
      });
      
      if (!result.success) {
        throw new Error(`Sequential dependency failed at step: ${task.name}`);
      }
      
      results.push(result);
      previousOutput = result.output;
    }
    
    return results;
  }

  /**
   * Execute parallel tasks
   */
  async executeParallelTasks(tasks) {
    const promises = tasks.map(task => this.executeSingleTask(task));
    const results = await Promise.all(promises);
    
    // Check if any tasks failed
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      throw new Error(`${failures.length} parallel tasks failed`);
    }
    
    return results;
  }

  /**
   * Execute single task
   */
  async executeSingleTask(task) {
    // Determine agent type from tool name
    const agentType = this.determineAgentFromTool(task.tool);
    
    return this.executeAgentWorkflow(agentType, {
      tool: task.tool,
      params: task.params
    });
  }

  /**
   * Determine agent type from tool name
   */
  determineAgentFromTool(toolName) {
    const toolAgentMap = {
      // Analyst tools
      'sa-brainstorm-session': 'analyst',
      'sa-competitor-analysis': 'analyst',
      'sa-create-brief': 'analyst',
      'sa-research-market': 'analyst',
      
      // PM tools
      'sa-create-epic': 'pm',
      'sa-generate-prd': 'pm',
      'sa-prioritize-features': 'pm',
      'sa-stakeholder-analysis': 'pm',
      
      // Architect tools
      'sa-analyze-brownfield': 'architect',
      'sa-create-architecture': 'architect',
      'sa-design-system': 'architect',
      'sa-tech-recommendations': 'architect',
      
      // UX Expert tools
      'sa-accessibility-audit': 'ux-expert',
      'sa-create-frontend-spec': 'ux-expert',
      'sa-design-wireframes': 'ux-expert',
      'sa-generate-ui-prompt': 'ux-expert',
      
      // Developer tools
      'sa-debug-issue': 'developer',
      'sa-implement-story': 'developer',
      'sa-run-tests': 'developer',
      'sa-validate-implementation': 'developer',
      
      // QA tools
      'sa-refactor-code': 'qa',
      'sa-review-code': 'qa',
      'sa-review-story': 'qa',
      'sa-validate-quality': 'qa',
      
      // Scrum Master tools
      'sa-create-next-story': 'scrum-master',
      'sa-create-story': 'scrum-master',
      'sa-track-progress': 'scrum-master',
      'sa-update-workflow': 'scrum-master',
      
      // Product Owner tools
      'sa-correct-course': 'product-owner',
      'sa-execute-checklist': 'product-owner',
      'sa-shard-document': 'product-owner',
      'sa-validate-story-draft': 'product-owner',
      
      // Core tools
      'sa-get-task': 'core',
      'sa-initialize-project': 'core',
      'sa-list-tasks': 'core',
      'sa-update-task-status': 'core'
    };
    
    return toolAgentMap[toolName] || 'core';
  }

  /**
   * Validate tool result structure
   */
  validateToolResult(result, toolName) {
    if (!result) {
      throw new Error(`Tool ${toolName} returned null/undefined result`);
    }
    
    // Basic validation - all tools should return structured data
    if (typeof result !== 'object') {
      throw new Error(`Tool ${toolName} should return object, got: ${typeof result}`);
    }
    
    // Mock validation - in real implementation would have tool-specific validation
    const mockResult = {
      tool: toolName,
      timestamp: new Date().toISOString(),
      status: 'completed',
      ...result,
      // Add mock content based on tool type
      content: this.generateMockContent(toolName)
    };
    
    return mockResult;
  }

  /**
   * Generate mock content for testing
   */
  generateMockContent(toolName) {
    const mockContents = {
      'sa-research-market': {
        market_size: '$2.5B',
        growth_rate: '15% YoY',
        key_trends: ['AI integration', 'Mobile-first', 'Sustainability'],
        competitors: ['CompetitorA', 'CompetitorB', 'CompetitorC']
      },
      'sa-generate-prd': {
        title: 'Product Requirements Document',
        epics: [
          {
            title: 'User Management',
            stories: [
              { title: 'User Registration', priority: 'High' },
              { title: 'User Authentication', priority: 'High' }
            ]
          }
        ],
        success_metrics: ['User acquisition', 'User engagement']
      },
      'sa-create-architecture': {
        architecture_type: 'microservices',
        components: [
          { name: 'API Gateway', type: 'service' },
          { name: 'User Service', type: 'service' },
          { name: 'Database', type: 'data' }
        ],
        technology_stack: ['Node.js', 'PostgreSQL', 'Redis']
      },
      'sa-implement-story': {
        implementation: {
          files_created: ['user.controller.js', 'user.service.js', 'user.model.js'],
          tests_created: ['user.test.js'],
          code: 'Mock implementation code...',
          documentation: 'Implementation documentation...'
        },
        status: 'completed'
      },
      'sa-review-code': {
        quality_score: 8.5,
        issues_found: [
          { type: 'warning', message: 'Consider adding error handling' },
          { type: 'info', message: 'Code style looks good' }
        ],
        suggestions: ['Add unit tests', 'Improve error handling'],
        approved: true
      }
    };
    
    return mockContents[toolName] || {
      message: `Mock content for ${toolName}`,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get workflow execution statistics
   */
  getExecutionStats() {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(h => h.result).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    
    const durations = this.executionHistory.map(h => h.duration).filter(d => d);
    const avgDuration = durations.length > 0 ? 
      durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    const agentStats = {};
    this.executionHistory.forEach(h => {
      if (!agentStats[h.agentType]) {
        agentStats[h.agentType] = { count: 0, avgDuration: 0 };
      }
      agentStats[h.agentType].count++;
    });
    
    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      agentStats,
      activeWorkflows: this.activeWorkflows.size
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory() {
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
    this.activeWorkflows.clear();
  }
}
