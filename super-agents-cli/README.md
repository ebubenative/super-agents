# Super Agents CLI

Advanced terminal-based interface for the Super Agents Framework, providing comprehensive workflow management, automation, and AI-powered development tools.

## Overview

The Super Agents CLI (`sa`) is a powerful command-line interface that brings the full capabilities of the Super Agents Framework to your terminal. It features:

- **Interactive Workflows**: Rich terminal-based workflow orchestration
- **Advanced Terminal UI**: Blessed-based dashboard and interactive interfaces
- **Automation System**: Script-based automation with scheduling capabilities
- **Agent Management**: Direct agent interaction and coordination
- **Task Management**: Comprehensive task tracking and management
- **Real-time Monitoring**: Live progress tracking and status updates

## Installation

```bash
# Install the CLI globally
npm install -g @super-agents/cli

# Or use it locally in a project
npm install @super-agents/cli
npx sa --help
```

## Quick Start

```bash
# Initialize a new Super Agents project
sa init my-project --template=fullstack --interactive

# Start an interactive dashboard
sa dashboard

# Begin a development workflow
sa workflow start --type=feature-development --interactive

# Automate daily tasks
sa automation init
sa automation schedule daily-health-check "0 9 * * *"
```

## Core Commands

### Project Management

```bash
# Initialize new project
sa init [project-name] [options]
  --template <type>     Project template (fullstack, minimal, enterprise)
  --interactive         Interactive project setup
  --name <name>         Project name

# Show project status
sa status [options]
  --verbose             Show detailed status including file paths

# Configuration management
sa config [options]
  --global              Use global configuration
  --list                List all configuration values
  --set <key=value>     Set configuration value
  --unset <key>         Remove configuration value
```

### Workflow Management

```bash
# Start workflow
sa workflow start [options]
  --type <type>         Workflow type (see available types below)
  --project <name>      Project name
  --interactive         Interactive workflow setup

# Show workflow status
sa workflow status [options]
  --verbose             Show detailed phase information
  --all                 Show all workflows (not just active)

# Track workflow progress
sa workflow track [options]
  --workflow <id>       Specific workflow to track
```

#### Available Workflow Types

- `greenfield-fullstack`: Complete development workflow for new full-stack applications
- `feature-development`: End-to-end feature development workflow
- `code-review`: Multi-agent code review and quality assurance
- `api-development`: RESTful API design and implementation workflow
- `modernization`: Legacy system modernization workflow
- `debugging`: Systematic debugging and issue resolution

### Agent Management

```bash
# List available agents
sa agent list [options]
  --type <type>         Filter by agent type

# Show agent information
sa agent info <name>

# Test agent configuration
sa agent test <name>
```

#### Available Agents

- **Analyst**: Market research, competitive analysis, requirements gathering
- **PM**: Product strategy, PRD creation, feature prioritization
- **Architect**: System design, technology recommendations, architecture analysis
- **Developer**: Implementation, testing, debugging, code validation
- **QA**: Code review, refactoring, quality validation
- **Product Owner**: Story validation, checklist execution, course correction
- **UX Expert**: Frontend specs, wireframes, accessibility audits
- **Scrum Master**: Story creation, workflow management, progress tracking

### Task Management

```bash
# List tasks
sa task list [options]
  --status <status>     Filter by status (pending, active, completed)
  --priority <priority> Filter by priority (critical, high, medium, low)
  --assignee <agent>    Filter by assigned agent
  --search <term>       Search in title/description
  --tree                Display as dependency tree
  --stats               Show task statistics

# Show task details
sa task show <id> [options]
  --tag <tag>           Use specific tag context

# Create new task
sa task create <title> [options]
  --description <desc>  Task description
  --assignee <agent>    Assign to specific agent
  --priority <priority> Task priority
  --type <type>         Task type (feature, bug, enhancement, etc.)
  --due <date>          Due date (YYYY-MM-DD)
  --depends <ids>       Dependencies (comma-separated task IDs)
  --parent <id>         Parent task ID (creates subtask)

# Update task
sa task update <id> [options]
  --title <title>       Update title
  --description <desc>  Update description
  --status <status>     Update status
  --priority <priority> Update priority
  --assignee <agent>    Change assignee
  --notes <notes>       Add notes

# Manage dependencies
sa task deps <id> [options]
  --add <taskId>        Add dependency
  --remove <taskId>     Remove dependency
  --validate            Validate all dependencies
  --visualize           Show dependency graph
  --format <format>     Visualization format (ascii, json, dot)
```

