# Phase 9: Standalone Installation (Tasks 32-35)
**Timeline**: Week 9 | **Focus**: Manual installation system

## Task 32: Build automated standalone installer (StandaloneInstaller class) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- Create StandaloneInstaller class
- Implement environment detection
- Build agent configuration generation
- Add installation validation

### Implementation Plan
- [ ] Create StandaloneInstaller class in `/sa-engine/installers/`:
  - Core installer architecture
  - Environment detection capabilities
  - Configuration generation system
  - Validation and verification
- [ ] Implement environment detection:
  - Operating system detection (Windows, macOS, Linux)
  - IDE detection (Claude Code, Cursor, VS Code, etc.)
  - Existing configuration detection
  - Dependency verification
- [ ] Build agent configuration generation:
  - Generate IDE-specific agent configurations
  - Create custom agent prompts and instructions
  - Generate MCP server configurations
  - Create workspace-specific setups
- [ ] Add installation validation:
  - Verify installation completeness
  - Test agent functionality
  - Validate MCP server connectivity
  - Performance and health checks
- [ ] Create installation CLI commands:
  - `sa install --ide=<ide>` - Install for specific IDE
  - `sa install --agent=<agent>` - Install specific agent
  - `sa install --bundle=<bundle>` - Install agent bundle
  - `sa validate-install` - Validate installation

### Expected Deliverables
- StandaloneInstaller class with full functionality
- Environment detection and configuration generation
- Installation validation system
- CLI commands for automated installation

---

## Task 33: Create agent export system for manual IDE setup ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa export --agent=<name> --format=<ide>` command
- Format-specific agent generation
- Customization options for different IDEs
- Export validation and testing

### Implementation Plan
- [ ] Create agent export system:
  - Export command implementation
  - Agent template processing
  - Format-specific generation
  - Output file management
- [ ] Implement format-specific agent generation:
  - **Claude Code format**: Generate agent files and CLAUDE.md
  - **Cursor format**: Generate .cursor/rules files
  - **VS Code format**: Generate workspace configurations
  - **Generic format**: Create universal agent prompts
- [ ] Add customization options:
  - Agent persona customization
  - Tool selection and filtering
  - Project-specific configurations
  - Template variable substitution
- [ ] Build export validation and testing:
  - Generated file validation
  - Format compliance checking
  - Agent functionality testing
  - Integration verification
- [ ] Create export CLI commands:
  - `sa export --agent=analyst --format=claude-code`
  - `sa export --bundle=fullstack --format=cursor`
  - `sa export --all --format=vscode`
  - `sa list-formats` - Show available export formats

### Expected Deliverables
- Agent export system with format-specific generation
- CLI commands for agent export
- Customization and configuration options
- Export validation and testing framework

---

## Task 34: Build bundle system with team configurations ⏳ PENDING
**Priority**: Medium | **Status**: PENDING

### Requirements
- Team bundle definitions (fullstack, minimal, etc.)
- Bundle configuration system
- Custom bundle creation
- Bundle validation and testing

### Implementation Plan
- [ ] Create team bundle definitions in `/sa-core/bundles/`:
  - **Fullstack Bundle**: All agents for complete development
  - **Backend Bundle**: PM, Architect, Developer, QA agents
  - **Frontend Bundle**: UX Expert, Developer, QA agents
  - **Minimal Bundle**: Essential agents only (PM, Developer, QA)
  - **Enterprise Bundle**: All agents plus workflow orchestration
- [ ] Build bundle configuration system:
  - Bundle definition format (YAML)
  - Agent selection and configuration
  - Tool subset definitions
  - Environment-specific overrides
- [ ] Implement custom bundle creation:
  - Interactive bundle builder
  - Agent selection interface
  - Configuration customization
  - Bundle naming and description
- [ ] Add bundle validation and testing:
  - Bundle completeness checking
  - Agent compatibility validation
  - Configuration consistency
  - Installation testing
