/**
 * Advanced Workflow Engine for Super Agents Framework
 * Supports BMAD workflows, phase-based execution, and validation gates
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.activeInstances = new Map();
    this.templateCache = new Map();
    this.validationGates = new Map();
    this.executionQueue = [];
    this.isProcessing = false;
  }

  /**
   * Initialize the workflow engine
   */
  async initialize() {
    try {
      await this.loadWorkflowTemplates();
      await this.setupValidationGates();
      await this.initializeExecutionQueue();
      
      this.emit('engine:initialized');
      return { success: true, message: 'Workflow engine initialized successfully' };
    } catch (error) {
      this.emit('engine:error', error);
      throw new Error(`Failed to initialize workflow engine: ${error.message}`);
    }
  }

  /**
   * Load workflow templates from BMAD definitions and enhanced formats
   */
  async loadWorkflowTemplates() {
    const workflowDirs = [
      path.join(process.cwd(), 'sa-engine', 'workflows'),
      path.join(process.cwd(), 'src_codebase', 'BMAD-METHOD-main', 'bmad-core', 'workflows')
    ];

    for (const dir of workflowDirs) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(dir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const workflow = yaml.parse(content);
            
            if (workflow && workflow.workflow) {
              const workflowId = workflow.workflow.id || path.basename(file, path.extname(file));
              this.workflows.set(workflowId, {
                ...workflow.workflow,
                id: workflowId,
                source: filePath,
                loadedAt: new Date().toISOString()
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not load workflows from ${dir}: ${error.message}`);
      }
    }

    console.log(`Loaded ${this.workflows.size} workflow templates`);
  }

  /**
   * Setup validation gates for phase transitions
   */
  async setupValidationGates() {
    const defaultGates = {
      'requirements_complete': {
        validator: this.validateRequirementsPhase.bind(this),
        description: 'Validates that all requirements are properly documented and approved'
      },
      'architecture_approved': {
        validator: this.validateArchitecturePhase.bind(this),
        description: 'Validates architecture documentation and design decisions'
      },
      'implementation_ready': {
        validator: this.validateImplementationReadiness.bind(this),
        description: 'Validates that implementation can begin'
      },
      'testing_complete': {
        validator: this.validateTestingPhase.bind(this),
        description: 'Validates that testing requirements are met'
      },
      'deployment_ready': {
        validator: this.validateDeploymentReadiness.bind(this),
        description: 'Validates deployment readiness'
      }
    };

    for (const [gateName, gate] of Object.entries(defaultGates)) {
      this.validationGates.set(gateName, gate);
    }
  }

  /**
   * Initialize execution queue processing
   */
  async initializeExecutionQueue() {
    this.startQueueProcessor();
  }

  /**
   * Create a new workflow instance
   */
  async createWorkflowInstance(workflowId, options = {}) {
    try {
      const template = this.workflows.get(workflowId);
      if (!template) {
        throw new Error(`Workflow template not found: ${workflowId}`);
      }

      const instanceId = uuidv4();
      const instance = new WorkflowInstance(instanceId, template, options);
      await instance.initialize();

      this.activeInstances.set(instanceId, instance);
      
      // Set up instance event handlers
      instance.on('phase:started', (data) => this.emit('instance:phase:started', { instanceId, ...data }));
      instance.on('phase:completed', (data) => this.emit('instance:phase:completed', { instanceId, ...data }));
      instance.on('phase:failed', (data) => this.emit('instance:phase:failed', { instanceId, ...data }));
      instance.on('workflow:completed', (data) => this.emit('instance:completed', { instanceId, ...data }));
      instance.on('workflow:failed', (data) => this.emit('instance:failed', { instanceId, ...data }));

      this.emit('instance:created', { instanceId, workflowId, options });
      
      return {
        success: true,
        instanceId,
        instance,
        message: `Workflow instance created: ${instanceId}`
      };
    } catch (error) {
      this.emit('engine:error', error);
      throw error;
    }
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(instanceId, startOptions = {}) {
    try {
      const instance = this.activeInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      await instance.start(startOptions);
      this.addToExecutionQueue(instanceId, 'start');

      return {
        success: true,
        instanceId,
        status: instance.getStatus(),
        message: 'Workflow started successfully'
      };
    } catch (error) {
      this.emit('engine:error', error);
      throw error;
    }
  }

  /**
   * Execute next phase in workflow
   */
  async executeNextPhase(instanceId, phaseOptions = {}) {
    try {
      const instance = this.activeInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${instanceId}`);
      }

      const currentPhase = instance.getCurrentPhase();
      if (!currentPhase) {
        throw new Error('No current phase to execute');
      }

      // Run validation gates before phase execution
      const gateResult = await this.runValidationGates(instance, currentPhase);
      if (!gateResult.passed) {
        throw new Error(`Validation gate failed: ${gateResult.errors.join(', ')}`);
      }

      const result = await instance.executeCurrentPhase(phaseOptions);
      this.addToExecutionQueue(instanceId, 'next_phase');

      return result;
    } catch (error) {
      this.emit('engine:error', error);
      throw error;
    }
  }

  /**
   * Run validation gates for phase transitions
   */
  async runValidationGates(instance, phase) {
    const result = {
      passed: true,
      errors: [],
      warnings: []
    };

    if (!phase.validationGates || phase.validationGates.length === 0) {
      return result;
    }

    for (const gateName of phase.validationGates) {
      const gate = this.validationGates.get(gateName);
      if (!gate) {
        result.warnings.push(`Unknown validation gate: ${gateName}`);
        continue;
      }

      try {
        const gateResult = await gate.validator(instance, phase);
        if (!gateResult.passed) {
          result.passed = false;
          result.errors.push(...gateResult.errors);
        }
        if (gateResult.warnings) {
          result.warnings.push(...gateResult.warnings);
        }
      } catch (error) {
        result.passed = false;
        result.errors.push(`Validation gate error (${gateName}): ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Add task to execution queue
   */
  addToExecutionQueue(instanceId, operation, options = {}) {
    this.executionQueue.push({
      instanceId,
      operation,
      options,
      timestamp: new Date().toISOString(),
      id: uuidv4()
    });

    if (!this.isProcessing) {
      this.processExecutionQueue();
    }
  }

  /**
   * Process execution queue
   */
  async processExecutionQueue() {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const task = this.executionQueue.shift();
      
      try {
        await this.processQueueTask(task);
      } catch (error) {
        this.emit('queue:error', { task, error });
        console.error(`Queue task failed:`, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process individual queue task
   */
  async processQueueTask(task) {
    const instance = this.activeInstances.get(task.instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${task.instanceId}`);
    }

    switch (task.operation) {
      case 'start':
        // Already handled in startWorkflow
        break;
      case 'next_phase':
        // Handle phase progression logic
        await this.handlePhaseProgression(instance);
        break;
      case 'validate':
        await this.handleValidation(instance, task.options);
        break;
      default:
        console.warn(`Unknown queue operation: ${task.operation}`);
    }
  }

  /**
   * Handle phase progression
   */
  async handlePhaseProgression(instance) {
    const status = instance.getStatus();
    
    if (status.currentPhaseIndex < status.totalPhases - 1) {
      await instance.moveToNextPhase();
    } else {
      await instance.complete();
    }
  }

  /**
   * Handle validation requests
   */
  async handleValidation(instance, options) {
    const currentPhase = instance.getCurrentPhase();
    if (currentPhase) {
      const result = await this.runValidationGates(instance, currentPhase);
      instance.setValidationResult(result);
    }
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.processExecutionQueue();
      }
    }, 1000); // Check every second
  }

  /**
   * Get workflow instance
   */
  getWorkflowInstance(instanceId) {
    return this.activeInstances.get(instanceId);
  }

  /**
   * Get all active instances
   */
  getActiveInstances() {
    return Array.from(this.activeInstances.values());
  }

  /**
   * Get workflow template
   */
  getWorkflowTemplate(workflowId) {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all available workflows
   */
  getAvailableWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Validation gate implementations
   */

  async validateRequirementsPhase(instance, phase) {
    const result = { passed: true, errors: [], warnings: [] };
    
    // Check for required artifacts
    const requiredArtifacts = ['requirements.md', 'project-brief.md'];
    const artifacts = instance.getArtifacts();
    
    for (const required of requiredArtifacts) {
      if (!artifacts.some(artifact => artifact.name.includes(required))) {
        result.passed = false;
        result.errors.push(`Missing required artifact: ${required}`);
      }
    }

    return result;
  }

  async validateArchitecturePhase(instance, phase) {
    const result = { passed: true, errors: [], warnings: [] };
    
    // Check for architecture documentation
    const artifacts = instance.getArtifacts();
    const hasArchDoc = artifacts.some(artifact => 
      artifact.name.includes('architecture') || artifact.type === 'architecture'
    );
    
    if (!hasArchDoc) {
      result.passed = false;
      result.errors.push('Missing architecture documentation');
    }

    return result;
  }

  async validateImplementationReadiness(instance, phase) {
    const result = { passed: true, errors: [], warnings: [] };
    
    // Check if previous phases are complete
    const status = instance.getStatus();
    const previousPhases = status.phases.slice(0, status.currentPhaseIndex);
    
    for (const prevPhase of previousPhases) {
      if (prevPhase.status !== 'completed') {
        result.passed = false;
        result.errors.push(`Previous phase not completed: ${prevPhase.name}`);
      }
    }

    return result;
  }

  async validateTestingPhase(instance, phase) {
    const result = { passed: true, errors: [], warnings: [] };
    
    // Check for test artifacts
    const artifacts = instance.getArtifacts();
    const hasTests = artifacts.some(artifact => 
      artifact.name.includes('test') || artifact.type === 'test'
    );
    
    if (!hasTests) {
      result.warnings.push('No test artifacts found');
    }

    return result;
  }

  async validateDeploymentReadiness(instance, phase) {
    const result = { passed: true, errors: [], warnings: [] };
    
    // Check deployment prerequisites
    const status = instance.getStatus();
    if (status.progress.overall < 95) {
      result.passed = false;
      result.errors.push('Workflow not sufficiently complete for deployment');
    }

    return result;
  }

  /**
   * Cleanup completed instances
   */
  async cleanup() {
    const completedInstances = [];
    
    for (const [instanceId, instance] of this.activeInstances) {
      const status = instance.getStatus();
      if (status.status === 'completed' || status.status === 'failed') {
        completedInstances.push(instanceId);
      }
    }

    for (const instanceId of completedInstances) {
      const instance = this.activeInstances.get(instanceId);
      if (instance) {
        await instance.archive();
        this.activeInstances.delete(instanceId);
      }
    }

    return {
      cleaned: completedInstances.length,
      remaining: this.activeInstances.size
    };
  }

  /**
   * Shutdown the workflow engine
   */
  async shutdown() {
    // Stop processing queue
    this.isProcessing = false;
    this.executionQueue = [];

    // Archive all active instances
    for (const [instanceId, instance] of this.activeInstances) {
      try {
        await instance.pause();
        await instance.archive();
      } catch (error) {
        console.error(`Error archiving instance ${instanceId}:`, error);
      }
    }

    this.activeInstances.clear();
    this.emit('engine:shutdown');
  }
}

