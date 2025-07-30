import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';

export async function initCommand(options) {
  console.log(chalk.blue('🚀 Initializing Super Agents project...\n'));

  const spinner = ora('Setting up project structure').start();

  try {
    const configManager = new ConfigManager();
    const stateManager = new StateManager();

    // Check if already initialized
    if (await configManager.isInitialized()) {
      spinner.warn('Project already initialized');
      console.log(chalk.yellow('⚠️  Super Agents project is already initialized in this directory.'));
      console.log(chalk.gray('Use "sa config --list" to view current configuration.'));
      return;
    }

    // Interactive setup if requested
    let projectOptions = {
      name: options.name,
      template: options.template
    };

    if (options.interactive) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: options.name || process.cwd().split('/').pop()
        },
        {
          type: 'list',
          name: 'template',
          message: 'Project template:',
          choices: [
            { name: 'Full-stack development', value: 'fullstack' },
            { name: 'Frontend only', value: 'frontend' },
            { name: 'Backend only', value: 'backend' },
            { name: 'Mobile development', value: 'mobile' },
            { name: 'Minimal setup', value: 'minimal' },
            { name: 'Enterprise setup', value: 'enterprise' }
          ],
          default: options.template || 'fullstack'
        },
        {
          type: 'list',
          name: 'primaryProvider',
          message: 'Primary AI provider:',
          choices: [
            { name: 'Anthropic (Claude)', value: 'anthropic' },
            { name: 'OpenAI (GPT)', value: 'openai' },
            { name: 'Google (Gemini)', value: 'google' },
            { name: 'Local/Self-hosted', value: 'local' }
          ],
          default: 'anthropic'
        }
      ]);

      projectOptions = { ...projectOptions, ...answers };
    }

    spinner.text = 'Creating configuration...';

    // Initialize configuration
    const config = await configManager.initializeProject({
      name: projectOptions.name,
      template: projectOptions.template
    });

    // Set AI provider if specified
    if (projectOptions.primaryProvider) {
      configManager.setValue(config, 'super_agents.ai.providers.primary', projectOptions.primaryProvider);
      await configManager.saveConfig(config);
    }

    spinner.text = 'Initializing state management...';

    // Initialize state
    await stateManager.initialize({
      projectName: config.super_agents.project.name,
      projectType: config.super_agents.project.type
    });

    spinner.succeed('Project initialized successfully');

    console.log(chalk.green('✅ Super Agents project initialized!\n'));
    console.log(chalk.cyan('Project Details:'));
    console.log(`  ${chalk.gray('Name:')} ${chalk.white(config.super_agents.project.name)}`);
    console.log(`  ${chalk.gray('Type:')} ${chalk.white(config.super_agents.project.type)}`);
    console.log(`  ${chalk.gray('AI Provider:')} ${chalk.white(config.super_agents.ai.providers.primary)}`);
    
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.gray('  1. List available agents: ') + chalk.white('sa agent list'));
    console.log(chalk.gray('  2. View configuration: ') + chalk.white('sa config --list'));
    console.log(chalk.gray('  3. Start planning: ') + chalk.white('sa plan --interactive'));
    console.log(chalk.gray('  4. Integrate with your IDE: ') + chalk.white('sa integrate --ide=claude-code'));

  } catch (error) {
    spinner.fail('Failed to initialize project');
    console.error(chalk.red('✗'), error.message);
    process.exit(1);
  }
}