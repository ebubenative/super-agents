# Super Agents Framework - Claude Code Integration

This project uses the Super Agents framework to provide AI-powered development assistance through specialized agents and automated workflows.

## Available Agents

### Core Development Agents
- **Analyst**: Market research, competitive analysis, brainstorming sessions, and requirements gathering
- **PM (Product Manager)**: PRD generation, epic creation, feature prioritization, and stakeholder analysis  
- **Architect**: System design, technology recommendations, architecture analysis, and design patterns
- **Developer**: Implementation, testing, debugging, and code validation
- **QA**: Code review, refactoring, quality validation, and test creation
- **Product Owner**: Checklist execution, story validation, course correction, and document management
- **UX Expert**: Frontend specifications, UI prompts, wireframes, and accessibility audits
- **Scrum Master**: Story creation, workflow management, progress tracking, and team coordination

## MCP Tools Available

### Analyst Tools
- **sa-brainstorm-session**: Conduct structured brainstorming sessions for ideation and problem-solving
- **sa-competitor-analysis**: Perform comprehensive competitive analysis and market positioning
- **sa-create-brief**: Generate detailed project briefs and requirement summaries
- **sa-research-market**: Conduct thorough market research and trend analysis

### Architect Tools
- **sa-analyze-brownfield**: Analyze existing codebases and legacy system architectures
- **sa-create-architecture**: Design comprehensive system architectures and technical specifications
- **sa-design-system**: Create design systems and component architectures
- **sa-tech-recommendations**: Provide technology stack recommendations and technical guidance

### Core Tools
- **sa-get-task**: Retrieve specific task details and information
- **sa-initialize-project**: Set up new projects with proper structure and configuration
- **sa-list-tasks**: List and filter project tasks with various criteria
- **sa-update-task-status**: Update task status and progress tracking

### Dependencies Tools
- **sa-add-dependency**: Add new task dependencies and relationships
- **sa-dependency-graph**: Generate and visualize project dependency graphs
- **sa-remove-dependency**: Remove task dependencies and update relationships
- **sa-validate-dependencies**: Validate dependency chains and detect circular dependencies

### Developer Tools
- **sa-debug-issue**: Debug and troubleshoot code issues and technical problems
- **sa-implement-story**: Implement user stories and feature requirements
- **sa-run-tests**: Execute test suites and validate implementations
- **sa-validate-implementation**: Validate code implementations against requirements

### PM Tools
- **sa-create-epic**: Create comprehensive epics with detailed specifications
- **sa-generate-prd**: Generate Product Requirements Documents (PRDs)
- **sa-prioritize-features**: Prioritize features and create development roadmaps
- **sa-stakeholder-analysis**: Analyze stakeholders and their requirements

### Product Owner Tools
- **sa-correct-course**: Provide course correction and project guidance
- **sa-execute-checklist**: Execute project checklists and validation procedures
- **sa-shard-document**: Break down large documents into manageable components
- **sa-validate-story-draft**: Validate user story drafts and requirements

### QA Tools
- **sa-refactor-code**: Refactor code for improved quality and maintainability
- **sa-review-code**: Perform comprehensive code reviews and quality assessments
- **sa-review-story**: Review user stories for completeness and clarity
- **sa-validate-quality**: Validate code quality and adherence to standards

### Scrum Master Tools
- **sa-create-next-story**: Create next user stories in the development sequence
- **sa-create-story**: Create detailed user stories with acceptance criteria
- **sa-track-progress**: Track project progress and team velocity
- **sa-update-workflow**: Update workflow states and process improvements

### Task Master Tools
- **sa-analyze-complexity**: Analyze task complexity and effort estimation
- **sa-expand-task**: Expand high-level tasks into detailed subtasks
- **sa-generate-tasks**: Generate comprehensive task lists from requirements
- **sa-parse-prd**: Parse Product Requirements Documents into actionable tasks

### UX Expert Tools
- **sa-accessibility-audit**: Conduct accessibility audits and compliance checks
- **sa-create-frontend-spec**: Create detailed frontend specifications and requirements
- **sa-design-wireframes**: Design wireframes and user interface mockups
- **sa-generate-ui-prompt**: Generate UI prompts and design guidelines

### Workflow Tools
- **sa-start-workflow**: Initialize and start project workflows
- **sa-track-progress**: Monitor workflow progress and milestone completion
- **sa-workflow-status**: Check current workflow status and phase information
- **sa-workflow-validation**: Validate workflow states and transitions

## Usage Patterns

### Starting a New Project
1. Use `sa-initialize-project` to set up the project structure
2. Use `sa-generate-prd` with the PM agent to create requirements
3. Use `sa-create-architecture` with the Architect to design the system
4. Use `sa-generate-tasks` to break down work into manageable tasks

