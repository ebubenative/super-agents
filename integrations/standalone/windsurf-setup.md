# Windsurf Standalone Setup Guide

This guide provides instructions for manually setting up Super Agents framework with Windsurf IDE without using automated installation tools.

## Overview

Windsurf is an AI-powered IDE that supports MCP (Model Context Protocol) integration. This setup guide helps you integrate the Super Agents framework with Windsurf to enable AI-powered development workflows.

## Prerequisites

### Required Software
- **Windsurf IDE**: Latest version installed
- **Node.js**: Version 18 or higher
- **Git**: For cloning repositories
- **API Keys**: Anthropic Claude or OpenAI API access

### System Requirements
- **Operating System**: Windows, macOS, or Linux
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Storage**: 2GB free space for framework and dependencies

## Installation Steps

### Step 1: Clone Super Agents Framework

```bash
# Clone the repository
git clone https://github.com/your-org/super-agents.git
cd super-agents

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider API Keys (choose one or both)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Super Agents Configuration
SA_PROJECT_ROOT=/path/to/super-agents
SA_LOG_LEVEL=info
SA_IDE_CONTEXT=windsurf

# Optional: Additional AI Providers
GOOGLE_API_KEY=your-google-api-key
GROQ_API_KEY=your-groq-api-key
```

### Step 3: Configure Windsurf MCP Integration

1. **Locate Windsurf Configuration Directory**:
   - **Windows**: `%APPDATA%\Windsurf\User\globalStorage\`
   - **macOS**: `~/Library/Application Support/Windsurf/User/globalStorage/`
   - **Linux**: `~/.config/Windsurf/User/globalStorage/`

2. **Create MCP Configuration**:
   ```bash
   # Create or edit mcp_servers.json in Windsurf config directory
   {
     "mcpServers": {
       "super-agents": {
         "command": "node",
         "args": ["/path/to/super-agents/sa-engine/mcp-server/index.js"],
         "env": {
           "SA_PROJECT_ROOT": "/path/to/super-agents",
           "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
           "OPENAI_API_KEY": "${OPENAI_API_KEY}",
           "SA_LOG_LEVEL": "info",
           "SA_IDE_CONTEXT": "windsurf"
         }
       }
     }
   }
   ```

### Step 4: Test MCP Server

```bash
# Test MCP server functionality
cd sa-engine/mcp-server
node test-mcp.js

# Verify tool registration
node -e "
const MCPServer = require('./MCPServer.js');
const server = new MCPServer();
console.log('Available tools:', server.listTools().length);
"
```

### Step 5: Configure Windsurf Settings

1. **Open Windsurf IDE**
2. **Go to Settings** (Ctrl/Cmd + ,)
3. **Search for "MCP"** in settings
4. **Enable MCP Integration** if not already enabled
5. **Verify Server Connection** in the MCP section

### Step 6: Verify Integration

1. **Open AI Chat in Windsurf**
2. **Type**: "List available Super Agents tools"
3. **Expected Response**: Should show 40+ available tools
4. **Test a Tool**: Try `sa-initialize-project` or `sa-list-tasks`

## Agent Configuration

### Default Agent Team Setup

Create a basic agent team configuration:

```yaml
# windsurf-team.yaml
name: "Windsurf Development Team"
description: "AI-powered development team for Windsurf IDE"
agents:
  - analyst
  - pm
  - architect
  - developer
  - qa
  - product-owner
  - ux-expert
  - scrum-master

workflows:
  - greenfield-fullstack
  - brownfield-service
  - feature-development

tools:
  core: true
  analyst: true
  architect: true
  developer: true
  qa: true
  workflow: true
```

### Custom Agent Configuration

For specialized development needs:

```json
{
  "customAgents": {
    "windsurf-specialist": {
      "role": "Windsurf IDE optimization specialist",
      "capabilities": [
        "IDE configuration optimization",
        "AI workflow enhancement",
        "Performance tuning",
        "Integration troubleshooting"
      ],
      "tools": [
        "sa-tech-recommendations",
        "sa-validate-quality",
        "sa-debug-issue"
      ]
    }
  }
}
```

## Workflow Templates

### Basic Development Workflow

```yaml
# windsurf-dev-workflow.yaml
name: "Windsurf Development Workflow"
phases:
  1. "Requirements Analysis":
     - agent: analyst
     - tools: [sa-research-market, sa-create-brief]
  
  2. "Architecture Design":
     - agent: architect
     - tools: [sa-create-architecture, sa-tech-recommendations]
  
  3. "Implementation":
     - agent: developer
     - tools: [sa-implement-story, sa-validate-implementation]
  
  4. "Quality Assurance":
     - agent: qa
     - tools: [sa-review-code, sa-validate-quality]
