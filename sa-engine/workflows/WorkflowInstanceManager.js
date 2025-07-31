/**
 * Workflow Instance Manager
 * Advanced management system for workflow instances with persistence, monitoring, and recovery
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { WorkflowInstance } from './WorkflowEngine.js';

export class WorkflowInstanceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.instances = new Map();
    this.persistenceEnabled = options.persistence !== false;
    this.storageDir = options.storageDir || path.join(process.cwd(), '.sa-workflows');
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds
    this.maxInstances = options.maxInstances || 100;
    this.monitoringTimer = null;
    this.recoveryEnabled = options.recovery !== false;
  }

  /**
   * Initialize the instance manager
   */
  async initialize() {
    try {
      if (this.persistenceEnabled) {
        await this.setupPersistence();
        if (this.recoveryEnabled) {
          await this.recoverInstances();
        }
      }

      this.startMonitoring();
      
      this.emit('manager:initialized', {
        persistenceEnabled: this.persistenceEnabled,
        storageDir: this.storageDir,
        recoveredInstances: this.instances.size
      });

      return {
        success: true,
        message: 'Workflow instance manager initialized',
        instanceCount: this.instances.size
      };
    } catch (error) {
      this.emit('manager:error', error);
      throw new Error(`Failed to initialize instance manager: ${error.message}`);
    }
  }

  /**
   * Setup persistence directory structure
   */
  async setupPersistence() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await fs.mkdir(path.join(this.storageDir, 'active'), { recursive: true });
      await fs.mkdir(path.join(this.storageDir, 'completed'), { recursive: true });
      await fs.mkdir(path.join(this.storageDir, 'failed'), { recursive: true });
      await fs.mkdir(path.join(this.storageDir, 'archived'), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to setup persistence: ${error.message}`);
    }
  }

  /**
   * Recover instances from persistent storage
   */
  async recoverInstances() {
    const activeDir = path.join(this.storageDir, 'active');
    
    try {
      const instanceDirs = await fs.readdir(activeDir);
      
      for (const instanceDir of instanceDirs) {
        try {
          const instancePath = path.join(activeDir, instanceDir);
          const stateFile = path.join(instancePath, 'state.json');
          
          const stateData = await fs.readFile(stateFile, 'utf-8');
          const state = JSON.parse(stateData);
          
          // Recreate instance from state
          const instance = await this.recreateInstance(state);
          if (instance) {
            this.instances.set(instance.instanceId, instance);
            this.setupInstanceEventHandlers(instance);
            
            this.emit('instance:recovered', {
              instanceId: instance.instanceId,
              templateId: state.template.id,
              status: state.status
            });
          }
        } catch (error) {
          console.warn(`Failed to recover instance ${instanceDir}: ${error.message}`);
        }
      }
    } catch (error) {
      console.warn(`Could not access recovery directory: ${error.message}`);
    }
  }

  /**
   * Recreate instance from saved state
   */
  async recreateInstance(state) {
    try {
      const instance = new WorkflowInstance(state.instanceId, state.template, state.options);
      
      // Restore instance state
      instance.status = state.status;
      instance.currentPhaseIndex = state.currentPhaseIndex;
      instance.phases = state.phases;
      instance.artifacts = state.artifacts;
      instance.progress = state.progress;
      instance.metrics = state.metrics;
      instance.validationResults = state.validationResults || [];
      instance.startedAt = state.startedAt;
      instance.completedAt = state.completedAt;
      
      return instance;
    } catch (error) {
      throw new Error(`Failed to recreate instance: ${error.message}`);
    }
  }

  /**
   * Register a new workflow instance
   */
  async registerInstance(instance) {
    if (this.instances.size >= this.maxInstances) {
      throw new Error(`Maximum instances limit reached: ${this.maxInstances}`);
    }

    this.instances.set(instance.instanceId, instance);
    this.setupInstanceEventHandlers(instance);

    if (this.persistenceEnabled) {
      await this.persistInstance(instance);
    }

    this.emit('instance:registered', {
      instanceId: instance.instanceId,
      templateId: instance.template.id,
      totalInstances: this.instances.size
    });

    return {
      success: true,
      instanceId: instance.instanceId,
      message: 'Instance registered successfully'
    };
  }

  /**
   * Setup event handlers for instance
   */
  setupInstanceEventHandlers(instance) {
    instance.on('workflow:started', (data) => {
      this.emit('instance:started', data);
      if (this.persistenceEnabled) {
        this.persistInstance(instance);
      }
    });

    instance.on('phase:started', (data) => {
      this.emit('instance:phase:started', data);
      if (this.persistenceEnabled) {
        this.persistInstance(instance);
      }
    });

    instance.on('phase:completed', (data) => {
      this.emit('instance:phase:completed', data);
      if (this.persistenceEnabled) {
        this.persistInstance(instance);
      }
    });

    instance.on('phase:failed', (data) => {
      this.emit('instance:phase:failed', data);
      if (this.persistenceEnabled) {
        this.persistInstance(instance);
      }
    });

    instance.on('workflow:completed', async (data) => {
      this.emit('instance:completed', data);
      if (this.persistenceEnabled) {
        await this.moveInstanceToCompleted(instance);
      }
    });

    instance.on('workflow:failed', async (data) => {
      this.emit('instance:failed', data);
      if (this.persistenceEnabled) {
        await this.moveInstanceToFailed(instance);
      }
    });

    instance.on('workflow:paused', (data) => {
      this.emit('instance:paused', data);
      if (this.persistenceEnabled) {
        this.persistInstance(instance);
      }
    });

    instance.on('workflow:resumed', (data) => {
      this.emit('instance:resumed', data);
      if (this.persistenceEnabled) {
        this.persistInstance(instance);
      }
    });
  }

  /**
   * Persist instance state to storage
   */
  async persistInstance(instance) {
    if (!this.persistenceEnabled) return;

    try {
      const instanceDir = path.join(this.storageDir, 'active', instance.instanceId);
      await fs.mkdir(instanceDir, { recursive: true });

      const state = {
        instanceId: instance.instanceId,
        template: instance.template,
        options: instance.options,
        status: instance.status,
        currentPhaseIndex: instance.currentPhaseIndex,
        phases: instance.phases,
        artifacts: instance.artifacts,
        progress: instance.progress,
        metrics: instance.metrics,
        validationResults: instance.validationResults || [],
        startedAt: instance.startedAt,
        completedAt: instance.completedAt,
        persistedAt: new Date().toISOString()
      };

      await fs.writeFile(
        path.join(instanceDir, 'state.json'),
        JSON.stringify(state, null, 2)
      );

      // Also save a backup
      await fs.writeFile(
        path.join(instanceDir, `state-backup-${Date.now()}.json`),
        JSON.stringify(state, null, 2)
      );

    } catch (error) {
      console.error(`Failed to persist instance ${instance.instanceId}: ${error.message}`);
    }
  }

  /**
   * Move instance to completed storage
   */
  async moveInstanceToCompleted(instance) {
    try {
      const activeDir = path.join(this.storageDir, 'active', instance.instanceId);
      const completedDir = path.join(this.storageDir, 'completed', instance.instanceId);
      
      await fs.mkdir(path.dirname(completedDir), { recursive: true });
      await fs.rename(activeDir, completedDir);
    } catch (error) {
      console.error(`Failed to move completed instance: ${error.message}`);
    }
  }

  /**
   * Move instance to failed storage
   */
  async moveInstanceToFailed(instance) {
    try {
      const activeDir = path.join(this.storageDir, 'active', instance.instanceId);
      const failedDir = path.join(this.storageDir, 'failed', instance.instanceId);
      
      await fs.mkdir(path.dirname(failedDir), { recursive: true });
      await fs.rename(activeDir, failedDir);
    } catch (error) {
      console.error(`Failed to move failed instance: ${error.message}`);
    }
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId) {
    return this.instances.get(instanceId);
  }

  /**
   * Get all instances
   */
  getAllInstances() {
    return Array.from(this.instances.values());
  }

  /**
   * Get instances by status
   */
  getInstancesByStatus(status) {
    return Array.from(this.instances.values()).filter(instance => instance.status === status);
  }

  /**
   * Get instances by template
   */
  getInstancesByTemplate(templateId) {
    return Array.from(this.instances.values()).filter(instance => instance.template.id === templateId);
  }

  /**
   * Get instance statistics
   */
  getStatistics() {
    const instances = Array.from(this.instances.values());
    const stats = {
      total: instances.length,
      byStatus: {},
      byTemplate: {},
      avgProgress: 0,
      oldestInstance: null,
      newestInstance: null
    };

    let totalProgress = 0;
    let oldestTime = null;
    let newestTime = null;

    for (const instance of instances) {
      // Status stats
      stats.byStatus[instance.status] = (stats.byStatus[instance.status] || 0) + 1;
      
      // Template stats
      const templateId = instance.template.id;
      stats.byTemplate[templateId] = (stats.byTemplate[templateId] || 0) + 1;
      
      // Progress calculation
      totalProgress += instance.progress.overall;
      
      // Time tracking
      const instanceTime = new Date(instance.startedAt || instance.createdAt);
      if (!oldestTime || instanceTime < oldestTime) {
        oldestTime = instanceTime;
        stats.oldestInstance = instance.instanceId;
      }
      if (!newestTime || instanceTime > newestTime) {
        newestTime = instanceTime;
        stats.newestInstance = instance.instanceId;
      }
    }

    if (instances.length > 0) {
      stats.avgProgress = Math.round(totalProgress / instances.length);
    }

    return stats;
  }

  /**
   * Pause instance
   */
  async pauseInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    await instance.pause();
    return {
      success: true,
      instanceId,
      status: instance.status
    };
  }

  /**
   * Resume instance
   */
  async resumeInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    await instance.resume();
    return {
      success: true,
      instanceId,
      status: instance.status
    };
  }

  /**
   * Cancel instance
   */
  async cancelInstance(instanceId, reason = '') {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    instance.status = 'cancelled';
    instance.completedAt = new Date().toISOString();
    instance.cancelReason = reason;

    if (this.persistenceEnabled) {
      await this.persistInstance(instance);
    }

    this.emit('instance:cancelled', {
      instanceId,
      reason,
      templateId: instance.template.id
    });

    return {
      success: true,
      instanceId,
      status: instance.status,
      reason
    };
  }

  /**
   * Remove instance
   */
  async removeInstance(instanceId, archive = true) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    if (archive && this.persistenceEnabled) {
      await this.archiveInstance(instance);
    }

    this.instances.delete(instanceId);
    
    this.emit('instance:removed', {
      instanceId,
      archived: archive,
      templateId: instance.template.id
    });

    return {
      success: true,
      instanceId,
      archived: archive
    };
  }

  /**
   * Archive instance
   */
  async archiveInstance(instance) {
    try {
      const activeDir = path.join(this.storageDir, 'active', instance.instanceId);
      const archivedDir = path.join(this.storageDir, 'archived', instance.instanceId);
      
      await fs.mkdir(path.dirname(archivedDir), { recursive: true });
      
      // Try to move first, fallback to copy if move fails
      try {
        await fs.rename(activeDir, archivedDir);
      } catch (error) {
        // If rename fails, copy the directory
        await this.copyDirectory(activeDir, archivedDir);
        await fs.rmdir(activeDir, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to archive instance: ${error.message}`);
    }
  }

  /**
   * Copy directory recursively
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Start monitoring instances
   */
  startMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(async () => {
      try {
        await this.monitorInstances();
      } catch (error) {
        this.emit('monitoring:error', error);
      }
    }, this.monitoringInterval);
  }

  /**
   * Monitor instances for issues
   */
  async monitorInstances() {
    const instances = Array.from(this.instances.values());
    const now = new Date();

    for (const instance of instances) {
      try {
        // Check for stalled instances
        if (instance.status === 'running' && instance.phases[instance.currentPhaseIndex]) {
          const currentPhase = instance.phases[instance.currentPhaseIndex];
          if (currentPhase.startedAt) {
            const phaseStartTime = new Date(currentPhase.startedAt);
            const phaseDuration = now - phaseStartTime;
            
            // If phase has been running for more than 2 hours, flag as potentially stalled
            if (phaseDuration > 2 * 60 * 60 * 1000) {
              this.emit('instance:stalled', {
                instanceId: instance.instanceId,
                phaseIndex: instance.currentPhaseIndex,
                phaseName: currentPhase.name,
                duration: phaseDuration
              });
            }
          }
        }

        // Persist instance state
        if (this.persistenceEnabled) {
          await this.persistInstance(instance);
        }

      } catch (error) {
        this.emit('instance:monitoring:error', {
          instanceId: instance.instanceId,
          error: error.message
        });
      }
    }

    // Cleanup old backups
    await this.cleanupOldBackups();
  }

  /**
   * Cleanup old backup files
   */
  async cleanupOldBackups() {
    if (!this.persistenceEnabled) return;

    const maxBackups = 5;
    const instances = Array.from(this.instances.values());

    for (const instance of instances) {
      try {
        const instanceDir = path.join(this.storageDir, 'active', instance.instanceId);
        const files = await fs.readdir(instanceDir);
        
        const backupFiles = files
          .filter(file => file.startsWith('state-backup-'))
          .map(file => ({
            name: file,
            path: path.join(instanceDir, file),
            timestamp: parseInt(file.match(/state-backup-(\d+)\.json/)?.[1] || '0')
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        // Remove old backups
        for (let i = maxBackups; i < backupFiles.length; i++) {
          await fs.unlink(backupFiles[i].path);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Shutdown the instance manager
   */
  async shutdown() {
    this.stopMonitoring();

    // Persist all active instances
    if (this.persistenceEnabled) {
      const instances = Array.from(this.instances.values());
      for (const instance of instances) {
        try {
          await this.persistInstance(instance);
        } catch (error) {
          console.error(`Failed to persist instance during shutdown: ${error.message}`);
        }
      }
    }

    this.instances.clear();
    this.emit('manager:shutdown');

    return {
      success: true,
      message: 'Instance manager shutdown complete'
    };
  }
}

export default WorkflowInstanceManager;