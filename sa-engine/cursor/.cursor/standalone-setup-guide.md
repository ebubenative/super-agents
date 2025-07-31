# Super Agents - Cursor Standalone Setup Guide

## Overview
This guide will help you set up Super Agents integration with Cursor IDE using the rules-based approach (without MCP).

## Setup Steps

### 1. Verify Files Installation
Check that these files have been created in your project:
- `.cursor/rules/super-agents.md` - Main rules file
- `.cursor/templates/` - Configuration templates
- This setup guide

### 2. Configure Cursor
Cursor automatically loads rules from the `.cursor/rules/` directory. No additional configuration needed.

### 3. Test Integration
Try using an agent in Cursor chat:
```
@analyst: Research current trends in web development frameworks
```

### 4. Customize Configuration (Optional)
Edit the templates in `.cursor/templates/` to customize:
- Enabled agents
- Workflow patterns
- Quality gates
- Response styles

## Usage Patterns

### Basic Agent Usage
```
@analyst: [Your research or analysis request]
@pm: [Your product planning request]
@architect: [Your system design request]
@developer: [Your implementation request]
@qa: [Your code review request]
```

### Workflow Usage
Follow the workflow patterns defined in the rules file:
1. Start with research (@analyst)
2. Move to planning (@pm)
3. Design architecture (@architect)
4. Implement features (@developer)
5. Review quality (@qa)

### Advanced Usage
- Use multiple agents for complex problems
- Follow handoff procedures between agents
- Implement quality gates at each phase
- Document decisions and rationale

## Troubleshooting

### Agent Not Responding as Expected
- Check that you're using the correct agent name (@analyst, @pm, etc.)
- Provide more specific context and requirements
- Review the rules file for proper usage patterns

### Workflow Issues
- Follow the sequential pattern for complex projects
- Ensure each phase completes before moving to the next
- Use quality gates to validate completion

### Quality Problems
- Increase @qa involvement in your workflow
- Use multiple agents for different perspectives
- Follow the quality standards defined in rules

## Getting Help
- Review the comprehensive rules file at `.cursor/rules/super-agents.md`
- Check configuration templates for customization options
- Use the troubleshooting section in the rules file

## Next Steps
1. Try the basic agent usage patterns
2. Experiment with workflow patterns for your projects
3. Customize configuration templates as needed
4. Integrate quality gates into your development process

---
*Super Agents Standalone Setup - Generated 2025-07-30T18:30:10.185Z*
