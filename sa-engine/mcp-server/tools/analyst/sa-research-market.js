import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_research_market MCP Tool
 * Market research functionality with prompt generation and context management
 */
export const saResearchMarket = {
  name: 'sa_research_market',
  description: 'Conduct comprehensive market research analysis with data collection workflows and formatted output',
  category: 'analyst',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      marketArea: {
        type: 'string',
        description: 'The market area or industry to research',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      researchScope: {
        type: 'string',
        description: 'Scope of research',
        enum: ['comprehensive', 'focused', 'quick-scan'],
        default: 'comprehensive'
      },
      targetAudience: {
        type: 'string',
        description: 'Target audience for the research'
      },
      competitors: {
        type: 'array',
        description: 'Known competitors to include in research',
        items: { type: 'string' }
      },
      geoFocus: {
        type: 'string',
        description: 'Geographic focus for the research',
        default: 'global'
      },
      outputFormat: {
        type: 'string',
        description: 'Output format for the research',
        enum: ['detailed-report', 'executive-summary', 'presentation-notes'],
        default: 'detailed-report'
      },
      interactive: {
        type: 'boolean',
        description: 'Enable interactive research session',
        default: true
      }
    },
    required: ['marketArea']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.marketArea || typeof args.marketArea !== 'string') {
      errors.push('marketArea is required and must be a string');
    }
    
    if (args.marketArea && args.marketArea.trim().length === 0) {
      errors.push('marketArea cannot be empty');
    }
    
    if (args.projectPath && typeof args.projectPath !== 'string') {
      errors.push('projectPath must be a string');
    }
    
    if (args.competitors && !Array.isArray(args.competitors)) {
      errors.push('competitors must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute market research
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const marketArea = args.marketArea.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      // Prepare research context
      const researchContext = {
        marketArea,
        researchScope: args.researchScope || 'comprehensive',
        targetAudience: args.targetAudience || 'General market',
        competitors: args.competitors || [],
        geoFocus: args.geoFocus || 'global',
        outputFormat: args.outputFormat || 'detailed-report',
        timestamp: new Date().toISOString(),
        researcherId: context?.userId || 'system'
      };
      
      // Generate market research using template
      const researchTemplate = await this.loadMarketResearchTemplate(templateEngine);
      const researchPrompt = await this.generateResearchPrompt(researchContext, researchTemplate);
      
      // Create research workflow
      const researchWorkflow = await this.createResearchWorkflow(researchContext);
      
      // Generate output based on format
      let output;
      
      if (args.interactive) {
        output = await this.formatInteractiveOutput(researchContext, researchPrompt, researchWorkflow);
      } else {
        output = await this.formatAutomatedOutput(researchContext, researchPrompt, researchWorkflow);
      }
      
      // Save research session data if project exists
      await this.saveResearchSession(projectPath, researchContext, researchPrompt, researchWorkflow);
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          marketArea,
          researchScope: args.researchScope,
          outputFormat: args.outputFormat,
          interactive: args.interactive,
          workflowSteps: researchWorkflow.steps.length,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to conduct market research for ${marketArea}: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          marketArea,
          projectPath
        }
      };
    }
  },

  /**
   * Load market research template
   * @param {TemplateEngine} templateEngine - Template engine instance
   * @returns {Promise<Object>} Market research template
   */
  async loadMarketResearchTemplate(templateEngine) {
    try {
      const template = await templateEngine.getTemplate('market-research-tmpl.yaml');
      return template;
    } catch (error) {
      // Return default template if file not found
      return {
        name: 'Market Research Template',
        sections: [
          'Executive Summary',
          'Market Overview',
          'Target Audience Analysis',
          'Competitive Landscape',
          'Market Trends',
          'Opportunities & Threats',
          'Recommendations'
        ],
        researchMethods: [
          'Primary Research',
          'Secondary Research',
          'Competitive Analysis',
          'Trend Analysis'
        ]
      };
    }
  },

  /**
   * Generate comprehensive research prompt
   * @param {Object} context - Research context
   * @param {Object} template - Research template
   * @returns {Promise<string>} Generated research prompt
   */
  async generateResearchPrompt(context, template) {
    const sections = template.sections || [
      'Executive Summary',
      'Market Overview', 
      'Target Audience Analysis',
      'Competitive Landscape',
      'Market Trends',
      'Opportunities & Threats',
      'Recommendations'
    ];
    
    let prompt = `# Market Research Analysis: ${context.marketArea}\n\n`;
    prompt += `**Research Parameters:**\n`;
    prompt += `- Market Area: ${context.marketArea}\n`;
    prompt += `- Research Scope: ${context.researchScope}\n`;
    prompt += `- Target Audience: ${context.targetAudience}\n`;
    prompt += `- Geographic Focus: ${context.geoFocus}\n`;
    prompt += `- Output Format: ${context.outputFormat}\n\n`;
    
    if (context.competitors.length > 0) {
      prompt += `**Known Competitors:** ${context.competitors.join(', ')}\n\n`;
    }
    
    prompt += `**Research Framework:**\n\n`;
    
    sections.forEach((section, index) => {
      prompt += `## ${index + 1}. ${section}\n\n`;
      
      switch (section) {
        case 'Executive Summary':
          prompt += `Provide a concise overview of key findings and strategic recommendations.\n\n`;
          break;
        case 'Market Overview':
          prompt += `- Market size and growth trends\n`;
          prompt += `- Key market drivers and challenges\n`;
          prompt += `- Market segmentation\n`;
          prompt += `- Regulatory environment\n\n`;
          break;
        case 'Target Audience Analysis':
          prompt += `- Demographics and psychographics\n`;
          prompt += `- Pain points and needs\n`;
          prompt += `- Buying behavior and preferences\n`;
          prompt += `- Customer journey mapping\n\n`;
          break;
        case 'Competitive Landscape':
          prompt += `- Direct and indirect competitors\n`;
          prompt += `- Market share analysis\n`;
          prompt += `- Competitive positioning\n`;
          prompt += `- SWOT analysis of key players\n\n`;
          break;
        case 'Market Trends':
          prompt += `- Current trends shaping the market\n`;
          prompt += `- Emerging technologies and innovations\n`;
          prompt += `- Future outlook and predictions\n`;
          prompt += `- Impact of external factors\n\n`;
          break;
        case 'Opportunities & Threats':
          prompt += `- Market opportunities for growth\n`;
          prompt += `- Potential threats and risks\n`;
          prompt += `- Barriers to entry\n`;
          prompt += `- Strategic considerations\n\n`;
          break;
        case 'Recommendations':
          prompt += `- Strategic recommendations\n`;
          prompt += `- Market entry strategies\n`;
          prompt += `- Product/service positioning\n`;
          prompt += `- Next steps and action items\n\n`;
          break;
        default:
          prompt += `Research and analyze this aspect of the market.\n\n`;
      }
    });
    
    prompt += `**Research Guidelines:**\n`;
    prompt += `- Use credible sources and recent data\n`;
    prompt += `- Include quantitative and qualitative insights\n`;
    prompt += `- Consider multiple perspectives and scenarios\n`;
    prompt += `- Provide actionable recommendations\n`;
    prompt += `- Cite sources where applicable\n\n`;
    
    return prompt;
  },

  /**
   * Create research workflow
   * @param {Object} context - Research context
   * @returns {Promise<Object>} Research workflow
   */
  async createResearchWorkflow(context) {
    const baseSteps = [
      {
        id: 'setup',
        name: 'Research Setup',
        description: 'Define research objectives and methodology',
        status: 'pending',
        estimatedTime: '30 minutes'
      },
      {
        id: 'secondary-research',
        name: 'Secondary Research',
        description: 'Gather existing market data and reports',
        status: 'pending',
        estimatedTime: '2-4 hours'
      },
      {
        id: 'competitive-analysis',
        name: 'Competitive Analysis',
        description: 'Analyze competitors and market positioning',
        status: 'pending',
        estimatedTime: '1-2 hours'
      },
      {
        id: 'trend-analysis',
        name: 'Trend Analysis',
        description: 'Identify and analyze market trends',
        status: 'pending',
        estimatedTime: '1-2 hours'
      },
      {
        id: 'synthesis',
        name: 'Data Synthesis',
        description: 'Synthesize findings and identify insights',
        status: 'pending',
        estimatedTime: '1 hour'
      },
      {
        id: 'recommendations',
        name: 'Recommendations',
        description: 'Develop strategic recommendations',
        status: 'pending',
        estimatedTime: '1 hour'
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Create final research report',
        status: 'pending',
        estimatedTime: '1-2 hours'
      }
    ];
    
    // Adjust workflow based on research scope
    let steps = [...baseSteps];
    
    if (context.researchScope === 'focused') {
      steps = steps.filter(step => 
        ['setup', 'secondary-research', 'competitive-analysis', 'synthesis', 'documentation'].includes(step.id)
      );
    } else if (context.researchScope === 'quick-scan') {
      steps = [
        {
          id: 'quick-scan',
          name: 'Quick Market Scan',
          description: 'Rapid overview of market landscape',
          status: 'pending',
          estimatedTime: '1 hour'
        },
        {
          id: 'key-insights',
          name: 'Key Insights',
          description: 'Extract and document key findings',
          status: 'pending',
          estimatedTime: '30 minutes'
        }
      ];
    }
    
    return {
      id: `market-research-${Date.now()}`,
      name: `Market Research: ${context.marketArea}`,
      scope: context.researchScope,
      steps,
      createdAt: new Date().toISOString(),
      estimatedDuration: this.calculateEstimatedDuration(steps)
    };
  },

  /**
   * Calculate estimated duration for workflow
   * @param {Array} steps - Workflow steps
   * @returns {string} Estimated duration
   */
  calculateEstimatedDuration(steps) {
    const totalMinutes = steps.reduce((total, step) => {
      const timeStr = step.estimatedTime;
      const hours = timeStr.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*hours?/);
      const minutes = timeStr.match(/(\d+)\s*minutes?/);
      
      if (hours) {
        const min = parseFloat(hours[1]) * 60;
        const max = hours[2] ? parseFloat(hours[2]) * 60 : min;
        return total + (min + max) / 2;
      } else if (minutes) {
        return total + parseInt(minutes[1]);
      }
      return total;
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  },

  /**
   * Format interactive output
   * @param {Object} context - Research context
   * @param {string} prompt - Research prompt
   * @param {Object} workflow - Research workflow
   * @returns {Promise<string>} Formatted output
   */
  async formatInteractiveOutput(context, prompt, workflow) {
    let output = `🔍 **Market Research Analysis Setup**\n\n`;
    output += `📊 **Research Target:** ${context.marketArea}\n`;
    output += `🎯 **Scope:** ${context.researchScope}\n`;
    output += `👥 **Target Audience:** ${context.targetAudience}\n`;
    output += `🌍 **Geographic Focus:** ${context.geoFocus}\n`;
    output += `⏱️ **Estimated Duration:** ${workflow.estimatedDuration}\n\n`;
    
    if (context.competitors.length > 0) {
      output += `🏢 **Known Competitors:** ${context.competitors.join(', ')}\n\n`;
    }
    
    output += `📋 **Research Workflow:**\n`;
    workflow.steps.forEach((step, index) => {
      output += `${index + 1}. **${step.name}** (${step.estimatedTime})\n`;
      output += `   ${step.description}\n\n`;
    });
    
    output += `📝 **Research Framework:**\n\n`;
    output += `${prompt}\n\n`;
    
    output += `🚀 **Next Steps:**\n`;
    output += `1. Review the research framework above\n`;
    output += `2. Begin with the first workflow step: "${workflow.steps[0].name}"\n`;
    output += `3. Use the framework to guide your research activities\n`;
    output += `4. Document findings as you progress through each step\n`;
    output += `5. Synthesize results into final recommendations\n\n`;
    
    output += `💡 **Pro Tips:**\n`;
    output += `- Start with secondary research to build foundational knowledge\n`;
    output += `- Use multiple sources to validate findings\n`;
    output += `- Focus on recent data and trends\n`;
    output += `- Consider both quantitative and qualitative insights\n`;
    output += `- Keep the target audience in mind throughout the research\n\n`;
    
    output += `📁 **Research session saved to project for future reference.**`;
    
    return output;
  },

  /**
   * Format automated output
   * @param {Object} context - Research context
   * @param {string} prompt - Research prompt  
   * @param {Object} workflow - Research workflow
   * @returns {Promise<string>} Formatted output
   */
  async formatAutomatedOutput(context, prompt, workflow) {
    let output = `# Market Research Framework: ${context.marketArea}\n\n`;
    output += `**Generated:** ${new Date().toLocaleString()}\n`;
    output += `**Research ID:** ${workflow.id}\n\n`;
    
    output += `## Research Parameters\n\n`;
    output += `- **Market Area:** ${context.marketArea}\n`;
    output += `- **Research Scope:** ${context.researchScope}\n`;
    output += `- **Target Audience:** ${context.targetAudience}\n`;
    output += `- **Geographic Focus:** ${context.geoFocus}\n`;
    output += `- **Output Format:** ${context.outputFormat}\n\n`;
    
    if (context.competitors.length > 0) {
      output += `- **Known Competitors:** ${context.competitors.join(', ')}\n\n`;
    }
    
    output += `## Research Workflow\n\n`;
    output += `**Estimated Duration:** ${workflow.estimatedDuration}\n\n`;
    
    workflow.steps.forEach((step, index) => {
      output += `### Step ${index + 1}: ${step.name}\n`;
      output += `**Time:** ${step.estimatedTime}\n`;
      output += `**Description:** ${step.description}\n\n`;
    });
    
    output += `## Research Framework\n\n`;
    output += prompt;
    
    return output;
  },

  /**
   * Save research session data
   * @param {string} projectPath - Project path
   * @param {Object} context - Research context
   * @param {string} prompt - Research prompt
   * @param {Object} workflow - Research workflow
   * @returns {Promise<void>}
   */
  async saveResearchSession(projectPath, context, prompt, workflow) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) {
        return; // No SA project, skip saving
      }
      
      const researchDir = join(saDir, 'research');
      if (!existsSync(researchDir)) {
        require('fs').mkdirSync(researchDir, { recursive: true });
      }
      
      const sessionData = {
        id: workflow.id,
        context,
        prompt,
        workflow,
        createdAt: new Date().toISOString()
      };
      
      const filename = `market-research-${context.marketArea.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(researchDir, filename);
      
      writeFileSync(filepath, JSON.stringify(sessionData, null, 2));
      
    } catch (error) {
      // Silent fail - research session saving is optional
      console.warn('Failed to save research session:', error.message);
    }
  }
};