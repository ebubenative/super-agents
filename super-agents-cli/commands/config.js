import chalk from 'chalk';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';

export async function configCommand(options) {
  const configManager = new ConfigManager();
  
  try {
    // Check if project is initialized (unless using global config)
    if (!options.global && !(await configManager.isInitialized())) {
      console.error(chalk.red('✗'), 'No Super Agents project found. Run "sa init" first.');
      process.exit(1);
    }

    if (options.list) {
      // List all configuration values
      const config = await configManager.loadConfig(options.global);
      console.log(chalk.blue(`📋 Super Agents Configuration${options.global ? ' (Global)' : ''}:\n`));
      printConfig(config.super_agents, '');
      return;
    }

    if (options.set) {
      // Set configuration value
      const [key, value] = options.set.split('=');
      if (!key || value === undefined) {
        console.error(chalk.red('✗'), 'Invalid format. Use: sa config --set key=value');
        process.exit(1);
      }

      const config = await configManager.loadConfig(options.global);
      const fullKey = key.startsWith('super_agents.') ? key : `super_agents.${key}`;
      configManager.setValue(config, fullKey, value);
      await configManager.saveConfig(config, options.global);
      
      console.log(chalk.green('✅'), `Configuration updated: ${key} = ${value}`);
      return;
    }

    if (options.unset) {
      // Unset configuration value
      const config = await configManager.loadConfig(options.global);
      const fullKey = options.unset.startsWith('super_agents.') ? options.unset : `super_agents.${options.unset}`;
      configManager.unsetValue(config, fullKey);
      await configManager.saveConfig(config, options.global);
      
      console.log(chalk.green('✅'), `Configuration removed: ${options.unset}`);
      return;
    }

    // Default: show help
    console.log(chalk.blue('📋 Configuration Management\n'));
    console.log('Usage:');
    console.log('  sa config --list               List all configuration');
    console.log('  sa config --set key=value      Set configuration value');
    console.log('  sa config --unset key          Remove configuration value');
    console.log('  sa config --global             Use global configuration');
    console.log('\nExamples:');
    console.log('  sa config --set ai.providers.primary=anthropic');
    console.log('  sa config --set project.name="My Project"');
    console.log('  sa config --unset ai.providers.fallback');
    console.log('  sa config --global --set ai.providers.primary=openai');
    
    console.log(chalk.cyan('\nConfiguration Hierarchy:'));
    console.log('  1. Project config (.super-agents/config.yaml)');
    console.log('  2. Global config (~/.super-agents/config.yaml)');
    console.log('  3. Built-in defaults');

  } catch (error) {
    console.error(chalk.red('✗'), error.message);
    process.exit(1);
  }
}

function printConfig(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(chalk.cyan(`${fullKey}:`));
      printConfig(value, fullKey);
    } else {
      const displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
      console.log(`  ${chalk.gray(fullKey)}: ${chalk.white(displayValue)}`);
    }
  }
}
