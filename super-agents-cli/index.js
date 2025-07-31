#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import command handlers (stubs for now)
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { agentCommand } from './commands/agent.js';
import { taskCommand } from './commands/task.js';
import { planCommand } from './commands/plan.js';
import { integrateCommand } from './commands/integrate.js';
import { statusCommand } from './commands/status.js';
import { backupCommand } from './commands/backup.js';
import { doctorCommand } from './commands/doctor.js';
import { repairCommand } from './commands/repair.js';
import { workflowCommand } from './commands/workflow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version (use main package.json, not CLI sub-package)
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));

// Beautiful CLI styling utilities
class CLIStyles {
  static showBanner() {
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
    
    const subtitle = 'AI-Powered Development Framework';
    const version = `v${packageJson.version}`;
    
    console.log();
    console.log(gradient(['white', 'magenta']).multiline(banner));
    console.log();
    console.log(boxen(
      `${chalk.cyan.bold(subtitle)}\n${chalk.gray('Universal AI agents for development workflows')}\n\n${chalk.green('Version:')} ${chalk.yellow(version)}`,
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: 'black',
        textAlignment: 'center'
      }
    ));
    console.log();
  }
  
  static success(message) {
    console.log(boxen(
      `${chalk.green('✓')} ${message}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: 'black'
      }
    ));
  }
  
  static error(message) {
    console.log(boxen(
      `${chalk.red('✗')} ${message}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'red',
        backgroundColor: 'black'
      }
    ));
  }
  
  static info(message) {
    console.log(boxen(
      `${chalk.blue('ℹ')} ${message}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'blue',
        backgroundColor: 'black'
      }
    ));
  }
  
  static warning(message) {
    console.log(boxen(
      `${chalk.yellow('⚠')} ${message}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'yellow',
        backgroundColor: 'black'
      }
    ));
  }
  
  static loading(text, options = {}) {
    return ora({
      text: chalk.cyan(text),
      spinner: options.spinner || 'dots12',
      color: options.color || 'cyan',
      ...options
    });
  }
  
  static async showStartupAnimation() {
    console.clear();
    
    // Animated banner appearance
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
    
    console.log(gradient(['white', 'magenta']).multiline(banner));
    console.log();
    
    // Type out subtitle
    const subtitle = 'AI-Powered Development Framework';
    process.stdout.write(chalk.cyan.bold(''));
    for (let i = 0; i < subtitle.length; i++) {
      process.stdout.write(subtitle[i]);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    console.log();
    console.log();
    
    // Show loading
    const spinner = this.loading('Initializing Super Agents...', { spinner: 'aesthetic' });
    spinner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed(chalk.green('Ready for AI-powered development!'));
    console.log();
  }
  
  static header(text) {
    console.log();
    console.log(chalk.cyan.bold(`${'═'.repeat(text.length + 4)}`));
    console.log(chalk.cyan.bold(`  ${text}  `));
    console.log(chalk.cyan.bold(`${'═'.repeat(text.length + 4)}`));
    console.log();
  }
}

const program = new Command();

// Show banner on startup (only for help or no args)
if (process.argv.length === 2 || process.argv.includes('--help') || process.argv.includes('-h')) {
  CLIStyles.showBanner();
} else if (process.argv.includes('--animate')) {
  await CLIStyles.showStartupAnimation();
}

program
  .name('sa')
  .description('Super Agents - Universal AI-powered development framework')
  .version(packageJson.version, '-v, --version', 'display version number');

// Global options
program
  .option('-d, --debug', 'enable debug mode')
  .option('--config <path>', 'specify config file path')
  .option('--no-color', 'disable colored output')
  .option('--animate', 'show animated startup sequence');

// Initialize project command
program
  .command('init')
  .description('Initialize a new Super Agents project')
  .option('-t, --template <type>', 'project template (fullstack, minimal, enterprise)', 'fullstack')
  .option('-n, --name <name>', 'project name')
  .option('--interactive', 'interactive setup')
  .action(initCommand);

// Configuration management
program
  .command('config')
  .description('Manage Super Agents configuration')
  .option('-g, --global', 'use global configuration')
  .option('-l, --list', 'list all configuration values')
  .option('-s, --set <key=value>', 'set configuration value')
  .option('-u, --unset <key>', 'unset configuration value')
  .action(configCommand);

// Agent management
const agent = program
  .command('agent')
  .description('Manage AI agents');

agent
  .command('list')
  .description('List all available agents')
  .option('-t, --type <type>', 'filter by agent type')
  .action(agentCommand.list);

