#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));

const program = new Command();

program
  .name('sa')
  .description('Super Agents - Universal AI-powered development framework')
  .version(packageJson.version, '-v, --version', 'display version number');

// Global options
program
  .option('-d, --debug', 'enable debug mode')
  .option('--config <path>', 'specify config file path')
  .option('--no-color', 'disable colored output');

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

// Global error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

program.exitOverride((err) => {
  if (err.exitCode === 0) return;
  console.error(chalk.red('✗'), err.message);
  process.exit(err.exitCode);
});

// Parse command line arguments
try {
  await program.parseAsync(process.argv);
} catch (error) {
  console.error(chalk.red('✗'), error.message);
  process.exit(1);
}