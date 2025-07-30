# Super Agents Framework - API Reference

Complete reference for all 40+ MCP tools available in the Super Agents Framework.

## Overview

Super Agents provides specialized MCP tools organized by agent expertise:

- **Core Tools** (4) - Essential project management
- **Agent Tools** (36+) - Specialized functionality by agent type
- **Workflow Tools** (4) - Process and progress management

## Core Tools

### sa-get-task
**Purpose**: Retrieve specific task details and information

**Parameters**:
- `id` (string, required) - Task identifier
- `includeSubtasks` (boolean, optional) - Include subtask details

**Returns**:
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "User Authentication",
    "description": "Implement user login system",
    "status": "in-progress",
    "assignee": "developer",
    "dependencies": ["task-002"],
    "subtasks": []
  }
}
```

### sa-initialize-project
**Purpose**: Set up new projects with proper structure and configuration

**Parameters**:
- `name` (string, required) - Project name
- `template` (string, optional) - Project template (fullstack, frontend, backend, minimal)
- `agents` (array, optional) - Enabled agents for the project

**Returns**:
```json
{
  "success": true,
  "data": {
    "projectName": "my-project",
    "template": "fullstack",
    "configPath": "sa-config.json",
    "structure": ["src/", "docs/", "tests/"]
  }
}
```

### sa-list-tasks
**Purpose**: List and filter project tasks with various criteria

**Parameters**:
- `status` (string, optional) - Filter by status (pending, in-progress, done)
- `assignee` (string, optional) - Filter by assignee agent
- `limit` (number, optional) - Maximum number of tasks to return

**Returns**:
```json
{
  "success": true,
  "data": {
    "tasks": [],
    "total": 10,
    "filtered": 5
  }
}
```

### sa-update-task-status
**Purpose**: Update task status and progress tracking

**Parameters**:
- `id` (string, required) - Task identifier
- `status` (string, required) - New status (pending, in-progress, done, cancelled)
- `notes` (string, optional) - Update notes

**Returns**:
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "previousStatus": "in-progress",
    "newStatus": "done",
    "updatedAt": "2025-01-30T10:00:00Z"
  }
}
```

## Analyst Tools

### sa-brainstorm-session
**Purpose**: Conduct structured brainstorming sessions for ideation and problem-solving

**Parameters**:
- `topic` (string, required) - Brainstorming topic or challenge
- `focus` (string, optional) - Specific focus area (features, solutions, problems)
- `duration` (number, optional) - Session duration in minutes
- `participants` (array, optional) - Participant roles or perspectives

**Returns**:
```json
{
  "success": true,
  "data": {
    "sessionId": "brainstorm-001",
    "topic": "Mobile App Features",
    "ideas": [
      {
        "idea": "Push notifications",
        "category": "engagement",
        "priority": "high"
      }
    ],
    "summary": "Generated 15 ideas across 4 categories"
  }
}
```

### sa-competitor-analysis
**Purpose**: Perform comprehensive competitive analysis and market positioning

**Parameters**:
- `industry` (string, required) - Industry or market segment
- `competitors` (array, optional) - Specific competitors to analyze
- `focus` (string, optional) - Analysis focus (features, pricing, marketing)

**Returns**:
```json
{
  "success": true,
  "data": {
    "industry": "Task Management Software",
    "competitors": [
      {
        "name": "Competitor A",
        "strengths": ["User interface", "Mobile app"],
        "weaknesses": ["Pricing", "Integrations"],
        "marketShare": "15%"
      }
    ],
    "opportunities": [],
    "threats": []
  }
}
```

### sa-create-brief
**Purpose**: Generate detailed project briefs and requirement summaries

**Parameters**:
- `projectName` (string, required) - Project name
- `objectives` (array, required) - Project objectives
- `stakeholders` (array, optional) - Key stakeholders
- `constraints` (array, optional) - Project constraints

**Returns**:
```json
{
  "success": true,
  "data": {
    "brief": {
      "title": "Project Brief: E-commerce Platform",
      "objectives": [],
      "scope": "",
      "stakeholders": [],
      "timeline": "",
      "budget": "",
      "risks": []
    },
    "documentPath": "docs/project-brief.md"
  }
}
```

### sa-research-market
**Purpose**: Conduct thorough market research and trend analysis

**Parameters**:
- `topic` (string, required) - Research topic or market
- `depth` (string, optional) - Research depth (basic, comprehensive, detailed)
- `sources` (array, optional) - Preferred research sources
- `timeframe` (string, optional) - Research timeframe (current, 1year, 5year)