### Automation System

```bash
# Initialize automation system
sa automation init

# Create automation script
sa automation create <name> [options]
  --description <desc>  Script description
  --trigger <type>      Trigger type (manual, scheduled, git-hook)

# Run automation script
sa automation run <script> [options]
  --dry-run             Simulate execution without running commands

# Schedule automation
sa automation schedule <script> <cron> [options]
  --description <desc>  Schedule description

# Remove scheduled automation
sa automation unschedule <script>

# List automations
sa automation list [options]
  --scheduled           Show only scheduled scripts
  --running             Show only running automations
```

#### Automation Script Examples

Daily health check (runs every day at 9 AM):
```bash
sa automation schedule daily-health-check "0 9 * * *"
```

Backup project state (manual trigger):
```bash
sa automation run backup-project-state
```

Code quality check (git hook integration):
```bash
sa automation create pre-commit-check --trigger=git-hook
```

### Interactive Dashboard

```bash
# Launch interactive dashboard
sa dashboard [options]
  --mode <mode>         Dashboard mode (overview, tasks, workflows, agents)
```

The dashboard provides:
- **Overview Mode**: Project status, agent activity, workflow progress
- **Tasks Mode**: Interactive task management interface
- **Workflows Mode**: Real-time workflow monitoring
- **Agents Mode**: Agent selection and configuration

### Integration Management

```bash
# Setup IDE integration
sa integrate [options]
  --ide <ide>           Target IDE (claude-code, cursor, vscode, windsurf)
  --mcp                 Enable MCP integration
  --standalone          Setup standalone integration

# Planning and brainstorming
sa plan [options]
  --agent <agent>       Use specific agent for planning
  --interactive         Interactive planning mode
```

### System Maintenance

```bash
# Health check
sa doctor [options]
  --verbose             Show detailed diagnostics
  --component <comp>    Check specific component

# Repair issues
sa repair [options]
  --issue <issue>       Repair specific issue

# Backup management
sa backup [options]
  --restore <path>      Restore from backup file
```

## Advanced Features

### Terminal UI Components

The CLI includes advanced terminal UI components built with Blessed:

- **Interactive Dashboards**: Real-time project overview
- **Progress Monitoring**: Live workflow execution tracking  
- **Agent Interfaces**: Interactive agent selection and management
- **Task Management**: Full-featured task management interface
- **Rich Formatting**: Colors, tables, progress bars, and ASCII art

### Workflow Automation

Create powerful automation scripts with YAML configuration:

```yaml
name: "Daily Development Workflow"
description: "Automated daily development tasks"
trigger: "scheduled"
steps:
  - type: "command"
    name: "System Health Check"
    command: "sa doctor --verbose"
  
  - type: "sa-tool"
    name: "List Active Tasks"
    tool: "task list --status=active"
  
  - type: "workflow"
    name: "Code Quality Check"
    workflow: "code-review"
    params:
      path: "."
  
  - type: "notification"
    name: "Send Status Report"
    message: "Daily workflow completed"
    channel: "console"
```

### Real-time Monitoring

Track workflow execution in real-time:

```bash
# Start workflow with tracking
sa workflow start --type=feature-development --interactive
# In another terminal
sa workflow track

# Dashboard monitoring  
sa dashboard --mode=workflows
```

### Scripting and Integration

Integration with shell scripts and CI/CD pipelines:

```bash
#!/bin/bash
# ci-integration.sh

# Run Super Agents quality check
sa automation run code-quality-check

# If successful, continue with deployment
if [ $? -eq 0 ]; then
  echo "Quality checks passed, proceeding with deployment"
  sa workflow start --type=deployment
else
  echo "Quality checks failed, stopping pipeline"
  exit 1
fi
```

## Configuration

### Environment Variables

```bash
# AI Provider API Keys
export ANTHROPIC_API_KEY="your-anthropic-key"
export OPENAI_API_KEY="your-openai-key"

# Super Agents Configuration
export SA_PROJECT_ROOT="/path/to/your/project"
export SA_LOG_LEVEL="info"  # debug, info, warn, error
export SA_CLI_THEME="default"  # default, dark, light
export SA_AUTOMATION_PATH="/path/to/automation/scripts"
```

### Configuration File

