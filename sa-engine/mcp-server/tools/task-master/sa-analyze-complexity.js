/**
 * SA Analyze Complexity Tool
 * Complexity analysis with AI - estimate task difficulty, effort, and resource requirements
 */

export const saAnalyzeComplexity = {
  name: 'sa_analyze_complexity',
  description: 'AI-powered complexity analysis for tasks including difficulty estimation, effort analysis, and resource requirements',
  category: 'task-master',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectRoot: {
        type: 'string',
        description: 'Absolute path to the project root directory'
      },
      tasksFile: {
        type: 'string',
        description: 'Path to tasks file (optional, will use project tasks.json)'
      },
      taskIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific task IDs to analyze (optional, will analyze all tasks if not provided)'
      },
      analysisType: {
        type: 'string',
        enum: ['basic', 'detailed', 'comprehensive'],
        description: 'Level of complexity analysis to perform',
        default: 'detailed'
      },
      useResearch: {
        type: 'boolean',
        description: 'Enable AI research mode for enhanced complexity analysis',
        default: false
      },
      factors: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['technical', 'time', 'resources', 'dependencies', 'risk', 'skills', 'testing']
        },
        description: 'Specific complexity factors to analyze',
        default: ['technical', 'time', 'resources', 'dependencies', 'risk']
      },
      teamExperience: {
        type: 'string',
        enum: ['junior', 'mixed', 'senior'],
        description: 'Team experience level for accurate effort estimation',
        default: 'mixed'
      },
      generateReport: {
        type: 'boolean',
        description: 'Generate a detailed complexity analysis report',
        default: true
      }
    },
    required: ['projectRoot']
  },
  
  async execute({ projectRoot, tasksFile, taskIds, analysisType = 'detailed', useResearch = false, factors = ['technical', 'time', 'resources', 'dependencies', 'risk'], teamExperience = 'mixed', generateReport = true }) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Determine tasks file path
      const tasksPath = tasksFile || path.join(projectRoot, 'sa-engine', 'data', 'tasks', 'tasks.json');
      
      // Load tasks
      let tasksData;
      try {
        const tasksContent = await fs.readFile(tasksPath, 'utf-8');
        tasksData = JSON.parse(tasksContent);
      } catch (error) {
        throw new Error(`Failed to load tasks file: ${error.message}`);
      }
      
      if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
        throw new Error('Invalid tasks file format');
      }
      
      // Filter tasks to analyze
      let tasksToAnalyze = tasksData.tasks;
      if (taskIds && taskIds.length > 0) {
        tasksToAnalyze = tasksData.tasks.filter(task => taskIds.includes(task.id));
        if (tasksToAnalyze.length === 0) {
          throw new Error('No matching tasks found for the provided IDs');
        }
      }
      
      // Perform complexity analysis
      const analysisResults = await this.performComplexityAnalysis(tasksToAnalyze, {
        analysisType,
        useResearch,
        factors,
        teamExperience,
        projectContext: tasksData.metadata
      });
      
      // Update tasks with complexity analysis
      tasksToAnalyze.forEach(task => {
        const analysis = analysisResults.taskAnalyses.find(a => a.taskId === task.id);
        if (analysis) {
          task.complexity_analysis = analysis;
          task.updated_at = new Date().toISOString();
        }
      });
      
      // Update metadata
      if (!tasksData.metadata) {
        tasksData.metadata = {};
      }
      tasksData.metadata.lastComplexityAnalysis = {
        analyzedAt: new Date().toISOString(),
        tasksAnalyzed: tasksToAnalyze.length,
        analysisType,
        factors
      };
      
      // Save updated tasks
      await fs.writeFile(tasksPath, JSON.stringify(tasksData, null, 2));
      
      // Generate report if requested
      let reportContent = '';
      let reportPath = '';
      if (generateReport) {
        reportContent = await this.generateComplexityReport(analysisResults, tasksData.metadata);
        
        // Save report
        const reportsDir = path.join(projectRoot, 'sa-engine', 'data', 'reports');
        await fs.mkdir(reportsDir, { recursive: true });
        reportPath = path.join(reportsDir, `complexity-analysis-${new Date().toISOString().split('T')[0]}.md`);
        await fs.writeFile(reportPath, reportContent);
      }
      
      // Build response
      const summary = this.generateAnalysisSummary(analysisResults);
      const responseText = generateReport ? `${summary}\\n\\n${reportContent}` : summary;
      
      return {
        content: [{
          type: 'text',
          text: responseText
        }],
        metadata: {
          tasksAnalyzed: tasksToAnalyze.length,
          analysisType,
          factors,
          teamExperience,
          overallComplexity: analysisResults.overallMetrics.averageComplexity,
          totalEffortHours: analysisResults.overallMetrics.totalEstimatedHours,
          highRiskTasks: analysisResults.overallMetrics.highRiskTasks,
          reportPath: reportPath || null,
          analyzedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error analyzing complexity: ${error.message}`
        }],
        metadata: {
          error: true,
          errorMessage: error.message,
          errorType: 'complexity_analysis_error'
        }
      };
    }
  },
  
  async performComplexityAnalysis(tasks, options) {
    const { analysisType, useResearch, factors, teamExperience, projectContext } = options;
    
    const analysisResults = {
      analyzedAt: new Date().toISOString(),
      analysisType,
      factors,
      teamExperience,
      taskAnalyses: [],
      overallMetrics: {}
    };
    
    // Analyze each task
    for (const task of tasks) {
      try {
        const taskAnalysis = await this.analyzeTaskComplexity(task, {
          analysisType,
          useResearch,
          factors,
          teamExperience,
          projectContext,
          allTasks: tasks
        });
        
        analysisResults.taskAnalyses.push(taskAnalysis);
      } catch (error) {
        console.warn(`Failed to analyze task ${task.id}: ${error.message}`);
        // Add basic analysis as fallback
        analysisResults.taskAnalyses.push(this.createBasicAnalysis(task));
      }
    }
    
    // Calculate overall metrics
    analysisResults.overallMetrics = this.calculateOverallMetrics(analysisResults.taskAnalyses);
    
    return analysisResults;
  },
  
  async analyzeTaskComplexity(task, options) {
    const { analysisType, useResearch, factors, teamExperience, projectContext, allTasks } = options;
    
    // Create AI prompt for complexity analysis
    const prompt = this.buildComplexityAnalysisPrompt(task, {
      analysisType,
      factors,
      teamExperience,
      projectContext,
      allTasks
    });
    
    try {
      // Use AI provider for analysis
      const aiResponse = await this.callAIProvider(prompt, useResearch);
      
      // Parse AI response
      const aiAnalysis = this.parseAIResponse(aiResponse);
      
      // Structure the analysis results
      return this.structureComplexityAnalysis(task, aiAnalysis, factors);
      
    } catch (error) {
      console.warn(`AI analysis failed for task ${task.id}, using template-based analysis:`, error.message);
      return this.generateTemplateAnalysis(task, options);
    }
  },
  
  buildComplexityAnalysisPrompt(task, options) {
    const { analysisType, factors, teamExperience, projectContext, allTasks } = options;
    
    const analysisDepth = {
      basic: 'Provide a quick complexity assessment focusing on effort and main challenges.',
      detailed: 'Perform thorough complexity analysis covering all requested factors with specific insights.',
      comprehensive: 'Conduct deep complexity analysis with detailed breakdowns, risk assessment, and optimization recommendations.'
    };
    
    const teamContext = {
      junior: 'Team consists primarily of junior developers. Consider learning curves and additional mentorship time.',
      mixed: 'Team has mixed experience levels. Consider both efficiency from experienced members and training needs.',
      senior: 'Team consists of experienced developers. Focus on advanced challenges and architectural complexities.'
    };
    
    let prompt = `You are an expert project manager and technical architect analyzing task complexity for accurate effort estimation and risk assessment.

**Task Information:**
- **ID:** ${task.id}
- **Title:** ${task.title}
- **Description:** ${task.description}
- **Current Priority:** ${task.priority}
- **Current Effort Estimate:** ${task.effort}/5
- **Current Time Estimate:** ${task.estimated_hours || 'Not specified'} hours
- **Required Skills:** ${task.skills?.join(', ') || 'Not specified'}
- **Dependencies:** ${task.dependencies?.length || 0} dependencies
- **Subtasks:** ${task.subtasks?.length || 0} subtasks

**Context:**
- **Analysis Depth:** ${analysisDepth[analysisType]}
- **Team Experience:** ${teamExperience} - ${teamContext[teamExperience]}
- **Project:** ${projectContext?.projectName || 'Unknown'}
- **Project Complexity:** ${projectContext?.complexity || 'Medium'}
- **Total Project Tasks:** ${allTasks?.length || 'Unknown'}

**Analysis Factors to Evaluate:**
${factors.map(factor => `- ${factor.charAt(0).toUpperCase() + factor.slice(1)} complexity`).join('\\n')}

**Required Analysis:**
Provide a comprehensive complexity analysis covering:

1. **Technical Complexity (1-10 scale)**
   - Implementation challenges
   - Technology requirements
   - Integration complexity
   - Performance considerations

2. **Time Complexity (effort multiplier)**
   - Base implementation time
   - Testing and debugging time
   - Documentation time
   - Review and iteration time

3. **Resource Requirements**
   - Required skill levels
   - Number of team members needed
   - External dependencies
   - Tools and infrastructure needs

4. **Risk Assessment (1-10 scale)**
   - Technical risks
   - Timeline risks
   - Resource risks
   - External dependency risks

5. **Dependency Analysis**
   - Blocking dependencies
   - Parallel work opportunities
   - Critical path impact

**Output Format:**
Return a JSON object with this structure:
{
  "taskId": "${task.id}",
  "complexity": {
    "overall": 1-10,
    "technical": 1-10,
    "time": 1-10,
    "resources": 1-10,
    "dependencies": 1-10,
    "risk": 1-10
  },
  "effort": {
    "originalEstimate": ${task.effort || 3},
    "adjustedEstimate": 1-5,
    "confidenceLevel": "high|medium|low",
    "adjustmentReason": "explanation"
  },
  "timeEstimate": {
    "originalHours": ${task.estimated_hours || 20},
    "adjustedHours": "number",
    "breakdown": {
      "implementation": "hours",
      "testing": "hours", 
      "documentation": "hours",
      "review": "hours"
    }
  },
  "risks": [
    {
      "type": "technical|timeline|resource|external",
      "description": "risk description",
      "impact": "high|medium|low",
      "probability": "high|medium|low",
      "mitigation": "mitigation strategy"
    }
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "skillsNeeded": ["skill1", "skill2"],
  "resourcesRequired": {
    "developers": 1-5,
    "timeframe": "concurrent|sequential",
    "specializations": ["spec1", "spec2"]
  }
}

Analyze the task now:`;
    
    return prompt;
  },
  
  async callAIProvider(prompt, useResearch = false) {
    try {
      // Check if we have AI provider configuration
      const aiConfig = await this.loadAIConfig();
      
      if (!aiConfig || !aiConfig.provider) {
        throw new Error('No AI provider configured');
      }
      
      // Make AI request (simplified implementation) 
      const response = await this.makeAIRequest(prompt, aiConfig, useResearch);
      return response;
      
    } catch (error) {
      throw error;
    }
  },
  
  async loadAIConfig() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const configPath = path.join(process.cwd(), 'sa-engine', 'config', 'ai-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      if (process.env.OPENAI_API_KEY) {
        return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4' };
      }
      if (process.env.ANTHROPIC_API_KEY) {
        return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-sonnet-20240229' };
      }
      return null;
    }
  },
  
  async makeAIRequest(prompt, config, useResearch) {
    // This would be implemented with actual AI provider SDKs
    throw new Error('AI provider not implemented');
  },
  
  generateTemplateAnalysis(task, options) {
    const { factors, teamExperience } = options;
    
    // Template-based complexity analysis
    const technicalComplexity = this.assessTechnicalComplexity(task);
    const timeComplexity = this.assessTimeComplexity(task, teamExperience);
    const resourceComplexity = this.assessResourceComplexity(task);
    const dependencyComplexity = this.assessDependencyComplexity(task);
    const riskLevel = this.assessRiskLevel(task);
    
    const overallComplexity = Math.round((technicalComplexity + timeComplexity + resourceComplexity + dependencyComplexity + riskLevel) / 5);
    
    const adjustedEffort = this.adjustEffortEstimate(task.effort || 3, overallComplexity, teamExperience);
    const adjustedHours = this.adjustTimeEstimate(task.estimated_hours || 20, overallComplexity, teamExperience);
    
    return {
      taskId: task.id,
      complexity: {
        overall: overallComplexity,
        technical: technicalComplexity,
        time: timeComplexity,
        resources: resourceComplexity,
        dependencies: dependencyComplexity,
        risk: riskLevel
      },
      effort: {
        originalEstimate: task.effort || 3,
        adjustedEstimate: adjustedEffort,
        confidenceLevel: this.calculateConfidenceLevel(task, overallComplexity),
        adjustmentReason: this.generateAdjustmentReason(task.effort || 3, adjustedEffort, overallComplexity)
      },
      timeEstimate: {
        originalHours: task.estimated_hours || 20,
        adjustedHours: adjustedHours,
        breakdown: this.breakdownTimeEstimate(adjustedHours)
      },
      risks: this.identifyRisks(task, riskLevel),
      recommendations: this.generateRecommendations(task, overallComplexity, teamExperience),
      skillsNeeded: this.identifySkillsNeeded(task),
      resourcesRequired: this.calculateResourcesRequired(task, overallComplexity)
    };
  },
  
  assessTechnicalComplexity(task) {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    const skills = task.skills || [];
    
    let complexity = 5; // Base complexity
    
    // Increase complexity for certain keywords
    const complexKeywords = ['architecture', 'integration', 'api', 'database', 'security', 'performance', 'scalability'];
    const simpleKeywords = ['documentation', 'setup', 'configuration', 'simple'];
    
    complexKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        complexity += 1;
      }
    });
    
    simpleKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        complexity -= 1;
      }
    });
    
    // Adjust based on skills required
    if (skills.length > 3) complexity += 1;
    if (skills.includes('architecture') || skills.includes('system-design')) complexity += 2;
    
    return Math.max(1, Math.min(10, complexity));
  },
  
  assessTimeComplexity(task, teamExperience) {
    const baseTime = task.estimated_hours || 20;
    let complexity = 5;
    
    // Adjust based on estimated time
    if (baseTime > 80) complexity += 2;
    else if (baseTime > 40) complexity += 1;
    else if (baseTime < 10) complexity -= 1;
    
    // Adjust based on team experience
    const experienceMultiplier = { junior: 1.5, mixed: 1.2, senior: 1.0 };
    complexity = Math.round(complexity * experienceMultiplier[teamExperience]);
    
    return Math.max(1, Math.min(10, complexity));
  },
  
  assessResourceComplexity(task) {
    const skills = task.skills || [];
    const description = task.description.toLowerCase();
    
    let complexity = 3;
    
    // More skills = more complex resource requirements
    complexity += Math.min(3, skills.length);
    
    // Specialized skills increase complexity
    const specializedSkills = ['architecture', 'security', 'devops', 'machine-learning', 'blockchain'];
    specializedSkills.forEach(skill => {
      if (skills.includes(skill)) complexity += 2;
    });
    
    // Multiple team coordination
    if (description.includes('team') || description.includes('collaboration')) {
      complexity += 1;
    }
    
    return Math.max(1, Math.min(10, complexity));
  },
  
  assessDependencyComplexity(task) {
    const dependencies = task.dependencies || [];
    const subtasks = task.subtasks || [];
    
    let complexity = 2;
    
    // External dependencies
    complexity += Math.min(4, dependencies.length);
    
    // Internal complexity from subtasks
    complexity += Math.min(3, Math.floor(subtasks.length / 3));
    
    return Math.max(1, Math.min(10, complexity));
  },
  
  assessRiskLevel(task) {
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    const dependencies = task.dependencies || [];
    
    let risk = 3;
    
    // High-risk keywords
    const riskKeywords = ['migration', 'integration', 'legacy', 'external', 'api', 'security', 'performance'];
    riskKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        risk += 1;
      }
    });
    
    // Dependencies increase risk
    risk += Math.min(3, dependencies.length);
    
    // Unknown or vague requirements
    if (description.length < 100 || description.includes('tbd') || description.includes('unknown')) {
      risk += 2;
    }
    
    return Math.max(1, Math.min(10, risk));
  },
  
  adjustEffortEstimate(originalEffort, complexity, teamExperience) {
    const complexityMultiplier = {1: 0.5, 2: 0.6, 3: 0.7, 4: 0.8, 5: 1.0, 6: 1.2, 7: 1.4, 8: 1.6, 9: 1.8, 10: 2.0};
    const experienceMultiplier = { junior: 1.3, mixed: 1.1, senior: 0.9 };
    
    const adjustedEffort = originalEffort * complexityMultiplier[complexity] * experienceMultiplier[teamExperience];
    
    return Math.max(1, Math.min(5, Math.round(adjustedEffort)));
  },
  
  adjustTimeEstimate(originalHours, complexity, teamExperience) {
    const complexityMultiplier = {1: 0.6, 2: 0.7, 3: 0.8, 4: 0.9, 5: 1.0, 6: 1.2, 7: 1.4, 8: 1.6, 9: 1.8, 10: 2.0};
    const experienceMultiplier = { junior: 1.4, mixed: 1.15, senior: 0.85 };
    
    const adjustedHours = originalHours * complexityMultiplier[complexity] * experienceMultiplier[teamExperience];
    
    return Math.round(adjustedHours);
  },
  
  calculateConfidenceLevel(task, complexity) {
    const description = task.description || '';
    
    if (complexity <= 3 && description.length > 200) return 'high';
    if (complexity <= 6 && description.length > 100) return 'medium';
    return 'low';
  },
  
  generateAdjustmentReason(originalEffort, adjustedEffort, complexity) {
    if (adjustedEffort > originalEffort) {
      return `Increased from ${originalEffort} to ${adjustedEffort} due to high complexity (${complexity}/10) and identified technical challenges`;
    } else if (adjustedEffort < originalEffort) {
      return `Decreased from ${originalEffort} to ${adjustedEffort} due to lower complexity (${complexity}/10) than initially estimated`;
    }
    return `Effort estimate confirmed at ${adjustedEffort} based on complexity analysis`;
  },
  
  breakdownTimeEstimate(totalHours) {
    return {
      implementation: Math.round(totalHours * 0.6),
      testing: Math.round(totalHours * 0.2),
      documentation: Math.round(totalHours * 0.1),
      review: Math.round(totalHours * 0.1)
    };
  },
  
  identifyRisks(task, riskLevel) {
    const risks = [];
    const title = task.title.toLowerCase();
    const description = task.description.toLowerCase();
    
    if (riskLevel >= 7) {
      risks.push({
        type: 'technical',
        description: 'High technical complexity may lead to implementation challenges',
        impact: 'high',
        probability: 'medium',
        mitigation: 'Conduct proof of concept and technical spike before full implementation'
      });
    }
    
    if ((task.dependencies || []).length > 3) {
      risks.push({
        type: 'timeline',
        description: 'Multiple dependencies may cause scheduling delays',
        impact: 'medium',
        probability: 'high',
        mitigation: 'Identify critical path and create parallel work streams where possible'
      });
    }
    
    if (title.includes('integration') || description.includes('integration')) {
      risks.push({
        type: 'external',
        description: 'Integration with external systems may be unpredictable',
        impact: 'high',
        probability: 'medium',
        mitigation: 'Early testing with external systems and fallback plans'
      });
    }
    
    return risks;
  },
  
  generateRecommendations(task, complexity, teamExperience) {
    const recommendations = [];
    
    if (complexity >= 8) {
      recommendations.push('Consider breaking this task into smaller, more manageable subtasks');
      recommendations.push('Assign senior team members to lead this complex task');
    }
    
    if (teamExperience === 'junior' && complexity >= 6) {
      recommendations.push('Provide additional mentorship and technical guidance');
      recommendations.push('Consider pair programming or code reviews at intermediate checkpoints');
    }
    
    if ((task.estimated_hours || 20) > 40) {
      recommendations.push('Create milestone checkpoints to track progress and adjust course if needed');
    }
    
    if ((task.dependencies || []).length > 2) {
      recommendations.push('Create dependency management plan and regular check-ins');
    }
    
    return recommendations;
  },
  
  identifySkillsNeeded(task) {
    const existingSkills = task.skills || [];
    const additionalSkills = [];
    const description = task.description.toLowerCase();
    
    // Identify additional skills based on task content
    if (description.includes('database')) additionalSkills.push('database-design');
    if (description.includes('api')) additionalSkills.push('api-development');
    if (description.includes('security')) additionalSkills.push('security');
    if (description.includes('performance')) additionalSkills.push('performance-optimization');
    if (description.includes('test')) additionalSkills.push('testing');
    
    return [...new Set([...existingSkills, ...additionalSkills])];
  },
  
  calculateResourcesRequired(task, complexity) {
    const developers = complexity <= 3 ? 1 : complexity <= 6 ? 2 : 3;
    const timeframe = (task.dependencies || []).length > 2 ? 'sequential' : 'concurrent';
    
    const specializations = [];
    if (complexity >= 7) specializations.push('senior-developer');
    if ((task.skills || []).includes('architecture')) specializations.push('architect');
    if ((task.skills || []).includes('security')) specializations.push('security-specialist');
    
    return {
      developers,
      timeframe,
      specializations
    };
  },
  
  parseAIResponse(aiResponse) {
    if (typeof aiResponse === 'object') {
      return aiResponse;
    }
    
    try {
      if (typeof aiResponse === 'string') {
        const jsonMatch = aiResponse.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(aiResponse);
      }
      return aiResponse;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  },
  
  structureComplexityAnalysis(task, aiAnalysis, factors) {
    // Ensure the analysis has the required structure
    const structuredAnalysis = {
      taskId: task.id,
      complexity: {
        overall: aiAnalysis.complexity?.overall || 5,
        technical: aiAnalysis.complexity?.technical || 5,
        time: aiAnalysis.complexity?.time || 5,
        resources: aiAnalysis.complexity?.resources || 5,
        dependencies: aiAnalysis.complexity?.dependencies || 5,
        risk: aiAnalysis.complexity?.risk || 5
      },
      effort: {
        originalEstimate: task.effort || 3,
        adjustedEstimate: aiAnalysis.effort?.adjustedEstimate || task.effort || 3,
        confidenceLevel: aiAnalysis.effort?.confidenceLevel || 'medium',
        adjustmentReason: aiAnalysis.effort?.adjustmentReason || 'No adjustment needed'
      },
      timeEstimate: {
        originalHours: task.estimated_hours || 20,
        adjustedHours: aiAnalysis.timeEstimate?.adjustedHours || task.estimated_hours || 20,
        breakdown: aiAnalysis.timeEstimate?.breakdown || this.breakdownTimeEstimate(task.estimated_hours || 20)
      },
      risks: aiAnalysis.risks || [],
      recommendations: aiAnalysis.recommendations || [],
      skillsNeeded: aiAnalysis.skillsNeeded || task.skills || [],
      resourcesRequired: aiAnalysis.resourcesRequired || this.calculateResourcesRequired(task, 5)
    };
    
    return structuredAnalysis;
  },
  
  createBasicAnalysis(task) {
    return {
      taskId: task.id,
      complexity: { overall: 5, technical: 5, time: 5, resources: 5, dependencies: 5, risk: 5 },
      effort: { originalEstimate: task.effort || 3, adjustedEstimate: task.effort || 3, confidenceLevel: 'low', adjustmentReason: 'Basic analysis only' },
      timeEstimate: { originalHours: task.estimated_hours || 20, adjustedHours: task.estimated_hours || 20, breakdown: this.breakdownTimeEstimate(task.estimated_hours || 20) },
      risks: [],
      recommendations: ['Conduct detailed analysis when AI provider is available'],
      skillsNeeded: task.skills || [],
      resourcesRequired: { developers: 1, timeframe: 'concurrent', specializations: [] }
    };
  },
  
  calculateOverallMetrics(taskAnalyses) {
    const totalTasks = taskAnalyses.length;
    
    if (totalTasks === 0) {
      return {
        averageComplexity: 0,
        totalEstimatedHours: 0,
        highRiskTasks: 0,
        complexityDistribution: { low: 0, medium: 0, high: 0 },
        effortDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const avgComplexity = taskAnalyses.reduce((sum, analysis) => sum + analysis.complexity.overall, 0) / totalTasks;
    const totalHours = taskAnalyses.reduce((sum, analysis) => sum + analysis.timeEstimate.adjustedHours, 0);
    const highRiskTasks = taskAnalyses.filter(analysis => analysis.complexity.risk >= 7).length;
    
    const complexityDistribution = { low: 0, medium: 0, high: 0 };
    const effortDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    taskAnalyses.forEach(analysis => {
      const complexity = analysis.complexity.overall;
      if (complexity <= 3) complexityDistribution.low++;
      else if (complexity <= 6) complexityDistribution.medium++;
      else complexityDistribution.high++;
      
      const effort = analysis.effort.adjustedEstimate;
      effortDistribution[effort] = (effortDistribution[effort] || 0) + 1;
    });
    
    return {
      averageComplexity: Math.round(avgComplexity * 10) / 10,
      totalEstimatedHours: totalHours,
      highRiskTasks,
      complexityDistribution,
      effortDistribution
    };
  },
  
  generateAnalysisSummary(analysisResults) {
    const { taskAnalyses, overallMetrics } = analysisResults;
    
    let summary = `# Complexity Analysis Summary\\n\\n`;
    summary += `**Analysis Date:** ${new Date(analysisResults.analyzedAt).toLocaleString()}\\n`;
    summary += `**Tasks Analyzed:** ${taskAnalyses.length}\\n`;
    summary += `**Analysis Type:** ${analysisResults.analysisType}\\n`;
    summary += `**Team Experience:** ${analysisResults.teamExperience}\\n\\n`;
    
    summary += `## Overall Metrics\\n`;
    summary += `- **Average Complexity:** ${overallMetrics.averageComplexity}/10\\n`;
    summary += `- **Total Estimated Hours:** ${overallMetrics.totalEstimatedHours}\\n`;
    summary += `- **High Risk Tasks:** ${overallMetrics.highRiskTasks}\\n\\n`;
    
    summary += `## Complexity Distribution\\n`;
    summary += `- **Low (1-3):** ${overallMetrics.complexityDistribution.low} tasks\\n`;
    summary += `- **Medium (4-6):** ${overallMetrics.complexityDistribution.medium} tasks\\n`;
    summary += `- **High (7-10):** ${overallMetrics.complexityDistribution.high} tasks\\n\\n`;
    
    // Highlight most complex tasks
    const complexTasks = taskAnalyses
      .filter(analysis => analysis.complexity.overall >= 7)
      .sort((a, b) => b.complexity.overall - a.complexity.overall)
      .slice(0, 5);
    
    if (complexTasks.length > 0) {
      summary += `## Most Complex Tasks\\n`;
      complexTasks.forEach((analysis, index) => {
        const task = taskAnalyses.find(t => t.taskId === analysis.taskId);
        summary += `${index + 1}. **${analysis.taskId}** (Complexity: ${analysis.complexity.overall}/10, ${analysis.timeEstimate.adjustedHours}h)\\n`;
      });
      summary += '\\n';
    }
    
    // Key recommendations
    const allRecommendations = taskAnalyses
      .flatMap(analysis => analysis.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index)
      .slice(0, 5);
    
    if (allRecommendations.length > 0) {
      summary += `## Key Recommendations\\n`;
      allRecommendations.forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\\n`;
      });
    }
    
    return summary;
  },
  
  async generateComplexityReport(analysisResults, metadata) {
    let report = `# Detailed Complexity Analysis Report\\n\\n`;
    
    report += `**Project:** ${metadata?.projectName || 'Unknown'}\\n`;
    report += `**Analysis Date:** ${new Date(analysisResults.analyzedAt).toLocaleString()}\\n`;
    report += `**Analysis Type:** ${analysisResults.analysisType}\\n`;
    report += `**Team Experience:** ${analysisResults.teamExperience}\\n`;
    report += `**Factors Analyzed:** ${analysisResults.factors.join(', ')}\\n\\n`;
    
    // Executive summary
    report += `## Executive Summary\\n\\n`;
    report += `This report analyzes ${analysisResults.taskAnalyses.length} tasks for complexity, effort, and risk factors. `;
    
    const { overallMetrics } = analysisResults;
    if (overallMetrics.averageComplexity >= 7) {
      report += `The project shows **high overall complexity** (${overallMetrics.averageComplexity}/10) requiring experienced team members and careful planning.\\n\\n`;
    } else if (overallMetrics.averageComplexity >= 4) {
      report += `The project shows **moderate complexity** (${overallMetrics.averageComplexity}/10) suitable for mixed-experience teams with proper guidance.\\n\\n`;
    } else {
      report += `The project shows **low to moderate complexity** (${overallMetrics.averageComplexity}/10) appropriate for most development teams.\\n\\n`;
    }
    
    // Detailed task analysis
    report += `## Task Analysis\\n\\n`;
    
    analysisResults.taskAnalyses.forEach(analysis => {
      report += `### Task: ${analysis.taskId}\\n`;
      report += `- **Overall Complexity:** ${analysis.complexity.overall}/10\\n`;
      report += `- **Adjusted Effort:** ${analysis.effort.adjustedEstimate}/5 (was ${analysis.effort.originalEstimate}/5)\\n`;
      report += `- **Adjusted Time:** ${analysis.timeEstimate.adjustedHours}h (was ${analysis.timeEstimate.originalHours}h)\\n`;
      report += `- **Confidence:** ${analysis.effort.confidenceLevel}\\n`;
      
      if (analysis.risks.length > 0) {
        report += `- **Key Risks:** ${analysis.risks.map(r => r.description).join('; ')}\\n`;
      }
      
      if (analysis.recommendations.length > 0) {
        report += `- **Recommendations:** ${analysis.recommendations.join('; ')}\\n`;
      }
      
      report += '\\n';
    });
    
    report += `---\\n*Generated by SA Complexity Analysis System*\\n`;
    
    return report;
  }
};