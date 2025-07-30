# Phase 6: Agent MCP Tools (Tasks 18-25)
**Timeline**: Week 6 | **Focus**: Agent-specific MCP tool implementation

## Task 18: Build analyst agent MCP tools (research, brainstorm, brief creation) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_research_market` - Market research functionality
- `sa_create_brief` - Project brief creation
- `sa_brainstorm_session` - Facilitated brainstorming
- `sa_competitor_analysis` - Competition analysis

### Implementation Plan
- [ ] Create analyst tools directory `/sa-engine/mcp-server/tools/analyst/`
- [ ] Implement `sa_research_market` tool:
  - Market research prompt generation
  - Research context management
  - Data collection workflows
  - Research output formatting
- [ ] Implement `sa_create_brief` tool:
  - Project brief template loading
  - Interactive brief creation
  - Stakeholder input collection
  - Brief validation and output
- [ ] Implement `sa_brainstorm_session` tool:
  - Brainstorming session facilitation
  - Idea collection and organization
  - Session progress tracking
  - Output synthesis
- [ ] Implement `sa_competitor_analysis` tool:
  - Competitor identification
  - Analysis framework application
  - Competitive landscape mapping
  - Strategic recommendations
- [ ] Map to existing analyst.json capabilities
- [ ] Add tool integration with analyst procedures

### Expected Deliverables
- 4 analyst-specific MCP tools
- Integration with analyst agent definition
- Procedure-based tool implementation

---

## Task 19: Build PM agent MCP tools (PRD generation, epic creation) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_generate_prd` - PRD document generation
- `sa_create_epic` - Epic creation and management
- `sa_prioritize_features` - Feature prioritization
- `sa_stakeholder_analysis` - Stakeholder management

### Implementation Plan
- [ ] Create PM tools directory `/sa-engine/mcp-server/tools/pm/`
- [ ] Implement `sa_generate_prd` tool:
  - PRD template selection (standard/brownfield)
  - Interactive PRD creation workflow
  - Requirements gathering
  - PRD validation and output
- [ ] Implement `sa_create_epic` tool:
  - Epic creation workflow
  - User story breakdown
  - Epic prioritization
  - Epic documentation
- [ ] Implement `sa_prioritize_features` tool:
  - Feature impact analysis
  - Priority matrix application
  - Stakeholder feedback integration
  - Priority recommendations
- [ ] Implement `sa_stakeholder_analysis` tool:
  - Stakeholder identification
  - Influence/interest mapping
  - Communication planning
  - Stakeholder management workflows
- [ ] Map to existing pm.json capabilities
- [ ] Add integration with PM procedures

### Expected Deliverables
- 4 PM-specific MCP tools
- Integration with PM agent definition
- PRD and epic management capabilities

---

## Task 20: Build architect agent MCP tools (system design, tech recommendations) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_design_system` - System architecture design
- `sa_analyze_brownfield` - Existing system analysis
- `sa_tech_recommendations` - Technology selection
- `sa_create_architecture` - Architecture documentation

### Implementation Plan
- [ ] Create architect tools directory `/sa-engine/mcp-server/tools/architect/`
- [ ] Implement `sa_design_system` tool:
  - System design methodology
  - Architecture pattern selection
  - Component design workflows
  - Design validation
- [ ] Implement `sa_analyze_brownfield` tool:
  - Existing system analysis
  - Technical debt assessment
  - Migration planning
  - Risk analysis
- [ ] Implement `sa_tech_recommendations` tool:
  - Technology stack analysis
  - Framework comparison
  - Performance considerations
  - Technology selection criteria
- [ ] Implement `sa_create_architecture` tool:
  - Architecture template selection
  - Documentation generation
  - Diagram creation workflows
  - Architecture validation
- [ ] Map to existing architect.json capabilities
- [ ] Add integration with architecture procedures

### Expected Deliverables
- 4 architect-specific MCP tools
- Integration with architect agent definition
- System design and analysis capabilities

---

