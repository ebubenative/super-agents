# Super Agents Framework - Cursor Integration

## Overview
You are working with the Super Agents Framework, a comprehensive AI-powered development assistance system. This framework provides specialized agents and 50+ tools to enhance your development workflow.

## Project Context
When working on projects, you have access to specialized AI agents that can help with different aspects of development:
- Analysis and research
- Product management and planning  
- System architecture and design
- Implementation and coding
- Quality assurance and testing
- UX/UI design and specification
- Project management and coordination

## Available Agents

### Analyst Agent
**Role**: Business Analyst and Researcher
**Capabilities**: Market research, Competitive analysis, Requirements gathering
**When to use**: For research, analysis, and strategic planning tasks
**Key tools**: sa-research-market, sa-competitor-analysis, sa-brainstorm-session


### PM Agent
**Role**: Product Manager
**Capabilities**: PRD creation, Feature prioritization, Stakeholder analysis
**When to use**: For product planning and management tasks
**Key tools**: sa-generate-prd, sa-create-epic, sa-prioritize-features


### Architect Agent
**Role**: System Architect
**Capabilities**: System design, Technology recommendations, Architecture analysis
**When to use**: For system design and technical architecture decisions
**Key tools**: sa-create-architecture, sa-analyze-brownfield, sa-tech-recommendations


### Developer Agent
**Role**: Software Developer
**Capabilities**: Code implementation, Debugging, Testing
**When to use**: For coding, implementation, and development tasks
**Key tools**: sa-implement-story, sa-debug-issue, sa-run-tests


### QA Agent
**Role**: Quality Assurance Engineer
**Capabilities**: Code review, Quality validation, Testing
**When to use**: For quality assurance and code review tasks
**Key tools**: sa-review-code, sa-validate-quality, sa-refactor-code


### UX-Expert Agent
**Role**: UX/UI Designer
**Capabilities**: UI design, Accessibility, User experience
**When to use**: For frontend design and user experience tasks
**Key tools**: sa-create-frontend-spec, sa-design-wireframes, sa-accessibility-audit


## How to Use Super Agents in Cursor

### Method 1: MCP Integration (Recommended)
If MCP is configured, you can directly use Super Agents tools:
```
@sa-research-market topic="AI development tools"
@sa-generate-prd requirements="user authentication system"
@sa-create-architecture prd="docs/prd.md"
@sa-implement-story story="user login functionality"
```

### Method 2: Agent Personas (Manual)
Use agent personas by prefixing requests:
```
@analyst: Research the competitive landscape for project management tools
@pm: Create a PRD for user authentication with social login
@architect: Design a scalable microservices architecture for our app
@developer: Implement the user registration endpoint with validation
@qa: Review this authentication code for security issues
```

## Workflow Integration

### Standard Development Workflow
1. **Analysis Phase**: Use `@analyst` for market research and requirements gathering
2. **Planning Phase**: Use `@pm` for PRD creation and feature prioritization  
3. **Architecture Phase**: Use `@architect` for system design and tech recommendations
4. **Implementation Phase**: Use `@developer` for coding and debugging
5. **Quality Phase**: Use `@qa` for code review and testing
6. **UX Phase**: Use `@ux-expert` for frontend specs and accessibility

### Agent Collaboration Patterns
- **Sequential**: Use agents in sequence for complete workflows
- **Parallel**: Use multiple agents simultaneously for different aspects
- **Iterative**: Switch between agents as needs evolve
- **Consultative**: Ask multiple agents for different perspectives

## Task Management
When working with Super Agents, follow these patterns:

### Task Creation
- Break down large tasks into smaller, manageable pieces
- Use specific, actionable task descriptions
- Include acceptance criteria and success metrics
- Assign appropriate agents based on task type

### Task Tracking  
- Update task status as work progresses
- Document decisions and assumptions
- Track dependencies between tasks
- Regular progress reviews and adjustments

### Task Completion
- Validate completion against acceptance criteria
- Get appropriate agent reviews before marking complete
- Document learnings and best practices
- Plan follow-up tasks as needed

## Best Practices

### Agent Selection
- Choose the right agent for each task type
- Consider agent expertise and capabilities
- Use multiple agents for complex problems
- Validate agent recommendations with domain experts

### Communication
- Be specific and clear in requests
- Provide necessary context and background
- Ask follow-up questions for clarification
- Document important decisions and rationale

### Workflow Optimization
- Establish consistent patterns and processes
- Automate repetitive tasks where possible
- Regular review and improvement of workflows
- Share learnings with team members

## Examples

### Complete Project Workflow
```markdown
# New Feature Development Example

## 1. Research Phase (@analyst)
@analyst: Research market trends for mobile payment solutions

## 2. Planning Phase (@pm)  
@pm: Create a PRD for mobile payment integration with Apple Pay and Google Pay

## 3. Architecture Phase (@architect)
@architect: Design secure payment processing architecture with PCI compliance

## 4. Implementation Phase (@developer)
@developer: Implement payment gateway integration with error handling

## 5. Quality Phase (@qa)
@qa: Review payment code for security vulnerabilities and edge cases

## 6. UX Phase (@ux-expert)
@ux-expert: Create payment flow wireframes and accessibility audit
```

### Quick Task Examples
```markdown
# Quick Development Tasks

## Code Review
@qa: Review this React component for performance and best practices

## Bug Investigation  
@developer: Debug why the authentication middleware is failing

## Market Research
@analyst: Research competitors in the AI-powered IDE space

## Feature Specification
@pm: Create user stories for the dashboard redesign project
```

---

*Super Agents Framework v1.0 - Cursor Integration*
*Generated: 2025-07-30T18:31:21.195Z*
