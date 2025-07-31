# Windsurf MCP Integration

This directory contains the MCP (Model Context Protocol) integration for Windsurf IDE with the Super Agents framework.

## Overview

The Windsurf integration provides:
- Native MCP server configuration for Windsurf IDE
- Windsurf-optimized tool responses and interfaces
- AI-powered development workflow integration
- Seamless agent collaboration within Windsurf

## Setup Instructions

### Prerequisites
- Windsurf IDE installed
- Node.js (v18 or higher)
- API keys for AI providers (Anthropic Claude or OpenAI)

### Installation

1. **Configure MCP Server**:
   ```bash
   # Copy the MCP configuration to Windsurf settings
   cp windsurf-mcp.json ~/.windsurf/mcp_servers.json
   ```

2. **Set Environment Variables**:
   ```bash
   export ANTHROPIC_API_KEY="your-anthropic-key"
   export OPENAI_API_KEY="your-openai-key"
   export SA_PROJECT_ROOT="/path/to/super-agents"
   ```

3. **Start Windsurf**:
   - Launch Windsurf IDE
   - The MCP server will automatically connect
   - Super Agents tools will be available in the AI chat

### Configuration

The integration includes:

- **windsurf-mcp.json**: MCP server configuration for Windsurf
- **server-config.js**: Windsurf-specific server configuration
- **README.md**: This documentation file

### Windsurf-Specific Features

#### AI Integration Optimizations
- **Streaming Responses**: Real-time tool execution feedback
- **Context Awareness**: IDE state-aware agent responses
- **Multi-file Editing**: Coordinated changes across project files
- **Intelligent Suggestions**: AI-powered development recommendations

#### Performance Enhancements
- **Caching**: Optimized response caching for repeated operations
- **Batch Operations**: Efficient bulk task processing
- **Async Processing**: Non-blocking tool execution
- **Memory Optimization**: Reduced memory footprint

#### User Interface Features
- **Progress Indicators**: Visual feedback for long-running operations
- **Error Handling**: Windsurf-native error presentation
- **Tool Tips**: Contextual help for agent tools
- **Status Updates**: Real-time workflow progress

## Available Tools

All Super Agents tools are available through the MCP integration:

### Core Tools
- `sa-initialize-project`: Set up new Super Agents projects
- `sa-list-tasks`: List and filter project tasks
- `sa-get-task`: Retrieve specific task details
- `sa-update-task-status`: Update task progress

### Agent Tools
- **Analyst**: Market research, brainstorming, competitive analysis
- **PM**: PRD generation, feature prioritization, stakeholder analysis
- **Architect**: System design, technology recommendations, architecture analysis
- **Developer**: Implementation, testing, debugging, validation
- **QA**: Code review, refactoring, quality validation
- **Product Owner**: Checklist execution, story validation, course correction
- **UX Expert**: Frontend specs, wireframes, accessibility audits
- **Scrum Master**: Story creation, workflow management, progress tracking

### Workflow Tools
- `sa-start-workflow`: Initialize project workflows
- `sa-track-progress`: Monitor workflow progress
- `sa-workflow-status`: Check current workflow state
- `sa-workflow-validation`: Validate workflow transitions

## Usage Examples

### Starting a New Project
```
Use the sa-initialize-project tool to set up a new Super Agents project with proper structure and configuration.
```

### Running Market Research
```
Use the sa-research-market tool with the Analyst agent to conduct comprehensive market research and trend analysis.
```

### Creating Architecture
```
Use the sa-create-architecture tool with the Architect agent to design system architecture and technical specifications.
```

### Implementing Features
```
Use the sa-implement-story tool with the Developer agent to implement user stories and feature requirements.
```

## Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   - Check API keys are properly set
   - Verify project root path is correct
   - Ensure Node.js is installed and accessible

2. **Tools Not Loading**
   - Verify MCP configuration is in correct location
   - Check file permissions on configuration files
   - Restart Windsurf IDE

3. **API Connection Issues**
   - Validate API keys are active and have sufficient credits
   - Check network connectivity
   - Review environment variable settings

### Debug Commands

```javascript
// Test MCP server configuration
const WindsurfMCPConfig = require('./server-config.js');
const config = new WindsurfMCPConfig();
console.log(config.validateEnvironment());
```

### Log Files

Check these locations for debug information:
- Windsurf IDE console logs
- Super Agents MCP server logs
- System environment variables

## Advanced Configuration

### Custom Tool Configuration

You can customize tool behavior by modifying the server configuration:

```javascript
const config = new WindsurfMCPConfig();
const customConfig = config.getConfig();

// Modify specific settings
customConfig.windsurf.performance.caching = false;
customConfig.tools.responseFormat = 'detailed';
```

### Environment-Specific Settings

Different configurations for different environments:

```json
{
  "development": {
    "SA_LOG_LEVEL": "debug",
    "SA_IDE_CONTEXT": "windsurf-dev"
  },
  "production": {
    "SA_LOG_LEVEL": "info",
    "SA_IDE_CONTEXT": "windsurf-prod"
  }
}
```

## Support

For issues specific to the Windsurf integration:
1. Check the troubleshooting section above
2. Review Windsurf IDE documentation
3. Validate MCP server configuration
4. Test with minimal configuration first

For general Super Agents framework issues, refer to the main project documentation.