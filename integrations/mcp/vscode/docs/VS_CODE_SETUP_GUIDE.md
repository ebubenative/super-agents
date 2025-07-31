# Super Agents VS Code Integration Setup Guide

Complete guide for integrating Super Agents framework with Visual Studio Code for AI-powered development assistance.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Software
- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 18.0.0 or higher
- **Super Agents Framework**: Installed in your project

### Required Environment Variables
```bash
# Required for Claude API access
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# Optional for GPT model access
export OPENAI_API_KEY="your_openai_api_key_here"

# Optional project configuration
export SA_PROJECT_ROOT="."
export SA_LOG_LEVEL="info"
```

## Installation Methods

### Method 1: Extension Installation (Recommended)

1. **Install the Super Agents VS Code Extension**
   ```bash
   # From VS Code marketplace (when available)
   # Extensions -> Search "Super Agents" -> Install
   
   # Or from VSIX file
   code --install-extension super-agents-vscode.vsix
   ```

2. **Reload VS Code**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

3. **Verify Installation**
   - Check status bar for Super Agents indicator
   - Open Command Palette (`Ctrl+Shift+P`) and search "Super Agents"

### Method 2: Manual Workspace Setup

1. **Run the Setup Script**
   ```bash
   node integrations/mcp/vscode/setup-vscode.js
   ```

2. **Reload VS Code Window**
   ```bash
   # Or use Command Palette
   # Ctrl+Shift+P -> "Developer: Reload Window"
   ```

3. **Validate Setup**
   ```bash
   node integrations/mcp/vscode/validate-setup.js
   ```

## Configuration

### Workspace Settings

The setup creates `.vscode/settings.json` with:

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

### Task Configuration

VS Code tasks are configured in `.vscode/tasks.json`:

| Task Label | Command | Description |
|------------|---------|-------------|
| SA: Start Analyst Research | `sa-research-market` | Market research and analysis |
| SA: Create PRD with PM | `sa-generate-prd` | Product Requirements Document |
| SA: Design Architecture | `sa-create-architecture` | System architecture design |
| SA: Implement Story | `sa-implement-story` | User story implementation |
| SA: Review Code | `sa-review-code` | Code review and analysis |
| SA: Track Progress | `sa-track-progress` | Workflow progress tracking |

### Keyboard Shortcuts

Default shortcuts in `.vscode/keybindings.json`:

| Shortcut | Mac | Command |
|----------|-----|---------|
| `Ctrl+Shift+A R` | `Cmd+Shift+A R` | Start Analyst Research |
| `Ctrl+Shift+A P` | `Cmd+Shift+A P` | Create PRD with PM |
| `Ctrl+Shift+A D` | `Cmd+Shift+A D` | Design Architecture |
| `Ctrl+Shift+A I` | `Cmd+Shift+A I` | Implement Story |
| `Ctrl+Shift+A C` | `Cmd+Shift+A C` | Review Code |
| `Ctrl+Shift+A T` | `Cmd+Shift+A T` | Track Progress |

## Usage

### Command Palette Access

1. **Open Command Palette**
   - Windows/Linux: `Ctrl+Shift+P`
   - Mac: `Cmd+Shift+P`

2. **Search for Super Agents Commands**
   - Type "SA:" to see all available commands
   - Type "Super Agents:" for full command names

### Task Runner Access

1. **Open Task Runner**
   - `Ctrl+Shift+P` → "Tasks: Run Task"
   - Select task starting with "SA:"

2. **Run with Keyboard Shortcuts**
   - Use predefined shortcuts (see table above)

### Code Snippets

Type snippet prefixes and press `Tab`:

| Prefix | Language | Description |
|--------|----------|-------------|
| `sa-research` | JavaScript | Research tool template |
| `sa-prd` | JavaScript | PRD generation template |
| `sa-arch` | JavaScript | Architecture design template |
| `sa-story` | JavaScript | Story implementation template |
| `sa-review` | JavaScript | Code review template |
| `sa-task-interface` | TypeScript | Task interface definition |
| `sa-mcp-call` | TypeScript | MCP tool call template |

### Status Bar Integration

The status bar shows:
- **Connection Status**: MCP server connection state
- **Active Agent**: Currently running agent (if any)
- **Click Action**: Click to show task view

## Troubleshooting

### Common Issues

#### 1. MCP Server Won't Start

**Symptoms:**
- Status bar shows disconnected
- Commands fail with connection errors

