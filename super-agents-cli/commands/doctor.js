import chalk from 'chalk';
import { existsSync, statSync } from 'fs';
import { readFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';

export async function doctorCommand(options) {
  try {
    console.log(chalk.blue('🏥 Super Agents Health Check\n'));

    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };

    // Component-specific checks
    if (options.component) {
      await runComponentCheck(options.component, results, options.verbose);
    } else {
      // Run all checks
      await runAllChecks(results, options.verbose);
    }

    // Summary
    console.log(chalk.blue('\n📋 Health Check Summary'));
    console.log(`${chalk.green('✓')} Passed: ${results.passed}`);
    console.log(`${chalk.red('✗')} Failed: ${results.failed}`);
    console.log(`${chalk.yellow('⚠')} Warnings: ${results.warnings}`);

    if (results.issues.length > 0) {
      console.log(chalk.yellow('\n🔧 Issues Found:'));
      results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.severity === 'error' ? chalk.red('ERROR') : chalk.yellow('WARNING')}: ${issue.description}`);
        if (issue.solution) {
          console.log(`   ${chalk.gray('Solution:')} ${issue.solution}`);
        }
      });

      console.log(chalk.blue('\n💡 Run "sa repair" to automatically fix some of these issues.'));
    } else {
      console.log(chalk.green('\n🎉 All systems are healthy!'));
    }

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(chalk.red('✗'), 'Health check failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function runAllChecks(results, verbose) {
  await checkProjectInitialization(results, verbose);
  await checkConfiguration(results, verbose);
  await checkMcpServer(results, verbose);
  await checkAgents(results, verbose);
  await checkApiConnectivity(results, verbose);
  await checkFileSystem(results, verbose);
  await checkDependencies(results, verbose);
}

async function runComponentCheck(component, results, verbose) {
  switch (component) {
    case 'mcp-server':
      await checkMcpServer(results, verbose);
      break;
    case 'agents':
      await checkAgents(results, verbose);
      break;
    case 'configuration':
      await checkConfiguration(results, verbose);
      break;
    case 'ide-integration':
      await checkIdeIntegration(results, verbose);
      break;
    default:
      throw new Error(`Unknown component: ${component}`);
  }
}

async function checkProjectInitialization(results, verbose) {
  console.log(chalk.cyan('🏁 Checking Project Initialization...'));
  
  try {
    const stateManager = new StateManager();
    const isInitialized = await stateManager.isInitialized();
    
    if (isInitialized) {
      console.log(`${chalk.green('✓')} Project is initialized`);
      results.passed++;
      
      const state = await stateManager.loadState();
      if (verbose) {
        console.log(`  ${chalk.gray('Project:')} ${state.project.name}`);
        console.log(`  ${chalk.gray('Type:')} ${state.project.type}`);
        console.log(`  ${chalk.gray('Created:')} ${new Date(state.project.created_at).toLocaleDateString()}`);
      }
    } else {
      console.log(`${chalk.red('✗')} Project not initialized`);
      results.failed++;
      results.issues.push({
        severity: 'error',
        description: 'Super Agents project not initialized',
        solution: 'Run "sa init" to initialize the project'
      });
    }
  } catch (error) {
    console.log(`${chalk.red('✗')} Failed to check project initialization: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `Project initialization check failed: ${error.message}`,
      solution: 'Check project structure and permissions'
    });
  }
}

async function checkConfiguration(results, verbose) {
  console.log(chalk.cyan('⚙️  Checking Configuration...'));
  
  try {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();
    
    console.log(`${chalk.green('✓')} Configuration loaded successfully`);
    results.passed++;
    
    if (verbose) {
      console.log(`  ${chalk.gray('Config path:')} ${configManager.getConfigPath()}`);
      console.log(`  ${chalk.gray('AI Provider:')} ${config.super_agents.ai.providers.primary}`);
      console.log(`  ${chalk.gray('Workflow:')} ${config.super_agents.methodology.workflow_type}`);
    }
    
    // Check API keys
    const apiKeys = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];
    let hasApiKey = false;
    
    for (const key of apiKeys) {
      if (process.env[key]) {
        console.log(`${chalk.green('✓')} ${key} is set`);
        hasApiKey = true;
        results.passed++;
      } else {
        console.log(`${chalk.yellow('⚠')} ${key} not set`);
        results.warnings++;
        results.issues.push({
          severity: 'warning',
          description: `${key} environment variable not set`,
          solution: `Set ${key} in your environment or .env file`
        });
      }
    }
    
    if (!hasApiKey) {
      results.issues.push({
        severity: 'error',
        description: 'No API keys configured',
        solution: 'Set at least one AI provider API key (ANTHROPIC_API_KEY or OPENAI_API_KEY)'
      });
      results.failed++;
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} Configuration check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `Configuration loading failed: ${error.message}`,
      solution: 'Check configuration file syntax and permissions'
    });
  }
}

