# Super Agents VS Code Integration

Complete VS Code integration for the Super Agents framework, providing AI-powered development assistance through specialized agents and automated workflows.

## 🚀 Features

### VS Code Extension (`super-agents-vscode/`)
- **Full MCP Integration**: Direct connection to Super Agents MCP server
- **Command Palette**: Access all 40+ agent tools via Command Palette
- **Task Tree View**: Visual task management in Explorer panel
- **Status Bar Integration**: Real-time MCP connection and agent status
- **Keyboard Shortcuts**: Quick access to common agent operations
- **Code Snippets**: Pre-built templates for agent interactions

### Standalone Workspace Setup
- **Automated Configuration**: One-command setup for any VS Code workspace
- **Task Integration**: VS Code tasks for all agent operations
- **Keybinding Configuration**: Customizable keyboard shortcuts
- **Snippet Library**: Code templates for all supported languages
- **Validation Tools**: Comprehensive setup verification

## 📁 Directory Structure

```
integrations/mcp/vscode/
├── super-agents-vscode/           # VS Code Extension
│   ├── package.json              # Extension manifest
│   ├── src/
│   │   ├── extension.ts          # Main extension entry point
│   │   ├── mcpClient.ts          # MCP protocol client
│   │   ├── commands/             # Command implementations
│   │   │   ├── agentCommands.ts  # Agent-specific commands
│   │   │   ├── workflowCommands.ts # Workflow management
│   │   │   └── taskCommands.ts   # Task management commands
│   │   ├── providers/            # VS Code providers
│   │   │   └── treeDataProvider.ts # Task tree view
│   │   └── ui/                   # UI components
│   │       ├── statusBar.ts      # Status bar integration
│   │       └── outputChannel.ts  # Output logging
│   └── README.md                 # Extension documentation
├── templates/                    # Configuration templates
│   └── workspace-settings.json  # Complete workspace config
├── configs/                      # Standalone configurations
│   ├── keybindings.json         # Keyboard shortcuts
│   └── snippets.json            # Code snippets
├── docs/                        # Documentation
│   └── VS_CODE_SETUP_GUIDE.md   # Complete setup guide
├── setup-vscode.js              # Automated setup script
├── validate-setup.js            # Setup validation tool
└── README.md                    # This file
```

## 🛠️ Installation

### Method 1: VS Code Extension (Recommended)

1. **Install Extension**
   ```bash
   # Build and install locally
   cd super-agents-vscode
   npm install
   npm run compile
   npm run package
   code --install-extension super-agents-vscode-1.0.0.vsix
   ```

2. **Configure Environment**
   ```bash
   export ANTHROPIC_API_KEY="your_key_here"
   export OPENAI_API_KEY="your_key_here"  # Optional
   ```

3. **Reload VS Code**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

### Method 2: Standalone Workspace Setup

1. **Run Setup Script**
   ```bash
   node integrations/mcp/vscode/setup-vscode.js
   ```

2. **Validate Configuration**
   ```bash
   node integrations/mcp/vscode/validate-setup.js
   ```

3. **Reload VS Code**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

## 🎯 Usage

### Command Palette Commands

Access via `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac):

#### Agent Commands
- `Super Agents: Start Analyst Research` - Market research and competitive analysis
- `Super Agents: Create PRD with PM` - Product Requirements Document generation
- `Super Agents: Design Architecture` - System architecture and design patterns
- `Super Agents: Implement Story` - User story implementation with testing
- `Super Agents: Review Code` - Comprehensive code review and quality analysis

#### Workflow Commands  
- `Super Agents: Track Workflow Progress` - Monitor project progress and milestones
- `Super Agents: Validate Dependencies` - Check task dependencies and conflicts
- `Super Agents: Start Workflow` - Initialize development workflows

#### Task Commands
- `Super Agents: Initialize Project` - Set up new Super Agents project
- `Super Agents: List Tasks` - View and filter project tasks
- `Super Agents: Create Story` - Create user stories with acceptance criteria
- `Super Agents: Run Tests` - Execute test suites and validation
- `Super Agents: Show Tasks` - Focus on task tree view

### Keyboard Shortcuts

| Command | Windows/Linux | Mac | Description |
|---------|---------------|-----|-------------|
| Start Analyst Research | `Ctrl+Shift+A R` | `Cmd+Shift+A R` | Market research |
| Create PRD | `Ctrl+Shift+A P` | `Cmd+Shift+A P` | Generate PRD |
| Design Architecture | `Ctrl+Shift+A D` | `Cmd+Shift+A D` | System design |
| Implement Story | `Ctrl+Shift+A I` | `Cmd+Shift+A I` | Code implementation |
| Review Code | `Ctrl+Shift+A C` | `Cmd+Shift+A C` | Code analysis |
| Track Progress | `Ctrl+Shift+A T` | `Cmd+Shift+A T` | Progress monitoring |

### Code Snippets

Type snippet prefixes in supported files:

#### JavaScript/TypeScript
- `sa-research` - Market research tool template
- `sa-prd` - PRD generation template  
- `sa-arch` - Architecture design template
- `sa-story` - Story implementation template
- `sa-review` - Code review template
- `sa-mcp-call` - MCP tool call template

#### JSON
- `sa-workspace` - Workspace configuration template
- `sa-task-def` - VS Code task definition template

#### Markdown
- `sa-docs` - Project documentation template

## ⚙️ Configuration

### Extension Settings

Configure via VS Code settings (`Ctrl+,`):

```json
{
  "super-agents.enabled": true,
  "super-agents.mcpServerPath": "./sa-engine/mcp-server/index.js",
  "super-agents.projectRoot": ".",
  "super-agents.logLevel": "info",
  "super-agents.autoStartMcp": true,
  "super-agents.showStatusBar": true
}
```

### Workspace Configuration

The setup creates comprehensive workspace configuration:

- **`.vscode/settings.json`** - Extension and workspace settings
- **`.vscode/tasks.json`** - All agent tasks with input prompts
- **`.vscode/launch.json`** - Debug configurations for MCP server
- **`.vscode/keybindings.json`** - Custom keyboard shortcuts
- **`.vscode/snippets/`** - Code templates for all languages
- **`.vscode/agents/`** - Agent-specific documentation
- **`.vscode/workflows/`** - Custom workflow definitions

## 🔧 Development

### Building the Extension

```bash
cd super-agents-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package