**Returns**:
```json
{
  "success": true,
  "data": {
    "topic": "AI Development Tools",
    "marketSize": "$2.3B",
    "growthRate": "23% CAGR",
    "trends": [],
    "keyPlayers": [],
    "opportunities": [],
    "reportPath": "docs/market-research.md"
  }
}
```

## Architect Tools

### sa-analyze-brownfield
**Purpose**: Analyze existing codebases and legacy system architectures

**Parameters**:
- `path` (string, required) - Path to existing codebase
- `focus` (array, optional) - Analysis focus areas (architecture, patterns, tech-debt)
- `excludePatterns` (array, optional) - Files/directories to exclude

**Returns**:
```json
{
  "success": true,
  "data": {
    "analysis": {
      "codebaseSize": "50,000 LOC",
      "languages": ["JavaScript", "TypeScript"],
      "frameworks": ["React", "Express"],
      "architecture": "Monolithic",
      "patterns": ["MVC", "Repository"],
      "techDebt": []
    },
    "recommendations": [],
    "reportPath": "docs/brownfield-analysis.md"
  }
}
```

### sa-create-architecture
**Purpose**: Design comprehensive system architectures and technical specifications

**Parameters**:
- `prd` (string, optional) - Path to Product Requirements Document
- `requirements` (string, required) - System requirements and constraints
- `type` (string, optional) - Architecture type (monolithic, microservices, serverless)
- `scale` (string, optional) - Expected scale (small, medium, large, enterprise)

**Returns**:
```json
{
  "success": true,
  "data": {
    "architecture": {
      "type": "Microservices",
      "components": [],
      "technologies": [],
      "patterns": [],
      "deployment": ""
    },
    "diagrams": [],
    "documentation": "docs/architecture.md"
  }
}
```

### sa-design-system
**Purpose**: Create design systems and component architectures

**Parameters**:
- `platform` (string, required) - Target platform (web, mobile, desktop)
- `framework` (string, optional) - UI framework (React, Vue, Angular)
- `scope` (array, optional) - Design system scope (components, tokens, patterns)

### sa-tech-recommendations
**Purpose**: Provide technology stack recommendations and technical guidance

**Parameters**:
- `requirements` (string, required) - Technical requirements
- `constraints` (array, optional) - Technical constraints
- `preferences` (array, optional) - Technology preferences

## Developer Tools

### sa-debug-issue
**Purpose**: Debug and troubleshoot code issues and technical problems

**Parameters**:
- `component` (string, required) - Component or module with issues
- `error` (string, optional) - Error message or description
- `context` (string, optional) - Additional context about the issue
- `files` (array, optional) - Relevant file paths

### sa-implement-story
**Purpose**: Implement user stories and feature requirements

**Parameters**:
- `story` (string, required) - User story description or ID
- `acceptance_criteria` (array, optional) - Acceptance criteria
- `architecture` (string, optional) - Architecture guidelines
- `patterns` (array, optional) - Coding patterns to follow

### sa-run-tests
**Purpose**: Execute test suites and validate implementations

**Parameters**:
- `component` (string, optional) - Specific component to test
- `type` (string, optional) - Test type (unit, integration, e2e)
- `coverage` (boolean, optional) - Include coverage report

### sa-validate-implementation
**Purpose**: Validate code implementations against requirements

**Parameters**:
- `story` (string, required) - Story or requirement to validate against
- `files` (array, optional) - Files to validate
- `criteria` (array, optional) - Validation criteria

## PM Tools

### sa-create-epic
**Purpose**: Create comprehensive epics with detailed specifications

**Parameters**:
- `prd` (string, optional) - Path to PRD document
- `title` (string, required) - Epic title
- `objectives` (array, required) - Epic objectives
- `scope` (string, optional) - Epic scope definition

### sa-generate-prd
**Purpose**: Generate Product Requirements Documents (PRDs)

**Parameters**:
- `requirements` (string, required) - High-level requirements
- `stakeholders` (array, optional) - Key stakeholders
- `constraints` (array, optional) - Project constraints
- `timeline` (string, optional) - Project timeline

### sa-prioritize-features
**Purpose**: Prioritize features and create development roadmaps

**Parameters**:
- `features` (array, required) - List of features to prioritize
- `criteria` (array, optional) - Prioritization criteria
- `constraints` (object, optional) - Resource and time constraints

