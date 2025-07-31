import * as vscode from 'vscode';
import { MCPClient } from '../mcpClient';
import { SuperAgentsOutputChannel } from '../ui/outputChannel';
import { TaskTreeDataProvider } from '../providers/treeDataProvider';

export async function initializeProject(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name',
            placeholder: 'e.g., my-super-project'
        });

        if (!projectName) {
            return;
        }

        const projectType = await vscode.window.showQuickPick([
            'Web Application',
            'API Service',
            'Mobile App',
            'Desktop Application',
            'Library/Package'
        ], {
            placeHolder: 'Select project type'
        });

        if (!projectType) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Initializing project: ${projectName}`);

        const response = await mcpClient.callTool('sa-initialize-project', {
            project_name: projectName,
            project_type: projectType.toLowerCase().replace(/ /g, '-'),
            setup_structure: true
        });

        outputChannel.info('Project initialization completed');
        
        // Show results in output channel
        outputChannel.info('Initialization details:');
        response.content.forEach(content => {
            outputChannel.info(content.text);
        });

        vscode.window.showInformationMessage(`Project ${projectName} initialized successfully`);

    } catch (error) {
        outputChannel?.error(`Project initialization failed: ${error}`);
        vscode.window.showErrorMessage(`Project initialization failed: ${error}`);
    }
}

export async function listTasks(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const filterOptions = await vscode.window.showQuickPick([
            'All Tasks',
            'Pending Tasks',
            'In Progress Tasks',
            'Completed Tasks',
            'High Priority Tasks'
        ], {
            placeHolder: 'Select task filter'
        });

        if (!filterOptions) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Listing tasks: ${filterOptions}`);

        const filterMap: { [key: string]: any } = {
            'All Tasks': {},
            'Pending Tasks': { status: 'pending' },
            'In Progress Tasks': { status: 'in_progress' },
            'Completed Tasks': { status: 'completed' },
            'High Priority Tasks': { priority: 'high' }
        };

        const response = await mcpClient.callTool('sa-list-tasks', {
            filters: filterMap[filterOptions],
            include_details: true
        });

        outputChannel.info('Task listing completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`Task listing failed: ${error}`);
        vscode.window.showErrorMessage(`Task listing failed: ${error}`);
    }
}

export async function createStory(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const storyTitle = await vscode.window.showInputBox({
            prompt: 'Enter story title',
            placeholder: 'e.g., User can login with email and password'
        });

        if (!storyTitle) {
            return;
        }

        const storyType = await vscode.window.showQuickPick([
            'Feature',
            'Bug Fix',
            'Technical Debt',
            'Enhancement',
            'Research'
        ], {
            placeHolder: 'Select story type'
        });

        if (!storyType) {
            return;
        }

        const priority = await vscode.window.showQuickPick([
            'High',
            'Medium',
            'Low'
        ], {
            placeHolder: 'Select priority'
        });

        if (!priority) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Creating story: ${storyTitle}`);

        const response = await mcpClient.callTool('sa-create-story', {
            title: storyTitle,
            type: storyType.toLowerCase().replace(/ /g, '_'),
            priority: priority.toLowerCase(),
            include_acceptance_criteria: true
        });

        outputChannel.info('Story creation completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`Story creation failed: ${error}`);
        vscode.window.showErrorMessage(`Story creation failed: ${error}`);
    }
}

export async function runTests(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const testScope = await vscode.window.showQuickPick([
            'All Tests',
            'Unit Tests',
            'Integration Tests',
            'End-to-End Tests',
            'Current File Tests'
        ], {
            placeHolder: 'Select test scope'
        });

        if (!testScope) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Running tests: ${testScope}`);

        let testPath = '';
        if (testScope === 'Current File Tests') {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                testPath = activeEditor.document.fileName;
            }
        }

        const response = await mcpClient.callTool('sa-run-tests', {
            scope: testScope.toLowerCase().replace(/ /g, '_'),
            test_path: testPath,
            generate_report: true
        });

        outputChannel.info('Test execution completed');
        
        // Show results in output channel
        outputChannel.info('Test results:');
        response.content.forEach(content => {
            outputChannel.info(content.text);
        });

        vscode.window.showInformationMessage('Test execution completed. Check output for results.');

    } catch (error) {
        outputChannel?.error(`Test execution failed: ${error}`);
        vscode.window.showErrorMessage(`Test execution failed: ${error}`);
    }
}

export async function showTasks(taskTreeDataProvider: TaskTreeDataProvider | undefined): Promise<void> {
    if (!taskTreeDataProvider) {
        vscode.window.showErrorMessage('Task provider not initialized');
        return;
    }

    // Focus on the tasks view
    vscode.commands.executeCommand('superAgentsTasks.focus');
}

export async function refreshTasks(taskTreeDataProvider: TaskTreeDataProvider | undefined): Promise<void> {
    if (!taskTreeDataProvider) {
        vscode.window.showErrorMessage('Task provider not initialized');
        return;
    }

    taskTreeDataProvider.refresh();
    vscode.window.showInformationMessage('Tasks refreshed');
}