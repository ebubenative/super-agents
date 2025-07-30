import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_design_system MCP Tool
 * System architecture design with methodology, pattern selection, and component design workflows
 */
export const saDesignSystem = {
  name: 'sa_design_system',
  description: 'Design comprehensive system architecture using established methodologies, architecture pattern selection, component design workflows, and design validation',
  category: 'architect',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      systemName: {
        type: 'string',
        description: 'Name of the system to design',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      systemType: {
        type: 'string',
        description: 'Type of system being designed',
        enum: ['web-application', 'mobile-app', 'api-service', 'microservices', 'monolith', 'distributed-system', 'data-platform', 'iot-system'],
        default: 'web-application'
      },
      designMethodology: {
        type: 'string',
        description: 'Architecture design methodology to use',
        enum: ['domain-driven-design', 'clean-architecture', 'hexagonal-architecture', 'onion-architecture', 'layered-architecture', 'event-driven', 'microservices-patterns'],
        default: 'clean-architecture'
      },
      requirements: {
        type: 'object',
        description: 'System requirements',
        properties: {
          functional: { type: 'array', items: { type: 'string' } },
          nonFunctional: {
            type: 'object',
            properties: {
              performance: { type: 'string' },
              scalability: { type: 'string' },
              availability: { type: 'string' },
              security: { type: 'string' },
              maintainability: { type: 'string' }
            }
          },
          constraints: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } }
        }
      },
      stakeholders: {
        type: 'array',
        description: 'Key stakeholders and their concerns',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } },
            priorities: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      technologyConstraints: {
        type: 'object',
        description: 'Technology constraints and preferences',
        properties: {
          preferredLanguages: { type: 'array', items: { type: 'string' } },
          requiredFrameworks: { type: 'array', items: { type: 'string' } },
          infrastructureConstraints: { type: 'array', items: { type: 'string' } },
          integrationRequirements: { type: 'array', items: { type: 'string' } }
        }
      },
      designComplexity: {
        type: 'string',
        description: 'Desired level of design detail',
        enum: ['high-level', 'detailed', 'comprehensive'],
        default: 'detailed'
      },
      includeValidation: {
        type: 'boolean',
        description: 'Include architecture validation framework',
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
      
      const designContext = {
        systemName,
        systemType: args.systemType || 'web-application',
        methodology: args.designMethodology || 'clean-architecture',
        complexity: args.designComplexity || 'detailed',
        requirements: args.requirements || {},
        stakeholders: args.stakeholders || [],
        technologyConstraints: args.technologyConstraints || {},
        includeValidation: args.includeValidation !== false,
        timestamp: new Date().toISOString(),
        architect: context?.userId || 'system',
        designId: `design-${Date.now()}`
      };

      // Load architecture template
      const architectureTemplate = await this.loadArchitectureTemplate(templateEngine, designContext);
      
      // Apply design methodology
      const methodologyFramework = await this.applyDesignMethodology(designContext);
      
      // Select architecture patterns
      const architecturePatterns = await this.selectArchitecturePatterns(designContext, methodologyFramework);
      
      // Design component structure
      const componentDesign = await this.designComponentStructure(designContext, architecturePatterns);
      
      // Create validation framework
      let validationFramework = null;
      if (designContext.includeValidation) {
        validationFramework = await this.createValidationFramework(designContext, componentDesign);
      }
      
      // Generate architecture documentation
      const documentation = await this.generateArchitectureDocumentation(
        designContext, 
        methodologyFramework, 
        architecturePatterns, 
        componentDesign, 
        validationFramework
      );
      
      // Format output
      const output = await this.formatDesignOutput(
        designContext, 
        methodologyFramework, 
        architecturePatterns, 
        componentDesign, 
        validationFramework, 
        documentation
      );
      
      // Save design to project
      await this.saveDesignToProject(projectPath, designContext, {
        methodology: methodologyFramework,
        patterns: architecturePatterns,
        components: componentDesign,
        validation: validationFramework,
        documentation
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          systemName,
          systemType: args.systemType,
          methodology: args.designMethodology,
          complexity: args.designComplexity,
          includeValidation: args.includeValidation,
          designId: designContext.designId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to design system ${systemName}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, systemName, projectPath }
      };
    }
  },

  async loadArchitectureTemplate(templateEngine, context) {
    try {
      let templateName;
      
      switch (context.systemType) {
        case 'microservices':
          templateName = 'microservices-architecture-tmpl.yaml';
          break;
        case 'web-application':
          templateName = 'fullstack-architecture-tmpl.yaml';
          break;
        case 'api-service':
          templateName = 'api-architecture-tmpl.yaml';
          break;
        default:
          templateName = 'architecture-tmpl.yaml';
      }
      
      const template = await templateEngine.getTemplate(templateName);
      return template;
    } catch (error) {
      return this.getDefaultArchitectureTemplate(context.systemType);
    }
  },

  getDefaultArchitectureTemplate(systemType) {
    const baseTemplate = {
      name: 'System Architecture Template',
      layers: ['Presentation', 'Business Logic', 'Data Access', 'Infrastructure'],
      patterns: ['Layered Architecture', 'Dependency Injection', 'Repository Pattern'],
      components: ['Controllers', 'Services', 'Repositories', 'Models']
    };
    
    switch (systemType) {
      case 'microservices':
        return {
          ...baseTemplate,
          patterns: ['Service Decomposition', 'API Gateway', 'Service Discovery', 'Circuit Breaker'],
          components: ['API Gateway', 'Services', 'Data Stores', 'Message Queues', 'Service Registry']
        };
      case 'web-application':
        return {
          ...baseTemplate,
          layers: ['Frontend', 'API Layer', 'Business Logic', 'Data Layer'],
          components: ['UI Components', 'API Controllers', 'Services', 'Repositories', 'Database']
        };
      case 'mobile-app':
        return {
          ...baseTemplate,
          layers: ['UI Layer', 'Business Layer', 'Data Layer', 'Platform Layer'],
          components: ['Views', 'ViewModels', 'Services', 'Data Access', 'Platform APIs']
        };
      default:
        return baseTemplate;
    }
  },

  async applyDesignMethodology(context) {
    const methodology = {
      name: context.methodology,
      principles: [],
      designSteps: [],
      deliverables: [],
      qualityAttributes: []
    };
    
    switch (context.methodology) {
      case 'domain-driven-design':
        methodology.principles = [
          'Ubiquitous Language',
          'Bounded Contexts',
          'Domain Models',
          'Strategic Design',
          'Tactical Design'
        ];
        methodology.designSteps = [
          'Domain Discovery',
          'Bounded Context Identification',
          'Context Mapping',
          'Domain Model Design',
          'Implementation Strategy'
        ];
        methodology.deliverables = [
          'Domain Model',
          'Context Map',
          'Bounded Context Documentation',
          'Aggregates Design',
          'Domain Services'
        ];
        break;
        
      case 'clean-architecture':
        methodology.principles = [
          'Dependency Inversion',
          'Single Responsibility',
          'Open/Closed Principle',
          'Interface Segregation',
          'Dependency Rule'
        ];
        methodology.designSteps = [
          'Identify Use Cases',
          'Define Entities',
          'Design Interfaces',
          'Implement Infrastructure',
          'Create Delivery Mechanisms'
        ];
        methodology.deliverables = [
          'Use Case Diagrams',
          'Entity Models',
          'Interface Definitions',
          'Architecture Layers',
          'Dependency Graph'
        ];
        break;
        
      case 'microservices-patterns':
        methodology.principles = [
          'Service Autonomy',
          'Decentralized Governance',
          'Failure Isolation',
          'Data Decentralization',
          'Evolutionary Design'
        ];
        methodology.designSteps = [
          'Service Decomposition',
          'Data Management Strategy',
          'Communication Patterns',
          'Deployment Strategy',
          'Monitoring Design'
        ];
        methodology.deliverables = [
          'Service Map',
          'Data Architecture',
          'API Specifications',
          'Deployment Topology',
          'Monitoring Strategy'
        ];
        break;
        
      default:
        methodology.principles = [
          'Separation of Concerns',
          'Single Responsibility',
          'Loose Coupling',
          'High Cohesion',
          'Abstraction'
        ];
        methodology.designSteps = [
          'Requirements Analysis',
          'Component Identification',
          'Interface Design',
          'Implementation Planning',
          'Validation Strategy'
        ];
    }
    
    return methodology;
  },

  async selectArchitecturePatterns(context, methodology) {
    const patterns = {
      structural: [],
      behavioral: [],
      creational: [],
      integration: [],
      rationale: {}
    };
    
    // Select patterns based on system type and requirements
    switch (context.systemType) {
      case 'web-application':
        patterns.structural = ['Model-View-Controller', 'Layered Architecture', 'Repository Pattern'];
        patterns.behavioral = ['Observer Pattern', 'Strategy Pattern', 'Command Pattern'];
        patterns.creational = ['Factory Pattern', 'Dependency Injection'];
        patterns.integration = ['RESTful APIs', 'Database Abstraction'];
        break;
        
      case 'microservices':
        patterns.structural = ['Service Mesh', 'API Gateway', 'Backend for Frontend'];
        patterns.behavioral = ['Event Sourcing', 'CQRS', 'Saga Pattern'];
        patterns.creational = ['Service Factory', 'Circuit Breaker'];
        patterns.integration = ['Event-Driven Architecture', 'Message Queues', 'Service Discovery'];
        break;
        
      case 'mobile-app':
        patterns.structural = ['Model-View-ViewModel', 'Clean Architecture', 'Repository Pattern'];
        patterns.behavioral = ['Observer Pattern', 'State Pattern', 'Command Pattern'];
        patterns.creational = ['Factory Pattern', 'Singleton Pattern'];
        patterns.integration = ['Data Synchronization', 'Offline-First'];
        break;
        
      default:
        patterns.structural = ['Layered Architecture', 'Component-Based'];
        patterns.behavioral = ['Observer Pattern', 'Strategy Pattern'];
        patterns.creational = ['Factory Pattern'];
        patterns.integration = ['API Integration'];
    }
    
    // Add methodology-specific patterns
    if (context.methodology === 'domain-driven-design') {
      patterns.structural.push('Aggregate Pattern', 'Repository Pattern');
      patterns.behavioral.push('Domain Events', 'Specification Pattern');
    }
    
    if (context.methodology === 'event-driven') {
      patterns.behavioral.push('Event Sourcing', 'Event Bus', 'Event Store');
      patterns.integration.push('Message Broker', 'Event Streaming');
    }
    
    // Generate rationale for pattern selection
    patterns.rationale = this.generatePatternRationale(patterns, context);
    
    return patterns;
  },

  generatePatternRationale(patterns, context) {
    const rationale = {};
    
    patterns.structural.forEach(pattern => {
      switch (pattern) {
        case 'Model-View-Controller':
          rationale[pattern] = 'Separates concerns between data, presentation, and business logic for maintainable web applications';
          break;
        case 'Layered Architecture':
          rationale[pattern] = 'Provides clear separation of concerns and dependency management across system layers';
          break;
        case 'Microservices':
          rationale[pattern] = 'Enables independent deployment, scaling, and technology choices for complex systems';
          break;
        case 'API Gateway':
          rationale[pattern] = 'Centralizes cross-cutting concerns like authentication, rate limiting, and routing';
          break;
        default:
          rationale[pattern] = `Selected for ${context.systemType} architecture requirements`;
      }
    });
    
    return rationale;
  },

  async designComponentStructure(context, patterns) {
    const structure = {
      layers: [],
      components: {},
      interfaces: {},
      dependencies: {},
      dataFlow: {}
    };
    
    // Design layers based on methodology and system type
    structure.layers = this.designSystemLayers(context, patterns);
    
    // Design components for each layer
    structure.layers.forEach(layer => {
      structure.components[layer.name] = this.designLayerComponents(layer, context, patterns);
    });
    
    // Define interfaces between components
    structure.interfaces = this.designComponentInterfaces(structure.components, context);
    
    // Map dependencies
    structure.dependencies = this.mapComponentDependencies(structure.components, patterns);
    
    // Define data flow
    structure.dataFlow = this.designDataFlow(structure.components, context);
    
    return structure;
  },

  designSystemLayers(context, patterns) {
    const layers = [];
    
    switch (context.systemType) {
      case 'web-application':
        layers.push(
          { name: 'Presentation', purpose: 'User interface and interaction', technologies: ['React', 'Vue', 'Angular'] },
          { name: 'API', purpose: 'HTTP endpoints and request handling', technologies: ['Express', 'FastAPI', 'Spring'] },
          { name: 'Business', purpose: 'Business logic and rules', technologies: ['Domain Services', 'Use Cases'] },
          { name: 'Data', purpose: 'Data access and persistence', technologies: ['Repositories', 'ORM', 'Database'] },
          { name: 'Infrastructure', purpose: 'Cross-cutting concerns', technologies: ['Logging', 'Security', 'Configuration'] }
        );
        break;
        
      case 'microservices':
        layers.push(
          { name: 'Gateway', purpose: 'API gateway and routing', technologies: ['Kong', 'Zuul', 'Envoy'] },
          { name: 'Services', purpose: 'Business microservices', technologies: ['Spring Boot', 'Node.js', 'Go'] },
          { name: 'Data', purpose: 'Service-specific data stores', technologies: ['PostgreSQL', 'MongoDB', 'Redis'] },
          { name: 'Infrastructure', purpose: 'Service mesh and platform', technologies: ['Kubernetes', 'Istio', 'Prometheus'] }
        );
        break;
        
      case 'mobile-app':
        layers.push(
          { name: 'UI', purpose: 'User interface components', technologies: ['React Native', 'Flutter', 'SwiftUI'] },
          { name: 'ViewModel', purpose: 'UI state and logic', technologies: ['Redux', 'MobX', 'MVVM'] },
          { name: 'Business', purpose: 'Business logic and use cases', technologies: ['Services', 'Interactors'] },
          { name: 'Data', purpose: 'Local and remote data', technologies: ['SQLite', 'Realm', 'REST APIs'] },
          { name: 'Platform', purpose: 'Platform-specific features', technologies: ['Native APIs', 'Device Features'] }
        );
        break;
        
      default:
        layers.push(
          { name: 'Presentation', purpose: 'User interface layer', technologies: ['UI Framework'] },
          { name: 'Business', purpose: 'Business logic layer', technologies: ['Services'] },
          { name: 'Data', purpose: 'Data access layer', technologies: ['Repositories'] },
          { name: 'Infrastructure', purpose: 'Cross-cutting concerns', technologies: ['Utilities'] }
        );
    }
    
    return layers;
  },

  designLayerComponents(layer, context, patterns) {
    const components = [];
    
    switch (layer.name) {
      case 'Presentation':
      case 'UI':
        components.push(
          { name: 'UserInterface', purpose: 'Main user interface', pattern: 'Component Pattern' },
          { name: 'InputValidation', purpose: 'User input validation', pattern: 'Validator Pattern' },
          { name: 'StateManagement', purpose: 'UI state management', pattern: 'State Pattern' }
        );
        break;
        
      case 'API':
      case 'Gateway':
        components.push(
          { name: 'RequestRouter', purpose: 'Route requests to handlers', pattern: 'Router Pattern' },
          { name: 'Authentication', purpose: 'User authentication', pattern: 'Interceptor Pattern' },
          { name: 'RateLimiting', purpose: 'Request rate limiting', pattern: 'Throttle Pattern' }
        );
        break;
        
      case 'Business':
        components.push(
          { name: 'DomainServices', purpose: 'Core business logic', pattern: 'Service Layer' },
          { name: 'UseCases', purpose: 'Application use cases', pattern: 'Command Pattern' },
          { name: 'BusinessRules', purpose: 'Business rule engine', pattern: 'Strategy Pattern' }
        );
        break;
        
      case 'Data':
        components.push(
          { name: 'Repositories', purpose: 'Data access abstraction', pattern: 'Repository Pattern' },
          { name: 'DataMappers', purpose: 'Object-relational mapping', pattern: 'Data Mapper' },
          { name: 'QueryBuilders', purpose: 'Dynamic query construction', pattern: 'Builder Pattern' }
        );
        break;
        
      case 'Infrastructure':
        components.push(
          { name: 'Logging', purpose: 'Application logging', pattern: 'Observer Pattern' },
          { name: 'Configuration', purpose: 'Application configuration', pattern: 'Singleton Pattern' },
          { name: 'Security', purpose: 'Security services', pattern: 'Proxy Pattern' }
        );
        break;
    }
    
    return components;
  },

  designComponentInterfaces(components, context) {
    const interfaces = {};
    
    Object.entries(components).forEach(([layerName, layerComponents]) => {
      layerComponents.forEach(component => {
        interfaces[component.name] = {
          methods: this.generateInterfaceMethods(component, context),
          dependencies: this.identifyComponentDependencies(component, components),
          contracts: this.defineInterfaceContracts(component)
        };
      });
    });
    
    return interfaces;
  },

  generateInterfaceMethods(component, context) {
    const methods = [];
    
    switch (component.purpose) {
      case 'Main user interface':
        methods.push('render()', 'handleUserInput()', 'updateState()');
        break;
      case 'Route requests to handlers':
        methods.push('route(request)', 'handle(request)', 'respond(response)');
        break;
      case 'Core business logic':
        methods.push('execute(command)', 'validate(data)', 'process(input)');
        break;
      case 'Data access abstraction':
        methods.push('find(criteria)', 'save(entity)', 'delete(id)');
        break;
      default:
        methods.push('execute()', 'configure()', 'validate()');
    }
    
    return methods;
  },

  identifyComponentDependencies(component, allComponents) {
    const dependencies = [];
    
    // Simple dependency identification based on component purpose
    if (component.purpose.includes('business') || component.purpose.includes('logic')) {
      dependencies.push('DataAccess', 'Validation');
    }
    
    if (component.purpose.includes('user interface') || component.purpose.includes('UI')) {
      dependencies.push('StateManagement', 'BusinessServices');
    }
    
    if (component.purpose.includes('data') || component.purpose.includes('repository')) {
      dependencies.push('Database', 'Configuration');
    }
    
    return dependencies;
  },

  defineInterfaceContracts(component) {
    return {
      preconditions: [`Valid input parameters for ${component.name}`],
      postconditions: [`Successful execution of ${component.purpose}`],
      invariants: [`${component.name} maintains consistent state`],
      exceptions: [`${component.name}Exception for error conditions`]
    };
  },

  mapComponentDependencies(components, patterns) {
    const dependencies = {};
    
    Object.entries(components).forEach(([layerName, layerComponents]) => {
      dependencies[layerName] = {
        internal: [], // Dependencies within the same layer
        external: [], // Dependencies on other layers
        patterns: []  // Dependency patterns used
      };
      
      layerComponents.forEach(component => {
        // Map dependencies based on common architectural patterns
        if (component.pattern === 'Repository Pattern') {
          dependencies[layerName].external.push('Data Layer');
        }
        
        if (component.pattern === 'Service Layer') {
          dependencies[layerName].external.push('Data Layer');
          dependencies[layerName].internal.push('Domain Models');
        }
        
        if (component.pattern === 'Controller Pattern') {
          dependencies[layerName].external.push('Business Layer');
        }
      });
    });
    
    return dependencies;
  },

  designDataFlow(components, context) {
    const dataFlow = {
      requestFlow: [],
      responseFlow: [],
      dataStores: [],
      integrationPoints: []
    };
    
    // Design typical request flow based on system type
    switch (context.systemType) {
      case 'web-application':
        dataFlow.requestFlow = [
          'User Input → UI Component',
          'UI Component → API Controller',
          'API Controller → Business Service',
          'Business Service → Repository',
          'Repository → Database'
        ];
        dataFlow.responseFlow = [
          'Database → Repository',
          'Repository → Business Service',
          'Business Service → API Controller',
          'API Controller → UI Component',
          'UI Component → User Display'
        ];
        break;
        
      case 'microservices':
        dataFlow.requestFlow = [
          'Client → API Gateway',
          'API Gateway → Service Router',
          'Service Router → Business Service',
          'Business Service → Data Store'
        ];
        dataFlow.responseFlow = [
          'Data Store → Business Service',
          'Business Service → Service Router',
          'Service Router → API Gateway',
          'API Gateway → Client'
        ];
        break;
    }
    
    return dataFlow;
  },

  async createValidationFramework(context, componentDesign) {
    const framework = {
      validationCriteria: {},
      qualityMetrics: {},
      reviewProcess: {},
      tools: {}
    };
    
    // Define validation criteria
    framework.validationCriteria = {
      functional: [
        'All functional requirements are addressed',
        'Use cases are properly implemented',
        'Business logic is correctly modeled'
      ],
      nonFunctional: [
        'Performance requirements are met',
        'Scalability targets are achievable',
        'Security requirements are addressed',
        'Maintainability standards are followed'
      ],
      architectural: [
        'Architecture principles are followed',
        'Design patterns are properly applied',
        'Component interfaces are well-defined',
        'Dependencies are properly managed'
      ]
    };
    
    // Define quality metrics
    framework.qualityMetrics = {
      coupling: 'Measure of dependencies between components',
      cohesion: 'Measure of internal component coherence',
      complexity: 'Measure of architectural complexity',
      testability: 'Ease of testing the architecture',
      maintainability: 'Ease of maintaining and evolving the system'
    };
    
    // Define review process
    framework.reviewProcess = {
      designReview: {
        participants: ['Architects', 'Lead Developers', 'Product Owners'],
        criteria: ['Requirements alignment', 'Technical feasibility', 'Risk assessment'],
        deliverables: ['Review report', 'Action items', 'Approval decision']
      },
      codeReview: {
        participants: ['Architects', 'Senior Developers'],
        criteria: ['Design conformance', 'Code quality', 'Pattern implementation'],
        deliverables: ['Code review report', 'Improvement recommendations']
      }
    };
    
    // Suggest validation tools
    framework.tools = {
      staticAnalysis: ['SonarQube', 'Checkstyle', 'ESLint'],
      dependencyAnalysis: ['NDepend', 'Dependency Cruiser', 'Madge'],
      performanceTesting: ['JMeter', 'LoadRunner', 'K6'],
      securityScanning: ['OWASP ZAP', 'Veracode', 'Checkmarx']
    };
    
    return framework;
  },

  async generateArchitectureDocumentation(context, methodology, patterns, components, validation) {
    return {
      overview: this.generateArchitectureOverview(context, methodology),
      patterns: this.generatePatternDocumentation(patterns),
      components: this.generateComponentDocumentation(components),
      validation: validation ? this.generateValidationDocumentation(validation) : null,
      implementation: this.generateImplementationGuide(context, components),
      evolution: this.generateEvolutionStrategy(context, patterns)
    };
  },

  generateArchitectureOverview(context, methodology) {
    return `
# ${context.systemName} Architecture Overview

## System Type
${context.systemType}

## Design Methodology
${methodology.name}

## Key Principles
${methodology.principles.map(p => `- ${p}`).join('\n')}

## Architecture Goals
- Maintainability: Easy to modify and extend
- Scalability: Ability to handle growth
- Reliability: Consistent and dependable operation
- Performance: Meets response time requirements
- Security: Protects against threats

## Quality Attributes
${context.requirements.nonFunctional ? Object.entries(context.requirements.nonFunctional).map(([attr, req]) => `- **${attr}**: ${req}`).join('\n') : 'To be defined'}
`;
  },

  generatePatternDocumentation(patterns) {
    let doc = `# Architecture Patterns\n\n`;
    
    Object.entries(patterns).forEach(([category, patternList]) => {
      if (category !== 'rationale' && patternList.length > 0) {
        doc += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Patterns\n\n`;
        patternList.forEach(pattern => {
          doc += `### ${pattern}\n`;
          if (patterns.rationale[pattern]) {
            doc += `${patterns.rationale[pattern]}\n\n`;
          } else {
            doc += `Pattern applied for ${category} architecture concerns.\n\n`;
          }
        });
      }
    });
    
    return doc;
  },

  generateComponentDocumentation(components) {
    let doc = `# Component Architecture\n\n`;
    
    Object.entries(components.components).forEach(([layerName, layerComponents]) => {
      doc += `## ${layerName} Layer\n\n`;
      layerComponents.forEach(component => {
        doc += `### ${component.name}\n`;
        doc += `**Purpose**: ${component.purpose}\n`;
        doc += `**Pattern**: ${component.pattern}\n\n`;
      });
    });
    
    return doc;
  },

  generateValidationDocumentation(validation) {
    let doc = `# Architecture Validation\n\n`;
    
    doc += `## Validation Criteria\n\n`;
    Object.entries(validation.validationCriteria).forEach(([category, criteria]) => {
      doc += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
      criteria.forEach(criterion => {
        doc += `- ${criterion}\n`;
      });
      doc += '\n';
    });
    
    doc += `## Quality Metrics\n\n`;
    Object.entries(validation.qualityMetrics).forEach(([metric, description]) => {
      doc += `- **${metric}**: ${description}\n`;
    });
    
    return doc;
  },

  generateImplementationGuide(context, components) {
    return `
# Implementation Guide

## Development Phases
1. **Infrastructure Setup**: Set up development environment and CI/CD
2. **Core Components**: Implement foundational components and interfaces
3. **Business Logic**: Develop domain services and use cases
4. **Integration**: Connect components and implement data flow
5. **Testing**: Comprehensive testing at all levels
6. **Deployment**: Production deployment and monitoring

## Technology Stack
${context.technologyConstraints.preferredLanguages ? `**Languages**: ${context.technologyConstraints.preferredLanguages.join(', ')}` : ''}
${context.technologyConstraints.requiredFrameworks ? `**Frameworks**: ${context.technologyConstraints.requiredFrameworks.join(', ')}` : ''}

## Best Practices
- Follow SOLID principles
- Implement proper error handling
- Use dependency injection
- Maintain comprehensive documentation
- Implement proper logging and monitoring
`;
  },

  generateEvolutionStrategy(context, patterns) {
    return `
# Evolution Strategy

## Scalability Planning
- Identify bottlenecks and scaling points
- Plan for horizontal and vertical scaling
- Design for load distribution

## Technology Evolution
- Keep dependencies up to date
- Plan for technology migration
- Maintain backward compatibility

## Feature Evolution
- Design for extensibility
- Use feature flags for gradual rollouts
- Maintain API versioning strategy

## Monitoring and Feedback
- Implement comprehensive monitoring
- Collect user feedback
- Measure architectural metrics
- Regular architecture reviews
`;
  },

  async formatDesignOutput(context, methodology, patterns, components, validation, documentation) {
    let output = `🏗️ **System Architecture Design: ${context.systemName}**\n\n`;
    output += `🎯 **System Type:** ${context.systemType}\n`;
    output += `📐 **Methodology:** ${context.methodology}\n`;
    output += `📊 **Complexity Level:** ${context.complexity}\n`;
    output += `✅ **Include Validation:** ${context.includeValidation ? 'Yes' : 'No'}\n`;
    output += `🆔 **Design ID:** ${context.designId}\n\n`;

    // Methodology Overview
    output += `## 📋 Design Methodology: ${methodology.name}\n\n`;
    output += `**Core Principles:**\n`;
    methodology.principles.forEach(principle => {
      output += `• ${principle}\n`;
    });
    output += '\n';

    output += `**Design Process:**\n`;
    methodology.designSteps.forEach((step, index) => {
      output += `${index + 1}. ${step}\n`;
    });
    output += '\n';

    // Architecture Patterns
    output += `## 🎨 Selected Architecture Patterns\n\n`;
    Object.entries(patterns).forEach(([category, patternList]) => {
      if (category !== 'rationale' && Array.isArray(patternList) && patternList.length > 0) {
        output += `**${category.charAt(0).toUpperCase() + category.slice(1)} Patterns:**\n`;
        patternList.forEach(pattern => {
          output += `• ${pattern}`;
          if (patterns.rationale[pattern]) {
            output += ` - ${patterns.rationale[pattern]}`;
          }
          output += '\n';
        });
        output += '\n';
      }
    });

    // System Layers
    output += `## 🏛️ System Architecture Layers\n\n`;
    components.layers.forEach((layer, index) => {
      output += `**${index + 1}. ${layer.name} Layer**\n`;
      output += `*Purpose:* ${layer.purpose}\n`;
      output += `*Technologies:* ${layer.technologies.join(', ')}\n`;
      
      if (components.components[layer.name]) {
        output += `*Components:*\n`;
        components.components[layer.name].forEach(component => {
          output += `  - ${component.name}: ${component.purpose}\n`;
        });
      }
      output += '\n';
    });

    // Component Interfaces
    if (Object.keys(components.interfaces).length > 0) {
      output += `## 🔌 Key Component Interfaces\n\n`;
      Object.entries(components.interfaces).slice(0, 5).forEach(([componentName, interfaceData]) => {
        output += `**${componentName}**\n`;
        output += `*Methods:* ${interfaceData.methods.join(', ')}\n`;
        if (interfaceData.dependencies.length > 0) {
          output += `*Dependencies:* ${interfaceData.dependencies.join(', ')}\n`;
        }
        output += '\n';
      });
    }

    // Data Flow
    if (components.dataFlow.requestFlow.length > 0) {
      output += `## 📊 Data Flow Architecture\n\n`;
      output += `**Request Flow:**\n`;
      components.dataFlow.requestFlow.forEach(flow => {
        output += `• ${flow}\n`;
      });
      output += '\n';
      
      output += `**Response Flow:**\n`;
      components.dataFlow.responseFlow.forEach(flow => {
        output += `• ${flow}\n`;
      });
      output += '\n';
    }

    // Validation Framework
    if (validation) {
      output += `## ✅ Architecture Validation Framework\n\n`;
      
      output += `**Quality Metrics:**\n`;
      Object.entries(validation.qualityMetrics).forEach(([metric, description]) => {
        output += `• **${metric.charAt(0).toUpperCase() + metric.slice(1)}:** ${description}\n`;
      });
      output += '\n';
      
      output += `**Validation Tools:**\n`;
      Object.entries(validation.tools).forEach(([category, tools]) => {
        output += `• **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${tools.join(', ')}\n`;
      });
      output += '\n';
    }

    // Implementation Roadmap
    output += `## 🛣️ Implementation Roadmap\n\n`;
    output += `**Phase 1: Foundation (Weeks 1-2)**\n`;
    output += `• Set up development environment and tooling\n`;
    output += `• Implement core infrastructure components\n`;
    output += `• Establish coding standards and practices\n\n`;
    
    output += `**Phase 2: Core Architecture (Weeks 3-4)**\n`;
    output += `• Implement foundational layers and components\n`;
    output += `• Establish component interfaces and contracts\n`;
    output += `• Set up data flow and communication patterns\n\n`;
    
    output += `**Phase 3: Business Logic (Weeks 5-6)**\n`;
    output += `• Implement domain services and business rules\n`;
    output += `• Develop use cases and application services\n`;
    output += `• Integrate with data access layer\n\n`;
    
    output += `**Phase 4: Integration & Testing (Weeks 7-8)**\n`;
    output += `• Complete component integration\n`;
    output += `• Implement comprehensive testing strategy\n`;
    output += `• Validate architecture against requirements\n\n`;

    // Requirements Mapping
    if (context.requirements.functional && context.requirements.functional.length > 0) {
      output += `## 📋 Requirements Mapping\n\n`;
      output += `**Functional Requirements:**\n`;
      context.requirements.functional.slice(0, 5).forEach(req => {
        output += `• ${req}\n`;
      });
      if (context.requirements.functional.length > 5) {
        output += `• ... and ${context.requirements.functional.length - 5} more\n`;
      }
      output += '\n';
    }

    // Technology Constraints
    if (Object.keys(context.technologyConstraints).length > 0) {
      output += `## ⚙️ Technology Constraints\n\n`;
      Object.entries(context.technologyConstraints).forEach(([constraint, values]) => {
        if (values && values.length > 0) {
          output += `**${constraint.charAt(0).toUpperCase() + constraint.slice(1)}:** ${values.join(', ')}\n`;
        }
      });
      output += '\n';
    }

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Architecture Review:**\n`;
    output += `   • Schedule review with stakeholders and technical team\n`;
    output += `   • Validate design against requirements\n`;
    output += `   • Address any concerns or feedback\n\n`;
    
    output += `2. **Detailed Design:**\n`;
    output += `   • Create detailed component specifications\n`;
    output += `   • Define API contracts and data models\n`;
    output += `   • Plan implementation timeline\n\n`;
    
    output += `3. **Prototype Development:**\n`;
    output += `   • Build proof-of-concept for critical components\n`;
    output += `   • Validate architecture assumptions\n`;
    output += `   • Identify potential issues early\n\n`;

    output += `💡 **Architecture Design Tips:**\n`;
    output += `• Start simple and evolve incrementally\n`;
    output += `• Design for change and extensibility\n`;
    output += `• Document architectural decisions and rationale\n`;
    output += `• Validate design with prototypes and spikes\n`;
    output += `• Regular architecture reviews and updates\n`;
    output += `• Consider non-functional requirements early\n\n`;

    output += `📁 **Complete architecture design and documentation saved to project.**`;

    return output;
  },

  async saveDesignToProject(projectPath, context, designData) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const architectureDir = join(saDir, 'architecture');
      if (!existsSync(architectureDir)) {
        require('fs').mkdirSync(architectureDir, { recursive: true });
      }
      
      const filename = `system-design-${context.systemName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(architectureDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...designData }, null, 2));
      
      // Also save as markdown documentation
      const mdFilename = filename.replace('.json', '.md');
      const mdFilepath = join(architectureDir, mdFilename);
      
      let mdContent = designData.documentation.overview;
      mdContent += '\n\n' + designData.documentation.patterns;
      mdContent += '\n\n' + designData.documentation.components;
      if (designData.documentation.validation) {
        mdContent += '\n\n' + designData.documentation.validation;
      }
      mdContent += '\n\n' + designData.documentation.implementation;
      mdContent += '\n\n' + designData.documentation.evolution;
      
      writeFileSync(mdFilepath, mdContent);
      
    } catch (error) {
      console.warn('Failed to save system design:', error.message);
    }
  }
};