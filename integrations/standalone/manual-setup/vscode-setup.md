# Super Agents - VS Code Manual Setup Guide

## Overview
This guide provides step-by-step instructions for manually integrating Super Agents with Visual Studio Code. The setup includes workspace configuration, code snippets, and preparation for future extension support.

## Prerequisites

### System Requirements
- **Visual Studio Code**: Version 1.60.0 or higher
- **Node.js**: Version 18.0.0 or higher (optional, for future MCP support)
- **Git**: Version 2.0.0 or higher

### Verify Prerequisites
```bash
# Check VS Code installation
code --version

# Check Node.js version (optional)
node --version

# Check git version
git --version
```

## Installation Steps

### Step 1: Install Super Agents Framework (Optional)

```bash
# Clone the repository for access to templates and documentation
git clone https://github.com/your-org/super-agents.git
cd super-agents

# Install dependencies for future MCP integration
npm install
```

### Step 2: Setup VS Code Workspace Configuration

#### 2.1 Create Workspace Directory Structure

In your project root, create the VS Code configuration:

```bash
# Create VS Code configuration directory
mkdir -p .vscode

# Create additional directories for organization
mkdir -p docs/super-agents
mkdir -p .super-agents/local
```

#### 2.2 Configure Workspace Settings

Create or update `.vscode/settings.json`:

```json
{
  "super-agents.enabled": true,
  "super-agents.framework": "super-agents-v1",
  "super-agents.version": "1.0.0",
  
  "super-agents.agents": {
    "analyst": {
      "id": "analyst",
      "name": "Business Analyst",
      "role": "Market research and business analysis",
      "enabled": true,
      "focus": "Strategic analysis, market research, competitive intelligence"
    },
    "pm": {
      "id": "pm", 
      "name": "Product Manager",
      "role": "Product strategy and requirements",
      "enabled": true,
      "focus": "Product planning, requirements, feature prioritization"
    },
    "architect": {
      "id": "architect",
      "name": "System Architect", 
      "role": "Technical architecture and design",
      "enabled": true,
      "focus": "System design, architecture decisions, technical planning"
    },
    "developer": {
      "id": "developer",
      "name": "Software Developer",
      "role": "Code implementation and development", 
      "enabled": true,
      "focus": "Implementation, testing, debugging, code quality"
    },
    "qa": {
      "id": "qa",
      "name": "QA Engineer",
      "role": "Quality assurance and testing",
      "enabled": true,
      "focus": "Code review, testing, quality validation"
    },
    "ux-expert": {
      "id": "ux-expert",
      "name": "UX/UI Expert",
      "role": "User experience and interface design",
      "enabled": true,
      "focus": "UI/UX design, accessibility, frontend architecture"
    },
    "product-owner": {
      "id": "product-owner",
      "name": "Product Owner",
      "role": "Product ownership and validation",
      "enabled": true,
      "focus": "Story validation, acceptance criteria, backlog management"
    },
    "scrum-master": {
      "id": "scrum-master",
      "name": "Scrum Master", 
      "role": "Agile facilitation and process",
      "enabled": true,
      "focus": "Sprint planning, workflow optimization, team coordination"
    }
  },
  
  "super-agents.taskManagement": {
    "enabled": true,
    "hierarchicalIds": true,
    "statusTransitions": {
      "pending": ["in-progress", "deferred", "cancelled"],
      "in-progress": ["blocked", "review", "done", "deferred", "cancelled"],
      "blocked": ["in-progress", "deferred", "cancelled"],
      "review": ["in-progress", "done", "deferred"],
      "done": [],
      "deferred": ["pending", "cancelled"],
      "cancelled": []
    },
    "priorityLevels": ["low", "medium", "high", "critical"],
    "taskTypes": ["feature", "bug", "enhancement", "documentation", "infrastructure", "research"]
  },
  
  "super-agents.templates": {
    "enabled": true,
    "autoSuggest": true,
    "customPath": ".super-agents/templates",
    "available": [
      "prd-template",
      "architecture-template", 
      "story-template",
      "code-review-template",
      "frontend-spec-template"
    ]
  },
  
  "super-agents.workflows": {
    "projectInit": ["analyst", "pm", "architect"],
    "featureDevelopment": ["pm", "ux-expert", "developer", "qa"],
    "codeReview": ["qa", "architect"],
    "sprint": ["scrum-master", "product-owner"]
  },
  
  "super-agents.integrations": {
    "mcp": {
      "enabled": false,
      "serverPath": "",
      "toolsAvailable": []
    },
    "extension": {
      "planned": true,
      "currentVersion": "manual-setup"
    }
  },
  
  "files.associations": {
    "*.sa-task": "yaml",
    "*.sa-template": "yaml", 
    "AGENTS.md": "markdown",
    "SUPER-AGENTS.md": "markdown"
  },
  
  "editor.quickSuggestions": {
    "strings": true
  },
  
  "emmet.includeLanguages": {
    "super-agents": "yaml"
  }
}
```

