#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VSCodeSetup {
    constructor() {
        this.projectRoot = process.cwd();
        this.vscodeDir = path.join(this.projectRoot, '.vscode');
        this.templateDir = path.join(__dirname, 'templates');
        this.configDir = path.join(__dirname, 'configs');
    }

    async setup() {
        console.log('🚀 Setting up Super Agents VS Code integration...\n');

        try {
            // Create .vscode directory if it doesn't exist
            await this.createVSCodeDirectory();
            
            // Setup workspace configuration
            await this.setupWorkspaceConfig();
            
            // Setup keybindings
            await this.setupKeybindings();
            
            // Setup snippets
            await this.setupSnippets();
            
            // Create agent directories
            await this.createAgentDirectories();
            
            // Validate setup
            await this.validateSetup();
            
            console.log('✅ Super Agents VS Code integration setup complete!\n');
            this.printUsageInstructions();
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    async createVSCodeDirectory() {
        console.log('📁 Creating .vscode directory...');
        
        if (!fs.existsSync(this.vscodeDir)) {
            fs.mkdirSync(this.vscodeDir, { recursive: true });
            console.log('   Created .vscode directory');
        } else {
            console.log('   .vscode directory already exists');
        }
    }

    async setupWorkspaceConfig() {
        console.log('⚙️  Setting up workspace configuration...');
        
        const templatePath = path.join(this.templateDir, 'workspace-settings.json');
        const workspaceConfig = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        // Setup settings.json
        const settingsPath = path.join(this.vscodeDir, 'settings.json');
        let existingSettings = {};
        
        if (fs.existsSync(settingsPath)) {
            existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        
        const mergedSettings = { ...existingSettings, ...workspaceConfig.settings };
        fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
        console.log('   Updated settings.json');
        
        // Setup tasks.json
        const tasksPath = path.join(this.vscodeDir, 'tasks.json');
        fs.writeFileSync(tasksPath, JSON.stringify(workspaceConfig.tasks, null, 2));
        console.log('   Created tasks.json');
        
        // Setup launch.json
        const launchPath = path.join(this.vscodeDir, 'launch.json');
        fs.writeFileSync(launchPath, JSON.stringify(workspaceConfig.launch, null, 2));
        console.log('   Created launch.json');
        
        // Setup extensions.json
        const extensionsPath = path.join(this.vscodeDir, 'extensions.json');
        let existingExtensions = { recommendations: [] };
        
        if (fs.existsSync(extensionsPath)) {
            existingExtensions = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
        }
        
        const mergedRecommendations = [
            ...new Set([
                ...existingExtensions.recommendations,
                ...workspaceConfig.extensions.recommendations
            ])
        ];
        
        fs.writeFileSync(extensionsPath, JSON.stringify({
            recommendations: mergedRecommendations
        }, null, 2));
        console.log('   Updated extensions.json');
    }

    async setupKeybindings() {
        console.log('⌨️  Setting up keybindings...');
        
        const keybindingsPath = path.join(this.vscodeDir, 'keybindings.json');
        const templateKeybindings = JSON.parse(
            fs.readFileSync(path.join(this.configDir, 'keybindings.json'), 'utf8')
        );
        
        let existingKeybindings = [];
        if (fs.existsSync(keybindingsPath)) {
            existingKeybindings = JSON.parse(fs.readFileSync(keybindingsPath, 'utf8'));
        }
        
        // Merge keybindings, avoiding duplicates
        const mergedKeybindings = [...existingKeybindings];
        
        templateKeybindings.forEach(newBinding => {
            const exists = existingKeybindings.some(existing => 
                existing.key === newBinding.key && existing.command === newBinding.command
            );
            
            if (!exists) {
                mergedKeybindings.push(newBinding);
            }
        });
        
        fs.writeFileSync(keybindingsPath, JSON.stringify(mergedKeybindings, null, 2));
        console.log('   Updated keybindings.json');
    }

    async setupSnippets() {
        console.log('📝 Setting up code snippets...');
        
        const snippetsDir = path.join(this.vscodeDir, 'snippets');
        if (!fs.existsSync(snippetsDir)) {
            fs.mkdirSync(snippetsDir, { recursive: true });
        }
        
        const templateSnippets = JSON.parse(
            fs.readFileSync(path.join(this.configDir, 'snippets.json'), 'utf8')
        );
        
        // Create individual snippet files for each language
        Object.keys(templateSnippets).forEach(language => {
            const snippetFile = path.join(snippetsDir, `${language}.json`);
            fs.writeFileSync(snippetFile, JSON.stringify(templateSnippets[language], null, 2));
            console.log(`   Created ${language}.json snippets`);
        });
    }

    async createAgentDirectories() {
        console.log('🤖 Creating agent directories...');
        
        const agentsDir = path.join(this.vscodeDir, 'agents');
        const workflowsDir = path.join(this.vscodeDir, 'workflows');
        
        if (!fs.existsSync(agentsDir)) {
            fs.mkdirSync(agentsDir, { recursive: true });
            console.log('   Created agents directory');
        }
        
        if (!fs.existsSync(workflowsDir)) {
            fs.mkdirSync(workflowsDir, { recursive: true });
            console.log('   Created workflows directory');
        }
        
        // Create agent prompt templates
        const agents = [
            'analyst', 'pm', 'architect', 'developer', 
            'qa', 'product-owner', 'ux-expert', 'scrum-master'
        ];
        
        agents.forEach(agent => {
            const agentFile = path.join(agentsDir, `${agent}.md`);
            if (!fs.existsSync(agentFile)) {
                const agentTemplate = `# ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent

## Role
Super Agents ${agent} for project assistance.

## Available Tools
- See sa-engine/mcp-server/tools/${agent}/ for available tools

## Usage Instructions
Use VS Code tasks or command palette to interact with this agent.

## Keyboard Shortcuts
- See .vscode/keybindings.json for available shortcuts
`;
                fs.writeFileSync(agentFile, agentTemplate);
                console.log(`   Created ${agent}.md template`);
            }
        });
    }

    async validateSetup() {
        console.log('🔍 Validating setup...');
        
        const requiredFiles = [
            '.vscode/settings.json',
            '.vscode/tasks.json', 
            '.vscode/launch.json',
            '.vscode/extensions.json',
            '.vscode/keybindings.json'
        ];
        
        const requiredDirs = [
            '.vscode/snippets',
            '.vscode/agents',
            '.vscode/workflows'
        ];
        
        let allValid = true;
        
        // Check required files
        requiredFiles.forEach(file => {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ ${file}`);
            } else {
                console.log(`   ❌ ${file} - Missing`);
                allValid = false;
            }
        });
        
        // Check required directories
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.projectRoot, dir);
            if (fs.existsSync(dirPath)) {
                console.log(`   ✅ ${dir}/`);
            } else {
                console.log(`   ❌ ${dir}/ - Missing`);
                allValid = false;
            }
        });
        
        // Check MCP server
        const mcpServerPath = path.join(this.projectRoot, 'sa-engine/mcp-server/index.js');
        if (fs.existsSync(mcpServerPath)) {
            console.log('   ✅ MCP Server found');
        } else {
            console.log('   ⚠️  MCP Server not found - Make sure Super Agents is installed');
        }
        
        if (!allValid) {
            throw new Error('Setup validation failed - Some required files are missing');
        }
    }

    printUsageInstructions() {
        console.log('📖 Usage Instructions:\n');
        console.log('1. Reload VS Code window (Ctrl+Shift+P → "Developer: Reload Window")');
        console.log('2. Install recommended extensions when prompted');
        console.log('3. Use keyboard shortcuts or Command Palette (Ctrl+Shift+P) for Super Agents commands');
        console.log('4. Check tasks with Ctrl+Shift+P → "Tasks: Run Task" → select SA task');
        console.log('5. Use snippets by typing "sa-" and selecting from autocomplete\n');
        
        console.log('🔑 Key Shortcuts:');
        console.log('   Ctrl+Shift+A R  - Start Analyst Research');
        console.log('   Ctrl+Shift+A P  - Create PRD with PM');
        console.log('   Ctrl+Shift+A D  - Design Architecture');
        console.log('   Ctrl+Shift+A I  - Implement Story');
        console.log('   Ctrl+Shift+A C  - Review Code');
        console.log('   Ctrl+Shift+A T  - Track Progress\n');
        
        console.log('📚 Documentation:');
        console.log('   - Check .vscode/agents/ for agent-specific help');
        console.log('   - See .vscode/tasks.json for available tasks');
        console.log('   - Review .vscode/snippets/ for code templates\n');
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new VSCodeSetup();
    setup.setup().catch(console.error);
}

module.exports = VSCodeSetup;