# Testing Portable Installation

This document demonstrates how to test the new portable installation feature.

## Test Scenario

1. **Install Super Agents globally** (one-time setup)
2. **Create/use existing project** in any directory
3. **Initialize Super Agents** in that project
4. **Integrate with IDE** from project directory
5. **Verify configuration** uses correct paths

## Step-by-Step Test

### 1. Global Installation (if not done)
```bash
cd /path/to/super-agents
npm link
```

### 2. Create Test Project
```bash
mkdir -p /tmp/test-project
cd /tmp/test-project
echo "# Test Project" > README.md
```

### 3. Initialize Super Agents
```bash
# From the test project directory
sa init --name="Test Project" --template=minimal

# This should:
# - Ask where to initialize (default: current directory)
# - Create .super-agents/ directory
# - Create installation.json with references to SA installation
# - Set up project configuration
```

### 4. Test Integration
```bash
# From the test project directory
sa integrate --ide=claude-code --mcp

# This should:
# - Auto-detect project directory
# - Create .claude/desktop_app_config.json
# - Use absolute path to MCP server
# - Set SA_PROJECT_ROOT to current directory
```

### 5. Verify Configuration
```bash
# Check created files
ls -la .super-agents/
cat .super-agents/installation.json
cat .claude/desktop_app_config.json

# Verify paths are absolute
# Verify MCP server path points to SA installation
# Verify project root points to test project
```

### 6. Test from Subdirectory
```bash
mkdir subdir
cd subdir

# These should still work (auto-detect parent project)
sa status
sa integrate --ide=cursor --mcp
```

## Expected Results

### installation.json
```json
{
  "superAgentsPath": "/absolute/path/to/super-agents",
  "mcpServerPath": "/absolute/path/to/super-agents/sa-engine/mcp-server/index.js",
  "agentsPath": "/absolute/path/to/super-agents/sa-engine/agents",
  "templatesPath": "/absolute/path/to/super-agents/sa-engine/templates",
  "installedAt": "2025-01-31T...",
  "version": "1.0.0"
}
```

### .claude/desktop_app_config.json
```json
{
  "mcpServers": {
    "super-agents": {
      "command": "node",
      "args": ["/absolute/path/to/super-agents/sa-engine/mcp-server/index.js"],
      "env": {
        "SA_PROJECT_ROOT": "/tmp/test-project"
      }
    }
  }
}
```

## Validation Commands

```bash
# Test project detection
sa status

# Test agent commands
sa agent list

# Test doctor (should detect project properly)
sa doctor

# Test config
sa config --list

# Test from different locations
cd /tmp/test-project/subdir
sa status  # Should still work
```

## Success Criteria

✅ Can initialize Super Agents in any directory  
✅ IDE integration creates files with absolute paths  
✅ Commands work from project directory and subdirectories  
✅ Multiple projects can use same SA installation  
✅ Each project maintains separate configuration  
✅ MCP server paths are correct for IDE integration  