### Development Workflow  
1. Use `sa-create-story` to create user stories
2. Use `sa-implement-story` with the Developer agent to build features
3. Use `sa-review-code` with the QA agent for quality assurance
4. Use `sa-track-progress` to monitor workflow status

### Collaboration Patterns
- Analysts gather requirements → PMs create PRDs → Architects design systems → Developers implement
- QA agents review code → Product Owners validate stories → Scrum Masters track progress
- UX Experts create specifications → Developers implement UI → QA validates accessibility

### Research and Analysis
1. Use `sa-research-market` for market analysis and trends
2. Use `sa-competitor-analysis` to understand competitive landscape
3. Use `sa-brainstorm-session` for ideation and problem-solving
4. Use `sa-stakeholder-analysis` to understand user needs

### Architecture and Design
1. Use `sa-analyze-brownfield` for existing system analysis
2. Use `sa-create-architecture` for new system design
3. Use `sa-tech-recommendations` for technology selection
4. Use `sa-design-system` for component architecture

### Quality Assurance
1. Use `sa-review-code` for comprehensive code reviews
2. Use `sa-validate-quality` for quality standards compliance
3. Use `sa-refactor-code` for code improvement recommendations
4. Use `sa-accessibility-audit` for accessibility compliance

## Best Practices

### Agent Usage
- Use specific agents for their specialized tasks
- Leverage agent collaboration for complex workflows
- Follow the Super Agents methodology for optimal results
- Always start with `sa-initialize-project` for new projects

### Workflow Optimization  
- Initialize projects properly with `sa-initialize-project`
- Track dependencies using `sa-dependency-graph`
- Monitor progress regularly with `sa-track-progress`
- Validate implementations with appropriate QA tools
- Use `sa-workflow-status` to check current phase

### Task Management
- Break down complex work with `sa-expand-task`
- Use `sa-analyze-complexity` for effort estimation
- Track task relationships with dependency tools
- Validate story completeness with `sa-validate-story-draft`

### Performance Considerations
- Use task-specific tools rather than general-purpose ones
- Break complex work into smaller, manageable tasks
- Leverage agent specializations for efficiency
- Regularly validate dependencies to avoid conflicts

## Common Commands

- `/sa-start-project` - Initialize a new Super Agents project
- `/sa-track-progress` - Check current workflow status  
- `/sa-research <topic>` - Run analyst research on a topic
- `/sa-create-prd <feature>` - Generate PRD with PM agent
- `/sa-implement <story>` - Implement feature with developer agent
- `/sa-review-code` - Perform QA code review
- `/sa-design-system` - Create system architecture

## Integration Details

This Claude Code integration provides:
- **Full MCP Server Support**: All 40+ Super Agents tools available via MCP protocol
- **Custom Slash Commands**: Convenient commands for common workflows
- **Agent-Specific Documentation**: Detailed guides for each specialized agent
- **Event Hooks**: Workflow monitoring and progress tracking
- **Comprehensive Tool Registration**: All tools validated and properly configured
- **Standalone Installation**: Manual setup option for any project

### MCP Configuration
The MCP server runs on `super-agents` namespace with tools accessible via the MCP protocol:
```json
{
  "mcpServers": {
    "super-agents": {
      "command": "node",
      "args": ["sa-engine/mcp-server/index.js"],
      "env": {
        "SA_PROJECT_ROOT": ".",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "SA_LOG_LEVEL": "info"
      }
    }
  }
}
```

### Tool Categories
Tools are organized by agent specialization:
- **8 Agent Categories**: Each with specialized tools for their domain
- **4 Core Tools**: Essential project management functionality
- **4 Dependency Tools**: Task relationship management
- **4 Workflow Tools**: Process and progress management
- **32+ Agent Tools**: Specialized functionality for each agent type

### Environment Setup
Required environment variables:
- `ANTHROPIC_API_KEY`: For Claude API access
- `OPENAI_API_KEY`: For GPT model access (optional)
- `SA_PROJECT_ROOT`: Project root directory (default: current directory)
- `SA_LOG_LEVEL`: Logging verbosity (info, debug, warn, error)

## Troubleshooting

### Common Issues
1. **MCP Server Not Starting**: Check API keys and project root path
2. **Tools Not Loading**: Verify tool directory structure and permissions
3. **Agent Not Responding**: Check agent configuration files and API access
4. **Dependency Conflicts**: Use `sa-validate-dependencies` to identify issues

### Debug Commands
- Check MCP server status with workflow tools
- Validate tool loading with `sa-list-tasks`
- Test agent connectivity with simple tools first
- Review logs for detailed error information

## Support and Documentation

For detailed documentation, examples, and support:
- Review agent configuration files in `sa-engine/agents/`
- Check tool implementations in `sa-engine/mcp-server/tools/`
- Reference workflow procedures in `sa-engine/procedures/`
- See template examples in `sa-engine/templates/`

---
*Generated by Super Agents Framework v1.0.0*
*Claude Code Integration - Phase 10 Implementation*