#### 2.3 Configure Tasks

Create `.vscode/tasks.json` for Super Agents related tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Super Agents: Initialize Project",
      "type": "shell",
      "command": "echo",
      "args": ["Initializing Super Agents project..."],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Super Agents: List Tasks",
      "type": "shell", 
      "command": "find",
      "args": [".", "-name", "*.sa-task", "-type", "f"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    },
    {
      "label": "Super Agents: Validate Setup",
      "type": "shell",
      "command": "echo",
      "args": ["Validating Super Agents configuration..."],
      "group": "build",
      "dependsOrder": "sequence",
      "dependsOn": ["Super Agents: Check Configuration"]
    },
    {
      "label": "Super Agents: Check Configuration", 
      "type": "shell",
      "command": "ls",
      "args": ["-la", ".vscode/", "docs/super-agents/"]
    }
  ]
}
```

### Step 3: Create Code Snippets

Create `.vscode/super-agents.code-snippets`:

```json
{
  "Super Agents Task": {
    "prefix": "sa-task",
    "body": [
      "# Task: ${1:Task Title}",
      "",
      "**ID**: ${2:1.1}",
      "**Status**: ${3|pending,in-progress,blocked,review,done|}",
      "**Priority**: ${4|low,medium,high,critical|}",
      "**Type**: ${5|feature,bug,enhancement,documentation,infrastructure,research|}",
      "**Agent**: ${6|analyst,pm,architect,developer,qa,ux-expert,product-owner,scrum-master|}",
      "",
      "## Description",
      "${7:Detailed task description}",
      "",
      "## Acceptance Criteria",
      "- [ ] ${8:Criterion 1}",
      "- [ ] ${9:Criterion 2}",
      "- [ ] ${10:Criterion 3}",
      "",
      "## Dependencies", 
      "${11:List any task dependencies}",
      "",
      "## Notes",
      "${12:Additional notes or context}",
      "",
      "---",
      "*Created: ${CURRENT_DATE}*",
      "*Agent: ${6}*"
    ],
    "description": "Create a Super Agents task"
  },
  
  "Agent Request - Analyst": {
    "prefix": "sa-analyst",
    "body": [
      "## Business Analysis Request",
      "",
      "**Agent**: Business Analyst",
      "**Focus**: ${1|Market Research,Competitive Analysis,Business Requirements,Strategic Planning|}",
      "",
      "### Request",
      "${2:Describe what you need from the business analyst}",
      "",
      "### Context", 
      "${3:Provide relevant business context}",
      "",
      "### Deliverables",
      "- ${4:Market analysis report}",
      "- ${5:Competitive positioning}",
      "- ${6:Business recommendations}",
      "",
      "### Timeline",
      "${7:When do you need this completed?}",
      "",
      "---",
      "*Agent: Business Analyst*",
      "*Created: ${CURRENT_DATE}*"
    ],
    "description": "Request work from Business Analyst agent"
  },
  
  "Agent Request - Product Manager": {
    "prefix": "sa-pm",
    "body": [
      "## Product Management Request",
      "",
      "**Agent**: Product Manager", 
      "**Focus**: ${1|Requirements,Feature Planning,Prioritization,Roadmap|}",
      "",
      "### Request",
      "${2:Describe what you need from the product manager}",
      "",
      "### Product Context",
      "${3:Provide product and user context}",
      "",
      "### Expected Outputs",
      "- ${4:Product Requirements Document}",
      "- ${5:Feature specifications}",
      "- ${6:Prioritization framework}",
      "",
      "### Success Criteria",
      "${7:How will we measure success?}",
      "",
      "---",
      "*Agent: Product Manager*",  
      "*Created: ${CURRENT_DATE}*"
    ],
    "description": "Request work from Product Manager agent"
  },
  
  "Agent Request - Architect": {
    "prefix": "sa-architect",
    "body": [
      "## Architecture Request",
      "",
      "**Agent**: System Architect",
      "**Focus**: ${1|System Design,Technology Selection,Architecture Review,Scalability|}",
      "",
      "### Request",
      "${2:Describe the architectural challenge or need}",
      "",
      "### Technical Context",
      "${3:Current system state and constraints}",
      "",
      "### Requirements",
      "- **Performance**: ${4:Performance requirements}",
      "- **Scalability**: ${5:Scalability needs}",
      "- **Security**: ${6:Security considerations}",
      "- **Integration**: ${7:Integration requirements}",
      "",
      "### Deliverables",
      "- ${8:Architecture diagram}",
      "- ${9:Technology recommendations}",
      "- ${10:Implementation plan}",
      "",
      "---",
      "*Agent: System Architect*",
      "*Created: ${CURRENT_DATE}*"
    ],
    "description": "Request work from System Architect agent"
  },
  
  "Agent Request - Developer": {
    "prefix": "sa-developer", 
    "body": [
      "## Development Request",
      "",
      "**Agent**: Software Developer",
      "**Focus**: ${1|Implementation,Testing,Debugging,Code Review|}",  
      "",
      "### Request",
      "${2:Describe what needs to be developed}",
      "",
      "### Technical Requirements",
      "- **Language/Framework**: ${3:Technology stack}",
      "- **Functionality**: ${4:Core functionality needed}",
      "- **Testing**: ${5:Testing requirements}",
      "- **Performance**: ${6:Performance criteria}",
      "",
      "### Acceptance Criteria",
      "- [ ] ${7:Functional requirement 1}",
      "- [ ] ${8:Functional requirement 2}",
      "- [ ] ${9:Testing requirement}",
      "- [ ] ${10:Documentation requirement}",
      "",
      "### Context",
      "${11:Additional context or constraints}",
      "",
      "---",
      "*Agent: Software Developer*",
      "*Created: ${CURRENT_DATE}*"
    ],
    "description": "Request work from Software Developer agent"
  },
  
  "Agent Request - QA": {
    "prefix": "sa-qa",
    "body": [
      "## Quality Assurance Request", 
      "",
      "**Agent**: QA Engineer",
      "**Focus**: ${1|Code Review,Testing Strategy,Quality Validation,Process Improvement|}",
      "",
      "### Request",
      "${2:Describe what needs QA attention}",
      "",
      "### Quality Criteria",
      "- **Functionality**: ${3:Functional requirements}",
      "- **Performance**: ${4:Performance standards}",
      "- **Security**: ${5:Security requirements}",
      "- **Usability**: ${6:Usability criteria}",
      "",
      "### Test Scope",
      "${7:What should be tested?}",
      "",
      "### Expected Deliverables",
      "- ${8:Test plan or strategy}",
      "- ${9:Quality assessment}",
      "- ${10:Recommendations}",
      "",
      "---",
      "*Agent: QA Engineer*",
      "*Created: ${CURRENT_DATE}*"
    ],
    "description": "Request work from QA Engineer agent"
  },
  
  "Agent Request - UX Expert": {
    "prefix": "sa-ux",
    "body": [
      "## UX/UI Design Request",
      "",
      "**Agent**: UX Expert",
      "**Focus**: ${1|User Experience,Interface Design,Accessibility,Wireframes|}",
      "",
      "### Request", 
      "${2:Describe the UX/UI need}",
      "",
      "### User Context",
      "- **Target Users**: ${3:Who are the users?}",
      "- **Use Cases**: ${4:Primary use cases}",
      "- **Devices**: ${5:Target devices/platforms}",
      "- **Accessibility**: ${6:Accessibility requirements}",
      "",
      "### Design Requirements",
      "${7:Specific design requirements or constraints}",
      "",
      "### Deliverables",
      "- ${8:Wireframes or mockups}",
      "- ${9:User experience flows}",
      "- ${10:Design specifications}",
      "",
      "---",
      "*Agent: UX Expert*",
      "*Created: ${CURRENT_DATE}*"
    ],
    "description": "Request work from UX Expert agent"
  },
  
  "Super Agents Project Init": {
    "prefix": "sa-init",
    "body": [
      "# ${1:Project Name} - Super Agents Integration",
      "",
      "## Project Overview",
      "${2:Brief project description}",
      "",
      "## Team Structure",
      "- **Business Analyst**: Market research and requirements",
      "- **Product Manager**: Product strategy and planning", 
      "- **System Architect**: Technical architecture and design",
      "- **Developer**: Implementation and testing",
      "- **QA Engineer**: Quality assurance and review",
      "- **UX Expert**: User experience and interface design",
      "- **Product Owner**: Story validation and acceptance",
      "- **Scrum Master**: Process facilitation and coordination",
      "",
      "## Initial Tasks",
      "",
      "### 1. Project Setup (Status: ${3|pending,in-progress,done|})",
      "- [ ] Initialize project structure",
      "- [ ] Configure development environment", 
      "- [ ] Setup version control and CI/CD",
      "",
      "### 2. Requirements Gathering (Status: ${4|pending,in-progress,done|})",
      "- [ ] Conduct market research (Analyst)",
      "- [ ] Create product requirements (PM)",
      "- [ ] Define user stories (Product Owner)",
      "",
      "### 3. Architecture & Design (Status: ${5|pending,in-progress,done|})",
      "- [ ] System architecture design (Architect)",
      "- [ ] UI/UX design and wireframes (UX Expert)",
      "- [ ] Technical specifications (Architect)",
      "",
      "### 4. Development Planning (Status: ${6|pending,in-progress,done|})",
      "- [ ] Sprint planning (Scrum Master)",
      "- [ ] Development environment setup (Developer)",
      "- [ ] Testing strategy (QA)",
      "",
      "## Configuration",
      "",
      "- **Framework**: Super Agents v1.0.0",
      "- **IDE**: VS Code with manual setup",
      "- **Task Management**: Hierarchical (1.2.3 format)",
      "- **Workflow**: Agile with agent specialization",
      "",
      "---",
      "*Initialized: ${CURRENT_DATE}*",
      "*Configuration: VS Code Manual Setup*"
    ],
    "description": "Initialize Super Agents project structure"
  }
}
```

### Step 4: Create Agent Documentation

Create `docs/super-agents/AGENTS.md`:

```markdown
# Super Agents - VS Code Integration

