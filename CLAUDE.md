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
- **sa_brainstorm_session**: Facilitate structured brainstorming sessions with idea collection, organization, session progress tracking, and output synthesis
- **sa_competitor_analysis**: Conduct comprehensive competitive analysis with competitor identification, analysis framework application, competitive landscape mapping, and strategic recommendations
- **sa_create_brief**: Create comprehensive project briefs with interactive creation workflow and stakeholder input collection
- **sa_research_market**: Conduct comprehensive market research analysis with data collection workflows and formatted output

### Architect Tools
- **sa_analyze_brownfield**: Analyze existing brownfield systems with technical debt assessment, migration planning, and comprehensive risk analysis
- **sa_create_architecture**: Create comprehensive architecture documentation with template selection, documentation generation, diagram creation workflows, and architecture validation
- **sa_design_system**: Design comprehensive system architecture using established methodologies, architecture pattern selection, component design workflows, and design validation
- **sa_tech_recommendations**: Provide technology selection recommendations with stack analysis, framework comparison, performance considerations, and technology selection criteria

### Tasks Tools
- **sa_get_task**: Get detailed information about a specific task including dependencies, history, and related files
- **sa_list_tasks**: List and filter tasks from the Super Agents task management system
- **sa_update_task_status**: Update the status of a task with validation, notifications, and change tracking

### Project Tools
- **sa_initialize_project**: Initialize a new Super Agents project with templates, configuration, and initial task setup

### Dependencies Tools
- **sa_add_dependency**: Add dependencies between tasks with cycle detection and dependency type specification
- **sa_dependency_graph**: Generate dependency graph visualization in multiple formats with interactive exploration capabilities
- **sa_remove_dependency**: Remove dependencies between tasks with impact analysis and safe cascade handling
- **sa_validate_dependencies**: Comprehensive dependency validation with cycle detection, logical consistency checking, and dependency health assessment

### Developer Tools
- **sa_implement_story**: Implement user stories with code generation, testing setup, development planning, and implementation workflows
- **sa_run_tests**: Execute comprehensive test suites with coverage analysis, performance testing, and automated test management
- **sa_validate_implementation**: Validate implementation with comprehensive code quality analysis, testing verification, performance assessment, and compliance checking

### Pm Tools
- **sa_create_epic**: Create and manage epics with user story breakdown, epic prioritization, and comprehensive documentation
- **sa_generate_prd**: Generate comprehensive Product Requirements Documents with template selection, interactive creation workflow, requirements gathering, and validation
- **sa_prioritize_features**: Prioritize features using impact analysis, priority matrix application, stakeholder feedback integration, and strategic priority recommendations
- **sa_stakeholder_analysis**: Conduct comprehensive stakeholder analysis with identification, influence/interest mapping, communication planning, and stakeholder management workflows

### Product-owner Tools
- **sa_correct_course**: Identify project issues, plan course corrections, execute remediation workflows, and monitor progress for project recovery
- **sa_execute_checklist**: Load and execute checklists with progress tracking, validation criteria, and completion reporting for systematic workflow management
- **sa_shard_document**: Analyze documents and break them into logical shards using intelligent strategies for better manageability and processing
- **sa_validate_story_draft**: Validate story draft completeness, check quality criteria, validate dependencies, and manage approval workflow for user stories

### Qa Tools
- **sa_refactor_code**: Analyze code for refactoring opportunities with pattern detection, technical debt assessment, and automated refactoring plan generation
- **sa_review_code**: Conduct comprehensive code reviews with quality analysis, security assessment, performance evaluation, and improvement recommendations
- **sa_review_story**: Review story completeness, validate acceptance criteria, and check implementation quality against requirements
- **sa_validate_quality**: Validate code quality with comprehensive metrics analysis, standards compliance checking, quality gate enforcement, and continuous quality monitoring

### Research Tools
- **sa-follow-up-research**: Continue research conversations with previous context and perform follow-up queries
- **sa-research-save**: Save research results and conversations to tasks, subtasks, or files with various formatting options
- **sa-research**: Perform AI-powered research queries with project context awareness and intelligent task discovery

### Scrum-master Tools
- **sa_create_next_story**: Generate next story based on project context, dependency analysis, and story prioritization workflows
- **sa_create_story**: Create well-structured user stories with template selection, requirements breakdown, and story validation
- **sa_track_progress**: Track sprint progress with burndown analysis, velocity tracking, team performance metrics, and predictive insights
- **sa_update_workflow**: Update and manage agile workflows with status tracking, workflow optimization, and process improvement recommendations

### Task-master Tools
- **sa_analyze_complexity**: AI-powered complexity analysis for tasks including difficulty estimation, effort analysis, and resource requirements
- **sa_expand_task**: AI-powered task expansion to break down high-level tasks into detailed subtasks
- **sa_generate_tasks**: AI-powered task generation from requirements, contexts, or templates with intelligent task creation
- **sa_parse_prd**: Parse Product Requirements Document (PRD) and generate initial tasks using AI

### Ux-expert Tools
- **sa_accessibility_audit**: Conduct comprehensive accessibility audits with WCAG compliance checking, accessibility improvement suggestions, and audit reporting
- **sa_create_frontend_spec**: Create comprehensive frontend specifications with UI/UX requirements, design system integration, and technical implementation details
- **sa_design_wireframes**: Create wireframe specifications with user journey mapping, interface design patterns, and wireframe validation
- **sa_generate_ui_prompt**: Generate AI UI generation prompts optimized for tools like v0, Lovable, and other AI design platforms

### Workflow Tools
- **sa_start_workflow**: Workflow initiation tool with template selection, parameter configuration, and initial state setup
- **sa_workflow_status**: Status monitoring tool for workflow progress, active phases, and completion estimates
- **sa_workflow_validation**: Workflow validation tool for integrity checking, dependency validation, quality gates, and compliance verification


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

## Best Practices

### Agent Usage
- Use specific agents for their specialized tasks
- Leverage agent collaboration for complex workflows
- Follow the Super Agents methodology for optimal results

### Workflow Optimization  
- Initialize projects properly with `sa-initialize-project`
- Track dependencies using `sa-dependency-graph`
- Monitor progress regularly with `sa-track-progress`
- Validate implementations with appropriate QA tools

### Performance Considerations
- Use task-specific tools rather than general-purpose ones
- Break complex work into smaller, manageable tasks
- Leverage agent specializations for efficiency

## Common Commands

- `/sa-start-project` - Initialize a new Super Agents project
- `/sa-track-progress` - Check current workflow status  
- `/sa-research <topic>` - Run analyst research on a topic
- `/sa-create-prd <feature>` - Generate PRD with PM agent
- `/sa-implement <story>` - Implement feature with developer agent

## Integration Details

This Claude Code integration provides:
- Full MCP server support with all Super Agents tools
- Custom slash commands for common workflows
- Agent-specific documentation and usage patterns
- Event hooks for workflow monitoring
- Comprehensive tool registration and validation

For support and documentation, refer to the Super Agents framework documentation in the project repository.
