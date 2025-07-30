import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saCreateNextStory = {
  name: 'sa_create_next_story',
  description: 'Generate next story based on project context, dependency analysis, and story prioritization workflows',
  category: 'scrum-master',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      contextId: { type: 'string', minLength: 1 },
      currentStory: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string' },
          epic: { type: 'string' },
          dependencies: { type: 'array', items: { type: 'string' } }
        }
      },
      projectContext: {
        type: 'object',
        properties: {
          backlog: { type: 'array', items: { type: 'object' } },
          completedStories: { type: 'array', items: { type: 'object' } },
          currentSprint: { type: 'object' },
          teamCapacity: { type: 'number' },
          businessPriorities: { type: 'array', items: { type: 'string' } }
        }
      },
      generationCriteria: {
        type: 'object',
        properties: {
          strategy: { 
            type: 'string', 
            enum: ['dependency-based', 'priority-based', 'epic-continuation', 'gap-filling', 'user-journey'],
            default: 'dependency-based'
          },
          targetPoints: { type: 'number', default: 5 },
          considerCapacity: { type: 'boolean', default: true },
          focusArea: { type: 'string' }
        }
      },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['contextId']
  },

  validate(args) {
    const errors = [];
    if (!args.contextId?.trim()) errors.push('contextId is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const nextStoryContext = {
        contextId: args.contextId.trim(),
        currentStory: args.currentStory || {},
        projectContext: args.projectContext || {},
        generationCriteria: { strategy: 'dependency-based', targetPoints: 5, considerCapacity: true, ...args.generationCriteria },
        timestamp: new Date().toISOString(),
        generator: context?.userId || 'system'
      };

      // Analyze current project state
      const projectAnalysis = await this.analyzeProjectState(nextStoryContext);
      
      // Identify story opportunities
      const opportunities = await this.identifyStoryOpportunities(nextStoryContext, projectAnalysis);
      
      // Apply generation strategy
      const candidateStories = await this.generateCandidateStories(nextStoryContext, opportunities);
      
      // Prioritize and select best story
      const selectedStory = await this.selectNextStory(candidateStories, nextStoryContext, projectAnalysis);
      
      // Generate detailed story structure
      const detailedStory = await this.generateDetailedStory(selectedStory, nextStoryContext);
      
      // Create implementation roadmap
      const roadmap = await this.createImplementationRoadmap(detailedStory, nextStoryContext);
      
      const output = await this.formatNextStoryOutput(
        nextStoryContext,
        selectedStory,
        detailedStory,
        roadmap,
        projectAnalysis
      );
      
      await this.saveNextStoryData(args.projectPath, nextStoryContext, {
        analysis: projectAnalysis,
        opportunities,
        candidates: candidateStories,
        selected: selectedStory,
        detailed: detailedStory,
        roadmap
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          contextId: nextStoryContext.contextId,
          strategy: nextStoryContext.generationCriteria.strategy,
          selectedStoryPoints: detailedStory.storyPoints,
          opportunitiesFound: opportunities.length,
          candidatesGenerated: candidateStories.length,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to create next story: ${error.message}` }],
        isError: true
      };
    }
  },

  async analyzeProjectState(context) {
    const analysis = {
      currentState: await this.assessCurrentState(context),
      dependencies: await this.analyzeDependencies(context),
      capacity: await this.analyzeCapacity(context),
      priorities: await this.analyzePriorities(context),
      gaps: await this.identifyGaps(context),
      momentum: await this.assessMomentum(context)
    };

    return analysis;
  },

  async assessCurrentState(context) {
    const currentStory = context.currentStory;
    const projectContext = context.projectContext;
    
    return {
      currentStory: {
        id: currentStory.id || 'none',
        status: currentStory.status || 'unknown',
        epic: currentStory.epic,
        completionProgress: this.estimateProgress(currentStory)
      },
      backlogSize: projectContext.backlog?.length || 0,
      completedStories: projectContext.completedStories?.length || 0,
      sprintStatus: this.assessSprintStatus(projectContext.currentSprint),
      teamCapacity: projectContext.teamCapacity || 40
    };
  },

  estimateProgress(story) {
    if (!story.status) return 0;
    
    const progressMap = {
      'todo': 0,
      'in-progress': 50,
      'review': 80,
      'done': 100
    };
    
    return progressMap[story.status] || 0;
  },

  assessSprintStatus(sprint) {
    if (!sprint) return 'no-active-sprint';
    
    return {
      id: sprint.id,
      capacity: sprint.capacity || 40,
      committed: sprint.committed || 0,
      completed: sprint.completed || 0,
      remaining: (sprint.capacity || 40) - (sprint.committed || 0)
    };
  },

  async analyzeDependencies(context) {
    const currentStory = context.currentStory;
    const dependencies = currentStory.dependencies || [];
    
    return {
      blockedBy: dependencies.filter(dep => dep.includes('blocked-by')),
      blocks: dependencies.filter(dep => dep.includes('blocks')),
      relatedTo: dependencies.filter(dep => dep.includes('related')),
      upstreamComplete: this.checkUpstreamDependencies(dependencies, context.projectContext),
      downstreamReady: this.identifyDownstreamOpportunities(dependencies, context.projectContext)
    };
  },

  checkUpstreamDependencies(dependencies, projectContext) {
    // Simulate checking if upstream dependencies are complete
    const completedStories = projectContext.completedStories || [];
    return dependencies.filter(dep => 
      completedStories.some(story => story.id === dep)
    );
  },

  identifyDownstreamOpportunities(dependencies, projectContext) {
    // Identify stories that can be unblocked
    return dependencies.filter(dep => dep.includes('blocks')).map(dep => ({
      storyId: dep.replace('blocks-', ''),
      readiness: 'ready-when-current-complete'
    }));
  },

  async analyzeCapacity(context) {
    const teamCapacity = context.projectContext.teamCapacity || 40;
    const currentSprint = context.projectContext.currentSprint || {};
    
    return {
      totalCapacity: teamCapacity,
      committed: currentSprint.committed || 0,
      available: teamCapacity - (currentSprint.committed || 0),
      utilizationRate: ((currentSprint.committed || 0) / teamCapacity) * 100,
      recommendedStorySize: this.calculateRecommendedSize(teamCapacity - (currentSprint.committed || 0))
    };
  },

  calculateRecommendedSize(availableCapacity) {
    if (availableCapacity >= 13) return 8;
    if (availableCapacity >= 8) return 5;
    if (availableCapacity >= 5) return 3;
    if (availableCapacity >= 3) return 2;
    return 1;
  },

  async analyzePriorities(context) {
    const businessPriorities = context.projectContext.businessPriorities || [];
    
    return {
      currentFocus: businessPriorities[0] || 'general-development',
      priorities: businessPriorities,
      alignmentScore: this.calculateAlignmentScore(context.currentStory, businessPriorities),
      recommendedFocus: this.getRecommendedFocus(businessPriorities, context.projectContext)
    };
  },

  calculateAlignmentScore(currentStory, priorities) {
    if (!currentStory.title || priorities.length === 0) return 50;
    
    const title = currentStory.title.toLowerCase();
    const matchingPriorities = priorities.filter(priority => 
      title.includes(priority.toLowerCase())
    );
    
    return Math.min(100, (matchingPriorities.length / priorities.length) * 100);
  },

  getRecommendedFocus(priorities, projectContext) {
    if (priorities.length === 0) return 'user-experience';
    
    // Rotate through priorities based on recent completion
    const completedStories = projectContext.completedStories || [];
    const recentFocus = this.identifyRecentFocus(completedStories);
    
    return priorities.find(p => p !== recentFocus) || priorities[0];
  },

  identifyRecentFocus(completedStories) {
    if (completedStories.length === 0) return null;
    
    const recentStory = completedStories[completedStories.length - 1];
    return recentStory.focus || recentStory.epic || null;
  },

  async identifyGaps(context) {
    return {
      functionalGaps: this.identifyFunctionalGaps(context),
      technicalGaps: this.identifyTechnicalGaps(context),
      userExperienceGaps: this.identifyUXGaps(context),
      integrationGaps: this.identifyIntegrationGaps(context)
    };
  },

  identifyFunctionalGaps(context) {
    // Simulate identifying missing functionality
    const commonGaps = [
      'User authentication enhancement',
      'Data validation improvements',
      'Error handling refinement',
      'Performance optimization',
      'User feedback mechanisms'
    ];
    
    return commonGaps.slice(0, 2); // Return subset
  },

  identifyTechnicalGaps(context) {
    return [
      'API rate limiting',
      'Database optimization',
      'Monitoring and logging',
      'Security enhancements'
    ].slice(0, 2);
  },

  identifyUXGaps(context) {
    return [
      'Mobile responsiveness',
      'Accessibility improvements',
      'User onboarding flow',
      'Navigation optimization'
    ].slice(0, 2);
  },

  identifyIntegrationGaps(context) {
    return [
      'Third-party service integration',
      'API documentation',
      'Cross-system communication',
      'Data synchronization'
    ].slice(0, 1);
  },

  async assessMomentum(context) {
    const currentStory = context.currentStory;
    const completedStories = context.projectContext.completedStories || [];
    
    return {
      recentVelocity: this.calculateRecentVelocity(completedStories),
      storyCompletionRate: this.calculateCompletionRate(completedStories),
      momentum: this.assessTeamMomentum(completedStories),
      recommendedContinuation: this.getRecommendedContinuation(currentStory, completedStories)
    };
  },

  calculateRecentVelocity(completedStories) {
    if (completedStories.length === 0) return 0;
    
    // Simple velocity calculation based on recent stories
    const recentStories = completedStories.slice(-5);
    const totalPoints = recentStories.reduce((sum, story) => sum + (story.storyPoints || 3), 0);
    return Math.round(totalPoints / Math.max(1, recentStories.length));
  },

  calculateCompletionRate(completedStories) {
    if (completedStories.length === 0) return 0;
    
    // Simulate completion rate based on story success
    return Math.min(100, completedStories.length * 5); // Simplified calculation
  },

  assessTeamMomentum(completedStories) {
    const recentCount = completedStories.slice(-3).length;
    
    if (recentCount >= 3) return 'high';
    if (recentCount >= 2) return 'medium';
    if (recentCount >= 1) return 'low';
    return 'stalled';
  },

  getRecommendedContinuation(currentStory, completedStories) {
    if (currentStory.epic) {
      return `Continue epic: ${currentStory.epic}`;
    }
    
    if (completedStories.length > 0) {
      const lastStory = completedStories[completedStories.length - 1];
      return `Build on: ${lastStory.title || 'previous work'}`;
    }
    
    return 'Start new initiative';
  },

  async identifyStoryOpportunities(context, analysis) {
    const opportunities = [];
    
    // Strategy-based opportunity identification
    switch (context.generationCriteria.strategy) {
      case 'dependency-based':
        opportunities.push(...await this.findDependencyOpportunities(analysis));
        break;
      case 'priority-based':
        opportunities.push(...await this.findPriorityOpportunities(analysis));
        break;
      case 'epic-continuation':
        opportunities.push(...await this.findEpicContinuationOpportunities(context, analysis));
        break;
      case 'gap-filling':
        opportunities.push(...await this.findGapFillingOpportunities(analysis));
        break;
      case 'user-journey':
        opportunities.push(...await this.findUserJourneyOpportunities(analysis));
        break;
    }
    
    return opportunities;
  },

  async findDependencyOpportunities(analysis) {
    const opportunities = [];
    
    // Stories that can be unblocked
    analysis.dependencies.downstreamReady.forEach(item => {
      opportunities.push({
        type: 'dependency-unlock',
        priority: 'high',
        description: `Unblock downstream story: ${item.storyId}`,
        rationale: 'Enables other team members to continue work',
        estimatedPoints: 5
      });
    });
    
    // Parallel work opportunities
    if (analysis.capacity.available > 8) {
      opportunities.push({
        type: 'parallel-work',
        priority: 'medium',
        description: 'Independent feature development',
        rationale: 'Utilize available team capacity',
        estimatedPoints: 3
      });
    }
    
    return opportunities;
  },

  async findPriorityOpportunities(analysis) {
    const opportunities = [];
    const recommendedFocus = analysis.priorities.recommendedFocus;
    
    opportunities.push({
      type: 'priority-alignment',
      priority: 'high',
      description: `Focus on ${recommendedFocus} improvements`,
      rationale: 'Aligns with current business priorities',
      estimatedPoints: 5,
      focusArea: recommendedFocus
    });
    
    return opportunities;
  },

  async findEpicContinuationOpportunities(context, analysis) {
    const opportunities = [];
    const currentEpic = context.currentStory.epic;
    
    if (currentEpic) {
      opportunities.push({
        type: 'epic-continuation',
        priority: 'high',
        description: `Continue ${currentEpic} epic`,
        rationale: 'Maintains development momentum and epic progress',
        estimatedPoints: 5,
        epicId: currentEpic
      });
    }
    
    return opportunities;
  },

  async findGapFillingOpportunities(analysis) {
    const opportunities = [];
    
    // Technical debt opportunities
    if (analysis.gaps.technicalGaps.length > 0) {
      opportunities.push({
        type: 'technical-improvement',
        priority: 'medium',
        description: `Address: ${analysis.gaps.technicalGaps[0]}`,
        rationale: 'Improves system foundation and maintainability',
        estimatedPoints: 3
      });
    }
    
    // UX improvement opportunities
    if (analysis.gaps.userExperienceGaps.length > 0) {
      opportunities.push({
        type: 'ux-improvement',
        priority: 'medium',
        description: `Enhance: ${analysis.gaps.userExperienceGaps[0]}`,
        rationale: 'Improves user satisfaction and engagement',
        estimatedPoints: 5
      });
    }
    
    return opportunities;
  },

  async findUserJourneyOpportunities(analysis) {
    const opportunities = [];
    
    // User journey completion opportunities
    opportunities.push({
      type: 'user-journey',
      priority: 'high',
      description: 'Complete user onboarding journey',
      rationale: 'Provides end-to-end user value',
      estimatedPoints: 8
    });
    
    opportunities.push({
      type: 'user-journey',
      priority: 'medium',
      description: 'Enhance core user workflow',
      rationale: 'Improves primary user experience',
      estimatedPoints: 5
    });
    
    return opportunities;
  },

  async generateCandidateStories(context, opportunities) {
    const candidates = [];
    
    for (const opportunity of opportunities) {
      const candidate = {
        id: `CANDIDATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: await this.generateStoryTitle(opportunity),
        description: await this.generateStoryDescription(opportunity, context),
        type: this.mapOpportunityToStoryType(opportunity.type),
        priority: opportunity.priority,
        estimatedPoints: opportunity.estimatedPoints,
        rationale: opportunity.rationale,
        opportunity,
        score: await this.scoreCandidate(opportunity, context)
      };
      
      candidates.push(candidate);
    }
    
    return candidates.sort((a, b) => b.score - a.score);
  },

  async generateStoryTitle(opportunity) {
    const titleTemplates = {
      'dependency-unlock': 'Enable {description}',
      'priority-alignment': 'Implement {focusArea} enhancement',
      'epic-continuation': 'Extend {epicId} functionality',
      'technical-improvement': 'Improve {description}',
      'ux-improvement': 'Enhance {description}',
      'user-journey': 'Complete {description}',
      'parallel-work': 'Develop {description}'
    };
    
    let template = titleTemplates[opportunity.type] || 'Implement {description}';
    template = template.replace('{description}', opportunity.description);
    template = template.replace('{focusArea}', opportunity.focusArea || 'system');
    template = template.replace('{epicId}', opportunity.epicId || 'feature');
    
    return template;
  },

  async generateStoryDescription(opportunity, context) {
    const user = this.determineUserRole(opportunity);
    const action = this.extractAction(opportunity.description);
    const value = this.generateValue(opportunity);
    
    return `As a ${user}, I want to ${action} so that ${value}.`;
  },

  determineUserRole(opportunity) {
    const roleMap = {
      'dependency-unlock': 'developer',
      'priority-alignment': 'user',
      'epic-continuation': 'user',
      'technical-improvement': 'system administrator',
      'ux-improvement': 'user',
      'user-journey': 'new user',
      'parallel-work': 'user'
    };
    
    return roleMap[opportunity.type] || 'user';
  },

  extractAction(description) {
    // Simple action extraction
    const cleaned = description.toLowerCase()
      .replace(/^(address|enhance|improve|complete|enable|implement):?\s*/, '')
      .replace(/^(focus on|continue)\s*/, '');
    
    return cleaned || 'use the system effectively';
  },

  generateValue(opportunity) {
    const valueMap = {
      'dependency-unlock': 'other team members can continue their work',
      'priority-alignment': 'the system better meets business priorities',
      'epic-continuation': 'we can deliver complete epic value',
      'technical-improvement': 'the system is more reliable and maintainable',
      'ux-improvement': 'I have a better user experience',
      'user-journey': 'I can accomplish my goals efficiently',
      'parallel-work': 'I can benefit from additional functionality'
    };
    
    return valueMap[opportunity.type] || 'I can achieve my objectives';
  },

  mapOpportunityToStoryType(opportunityType) {
    const typeMap = {
      'dependency-unlock': 'technical-story',
      'priority-alignment': 'user-story',
      'epic-continuation': 'user-story',
      'technical-improvement': 'technical-story',
      'ux-improvement': 'user-story',
      'user-journey': 'user-story',
      'parallel-work': 'user-story'
    };
    
    return typeMap[opportunityType] || 'user-story';
  },

  async scoreCandidate(opportunity, context) {
    let score = 50; // Base score
    
    // Priority scoring
    const priorityScores = { low: 10, medium: 20, high: 30, critical: 40 };
    score += priorityScores[opportunity.priority] || 20;
    
    // Capacity alignment
    const targetPoints = context.generationCriteria.targetPoints;
    const pointsDiff = Math.abs(opportunity.estimatedPoints - targetPoints);
    score += Math.max(0, 20 - pointsDiff * 2);
    
    // Strategic alignment
    if (opportunity.type === 'priority-alignment') score += 15;
    if (opportunity.type === 'dependency-unlock') score += 10;
    if (opportunity.type === 'epic-continuation') score += 10;
    
    return Math.min(100, score);
  },

  async selectNextStory(candidates, context, analysis) {
    if (candidates.length === 0) {
      // Generate default story if no candidates
      return this.generateDefaultStory(context, analysis);
    }
    
    // Apply additional selection criteria
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      finalScore: this.applySelectionCriteria(candidate, context, analysis)
    }));
    
    return scoredCandidates.sort((a, b) => b.finalScore - a.finalScore)[0];
  },

  applySelectionCriteria(candidate, context, analysis) {
    let score = candidate.score;
    
    // Team capacity consideration
    if (context.generationCriteria.considerCapacity) {
      const available = analysis.capacity.available;
      if (candidate.estimatedPoints <= available) {
        score += 10;
      } else {
        score -= 20;
      }
    }
    
    // Momentum consideration
    if (analysis.momentum.momentum === 'high' && candidate.priority === 'high') {
      score += 15;
    }
    
    // Focus area alignment
    if (context.generationCriteria.focusArea && 
        candidate.description.toLowerCase().includes(context.generationCriteria.focusArea.toLowerCase())) {
      score += 10;
    }
    
    return score;
  },

  generateDefaultStory(context, analysis) {
    return {
      id: `DEFAULT-${Date.now()}`,
      title: 'Improve system functionality',
      description: 'As a user, I want to have improved system functionality so that I can accomplish my tasks more effectively.',
      type: 'user-story',
      priority: 'medium',
      estimatedPoints: context.generationCriteria.targetPoints,
      rationale: 'Default story generated when no specific opportunities identified',
      score: 50
    };
  },

  async generateDetailedStory(selectedStory, context) {
    return {
      id: selectedStory.id,
      title: selectedStory.title,
      description: selectedStory.description,
      type: selectedStory.type,
      priority: selectedStory.priority,
      storyPoints: selectedStory.estimatedPoints,
      acceptanceCriteria: await this.generateAcceptanceCriteria(selectedStory),
      tasks: await this.generateTasks(selectedStory),
      dependencies: await this.identifyStoryDependencies(selectedStory, context),
      labels: this.generateLabels(selectedStory),
      metadata: {
        generatedAt: context.timestamp,
        generator: context.generator,
        strategy: context.generationCriteria.strategy,
        rationale: selectedStory.rationale
      }
    };
  },

  async generateAcceptanceCriteria(story) {
    const criteria = [];
    
    switch (story.type) {
      case 'user-story':
        criteria.push(
          'Given I am a user, when I access the feature, then I should see the expected interface',
          'Given valid input, when I interact with the feature, then it should respond appropriately',
          'Given the feature is complete, when I use it, then it should provide the intended value'
        );
        break;
        
      case 'technical-story':
        criteria.push(
          'Given the technical requirements, when implemented, then the system should meet performance standards',
          'Given the implementation, when tested, then it should integrate properly with existing systems',
          'Given the solution, when deployed, then it should be maintainable and scalable'
        );
        break;
        
      default:
        criteria.push(
          'Given the requirements, when implemented, then the story should be complete',
          'Given the implementation, when tested, then it should work as expected'
        );
    }
    
    return criteria;
  },

  async generateTasks(story) {
    const baseTasks = [
      'Analyze requirements and create design',
      'Implement core functionality',
      'Write tests and validate implementation',
      'Review and refine solution'
    ];
    
    if (story.type === 'technical-story') {
      baseTasks.splice(1, 0, 'Research technical approach');
      baseTasks.push('Update technical documentation');
    }
    
    if (story.type === 'user-story') {
      baseTasks.splice(2, 0, 'Create user interface components');
      baseTasks.push('Conduct user acceptance testing');
    }
    
    return baseTasks.map((task, index) => ({
      id: index + 1,
      description: task,
      status: 'todo',
      estimatedHours: Math.ceil(story.estimatedPoints / baseTasks.length * 4)
    }));
  },

  async identifyStoryDependencies(story, context) {
    const dependencies = [];
    
    // If continuing an epic, add dependency on current story
    if (story.opportunity?.epicId && context.currentStory.id) {
      dependencies.push(`depends-on-${context.currentStory.id}`);
    }
    
    // If unlocking dependencies, reference them
    if (story.opportunity?.type === 'dependency-unlock') {
      dependencies.push('unlocks-downstream-work');
    }
    
    return dependencies;
  },

  generateLabels(story) {
    const labels = [story.type];
    
    if (story.opportunity?.focusArea) {
      labels.push(story.opportunity.focusArea);
    }
    
    if (story.priority === 'high' || story.priority === 'critical') {
      labels.push('priority');
    }
    
    return labels;
  },

  async createImplementationRoadmap(story, context) {
    return {
      timeline: this.createTimeline(story),
      dependencies: story.dependencies,
      riskFactors: this.identifyRiskFactors(story),
      successCriteria: this.defineSuccessCriteria(story),
      nextSteps: this.defineNextSteps(story, context)
    };
  },

  createTimeline(story) {
    const totalHours = story.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const days = Math.ceil(totalHours / 6); // 6 hours per day
    
    return {
      estimatedDuration: `${days} days`,
      totalHours,
      phases: [
        { phase: 'Planning', duration: '1 day', percentage: 20 },
        { phase: 'Implementation', duration: `${Math.ceil(days * 0.6)} days`, percentage: 60 },
        { phase: 'Testing & Review', duration: `${Math.ceil(days * 0.2)} days`, percentage: 20 }
      ]
    };
  },

  identifyRiskFactors(story) {
    const risks = [];
    
    if (story.storyPoints > 5) {
      risks.push('Large story size may lead to scope creep');
    }
    
    if (story.type === 'technical-story') {
      risks.push('Technical complexity may cause delays');
    }
    
    if (story.dependencies.length > 0) {
      risks.push('Dependencies may block progress');
    }
    
    return risks;
  },

  defineSuccessCriteria(story) {
    return [
      'All acceptance criteria are met',
      'Code passes all tests and reviews',
      'Feature is deployed successfully',
      'Stakeholders approve the implementation'
    ];
  },

  defineNextSteps(story, context) {
    const steps = [
      'Review generated story with team',
      'Refine requirements and acceptance criteria',
      'Add to sprint backlog',
      'Begin implementation when prioritized'
    ];
    
    if (story.dependencies.length > 0) {
      steps.splice(2, 0, 'Resolve any blocking dependencies');
    }
    
    return steps;
  },

  async formatNextStoryOutput(context, selectedStory, detailedStory, roadmap, analysis) {
    let output = `🔄 **Next Story Generated: ${detailedStory.title}**\n\n`;
    output += `🆔 **Story ID:** ${detailedStory.id}\n`;
    output += `📝 **Type:** ${detailedStory.type}\n`;
    output += `⭐ **Priority:** ${detailedStory.priority}\n`;
    output += `🎯 **Story Points:** ${detailedStory.storyPoints}\n`;
    output += `🧠 **Strategy:** ${context.generationCriteria.strategy}\n`;
    output += `📊 **Generation Score:** ${selectedStory.score}/100\n\n`;

    // Story Description
    output += `## 📖 Story Description\n\n`;
    output += `${detailedStory.description}\n\n`;

    // Generation Rationale
    output += `## 🎯 Selection Rationale\n\n`;
    output += `${selectedStory.rationale}\n\n`;

    // Project Context
    output += `## 📊 Project Context\n\n`;
    output += `**Current Capacity:** ${analysis.capacity.available}/${analysis.capacity.totalCapacity} points available\n`;
    output += `**Team Momentum:** ${analysis.momentum.momentum}\n`;
    output += `**Recent Velocity:** ${analysis.momentum.recentVelocity} points/story\n`;
    if (analysis.currentState.currentStory.id !== 'none') {
      output += `**Current Story:** ${analysis.currentState.currentStory.id} (${analysis.currentState.currentStory.status})\n`;
    }
    output += '\n';

    // Acceptance Criteria
    output += `## ✅ Acceptance Criteria (${detailedStory.acceptanceCriteria.length})\n\n`;
    detailedStory.acceptanceCriteria.forEach((criteria, index) => {
      output += `${index + 1}. ${criteria}\n`;
    });
    output += '\n';

    // Implementation Tasks
    output += `## 🔧 Implementation Tasks (${detailedStory.tasks.length})\n\n`;
    detailedStory.tasks.forEach(task => {
      output += `${task.id}. ${task.description} (${task.estimatedHours}h)\n`;
    });
    output += `\n**Total Estimated:** ${roadmap.timeline.totalHours} hours (${roadmap.timeline.estimatedDuration})\n\n`;

    // Dependencies
    if (detailedStory.dependencies.length > 0) {
      output += `## 🔗 Dependencies\n\n`;
      detailedStory.dependencies.forEach(dep => {
        output += `• ${dep}\n`;
      });
      output += '\n';
    }

    // Risk Factors
    if (roadmap.riskFactors.length > 0) {
      output += `## ⚠️ Risk Factors\n\n`;
      roadmap.riskFactors.forEach(risk => {
        output += `• ${risk}\n`;
      });
      output += '\n';
    }

    // Implementation Timeline
    output += `## 📅 Implementation Timeline\n\n`;
    roadmap.timeline.phases.forEach(phase => {
      output += `**${phase.phase}:** ${phase.duration} (${phase.percentage}%)\n`;
    });
    output += '\n';

    // Success Criteria
    output += `## ✅ Success Criteria\n\n`;
    roadmap.successCriteria.forEach(criteria => {
      output += `• ${criteria}\n`;
    });
    output += '\n';

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    roadmap.nextSteps.forEach((step, index) => {
      output += `${index + 1}. ${step}\n`;
    });
    output += '\n';

    // Story Metadata
    output += `## 🏷️ Story Metadata\n\n`;
    output += `**Labels:** ${detailedStory.labels.join(', ')}\n`;
    output += `**Generated:** ${detailedStory.metadata.generatedAt.split('T')[0]}\n`;
    output += `**Generator:** ${detailedStory.metadata.generator}\n`;
    output += `**Strategy Used:** ${detailedStory.metadata.strategy}\n\n`;

    output += `📁 **Complete next story details and roadmap saved to project.**`;

    return output;
  },

  async saveNextStoryData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const nextStoriesDir = join(saDir, 'next-stories');
      if (!existsSync(nextStoriesDir)) {
        require('fs').mkdirSync(nextStoriesDir, { recursive: true });
      }
      
      const filename = `next-story-${context.contextId}-${Date.now()}.json`;
      const filepath = join(nextStoriesDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save next story data:', error.message);
    }
  }
};