import * as vscode from 'vscode';

export class SuperAgentsStatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private mcpStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
    private activeAgent: string | undefined;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBarItem.command = 'superAgents.showTasks';
        this.updateStatusBar();
        this.statusBarItem.show();
    }

    setMCPStatus(status: 'connected' | 'disconnected' | 'connecting'): void {
        this.mcpStatus = status;
        this.updateStatusBar();
    }

    setActiveAgent(agent: string | undefined): void {
        this.activeAgent = agent;
        this.updateStatusBar();
    }

    private updateStatusBar(): void {
        let icon: string;
        let color: string | undefined;

        switch (this.mcpStatus) {
            case 'connected':
                icon = '$(plug)';
                color = undefined; // Default color
                break;
            case 'connecting':
                icon = '$(loading~spin)';
                color = 'statusBarItem.warningForeground';
                break;
            case 'disconnected':
            default:
                icon = '$(plug)';
                color = 'statusBarItem.errorForeground';
                break;
        }

        let text = `${icon} Super Agents`;
        
        if (this.activeAgent) {
            text += ` (${this.activeAgent})`;
        }

        this.statusBarItem.text = text;
        this.statusBarItem.color = color;

        // Update tooltip
        let tooltip = 'Super Agents Framework\n';
        tooltip += `MCP Status: ${this.mcpStatus}`;
        if (this.activeAgent) {
            tooltip += `\nActive Agent: ${this.activeAgent}`;
        }
        tooltip += '\n\nClick to show tasks';

        this.statusBarItem.tooltip = tooltip;
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}