## Available Agents

### Business Analyst (analyst)
**Role**: Market research and business analysis
**Activation**: Use when you need market research, competitive analysis, business requirements, or strategic planning.

**Capabilities**:
- Market research and competitive analysis
- Business requirements gathering
- Stakeholder analysis and management 
- Strategic planning and roadmap development
- ROI analysis and business case development

**VS Code Integration**:
- Snippet: `sa-analyst`
- Settings: `super-agents.agents.analyst`

---

### Product Manager (pm)
**Role**: Product strategy and requirements
**Activation**: Use for product planning, requirements documentation, feature prioritization.

**Capabilities**:
- Product Requirements Document (PRD) creation
- Epic and feature definition
- Feature prioritization and roadmapping
- Stakeholder communication and alignment
- User story creation and validation

**VS Code Integration**:
- Snippet: `sa-pm`
- Settings: `super-agents.agents.pm`

---

### System Architect (architect)
**Role**: Technical architecture and design  
**Activation**: Use for system design, architecture decisions, technology recommendations.

**Capabilities**:
- System architecture design and documentation
- Technology evaluation and recommendations
- Brownfield system analysis and modernization
- Performance and scalability planning
- Technical risk assessment and mitigation

**VS Code Integration**:
- Snippet: `sa-architect`
- Settings: `super-agents.agents.architect`

