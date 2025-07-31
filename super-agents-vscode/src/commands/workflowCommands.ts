import * as vscode from 'vscode';
import { MCPClient } from '../mcpClient';
import { SuperAgentsOutputChannel } from '../ui/outputChannel';

export async function trackProgress(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        outputChannel.show();
        outputChannel.info('Tracking workflow progress...');

        const response = await mcpClient.callTool('sa-track-progress', {
            include_details: true,
            format: 'detailed'
        });

        outputChannel.info('Progress tracking completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`Progress tracking failed: ${error}`);
        vscode.window.showErrorMessage(`Progress tracking failed: ${error}`);
    }
}

export async function validateDependencies(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        outputChannel.show();
        outputChannel.info('Validating task dependencies...');

        const response = await mcpClient.callTool('sa-validate-dependencies', {
            check_circular: true,
            validate_constraints: true
        });

        outputChannel.info('Dependency validation completed');
        
        // Show results in output channel
        outputChannel.info('Validation results:');
        response.content.forEach(content => {
            outputChannel.info(content.text);
        });

        // Show a summary message
        vscode.window.showInformationMessage('Dependency validation completed. Check output for details.');

    } catch (error) {
        outputChannel?.error(`Dependency validation failed: ${error}`);
        vscode.window.showErrorMessage(`Dependency validation failed: ${error}`);
    }
}

export async function startWorkflow(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const workflowType = await vscode.window.showQuickPick([
            'Greenfield Fullstack',
            'Brownfield Fullstack',
            'Greenfield Service',
            'Brownfield Service',
            'Greenfield UI',
            'Brownfield UI'
        ], {
            placeHolder: 'Select workflow type'
        });

        if (!workflowType) {
            return;
        }

        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name',
            placeholder: 'e.g., my-awesome-project'
        });

        if (!projectName) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Starting ${workflowType} workflow for: ${projectName}`);

        const workflowMap: { [key: string]: string } = {
            'Greenfield Fullstack': 'greenfield-fullstack',
            'Brownfield Fullstack': 'brownfield-fullstack',
            'Greenfield Service': 'greenfield-service',
            'Brownfield Service': 'brownfield-service',
            'Greenfield UI': 'greenfield-ui',
            'Brownfield UI': 'brownfield-ui'
        };

        const response = await mcpClient.callTool('sa-start-workflow', {
            workflow_type: workflowMap[workflowType],
            project_name: projectName,
            initialize_project: true
        });

        outputChannel.info('Workflow started successfully');
        
        // Show results in output channel
        outputChannel.info('Workflow details:');
        response.content.forEach(content => {
            outputChannel.info(content.text);
        });

        vscode.window.showInformationMessage(`${workflowType} workflow started for ${projectName}`);

    } catch (error) {
        outputChannel?.error(`Workflow start failed: ${error}`);
        vscode.window.showErrorMessage(`Workflow start failed: ${error}`);
    }
}