import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_create_epic MCP Tool
 * Epic creation and management with user story breakdown and prioritization
 */
export const saCreateEpic = {
  name: 'sa_create_epic',
  description: 'Create and manage epics with user story breakdown, epic prioritization, and comprehensive documentation',
  category: 'pm',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      epicName: {
        type: 'string',
        description: 'Name of the epic',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      epicType: {
        type: 'string',
        description: 'Type of epic',
        enum: ['feature-epic', 'infrastructure-epic', 'enhancement-epic', 'maintenance-epic', 'research-epic'],
        default: 'feature-epic'
      },
      businessValue: {
        type: 'object',
        description: 'Business value information',
        properties: {
          objective: { type: 'string' },
          outcomes: { type: 'array', items: { type: 'string' } },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          urgency: { type: 'string', enum: ['high', 'medium', 'low'] },
          revenue: { type: 'string' }
        }
      },
      userPersonas: {
        type: 'array',
        description: 'Target user personas for this epic',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            needs: { type: 'array', items: { type: 'string' } }
          },
          required: ['name', 'role']
        }
      },
      acceptanceCriteria: {
        type: 'array',
        description: 'High-level acceptance criteria for the epic',
        items: { type: 'string' }
      },
      constraints: {
        type: 'object',
        description: 'Epic constraints',
        properties: {
          timeline: { type: 'string' },
          budget: { type: 'string' },
          resources: { type: 'array', items: { type: 'string' } },
          technical: { type: 'array', items: { type: 'string' } },
          dependencies: { type: 'array', items: { type: 'string' } }
        }
      },
      generateUserStories: {
        type: 'boolean',
        description: 'Generate initial user stories breakdown',
        default: true
      },
      storyEstimation: {
        type: 'string',
        description: 'Estimation method for user stories',
        enum: ['story-points', 't-shirt-sizes', 'hours', 'complexity'],
        default: 'story-points'
      },
      priority: {
        type: 'string',
        description: 'Epic priority',
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium'
      }
    },
    required: ['epicName']
  },

  /**
   * Validate tool arguments
   */
  validate(args) {
    const errors = [];
    
    if (!args.epicName || typeof args.epicName !== 'string') {
      errors.push('epicName is required and must be a string');
    }
    
    if (args.epicName && args.epicName.trim().length === 0) {
      errors.push('epicName cannot be empty');
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
   * Execute epic creation
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const epicName = args.epicName.trim();
    
    try {
      // Prepare epic context
      const epicContext = {
        epicName,
        epicType: args.epicType || 'feature-epic',
        priority: args.priority || 'medium',
        businessValue: args.businessValue || {},
        userPersonas: args.userPersonas || [],
        acceptanceCriteria: args.acceptanceCriteria || [],
        constraints: args.constraints || {},
        generateUserStories: args.generateUserStories !== false,
        storyEstimation: args.storyEstimation || 'story-points',
        timestamp: new Date().toISOString(),
        author: context?.userId || 'system',
        epicId: `epic-${Date.now()}`
      };
      
      // Create epic structure
      const epicStructure = await this.createEpicStructure(epicContext);
      
      // Generate user stories if requested
      let userStories = [];
      if (epicContext.generateUserStories) {
        userStories = await this.generateUserStories(epicContext, epicStructure);
      }
      
      // Create epic prioritization framework
      const prioritizationFramework = await this.createPrioritizationFramework(epicContext);
      
      // Generate epic documentation
      const epicDocumentation = await this.generateEpicDocumentation(epicContext, epicStructure, userStories);
      
      // Format output
      const output = await this.formatEpicOutput(epicContext, epicStructure, userStories, prioritizationFramework, epicDocumentation);
      
      // Save epic to project
      await this.saveEpicToProject(projectPath, epicContext, {
        structure: epicStructure,
        userStories,
        prioritizationFramework,
        documentation: epicDocumentation
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          epicName,
          epicType: args.epicType,
          priority: args.priority,
          userPersonaCount: epicContext.userPersonas.length,
          userStoryCount: userStories.length,
          generateUserStories: args.generateUserStories,
          epicId: epicContext.epicId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create epic ${epicName}: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          epicName,
          projectPath
        }
      };
    }
  },

  /**
   * Create epic structure
   */
  async createEpicStructure(context) {
    const structure = {
      metadata: {
        id: context.epicId,
        name: context.epicName,
        type: context.epicType,
        priority: context.priority,
        status: 'draft',
        created: context.timestamp,
        author: context.author
      },
      overview: {
        description: '',
        goals: [],
        successCriteria: context.acceptanceCriteria,
        targetUsers: context.userPersonas
      },
      businessCase: {
        objective: context.businessValue.objective || '',
        expectedOutcomes: context.businessValue.outcomes || [],
        businessImpact: context.businessValue.impact || 'medium',
        urgency: context.businessValue.urgency || 'medium',
        revenueImpact: context.businessValue.revenue || ''
      },
      scope: {
        included: [],
        excluded: [],
        assumptions: [],
        dependencies: context.constraints.dependencies || []
      },
      constraints: {
        timeline: context.constraints.timeline || '',
        budget: context.constraints.budget || '',
        resources: context.constraints.resources || [],
        technical: context.constraints.technical || []
      },
      deliverables: [],
      risks: [],
      estimation: {
        method: context.storyEstimation,
        totalEstimate: 0,
        confidence: 'low'
      }
    };
    
    // Add type-specific structure elements
    switch (context.epicType) {
      case 'feature-epic':
        structure.featureDetails = {
          userJourneys: [],
          keyFeatures: [],
          integrationPoints: [],
          designRequirements: []
        };
        break;
      case 'infrastructure-epic':
        structure.infrastructureDetails = {
          systemComponents: [],
          performanceTargets: [],
          scalabilityRequirements: [],
          securityRequirements: []
        };
        break;
      case 'enhancement-epic':
        structure.enhancementDetails = {
          currentState: '',
          proposedChanges: [],
          migrationStrategy: '',
          backwardCompatibility: true
        };
        break;
    }
    
    return structure;
  },

  /**
   * Generate user stories
   */
  async generateUserStories(context, structure) {
    const stories = [];
    
    // Generate stories based on user personas and epic type
    for (const persona of context.userPersonas) {
      const personaStories = await this.generateStoriesForPersona(persona, context, structure);
      stories.push(...personaStories);
    }
    
    // Add generic stories based on epic type
    const genericStories = await this.generateGenericStories(context, structure);
    stories.push(...genericStories);
    
    return stories;
  },

  /**
   * Generate stories for specific persona
   */
  async generateStoriesForPersona(persona, context, structure) {
    const stories = [];
    
    // Generate stories based on persona needs
    for (const need of persona.needs || []) {
      const story = {
        id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${persona.role} can ${need.toLowerCase()}`,
        description: `As a ${persona.role}, I want to ${need.toLowerCase()} so that I can achieve my goals efficiently.`,
        persona: persona.name,
        priority: 'medium',
        estimationMethod: context.storyEstimation,
        estimate: 0,
        acceptanceCriteria: [],
        dependencies: [],
        status: 'draft',
        epic: context.epicId
      };
      
      // Add default acceptance criteria
      story.acceptanceCriteria = [
        `Given I am a ${persona.role}`,
        `When I attempt to ${need.toLowerCase()}`,
        `Then I should be able to complete the task successfully`,
        `And the solution should be intuitive and efficient`
      ];
      
      stories.push(story);
    }
    
    return stories;
  },

  /**
   * Generate generic stories based on epic type
   */
  async generateGenericStories(context, structure) {
    const stories = [];
    
    switch (context.epicType) {
      case 'feature-epic':
        stories.push(
          {
            id: `story-${Date.now()}-setup`,
            title: 'Set up feature infrastructure',
            description: 'As a developer, I want to set up the basic infrastructure for the new feature so that development can begin.',
            priority: 'high',
            estimationMethod: context.storyEstimation,
            estimate: 0,
            acceptanceCriteria: [
              'Feature scaffolding is created',
              'Basic routing is configured',
              'Database schemas are updated if needed',
              'Tests structure is in place'
            ],
            epic: context.epicId
          },
          {
            id: `story-${Date.now()}-testing`,
            title: 'Create comprehensive test suite',
            description: 'As a QA engineer, I want comprehensive tests for the feature so that quality is ensured.',
            priority: 'medium',
            estimationMethod: context.storyEstimation,
            estimate: 0,
            acceptanceCriteria: [
              'Unit tests cover core functionality',
              'Integration tests verify system interactions',
              'End-to-end tests validate user workflows',
              'Test coverage meets quality standards'
            ],
            epic: context.epicId
          }
        );
        break;
        
      case 'infrastructure-epic':
        stories.push(
          {
            id: `story-${Date.now()}-planning`,
            title: 'Infrastructure planning and design',
            description: 'As a DevOps engineer, I want to plan the infrastructure changes so that implementation is smooth.',
            priority: 'high',
            estimationMethod: context.storyEstimation,
            estimate: 0,
            acceptanceCriteria: [
              'Infrastructure requirements are documented',
              'Architecture diagrams are created',
              'Migration plan is established',
              'Risk assessment is completed'
            ],
            epic: context.epicId
          }
        );
        break;
    }
    
    return stories;
  },

  /**
   * Create prioritization framework
   */
  async createPrioritizationFramework(context) {
    return {
      method: 'RICE Framework',
      criteria: {
        reach: {
          description: 'How many users will be impacted?',
          scale: 'Number of users per time period',
          weight: 0.25
        },
        impact: {
          description: 'How much will this impact each user?',
          scale: '3 = Massive, 2 = High, 1 = Medium, 0.5 = Low, 0.25 = Minimal',
          weight: 0.25
        },
        confidence: {
          description: 'How confident are we in our estimates?',
          scale: '100% = High, 80% = Medium, 50% = Low',
          weight: 0.25
        },
        effort: {
          description: 'How much effort will this require?',
          scale: 'Number of person-months',
          weight: 0.25
        }
      },
      alternativeMethods: [
        'MoSCoW prioritization',
        'Kano model',
        'Value vs Effort matrix',
        'Weighted shortest job first'
      ],
      prioritizationMatrix: {
        high: 'High business value, low effort',
        medium: 'Medium business value or medium effort',
        low: 'Low business value or high effort'
      }
    };
  },

  /**
   * Generate epic documentation
   */
  async generateEpicDocumentation(context, structure, userStories) {
    return {
      epicBrief: this.generateEpicBrief(context, structure),
      userStoryBreakdown: this.generateUserStoryBreakdown(userStories),
      acceptanceCriteria: this.generateAcceptanceCriteria(context, structure),
      implementationPlan: this.generateImplementationPlan(context, structure, userStories),
      testingStrategy: this.generateTestingStrategy(context, structure),
      riskAssessment: this.generateRiskAssessment(context, structure)
    };
  },

  /**
   * Generate epic brief
   */
  generateEpicBrief(context, structure) {
    return `
# Epic: ${context.epicName}

## Overview
**Type:** ${context.epicType}
**Priority:** ${context.priority}
**Status:** ${structure.metadata.status}

## Business Objective
${structure.businessCase.objective || 'Define the primary business objective for this epic.'}

## Expected Outcomes
${structure.businessCase.expectedOutcomes.length > 0 ? 
  structure.businessCase.expectedOutcomes.map(outcome => `- ${outcome}`).join('\n') : 
  'Define the expected business outcomes.'}

## Target Users
${structure.overview.targetUsers.length > 0 ? 
  structure.overview.targetUsers.map(user => `- **${user.name}** (${user.role})`).join('\n') : 
  'Define the target user personas.'}

## Success Criteria
${structure.overview.successCriteria.length > 0 ? 
  structure.overview.successCriteria.map(criteria => `- ${criteria}`).join('\n') : 
  'Define measurable success criteria.'}
`;
  },

  /**
   * Generate user story breakdown
   */
  generateUserStoryBreakdown(userStories) {
    if (userStories.length === 0) {
      return 'No user stories generated. Consider enabling user story generation.';
    }
    
    let breakdown = `# User Story Breakdown\n\n`;
    breakdown += `**Total Stories:** ${userStories.length}\n\n`;
    
    // Group by persona
    const storiesByPersona = userStories.reduce((acc, story) => {
      const persona = story.persona || 'Generic';
      if (!acc[persona]) acc[persona] = [];
      acc[persona].push(story);
      return acc;
    }, {});
    
    Object.entries(storiesByPersona).forEach(([persona, stories]) => {
      breakdown += `## ${persona} Stories\n\n`;
      stories.forEach(story => {
        breakdown += `### ${story.title}\n`;
        breakdown += `**ID:** ${story.id}\n`;
        breakdown += `**Priority:** ${story.priority}\n`;
        breakdown += `**Description:** ${story.description}\n\n`;
        breakdown += `**Acceptance Criteria:**\n`;
        story.acceptanceCriteria.forEach(criteria => {
          breakdown += `- ${criteria}\n`;
        });
        breakdown += '\n';
      });
    });
    
    return breakdown;
  },

  /**
   * Generate acceptance criteria
   */
  generateAcceptanceCriteria(context, structure) {
    return `
# Epic Acceptance Criteria

## Definition of Done
- [ ] All user stories are completed and tested
- [ ] Code review and approval obtained
- [ ] Documentation is updated
- [ ] Performance benchmarks are met
- [ ] Security review is completed
- [ ] User acceptance testing is passed

## Business Acceptance Criteria
${structure.overview.successCriteria.map(criteria => `- [ ] ${criteria}`).join('\n')}

## Technical Acceptance Criteria
- [ ] Code meets quality standards
- [ ] Test coverage meets requirements
- [ ] Performance requirements are satisfied
- [ ] Security requirements are met
- [ ] Accessibility standards are followed
`;
  },

  /**
   * Generate implementation plan
   */
  generateImplementationPlan(context, structure, userStories) {
    const phases = [
      {
        name: 'Planning & Design',
        duration: '1-2 weeks',
        activities: [
          'Detailed requirements analysis',
          'Technical design and architecture',
          'User experience design',
          'Implementation strategy planning'
        ]
      },
      {
        name: 'Development',
        duration: '4-8 weeks',
        activities: [
          'Core functionality implementation',
          'Integration development',
          'Unit testing',
          'Code reviews'
        ]
      },
      {
        name: 'Testing & QA',
        duration: '2-3 weeks',
        activities: [
          'Integration testing',
          'System testing',
          'User acceptance testing',
          'Performance testing'
        ]
      },
      {
        name: 'Deployment',
        duration: '1 week',
        activities: [
          'Production deployment',
          'Monitoring setup',
          'User training',
          'Documentation finalization'
        ]
      }
    ];
    
    let plan = `# Implementation Plan\n\n`;
    plan += `**Total Estimated Duration:** ${phases.reduce((total, phase) => total + parseInt(phase.duration), 0)} weeks (approximate)\n\n`;
    
    phases.forEach((phase, index) => {
      plan += `## Phase ${index + 1}: ${phase.name}\n`;
      plan += `**Duration:** ${phase.duration}\n\n`;
      plan += `**Key Activities:**\n`;
      phase.activities.forEach(activity => {
        plan += `- ${activity}\n`;
      });
      plan += '\n';
    });
    
    return plan;
  },

  /**
   * Generate testing strategy
   */
  generateTestingStrategy(context, structure) {
    return `
# Testing Strategy

## Test Levels
- **Unit Testing:** Individual component testing
- **Integration Testing:** Component interaction testing
- **System Testing:** End-to-end functionality testing
- **User Acceptance Testing:** Business requirement validation

## Test Types
- **Functional Testing:** Core feature validation
- **Performance Testing:** Speed and scalability validation
- **Security Testing:** Security requirement validation
- **Usability Testing:** User experience validation

## Test Coverage Requirements
- Unit test coverage: 80% minimum
- Critical path coverage: 100%
- Integration test coverage: Key workflows
- E2E test coverage: Happy path scenarios

## Testing Timeline
- Unit tests: Developed alongside features
- Integration tests: Weekly integration cycles
- System tests: Sprint completion
- UAT: Pre-production deployment
`;
  },

  /**
   * Generate risk assessment
   */
  generateRiskAssessment(context, structure) {
    const commonRisks = [
      {
        risk: 'Technical complexity higher than estimated',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Conduct technical spike and proof of concept'
      },
      {
        risk: 'Dependencies on external systems',
        probability: 'High',
        impact: 'Medium',
        mitigation: 'Early integration testing and fallback plans'
      },
      {
        risk: 'Changing requirements during development',
        probability: 'Medium',
        impact: 'Medium',
        mitigation: 'Regular stakeholder reviews and change control process'
      },
      {
        risk: 'Resource availability constraints',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Resource planning and cross-training'
      }
    ];
    
    let assessment = `# Risk Assessment\n\n`;
    commonRisks.forEach(risk => {
      assessment += `## ${risk.risk}\n`;
      assessment += `**Probability:** ${risk.probability}\n`;
      assessment += `**Impact:** ${risk.impact}\n`;
      assessment += `**Mitigation:** ${risk.mitigation}\n\n`;
    });
    
    return assessment;
  },

  /**
   * Format epic output
   */
  async formatEpicOutput(context, structure, userStories, prioritizationFramework, documentation) {
    let output = `📗 **Epic Creation: ${context.epicName}**\n\n`;
    output += `🎯 **Epic Type:** ${context.epicType}\n`;
    output += `⭐ **Priority:** ${context.priority}\n`;
    output += `👥 **Target Personas:** ${context.userPersonas.length}\n`;
    output += `📝 **User Stories Generated:** ${userStories.length}\n`;
    output += `🆔 **Epic ID:** ${context.epicId}\n\n`;
    
    // Business Value Summary
    if (context.businessValue.objective) {
      output += `## 💼 Business Value\n\n`;
      output += `**Objective:** ${context.businessValue.objective}\n`;
      if (context.businessValue.impact) {
        output += `**Business Impact:** ${context.businessValue.impact}\n`;
      }
      if (context.businessValue.urgency) {
        output += `**Urgency:** ${context.businessValue.urgency}\n`;
      }
      if (context.businessValue.outcomes && context.businessValue.outcomes.length > 0) {
        output += `**Expected Outcomes:**\n`;
        context.businessValue.outcomes.forEach(outcome => {
          output += `• ${outcome}\n`;
        });
      }
      output += '\n';
    }
    
    // User Stories Summary
    if (userStories.length > 0) {
      output += `## 📚 User Stories Summary\n\n`;
      
      // Group by priority
      const storiesByPriority = userStories.reduce((acc, story) => {
        if (!acc[story.priority]) acc[story.priority] = [];
        acc[story.priority].push(story);
        return acc;
      }, {});
      
      Object.entries(storiesByPriority).forEach(([priority, stories]) => {
        output += `**${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority:** ${stories.length} stories\n`;
        stories.slice(0, 3).forEach(story => {  // Show first 3 stories
          output += `• ${story.title}\n`;
        });
        if (stories.length > 3) {
          output += `• ... and ${stories.length - 3} more\n`;
        }
        output += '\n';
      });
    }
    
    // Acceptance Criteria
    if (context.acceptanceCriteria.length > 0) {
      output += `## ✅ Epic Acceptance Criteria\n\n`;
      context.acceptanceCriteria.forEach(criteria => {
        output += `• ${criteria}\n`;
      });
      output += '\n';
    }
    
    // Constraints Summary
    if (Object.keys(context.constraints).length > 0) {
      output += `## ⚠️ Constraints\n\n`;
      Object.entries(context.constraints).forEach(([type, value]) => {
        if (value && (typeof value === 'string' ? value.trim() : value.length > 0)) {
          output += `**${type.charAt(0).toUpperCase() + type.slice(1)}:** `;
          if (Array.isArray(value)) {
            output += value.join(', ');
          } else {
            output += value;
          }
          output += '\n';
        }
      });
      output += '\n';
    }
    
    // Prioritization Framework
    output += `## 📊 Prioritization Framework\n\n`;
    output += `**Method:** ${prioritizationFramework.method}\n\n`;
    Object.entries(prioritizationFramework.criteria).forEach(([criterion, details]) => {
      output += `**${criterion.charAt(0).toUpperCase() + criterion.slice(1)}** (Weight: ${details.weight})\n`;
      output += `${details.description}\n`;
      output += `*Scale:* ${details.scale}\n\n`;
    });
    
    // Implementation Phases
    output += `## 🛤️ Implementation Approach\n\n`;
    output += `1. **Planning & Design** - Requirements analysis and technical design\n`;
    output += `2. **Development** - Core functionality implementation\n`;
    output += `3. **Testing & QA** - Comprehensive testing cycles\n`;
    output += `4. **Deployment** - Production deployment and monitoring\n\n`;
    
    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Stakeholder Review:**\n`;
    output += `   • Present epic to stakeholders for approval\n`;
    output += `   • Validate business objectives and success criteria\n`;
    output += `   • Confirm resource allocation\n\n`;
    
    output += `2. **Story Refinement:**\n`;
    output += `   • Review and refine generated user stories\n`;
    output += `   • Add detailed acceptance criteria\n`;
    output += `   • Estimate story points or effort\n\n`;
    
    output += `3. **Planning:**\n`;
    output += `   • Create detailed implementation timeline\n`;
    output += `   • Assign stories to sprints/iterations\n`;
    output += `   • Set up project tracking\n\n`;
    
    output += `💡 **Epic Management Tips:**\n`;
    output += `• Keep epics focused on business outcomes\n`;
    output += `• Break down large epics into manageable stories\n`;
    output += `• Regularly review and adjust priorities\n`;
    output += `• Maintain clear communication with stakeholders\n`;
    output += `• Track progress against success criteria\n\n`;
    
    output += `📁 **Epic documentation and user stories saved to project.**`;
    
    return output;
  },

  /**
   * Save epic to project
   */
  async saveEpicToProject(projectPath, context, epicData) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) {
        return; // No SA project, skip saving
      }
      
      const epicsDir = join(saDir, 'epics');
      if (!existsSync(epicsDir)) {
        require('fs').mkdirSync(epicsDir, { recursive: true });
      }
      
      const fullEpicData = {
        context,
        ...epicData,
        createdAt: new Date().toISOString()
      };
      
      const filename = `epic-${context.epicName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(epicsDir, filename);
      
      writeFileSync(filepath, JSON.stringify(fullEpicData, null, 2));
      
      // Also create markdown documentation
      const mdFilename = filename.replace('.json', '.md');
      const mdFilepath = join(epicsDir, mdFilename);
      
      let mdContent = epicData.documentation.epicBrief;
      mdContent += '\n\n' + epicData.documentation.userStoryBreakdown;
      mdContent += '\n\n' + epicData.documentation.acceptanceCriteria;
      mdContent += '\n\n' + epicData.documentation.implementationPlan;
      mdContent += '\n\n' + epicData.documentation.testingStrategy;
      mdContent += '\n\n' + epicData.documentation.riskAssessment;
      
      writeFileSync(mdFilepath, mdContent);
      
    } catch (error) {
      // Silent fail - epic saving is optional
      console.warn('Failed to save epic:', error.message);
    }
  }
};