**Solutions:**
```bash
# Check if Super Agents is installed
ls sa-engine/mcp-server/index.js

# Verify API keys are set
echo $ANTHROPIC_API_KEY

# Test MCP server manually
node sa-engine/mcp-server/index.js --version

# Run validation script
node integrations/mcp/vscode/validate-setup.js
```

#### 2. Commands Not Working

**Symptoms:**
- Command palette doesn't show Super Agents commands
- Keyboard shortcuts don't work

**Solutions:**
```bash
# Reload VS Code window
# Ctrl+Shift+P -> "Developer: Reload Window"

# Check if extension installed
code --list-extensions | grep super-agents

# Verify workspace configuration
cat .vscode/settings.json | grep super-agents
```

#### 3. Tasks Not Available

**Symptoms:**
- "Tasks: Run Task" doesn't show SA tasks
- Task execution fails

**Solutions:**
```bash
# Check tasks.json exists and is valid
cat .vscode/tasks.json

# Validate JSON syntax
node -e "JSON.parse(require('fs').readFileSync('.vscode/tasks.json', 'utf8'))"

# Re-run setup
node integrations/mcp/vscode/setup-vscode.js
```

### Debug Information

#### Check Extension Status
1. Open Output panel (`Ctrl+Shift+U`)
2. Select "Super Agents" from dropdown
3. Review logs for errors

#### Check MCP Server Logs
```bash
# Run MCP server with debug logging
SA_LOG_LEVEL=debug node sa-engine/mcp-server/index.js
```

#### Validate Configuration
```bash
# Run full validation
node integrations/mcp/vscode/validate-setup.js

# Check specific components
node integrations/mcp/vscode/validate-setup.js --check-config
node integrations/mcp/vscode/validate-setup.js --check-tools
```

## Advanced Configuration

### Custom Agent Configuration

Create agent-specific files in `.vscode/agents/`:

```markdown
# .vscode/agents/custom-agent.md

## Custom Agent Configuration

### Role
Specialized agent for specific project needs

### Tools
- List of available tools
- Custom tool configurations

### Usage
- How to invoke this agent
- Expected inputs and outputs
```

### Custom Workflows

Define workflows in `.vscode/workflows/`:

```yaml
# .vscode/workflows/custom-workflow.yaml
name: Custom Development Workflow
description: Tailored workflow for project needs

steps:
  - agent: analyst
    tool: sa-research-market
    parameters:
      topic: "project requirements"
      
  - agent: architect  
    tool: sa-create-architecture
    depends_on: [research]
    
  - agent: developer
    tool: sa-implement-story
    depends_on: [architecture]
```

### Environment-Specific Settings

Create environment-specific configurations:

```json
// .vscode/settings-dev.json
{
  "super-agents.logLevel": "debug",
  "super-agents.enableNotifications": true
}

// .vscode/settings-prod.json  
{
  "super-agents.logLevel": "warn",
  "super-agents.enableNotifications": false
}
```

### Integration with Other Extensions

#### GitHub Copilot Integration
```json
{
  "github.copilot.enable": {
    "*": true,
    "markdown": true
  },
  "super-agents.integrations.copilot": true
}
```

#### AI-Powered Extensions
```json
{
  "super-agents.integrations.ai": {
    "enabled": true,
    "providers": ["copilot", "codewhisperer", "tabnine"]
  }
}
```

## Best Practices

### 1. Project Organization
- Keep agent configurations in `.vscode/agents/`
- Store workflow definitions in `.vscode/workflows/`
- Use descriptive task names

### 2. Security
- Never commit API keys to repository
- Use environment variables for sensitive data
- Review generated code before committing

### 3. Performance
- Use specific tools rather than general ones
- Monitor MCP server resource usage
- Clean up old task outputs regularly

### 4. Collaboration
- Share `.vscode/` configuration with team
- Document custom agents and workflows
- Use consistent naming conventions

## Support and Resources

### Documentation
- [Super Agents Documentation](../../../docs/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [VS Code Extension API](https://code.visualstudio.com/api)

### Community
- [GitHub Issues](https://github.com/super-agents/super-agents/issues)
- [Discussions](https://github.com/super-agents/super-agents/discussions)
- [Discord Community](https://discord.gg/super-agents)

### Getting Help
1. Run validation script first
2. Check output logs for errors
3. Review this troubleshooting guide
4. Search existing GitHub issues
5. Create new issue with detailed information

---

**Happy coding with Super Agents in VS Code!** 🚀