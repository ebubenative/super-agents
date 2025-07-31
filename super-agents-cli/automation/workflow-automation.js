#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import yaml from 'js-yaml';
import cron from 'node-cron';

/**
 * Super Agents CLI Workflow Automation
 * Automated workflow execution, scheduling, and scripting
 */

export class WorkflowAutomation {
  constructor() {
    this.automationPath = path.join(process.cwd(), '.super-agents', 'automation');
    this.scheduledTasks = new Map();
    this.runningAutomations = new Map();
  }

  /**
   * Initialize automation system
   */
  async initialize() {
    // Ensure automation directory exists
    await fs.mkdir(this.automationPath, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['scripts', 'workflows', 'schedules', 'logs'];
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(this.automationPath, subdir), { recursive: true });
    }

    // Load existing scheduled tasks
    await this.loadScheduledTasks();
    
    console.log(chalk.green('✓ Automation system initialized'));
  }

  /**
   * Create automation script
   */
  async createScript(name, config) {
    const scriptPath = path.join(this.automationPath, 'scripts', `${name}.yaml`);
    
    const scriptConfig = {
      name,
      description: config.description || 'Automated workflow script',
      version: '1.0.0',
      created: new Date().toISOString(),
      trigger: config.trigger || 'manual',
      steps: config.steps || [],
      environment: config.environment || {},
      notifications: config.notifications || {},
      ...config
    };

    await fs.writeFile(scriptPath, yaml.dump(scriptConfig), 'utf8');
    console.log(chalk.green(`✓ Created automation script: ${name}`));
    
    return scriptPath;
  }

  /**
   * Run automation script
   */
  async runScript(scriptName, options = {}) {
    const scriptPath = path.join(this.automationPath, 'scripts', `${scriptName}.yaml`);
    
    try {
      const scriptContent = await fs.readFile(scriptPath, 'utf8');
      const script = yaml.load(scriptContent);
      
      console.log(chalk.blue(`🚀 Running automation script: ${script.name}`));
      console.log(chalk.gray(`Description: ${script.description}`));
      
      const executionId = `${scriptName}-${Date.now()}`;
      const logPath = path.join(this.automationPath, 'logs', `${executionId}.log`);
      
      // Start execution tracking
      this.runningAutomations.set(executionId, {
        script,
        startTime: new Date(),
        logPath,
        status: 'running'
      });

      // Execute script steps
      const results = await this.executeScriptSteps(script, executionId, options);
      
      // Update execution status
      const execution = this.runningAutomations.get(executionId);
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.results = results;
      
      console.log(chalk.green(`✓ Automation script completed: ${script.name}`));
      
      // Send notifications if configured
      if (script.notifications) {
        await this.sendNotifications(script.notifications, execution);
      }
      
      return results;
      
    } catch (error) {
      console.log(chalk.red(`✗ Failed to run automation script: ${error.message}`));
      throw error;
    }
  }

  /**
   * Execute script steps sequentially
   */
  async executeScriptSteps(script, executionId, options) {
    const results = [];
    const logPath = path.join(this.automationPath, 'logs', `${executionId}.log`);
    
    for (let i = 0; i < script.steps.length; i++) {
      const step = script.steps[i];
      console.log(chalk.yellow(`⚡ Step ${i + 1}: ${step.name || step.type}`));
      
      try {
        const stepResult = await this.executeStep(step, script.environment, logPath);
        results.push({
          step: i + 1,
          name: step.name || step.type,
          status: 'success',
          result: stepResult,
          duration: stepResult.duration
        });
        
        console.log(chalk.green(`  ✓ Step completed successfully`));
        
      } catch (error) {
        console.log(chalk.red(`  ✗ Step failed: ${error.message}`));
        
        results.push({
          step: i + 1,
          name: step.name || step.type,
          status: 'failed',
          error: error.message,
          duration: 0
        });
        
        // Handle step failure
        if (step.continueOnError !== true) {
          throw new Error(`Script execution stopped at step ${i + 1}: ${step.name || step.type}`);
        }
      }
    }
    
    return results;
  }

  /**
   * Execute individual step
   */
  async executeStep(step, environment, logPath) {
    const startTime = Date.now();
    
    switch (step.type) {
      case 'command':
        return await this.executeCommand(step.command, environment, logPath);
      
      case 'sa-tool':
        return await this.executeSATool(step.tool, step.params, environment, logPath);
      
      case 'workflow':
        return await this.executeWorkflow(step.workflow, step.params, environment, logPath);
      
      case 'shell':
        return await this.executeShellScript(step.script, environment, logPath);
      
      case 'file-operation':
        return await this.executeFileOperation(step.operation, step.params, logPath);
      
      case 'wait':
        return await this.executeWait(step.duration);
      
      case 'notification':
        return await this.executeNotification(step.message, step.channel);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute command step
   */
  async executeCommand(command, environment, logPath) {
    return new Promise((resolve, reject) => {
      const process = spawn('sh', ['-c', command], {
        env: { ...process.env, ...environment },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
        this.appendToLog(logPath, `STDOUT: ${data.toString()}`);
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
        this.appendToLog(logPath, `STDERR: ${data.toString()}`);
      });
      
      process.on('close', (code) => {
        const duration = Date.now() - Date.now();
        
        if (code === 0) {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code,
            duration
          });
        } else {
          reject(new Error(`Command failed with exit code ${code}\nSTDERR: ${stderr}`));
        }
      });
    });
  }

  /**
   * Execute Super Agents tool
   */
  async executeSATool(toolName, params, environment, logPath) {
    const command = `sa ${toolName} ${this.formatParams(params)}`;
    return await this.executeCommand(command, environment, logPath);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowType, params, environment, logPath) {
    const command = `sa workflow start --type=${workflowType} ${this.formatParams(params)}`;
    return await this.executeCommand(command, environment, logPath);
  }

  /**
   * Execute shell script
   */
  async executeShellScript(script, environment, logPath) {
    const tempScriptPath = path.join(os.tmpdir(), `sa-automation-${Date.now()}.sh`);
    
    try {
      await fs.writeFile(tempScriptPath, script, 'utf8');
      await fs.chmod(tempScriptPath, '755');
      
      const result = await this.executeCommand(`bash ${tempScriptPath}`, environment, logPath);
      
      // Clean up temp script
      await fs.unlink(tempScriptPath);
      
      return result;
      
    } catch (error) {
      // Ensure cleanup even on error
      try {
        await fs.unlink(tempScriptPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Execute file operation
   */
  async executeFileOperation(operation, params, logPath) {
    const startTime = Date.now();
    
    try {
      switch (operation) {
        case 'copy':
          await fs.copyFile(params.source, params.destination);
          break;
        
        case 'move':
          await fs.rename(params.source, params.destination);
          break;
        
        case 'delete':
          await fs.unlink(params.path);
          break;
        
        case 'mkdir':
          await fs.mkdir(params.path, { recursive: true });
          break;
        
        case 'read':
          const content = await fs.readFile(params.path, 'utf8');
          return { content, size: content.length };
        
        case 'write':
          await fs.writeFile(params.path, params.content, 'utf8');
          break;
        
        default:
          throw new Error(`Unknown file operation: ${operation}`);
      }
      
      const duration = Date.now() - startTime;
      this.appendToLog(logPath, `File operation ${operation} completed in ${duration}ms`);
      
      return { operation, duration, status: 'success' };
      
    } catch (error) {
      this.appendToLog(logPath, `File operation ${operation} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute wait step
   */
  async executeWait(duration) {
    const milliseconds = this.parseDuration(duration);
    console.log(chalk.gray(`  ⏱️  Waiting for ${duration}...`));
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ waited: duration, milliseconds });
      }, milliseconds);
    });
  }

  /**
   * Execute notification step
   */
  async executeNotification(message, channel) {
    console.log(chalk.blue(`📢 Notification: ${message}`));
    
    // TODO: Implement actual notification channels (Slack, Discord, email, etc.)
    // For now, just log the notification
    
    return { message, channel, sent: true, timestamp: new Date().toISOString() };
  }

  /**
   * Schedule automation script
   */
  async scheduleScript(scriptName, cronExpression, options = {}) {
    const task = cron.schedule(cronExpression, async () => {
      console.log(chalk.blue(`🕒 Running scheduled script: ${scriptName}`));
      
      try {
        await this.runScript(scriptName, options);
        console.log(chalk.green(`✓ Scheduled script completed: ${scriptName}`));
      } catch (error) {
        console.log(chalk.red(`✗ Scheduled script failed: ${scriptName} - ${error.message}`));
      }
    }, {
      scheduled: false
    });

    this.scheduledTasks.set(scriptName, {
      task,
      cronExpression,
      options,
      created: new Date(),
      status: 'scheduled'
    });

    // Save schedule to disk
    await this.saveSchedule(scriptName, cronExpression, options);
    
    task.start();
    
    console.log(chalk.green(`✓ Scheduled script: ${scriptName} (${cronExpression})`));
    
    return task;
  }

  /**
   * Unschedule automation script
   */
  async unscheduleScript(scriptName) {
    const scheduledTask = this.scheduledTasks.get(scriptName);
    
    if (scheduledTask) {
      scheduledTask.task.stop();
      this.scheduledTasks.delete(scriptName);
      
      // Remove schedule file
      const schedulePath = path.join(this.automationPath, 'schedules', `${scriptName}.yaml`);
      try {
        await fs.unlink(schedulePath);
      } catch (error) {
        // Ignore if file doesn't exist
      }
      
      console.log(chalk.green(`✓ Unscheduled script: ${scriptName}`));
    } else {
      console.log(chalk.yellow(`⚠️  Script not found in schedule: ${scriptName}`));
    }
  }

  /**
   * List scheduled scripts
   */
  listScheduledScripts() {
    if (this.scheduledTasks.size === 0) {
      console.log(chalk.yellow('No scheduled scripts found.'));
      return;
    }

    console.log(chalk.blue('📅 Scheduled Scripts:'));
    console.log();

    for (const [scriptName, schedule] of this.scheduledTasks) {
      console.log(`${chalk.green('●')} ${chalk.bold(scriptName)}`);
      console.log(`  Schedule: ${schedule.cronExpression}`);
      console.log(`  Status: ${schedule.status}`);
      console.log(`  Created: ${schedule.created.toLocaleString()}`);
      console.log();
    }
  }

  /**
   * List running automations
   */
  listRunningAutomations() {
    if (this.runningAutomations.size === 0) {
      console.log(chalk.yellow('No running automations found.'));
      return;
    }

    console.log(chalk.blue('🏃 Running Automations:'));
    console.log();

    for (const [executionId, automation] of this.runningAutomations) {
      const duration = automation.endTime ? 
        automation.endTime - automation.startTime :
        new Date() - automation.startTime;

      console.log(`${chalk.green('●')} ${chalk.bold(automation.script.name)}`);
      console.log(`  Execution ID: ${executionId}`);
      console.log(`  Status: ${automation.status}`);
      console.log(`  Duration: ${this.formatDuration(duration)}`);
      console.log(`  Log: ${automation.logPath}`);
      console.log();
    }
  }

  /**
   * Create predefined automation scripts
   */
  async createPredefinedScripts() {
    // Daily health check automation
    await this.createScript('daily-health-check', {
      description: 'Daily system health check and status report',
      trigger: 'scheduled',
      steps: [
        {
          type: 'command',
          name: 'System Status Check',
          command: 'sa doctor --verbose'
        },
        {
          type: 'sa-tool',
          name: 'List Active Tasks',
          tool: 'task list --status=active'
        },
        {
          type: 'notification',
          name: 'Send Daily Report',
          message: 'Daily health check completed',
          channel: 'console'
        }
      ]
    });

    // Backup automation
    await this.createScript('backup-project-state', {
      description: 'Backup project state and configuration',
      trigger: 'manual',
      steps: [
        {
          type: 'command',
          name: 'Create Backup',
          command: 'sa backup'
        },
        {
          type: 'file-operation',
          name: 'Archive Logs',
          operation: 'copy',
          params: {
            source: '.super-agents/logs',
            destination: '.super-agents/backups/logs-backup'
          }
        }
      ]
    });

    // Code quality check automation
    await this.createScript('code-quality-check', {
      description: 'Automated code quality assessment',
      trigger: 'git-hook',
      steps: [
        {
          type: 'sa-tool',
          name: 'Review Code Quality',
          tool: 'sa-review-code',
          params: {
            path: '.'
          }
        },
        {
          type: 'sa-tool',
          name: 'Validate Implementation',
          tool: 'sa-validate-implementation'
        },
        {
          type: 'command',
          name: 'Run Tests',
          command: 'npm test'
        }
      ]
    });

    console.log(chalk.green('✓ Created predefined automation scripts'));
  }

  /**
   * Helper methods
   */
  
  formatParams(params) {
    if (!params) return '';
    
    return Object.entries(params)
      .map(([key, value]) => `--${key}="${value}"`)
      .join(' ');
  }

  parseDuration(duration) {
    if (typeof duration === 'number') return duration;
    
    const matches = duration.match(/^(\d+)([smh])$/);
    if (!matches) throw new Error(`Invalid duration format: ${duration}`);
    
    const [, amount, unit] = matches;
    const multipliers = { s: 1000, m: 60000, h: 3600000 };
    
    return parseInt(amount) * multipliers[unit];
  }

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

  async appendToLog(logPath, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async saveSchedule(scriptName, cronExpression, options) {
    const schedulePath = path.join(this.automationPath, 'schedules', `${scriptName}.yaml`);
    const scheduleConfig = {
      scriptName,
      cronExpression,
      options,
      created: new Date().toISOString()
    };
    
    await fs.writeFile(schedulePath, yaml.dump(scheduleConfig), 'utf8');
  }

  async loadScheduledTasks() {
    const schedulesDir = path.join(this.automationPath, 'schedules');
    
    try {
      const scheduleFiles = await fs.readdir(schedulesDir);
      
      for (const file of scheduleFiles) {
        if (file.endsWith('.yaml')) {
          const schedulePath = path.join(schedulesDir, file);
          const scheduleContent = await fs.readFile(schedulePath, 'utf8');
          const schedule = yaml.load(scheduleContent);
          
          await this.scheduleScript(schedule.scriptName, schedule.cronExpression, schedule.options);
        }
      }
    } catch (error) {
      // Schedules directory might not exist yet
    }
  }

  async sendNotifications(notifications, execution) {
    // TODO: Implement notification integrations
    console.log(chalk.blue('📢 Sending notifications...'));
  }
}

export default WorkflowAutomation;