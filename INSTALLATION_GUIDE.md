# Super Agents - Portable Installation & Setup Guide

This guide shows how to install Super Agents once and use it in any project directory.

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Git**

## Installation Process

### Step 1: Install Super Agents CLI (One-Time Setup)

```bash
# 1. Clone the Super Agents framework
git clone https://github.com/your-username/super-agents.git
cd super-agents

# 2. Install dependencies
npm install

# 3. Test the CLI
node super-agents-cli/index.js --help

# 4. Install globally for easy access anywhere
npm link
# Now you can use 'sa' command from any directory
sa --help
```

### Step 2: Initialize in Your Projects

Super Agents can be initialized in any project directory:

```bash
# Navigate to any project
cd /path/to/your/existing/project

# Initialize Super Agents (interactive mode)
sa init --interactive

# Or specify details directly
sa init --name="My Project" --template=fullstack

# Or create in a new directory
sa init --name="New Project" --interactive
# Will ask where to create the project
```

### Step 3: IDE Integration

```bash
# From your project directory (or any subdirectory)
sa integrate

# Super Agents will:
# 1. Auto-detect your project location
# 2. Ask for IDE preference if not specified
# 3. Create configuration files with correct absolute paths
```

## How Portable Installation Works

### Project Structure
When you run `sa init` in a project directory, Super Agents creates:

```
your-project/
├── .super-agents/           # Super Agents project data
│   ├── installation.json    # Reference to SA CLI installation
│   ├── config/             # Project-specific configuration
│   ├── tasks/              # Project tasks and state
│   ├── logs/               # Operation logs
│   └── templates/          # Custom templates
├── .env                    # API keys (if requested)
├── .claude/                # IDE configurations (created by sa integrate)
├── .cursor/
├── .vscode/
└── your-project-files...
```

### Benefits
✅ **One Installation, Many Projects**: Install Super Agents once, use everywhere  
✅ **Project Isolation**: Each project has its own configuration and state  
✅ **Absolute Paths**: IDE integrations use correct paths regardless of location  
✅ **Auto-Detection**: Commands automatically find your project structure  
✅ **No Duplication**: Doesn't copy large SA framework files to each project  

## Initial Setup

### 1. Health Check

First, run the health check to ensure everything is working:

```bash
sa doctor
```

Expected output should show:
- ✅ Project is initialized
- ⚠️ API keys warnings (expected if not configured)
- ✅ MCP server file exists
- ✅ Agents directory exists

### 2. Fix Common Issues

If health check shows problems, run the repair command:

```bash
sa repair
```

This will automatically fix:
- Missing directory structures
- Configuration file issues
- Environment template creation

### 3. API Keys Configuration (Optional)

For AI functionality, set up API keys:

```bash
# Create .env file from template
cp .env.template .env

# Edit .env file and add your API keys:
# ANTHROPIC_API_KEY=your_anthropic_key_here
# OPENAI_API_KEY=your_openai_key_here
```

## Testing All Commands

### Core Commands

```bash
# 1. Help and version
sa --help
sa --version

# 2. Agent management
sa agent list
sa agent info analyst
sa agent test pm

# 3. System diagnostics
sa doctor
sa doctor --verbose
sa doctor --component=mcp-server

# 4. System repair
sa repair
sa repair --issue=configuration

# 5. Project status
sa status
sa status --verbose
```

### Integration Commands

```bash
# 1. IDE integration
sa integrate --ide=claude-code --mcp
sa integrate --ide=cursor --mcp
sa integrate --ide=generic --standalone

# 2. Check integration
sa doctor --component=ide-integration

# 3. View created configuration
cat .claude/desktop_app_config.json  # For Claude Code
cat .cursor/settings.json           # For Cursor
```

### Planning Commands

```bash
# 1. Interactive planning (will prompt for inputs)
sa plan --agent=analyst

# Note: This command is interactive. For testing, you can:
# - Use Ctrl+C to exit
# - Or answer the prompts to complete a full planning session

# 2. Quick planning help
sa plan --help
```

### Task Management

```bash
# 1. List existing tasks
sa task list

# 2. Show task details
sa task show 1

# 3. Task management help
sa task --help
sa task create --help
sa task update --help
```

### Workflow Commands

```bash
# 1. Workflow help
sa workflow --help

# 2. Workflow status
sa workflow status

# 3. Available workflow types
sa workflow start --help
```

### Configuration Commands

```bash
# 1. Configuration help
sa config --help

# 2. List configuration (if implemented)
sa config --list

# 3. Set configuration value
sa config --set key=value
```

## IDE Integration Testing

### Claude Code Integration

1. Run integration command:
```bash
sa integrate --ide=claude-code --mcp
```

2. Check created configuration:
```bash
cat .claude/desktop_app_config.json
```

3. Verify MCP server path is correct:
```bash
ls -la sa-engine/mcp-server/index.js
```

4. Test MCP server startup:
```bash
node sa-engine/mcp-server/index.js --help
```

### Testing MCP Server

```bash
# 1. Check MCP server exists
ls -la sa-engine/mcp-server/index.js

# 2. Test MCP server help
node sa-engine/mcp-server/index.js --help

# 3. Test MCP server status
node sa-engine/mcp-server/index.js --status

# 4. Check MCP tools directory
ls -la sa-engine/mcp-server/tools/
```

## Common Issues and Solutions

### Issue: Command not found
```bash
# Solution: Use full path or install globally
node super-agents-cli/index.js [command]
# OR
npm link
```

### Issue: Missing dependencies
```bash
# Solution: Install dependencies
npm install
```

### Issue: API key warnings
```bash
# Solution: Set up environment variables
export ANTHROPIC_API_KEY=your_key_here
# OR create .env file
```

### Issue: MCP server path incorrect
```bash
# Solution: Use absolute paths in IDE configuration
# Edit .claude/desktop_app_config.json with full paths
```

### Issue: Permission errors
```bash
# Solution: Check file permissions
chmod +x super-agents-cli/index.js
```

## Validation Checklist

After installation, verify these work:

- [ ] `sa --help` shows help menu
- [ ] `sa agent list` shows 10 agents
- [ ] `sa doctor` completes health check
- [ ] `sa integrate --ide=claude-code --mcp` creates config file
- [ ] `sa status` shows project information
- [ ] `sa plan --help` shows planning options
- [ ] `sa workflow --help` shows workflow options
- [ ] `sa task list` shows task information
- [ ] MCP server can start: `node sa-engine/mcp-server/index.js --help`

## Development Testing

For development and testing purposes:

```bash
# Run with file watching
npm run dev

# Run tests (if available)
npm test

# Check linting
npm run lint

# Start development server
npm start
```

## Support

If you encounter issues:

1. Run `sa doctor --verbose` for detailed diagnostics
2. Check the troubleshooting section in README.md
3. Review log files in `sa-engine/logs/` (if they exist)
4. Submit issues with full error output and system information

## Next Steps

After successful installation:

1. Set up IDE integration for your preferred IDE
2. Configure API keys for AI functionality
3. Try a planning session: `sa plan --agent=analyst`
4. Explore workflow management: `sa workflow start`
5. Review the full documentation in `docs/`

---

Generated on $(date) by Super Agents Installation Guide