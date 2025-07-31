import * as vscode from 'vscode';
import { MCPClient } from '../mcpClient';
import { SuperAgentsOutputChannel } from '../ui/outputChannel';

export async function startAnalystResearch(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const topic = await vscode.window.showInputBox({
            prompt: 'Enter research topic',
            placeholder: 'e.g., Market analysis for AI development tools'
        });

        if (!topic) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Starting analyst research on: ${topic}`);

        const response = await mcpClient.callTool('sa-research-market', {
            topic: topic,
            depth: 'comprehensive'
        });

        outputChannel.info('Analyst research completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`Analyst research failed: ${error}`);
        vscode.window.showErrorMessage(`Analyst research failed: ${error}`);
    }
}

export async function createPRD(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const feature = await vscode.window.showInputBox({
            prompt: 'Enter feature description',
            placeholder: 'e.g., User authentication system with OAuth'
        });

        if (!feature) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Creating PRD for: ${feature}`);

        const response = await mcpClient.callTool('sa-generate-prd', {
            feature: feature,
            scope: 'detailed'
        });

        outputChannel.info('PRD creation completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`PRD creation failed: ${error}`);
        vscode.window.showErrorMessage(`PRD creation failed: ${error}`);
    }
}

export async function designArchitecture(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const system = await vscode.window.showInputBox({
            prompt: 'Enter system description',
            placeholder: 'e.g., Microservice architecture for e-commerce platform'
        });

        if (!system) {
            return;
        }

        const architectureType = await vscode.window.showQuickPick([
            'Microservices',
            'Monolith',
            'Serverless',
            'Hybrid'
        ], {
            placeHolder: 'Select architecture type'
        });

        if (!architectureType) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Designing architecture for: ${system}`);

        const response = await mcpClient.callTool('sa-create-architecture', {
            system: system,
            type: architectureType.toLowerCase(),
            detail_level: 'comprehensive'
        });

        outputChannel.info('Architecture design completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`Architecture design failed: ${error}`);
        vscode.window.showErrorMessage(`Architecture design failed: ${error}`);
    }
}

export async function implementStory(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const storyId = await vscode.window.showInputBox({
            prompt: 'Enter story ID or description',
            placeholder: 'e.g., US-001 or Create user login page'
        });

        if (!storyId) {
            return;
        }

        outputChannel.show();
        outputChannel.info(`Implementing story: ${storyId}`);

        const response = await mcpClient.callTool('sa-implement-story', {
            story_id: storyId,
            include_tests: true
        });

        outputChannel.info('Story implementation completed');
        
        // Show results in output channel
        outputChannel.info('Implementation details:');
        response.content.forEach(content => {
            outputChannel.info(content.text);
        });

        vscode.window.showInformationMessage('Story implementation completed. Check output for details.');

    } catch (error) {
        outputChannel?.error(`Story implementation failed: ${error}`);
        vscode.window.showErrorMessage(`Story implementation failed: ${error}`);
    }
}

export async function reviewCode(
    mcpClient: MCPClient | undefined,
    outputChannel: SuperAgentsOutputChannel | undefined
): Promise<void> {
    if (!mcpClient || !outputChannel) {
        vscode.window.showErrorMessage('Super Agents not properly initialized');
        return;
    }

    try {
        const activeEditor = vscode.window.activeTextEditor;
        let codeToReview = '';
        let fileName = 'current selection';

        if (activeEditor) {
            const selection = activeEditor.selection;
            if (!selection.isEmpty) {
                // Review selected code
                codeToReview = activeEditor.document.getText(selection);
                fileName = `selection in ${activeEditor.document.fileName}`;
            } else {
                // Review entire file
                codeToReview = activeEditor.document.getText();
                fileName = activeEditor.document.fileName;
            }
        } else {
            vscode.window.showErrorMessage('No active editor or selection found');
            return;
        }

        outputChannel.show();
        outputChannel.info(`Reviewing code in: ${fileName}`);

        const response = await mcpClient.callTool('sa-review-code', {
            code: codeToReview,
            file_path: fileName,
            review_type: 'comprehensive'
        });

        outputChannel.info('Code review completed');
        
        // Show results in a new document
        const doc = await vscode.workspace.openTextDocument({
            content: response.content.map(c => c.text).join('\n'),
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);

    } catch (error) {
        outputChannel?.error(`Code review failed: ${error}`);
        vscode.window.showErrorMessage(`Code review failed: ${error}`);
    }
}