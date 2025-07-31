import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import ora from 'ora';
import boxen from 'boxen';
import ClaudeCodeIntegrator from '../../sa-engine/claude-code/ClaudeCodeIntegrator.js';

export async function integrateCommand(options) {
  console.log(chalk.blue('🔗 IDE Integration\n'));
  
  try {
    // Step 1: Detect or ask for project directory
    let projectDirectory = await detectProjectDirectory();
    
    if (!projectDirectory) {
      const dirAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'directory',
          message: 'Where is your Super Agents project located?',
          default: process.cwd(),
          validate: async (input) => {
            const resolvedPath = resolve(input);
            if (!existsSync(resolvedPath)) {
              return `Directory "${resolvedPath}" does not exist.`;
            }
            
            // Check if it's a Super Agents project
            const installationFile = join(resolvedPath, '.super-agents/installation.json');
            if (!existsSync(installationFile)) {
              return `Directory "${resolvedPath}" is not a Super Agents project. Run "sa init" first.`;
            }
            
            return true;
          }
        }
      ]);
      projectDirectory = resolve(dirAnswer.directory);
    }

    console.log(chalk.cyan(`\nProject Directory: ${chalk.white(projectDirectory)}`));

    // Step 2: If no IDE specified, show interactive selection
    let targetIde = options.ide;
    
    if (!targetIde) {
      const ides = [
        { name: 'Claude Code', value: 'claude-code', description: 'Anthropic\'s official AI coding assistant' },
        { name: 'Cursor', value: 'cursor', description: 'AI-first code editor' },
        { name: 'VS Code', value: 'vscode', description: 'Microsoft Visual Studio Code' },
        { name: 'Windsurf', value: 'windsurf', description: 'AI-powered development environment' },
        { name: 'Generic AI', value: 'generic', description: 'Generic AI assistant integration' }
      ];

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'ide',
          message: 'Select your target IDE:',
          choices: ides.map(ide => ({
            name: `${ide.name} - ${ide.description}`,
            value: ide.value
          }))
        }
      ]);
      
      targetIde = answer.ide;
    }

    console.log(chalk.cyan(`\nTarget IDE: ${targetIde}`));
    
    // Integration method selection
    let integrationMethod = 'mcp';
    if (options.standalone) {
      integrationMethod = 'standalone';
    } else if (!options.mcp) {
      const methodAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: 'Select integration method:',
          choices: [
            { name: 'MCP Integration (Recommended) - Automatic setup with protocol support', value: 'mcp' },
            { name: 'Standalone Integration - Manual setup with generated configuration files', value: 'standalone' }
          ]
        }
      ]);
      integrationMethod = methodAnswer.method;
    }

    console.log(chalk.cyan(`Integration Method: ${integrationMethod.toUpperCase()}\n`));

    // Perform integration
    await performIntegration(targetIde, integrationMethod, projectDirectory);
    
  } catch (error) {
    console.error(chalk.red('✗'), 'Integration failed:', error.message);
    process.exit(1);
  }
}

