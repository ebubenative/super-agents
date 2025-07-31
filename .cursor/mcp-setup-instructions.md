# Super Agents - Cursor Setup Instructions

## Quick Setup

### 1. MCP Integration (Recommended)
If your Cursor supports MCP (Model Context Protocol):

1. **Copy MCP Configuration**:
   - Copy `.cursor/mcp-config.json` to your Cursor settings
   - Or manually add the MCP server configuration

2. **Set Environment Variables**:
   - Add `ANTHROPIC_API_KEY` to your environment
   - Optionally add `OPENAI_API_KEY` and `GOOGLE_API_KEY`

3. **Restart Cursor**:
   - Restart Cursor IDE to load new configuration
   - MCP server should connect automatically

4. **Test Integration**:
   - Try using Super Agents tools in Cursor chat
   - Example: `@sa-research-market topic="AI tools"`

### 2. Rules-Based Integration (Manual)
If MCP is not available or preferred:

1. **Install Rules Files**:
   - Cursor automatically loads rules from `.cursor/rules/`
   - Rules files are already generated in this directory

2. **Use Agent Personas**:
   - Prefix requests with agent names
   - Example: `@analyst: Research competitive landscape`

3. **Follow Workflow Patterns**:
   - Use the workflow patterns defined in rules
   - Sequential: `@analyst → @pm → @architect → @developer`

## Usage Examples

### MCP Tool Usage
```
@sa-research-market topic="project management tools"
@sa-generate-prd requirements="user authentication system"
@sa-create-architecture prd="docs/prd.md"
@sa-implement-story story="user login functionality"
@sa-review-code files="src/auth/"
```

### Agent Persona Usage
```
@analyst: Research the competitive landscape for our product idea
@pm: Create a PRD for mobile payment integration  
@architect: Design a scalable microservices architecture
@developer: Implement user registration with email verification
@qa: Review this authentication code for security issues
```

---
*Setup Instructions - Super Agents Framework for Cursor*
*Generated: 2025-07-30T18:31:21.196Z*
