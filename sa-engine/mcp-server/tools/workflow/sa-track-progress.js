/**
 * SA Track Progress Tool
 * Progress tracking across workflow phases, milestone monitoring, performance metrics, and progress reporting
 */

export const saTrackProgress = {
  name: 'sa_track_progress',
  description: 'Progress tracking tool for workflow phases, milestones, performance metrics and comprehensive reporting',
  category: 'workflow',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      action: {
        type: 'string',
        enum: ['update', 'milestone', 'report', 'metrics'],
        description: 'Type of progress tracking action to perform'
      },
      phaseId: {
        type: 'number',
        description: 'Phase ID to update progress for (0-indexed)'
      },
      progress: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Progress percentage for the phase (0-100)'
      },
      milestoneData: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Milestone name'
          },
          description: {
            type: 'string',
            description: 'Milestone description'
          },
          phaseId: {
            type: 'number',
            description: 'Associated phase ID'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in-progress', 'completed', 'overdue'],
            description: 'Milestone status'
          },
          dueDate: {
            type: 'string',
            description: 'Due date in ISO format'
          }
        }
      },
      taskData: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task identifier'
          },
          status: {
            type: 'string',
            enum: ['pending', 'in-progress', 'completed', 'blocked'],
            description: 'Task status'
          },
          phaseId: {
            type: 'number',
            description: 'Associated phase ID'
          },
          completedAt: {
            type: 'string',
            description: 'Completion timestamp in ISO format'
          }
        }
      },
      reportType: {
        type: 'string',
        enum: ['summary', 'detailed', 'performance', 'milestones'],
        description: 'Type of progress report to generate',
        default: 'summary'
      },
      timeRange: {
        type: 'string',
        enum: ['daily', 'weekly', 'monthly', 'all'],
        description: 'Time range for progress reporting',
        default: 'all'
      }
    },
    required: ['projectRoot', 'action']
  },
  
  async execute({ projectRoot, action, phaseId, progress, milestoneData, taskData, reportType = 'summary', timeRange = 'all' }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const workflowDir = path.join(projectRoot, '.sa-workflow');
      const stateFile = path.join(workflowDir, 'workflow-state.json');
      
      // Load current workflow state
      let workflowState;
      try {
        const stateContent = await fs.readFile(stateFile, 'utf-8');
        workflowState = JSON.parse(stateContent);
      } catch (error) {
        throw new Error('No active workflow found. Use sa_start_workflow to begin a new workflow.');
      }
      
      let result;
      
      switch (action) {
        case 'update':
          result = await this.updatePhaseProgress(workflowState, workflowDir, phaseId, progress);
          break;
        case 'milestone':
          result = await this.trackMilestone(workflowState, workflowDir, milestoneData);
          break;
        case 'report':
          result = await this.generateProgressReport(workflowState, workflowDir, reportType, timeRange);
          break;
        case 'metrics':
          result = await this.updateMetrics(workflowState, workflowDir, taskData);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      return result;
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error tracking progress: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'progress_tracking_error'
        }
      };
    }
  },
  
  async updatePhaseProgress(workflowState, workflowDir, phaseId, progress) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    if (phaseId < 0 || phaseId >= workflowState.phases.length) {
      throw new Error(`Invalid phase ID: ${phaseId}. Must be between 0 and ${workflowState.phases.length - 1}`);
    }
    
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    const phase = workflowState.phases[phaseId];
    const previousProgress = phase.progress || 0;
    
    // Update phase progress
    phase.progress = progress;
    phase.updatedAt = new Date().toISOString();
    
    // Update phase status based on progress
    if (progress === 0 && phase.status === 'pending') {
      // Keep as pending
    } else if (progress > 0 && progress < 100) {
      phase.status = 'in-progress';
      if (!phase.startedAt) {
        phase.startedAt = new Date().toISOString();
      }
    } else if (progress === 100) {
      phase.status = 'completed';
      phase.completedAt = new Date().toISOString();
    }
    
    // Update current phase if this phase is now active
    if (progress > 0 && workflowState.currentPhase < phaseId) {
      workflowState.currentPhase = phaseId;
    }
    
    // Calculate overall progress
    const totalProgress = workflowState.phases.reduce((sum, p) => sum + (p.progress || 0), 0);
    workflowState.progress.overall = Math.round(totalProgress / workflowState.phases.length);
    workflowState.progress.currentPhase = phaseId;
    workflowState.progress.completedPhases = workflowState.phases.filter(p => p.status === 'completed').length;
    
    workflowState.updatedAt = new Date().toISOString();
    
    // Save updated state
    const stateFile = path.join(workflowDir, 'workflow-state.json');
    await fs.writeFile(stateFile, JSON.stringify(workflowState, null, 2));
    
    // Log progress update
    await this.logProgressUpdate(workflowDir, {
      phaseId,
      phaseName: phase.name,
      previousProgress,
      newProgress: progress,
      timestamp: new Date().toISOString()
    });
    
    // Update phase-specific progress file
    const phaseDir = path.join(workflowDir, 'phases', `phase-${phaseId + 1}-${phase.name.toLowerCase().replace(/\\s+/g, '-')}`);
    await fs.mkdir(phaseDir, { recursive: true });
    
    const phaseProgressFile = path.join(phaseDir, 'progress.json');
    const phaseProgressData = {
      phaseId,
      phaseName: phase.name,
      percentage: progress,
      status: phase.status,
      startedAt: phase.startedAt,
      completedAt: phase.completedAt,
      updatedAt: phase.updatedAt,
      milestones: await this.getPhaseMilestones(workflowDir, phaseId),
      tasks: await this.getPhaseTasks(workflowDir, phaseId)
    };
    
    await fs.writeFile(phaseProgressFile, JSON.stringify(phaseProgressData, null, 2));
    
    return {
      content: [{
        type: 'text',
        text: `Successfully updated Phase ${phaseId + 1} (${phase.name}) progress from ${previousProgress}% to ${progress}%\\n\\nOverall workflow progress: ${workflowState.progress.overall}%`
      }],
      metadata: {
        phaseId,
        phaseName: phase.name,
        previousProgress,
        newProgress: progress,
        overallProgress: workflowState.progress.overall,
        phaseStatus: phase.status,
        workflowId: workflowState.id
      }
    };
  },
  
  async trackMilestone(workflowState, workflowDir, milestoneData) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { v4: uuidv4 } = await import('uuid');
    
    if (!milestoneData || !milestoneData.name) {
      throw new Error('Milestone data with name is required');
    }
    
    const milestone = {
      id: uuidv4(),
      name: milestoneData.name,
      description: milestoneData.description || '',
      phaseId: milestoneData.phaseId || workflowState.currentPhase,
      status: milestoneData.status || 'pending',
      dueDate: milestoneData.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Load existing milestones
    const milestonesFile = path.join(workflowDir, 'milestones.json');
    let milestones = [];
    
    try {
      const milestonesContent = await fs.readFile(milestonesFile, 'utf-8');
      milestones = JSON.parse(milestonesContent);
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }
    
    milestones.push(milestone);
    
    // Save milestones
    await fs.writeFile(milestonesFile, JSON.stringify(milestones, null, 2));
    
    // Log milestone creation
    await this.logProgressUpdate(workflowDir, {
      type: 'milestone',
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      phaseId: milestone.phaseId,
      timestamp: new Date().toISOString()
    });
    
    return {
      content: [{
        type: 'text',
        text: `Successfully created milestone "${milestone.name}" for Phase ${milestone.phaseId + 1}\\n\\nMilestone ID: ${milestone.id}\\nStatus: ${milestone.status}\\nDue Date: ${milestone.dueDate || 'Not set'}`
      }],
      metadata: {
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        phaseId: milestone.phaseId,
        status: milestone.status,
        dueDate: milestone.dueDate,
        workflowId: workflowState.id
      }
    };
  },
  
  async generateProgressReport(workflowState, workflowDir, reportType, timeRange) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    let reportContent = '';
    const timestamp = new Date().toISOString();
    
    switch (reportType) {
      case 'summary':
        reportContent = await this.generateSummaryReport(workflowState, workflowDir, timeRange);
        break;
      case 'detailed':
        reportContent = await this.generateDetailedReport(workflowState, workflowDir, timeRange);
        break;
      case 'performance':
        reportContent = await this.generatePerformanceReport(workflowState, workflowDir, timeRange);
        break;
      case 'milestones':
        reportContent = await this.generateMilestonesReport(workflowState, workflowDir, timeRange);
        break;
      default:
        reportContent = await this.generateSummaryReport(workflowState, workflowDir, timeRange);
    }
    
    // Save report
    const reportsDir = path.join(workflowDir, 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportFileName = `progress-report-${reportType}-${new Date().toISOString().split('T')[0]}.md`;
    const reportFile = path.join(reportsDir, reportFileName);
    await fs.writeFile(reportFile, reportContent);
    
    return {
      content: [{
        type: 'text',
        text: reportContent
      }],
      metadata: {
        reportType,
        timeRange,
        reportFile,
        generatedAt: timestamp,
        workflowId: workflowState.id
      }
    };
  },
  
  async generateSummaryReport(workflowState, workflowDir, timeRange) {
    const milestones = await this.loadMilestones(workflowDir);
    const logs = await this.loadProgressLogs(workflowDir, timeRange);
    
    let report = `# Progress Summary Report\\n\\n`;
    report += `**Project:** ${workflowState.projectName}\\n`;
    report += `**Workflow Type:** ${workflowState.type}\\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\\n`;
    report += `**Time Range:** ${timeRange}\\n\\n`;
    
    // Overall progress
    report += `## Overall Progress\\n`;
    report += `- **Completion:** ${workflowState.progress.overall}%\\n`;
    report += `- **Current Phase:** ${workflowState.currentPhase + 1}/${workflowState.phases.length}\\n`;
    report += `- **Completed Phases:** ${workflowState.progress.completedPhases}\\n`;
    report += `- **Status:** ${workflowState.status}\\n\\n`;
    
    // Phase summary
    report += `## Phase Status\\n`;
    workflowState.phases.forEach((phase, index) => {
      const status = phase.status === 'completed' ? '✅' : 
                   phase.status === 'in-progress' ? '🔄' : 
                   phase.status === 'blocked' ? '🚫' : '⏸️';
      report += `${index + 1}. ${status} **${phase.name}** - ${phase.progress || 0}%\\n`;
    });
    report += '\\n';
    
    // Recent milestones
    const recentMilestones = milestones.slice(-5);
    if (recentMilestones.length > 0) {
      report += `## Recent Milestones\\n`;
      recentMilestones.forEach(milestone => {
        const status = milestone.status === 'completed' ? '✅' : 
                     milestone.status === 'in-progress' ? '🔄' : 
                     milestone.status === 'overdue' ? '⚠️' : '⏸️';
        report += `- ${status} ${milestone.name} (Phase ${milestone.phaseId + 1})\\n`;
      });
      report += '\\n';
    }
    
    return report;
  },
  
  async generateDetailedReport(workflowState, workflowDir, timeRange) {
    const milestones = await this.loadMilestones(workflowDir);
    const logs = await this.loadProgressLogs(workflowDir, timeRange);
    
    let report = `# Detailed Progress Report\\n\\n`;
    report += `**Project:** ${workflowState.projectName}\\n`;
    report += `**Workflow ID:** ${workflowState.id}\\n`;
    report += `**Type:** ${workflowState.type}\\n`;
    report += `**Created:** ${new Date(workflowState.createdAt).toLocaleString()}\\n`;
    report += `**Last Updated:** ${new Date(workflowState.updatedAt).toLocaleString()}\\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\\n\\n`;
    
    // Detailed phase information
    report += `## Phase Details\\n\\n`;
    workflowState.phases.forEach((phase, index) => {
      report += `### Phase ${index + 1}: ${phase.name}\\n`;
      report += `- **Status:** ${phase.status}\\n`;
      report += `- **Progress:** ${phase.progress || 0}%\\n`;
      report += `- **Description:** ${phase.description}\\n`;
      if (phase.startedAt) {
        report += `- **Started:** ${new Date(phase.startedAt).toLocaleString()}\\n`;
      }
      if (phase.completedAt) {
        report += `- **Completed:** ${new Date(phase.completedAt).toLocaleString()}\\n`;
      }
      if (phase.estimatedDuration) {
        report += `- **Estimated Duration:** ${phase.estimatedDuration}\\n`;
      }
      
      // Phase milestones
      const phaseMilestones = milestones.filter(m => m.phaseId === index);
      if (phaseMilestones.length > 0) {
        report += `- **Milestones:**\\n`;
        phaseMilestones.forEach(milestone => {
          report += `  - ${milestone.name} (${milestone.status})\\n`;
        });
      }
      report += '\\n';
    });
    
    // Recent activity
    if (logs.length > 0) {
      report += `## Recent Activity\\n`;
      logs.slice(-10).forEach(log => {
        const date = new Date(log.timestamp).toLocaleString();
        report += `- **${date}:** ${log.type || 'progress'} - ${log.description || 'Progress updated'}\\n`;
      });
    }
    
    return report;
  },
  
  async generatePerformanceReport(workflowState, workflowDir, timeRange) {
    const logs = await this.loadProgressLogs(workflowDir, timeRange);
    const metrics = await this.loadMetrics(workflowDir);
    
    let report = `# Performance Report\\n\\n`;
    report += `**Project:** ${workflowState.projectName}\\n`;
    report += `**Time Range:** ${timeRange}\\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\\n\\n`;
    
    // Timeline metrics
    const startDate = new Date(workflowState.createdAt);
    const currentDate = new Date();
    const elapsedDays = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    
    report += `## Timeline Metrics\\n`;
    report += `- **Elapsed Time:** ${elapsedDays} days\\n`;
    report += `- **Average Progress per Day:** ${(workflowState.progress.overall / elapsedDays).toFixed(2)}%\\n`;
    
    // Phase performance
    report += `\\n## Phase Performance\\n`;
    let totalPhaseTime = 0;
    let completedPhases = 0;
    
    workflowState.phases.forEach((phase, index) => {
      if (phase.startedAt) {
        const startTime = new Date(phase.startedAt);
        const endTime = phase.completedAt ? new Date(phase.completedAt) : currentDate;
        const phaseDays = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
        
        report += `- **Phase ${index + 1} (${phase.name}):** ${phaseDays} days\\n`;
        
        if (phase.completedAt) {
          totalPhaseTime += phaseDays;
          completedPhases++;
        }
      }
    });
    
    if (completedPhases > 0) {
      report += `- **Average Phase Duration:** ${(totalPhaseTime / completedPhases).toFixed(1)} days\\n`;
    }
    
    // Velocity metrics
    const progressLogs = logs.filter(log => log.newProgress !== undefined);
    if (progressLogs.length > 1) {
      const recentProgress = progressLogs.slice(-5);
      const avgProgressIncrease = recentProgress.reduce((sum, log, index) => {
        if (index === 0) return 0;
        return sum + (log.newProgress - recentProgress[index - 1].newProgress);
      }, 0) / (recentProgress.length - 1);
      
      report += `\\n## Velocity Metrics\\n`;
      report += `- **Recent Average Progress Increase:** ${avgProgressIncrease.toFixed(2)}% per update\\n`;
    }
    
    return report;
  },
  
  async generateMilestonesReport(workflowState, workflowDir, timeRange) {
    const milestones = await this.loadMilestones(workflowDir);
    
    let report = `# Milestones Report\\n\\n`;
    report += `**Project:** ${workflowState.projectName}\\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\\n\\n`;
    
    // Milestone summary
    const completedMilestones = milestones.filter(m => m.status === 'completed');
    const pendingMilestones = milestones.filter(m => m.status === 'pending');
    const overdueMilestones = milestones.filter(m => {
      return m.status !== 'completed' && m.dueDate && new Date(m.dueDate) < new Date();
    });
    
    report += `## Milestone Summary\\n`;
    report += `- **Total Milestones:** ${milestones.length}\\n`;
    report += `- **Completed:** ${completedMilestones.length}\\n`;
    report += `- **Pending:** ${pendingMilestones.length}\\n`;
    report += `- **Overdue:** ${overdueMilestones.length}\\n\\n`;
    
    // Milestones by phase
    workflowState.phases.forEach((phase, phaseIndex) => {
      const phaseMilestones = milestones.filter(m => m.phaseId === phaseIndex);
      if (phaseMilestones.length > 0) {
        report += `## Phase ${phaseIndex + 1}: ${phase.name}\\n`;
        phaseMilestones.forEach(milestone => {
          const status = milestone.status === 'completed' ? '✅' : 
                       milestone.status === 'in-progress' ? '🔄' : 
                       milestone.status === 'overdue' ? '⚠️' : '⏸️';
          
          report += `- ${status} **${milestone.name}**\\n`;
          if (milestone.description) {
            report += `  - ${milestone.description}\\n`;
          }
          if (milestone.dueDate) {
            report += `  - Due: ${new Date(milestone.dueDate).toLocaleDateString()}\\n`;
          }
          report += `  - Status: ${milestone.status}\\n`;
        });
        report += '\\n';
      }
    });
    
    return report;
  },
  
  async updateMetrics(workflowState, workflowDir, taskData) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    if (!taskData || !taskData.taskId) {
      throw new Error('Task data with taskId is required for metrics update');
    }
    
    // Load existing metrics
    const metricsFile = path.join(workflowDir, 'metrics.json');
    let metrics = {
      tasks: [],
      performance: {},
      quality: {},
      productivity: {},
      lastUpdated: new Date().toISOString()
    };
    
    try {
      const metricsContent = await fs.readFile(metricsFile, 'utf-8');
      metrics = JSON.parse(metricsContent);
    } catch (error) {
      // File doesn't exist yet, use default structure
    }
    
    // Update task metrics
    const existingTaskIndex = metrics.tasks.findIndex(t => t.taskId === taskData.taskId);
    if (existingTaskIndex >= 0) {
      metrics.tasks[existingTaskIndex] = { ...metrics.tasks[existingTaskIndex], ...taskData, updatedAt: new Date().toISOString() };
    } else {
      metrics.tasks.push({ ...taskData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    // Update performance metrics
    const completedTasks = metrics.tasks.filter(t => t.status === 'completed');
    const blockedTasks = metrics.tasks.filter(t => t.status === 'blocked');
    
    metrics.performance = {
      totalTasks: metrics.tasks.length,
      completedTasks: completedTasks.length,
      blockedTasks: blockedTasks.length,
      completionRate: metrics.tasks.length > 0 ? (completedTasks.length / metrics.tasks.length * 100).toFixed(2) : 0,
      blockageRate: metrics.tasks.length > 0 ? (blockedTasks.length / metrics.tasks.length * 100).toFixed(2) : 0
    };
    
    metrics.lastUpdated = new Date().toISOString();
    
    // Save updated metrics
    await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
    
    return {
      content: [{
        type: 'text',
        text: `Successfully updated metrics for task ${taskData.taskId}\\n\\nPerformance Summary:\\n- Total Tasks: ${metrics.performance.totalTasks}\\n- Completed: ${metrics.performance.completedTasks}\\n- Completion Rate: ${metrics.performance.completionRate}%`
      }],
      metadata: {
        taskId: taskData.taskId,
        taskStatus: taskData.status,
        totalTasks: metrics.performance.totalTasks,
        completedTasks: metrics.performance.completedTasks,
        completionRate: metrics.performance.completionRate,
        workflowId: workflowState.id
      }
    };
  },
  
  async loadMilestones(workflowDir) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const milestonesFile = path.join(workflowDir, 'milestones.json');
      const milestonesContent = await fs.readFile(milestonesFile, 'utf-8');
      return JSON.parse(milestonesContent);
    } catch (error) {
      return [];
    }
  },
  
  async loadProgressLogs(workflowDir, timeRange) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const logsFile = path.join(workflowDir, 'logs', 'progress.log');
      const logsContent = await fs.readFile(logsFile, 'utf-8');
      const logs = logsContent.split('\\n').filter(line => line.trim()).map(line => JSON.parse(line));
      
      // Filter by time range if specified
      if (timeRange !== 'all') {
        const now = new Date();
        let cutoffDate;
        
        switch (timeRange) {
          case 'daily':
            cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            return logs;
        }
        
        return logs.filter(log => new Date(log.timestamp) >= cutoffDate);
      }
      
      return logs;
    } catch (error) {
      return [];
    }
  },
  
  async loadMetrics(workflowDir) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const metricsFile = path.join(workflowDir, 'metrics.json');
      const metricsContent = await fs.readFile(metricsFile, 'utf-8');
      return JSON.parse(metricsContent);
    } catch (error) {
      return {};
    }
  },
  
  async logProgressUpdate(workflowDir, logData) {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const logsDir = path.join(workflowDir, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const logFile = path.join(logsDir, 'progress.log');
    const logEntry = JSON.stringify(logData) + '\\n';
    
    await fs.appendFile(logFile, logEntry);
  },
  
  async getPhaseMilestones(workflowDir, phaseId) {
    const milestones = await this.loadMilestones(workflowDir);
    return milestones.filter(m => m.phaseId === phaseId);
  },
  
  async getPhaseTasks(workflowDir, phaseId) {
    const metrics = await this.loadMetrics(workflowDir);
    return metrics.tasks ? metrics.tasks.filter(t => t.phaseId === phaseId) : [];
  }
};