## Task 21: Build developer agent MCP tools (implement, test, debug) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_implement_story` - Story implementation
- `sa_run_tests` - Test execution
- `sa_debug_issue` - Debugging assistance
- `sa_validate_implementation` - Implementation validation

### Implementation Plan
- [ ] Create developer tools directory `/sa-engine/mcp-server/tools/developer/`
- [ ] Implement `sa_implement_story` tool:
  - Story analysis and breakdown
  - Implementation workflow
  - Code generation assistance
  - Progress tracking
- [ ] Implement `sa_run_tests` tool:
  - Test suite execution
  - Test result analysis
  - Coverage reporting
  - Test failure diagnosis
- [ ] Implement `sa_debug_issue` tool:
  - Issue analysis workflows
  - Debugging assistance
  - Root cause analysis
  - Fix validation
- [ ] Implement `sa_validate_implementation` tool:
  - Code quality validation
  - Requirements compliance check
  - Implementation review
  - Acceptance criteria validation
- [ ] Map to existing developer.json capabilities
- [ ] Add integration with development procedures

### Expected Deliverables
- 4 developer-specific MCP tools
- Integration with developer agent definition
- Story implementation and validation capabilities

---

## Task 22: Build QA agent MCP tools (review, refactor, validate) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_review_code` - Code review process
- `sa_refactor_code` - Code refactoring
- `sa_validate_quality` - Quality validation
- `sa_review_story` - Story review

### Implementation Plan
- [ ] Create QA tools directory `/sa-engine/mcp-server/tools/qa/`
- [ ] Implement `sa_review_code` tool:
  - Code review workflows
  - Quality metric analysis
  - Best practice validation
  - Review report generation
- [ ] Implement `sa_refactor_code` tool:
  - Refactoring opportunity identification
  - Code improvement suggestions
  - Refactoring execution guidance
  - Quality improvement tracking
- [ ] Implement `sa_validate_quality` tool:
  - Quality gate validation
  - Performance analysis
  - Security assessment
  - Compliance checking
- [ ] Implement `sa_review_story` tool:
  - Story completeness review
  - Acceptance criteria validation
  - Implementation quality check
  - Story approval workflow
- [ ] Map to existing qa.json capabilities
- [ ] Add integration with QA procedures

### Expected Deliverables
- 4 QA-specific MCP tools
- Integration with QA agent definition
- Code review and quality validation capabilities

---

## Task 23: Build PO agent MCP tools (checklist, shard docs, validate) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_execute_checklist` - Checklist execution
- `sa_shard_document` - Document sharding
- `sa_validate_story_draft` - Story validation
- `sa_correct_course` - Course correction

### Implementation Plan
- [ ] Create PO tools directory `/sa-engine/mcp-server/tools/product-owner/`
- [ ] Implement `sa_execute_checklist` tool:
  - Checklist loading and execution
  - Progress tracking
  - Completion validation
  - Result reporting
- [ ] Implement `sa_shard_document` tool:
  - Document analysis
  - Logical sharding strategies
  - Shard generation
  - Shard validation
- [ ] Implement `sa_validate_story_draft` tool:
  - Story completeness validation
  - Quality criteria checking
  - Dependency validation
  - Approval workflow
- [ ] Implement `sa_correct_course` tool:
  - Issue identification
  - Correction planning
  - Remediation workflows
  - Progress monitoring
- [ ] Map to existing product-owner.json capabilities
- [ ] Add integration with PO procedures

### Expected Deliverables
- 4 PO-specific MCP tools
- Integration with Product Owner agent definition
- Document and story management capabilities

---

## Task 24: Build UX expert MCP tools (frontend spec, UI prompts) ⏳ PENDING
**Priority**: Medium | **Status**: PENDING

### Requirements
- `sa_create_frontend_spec` - Frontend specification
- `sa_generate_ui_prompt` - AI UI generation prompts
- `sa_design_wireframes` - Wireframe creation
- `sa_accessibility_audit` - Accessibility validation

