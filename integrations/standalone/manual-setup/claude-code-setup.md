# Super Agents - Claude Code Manual Setup Guide

## Overview
This guide provides step-by-step instructions for manually setting up Super Agents with Claude Code IDE. This approach gives you full control over the configuration and allows for customization.

## Prerequisites

### System Requirements
- **Claude Code**: Latest version installed and configured
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Version 2.0.0 or higher

### Verify Prerequisites
```bash
# Check Claude Code installation
claude-code --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Check git version
git --version
```

## Installation Steps

### Step 1: Install Super Agents Framework

#### Option A: From Source
```bash
# Clone the repository
git clone https://github.com/your-org/super-agents.git
cd super-agents

# Install dependencies
npm install

# Build the framework
npm run build
```

#### Option B: From npm (when available)
```bash
# Install globally
npm install -g super-agents-framework
```

### Step 2: Setup MCP Server Integration

#### 2.1 Locate Claude Code Configuration Directory

**macOS:**
```bash
cd ~/.config/claude-code
```

**Linux:**
```bash
cd ~/.config/claude-code
```

**Windows:**
```bash
cd %APPDATA%\claude-code
```

#### 2.2 Create or Update MCP Servers Configuration

Create or edit the `mcp_servers.json` file:

```json
{
  "mcpServers": {
    "super-agents": {
      "command": "node",
      "args": ["/path/to/super-agents/sa-engine/mcp-server/index.js"],
      "env": {
        "SA_AGENTS_PATH": "/path/to/super-agents/sa-engine/agents",
        "SA_TEMPLATES_PATH": "/path/to/super-agents/sa-engine/templates",
        "SA_TASKS_PATH": "/path/to/super-agents/sa-engine/data/tasks",
        "SA_LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important**: Replace `/path/to/super-agents` with your actual Super Agents installation path.

#### 2.3 Verify MCP Server Configuration

Test the MCP server directly:
```bash
# Navigate to MCP server directory
cd /path/to/super-agents/sa-engine/mcp-server

# Test server startup
node index.js
```

The server should start without errors and display available tools.

### Step 3: Create Claude Code Memory File

#### 3.1 Create CLAUDE.md in Your Project

Create a `CLAUDE.md` file in your project root:

```markdown
# Super Agents Framework - Claude Code Integration

## Project Context
This project uses the Super Agents framework for AI-assisted development with specialized agents.

## Available Agents

### Analyst Agent (analyst)
**Role**: Business and market analysis
**When to use**: Market research, competitive analysis, business requirements
**Key capabilities**: sa-research-market, sa-create-brief, sa-competitor-analysis

### Product Manager (pm)
**Role**: Product management and strategy  
**When to use**: Product planning, requirements documentation, feature prioritization
**Key capabilities**: sa-generate-prd, sa-create-epic, sa-prioritize-features

### Architect (architect)
**Role**: System architecture and technical design
**When to use**: System design, technology recommendations, architecture reviews
**Key capabilities**: sa-design-system, sa-tech-recommendations, sa-create-architecture

### Developer (developer)
**Role**: Software development and implementation
**When to use**: Code implementation, testing, debugging, technical problem-solving
**Key capabilities**: sa-implement-story, sa-run-tests, sa-debug-issue

### QA Engineer (qa)
**Role**: Quality assurance and code review
**When to use**: Code reviews, quality validation, testing strategy
**Key capabilities**: sa-review-code, sa-validate-quality, sa-refactor-code

### UX Expert (ux-expert)
**Role**: User experience and interface design
**When to use**: UI/UX design, wireframes, accessibility, frontend specifications
**Key capabilities**: sa-create-frontend-spec, sa-design-wireframes, sa-accessibility-audit

### Product Owner (product-owner)
**Role**: Product ownership and validation
**When to use**: Story validation, acceptance criteria, course correction
**Key capabilities**: sa-validate-story-draft, sa-execute-checklist, sa-correct-course

### Scrum Master (scrum-master)
**Role**: Agile process facilitation
**When to use**: Sprint planning, story creation, workflow management
**Key capabilities**: sa-create-story, sa-update-workflow, sa-track-progress

## MCP Tools Available

### Core Tools
- `sa_initialize_project`: Initialize new Super Agents project
- `sa_list_tasks`: List all project tasks
- `sa_get_task`: Get detailed task information
- `sa_update_task_status`: Update task status