---

### Software Developer (developer) 
**Role**: Code implementation and development
**Activation**: Use for code implementation, testing, debugging, technical problem-solving.

**Capabilities**:
- Code implementation and development
- Testing strategy and test implementation
- Debugging and issue resolution
- Code review and refactoring
- Technical documentation

**VS Code Integration**:
- Snippet: `sa-developer`
- Settings: `super-agents.agents.developer`

---

### QA Engineer (qa)
**Role**: Quality assurance and testing
**Activation**: Use for code review, quality validation, testing strategy.

**Capabilities**:
- Code review and quality assessment
- Testing strategy development
- Quality metrics and reporting
- Process improvement recommendations
- Risk assessment and mitigation

**VS Code Integration**:
- Snippet: `sa-qa`
- Settings: `super-agents.agents.qa`

---

### UX Expert (ux-expert)
**Role**: User experience and interface design
**Activation**: Use for UI/UX design, wireframes, accessibility, frontend specifications.

**Capabilities**:
- User interface design and prototyping
- User experience optimization
- Accessibility auditing and implementation
- Frontend architecture and component design
- Design system development

**VS Code Integration**:
- Snippet: `sa-ux`  
- Settings: `super-agents.agents.ux-expert`

---

### Product Owner (product-owner)
**Role**: Product ownership and validation
**Activation**: Use for story validation, acceptance criteria definition, backlog management.

