# Super Agents - Cursor Command Reference

## Overview
This document provides a comprehensive reference for all Super Agents commands available in Cursor IDE.

**Total Commands**: 29

## MCP Tool Commands

These commands directly invoke Super Agents tools via MCP integration:

### Core Tools

#### @sa_get_task
**Description**: Retrieve specific task details and information
**Usage**: `@sa-get-task [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_initialize_project
**Description**: Set up new projects with proper structure and configuration
**Usage**: `@sa-initialize-project [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_list_tasks
**Description**: List and filter project tasks with various criteria
**Usage**: `@sa-list-tasks [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_update_task_status
**Description**: Update task status and progress tracking
**Usage**: `@sa-update-task-status [parameters]`
**Parameters**: [tool-specific parameters]

### Analyst Tools

#### @sa_brainstorm_session
**Description**: Facilitate structured brainstorming sessions
**Usage**: `@sa-brainstorm-session topic="mobile app features" technique="rapid-ideation"`
**Parameters**: topic, technique, duration, participants

#### @sa_competitor_analysis
**Description**: Perform competitive analysis and market positioning
**Usage**: `@sa-competitor-analysis industry="project management software"`
**Parameters**: [tool-specific parameters]

#### @sa_create_brief
**Description**: Generate detailed project briefs and requirement summaries
**Usage**: `@sa-create-brief projectName="E-commerce Platform" briefType="enhanced"`
**Parameters**: [tool-specific parameters]

#### @sa_research_market
**Description**: Conduct comprehensive market research and trend analysis
**Usage**: `@sa-research-market topic="AI development tools" scope="comprehensive"`
**Parameters**: topic, scope, targetAudience, geoFocus

### Pm Tools

#### @sa_create_epic
**Description**: Create comprehensive epics with detailed specifications
**Usage**: `@sa-create-epic [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_generate_prd
**Description**: Generate Product Requirements Documents (PRDs)
**Usage**: `@sa-generate-prd requirements="user authentication system with social login"`
**Parameters**: requirements, stakeholders, constraints, timeline

#### @sa_prioritize_features
**Description**: Prioritize features and create development roadmaps
**Usage**: `@sa-prioritize-features [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_stakeholder_analysis
**Description**: Analyze stakeholders and their requirements
**Usage**: `@sa-stakeholder-analysis [parameters]`
**Parameters**: [tool-specific parameters]

### Architect Tools

#### @sa_analyze_brownfield
**Description**: Analyze existing codebases and legacy systems
**Usage**: `@sa-analyze-brownfield [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_create_architecture
**Description**: Design comprehensive system architectures
**Usage**: `@sa-create-architecture requirements="scalable microservices application"`
**Parameters**: requirements, type, scale, constraints

#### @sa_design_system
**Description**: Create design systems and component architectures
**Usage**: `@sa-design-system [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_tech_recommendations
**Description**: Provide technology stack recommendations
**Usage**: `@sa-tech-recommendations [parameters]`
**Parameters**: [tool-specific parameters]

### Developer Tools

#### @sa_debug_issue
**Description**: Debug and troubleshoot code issues
**Usage**: `@sa-debug-issue [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_implement_story
**Description**: Implement user stories and feature requirements
**Usage**: `@sa-implement-story story="user registration with email verification"`
**Parameters**: story, acceptance_criteria, architecture, patterns

#### @sa_run_tests
**Description**: Execute test suites and validate implementations
**Usage**: `@sa-run-tests [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_validate_implementation
**Description**: Validate code implementations against requirements
**Usage**: `@sa-validate-implementation [parameters]`
**Parameters**: [tool-specific parameters]

### Qa Tools

#### @sa_refactor_code
**Description**: Refactor code for improved quality and maintainability
**Usage**: `@sa-refactor-code [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_review_code
**Description**: Perform comprehensive code reviews
**Usage**: `@sa-review-code files="src/auth/" focus="security,performance"`
**Parameters**: files, focus, standards

#### @sa_review_story
**Description**: Review user stories for completeness and clarity
**Usage**: `@sa-review-story [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_validate_quality
**Description**: Validate code quality and adherence to standards
**Usage**: `@sa-validate-quality [parameters]`
**Parameters**: [tool-specific parameters]

### Ux-expert Tools

#### @sa_accessibility_audit
**Description**: ux-expert tool for specialized tasks
**Usage**: `@sa-accessibility-audit [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_create_frontend_spec
**Description**: ux-expert tool for specialized tasks
**Usage**: `@sa-create-frontend-spec [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_design_wireframes
**Description**: ux-expert tool for specialized tasks
**Usage**: `@sa-design-wireframes [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_generate_ui_prompt
**Description**: ux-expert tool for specialized tasks
**Usage**: `@sa-generate-ui-prompt [parameters]`
**Parameters**: [tool-specific parameters]

### Product-owner Tools

#### @sa_correct_course
**Description**: product-owner tool for specialized tasks
**Usage**: `@sa-correct-course [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_execute_checklist
**Description**: product-owner tool for specialized tasks
**Usage**: `@sa-execute-checklist [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_shard_document
**Description**: product-owner tool for specialized tasks
**Usage**: `@sa-shard-document [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_validate_story_draft
**Description**: product-owner tool for specialized tasks
**Usage**: `@sa-validate-story-draft [parameters]`
**Parameters**: [tool-specific parameters]

### Scrum-master Tools

#### @sa_create_next_story
**Description**: scrum-master tool for specialized tasks
**Usage**: `@sa-create-next-story [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_create_story
**Description**: scrum-master tool for specialized tasks
**Usage**: `@sa-create-story [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_track_progress
**Description**: scrum-master tool for specialized tasks
**Usage**: `@sa-track-progress [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_update_workflow
**Description**: scrum-master tool for specialized tasks
**Usage**: `@sa-update-workflow [parameters]`
**Parameters**: [tool-specific parameters]

### Task-master Tools

#### @sa_analyze_complexity
**Description**: task-master tool for specialized tasks
**Usage**: `@sa-analyze-complexity [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_expand_task
**Description**: task-master tool for specialized tasks
**Usage**: `@sa-expand-task [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_generate_tasks
**Description**: task-master tool for specialized tasks
**Usage**: `@sa-generate-tasks [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_parse_prd
**Description**: task-master tool for specialized tasks
**Usage**: `@sa-parse-prd [parameters]`
**Parameters**: [tool-specific parameters]

### Workflow Tools

#### @sa_start_workflow
**Description**: workflow tool for specialized tasks
**Usage**: `@sa-start-workflow [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_track_progress
**Description**: workflow tool for specialized tasks
**Usage**: `@sa-track-progress [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_workflow_status
**Description**: workflow tool for specialized tasks
**Usage**: `@sa-workflow-status [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_workflow_validation
**Description**: workflow tool for specialized tasks
**Usage**: `@sa-workflow-validation [parameters]`
**Parameters**: [tool-specific parameters]

### Dependencies Tools

#### @sa_add_dependency
**Description**: dependencies tool for specialized tasks
**Usage**: `@sa-add-dependency [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_dependency_graph
**Description**: dependencies tool for specialized tasks
**Usage**: `@sa-dependency-graph [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_remove_dependency
**Description**: dependencies tool for specialized tasks
**Usage**: `@sa-remove-dependency [parameters]`
**Parameters**: [tool-specific parameters]

#### @sa_validate_dependencies
**Description**: dependencies tool for specialized tasks
**Usage**: `@sa-validate-dependencies [parameters]`
**Parameters**: [tool-specific parameters]

## Agent Persona Commands

Use these commands to activate specific agent personas:

### @analyst
**Role**: Business Analyst and Researcher
**Description**: Activate Analyst agent persona for business analyst and researcher tasks
**Capabilities**: Market research, Competitive analysis, Requirements gathering, Stakeholder analysis
**Usage**: `@analyst: [Your request related to business analyst and researcher]`
**Examples**:
- `@analyst: Research the competitive landscape for project management tools`
- `@analyst: Analyze market trends in AI-powered development tools`
- `@analyst: Gather requirements for mobile payment integration`

### @pm
**Role**: Product Manager
**Description**: Activate PM agent persona for product manager tasks
**Capabilities**: PRD creation, Feature prioritization, Epic planning, Stakeholder analysis
**Usage**: `@pm: [Your request related to product manager]`
**Examples**:
- `@pm: Create a PRD for user authentication with social login`
- `@pm: Prioritize features for our Q2 release`
- `@pm: Plan epic for mobile app development`

### @architect
**Role**: System Architect
**Description**: Activate Architect agent persona for system architect tasks
**Capabilities**: System design, Technology recommendations, Architecture analysis, Design patterns
**Usage**: `@architect: [Your request related to system architect]`
**Examples**:
- `@architect: Design a scalable microservices architecture for our e-commerce platform`
- `@architect: Recommend technology stack for real-time messaging app`
- `@architect: Analyze existing system for performance optimization`

### @developer
**Role**: Software Developer
**Description**: Activate Developer agent persona for software developer tasks
**Capabilities**: Code implementation, Debugging, Testing, Code validation
**Usage**: `@developer: [Your request related to software developer]`
**Examples**:
- `@developer: Implement user registration with email verification`
- `@developer: Debug the authentication middleware issue`
- `@developer: Create API endpoints for user management`

### @qa
**Role**: Quality Assurance Engineer
**Description**: Activate QA agent persona for quality assurance engineer tasks
**Capabilities**: Code review, Quality validation, Refactoring, Testing strategies
**Usage**: `@qa: [Your request related to quality assurance engineer]`
**Examples**:
- `@qa: Review this authentication code for security vulnerabilities`
- `@qa: Create test plan for the new payment feature`
- `@qa: Validate code quality for the user management module`

### @ux-expert
**Role**: UX/UI Designer
**Description**: Activate UX-Expert agent persona for ux/ui designer tasks
**Capabilities**: Frontend specifications, UI design, Accessibility audits, Wireframing
**Usage**: `@ux-expert: [Your request related to ux/ui designer]`
**Examples**:
- `@ux-expert: Create wireframes for the user onboarding flow`
- `@ux-expert: Design frontend specification for the dashboard`
- `@ux-expert: Conduct accessibility audit for the checkout process`

### @product-owner
**Role**: Product Owner
**Description**: Activate Product-Owner agent persona for product owner tasks
**Capabilities**: Story validation, Course correction, Checklist execution, Document management
**Usage**: `@product-owner: [Your request related to product owner]`
**Examples**:
- `@product-owner: [Request related to product owner]`

### @scrum-master
**Role**: Scrum Master
**Description**: Activate Scrum-Master agent persona for scrum master tasks
**Capabilities**: Story creation, Progress tracking, Workflow management, Sprint coordination
**Usage**: `@scrum-master: [Your request related to scrum master]`
**Examples**:
- `@scrum-master: [Request related to scrum master]`

## Workflow Commands

Use these commands to execute complete workflows:

### @workflow:greenfield
**Description**: Start a complete greenfield development workflow
**Usage**: `@workflow:greenfield project="My New App" type="web-application"`
**Steps**:
1. @analyst: Research market and requirements
2. @pm: Create PRD and user stories
3. @architect: Design system architecture
4. @ux-expert: Create frontend specifications
5. @developer: Implement features
6. @qa: Review and validate quality

### @workflow:brownfield
**Description**: Start a brownfield enhancement workflow
**Usage**: `@workflow:brownfield project="Existing App" enhancement="New Feature"`
**Steps**:
1. @architect: Analyze existing system
2. @analyst: Assess enhancement requirements
3. @pm: Plan integration strategy
4. @developer: Implement changes
5. @qa: Validate integration and regressions

### @workflow:feature
**Description**: Develop a specific feature end-to-end
**Usage**: `@workflow:feature name="User Authentication" priority="high"`
**Steps**:
1. @pm: Define feature requirements
2. @architect: Design feature architecture
3. @developer: Implement feature
4. @qa: Test and validate feature

### @workflow:research
**Description**: Conduct comprehensive research and analysis
**Usage**: `@workflow:research topic="Competitive Analysis" scope="comprehensive"`
**Steps**:
1. @analyst: Conduct market research
2. @analyst: Perform competitive analysis
3. @pm: Synthesize findings into actionable insights

## Utility Commands

Helpful commands for managing Super Agents integration:

### @sa:help
**Description**: Get help with Super Agents Framework
**Usage**: `@sa:help [topic]`
**Topics**: agents, tools, workflows, setup

### @sa:status
**Description**: Check Super Agents integration status
**Usage**: `@sa:status`
**Checks**: MCP connection, Rules files, Environment variables

### @sa:agents
**Description**: List all available agents and their capabilities
**Usage**: `@sa:agents [agent-name]`

### @sa:tools
**Description**: List all available tools by category
**Usage**: `@sa:tools [category]`

### @sa:workflows
**Description**: Get guidance on workflow patterns
**Usage**: `@sa:workflows [workflow-type]`

## Quick Reference

### Most Common Commands
```
# Research and Analysis
@analyst: Research competitive landscape for [topic]
@sa-research-market topic="[topic]" scope="comprehensive"

# Product Planning
@pm: Create PRD for [feature/product]
@sa-generate-prd requirements="[requirements]"

# System Design
@architect: Design architecture for [system]
@sa-create-architecture requirements="[requirements]"

# Development
@developer: Implement [feature/story]
@sa-implement-story story="[story description]"

# Quality Review
@qa: Review code in [files/directories]
@sa-review-code files="[file paths]" focus="security,performance"
```

### Workflow Patterns
```
# Complete Feature Development
@analyst → @pm → @architect → @developer → @qa

# Quick Research
@analyst: Research [topic] and provide key insights

# Code Review Flow
@developer: Implement [feature]
@qa: Review implementation for quality and security
```

---
*Command Reference - Super Agents Framework for Cursor*
*Generated: 2025-07-30T18:31:21.193Z*