/**
 * Workflow Instance class for managing individual workflow executions
 */
export class WorkflowInstance extends EventEmitter {
  constructor(instanceId, template, options = {}) {
    super();
    this.instanceId = instanceId;
    this.template = template;
    this.options = options;
    this.status = 'initializing';
    this.currentPhaseIndex = 0;
    this.phases = [];
    this.artifacts = [];
    this.startedAt = null;
    this.completedAt = null;
    this.progress = {
      overall: 0,
      currentPhase: 0,
      completedPhases: 0,
      totalPhases: 0
    };
    this.metrics = {
      phaseTimings: [],
      blockers: [],
      quality_gates: []
    };
    this.validationResults = [];
  }

  async initialize() {
    this.phases = this.template.sequence?.map((step, index) => ({
      id: `phase_${index}`,
      name: step.step || step.agent || `Phase ${index + 1}`,
      description: step.notes || step.action || '',
      status: 'pending',
      agent: step.agent,
      action: step.action,
      uses: step.uses,
      creates: step.creates,
      requires: step.requires,
      condition: step.condition,
      validationGates: step.validationGates || [],
      startedAt: null,
      completedAt: null,
      duration: null,
      artifacts: [],
      notes: step.notes
    })) || [];

    this.progress.totalPhases = this.phases.length;
    this.status = 'initialized';

    await this.createWorkspaceStructure();
  }