### Implementation Plan
- [ ] Create UX tools directory `/sa-engine/mcp-server/tools/ux-expert/`
- [ ] Implement `sa_create_frontend_spec` tool:
  - Frontend specification template
  - UI/UX requirement gathering
  - Design system integration
  - Specification validation
- [ ] Implement `sa_generate_ui_prompt` tool:
  - AI prompt generation for UI tools
  - Design context analysis
  - Tool-specific formatting (v0, Lovable)
  - Prompt optimization
- [ ] Implement `sa_design_wireframes` tool:
  - Wireframe creation workflows
  - User journey mapping
  - Interface design patterns
  - Wireframe validation
- [ ] Implement `sa_accessibility_audit` tool:
  - Accessibility standards validation
  - WCAG compliance checking
  - Accessibility improvement suggestions
  - Audit reporting
- [ ] Map to existing ux-expert.json capabilities
- [ ] Add integration with UX procedures

### Expected Deliverables
- 4 UX-specific MCP tools
- Integration with UX Expert agent definition
- Frontend design and accessibility capabilities

---

## Task 25: Build SM agent MCP tools (story creation, workflow management) ⏳ PENDING
**Priority**: High | **Status**: PENDING

### Requirements
- `sa_create_story` - Story creation
- `sa_create_next_story` - Next story generation
- `sa_update_workflow` - Workflow management
- `sa_track_progress` - Progress tracking

### Implementation Plan
- [ ] Create SM tools directory `/sa-engine/mcp-server/tools/scrum-master/`
- [ ] Implement `sa_create_story` tool:
  - Story template selection
  - Story creation workflow
  - Requirements breakdown
  - Story validation
- [ ] Implement `sa_create_next_story` tool:
  - Next story identification
  - Dependency analysis
  - Story prioritization
  - Story generation workflow
- [ ] Implement `sa_update_workflow` tool:
  - Workflow status updates
  - Process optimization
  - Bottleneck identification
  - Team coordination
- [ ] Implement `sa_track_progress` tool:
  - Sprint progress tracking
  - Velocity calculation
  - Burndown analysis
  - Progress reporting
- [ ] Map to existing scrum-master.json capabilities
- [ ] Add integration with SM procedures

### Expected Deliverables
- 4 SM-specific MCP tools
- Integration with Scrum Master agent definition
- Story and workflow management capabilities

---

## Phase 6 Dependencies
- **All tasks 18-25** depend on completed MCP Foundation (Phase 5)
- **Tasks can be developed in parallel** once MCP foundation is ready
- **Each task** maps to existing agent definitions from Phase 2
- **Next Phase** (Workflow MCP Tools) builds upon agent tools

## Agent MCP Tool Mapping
Each task directly implements the MCP tools defined in the enhanced agent JSON files:
- **analyst.json** → Task 18 tools (analyst_*)
- **pm.json** → Task 19 tools (pm_*)
- **architect.json** → Task 20 tools (architect_*)
- **developer.json** → Task 21 tools (developer_*)
- **qa.json** → Task 22 tools (qa_*)
- **product-owner.json** → Task 23 tools (product_owner_*)
- **ux-expert.json** → Task 24 tools (ux_expert_*)
- **scrum-master.json** → Task 25 tools (scrum_master_*)

## Phase 6 Summary
**Status**: ⏳ PENDING (0/8 tasks completed)
**Dependencies**: Requires completed MCP Foundation (Phase 5)

**Pending Tasks**:
- ⏳ Task 18: Analyst agent MCP tools
- ⏳ Task 19: PM agent MCP tools  
- ⏳ Task 20: Architect agent MCP tools
- ⏳ Task 21: Developer agent MCP tools
- ⏳ Task 22: QA agent MCP tools
- ⏳ Task 23: PO agent MCP tools
- ⏳ Task 24: UX expert MCP tools
- ⏳ Task 25: SM agent MCP tools

**Estimated Timeline**: Week 6 (after Phase 5 completion)
**Parallel Development**: Most tasks can be developed concurrently