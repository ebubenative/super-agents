import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_create_architecture MCP Tool
 * Architecture documentation creation with template selection and diagram workflows
 */
export const saCreateArchitecture = {
  name: 'sa_create_architecture',
  description: 'Create comprehensive architecture documentation with template selection, documentation generation, diagram creation workflows, and architecture validation',
  category: 'architect',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      systemName: {
        type: 'string',
        description: 'Name of the system for architecture documentation',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      architectureType: {
        type: 'string',
        description: 'Type of architecture to document',
        enum: ['system-architecture', 'software-architecture', 'solution-architecture', 'enterprise-architecture', 'microservices-architecture'],
        default: 'system-architecture'
      },
      documentationType: {
        type: 'string',
        description: 'Type of documentation to create',
        enum: ['comprehensive', 'high-level', 'technical-specification', 'executive-summary'],
        default: 'comprehensive'
      },
      architectureComponents: {
        type: 'object',
        description: 'Architecture components to document',
        properties: {
          frontend: { type: 'array', items: { type: 'string' } },
          backend: { type: 'array', items: { type: 'string' } },
          database: { type: 'array', items: { type: 'string' } },
          infrastructure: { type: 'array', items: { type: 'string' } },
          integrations: { type: 'array', items: { type: 'string' } },
          security: { type: 'array', items: { type: 'string' } }
        }
      },
      qualityAttributes: {
        type: 'object',
        description: 'Quality attributes and requirements',
        properties: {
          performance: { type: 'string' },
          scalability: { type: 'string' },
          availability: { type: 'string' },
          security: { type: 'string' },
          maintainability: { type: 'string' },
          usability: { type: 'string' }
        }
      },
      designDecisions: {
        type: 'array',
        description: 'Key architecture design decisions',
        items: {
          type: 'object',
          properties: {
            decision: { type: 'string' },
            rationale: { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' } },
            consequences: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      stakeholders: {
        type: 'array',
        description: 'Architecture stakeholders',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      includeValidation: {
        type: 'boolean',
        description: 'Include architecture validation framework',
        default: true
      },
      generateDiagrams: {
        type: 'boolean',
        description: 'Generate architecture diagram specifications',
        default: true
      }
    },
    required: ['systemName']
  },

  validate(args) {
    const errors = [];
    
    if (!args.systemName || typeof args.systemName !== 'string') {
      errors.push('systemName is required and must be a string');
    }
    
    if (args.systemName && args.systemName.trim().length === 0) {
      errors.push('systemName cannot be empty');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const systemName = args.systemName.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      const documentationContext = {
        systemName,
        architectureType: args.architectureType || 'system-architecture',
        documentationType: args.documentationType || 'comprehensive',
        components: args.architectureComponents || {},
        qualityAttributes: args.qualityAttributes || {},
        designDecisions: args.designDecisions || [],
        stakeholders: args.stakeholders || [],
        includeValidation: args.includeValidation !== false,
        generateDiagrams: args.generateDiagrams !== false,
        timestamp: new Date().toISOString(),
        architect: context?.userId || 'system',
        documentId: `arch-doc-${Date.now()}`
      };

      // Load architecture template
      const architectureTemplate = await this.loadArchitectureTemplate(templateEngine, documentationContext);
      
      // Generate documentation structure
      const documentationStructure = await this.createDocumentationStructure(documentationContext, architectureTemplate);
      
      // Generate architecture content
      const architectureContent = await this.generateArchitectureContent(documentationContext, documentationStructure);
      
      // Generate diagram specifications
      let diagramSpecs = null;
      if (documentationContext.generateDiagrams) {
        diagramSpecs = await this.generateDiagramSpecifications(documentationContext, architectureContent);
      }
      
      // Create validation framework
      let validationFramework = null;
      if (documentationContext.includeValidation) {
        validationFramework = await this.createArchitectureValidation(documentationContext, architectureContent);
      }
      
      // Generate final documentation
      const finalDocumentation = await this.assembleFinalDocumentation(
        documentationContext,
        architectureContent,
        diagramSpecs,
        validationFramework
      );
      
      // Format output
      const output = await this.formatArchitectureDocumentationOutput(
        documentationContext,
        finalDocumentation,
        diagramSpecs,
        validationFramework
      );
      
      // Save documentation
      await this.saveArchitectureDocumentationToProject(projectPath, documentationContext, {
        content: architectureContent,
        documentation: finalDocumentation,
        diagrams: diagramSpecs,
        validation: validationFramework
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          systemName,
          architectureType: args.architectureType,
          documentationType: args.documentationType,
          includeValidation: args.includeValidation,
          generateDiagrams: args.generateDiagrams,
          documentId: documentationContext.documentId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to create architecture documentation for ${systemName}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, systemName, projectPath }
      };
    }
  },

  async loadArchitectureTemplate(templateEngine, context) {
    try {
      let templateName;
      
      switch (context.architectureType) {
        case 'microservices-architecture':
          templateName = 'microservices-architecture-tmpl.yaml';
          break;
        case 'solution-architecture':
          templateName = 'solution-architecture-tmpl.yaml';
          break;
        case 'enterprise-architecture':
          templateName = 'enterprise-architecture-tmpl.yaml';
          break;
        default:
          templateName = 'architecture-tmpl.yaml';
      }
      
      const template = await templateEngine.getTemplate(templateName);
      return template;
    } catch (error) {
      return this.getDefaultArchitectureTemplate(context.architectureType);
    }
  },

  getDefaultArchitectureTemplate(architectureType) {
    const baseTemplate = {
      name: 'Architecture Documentation Template',
      sections: [
        'Executive Summary',
        'Architecture Overview',
        'System Context',
        'Architecture Drivers',
        'Solution Overview',
        'Detailed Design',
        'Quality Attributes',
        'Design Decisions',
        'Deployment View',
        'Implementation Guidance'
      ]
    };
    
    switch (architectureType) {
      case 'microservices-architecture':
        return {
          ...baseTemplate,
          sections: [
            'Executive Summary',
            'Microservices Overview',
            'Service Decomposition',
            'Service Communication',
            'Data Management',
            'Cross-cutting Concerns',
            'Deployment Strategy',
            'Monitoring & Observability',
            'Security Architecture',
            'Operations & DevOps'
          ]
        };
      case 'solution-architecture':
        return {
          ...baseTemplate,
          sections: [
            'Business Context',
            'Solution Overview',
            'Functional Architecture',
            'Technical Architecture',
            'Integration Architecture',
            'Security Architecture',
            'Performance & Scalability',
            'Implementation Strategy',
            'Risk Assessment',
            'Governance & Standards'
          ]
        };
      default:
        return baseTemplate;
    }
  },

  async createDocumentationStructure(context, template) {
    const structure = {
      metadata: {
        title: `${context.systemName} Architecture Documentation`,
        version: '1.0.0',
        created: context.timestamp,
        architect: context.architect,
        documentType: context.documentationType,
        architectureType: context.architectureType
      },
      sections: {},
      appendices: [],
      references: []
    };
    
    // Create sections based on template
    const sections = template.sections || [];
    
    sections.forEach((sectionName, index) => {
      structure.sections[sectionName] = {
        title: sectionName,
        order: index + 1,
        content: [],
        subsections: [],
        diagrams: [],
        tables: [],
        status: 'draft'
      };
    });
    
    return structure;
  },

  async generateArchitectureContent(context, structure) {
    const content = {
      ...structure,
      executiveSummary: this.generateExecutiveSummary(context),
      architectureOverview: this.generateArchitectureOverview(context),
      systemContext: this.generateSystemContext(context),
      qualityAttributes: this.generateQualityAttributesSection(context),
      designDecisions: this.generateDesignDecisionsSection(context),
      componentCatalog: this.generateComponentCatalog(context),
      deploymentStrategy: this.generateDeploymentStrategy(context)
    };
    
    // Populate sections with generated content
    Object.keys(structure.sections).forEach(sectionName => {
      content.sections[sectionName] = this.populateSectionContent(sectionName, context, content);
    });
    
    return content;
  },

  generateExecutiveSummary(context) {
    return `
# Executive Summary

## Purpose
This document provides a comprehensive architectural overview of ${context.systemName}, detailing the system design, key components, and implementation guidance.

## Architecture Type
${context.architectureType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

## Key Architecture Characteristics
${context.qualityAttributes.performance ? `- Performance: ${context.qualityAttributes.performance}` : ''}
${context.qualityAttributes.scalability ? `- Scalability: ${context.qualityAttributes.scalability}` : ''}
${context.qualityAttributes.availability ? `- Availability: ${context.qualityAttributes.availability}` : ''}
${context.qualityAttributes.security ? `- Security: ${context.qualityAttributes.security}` : ''}

## Strategic Alignment
The architecture supports business objectives through scalable, maintainable, and secure design principles.

## Key Benefits
- Improved system maintainability and extensibility
- Enhanced performance and scalability
- Stronger security posture
- Reduced operational complexity
- Better developer productivity
`;
  },

  generateArchitectureOverview(context) {
    return `
# Architecture Overview

## System Purpose
${context.systemName} is designed to [describe the primary purpose and value proposition of the system].

## Architecture Style
The system follows a ${context.architectureType} approach, emphasizing:
- Modularity and separation of concerns
- Scalability and performance optimization
- Security and compliance requirements
- Maintainability and operational efficiency

## High-Level Components
${Object.entries(context.components).map(([category, components]) => 
  components.length > 0 ? `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n${components.map(c => `- ${c}`).join('\n')}` : ''
).filter(Boolean).join('\n\n')}

## Technology Stack
[Technology stack will be documented based on implementation choices]
`;
  },

  generateSystemContext(context) {
    return `
# System Context

## Business Context
The system operates within [describe business environment and constraints].

## Stakeholders
${context.stakeholders.map(stakeholder => `
### ${stakeholder.name} - ${stakeholder.role}
**Concerns:**
${stakeholder.concerns.map(concern => `- ${concern}`).join('\n')}
`).join('\n')}

## External Systems
[Document external systems and integration points]

## Constraints
- Technical constraints: [List technical limitations]
- Business constraints: [List business limitations]
- Regulatory constraints: [List compliance requirements]
`;
  },

  generateQualityAttributesSection(context) {
    const attributes = context.qualityAttributes;
    
    return `
# Quality Attributes

## Performance Requirements
${attributes.performance || 'To be defined based on system requirements'}

## Scalability Requirements
${attributes.scalability || 'To be defined based on growth projections'}

## Availability Requirements
${attributes.availability || 'To be defined based on business needs'}

## Security Requirements
${attributes.security || 'To be defined based on risk assessment'}

## Maintainability Requirements
${attributes.maintainability || 'To be defined based on team capabilities'}

## Usability Requirements
${attributes.usability || 'To be defined based on user needs'}

## Quality Attribute Scenarios
[Detailed scenarios and measures for each quality attribute]
`;
  },

  generateDesignDecisionsSection(context) {
    if (context.designDecisions.length === 0) {
      return `
# Design Decisions

## Architecture Decision Records (ADRs)
Design decisions will be documented as they are made during the implementation process.

## Decision Template
Each decision will include:
- Context and problem statement
- Considered options
- Decision rationale
- Consequences and trade-offs
`;
    }
    
    return `
# Design Decisions

## Architecture Decision Records (ADRs)

${context.designDecisions.map((decision, index) => `
### ADR-${String(index + 1).padStart(3, '0')}: ${decision.decision}

**Context:** ${decision.rationale}

**Decision:** ${decision.decision}

**Alternatives Considered:**
${decision.alternatives?.map(alt => `- ${alt}`).join('\n') || 'None documented'}

**Consequences:**
${decision.consequences?.map(cons => `- ${cons}`).join('\n') || 'To be documented'}

**Status:** Approved
**Date:** ${new Date().toLocaleDateString()}
`).join('\n')}
`;
  },

  generateComponentCatalog(context) {
    return `
# Component Catalog

## Component Overview
This section provides detailed information about each system component.

${Object.entries(context.components).map(([category, components]) => 
  components.length > 0 ? `
## ${category.charAt(0).toUpperCase() + category.slice(1)} Components

${components.map(component => `
### ${component}
- **Purpose:** [Define the component's primary responsibility]
- **Interfaces:** [Document component interfaces]
- **Dependencies:** [List component dependencies]
- **Technology:** [Specify implementation technology]
- **Quality Attributes:** [Component-specific quality requirements]
`).join('\n')}
` : ''
).filter(Boolean).join('\n')}

## Component Interaction
[Describe how components interact with each other]

## Component Lifecycle
[Document component deployment and operational considerations]
`;
  },

  generateDeploymentStrategy(context) {
    return `
# Deployment Strategy

## Deployment Architecture
[Describe the deployment topology and infrastructure requirements]

## Environment Strategy
- **Development:** Local development environment setup
- **Testing:** Integration and system testing environment
- **Staging:** Pre-production environment for final validation
- **Production:** Live production environment

## Deployment Process
1. Code compilation and artifact creation
2. Automated testing execution
3. Security scanning and quality gates
4. Environment-specific configuration
5. Blue-green or rolling deployment
6. Post-deployment validation

## Infrastructure Requirements
- Compute resources
- Storage requirements
- Network configuration
- Security controls
- Monitoring and logging

## Operational Considerations
- Backup and recovery procedures
- Monitoring and alerting setup
- Performance optimization
- Capacity planning
`;
  },

  populateSectionContent(sectionName, context, content) {
    const section = {
      title: sectionName,
      content: [],
      diagrams: [],
      tables: [],
      status: 'draft'
    };
    
    switch (sectionName) {
      case 'Executive Summary':
        section.content = [content.executiveSummary];
        break;
      case 'Architecture Overview':
      case 'System Overview':
        section.content = [content.architectureOverview];
        section.diagrams = ['System Context Diagram', 'High-Level Architecture Diagram'];
        break;
      case 'System Context':
        section.content = [content.systemContext];
        section.diagrams = ['System Context Diagram', 'Stakeholder Map'];
        break;
      case 'Quality Attributes':
        section.content = [content.qualityAttributes];
        section.tables = ['Quality Attribute Scenarios', 'Quality Metrics'];
        break;
      case 'Design Decisions':
        section.content = [content.designDecisions];
        section.tables = ['Decision Summary Table'];
        break;
      case 'Detailed Design':
        section.content = [content.componentCatalog];
        section.diagrams = ['Component Diagram', 'Sequence Diagrams'];
        break;
      case 'Deployment View':
        section.content = [content.deploymentStrategy];
        section.diagrams = ['Deployment Diagram', 'Infrastructure Diagram'];
        break;
      default:
        section.content = [`[${sectionName} content to be documented]`];
    }
    
    return section;
  },

  async generateDiagramSpecifications(context, content) {
    const diagrams = {
      systemContext: this.generateSystemContextDiagramSpec(context),
      highLevelArchitecture: this.generateHighLevelArchitectureDiagramSpec(context),
      componentDiagram: this.generateComponentDiagramSpec(context),
      deploymentDiagram: this.generateDeploymentDiagramSpec(context),
      sequenceDiagrams: this.generateSequenceDiagramSpecs(context)
    };
    
    return diagrams;
  },

  generateSystemContextDiagramSpec(context) {
    return {
      type: 'system-context',
      title: `${context.systemName} System Context`,
      description: 'Shows the system in its environment with external actors and systems',
      elements: [
        { type: 'system', name: context.systemName, description: 'Main system under design' },
        { type: 'actor', name: 'Users', description: 'System users' },
        { type: 'external-system', name: 'External APIs', description: 'Third-party integrations' }
      ],
      relationships: [
        { from: 'Users', to: context.systemName, description: 'Uses' },
        { from: context.systemName, to: 'External APIs', description: 'Integrates with' }
      ],
      tools: ['C4 Model', 'PlantUML', 'Draw.io', 'Lucidchart']
    };
  },

  generateHighLevelArchitectureDiagramSpec(context) {
    return {
      type: 'high-level-architecture',
      title: `${context.systemName} High-Level Architecture`,
      description: 'Shows major system components and their relationships',
      layers: Object.keys(context.components).filter(key => context.components[key].length > 0),
      components: context.components,
      tools: ['C4 Model Container Diagram', 'ArchiMate', 'AWS Architecture Icons']
    };
  },

  generateComponentDiagramSpec(context) {
    return {
      type: 'component-diagram',
      title: `${context.systemName} Component Architecture`,
      description: 'Detailed view of system components and their interfaces',
      components: Object.values(context.components).flat(),
      interfaces: ['REST APIs', 'Message Queues', 'Database Connections'],
      tools: ['UML Component Diagrams', 'C4 Component Diagrams', 'PlantUML']
    };
  },

  generateDeploymentDiagramSpec(context) {
    return {
      type: 'deployment-diagram',
      title: `${context.systemName} Deployment Architecture`,
      description: 'Shows how components are deployed to infrastructure',
      environments: ['Development', 'Testing', 'Production'],
      infrastructure: ['Load Balancers', 'Application Servers', 'Databases', 'CDN'],
      tools: ['UML Deployment Diagrams', 'Infrastructure as Code Diagrams', 'Cloud Architecture Diagrams']
    };
  },

  generateSequenceDiagramSpecs(context) {
    return [
      {
        type: 'sequence-diagram',
        title: 'User Authentication Flow',
        description: 'Shows the authentication process sequence',
        actors: ['User', 'Frontend', 'Authentication Service', 'Database'],
        tools: ['PlantUML', 'Sequence Diagram tools', 'Mermaid']
      },
      {
        type: 'sequence-diagram',
        title: 'Data Processing Flow',
        description: 'Shows the main data processing sequence',
        actors: ['Client', 'API Gateway', 'Business Logic', 'Data Store'],
        tools: ['PlantUML', 'Sequence Diagram tools', 'Mermaid']
      }
    ];
  },

  async createArchitectureValidation(context, content) {
    return {
      validationCriteria: this.defineValidationCriteria(context),
      reviewProcess: this.defineReviewProcess(context),
      complianceChecks: this.defineComplianceChecks(context),
      qualityGates: this.defineQualityGates(context),
      metrics: this.defineArchitectureMetrics(context)
    };
  },

  defineValidationCriteria(context) {
    return {
      completeness: [
        'All architectural views are documented',
        'Quality attributes are defined and measurable',
        'Design decisions are documented with rationale',
        'Component interfaces are specified',
        'Deployment strategy is defined'
      ],
      consistency: [
        'Component relationships are consistent across views',
        'Technology choices align with constraints',
        'Quality attributes are addressed in design',
        'Design decisions support business requirements'
      ],
      feasibility: [
        'Technical implementation is achievable',
        'Performance requirements are realistic',
        'Security requirements are addressed',
        'Operational requirements are considered'
      ]
    };
  },

  defineReviewProcess(context) {
    return {
      reviewTypes: [
        {
          type: 'Peer Review',
          participants: ['Fellow Architects', 'Senior Developers'],
          focus: 'Technical accuracy and best practices',
          timing: 'After initial draft completion'
        },
        {
          type: 'Stakeholder Review',
          participants: ['Business Stakeholders', 'Product Owners'],
          focus: 'Business alignment and feasibility',
          timing: 'After technical validation'
        },
        {
          type: 'Security Review',
          participants: ['Security Team', 'Compliance Officers'],
          focus: 'Security architecture and compliance',
          timing: 'Before final approval'
        }
      ],
      reviewCriteria: [
        'Architecture addresses all requirements',
        'Design decisions are well justified',
        'Quality attributes are achievable',
        'Implementation guidance is clear',
        'Risk assessment is comprehensive'
      ]
    };
  },

  defineComplianceChecks(context) {
    return {
      standards: [
        'Industry standards compliance (ISO, NIST, etc.)',
        'Organizational architecture standards',
        'Security and privacy regulations',
        'Technology governance requirements'
      ],
      checkpoints: [
        'Design phase compliance review',
        'Implementation readiness assessment',
        'Security architecture validation',
        'Performance requirements validation'
      ]
    };
  },

  defineQualityGates(context) {
    return {
      documentationQuality: [
        'All sections are complete and accurate',
        'Diagrams are clear and up-to-date',
        'Technical details are sufficient for implementation',
        'Review feedback has been addressed'
      ],
      architecturalQuality: [
        'Design supports all quality attributes',
        'Component interfaces are well-defined',
        'Technology choices are justified',
        'Risk mitigation strategies are in place'
      ]
    };
  },

  defineArchitectureMetrics(context) {
    return {
      designMetrics: [
        'Component coupling and cohesion',
        'Architecture complexity measures',
        'Interface stability metrics',
        'Design pattern compliance'
      ],
      qualityMetrics: [
        'Performance benchmark targets',
        'Scalability test results',
        'Security assessment scores',
        'Maintainability index'
      ]
    };
  },

  async assembleFinalDocumentation(context, content, diagrams, validation) {
    return {
      document: {
        metadata: content.metadata,
        tableOfContents: this.generateTableOfContents(content.sections),
        sections: content.sections,
        appendices: [
          { title: 'Glossary', content: 'Architecture and technical terms' },
          { title: 'References', content: 'External references and standards' },
          { title: 'Change Log', content: 'Document revision history' }
        ]
      },
      diagrams: diagrams || {},
      validation: validation || {},
      templates: this.generateDocumentTemplates(context)
    };
  },

  generateTableOfContents(sections) {
    return Object.entries(sections).map(([sectionName, section]) => ({
      title: section.title,
      pageNumber: section.order,
      subsections: section.subsections || []
    }));
  },

  generateDocumentTemplates(context) {
    return {
      adr: `# ADR-XXX: [Decision Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
[Describe the context and problem statement]

## Decision
[Describe the decision and chosen option]

## Alternatives Considered
[List alternative options that were considered]

## Consequences
[Describe the consequences and trade-offs]

## Date
${new Date().toLocaleDateString()}
`,
      componentSpec: `# Component: [Component Name]

## Purpose
[Describe the component's primary responsibility]

## Interfaces
[Document component interfaces]

## Dependencies
[List component dependencies]

## Quality Attributes
[Component-specific quality requirements]

## Implementation Notes
[Technical implementation details]
`
    };
  },

  async formatArchitectureDocumentationOutput(context, documentation, diagrams, validation) {
    let output = `📋 **Architecture Documentation: ${context.systemName}**\n\n`;
    output += `🏗️ **Architecture Type:** ${context.architectureType}\n`;
    output += `📄 **Documentation Type:** ${context.documentationType}\n`;
    output += `📊 **Include Validation:** ${context.includeValidation ? 'Yes' : 'No'}\n`;
    output += `📈 **Generate Diagrams:** ${context.generateDiagrams ? 'Yes' : 'No'}\n`;
    output += `🆔 **Document ID:** ${context.documentId}\n\n`;

    // Documentation Structure
    output += `## 📚 Documentation Structure\n\n`;
    documentation.document.tableOfContents.forEach(item => {
      output += `${item.pageNumber}. **${item.title}**\n`;
    });
    output += '\n';

    // Key Components
    if (Object.keys(context.components).length > 0) {
      output += `## 🔧 Architecture Components\n\n`;
      Object.entries(context.components).forEach(([category, components]) => {
        if (components.length > 0) {
          output += `**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
          components.forEach(component => {
            output += `• ${component}\n`;
          });
          output += '\n';
        }
      });
    }

    // Quality Attributes
    if (Object.keys(context.qualityAttributes).length > 0) {
      output += `## ⭐ Quality Attributes\n\n`;
      Object.entries(context.qualityAttributes).forEach(([attribute, requirement]) => {
        output += `• **${attribute.charAt(0).toUpperCase() + attribute.slice(1)}:** ${requirement}\n`;
      });
      output += '\n';
    }

    // Design Decisions
    if (context.designDecisions.length > 0) {
      output += `## 🎯 Key Design Decisions\n\n`;
      context.designDecisions.forEach((decision, index) => {
        output += `${index + 1}. **${decision.decision}**\n`;
        output += `   *Rationale:* ${decision.rationale}\n`;
      });
      output += '\n';
    }

    // Diagram Specifications
    if (diagrams && Object.keys(diagrams).length > 0) {
      output += `## 📊 Architecture Diagrams\n\n`;
      Object.entries(diagrams).forEach(([diagramType, spec]) => {
        if (spec.title) {
          output += `**${spec.title}**\n`;
          output += `*Description:* ${spec.description}\n`;
          if (spec.tools) {
            output += `*Recommended Tools:* ${spec.tools.join(', ')}\n`;
          }
          output += '\n';
        }
      });
    }

    // Validation Framework
    if (validation && Object.keys(validation).length > 0) {
      output += `## ✅ Architecture Validation\n\n`;
      
      if (validation.validationCriteria) {
        output += `**Validation Criteria:**\n`;
        Object.entries(validation.validationCriteria).forEach(([category, criteria]) => {
          output += `• **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${criteria.length} checks\n`;
        });
        output += '\n';
      }
      
      if (validation.reviewProcess && validation.reviewProcess.reviewTypes) {
        output += `**Review Process:**\n`;
        validation.reviewProcess.reviewTypes.forEach(review => {
          output += `• **${review.type}:** ${review.focus}\n`;
        });
        output += '\n';
      }
    }

    // Implementation Guidance
    output += `## 🛠️ Implementation Guidance\n\n`;
    output += `**Development Phases:**\n`;
    output += `1. **Architecture Setup** - Establish development environment and tooling\n`;
    output += `2. **Core Components** - Implement foundational architecture components\n`;
    output += `3. **Integration** - Connect components and establish data flows\n`;
    output += `4. **Quality Assurance** - Implement testing and validation procedures\n`;
    output += `5. **Deployment** - Set up production deployment and monitoring\n\n`;

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Architecture Review:** Schedule review sessions with stakeholders\n`;
    output += `2. **Diagram Creation:** Create visual architecture diagrams\n`;
    output += `3. **Implementation Planning:** Develop detailed implementation roadmap\n`;
    output += `4. **Team Alignment:** Share architecture with development teams\n`;
    output += `5. **Validation Setup:** Establish architecture validation procedures\n\n`;

    output += `💡 **Architecture Documentation Tips:**\n`;
    output += `• Keep documentation current with implementation changes\n`;
    output += `• Use multiple views to address different stakeholder concerns\n`;
    output += `• Include both strategic and tactical guidance\n`;
    output += `• Validate architecture assumptions with prototypes\n`;
    output += `• Regular architecture reviews and updates\n\n`;

    output += `📁 **Complete architecture documentation package saved to project.**`;

    return output;
  },

  async saveArchitectureDocumentationToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const architectureDir = join(saDir, 'architecture-documentation');
      if (!existsSync(architectureDir)) {
        require('fs').mkdirSync(architectureDir, { recursive: true });
      }
      
      const filename = `architecture-doc-${context.systemName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(architectureDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
      
      // Also save as markdown documentation
      const mdFilename = filename.replace('.json', '.md');
      const mdFilepath = join(architectureDir, mdFilename);
      
      let mdContent = `# ${data.documentation.document.metadata.title}\n\n`;
      mdContent += `**Version:** ${data.documentation.document.metadata.version}\n`;
      mdContent += `**Created:** ${new Date(data.documentation.document.metadata.created).toLocaleDateString()}\n`;
      mdContent += `**Architect:** ${data.documentation.document.metadata.architect}\n\n`;
      
      // Add table of contents
      mdContent += `## Table of Contents\n\n`;
      data.documentation.document.tableOfContents.forEach(item => {
        mdContent += `${item.pageNumber}. [${item.title}](#${item.title.toLowerCase().replace(/\s+/g, '-')})\n`;
      });
      mdContent += '\n';
      
      // Add section content
      Object.entries(data.documentation.document.sections).forEach(([sectionName, section]) => {
        mdContent += `## ${section.title}\n\n`;
        section.content.forEach(content => {
          mdContent += `${content}\n\n`;
        });
      });
      
      writeFileSync(mdFilepath, mdContent);
      
    } catch (error) {
      console.warn('Failed to save architecture documentation:', error.message);
    }
  }
};