### sa-stakeholder-analysis
**Purpose**: Analyze stakeholders and their requirements

**Parameters**:
- `project` (string, required) - Project name or description
- `stakeholders` (array, optional) - Known stakeholders
- `analysis_depth` (string, optional) - Analysis depth level

## QA Tools

### sa-refactor-code
**Purpose**: Refactor code for improved quality and maintainability

**Parameters**:
- `target` (string, required) - Code area or improvement target
- `files` (array, optional) - Specific files to refactor
- `focus` (array, optional) - Refactoring focus (performance, readability, structure)

### sa-review-code
**Purpose**: Perform comprehensive code reviews and quality assessments

**Parameters**:
- `files` (array, required) - Files to review
- `focus` (array, optional) - Review focus areas (security, performance, maintainability)
- `standards` (string, optional) - Coding standards to apply

### sa-review-story
**Purpose**: Review user stories for completeness and clarity

**Parameters**:
- `story` (string, required) - Story to review
- `checklist` (array, optional) - Review checklist items
- `criteria` (array, optional) - Acceptance criteria to validate

### sa-validate-quality
**Purpose**: Validate code quality and adherence to standards

**Parameters**:
- `component` (string, required) - Component to validate
- `standards` (string, optional) - Quality standards to apply
- `metrics` (array, optional) - Quality metrics to check

## UX Expert Tools

### sa-accessibility-audit
**Purpose**: Conduct accessibility audits and compliance checks

**Parameters**:
- `pages` (array, required) - Pages or components to audit
- `standards` (string, optional) - Accessibility standards (WCAG 2.1, Section 508)
- `level` (string, optional) - Compliance level (A, AA, AAA)

### sa-create-frontend-spec
**Purpose**: Create detailed frontend specifications and requirements

**Parameters**:
- `requirements` (string, required) - Frontend requirements
- `platform` (string, optional) - Target platform (web, mobile)
- `framework` (string, optional) - UI framework preference

### sa-design-wireframes
**Purpose**: Design wireframes and user interface mockups

**Parameters**:
- `pages` (array, required) - Pages to wireframe
- `fidelity` (string, optional) - Wireframe fidelity (low, medium, high)
- `responsive` (boolean, optional) - Include responsive design

### sa-generate-ui-prompt
**Purpose**: Generate UI prompts and design guidelines

**Parameters**:
- `component` (string, required) - UI component or page
- `style` (string, optional) - Design style or theme
- `platform` (string, optional) - Target platform

## Product Owner Tools

### sa-correct-course
**Purpose**: Provide course correction and project guidance

**Parameters**:
- `analysis` (string, optional) - Current situation analysis
- `issues` (array, optional) - Identified issues
- `objectives` (array, optional) - Project objectives

### sa-execute-checklist
**Purpose**: Execute project checklists and validation procedures

**Parameters**:
- `checklist` (string, required) - Checklist type or path
- `context` (object, optional) - Execution context
- `validation` (boolean, optional) - Enable validation mode

### sa-shard-document
**Purpose**: Break down large documents into manageable components

**Parameters**:
- `document` (string, required) - Path to document to shard
- `type` (string, optional) - Document type (prd, architecture, requirements)
- `maxSize` (number, optional) - Maximum shard size

### sa-validate-story-draft
**Purpose**: Validate user story drafts and requirements

**Parameters**:
- `story` (string, required) - Story draft to validate
- `template` (string, optional) - Story template to validate against
- `checklist` (array, optional) - Validation checklist

## Scrum Master Tools

### sa-create-next-story
**Purpose**: Create next user stories in the development sequence

**Parameters**:
- `epic` (string, required) - Parent epic
- `previous_story` (string, optional) - Previous story for context
- `priority` (string, optional) - Story priority

### sa-create-story
**Purpose**: Create detailed user stories with acceptance criteria

**Parameters**:
- `epic` (string, required) - Parent epic or feature
- `title` (string, required) - Story title
- `description` (string, optional) - Story description
- `acceptance_criteria` (array, optional) - Acceptance criteria

### sa-track-progress
**Purpose**: Track project progress and team velocity

**Parameters**:
- `scope` (string, optional) - Progress tracking scope (project, epic, sprint)
- `period` (string, optional) - Time period for tracking
- `metrics` (array, optional) - Progress metrics to track

### sa-update-workflow
**Purpose**: Update workflow states and process improvements