```

### AI-Enhanced Code Review

```yaml
# ai-code-review-workflow.yaml
name: "AI-Enhanced Code Review"
triggers:
  - pull_request
  - code_change
  
steps:
  1. "Automated Code Analysis":
     - tool: sa-review-code
     - agent: qa
  
  2. "Architecture Validation":
     - tool: sa-validate-quality
     - agent: architect
  
  3. "Performance Assessment":
     - tool: sa-debug-issue
     - agent: developer
```

## Advanced Configuration

### Performance Optimization

```javascript
// windsurf-performance-config.js
module.exports = {
  mcp: {
    maxConcurrentTools: 10,
    responseTimeout: 30000,
    caching: {
      enabled: true,
      ttl: 300000 // 5 minutes
    }
  },
  windsurf: {
    streamingResponses: true,
    contextWindow: 32000,
    memoryOptimization: true
  }
};
```

### Custom Tool Integration

```javascript
// custom-windsurf-tool.js
class WindsurfCustomTool {
  constructor() {
    this.name = 'sa-windsurf-optimize';
    this.description = 'Optimize Windsurf IDE configuration';
  }

  async execute(params) {
    // Custom Windsurf optimization logic
    return {
      success: true,
      optimizations: [
        'AI response time improved',
        'Memory usage optimized',
        'Tool loading accelerated'
      ]
    };
  }
}

module.exports = WindsurfCustomTool;
```

## Troubleshooting

### Common Issues

#### 1. MCP Server Not Starting
```bash
# Check Node.js version
node --version

# Verify project structure
ls -la sa-engine/mcp-server/

# Test server manually
cd sa-engine/mcp-server
node index.js
```

#### 2. API Key Issues
```bash
# Test API connectivity
node -e "
const provider = new (require('./sa-engine/ai-providers/AnthropicProvider.js'))();
provider.testConnection().then(console.log);
"
```

#### 3. Tool Loading Problems
```bash
# Verify tool registration
node -e "
const registry = require('./sa-engine/mcp-server/ToolRegistry.js');
console.log('Registered tools:', registry.getAllTools().length);
"
```

### Debug Mode

Enable debug logging:

```bash
export SA_LOG_LEVEL=debug
export NODE_ENV=development
```

### Log Analysis

Check these log sources:
- **Windsurf Console**: Help → Toggle Developer Tools → Console
- **MCP Server Logs**: Check terminal output where server is running
- **System Logs**: OS-specific application logs

## Best Practices

### Project Organization

```
your-project/
├── .super-agents/
│   ├── config.yaml
│   ├── agents/
│   ├── workflows/
│   └── tasks/
├── src/
├── docs/
└── tests/
```

### Workflow Optimization

1. **Start Small**: Begin with basic agent interactions
2. **Iterate Gradually**: Add more complex workflows over time
3. **Monitor Performance**: Track tool response times
4. **Customize Agents**: Adapt agent personas to your project needs

### Security Considerations

1. **API Key Management**: Use environment variables, never commit keys
2. **Network Security**: Ensure secure API connections
3. **Access Control**: Limit tool access based on project needs
4. **Audit Logging**: Enable comprehensive logging for security review

## Integration Examples

### Frontend Development

```javascript
// Use UX Expert agent for component design
await mcpClient.callTool('sa-create-frontend-spec', {
  component: 'UserDashboard',
  requirements: 'Responsive design with dark mode support',
  framework: 'React'
});
```

### Backend Development

```javascript
// Use Architect agent for API design
await mcpClient.callTool('sa-create-architecture', {
  type: 'rest-api',
  domain: 'user-management',
  requirements: 'Scalable microservices architecture'
});
```

### Full-Stack Development

```javascript
// Use multiple agents in sequence
const workflow = await mcpClient.callTool('sa-start-workflow', {
  type: 'greenfield-fullstack',
  project: 'e-commerce-platform'
});
```

## Next Steps

After successful setup:

1. **Explore Tools**: Try different Super Agents tools
2. **Create Custom Workflows**: Design workflows for your specific needs
3. **Join Community**: Connect with other Super Agents users
4. **Contribute**: Share your configurations and improvements

## Support Resources

- **Documentation**: Complete framework documentation
- **Community**: Discord/Slack channels for user support
- **Examples**: Sample projects and configurations
- **Updates**: Stay informed about new features and improvements

---

*This setup guide ensures you can manually configure Super Agents with Windsurf IDE for a powerful AI-enhanced development experience.*