async function checkMcpServer(results, verbose) {
  console.log(chalk.cyan('🔌 Checking MCP Server...'));
  
  try {
    // Check if MCP server file exists
    const mcpServerPath = resolve('./sa-engine/mcp-server/index.js');
    
    if (existsSync(mcpServerPath)) {
      console.log(`${chalk.green('✓')} MCP server file exists`);
      results.passed++;
      
      if (verbose) {
        console.log(`  ${chalk.gray('Path:')} ${mcpServerPath}`);
        const stats = statSync(mcpServerPath);
        console.log(`  ${chalk.gray('Size:')} ${stats.size} bytes`);
        console.log(`  ${chalk.gray('Modified:')} ${stats.mtime.toLocaleDateString()}`);
      }
      
      // Check tools directory
      const toolsPath = resolve('./sa-engine/mcp-server/tools');
      if (existsSync(toolsPath)) {
        console.log(`${chalk.green('✓')} MCP tools directory exists`);
        results.passed++;
      } else {
        console.log(`${chalk.yellow('⚠')} MCP tools directory missing`);
        results.warnings++;
        results.issues.push({
          severity: 'warning',
          description: 'MCP tools directory not found',
          solution: 'Ensure sa-engine/mcp-server/tools directory exists'
        });
      }
      
    } else {
      console.log(`${chalk.red('✗')} MCP server file not found`);
      results.failed++;
      results.issues.push({
        severity: 'error',
        description: 'MCP server file missing',
        solution: 'Ensure sa-engine/mcp-server/index.js exists'
      });
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} MCP server check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `MCP server check failed: ${error.message}`,
      solution: 'Check MCP server installation and file permissions'
    });
  }
}

async function checkAgents(results, verbose) {
  console.log(chalk.cyan('🤖 Checking Agents...'));
  
  try {
    const agentsPath = resolve('./sa-engine/agents');
    
    if (existsSync(agentsPath)) {
      console.log(`${chalk.green('✓')} Agents directory exists`);
      results.passed++;
      
      // Check for agent configuration files
      const agentTypes = ['analyst', 'pm', 'architect', 'developer', 'qa', 'ux-expert', 'product-owner', 'scrum-master'];
      let foundAgents = 0;
      
      for (const agentType of agentTypes) {
        const agentConfigPath = join(agentsPath, `${agentType}.json`);
        if (existsSync(agentConfigPath)) {
          foundAgents++;
          if (verbose) {
            console.log(`  ${chalk.green('✓')} ${agentType} configuration found`);
          }
        }
      }
      
      if (foundAgents > 0) {
        console.log(`${chalk.green('✓')} Found ${foundAgents} agent configurations`);
        results.passed++;
      } else {
        console.log(`${chalk.yellow('⚠')} No agent configurations found`);
        results.warnings++;
        results.issues.push({
          severity: 'warning',
          description: 'No agent configuration files found',
          solution: 'Ensure agent configuration files exist in sa-engine/agents/'
        });
      }
      
    } else {
      console.log(`${chalk.red('✗')} Agents directory not found`);
      results.failed++;
      results.issues.push({
        severity: 'error',
        description: 'Agents directory missing',
        solution: 'Ensure sa-engine/agents directory exists'
      });
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} Agents check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `Agents check failed: ${error.message}`,
      solution: 'Check agents directory and file permissions'
    });
  }
}

async function checkApiConnectivity(results, verbose) {
  console.log(chalk.cyan('🌐 Checking API Connectivity...'));
  
  // This is a basic connectivity check - in a real implementation,
  // you might want to make actual API calls to test connectivity
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      // For now, just check if the key format looks valid
      if (process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
        console.log(`${chalk.green('✓')} Anthropic API key format looks valid`);
        results.passed++;
      } else {
        console.log(`${chalk.yellow('⚠')} Anthropic API key format may be invalid`);
        results.warnings++;
        results.issues.push({
          severity: 'warning',
          description: 'Anthropic API key format appears invalid',
          solution: 'Verify your Anthropic API key is correct'
        });
      }
    }
    
    if (process.env.OPENAI_API_KEY) {
      if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
        console.log(`${chalk.green('✓')} OpenAI API key format looks valid`);
        results.passed++;
      } else {
        console.log(`${chalk.yellow('⚠')} OpenAI API key format may be invalid`);
        results.warnings++;
        results.issues.push({
          severity: 'warning',
          description: 'OpenAI API key format appears invalid',
          solution: 'Verify your OpenAI API key is correct'
        });
      }
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} API connectivity check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `API connectivity check failed: ${error.message}`,
      solution: 'Check network connection and API key configuration'
    });
  }
}

