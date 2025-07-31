import chalk from 'chalk';
import boxen from 'boxen';
import { table, getBorderCharacters } from 'table';
import gradient from 'gradient-string';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';
import { formatTimestamp } from '../../sa-engine/utils/index.js';
import { TerminalUI } from '../ui/terminal-ui.js';

export async function statusCommand(options) {
  const ui = new TerminalUI();
  
  try {
    const stateManager = new StateManager();
    const configManager = new ConfigManager();

    // Check if project is initialized
    if (!(await stateManager.isInitialized())) {
      ui.error('No Super Agents project found. Run "sa init" first.');
      process.exit(1);
    }

    const state = await stateManager.loadState();
    const config = await configManager.loadConfig();

    // Beautiful header
    console.log();
    console.log(boxen(
      gradient(['white', 'magenta'])('📊 SUPER AGENTS PROJECT STATUS'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        backgroundColor: 'black',
        textAlignment: 'center'
      }
    ));

    // Project Information Table
    const projectData = [
      ['Property', 'Value'],
      ['Name', state.project.name],
      ['Type', state.project.type],
      ['Created', formatTimestamp(state.project.created_at)],
      ['Last Updated', formatTimestamp(state.project.last_updated)]
    ];
    
    console.log(chalk.cyan.bold('\n🚀 PROJECT INFORMATION'));
    console.log(table(projectData, {
      border: getBorderCharacters('ramac'),
      columns: {
        0: { width: 15, alignment: 'right' },
        1: { width: 30, alignment: 'left' }
      },
      drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size
    }));

    // Task Statistics
    console.log(chalk.cyan('\nTasks:'));
    console.log(`  ${chalk.gray('Completed:')} ${chalk.green(state.tasks.completed.length)}`);
    console.log(`  ${chalk.gray('In Progress:')} ${chalk.yellow(state.tasks.in_progress.length)}`);
    console.log(`  ${chalk.gray('Pending:')} ${chalk.white(state.tasks.pending.length)}`);
    console.log(`  ${chalk.gray('Current:')} ${chalk.white(state.tasks.current || 'None')}`);

    // Agent Information
    console.log(chalk.cyan('\nAgents:'));
    console.log(`  ${chalk.gray('Active:')} ${chalk.white(state.agents.active || 'None')}`);
    console.log(`  ${chalk.gray('Last Used:')} ${chalk.white(state.agents.last_used || 'None')}`);

    // Configuration
    console.log(chalk.cyan('\nConfiguration:'));
    console.log(`  ${chalk.gray('AI Provider:')} ${chalk.white(config.super_agents.ai.providers.primary)}`);
    console.log(`  ${chalk.gray('Workflow:')} ${chalk.white(config.super_agents.methodology.workflow_type)}`);
    console.log(`  ${chalk.gray('MCP Enabled:')} ${chalk.white(config.super_agents.integrations.mcp_enabled ? 'Yes' : 'No')}`);

    // Session Information
    console.log(chalk.cyan('\nSession:'));
    console.log(`  ${chalk.gray('ID:')} ${chalk.white(state.session.id)}`);
    console.log(`  ${chalk.gray('Started:')} ${chalk.white(formatTimestamp(state.session.started_at))}`);

    // File paths
    if (options.verbose) {
      console.log(chalk.cyan('\nFile Locations:'));
      console.log(`  ${chalk.gray('Config:')} ${chalk.white(configManager.getConfigPath())}`);
      console.log(`  ${chalk.gray('State:')} ${chalk.white(stateManager.getStatePath())}`);
    }

    // Success footer
    ui.success('Status report generated successfully!');
    
  } catch (error) {
    ui.error(`Failed to generate status report: ${error.message}`);
    process.exit(1);
  }
}

// Helper functions
function getTotalTasks(state) {
  return state.tasks.completed.length + state.tasks.in_progress.length + state.tasks.pending.length;
}

function generateProgressBar(count, total, width = 15) {
  if (total === 0) return '─'.repeat(width);
  const percentage = count / total;
  const filled = Math.floor(percentage * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function calculateDuration(startTime) {
  const now = new Date();
  const start = new Date(startTime);
  const diff = now - start;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}