**Parameters**:
- `workflow` (string, required) - Workflow to update
- `state` (string, optional) - New workflow state
- `improvements` (array, optional) - Process improvements

## Task Master Tools

### sa-analyze-complexity
**Purpose**: Analyze task complexity and effort estimation

**Parameters**:
- `task` (string, required) - Task to analyze
- `context` (string, optional) - Additional context
- `factors` (array, optional) - Complexity factors to consider

### sa-expand-task
**Purpose**: Expand high-level tasks into detailed subtasks

**Parameters**:
- `task` (string, required) - Task to expand
- `depth` (number, optional) - Expansion depth level
- `methodology` (string, optional) - Task breakdown methodology

### sa-generate-tasks
**Purpose**: Generate comprehensive task lists from requirements

**Parameters**:
- `requirements` (string, required) - Requirements to break down
- `epic` (string, optional) - Parent epic context
- `methodology` (string, optional) - Task generation methodology

### sa-parse-prd
**Purpose**: Parse Product Requirements Documents into actionable tasks

**Parameters**:
- `prd` (string, required) - Path to PRD document
- `section` (string, optional) - Specific PRD section to parse
- `format` (string, optional) - Output format preference

## Workflow Tools

### sa-start-workflow
**Purpose**: Initialize and start project workflows

**Parameters**:
- `workflow` (string, required) - Workflow type or template
- `project` (string, optional) - Project context
- `configuration` (object, optional) - Workflow configuration

### sa-track-progress
**Purpose**: Monitor workflow progress and milestone completion

**Parameters**:
- `workflow` (string, required) - Workflow to track
- `milestones` (array, optional) - Specific milestones to track
- `reporting` (string, optional) - Progress reporting format

### sa-workflow-status
**Purpose**: Check current workflow status and phase information

**Parameters**:
- `workflow` (string, required) - Workflow to check
- `detailed` (boolean, optional) - Include detailed status information

### sa-workflow-validation
**Purpose**: Validate workflow states and transitions

**Parameters**:
- `workflow` (string, required) - Workflow to validate
- `rules` (array, optional) - Validation rules to apply
- `strict` (boolean, optional) - Enable strict validation mode

## Error Handling

All tools return standardized responses with error handling:

```json
{
  "success": false,
  "error": "Error description",
  "errorType": "VALIDATION_ERROR",
  "suggestions": [
    "Check parameter format",
    "Verify required fields"
  ]
}
```

### Error Types

- `VALIDATION_ERROR` - Invalid parameters or missing required fields
- `NETWORK_ERROR` - Network connectivity issues
- `API_ERROR` - AI provider API errors
- `SYSTEM_ERROR` - File system or system-level errors
- `TIMEOUT_ERROR` - Operation timeout

### Common Parameters

Most tools support these common parameters:

- `verbose` (boolean) - Enable verbose output
- `format` (string) - Output format (json, markdown, yaml)
- `save` (boolean) - Save output to file
- `output_path` (string) - Custom output file path

## Rate Limits and Performance

- **Tool Execution Time**: < 5 seconds average
- **Concurrent Operations**: Up to 10 parallel tools
- **Rate Limiting**: 100 requests per minute per API key
- **Timeout**: 30 seconds default (configurable)
- **Retry Logic**: 3 attempts with exponential backoff

## Authentication

Tools authenticate using environment variables:

```bash
export ANTHROPIC_API_KEY=your_key_here
export OPENAI_API_KEY=your_key_here
export GOOGLE_API_KEY=your_key_here  # Optional
```

## Usage Examples

### Complete Workflow Example

```bash
# 1. Research and Analysis
sa-research-market topic="project management tools"
sa-brainstorm-session topic="innovative features" focus="productivity"

# 2. Planning and Design
sa-generate-prd requirements="task management with AI assistance"
sa-create-architecture requirements="scalable web application" type="microservices"

# 3. Development
sa-generate-tasks epic="user authentication"
sa-implement-story story="user registration with email verification"
sa-run-tests component="authentication" type="unit"

# 4. Quality Assurance
sa-review-code files="src/auth/" focus="security,performance"
sa-validate-quality component="authentication" standards="production-ready"
```

### Parallel Execution

```bash
# Run multiple tools concurrently
sa-research-market topic="competitor analysis" &
sa-generate-prd requirements="product specifications" &
sa-create-architecture requirements="system design" &
wait
```

---

For complete usage examples and workflow patterns, see the [User Guide](USER_GUIDE.md).