agent
  .command('info <name>')
  .description('Show detailed information about an agent')
  .action(agentCommand.info);

agent
  .command('test <name>')
  .description('Test agent configuration')
  .action(agentCommand.test);

// Task management
const task = program
  .command('task')
  .description('Manage tasks');

task
  .command('list')
  .description('List tasks')
  .option('-s, --status <status>', 'filter by status')
  .option('-p, --priority <priority>', 'filter by priority')
  .option('-t, --type <type>', 'filter by type')
  .option('-a, --assignee <assignee>', 'filter by assignee')
  .option('--search <term>', 'search in title/description')
  .option('--tags <tags>', 'filter by tags (comma-separated)')
  .option('--tag <tag>', 'use specific tag context')
  .option('--tree', 'display as tree')
  .option('--stats', 'show statistics')
  .action(taskCommand.list);

task
  .command('show <id>')
  .description('Show task details')
  .option('--tag <tag>', 'use specific tag context')
  .action(taskCommand.show);

task
  .command('create <title>')
  .description('Create a new task')
  .option('-d, --description <desc>', 'task description')
  .option('-a, --assignee <assignee>', 'assign to agent/user')
  .option('-p, --priority <priority>', 'task priority (critical, high, medium, low)', 'medium')
  .option('-t, --type <type>', 'task type (feature, bug, enhancement, etc)', 'feature')
  .option('--due <date>', 'due date (YYYY-MM-DD)')
  .option('--tags <tags>', 'tags (comma-separated)')
  .option('--depends <deps>', 'dependencies (comma-separated task IDs)')
  .option('--parent <id>', 'parent task ID (creates subtask)')
  .option('--tag <tag>', 'use specific tag context')
  .action(taskCommand.create);

task
  .command('update <id>')
  .description('Update task')
  .option('--title <title>', 'new title')
  .option('-d, --description <desc>', 'new description')
  .option('-s, --status <status>', 'new status')
  .option('-p, --priority <priority>', 'new priority')
  .option('-t, --type <type>', 'new type')
  .option('--due <date>', 'new due date')
  .option('--notes <notes>', 'add notes')
  .option('--tag <tag>', 'use specific tag context')
  .action(taskCommand.update);

task
  .command('delete <id>')
  .description('Delete task')
  .option('--force', 'confirm deletion')
  .option('--tag <tag>', 'use specific tag context')
  .action(taskCommand.delete);

task
  .command('deps <id>')
  .description('Manage task dependencies')
  .option('--add <taskId>', 'add dependency')
  .option('--remove <taskId>', 'remove dependency')
  .option('--validate', 'validate all dependencies')
  .option('--visualize', 'show dependency graph')
  .option('--format <format>', 'visualization format (ascii, json, dot)', 'ascii')
  .option('--tag <tag>', 'use specific tag context')
  .action(taskCommand.deps);

// Planning and workflow
program
  .command('plan')
  .description('Start interactive planning session')
  .option('-a, --agent <agent>', 'use specific agent for planning', 'analyst')
  .option('--interactive', 'interactive planning mode')
  .action(planCommand);

// Integration commands
program
  .command('integrate')
  .description('Integrate with IDE or development environment')
  .option('--ide <ide>', 'target IDE (claude-code, cursor, vscode, windsurf)')
  .option('--mcp', 'enable MCP integration')
  .option('--standalone', 'setup standalone integration')
  .action(integrateCommand);

// Status command
program
  .command('status')
  .description('Show current project status and statistics')
  .option('-v, --verbose', 'show verbose output including file paths')
  .action(statusCommand);

// Backup command
program
  .command('backup')
  .description('Create or restore state backups')
  .option('-r, --restore <path>', 'restore from backup file')
  .action(backupCommand);

// Health check command
program
  .command('doctor')
  .description('Run comprehensive system health checks')
  .option('-v, --verbose', 'show detailed diagnostics')
  .option('--component <component>', 'check specific component (mcp-server, agents, configuration, ide-integration)')
  .action(doctorCommand);

// Repair command
program
  .command('repair')
  .description('Automatically detect and repair common issues')
  .option('--issue <issue>', 'repair specific issue (configuration, api-connectivity, mcp-server, project-structure, agents)')
  .action(repairCommand);

// Workflow management
const workflow = program
  .command('workflow')
  .description('Manage AI-powered workflows');

