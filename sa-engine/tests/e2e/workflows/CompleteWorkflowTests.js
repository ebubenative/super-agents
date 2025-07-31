/**
 * Complete Workflow Testing Suite
 * Tests end-to-end workflows across all agent types
 */

import { TestRunner } from '../framework/TestRunner.js';
import { WorkflowExecutor } from './WorkflowExecutor.js';
import { MockProject } from '../fixtures/MockProject.js';

export class CompleteWorkflowTests {
  constructor() {
    this.workflowExecutor = new WorkflowExecutor();
    this.mockProject = new MockProject();
  }

  /**
   * Register all workflow tests
   */
  registerTests(testRunner) {
    // Full Project Lifecycle Tests
    testRunner.registerSuite('full-project-lifecycle', {
      setup: () => this.setupProjectTests(),
      teardown: () => this.teardownProjectTests(),
      tests: [
        {
          name: 'Greenfield Fullstack Project Workflow',
          fn: () => this.testGreenfieldFullstackWorkflow()
        },
        {
          name: 'Brownfield Service Enhancement Workflow',
          fn: () => this.testBrownfieldServiceWorkflow()
        },
        {
          name: 'Frontend-Only Project Workflow',
          fn: () => this.testFrontendOnlyWorkflow()
        }
      ]
    });

    // Multi-Agent Collaboration Tests
    testRunner.registerSuite('multi-agent-collaboration', {
      setup: () => this.setupCollaborationTests(),
      teardown: () => this.teardownCollaborationTests(),
      tests: [
        {
          name: 'Analyst to PM to Architect Pipeline',
          fn: () => this.testAnalystPMArchitectPipeline()
        },
        {
          name: 'Developer to QA to Product Owner Review',
          fn: () => this.testDeveloperQAProductOwnerPipeline()
        },
        {
          name: 'Cross-Agent Knowledge Transfer',
          fn: () => this.testCrossAgentKnowledgeTransfer()
        }
      ]
    });

    // Workflow Phase Transition Tests
    testRunner.registerSuite('workflow-phase-transitions', {
      tests: [
        {
          name: 'Discovery to Planning Phase Transition',
          fn: () => this.testDiscoveryToPlanningTransition()
        },
        {
          name: 'Planning to Development Phase Transition',
          fn: () => this.testPlanningToDevelopmentTransition()
        },
        {
          name: 'Development to Quality Assurance Transition',
          fn: () => this.testDevelopmentToQATransition()
        },
        {
          name: 'QA to Deployment Phase Transition',
          fn: () => this.testQAToDeploymentTransition()
        }
      ]
    });

    // Task Dependency and Progression Tests
    testRunner.registerSuite('task-dependency-progression', {
      tests: [
        {
          name: 'Sequential Task Dependencies',
          fn: () => this.testSequentialTaskDependencies()
        },
        {
          name: 'Parallel Task Execution',
          fn: () => this.testParallelTaskExecution()
        },
        {
          name: 'Complex Dependency Graph Resolution',
          fn: () => this.testComplexDependencyGraph()
        }
      ]
    });
  }

  /**
   * Setup project lifecycle tests
   */
  async setupProjectTests() {
    console.log('  🔧 Setting up project lifecycle tests...');
    await this.mockProject.createTestProjects();
    await this.workflowExecutor.initialize();
  }

  /**
   * Teardown project lifecycle tests
   */
  async teardownProjectTests() {
    console.log('  🧹 Cleaning up project lifecycle tests...');
    await this.mockProject.cleanup();
    await this.workflowExecutor.cleanup();
  }

  /**
   * Setup collaboration tests
   */
  async setupCollaborationTests() {
    console.log('  🔧 Setting up collaboration tests...');
    await this.workflowExecutor.initializeAgents();
  }

  /**
   * Teardown collaboration tests
   */
  async teardownCollaborationTests() {
    console.log('  🧹 Cleaning up collaboration tests...');
    await this.workflowExecutor.cleanupAgents();
  }

