import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';
import { copyDirectoryRecursive, findSuperAgentsInstallation, verifyDirectoryContent } from '../utils/fileUtils.js';

export async function repairCommand(options) {
  try {
    console.log(chalk.blue('🔧 Super Agents Repair Tool\n'));

    const repairs = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: []
    };

    // Issue-specific repairs
    if (options.issue) {
      await runSpecificRepair(options.issue, repairs);
    } else {
      // Run automatic issue detection and repair
      await runAutoRepair(repairs);
    }

    // Summary
    console.log(chalk.blue('\n🔧 Repair Summary'));
    console.log(`${chalk.green('✓')} Successful: ${repairs.successful}`);
    console.log(`${chalk.red('✗')} Failed: ${repairs.failed}`);
    console.log(`${chalk.yellow('⚠')} Skipped: ${repairs.skipped}`);

    if (repairs.results.length > 0) {
      console.log(chalk.blue('\n📋 Repair Results:'));
      repairs.results.forEach((result, index) => {
        const icon = result.success ? chalk.green('✓') : result.skipped ? chalk.yellow('⚠') : chalk.red('✗');
        console.log(`${index + 1}. ${icon} ${result.description}`);
        if (result.details) {
          console.log(`   ${chalk.gray(result.details)}`);
        }
      });
    }

    if (repairs.successful > 0) {
      console.log(chalk.green('\n🎉 Some issues were resolved! Run "sa doctor" to verify.'));
    }

    // Exit with appropriate code
    process.exit(repairs.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(chalk.red('✗'), 'Repair failed:', error.message);
    process.exit(1);
  }
}

async function runAutoRepair(repairs) {
  console.log(chalk.cyan('🔍 Detecting and repairing issues automatically...\n'));
  
  await repairProjectStructure(repairs);
  await repairConfiguration(repairs);
  await repairMcpServer(repairs);
  await repairAgents(repairs);
  await repairApiConnectivity(repairs);
}

async function runSpecificRepair(issue, repairs) {
  console.log(chalk.cyan(`🔍 Repairing specific issue: ${issue}\n`));
  
  switch (issue) {
    case 'configuration':
      await repairConfiguration(repairs);
      break;
    case 'api-connectivity':
      await repairApiConnectivity(repairs);
      break;
    case 'mcp-server':
      await repairMcpServer(repairs);
      break;
    case 'project-structure':
      await repairProjectStructure(repairs);
      break;
    case 'agents':
      await repairAgents(repairs);
      break;
    default:
      throw new Error(`Unknown repair issue: ${issue}`);
  }
}

