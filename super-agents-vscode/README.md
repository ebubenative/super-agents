# Super Agents VS Code Extension

AI-powered development assistance through specialized agents and automated workflows directly in VS Code.

## Features

### 🤖 Specialized AI Agents
- **Analyst**: Market research, competitive analysis, and requirements gathering
- **PM (Product Manager)**: PRD generation, epic creation, and feature prioritization  
- **Architect**: System design, technology recommendations, and architecture analysis
- **Developer**: Implementation, testing, debugging, and code validation
- **QA**: Code review, refactoring, quality validation, and test creation
- **Product Owner**: Checklist execution, story validation, and document management
- **UX Expert**: Frontend specifications, UI prompts, and wireframes
- **Scrum Master**: Story creation, workflow management, and progress tracking

### ⚡ Quick Actions
- **Command Palette Integration**: Access all agents via `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- **Keyboard Shortcuts**: Quick access to common operations
- **Context Menus**: Right-click integration for code analysis
- **Status Bar**: Real-time MCP server status and active agent display

### 📋 Task Management
- **Task Tree View**: Hierarchical task display in the explorer panel
- **Progress Tracking**: Visual indicators for task status and priority
- **Dependency Management**: Automatic dependency validation and visualization
- **Workflow Integration**: Built-in workflow management and execution

### 🔧 MCP Integration
- **MCP Server**: Automatic connection to Super Agents MCP server
- **Tool Registry**: Access to 40+ specialized MCP tools
- **Real-time Communication**: Live agent interaction and response handling
- **Error Handling**: Robust error recovery and status reporting

## Installation

### Prerequisites
- VS Code 1.74.0 or higher
- Node.js 18.0.0 or higher
- Super Agents framework installed in your project

### From VSIX Package
1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X`)
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded `.vsix` file

### From Marketplace (Coming Soon)
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Super Agents"
4. Click "Install"

## Configuration

### Extension Settings
Configure the extension via VS Code settings (`Ctrl+,`):

```json
{
  "superAgents.enabled": true,
  "superAgents.mcpServerPath": "./sa-engine/mcp-server/index.js",
  "superAgents.projectRoot": ".",
  "superAgents.logLevel": "info",
  "superAgents.autoStartMcp": true,
  "superAgents.showStatusBar": true
}
```

### Environment Variables
Set these in your environment or `.env` file:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional
SA_PROJECT_ROOT=.
SA_LOG_LEVEL=info
```

## Usage

### Command Palette Commands

Access via `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac):

#### Agent Commands
- `Super Agents: Start Analyst Research` - Conduct market research and analysis
- `Super Agents: Create PRD with PM` - Generate Product Requirements Documents
- `Super Agents: Design Architecture` - Create system architecture designs
- `Super Agents: Implement Story` - Implement user stories and features
- `Super Agents: Review Code` - Perform comprehensive code reviews

#### Workflow Commands
- `Super Agents: Track Workflow Progress` - Monitor project progress
- `Super Agents: Validate Dependencies` - Check task dependencies
- `Super Agents: Start Workflow` - Initialize project workflows

#### Task Commands
- `Super Agents: Initialize Project` - Set up new Super Agents project
- `Super Agents: List Tasks` - View and filter project tasks
- `Super Agents: Create Story` - Create new user stories
- `Super Agents: Run Tests` - Execute test suites
- `Super Agents: Show Tasks` - Focus on task tree view

### Keyboard Shortcuts

| Command | Windows/Linux | Mac |
|---------|---------------|-----|
| Start Analyst Research | `Ctrl+Shift+A R` | `Cmd+Shift+A R` |
| Create PRD | `Ctrl+Shift+A P` | `Cmd+Shift+A P` |
| Implement Story | `Ctrl+Shift+A I` | `Cmd+Shift+A I` |
| Review Code | `Ctrl+Shift+A C` | `Cmd+Shift+A C` |
| Show Tasks | `Ctrl+Shift+A T` | `Cmd+Shift+A T` |

### Task Tree View

The task tree view appears in the Explorer panel and shows:
- **Hierarchical Tasks**: Parent and child task relationships
- **Status Indicators**: Visual icons for pending, in-progress, and completed tasks
- **Priority Labels**: High, medium, and low priority indicators
- **Task Types**: Categories like architecture, feature, testing, deployment

### Status Bar Integration

The status bar shows:
- **MCP Connection Status**: Connected/disconnected indicator
- **Active Agent**: Currently running agent (if any)
- **Click Action**: Click to show task view

## Workflows

### Starting a New Project
1. Use `Super Agents: Initialize Project`
2. Select project type and provide details
3. The extension will set up the project structure
4. Use `Super Agents: Start Workflow` to begin development

### Code Review Process
1. Open a file or select code
2. Use `Super Agents: Review Code` 
3. Review the generated analysis
4. Apply suggested improvements

### Story Implementation
1. Use `Super Agents: Create Story` to define requirements
2. Use `Super Agents: Implement Story` to generate code
3. Use `Super Agents: Run Tests` to validate implementation
4. Use `Super Agents: Review Code` for quality assurance

## Troubleshooting

### Common Issues

#### MCP Server Not Starting
- Check that the MCP server path is correct in settings
- Verify Node.js and npm are installed
- Check output channel for detailed error messages
- Ensure API keys are set in environment variables

#### Extension Not Loading
- Check VS Code version (requires 1.74.0+)
- Check Node.js version (requires 18.0.0+)
- Reload VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")

#### Commands Not Working
- Verify Super Agents framework is installed in your project
- Check MCP server connection status in status bar
- Review output channel for error messages
- Try toggling MCP server connection

### Debug Information

View debug information:
1. Open Output panel (`Ctrl+Shift+U`)
2. Select "Super Agents" from dropdown  
3. Review logs for detailed information

### Getting Help

- Check the [Super Agents Documentation](https://github.com/super-agents/super-agents)
- Review VS Code extension logs in output panel
- Report issues on [GitHub Issues](https://github.com/super-agents/super-agents-vscode/issues)

## Development

### Building the Extension

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Testing

```bash
# Run tests
npm test

# Run linting
npm run lint
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## Changelog

### 1.0.0
- Initial release
- Full MCP integration
- Command palette commands
- Task tree view
- Status bar integration
- Keyboard shortcuts
- Agent command implementations

---

**Enjoy using Super Agents in VS Code!** 🚀