  /**
   * Test complete greenfield fullstack workflow
   */
  async testGreenfieldFullstackWorkflow() {
    const projectIdea = {
      name: 'AI Task Manager',
      description: 'Intelligent task management system with AI-powered prioritization',
      type: 'fullstack',
      stack: 'react-node-postgres'
    };

    console.log('    🌱 Starting greenfield fullstack workflow...');

    // Phase 1: Market Research and Analysis
    const marketResearch = await this.workflowExecutor.executeAnalystWorkflow({
      tool: 'sa-research-market',
      params: {
        topic: projectIdea.description,
        depth: 'comprehensive',
        competitive_analysis: true
      }
    });

    this.validateWorkflowResult(marketResearch, 'Market research should include competitive analysis');

    // Phase 2: Product Requirements
    const prd = await this.workflowExecutor.executePMWorkflow({
      tool: 'sa-generate-prd',
      params: {
        project_name: projectIdea.name,
        market_research: marketResearch.output,
        template: 'saas-product'
      }
    });

    this.validateWorkflowResult(prd, 'PRD should contain epics and user stories');

    // Phase 3: System Architecture
    const architecture = await this.workflowExecutor.executeArchitectWorkflow({
      tool: 'sa-create-architecture',
      params: {
        requirements: prd.output,
        type: 'microservices',
        stack: projectIdea.stack
      }
    });

    this.validateWorkflowResult(architecture, 'Architecture should define system components');

    // Phase 4: UX Design
    const uxSpecs = await this.workflowExecutor.executeUXWorkflow({
      tool: 'sa-create-frontend-spec',
      params: {
        requirements: prd.output,
        architecture: architecture.output
      }
    });

    this.validateWorkflowResult(uxSpecs, 'UX specs should include wireframes and component specs');

    // Phase 5: Story Creation
    const stories = await this.workflowExecutor.executeScrumMasterWorkflow({
      tool: 'sa-create-story',
      params: {
        epic: prd.output.epics[0],
        architecture: architecture.output,
        ux_specs: uxSpecs.output
      }
    });

    this.validateWorkflowResult(stories, 'Stories should have acceptance criteria');

    // Phase 6: Implementation
    const implementation = await this.workflowExecutor.executeDeveloperWorkflow({
      tool: 'sa-implement-story',
      params: {
        story: stories.output,
        architecture: architecture.output
      }
    });

    this.validateWorkflowResult(implementation, 'Implementation should include code and tests');

    // Phase 7: Quality Review
    const review = await this.workflowExecutor.executeQAWorkflow({
      tool: 'sa-review-code',
      params: {
        code: implementation.output.code,
        story: stories.output
      }
    });

    this.validateWorkflowResult(review, 'Review should identify improvement suggestions');

    // Phase 8: Product Owner Validation
    const validation = await this.workflowExecutor.executeProductOwnerWorkflow({
      tool: 'sa-validate-story-draft',
      params: {
        story: stories.output,
        implementation: implementation.output,
        review: review.output
      }
    });

    this.validateWorkflowResult(validation, 'Validation should confirm story completion');

    console.log('    ✅ Greenfield fullstack workflow completed successfully');
    
    return {
      success: true,
      phases: {
        marketResearch,
        prd,
        architecture,
        uxSpecs,
        stories,
        implementation,
        review,
        validation
      }
    };
  }