async function repairProjectStructure(repairs) {
  console.log(chalk.cyan('📁 Repairing project structure...'));
  
  try {
    // Find the source sa-engine installation
    const sourceSaEngine = await findSuperAgentsInstallation(import.meta.url);
    const targetSaEngine = resolve('./sa-engine');
    
    console.log(chalk.gray(`Source sa-engine: ${sourceSaEngine}`));
    console.log(chalk.gray(`Target sa-engine: ${targetSaEngine}`));
    
    // Check if sa-engine directory exists
    if (!existsSync(targetSaEngine)) {
      // Copy the complete sa-engine directory
      console.log(chalk.cyan('Copying complete sa-engine directory...'));
      const copyResults = await copyDirectoryRecursive(sourceSaEngine, targetSaEngine, {
        overwrite: false,
        verbose: false,
        exclude: ['.git', 'node_modules', '.DS_Store', 'Thumbs.db', 'logs', '*.log']
      });
      
      console.log(`${chalk.green('✓')} Copied ${copyResults.copied} files to sa-engine/`);
      repairs.successful++;
      repairs.attempted++;
      repairs.results.push({
        success: true,
        description: `Copied complete sa-engine directory (${copyResults.copied} files)`,
        details: copyResults.errors.length > 0 ? `${copyResults.errors.length} copy errors occurred` : 'All files copied successfully'
      });
      
      if (copyResults.errors.length > 0) {
        console.log(chalk.yellow(`⚠ ${copyResults.errors.length} copy errors occurred`));
        repairs.results.push({
          success: false,
          description: `Copy errors occurred for ${copyResults.errors.length} files`,
          details: copyResults.errors.slice(0, 3).map(e => `${e.item}: ${e.error}`).join('; ')
        });
      }
    } else {
      // sa-engine exists, check for missing/empty critical directories and files
      const criticalDirs = [
        'agents',
        'mcp-server',
        'mcp-server/tools',
        'templates',
        'config',
        'state-manager'
      ];
      
      let repairedItems = 0;
      
      for (const dir of criticalDirs) {
        const targetDir = join(targetSaEngine, dir);
        const sourceDir = join(sourceSaEngine, dir);
        
        if (!existsSync(targetDir) || (existsSync(targetDir) && (await readdir(targetDir)).length === 0)) {
          if (existsSync(sourceDir)) {
            console.log(chalk.cyan(`Repairing directory: ${dir}`));
            const copyResults = await copyDirectoryRecursive(sourceDir, targetDir, {
              overwrite: true,
              verbose: false
            });
            
            console.log(`${chalk.green('✓')} Repaired ${dir} (${copyResults.copied} files)`);
            repairedItems++;
            repairs.results.push({
              success: true,
              description: `Repaired ${dir} directory (${copyResults.copied} files)`
            });
          }
        }
      }
      
      if (repairedItems > 0) {
        repairs.successful++;
        repairs.attempted++;
      } else {
        repairs.skipped++;
        repairs.attempted++;
        repairs.results.push({
          skipped: true,
          description: 'Project structure is already complete'
        });
      }
    }
    
    // Verify critical files are present and not empty
    const criticalFiles = [
      'agents/analyst.json',
      'agents/developer.json',
      'agents/pm.json',
      'mcp-server/index.js',
      'mcp-server/tools/tools-schema.json'
    ];
    
    const verification = await verifyDirectoryContent(targetSaEngine, criticalFiles);
    if (!verification.valid) {
      console.log(chalk.yellow(`⚠ Some critical files may be missing or empty: ${verification.emptyFiles.join(', ')}`));
      repairs.results.push({
        success: false,
        description: 'Some critical files are missing or empty',
        details: verification.emptyFiles.join(', ')
      });
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} Project structure repair failed: ${error.message}`);
    repairs.failed++;
    repairs.attempted++;
    repairs.results.push({
      success: false,
      description: 'Project structure repair failed',
      details: error.message
    });
  }
}

async function repairConfiguration(repairs) {
  console.log(chalk.cyan('⚙️  Repairing configuration...'));
  
  try {
    const configManager = new ConfigManager();
    
    // Check if config exists
    if (!existsSync(configManager.getConfigPath())) {
      // Create default configuration
      const defaultConfig = {
        super_agents: {
          version: "1.0.0",
          methodology: {
            workflow_type: "agile-ai",
            default_agents: ["analyst", "pm", "architect", "developer", "qa"],
            quality_gates: true
          },
          ai: {
            providers: {
              primary: "anthropic",
              fallback: "openai"
            },
            models: {
              anthropic: "claude-3-sonnet-20240229",
              openai: "gpt-4"
            }
          },
          integrations: {
            mcp_enabled: true,
            cli_enabled: true
          },
          workspace: {
            docs_dir: "docs/",
            tasks_dir: ".super-agents/tasks/",
            state_file: ".super-agents/state.json"
          },
          project: {
            type: "fullstack",
            initialized: false
          }
        }
      };
      
      // Ensure config directory exists
      const configDir = dirname(configManager.getConfigPath());
      if (!existsSync(configDir)) {
        await mkdir(configDir, { recursive: true });
      }
      
      await writeFile(configManager.getConfigPath(), JSON.stringify(defaultConfig, null, 2));
      console.log(`${chalk.green('✓')} Created default configuration`);
      repairs.successful++;
      repairs.results.push({
        success: true,
        description: 'Created default configuration file',
        details: `Configuration saved to: ${configManager.getConfigPath()}`
      });
    } else {
      // Validate existing configuration
      try {
        await configManager.loadConfig();
        console.log(`${chalk.green('✓')} Configuration file is valid`);
        repairs.skipped++;
        repairs.results.push({
          skipped: true,
          description: 'Configuration file already exists and is valid'
        });
      } catch (error) {
        console.log(`${chalk.yellow('⚠')} Configuration file exists but may be invalid`);
        repairs.failed++;
        repairs.results.push({
          success: false,
          description: 'Configuration file exists but is invalid',
          details: `Error: ${error.message}`
        });
      }
    }
    repairs.attempted++;
    
  } catch (error) {
    console.log(`${chalk.red('✗')} Configuration repair failed: ${error.message}`);
    repairs.failed++;
    repairs.results.push({
      success: false,
      description: 'Configuration repair failed',
      details: error.message
    });
  }
}

async function repairMcpServer(repairs) {
  console.log(chalk.cyan('🔌 Repairing MCP server...'));
  
  try {
    // Find the source sa-engine installation
    const sourceSaEngine = await findSuperAgentsInstallation(import.meta.url);
    const sourceMcpServerDir = join(sourceSaEngine, 'mcp-server');
    const targetMcpServerDir = resolve('./sa-engine/mcp-server');
    
    if (!existsSync(sourceMcpServerDir)) {
      console.log(chalk.yellow('⚠ Source MCP server directory not found, cannot repair MCP server'));
      repairs.failed++;
      repairs.attempted++;
      repairs.results.push({
        success: false,
        description: 'Source MCP server directory not found',
        details: `Expected at: ${sourceMcpServerDir}`
      });
      return;
    }
    
    const mcpServerIndexPath = join(targetMcpServerDir, 'index.js');
    const toolsDir = join(targetMcpServerDir, 'tools');
    
    let repairedItems = 0;
    
    // Check if MCP server index file exists and has substantial content
    if (!existsSync(mcpServerIndexPath)) {
      console.log(chalk.cyan('Copying MCP server index.js...'));
      // Ensure directory exists
      if (!existsSync(targetMcpServerDir)) {
        await mkdir(targetMcpServerDir, { recursive: true });
      }
      
      const sourceIndexPath = join(sourceMcpServerDir, 'index.js');
      if (existsSync(sourceIndexPath)) {
        const sourceContent = await readFile(sourceIndexPath, 'utf8');
        await writeFile(mcpServerIndexPath, sourceContent);
        console.log(`${chalk.green('✓')} Repaired MCP server index.js`);
        repairedItems++;
        repairs.results.push({
          success: true,
          description: 'Repaired MCP server index.js'
        });
      }
    }
    
    // Check if tools directory exists and has content
    if (!existsSync(toolsDir) || (existsSync(toolsDir) && (await readdir(toolsDir)).length === 0)) {
      console.log(chalk.cyan('Copying MCP server tools...'));
      const sourceToolsDir = join(sourceMcpServerDir, 'tools');
      
      if (existsSync(sourceToolsDir)) {
        const copyResults = await copyDirectoryRecursive(sourceToolsDir, toolsDir, {
          overwrite: true,
          verbose: false
        });
        
        console.log(`${chalk.green('✓')} Repaired MCP server tools (${copyResults.copied} files)`);
        repairedItems++;
        repairs.results.push({
          success: true,
          description: `Repaired MCP server tools (${copyResults.copied} files)`
        });
      }
    }
    
    // Check for other critical MCP server files
    const criticalFiles = ['MCPServer.js', 'ToolRegistry.js'];
    for (const file of criticalFiles) {
      const targetFile = join(targetMcpServerDir, file);
      const sourceFile = join(sourceMcpServerDir, file);
      
      if (!existsSync(targetFile) && existsSync(sourceFile)) {
        const sourceContent = await readFile(sourceFile, 'utf8');
        await writeFile(targetFile, sourceContent);
        console.log(`${chalk.green('✓')} Repaired ${file}`);
        repairedItems++;
        repairs.results.push({
          success: true,
          description: `Repaired ${file}`
        });
      }
    }
    
    if (repairedItems > 0) {
      repairs.successful++;
      console.log(`${chalk.green('✓')} Repaired ${repairedItems} MCP server components`);
    } else {
      repairs.skipped++;
      repairs.results.push({
        skipped: true,
        description: 'MCP server is already complete'
      });
    }
    
    repairs.attempted++;
    
  } catch (error) {
    console.log(`${chalk.red('✗')} MCP server repair failed: ${error.message}`);
    repairs.failed++;
    repairs.results.push({
      success: false,
      description: 'MCP server repair failed',
      details: error.message
    });
  }
}

async function repairAgents(repairs) {
  console.log(chalk.cyan('🤖 Repairing agents...'));
  
  try {
    // Find the source sa-engine installation
    const sourceSaEngine = await findSuperAgentsInstallation(import.meta.url);
    const sourceAgentsDir = join(sourceSaEngine, 'agents');
    const targetAgentsDir = resolve('./sa-engine/agents');
    
    if (!existsSync(sourceAgentsDir)) {
      console.log(chalk.yellow('⚠ Source agents directory not found, cannot repair agents'));
      repairs.failed++;
      repairs.attempted++;
      repairs.results.push({
        success: false,
        description: 'Source agents directory not found',
        details: `Expected at: ${sourceAgentsDir}`
      });
      return;
    }
    
    // Ensure target agents directory exists
    if (!existsSync(targetAgentsDir)) {
      await mkdir(targetAgentsDir, { recursive: true });
    }
    
    // Get list of agent files from source
    const sourceAgentFiles = await readdir(sourceAgentsDir);
    const agentJsonFiles = sourceAgentFiles.filter(file => file.endsWith('.json'));
    
    let repairedAgents = 0;
    let skippedAgents = 0;
    
    for (const agentFile of agentJsonFiles) {
      try {
        const sourceAgentPath = join(sourceAgentsDir, agentFile);
        const targetAgentPath = join(targetAgentsDir, agentFile);
        
        // Check if agent file exists and has content
        let needsRepair = false;
        
        if (!existsSync(targetAgentPath)) {
          needsRepair = true;
        } else {
          // Check if file is empty or has minimal content
          const targetContent = await readFile(targetAgentPath, 'utf8');
          if (targetContent.trim().length < 100) { // Likely a minimal template
            needsRepair = true;
          }
        }
        
        if (needsRepair) {
          // Copy the complete agent configuration from source
          const sourceContent = await readFile(sourceAgentPath, 'utf8');
          await writeFile(targetAgentPath, sourceContent);
          
          const agentName = agentFile.replace('.json', '');
          console.log(`${chalk.green('✓')} Repaired ${agentName} agent configuration`);
          repairedAgents++;
          repairs.results.push({
            success: true,
            description: `Repaired ${agentName} agent configuration`
          });
        } else {
          skippedAgents++;
          const agentName = agentFile.replace('.json', '');
          repairs.results.push({
            skipped: true,
            description: `${agentName} agent configuration already complete`
          });
        }
        
        repairs.attempted++;
        
      } catch (error) {
        const agentName = agentFile.replace('.json', '');
        console.log(`${chalk.red('✗')} Failed to repair ${agentName} agent: ${error.message}`);
        repairs.failed++;
        repairs.results.push({
          success: false,
          description: `Failed to repair ${agentName} agent configuration`,
          details: error.message
        });
      }
    }
    
    if (repairedAgents > 0) {
      repairs.successful++;
      console.log(`${chalk.green('✓')} Repaired ${repairedAgents} agent configurations`);
    }
    
    if (skippedAgents > 0) {
      repairs.skipped += skippedAgents;
    }
    
  } catch (error) {
    console.log(`${chalk.red('✗')} Agent repair failed: ${error.message}`);
    repairs.failed++;
    repairs.attempted++;
    repairs.results.push({
      success: false,
      description: 'Agent repair failed',
      details: error.message
    });
  }
}

async function repairApiConnectivity(repairs) {
  console.log(chalk.cyan('🌐 Repairing API connectivity...'));
  
  try {
    // Create .env template if it doesn't exist
    const envPath = './.env';
    const envTemplatePath = './.env.template';
    
    if (!existsSync(envPath) && !existsSync(envTemplatePath)) {
      const envTemplate = `# Super Agents Environment Variables
# Copy this file to .env and fill in your API keys

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
SA_PROJECT_ROOT=.

# MCP Server Configuration
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
`;
      
      await writeFile(envTemplatePath, envTemplate);
      console.log(`${chalk.green('✓')} Created .env.template file`);
      console.log(`${chalk.yellow('ℹ')} Copy .env.template to .env and add your API keys`);
      repairs.successful++;
      repairs.results.push({
        success: true,
        description: 'Created .env.template file',
        details: 'Copy .env.template to .env and add your API keys'
      });
    } else {
      repairs.skipped++;
      repairs.results.push({
        skipped: true,
        description: 'Environment template already exists'
      });
    }
    repairs.attempted++;
    
    // Check for gitignore
    const gitignorePath = './.gitignore';
    if (existsSync(gitignorePath)) {
      const gitignoreContent = await readFile(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env')) {
        await writeFile(gitignorePath, gitignoreContent + '\\n# Environment variables\\n.env\\n');
        console.log(`${chalk.green('✓')} Added .env to .gitignore`);
        repairs.successful++;
        repairs.results.push({
          success: true,
          description: 'Added .env to .gitignore'
        });
      } else {
        repairs.skipped++;
        repairs.results.push({
          skipped: true,
          description: '.env already in .gitignore'
        });
      }
    } else {
      // Create .gitignore
      const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env

# Logs
*.log
logs/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output

# Super Agents
sa-engine/logs/
.sa-state/
`;
      await writeFile(gitignorePath, gitignoreContent);
      console.log(`${chalk.green('✓')} Created .gitignore file`);
      repairs.successful++;
      repairs.results.push({
        success: true,
        description: 'Created .gitignore file'
      });
    }
    repairs.attempted++;
    
  } catch (error) {
    console.log(`${chalk.red('✗')} API connectivity repair failed: ${error.message}`);
    repairs.failed++;
    repairs.results.push({
      success: false,
      description: 'API connectivity repair failed',
      details: error.message
    });
  }
}