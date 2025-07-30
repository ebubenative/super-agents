import chalk from 'chalk';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';
import { formatTimestamp } from '../../sa-engine/utils/index.js';

export async function backupCommand(options) {
  try {
    const stateManager = new StateManager();

    if (!(await stateManager.isInitialized())) {
      console.error(chalk.red('✗'), 'No Super Agents project found. Run "sa init" first.');
      process.exit(1);
    }

    if (options.restore) {
      // Restore from backup
      await stateManager.restoreFromBackup(options.restore);
      console.log(chalk.green('✅'), `State restored from backup: ${options.restore}`);
    } else {
      // Create backup
      const backupPath = await stateManager.createBackup();
      console.log(chalk.green('✅'), `State backup created: ${backupPath}`);
    }

  } catch (error) {
    console.error(chalk.red('✗'), error.message);
    process.exit(1);
  }
}