async function checkFileSystem(results, verbose) {
  console.log(chalk.cyan('📁 Checking File System...'));
  
  try {
    const requiredPaths = [
      'sa-engine',
      'sa-engine/state-manager',
      'sa-engine/config',
      'sa-engine/utils',
      'super-agents-cli'
    ];
    
    for (const path of requiredPaths) {
      if (existsSync(path)) {
        if (verbose) {
          console.log(`  ${chalk.green('✓')} ${path} exists`);
        }
        results.passed++;
      } else {
        console.log(`${chalk.red('✗')} Required directory missing: ${path}`);
        results.failed++;
        results.issues.push({
          severity: 'error',
          description: `Required directory missing: ${path}`,
          solution: `Ensure ${path} directory exists and is accessible`
        });
      }
    }
    
    console.log(`${chalk.green('✓')} File system check completed`);
    
  } catch (error) {
    console.log(`${chalk.red('✗')} File system check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `File system check failed: ${error.message}`,
      solution: 'Check file system permissions and directory structure'
    });
  }
}

async function checkDependencies(results, verbose) {
  console.log(chalk.cyan('📦 Checking Dependencies...'));
  
  try {
    // Check package.json
    const packageJsonPath = './package.json';
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
      console.log(`${chalk.green('✓')} package.json found`);
      results.passed++;
      
      if (verbose) {
        console.log(`  ${chalk.gray('Name:')} ${packageJson.name}`);
        console.log(`  ${chalk.gray('Version:')} ${packageJson.version}`);
      }
      
      // Check for critical dependencies
      const criticalDeps = ['commander', 'chalk'];
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const dep of criticalDeps) {
        if (dependencies[dep]) {
          if (verbose) {
            console.log(`  ${chalk.green('✓')} ${dep}: ${dependencies[dep]}`);
          }
          results.passed++;
        } else {
          console.log(`${chalk.yellow('⚠')} Missing dependency: ${dep}`);
          results.warnings++;
          results.issues.push({
            severity: 'warning',
            description: `Missing dependency: ${dep}`,
            solution: `Run "npm install ${dep}" to install missing dependency`
          });
        }
      }
      
    } else {
      console.log(`${chalk.red('✗')} package.json not found`);
      results.failed++;
      results.issues.push({
        severity: 'error',
        description: 'package.json file missing',
        solution: 'Ensure you are in a valid Node.js project directory'
      });
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} Dependencies check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `Dependencies check failed: ${error.message}`,
      solution: 'Check package.json file and run npm install'
    });
  }
}

async function checkIdeIntegration(results, verbose) {
  console.log(chalk.cyan('🔗 Checking IDE Integration...'));
  
  try {
    // Check for MCP configuration files
    const mcpConfigPaths = [
      './.claude/config.json',
      './mcp-config.json',
      './.cursor/config.json'
    ];
    
    let foundConfig = false;
    for (const configPath of mcpConfigPaths) {
      if (existsSync(configPath)) {
        console.log(`${chalk.green('✓')} IDE configuration found: ${configPath}`);
        foundConfig = true;
        results.passed++;
        
        if (verbose) {
          try {
            const config = JSON.parse(await readFile(configPath, 'utf8'));
            if (config.mcpServers && config.mcpServers['super-agents']) {
              console.log(`  ${chalk.green('✓')} Super Agents MCP server configured`);
            }
          } catch (e) {
            console.log(`  ${chalk.yellow('⚠')} Config file exists but may be invalid JSON`);
          }
        }
        break;
      }
    }
    
    if (!foundConfig) {
      console.log(`${chalk.yellow('⚠')} No IDE configuration found`);
      results.warnings++;
      results.issues.push({
        severity: 'warning',
        description: 'No IDE integration configuration found',
        solution: 'Run "sa integrate --ide=<your-ide>" to set up IDE integration'
      });
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} IDE integration check failed: ${error.message}`);
    results.failed++;
    results.issues.push({
      severity: 'error',
      description: `IDE integration check failed: ${error.message}`,
      solution: 'Check IDE configuration files and permissions'
    });
  }
}