```yaml
# .super-agents/config.yaml
project:
  name: "My Project"
  type: "fullstack" 
  template: "enterprise"

agents:
  default_assignee: "developer"
  auto_assignment: true
  
workflows:
  default_type: "feature-development"
  auto_progress: true
  notifications: true

automation:
  enabled: true
  default_schedule: "0 */6 * * *"  # Every 6 hours
  
cli:
  theme: "default"
  interactive: true
  progress_bars: true
  colors: true
```

## Best Practices

### Workflow Organization

1. **Start Small**: Begin with simple workflows and gradually add complexity
2. **Use Templates**: Leverage built-in workflow templates for common scenarios
3. **Monitor Progress**: Use real-time tracking for long-running workflows
4. **Automate Repetitive Tasks**: Create automation scripts for daily/weekly routines

### Task Management

1. **Clear Hierarchies**: Use parent-child task relationships effectively
2. **Dependency Management**: Set up task dependencies to ensure proper sequencing
3. **Regular Updates**: Keep task status and progress updated
4. **Agent Assignment**: Assign appropriate agents based on task type

### Automation Scripts

1. **Idempotent Operations**: Design scripts to be safely re-runnable
2. **Error Handling**: Use `continueOnError` for non-critical steps
3. **Logging**: Enable comprehensive logging for troubleshooting
4. **Testing**: Test automation scripts with `--dry-run` before deployment

### Performance Optimization

1. **Parallel Execution**: Use automation scripts for concurrent task execution
2. **Caching**: Leverage built-in caching for repeated operations
3. **Resource Management**: Monitor system resources during intensive workflows
4. **Batch Operations**: Group related tasks for efficient processing

## Troubleshooting

### Common Issues

1. **CLI Not Found**: Ensure the CLI is properly installed and in your PATH
2. **API Connection Issues**: Verify API keys and network connectivity
3. **Workflow Failures**: Check logs and use `sa doctor` for diagnostics
4. **Performance Issues**: Monitor system resources and adjust concurrency

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
export SA_LOG_LEVEL=debug
sa workflow start --type=debugging --verbose
```

### Health Checks

Run comprehensive health checks:

```bash
# Full system diagnostic
sa doctor --verbose

# Component-specific checks
sa doctor --component=mcp-server
sa doctor --component=agents
sa doctor --component=configuration
```

## Examples

### Complete Development Workflow

```bash
# 1. Initialize project
sa init ecommerce-platform --template=fullstack --interactive

# 2. Start feature development workflow
sa workflow start --type=feature-development --project=ecommerce-platform

# 3. Monitor progress in dashboard
sa dashboard --mode=workflows

# 4. Create automation for CI/CD
sa automation create ci-pipeline --trigger=git-hook

# 5. Schedule daily health checks
sa automation schedule daily-health-check "0 9 * * *"
```

### Task-Driven Development

```bash
# Create main feature task
sa task create "User Authentication System" \
  --priority=high \
  --type=feature \
  --assignee=architect

# Create subtasks
sa task create "Design Auth Architecture" \
  --parent=$(sa task list --search="User Authentication" --format=id) \
  --assignee=architect

sa task create "Implement JWT Service" \
  --depends=$(sa task list --search="Design Auth" --format=id) \
  --assignee=developer

# Track progress
sa task list --tree --stats
```

### Automated Code Quality

```bash
# Initialize automation
sa automation init

# Create comprehensive code review automation
sa automation create comprehensive-review \
  --description="Multi-agent code review process"

# Schedule regular quality checks
sa automation schedule comprehensive-review "0 */4 * * *"

# Run manual quality check
sa automation run comprehensive-review
```

## Support and Documentation

- **CLI Help**: Use `sa --help` or `sa <command> --help` for detailed command information
- **Interactive Modes**: Most commands support `--interactive` for guided setup
- **Verbose Output**: Use `--verbose` flags for detailed information
- **Dashboard**: Use `sa dashboard` for visual project management

## Contributing

The Super Agents CLI is part of the larger Super Agents Framework. Contributions are welcome:

1. **Feature Requests**: Suggest new CLI features and workflows
2. **Bug Reports**: Report issues with detailed reproduction steps
3. **Extensions**: Create custom automation scripts and workflow templates
4. **Documentation**: Improve documentation and examples

---

*Super Agents CLI - Bringing AI-powered development workflows to your terminal*