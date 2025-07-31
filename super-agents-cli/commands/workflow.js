#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { table, getBorderCharacters } from 'table';
import cliProgress from 'cli-progress';
import boxen from 'boxen';
import figlet from 'figlet';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Super Agents CLI Workflow Management
 * Terminal-based workflow orchestration and management
 */

class WorkflowCLI {
  constructor() {
    this.workflows = new Map();
    this.activeWorkflow = null;
    this.progressBar = null;
  }

  /**
   * Start a new workflow
   */
  async start(options) {
    const spinner = ora('Initializing workflow system...').start();
    
    try {
      // Display Super Agents banner
      console.log(chalk.cyan(figlet.textSync('Super Agents', { horizontalLayout: 'full' })));
      console.log(chalk.gray('Terminal-based AI Workflow Orchestration\n'));

      spinner.text = 'Loading available workflows...';
      
      const workflowTypes = await this.getAvailableWorkflows();
      spinner.succeed('Workflow system initialized');

      // Interactive workflow selection if not specified
      let workflowType = options.type;
      if (!workflowType) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'workflowType',
            message: 'Select a workflow type:',
            choices: workflowTypes.map(wf => ({
              name: `${wf.name} - ${wf.description}`,
              value: wf.id
            }))
          }
        ]);
        workflowType = answers.workflowType;
      }

      // Initialize workflow
      await this.initializeWorkflow(workflowType, options);
      
    } catch (error) {
      spinner.fail(`Failed to start workflow: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Get available workflow types
   */
  async getAvailableWorkflows() {
    return [
      {
        id: 'greenfield-fullstack',
        name: 'Greenfield Full-Stack Development',
        description: 'Complete development workflow for new full-stack applications',
        phases: ['analysis', 'planning', 'architecture', 'implementation', 'testing', 'deployment']
      },
      {
        id: 'feature-development',
        name: 'Feature Development',
        description: 'End-to-end feature development workflow',
        phases: ['requirements', 'design', 'implementation', 'review', 'testing']
      },
      {
        id: 'code-review',
        name: 'Comprehensive Code Review',
        description: 'Multi-agent code review and quality assurance',
        phases: ['static-analysis', 'architectural-review', 'security-audit', 'performance-review']
      },
      {
        id: 'api-development',
        name: 'API Development',
        description: 'RESTful API design and implementation workflow',
        phases: ['api-design', 'implementation', 'testing', 'documentation']
      },
      {
        id: 'modernization',
        name: 'Legacy System Modernization',
        description: 'Systematic approach to modernizing legacy systems',
        phases: ['assessment', 'strategy', 'migration-plan', 'implementation', 'validation']
      },
      {
        id: 'debugging',
        name: 'Systematic Debugging',
        description: 'Structured debugging and issue resolution',
        phases: ['problem-analysis', 'root-cause', 'solution-design', 'implementation', 'verification']
      }
    ];
  }

  /**
   * Initialize a specific workflow
   */
  async initializeWorkflow(workflowType, options) {
    const workflow = await this.loadWorkflowDefinition(workflowType);
    
    console.log(boxen(
      `Starting: ${workflow.name}\n\n${workflow.description}\n\nPhases: ${workflow.phases.length}\nEstimated Time: ${workflow.estimatedTime || 'Variable'}`,
      {
        title: 'Workflow Initialization',
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    ));

    // Project context gathering
    const projectContext = await this.gatherProjectContext(options);
    
    // Initialize workflow state
    const workflowInstance = {
      id: `${workflowType}-${Date.now()}`,
      type: workflowType,
      definition: workflow,
      context: projectContext,
      phases: workflow.phases.map(phase => ({
        ...phase,
        status: 'pending',
        startTime: null,
        endTime: null,
        results: null
      })),
      startTime: new Date(),
      status: 'active'
    };

    this.workflows.set(workflowInstance.id, workflowInstance);
    this.activeWorkflow = workflowInstance;

    // Start workflow execution
    await this.executeWorkflow(workflowInstance);
  }

  /**
   * Gather project context through interactive prompts
   */
  async gatherProjectContext(options) {
    const questions = [
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: options.project || 'super-agents-project'
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'Project type:',
        choices: ['web-app', 'api', 'mobile-app', 'desktop-app', 'library', 'microservice', 'other']
      },
      {
        type: 'checkbox',
        name: 'techStack',
        message: 'Technology stack (select all that apply):',
        choices: [
          'JavaScript/Node.js',
          'TypeScript',
          'React',
          'Vue.js',
          'Angular',
          'Python',
          'Java',
          'Go',
          'Rust',
          'Docker',
          'Kubernetes',
          'AWS',
          'Azure',
          'GCP'
        ]
      },
      {
        type: 'input',
        name: 'requirements',
        message: 'Brief description of requirements:'
      }
    ];

    const answers = await inquirer.prompt(questions);
    return {
      ...answers,
      timestamp: new Date().toISOString(),
      workingDirectory: process.cwd()
    };
  }

  /**
   * Execute workflow phases
   */
  async executeWorkflow(workflowInstance) {
    console.log('\n' + chalk.green('🚀 Starting workflow execution...\n'));

    // Create progress bar
    this.progressBar = new cliProgress.SingleBar({
      format: 'Workflow Progress |{bar}| {percentage}% | {value}/{total} Phases | ETA: {eta}s | Current: {phase}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });

    this.progressBar.start(workflowInstance.phases.length, 0, { phase: 'Initializing...' });

    for (let i = 0; i < workflowInstance.phases.length; i++) {
      const phase = workflowInstance.phases[i];
      
      this.progressBar.update(i, { phase: phase.name });
      
      await this.executePhase(workflowInstance, phase, i);
      
      this.progressBar.update(i + 1, { phase: `Completed: ${phase.name}` });
      
      // Brief pause between phases
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.progressBar.stop();
    
    // Display completion summary
    await this.displayWorkflowSummary(workflowInstance);
  }

  /**
   * Execute a single workflow phase
   */
  async executePhase(workflowInstance, phase, phaseIndex) {
    console.log(`\n${chalk.blue('●')} Phase ${phaseIndex + 1}: ${chalk.bold(phase.name)}`);
    console.log(`  ${chalk.gray(phase.description)}`);

    phase.status = 'in-progress';
    phase.startTime = new Date();

    try {
      // Agent assignment
      const agent = this.assignAgentToPhase(phase);
      console.log(`  ${chalk.yellow('👤')} Agent: ${chalk.bold(agent.name)} (${agent.specialty})`);

      // Tool execution simulation
      if (phase.tools && phase.tools.length > 0) {
        console.log(`  ${chalk.cyan('🔧')} Tools: ${phase.tools.join(', ')}`);
        
        for (const tool of phase.tools) {
          const spinner = ora(`Executing ${tool}...`).start();
          
          // Simulate tool execution
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          spinner.succeed(`${tool} completed`);
        }
      }

      // Generate phase results
      phase.results = await this.generatePhaseResults(workflowInstance, phase);
      phase.status = 'completed';
      phase.endTime = new Date();

      console.log(`  ${chalk.green('✓')} Phase completed successfully`);
      
      // Display key outputs
      if (phase.results && phase.results.keyOutputs) {
        console.log(`  ${chalk.magenta('📋')} Key Outputs:`);
        phase.results.keyOutputs.forEach(output => {
          console.log(`    • ${output}`);
        });
      }

    } catch (error) {
      phase.status = 'failed';
      phase.error = error.message;
      console.log(`  ${chalk.red('✗')} Phase failed: ${error.message}`);
      
      // Handle phase failure
      const shouldContinue = await this.handlePhaseFailure(workflowInstance, phase);
      if (!shouldContinue) {
        throw new Error(`Workflow stopped due to phase failure: ${phase.name}`);
      }
    }
  }

  /**
   * Assign appropriate agent to phase
   */
  assignAgentToPhase(phase) {
    const agentMappings = {
      'analysis': { name: 'Analyst', specialty: 'Market Research & Requirements' },
      'requirements': { name: 'Analyst', specialty: 'Requirements Gathering' },
      'planning': { name: 'Product Manager', specialty: 'Product Strategy' },
      'design': { name: 'Product Manager', specialty: 'Feature Design' },
      'architecture': { name: 'Architect', specialty: 'System Design' },
      'api-design': { name: 'Architect', specialty: 'API Architecture' },
      'implementation': { name: 'Developer', specialty: 'Full-Stack Development' },
      'testing': { name: 'QA Engineer', specialty: 'Quality Assurance' },
      'review': { name: 'QA Engineer', specialty: 'Code Review' },
      'security-audit': { name: 'QA Engineer', specialty: 'Security Analysis' },
      'deployment': { name: 'Developer', specialty: 'DevOps & Deployment' }
    };

    return agentMappings[phase.type] || { name: 'Generic Agent', specialty: 'Multi-purpose' };
  }

  /**
   * Generate realistic phase results
   */
  async generatePhaseResults(workflowInstance, phase) {
    const results = {
      duration: new Date() - phase.startTime,
      keyOutputs: [],
      artifacts: [],
      nextSteps: []
    };

    // Generate phase-specific outputs
    switch (phase.type) {
      case 'analysis':
        results.keyOutputs = [
          'Market research report completed',
          'Competitive analysis documented',
          'User personas identified',
          'Requirements baseline established'
        ];
        results.artifacts = ['market-research.md', 'competitive-analysis.md', 'user-personas.md'];
        break;

      case 'planning':
        results.keyOutputs = [
          'Product Requirements Document (PRD) created',
          'Feature prioritization completed',
          'Development roadmap established',
          'Success metrics defined'
        ];
        results.artifacts = ['prd.md', 'roadmap.md', 'success-metrics.md'];
        break;

      case 'architecture':
        results.keyOutputs = [
          'System architecture designed',
          'Technology stack selected',
          'Integration patterns defined',
          'Scalability considerations documented'
        ];
        results.artifacts = ['architecture.md', 'tech-stack.md', 'integration-patterns.md'];
        break;

      case 'implementation':
        results.keyOutputs = [
          'Core features implemented',
          'Unit tests created',
          'Code quality standards met',
          'Documentation updated'
        ];
        results.artifacts = ['src/', 'tests/', 'docs/'];
        break;

      case 'testing':
        results.keyOutputs = [
          'Test suite executed',
          'Code coverage analyzed',
          'Performance benchmarks completed',
          'Quality gates passed'
        ];
        results.artifacts = ['test-results.xml', 'coverage-report.html', 'performance-report.md'];
        break;

      default:
        results.keyOutputs = [`${phase.name} phase completed successfully`];
    }

    return results;
  }

  /**
   * Handle phase failure
   */
  async handlePhaseFailure(workflowInstance, phase) {
    const choices = [
      { name: 'Retry phase', value: 'retry' },
      { name: 'Skip phase (continue workflow)', value: 'skip' },
      { name: 'Abort workflow', value: 'abort' }
    ];

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `Phase "${phase.name}" failed. What would you like to do?`,
        choices
      }
    ]);

    switch (answer.action) {
      case 'retry':
        // Reset phase status and retry
        phase.status = 'pending';
        phase.error = null;
        return true;
      
      case 'skip':
        phase.status = 'skipped';
        return true;
      
      case 'abort':
        return false;
    }
  }

  /**
   * Display workflow completion summary
   */
  async displayWorkflowSummary(workflowInstance) {
    const endTime = new Date();
    const duration = endTime - workflowInstance.startTime;
    const completedPhases = workflowInstance.phases.filter(p => p.status === 'completed').length;
    const failedPhases = workflowInstance.phases.filter(p => p.status === 'failed').length;
    const skippedPhases = workflowInstance.phases.filter(p => p.status === 'skipped').length;

    // Create summary table
    const summaryData = [
      ['Metric', 'Value'],
      ['Workflow Type', workflowInstance.definition.name],
      ['Total Duration', this.formatDuration(duration)],
      ['Phases Completed', `${completedPhases}/${workflowInstance.phases.length}`],
      ['Success Rate', `${Math.round((completedPhases / workflowInstance.phases.length) * 100)}%`],
      ['Failed Phases', failedPhases.toString()],
      ['Skipped Phases', skippedPhases.toString()]
    ];

    const summaryTable = table(summaryData, {
      border: getBorderCharacters('ramac'),
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1
      }
    });

    console.log('\n' + boxen(
      `🎉 Workflow Completed!\n\n${summaryTable}\n\nProject: ${workflowInstance.context.projectName}\nType: ${workflowInstance.context.projectType}`,
      {
        title: 'Workflow Summary',
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    // Phase details table
    const phaseData = [
      ['Phase', 'Agent', 'Status', 'Duration', 'Key Outputs']
    ];

    workflowInstance.phases.forEach(phase => {
      const agent = this.assignAgentToPhase(phase);
      const duration = phase.startTime && phase.endTime ? 
        this.formatDuration(phase.endTime - phase.startTime) : 'N/A';
      const outputs = phase.results && phase.results.keyOutputs ? 
        phase.results.keyOutputs.slice(0, 2).join(', ') + (phase.results.keyOutputs.length > 2 ? '...' : '') : 'None';
      
      phaseData.push([
        phase.name,
        agent.name,
        this.formatStatus(phase.status),
        duration,
        outputs
      ]);
    });

    const phaseTable = table(phaseData, {
      border: getBorderCharacters('ramac'),
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1
      }
    });

    console.log('\n' + chalk.blue('Phase Details:'));
    console.log(phaseTable);

    // Next steps
    console.log('\n' + chalk.yellow('🚀 Recommended Next Steps:'));
    console.log('  • Review generated artifacts and documentation');
    console.log('  • Run quality checks and validation tests');
    console.log('  • Plan next iteration or deployment phase');
    console.log('  • Update project documentation and team communication');
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format status with colors and icons
   */
  formatStatus(status) {
    const statusMap = {
      'completed': chalk.green('✓ Completed'),
      'failed': chalk.red('✗ Failed'),
      'skipped': chalk.yellow('⊘ Skipped'),
      'in-progress': chalk.blue('● In Progress'),
      'pending': chalk.gray('○ Pending')
    };

    return statusMap[status] || status;
  }

  /**
   * Load workflow definition
   */
  async loadWorkflowDefinition(workflowType) {
    const workflows = await this.getAvailableWorkflows();
    const workflow = workflows.find(wf => wf.id === workflowType);
    
    if (!workflow) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    // Expand phase definitions
    workflow.phases = workflow.phases.map(phaseName => ({
      name: phaseName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: phaseName,
      description: this.getPhaseDescription(phaseName),
      tools: this.getPhaseTools(phaseName),
      estimatedDuration: this.getPhaseEstimatedDuration(phaseName)
    }));

    return workflow;
  }

  /**
   * Get phase description
   */
  getPhaseDescription(phaseType) {
    const descriptions = {
      'analysis': 'Analyze market conditions, requirements, and project context',
      'requirements': 'Gather and document detailed requirements',
      'planning': 'Create product strategy and development roadmap',
      'design': 'Design user experience and feature specifications',
      'architecture': 'Design system architecture and technical specifications',
      'api-design': 'Design API endpoints and data models',
      'implementation': 'Implement features and core functionality',
      'testing': 'Execute comprehensive testing and quality assurance',
      'review': 'Perform code review and quality validation',
      'security-audit': 'Conduct security analysis and vulnerability assessment',
      'performance-review': 'Analyze performance and optimization opportunities',
      'deployment': 'Deploy application and configure production environment',
      'documentation': 'Create comprehensive documentation',
      'assessment': 'Assess current system state and capabilities',
      'strategy': 'Develop modernization strategy and approach',
      'migration-plan': 'Create detailed migration and implementation plan',
      'validation': 'Validate results and ensure quality standards',
      'problem-analysis': 'Analyze problem symptoms and gather information',
      'root-cause': 'Identify root cause of the issue',
      'solution-design': 'Design solution approach and implementation plan',
      'verification': 'Verify solution effectiveness and stability'
    };

    return descriptions[phaseType] || `Execute ${phaseType} phase`;
  }

  /**
   * Get phase tools
   */
  getPhaseTools(phaseType) {
    const toolMappings = {
      'analysis': ['sa-research-market', 'sa-competitor-analysis', 'sa-create-brief'],
      'requirements': ['sa-create-brief', 'sa-brainstorm-session'],
      'planning': ['sa-generate-prd', 'sa-prioritize-features', 'sa-create-epic'],
      'design': ['sa-generate-prd', 'sa-create-frontend-spec'],
      'architecture': ['sa-create-architecture', 'sa-tech-recommendations', 'sa-design-system'],
      'api-design': ['sa-create-architecture', 'sa-tech-recommendations'],
      'implementation': ['sa-implement-story', 'sa-validate-implementation'],
      'testing': ['sa-run-tests', 'sa-validate-quality'],
      'review': ['sa-review-code', 'sa-validate-quality'],
      'security-audit': ['sa-review-code', 'sa-validate-quality'],
      'performance-review': ['sa-debug-issue', 'sa-validate-implementation'],
      'deployment': ['sa-validate-implementation', 'sa-run-tests'],
      'documentation': ['sa-shard-document'],
      'assessment': ['sa-analyze-brownfield'],
      'strategy': ['sa-tech-recommendations', 'sa-create-architecture'],
      'migration-plan': ['sa-generate-tasks', 'sa-analyze-complexity'],
      'validation': ['sa-validate-implementation', 'sa-validate-quality'],
      'problem-analysis': ['sa-debug-issue'],
      'root-cause': ['sa-debug-issue', 'sa-analyze-complexity'],
      'solution-design': ['sa-implement-story', 'sa-create-architecture'],
      'verification': ['sa-validate-implementation', 'sa-run-tests']
    };

    return toolMappings[phaseType] || [];
  }

  /**
   * Get estimated phase duration
   */
  getPhaseEstimatedDuration(phaseType) {
    const durations = {
      'analysis': 30, // minutes
      'requirements': 45,
      'planning': 60,
      'design': 45,
      'architecture': 90,
      'api-design': 60,
      'implementation': 120,
      'testing': 60,
      'review': 30,
      'security-audit': 45,
      'performance-review': 30,
      'deployment': 45,
      'documentation': 30,
      'assessment': 60,
      'strategy': 90,
      'migration-plan': 120,
      'validation': 45,
      'problem-analysis': 30,
      'root-cause': 45,
      'solution-design': 60,
      'verification': 30
    };

    return durations[phaseType] || 30;
  }

  /**
   * Show workflow status
   */
  async status(options) {
    if (this.workflows.size === 0) {
      console.log(chalk.yellow('No active workflows found.'));
      return;
    }

    // List all workflows
    const workflowData = [
      ['ID', 'Type', 'Status', 'Progress', 'Started', 'Duration']
    ];

    for (const [id, workflow] of this.workflows) {
      const completedPhases = workflow.phases.filter(p => p.status === 'completed').length;
      const progress = `${completedPhases}/${workflow.phases.length}`;
      const duration = workflow.status === 'completed' ? 
        this.formatDuration(workflow.endTime - workflow.startTime) :
        this.formatDuration(new Date() - workflow.startTime);

      workflowData.push([
        id.slice(-8),
        workflow.definition.name,
        this.formatStatus(workflow.status),
        progress,
        workflow.startTime.toLocaleTimeString(),
        duration
      ]);
    }

    const workflowTable = table(workflowData, {
      border: getBorderCharacters('ramac')
    });

    console.log('\n' + chalk.blue('Active Workflows:'));
    console.log(workflowTable);

    // Show detailed status for active workflow
    if (this.activeWorkflow && options.verbose) {
      console.log('\n' + chalk.blue('Active Workflow Details:'));
      await this.displayWorkflowStatus(this.activeWorkflow);
    }
  }

  /**
   * Display detailed workflow status
   */
  async displayWorkflowStatus(workflow) {
    const phaseData = [
      ['Phase', 'Status', 'Agent', 'Progress', 'Duration']
    ];

    workflow.phases.forEach((phase, index) => {
      const agent = this.assignAgentToPhase(phase);
      const progress = phase.status === 'completed' ? '100%' : 
                     phase.status === 'in-progress' ? '50%' : '0%';
      const duration = phase.startTime && phase.endTime ? 
        this.formatDuration(phase.endTime - phase.startTime) : 
        phase.startTime ? this.formatDuration(new Date() - phase.startTime) : 'N/A';

      phaseData.push([
        `${index + 1}. ${phase.name}`,
        this.formatStatus(phase.status),
        agent.name,
        progress,
        duration
      ]);
    });

    const statusTable = table(phaseData, {
      border: getBorderCharacters('ramac')
    });

    console.log(statusTable);
  }

  /**
   * Track workflow progress
   */
  async track(options) {
    if (!this.activeWorkflow) {
      console.log(chalk.yellow('No active workflow to track.'));
      return;
    }

    console.log(chalk.blue('📊 Workflow Progress Tracking\n'));

    // Real-time progress monitoring
    const trackingInterval = setInterval(() => {
      console.clear();
      console.log(chalk.blue('📊 Workflow Progress Tracking\n'));
      
      this.displayWorkflowStatus(this.activeWorkflow);
      
      // Show current phase details
      const currentPhase = this.activeWorkflow.phases.find(p => p.status === 'in-progress');
      if (currentPhase) {
        console.log('\n' + chalk.yellow('🔄 Current Phase:'));
        console.log(`  ${chalk.bold(currentPhase.name)}`);
        console.log(`  ${chalk.gray(currentPhase.description)}`);
        if (currentPhase.startTime) {
          const elapsed = this.formatDuration(new Date() - currentPhase.startTime);
          console.log(`  ${chalk.cyan('⏱️')} Elapsed: ${elapsed}`);
        }
      }

    }, 2000);

    // Stop tracking on workflow completion or user interrupt
    const stopTracking = () => {
      clearInterval(trackingInterval);
      console.log('\n' + chalk.green('Tracking stopped.'));
    };

    process.on('SIGINT', stopTracking);
    
    // Stop when workflow completes
    if (this.activeWorkflow.status === 'completed') {
      stopTracking();
    }
  }
}

// Export command functions
export const workflowCommand = {
  start: async (options) => {
    const cli = new WorkflowCLI();
    await cli.start(options);
  },

  status: async (options) => {
    const cli = new WorkflowCLI();
    await cli.status(options);
  },

  track: async (options) => {
    const cli = new WorkflowCLI();
    await cli.track(options);
  }
};

export default WorkflowCLI;