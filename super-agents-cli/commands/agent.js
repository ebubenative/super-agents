import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let AgentSystem;
try {
  const AgentSystemModule = await import('../../sa-engine/agents/AgentSystem.js');
  AgentSystem = AgentSystemModule.default || AgentSystemModule;
} catch (error) {
  console.error('Failed to load AgentSystem:', error.message);
}

function getStatusIcon(status) {
  switch (status) {
    case 'active': return '✅';
    case 'inactive': return '⏸️';
    case 'deprecated': return '❌';
    default: return '❓';
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'primary': return '🎯';
    case 'secondary': return '🔧';
    case 'utility': return '⚙️';
    case 'meta': return '🧙';
    default: return '❓';
  }
}

export const agentCommand = {
  async list(options = {}) {
    try {
      if (!AgentSystem) {
        throw new Error('AgentSystem not available');
      }

      const agentSystem = new AgentSystem(path.join(__dirname, '../../sa-engine/agents'));
      await agentSystem.loadAllAgents();

      console.log(chalk.blue('🤖 Super Agents Registry\n'));

      const filters = {};
      if (options.type) filters.type = options.type;
      if (options.status) filters.status = options.status;
      if (options.search) filters.search = options.search;

      const agents = agentSystem.listAgents(filters);

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found matching the criteria.'));
        return;
      }

      const stats = agentSystem.getAgentStats();
      console.log(chalk.gray(`Total: ${stats.total} | Active: ${stats.active} | Inactive: ${stats.inactive}\n`));

      agents.forEach(agent => {
        const statusIcon = getStatusIcon(agent.agent.status);
        const typeIcon = getTypeIcon(agent.agent.type);
        
        console.log(`${chalk.cyan(agent.agent.id.padEnd(18))} ${agent.agent.icon || '🤖'} ${agent.agent.name} - ${agent.agent.title}`);
        console.log(`${' '.repeat(18)} ${statusIcon} ${agent.agent.status} ${typeIcon} ${agent.agent.type}`);
        
        if (agent.agent.whenToUse) {
          console.log(`${' '.repeat(18)} ${chalk.gray(agent.agent.whenToUse.substring(0, 80) + (agent.agent.whenToUse.length > 80 ? '...' : ''))}`);
        }
        console.log();
      });

      if (options.stats) {
        console.log(chalk.blue('\n📊 Statistics:'));
        console.log(`${chalk.gray('Most accessed:')} ${stats.mostAccessed || 'None'}`);
        console.log(`${chalk.gray('Total access count:')} ${stats.totalAccess}`);
        console.log(`${chalk.gray('Types:')} Primary: ${stats.types.primary}, Secondary: ${stats.types.secondary}, Utility: ${stats.types.utility}, Meta: ${stats.types.meta}`);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error listing agents:'), error.message);
    }
  },

  async info(name, options = {}) {
    try {
      if (!AgentSystem) {
        throw new Error('AgentSystem not available');
      }

      if (!name) {
        console.log(chalk.red('❌ Agent name is required'));
        return;
      }

      const agentSystem = new AgentSystem(path.join(__dirname, '../../sa-engine/agents'));
      await agentSystem.loadAllAgents();

      const agent = agentSystem.getAgent(name);
      if (!agent) {
        console.log(chalk.red(`❌ Agent '${name}' not found`));
        return;
      }

      console.log(chalk.blue(`🤖 Agent Details: ${agent.agent.name}\n`));

      console.log(chalk.white.bold('Basic Information:'));
      console.log(`${chalk.gray('ID:')} ${agent.agent.id}`);
      console.log(`${chalk.gray('Name:')} ${agent.agent.name}`);
      console.log(`${chalk.gray('Title:')} ${agent.agent.title}`);
      console.log(`${chalk.gray('Icon:')} ${agent.agent.icon || 'None'}`);
      console.log(`${chalk.gray('Type:')} ${getTypeIcon(agent.agent.type)} ${agent.agent.type}`);
      console.log(`${chalk.gray('Status:')} ${getStatusIcon(agent.agent.status)} ${agent.agent.status}`);

      if (agent.agent.whenToUse) {
        console.log(`${chalk.gray('When to use:')} ${agent.agent.whenToUse}\n`);
      }

      console.log(chalk.white.bold('Persona:'));
      console.log(`${chalk.gray('Role:')} ${agent.persona.role}`);
      console.log(`${chalk.gray('Style:')} ${agent.persona.style}`);
      console.log(`${chalk.gray('Identity:')} ${agent.persona.identity}`);
      console.log(`${chalk.gray('Focus:')} ${agent.persona.focus}\n`);

      console.log(chalk.white.bold('Core Principles:'));
      agent.persona.core_principles.forEach((principle, index) => {
        console.log(`${chalk.gray(`${index + 1}.`)} ${principle}`);
      });

      console.log(chalk.white.bold('\nCapabilities:'));
      console.log(`${chalk.gray('Commands:')} ${agent.capabilities.commands.length}`);
      
      if (options.verbose) {
        agent.capabilities.commands.forEach((command, index) => {
          console.log(`\n${chalk.cyan(`${index + 1}. ${command.name}`)}`);
          console.log(`   ${chalk.gray('Description:')} ${command.description}`);
          console.log(`   ${chalk.gray('Usage:')} ${command.usage}`);
          if (command.mcp_tool) {
            console.log(`   ${chalk.gray('MCP Tool:')} ${command.mcp_tool}`);
          }
        });
      }

      if (agent.dependencies) {
        console.log(chalk.white.bold('\nDependencies:'));
        const deps = agentSystem.resolveDependencies(name);
        console.log(`${chalk.green('Resolved:')} ${deps.resolved.length}`);
        console.log(`${chalk.red('Missing:')} ${deps.missing.length}`);
        
        if (deps.missing.length > 0) {
          deps.missing.forEach(dep => {
            console.log(`  ${chalk.red('❌')} ${dep.type}/${dep.name}`);
          });
        }
      }

      console.log(chalk.white.bold('\nMetadata:'));
      console.log(`${chalk.gray('Version:')} ${agent.metadata.version}`);
      console.log(`${chalk.gray('Created:')} ${agent.metadata.created}`);
      console.log(`${chalk.gray('Framework:')} ${agent.metadata.framework}`);
      console.log(`${chalk.gray('Loaded:')} ${agent._metadata.loaded}`);

    } catch (error) {
      console.error(chalk.red('❌ Error getting agent info:'), error.message);
    }
  },

  async test(name, options = {}) {
    try {
      if (!AgentSystem) {
        throw new Error('AgentSystem not available');
      }

      if (!name) {
        console.log(chalk.red('❌ Agent name is required'));
        return;
      }

      const agentSystem = new AgentSystem(path.join(__dirname, '../../sa-engine/agents'));
      await agentSystem.loadAllAgents();

      console.log(chalk.blue(`🧪 Testing Agent: ${name}\n`));

      const agent = agentSystem.getAgent(name);
      if (!agent) {
        console.log(chalk.red(`❌ Agent '${name}' not found`));
        return;
      }

      let allTestsPassed = true;

      console.log(chalk.white.bold('1. Schema Validation:'));
      const isValid = agentSystem.validateAgent(agent);
      if (isValid) {
        console.log(chalk.green('   ✅ Schema validation passed'));
      } else {
        console.log(chalk.red('   ❌ Schema validation failed'));
        allTestsPassed = false;
      }

      console.log(chalk.white.bold('\n2. Dependency Check:'));
      const deps = agentSystem.resolveDependencies(name);
      if (deps.missing.length === 0) {
        console.log(chalk.green(`   ✅ All dependencies resolved (${deps.resolved.length})`));
      } else {
        console.log(chalk.yellow(`   ⚠️  Missing ${deps.missing.length} dependencies:`));
        deps.missing.forEach(dep => {
          console.log(`      ${chalk.red('❌')} ${dep.type}/${dep.name}`);
        });
        allTestsPassed = false;
      }

      console.log(chalk.white.bold('\n3. Activation Test:'));
      try {
        const activationResult = agentSystem.activateAgent(name);
        if (activationResult.success) {
          console.log(chalk.green('   ✅ Agent can be activated'));
          agentSystem.deactivateAgent(name);
        } else {
          console.log(chalk.red('   ❌ Agent activation failed:'), activationResult.message);
          allTestsPassed = false;
        }
      } catch (error) {
        console.log(chalk.red('   ❌ Activation test failed:'), error.message);
        allTestsPassed = false;
      }

      console.log(chalk.white.bold('\n4. Command Structure:'));
      const commands = agent.capabilities.commands;
      const requiredFields = ['name', 'description', 'usage'];
      
      let commandsValid = true;
      commands.forEach((command, index) => {
        const missing = requiredFields.filter(field => !command[field]);
        if (missing.length > 0) {
          console.log(chalk.red(`   ❌ Command ${index + 1} missing: ${missing.join(', ')}`));
          commandsValid = false;
          allTestsPassed = false;
        }
      });
      
      if (commandsValid) {
        console.log(chalk.green(`   ✅ All ${commands.length} commands have required fields`));
      }

      console.log(chalk.white.bold('\n5. File Structure:'));
      if (agent._metadata.filepath && agent._metadata.filename) {
        console.log(chalk.green('   ✅ File metadata present'));
      } else {
        console.log(chalk.red('   ❌ File metadata missing'));
        allTestsPassed = false;
      }

      console.log(chalk.white.bold('\n📋 Test Summary:'));
      if (allTestsPassed) {
        console.log(chalk.green.bold('   ✅ All tests passed! Agent is ready to use.'));
      } else {
        console.log(chalk.red.bold('   ❌ Some tests failed. Please fix the issues above.'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error testing agent:'), error.message);
    }
  }
};