  async createWorkspaceStructure() {
    if (!this.options.projectRoot) {
      return;
    }

    const workflowDir = path.join(this.options.projectRoot, '.sa-workflow', this.instanceId);
    
    try {
      await fs.mkdir(workflowDir, { recursive: true });
      await fs.mkdir(path.join(workflowDir, 'phases'), { recursive: true });
      await fs.mkdir(path.join(workflowDir, 'artifacts'), { recursive: true });
      await fs.mkdir(path.join(workflowDir, 'logs'), { recursive: true });

      this.workflowDir = workflowDir;
    } catch (error) {
      console.warn(`Could not create workflow directory: ${error.message}`);
    }
  }

  async start(startOptions = {}) {
    this.status = 'running';
    this.startedAt = new Date().toISOString();
    
    if (this.phases.length > 0) {
      this.phases[0].status = 'active';
      this.phases[0].startedAt = this.startedAt;
    }

    await this.saveState();
    this.emit('workflow:started', { instanceId: this.instanceId, template: this.template.id });
  }

  async executeCurrentPhase(phaseOptions = {}) {
    if (this.currentPhaseIndex >= this.phases.length) {
      throw new Error('No current phase to execute');
    }

    const currentPhase = this.phases[this.currentPhaseIndex];
    currentPhase.status = 'executing';
    
    this.emit('phase:started', { 
      instanceId: this.instanceId, 
      phase: currentPhase,
      phaseIndex: this.currentPhaseIndex 
    });

    try {
      // Execute phase logic based on agent and action
      const result = await this.executePhaseLogic(currentPhase, phaseOptions);
      
      currentPhase.status = 'completed';
      currentPhase.completedAt = new Date().toISOString();
      currentPhase.duration = new Date(currentPhase.completedAt) - new Date(currentPhase.startedAt);
      
      this.progress.completedPhases++;
      this.progress.overall = Math.round((this.progress.completedPhases / this.progress.totalPhases) * 100);

      await this.saveState();
      
      this.emit('phase:completed', { 
        instanceId: this.instanceId, 
        phase: currentPhase,
        phaseIndex: this.currentPhaseIndex,
        result 
      });

      return {
        success: true,
        phase: currentPhase,
        result,
        nextPhase: this.currentPhaseIndex < this.phases.length - 1 ? this.phases[this.currentPhaseIndex + 1] : null
      };

    } catch (error) {
      currentPhase.status = 'failed';
      currentPhase.error = error.message;
      
      await this.saveState();
      
      this.emit('phase:failed', { 
        instanceId: this.instanceId, 
        phase: currentPhase,
        phaseIndex: this.currentPhaseIndex,
        error 
      });

      throw error;
    }
  }