async function performIntegration(ide, method, projectDirectory) {
  const spinner = ora('Setting up integration...').start();
  
  try {
    // Create integration configuration
    const integrationConfig = await generateIntegrationConfig(ide, method, projectDirectory);
    
    // IDE-specific setup
    switch (ide) {
      case 'claude-code':
        await setupClaudeCode(integrationConfig, method, projectDirectory);
        break;
      case 'cursor':
        await setupCursor(integrationConfig, method, projectDirectory);
        break;
      case 'vscode':
        await setupVSCode(integrationConfig, method, projectDirectory);
        break;
      case 'windsurf':
        await setupWindsurf(integrationConfig, method, projectDirectory);
        break;
      case 'generic':
        await setupGeneric(integrationConfig, projectDirectory);
        break;
      default:
        throw new Error(`Unsupported IDE: ${ide}`);
    }
    
    spinner.succeed('Integration setup completed!');
    
    // Display success message and next steps
    console.log(boxen(
      `✅ Super Agents integration for ${ide.toUpperCase()} is ready!\n\n` +
      `Integration Method: ${method.toUpperCase()}\n` +
      `Configuration saved to appropriate locations\n\n` +
      `Next Steps:\n` +
      `1. Restart your IDE to load the new configuration\n` +
      `2. Run "sa doctor --component=ide-integration" to verify\n` +
      `3. Test the integration with a simple command`,
      {
        title: 'Integration Complete',
        titleAlignment: 'center',
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));
    
  } catch (error) {
    spinner.fail('Integration setup failed');
    throw error;
  }
}

async function generateIntegrationConfig(ide, method, projectDirectory) {
  // Load the Super Agents installation info
  const installationFile = join(projectDirectory, '.super-agents/installation.json');
  let installationInfo = {};
  
  if (existsSync(installationFile)) {
    const { readFile } = await import('fs/promises');
    installationInfo = JSON.parse(await readFile(installationFile, 'utf8'));
  }
  
  return {
    ide,
    method,
    timestamp: new Date().toISOString(),
    projectDirectory,
    serverConfig: {
      name: 'super-agents',
      command: 'node',
      args: [installationInfo.mcpServerPath || resolve('./sa-engine/mcp-server/index.js')],
      env: {
        SA_PROJECT_ROOT: projectDirectory
      }
    },
    tools: [
      'sa-get-task',
      'sa-list-tasks', 
      'sa-create-story',
      'sa-implement-story',
      'sa-research',
      'sa-generate-prd',
      'sa-create-architecture'
    ]
  };
}

async function setupClaudeCode(config, method, projectDirectory) {
  if (method === 'mcp') {
    console.log(chalk.cyan('\nRunning full Claude Code integration...'));
    
    const integrator = new ClaudeCodeIntegrator({
      projectRoot: projectDirectory, // Use the detected project directory
      logLevel: 'info', // Or get from options
      standaloneMode: false,
      autoGenerateCommands: true,
      includeHooks: true
    });

    await integrator.initialize();
    
    const status = integrator.getIntegrationStatus();
    
    console.log(chalk.green(`\n✓ Claude Code integration successful!`));
    console.log(`  - Tools registered: ${status.toolCount}`);
    console.log(`  - Files generated: ${status.generatedFiles}`);
    console.log(`  - See CLAUDE.md for usage instructions.`);

  } else {
    // The standalone logic can be updated to use StandaloneSetup.js later if needed.
    // For now, keep the existing behavior for standalone.
    await generateStandaloneInstructions('claude-code', config, projectDirectory);
  }
}

async function setupCursor(config, method, projectDirectory) {
  if (method === 'mcp') {
    // Create Cursor MCP configuration  
    const cursorConfigDir = join(projectDirectory, '.cursor');
    const cursorConfigPath = join(cursorConfigDir, 'settings.json');
    
    if (!existsSync(cursorConfigDir)) {
      await mkdir(cursorConfigDir, { recursive: true });
    }
    
    const mcpConfig = {
      "mcp.servers": {
        [config.serverConfig.name]: {
          "command": config.serverConfig.command,
          "args": config.serverConfig.args,
          "env": config.serverConfig.env
        }
      }
    };
    
    // Merge with existing config
    if (existsSync(cursorConfigPath)) {
      try {
        const existingConfig = JSON.parse(await readFile(cursorConfigPath, 'utf8'));
        existingConfig["mcp.servers"] = existingConfig["mcp.servers"] || {};
        existingConfig["mcp.servers"][config.serverConfig.name] = mcpConfig["mcp.servers"][config.serverConfig.name];
        await writeFile(cursorConfigPath, JSON.stringify(existingConfig, null, 2));
      } catch (error) {
        await writeFile(cursorConfigPath, JSON.stringify(mcpConfig, null, 2));
      }
    } else {
      await writeFile(cursorConfigPath, JSON.stringify(mcpConfig, null, 2));
    }
    
    console.log(chalk.green(`✓ Cursor MCP configuration saved to ${cursorConfigPath}`));
  } else {
    await generateStandaloneInstructions('cursor', config, projectDirectory);
  }
}

async function setupVSCode(config, method, projectDirectory) {
  if (method === 'mcp') {
    // VS Code MCP setup (would require extension)
    console.log(chalk.yellow('⚠️  VS Code MCP integration requires the Super Agents extension'));
    console.log(chalk.cyan('Installing extension automatically...'));
    
    // Generate workspace settings
    const vscodeDir = join(projectDirectory, '.vscode');
    const settingsPath = join(vscodeDir, 'settings.json');
    
    if (!existsSync(vscodeDir)) {
      await mkdir(vscodeDir, { recursive: true });
    }
    
    const vscodeSettings = {
      "super-agents.mcp.enabled": true,
      "super-agents.mcp.server": config.serverConfig,
      "super-agents.tools.enabled": config.tools
    };
    
    // Merge with existing settings
    if (existsSync(settingsPath)) {
      try {
        const existingSettings = JSON.parse(await readFile(settingsPath, 'utf8'));
        Object.assign(existingSettings, vscodeSettings);
        await writeFile(settingsPath, JSON.stringify(existingSettings, null, 2));
      } catch (error) {
        await writeFile(settingsPath, JSON.stringify(vscodeSettings, null, 2));
      }
    } else {
      await writeFile(settingsPath, JSON.stringify(vscodeSettings, null, 2));
    }
    
    console.log(chalk.green(`✓ VS Code workspace settings saved to ${settingsPath}`));
  } else {
    await generateStandaloneInstructions('vscode', config, projectDirectory);
  }
}

async function setupWindsurf(config, method, projectDirectory) {
  if (method === 'mcp') {
    // Create Windsurf MCP configuration
    const windsurfConfigPath = join(projectDirectory, 'windsurf-mcp.json');
    
    const mcpConfig = {
      "mcp_servers": {
        [config.serverConfig.name]: {
          "command": config.serverConfig.command,
          "args": config.serverConfig.args,
          "env": config.serverConfig.env,
          "description": "Super Agents AI-powered development framework"
        }
      }
    };
    
    await writeFile(windsurfConfigPath, JSON.stringify(mcpConfig, null, 2));
    console.log(chalk.green(`✓ Windsurf MCP configuration saved to ${windsurfConfigPath}`));
  } else {
    await generateStandaloneInstructions('windsurf', config, projectDirectory);
  }
}

async function setupGeneric(config, projectDirectory) {
  await generateStandaloneInstructions('generic', config, projectDirectory);
}

async function generateStandaloneInstructions(ide, config, projectDirectory) {
  const instructionsPath = join(projectDirectory || '.', `super-agents-${ide}-setup.md`);
  
  const instructions = `# Super Agents Integration for ${ide.toUpperCase()}

## Setup Instructions

### Manual Integration Steps:

1. **MCP Server Setup**
   - Server Command: \`${config.serverConfig.command}\`
   - Arguments: \`${config.serverConfig.args.join(' ')}\`
   - Working Directory: \`${process.cwd()}\`

2. **Environment Variables**
   ${Object.entries(config.serverConfig.env).map(([key, value]) => `   - ${key}=${value}`).join('\n')}

3. **Available Tools**
   ${config.tools.map(tool => `   - ${tool}`).join('\n')}

### IDE-Specific Configuration:

${getIdeSpecificInstructions(ide)}

### Testing the Integration:

1. Start your IDE
2. Try running a Super Agents command like "List all tasks"
3. Verify the MCP server responds correctly

### Troubleshooting:

- Ensure Node.js is installed and accessible
- Verify the MCP server file exists at: \`${resolve('./sa-engine/mcp-server/index.js')}\`
- Check that environment variables are set correctly
- Run \`sa doctor --component=ide-integration\` for diagnostics

### Support:

For additional help, run \`sa doctor\` or check the documentation.

---
Generated on ${new Date().toLocaleString()}
`;

  await writeFile(instructionsPath, instructions);
  console.log(chalk.green(`✓ Setup instructions saved to ${instructionsPath}`));
}

function getIdeSpecificInstructions(ide) {
  const instructions = {
    'claude-code': `
**Claude Code Configuration:**
- Copy the MCP server configuration to your Claude Code settings
- Restart Claude Code to load the new MCP server
- The Super Agents tools should appear in the tools panel`,

    'cursor': `
**Cursor Configuration:**
- Add the MCP server configuration to your Cursor settings
- Enable MCP protocol in Cursor preferences
- Restart Cursor to activate the integration`,

    'vscode': `
**VS Code Configuration:**
- Install the Super Agents VS Code extension (if available)
- Configure the extension settings to point to the MCP server
- Reload VS Code window to activate the extension`,

    'windsurf': `
**Windsurf Configuration:**
- Import the generated windsurf-mcp.json configuration
- Enable MCP servers in Windsurf settings
- Restart Windsurf to load the Super Agents tools`,

    'generic': `
**Generic AI Assistant Configuration:**
- Configure your AI assistant to use the MCP protocol
- Point to the Super Agents MCP server endpoint
- Enable the listed tools in your assistant's configuration`
  };

  return instructions[ide] || instructions['generic'];
}

// Helper function to detect if current directory is a Super Agents project
async function detectProjectDirectory() {
  const currentDir = process.cwd();
  
  // Check if current directory has Super Agents project
  const installationFile = join(currentDir, '.super-agents/installation.json');
  if (existsSync(installationFile)) {
    return currentDir;
  }
  
  // Check parent directories up to 3 levels
  let checkDir = currentDir;
  for (let i = 0; i < 3; i++) {
    const parentDir = dirname(checkDir);
    if (parentDir === checkDir) break; // Reached root
    
    checkDir = parentDir;
    const parentInstallationFile = join(checkDir, '.super-agents/installation.json');
    if (existsSync(parentInstallationFile)) {
      return checkDir;
    }
  }
  
  return null; // No Super Agents project found
}