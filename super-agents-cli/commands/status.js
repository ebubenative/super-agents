import chalk from 'chalk';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';
import { formatTimestamp } from '../../sa-engine/utils/index.js';

export async function statusCommand(options) {
  try {
    const stateManager = new StateManager();
    const configManager = new ConfigManager();

    // Check if project is initialized
    if (!(await stateManager.isInitialized())) {
      console.error(chalk.red('✗'), 'No Super Agents project found. Run "sa init" first.');
      process.exit(1);
    }

    const state = await stateManager.loadState();
    const config = await configManager.loadConfig();

    console.log(chalk.blue('📊 Super Agents Project Status\n'));

    // Project Information
    console.log(chalk.cyan('Project:'));
    console.log(`  ${chalk.gray('Name:')} ${chalk.white(state.project.name)}`);
    console.log(`  ${chalk.gray('Type:')} ${chalk.white(state.project.type)}`);
    console.log(`  ${chalk.gray('Created:')} ${chalk.white(formatTimestamp(state.project.created_at))}`);
    console.log(`  ${chalk.gray('Last Updated:')} ${chalk.white(formatTimestamp(state.project.last_updated))}`);

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

  } catch (error) {
    console.error(chalk.red('✗'), error.message);
    process.exit(1);
  }
}