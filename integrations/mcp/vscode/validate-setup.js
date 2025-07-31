#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VSCodeValidator {
    constructor() {
        this.projectRoot = process.cwd();
        this.vscodeDir = path.join(this.projectRoot, '.vscode');
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    async validate() {
        console.log('🔍 Validating Super Agents VS Code setup...\n');

        try {
            await this.checkVSCodeDirectory();
            await this.checkRequiredFiles();
            await this.checkConfiguration();
            await this.checkSuperAgentsInstallation();
            await this.checkEnvironmentVariables();
            await this.checkExtensions();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    async checkVSCodeDirectory() {
        console.log('📁 Checking VS Code directory structure...');
        
        if (!fs.existsSync(this.vscodeDir)) {
            this.errors.push('.vscode directory does not exist');
            return;
        }
        
        const requiredDirs = ['agents', 'workflows', 'snippets'];
        
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.vscodeDir, dir);
            if (fs.existsSync(dirPath)) {
                this.info.push(`✅ ${dir}/ directory exists`);
            } else {
                this.warnings.push(`⚠️  ${dir}/ directory missing`);
            }
        });
    }

    async checkRequiredFiles() {
        console.log('📄 Checking required configuration files...');
        
        const requiredFiles = [
            { file: 'settings.json', critical: true },
            { file: 'tasks.json', critical: true },
            { file: 'launch.json', critical: false },
            { file: 'extensions.json', critical: false },
            { file: 'keybindings.json', critical: false }
        ];
        
        requiredFiles.forEach(({ file, critical }) => {
            const filePath = path.join(this.vscodeDir, file);
            if (fs.existsSync(filePath)) {
                this.info.push(`✅ ${file} exists`);
                this.validateFileContent(file, filePath);
            } else {
                const message = `${file} is missing`;
                if (critical) {
                    this.errors.push(`❌ ${message}`);
                } else {
                    this.warnings.push(`⚠️  ${message}`);
                }
            }
        });
    }

    validateFileContent(fileName, filePath) {
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            switch (fileName) {
                case 'settings.json':
                    this.validateSettings(content);
                    break;
                case 'tasks.json':
                    this.validateTasks(content);
                    break;
                case 'extensions.json':
                    this.validateExtensions(content);
                    break;
            }
        } catch (error) {
            this.errors.push(`❌ ${fileName} has invalid JSON: ${error.message}`);
        }
    }

    validateSettings(settings) {
        const requiredSettings = [
            'super-agents.enabled',
            'super-agents.mcpServerPath',
            'super-agents.projectRoot'
        ];
        
        requiredSettings.forEach(setting => {
            if (settings[setting] !== undefined) {
                this.info.push(`✅ Setting ${setting} is configured`);
            } else {
                this.warnings.push(`⚠️  Setting ${setting} is not configured`);
            }
        });
        
        // Check MCP server path
        if (settings['super-agents.mcpServerPath']) {
            const mcpPath = path.resolve(this.projectRoot, settings['super-agents.mcpServerPath']);
            if (fs.existsSync(mcpPath)) {
                this.info.push('✅ MCP Server path is valid');
            } else {
                this.errors.push(`❌ MCP Server not found at: ${mcpPath}`);
            }
        }
    }

    validateTasks(tasks) {
        if (!tasks.tasks || !Array.isArray(tasks.tasks)) {
            this.errors.push('❌ tasks.json does not contain a valid tasks array');
            return;
        }
        
        const requiredTasks = [
            'SA: Start Analyst Research',
            'SA: Create PRD with PM',
            'SA: Design Architecture',
            'SA: Implement Story',
            'SA: Review Code'
        ];
        
        const definedTasks = tasks.tasks.map(task => task.label);
        
        requiredTasks.forEach(requiredTask => {
            if (definedTasks.includes(requiredTask)) {
                this.info.push(`✅ Task "${requiredTask}" is defined`);
            } else {
                this.warnings.push(`⚠️  Task "${requiredTask}" is missing`);
            }
        });
        
        this.info.push(`✅ Found ${tasks.tasks.length} VS Code tasks`);
    }

    validateExtensions(extensions) {
        const requiredExtensions = [
            'super-agents.super-agents-vscode'
        ];
        
        const recommendedExtensions = extensions.recommendations || [];
        
        requiredExtensions.forEach(ext => {
            if (recommendedExtensions.includes(ext)) {
                this.info.push(`✅ Extension ${ext} is recommended`);
            } else {
                this.warnings.push(`⚠️  Extension ${ext} is not in recommendations`);
            }
        });
    }

    async checkSuperAgentsInstallation() {
        console.log('🤖 Checking Super Agents installation...');
        
        const mcpServerPath = path.join(this.projectRoot, 'sa-engine/mcp-server/index.js');
        if (fs.existsSync(mcpServerPath)) {
            this.info.push('✅ Super Agents MCP server found');
            
            // Check if it's executable
            try {
                execSync(`node "${mcpServerPath}" --version`, { stdio: 'pipe' });
                this.info.push('✅ MCP server is executable');
            } catch (error) {
                this.warnings.push('⚠️  MCP server may not be properly configured');
            }
        } else {
            this.errors.push('❌ Super Agents MCP server not found');
        }
        
        // Check for agent configurations
        const agentsPath = path.join(this.projectRoot, 'sa-engine/agents');
        if (fs.existsSync(agentsPath)) {
            const agentFiles = fs.readdirSync(agentsPath).filter(f => f.endsWith('.json'));
            this.info.push(`✅ Found ${agentFiles.length} agent configurations`);
        } else {
            this.warnings.push('⚠️  No agent configurations found');
        }
        
        // Check for MCP tools
        const toolsPath = path.join(this.projectRoot, 'sa-engine/mcp-server/tools');
        if (fs.existsSync(toolsPath)) {
            const toolDirs = fs.readdirSync(toolsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory()).length;
            this.info.push(`✅ Found ${toolDirs} tool categories`);
        } else {
            this.errors.push('❌ MCP tools directory not found');
        }
    }

    async checkEnvironmentVariables() {
        console.log('🔧 Checking environment variables...');
        
        const requiredEnvVars = [
            { name: 'ANTHROPIC_API_KEY', critical: true },
            { name: 'OPENAI_API_KEY', critical: false }
        ];
        
        requiredEnvVars.forEach(({ name, critical }) => {
            if (process.env[name]) {
                this.info.push(`✅ ${name} is set`);
            } else {
                const message = `${name} is not set`;
                if (critical) {
                    this.errors.push(`❌ ${message}`);
                } else {
                    this.warnings.push(`⚠️  ${message}`);
                }
            }
        });
        
        // Check project-specific env vars
        const projectEnvVars = ['SA_PROJECT_ROOT', 'SA_LOG_LEVEL'];
        
        projectEnvVars.forEach(envVar => {
            if (process.env[envVar]) {
                this.info.push(`✅ ${envVar} is set to: ${process.env[envVar]}`);
            } else {
                this.info.push(`ℹ️  ${envVar} will use default value`);
            }
        });
    }

    async checkExtensions() {
        console.log('🔌 Checking VS Code extensions...');
        
        try {
            // Try to get installed extensions
            const result = execSync('code --list-extensions', { stdio: 'pipe', encoding: 'utf8' });
            const installedExtensions = result.split('\n').filter(ext => ext.trim());
            
            const requiredExtensions = [
                'super-agents.super-agents-vscode'
            ];
            
            const recommendedExtensions = [
                'github.copilot',
                'ms-vscode.vscode-ai',
                'ms-python.python',
                'ms-vscode.vscode-typescript-next'
            ];
            
            requiredExtensions.forEach(ext => {
                if (installedExtensions.includes(ext)) {
                    this.info.push(`✅ Required extension ${ext} is installed`);
                } else {
                    this.warnings.push(`⚠️  Required extension ${ext} is not installed`);
                }
            });
            
            recommendedExtensions.forEach(ext => {
                if (installedExtensions.includes(ext)) {
                    this.info.push(`✅ Recommended extension ${ext} is installed`);
                } else {
                    this.info.push(`ℹ️  Recommended extension ${ext} is not installed`);
                }
            });
            
        } catch (error) {
            this.warnings.push('⚠️  Could not check installed extensions (VS Code CLI not available)');
        }
    }

    printResults() {
        console.log('\n📊 Validation Results:\n');
        
        if (this.errors.length > 0) {
            console.log('🚨 Errors (must be fixed):');
            this.errors.forEach(error => console.log(`   ${error}`));
            console.log('');
        }
        
        if (this.warnings.length > 0) {
            console.log('⚠️  Warnings (recommended fixes):');
            this.warnings.forEach(warning => console.log(`   ${warning}`));
            console.log('');
        }
        
        if (this.info.length > 0) {
            console.log('✅ Information:');
            this.info.forEach(info => console.log(`   ${info}`));
            console.log('');
        }
        
        // Summary
        console.log('📈 Summary:');
        console.log(`   Errors: ${this.errors.length}`);
        console.log(`   Warnings: ${this.warnings.length}`);
        console.log(`   Info: ${this.info.length}`);
        
        if (this.errors.length === 0) {
            console.log('\n🎉 Validation passed! Super Agents VS Code integration is properly configured.');
        } else {
            console.log('\n❌ Validation failed! Please fix the errors above before using Super Agents.');
            process.exit(1);
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new VSCodeValidator();
    validator.validate().catch(console.error);
}

module.exports = VSCodeValidator;