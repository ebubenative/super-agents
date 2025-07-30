/**
 * SA Start Workflow Tool
 * Initiates a new workflow with template selection, initialization, and parameter configuration
 */

export const saStartWorkflow = {
  name: 'sa_start_workflow',
  description: 'Workflow initiation tool with template selection, parameter configuration, and initial state setup',
  category: 'workflow',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      workflowType: {
        type: 'string',
        enum: ['greenfield-fullstack', 'brownfield-fullstack', 'greenfield-service', 'brownfield-service', 'greenfield-ui', 'brownfield-ui'],
        description: 'Type of workflow to start based on BMAD workflow definitions'
      },
      projectName: {
        type: 'string',
        description: 'Name of the project for this workflow'
      },
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      parameters: {
        type: 'object',
        properties: {
          technology: {
            type: 'string',
            description: 'Primary technology stack (e.g., React, Node.js, Python)'
          },
          complexity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Project complexity level'
          },
          teamSize: {
            type: 'number',
            description: 'Number of team members working on this project'
          },
          timeline: {
            type: 'string',
            description: 'Expected project timeline (e.g., "2 weeks", "3 months")'
          }
        },
        additionalProperties: true
      },
      templateOverrides: {
        type: 'object',
        description: 'Override default template configurations',
        additionalProperties: true
      }
    },
    required: ['workflowType', 'projectName', 'projectRoot']
  },
  
  async execute({ workflowType, projectName, projectRoot, parameters = {}, templateOverrides = {} }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { v4: uuidv4 } = await import('uuid');
      
      // Generate unique workflow ID
      const workflowId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Load workflow template based on type
      const workflowTemplate = await this.loadWorkflowTemplate(workflowType);
      
      // Initialize workflow state
      const workflowState = {
        id: workflowId,
        type: workflowType,
        projectName,
        projectRoot,
        status: 'initializing',
        createdAt: timestamp,
        updatedAt: timestamp,
        parameters: {
          ...workflowTemplate.defaultParameters,
          ...parameters
        },
        templateOverrides,
        phases: workflowTemplate.phases.map(phase => ({
          ...phase,
          status: 'pending',
          startedAt: null,
          completedAt: null,
          progress: 0
        })),
        currentPhase: 0,
        progress: {
          overall: 0,
          currentPhase: 0,
          completedPhases: 0,
          totalPhases: workflowTemplate.phases.length
        },
        metrics: {
          startTime: timestamp,
          estimatedDuration: workflowTemplate.estimatedDuration,
          actualDuration: null,
          blockers: [],
          completedTasks: 0,
          totalTasks: 0
        },
        agents: workflowTemplate.agents || [],
        artifacts: []
      };
      
      // Create workflow directory structure
      const workflowDir = path.join(projectRoot, '.sa-workflow');
      await fs.mkdir(workflowDir, { recursive: true });
      
      // Save workflow state
      const stateFile = path.join(workflowDir, 'workflow-state.json');
      await fs.writeFile(stateFile, JSON.stringify(workflowState, null, 2));
      
      // Initialize workflow-specific directories
      await this.initializeWorkflowDirectories(workflowDir, workflowTemplate);
      
      // Create initial workflow documentation
      await this.createWorkflowDocumentation(workflowDir, workflowState);
      
      // Set up workflow monitoring
      await this.setupWorkflowMonitoring(workflowDir, workflowState);
      
      // Update status to active
      workflowState.status = 'active';
      workflowState.updatedAt = new Date().toISOString();
      await fs.writeFile(stateFile, JSON.stringify(workflowState, null, 2));
      
      return {
        content: [{
          type: 'text',
          text: `Successfully started ${workflowType} workflow for project "${projectName}"`
        }],
        metadata: {
          workflowId,
          workflowType,
          projectName,
          projectRoot,
          status: 'active',
          phases: workflowState.phases.length,
          estimatedDuration: workflowTemplate.estimatedDuration,
          nextSteps: workflowTemplate.phases[0]?.steps?.slice(0, 3) || []
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error starting workflow: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'workflow_start_error'
        }
      };
    }
  },
  
  async loadWorkflowTemplate(workflowType) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Try to load from BMAD workflow definitions first
    const bmadWorkflowPath = path.join(process.cwd(), 'src_codebase', 'BMAD-METHOD-main', 'bmad-core', 'workflows', `${workflowType}.yaml`);
    
    try {
      const yaml = await import('yaml');
      const workflowContent = await fs.readFile(bmadWorkflowPath, 'utf-8');
      return yaml.parse(workflowContent);
    } catch (error) {
      // Fallback to default templates
      return this.getDefaultWorkflowTemplate(workflowType);
    }
  },
  
  getDefaultWorkflowTemplate(workflowType) {
    const templates = {
      'greenfield-fullstack': {
        name: 'Greenfield Full-Stack Development',
        estimatedDuration: '6-8 weeks',
        defaultParameters: {
          technology: 'React/Node.js',
          complexity: 'medium',
          teamSize: 3
        },
        agents: ['analyst', 'architect', 'developer', 'qa'],
        phases: [
          {
            name: 'Analysis & Planning',
            description: 'Requirements gathering and initial planning',
            steps: ['Market research', 'Requirements analysis', 'Technical planning'],
            estimatedDuration: '1-2 weeks'
          },
          {
            name: 'Architecture Design',
            description: 'System architecture and design decisions',
            steps: ['System design', 'Technology selection', 'Infrastructure planning'],
            estimatedDuration: '1 week'
          },
          {
            name: 'Development',
            description: 'Core implementation phase',
            steps: ['Backend development', 'Frontend development', 'Integration'],
            estimatedDuration: '3-4 weeks'
          },
          {
            name: 'Testing & Deployment',
            description: 'Quality assurance and production deployment',
            steps: ['Testing', 'Bug fixes', 'Deployment setup'],
            estimatedDuration: '1-2 weeks'
          }
        ]
      },
      'brownfield-fullstack': {
        name: 'Brownfield Full-Stack Enhancement',
        estimatedDuration: '4-6 weeks',
        defaultParameters: {
          technology: 'Existing Stack',
          complexity: 'medium',
          teamSize: 2
        },
        agents: ['analyst', 'architect', 'developer', 'qa'],
        phases: [
          {
            name: 'System Analysis',
            description: 'Analysis of existing system and requirements',
            steps: ['Codebase analysis', 'Requirements gathering', 'Risk assessment'],
            estimatedDuration: '1 week'
          },
          {
            name: 'Enhancement Planning',
            description: 'Planning improvements and modifications',
            steps: ['Enhancement design', 'Migration planning', 'Impact analysis'],
            estimatedDuration: '1 week'
          },
          {
            name: 'Implementation',
            description: 'Implementing enhancements',
            steps: ['Code modifications', 'New feature development', 'Integration'],
            estimatedDuration: '2-3 weeks'
          },
          {
            name: 'Testing & Migration',
            description: 'Testing and deploying enhancements',
            steps: ['Testing', 'Migration', 'Monitoring'],
            estimatedDuration: '1 week'
          }
        ]
      }
    };
    
    return templates[workflowType] || templates['greenfield-fullstack'];
  },
  
  async initializeWorkflowDirectories(workflowDir, template) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const directories = [
      'phases',
      'artifacts',
      'reports',
      'logs',
      'templates'
    ];
    
    for (const dir of directories) {
      await fs.mkdir(path.join(workflowDir, dir), { recursive: true });
    }
    
    // Create phase-specific directories
    for (let i = 0; i < template.phases.length; i++) {
      const phaseDir = path.join(workflowDir, 'phases', `phase-${i + 1}-${template.phases[i].name.toLowerCase().replace(/\s+/g, '-')}`);
      await fs.mkdir(phaseDir, { recursive: true });
    }
  },
  
  async createWorkflowDocumentation(workflowDir, workflowState) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const documentation = `# ${workflowState.projectName} Workflow

## Workflow Information
- **ID**: ${workflowState.id}
- **Type**: ${workflowState.type}
- **Status**: ${workflowState.status}
- **Created**: ${workflowState.createdAt}
- **Project Root**: ${workflowState.projectRoot}

## Parameters
${Object.entries(workflowState.parameters).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## Phases
${workflowState.phases.map((phase, index) => `
### Phase ${index + 1}: ${phase.name}
- **Description**: ${phase.description}
- **Status**: ${phase.status}
- **Estimated Duration**: ${phase.estimatedDuration}
- **Steps**: ${phase.steps?.join(', ') || 'TBD'}
`).join('\n')}

## Progress Tracking
- **Overall Progress**: ${workflowState.progress.overall}%
- **Current Phase**: ${workflowState.progress.currentPhase + 1}/${workflowState.progress.totalPhases}
- **Completed Phases**: ${workflowState.progress.completedPhases}

---
*Generated by SA Workflow Management System*
`;
    
    await fs.writeFile(path.join(workflowDir, 'README.md'), documentation);
  },
  
  async setupWorkflowMonitoring(workflowDir, workflowState) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Create monitoring configuration
    const monitoringConfig = {
      workflowId: workflowState.id,
      projectName: workflowState.projectName,
      monitoringEnabled: true,
      checkInterval: 300000, // 5 minutes
      alerts: {
        blockers: true,
        phaseOverrun: true,
        qualityGates: true
      },
      metrics: {
        trackProgress: true,
        trackPerformance: true,
        trackQuality: true
      }
    };
    
    await fs.writeFile(
      path.join(workflowDir, 'monitoring-config.json'),
      JSON.stringify(monitoringConfig, null, 2)
    );
    
    // Create initial log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'workflow_started',
      workflowId: workflowState.id,
      projectName: workflowState.projectName,
      workflowType: workflowState.type,
      details: 'Workflow successfully initialized and monitoring started'
    };
    
    await fs.writeFile(
      path.join(workflowDir, 'logs', 'workflow.log'),
      JSON.stringify(logEntry) + '\n'
    );
  }
};