workflow
  .command('start')
  .description('Start a new workflow')
  .option('-t, --type <type>', 'workflow type (greenfield-fullstack, feature-development, code-review, api-development, modernization, debugging)')
  .option('-p, --project <name>', 'project name')
  .option('--interactive', 'interactive workflow setup')
  .action(workflowCommand.start);

workflow
  .command('status')
  .description('Show workflow status')
  .option('-v, --verbose', 'show detailed status')
  .option('--all', 'show all workflows')
  .action(workflowCommand.status);

workflow
  .command('track')
  .description('Track workflow progress in real-time')
  .option('--workflow <id>', 'specific workflow to track')
  .action(workflowCommand.track);

// Automation commands
const automation = program
  .command('automation')
  .alias('auto')
  .description('Manage workflow automation');

automation
  .command('init')
  .description('Initialize automation system')
  .action(async () => {
    const { WorkflowAutomation } = await import('./automation/workflow-automation.js');
    const auto = new WorkflowAutomation();
    await auto.initialize();
    await auto.createPredefinedScripts();
  });

automation
  .command('create <name>')
  .description('Create automation script')
  .option('-d, --description <desc>', 'script description')
  .option('-t, --trigger <trigger>', 'trigger type (manual, scheduled, git-hook)', 'manual')
  .action(async (name, options) => {
    const { WorkflowAutomation } = await import('./automation/workflow-automation.js');
    const auto = new WorkflowAutomation();
    
    // Interactive script creation
    console.log(chalk.blue(`Creating automation script: ${name}`));
    // TODO: Implement interactive script builder
  });

automation
  .command('run <script>')
  .description('Run automation script')
  .option('--dry-run', 'simulate execution without running commands')
  .action(async (script, options) => {
    const { WorkflowAutomation } = await import('./automation/workflow-automation.js');
    const auto = new WorkflowAutomation();
    await auto.runScript(script, options);
  });

automation
  .command('schedule <script> <cron>')
  .description('Schedule automation script')
  .option('--description <desc>', 'schedule description')
  .action(async (script, cron, options) => {
    const { WorkflowAutomation } = await import('./automation/workflow-automation.js');
    const auto = new WorkflowAutomation();
    await auto.scheduleScript(script, cron, options);
  });

automation
  .command('unschedule <script>')
  .description('Remove scheduled automation script')
  .action(async (script) => {
    const { WorkflowAutomation } = await import('./automation/workflow-automation.js');
    const auto = new WorkflowAutomation();
    await auto.unscheduleScript(script);
  });

automation
  .command('list')
  .description('List automation scripts and schedules')
  .option('--scheduled', 'show only scheduled scripts')
  .option('--running', 'show only running automations')
  .action(async (options) => {
    const { WorkflowAutomation } = await import('./automation/workflow-automation.js');
    const auto = new WorkflowAutomation();
    
    if (options.scheduled) {
      auto.listScheduledScripts();
    } else if (options.running) {
      auto.listRunningAutomations();
    } else {
      auto.listScheduledScripts();
      console.log();
      auto.listRunningAutomations();
    }
  });

// Interactive dashboard
program
  .command('dashboard')
  .description('Launch interactive terminal dashboard')
  .option('--mode <mode>', 'dashboard mode (overview, tasks, workflows, agents)', 'overview')
  .action(async (options) => {
    const { TerminalUI } = await import('./ui/terminal-ui.js');
    const ui = new TerminalUI();
    
    switch (options.mode) {
      case 'overview':
        ui.createDashboard();
        break;
      case 'tasks':
        // TODO: Load tasks and create task manager
        break;
      case 'workflows':
        // TODO: Load workflows and create workflow monitor
        break;
      case 'agents':
        await ui.createAgentSelector();
        break;
      default:
        ui.createDashboard();
    }
  });

// Global error handling with beautiful styling
program.configureOutput({
  writeErr: (str) => {
    CLIStyles.error(str.replace(/^error: /, ''));
  },
  writeOut: (str) => process.stdout.write(str)
});

program.exitOverride((err) => {
  if (err.exitCode === 0) return;
  CLIStyles.error(err.message.replace(/^error: /, ''));
  process.exit(err.exitCode);
});

// Enhanced help formatting
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => chalk.cyan.bold(cmd.name()),
  commandUsage: (cmd) => chalk.yellow(cmd.usage()),
  commandDescription: (cmd) => chalk.gray(cmd.description()),
  optionTerm: (option) => chalk.green(option.flags),
  optionDescription: (option) => chalk.gray(option.description)
});

// Parse command line arguments
try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(chalk.red('✗'), error.message);
  process.exit(1);
}