### Agent-Specific Tools
- `sa_research_market`: Conduct market research (Analyst)
- `sa_generate_prd`: Generate Product Requirements Document (PM)
- `sa_design_system`: Create system architecture (Architect)
- `sa_implement_story`: Implement user stories (Developer)
- `sa_review_code`: Perform code reviews (QA)
- `sa_create_frontend_spec`: Create frontend specifications (UX Expert)
- `sa_validate_story_draft`: Validate user stories (Product Owner)
- `sa_create_story`: Create user stories (Scrum Master)

## Task Management System

- **Hierarchical IDs**: Tasks use format 1.2.3 (parent.child.grandchild)
- **Status Flow**: pending → in-progress → review → done
- **Priorities**: low, medium, high, critical
- **Types**: feature, bug, enhancement, documentation, infrastructure, research

## Best Practices

1. **Agent Selection**: Choose the most appropriate agent for each task
2. **Task Structure**: Use hierarchical task breakdown for complex work
3. **Template Usage**: Leverage templates for consistent documentation
4. **Status Updates**: Keep task statuses current throughout development
5. **Documentation**: Use agent-generated templates for all project docs

## Getting Started

1. Initialize a project: Use `sa_initialize_project`
2. Create initial tasks with appropriate agents
3. Use agent-specific tools for specialized work
4. Track progress with task management tools

Last updated: ${new Date().toISOString()}
```

#### 3.2 Customize for Your Project

Edit the CLAUDE.md file to include:
- Project-specific information
- Custom agent configurations
- Project-specific workflows
- Team-specific guidelines

### Step 4: Configure Custom Commands (Optional)

#### 4.1 Create Custom Slash Commands

In your Claude Code configuration directory, create a `commands` folder:

```bash
mkdir -p ~/.config/claude-code/commands
```

Create custom command files:

**sa-init.md** (Project initialization command):
```markdown
# /sa-init - Initialize Super Agents Project

Initialize a new project with Super Agents framework integration.

## Usage
/sa-init [project-name] [template]

## What this does
1. Creates project structure
2. Sets up Super Agents configuration
3. Initializes task management
4. Creates initial documentation

Use the sa_initialize_project MCP tool to set up a new project with the specified name and template.
```

**sa-agent.md** (Agent invocation command):
```markdown
# /sa-agent - Invoke Specific Agent

Invoke a specific Super Agents agent for specialized work.

## Usage
/sa-agent [agent-name] [task-description]

## Available Agents
- analyst: Business analysis and market research
- pm: Product management and requirements
- architect: System design and architecture
- developer: Software development and implementation
- qa: Quality assurance and code review
- ux-expert: User experience and interface design
- product-owner: Product ownership and validation
- scrum-master: Agile process facilitation

## Example
/sa-agent architect "Design a microservices architecture for our e-commerce platform"
```

#### 4.2 Create Event Hooks (Optional)

Create hooks in `~/.config/claude-code/hooks/`:

**pre-commit.md**:
```markdown
# Pre-commit Hook - Super Agents Integration

Automatically update task status and run quality checks before commits.

Use sa_update_task_status and sa_review_code tools to ensure tasks are properly tracked and code quality is maintained.
```

### Step 5: Test Integration

#### 5.1 Start Claude Code
```bash
claude-code
```

#### 5.2 Test MCP Tools
In a new Claude Code chat, test the integration:

1. **Test tool availability**:
   ```
   Can you list the available MCP tools?
   ```

2. **Test project initialization**:
   ```
   Use sa_initialize_project to create a new project called "test-project"
   ```

3. **Test agent interaction**:
   ```
   Act as the architect agent and help me design a REST API structure
   ```

4. **Test task management**:
   ```
   Use sa_list_tasks to show current project tasks
   ```

#### 5.3 Verify Memory File
Ensure Claude Code is using the project memory:

```
What agents are available in this Super Agents project?
```

Claude should respond with information from your CLAUDE.md file.

## Troubleshooting

### MCP Server Issues

#### MCP Server Not Found
```bash
# Check if the server file exists
ls -la /path/to/super-agents/sa-engine/mcp-server/index.js

