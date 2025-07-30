/**
 * SA Workflow Status Tool
 * Provides current workflow status, progress indicators, active steps and completion estimates
 */

export const saWorkflowStatus = {
  name: 'sa_workflow_status',
  description: 'Status monitoring tool for workflow progress, active phases, and completion estimates',
  category: 'workflow',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      workflowId: {
        type: 'string',
        description: 'Specific workflow ID to check status (optional, will use active workflow if not provided)'
      },
      includeDetails: {
        type: 'boolean',
        description: 'Include detailed phase and task information',
        default: true
      },
      includeMetrics: {
        type: 'boolean',
        description: 'Include performance and progress metrics',
        default: true
      },
      includeBlockers: {
        type: 'boolean',
        description: 'Include information about current blockers',
        default: true
      }
    },
    required: ['projectRoot']
  },
  
  async execute({ projectRoot, workflowId, includeDetails = true, includeMetrics = true, includeBlockers = true }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const workflowDir = path.join(projectRoot, '.sa-workflow');
      
      // Check if workflow directory exists
      try {
        await fs.access(workflowDir);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: 'No active workflow found in this project. Use sa_start_workflow to begin a new workflow.'
          }],
          metadata: {
            hasWorkflow: false,
            projectRoot
          }
        };
      }
      
      // Load workflow state
      const stateFile = path.join(workflowDir, 'workflow-state.json');
      let workflowState;
      
      try {
        const stateContent = await fs.readFile(stateFile, 'utf-8');
        workflowState = JSON.parse(stateContent);
      } catch (error) {
        throw new Error('Failed to load workflow state: ' + error.message);
      }
      
      // Validate workflow ID if provided
      if (workflowId && workflowState.id !== workflowId) {
        return {
          content: [{
            type: 'text',
            text: `Workflow ID ${workflowId} not found. Active workflow ID is ${workflowState.id}`
          }],
          metadata: {
            error: true,
            requestedWorkflowId: workflowId,
            activeWorkflowId: workflowState.id
          }
        };
      }
      
      // Calculate current progress and estimates
      const progressInfo = await this.calculateProgress(workflowState, workflowDir);
      const blockersInfo = includeBlockers ? await this.getBlockers(workflowDir) : null;
      const metricsInfo = includeMetrics ? await this.getMetrics(workflowState, workflowDir) : null;
      
      // Build status response
      let statusText = this.buildStatusText(workflowState, progressInfo, blockersInfo, metricsInfo, includeDetails);
      
      return {
        content: [{
          type: 'text',
          text: statusText
        }],
        metadata: {
          workflowId: workflowState.id,
          projectName: workflowState.projectName,
          workflowType: workflowState.type,
          status: workflowState.status,
          currentPhase: workflowState.currentPhase,
          totalPhases: workflowState.phases.length,
          overallProgress: progressInfo.overallProgress,
          currentPhaseProgress: progressInfo.currentPhaseProgress,
          estimatedCompletion: progressInfo.estimatedCompletion,
          blockers: blockersInfo?.activeBlockers || [],
          lastUpdated: workflowState.updatedAt
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error retrieving workflow status: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'workflow_status_error'
        }
      };
    }
  },
  
  async calculateProgress(workflowState, workflowDir) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    let completedPhases = 0;
    let currentPhaseProgress = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Calculate phase completion
    for (let i = 0; i < workflowState.phases.length; i++) {
      const phase = workflowState.phases[i];
      
      if (phase.status === 'completed') {
        completedPhases++;
      } else if (phase.status === 'in-progress') {
        // Try to get detailed progress from phase directory
        const phaseDir = path.join(workflowDir, 'phases', `phase-${i + 1}-${phase.name.toLowerCase().replace(/\s+/g, '-')}`);
        try {
          const phaseProgressFile = path.join(phaseDir, 'progress.json');
          const progressContent = await fs.readFile(phaseProgressFile, 'utf-8');
          const phaseProgress = JSON.parse(progressContent);
          currentPhaseProgress = phaseProgress.percentage || 0;
          totalTasks += phaseProgress.totalTasks || 0;
          completedTasks += phaseProgress.completedTasks || 0;
        } catch (error) {
          // Estimate based on time if no detailed progress available
          currentPhaseProgress = this.estimatePhaseProgressByTime(phase);
        }
      }
    }
    
    // Calculate overall progress
    const overallProgress = Math.round(
      ((completedPhases + (currentPhaseProgress / 100)) / workflowState.phases.length) * 100
    );
    
    // Estimate completion time
    const estimatedCompletion = this.estimateCompletion(workflowState, overallProgress);
    
    return {
      overallProgress,
      currentPhaseProgress,
      completedPhases,
      totalPhases: workflowState.phases.length,
      totalTasks,
      completedTasks,
      estimatedCompletion
    };
  },
  
  estimatePhaseProgressByTime(phase) {
    if (!phase.startedAt) return 0;
    
    const startTime = new Date(phase.startedAt);
    const currentTime = new Date();
    const elapsedHours = (currentTime - startTime) / (1000 * 60 * 60);
    
    // Rough estimation based on typical phase durations
    const estimatedHours = {
      'Analysis & Planning': 80,
      'Architecture Design': 40,
      'Development': 160,
      'Testing & Deployment': 60
    };
    
    const phaseEstimate = estimatedHours[phase.name] || 40;
    return Math.min(Math.round((elapsedHours / phaseEstimate) * 100), 95);
  },
  
  estimateCompletion(workflowState, overallProgress) {
    if (overallProgress === 0) return 'Unable to estimate';
    
    const startTime = new Date(workflowState.createdAt);
    const currentTime = new Date();
    const elapsedTime = currentTime - startTime;
    
    // Estimate total time based on current progress
    const estimatedTotalTime = (elapsedTime / overallProgress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;
    
    if (remainingTime <= 0) return 'Overdue';
    
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
    
    if (remainingDays <= 1) return 'Less than 1 day';
    if (remainingDays <= 7) return `${remainingDays} days`;
    if (remainingDays <= 30) return `${Math.ceil(remainingDays / 7)} weeks`;
    
    return `${Math.ceil(remainingDays / 30)} months`;
  },
  
  async getBlockers(workflowDir) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const blockersFile = path.join(workflowDir, 'blockers.json');
      const blockersContent = await fs.readFile(blockersFile, 'utf-8');
      const blockers = JSON.parse(blockersContent);
      
      const activeBlockers = blockers.filter(blocker => blocker.status === 'active');
      const resolvedBlockers = blockers.filter(blocker => blocker.status === 'resolved');
      
      return {
        activeBlockers,
        resolvedBlockers,
        totalBlockers: blockers.length
      };
    } catch (error) {
      return {
        activeBlockers: [],
        resolvedBlockers: [],
        totalBlockers: 0
      };
    }
  },
  
  async getMetrics(workflowState, workflowDir) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const metricsFile = path.join(workflowDir, 'metrics.json');
      const metricsContent = await fs.readFile(metricsFile, 'utf-8');
      const metrics = JSON.parse(metricsContent);
      
      return {
        performance: metrics.performance || {},
        quality: metrics.quality || {},
        productivity: metrics.productivity || {},
        lastUpdated: metrics.lastUpdated
      };
    } catch (error) {
      // Calculate basic metrics from workflow state
      const startTime = new Date(workflowState.createdAt);
      const currentTime = new Date();
      const elapsedDays = Math.ceil((currentTime - startTime) / (1000 * 60 * 60 * 24));
      
      return {
        performance: {
          elapsedTime: elapsedDays,
          averagePhaseTime: elapsedDays / Math.max(workflowState.currentPhase + 1, 1)
        },
        quality: {},
        productivity: {},
        lastUpdated: currentTime.toISOString()
      };
    }
  },
  
  buildStatusText(workflowState, progressInfo, blockersInfo, metricsInfo, includeDetails) {
    let text = `# Workflow Status: ${workflowState.projectName}\n\n`;
    
    // Basic information
    text += `**Workflow ID:** ${workflowState.id}\n`;
    text += `**Type:** ${workflowState.type}\n`;
    text += `**Status:** ${workflowState.status}\n`;
    text += `**Overall Progress:** ${progressInfo.overallProgress}%\n`;
    text += `**Current Phase:** ${workflowState.currentPhase + 1}/${progressInfo.totalPhases}\n`;
    text += `**Estimated Completion:** ${progressInfo.estimatedCompletion}\n\n`;
    
    // Current phase information
    const currentPhase = workflowState.phases[workflowState.currentPhase];
    if (currentPhase) {
      text += `## Current Phase: ${currentPhase.name}\n`;
      text += `**Description:** ${currentPhase.description}\n`;
      text += `**Progress:** ${progressInfo.currentPhaseProgress}%\n`;
      text += `**Status:** ${currentPhase.status}\n\n`;
    }
    
    // Progress summary
    text += `## Progress Summary\n`;
    text += `- Completed Phases: ${progressInfo.completedPhases}/${progressInfo.totalPhases}\n`;
    if (progressInfo.totalTasks > 0) {
      text += `- Completed Tasks: ${progressInfo.completedTasks}/${progressInfo.totalTasks}\n`;
    }
    text += `- Started: ${new Date(workflowState.createdAt).toLocaleDateString()}\n`;
    text += `- Last Updated: ${new Date(workflowState.updatedAt).toLocaleDateString()}\n\n`;
    
    // Blockers information
    if (blockersInfo && blockersInfo.activeBlockers.length > 0) {
      text += `## Active Blockers (${blockersInfo.activeBlockers.length})\n`;
      blockersInfo.activeBlockers.forEach((blocker, index) => {
        text += `${index + 1}. **${blocker.title}** - ${blocker.description}\n`;
        text += `   - Priority: ${blocker.priority}\n`;
        text += `   - Created: ${new Date(blocker.createdAt).toLocaleDateString()}\n`;
      });
      text += '\n';
    }
    
    // Detailed phase information
    if (includeDetails) {
      text += `## All Phases\n`;
      workflowState.phases.forEach((phase, index) => {
        const status = phase.status === 'completed' ? '✅' : 
                     phase.status === 'in-progress' ? '🔄' : 
                     phase.status === 'blocked' ? '🚫' : '⏸️';
        
        text += `${index + 1}. ${status} **${phase.name}** (${phase.status})\n`;
        text += `   - ${phase.description}\n`;
        if (phase.estimatedDuration) {
          text += `   - Duration: ${phase.estimatedDuration}\n`;
        }
        if (phase.startedAt) {
          text += `   - Started: ${new Date(phase.startedAt).toLocaleDateString()}\n`;
        }
        if (phase.completedAt) {
          text += `   - Completed: ${new Date(phase.completedAt).toLocaleDateString()}\n`;
        }
      });
      text += '\n';
    }
    
    // Metrics information
    if (metricsInfo) {
      text += `## Performance Metrics\n`;
      if (metricsInfo.performance.elapsedTime) {
        text += `- Elapsed Time: ${metricsInfo.performance.elapsedTime} days\n`;
      }
      if (metricsInfo.performance.averagePhaseTime) {
        text += `- Average Phase Time: ${Math.round(metricsInfo.performance.averagePhaseTime)} days\n`;
      }
      text += '\n';
    }
    
    // Next steps
    if (currentPhase && currentPhase.steps) {
      text += `## Next Steps\n`;
      const remainingSteps = currentPhase.steps.slice(0, 3);
      remainingSteps.forEach((step, index) => {
        text += `${index + 1}. ${step}\n`;
      });
    }
    
    return text;
  }
};