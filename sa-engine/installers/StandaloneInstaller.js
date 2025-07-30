import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import AgentSystem from '../agents/AgentSystem.js';
import TemplateEngine from '../templates/TemplateEngine.js';
import TaskManager from '../tasks/TaskManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * StandaloneInstaller - Automated installation system for Super Agents
 * Handles environment detection, configuration generation, and installation validation
 */
class StandaloneInstaller extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            saEnginePath: options.saEnginePath || path.join(__dirname, '..'),
            installPath: options.installPath || process.cwd(),
            logLevel: options.logLevel || 'info',
            validateInstallation: options.validateInstallation !== false,
            backupExisting: options.backupExisting !== false,
            dryRun: options.dryRun || false,
            ...options
        };
        
        this.environment = null;
        this.detectedIDEs = new Map();
        this.installedComponents = new Set();
        this.validationResults = new Map();
        this.backupPaths = new Map();
        
        this.log('StandaloneInstaller initialized', { options: this.options });
    }

    /**
     * Main installation entry point
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async install(config = {}) {
        const startTime = Date.now();
        
        try {
            this.log('Starting standalone installation', { config });
            this.emit('installationStarted', { config });

            // Phase 1: Environment Detection
            await this.detectEnvironment();
            
            // Phase 2: Validate Prerequisites
            await this.validatePrerequisites();
            
            // Phase 3: Backup Existing Configurations
            if (this.options.backupExisting) {
                await this.backupExistingConfigurations();
            }
            
            // Phase 4: Install Components
            const installResult = await this.installComponents(config);
            
            // Phase 5: Validate Installation
            if (this.options.validateInstallation) {
                await this.validateInstallation();
            }
            
            // Phase 6: Generate Installation Report
            const report = await this.generateInstallationReport();
            
            const duration = Date.now() - startTime;
            
            this.log('Installation completed successfully', { 
                duration, 
                components: installResult.installed.length 
            });
            
            this.emit('installationCompleted', { 
                result: installResult, 
                report, 
                duration 
            });
            
            return {
                success: true,
                duration,
                installed: installResult.installed,
                validated: Array.from(this.validationResults.keys()),
                report,
                environment: this.environment,
                backups: Array.from(this.backupPaths.entries())
            };
            
        } catch (error) {
            this.log('Installation failed', { error: error.message }, 'error');
            this.emit('installationFailed', { error });
            
            // Attempt rollback if needed
            if (!this.options.dryRun) {
                await this.rollbackInstallation();
            }
            
            throw error;
        }
    }

    /**
     * Detect current environment and available IDEs
     * @returns {Promise<Object>} Environment detection results
     */
    async detectEnvironment() {
        this.log('Detecting environment');
        this.emit('environmentDetectionStarted');
        
        this.environment = {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            homeDir: os.homedir(),
            cwd: process.cwd(),
            shell: process.env.SHELL || process.env.COMSPEC,
            timestamp: new Date().toISOString()
        };
        
        // Detect IDEs
        await this.detectIDEs();
        
        // Detect existing Super Agents installations
        await this.detectExistingInstallations();
        
        this.log('Environment detection completed', { 
            platform: this.environment.platform,
            ides: this.detectedIDEs.size 
        });
        
        this.emit('environmentDetectionCompleted', { 
            environment: this.environment,
            ides: Array.from(this.detectedIDEs.keys())
        });
        
        return this.environment;
    }

    /**
     * Detect available IDEs on the system
     * @returns {Promise<void>}
     */
    async detectIDEs() {
        const ideDetectors = {
            'claude-code': this.detectClaudeCode.bind(this),
            'cursor': this.detectCursor.bind(this),
            'vscode': this.detectVSCode.bind(this),
            'windsurf': this.detectWindsurf.bind(this),
            'zed': this.detectZed.bind(this)
        };
        
        for (const [ideName, detector] of Object.entries(ideDetectors)) {
            try {
                const ideInfo = await detector();
                if (ideInfo.installed) {
                    this.detectedIDEs.set(ideName, ideInfo);
                    this.log(`Detected IDE: ${ideName}`, { info: ideInfo });
                }
            } catch (error) {
                this.log(`Failed to detect ${ideName}`, { error: error.message }, 'warn');
            }
        }
    }

    /**
     * Detect Claude Code installation
     * @returns {Promise<Object>} Claude Code detection result
     */
    async detectClaudeCode() {
        const result = { installed: false, version: null, configPath: null };
        
        try {
            // Try to run claude-code --version
            const { stdout } = await execAsync('claude-code --version');
            result.installed = true;
            result.version = stdout.trim();
            
            // Find config directory
            const configDirs = [
                path.join(os.homedir(), '.config', 'claude-code'),
                path.join(os.homedir(), '.claude-code'),
                path.join(os.homedir(), 'AppData', 'Roaming', 'claude-code')
            ];
            
            for (const dir of configDirs) {
                if (fs.existsSync(dir)) {
                    result.configPath = dir;
                    break;
                }
            }
            
        } catch (error) {
            // Claude Code not installed or not in PATH
        }
        
        return result;
    }

    /**
     * Detect Cursor installation
     * @returns {Promise<Object>} Cursor detection result
     */
    async detectCursor() {
        const result = { installed: false, version: null, configPath: null };
        
        try {
            // Try different cursor command variations
            const commands = ['cursor --version', 'code --version'];
            
            for (const cmd of commands) {
                try {
                    const { stdout } = await execAsync(cmd);
                    if (stdout.toLowerCase().includes('cursor')) {
                        result.installed = true;
                        result.version = stdout.trim();
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Find Cursor config directory
            const configDirs = [
                path.join(os.homedir(), '.cursor'),
                path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor'),
                path.join(os.homedir(), 'Library', 'Application Support', 'Cursor')
            ];
            
            for (const dir of configDirs) {
                if (fs.existsSync(dir)) {
                    result.configPath = dir;
                    break;
                }
            }
            
        } catch (error) {
            // Cursor not detected
        }
        
        return result;
    }

    /**
     * Detect VS Code installation
     * @returns {Promise<Object>} VS Code detection result
     */
    async detectVSCode() {
        const result = { installed: false, version: null, configPath: null };
        
        try {
            const { stdout } = await execAsync('code --version');
            result.installed = true;
            result.version = stdout.split('\n')[0];
            
            // Find VS Code config directory
            const configDirs = [
                path.join(os.homedir(), '.vscode'),
                path.join(os.homedir(), 'AppData', 'Roaming', 'Code'),
                path.join(os.homedir(), 'Library', 'Application Support', 'Code')
            ];
            
            for (const dir of configDirs) {
                if (fs.existsSync(dir)) {
                    result.configPath = dir;
                    break;
                }
            }
            
        } catch (error) {
            // VS Code not detected
        }
        
        return result;
    }

    /**
     * Detect Windsurf installation
     * @returns {Promise<Object>} Windsurf detection result
     */
    async detectWindsurf() {
        const result = { installed: false, version: null, configPath: null };
        
        try {
            const { stdout } = await execAsync('windsurf --version');
            result.installed = true;
            result.version = stdout.trim();
            
            const configDirs = [
                path.join(os.homedir(), '.windsurf'),
                path.join(os.homedir(), 'AppData', 'Roaming', 'Windsurf')
            ];
            
            for (const dir of configDirs) {
                if (fs.existsSync(dir)) {
                    result.configPath = dir;
                    break;
                }
            }
            
        } catch (error) {
            // Windsurf not detected
        }
        
        return result;
    }

    /**
     * Detect Zed installation
     * @returns {Promise<Object>} Zed detection result
     */
    async detectZed() {
        const result = { installed: false, version: null, configPath: null };
        
        try {
            const { stdout } = await execAsync('zed --version');
            result.installed = true;
            result.version = stdout.trim();
            
            const configDirs = [
                path.join(os.homedir(), '.config', 'zed'),
                path.join(os.homedir(), 'AppData', 'Roaming', 'Zed')
            ];
            
            for (const dir of configDirs) {
                if (fs.existsSync(dir)) {
                    result.configPath = dir;
                    break;
                }
            }
            
        } catch (error) {
            // Zed not detected
        }
        
        return result;
    }

    /**
     * Detect existing Super Agents installations
     * @returns {Promise<void>}
     */
    async detectExistingInstallations() {
        const possibleLocations = [
            path.join(os.homedir(), '.super-agents'),
            path.join(process.cwd(), '.super-agents'),
            path.join(os.homedir(), '.config', 'super-agents')
        ];
        
        this.environment.existingInstallations = [];
        
        for (const location of possibleLocations) {
            if (fs.existsSync(location)) {
                try {
                    const configPath = path.join(location, 'config.json');
                    let config = null;
                    
                    if (fs.existsSync(configPath)) {
                        const configContent = fs.readFileSync(configPath, 'utf8');
                        config = JSON.parse(configContent);
                    }
                    
                    this.environment.existingInstallations.push({
                        path: location,
                        config,
                        lastModified: fs.statSync(location).mtime
                    });
                    
                } catch (error) {
                    this.log(`Error reading existing installation at ${location}`, { error: error.message }, 'warn');
                }
            }
        }
    }

    /**
     * Validate prerequisites for installation
     * @returns {Promise<void>}
     */
    async validatePrerequisites() {
        this.log('Validating prerequisites');
        this.emit('prerequisitesValidationStarted');
        
        const prerequisites = [];
        
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 18) {
            throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
        }
        
        prerequisites.push({ name: 'Node.js', version: nodeVersion, status: 'valid' });
        
        // Check write permissions
        const testDir = path.join(this.options.installPath, '.super-agents-test');
        try {
            fs.mkdirSync(testDir, { recursive: true });
            fs.rmSync(testDir, { recursive: true });
            prerequisites.push({ name: 'Write Permissions', status: 'valid' });
        } catch (error) {
            throw new Error(`No write permissions at ${this.options.installPath}: ${error.message}`);
        }
        
        // Check if at least one IDE is detected
        if (this.detectedIDEs.size === 0) {
            this.log('No IDEs detected - proceeding with generic installation', {}, 'warn');
        }
        
        this.log('Prerequisites validated', { prerequisites });
        this.emit('prerequisitesValidationCompleted', { prerequisites });
    }

    /**
     * Backup existing configurations
     * @returns {Promise<void>}
     */
    async backupExistingConfigurations() {
        this.log('Backing up existing configurations');
        this.emit('backupStarted');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.options.installPath, `.super-agents-backup-${timestamp}`);
        
        fs.mkdirSync(backupDir, { recursive: true });
        
        // Backup existing Super Agents installations
        for (const installation of this.environment.existingInstallations || []) {
            const backupPath = path.join(backupDir, 'super-agents', path.basename(installation.path));
            
            try {
                await this.copyDirectory(installation.path, backupPath);
                this.backupPaths.set(installation.path, backupPath);
                this.log(`Backed up ${installation.path} to ${backupPath}`);
            } catch (error) {
                this.log(`Failed to backup ${installation.path}`, { error: error.message }, 'warn');
            }
        }
        
        // Backup IDE configurations
        for (const [ideName, ideInfo] of this.detectedIDEs.entries()) {
            if (ideInfo.configPath && fs.existsSync(ideInfo.configPath)) {
                const backupPath = path.join(backupDir, 'ide-configs', ideName);
                
                try {
                    await this.copyDirectory(ideInfo.configPath, backupPath);
                    this.backupPaths.set(`${ideName}-config`, backupPath);
                    this.log(`Backed up ${ideName} config to ${backupPath}`);
                } catch (error) {
                    this.log(`Failed to backup ${ideName} config`, { error: error.message }, 'warn');
                }
            }
        }
        
        this.emit('backupCompleted', { backupDir, backups: Array.from(this.backupPaths.entries()) });
    }

    /**
     * Install Super Agents components
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation results
     */
    async installComponents(config) {
        this.log('Installing components', { config });
        this.emit('componentInstallationStarted', { config });
        
        const installed = [];
        const failed = [];
        
        const components = [
            { name: 'core-framework', installer: this.installCoreFramework.bind(this) },
            { name: 'agent-system', installer: this.installAgentSystem.bind(this) },
            { name: 'task-management', installer: this.installTaskManagement.bind(this) },
            { name: 'template-engine', installer: this.installTemplateEngine.bind(this) },
            { name: 'mcp-server', installer: this.installMCPServer.bind(this) },
            { name: 'ide-integrations', installer: this.installIDEIntegrations.bind(this) }
        ];
        
        // Filter components based on config
        const selectedComponents = config.components ? 
            components.filter(c => config.components.includes(c.name)) : 
            components;
        
        for (const component of selectedComponents) {
            try {
                this.log(`Installing ${component.name}`);
                const result = await component.installer(config);
                
                installed.push({
                    name: component.name,
                    result,
                    timestamp: new Date().toISOString()
                });
                
                this.installedComponents.add(component.name);
                this.emit('componentInstalled', { name: component.name, result });
                
            } catch (error) {
                this.log(`Failed to install ${component.name}`, { error: error.message }, 'error');
                failed.push({
                    name: component.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                this.emit('componentInstallationFailed', { name: component.name, error });
            }
        }
        
        const result = { installed, failed };
        this.emit('componentInstallationCompleted', result);
        
        return result;
    }

    /**
     * Install core framework
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installCoreFramework(config) {
        const installDir = path.join(this.options.installPath, '.super-agents');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(installDir, { recursive: true });
            
            // Create core configuration
            const coreConfig = {
                version: '1.0.0',
                installedAt: new Date().toISOString(),
                installPath: installDir,
                components: [],
                environment: this.environment
            };
            
            fs.writeFileSync(
                path.join(installDir, 'config.json'), 
                JSON.stringify(coreConfig, null, 2)
            );
            
            // Create directory structure
            const dirs = ['agents', 'templates', 'tasks', 'procedures', 'logs', 'backups'];
            for (const dir of dirs) {
                fs.mkdirSync(path.join(installDir, dir), { recursive: true });
            }
        }
        
        return {
            installPath: installDir,
            configCreated: true,
            directoriesCreated: !this.options.dryRun
        };
    }

    /**
     * Install agent system
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installAgentSystem(config) {
        const agentSystem = new AgentSystem(path.join(this.options.saEnginePath, 'agents'));
        await agentSystem.loadAllAgents();
        
        const installDir = path.join(this.options.installPath, '.super-agents', 'agents');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(installDir, { recursive: true });
            
            // Copy agent definitions
            const sourceDir = path.join(this.options.saEnginePath, 'agents');
            await this.copyDirectory(sourceDir, installDir);
        }
        
        return {
            installPath: installDir,
            agentsLoaded: agentSystem.listAgents().length,
            sourceDir: path.join(this.options.saEnginePath, 'agents')
        };
    }

    /**
     * Install task management system
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installTaskManagement(config) {
        const installDir = path.join(this.options.installPath, '.super-agents', 'tasks');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(installDir, { recursive: true });
            
            // Initialize empty task storage
            const taskManager = new TaskManager(installDir);
            await taskManager.initialize();
        }
        
        return {
            installPath: installDir,
            initialized: !this.options.dryRun
        };
    }

    /**
     * Install template engine
     * @param {Object} config - Installation configuration  
     * @returns {Promise<Object>} Installation result
     */
    async installTemplateEngine(config) {
        const installDir = path.join(this.options.installPath, '.super-agents', 'templates');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(installDir, { recursive: true });
            
            // Copy template files
            const sourceDir = path.join(this.options.saEnginePath, 'templates');
            await this.copyDirectory(sourceDir, installDir);
        }
        
        return {
            installPath: installDir,
            sourceDir: path.join(this.options.saEnginePath, 'templates'),
            templatesCopied: !this.options.dryRun
        };
    }

    /**
     * Install MCP server
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installMCPServer(config) {
        const installDir = path.join(this.options.installPath, '.super-agents', 'mcp-server');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(installDir, { recursive: true });
            
            // Copy MCP server files
            const sourceDir = path.join(this.options.saEnginePath, 'mcp-server');
            await this.copyDirectory(sourceDir, installDir);
            
            // Create MCP server configuration
            const mcpConfig = {
                name: 'super-agents-mcp',
                version: '1.0.0',
                transport: 'stdio',
                toolsPath: path.join(installDir, 'tools'),
                autoLoadTools: true
            };
            
            fs.writeFileSync(
                path.join(installDir, 'config.json'), 
                JSON.stringify(mcpConfig, null, 2)
            );
        }
        
        return {
            installPath: installDir,
            sourceDir: path.join(this.options.saEnginePath, 'mcp-server'),
            configCreated: !this.options.dryRun
        };
    }

    /**
     * Install IDE integrations
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installIDEIntegrations(config) {
        const results = {};
        
        for (const [ideName, ideInfo] of this.detectedIDEs.entries()) {
            try {
                const result = await this.installIDEIntegration(ideName, ideInfo, config);
                results[ideName] = result;
            } catch (error) {
                this.log(`Failed to install ${ideName} integration`, { error: error.message }, 'error');
                results[ideName] = { error: error.message };
            }
        }
        
        return results;
    }

    /**
     * Install integration for specific IDE
     * @param {string} ideName - IDE name
     * @param {Object} ideInfo - IDE information
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installIDEIntegration(ideName, ideInfo, config) {
        switch (ideName) {
            case 'claude-code':
                return await this.installClaudeCodeIntegration(ideInfo, config);
            case 'cursor':
                return await this.installCursorIntegration(ideInfo, config);
            case 'vscode':
                return await this.installVSCodeIntegration(ideInfo, config);
            default:
                return await this.installGenericIntegration(ideName, ideInfo, config);
        }
    }

    /**
     * Install Claude Code integration
     * @param {Object} ideInfo - Claude Code information
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installClaudeCodeIntegration(ideInfo, config) {
        if (!ideInfo.configPath) {
            throw new Error('Claude Code config path not found');
        }
        
        const mcpConfigPath = path.join(ideInfo.configPath, 'mcp_servers.json');
        const superAgentsServerPath = path.join(this.options.installPath, '.super-agents', 'mcp-server', 'index.js');
        
        if (!this.options.dryRun) {
            // Create or update MCP servers configuration
            let mcpConfig = {};
            
            if (fs.existsSync(mcpConfigPath)) {
                try {
                    const content = fs.readFileSync(mcpConfigPath, 'utf8');
                    mcpConfig = JSON.parse(content);
                } catch (error) {
                    this.log('Failed to parse existing MCP config, creating new one', { error: error.message }, 'warn');
                }
            }
            
            // Add Super Agents MCP server
            mcpConfig.mcpServers = mcpConfig.mcpServers || {};
            mcpConfig.mcpServers['super-agents'] = {
                command: 'node',
                args: [superAgentsServerPath],
                env: {}
            };
            
            fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
        }
        
        return {
            ideName: 'claude-code',
            configPath: mcpConfigPath,
            serverPath: superAgentsServerPath,
            configured: !this.options.dryRun
        };
    }

    /**
     * Install Cursor integration
     * @param {Object} ideInfo - Cursor information
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installCursorIntegration(ideInfo, config) {
        if (!ideInfo.configPath) {
            throw new Error('Cursor config path not found');
        }
        
        const rulesDir = path.join(ideInfo.configPath, 'rules');
        const superAgentsRulesPath = path.join(rulesDir, 'super-agents.md');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(rulesDir, { recursive: true });
            
            // Generate Cursor rules file
            const templateEngine = new TemplateEngine(path.join(this.options.saEnginePath, 'templates'));
            
            // Create rules content for Cursor
            const rulesContent = `# Super Agents Framework Rules for Cursor

## Available Agents

${this.generateAgentRulesContent()}

## Task Management

- Use structured task IDs (1.2.3 format)
- Follow status transitions: pending → in-progress → review → done
- Track dependencies and blockers
- Use appropriate priority levels: low, medium, high, critical

## Templates

- Use YAML templates for consistent document generation
- Support variable substitution with Handlebars syntax
- Templates available for: PRD, architecture, stories, briefs

## Best Practices

- Break down large tasks into smaller subtasks
- Use appropriate agent personas for different work types
- Maintain clear acceptance criteria for all tasks
- Document architectural decisions and technical choices
`;
            
            fs.writeFileSync(superAgentsRulesPath, rulesContent);
        }
        
        return {
            ideName: 'cursor',
            rulesPath: superAgentsRulesPath,
            configured: !this.options.dryRun
        };
    }

    /**
     * Install VS Code integration
     * @param {Object} ideInfo - VS Code information
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installVSCodeIntegration(ideInfo, config) {
        // For now, create workspace configuration
        const workspaceConfig = {
            "folders": [],
            "settings": {
                "super-agents.enabled": true,
                "super-agents.agentsPath": path.join(this.options.installPath, '.super-agents', 'agents'),
                "super-agents.templatesPath": path.join(this.options.installPath, '.super-agents', 'templates'),
                "super-agents.tasksPath": path.join(this.options.installPath, '.super-agents', 'tasks')
            }
        };
        
        const workspaceConfigPath = path.join(this.options.installPath, '.vscode', 'settings.json');
        
        if (!this.options.dryRun) {
            fs.mkdirSync(path.dirname(workspaceConfigPath), { recursive: true });
            fs.writeFileSync(workspaceConfigPath, JSON.stringify(workspaceConfig, null, 2));
        }
        
        return {
            ideName: 'vscode',
            workspaceConfigPath,
            configured: !this.options.dryRun
        };
    }

    /**
     * Install generic IDE integration
     * @param {string} ideName - IDE name
     * @param {Object} ideInfo - IDE information
     * @param {Object} config - Installation configuration
     * @returns {Promise<Object>} Installation result
     */
    async installGenericIntegration(ideName, ideInfo, config) {
        // Create generic configuration files
        const integrationDir = path.join(this.options.installPath, '.super-agents', 'integrations', ideName);
        
        if (!this.options.dryRun) {
            fs.mkdirSync(integrationDir, { recursive: true });
            
            const integrationConfig = {
                ideName,
                ideInfo,
                agentsPath: path.join(this.options.installPath, '.super-agents', 'agents'),
                templatesPath: path.join(this.options.installPath, '.super-agents', 'templates'),
                tasksPath: path.join(this.options.installPath, '.super-agents', 'tasks'),
                mcpServerPath: path.join(this.options.installPath, '.super-agents', 'mcp-server')
            };
            
            fs.writeFileSync(
                path.join(integrationDir, 'config.json'), 
                JSON.stringify(integrationConfig, null, 2)
            );
        }
        
        return {
            ideName,
            integrationDir,
            configured: !this.options.dryRun
        };
    }

    /**
     * Generate agent rules content for Cursor
     * @returns {string} Agent rules content
     */
    generateAgentRulesContent() {
        const agentSystem = new AgentSystem(path.join(this.options.saEnginePath, 'agents'));
        const agents = agentSystem.listAgents();
        
        return agents.map(agent => {
            return `### ${agent.agent.title} (${agent.agent.id})
${agent.persona.role}

**When to use**: ${agent.agent.whenToUse || 'Use for ' + agent.persona.focus}
**Capabilities**: ${agent.capabilities.commands.map(cmd => cmd.name).join(', ')}
`;
        }).join('\n');
    }

    /**
     * Validate installation
     * @returns {Promise<void>}
     */
    async validateInstallation() {
        this.log('Validating installation');
        this.emit('validationStarted');
        
        const validations = [
            { name: 'core-framework', validator: this.validateCoreFramework.bind(this) },
            { name: 'agent-system', validator: this.validateAgentSystem.bind(this) },
            { name: 'task-management', validator: this.validateTaskManagement.bind(this) },
            { name: 'template-engine', validator: this.validateTemplateEngine.bind(this) },
            { name: 'mcp-server', validator: this.validateMCPServer.bind(this) }
        ];
        
        for (const validation of validations) {
            try {
                const result = await validation.validator();
                this.validationResults.set(validation.name, { 
                    success: true, 
                    result,
                    timestamp: new Date().toISOString()
                });
                
                this.log(`Validation passed: ${validation.name}`, { result });
                
            } catch (error) {
                this.validationResults.set(validation.name, { 
                    success: false, 
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                this.log(`Validation failed: ${validation.name}`, { error: error.message }, 'error');
                throw new Error(`Installation validation failed for ${validation.name}: ${error.message}`);
            }
        }
        
        this.emit('validationCompleted', { 
            results: Array.from(this.validationResults.entries()) 
        });
    }

    /**
     * Validate core framework installation
     * @returns {Promise<Object>} Validation result
     */
    async validateCoreFramework() {
        const installDir = path.join(this.options.installPath, '.super-agents');
        const configPath = path.join(installDir, 'config.json');
        
        if (!fs.existsSync(installDir)) {
            throw new Error('Super Agents directory not found');
        }
        
        if (!fs.existsSync(configPath)) {
            throw new Error('Super Agents config file not found');
        }
        
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        const requiredDirs = ['agents', 'templates', 'tasks'];
        for (const dir of requiredDirs) {
            const dirPath = path.join(installDir, dir);
            if (!fs.existsSync(dirPath)) {
                throw new Error(`Required directory not found: ${dir}`);
            }
        }
        
        return {
            installDir,
            config,
            directoriesValidated: requiredDirs
        };
    }

    /**
     * Validate agent system installation
     * @returns {Promise<Object>} Validation result
     */
    async validateAgentSystem() {
        const agentDir = path.join(this.options.installPath, '.super-agents', 'agents');
        
        if (!fs.existsSync(agentDir)) {
            throw new Error('Agents directory not found');
        }
        
        const agentSystem = new AgentSystem(agentDir);
        const loadResult = await agentSystem.loadAllAgents();
        
        if (loadResult.loaded === 0) {
            throw new Error('No agents loaded');
        }
        
        return {
            agentDir,
            agentsLoaded: loadResult.loaded,
            agentsFailed: loadResult.failed
        };
    }

    /**
     * Validate task management installation
     * @returns {Promise<Object>} Validation result
     */
    async validateTaskManagement() {
        const taskDir = path.join(this.options.installPath, '.super-agents', 'tasks');
        
        if (!fs.existsSync(taskDir)) {
            throw new Error('Tasks directory not found');
        }
        
        const taskManager = new TaskManager(taskDir);
        await taskManager.initialize();
        
        return {
            taskDir,
            initialized: true
        };
    }

    /**
     * Validate template engine installation
     * @returns {Promise<Object>} Validation result
     */
    async validateTemplateEngine() {
        const templateDir = path.join(this.options.installPath, '.super-agents', 'templates');
        
        if (!fs.existsSync(templateDir)) {
            throw new Error('Templates directory not found');
        }
        
        const templateEngine = new TemplateEngine(templateDir);
        const templates = templateEngine.listTemplates();
        
        if (templates.length === 0) {
            throw new Error('No templates found');
        }
        
        return {
            templateDir,
            templatesFound: templates.length
        };
    }

    /**
     * Validate MCP server installation
     * @returns {Promise<Object>} Validation result
     */
    async validateMCPServer() {
        const mcpDir = path.join(this.options.installPath, '.super-agents', 'mcp-server');
        const mcpIndex = path.join(mcpDir, 'index.js');
        const mcpConfig = path.join(mcpDir, 'config.json');
        
        if (!fs.existsSync(mcpDir)) {
            throw new Error('MCP server directory not found');
        }
        
        if (!fs.existsSync(mcpIndex)) {
            throw new Error('MCP server index file not found');
        }
        
        if (!fs.existsSync(mcpConfig)) {
            throw new Error('MCP server config file not found');
        }
        
        return {
            mcpDir,
            serverFile: mcpIndex,
            configFile: mcpConfig
        };
    }

    /**
     * Generate installation report
     * @returns {Promise<Object>} Installation report
     */
    async generateInstallationReport() {
        return {
            timestamp: new Date().toISOString(),
            environment: this.environment,
            detectedIDEs: Array.from(this.detectedIDEs.entries()),
            installedComponents: Array.from(this.installedComponents),
            validationResults: Array.from(this.validationResults.entries()),
            backupPaths: Array.from(this.backupPaths.entries()),
            installPath: this.options.installPath
        };
    }

    /**
     * Rollback installation
     * @returns {Promise<void>}
     */
    async rollbackInstallation() {
        this.log('Rolling back installation');
        this.emit('rollbackStarted');
        
        try {
            // Remove installed directory
            const installDir = path.join(this.options.installPath, '.super-agents');
            if (fs.existsSync(installDir)) {
                fs.rmSync(installDir, { recursive: true, force: true });
            }
            
            // Restore backups if they exist
            for (const [original, backup] of this.backupPaths.entries()) {
                if (fs.existsSync(backup)) {
                    await this.copyDirectory(backup, original);
                    this.log(`Restored ${original} from backup`);
                }
            }
            
            this.emit('rollbackCompleted');
            
        } catch (error) {
            this.log('Rollback failed', { error: error.message }, 'error');
            this.emit('rollbackFailed', { error });
        }
    }

    /**
     * Copy directory recursively
     * @param {string} src - Source directory
     * @param {string} dest - Destination directory
     * @returns {Promise<void>}
     */
    async copyDirectory(src, dest) {
        const srcStat = fs.statSync(src);
        
        if (srcStat.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            
            const entries = fs.readdirSync(src);
            for (const entry of entries) {
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                await this.copyDirectory(srcPath, destPath);
            }
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    /**
     * Logging utility
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @param {string} level - Log level
     */
    log(message, data = {}, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            component: 'StandaloneInstaller',
            ...data
        };
        
        this.emit('log', logEntry);
        
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.options.logLevel] || 1;
        const messageLevel = logLevels[level] || 1;
        
        if (messageLevel >= currentLevel) {
            const prefix = `[StandaloneInstaller ${level.toUpperCase()}]`;
            console.log(`${prefix} ${message}`, Object.keys(data).length > 0 ? data : '');
        }
    }
}

export default StandaloneInstaller;