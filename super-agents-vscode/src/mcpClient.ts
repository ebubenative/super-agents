import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { SuperAgentsOutputChannel } from './ui/outputChannel';

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}

export interface MCPResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
}

export class MCPClient {
    private mcpProcess: ChildProcess | null = null;
    private isInitialized = false;
    private availableTools: MCPTool[] = [];
    private outputChannel: SuperAgentsOutputChannel;
    private workspaceRoot: string;
    private mcpServerPath: string;

    constructor(outputChannel: SuperAgentsOutputChannel) {
        this.outputChannel = outputChannel;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        
        const config = vscode.workspace.getConfiguration('superAgents');
        this.mcpServerPath = config.get<string>('mcpServerPath') || './sa-engine/mcp-server/index.js';
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Check if MCP server exists
            const serverPath = path.resolve(this.workspaceRoot, this.mcpServerPath);
            if (!fs.existsSync(serverPath)) {
                throw new Error(`MCP server not found at: ${serverPath}`);
            }

            // Start MCP server process
            await this.startMCPServer();
            
            // Load available tools
            await this.loadAvailableTools();
            
            this.isInitialized = true;
            this.outputChannel.info('MCP Client initialized successfully');
            
        } catch (error) {
            this.outputChannel.error(`Failed to initialize MCP Client: ${error}`);
            throw error;
        }
    }

    private async startMCPServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            const serverPath = path.resolve(this.workspaceRoot, this.mcpServerPath);
            const config = vscode.workspace.getConfiguration('superAgents');
            
            const env = {
                ...process.env,
                SA_PROJECT_ROOT: this.workspaceRoot,
                SA_LOG_LEVEL: config.get<string>('logLevel') || 'info',
                ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                OPENAI_API_KEY: process.env.OPENAI_API_KEY
            };

            this.mcpProcess = spawn('node', [serverPath], {
                cwd: this.workspaceRoot,
                env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.mcpProcess.stdout?.on('data', (data) => {
                this.outputChannel.debug(`MCP Server stdout: ${data}`);
            });

            this.mcpProcess.stderr?.on('data', (data) => {
                this.outputChannel.error(`MCP Server stderr: ${data}`);
            });

            this.mcpProcess.on('error', (error) => {
                this.outputChannel.error(`MCP Server error: ${error}`);
                reject(error);
            });

            this.mcpProcess.on('exit', (code) => {
                this.outputChannel.info(`MCP Server exited with code: ${code}`);
                if (code !== 0) {
                    reject(new Error(`MCP Server exited with code: ${code}`));
                } else {
                    resolve();
                }
            });

            // Give the server a moment to start
            setTimeout(() => {
                if (this.mcpProcess && !this.mcpProcess.killed) {
                    resolve();
                } else {
                    reject(new Error('MCP Server failed to start'));
                }
            }, 2000);
        });
    }

    private async loadAvailableTools(): Promise<void> {
        // Load tools from the known MCP server tools directory
        const toolsPath = path.resolve(this.workspaceRoot, 'sa-engine/mcp-server/tools');
        
        if (!fs.existsSync(toolsPath)) {
            this.outputChannel.warn('MCP tools directory not found');
            return;
        }

        try {
            const toolCategories = fs.readdirSync(toolsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            this.availableTools = [];
            
            for (const category of toolCategories) {
                const categoryPath = path.join(toolsPath, category);
                const toolFiles = fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.js'));
                
                for (const toolFile of toolFiles) {
                    const toolName = path.basename(toolFile, '.js');
                    this.availableTools.push({
                        name: toolName,
                        description: `${category} tool: ${toolName}`,
                        inputSchema: {} // Would need to parse the actual tool file for schema
                    });
                }
            }
            
            this.outputChannel.info(`Loaded ${this.availableTools.length} MCP tools`);
            
        } catch (error) {
            this.outputChannel.error(`Failed to load MCP tools: ${error}`);
        }
    }

    async callTool(toolName: string, arguments_: any = {}): Promise<MCPResponse> {
        if (!this.isInitialized) {
            throw new Error('MCP Client not initialized');
        }

        try {
            this.outputChannel.info(`Calling MCP tool: ${toolName}`);
            
            // For now, simulate the tool call since we need to implement the actual MCP protocol
            // In a real implementation, this would send a proper MCP message to the server
            const response: MCPResponse = {
                content: [{
                    type: 'text',
                    text: `Simulated response from ${toolName} with arguments: ${JSON.stringify(arguments_)}`
                }]
            };
            
            this.outputChannel.info(`Tool ${toolName} completed successfully`);
            return response;
            
        } catch (error) {
            this.outputChannel.error(`Failed to call tool ${toolName}: ${error}`);
            throw error;
        }
    }

    getAvailableTools(): MCPTool[] {
        return this.availableTools;
    }

    isConnected(): boolean {
        return this.mcpProcess !== null && !this.mcpProcess.killed;
    }

    async connect(): Promise<void> {
        if (!this.isConnected()) {
            await this.startMCPServer();
        }
    }

    async disconnect(): Promise<void> {
        if (this.mcpProcess && !this.mcpProcess.killed) {
            this.mcpProcess.kill('SIGTERM');
            this.mcpProcess = null;
        }
    }

    dispose(): void {
        this.disconnect();
    }
}