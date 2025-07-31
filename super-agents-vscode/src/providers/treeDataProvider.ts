import * as vscode from 'vscode';
import { MCPClient } from '../mcpClient';

export interface TaskItem {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    type: string;
    dependencies?: string[];
    children?: TaskItem[];
}

export class TaskTreeDataProvider implements vscode.TreeDataProvider<TaskItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined | null | void> = new vscode.EventEmitter<TaskItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private tasks: TaskItem[] = [];

    constructor(private mcpClient: MCPClient | undefined) {
        this.loadTasks();
    }

    refresh(): void {
        this.loadTasks();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(
            element.title, 
            element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
        );

        // Set icon based on status
        switch (element.status) {
            case 'completed':
                treeItem.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
                break;
            case 'in_progress':
                treeItem.iconPath = new vscode.ThemeIcon('clock', new vscode.ThemeColor('charts.yellow'));
                break;
            case 'pending':
                treeItem.iconPath = new vscode.ThemeIcon('circle-outline', new vscode.ThemeColor('charts.blue'));
                break;
        }

        // Set context value for menu contributions
        treeItem.contextValue = `task-${element.status}`;

        // Set tooltip
        treeItem.tooltip = `${element.title}\nStatus: ${element.status}\nPriority: ${element.priority}\nType: ${element.type}`;

        // Set description
        treeItem.description = `[${element.priority.toUpperCase()}] ${element.status.replace('_', ' ').toUpperCase()}`;

        return treeItem;
    }

    getChildren(element?: TaskItem): Thenable<TaskItem[]> {
        if (!element) {
            // Return root level tasks
            return Promise.resolve(this.tasks);
        } else {
            // Return children of the element
            return Promise.resolve(element.children || []);
        }
    }

    private async loadTasks(): Promise<void> {
        try {
            if (this.mcpClient) {
                // In a real implementation, this would call the MCP server to get tasks
                const response = await this.mcpClient.callTool('sa-list-tasks', {
                    include_details: true,
                    format: 'tree'
                });

                // For now, use mock data since we don't have the full MCP protocol implemented
                this.tasks = this.getMockTasks();
            } else {
                this.tasks = this.getMockTasks();
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = this.getMockTasks();
        }
    }

    private getMockTasks(): TaskItem[] {
        return [
            {
                id: 'task-1',
                title: 'Setup Project Architecture',
                status: 'completed',
                priority: 'high',
                type: 'architecture',
                children: [
                    {
                        id: 'task-1-1',
                        title: 'Define system boundaries',
                        status: 'completed',
                        priority: 'high',
                        type: 'analysis'
                    },
                    {
                        id: 'task-1-2',
                        title: 'Select technology stack',
                        status: 'completed',
                        priority: 'high',
                        type: 'technical'
                    }
                ]
            },
            {
                id: 'task-2',
                title: 'Implement User Authentication',
                status: 'in_progress',
                priority: 'high',
                type: 'feature',
                children: [
                    {
                        id: 'task-2-1',
                        title: 'Create user registration API',
                        status: 'completed',
                        priority: 'high',
                        type: 'backend'
                    },
                    {
                        id: 'task-2-2',
                        title: 'Implement login functionality',
                        status: 'in_progress',
                        priority: 'high',
                        type: 'backend'
                    },
                    {
                        id: 'task-2-3',
                        title: 'Add password reset feature',
                        status: 'pending',
                        priority: 'medium',
                        type: 'backend'
                    }
                ]
            },
            {
                id: 'task-3',
                title: 'Create User Dashboard',
                status: 'pending',
                priority: 'medium',
                type: 'frontend',
                dependencies: ['task-2']
            },
            {
                id: 'task-4',
                title: 'Write Unit Tests',
                status: 'pending',
                priority: 'medium',
                type: 'testing',
                children: [
                    {
                        id: 'task-4-1',
                        title: 'Authentication tests',
                        status: 'pending',
                        priority: 'medium',
                        type: 'testing'
                    },
                    {
                        id: 'task-4-2',
                        title: 'API endpoint tests',
                        status: 'pending',
                        priority: 'low',
                        type: 'testing'
                    }
                ]
            },
            {
                id: 'task-5',
                title: 'Deploy to Staging',
                status: 'pending',
                priority: 'low',
                type: 'deployment',
                dependencies: ['task-2', 'task-3', 'task-4']
            }
        ];
    }
}