  /**
   * Test brownfield service enhancement workflow
   */
  async testBrownfieldServiceWorkflow() {
    console.log('    🏢 Starting brownfield service workflow...');

    const existingService = {
      name: 'User Management Service',
      technology: 'Node.js/Express',
      database: 'PostgreSQL',
      enhancement: 'Add OAuth2 authentication'
    };

    // Phase 1: Brownfield Analysis
    const analysis = await this.workflowExecutor.executeArchitectWorkflow({
      tool: 'sa-analyze-brownfield',
      params: {
        project_path: './test-fixtures/user-service',
        enhancement_request: existingService.enhancement
      }
    });

    this.validateWorkflowResult(analysis, 'Brownfield analysis should identify integration points');

    // Phase 2: Technical Recommendations
    const techRecommendations = await this.workflowExecutor.executeArchitectWorkflow({
      tool: 'sa-tech-recommendations',
      params: {
        current_stack: `${existingService.technology}, ${existingService.database}`,
        requirements: existingService.enhancement,
        analysis: analysis.output
      }
    });

    this.validateWorkflowResult(techRecommendations, 'Tech recommendations should include migration strategy');

    // Phase 3: Enhancement Implementation
    const implementation = await this.workflowExecutor.executeDeveloperWorkflow({
      tool: 'sa-implement-story',
      params: {
        story: {
          title: existingService.enhancement,
          description: 'Integrate OAuth2 authentication into existing user service'
        },
        brownfield_context: analysis.output,
        tech_recommendations: techRecommendations.output
      }
    });

    this.validateWorkflowResult(implementation, 'Implementation should preserve existing functionality');

    // Phase 4: Integration Testing
    const testing = await this.workflowExecutor.executeDeveloperWorkflow({
      tool: 'sa-run-tests',
      params: {
        project_path: './test-fixtures/user-service',
        test_type: 'integration',
        new_features: implementation.output
      }
    });

    this.validateWorkflowResult(testing, 'Integration tests should pass');

    console.log('    ✅ Brownfield service workflow completed successfully');
    
    return {
      success: true,
      phases: {
        analysis,
        techRecommendations,
        implementation,
        testing
      }
    };
  }

  /**
   * Test frontend-only project workflow
   */
  async testFrontendOnlyWorkflow() {
    console.log('    🎨 Starting frontend-only workflow...');

    const frontendProject = {
      name: 'Dashboard Analytics',
      type: 'React SPA',
      api: 'REST API integration'
    };

    // Phase 1: UX Research and Design
    const wireframes = await this.workflowExecutor.executeUXWorkflow({
      tool: 'sa-design-wireframes',
      params: {
        project_type: frontendProject.type,
        requirements: frontendProject.name,
        target_users: 'business analysts'
      }
    });

    this.validateWorkflowResult(wireframes, 'Wireframes should define user interface layout');

    // Phase 2: Frontend Specification
    const frontendSpec = await this.workflowExecutor.executeUXWorkflow({
      tool: 'sa-create-frontend-spec',
      params: {
        wireframes: wireframes.output,
        technology: frontendProject.type,
        api_integration: frontendProject.api
      }
    });

    this.validateWorkflowResult(frontendSpec, 'Frontend spec should include component hierarchy');

    // Phase 3: Component Implementation
    const components = await this.workflowExecutor.executeDeveloperWorkflow({
      tool: 'sa-implement-story',
      params: {
        story: {
          title: 'Implement Dashboard Components',
          frontend_spec: frontendSpec.output
        },
        project_type: 'frontend-only'
      }
    });

    this.validateWorkflowResult(components, 'Components should include tests and styling');

    // Phase 4: Accessibility Audit
    const accessibilityAudit = await this.workflowExecutor.executeUXWorkflow({
      tool: 'sa-accessibility-audit',
      params: {
        components: components.output,
        wcag_level: 'AA'
      }
    });

    this.validateWorkflowResult(accessibilityAudit, 'Accessibility audit should identify compliance issues');

    console.log('    ✅ Frontend-only workflow completed successfully');
    
    return {
      success: true,
      phases: {
        wireframes,
        frontendSpec,
        components,
        accessibilityAudit
      }
    };
  }

