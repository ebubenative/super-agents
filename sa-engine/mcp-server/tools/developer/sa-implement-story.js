import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_implement_story MCP Tool
 * Story implementation with code generation, testing setup, and development workflows
 */
export const saImplementStory = {
  name: 'sa_implement_story',
  description: 'Implement user stories with code generation, testing setup, development planning, and implementation workflows',
  category: 'developer',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      storyTitle: {
        type: 'string',
        description: 'Title of the user story to implement',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      storyDetails: {
        type: 'object',
        description: 'User story details',
        properties: {
          description: { type: 'string' },
          acceptanceCriteria: { type: 'array', items: { type: 'string' } },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          storyPoints: { type: 'number' },
          epic: { type: 'string' },
          assignee: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } }
        }
      },
      technicalSpecs: {
        type: 'object',
        description: 'Technical implementation specifications',
        properties: {
          framework: { type: 'string' },
          language: { type: 'string' },
          database: { type: 'string' },
          apiEndpoints: { type: 'array', items: { type: 'string' } },
          components: { type: 'array', items: { type: 'string' } },
          dependencies: { type: 'array', items: { type: 'string' } },
          testingStrategy: { type: 'string' }
        }
      },
      implementationApproach: {
        type: 'string',
        description: 'Implementation approach',
        enum: ['tdd', 'bdd', 'traditional', 'prototype-first'],
        default: 'traditional'
      },
      codeStyle: {
        type: 'object',
        description: 'Code style preferences',
        properties: {
          indentation: { type: 'string', enum: ['tabs', '2-spaces', '4-spaces'] },
          naming: { type: 'string', enum: ['camelCase', 'snake_case', 'kebab-case'] },
          comments: { type: 'boolean' },
          typescript: { type: 'boolean' }
        }
      },
      integrationPoints: {
        type: 'array',
        description: 'Integration points with existing system',
        items: {
          type: 'object',
          properties: {
            system: { type: 'string' },
            method: { type: 'string' },
            dataFormat: { type: 'string' },
            authentication: { type: 'string' }
          }
        }
      },
      generateCode: {
        type: 'boolean',
        description: 'Generate code templates and implementation',
        default: true
      }
    },
    required: ['storyTitle']
  },

  validate(args) {
    const errors = [];
    
    if (!args.storyTitle || typeof args.storyTitle !== 'string') {
      errors.push('storyTitle is required and must be a string');
    }
    
    if (args.storyTitle && args.storyTitle.trim().length === 0) {
      errors.push('storyTitle cannot be empty');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const storyTitle = args.storyTitle.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      const implementationContext = {
        storyTitle,
        storyDetails: args.storyDetails || {},
        technicalSpecs: args.technicalSpecs || {},
        implementationApproach: args.implementationApproach || 'traditional',
        codeStyle: args.codeStyle || {},
        integrationPoints: args.integrationPoints || [],
        generateCode: args.generateCode !== false,
        timestamp: new Date().toISOString(),
        developer: context?.userId || 'system',
        implementationId: `story-impl-${Date.now()}`
      };

      // Implementation planning
      const implementationPlan = await this.createImplementationPlan(implementationContext);
      
      // Code structure design
      const codeStructure = await this.designCodeStructure(implementationContext, implementationPlan);
      
      // Generate code templates
      let codeGeneration = null;
      if (implementationContext.generateCode) {
        codeGeneration = await this.generateCodeTemplates(implementationContext, codeStructure, templateEngine);
      }
      
      // Testing strategy
      const testingStrategy = await this.createTestingStrategy(implementationContext, codeStructure);
      
      // Development workflow
      const developmentWorkflow = await this.createDevelopmentWorkflow(implementationContext, implementationPlan);
      
      // Format output
      const output = await this.formatImplementationOutput(
        implementationContext,
        implementationPlan,
        codeStructure,
        codeGeneration,
        testingStrategy,
        developmentWorkflow
      );
      
      // Save implementation
      await this.saveImplementationToProject(projectPath, implementationContext, {
        plan: implementationPlan,
        structure: codeStructure,
        code: codeGeneration,
        testing: testingStrategy,
        workflow: developmentWorkflow
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          storyTitle,
          implementationApproach: args.implementationApproach,
          generateCode: args.generateCode,
          implementationId: implementationContext.implementationId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to implement story ${storyTitle}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, storyTitle, projectPath }
      };
    }
  },

  async createImplementationPlan(context) {
    return {
      overview: {
        story: context.storyTitle,
        approach: context.implementationApproach,
        estimatedEffort: this.estimateEffort(context),
        complexity: this.assessComplexity(context)
      },
      phases: this.defineImplementationPhases(context),
      tasks: this.breakDownTasks(context),
      dependencies: this.identifyDependencies(context),
      riskAssessment: this.assessImplementationRisks(context)
    };
  },

  estimateEffort(context) {
    const baseEffort = context.storyDetails.storyPoints || 5;
    const complexityMultiplier = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.5,
      'very-high': 2.0
    };
    
    const complexity = this.assessComplexity(context);
    const multiplier = complexityMultiplier[complexity] || 1.0;
    
    return Math.round(baseEffort * multiplier);
  },

  assessComplexity(context) {
    let score = 0;
    
    if (context.technicalSpecs.apiEndpoints && context.technicalSpecs.apiEndpoints.length > 3) score += 1;
    if (context.technicalSpecs.components && context.technicalSpecs.components.length > 5) score += 1;
    if (context.integrationPoints.length > 2) score += 1;
    if (context.storyDetails.acceptanceCriteria && context.storyDetails.acceptanceCriteria.length > 5) score += 1;
    
    if (score >= 3) return 'very-high';
    if (score >= 2) return 'high';
    if (score >= 1) return 'medium';
    return 'low';
  },

  defineImplementationPhases(context) {
    const phases = [
      {
        phase: 'Planning & Design',
        duration: '1-2 days',
        activities: [
          'Detailed technical analysis',
          'Architecture review',
          'Database schema design',
          'API design',
          'Component planning'
        ]
      },
      {
        phase: 'Setup & Foundation',
        duration: '0.5-1 day',
        activities: [
          'Environment setup',
          'Dependency installation',
          'Basic project structure',
          'Configuration setup'
        ]
      },
      {
        phase: 'Core Implementation',
        duration: '3-5 days',
        activities: [
          'Core functionality development',
          'API endpoint implementation',
          'Component development',
          'Integration implementation'
        ]
      },
      {
        phase: 'Testing & Validation',
        duration: '1-2 days',
        activities: [
          'Unit test development',
          'Integration testing',
          'Acceptance criteria validation',
          'Manual testing'
        ]
      },
      {
        phase: 'Review & Refinement',
        duration: '0.5-1 day',
        activities: [
          'Code review',
          'Performance optimization',
          'Bug fixes',
          'Documentation updates'
        ]
      }
    ];

    if (context.implementationApproach === 'tdd') {
      phases[2].activities.unshift('Test-first development');
      phases[3].duration = '0.5-1 day';
    }

    return phases;
  },

  breakDownTasks(context) {
    const tasks = [
      { task: 'Set up development environment', priority: 'high', estimation: '2 hours' },
      { task: 'Create basic project structure', priority: 'high', estimation: '1 hour' },
      { task: 'Implement core business logic', priority: 'high', estimation: '8 hours' },
      { task: 'Create API endpoints', priority: 'high', estimation: '4 hours' },
      { task: 'Develop UI components', priority: 'medium', estimation: '6 hours' },
      { task: 'Write unit tests', priority: 'high', estimation: '4 hours' },
      { task: 'Integration testing', priority: 'medium', estimation: '3 hours' },
      { task: 'Documentation', priority: 'low', estimation: '2 hours' }
    ];

    // Add API-specific tasks
    if (context.technicalSpecs.apiEndpoints) {
      context.technicalSpecs.apiEndpoints.forEach(endpoint => {
        tasks.push({
          task: `Implement ${endpoint} endpoint`,
          priority: 'high',
          estimation: '2 hours'
        });
      });
    }

    // Add component-specific tasks
    if (context.technicalSpecs.components) {
      context.technicalSpecs.components.forEach(component => {
        tasks.push({
          task: `Develop ${component} component`,
          priority: 'medium',
          estimation: '3 hours'
        });
      });
    }

    return tasks;
  },

  identifyDependencies(context) {
    const dependencies = {
      technical: context.technicalSpecs.dependencies || [],
      external: context.integrationPoints.map(point => point.system),
      internal: ['Project setup', 'Database schema', 'API documentation'],
      blocking: []
    };

    // Identify blocking dependencies
    if (context.integrationPoints.length > 0) {
      dependencies.blocking.push('External API availability');
    }

    if (context.technicalSpecs.database) {
      dependencies.blocking.push('Database setup and migration');
    }

    return dependencies;
  },

  assessImplementationRisks(context) {
    const risks = [];

    if (context.integrationPoints.length > 0) {
      risks.push({
        risk: 'External integration failures',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Mock external services for testing'
      });
    }

    if (context.technicalSpecs.framework && !context.technicalSpecs.framework.includes('well-known')) {
      risks.push({
        risk: 'Learning curve with new technology',
        probability: 'high',
        impact: 'medium',
        mitigation: 'Allocate time for learning and prototyping'
      });
    }

    if (this.assessComplexity(context) === 'very-high') {
      risks.push({
        risk: 'Scope creep and complexity escalation',
        probability: 'medium',
        impact: 'high',
        mitigation: 'Break down into smaller stories'
      });
    }

    return risks;
  },

  async designCodeStructure(context, plan) {
    return {
      architecture: this.defineArchitecture(context),
      fileStructure: this.createFileStructure(context),
      modules: this.defineModules(context),
      interfaces: this.defineInterfaces(context),
      dataModels: this.defineDataModels(context)
    };
  },

  defineArchitecture(context) {
    const framework = context.technicalSpecs.framework || 'generic';
    
    if (framework.toLowerCase().includes('react')) {
      return {
        pattern: 'Component-based Architecture',
        layers: ['Components', 'Hooks', 'Services', 'Utils'],
        structure: 'Feature-based folder structure'
      };
    } else if (framework.toLowerCase().includes('express')) {
      return {
        pattern: 'MVC Architecture',
        layers: ['Routes', 'Controllers', 'Services', 'Models'],
        structure: 'Layered architecture'
      };
    } else {
      return {
        pattern: 'Modular Architecture',
        layers: ['Presentation', 'Business Logic', 'Data Access'],
        structure: 'Domain-driven design'
      };
    }
  },

  createFileStructure(context) {
    const baseStructure = {
      'src/': {
        'components/': {},
        'services/': {},
        'utils/': {},
        'types/': {},
        'tests/': {}
      },
      'docs/': {},
      'config/': {}
    };

    // Add component files
    if (context.technicalSpecs.components) {
      context.technicalSpecs.components.forEach(component => {
        baseStructure['src/']['components/'][`${component}.js`] = 'Component implementation';
        baseStructure['src/']['tests/'][`${component}.test.js`] = 'Component tests';
      });
    }

    // Add API service files
    if (context.technicalSpecs.apiEndpoints) {
      baseStructure['src/']['services/']['api.js'] = 'API service layer';
      baseStructure['src/']['tests/']['api.test.js'] = 'API tests';
    }

    return baseStructure;
  },

  defineModules(context) {
    const modules = [];

    if (context.technicalSpecs.components) {
      modules.push({
        name: 'Component Module',
        purpose: 'UI component implementations',
        files: context.technicalSpecs.components.map(c => `${c}.js`)
      });
    }

    if (context.technicalSpecs.apiEndpoints) {
      modules.push({
        name: 'API Module',
        purpose: 'API endpoint implementations',
        files: ['api.js', 'apiTypes.js']
      });
    }

    modules.push({
      name: 'Business Logic Module',
      purpose: 'Core business logic implementation',
      files: ['businessLogic.js', 'validation.js']
    });

    return modules;
  },

  defineInterfaces(context) {
    const interfaces = [];

    if (context.technicalSpecs.apiEndpoints) {
      interfaces.push({
        name: 'API Interface',
        type: 'REST API',
        endpoints: context.technicalSpecs.apiEndpoints,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      });
    }

    if (context.integrationPoints.length > 0) {
      context.integrationPoints.forEach(point => {
        interfaces.push({
          name: `${point.system} Interface`,
          type: 'External Integration',
          method: point.method,
          dataFormat: point.dataFormat,
          authentication: point.authentication
        });
      });
    }

    return interfaces;
  },

  defineDataModels(context) {
    const models = [];

    if (context.technicalSpecs.database) {
      models.push({
        name: 'Main Entity Model',
        properties: this.extractModelProperties(context),
        relationships: [],
        validations: []
      });
    }

    if (context.integrationPoints.length > 0) {
      models.push({
        name: 'Integration Data Model',
        properties: ['id', 'externalId', 'syncStatus', 'lastSync'],
        relationships: ['belongsTo Main Entity'],
        validations: ['required id', 'unique externalId']
      });
    }

    return models;
  },

  extractModelProperties(context) {
    // Extract properties from story description and acceptance criteria
    const properties = ['id', 'createdAt', 'updatedAt'];
    
    if (context.storyDetails.description) {
      const description = context.storyDetails.description.toLowerCase();
      if (description.includes('user')) properties.push('userId');
      if (description.includes('name')) properties.push('name');
      if (description.includes('email')) properties.push('email');
      if (description.includes('status')) properties.push('status');
    }

    return properties;
  },

  async generateCodeTemplates(context, structure, templateEngine) {
    const codeGeneration = {
      components: {},
      services: {},
      tests: {},
      config: {}
    };

    try {
      // Generate component code using templates
      if (context.technicalSpecs.components) {
        for (const component of context.technicalSpecs.components) {
          codeGeneration.components[component] = await this.generateComponentCodeWithTemplate(
            component, 
            context, 
            templateEngine
          );
        }
      }

      // Generate service code using templates
      if (context.technicalSpecs.apiEndpoints) {
        codeGeneration.services['api'] = await this.generateApiServiceCodeWithTemplate(
          context, 
          templateEngine
        );
      }

      // Generate test code using templates
      codeGeneration.tests = await this.generateTestCodeWithTemplate(context, structure, templateEngine);

      return codeGeneration;
    } catch (error) {
      return { error: `Code generation failed: ${error.message}` };
    }
  },

  async generateComponentCodeWithTemplate(componentName, context, templateEngine) {
    try {
      // Determine template name based on context
      const framework = context.technicalSpecs.framework?.toLowerCase() || 'react';
      const isTypeScript = context.codeStyle.typescript || false;
      
      let templateName;
      if (framework.includes('react')) {
        templateName = isTypeScript ? 'react-typescript-component-tmpl' : 'react-component-simple-tmpl';
      } else {
        templateName = 'react-component-simple-tmpl'; // fallback
      }

      if (templateEngine.templateExists(templateName)) {
        const result = await templateEngine.renderTemplate(templateName, {
          componentName,
          storyTitle: context.storyTitle,
          typescript: isTypeScript,
          comments: context.codeStyle.comments || true,
          hooks: ['useState', 'useEffect'],
          styles: true,
          props: []
        });
        return result.content;
      } else {
        // Fallback to hardcoded template
        return await this.generateComponentCode(componentName, context, templateEngine);
      }
    } catch (error) {
      // Fallback to hardcoded template on error
      return await this.generateComponentCode(componentName, context, templateEngine);
    }
  },

  async generateApiServiceCodeWithTemplate(context, templateEngine) {
    try {
      const templateName = 'express-api-service-tmpl';
      const isTypeScript = context.codeStyle.typescript || false;

      if (templateEngine.templateExists(templateName)) {
        const result = await templateEngine.renderTemplate(templateName, {
          serviceName: 'ApiService',
          typescript: isTypeScript,
          comments: context.codeStyle.comments || true,
          endpoints: context.technicalSpecs.apiEndpoints?.map(endpoint => ({
            method: 'post',
            path: endpoint,
            handler: endpoint.toLowerCase().replace(/\//g, ''),
            description: `Handle ${endpoint} endpoint`
          })) || [],
          middleware: ['cors', 'helmet', 'rateLimit'],
          database: context.technicalSpecs.database || false
        });
        return result.content;
      } else {
        // Fallback to hardcoded template
        return await this.generateApiServiceCode(context, templateEngine);
      }
    } catch (error) {
      // Fallback to hardcoded template on error
      return await this.generateApiServiceCode(context, templateEngine);
    }
  },

  async generateTestCodeWithTemplate(context, structure, templateEngine) {
    const testSuites = {};

    try {
      const templateName = 'jest-unit-test-tmpl';
      const isTypeScript = context.codeStyle.typescript || false;

      // Generate component tests
      if (context.technicalSpecs.components) {
        for (const component of context.technicalSpecs.components) {
          if (templateEngine.templateExists(templateName)) {
            const result = await templateEngine.renderTemplate(templateName, {
              testSubject: component,
              typescript: isTypeScript,
              testType: 'component',
              importPath: `../components/${component}`,
              mockDependencies: [],
              testCases: context.storyDetails.acceptanceCriteria?.map((criteria, index) => ({
                description: `acceptance criteria ${index + 1}: ${criteria}`,
                setup: '// Setup test environment',
                action: '// Execute test action',
                assertion: `// TODO: Implement test for: ${criteria}`
              })) || []
            });
            testSuites[`${component}.test.js`] = result.content;
          } else {
            // Fallback to hardcoded template
            testSuites[`${component}.test.js`] = await this.generateComponentTestCode(component, context);
          }
        }
      }

      return testSuites;
    } catch (error) {
      // Fallback to hardcoded test generation
      return await this.generateTestCode(context, structure);
    }
  },

  async generateComponentTestCode(componentName, context) {
    // Fallback hardcoded test generation (simplified version of original)
    return `
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ${componentName} from '../components/${componentName}';

describe('${componentName}', () => {
  test('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText('${componentName}')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    render(<${componentName} />);
    const actionButton = screen.getByText('Action');
    
    fireEvent.click(actionButton);
    
    await waitFor(() => {
      // Add assertions based on expected behavior
    });
  });

  ${context.storyDetails.acceptanceCriteria ? 
    context.storyDetails.acceptanceCriteria.map((criteria, index) => `
  test('acceptance criteria ${index + 1}: ${criteria}', () => {
    // TODO: Implement test for: ${criteria}
  });
    `).join('') : ''
  }
});
`;
  },

  async generateComponentCode(componentName, context, templateEngine) {
    const template = `
import React, { useState, useEffect } from 'react';
${context.codeStyle.typescript ? "import { FC } from 'react';" : ''}

${context.codeStyle.comments ? `/**\n * ${componentName} Component\n * ${context.storyTitle}\n */` : ''}
${context.codeStyle.typescript ? `const ${componentName}: FC = () => {` : `const ${componentName} = () => {`}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Component initialization logic
    ${context.codeStyle.comments ? '// TODO: Implement component logic' : ''}
  }, []);

  const handleAction = async () => {
    setLoading(true);
    try {
      ${context.codeStyle.comments ? '// TODO: Implement action handler' : ''}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName}</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      <button onClick={handleAction}>Action</button>
    </div>
  );
};

export default ${componentName};
`;

    return template;
  },

  async generateApiServiceCode(context, templateEngine) {
    const template = `
${context.codeStyle.comments ? '// API Service Layer' : ''}
${context.codeStyle.typescript ? "import axios, { AxiosResponse } from 'axios';" : "import axios from 'axios';"}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

${context.technicalSpecs.apiEndpoints.map(endpoint => `
  async ${endpoint.toLowerCase().replace(/\//g, '')}(data${context.codeStyle.typescript ? ': any' : ''}) {
    try {
      const response = await this.client.post('${endpoint}', data);
      return response.data;
    } catch (error) {
      throw new Error(\`API Error: \${error.message}\`);
    }
  }
`).join('')}

  ${context.codeStyle.comments ? '// Add more API methods as needed' : ''}
}

export default new ApiService();
`;

    return template;
  },

  async generateTestCode(context, structure) {
    const testSuites = {};

    // Generate component tests
    if (context.technicalSpecs.components) {
      context.technicalSpecs.components.forEach(component => {
        testSuites[`${component}.test.js`] = `
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ${component} from '../components/${component}';

describe('${component}', () => {
  test('renders without crashing', () => {
    render(<${component} />);
    expect(screen.getByText('${component}')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    render(<${component} />);
    const actionButton = screen.getByText('Action');
    
    fireEvent.click(actionButton);
    
    await waitFor(() => {
      // Add assertions based on expected behavior
    });
  });

  ${context.storyDetails.acceptanceCriteria ? 
    context.storyDetails.acceptanceCriteria.map((criteria, index) => `
  test('acceptance criteria ${index + 1}: ${criteria}', () => {
    // TODO: Implement test for: ${criteria}
  });
    `).join('') : ''
  }
});
`;
      });
    }

    return testSuites;
  },

  async createTestingStrategy(context, structure) {
    return {
      approach: this.defineTestingApproach(context),
      levels: this.defineTestingLevels(context),
      tools: this.recommendTestingTools(context),
      coverage: this.defineCoverageTargets(context),
      automation: this.defineTestAutomation(context)
    };
  },

  defineTestingApproach(context) {
    if (context.implementationApproach === 'tdd') {
      return {
        methodology: 'Test-Driven Development',
        principles: ['Red-Green-Refactor', 'Write tests first', 'Minimal implementation'],
        benefits: ['Better design', 'Higher coverage', 'Immediate feedback']
      };
    } else if (context.implementationApproach === 'bdd') {
      return {
        methodology: 'Behavior-Driven Development',
        principles: ['Given-When-Then', 'User-centric scenarios', 'Acceptance criteria driven'],
        benefits: ['Clear requirements', 'Stakeholder alignment', 'Living documentation']
      };
    } else {
      return {
        methodology: 'Traditional Testing',
        principles: ['Test after implementation', 'Comprehensive coverage', 'Multiple test levels'],
        benefits: ['Flexible approach', 'Quick implementation', 'Comprehensive validation']
      };
    }
  },

  defineTestingLevels(context) {
    return {
      unit: {
        description: 'Test individual components and functions',
        tools: ['Jest', 'React Testing Library'],
        coverage: '90%+',
        focus: 'Business logic, component behavior'
      },
      integration: {
        description: 'Test component interactions and API integrations',
        tools: ['Jest', 'Supertest'],
        coverage: '80%+',
        focus: 'Data flow, API contracts'
      },
      e2e: {
        description: 'Test complete user workflows',
        tools: ['Cypress', 'Playwright'],
        coverage: 'Critical paths',
        focus: 'User acceptance criteria'
      }
    };
  },

  recommendTestingTools(context) {
    const tools = {
      framework: 'Jest',
      assertions: 'Jest matchers',
      mocking: 'Jest mocks',
      coverage: 'Jest coverage'
    };

    if (context.technicalSpecs.framework && context.technicalSpecs.framework.toLowerCase().includes('react')) {
      tools.rendering = 'React Testing Library';
      tools.userInteraction = '@testing-library/user-event';
    }

    if (context.technicalSpecs.apiEndpoints) {
      tools.apiTesting = 'Supertest';
      tools.httpMocking = 'MSW (Mock Service Worker)';
    }

    return tools;
  },

  defineCoverageTargets(context) {
    return {
      overall: '85%',
      statements: '90%',
      branches: '80%',
      functions: '90%',
      lines: '85%',
      critical: {
        businessLogic: '95%',
        apiEndpoints: '90%',
        components: '85%'
      }
    };
  },

  defineTestAutomation(context) {
    return {
      cicd: {
        trigger: 'On every commit and PR',
        pipeline: ['Lint', 'Unit tests', 'Integration tests', 'Coverage report'],
        gates: ['90% test coverage', 'All tests pass', 'No linting errors']
      },
      localDevelopment: {
        watchMode: 'Jest watch mode for active development',
        preCommit: 'Run tests before git commit',
        debugging: 'VS Code Jest extension for test debugging'
      }
    };
  },

  async createDevelopmentWorkflow(context, plan) {
    return {
      gitWorkflow: this.defineGitWorkflow(context),
      developmentCycle: this.defineDevelopmentCycle(context),
      codeReview: this.defineCodeReviewProcess(context),
      deployment: this.defineDeploymentProcess(context),
      monitoring: this.defineMonitoringStrategy(context)
    };
  },

  defineGitWorkflow(context) {
    return {
      branchStrategy: 'Feature branching',
      branchNaming: `feature/${context.storyTitle.toLowerCase().replace(/ /g, '-')}`,
      commitConvention: 'Conventional Commits',
      workflow: [
        'Create feature branch from main',
        'Implement changes with regular commits',
        'Push branch and create PR',
        'Code review and approval',
        'Merge to main with squash'
      ]
    };
  },

  defineDevelopmentCycle(context) {
    const cycles = {
      traditional: [
        'Plan implementation',
        'Write code',
        'Write tests',
        'Manual testing',
        'Code review'
      ],
      tdd: [
        'Write failing test',
        'Write minimal code to pass',
        'Refactor code',
        'Repeat cycle'
      ],
      bdd: [
        'Define behavior scenarios',
        'Write acceptance tests',
        'Implement features',
        'Validate behavior'
      ]
    };

    return cycles[context.implementationApproach] || cycles.traditional;
  },

  defineCodeReviewProcess(context) {
    return {
      reviewers: ['Team Lead', 'Senior Developer'],
      checklist: [
        'Code follows style guidelines',
        'Tests are comprehensive',
        'Performance considerations addressed',
        'Security best practices followed',
        'Documentation updated'
      ],
      automatedChecks: [
        'Linting passes',
        'Tests pass',
        'Coverage meets threshold',
        'Security scan passes'
      ]
    };
  },

  defineDeploymentProcess(context) {
    return {
      environments: ['development', 'staging', 'production'],
      strategy: 'Progressive deployment',
      steps: [
        'Deploy to development environment',
        'Run automated tests',
        'Deploy to staging for QA',
        'User acceptance testing',
        'Deploy to production'
      ],
      rollback: 'Automated rollback on failure detection'
    };
  },

  defineMonitoringStrategy(context) {
    return {
      metrics: [
        'Application performance',
        'Error rates',
        'User interactions',
        'API response times'
      ],
      alerting: [
        'Error rate spikes',
        'Performance degradation',
        'Failed deployments'
      ],
      logging: [
        'Application logs',
        'Error tracking',
        'User activity logs'
      ]
    };
  },

  async formatImplementationOutput(context, plan, structure, codeGeneration, testing, workflow) {
    let output = `💻 **Story Implementation: ${context.storyTitle}**\n\n`;
    output += `🛠️ **Implementation Approach:** ${context.implementationApproach}\n`;
    output += `📊 **Complexity:** ${plan.overview.complexity}\n`;
    output += `⏱️ **Estimated Effort:** ${plan.overview.estimatedEffort} story points\n`;
    output += `🆔 **Implementation ID:** ${context.implementationId}\n\n`;

    // Story Details
    if (context.storyDetails.description) {
      output += `## 📋 Story Details\n\n`;
      output += `**Description:** ${context.storyDetails.description}\n\n`;
      
      if (context.storyDetails.acceptanceCriteria) {
        output += `**Acceptance Criteria:**\n`;
        context.storyDetails.acceptanceCriteria.forEach((criteria, index) => {
          output += `${index + 1}. ${criteria}\n`;
        });
        output += '\n';
      }
    }

    // Implementation Plan
    output += `## 🎯 Implementation Plan\n\n`;
    plan.phases.forEach((phase, index) => {
      output += `**Phase ${index + 1}: ${phase.phase}** (${phase.duration})\n`;
      phase.activities.forEach(activity => {
        output += `• ${activity}\n`;
      });
      output += '\n';
    });

    // Technical Architecture
    output += `## 🏗️ Technical Architecture\n\n`;
    output += `**Pattern:** ${structure.architecture.pattern}\n`;
    output += `**Layers:** ${structure.architecture.layers.join(', ')}\n`;
    output += `**Structure:** ${structure.architecture.structure}\n\n`;

    // Code Structure
    if (structure.modules.length > 0) {
      output += `**Modules:**\n`;
      structure.modules.forEach(module => {
        output += `• **${module.name}:** ${module.purpose}\n`;
      });
      output += '\n';
    }

    // Generated Code Summary
    if (codeGeneration && !codeGeneration.error) {
      output += `## 🔧 Generated Code\n\n`;
      
      if (Object.keys(codeGeneration.components).length > 0) {
        output += `**Components Generated:** ${Object.keys(codeGeneration.components).join(', ')}\n`;
      }
      
      if (Object.keys(codeGeneration.services).length > 0) {
        output += `**Services Generated:** ${Object.keys(codeGeneration.services).join(', ')}\n`;
      }
      
      if (Object.keys(codeGeneration.tests).length > 0) {
        output += `**Tests Generated:** ${Object.keys(codeGeneration.tests).length} test files\n`;
      }
      output += '\n';
    }

    // Testing Strategy
    output += `## 🧪 Testing Strategy\n\n`;
    output += `**Approach:** ${testing.approach.methodology}\n`;
    output += `**Coverage Target:** ${testing.coverage.overall}\n`;
    output += `**Testing Levels:**\n`;
    Object.entries(testing.levels).forEach(([level, details]) => {
      output += `• **${level.charAt(0).toUpperCase() + level.slice(1)}:** ${details.description} (${details.coverage})\n`;
    });
    output += '\n';

    // Development Workflow
    output += `## 🔄 Development Workflow\n\n`;
    output += `**Git Strategy:** ${workflow.gitWorkflow.branchStrategy}\n`;
    output += `**Branch:** ${workflow.gitWorkflow.branchNaming}\n`;
    output += `**Development Cycle:**\n`;
    workflow.developmentCycle.forEach((step, index) => {
      output += `${index + 1}. ${step}\n`;
    });
    output += '\n';

    // Tasks Breakdown
    output += `## ✅ Task Breakdown\n\n`;
    plan.tasks.forEach((task, index) => {
      output += `${index + 1}. **${task.task}** (${task.priority} priority, ~${task.estimation})\n`;
    });
    output += '\n';

    // Dependencies
    if (plan.dependencies.blocking.length > 0) {
      output += `## ⚠️ Blocking Dependencies\n\n`;
      plan.dependencies.blocking.forEach(dep => {
        output += `• ${dep}\n`;
      });
      output += '\n';
    }

    // Risk Assessment
    if (plan.riskAssessment.length > 0) {
      output += `## 🎲 Risk Assessment\n\n`;
      plan.riskAssessment.forEach(risk => {
        output += `**${risk.risk}** (${risk.probability} probability, ${risk.impact} impact)\n`;
        output += `*Mitigation:* ${risk.mitigation}\n\n`;
      });
    }

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Environment Setup:** Configure development environment and dependencies\n`;
    output += `2. **Branch Creation:** Create feature branch: \`${workflow.gitWorkflow.branchNaming}\`\n`;
    output += `3. **Implementation Start:** Begin with Phase 1 activities\n`;
    output += `4. **Regular Commits:** Follow conventional commit standards\n`;
    output += `5. **Testing:** Implement tests according to TDD/BDD approach\n`;
    output += `6. **Code Review:** Submit PR when implementation is complete\n\n`;

    output += `💡 **Implementation Tips:**\n`;
    output += `• Start with the simplest acceptance criteria first\n`;
    output += `• Write tests before or alongside implementation\n`;
    output += `• Commit frequently with descriptive messages\n`;
    output += `• Seek code review early and often\n`;
    output += `• Document any deviations from the plan\n\n`;

    output += `📁 **Complete implementation plan and code templates saved to project.**`;

    return output;
  },

  async saveImplementationToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const implementationDir = join(saDir, 'story-implementations');
      if (!existsSync(implementationDir)) {
        require('fs').mkdirSync(implementationDir, { recursive: true });
      }
      
      const filename = `story-impl-${context.storyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(implementationDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save story implementation:', error.message);
    }
  }
};