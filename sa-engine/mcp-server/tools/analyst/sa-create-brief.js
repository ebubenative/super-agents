import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_create_brief MCP Tool
 * Project brief creation with template loading and interactive workflow
 */
export const saCreateBrief = {
  name: 'sa_create_brief',
  description: 'Create comprehensive project briefs with interactive creation workflow and stakeholder input collection',
  category: 'analyst',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        description: 'Name of the project for the brief',
        minLength: 1
      },
      projectType: {
        type: 'string',
        description: 'Type of project',
        enum: ['software-development', 'web-application', 'mobile-app', 'api-service', 'data-analysis', 'research', 'product-launch', 'other'],
        default: 'software-development'
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      briefType: {
        type: 'string',
        description: 'Type of brief to create',
        enum: ['standard', 'enhanced', 'technical', 'executive'],
        default: 'enhanced'
      },
      stakeholders: {
        type: 'array',
        description: 'List of project stakeholders',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            influence: { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          required: ['name', 'role']
        }
      },
      businessContext: {
        type: 'object',
        description: 'Business context information',
        properties: {
          industry: { type: 'string' },
          marketSize: { type: 'string' },
          targetAudience: { type: 'string' },
          businessModel: { type: 'string' },
          revenue: { type: 'string' }
        }
      },
      constraints: {
        type: 'object',
        description: 'Project constraints',
        properties: {
          budget: { type: 'string' },
          timeline: { type: 'string' },
          resources: { type: 'string' },
          technical: { type: 'array', items: { type: 'string' } },
          regulatory: { type: 'array', items: { type: 'string' } }
        }
      },
      interactive: {
        type: 'boolean',
        description: 'Enable interactive brief creation workflow',
        default: true
      },
      outputFormat: {
        type: 'string',
        description: 'Output format for the brief',
        enum: ['markdown', 'yaml', 'json', 'interactive'],
        default: 'interactive'
      }
    },
    required: ['projectName']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.projectName || typeof args.projectName !== 'string') {
      errors.push('projectName is required and must be a string');
    }
    
    if (args.projectName && args.projectName.trim().length === 0) {
      errors.push('projectName cannot be empty');
    }
    
    if (args.projectPath && typeof args.projectPath !== 'string') {
      errors.push('projectPath must be a string');
    }
    
    if (args.stakeholders && !Array.isArray(args.stakeholders)) {
      errors.push('stakeholders must be an array');
    }
    
    if (args.businessContext && typeof args.businessContext !== 'object') {
      errors.push('businessContext must be an object');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute project brief creation
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const projectName = args.projectName.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      // Load appropriate brief template
      const briefTemplate = await this.loadBriefTemplate(templateEngine, args.briefType);
      
      // Prepare brief context
      const briefContext = {
        projectName,
        projectType: args.projectType || 'software-development',
        briefType: args.briefType || 'enhanced',
        stakeholders: args.stakeholders || [],
        businessContext: args.businessContext || {},
        constraints: args.constraints || {},
        timestamp: new Date().toISOString(),
        createdBy: context?.userId || 'system'
      };
      
      // Generate brief content
      const briefContent = await this.generateBriefContent(briefContext, briefTemplate);
      
      // Create interactive workflow if requested
      let workflow = null;
      if (args.interactive) {
        workflow = await this.createBriefWorkflow(briefContext);
      }
      
      // Format output
      let output;
      if (args.outputFormat === 'interactive') {
        output = await this.formatInteractiveOutput(briefContext, briefContent, workflow);
      } else {
        output = await this.formatStaticOutput(briefContext, briefContent, args.outputFormat);
      }
      
      // Save brief to project if applicable
      await this.saveBriefToProject(projectPath, briefContext, briefContent);
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          projectName,
          projectType: args.projectType,
          briefType: args.briefType,
          outputFormat: args.outputFormat,
          interactive: args.interactive,
          stakeholderCount: briefContext.stakeholders.length,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create project brief for ${projectName}: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          projectName,
          projectPath
        }
      };
    }
  },

  /**
   * Load brief template based on type
   * @param {TemplateEngine} templateEngine - Template engine instance
   * @param {string} briefType - Type of brief template
   * @returns {Promise<Object>} Brief template
   */
  async loadBriefTemplate(templateEngine, briefType) {
    try {
      let templateName;
      
      switch (briefType) {
        case 'enhanced':
          templateName = 'project-brief-enhanced.yaml';
          break;
        case 'standard':
          templateName = 'project-brief-tmpl.yaml';
          break;
        case 'technical':
          templateName = 'technical-brief-tmpl.yaml';
          break;
        case 'executive':
          templateName = 'executive-brief-tmpl.yaml';
          break;
        default:
          templateName = 'project-brief-tmpl.yaml';
      }
      
      const template = await templateEngine.getTemplate(templateName);
      return template;
    } catch (error) {
      // Return default template structure
      return this.getDefaultBriefTemplate(briefType);
    }
  },

  /**
   * Get default brief template
   * @param {string} briefType - Type of brief
   * @returns {Object} Default template structure
   */
  getDefaultBriefTemplate(briefType) {
    const baseTemplate = {
      name: 'Project Brief Template',
      sections: [
        'Project Overview',
        'Business Context',
        'Objectives & Goals',
        'Scope & Requirements',
        'Stakeholders',
        'Timeline & Milestones',
        'Budget & Resources',
        'Risks & Assumptions',
        'Success Criteria',
        'Next Steps'
      ]
    };
    
    switch (briefType) {
      case 'enhanced':
        return {
          ...baseTemplate,
          sections: [
            ...baseTemplate.sections,
            'Technical Considerations',
            'Market Analysis',
            'Competitive Landscape',
            'Regulatory Requirements',
            'Quality Assurance',
            'Maintenance & Support'
          ]
        };
      case 'technical':
        return {
          ...baseTemplate,
          sections: [
            'Technical Overview',
            'Architecture Requirements',
            'Technology Stack',
            'Development Methodology',
            'Integration Requirements',
            'Security Requirements',
            'Performance Requirements',
            'Scalability Considerations',
            'Technical Constraints',
            'Testing Strategy'
          ]
        };
      case 'executive':
        return {
          ...baseTemplate,
          sections: [
            'Executive Summary',
            'Business Case',
            'Strategic Alignment',
            'Investment Overview',
            'ROI Analysis',
            'Key Stakeholders',
            'Timeline Overview',
            'Risk Summary',
            'Decision Framework',
            'Recommendations'
          ]
        };
      default:
        return baseTemplate;
    }
  },

  /**
   * Generate brief content
   * @param {Object} context - Brief context
   * @param {Object} template - Brief template
   * @returns {Promise<Object>} Generated brief content
   */
  async generateBriefContent(context, template) {
    const sections = template.sections || [];
    const briefContent = {
      metadata: {
        projectName: context.projectName,
        projectType: context.projectType,
        briefType: context.briefType,
        createdAt: context.timestamp,
        createdBy: context.createdBy,
        version: '1.0.0'
      },
      sections: {}
    };
    
    // Generate content for each section
    for (const sectionName of sections) {
      briefContent.sections[sectionName] = await this.generateSectionContent(sectionName, context);
    }
    
    return briefContent;
  },

  /**
   * Generate content for a specific section
   * @param {string} sectionName - Name of the section
   * @param {Object} context - Brief context
   * @returns {Promise<Object>} Section content
   */
  async generateSectionContent(sectionName, context) {
    const section = {
      title: sectionName,
      content: [],
      prompts: [],
      requiredInfo: []
    };
    
    switch (sectionName) {
      case 'Project Overview':
        section.content = [
          `Project Name: ${context.projectName}`,
          `Project Type: ${context.projectType}`,
          'Project description and purpose...',
          'Key value proposition...'
        ];
        section.prompts = [
          'What is the main purpose of this project?',
          'What problem does this project solve?',
          'What is the unique value proposition?'
        ];
        break;
        
      case 'Business Context':
        if (context.businessContext.industry) {
          section.content.push(`Industry: ${context.businessContext.industry}`);
        }
        if (context.businessContext.targetAudience) {
          section.content.push(`Target Audience: ${context.businessContext.targetAudience}`);
        }
        section.prompts = [
          'What industry does this project operate in?',
          'Who is the target audience?',
          'What is the current market landscape?',
          'What business model will be used?'
        ];
        break;
        
      case 'Stakeholders':
        if (context.stakeholders.length > 0) {
          section.content = context.stakeholders.map(s => 
            `${s.name} - ${s.role} (${s.influence || 'medium'} influence)`
          );
        }
        section.prompts = [
          'Who are the key project stakeholders?',
          'What are their roles and responsibilities?',
          'What is their level of influence on the project?',
          'Who are the decision makers?'
        ];
        break;
        
      case 'Budget & Resources':
        if (context.constraints.budget) {
          section.content.push(`Budget: ${context.constraints.budget}`);
        }
        if (context.constraints.resources) {
          section.content.push(`Resources: ${context.constraints.resources}`);
        }
        section.prompts = [
          'What is the project budget?',
          'What resources are available?',
          'Are there resource constraints?',
          'What is the funding source?'
        ];
        break;
        
      case 'Timeline & Milestones':
        if (context.constraints.timeline) {
          section.content.push(`Timeline: ${context.constraints.timeline}`);
        }
        section.prompts = [
          'What is the project timeline?',
          'What are the key milestones?',
          'Are there any critical deadlines?',
          'What are the dependencies between phases?'
        ];
        break;
        
      case 'Technical Considerations':
        if (context.constraints.technical && context.constraints.technical.length > 0) {
          section.content.push(`Technical Constraints: ${context.constraints.technical.join(', ')}`);
        }
        section.prompts = [
          'What are the technical requirements?',
          'Are there technology constraints?',
          'What is the preferred technology stack?',
          'Are there integration requirements?'
        ];
        break;
        
      case 'Risks & Assumptions':
        section.prompts = [
          'What are the main project risks?',
          'What assumptions are being made?',
          'What could cause the project to fail?',
          'How will risks be mitigated?'
        ];
        break;
        
      case 'Success Criteria':
        section.prompts = [
          'How will project success be measured?',
          'What are the key performance indicators?',
          'What does successful completion look like?',
          'What are the acceptance criteria?'
        ];
        break;
        
      default:
        section.prompts = [
          `What information is needed for ${sectionName}?`,
          `What are the key considerations for ${sectionName}?`
        ];
    }
    
    return section;
  },

  /**
   * Create brief workflow
   * @param {Object} context - Brief context
   * @returns {Promise<Object>} Brief workflow
   */
  async createBriefWorkflow(context) {
    const steps = [
      {
        id: 'discovery',
        name: 'Project Discovery',
        description: 'Gather basic project information and context',
        status: 'pending',
        estimatedTime: '30 minutes',
        tasks: [
          'Define project purpose and goals',
          'Identify target audience',
          'Understand business context'
        ]
      },
      {
        id: 'stakeholder-analysis',
        name: 'Stakeholder Analysis',
        description: 'Identify and analyze key stakeholders',
        status: 'pending',
        estimatedTime: '45 minutes',
        tasks: [
          'List all stakeholders',
          'Define roles and responsibilities',
          'Assess influence and interest levels'
        ]
      },
      {
        id: 'requirements-gathering',
        name: 'Requirements Gathering',
        description: 'Collect detailed project requirements',
        status: 'pending',
        estimatedTime: '1-2 hours',
        tasks: [
          'Define functional requirements',
          'Identify non-functional requirements',
          'Document constraints and assumptions'
        ]
      },
      {
        id: 'scope-definition',
        name: 'Scope Definition',
        description: 'Define project scope and boundaries',
        status: 'pending',
        estimatedTime: '45 minutes',
        tasks: [
          'Define what is included in scope',
          'Define what is out of scope',
          'Identify scope dependencies'
        ]
      },
      {
        id: 'planning',
        name: 'Initial Planning',
        description: 'Create timeline and resource plan',
        status: 'pending',
        estimatedTime: '1 hour',
        tasks: [
          'Create project timeline',
          'Identify resource requirements',
          'Define key milestones'
        ]
      },
      {
        id: 'risk-assessment',
        name: 'Risk Assessment',
        description: 'Identify and assess project risks',
        status: 'pending',
        estimatedTime: '30 minutes',
        tasks: [
          'Identify potential risks',
          'Assess risk probability and impact',
          'Define mitigation strategies'
        ]
      },
      {
        id: 'documentation',
        name: 'Brief Documentation',
        description: 'Create final project brief document',
        status: 'pending',
        estimatedTime: '1 hour',
        tasks: [
          'Compile all gathered information',
          'Review and validate content',
          'Format and finalize brief'
        ]
      },
      {
        id: 'review',
        name: 'Stakeholder Review',
        description: 'Review brief with key stakeholders',
        status: 'pending',
        estimatedTime: '30 minutes',
        tasks: [
          'Present brief to stakeholders',
          'Gather feedback',
          'Make necessary revisions'
        ]
      }
    ];
    
    return {
      id: `project-brief-${Date.now()}`,
      name: `Project Brief: ${context.projectName}`,
      type: context.briefType,
      steps,
      createdAt: new Date().toISOString(),
      estimatedDuration: '4-6 hours'
    };
  },

  /**
   * Format interactive output
   * @param {Object} context - Brief context
   * @param {Object} content - Brief content
   * @param {Object} workflow - Brief workflow
   * @returns {Promise<string>} Formatted output
   */
  async formatInteractiveOutput(context, content, workflow) {
    let output = `📋 **Project Brief Creation: ${context.projectName}**\n\n`;
    output += `🎯 **Project Type:** ${context.projectType}\n`;
    output += `📄 **Brief Type:** ${context.briefType}\n`;
    output += `👥 **Stakeholders:** ${context.stakeholders.length} identified\n`;
    output += `⏱️ **Estimated Time:** ${workflow.estimatedDuration}\n\n`;
    
    output += `📋 **Brief Creation Workflow:**\n\n`;
    workflow.steps.forEach((step, index) => {
      output += `**${index + 1}. ${step.name}** (${step.estimatedTime})\n`;
      output += `   ${step.description}\n`;
      if (step.tasks && step.tasks.length > 0) {
        step.tasks.forEach(task => {
          output += `   • ${task}\n`;
        });
      }
      output += '\n';
    });
    
    output += `📝 **Brief Structure:**\n\n`;
    Object.entries(content.sections).forEach(([sectionName, section]) => {
      output += `**${sectionName}**\n`;
      
      if (section.content && section.content.length > 0) {
        section.content.forEach(item => {
          output += `• ${item}\n`;
        });
      }
      
      if (section.prompts && section.prompts.length > 0) {
        output += `*Key Questions:*\n`;
        section.prompts.forEach(prompt => {
          output += `  - ${prompt}\n`;
        });
      }
      output += '\n';
    });
    
    output += `🚀 **Next Steps:**\n`;
    output += `1. Start with "${workflow.steps[0].name}" phase\n`;
    output += `2. Work through each section systematically\n`;
    output += `3. Gather input from stakeholders for each section\n`;
    output += `4. Document all decisions and assumptions\n`;
    output += `5. Review completed brief with key stakeholders\n\n`;
    
    output += `💡 **Brief Creation Tips:**\n`;
    output += `• Start with stakeholder discovery to understand all perspectives\n`;
    output += `• Be specific and measurable in defining success criteria\n`;
    output += `• Document assumptions and validate them early\n`;
    output += `• Consider both functional and non-functional requirements\n`;
    output += `• Plan for regular brief updates as the project evolves\n\n`;
    
    output += `📁 **Brief template saved to project for completion.**`;
    
    return output;
  },

  /**
   * Format static output
   * @param {Object} context - Brief context
   * @param {Object} content - Brief content
   * @param {string} format - Output format
   * @returns {Promise<string>} Formatted output
   */
  async formatStaticOutput(context, content, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(content, null, 2);
      case 'yaml':
        return this.formatAsYaml(content);
      case 'markdown':
      default:
        return this.formatAsMarkdown(context, content);
    }
  },

  /**
   * Format content as YAML
   * @param {Object} content - Brief content
   * @returns {string} YAML formatted content
   */
  formatAsYaml(content) {
    // Simple YAML formatting
    let yaml = `---\n`;
    yaml += `project_name: "${content.metadata.projectName}"\n`;
    yaml += `project_type: "${content.metadata.projectType}"\n`;
    yaml += `brief_type: "${content.metadata.briefType}"\n`;
    yaml += `created_at: "${content.metadata.createdAt}"\n`;
    yaml += `version: "${content.metadata.version}"\n\n`;
    
    yaml += `sections:\n`;
    Object.entries(content.sections).forEach(([sectionName, section]) => {
      yaml += `  "${sectionName}":\n`;
      yaml += `    title: "${section.title}"\n`;
      if (section.content && section.content.length > 0) {
        yaml += `    content:\n`;
        section.content.forEach(item => {
          yaml += `      - "${item}"\n`;
        });
      }
      if (section.prompts && section.prompts.length > 0) {
        yaml += `    prompts:\n`;
        section.prompts.forEach(prompt => {
          yaml += `      - "${prompt}"\n`;
        });
      }
    });
    
    return yaml;
  },

  /**
   * Format content as Markdown
   * @param {Object} context - Brief context
   * @param {Object} content - Brief content
   * @returns {string} Markdown formatted content
   */
  formatAsMarkdown(context, content) {
    let md = `# Project Brief: ${context.projectName}\n\n`;
    md += `**Project Type:** ${context.projectType}\n`;
    md += `**Brief Type:** ${context.briefType}\n`;
    md += `**Created:** ${new Date(context.timestamp).toLocaleString()}\n`;
    md += `**Version:** ${content.metadata.version}\n\n`;
    
    Object.entries(content.sections).forEach(([sectionName, section]) => {
      md += `## ${sectionName}\n\n`;
      
      if (section.content && section.content.length > 0) {
        section.content.forEach(item => {
          md += `- ${item}\n`;
        });
        md += '\n';
      }
      
      if (section.prompts && section.prompts.length > 0) {
        md += `### Key Questions\n\n`;
        section.prompts.forEach(prompt => {
          md += `- ${prompt}\n`;
        });
        md += '\n';
      }
    });
    
    return md;
  },

  /**
   * Save brief to project
   * @param {string} projectPath - Project path
   * @param {Object} context - Brief context
   * @param {Object} content - Brief content
   * @returns {Promise<void>}
   */
  async saveBriefToProject(projectPath, context, content) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) {
        return; // No SA project, skip saving
      }
      
      const briefsDir = join(saDir, 'briefs');
      if (!existsSync(briefsDir)) {
        require('fs').mkdirSync(briefsDir, { recursive: true });
      }
      
      const briefData = {
        context,
        content,
        createdAt: new Date().toISOString()
      };
      
      const filename = `project-brief-${context.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(briefsDir, filename);
      
      writeFileSync(filepath, JSON.stringify(briefData, null, 2));
      
      // Also save as markdown for easy reading
      const mdFilename = filename.replace('.json', '.md');
      const mdFilepath = join(briefsDir, mdFilename);
      const markdownContent = this.formatAsMarkdown(context, content);
      
      writeFileSync(mdFilepath, markdownContent);
      
    } catch (error) {
      // Silent fail - brief saving is optional
      console.warn('Failed to save project brief:', error.message);
    }
  }
};