- [ ] Create bundle CLI commands:
  - `sa bundle list` - List available bundles
  - `sa bundle info <name>` - Show bundle details
  - `sa bundle create` - Interactive bundle creation
  - `sa bundle export <name>` - Export bundle for installation

### Bundle Definitions
- **team-fullstack.yaml**: Complete development team
- **team-backend.yaml**: Backend-focused development
- **team-frontend.yaml**: Frontend-focused development
- **team-minimal.yaml**: Essential agents only
- **team-enterprise.yaml**: Full enterprise setup

### Expected Deliverables
- Team bundle definitions and configuration system
- Custom bundle creation tools
- Bundle validation and testing
- CLI commands for bundle management

---

## Task 35: Write manual setup guides for all major IDEs ⏳ PENDING
**Priority**: Medium | **Status**: PENDING

### Requirements
- Claude Code manual setup guide
- Cursor manual setup guide
- VS Code manual setup guide
- Generic AI assistant setup guide

### Implementation Plan
- [ ] Create Claude Code manual setup guide:
  - MCP server setup instructions
  - Agent configuration steps
  - CLAUDE.md memory file setup
  - Custom commands and hooks
  - Troubleshooting guide
- [ ] Write Cursor manual setup guide:
  - Rules file creation
  - Agent integration setup
  - MCP configuration (if available)
  - Workspace configuration
  - Common issues and solutions
- [ ] Build VS Code manual setup guide:
  - Extension requirements
  - Workspace configuration
  - Agent prompt setup
  - MCP integration (future)
  - Settings and preferences
- [ ] Create generic AI assistant setup guide:
  - Universal agent prompts
  - Configuration principles
  - Adaptation guidelines
  - Integration patterns
  - Best practices
- [ ] Add comprehensive documentation:
  - Step-by-step installation
  - Configuration examples
  - Troubleshooting sections
  - FAQ and common issues
  - Video tutorials (optional)

### Documentation Structure
- **Manual Setup Guides** in `/integrations/standalone/manual-setup/`:
  - `claude-code-setup.md`
  - `cursor-setup.md`
  - `vscode-setup.md`
  - `generic-ai-setup.md`
- **Troubleshooting Guides** in `/docs/troubleshooting/`:
  - IDE-specific troubleshooting
  - Common configuration issues
  - Performance optimization
  - Error resolution

### Expected Deliverables
- Comprehensive manual setup guides for all major IDEs
- Troubleshooting documentation
- Configuration examples and templates
- Installation validation procedures

---

## Phase 9 Dependencies
- **Task 32** depends on completed MCP system from Phase 8
- **Task 33** requires Task 32 for export system foundation
- **Task 34** can be developed in parallel with Tasks 32-33
- **Task 35** depends on Tasks 32-33 for accurate setup procedures
- **Next Phase** (Claude Code Integration) will use standalone installation system

## Installation Strategy
Key installation approaches for Phase 9:
- **Automated Installation**: StandaloneInstaller for streamlined setup
- **Manual Installation**: Step-by-step guides for custom setups
- **Bundle System**: Pre-configured team setups
- **Validation System**: Comprehensive installation verification

## Phase 9 Summary
**Status**: ⏳ PENDING (0/4 tasks completed)
**Dependencies**: Requires completed and tested MCP system from Phase 8

**Pending Tasks**:
- ⏳ Task 32: Automated standalone installer (StandaloneInstaller class)
- ⏳ Task 33: Agent export system for manual IDE setup
- ⏳ Task 34: Bundle system with team configurations
- ⏳ Task 35: Manual setup guides for all major IDEs

**Key Features**:
- **Automated Installation**: Streamlined setup process
- **Manual Setup Support**: Detailed guides for custom installations
- **Team Bundles**: Pre-configured agent sets for different teams
- **Multi-IDE Support**: Installation for all major development environments

**Estimated Timeline**: Week 9 (after Phase 8 completion)