  async executePhaseLogic(phase, options) {
    // This is where the actual phase execution logic would be implemented
    // For now, return a basic result structure
    return {
      executed: true,
      phase: phase.name,
      agent: phase.agent,
      action: phase.action,
      artifacts: phase.creates ? [phase.creates] : [],
      timestamp: new Date().toISOString()
    };
  }

  async moveToNextPhase() {
    if (this.currentPhaseIndex < this.phases.length - 1) {
      this.currentPhaseIndex++;
      const nextPhase = this.phases[this.currentPhaseIndex];
      nextPhase.status = 'active';
      nextPhase.startedAt = new Date().toISOString();
      
      this.progress.currentPhase = this.currentPhaseIndex;
      await this.saveState();
      
      return nextPhase;
    }
    return null;
  }

  async complete() {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
    
    await this.saveState();
    this.emit('workflow:completed', { 
      instanceId: this.instanceId, 
      duration: new Date(this.completedAt) - new Date(this.startedAt),
      totalPhases: this.phases.length
    });
  }

  async pause() {
    this.status = 'paused';
    await this.saveState();
    this.emit('workflow:paused', { instanceId: this.instanceId });
  }

  async resume() {
    this.status = 'running';
    await this.saveState();
    this.emit('workflow:resumed', { instanceId: this.instanceId });
  }

  getCurrentPhase() {
    return this.phases[this.currentPhaseIndex] || null;
  }

  getStatus() {
    return {
      instanceId: this.instanceId,
      templateId: this.template.id,
      status: this.status,
      currentPhaseIndex: this.currentPhaseIndex,
      totalPhases: this.phases.length,
      progress: this.progress,
      phases: this.phases,
      artifacts: this.artifacts,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      metrics: this.metrics
    };
  }

  getArtifacts() {
    return this.artifacts;
  }

  addArtifact(artifact) {
    this.artifacts.push({
      ...artifact,
      createdAt: new Date().toISOString(),
      phaseIndex: this.currentPhaseIndex
    });
  }

  setValidationResult(result) {
    this.validationResults.push({
      ...result,
      phaseIndex: this.currentPhaseIndex,
      timestamp: new Date().toISOString()
    });
  }

  async saveState() {
    if (!this.workflowDir) {
      return;
    }

    const state = {
      instanceId: this.instanceId,
      template: this.template,
      options: this.options,
      status: this.status,
      currentPhaseIndex: this.currentPhaseIndex,
      phases: this.phases,
      artifacts: this.artifacts,
      progress: this.progress,
      metrics: this.metrics,
      validationResults: this.validationResults,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      updatedAt: new Date().toISOString()
    };

    try {
      await fs.writeFile(
        path.join(this.workflowDir, 'state.json'),
        JSON.stringify(state, null, 2)
      );
    } catch (error) {
      console.error(`Could not save workflow state: ${error.message}`);
    }
  }

  async archive() {
    if (!this.workflowDir) {
      return;
    }

    const archiveDir = path.join(path.dirname(this.workflowDir), 'archived', this.instanceId);
    
    try {
      await fs.mkdir(path.dirname(archiveDir), { recursive: true });
      await fs.rename(this.workflowDir, archiveDir);
    } catch (error) {
      console.error(`Could not archive workflow: ${error.message}`);
    }
  }
}

export default WorkflowEngine;