import { join, dirname } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Standalone Setup for Cursor Integration
 * Handles manual rules-based integration without MCP
 */
export default class StandaloneSetup {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      enableLogging: options.enableLogging !== false,
      rulesTemplate: options.rulesTemplate || 'comprehensive',
      customRules: options.customRules || {},
      ...options
    };
    
    this.logger = this.options.enableLogging ? console : { log: () => {}, error: () => {}, warn: () => {} };
    this.projectRoot = this.options.projectRoot;
    this.cursorDir = join(this.projectRoot, '.cursor');
    this.rulesDir = join(this.cursorDir, 'rules');
  }

  /**
   * Setup standalone Cursor integration
   * @returns {Promise<Object>} Setup result
   */
  async setup() {
    try {
      this.logger.log('🔧 Setting up Cursor standalone integration...');
      
      // Ensure directories exist
      this.ensureDirectories();

      // Generate comprehensive rules file
      const rulesFile = await this.generateComprehensiveRulesFile();
      
      // Generate configuration templates
      const configTemplates = await this.generateConfigurationTemplates();
      
      // Create setup validation
      const validation = await this.validateSetup();
      
      // Generate setup guide
      const setupGuide = this.generateSetupGuide();

      return {
        success: true,
        rulesFile,
        configTemplates,
        validation,
        setupGuide,
        integrationPath: this.cursorDir
      };

    } catch (error) {
      this.logger.error('❌ Failed to setup standalone integration:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const directories = [this.cursorDir, this.rulesDir];
    
    directories.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        this.logger.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * Generate comprehensive Super Agents rules file
   * @returns {Promise<Object>} Rules file generation result
   */
  async generateComprehensiveRulesFile() {
    try {
      const rulesContent = await this.createRulesContent();
      const rulesPath = join(this.rulesDir, 'super-agents.md');
      
      writeFileSync(rulesPath, rulesContent);
      
      this.logger.log('✅ Generated comprehensive rules file');
      
      return {
        success: true,
        path: rulesPath,
        size: rulesContent.length,
        sections: this.countRulesSections(rulesContent)
      };

    } catch (error) {
      throw new Error(`Failed to generate rules file: ${error.message}`);
    }
  }

  /**
   * Create comprehensive rules content
   * @returns {Promise<string>} Rules content
   */
  async createRulesContent() {
    const agents = await this.getAgentDefinitions();
    const workflows = await this.getWorkflowPatterns();
    const examples = await this.getUsageExamples();

    return `# Super Agents Framework - Cursor Integration Rules

## Project Context and Overview

You are working within the Super Agents Framework, a comprehensive AI-powered development assistance system. This framework provides specialized agents and 50+ tools to enhance development workflows through structured collaboration patterns.

### Framework Capabilities
- **10 Specialized Agents**: Each with unique expertise and tool access
- **50+ Tools**: Covering analysis, planning, architecture, development, and QA
- **Structured Workflows**: Proven patterns for different project types
- **Quality Integration**: Built-in quality gates and validation processes

## Core Agent Definitions

${agents.map(agent => this.generateAgentSection(agent)).join('\n\n')}

## Workflow Integration Patterns

### Primary Development Workflows

#### Greenfield Development (New Projects)
**Usage**: When starting new projects from scratch
**Pattern**: Sequential agent collaboration with quality gates

\`\`\`
Phase 1: Research & Analysis (@analyst)
├── Market research and competitive analysis
├── Requirements gathering and validation
└── Stakeholder analysis and mapping

Phase 2: Product Planning (@pm)
├── Product Requirements Document (PRD) creation
├── Epic and story creation with acceptance criteria
└── Feature prioritization and roadmap planning

Phase 3: System Architecture (@architect)
├── System design and architecture specification
├── Technology stack recommendations and validation
└── Integration and deployment architecture planning

Phase 4: UX/UI Design (@ux-expert)
├── User experience design and user journey mapping
├── Frontend specifications and component architecture
└── Accessibility planning and compliance validation

Phase 5: Implementation (@developer)
├── Story implementation following architecture guidelines
├── Unit testing and integration testing
└── Code review preparation and documentation

Phase 6: Quality Assurance (@qa)
├── Comprehensive code review and quality validation
├── Testing strategy execution and validation
└── Performance and security review processes

Phase 7: Project Coordination (@scrum-master)
├── Progress tracking and milestone reporting
├── Workflow optimization and process improvement
└── Team coordination and stakeholder communication
\`\`\`

#### Brownfield Enhancement (Existing Projects)
**Usage**: When enhancing or modifying existing systems
**Pattern**: Analysis-first approach with integration focus

\`\`\`
Phase 1: System Analysis (@architect)
├── Brownfield codebase analysis and documentation
├── Architecture assessment and improvement recommendations
└── Integration planning and compatibility analysis

Phase 2: Requirements Analysis (@analyst)
├── Enhancement requirements analysis and validation
├── Impact assessment on existing functionality
└── Risk analysis and mitigation planning

Phase 3: Integration Planning (@pm)
├── Feature integration strategy and timeline
├── Migration planning and rollback procedures
└── Resource allocation and dependency management

Phase 4: Incremental Development (@developer)
├── Incremental feature development with backward compatibility
├── Legacy system integration and data migration
└── Comprehensive testing including regression validation

Phase 5: Quality Integration (@qa)
├── Integration testing with existing system components
├── Regression testing and impact validation
└── Performance impact assessment and optimization
\`\`\`

### Specialized Workflow Patterns

#### Research-Driven Development
**Usage**: For innovative or complex problem domains
\`\`\`
@analyst: Deep market and technical research
@analyst: Competitive analysis and technology evaluation  
@pm: Research synthesis into product requirements
@architect: Technology architecture based on research findings
@developer: Prototype development and proof of concept
@qa: Research validation and feasibility assessment
\`\`\`

#### Quality-First Development
**Usage**: For high-reliability or security-critical systems
\`\`\`
@architect: Security and reliability architecture design
@qa: Quality standards definition and validation criteria
@developer: Implementation with continuous quality validation
@qa: Comprehensive security and performance testing
@product-owner: Quality gate validation and acceptance
\`\`\`

## Agent Collaboration Patterns

### Sequential Collaboration
Use when each phase depends on the previous phase completion:
- **Research → Planning → Architecture → Implementation → Quality**
- Each agent completes their phase before handoff
- Clear deliverables and acceptance criteria at each stage
- Quality gates prevent progression without completion

### Parallel Collaboration  
Use when work can be done simultaneously without conflicts:
- **@analyst + @pm**: Research and initial planning
- **@architect + @ux-expert**: Technical and user experience design
- **@developer + @qa**: Implementation with continuous review

### Iterative Collaboration
Use for agile development with frequent feedback cycles:
- **Sprint Planning**: @pm defines sprint goals and stories
- **Implementation**: @developer implements with @qa continuous review
- **Sprint Review**: @product-owner validates and @scrum-master tracks progress
- **Retrospective**: Process improvement and optimization

### Consultative Collaboration
Use for complex decisions requiring multiple expert perspectives:
- **Technical Decisions**: @architect + @developer + @qa
- **Product Decisions**: @analyst + @pm + @product-owner
- **Strategic Decisions**: All agents provide input for comprehensive analysis

## Task Management and Execution

### Task Creation Guidelines
When creating tasks for agents, follow these structured patterns:

#### Task Definition Template
\`\`\`markdown
# Task: [Clear, Specific Title]

## Context
[Background information and business context]

## Objective
[Specific goal and expected outcome]

## Acceptance Criteria
- [ ] Specific, measurable success criteria
- [ ] Quality standards and validation requirements
- [ ] Deliverable format and content requirements

## Agent Assignment: @[appropriate-agent]

## Dependencies
[Prerequisites and dependent tasks]

## Resources
[Available resources, documentation, and constraints]
\`\`\`

### Agent-Specific Task Patterns

${this.generateTaskPatterns()}

## Quality Gates and Validation

### Phase Completion Criteria
Each workflow phase must meet specific criteria before proceeding:

#### Research Phase (@analyst)
- [ ] Market analysis completed with actionable insights
- [ ] Competitive landscape mapped with positioning opportunities
- [ ] Requirements validated with stakeholder input
- [ ] Risk assessment completed with mitigation strategies

#### Planning Phase (@pm)
- [ ] PRD completed with clear success metrics
- [ ] User stories defined with acceptance criteria
- [ ] Feature prioritization completed with rationale
- [ ] Stakeholder alignment achieved and documented

#### Architecture Phase (@architect)
- [ ] System architecture documented with clear diagrams
- [ ] Technology choices validated and justified
- [ ] Integration points defined and validated
- [ ] Performance and scalability requirements addressed

#### Implementation Phase (@developer)
- [ ] Code implemented following architecture guidelines
- [ ] Unit tests implemented with adequate coverage
- [ ] Integration tests passing
- [ ] Code documentation completed

#### Quality Phase (@qa)
- [ ] Code review completed with all issues resolved
- [ ] Quality standards validated and documented
- [ ] Performance benchmarks met
- [ ] Security review completed

### Handoff Procedures
When transitioning between agents:

1. **Complete Current Phase**: Ensure all deliverables are ready
2. **Prepare Handoff Package**: Include context, decisions, and constraints
3. **Validate Understanding**: Confirm receiving agent understands requirements
4. **Document Decisions**: Record important decisions and rationale
5. **Establish Communication**: Set up ongoing communication channels

## Usage Examples and Patterns

### Complete Project Examples

#### Example 1: E-commerce Platform Development
\`\`\`markdown
# Project: E-commerce Platform with Mobile Support

## Phase 1: Research (@analyst)
@analyst: Research e-commerce market trends and customer behavior patterns
@analyst: Analyze competitive landscape for mobile commerce platforms
@analyst: Conduct stakeholder interviews to gather business requirements

## Phase 2: Product Planning (@pm)
@pm: Create comprehensive PRD for e-commerce platform with mobile-first approach
@pm: Define user stories for customer journey from discovery to purchase
@pm: Prioritize features for MVP and subsequent releases

## Phase 3: Architecture (@architect)
@architect: Design scalable microservices architecture for e-commerce platform
@architect: Recommend technology stack for high-performance mobile commerce
@architect: Plan integration with payment gateways and third-party services

## Phase 4: UX Design (@ux-expert)
@ux-expert: Create user experience design for mobile-first e-commerce platform
@ux-expert: Design wireframes for key user flows including checkout process
@ux-expert: Conduct accessibility audit for inclusive commerce experience

## Phase 5: Implementation (@developer)
@developer: Implement user authentication and profile management
@developer: Develop product catalog with search and filtering capabilities
@developer: Build shopping cart and checkout process with payment integration

## Phase 6: Quality Assurance (@qa)
@qa: Review e-commerce platform code for security vulnerabilities
@qa: Validate payment processing integration for PCI compliance
@qa: Test mobile responsiveness and cross-platform compatibility
\`\`\`

#### Example 2: API Service Enhancement
\`\`\`markdown
# Project: REST API Performance Enhancement

## Phase 1: System Analysis (@architect)
@architect: Analyze existing API architecture for performance bottlenecks
@architect: Recommend optimization strategies for database and caching layers
@architect: Plan API versioning strategy for backward compatibility

## Phase 2: Requirements Analysis (@analyst)
@analyst: Analyze API usage patterns and performance requirements
@analyst: Assess impact of proposed changes on existing integrations
@analyst: Research best practices for API performance optimization

## Phase 3: Implementation Planning (@pm)
@pm: Create enhancement plan with phased rollout strategy
@pm: Define success metrics for performance improvements
@pm: Plan testing and validation procedures for API changes

## Phase 4: Development (@developer)
@developer: Implement database query optimizations and indexing strategies
@developer: Add Redis caching layer for frequently accessed data
@developer: Optimize API response serialization and compression

## Phase 5: Quality Validation (@qa)
@qa: Conduct performance testing to validate improvement targets
@qa: Test API backward compatibility with existing integrations
@qa: Validate caching behavior and data consistency requirements
\`\`\`

### Quick Task Examples

#### Research Tasks
\`\`\`
@analyst: Research current trends in AI-powered development tools
@analyst: Analyze competitive positioning for our project management platform
@analyst: Gather user feedback on the mobile app onboarding experience
\`\`\`

#### Planning Tasks
\`\`\`
@pm: Create user stories for the new dashboard redesign
@pm: Prioritize features for the next quarterly release
@pm: Define acceptance criteria for the payment integration epic
\`\`\`

#### Architecture Tasks
\`\`\`
@architect: Design microservices architecture for the notification system
@architect: Recommend database strategy for multi-tenant application
@architect: Plan API versioning approach for backward compatibility
\`\`\`

#### Development Tasks
\`\`\`
@developer: Implement OAuth 2.0 authentication with Google and GitHub
@developer: Debug the memory leak issue in the background job processor
@developer: Create REST API endpoints for the new user management features
\`\`\`

#### Quality Tasks
\`\`\`
@qa: Review the authentication module for security vulnerabilities
@qa: Create comprehensive test plan for the payment processing feature
@qa: Validate code quality and adherence to coding standards in the API layer
\`\`\`

## Best Practices and Optimization

### Communication Best Practices
- **Be Specific**: Provide clear, detailed requirements and context
- **Include Context**: Share relevant background information and constraints
- **Set Expectations**: Define success criteria and acceptance criteria
- **Ask Questions**: Seek clarification when requirements are unclear
- **Document Decisions**: Record important decisions and rationale

### Agent Selection Guidelines
- **@analyst**: Use for research, analysis, and strategic planning tasks
- **@pm**: Use for product planning, feature definition, and stakeholder management
- **@architect**: Use for system design, technology decisions, and technical planning
- **@developer**: Use for implementation, coding, and technical problem-solving
- **@qa**: Use for quality review, testing, and validation tasks
- **@ux-expert**: Use for user experience, frontend design, and accessibility
- **@product-owner**: Use for story validation, course correction, and acceptance
- **@scrum-master**: Use for process management, progress tracking, and coordination

### Workflow Optimization
- **Start with Research**: Always begin with proper analysis and research
- **Plan Before Building**: Complete planning before implementation begins
- **Quality Throughout**: Integrate quality practices throughout the process
- **Iterate and Improve**: Continuously refine processes based on feedback
- **Document Everything**: Maintain clear documentation for future reference

### Common Pitfalls and Solutions

#### Pitfall: Insufficient Requirements
- **Problem**: Starting implementation without clear requirements
- **Solution**: Always use @analyst for requirements gathering first
- **Prevention**: Establish clear acceptance criteria before development

#### Pitfall: Technical Debt Accumulation
- **Problem**: Focusing on delivery speed over code quality
- **Solution**: Use @qa for regular code review and quality validation
- **Prevention**: Include quality gates in every workflow phase

#### Pitfall: Architecture Misalignment
- **Problem**: Implementation doesn't match architectural intentions
- **Solution**: Use @architect for ongoing architectural guidance
- **Prevention**: Regular architecture review checkpoints during development

#### Pitfall: Scope Creep
- **Problem**: Requirements expanding without proper evaluation
- **Solution**: Use @pm for scope management and change control
- **Prevention**: Clear change management process with impact assessment

## Troubleshooting and Support

### Common Issues and Solutions

#### Issue: Agent Not Understanding Context
- **Symptoms**: Responses don't match expectations or miss key requirements
- **Solution**: Provide more specific context and background information
- **Example**: Instead of "Fix the bug", use "@developer: Debug the authentication middleware failing with 401 errors for valid JWT tokens"

#### Issue: Workflow Stalling
- **Symptoms**: Progress stops or slows significantly
- **Solution**: Check for missing dependencies or unclear handoffs
- **Example**: Ensure @architect completes system design before @developer starts implementation

#### Issue: Quality Problems
- **Symptoms**: Bugs, performance issues, or security vulnerabilities
- **Solution**: Increase @qa involvement and implement quality gates
- **Example**: Include @qa review after each major implementation milestone

#### Issue: Stakeholder Misalignment
- **Symptoms**: Deliverables don't meet stakeholder expectations
- **Solution**: Use @pm for regular stakeholder communication and validation
- **Example**: Have @pm validate requirements with stakeholders before architecture phase

### Getting Additional Help
- **Review Rules**: Check this rules file for detailed guidance and examples
- **Check Context**: Ensure you're providing sufficient context for agent responses
- **Validate Workflow**: Confirm you're following appropriate workflow patterns
- **Seek Multiple Perspectives**: Use consultative collaboration for complex decisions

## Advanced Usage Patterns

### Custom Workflow Creation
You can create custom workflows by combining agents in specific patterns:

\`\`\`markdown
# Custom Workflow: Security-First Feature Development

1. @architect: Design security architecture for the new feature
2. @qa: Define security testing criteria and validation procedures
3. @developer: Implement feature with security-first approach
4. @qa: Conduct security review and penetration testing
5. @product-owner: Validate security requirements are met
\`\`\`

### Multi-Project Coordination
For managing multiple related projects:

\`\`\`markdown
# Multi-Project Pattern: Platform and Mobile App

## Platform Development Track
@analyst → @pm → @architect → @developer → @qa

## Mobile App Development Track  
@ux-expert → @architect → @developer → @qa

## Integration and Coordination
@scrum-master: Coordinate between tracks
@product-owner: Validate cross-platform consistency
\`\`\`

### Continuous Improvement Pattern
For ongoing process and quality improvement:

\`\`\`markdown
# Improvement Cycle

## Monthly Review
@scrum-master: Analyze workflow performance and bottlenecks
@qa: Review quality metrics and improvement opportunities
@pm: Gather stakeholder feedback on deliverable quality

## Process Enhancement
@scrum-master: Implement workflow improvements
@product-owner: Update validation criteria and quality gates
@qa: Enhance quality standards and testing procedures
\`\`\`

---

*Super Agents Framework - Comprehensive Cursor Integration Rules*
*Version: 1.0.0*
*Generated: ${new Date().toISOString()}*
*Framework: Production-ready with 50+ tools across 10 specialized agents*

## Framework Status
- ✅ **Core Tools**: 4 tools for project management and task tracking
- ✅ **Analyst Tools**: 4 tools for research and competitive analysis
- ✅ **PM Tools**: 4 tools for product planning and stakeholder management
- ✅ **Architect Tools**: 4 tools for system design and technology recommendations
- ✅ **Developer Tools**: 4 tools for implementation and debugging
- ✅ **QA Tools**: 4 tools for code review and quality validation
- ✅ **UX Expert Tools**: 4 tools for frontend design and accessibility
- ✅ **Additional Tools**: 20+ tools for specialized workflows and coordination

**Total Framework Capabilities**: 50+ tools, 10 agents, 6 workflow patterns, production-ready infrastructure
`;
  }

  /**
   * Generate agent section for rules
   * @param {Object} agent - Agent definition
   * @returns {string} Agent section content
   */
  generateAgentSection(agent) {
    return `### ${agent.name} Agent (@${agent.name.toLowerCase()})
**Role**: ${agent.role}
**Expertise**: ${agent.capabilities.join(', ')}

**When to Use**:
${agent.whenToUse || `Use @${agent.name.toLowerCase()} for tasks requiring ${agent.role.toLowerCase()} expertise`}

**Communication Pattern**:
\`@${agent.name.toLowerCase()}: [Your specific request with clear context and requirements]\`

**Typical Deliverables**:
${agent.deliverables ? agent.deliverables.map(d => `- ${d}`).join('\n') : `- ${agent.role} analysis and recommendations\n- Detailed documentation and specifications\n- Actionable next steps and implementation guidance`}

**Quality Standards**:
${agent.qualityStandards ? agent.qualityStandards.map(s => `- ${s}`).join('\n') : `- Professional ${agent.role.toLowerCase()} standards\n- Industry best practices and methodologies\n- Clear, actionable recommendations with rationale`}`;
  }

  /**
   * Generate task patterns section
   * @returns {string} Task patterns content
   */
  generateTaskPatterns() {
    return `#### Analyst Tasks (@analyst)
**Pattern**: Research → Analysis → Insights → Recommendations
\`\`\`
@analyst: Research [topic] with focus on [specific aspects]
@analyst: Analyze [situation/data] to identify [key insights]
@analyst: Compare [options/competitors] across [criteria]
\`\`\`

#### PM Tasks (@pm)
**Pattern**: Requirements → Planning → Prioritization → Communication
\`\`\`
@pm: Create PRD for [feature/product] with [specific requirements]
@pm: Prioritize [features/backlog] based on [criteria]
@pm: Plan [epic/release] with [timeline and resource constraints]
\`\`\`

#### Architect Tasks (@architect)
**Pattern**: Analysis → Design → Validation → Documentation
\`\`\`
@architect: Design [system/component] architecture for [specific requirements]
@architect: Analyze [existing system] for [improvement opportunities]
@architect: Recommend [technology stack] for [specific use case]
\`\`\`

#### Developer Tasks (@developer)
**Pattern**: Understanding → Implementation → Testing → Documentation
\`\`\`
@developer: Implement [feature/story] following [architecture/guidelines]
@developer: Debug [specific issue] in [component/system]
@developer: Optimize [code/system] for [performance/maintainability]
\`\`\`

#### QA Tasks (@qa)
**Pattern**: Review → Testing → Validation → Feedback
\`\`\`
@qa: Review [code/design] for [quality aspects]
@qa: Create test plan for [feature/system]
@qa: Validate [implementation] against [requirements/standards]
\`\`\``;
  }

  /**
   * Get agent definitions
   * @returns {Promise<Array>} Agent definitions
   */
  async getAgentDefinitions() {
    return [
      {
        name: 'Analyst',
        role: 'Business Analyst and Market Researcher',
        capabilities: [
          'Market research and competitive analysis',
          'Requirements gathering and stakeholder analysis',
          'Strategic planning and business case development',
          'Risk assessment and opportunity identification'
        ],
        whenToUse: 'Use @analyst when you need market insights, competitive analysis, requirements gathering, or strategic planning',
        deliverables: [
          'Market research reports with actionable insights',
          'Competitive analysis with positioning recommendations',
          'Requirements documentation with stakeholder validation',
          'Strategic recommendations with risk assessment'
        ],
        qualityStandards: [
          'Data-driven insights with credible sources',
          'Comprehensive analysis covering all relevant aspects',
          'Clear recommendations with implementation guidance',
          'Stakeholder validation and alignment confirmation'
        ]
      },
      {
        name: 'PM',
        role: 'Product Manager and Strategic Planner',
        capabilities: [
          'Product Requirements Document (PRD) creation',
          'Feature prioritization and roadmap planning',
          'Stakeholder management and communication',
          'Epic and user story development'
        ],
        whenToUse: 'Use @pm for product planning, feature definition, stakeholder alignment, and project roadmap development',
        deliverables: [
          'Comprehensive PRDs with success metrics',
          'Prioritized feature backlogs with rationale',
          'User stories with clear acceptance criteria',
          'Stakeholder communication and alignment documentation'
        ],
        qualityStandards: [
          'Clear, measurable success criteria and KPIs',
          'Validated requirements with stakeholder sign-off',
          'Realistic timelines with dependency consideration',
          'Risk mitigation strategies and contingency planning'
        ]
      },
      {
        name: 'Architect',
        role: 'System Architect and Technical Leader',
        capabilities: [
          'System architecture design and documentation',
          'Technology stack evaluation and recommendations',
          'Integration planning and API design',
          'Performance and scalability planning'
        ],
        whenToUse: 'Use @architect for system design, technology decisions, architectural reviews, and technical planning',
        deliverables: [
          'System architecture diagrams and documentation',
          'Technology recommendations with justification',
          'Integration specifications and API designs',
          'Performance and scalability assessments'
        ],
        qualityStandards: [
          'Scalable and maintainable architecture designs',
          'Well-documented technical decisions with rationale',
          'Industry best practices and design patterns',
          'Performance and security considerations integrated'
        ]
      },
      {
        name: 'Developer',
        role: 'Software Engineer and Implementation Specialist',
        capabilities: [
          'Feature implementation and code development',
          'Debugging and troubleshooting technical issues',
          'Code optimization and performance improvement',
          'Testing and validation of implementations'
        ],
        whenToUse: 'Use @developer for coding tasks, implementation work, debugging, and technical problem-solving',
        deliverables: [
          'Clean, well-documented code implementations',
          'Comprehensive unit and integration tests',
          'Technical documentation and code comments',
          'Performance optimizations and bug fixes'
        ],
        qualityStandards: [
          'Code follows established conventions and standards',
          'Comprehensive testing with adequate coverage',
          'Clear documentation for maintenance and extension',
          'Performance and security best practices implemented'
        ]
      },
      {
        name: 'QA',
        role: 'Quality Assurance Engineer and Code Reviewer',
        capabilities: [
          'Code review and quality assessment',
          'Test planning and execution strategies',
          'Quality standards validation and enforcement',
          'Performance and security testing'
        ],
        whenToUse: 'Use @qa for code reviews, quality validation, test planning, and ensuring adherence to quality standards',
        deliverables: [
          'Comprehensive code review reports with recommendations',
          'Test plans and testing strategies',
          'Quality assessment reports with improvement suggestions',
          'Performance and security validation results'
        ],
        qualityStandards: [
          'Thorough review covering functionality, security, and performance',
          'Clear, actionable feedback with improvement suggestions',
          'Validation against established quality criteria',
          'Comprehensive testing coverage and documentation'
        ]
      },
      {
        name: 'UX-Expert',
        role: 'User Experience Designer and Frontend Specialist',
        capabilities: [
          'User experience design and optimization',
          'Frontend specifications and component architecture',
          'Accessibility audits and compliance validation',
          'Wireframing and user interface design'
        ],
        whenToUse: 'Use @ux-expert for frontend design, user experience optimization, accessibility, and UI specifications',
        deliverables: [
          'User experience designs and user journey maps',
          'Frontend specifications with component definitions',
          'Accessibility audit reports and remediation plans',
          'Wireframes and UI mockups with interaction specifications'
        ],
        qualityStandards: [
          'User-centered design with validated user experience',
          'Accessible design meeting WCAG compliance standards',
          'Responsive design for cross-platform compatibility',
          'Clear specifications for development implementation'
        ]
      },
      {
        name: 'Product-Owner',
        role: 'Product Owner and Acceptance Validator',
        capabilities: [
          'Story validation and acceptance criteria verification',
          'Course correction and project guidance',
          'Checklist execution and process validation',
          'Document management and stakeholder communication'
        ],
        whenToUse: 'Use @product-owner for story validation, acceptance decisions, course correction, and process validation',
        deliverables: [
          'Story validation reports with acceptance decisions',
          'Course correction recommendations and action plans',
          'Process validation checklists and compliance reports',
          'Stakeholder communication summaries and decisions'
        ],
        qualityStandards: [
          'Clear acceptance criteria with measurable outcomes',
          'Validated alignment with business objectives',
          'Comprehensive process validation and compliance',
          'Effective stakeholder communication and alignment'
        ]
      },
      {
        name: 'Scrum-Master',
        role: 'Agile Process Manager and Team Coordinator',
        capabilities: [
          'Sprint planning and story creation',
          'Progress tracking and velocity measurement',
          'Workflow optimization and process improvement',
          'Team coordination and obstacle removal'
        ],
        whenToUse: 'Use @scrum-master for process management, progress tracking, workflow optimization, and team coordination',
        deliverables: [
          'Sprint plans with clear objectives and timelines',
          'Progress reports with velocity and performance metrics',
          'Process improvement recommendations and implementations',
          'Team coordination summaries and obstacle resolution plans'
        ],
        qualityStandards: [
          'Clear, achievable sprint goals with defined success criteria',
          'Accurate progress tracking with transparent reporting',
          'Continuous process improvement with measurable results',
          'Effective team coordination and communication facilitation'
        ]
      }
    ];
  }

  /**
   * Get workflow patterns
   * @returns {Promise<Array>} Workflow patterns
   */
  async getWorkflowPatterns() {
    return [
      'Greenfield Development',
      'Brownfield Enhancement', 
      'Research-Driven Development',
      'Quality-First Development',
      'Rapid Prototyping',
      'Maintenance and Optimization'
    ];
  }

  /**
   * Get usage examples
   * @returns {Promise<Array>} Usage examples
   */
  async getUsageExamples() {
    return [
      'E-commerce Platform Development',
      'API Service Enhancement',
      'Mobile App Development',
      'System Migration',
      'Security Implementation'
    ];
  }

  /**
   * Count sections in rules content
   * @param {string} content - Rules content
   * @returns {number} Number of sections
   */
  countRulesSections(content) {
    const sections = content.match(/^#{1,6}\s/gm);
    return sections ? sections.length : 0;
  }

  /**
   * Generate configuration templates
   * @returns {Promise<Object>} Configuration templates
   */
  async generateConfigurationTemplates() {
    try {
      const templates = {
        projectConfig: this.generateProjectConfigTemplate(),
        agentConfig: this.generateAgentConfigTemplate(),
        workflowConfig: this.generateWorkflowConfigTemplate()
      };

      // Write templates to files
      const templatesDir = join(this.cursorDir, 'templates');
      if (!existsSync(templatesDir)) {
        mkdirSync(templatesDir, { recursive: true });
      }

      Object.entries(templates).forEach(([name, content]) => {
        const templatePath = join(templatesDir, `${name}.json`);
        writeFileSync(templatePath, JSON.stringify(content, null, 2));
      });

      return {
        success: true,
        templates,
        templatesDir
      };

    } catch (error) {
      throw new Error(`Failed to generate configuration templates: ${error.message}`);
    }
  }

  /**
   * Generate project configuration template
   * @returns {Object} Project configuration template
   */
  generateProjectConfigTemplate() {
    return {
      name: "Super Agents Project Configuration",
      description: "Template for configuring Super Agents in your project",
      version: "1.0.0",
      configuration: {
        enabledAgents: [
          "analyst",
          "pm", 
          "architect",
          "developer",
          "qa",
          "ux-expert",
          "product-owner",
          "scrum-master"
        ],
        defaultWorkflow: "greenfield-development",
        qualityGates: {
          requireCodeReview: true,
          requireArchitectureReview: true,
          requireStakeholderApproval: true
        },
        integrations: {
          cursor: {
            rulesEnabled: true,
            mcpEnabled: false,
            customRules: {}
          }
        }
      }
    };
  }

  /**
   * Generate agent configuration template
   * @returns {Object} Agent configuration template
   */
  generateAgentConfigTemplate() {
    return {
      name: "Super Agents - Agent Configuration",
      description: "Configuration for individual agent behavior and capabilities",
      agents: {
        analyst: {
          enabled: true,
          specializations: ["market-research", "competitive-analysis", "requirements-gathering"],
          responseStyle: "analytical",
          outputFormat: "structured-report"
        },
        pm: {
          enabled: true,
          specializations: ["product-planning", "feature-prioritization", "stakeholder-management"],
          responseStyle: "strategic",
          outputFormat: "executive-summary"
        },
        architect: {
          enabled: true,
          specializations: ["system-design", "technology-selection", "integration-planning"],
          responseStyle: "technical",
          outputFormat: "architectural-documentation"
        },
        developer: {
          enabled: true,
          specializations: ["implementation", "debugging", "optimization"],
          responseStyle: "practical",
          outputFormat: "code-and-documentation"
        },
        qa: {
          enabled: true,
          specializations: ["code-review", "quality-validation", "testing-strategy"],
          responseStyle: "critical",
          outputFormat: "quality-report"
        }
      }
    };
  }

  /**
   * Generate workflow configuration template
   * @returns {Object} Workflow configuration template
   */
  generateWorkflowConfigTemplate() {
    return {
      name: "Super Agents - Workflow Configuration",
      description: "Configuration for workflow patterns and execution",
      workflows: {
        "greenfield-development": {
          name: "Greenfield Development",
          description: "Complete workflow for new project development",
          phases: [
            { name: "research", agent: "analyst", duration: "2-3 days" },
            { name: "planning", agent: "pm", duration: "3-5 days" },
            { name: "architecture", agent: "architect", duration: "2-4 days" },
            { name: "implementation", agent: "developer", duration: "variable" },
            { name: "quality-review", agent: "qa", duration: "1-2 days" }
          ]
        },
        "brownfield-enhancement": {
          name: "Brownfield Enhancement",
          description: "Workflow for enhancing existing systems",
          phases: [
            { name: "analysis", agent: "architect", duration: "1-2 days" },
            { name: "impact-assessment", agent: "analyst", duration: "1-2 days" },
            { name: "planning", agent: "pm", duration: "2-3 days" },
            { name: "implementation", agent: "developer", duration: "variable" },
            { name: "integration-testing", agent: "qa", duration: "2-3 days" }
          ]
        }
      }
    };
  }

  /**
   * Validate setup
   * @returns {Promise<Object>} Validation result
   */
  async validateSetup() {
    try {
      const validations = {
        rulesFileExists: existsSync(join(this.rulesDir, 'super-agents.md')),
        directoriesExist: existsSync(this.cursorDir) && existsSync(this.rulesDir),
        templatesGenerated: existsSync(join(this.cursorDir, 'templates'))
      };

      const allValid = Object.values(validations).every(v => v === true);

      return {
        success: allValid,
        validations,
        issues: Object.entries(validations)
          .filter(([_, valid]) => !valid)
          .map(([check, _]) => check)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate setup guide
   * @returns {string} Setup guide content
   */
  generateSetupGuide() {
    return `# Super Agents - Cursor Standalone Setup Guide

## Overview
This guide will help you set up Super Agents integration with Cursor IDE using the rules-based approach (without MCP).

## Setup Steps

### 1. Verify Files Installation
Check that these files have been created in your project:
- \`.cursor/rules/super-agents.md\` - Main rules file
- \`.cursor/templates/\` - Configuration templates
- This setup guide

### 2. Configure Cursor
Cursor automatically loads rules from the \`.cursor/rules/\` directory. No additional configuration needed.

### 3. Test Integration
Try using an agent in Cursor chat:
\`\`\`
@analyst: Research current trends in web development frameworks
\`\`\`

### 4. Customize Configuration (Optional)
Edit the templates in \`.cursor/templates/\` to customize:
- Enabled agents
- Workflow patterns
- Quality gates
- Response styles

## Usage Patterns

### Basic Agent Usage
\`\`\`
@analyst: [Your research or analysis request]
@pm: [Your product planning request]
@architect: [Your system design request]
@developer: [Your implementation request]
@qa: [Your code review request]
\`\`\`

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
- Review the comprehensive rules file at \`.cursor/rules/super-agents.md\`
- Check configuration templates for customization options
- Use the troubleshooting section in the rules file

## Next Steps
1. Try the basic agent usage patterns
2. Experiment with workflow patterns for your projects
3. Customize configuration templates as needed
4. Integrate quality gates into your development process

---
*Super Agents Standalone Setup - Generated ${new Date().toISOString()}*
`;
  }
}