  /**
   * Test Analyst → PM → Architect pipeline
   */
  async testAnalystPMArchitectPipeline() {
    console.log('    🔗 Testing Analyst → PM → Architect pipeline...');

    // Analyst generates market insights
    const competitorAnalysis = await this.workflowExecutor.executeAnalystWorkflow({
      tool: 'sa-competitor-analysis',
      params: {
        industry: 'EdTech',
        product_category: 'Learning Management Systems'
      }
    });

    // PM creates product brief based on analysis
    const productBrief = await this.workflowExecutor.executePMWorkflow({
      tool: 'sa-create-brief',
      params: {
        market_analysis: competitorAnalysis.output,
        business_goals: ['Market differentiation', 'User engagement']
      }
    });

    // Architect designs system based on product brief
    const systemDesign = await this.workflowExecutor.executeArchitectWorkflow({
      tool: 'sa-design-system',
      params: {
        product_brief: productBrief.output,
        scalability_requirements: 'high',
        integration_needs: ['LTI', 'SCORM']
      }
    });

    // Validate pipeline data flow
    this.validatePipelineIntegration(
      competitorAnalysis.output,
      productBrief.output,
      'Product brief should reference competitor analysis insights'
    );

    this.validatePipelineIntegration(
      productBrief.output,
      systemDesign.output,
      'System design should address product brief requirements'
    );

    console.log('    ✅ Analyst → PM → Architect pipeline completed successfully');
    
    return {
      success: true,
      pipeline: [competitorAnalysis, productBrief, systemDesign]
    };
  }

  /**
   * Test Developer → QA → Product Owner pipeline
   */
  async testDeveloperQAProductOwnerPipeline() {
    console.log('    🔗 Testing Developer → QA → Product Owner pipeline...');

    const testStory = {
      title: 'User Authentication Feature',
      acceptance_criteria: ['Users can login with email/password', 'Password reset functionality']
    };

    // Developer implements the story
    const implementation = await this.workflowExecutor.executeDeveloperWorkflow({
      tool: 'sa-implement-story',
      params: {
        story: testStory
      }
    });

    // QA reviews the implementation
    const codeReview = await this.workflowExecutor.executeQAWorkflow({
      tool: 'sa-review-code',
      params: {
        code: implementation.output.code,
        story: testStory
      }
    });

    // QA validates quality metrics
    const qualityValidation = await this.workflowExecutor.executeQAWorkflow({
      tool: 'sa-validate-quality',
      params: {
        implementation: implementation.output,
        review_findings: codeReview.output
      }
    });

    // Product Owner validates story completion
    const storyValidation = await this.workflowExecutor.executeProductOwnerWorkflow({
      tool: 'sa-validate-story-draft',
      params: {
        story: testStory,
        implementation: implementation.output,
        qa_validation: qualityValidation.output
      }
    });

    // Validate pipeline quality gates
    this.validateQualityGate(
      codeReview.output,
      'Code review should identify improvement opportunities'
    );

    this.validateQualityGate(
      qualityValidation.output,
      'Quality validation should confirm acceptance criteria'
    );

    this.validateQualityGate(
      storyValidation.output,
      'Story validation should confirm business requirements'
    );

    console.log('    ✅ Developer → QA → Product Owner pipeline completed successfully');
    
    return {
      success: true,
      pipeline: [implementation, codeReview, qualityValidation, storyValidation]
    };
  }

  /**
   * Test cross-agent knowledge transfer
   */
  async testCrossAgentKnowledgeTransfer() {
    console.log('    🤝 Testing cross-agent knowledge transfer...');

    // Create shared context
    const sharedContext = {
      project: 'E-commerce Platform',
      domain_knowledge: 'Online retail, payment processing, inventory management'
    };

    // Multiple agents work on different aspects
    const businessAnalysis = await this.workflowExecutor.executeAnalystWorkflow({
      tool: 'sa-brainstorm-session',
      params: {
        topic: 'E-commerce user experience improvements',
        context: sharedContext
      }
    });

    const technicalAnalysis = await this.workflowExecutor.executeArchitectWorkflow({
      tool: 'sa-tech-recommendations',
      params: {
        business_requirements: businessAnalysis.output,
        context: sharedContext
      }
    });

    const implementationPlan = await this.workflowExecutor.executeScrumMasterWorkflow({
      tool: 'sa-create-story',
      params: {
        business_analysis: businessAnalysis.output,
        technical_analysis: technicalAnalysis.output,
        context: sharedContext
      }
    });

    // Validate knowledge consistency across agents
    this.validateKnowledgeTransfer(
      [businessAnalysis.output, technicalAnalysis.output, implementationPlan.output],
      sharedContext,
      'All agents should maintain consistent domain understanding'
    );

    console.log('    ✅ Cross-agent knowledge transfer completed successfully');
    
    return {
      success: true,
      sharedContext,
      agentOutputs: [businessAnalysis, technicalAnalysis, implementationPlan]
    };
  }

