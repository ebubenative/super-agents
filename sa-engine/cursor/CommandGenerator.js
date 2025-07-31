import { join } from 'path';
import { existsSync, readFileSync, readdirSync } from 'fs';

/**
 * Command Generator for Cursor Integration
 * Generates commands and scripts for Super Agents in Cursor IDE
 */
export default class CommandGenerator {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      enableLogging: options.enableLogging !== false,
      ...options
    };
    
    this.logger = this.options.enableLogging ? console : { log: () => {}, error: () => {}, warn: () => {} };
    this.projectRoot = this.options.projectRoot;
  }

  /**
   * Generate all Cursor commands
   * @returns {Promise<Object>} Generated commands
   */
  async generateCommands() {
    try {
      this.logger.log('🔧 Generating Cursor commands...');

      const commands = {
        mcpCommands: await this.generateMCPCommands(),
        agentCommands: await this.generateAgentCommands(),
        workflowCommands: await this.generateWorkflowCommands(),
        utilityCommands: await this.generateUtilityCommands()
      };

      return {
        success: true,
        commands,
        totalCommands: Object.values(commands).reduce((sum, category) => sum + category.length, 0)
      };

    } catch (error) {
      this.logger.error('❌ Failed to generate commands:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate MCP commands for direct tool usage
   * @returns {Promise<Array>} MCP commands
   */
  async generateMCPCommands() {
    const tools = await this.getAvailableTools();
    const mcpCommands = [];

    // Group tools by category
    const toolsByCategory = tools.reduce((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    }, {});

    // Generate commands for each category
    Object.entries(toolsByCategory).forEach(([category, categoryTools]) => {
      mcpCommands.push({
        category: category,
        description: `${category} tools from Super Agents Framework`,
        commands: categoryTools.map(tool => ({
          name: tool.name,
          command: `@${tool.name}`,
          description: this.getToolDescription(tool),
          usage: this.getToolUsage(tool),
          parameters: this.getToolParameters(tool)
        }))
      });
    });

    return mcpCommands;
  }

  /**
   * Generate agent persona commands
   * @returns {Promise<Array>} Agent commands
   */
  async generateAgentCommands() {
    const agents = await this.getAvailableAgents();
    
    return agents.map(agent => ({
      name: agent.name.toLowerCase(),
      command: `@${agent.name.toLowerCase()}`,
      description: `Activate ${agent.name} agent persona for ${agent.role.toLowerCase()} tasks`,
      role: agent.role,
      capabilities: agent.capabilities,
      usage: `@${agent.name.toLowerCase()}: [Your request related to ${agent.role.toLowerCase()}]`,
      examples: this.generateAgentExamples(agent)
    }));
  }

  /**
   * Generate workflow commands
   * @returns {Promise<Array>} Workflow commands
   */
  async generateWorkflowCommands() {
    return [
      {
        name: 'greenfield-workflow',
        command: '@workflow:greenfield',
        description: 'Start a complete greenfield development workflow',
        usage: '@workflow:greenfield project="My New App" type="web-application"',
        steps: [
          '@analyst: Research market and requirements',
          '@pm: Create PRD and user stories',
          '@architect: Design system architecture',
          '@ux-expert: Create frontend specifications',
          '@developer: Implement features',
          '@qa: Review and validate quality'
        ]
      },
      {
        name: 'brownfield-workflow',
        command: '@workflow:brownfield',
        description: 'Start a brownfield enhancement workflow',
        usage: '@workflow:brownfield project="Existing App" enhancement="New Feature"',
        steps: [
          '@architect: Analyze existing system',
          '@analyst: Assess enhancement requirements',
          '@pm: Plan integration strategy',
          '@developer: Implement changes',
          '@qa: Validate integration and regressions'
        ]
      },
      {
        name: 'feature-workflow',
        command: '@workflow:feature',
        description: 'Develop a specific feature end-to-end',
        usage: '@workflow:feature name="User Authentication" priority="high"',
        steps: [
          '@pm: Define feature requirements',
          '@architect: Design feature architecture',
          '@developer: Implement feature',
          '@qa: Test and validate feature'
        ]
      },
      {
        name: 'research-workflow',
        command: '@workflow:research',
        description: 'Conduct comprehensive research and analysis',
        usage: '@workflow:research topic="Competitive Analysis" scope="comprehensive"',
        steps: [
          '@analyst: Conduct market research',
          '@analyst: Perform competitive analysis',
          '@pm: Synthesize findings into actionable insights'
        ]
      }
    ];
  }

  /**
   * Generate utility commands
   * @returns {Promise<Array>} Utility commands
   */
  async generateUtilityCommands() {
    return [
      {
        name: 'help',
        command: '@sa:help',
        description: 'Get help with Super Agents Framework',
        usage: '@sa:help [topic]',
        topics: ['agents', 'tools', 'workflows', 'setup']
      },
      {
        name: 'status',
        command: '@sa:status',
        description: 'Check Super Agents integration status',
        usage: '@sa:status',
        checks: ['MCP connection', 'Rules files', 'Environment variables']
      },
      {
        name: 'list-agents',
        command: '@sa:agents',
        description: 'List all available agents and their capabilities',
        usage: '@sa:agents [agent-name]'
      },
      {
        name: 'list-tools',
        command: '@sa:tools',
        description: 'List all available tools by category',
        usage: '@sa:tools [category]'
      },
      {
        name: 'workflow-guide',
        command: '@sa:workflows',
        description: 'Get guidance on workflow patterns',
        usage: '@sa:workflows [workflow-type]'
      }
    ];
  }

  /**
   * Get available tools from the MCP server
   * @returns {Promise<Array>} Available tools
   */
  async getAvailableTools() {
    const toolsDir = join(this.projectRoot, 'sa-engine', 'mcp-server', 'tools');
    const tools = [];

    try {
      const categories = ['core', 'analyst', 'pm', 'architect', 'developer', 'qa', 'ux-expert', 'product-owner', 'scrum-master', 'task-master', 'workflow', 'dependencies'];
      
      for (const category of categories) {
        const categoryDir = join(toolsDir, category);
        if (existsSync(categoryDir)) {
          const files = readdirSync(categoryDir);
          for (const file of files) {
            if (file.endsWith('.js')) {
              const toolName = file.replace('.js', '').replace(/-/g, '_');
              tools.push({
                name: toolName,
                category: category,
                file: file,
                path: join(categoryDir, file)
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn('Warning: Could not scan tools directory:', error.message);
    }

    return tools;
  }

  /**
   * Get available agents
   * @returns {Promise<Array>} Available agents
   */
  async getAvailableAgents() {
    // Return default agent info similar to CursorIntegrator
    return [
      {
        name: 'Analyst',
        role: 'Business Analyst and Researcher',
        capabilities: ['Market research', 'Competitive analysis', 'Requirements gathering', 'Stakeholder analysis'],
        tools: ['sa-research-market', 'sa-competitor-analysis', 'sa-brainstorm-session', 'sa-create-brief']
      },
      {
        name: 'PM',
        role: 'Product Manager',
        capabilities: ['PRD creation', 'Feature prioritization', 'Epic planning', 'Stakeholder analysis'],
        tools: ['sa-generate-prd', 'sa-create-epic', 'sa-prioritize-features', 'sa-stakeholder-analysis']
      },
      {
        name: 'Architect',
        role: 'System Architect',
        capabilities: ['System design', 'Technology recommendations', 'Architecture analysis', 'Design patterns'],
        tools: ['sa-create-architecture', 'sa-analyze-brownfield', 'sa-tech-recommendations', 'sa-design-system']
      },
      {
        name: 'Developer',
        role: 'Software Developer',
        capabilities: ['Code implementation', 'Debugging', 'Testing', 'Code validation'],
        tools: ['sa-implement-story', 'sa-debug-issue', 'sa-run-tests', 'sa-validate-implementation']
      },
      {
        name: 'QA',
        role: 'Quality Assurance Engineer',
        capabilities: ['Code review', 'Quality validation', 'Refactoring', 'Testing strategies'],
        tools: ['sa-review-code', 'sa-validate-quality', 'sa-refactor-code', 'sa-review-story']
      },
      {
        name: 'UX-Expert',
        role: 'UX/UI Designer',
        capabilities: ['Frontend specifications', 'UI design', 'Accessibility audits', 'Wireframing'],
        tools: ['sa-create-frontend-spec', 'sa-design-wireframes', 'sa-accessibility-audit', 'sa-generate-ui-prompt']
      },
      {
        name: 'Product-Owner',
        role: 'Product Owner',
        capabilities: ['Story validation', 'Course correction', 'Checklist execution', 'Document management'],
        tools: ['sa-validate-story-draft', 'sa-correct-course', 'sa-execute-checklist', 'sa-shard-document']
      },
      {
        name: 'Scrum-Master',
        role: 'Scrum Master',
        capabilities: ['Story creation', 'Progress tracking', 'Workflow management', 'Sprint coordination'],
        tools: ['sa-create-story', 'sa-create-next-story', 'sa-track-progress', 'sa-update-workflow']
      }
    ];
  }

  /**
   * Get tool description
   * @param {Object} tool - Tool object
   * @returns {string} Tool description
   */
  getToolDescription(tool) {
    const descriptions = {
      // Core tools
      'sa_get_task': 'Retrieve specific task details and information',
      'sa_initialize_project': 'Set up new projects with proper structure and configuration',
      'sa_list_tasks': 'List and filter project tasks with various criteria',
      'sa_update_task_status': 'Update task status and progress tracking',

      // Analyst tools
      'sa_research_market': 'Conduct comprehensive market research and trend analysis',
      'sa_brainstorm_session': 'Facilitate structured brainstorming sessions',
      'sa_competitor_analysis': 'Perform competitive analysis and market positioning',
      'sa_create_brief': 'Generate detailed project briefs and requirement summaries',

      // PM tools
      'sa_generate_prd': 'Generate Product Requirements Documents (PRDs)',
      'sa_create_epic': 'Create comprehensive epics with detailed specifications',
      'sa_prioritize_features': 'Prioritize features and create development roadmaps',
      'sa_stakeholder_analysis': 'Analyze stakeholders and their requirements',

      // Architect tools
      'sa_create_architecture': 'Design comprehensive system architectures',
      'sa_analyze_brownfield': 'Analyze existing codebases and legacy systems',
      'sa_tech_recommendations': 'Provide technology stack recommendations',
      'sa_design_system': 'Create design systems and component architectures',

      // Developer tools
      'sa_implement_story': 'Implement user stories and feature requirements',
      'sa_debug_issue': 'Debug and troubleshoot code issues',
      'sa_run_tests': 'Execute test suites and validate implementations',
      'sa_validate_implementation': 'Validate code implementations against requirements',

      // QA tools
      'sa_review_code': 'Perform comprehensive code reviews',
      'sa_validate_quality': 'Validate code quality and adherence to standards',
      'sa_refactor_code': 'Refactor code for improved quality and maintainability',
      'sa_review_story': 'Review user stories for completeness and clarity'
    };

    return descriptions[tool.name] || `${tool.category} tool for specialized tasks`;
  }

  /**
   * Get tool usage example
   * @param {Object} tool - Tool object
   * @returns {string} Tool usage example
   */
  getToolUsage(tool) {
    const usageExamples = {
      'sa_research_market': '@sa-research-market topic="AI development tools" scope="comprehensive"',
      'sa_generate_prd': '@sa-generate-prd requirements="user authentication system with social login"',
      'sa_create_architecture': '@sa-create-architecture requirements="scalable microservices application"',
      'sa_implement_story': '@sa-implement-story story="user registration with email verification"',
      'sa_review_code': '@sa-review-code files="src/auth/" focus="security,performance"',
      'sa_brainstorm_session': '@sa-brainstorm-session topic="mobile app features" technique="rapid-ideation"',
      'sa_competitor_analysis': '@sa-competitor-analysis industry="project management software"',
      'sa_create_brief': '@sa-create-brief projectName="E-commerce Platform" briefType="enhanced"'
    };

    return usageExamples[tool.name] || `@${tool.name.replace(/_/g, '-')} [parameters]`;
  }

  /**
   * Get tool parameters
   * @param {Object} tool - Tool object
   * @returns {Array} Tool parameters
   */
  getToolParameters(tool) {
    // This would ideally parse the actual tool files, but for now return common parameters
    const commonParameters = {
      'sa_research_market': ['topic', 'scope', 'targetAudience', 'geoFocus'],
      'sa_generate_prd': ['requirements', 'stakeholders', 'constraints', 'timeline'],
      'sa_create_architecture': ['requirements', 'type', 'scale', 'constraints'],
      'sa_implement_story': ['story', 'acceptance_criteria', 'architecture', 'patterns'],
      'sa_review_code': ['files', 'focus', 'standards'],
      'sa_brainstorm_session': ['topic', 'technique', 'duration', 'participants']
    };

    return commonParameters[tool.name] || ['[tool-specific parameters]'];
  }

  /**
   * Generate examples for an agent
   * @param {Object} agent - Agent object
   * @returns {Array} Agent examples
   */
  generateAgentExamples(agent) {
    const examples = {
      'Analyst': [
        '@analyst: Research the competitive landscape for project management tools',
        '@analyst: Analyze market trends in AI-powered development tools',
        '@analyst: Gather requirements for mobile payment integration'
      ],
      'PM': [
        '@pm: Create a PRD for user authentication with social login',
        '@pm: Prioritize features for our Q2 release',
        '@pm: Plan epic for mobile app development'
      ],
      'Architect': [
        '@architect: Design a scalable microservices architecture for our e-commerce platform',
        '@architect: Recommend technology stack for real-time messaging app',
        '@architect: Analyze existing system for performance optimization'
      ],
      'Developer': [
        '@developer: Implement user registration with email verification',
        '@developer: Debug the authentication middleware issue',
        '@developer: Create API endpoints for user management'
      ],
      'QA': [
        '@qa: Review this authentication code for security vulnerabilities',
        '@qa: Create test plan for the new payment feature',
        '@qa: Validate code quality for the user management module'
      ],
      'UX-Expert': [
        '@ux-expert: Create wireframes for the user onboarding flow',
        '@ux-expert: Design frontend specification for the dashboard',
        '@ux-expert: Conduct accessibility audit for the checkout process'
      ]
    };

    return examples[agent.name] || [
      `@${agent.name.toLowerCase()}: [Request related to ${agent.role.toLowerCase()}]`
    ];
  }

  /**
   * Generate command reference document
   * @returns {Promise<string>} Command reference content
   */
  async generateCommandReference() {
    const commands = await this.generateCommands();
    
    if (!commands.success) {
      throw new Error(`Failed to generate commands: ${commands.error}`);
    }

    let reference = `# Super Agents - Cursor Command Reference

## Overview
This document provides a comprehensive reference for all Super Agents commands available in Cursor IDE.

**Total Commands**: ${commands.totalCommands}

## MCP Tool Commands

These commands directly invoke Super Agents tools via MCP integration:

`;

    // Add MCP commands
    commands.commands.mcpCommands.forEach(category => {
      reference += `### ${category.category.charAt(0).toUpperCase() + category.category.slice(1)} Tools\n\n`;
      
      category.commands.forEach(cmd => {
        reference += `#### ${cmd.command}\n`;
        reference += `**Description**: ${cmd.description}\n`;
        reference += `**Usage**: \`${cmd.usage}\`\n`;
        if (cmd.parameters.length > 0) {
          reference += `**Parameters**: ${cmd.parameters.join(', ')}\n`;
        }
        reference += '\n';
      });
    });

    // Add agent commands
    reference += `## Agent Persona Commands

Use these commands to activate specific agent personas:

`;

    commands.commands.agentCommands.forEach(agent => {
      reference += `### ${agent.command}\n`;
      reference += `**Role**: ${agent.role}\n`;
      reference += `**Description**: ${agent.description}\n`;
      reference += `**Capabilities**: ${agent.capabilities.join(', ')}\n`;
      reference += `**Usage**: \`${agent.usage}\`\n`;
      reference += `**Examples**:\n`;
      agent.examples.forEach(example => {
        reference += `- \`${example}\`\n`;
      });
      reference += '\n';
    });

    // Add workflow commands
    reference += `## Workflow Commands

Use these commands to execute complete workflows:

`;

    commands.commands.workflowCommands.forEach(workflow => {
      reference += `### ${workflow.command}\n`;
      reference += `**Description**: ${workflow.description}\n`;
      reference += `**Usage**: \`${workflow.usage}\`\n`;
      reference += `**Steps**:\n`;
      workflow.steps.forEach((step, index) => {
        reference += `${index + 1}. ${step}\n`;
      });
      reference += '\n';
    });

    // Add utility commands
    reference += `## Utility Commands

Helpful commands for managing Super Agents integration:

`;

    commands.commands.utilityCommands.forEach(utility => {
      reference += `### ${utility.command}\n`;
      reference += `**Description**: ${utility.description}\n`;
      reference += `**Usage**: \`${utility.usage}\`\n`;
      if (utility.topics) {
        reference += `**Topics**: ${utility.topics.join(', ')}\n`;
      }
      if (utility.checks) {
        reference += `**Checks**: ${utility.checks.join(', ')}\n`;
      }
      reference += '\n';
    });

    reference += `## Quick Reference

### Most Common Commands
\`\`\`
# Research and Analysis
@analyst: Research competitive landscape for [topic]
@sa-research-market topic="[topic]" scope="comprehensive"

# Product Planning
@pm: Create PRD for [feature/product]
@sa-generate-prd requirements="[requirements]"

# System Design
@architect: Design architecture for [system]
@sa-create-architecture requirements="[requirements]"

# Development
@developer: Implement [feature/story]
@sa-implement-story story="[story description]"

# Quality Review
@qa: Review code in [files/directories]
@sa-review-code files="[file paths]" focus="security,performance"
\`\`\`

### Workflow Patterns
\`\`\`
# Complete Feature Development
@analyst → @pm → @architect → @developer → @qa

# Quick Research
@analyst: Research [topic] and provide key insights

# Code Review Flow
@developer: Implement [feature]
@qa: Review implementation for quality and security
\`\`\`

---
*Command Reference - Super Agents Framework for Cursor*
*Generated: ${new Date().toISOString()}*
`;

    return reference;
  }
}