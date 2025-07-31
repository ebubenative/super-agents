import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, mkdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Calculate the project root directory
const projectRoot = resolve(__dirname, '../../');
const enginePath = join(projectRoot, 'sa-engine');

export async function initCommand(options) {
  console.log(chalk.blue('🚀 Super Agents Project Initialization\n'));

  let spinner;
  const originalCwd = process.cwd();

  try {
    // Step 1: Determine target directory
    let targetDirectory = process.cwd();
    let projectName = options.name;

    // Ask for installation directory and project details
    const projectQuestions = [
      {
        type: 'input',
        name: 'directory',
        message: 'Where would you like to initialize Super Agents?',
        default: process.cwd(),
        validate: (input) => {
          const resolvedPath = resolve(input);
          if (!existsSync(resolvedPath)) {
            return `Directory "${resolvedPath}" does not exist. Would you like me to create it? (Create it manually first)`;
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: (answers) => options.name || basename(resolve(answers.directory))
      }
    ];

    // Add interactive questions if requested or if not enough info provided
    if (options.interactive || !options.name) {
      const directoryAnswers = await inquirer.prompt(projectQuestions);
      targetDirectory = resolve(directoryAnswers.directory);
      projectName = directoryAnswers.name;
    } else if (options.name) {
      // If name is provided but no directory specified, ask for directory
      const dirAnswer = await inquirer.prompt([projectQuestions[0]]);
      targetDirectory = resolve(dirAnswer.directory);
    }

    // Create directory if it doesn't exist
    if (!existsSync(targetDirectory)) {
      const createDir = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'create',
          message: `Directory "${targetDirectory}" doesn't exist. Create it?`,
          default: true
        }
      ]);
      
      if (createDir.create) {
        mkdirSync(targetDirectory, { recursive: true });
        console.log(chalk.green(`✓ Created directory: ${targetDirectory}`));
      } else {
        console.log(chalk.yellow('Initialization cancelled.'));
        return;
      }
    }

    // Change working directory for this operation
    process.chdir(targetDirectory);

    console.log(chalk.cyan(`\nInitializing Super Agents in: ${chalk.white(targetDirectory)}\n`));

    spinner = ora('Checking existing installation').start();

    // Dynamic imports with absolute paths (convert to file:// URLs for Windows compatibility)
    const { ConfigManager } = await import(pathToFileURL(join(enginePath, 'config/ConfigManager.js')).href);
    const { StateManager } = await import(pathToFileURL(join(enginePath, 'state-manager/StateManager.js')).href);

    const configManager = new ConfigManager();
    const stateManager = new StateManager();

    // Check if already initialized in target directory
    if (await configManager.isInitialized()) {
      spinner.warn('Project already initialized');
      console.log(chalk.yellow(`⚠️  Super Agents is already initialized in ${targetDirectory}`));
      console.log(chalk.gray('Use "sa config --list" to view current configuration.'));
      process.chdir(originalCwd);
      return;
    }

    spinner.text = 'Setting up project structure';

    // Step 2: Gather project configuration
    let projectOptions = {
      name: projectName,
      template: options.template
    };

    // Additional configuration questions
    const configQuestions = [
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
        default: options.template || 'fullstack',
        when: () => options.interactive || !options.template
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
        default: 'anthropic',
        when: () => options.interactive
      },
      {
        type: 'confirm',
        name: 'createEnvFile',
        message: 'Create .env file for API keys?',
        default: true,
        when: () => options.interactive
      }
    ];

    if (options.interactive || !options.template) {
      const configAnswers = await inquirer.prompt(configQuestions);
      projectOptions = { ...projectOptions, ...configAnswers };
    }

    spinner.text = 'Creating configuration...';

    // Step 3: Create Super Agents structure in target directory
    await createSuperAgentsStructure(targetDirectory);

    // Initialize configuration
    const config = await configManager.initializeProject({
      name: projectOptions.name,
      template: projectOptions.template || 'fullstack'
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

    // Create .env file if requested
    if (projectOptions.createEnvFile) {
      spinner.text = 'Creating environment file...';
      await createEnvFile(targetDirectory);
    }

    spinner.succeed('Project initialized successfully');

    // Restore original working directory
    process.chdir(originalCwd);

    console.log(chalk.green('✅ Super Agents project initialized!\n'));
    console.log(chalk.cyan('Project Details:'));
    console.log(`  ${chalk.gray('Location:')} ${chalk.white(targetDirectory)}`);
    console.log(`  ${chalk.gray('Name:')} ${chalk.white(config.super_agents.project.name)}`);
    console.log(`  ${chalk.gray('Type:')} ${chalk.white(config.super_agents.project.type)}`);
    console.log(`  ${chalk.gray('AI Provider:')} ${chalk.white(config.super_agents.ai.providers.primary)}`);
    
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.gray(`  1. Navigate to project: `) + chalk.white(`cd ${targetDirectory}`));
    console.log(chalk.gray('  2. List available agents: ') + chalk.white('sa agent list'));
    console.log(chalk.gray('  3. View configuration: ') + chalk.white('sa config --list'));
    console.log(chalk.gray('  4. Start planning: ') + chalk.white('sa plan --interactive'));
    console.log(chalk.gray('  5. Integrate with your IDE: ') + chalk.white('sa integrate'));

  } catch (error) {
    // Restore original working directory on error
    try {
      process.chdir(originalCwd);
    } catch (e) {
      // Ignore chdir errors during cleanup
    }
    
    if (spinner) {
      spinner.fail('Failed to initialize project');
    }
    console.error(chalk.red('✗'), error.message);
    process.exit(1);
  }
}

// Helper function to create Super Agents structure in target directory
async function createSuperAgentsStructure(targetPath) {
  const { mkdir, writeFile, copyFile } = await import('fs/promises');
  const { fileURLToPath } = await import('url');
  const { dirname: pathDirname } = await import('path');
  
  // Get the Super Agents installation directory (where this CLI is running from)
  const currentFileUrl = import.meta.url;
  const currentFilePath = fileURLToPath(currentFileUrl);
  const superAgentsRoot = resolve(pathDirname(currentFilePath), '../..');
  
  // Create .super-agents directory
  const saDir = join(targetPath, '.super-agents');
  await mkdir(saDir, { recursive: true });
  
  // Create subdirectories
  const directories = [
    'config',
    'tasks', 
    'logs',
    'templates'
  ];
  
  for (const dir of directories) {
    await mkdir(join(saDir, dir), { recursive: true });
  }
  
  // Create a reference to the Super Agents installation
  const installRef = {
    superAgentsPath: superAgentsRoot,
    mcpServerPath: join(superAgentsRoot, 'sa-engine/mcp-server/index.js'),
    agentsPath: join(superAgentsRoot, 'sa-engine/agents'),
    templatesPath: join(superAgentsRoot, 'sa-engine/templates'),
    installedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  await writeFile(
    join(saDir, 'installation.json'),
    JSON.stringify(installRef, null, 2)
  );
}

// Helper function to create .env file
async function createEnvFile(targetPath) {
  const { writeFile } = await import('fs/promises');
  
  const envContent = `# Super Agents Environment Variables
# Add your API keys here

# Anthropic API Key (recommended)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OpenAI API Key (optional fallback)
OPENAI_API_KEY=your_openai_api_key_here

# Google API Key (optional)
GOOGLE_API_KEY=your_google_api_key_here

# Super Agents Configuration
SA_LOG_LEVEL=info
SA_MAX_RETRIES=3
SA_TIMEOUT=30000

# MCP Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
`;

  await writeFile(join(targetPath, '.env'), envContent);
}