**Capabilities**:
- User story validation and refinement
- Acceptance criteria definition
- Backlog prioritization and management
- Stakeholder communication
- Progress tracking and reporting

**VS Code Integration**:
- Settings: `super-agents.agents.product-owner`

---

### Scrum Master (scrum-master)
**Role**: Agile facilitation and process
**Activation**: Use for process facilitation, sprint planning, workflow optimization.

**Capabilities**:
- Sprint and release planning
- User story creation and refinement
- Workflow optimization
- Team facilitation and coaching
- Progress tracking and reporting

**VS Code Integration**:
- Settings: `super-agents.agents.scrum-master`

## Usage in VS Code

### Code Snippets
Type the snippet prefix and press Tab to expand:

- `sa-task` - Create a Super Agents task
- `sa-analyst` - Request work from Business Analyst
- `sa-pm` - Request work from Product Manager
- `sa-architect` - Request work from System Architect  
- `sa-developer` - Request work from Software Developer
- `sa-qa` - Request work from QA Engineer
- `sa-ux` - Request work from UX Expert
- `sa-init` - Initialize Super Agents project

### Settings Configuration
Agents can be enabled/disabled in `.vscode/settings.json`:

```json
{
  "super-agents.agents.analyst.enabled": true,
  "super-agents.agents.pm.enabled": true
}
```

### Tasks Integration
Use VS Code tasks for Super Agents operations:
- **Ctrl+Shift+P** → "Tasks: Run Task" → "Super Agents: Initialize Project"

## Best Practices

### Agent Selection
- Choose the appropriate agent for each type of work
- Use agent-specific snippets for structured requests
- Reference agent capabilities when planning work

### Task Management  
- Use hierarchical task IDs (1.2.3 format)
- Update task statuses regularly
- Document dependencies and acceptance criteria

### Documentation
- Keep agent documentation updated
- Use consistent formatting and structure
- Share agent usage patterns with team

### Team Collaboration
- Commit VS Code configuration to version control
- Establish team conventions for agent usage
- Use shared snippets and templates

