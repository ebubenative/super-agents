import * as vscode from 'vscode';
import { MCPClient } from './mcpClient';
import { TaskTreeDataProvider } from './providers/treeDataProvider';
import { SuperAgentsStatusBar } from './ui/statusBar';
import { SuperAgentsOutputChannel } from './ui/outputChannel';
import * as agentCommands from './commands/agentCommands';
import * as workflowCommands from './commands/workflowCommands';
import * as taskCommands from './commands/taskCommands';

let mcpClient: MCPClient | undefined;
let taskTreeDataProvider: TaskTreeDataProvider | undefined;
let statusBar: SuperAgentsStatusBar | undefined;
let outputChannel: SuperAgentsOutputChannel | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Super Agents extension is being activated');
    
    // Initialize output channel
    outputChannel = new SuperAgentsOutputChannel();
    context.subscriptions.push(outputChannel);
    
    // Initialize status bar
    statusBar = new SuperAgentsStatusBar();
    context.subscriptions.push(statusBar);
    
    // Initialize MCP client
    try {
        mcpClient = new MCPClient(outputChannel);
        await mcpClient.initialize();
        statusBar.setMCPStatus('connected');
        outputChannel.info('MCP Client initialized successfully');
    } catch (error) {
        statusBar.setMCPStatus('disconnected');
        outputChannel.error(`Failed to initialize MCP Client: ${error}`);
        vscode.window.showErrorMessage('Failed to initialize Super Agents MCP Client');
    }
    
    // Initialize task tree data provider
    taskTreeDataProvider = new TaskTreeDataProvider(mcpClient);
    const taskTreeView = vscode.window.createTreeView('superAgentsTasks', {
        treeDataProvider: taskTreeDataProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(taskTreeView);
    
    // Register all commands
    registerCommands(context, mcpClient, taskTreeDataProvider, outputChannel);
    
    // Set context variable to enable views
    vscode.commands.executeCommand('setContext', 'superAgents.enabled', true);
    
    outputChannel.info('Super Agents extension activated successfully');
}

export function deactivate() {
    if (mcpClient) {
        mcpClient.dispose();
    }
    console.log('Super Agents extension deactivated');
}

function registerCommands(
    context: vscode.ExtensionContext,
    mcpClient: MCPClient | undefined,
    taskTreeDataProvider: TaskTreeDataProvider | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
) {
    // Agent commands
    context.subscriptions.push(
        vscode.commands.registerCommand('superAgents.startAnalystResearch', () => 
            agentCommands.startAnalystResearch(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.createPRD', () => 
            agentCommands.createPRD(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.designArchitecture', () => 
            agentCommands.designArchitecture(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.implementStory', () => 
            agentCommands.implementStory(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.reviewCode', () => 
            agentCommands.reviewCode(mcpClient, outputChannel)
        )
    );
    
    // Workflow commands
    context.subscriptions.push(
        vscode.commands.registerCommand('superAgents.trackProgress', () => 
            workflowCommands.trackProgress(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.validateDependencies', () => 
            workflowCommands.validateDependencies(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.startWorkflow', () => 
            workflowCommands.startWorkflow(mcpClient, outputChannel)
        )
    );
    
    // Task commands
    context.subscriptions.push(
        vscode.commands.registerCommand('superAgents.initializeProject', () => 
            taskCommands.initializeProject(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.listTasks', () => 
            taskCommands.listTasks(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.createStory', () => 
            taskCommands.createStory(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.runTests', () => 
            taskCommands.runTests(mcpClient, outputChannel)
        ),
        vscode.commands.registerCommand('superAgents.showTasks', () => 
            taskCommands.showTasks(taskTreeDataProvider)
        ),
        vscode.commands.registerCommand('superAgents.refreshTasks', () => 
            taskCommands.refreshTasks(taskTreeDataProvider)
        )
    );
    
    // Utility commands
    context.subscriptions.push(
        vscode.commands.registerCommand('superAgents.toggleMcpServer', async () => {
            if (mcpClient) {
                try {
                    if (mcpClient.isConnected()) {
                        await mcpClient.disconnect();
                        statusBar?.setMCPStatus('disconnected');
                        outputChannel?.info('MCP Server disconnected');
                        vscode.window.showInformationMessage('Super Agents MCP Server disconnected');
                    } else {
                        await mcpClient.connect();
                        statusBar?.setMCPStatus('connected');
                        outputChannel?.info('MCP Server connected');
                        vscode.window.showInformationMessage('Super Agents MCP Server connected');
                    }
                } catch (error) {
                    outputChannel?.error(`Failed to toggle MCP Server: ${error}`);
                    vscode.window.showErrorMessage('Failed to toggle Super Agents MCP Server');
                }
            }
        })
    );
}