import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_generate_prd MCP Tool
 * PRD (Product Requirements Document) generation with template selection and interactive workflow
 */
export const saGeneratePrd = {
  name: 'sa_generate_prd',
  description: 'Generate comprehensive Product Requirements Documents with template selection, interactive creation workflow, requirements gathering, and validation',
  category: 'pm',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      productName: {
        type: 'string',
        description: 'Name of the product for the PRD',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      prdType: {
        type: 'string',
        description: 'Type of PRD to generate',
        enum: ['standard', 'brownfield', 'feature-prd', 'epic-prd', 'mvp-prd'],
        default: 'standard'
      },
      projectType: {
        type: 'string',
        description: 'Type of project',
        enum: ['greenfield', 'brownfield', 'enhancement', 'new-feature'],
        default: 'greenfield'
      },
      productInfo: {
        type: 'object',
        description: 'Product information',
        properties: {
          vision: { type: 'string' },
          mission: { type: 'string' },
          targetMarket: { type: 'string' },
          valueProposition: { type: 'string' },
          businessGoals: { type: 'array', items: { type: 'string' } }
        }
      },
      stakeholders: {
        type: 'array',
        description: 'Product stakeholders',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            responsibility: { type: 'string' },
            influence: { type: 'string', enum: ['high', 'medium', 'low'] }
          },
          required: ['name', 'role']
        }
      },
      userPersonas: {
        type: 'array',
        description: 'Target user personas',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            goals: { type: 'array', items: { type: 'string' } },
            painPoints: { type: 'array', items: { type: 'string' } },
            demographics: { type: 'string' }
          },
          required: ['name', 'description']
        }
      },
      requirements: {
        type: 'object',
        description: 'Initial requirements',
        properties: {
          functional: { type: 'array', items: { type: 'string' } },
          nonFunctional: { type: 'array', items: { type: 'string' } },
          technical: { type: 'array', items: { type: 'string' } },
          business: { type: 'array', items: { type: 'string' } }
        }
      },
      constraints: {
        type: 'object',
        description: 'Project constraints',
        properties: {
          timeline: { type: 'string' },
          budget: { type: 'string' },
          resources: { type: 'string' },
          technical: { type: 'array', items: { type: 'string' } },
          regulatory: { type: 'array', items: { type: 'string' } }
        }
      },
      interactive: {
        type: 'boolean',
        description: 'Enable interactive PRD creation workflow',
        default: true
      },
      detailLevel: {
        type: 'string',
        description: 'Level of detail for the PRD',
        enum: ['high-level', 'detailed', 'comprehensive'],
        default: 'detailed'
      }
    },
    required: ['productName']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.productName || typeof args.productName !== 'string') {
      errors.push('productName is required and must be a string');
    }
    
    if (args.productName && args.productName.trim().length === 0) {
      errors.push('productName cannot be empty');
    }
    
    if (args.stakeholders && !Array.isArray(args.stakeholders)) {
      errors.push('stakeholders must be an array');
    }
    
    if (args.userPersonas && !Array.isArray(args.userPersonas)) {
      errors.push('userPersonas must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute PRD generation
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const productName = args.productName.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      // Prepare PRD context
      const prdContext = {
        productName,
        prdType: args.prdType || 'standard',
        projectType: args.projectType || 'greenfield',
        detailLevel: args.detailLevel || 'detailed',
        productInfo: args.productInfo || {},
        stakeholders: args.stakeholders || [],
        userPersonas: args.userPersonas || [],
        requirements: args.requirements || {},
        constraints: args.constraints || {},
        interactive: args.interactive !== false,
        timestamp: new Date().toISOString(),
        author: context?.userId || 'system',
        prdId: `prd-${Date.now()}`
      };
      
      // Load and render PRD template
      const prdTemplate = await this.loadPrdTemplate(templateEngine, prdContext);
      
      // Render PRD using template engine
      let prdContent;
      try {
        const templateResult = await templateEngine.renderTemplate(prdTemplate.templateName, {
          project_name: prdContext.productName,
          product_name: prdContext.productName,
          prd_type: prdContext.prdType,
          project_type: prdContext.projectType,
          author: prdContext.author,
          timestamp: prdContext.timestamp,
          ...prdContext.productInfo,
          stakeholders: prdContext.stakeholders,
          user_personas: prdContext.userPersonas,
          requirements: prdContext.requirements,
          constraints: prdContext.constraints
        });
        prdContent = templateResult.content;
      } catch (templateError) {
        // Fallback to legacy structure generation
        const prdStructure = await this.generatePrdStructure(prdContext, prdTemplate);
        const requirementsFramework = await this.createRequirementsFramework(prdContext);
        prdContent = await this.generatePrdContent(prdContext, prdStructure, requirementsFramework);
      }
      
      // Create PRD workflow if interactive
      let workflow = null;
      if (prdContext.interactive) {
        workflow = await this.createPrdWorkflow(prdContext);
      }
      
      // Format output
      const output = await this.formatPrdOutput(prdContext, prdContent, workflow, requirementsFramework);
      
      // Save PRD to project
      await this.savePrdToProject(projectPath, prdContext, prdContent);
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          productName,
          prdType: args.prdType,
          projectType: args.projectType,
          detailLevel: args.detailLevel,
          interactive: args.interactive,
          stakeholderCount: prdContext.stakeholders.length,
          userPersonaCount: prdContext.userPersonas.length,
          prdId: prdContext.prdId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to generate PRD for ${productName}: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          productName,
          projectPath
        }
      };
    }
  },

  /**
   * Load PRD template based on type
   * @param {TemplateEngine} templateEngine - Template engine instance
   * @param {Object} context - PRD context
   * @returns {Promise<Object>} PRD template
   */
  async loadPrdTemplate(templateEngine, context) {
    try {
      let templateName;
      
      switch (context.prdType) {
        case 'brownfield':
          templateName = 'brownfield-prd-tmpl';
          break;
        case 'feature-prd':
          templateName = 'feature-prd-tmpl';
          break;
        case 'epic-prd':
          templateName = 'epic-prd-tmpl';
          break;
        case 'mvp-prd':
          templateName = 'mvp-prd-tmpl';
          break;
        default:
          templateName = 'prd-tmpl';
      }
      
      if (templateEngine.templateExists(templateName)) {
        const template = await templateEngine.getTemplate(templateName);
        return { ...template, templateName };
      } else {
        // Return default template info
        return { 
          templateName: 'prd-tmpl',
          ...this.getDefaultPrdTemplate(context.prdType, context.projectType) 
        };
      }
    } catch (error) {
      // Return default template based on type
      return { 
        templateName: 'prd-tmpl',
        ...this.getDefaultPrdTemplate(context.prdType, context.projectType) 
      };
    }
  },

  /**
   * Get default PRD template
   * @param {string} prdType - Type of PRD
   * @param {string} projectType - Type of project
   * @returns {Object} Default template structure
   */
  getDefaultPrdTemplate(prdType, projectType) {
    const baseTemplate = {
      name: 'Product Requirements Document',
      sections: [
        'Executive Summary',
        'Product Overview',
        'Market Analysis',
        'User Personas',
        'Product Goals & Objectives',
        'Functional Requirements',
        'Non-Functional Requirements',
        'User Stories & Use Cases',
        'Technical Requirements',
        'Design Requirements',
        'Success Metrics',
        'Timeline & Milestones',
        'Risk Assessment',
        'Assumptions & Dependencies'
      ]
    };
    
    switch (prdType) {
      case 'brownfield':
        return {
          ...baseTemplate,
          sections: [
            'Executive Summary',
            'Current State Analysis',
            'Gap Analysis',
            'Enhancement Objectives',
            'User Impact Analysis',
            'Technical Debt Assessment',
            'Enhancement Requirements',
            'Migration Strategy',
            'Implementation Plan',
            'Risk Mitigation',
            'Success Criteria',
            'Rollback Plan'
          ]
        };
      case 'feature-prd':
        return {
          ...baseTemplate,
          sections: [
            'Feature Overview',
            'Business Justification',
            'User Stories',
            'Functional Specifications',
            'Technical Specifications',
            'Design Requirements',
            'Acceptance Criteria',
            'Testing Requirements',
            'Success Metrics',
            'Implementation Timeline'
          ]
        };
      case 'mvp-prd':
        return {
          ...baseTemplate,
          sections: [
            'MVP Vision',
            'Problem Statement',
            'Target Users',
            'Core Value Proposition',
            'MVP Scope',
            'Core Features',
            'Success Criteria',
            'Launch Strategy',
            'Feedback Collection',
            'Iteration Plan'
          ]
        };
      default:
        return baseTemplate;
    }
  },

  /**
   * Generate PRD structure
   * @param {Object} context - PRD context
   * @param {Object} template - PRD template
   * @returns {Promise<Object>} PRD structure
   */
  async generatePrdStructure(context, template) {
    const structure = {
      metadata: {
        title: `${context.productName} - Product Requirements Document`,
        version: '1.0.0',
        author: context.author,
        created: context.timestamp,
        lastModified: context.timestamp,
        prdType: context.prdType,
        projectType: context.projectType,
        detailLevel: context.detailLevel
      },
      sections: {},
      appendices: []
    };
    
    // Generate sections based on template
    const sections = template.sections || [];
    
    for (const sectionName of sections) {
      structure.sections[sectionName] = {
        title: sectionName,
        order: sections.indexOf(sectionName) + 1,
        content: [],
        subsections: [],
        status: 'draft',
        requiredInfo: [],
        validationCriteria: []
      };
      
      // Add section-specific requirements
      await this.populateSectionRequirements(structure.sections[sectionName], sectionName, context);
    }
    
    return structure;
  },

  /**
   * Populate section requirements
   * @param {Object} section - Section object
   * @param {string} sectionName - Name of the section
   * @param {Object} context - PRD context
   */
  async populateSectionRequirements(section, sectionName, context) {
    switch (sectionName) {
      case 'Executive Summary':
        section.requiredInfo = [
          'Product vision and mission',
          'Key business objectives',
          'Target market overview',
          'Success criteria summary'
        ];
        section.validationCriteria = [
          'Clear and compelling vision statement',
          'Measurable business objectives',
          'Well-defined target market'
        ];
        break;
        
      case 'Product Overview':
        section.requiredInfo = [
          'Product description',
          'Value proposition',
          'Key differentiators',
          'Product positioning'
        ];
        section.validationCriteria = [
          'Clear product description',
          'Unique value proposition',
          'Competitive differentiation'
        ];
        break;
        
      case 'User Personas':
        section.requiredInfo = [
          'Primary user personas',
          'User goals and motivations',
          'Pain points and challenges',
          'User journey mapping'
        ];
        section.validationCriteria = [
          'Research-backed personas',
          'Clear user goals',
          'Identified pain points'
        ];
        if (context.userPersonas.length > 0) {
          section.content = context.userPersonas.map(persona => ({
            name: persona.name,
            description: persona.description,
            goals: persona.goals || [],
            painPoints: persona.painPoints || [],
            demographics: persona.demographics || ''
          }));
        }
        break;
        
      case 'Functional Requirements':
        section.requiredInfo = [
          'Core functionality',
          'Feature specifications',
          'User interactions',
          'System behaviors'
        ];
        section.validationCriteria = [
          'Complete functionality coverage',
          'Clear specifications',
          'Testable requirements'
        ];
        if (context.requirements.functional) {
          section.content = context.requirements.functional;
        }
        break;
        
      case 'Non-Functional Requirements':
        section.requiredInfo = [
          'Performance requirements',
          'Security requirements',
          'Scalability requirements',
          'Usability requirements'
        ];
        section.validationCriteria = [
          'Measurable performance criteria',
          'Security standards compliance',
          'Scalability targets'
        ];
        if (context.requirements.nonFunctional) {
          section.content = context.requirements.nonFunctional;
        }
        break;
        
      case 'Technical Requirements':
        section.requiredInfo = [
          'Technology stack',
          'Integration requirements',
          'Data requirements',
          'Infrastructure requirements'
        ];
        section.validationCriteria = [
          'Feasible technology choices',
          'Clear integration points',
          'Data architecture defined'
        ];
        if (context.requirements.technical) {
          section.content = context.requirements.technical;
        }
        break;
        
      case 'Success Metrics':
        section.requiredInfo = [
          'Key performance indicators',
          'Success criteria',
          'Measurement methods',
          'Target values'
        ];
        section.validationCriteria = [
          'SMART criteria compliance',
          'Measurable metrics',
          'Realistic targets'
        ];
        break;
        
      default:
        section.requiredInfo = [
          `Define ${sectionName} requirements`,
          `Specify ${sectionName} criteria`,
          `Document ${sectionName} details`
        ];
        section.validationCriteria = [
          `Complete ${sectionName} documentation`,
          `Clear ${sectionName} specifications`
        ];
    }
  },

  /**
   * Create requirements gathering framework
   * @param {Object} context - PRD context
   * @returns {Promise<Object>} Requirements framework
   */
  async createRequirementsFramework(context) {
    const framework = {
      gatheringMethods: {
        stakeholderInterviews: {
          description: 'One-on-one interviews with key stakeholders',
          participants: context.stakeholders.filter(s => s.influence === 'high'),
          questions: [
            'What are your main objectives for this product?',
            'What success looks like to you?',
            'What are your biggest concerns?',
            'What constraints should we be aware of?'
          ],
          duration: '45-60 minutes each'
        },
        userResearch: {
          description: 'Research with target users',
          methods: ['User interviews', 'Surveys', 'User journey mapping', 'Persona validation'],
          questions: [
            'What problems are you trying to solve?',
            'How do you currently solve these problems?',
            'What would an ideal solution look like?',
            'What would prevent you from using this product?'
          ]
        },
        competitiveAnalysis: {
          description: 'Analysis of competitive products',
          activities: [
            'Feature comparison matrix',
            'User experience analysis',
            'Pricing analysis',
            'Market positioning analysis'
          ]
        },
        technicalAnalysis: {
          description: 'Technical feasibility and requirements analysis',
          activities: [
            'Technology stack evaluation',
            'Integration requirements assessment',
            'Performance requirements definition',
            'Security requirements analysis'
          ]
        }
      },
      requirementTypes: {
        functional: {
          description: 'What the system should do',
          examples: ['User authentication', 'Data processing', 'Report generation'],
          template: 'The system shall [action] when [condition]'
        },
        nonFunctional: {
          description: 'How the system should perform',
          categories: ['Performance', 'Security', 'Usability', 'Reliability', 'Scalability'],
          template: 'The system shall [perform] within [constraint]'
        },
        business: {
          description: 'Business rules and constraints',
          examples: ['Compliance requirements', 'Business processes', 'Approval workflows'],
          template: 'The business requires [rule] to [achieve goal]'
        },
        technical: {
          description: 'Technical implementation requirements',
          examples: ['Technology stack', 'Integration points', 'Data formats'],
          template: 'The system must [implement] using [technology/method]'
        }
      },
      prioritizationFramework: {
        method: 'MoSCoW prioritization',
        categories: {
          must: 'Critical requirements that must be delivered',
          should: 'Important requirements that should be delivered if possible',
          could: 'Nice-to-have requirements that could be delivered',
          wont: 'Requirements that will not be delivered in this release'
        },
        criteria: ['Business value', 'User impact', 'Technical feasibility', 'Cost/effort']
      }
    };
    
    return framework;
  },

  /**
   * Generate PRD content
   * @param {Object} context - PRD context
   * @param {Object} structure - PRD structure
   * @param {Object} framework - Requirements framework
   * @returns {Promise<Object>} Generated PRD content
   */
  async generatePrdContent(context, structure, framework) {
    const content = {
      ...structure,
      executiveSummary: '',
      introduction: '',
      tableOfContents: [],
      glossary: {},
      references: []
    };
    
    // Generate executive summary
    content.executiveSummary = this.generateExecutiveSummary(context);
    
    // Generate introduction
    content.introduction = this.generateIntroduction(context);
    
    // Generate table of contents
    content.tableOfContents = Object.entries(structure.sections).map(([name, section]) => ({
      section: name,
      order: section.order,
      pageNumber: section.order // Placeholder
    }));
    
    // Add requirements gathering guidance
    content.requirementsGathering = framework;
    
    return content;
  },

  /**
   * Generate executive summary
   * @param {Object} context - PRD context
   * @returns {string} Executive summary
   */
  generateExecutiveSummary(context) {
    let summary = `This Product Requirements Document (PRD) outlines the requirements for ${context.productName}, `;
    
    if (context.productInfo.vision) {
      summary += `a ${context.productType} product aimed at ${context.productInfo.vision}. `;
    } else {
      summary += `a ${context.projectType} initiative. `;
    }
    
    if (context.productInfo.targetMarket) {
      summary += `The target market includes ${context.productInfo.targetMarket}. `;
    }
    
    if (context.productInfo.valueProposition) {
      summary += `The core value proposition is ${context.productInfo.valueProposition}. `;
    }
    
    if (context.productInfo.businessGoals && context.productInfo.businessGoals.length > 0) {
      summary += `Key business goals include: ${context.productInfo.businessGoals.join(', ')}. `;
    }
    
    summary += `This document serves as the primary reference for development, design, and testing teams throughout the product development lifecycle.`;
    
    return summary;
  },

  /**
   * Generate introduction
   * @param {Object} context - PRD context
   * @returns {string} Introduction
   */
  generateIntroduction(context) {
    let intro = `## Purpose\n\n`;
    intro += `This PRD defines the requirements for ${context.productName} and serves as a comprehensive guide for all stakeholders involved in the product development process. `;
    intro += `It establishes a shared understanding of what the product should achieve and how it should function.\n\n`;
    
    intro += `## Scope\n\n`;
    intro += `This document covers the ${context.detailLevel} requirements for ${context.productName}. `;
    
    switch (context.prdType) {
      case 'brownfield':
        intro += `As a brownfield project, this PRD focuses on enhancements to existing systems and products.\n\n`;
        break;
      case 'feature-prd':
        intro += `This feature-specific PRD details the requirements for a specific feature addition.\n\n`;
        break;
      case 'mvp-prd':
        intro += `This MVP PRD defines the minimum viable product requirements for initial launch.\n\n`;
        break;
      default:
        intro += `This PRD covers the full product development lifecycle from conception to launch.\n\n`;
    }
    
    intro += `## Audience\n\n`;
    intro += `This document is intended for:\n`;
    intro += `- Product managers and owners\n`;
    intro += `- Engineering and development teams\n`;
    intro += `- Design and UX teams\n`;
    intro += `- Quality assurance teams\n`;
    intro += `- Business stakeholders\n`;
    intro += `- Project managers\n\n`;
    
    return intro;
  },

  /**
   * Create PRD workflow
   * @param {Object} context - PRD context
   * @returns {Promise<Object>} PRD workflow
   */
  async createPrdWorkflow(context) {
    const workflow = {
      id: context.prdId,
      name: `PRD Development: ${context.productName}`,
      phases: [
        {
          id: 'discovery',
          name: 'Discovery & Research',
          description: 'Gather information and conduct research',
          duration: '1-2 weeks',
          tasks: [
            'Stakeholder interviews',
            'User research',
            'Competitive analysis',
            'Technical feasibility assessment'
          ],
          deliverables: [
            'Stakeholder requirements',
            'User personas and journey maps',
            'Competitive analysis report',
            'Technical constraints documentation'
          ]
        },
        {
          id: 'requirements',
          name: 'Requirements Definition',
          description: 'Define and prioritize requirements',
          duration: '1-2 weeks',
          tasks: [
            'Functional requirements definition',
            'Non-functional requirements specification',
            'Business rules documentation',
            'Requirements prioritization'
          ],
          deliverables: [
            'Functional requirements list',
            'Non-functional requirements specification',
            'Prioritized requirements backlog'
          ]
        },
        {
          id: 'documentation',
          name: 'PRD Documentation',
          description: 'Create comprehensive PRD document',
          duration: '1 week',
          tasks: [
            'Draft PRD sections',
            'Create user stories',
            'Define success metrics',
            'Document assumptions and risks'
          ],
          deliverables: [
            'Complete PRD draft',
            'User stories backlog',
            'Success metrics framework'
          ]
        },
        {
          id: 'review',
          name: 'Review & Validation',
          description: 'Review and validate PRD with stakeholders',
          duration: '1 week',
          tasks: [
            'Stakeholder review sessions',
            'Technical feasibility validation',
            'Business alignment verification',
            'Requirements traceability check'
          ],
          deliverables: [
            'Stakeholder sign-off',
            'Technical validation report',
            'Final PRD document'
          ]
        },
        {
          id: 'finalization',
          name: 'Finalization & Distribution',
          description: 'Finalize PRD and distribute to teams',
          duration: '3-5 days',
          tasks: [
            'Incorporate review feedback',
            'Finalize PRD document',
            'Create implementation roadmap',
            'Distribute to development teams'
          ],
          deliverables: [
            'Final PRD document',
            'Implementation roadmap',
            'Team communication plan'
          ]
        }
      ],
      estimatedDuration: '4-6 weeks',
      dependencies: [
        'Stakeholder availability',
        'User research completion',
        'Technical architecture decisions'
      ]
    };
    
    return workflow;
  },

  /**
   * Format PRD output
   * @param {Object} context - PRD context
   * @param {Object} content - PRD content
   * @param {Object} workflow - PRD workflow
   * @param {Object} framework - Requirements framework
   * @returns {Promise<string>} Formatted output
   */
  async formatPrdOutput(context, content, workflow, framework) {
    let output = `📋 **Product Requirements Document: ${context.productName}**\n\n`;
    output += `📄 **PRD Type:** ${context.prdType}\n`;
    output += `🏗️ **Project Type:** ${context.projectType}\n`;
    output += `📊 **Detail Level:** ${context.detailLevel}\n`;
    output += `👥 **Stakeholders:** ${context.stakeholders.length}\n`;
    output += `🎭 **User Personas:** ${context.userPersonas.length}\n`;
    output += `🆔 **PRD ID:** ${context.prdId}\n\n`;
    
    // Executive Summary
    output += `## 📝 Executive Summary\n\n`;
    output += `${content.executiveSummary}\n\n`;
    
    // PRD Structure
    output += `## 📚 PRD Structure\n\n`;
    content.tableOfContents.forEach(item => {
      output += `${item.order}. **${item.section}**\n`;
    });
    output += '\n';
    
    // Section Details
    output += `## 📋 Section Requirements\n\n`;
    Object.entries(content.sections).forEach(([sectionName, section]) => {
      output += `### ${section.order}. ${section.title}\n`;
      
      if (section.content && section.content.length > 0) {
        output += `**Current Content:**\n`;
        if (typeof section.content[0] === 'object') {
          section.content.forEach(item => {
            if (item.name) {
              output += `• **${item.name}:** ${item.description || ''}\n`;
            }
          });
        } else {
          section.content.forEach(item => {
            output += `• ${item}\n`;
          });
        }
        output += '\n';
      }
      
      output += `**Required Information:**\n`;
      section.requiredInfo.forEach(info => {
        output += `• ${info}\n`;
      });
      
      output += `\n**Validation Criteria:**\n`;
      section.validationCriteria.forEach(criteria => {
        output += `• ${criteria}\n`;
      });
      output += '\n';
    });
    
    // Requirements Gathering Framework
    output += `## 🔍 Requirements Gathering Framework\n\n`;
    
    Object.entries(framework.gatheringMethods).forEach(([method, details]) => {
      output += `### ${method.charAt(0).toUpperCase() + method.slice(1).replace(/([A-Z])/g, ' $1')}\n`;
      output += `**Description:** ${details.description}\n`;
      
      if (details.participants) {
        output += `**Participants:** ${details.participants.map(p => p.name).join(', ')}\n`;
      }
      
      if (details.methods) {
        output += `**Methods:** ${details.methods.join(', ')}\n`;
      }
      
      if (details.activities) {
        output += `**Activities:**\n`;
        details.activities.forEach(activity => {
          output += `• ${activity}\n`;
        });
      }
      
      if (details.questions) {
        output += `**Key Questions:**\n`;
        details.questions.forEach(question => {
          output += `• ${question}\n`;
        });
      }
      
      if (details.duration) {
        output += `**Duration:** ${details.duration}\n`;
      }
      output += '\n';
    });
    
    // Requirements Types
    output += `### Requirements Types\n\n`;
    Object.entries(framework.requirementTypes).forEach(([type, details]) => {
      output += `**${type.charAt(0).toUpperCase() + type.slice(1)} Requirements**\n`;
      output += `*Description:* ${details.description}\n`;
      
      if (details.categories) {
        output += `*Categories:* ${details.categories.join(', ')}\n`;
      }
      
      if (details.examples) {
        output += `*Examples:* ${details.examples.join(', ')}\n`;
      }
      
      output += `*Template:* "${details.template}"\n\n`;
    });
    
    // Prioritization Framework
    output += `### Prioritization Framework\n\n`;
    output += `**Method:** ${framework.prioritizationFramework.method}\n\n`;
    Object.entries(framework.prioritizationFramework.categories).forEach(([category, description]) => {
      output += `• **${category.toUpperCase()}:** ${description}\n`;
    });
    output += `\n**Criteria:** ${framework.prioritizationFramework.criteria.join(', ')}\n\n`;
    
    if (workflow) {
      // PRD Development Workflow
      output += `## ⏰ PRD Development Workflow\n\n`;
      output += `**Estimated Duration:** ${workflow.estimatedDuration}\n\n`;
      
      workflow.phases.forEach((phase, index) => {
        output += `### Phase ${index + 1}: ${phase.name}\n`;
        output += `**Duration:** ${phase.duration}\n`;
        output += `**Description:** ${phase.description}\n\n`;
        
        output += `**Tasks:**\n`;
        phase.tasks.forEach(task => {
          output += `• ${task}\n`;
        });
        
        output += `\n**Deliverables:**\n`;
        phase.deliverables.forEach(deliverable => {
          output += `• ${deliverable}\n`;
        });
        output += '\n';
      });
      
      output += `**Dependencies:**\n`;
      workflow.dependencies.forEach(dependency => {
        output += `• ${dependency}\n`;
      });
      output += '\n';
    }
    
    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Begin Discovery Phase:**\n`;
    output += `   • Schedule stakeholder interviews\n`;
    output += `   • Plan user research activities\n`;
    output += `   • Initiate competitive analysis\n\n`;
    
    output += `2. **Set Up Documentation:**\n`;
    output += `   • Create PRD document structure\n`;
    output += `   • Establish version control\n`;
    output += `   • Set up collaboration tools\n\n`;
    
    output += `3. **Engage Stakeholders:**\n`;
    output += `   • Communicate PRD timeline\n`;
    output += `   • Schedule regular review sessions\n`;
    output += `   • Establish feedback mechanisms\n\n`;
    
    output += `💡 **PRD Best Practices:**\n`;
    output += `• Keep requirements specific and testable\n`;
    output += `• Prioritize based on business value\n`;
    output += `• Include acceptance criteria for each requirement\n`;
    output += `• Maintain traceability from business goals to features\n`;
    output += `• Update PRD regularly as requirements evolve\n`;
    output += `• Involve all stakeholders in the review process\n\n`;
    
    output += `📁 **PRD template and framework saved to project for development.**`;
    
    return output;
  },

  /**
   * Save PRD to project
   * @param {string} projectPath - Project path
   * @param {Object} context - PRD context
   * @param {Object} content - PRD content
   * @returns {Promise<void>}
   */
  async savePrdToProject(projectPath, context, content) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) {
        return; // No SA project, skip saving
      }
      
      const prdsDir = join(saDir, 'prds');
      if (!existsSync(prdsDir)) {
        require('fs').mkdirSync(prdsDir, { recursive: true });
      }
      
      const prdData = {
        context,
        content,
        createdAt: new Date().toISOString()
      };
      
      const filename = `prd-${context.productName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(prdsDir, filename);
      
      writeFileSync(filepath, JSON.stringify(prdData, null, 2));
      
      // Also create a markdown template
      const mdFilename = filename.replace('.json', '.md');
      const mdFilepath = join(prdsDir, mdFilename);
      const markdownContent = this.generateMarkdownTemplate(context, content);
      
      writeFileSync(mdFilepath, markdownContent);
      
    } catch (error) {
      // Silent fail - PRD saving is optional
      console.warn('Failed to save PRD:', error.message);
    }
  },

  /**
   * Generate markdown template
   * @param {Object} context - PRD context
   * @param {Object} content - PRD content
   * @returns {string} Markdown template
   */
  generateMarkdownTemplate(context, content) {
    let md = `# ${content.metadata.title}\n\n`;
    md += `**Version:** ${content.metadata.version}\n`;
    md += `**Author:** ${content.metadata.author}\n`;
    md += `**Created:** ${new Date(content.metadata.created).toLocaleDateString()}\n`;
    md += `**PRD Type:** ${content.metadata.prdType}\n`;
    md += `**Project Type:** ${content.metadata.projectType}\n\n`;
    
    md += `## Executive Summary\n\n`;
    md += `${content.executiveSummary}\n\n`;
    
    md += `${content.introduction}\n`;
    
    md += `## Table of Contents\n\n`;
    content.tableOfContents.forEach(item => {
      md += `${item.order}. [${item.section}](#${item.section.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
    });
    md += '\n';
    
    Object.entries(content.sections).forEach(([sectionName, section]) => {
      md += `## ${section.order}. ${section.title}\n\n`;
      md += `<!-- TODO: Fill in ${section.title} content -->\n\n`;
      
      if (section.requiredInfo.length > 0) {
        md += `### Required Information\n\n`;
        section.requiredInfo.forEach(info => {
          md += `- [ ] ${info}\n`;
        });
        md += '\n';
      }
    });
    
    return md;
  }
};