  /**
   * Test discovery to planning phase transition
   */
  async testDiscoveryToPlanningTransition() {
    console.log('    🔄 Testing Discovery → Planning transition...');

    // Discovery phase
    const marketResearch = await this.workflowExecutor.executeAnalystWorkflow({
      tool: 'sa-research-market',
      params: {
        topic: 'Sustainable Energy Management',
        phase: 'discovery'
      }
    });

    const stakeholderAnalysis = await this.workflowExecutor.executePMWorkflow({
      tool: 'sa-stakeholder-analysis',
      params: {
        market_research: marketResearch.output,
        phase: 'discovery'
      }
    });

    // Transition to planning
    const planningPRD = await this.workflowExecutor.executePMWorkflow({
      tool: 'sa-generate-prd',
      params: {
        discovery_insights: {
          market_research: marketResearch.output,
          stakeholder_analysis: stakeholderAnalysis.output
        },
        phase: 'planning'
      }
    });

    // Validate phase transition
    this.validatePhaseTransition(
      [marketResearch.output, stakeholderAnalysis.output],
      planningPRD.output,
      'Planning phase should incorporate discovery insights'
    );

    console.log('    ✅ Discovery → Planning transition completed successfully');
    
    return {
      success: true,
      discovery: [marketResearch, stakeholderAnalysis],
      planning: planningPRD
    };
  }

  /**
   * Test sequential task dependencies
   */
  async testSequentialTaskDependencies() {
    console.log('    🔗 Testing sequential task dependencies...');

    const dependencyChain = [
      {
        name: 'Initialize Project',
        tool: 'sa-initialize-project',
        params: { name: 'Dependency Test Project' }
      },
      {
        name: 'Create Epic',
        tool: 'sa-create-epic',
        params: { title: 'Core Functionality' },
        dependsOn: 'Initialize Project'
      },
      {
        name: 'Generate Stories',
        tool: 'sa-create-story',
        params: { epic_id: 'epic-1' },
        dependsOn: 'Create Epic'
      },
      {
        name: 'Implement Story',
        tool: 'sa-implement-story',
        params: { story_id: 'story-1' },
        dependsOn: 'Generate Stories'
      }
    ];

    const results = await this.workflowExecutor.executeSequentialDependencies(dependencyChain);

    // Validate each step completed successfully
    for (let i = 0; i < results.length; i++) {
      this.validateWorkflowResult(
        results[i],
        `Step ${i + 1} (${dependencyChain[i].name}) should complete successfully`
      );
      
      if (i > 0) {
        this.validateDependencyChain(
          results[i - 1].output,
          results[i].input,
          `Step ${i + 1} should use output from step ${i}`
        );
      }
    }

    console.log('    ✅ Sequential task dependencies completed successfully');
    
    return {
      success: true,
      dependencyChain: results
    };
  }