Generated on: ${new Date().toISOString()}
```

### Step 5: Create Workspace File (Optional)

Create `project-name.code-workspace`:

```json
{
  "folders": [
    {
      "name": "Root",
      "path": "."
    },
    {
      "name": "Super Agents Docs",
      "path": "./docs/super-agents"
    }
  ],
  "settings": {
    "super-agents.enabled": true,
    "super-agents.workspaceMode": true
  },
  "extensions": {
    "recommendations": [
      "ms-vscode.vscode-yaml",
      "davidanson.vscode-markdownlint",
      "ms-vscode.vscode-json",
      "bradlc.vscode-tailwindcss"
    ]
  },
  "tasks": {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Open Super Agents Docs",
        "type": "shell",
        "command": "code",
        "args": ["docs/super-agents/AGENTS.md"],
        "group": "build"
      }
    ]
  }
}
```

### Step 6: Test Integration

#### 6.1 Test Code Snippets

1. **Create a new Markdown file**
2. **Type `sa-task`** and press Tab
3. **Fill in the task template**
4. **Test other snippets** (`sa-analyst`, `sa-pm`, etc.)

#### 6.2 Test Settings

1. **Open VS Code Settings** (Ctrl+,)
2. **Search for "super-agents"**
3. **Verify configuration appears**
4. **Modify agent settings and test**

#### 6.3 Test Tasks

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Type "Tasks: Run Task"**
3. **Select "Super Agents: Initialize Project"**
4. **Verify task execution**

## Advanced Configuration

### Custom Themes and Colors

Add to `.vscode/settings.json`:

```json
{
  "workbench.colorCustomizations": {
    "[Super Agents Theme]": {
      "statusBar.background": "#1e3a8a",
      "statusBar.foreground": "#ffffff"
    }
  },
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": "markup.heading.super-agents",
        "settings": {
          "foreground": "#1e40af",
          "fontStyle": "bold"
        }
      }
    ]
  }
}
```

### File Associations

```json
{
  "files.associations": {
    "*.sa-task": "yaml",
    "*.sa-template": "yaml",
    "*.sa-workflow": "yaml",
    "AGENTS.md": "markdown",
    "SUPER-AGENTS.md": "markdown"
  }
}
```

### Language Support

```json
{
  "emmet.includeLanguages": {
    "super-agents-task": "yaml",
    "super-agents-template": "yaml"
  }
}
```

## Future Extension Support

### Planned VS Code Extension Features

The manual setup prepares for a future Super Agents VS Code extension:

1. **Task Management Sidebar**
   - Visual task management
   - Drag-and-drop task organization
   - Status updates and filtering

2. **Agent Chat Interface**
   - In-editor agent conversations
   - Context-aware suggestions
   - Integration with current file/project

3. **Template Integration**
   - Template gallery and browser
   - Custom template creation
   - Template variable auto-completion

4. **MCP Server Integration**
   - Direct MCP tool execution
   - Real-time tool availability
   - Enhanced agent capabilities

### Migration Path

When the extension becomes available:

1. **Export current configuration**
2. **Install Super Agents extension**
3. **Import manual configuration**
4. **Test extension features**
5. **Gradually adopt extension tools**

## Troubleshooting

### Snippets Not Working

#### Check Snippet File Location
```bash
# Verify snippet file exists
ls -la .vscode/super-agents.code-snippets

# Check snippet syntax
code .vscode/super-agents.code-snippets
```

#### Verify Snippet Scope
Ensure you're in the correct file type:
- Markdown files for most snippets
- YAML files for configuration snippets

### Settings Not Applied

#### Reload VS Code Settings
1. **Ctrl+Shift+P** → "Developer: Reload Window"
2. **Or restart VS Code completely**

#### Check Settings File Syntax
```bash
# Validate JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('.vscode/settings.json', 'utf8')))"
```

### Tasks Not Running

#### Check Task Configuration
```bash
# Verify tasks file
cat .vscode/tasks.json

# Test task syntax
code .vscode/tasks.json
```

#### Verify Shell Commands
Ensure shell commands in tasks are available:
```bash
which echo
which find
which ls
```

## Best Practices

### Project Organization
- Keep Super Agents configuration in version control
- Use consistent file naming conventions
- Organize documentation in dedicated folders
- Maintain clean workspace structure

### Team Collaboration  
- Share snippet library across team
- Establish agent usage conventions
- Document project-specific customizations
- Use workspace files for team settings

### Configuration Management
- Back up VS Code configuration regularly
- Test configuration changes thoroughly
- Document custom modifications
- Keep configuration synchronized across environments

## Support and Resources

### Documentation
- [VS Code User Guide](https://code.visualstudio.com/docs)
- [VS Code Snippets Documentation](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
- [VS Code Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings)
- [Super Agents Framework Documentation](../docs/)

### Community
- VS Code Community
- Super Agents GitHub Repository
- VS Code Extension Marketplace

### Getting Help
1. Check troubleshooting section above
2. Review VS Code documentation
3. Test with minimal configuration
4. File issues in Super Agents repository
5. Ask questions in community forums

---

*Last updated: ${new Date().toISOString()}*
*Super Agents Framework v1.0.0*