#!/usr/bin/env node

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, existsSync } from 'fs';
import CursorIntegrator from './CursorIntegrator.js';
import CommandGenerator from './CommandGenerator.js';
import StandaloneSetup from './StandaloneSetup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Super Agents Cursor Integration
 * Main entry point for Cursor IDE integration
 */
class CursorIntegration {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      enableLogging: options.enableLogging !== false,
      integrationMode: options.integrationMode || 'auto', // 'auto', 'mcp', 'standalone'
      ...options
    };
    
    this.logger = this.options.enableLogging ? console : { log: () => {}, error: () => {}, warn: () => {} };
    this.projectRoot = this.options.projectRoot;
  }

  /**
   * Setup Cursor integration
   * @returns {Promise<Object>} Integration result
   */
  async setup() {
    try {
      this.logger.log('🎯 Starting Super Agents Cursor integration setup...');
      
      const results = {
        mode: this.options.integrationMode,
        mcpIntegration: null,
        standaloneIntegration: null,
        commandGeneration: null,
        validation: null,
        timestamp: new Date().toISOString()
      };

      // Generate commands first
      results.commandGeneration = await this.generateCommands();

      // Setup integration based on mode
      if (this.options.integrationMode === 'auto' || this.options.integrationMode === 'mcp') {
        results.mcpIntegration = await this.setupMCPIntegration();
      }

      if (this.options.integrationMode === 'auto' || this.options.integrationMode === 'standalone') {
        results.standaloneIntegration = await this.setupStandaloneIntegration();
      }

      // Validate final integration
      results.validation = await this.validateIntegration();

      // Generate final setup report
      const setupReport = this.generateSetupReport(results);
      
      this.logger.log('✅ Cursor integration setup completed successfully');
      
      return {
        success: true,
        results,
        setupReport,
        integrationPath: join(this.projectRoot, '.cursor')
      };

    } catch (error) {
      this.logger.error('❌ Failed to setup Cursor integration:', error.message);
      return {
        success: false,
        error: error.message,
        integrationPath: join(this.projectRoot, '.cursor')
      };
    }
  }

  /**
   * Generate commands for Cursor
   * @returns {Promise<Object>} Command generation result
   */
  async generateCommands() {
    try {
      this.logger.log('🔧 Generating Cursor commands...');
      
      const generator = new CommandGenerator({
        projectRoot: this.projectRoot,
        enableLogging: this.options.enableLogging
      });

      const commands = await generator.generateCommands();
      
      if (commands.success) {
        // Generate command reference document
        const commandReference = await generator.generateCommandReference();
        const referencePath = join(this.projectRoot, '.cursor', 'command-reference.md');
        writeFileSync(referencePath, commandReference);
        
        return {
          success: true,
          commands: commands.commands,
          totalCommands: commands.totalCommands,
          referencePath
        };
      } else {
        throw new Error(commands.error);
      }

    } catch (error) {
      this.logger.error('❌ Failed to generate commands:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup MCP integration
   * @returns {Promise<Object>} MCP integration result
   */
  async setupMCPIntegration() {
    try {
      this.logger.log('⚙️ Setting up MCP integration...');
      
      const integrator = new CursorIntegrator({
        projectRoot: this.projectRoot,
        enableLogging: this.options.enableLogging,
        enableMCP: true,
        enableRules: true
      });

      const result = await integrator.initialize();
      
      if (result.success) {
        // Generate setup instructions
        const setupInstructions = integrator.generateSetupInstructions();
        const instructionsPath = join(this.projectRoot, '.cursor', 'mcp-setup-instructions.md');
        writeFileSync(instructionsPath, setupInstructions);
        
        return {
          success: true,
          mcpConfig: result.results.mcpIntegration,
          rulesGeneration: result.results.rulesGeneration,
          setupInstructionsPath: instructionsPath
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.logger.warn('⚠️ MCP integration setup failed, continuing with standalone:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackMode: 'standalone'
      };
    }
  }

  /**
   * Setup standalone integration
   * @returns {Promise<Object>} Standalone integration result
   */
  async setupStandaloneIntegration() {
    try {
      this.logger.log('📋 Setting up standalone rules integration...');
      
      const standaloneSetup = new StandaloneSetup({
        projectRoot: this.projectRoot,
        enableLogging: this.options.enableLogging,
        rulesTemplate: 'comprehensive'
      });

      const result = await standaloneSetup.setup();
      
      if (result.success) {
        // Write setup guide
        const guideContent = result.setupGuide;
        const guidePath = join(this.projectRoot, '.cursor', 'standalone-setup-guide.md');
        writeFileSync(guidePath, guideContent);
        
        return {
          success: true,
          rulesFile: result.rulesFile,
          configTemplates: result.configTemplates,
          setupGuidePath: guidePath
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      this.logger.error('❌ Failed to setup standalone integration:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate integration
   * @returns {Promise<Object>} Validation result
   */
  async validateIntegration() {
    try {
      this.logger.log('✅ Validating integration setup...');
      
      const cursorDir = join(this.projectRoot, '.cursor');
      const rulesDir = join(cursorDir, 'rules');
      
      const validations = {
        cursorDirExists: existsSync(cursorDir),
        rulesDirExists: existsSync(rulesDir),
        mainRulesFileExists: existsSync(join(rulesDir, 'super-agents.md')),
        commandReferenceExists: existsSync(join(cursorDir, 'command-reference.md')),
        setupGuideExists: existsSync(join(cursorDir, 'standalone-setup-guide.md')),
        mcpConfigExists: existsSync(join(cursorDir, 'mcp-config.json'))
      };

      const criticalValidations = ['cursorDirExists', 'rulesDirExists', 'mainRulesFileExists'];
      const criticalPassed = criticalValidations.every(check => validations[check]);
      
      const optionalValidations = ['commandReferenceExists', 'setupGuideExists', 'mcpConfigExists'];
      const optionalPassed = optionalValidations.filter(check => validations[check]).length;

      return {
        success: criticalPassed,
        validations,
        criticalPassed,
        optionalPassed: `${optionalPassed}/${optionalValidations.length}`,
        issues: Object.entries(validations)
          .filter(([_, passed]) => !passed)
          .map(([check, _]) => check)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate setup report
   * @param {Object} results - Setup results
   * @returns {string} Setup report content
   */
  generateSetupReport(results) {
    const timestamp = new Date().toISOString();
    const mode = results.mode;
    
    let report = `# Super Agents - Cursor Integration Setup Report

**Generated**: ${timestamp}
**Integration Mode**: ${mode}
**Project Root**: ${this.projectRoot}

## Setup Summary

`;

    // Command Generation
    if (results.commandGeneration?.success) {
      report += `✅ **Command Generation**: Success
- Total Commands: ${results.commandGeneration.totalCommands}
- Command Reference: Generated
- Categories: MCP Tools, Agent Personas, Workflows, Utilities

`;
    } else {
      report += `❌ **Command Generation**: Failed
- Error: ${results.commandGeneration?.error || 'Unknown error'}

`;
    }

    // MCP Integration
    if (results.mcpIntegration?.success) {
      report += `✅ **MCP Integration**: Success
- MCP Configuration: Generated
- Rules Files: Generated
- Setup Instructions: Available

`;
    } else if (results.mcpIntegration) {
      report += `⚠️ **MCP Integration**: Failed (Fallback to Standalone)
- Error: ${results.mcpIntegration.error}
- Fallback Mode: ${results.mcpIntegration.fallbackMode || 'standalone'}

`;
    }

    // Standalone Integration
    if (results.standaloneIntegration?.success) {
      report += `✅ **Standalone Integration**: Success
- Rules File: Generated (${results.standaloneIntegration.rulesFile?.size || 'N/A'} bytes)
- Configuration Templates: Generated
- Setup Guide: Available

`;
    } else if (results.standaloneIntegration) {
      report += `❌ **Standalone Integration**: Failed
- Error: ${results.standaloneIntegration.error}

`;
    }

    // Validation
    if (results.validation?.success) {
      report += `✅ **Integration Validation**: Success
- Critical Components: All passed
- Optional Components: ${results.validation.optionalPassed}
- Status: Ready for use

`;
    } else {
      report += `⚠️ **Integration Validation**: Issues Found
- Critical Issues: ${results.validation?.issues?.length || 'Unknown'}
- Missing Components: ${results.validation?.issues?.join(', ') || 'Unknown'}

`;
    }

    // Usage Instructions
    report += `## Usage Instructions

### Quick Start
1. **Rules-Based Usage** (Always Available):
   \`\`\`
   @analyst: Research competitive landscape for our product
   @pm: Create PRD for user authentication feature
   @architect: Design scalable microservices architecture
   @developer: Implement user registration with email verification
   @qa: Review authentication code for security issues
   \`\`\`

2. **MCP Tool Usage** (If MCP Configured):
   \`\`\`
   @sa-research-market topic="AI development tools"
   @sa-generate-prd requirements="user authentication system"
   @sa-create-architecture requirements="scalable web application"
   @sa-implement-story story="user login functionality"
   @sa-review-code files="src/auth/" focus="security"
   \`\`\`

### Available Resources
- **Main Rules File**: \`.cursor/rules/super-agents.md\`
- **Command Reference**: \`.cursor/command-reference.md\`
- **Setup Guide**: \`.cursor/standalone-setup-guide.md\`
`;

    if (results.mcpIntegration?.success) {
      report += `- **MCP Configuration**: \`.cursor/mcp-config.json\`
- **MCP Setup Instructions**: \`.cursor/mcp-setup-instructions.md\`
`;
    }

    report += `
### Workflow Patterns
1. **Sequential Development**: @analyst → @pm → @architect → @developer → @qa
2. **Parallel Collaboration**: @analyst + @pm (planning) → @architect + @ux-expert (design)
3. **Iterative Development**: @pm (planning) → @developer (implementation) → @qa (review)
4. **Consultative Decision Making**: Multiple agents for complex decisions

## Troubleshooting

### Common Issues
1. **Agent Not Responding**: Ensure correct agent name and clear context
2. **Workflow Stalling**: Check dependencies and handoff procedures
3. **Quality Issues**: Increase @qa involvement and quality gates

### Getting Help
- Review the comprehensive rules file for detailed guidance
- Check command reference for specific tool usage
- Consult setup guides for configuration issues

## Next Steps
1. Test basic agent usage in Cursor chat
2. Try a complete workflow for a small feature
3. Customize configuration templates as needed
4. Integrate into your development process

---
*Setup Report - Super Agents Framework for Cursor*
*Integration Status: ${results.validation?.success ? 'Ready' : 'Needs Attention'}*
`;

    return report;
  }

  /**
   * Get integration status
   * @returns {Promise<Object>} Integration status
   */
  async getStatus() {
    try {
      const cursorDir = join(this.projectRoot, '.cursor');
      const rulesDir = join(cursorDir, 'rules');
      
      const status = {
        installed: existsSync(cursorDir),
        rulesActive: existsSync(join(rulesDir, 'super-agents.md')),
        mcpConfigured: existsSync(join(cursorDir, 'mcp-config.json')),
        commandsAvailable: existsSync(join(cursorDir, 'command-reference.md')),
        setupComplete: false
      };

      status.setupComplete = status.installed && status.rulesActive;

      return {
        success: true,
        status,
        integrationPath: cursorDir
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';
  
  console.log('🎯 Super Agents - Cursor Integration');
  console.log('=====================================');
  
  const integration = new CursorIntegration({
    projectRoot: process.cwd(),
    enableLogging: true,
    integrationMode: args.includes('--standalone') ? 'standalone' : args.includes('--mcp') ? 'mcp' : 'auto'
  });

  try {
    switch (command) {
      case 'setup':
        console.log('Setting up Cursor integration...');
        const setupResult = await integration.setup();
        
        if (setupResult.success) {
          console.log('\n✅ Setup completed successfully!');
          console.log(`📁 Integration files created in: ${setupResult.integrationPath}`);
          console.log('\n📋 Next steps:');
          console.log('1. Test agent usage: @analyst: Research AI development trends');
          console.log('2. Review setup report for detailed information');
          console.log('3. Customize configuration as needed');
        } else {
          console.error('\n❌ Setup failed:', setupResult.error);
          process.exit(1);
        }
        break;

      case 'status':
        console.log('Checking integration status...');
        const statusResult = await integration.getStatus();
        
        if (statusResult.success) {
          const status = statusResult.status;
          console.log('\n📊 Integration Status:');
          console.log(`  Installed: ${status.installed ? '✅' : '❌'}`);
          console.log(`  Rules Active: ${status.rulesActive ? '✅' : '❌'}`);
          console.log(`  MCP Configured: ${status.mcpConfigured ? '✅' : '❌'}`);
          console.log(`  Commands Available: ${status.commandsAvailable ? '✅' : '❌'}`);
          console.log(`  Setup Complete: ${status.setupComplete ? '✅' : '❌'}`);
        } else {
          console.error('\n❌ Status check failed:', statusResult.error);
          process.exit(1);
        }
        break;

      case 'help':
      default:
        console.log(`
Usage: node cursor/index.js [command] [options]

Commands:
  setup     Setup Cursor integration (default)
  status    Check integration status
  help      Show this help message

Options:
  --standalone    Setup standalone integration only (no MCP)
  --mcp          Setup MCP integration only
  --auto         Setup both MCP and standalone (default)

Examples:
  node cursor/index.js setup --standalone
  node cursor/index.js status
  node cursor/index.js help
        `);
        break;
    }

  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
export default CursorIntegration;
export { CursorIntegrator, CommandGenerator, StandaloneSetup };

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}