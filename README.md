# Super Agents Framework

**AI-Powered Development Assistance Through Specialized Agent Orchestration**

> **🚀 Production Ready** - Complete MCP integration with 40+ specialized tools across 10 agent types

## Overview

Super Agents Framework provides comprehensive AI-powered development assistance through a sophisticated agent orchestration system. Built on the Model Context Protocol (MCP), it offers 40+ specialized tools organized by agent expertise, enabling seamless integration with modern AI-powered IDEs.

### ✨ Key Features

- **🤖 10 Specialized Agents** - Analyst, PM, Architect, Developer, QA, UX Expert, Product Owner, Scrum Master, Task Master, Workflow Manager
- **🛠️ 40+ MCP Tools** - Comprehensive toolset for every stage of development
- **⚡ IDE Integration** - Native support for Claude Code, Cursor, VS Code, and more
- **📊 Production Ready** - Robust error handling, logging, monitoring, and configuration management
- **🔧 Easy Setup** - Automated CLI installer with interactive setup wizard
- **💡 Smart Workflows** - Intelligent task orchestration and dependency management

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g super-agents-framework

# Or use the CLI installer
npx super-agents-framework install
```

### Setup

```bash
# Interactive setup wizard
sa setup

# Initialize a new project
sa init my-project --template=fullstack

# Check system health
sa doctor
```

### IDE Integration

#### Claude Code (Recommended)
```bash
# Automatic integration
sa integrate --ide=claude-code --auto-configure
```

#### Manual Integration
Add to your IDE's MCP configuration:
```json
{
  "mcpServers": {
    "super-agents": {
      "command": "node",
      "args": ["sa-engine/mcp-server/index.js"],
      "env": {
        "SA_PROJECT_ROOT": ".",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

## 🏗️ Architecture

### Agent Specializations

| Agent | Role | Key Tools |
|-------|------|-----------|
| **Analyst** | Market research & requirements | `sa-research-market`, `sa-brainstorm-session`, `sa-competitor-analysis` |
| **PM** | Product management & planning | `sa-generate-prd`, `sa-create-epic`, `sa-prioritize-features` |
| **Architect** | System design & architecture | `sa-create-architecture`, `sa-design-system`, `sa-tech-recommendations` |
| **Developer** | Implementation & coding | `sa-implement-story`, `sa-debug-issue`, `sa-run-tests` |
| **QA** | Quality assurance & testing | `sa-review-code`, `sa-validate-quality`, `sa-refactor-code` |
| **UX Expert** | UI/UX design & prototypes | `sa-create-frontend-spec`, `sa-design-wireframes`, `sa-accessibility-audit` |
| **Product Owner** | Backlog & validation | `sa-validate-story-draft`, `sa-execute-checklist`, `sa-correct-course` |
| **Scrum Master** | Workflow orchestration | `sa-create-story`, `sa-track-progress`, `sa-update-workflow` |
| **Task Master** | Task analysis & planning | `sa-generate-tasks`, `sa-analyze-complexity`, `sa-expand-task` |
| **Workflow** | Process management | `sa-start-workflow`, `sa-workflow-status`, `sa-workflow-validation` |

### System Components

```
super-agents/
├── sa-engine/              # Core framework engine
│   ├── mcp-server/          # MCP server with 40+ tools
│   ├── agents/              # Agent definitions and capabilities
│   ├── core/                # Production-ready infrastructure
│   ├── templates/           # Code and document templates
│   ├── workflows/           # Predefined development workflows
│   └── tests/               # Comprehensive test suite
├── sa-cli/                  # Command-line interface
├── docs/                    # Documentation and guides
└── scripts/                 # Utility scripts
```

## 📖 Usage

### Development Workflow

#### 1. Planning Phase
```bash
# Research and analysis
sa-research-market --topic="project idea"
sa-brainstorm-session --focus="feature ideation"

# Product planning
sa-generate-prd --requirements="user needs"
sa-create-epic --prd="docs/prd.md"
```

#### 2. Architecture Phase
```bash
# System design
sa-create-architecture --prd="docs/prd.md"
sa-tech-recommendations --requirements="performance, scalability"

# Frontend design (if needed)
sa-create-frontend-spec --requirements="user interface needs"
```

#### 3. Development Phase
```bash
# Task breakdown
sa-generate-tasks --epic="user authentication"
sa-create-story --epic-id="auth-001"

# Implementation
sa-implement-story --story-id="story-001"
sa-run-tests --component="authentication"
```

#### 4. Quality Assurance
```bash
# Code review and validation
sa-review-code --files="src/auth/"
sa-validate-quality --component="authentication"
sa-refactor-code --target="performance optimization"
```

### Agent Interaction Examples

#### In Claude Code
```bash
# Use MCP tools directly
sa-research-market topic="AI development tools"
sa-create-architecture requirements="microservices with high availability"
sa-implement-story story="user registration with email verification"
```

## ⚙️ Configuration

### Environment Variables
```bash
export SA_LOG_LEVEL=info
export SA_MAX_RETRIES=3
export SA_TIMEOUT=30000
export ANTHROPIC_API_KEY=your_key_here
export OPENAI_API_KEY=your_key_here
```

### Configuration File
Create `sa-config.json`:
```json
{
  "logLevel": "info",
  "agents": {
    "enabledAgents": ["analyst", "pm", "architect", "developer", "qa"],
    "defaultAgent": "developer"
  },
  "apis": {
    "anthropic": {
      "model": "claude-3-sonnet-20240229",
      "maxTokens": 4000
    }
  }
}
```

## 🏥 Health Monitoring

```bash
# System health check
sa doctor

# Detailed diagnostics
sa doctor --verbose

# Repair common issues
sa repair

# View metrics
sa status --metrics
```

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete usage guide with workflows
- **[API Reference](docs/API_REFERENCE.md)** - All available MCP tools
- **[Framework Plan](docs/SUPER_AGENTS_FRAMEWORK_PLAN.md)** - System architecture
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Production readiness details

## 🔧 Development

### Setup
```bash
# Clone the repository
git clone https://github.com/super-agents/framework.git
cd framework

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

### Testing
```bash
# Run all tests
npm run test:all

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

## 🌟 Production Features

### Error Handling
- **✅ Automatic Retry Logic** - Exponential backoff for failed operations
- **✅ Graceful Degradation** - Fallback strategies for service outages
- **✅ User-Friendly Messages** - Clear error descriptions with suggestions

### Logging & Monitoring
- **✅ Structured Logging** - JSON format with configurable levels
- **✅ Performance Metrics** - Tool execution times and system health
- **✅ Security** - Automatic sanitization of sensitive data

### Configuration Management
- **✅ Validation** - Comprehensive checks for all settings
- **✅ Environment Support** - Full override capability for deployment
- **✅ Health Monitoring** - Real-time configuration status

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

- **Documentation**: [User Guide](docs/USER_GUIDE.md)
- **GitHub Issues**: [Report bugs](https://github.com/super-agents/framework/issues)
- **Email Support**: support@super-agents.dev

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📋 Status

**✅ Production Ready (95% Complete)**
- Testing Infrastructure: 100%
- Production Readiness: 100% 
- User Experience: 90%
- Overall Framework: 95%

---

**Built with ❤️ by the Super Agents team**

*Empowering developers with AI-powered assistance for faster, better software development.*