import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { StateManager } from '../../sa-engine/state-manager/StateManager.js';
import { ConfigManager } from '../../sa-engine/config/ConfigManager.js';

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
  
  const requiredDirs = [
    'sa-engine',
    'sa-engine/state-manager',
    'sa-engine/config',
    'sa-engine/utils',
    'sa-engine/agents',
    'sa-engine/mcp-server',
    'sa-engine/mcp-server/tools',
    'sa-engine/procedures',
    'sa-engine/templates',
    'sa-engine/data',
    'super-agents-cli',
    'super-agents-cli/commands'
  ];
  
  for (const dir of requiredDirs) {
    try {
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
        console.log(`${chalk.green('✓')} Created directory: ${dir}`);
        repairs.successful++;
        repairs.results.push({
          success: true,
          description: `Created missing directory: ${dir}`
        });
      } else {
        repairs.skipped++;
        repairs.results.push({
          skipped: true,
          description: `Directory already exists: ${dir}`
        });
      }
      repairs.attempted++;
    } catch (error) {
      console.log(`${chalk.red('✗')} Failed to create directory ${dir}: ${error.message}`);
      repairs.failed++;
      repairs.results.push({
        success: false,
        description: `Failed to create directory: ${dir}`,
        details: error.message
      });
    }
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
    const mcpServerPath = resolve('./sa-engine/mcp-server/index.js');
    
    if (!existsSync(mcpServerPath)) {
      // Create basic MCP server file
      const mcpServerContent = `#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SuperAgentsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'super-agents',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'sa-get-task',
            description: 'Get task details by ID',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'The task ID to retrieve'
                }
              },
              required: ['taskId']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'sa-get-task':
          return {
            content: [
              {
                type: 'text',
                text: \`Task \${args.taskId} - Basic MCP server response\`
              }
            ]
          };
        default:
          throw new Error(\`Unknown tool: \${name}\`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Super Agents MCP server running on stdio');
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const server = new SuperAgentsMCPServer();
  server.run().catch(console.error);
}
`;
      
      // Ensure directory exists
      const mcpServerDir = dirname(mcpServerPath);
      if (!existsSync(mcpServerDir)) {
        await mkdir(mcpServerDir, { recursive: true });
      }
      
      await writeFile(mcpServerPath, mcpServerContent);
      console.log(`${chalk.green('✓')} Created basic MCP server`);
      repairs.successful++;
      repairs.results.push({
        success: true,
        description: 'Created basic MCP server file',
        details: `MCP server created at: ${mcpServerPath}`
      });
    } else {
      console.log(`${chalk.green('✓')} MCP server file already exists`);
      repairs.skipped++;
      repairs.results.push({
        skipped: true,
        description: 'MCP server file already exists'
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
  
  const agentTypes = [
    { name: 'analyst', role: 'Strategic analysis and market research' },
    { name: 'pm', role: 'Product management and requirements' },
    { name: 'architect', role: 'System design and architecture' },
    { name: 'developer', role: 'Implementation and coding' },
    { name: 'qa', role: 'Quality assurance and testing' },
    { name: 'ux-expert', role: 'User experience and design' },
    { name: 'product-owner', role: 'Backlog and story management' },
    { name: 'scrum-master', role: 'Workflow and process management' }
  ];
  
  const agentsDir = resolve('./sa-engine/agents');
  
  for (const agent of agentTypes) {
    try {
      const agentConfigPath = join(agentsDir, `${agent.name}.json`);
      
      if (!existsSync(agentConfigPath)) {
        const agentConfig = {
          agent: {
            name: agent.name,
            role: agent.role,
            status: "active",
            type: "specialized",
            capabilities: [
              "task_execution",
              "analysis",
              "collaboration"
            ],
            tools: [],
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          }
        };
        
        // Ensure directory exists
        if (!existsSync(agentsDir)) {
          await mkdir(agentsDir, { recursive: true });
        }
        
        await writeFile(agentConfigPath, JSON.stringify(agentConfig, null, 2));
        console.log(`${chalk.green('✓')} Created ${agent.name} agent configuration`);
        repairs.successful++;
        repairs.results.push({
          success: true,
          description: `Created ${agent.name} agent configuration`
        });
      } else {
        repairs.skipped++;
        repairs.results.push({
          skipped: true,
          description: `${agent.name} agent configuration already exists`
        });
      }
      repairs.attempted++;
      
    } catch (error) {
      console.log(`${chalk.red('✗')} Failed to create ${agent.name} agent: ${error.message}`);
      repairs.failed++;
      repairs.results.push({
        success: false,
        description: `Failed to create ${agent.name} agent configuration`,
        details: error.message
      });
    }
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