# Test server manually
cd /path/to/super-agents/sa-engine/mcp-server
node index.js
```

#### Permission Issues
```bash
# Make sure the server file is executable
chmod +x /path/to/super-agents/sa-engine/mcp-server/index.js

# Check Node.js permissions
which node
```

#### Path Issues
- Verify all paths in `mcp_servers.json` are absolute and correct
- Use forward slashes even on Windows when possible
- Escape backslashes properly on Windows

### Claude Code Configuration Issues

#### Configuration Not Loading
```bash
# Check configuration directory
ls -la ~/.config/claude-code/

# Verify mcp_servers.json syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('~/.config/claude-code/mcp_servers.json', 'utf8')))"
```

#### Memory File Not Working
- Ensure CLAUDE.md is in the project root
- Check file permissions
- Restart Claude Code after creating the file

### Agent Response Issues

#### Agents Not Responding as Expected
- Verify the memory file contains agent definitions
- Check that the correct agent persona is being used
- Ensure the MCP tools are available

#### Tools Not Available
- Check MCP server logs for errors
- Verify tool registration in the server
- Test individual tools manually

## Advanced Configuration

### Custom Agent Definitions

Create custom agents by adding them to your CLAUDE.md:

```markdown
### Custom Data Analyst (data-analyst)
**Role**: Data analysis and insights
**When to use**: Data processing, analytics, reporting
**Key capabilities**: Custom data analysis tools
**Communication style**: Data-driven, analytical, precise
```

### Project-Specific Templates

Add project-specific templates to your Super Agents installation:

```bash
# Create custom templates directory
mkdir -p /path/to/super-agents/sa-engine/templates/custom

# Add your custom templates
cp my-custom-template.yaml /path/to/super-agents/sa-engine/templates/custom/
```

### Environment-Specific Configuration

Use different configurations for different environments:

```json
{
  "mcpServers": {
    "super-agents-dev": {
      "command": "node",
      "args": ["/path/to/super-agents/sa-engine/mcp-server/index.js"],
      "env": {
        "SA_ENVIRONMENT": "development",
        "SA_LOG_LEVEL": "debug"
      }
    },
    "super-agents-prod": {
      "command": "node", 
      "args": ["/path/to/super-agents/sa-engine/mcp-server/index.js"],
      "env": {
        "SA_ENVIRONMENT": "production",
        "SA_LOG_LEVEL": "warn"
      }
    }
  }
}
```

## Best Practices

### Project Organization
- Keep CLAUDE.md updated with project changes
- Use consistent agent naming and invocation
- Maintain clear task hierarchies
- Document custom configurations

### Agent Usage
- Choose appropriate agents for each task type
- Use agent-specific language and terminology
- Leverage agent expertise for specialized work
- Combine agents for complex workflows

### Template Management
- Use templates for consistent documentation
- Customize templates for project needs
- Keep templates version-controlled
- Share templates across team projects

### Task Management
- Use hierarchical task structures
- Keep task statuses updated
- Document dependencies clearly
- Use appropriate priority levels

## Maintenance

### Regular Updates
```bash
# Update Super Agents framework
cd /path/to/super-agents
git pull origin main
npm install
npm run build

# Restart Claude Code after updates
```

### Configuration Backup
```bash
# Backup Claude Code configuration
cp -r ~/.config/claude-code ~/.config/claude-code.backup.$(date +%Y%m%d)

# Backup project CLAUDE.md files
find . -name "CLAUDE.md" -exec cp {} {}.backup.$(date +%Y%m%d) \;
```

### Performance Monitoring
- Monitor MCP server performance
- Check Claude Code logs for errors
- Track agent response times
- Monitor memory usage

## Support and Resources

### Documentation
- [Super Agents Framework Documentation](../docs/)
- [Claude Code MCP Integration Guide](https://docs.anthropic.com/claude/docs/mcp)
- [Agent Reference Guide](../docs/agents/)

### Community
- Super Agents GitHub Repository
- Claude Code Community Forum
- Super Agents Discord Server

### Getting Help
1. Check the troubleshooting section above
2. Review Super Agents documentation
3. Check Claude Code MCP documentation
4. File issues in the Super Agents repository
5. Ask questions in community forums

---

*Last updated: ${new Date().toISOString()}*
*Super Agents Framework v1.0.0*