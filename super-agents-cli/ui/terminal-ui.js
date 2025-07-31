#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import blessed from 'blessed';
import { table, getBorderCharacters } from 'table';
import boxen from 'boxen';
import gradient from 'gradient-string';
import figlet from 'figlet';

/**
 * Super Agents Terminal UI Components
 * Rich terminal interface components for enhanced CLI experience
 */

export class TerminalUI {
  constructor() {
    this.screen = null;
    this.widgets = new Map();
  }

  /**
   * Initialize blessed screen for advanced UI
   */
  initScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Super Agents Framework'
    });

    // Global key bindings
    this.screen.key(['q', 'C-c'], () => {
      this.cleanup();
      process.exit(0);
    });

    return this.screen;
  }

  /**
   * Create main dashboard interface
   */
  createDashboard() {
    if (!this.screen) this.initScreen();

    // Header
    const header = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: this.generateHeader(),
      style: {
        fg: 'cyan',
        border: {
          fg: 'blue'
        }
      },
      border: {
        type: 'line'
      }
    });

    // Sidebar - Agent Status
    const sidebar = blessed.box({
      top: 3,
      left: 0,
      width: '30%',
      height: '70%',
      label: ' Agents ',
      content: this.generateAgentStatus(),
      scrollable: true,
      style: {
        fg: 'white',
        border: {
          fg: 'green'
        }
      },
      border: {
        type: 'line'
      }
    });

    // Main content - Workflow Status
    const mainContent = blessed.box({
      top: 3,
      left: '30%',
      width: '70%',
      height: '70%',
      label: ' Workflow Status ',
      content: this.generateWorkflowStatus(),
      scrollable: true,
      style: {
        fg: 'white',
        border: {
          fg: 'yellow'
        }
      },
      border: {
        type: 'line'
      }
    });

    // Footer - Command Help
    const footer = blessed.box({
      top: '73%',
      left: 0,
      width: '100%',
      height: '27%',
      label: ' Commands ',
      content: this.generateCommandHelp(),
      style: {
        fg: 'gray',
        border: {
          fg: 'magenta'
        }
      },
      border: {
        type: 'line'
      }
    });

    // Add widgets to screen
    this.screen.append(header);
    this.screen.append(sidebar);
    this.screen.append(mainContent);
    this.screen.append(footer);

    // Store references
    this.widgets.set('header', header);
    this.widgets.set('sidebar', sidebar);
    this.widgets.set('mainContent', mainContent);
    this.widgets.set('footer', footer);

    this.screen.render();
    return this.screen;
  }

  /**
   * Create interactive agent selection interface
   */
  async createAgentSelector() {
    const agents = [
      { name: 'Analyst', role: 'Market Research & Requirements', icon: '🔍' },
      { name: 'PM', role: 'Product Management & Strategy', icon: '📋' },
      { name: 'Architect', role: 'System Design & Architecture', icon: '🏗️' },
      { name: 'Developer', role: 'Implementation & Testing', icon: '💻' },
      { name: 'QA', role: 'Quality Assurance & Review', icon: '🔍' },
      { name: 'Product Owner', role: 'Story Validation & Management', icon: '👤' },
      { name: 'UX Expert', role: 'User Experience & Design', icon: '🎨' },
      { name: 'Scrum Master', role: 'Workflow & Team Coordination', icon: '⚡' }
    ];

    if (!this.screen) this.initScreen();

    // Create agent selection list
    const agentList = blessed.list({
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      label: ' Select Agent ',
      items: agents.map(agent => `${agent.icon} ${agent.name} - ${agent.role}`),
      keys: true,
      vi: true,
      style: {
        selected: {
          bg: 'blue',
          fg: 'white'
        },
        border: {
          fg: 'cyan'
        }
      },
      border: {
        type: 'line'
      }
    });

    this.screen.append(agentList);
    agentList.focus();

    return new Promise((resolve) => {
      agentList.on('select', (item, index) => {
        this.screen.destroy();
        resolve(agents[index]);
      });

      this.screen.render();
    });
  }

  /**
   * Create progress monitoring interface
   */
  createProgressMonitor(workflow) {
    if (!this.screen) this.initScreen();

    // Workflow info header
    const workflowInfo = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: 5,
      content: this.generateWorkflowInfo(workflow),
      style: {
        fg: 'cyan',
        border: { fg: 'blue' }
      },
      border: { type: 'line' }
    });

    // Progress bars for each phase
    const progressContainer = blessed.box({
      top: 5,
      left: 0,
      width: '100%',
      height: '60%',
      label: ' Phase Progress ',
      scrollable: true,
      style: {
        border: { fg: 'green' }
      },
      border: { type: 'line' }
    });

    // Real-time log output
    const logOutput = blessed.log({
      top: '65%',
      left: 0,
      width: '100%',
      height: '35%',
      label: ' Real-time Output ',
      scrollable: true,
      style: {
        fg: 'white',
        border: { fg: 'yellow' }
      },
      border: { type: 'line' }
    });

    this.screen.append(workflowInfo);
    this.screen.append(progressContainer);
    this.screen.append(logOutput);

    // Update progress content
    this.updateProgressDisplay(progressContainer, workflow);

    this.widgets.set('workflowInfo', workflowInfo);
    this.widgets.set('progressContainer', progressContainer);
    this.widgets.set('logOutput', logOutput);

    this.screen.render();
    return { screen: this.screen, logOutput };
  }

  /**
   * Create task management interface
   */
  createTaskManager(tasks) {
    if (!this.screen) this.initScreen();

    // Task list
    const taskList = blessed.listtable({
      top: 0,
      left: 0,
      width: '60%',
      height: '100%',
      label: ' Tasks ',
      headers: ['ID', 'Title', 'Status', 'Priority', 'Agent'],
      data: this.formatTasksForTable(tasks),
      keys: true,
      vi: true,
      style: {
        selected: {
          bg: 'blue',
          fg: 'white'
        },
        header: {
          fg: 'cyan',
          bold: true
        },
        border: { fg: 'green' }
      },
      border: { type: 'line' }
    });

    // Task details panel
    const taskDetails = blessed.box({
      top: 0,
      left: '60%',
      width: '40%',
      height: '70%',
      label: ' Task Details ',
      content: 'Select a task to view details',
      scrollable: true,
      style: {
        border: { fg: 'yellow' }
      },
      border: { type: 'line' }
    });

    // Action buttons
    const actionPanel = blessed.box({
      top: '70%',
      left: '60%',
      width: '40%',
      height: '30%',
      label: ' Actions ',
      content: this.generateTaskActions(),
      style: {
        border: { fg: 'magenta' }
      },
      border: { type: 'line' }
    });

    this.screen.append(taskList);
    this.screen.append(taskDetails);
    this.screen.append(actionPanel);

    // Handle task selection
    taskList.on('select', (item, index) => {
      if (index > 0 && tasks[index - 1]) { // Skip header row
        const task = tasks[index - 1];
        taskDetails.setContent(this.formatTaskDetails(task));
        this.screen.render();
      }
    });

    taskList.focus();
    this.screen.render();

    return { screen: this.screen, taskList, taskDetails };
  }

  /**
   * Generate header content
   */
  generateHeader() {
    const banner = `███████╗██╗   ██╗██████╗ ███████╗██████╗    
██╔════╝██║   ██║██╔══██╗██╔════╝██╔══██╗   
███████╗██║   ██║██████╔╝█████╗  ██████╔╝   
╚════██║██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗   
███████║╚██████╔╝██║     ███████╗██║  ██║   
╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   
                                            
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝`;
    
    return gradient(['white', 'magenta']).multiline(banner) + '\n' + 
           chalk.cyan.bold('AI-Powered Development Framework - Terminal Interface');
  }

  /**
   * Generate agent status content
   */
  generateAgentStatus() {
    const agents = [
      { name: 'Analyst', status: 'active', task: 'Market Research' },
      { name: 'PM', status: 'idle', task: 'None' },
      { name: 'Architect', status: 'active', task: 'System Design' },
      { name: 'Developer', status: 'busy', task: 'Implementation' },
      { name: 'QA', status: 'idle', task: 'None' }
    ];

    let content = '';
    agents.forEach(agent => {
      const statusIcon = {
        'active': '🟢',
        'busy': '🟡',
        'idle': '⚪',
        'error': '🔴'
      }[agent.status];

      content += `${statusIcon} ${agent.name}\n`;
      content += `   Status: ${agent.status.toUpperCase()}\n`;
      content += `   Task: ${agent.task}\n\n`;
    });

    return content;
  }

  /**
   * Generate workflow status content
   */
  generateWorkflowStatus() {
    const phases = [
      { name: 'Analysis', status: 'completed', progress: 100 },
      { name: 'Planning', status: 'in-progress', progress: 65 },
      { name: 'Architecture', status: 'pending', progress: 0 },
      { name: 'Implementation', status: 'pending', progress: 0 },
      { name: 'Testing', status: 'pending', progress: 0 }
    ];

    let content = 'Current Workflow: Feature Development\n\n';
    
    phases.forEach(phase => {
      const statusIcon = {
        'completed': '✅',
        'in-progress': '🔄',
        'pending': '⏳',
        'failed': '❌'
      }[phase.status];

      const progressBar = this.generateProgressBar(phase.progress);
      
      content += `${statusIcon} ${phase.name}\n`;
      content += `   ${progressBar} ${phase.progress}%\n\n`;
    });

    return content;
  }

  /**
   * Generate command help content
   */
  generateCommandHelp() {
    return `
Key Commands:
  ↑/↓     Navigate lists
  Enter   Select item
  Tab     Switch panels
  r       Refresh view
  q       Quit application

Available Commands:
  sa workflow start --type=<type>    Start new workflow
  sa task list --status=active       List active tasks
  sa agent info <name>               Show agent details
  sa status --verbose                Show detailed status
    `;
  }

  /**
   * Generate workflow info content
   */
  generateWorkflowInfo(workflow) {
    const startTime = workflow.startTime ? workflow.startTime.toLocaleString() : 'Not started';
    const duration = workflow.startTime ? 
      this.formatDuration(new Date() - workflow.startTime) : '0s';
    
    return `
Workflow: ${workflow.definition ? workflow.definition.name : 'Unknown'}
Project: ${workflow.context ? workflow.context.projectName : 'Unknown'}
Started: ${startTime}
Duration: ${duration}
Status: ${workflow.status || 'Unknown'}
    `;
  }

  /**
   * Update progress display
   */
  updateProgressDisplay(container, workflow) {
    if (!workflow.phases) return;

    let content = '';
    workflow.phases.forEach((phase, index) => {
      const progress = phase.status === 'completed' ? 100 :
                      phase.status === 'in-progress' ? 50 : 0;
      
      const progressBar = this.generateProgressBar(progress);
      const statusIcon = {
        'completed': '✅',
        'in-progress': '🔄',
        'pending': '⏳',
        'failed': '❌'
      }[phase.status] || '⏳';

      content += `${index + 1}. ${statusIcon} ${phase.name}\n`;
      content += `   ${progressBar} ${progress}%\n\n`;
    });

    container.setContent(content);
  }

  /**
   * Generate ASCII progress bar
   */
  generateProgressBar(percentage, width = 20) {
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * Format tasks for table display
   */
  formatTasksForTable(tasks) {
    return tasks.map(task => [
      task.id.toString().slice(-8),
      task.title.substring(0, 30),
      task.status,
      task.priority,
      task.assignee || 'Unassigned'
    ]);
  }

  /**
   * Format task details
   */
  formatTaskDetails(task) {
    return `
ID: ${task.id}
Title: ${task.title}
Description: ${task.description || 'No description'}
Status: ${task.status}
Priority: ${task.priority}
Type: ${task.type}
Assignee: ${task.assignee || 'Unassigned'}
Created: ${task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown'}
Updated: ${task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'Unknown'}

Dependencies: ${task.dependencies ? task.dependencies.join(', ') : 'None'}
Tags: ${task.tags ? task.tags.join(', ') : 'None'}

Notes:
${task.notes || 'No notes available'}
    `;
  }

  /**
   * Generate task actions content
   */
  generateTaskActions() {
    return `
Available Actions:

[1] Update Status
[2] Change Priority
[3] Assign Agent
[4] Add Notes
[5] View Dependencies
[6] Edit Task

Press number key to execute action
    `;
  }

  /**
   * Create interactive menu
   */
  async createMenu(title, choices) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: title,
        choices: choices.map(choice => ({
          name: typeof choice === 'string' ? choice : choice.name,
          value: typeof choice === 'string' ? choice : choice.value
        }))
      }
    ]);

    return answers.selection;
  }

  /**
   * Create confirmation dialog
   */
  async confirm(message, defaultValue = false) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue
      }
    ]);

    return answers.confirmed;
  }

  /**
   * Create input dialog
   */
  async input(message, defaultValue = '') {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        default: defaultValue
      }
    ]);

    return answers.value;
  }

  /**
   * Display success message with animation
   */
  success(message, options = {}) {
    const content = `${chalk.green('✓')} ${chalk.white(message)}`;
    const box = boxen(content, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'green',
      backgroundColor: 'black',
      ...options
    });
    
    if (options.animate) {
      this.animateMessage(box, 'green');
    } else {
      console.log(box);
    }
  }

  /**
   * Display error message with animation
   */
  error(message, options = {}) {
    const content = `${chalk.red('✗')} ${chalk.white(message)}`;
    const box = boxen(content, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'red',
      backgroundColor: 'black',
      ...options
    });
    
    if (options.animate) {
      this.animateMessage(box, 'red');
    } else {
      console.log(box);
    }
  }

  /**
   * Display warning message with animation
   */
  warning(message, options = {}) {
    const content = `${chalk.yellow('⚠')} ${chalk.white(message)}`;
    const box = boxen(content, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'yellow',
      backgroundColor: 'black',
      ...options
    });
    
    if (options.animate) {
      this.animateMessage(box, 'yellow');
    } else {
      console.log(box);
    }
  }

  /**
   * Display info message with animation
   */
  info(message, options = {}) {
    const content = `${chalk.blue('ℹ')} ${chalk.white(message)}`;
    const box = boxen(content, {
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderStyle: 'round',
      borderColor: 'blue',
      backgroundColor: 'black',
      ...options
    });
    
    if (options.animate) {
      this.animateMessage(box, 'blue');
    } else {
      console.log(box);
    }
  }

  /**
   * Create data table
   */
  createTable(headers, data, options = {}) {
    const tableData = [headers, ...data];
    
    return table(tableData, {
      border: getBorderCharacters(options.borderStyle || 'ramac'),
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1
      },
      ...options
    });
  }

  /**
   * Format duration helper
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
   * Create beautiful loading spinner
   */
  createSpinner(text, options = {}) {
    const spinner = {
      interval: 80,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    };
    
    let i = 0;
    const colors = ['cyan', 'magenta', 'yellow', 'green', 'blue', 'red'];
    
    return setInterval(() => {
      const frame = spinner.frames[i % spinner.frames.length];
      const color = colors[Math.floor(i / spinner.frames.length) % colors.length];
      process.stdout.write(`\r${chalk[color](frame)} ${text}`);
      i++;
    }, spinner.interval);
  }
  
  /**
   * Stop spinner and show result
   */
  stopSpinner(spinnerId, result = '') {
    clearInterval(spinnerId);
    process.stdout.write(`\r${result}\n`);
  }
  
  /**
   * Animate message appearance
   */
  animateMessage(message, color = 'white') {
    const lines = message.split('\n');
    let delay = 0;
    
    lines.forEach((line, index) => {
      setTimeout(() => {
        console.log(line);
        if (index === lines.length - 1) {
          // Add a subtle glow effect for the last line
          setTimeout(() => {
            process.stdout.write('\x1b[1A'); // Move cursor up
            console.log(chalk[color].bold(line));
          }, 100);
        }
      }, delay);
      delay += 50;
    });
  }
  
  /**
   * Create gradient text effect
   */
  gradientText(text, colors = ['cyan', 'magenta']) {
    if (colors.length === 2) {
      return gradient(colors[0], colors[1])(text);
    }
    return gradient(colors)(text);
  }
  
  /**
   * Create typewriter effect
   */
  async typeWriter(text, delay = 50) {
    for (let i = 0; i < text.length; i++) {
      process.stdout.write(text[i]);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.log();
  }
  
  /**
   * Show startup animation
   */
  async showStartupAnimation() {
    console.clear();
    
    // Show banner with gradient effect
    const banner = `███████╗██╗   ██╗██████╗ ███████╗██████╝    
██╔════╝██║   ██║██╔══██╗██╔════╝██╔══██╗   
███████╗██║   ██║██████╔╝█████╗  ██████╔╝   
╚════██║██║   ██║██╔═══╝ ██╔══╝  ██╔══██╗   
███████║╚██████╔╝██║     ███████╗██║  ██║   
╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═╝   
                                            
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝`;
    
    console.log(this.gradientText(banner, ['white', 'magenta']));
    
    // Animated subtitle
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.typeWriter(chalk.cyan.bold('AI-Powered Development Framework'), 30);
    
    // Loading animation
    const spinner = this.createSpinner('Initializing Super Agents...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.stopSpinner(spinner, chalk.green('✓ Ready for AI-powered development!'));
    
    console.log();
  }
  
  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.screen) {
      this.screen.destroy();
    }
    this.widgets.clear();
  }
}

export default TerminalUI;