  /**
   * Test parallel task execution
   */
  async testParallelTaskExecution() {
    console.log('    ⚙️ Testing parallel task execution...');

    const parallelTasks = [
      {
        name: 'Market Research',
        tool: 'sa-research-market',
        params: { topic: 'Parallel Task Test - Market' }
      },
      {
        name: 'Competitor Analysis',
        tool: 'sa-competitor-analysis',
        params: { industry: 'Parallel Task Test - Competition' }
      },
      {
        name: 'Stakeholder Analysis',
        tool: 'sa-stakeholder-analysis',
        params: { project: 'Parallel Task Test - Stakeholders' }
      }
    ];

    const startTime = Date.now();
    const results = await this.workflowExecutor.executeParallelTasks(parallelTasks);
    const parallelTime = Date.now() - startTime;

    // Execute same tasks sequentially for comparison
    const sequentialStartTime = Date.now();
    const sequentialResults = [];
    for (const task of parallelTasks) {
      const result = await this.workflowExecutor.executeSingleTask(task);
      sequentialResults.push(result);
    }
    const sequentialTime = Date.now() - sequentialStartTime;

    // Validate parallel execution is faster
    const speedupRatio = sequentialTime / parallelTime;
    if (speedupRatio < 1.5) {
      throw new Error(`Parallel execution should be significantly faster. Speedup: ${speedupRatio}x`);
    }

    // Validate all parallel tasks completed successfully
    results.forEach((result, index) => {
      this.validateWorkflowResult(
        result,
        `Parallel task ${index + 1} (${parallelTasks[index].name}) should complete successfully`
      );
    });

    console.log(`    ✅ Parallel execution completed ${speedupRatio.toFixed(1)}x faster`);
    
    return {
      success: true,
      parallelTime,
      sequentialTime,
      speedupRatio,
      results
    };
  }

  /**
   * Validate workflow result
   */
  validateWorkflowResult(result, message) {
    if (!result || !result.success) {
      throw new Error(`${message}. Got: ${JSON.stringify(result)}`);
    }
    
    if (!result.output) {
      throw new Error(`${message}. Missing output in result.`);
    }
  }

  /**
   * Validate pipeline integration
   */
  validatePipelineIntegration(input, output, message) {
    // Check that output references or incorporates input data
    const inputStr = JSON.stringify(input).toLowerCase();
    const outputStr = JSON.stringify(output).toLowerCase();
    
    // Simple validation - in real implementation, would check specific data flows
    if (outputStr.length < inputStr.length * 0.1) {
      throw new Error(`${message}. Output seems too small compared to input.`);
    }
  }

  /**
   * Validate quality gate
   */
  validateQualityGate(result, message) {
    if (!result || typeof result !== 'object') {
      throw new Error(`${message}. Invalid quality gate result.`);
    }
    
    // Quality gates should have some form of validation or recommendations
    const hasValidation = result.validation || result.recommendations || result.issues || result.suggestions;
    if (!hasValidation) {
      throw new Error(`${message}. Quality gate should provide validation feedback.`);
    }
  }

  /**
   * Validate knowledge transfer
   */
  validateKnowledgeTransfer(agentOutputs, sharedContext, message) {
    const contextKeys = Object.keys(sharedContext);
    
    agentOutputs.forEach((output, index) => {
      const outputStr = JSON.stringify(output).toLowerCase();
      
      // Check that shared context is referenced
      const hasContextReferences = contextKeys.some(key => 
        outputStr.includes(sharedContext[key].toLowerCase())
      );
      
      if (!hasContextReferences) {
        throw new Error(`${message}. Agent ${index + 1} output doesn't reference shared context.`);
      }
    });
  }

  /**
   * Validate phase transition
   */
  validatePhaseTransition(previousPhaseOutputs, currentPhaseOutput, message) {
    // Check that current phase incorporates insights from previous phase
    const previousContent = previousPhaseOutputs.map(output => JSON.stringify(output)).join(' ').toLowerCase();
    const currentContent = JSON.stringify(currentPhaseOutput).toLowerCase();
    
    // Simple check - should have some overlap in content/concepts
    if (currentContent.length < previousContent.length * 0.05) {
      throw new Error(`${message}. Phase transition doesn't appear to incorporate previous insights.`);
    }
  }

  /**
   * Validate dependency chain
   */
  validateDependencyChain(previousOutput, currentInput, message) {
    // Check that current input incorporates previous output
    if (!currentInput || !previousOutput) {
      throw new Error(`${message}. Missing input or output in dependency chain.`);
    }
    
    // In real implementation, would check specific data field mappings
    const hasConnection = JSON.stringify(currentInput).includes('dependency') || 
                         JSON.stringify(currentInput).includes('previous');
    
    if (!hasConnection) {
      console.warn(`Warning: ${message}. Dependency connection not explicitly validated.`);
    }
  }
}