# Run tests
npm test
```

### Testing MCP Integration

```bash
# Test MCP server connection
node sa-engine/mcp-server/index.js --version

# Debug MCP server
SA_LOG_LEVEL=debug node sa-engine/mcp-server/index.js

# Validate VS Code setup
node integrations/mcp/vscode/validate-setup.js
```

## 🏗️ Architecture

### Extension Architecture

```
VS Code Extension
├── Extension Host Process
│   ├── MCPClient - Manages MCP server connection
│   ├── TaskTreeDataProvider - Task management UI
│   ├── StatusBar - Connection status display
│   └── OutputChannel - Logging and feedback
├── Command Handlers
│   ├── AgentCommands - Direct agent interactions
│   ├── WorkflowCommands - Workflow management
│   └── TaskCommands - Task operations
└── MCP Server Process
    ├── Tool Registry - 40+ specialized tools
    ├── Agent System - 8 specialized agents
    └── Task Management - Project coordination
```

### Integration Patterns

1. **Extension-First**: Primary integration via VS Code extension with full MCP protocol support
2. **Workspace Configuration**: Manual setup using VS Code native features (tasks, keybindings, snippets)
3. **Hybrid Approach**: Extension + workspace configuration for maximum functionality
4. **Standalone Mode**: Pure workspace configuration without extension dependency

## 🔍 Troubleshooting

### Common Issues

#### MCP Server Connection
```bash
# Check server status
node integrations/mcp/vscode/validate-setup.js

# Debug server startup
SA_LOG_LEVEL=debug node sa-engine/mcp-server/index.js

# Verify API keys
echo $ANTHROPIC_API_KEY
```

#### Extension Loading
```bash
# Check extension installation
code --list-extensions | grep super-agents

# Reload VS Code window
# Ctrl+Shift+P -> "Developer: Reload Window"

# Check output logs
# View -> Output -> Select "Super Agents"
```

#### Task Configuration
```bash
# Validate tasks.json
node -e "JSON.parse(require('fs').readFileSync('.vscode/tasks.json', 'utf8'))"

# Re-run setup
node integrations/mcp/vscode/setup-vscode.js
```

### Debug Tools

- **Validation Script**: `validate-setup.js` - Comprehensive setup checking
- **Setup Script**: `setup-vscode.js` - Automated configuration setup
- **Extension Logs**: VS Code Output panel → "Super Agents"
- **MCP Server Logs**: Debug mode with `SA_LOG_LEVEL=debug`

## 📚 Documentation

- **[Setup Guide](docs/VS_CODE_SETUP_GUIDE.md)** - Complete installation and configuration guide
- **[Extension README](super-agents-vscode/README.md)** - Extension-specific documentation
- **[Super Agents Docs](../../../docs/)** - Framework documentation
- **[MCP Protocol](https://modelcontextprotocol.io/)** - MCP specification

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/vscode-enhancement`)
3. Make changes and add tests
4. Update documentation
5. Submit pull request

### Development Setup

```bash
# Clone repository
git clone https://github.com/super-agents/super-agents.git
cd super-agents/integrations/mcp/vscode

# Install extension dependencies
cd super-agents-vscode
npm install

# Build extension
npm run compile

# Run tests
npm test
```

## 📄 License

MIT License - see [LICENSE](../../../LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/super-agents/super-agents/issues)
- **Discussions**: [Community discussions](https://github.com/super-agents/super-agents/discussions)
- **Documentation**: [Complete framework docs](../../../docs/)

---

**Enjoy AI-powered development with Super Agents in VS Code!** 🚀

*Part of the Super Agents Framework - Phase 12: VS Code Integration*