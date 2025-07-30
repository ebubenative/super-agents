import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_stakeholder_analysis MCP Tool
 * Stakeholder analysis with identification, influence/interest mapping, and communication planning
 */
export const saStakeholderAnalysis = {
  name: 'sa_stakeholder_analysis',
  description: 'Conduct comprehensive stakeholder analysis with identification, influence/interest mapping, communication planning, and stakeholder management workflows',
  category: 'pm',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        description: 'Name of the project for stakeholder analysis',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      stakeholders: {
        type: 'array',
        description: 'Known stakeholders',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            organization: { type: 'string' },
            influence: { type: 'string', enum: ['very-high', 'high', 'medium', 'low', 'very-low'] },
            interest: { type: 'string', enum: ['very-high', 'high', 'medium', 'low', 'very-low'] },
            attitude: { type: 'string', enum: ['champion', 'supporter', 'neutral', 'critic', 'blocker'] },
            contactInfo: { type: 'string' },
            preferredCommunication: { type: 'string', enum: ['email', 'meetings', 'slack', 'phone', 'formal-reports'] },
            availability: { type: 'string' },
            expertise: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } },
            expectations: { type: 'array', items: { type: 'string' } }
          },
          required: ['name', 'role']
        }
      },
      projectPhase: {
        type: 'string',
        description: 'Current project phase',
        enum: ['initiation', 'planning', 'execution', 'monitoring', 'closure'],
        default: 'planning'
      },
      analysisType: {
        type: 'string',
        description: 'Type of stakeholder analysis',
        enum: ['comprehensive', 'influence-interest', 'communication-focused', 'risk-assessment'],
        default: 'comprehensive'
      },
      communicationNeeds: {
        type: 'object',
        description: 'Communication requirements',
        properties: {
          frequency: { type: 'string', enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'as-needed'] },
          formality: { type: 'string', enum: ['formal', 'semi-formal', 'informal'] },
          channels: { type: 'array', items: { type: 'string' } },
          reportingStructure: { type: 'string' }
        }
      },
      riskFactors: {
        type: 'array',
        description: 'Known stakeholder-related risks',
        items: {
          type: 'object',
          properties: {
            stakeholder: { type: 'string' },
            risk: { type: 'string' },
            probability: { type: 'string', enum: ['very-high', 'high', 'medium', 'low', 'very-low'] },
            impact: { type: 'string', enum: ['very-high', 'high', 'medium', 'low', 'very-low'] },
            mitigation: { type: 'string' }
          }
        }
      },
      generateCommunicationPlan: {
        type: 'boolean',
        description: 'Generate detailed communication plan',
        default: true
      }
    },
    required: ['projectName']
  },

  validate(args) {
    const errors = [];
    
    if (!args.projectName || typeof args.projectName !== 'string') {
      errors.push('projectName is required and must be a string');
    }
    
    if (args.projectName && args.projectName.trim().length === 0) {
      errors.push('projectName cannot be empty');
    }
    
    if (args.stakeholders && !Array.isArray(args.stakeholders)) {
      errors.push('stakeholders must be an array');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const projectName = args.projectName.trim();
    
    try {
      const analysisContext = {
        projectName,
        projectPhase: args.projectPhase || 'planning',
        analysisType: args.analysisType || 'comprehensive',
        stakeholders: args.stakeholders || [],
        communicationNeeds: args.communicationNeeds || {},
        riskFactors: args.riskFactors || [],
        generateCommunicationPlan: args.generateCommunicationPlan !== false,
        timestamp: new Date().toISOString(),
        analyst: context?.userId || 'system',
        analysisId: `stakeholder-analysis-${Date.now()}`
      };

      // Stakeholder identification and categorization
      const stakeholderMapping = await this.createStakeholderMapping(analysisContext);
      
      // Influence/Interest analysis
      const influenceInterestAnalysis = await this.conductInfluenceInterestAnalysis(analysisContext, stakeholderMapping);
      
      // Communication planning
      let communicationPlan = null;
      if (analysisContext.generateCommunicationPlan) {
        communicationPlan = await this.createCommunicationPlan(analysisContext, influenceInterestAnalysis);
      }
      
      // Risk assessment
      const riskAssessment = await this.assessStakeholderRisks(analysisContext, influenceInterestAnalysis);
      
      // Management strategies
      const managementStrategies = await this.developManagementStrategies(analysisContext, influenceInterestAnalysis, riskAssessment);
      
      // Format output
      const output = await this.formatStakeholderAnalysisOutput(
        analysisContext, 
        stakeholderMapping, 
        influenceInterestAnalysis, 
        communicationPlan, 
        riskAssessment, 
        managementStrategies
      );
      
      // Save analysis
      await this.saveStakeholderAnalysisToProject(projectPath, analysisContext, {
        stakeholderMapping,
        influenceInterestAnalysis,
        communicationPlan,
        riskAssessment,
        managementStrategies
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          projectName,
          stakeholderCount: analysisContext.stakeholders.length,
          analysisType: args.analysisType,
          projectPhase: args.projectPhase,
          generateCommunicationPlan: args.generateCommunicationPlan,
          analysisId: analysisContext.analysisId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to conduct stakeholder analysis for ${projectName}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, projectName, projectPath }
      };
    }
  },

  async createStakeholderMapping(context) {
    const mapping = {
      categories: {
        internal: { stakeholders: [], description: 'Internal team members and organizational stakeholders' },
        external: { stakeholders: [], description: 'External partners, vendors, and customers' },
        users: { stakeholders: [], description: 'End users and user representatives' },
        governance: { stakeholders: [], description: 'Decision makers and approval authorities' },
        technical: { stakeholders: [], description: 'Technical subject matter experts' },
        business: { stakeholders: [], description: 'Business stakeholders and process owners' }
      },
      identificationFramework: {
        questions: [
          'Who will be affected by this project?',
          'Who has decision-making authority?',
          'Who controls resources needed for the project?',
          'Who has expertise critical to success?',
          'Who can influence project outcomes?',
          'Who will use the project deliverables?',
          'Who has expressed interest in the project?',
          'Who might resist or oppose the project?'
        ],
        methods: [
          'Brainstorming sessions',
          'Organizational chart review',
          'Previous project stakeholder lists',
          'Expert interviews',
          'Process mapping',
          'User research'
        ]
      },
      completenessCheck: {}
    };

    // Categorize existing stakeholders
    context.stakeholders.forEach(stakeholder => {
      const categories = this.categorizeStakeholder(stakeholder);
      categories.forEach(category => {
        if (mapping.categories[category]) {
          mapping.categories[category].stakeholders.push(stakeholder);
        }
      });
    });

    // Check completeness of stakeholder information
    mapping.completenessCheck = context.stakeholders.reduce((acc, stakeholder) => {
      acc[stakeholder.name] = {
        hasInfluence: !!stakeholder.influence,
        hasInterest: !!stakeholder.interest,
        hasAttitude: !!stakeholder.attitude,
        hasContact: !!stakeholder.contactInfo,
        hasCommunicationPrefs: !!stakeholder.preferredCommunication,
        hasExpectations: !!(stakeholder.expectations && stakeholder.expectations.length > 0),
        hasConcerns: !!(stakeholder.concerns && stakeholder.concerns.length > 0),
        completeness: 0
      };
      
      const checks = Object.values(acc[stakeholder.name]).slice(0, -1);
      acc[stakeholder.name].completeness = checks.filter(Boolean).length / checks.length;
      
      return acc;
    }, {});

    return mapping;
  },

  categorizeStakeholder(stakeholder) {
    const categories = [];
    
    // Basic categorization based on role and organization
    if (stakeholder.organization && stakeholder.organization.toLowerCase().includes('external')) {
      categories.push('external');
    } else {
      categories.push('internal');
    }
    
    // Role-based categorization
    const role = stakeholder.role.toLowerCase();
    if (role.includes('user') || role.includes('customer')) {
      categories.push('users');
    }
    if (role.includes('manager') || role.includes('director') || role.includes('executive')) {
      categories.push('governance');
    }
    if (role.includes('developer') || role.includes('architect') || role.includes('engineer')) {
      categories.push('technical');
    }
    if (role.includes('analyst') || role.includes('owner') || role.includes('sponsor')) {
      categories.push('business');
    }
    
    return categories;
  },

  async conductInfluenceInterestAnalysis(context, mapping) {
    const analysis = {
      matrix: {},
      quadrants: {
        'high-influence-high-interest': { stakeholders: [], strategy: 'Manage Closely' },
        'high-influence-low-interest': { stakeholders: [], strategy: 'Keep Satisfied' },
        'low-influence-high-interest': { stakeholders: [], strategy: 'Keep Informed' },
        'low-influence-low-interest': { stakeholders: [], strategy: 'Monitor' }
      },
      riskProfiles: {},
      engagementLevels: {}
    };

    // Map stakeholders to influence/interest matrix
    context.stakeholders.forEach(stakeholder => {
      const influence = this.convertToNumeric(stakeholder.influence || 'medium');
      const interest = this.convertToNumeric(stakeholder.interest || 'medium');
      
      analysis.matrix[stakeholder.name] = {
        influence,
        interest,
        attitude: stakeholder.attitude || 'neutral',
        quadrant: this.determineQuadrant(influence, interest)
      };
      
      // Add to appropriate quadrant
      const quadrant = analysis.matrix[stakeholder.name].quadrant;
      analysis.quadrants[quadrant].stakeholders.push(stakeholder);
      
      // Determine engagement level
      analysis.engagementLevels[stakeholder.name] = this.determineEngagementLevel(
        influence, 
        interest, 
        stakeholder.attitude || 'neutral'
      );
      
      // Create risk profile
      analysis.riskProfiles[stakeholder.name] = this.createStakeholderRiskProfile(stakeholder, influence, interest);
    });

    return analysis;
  },

  convertToNumeric(level) {
    const mapping = {
      'very-low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very-high': 5
    };
    return mapping[level] || 3;
  },

  determineQuadrant(influence, interest) {
    const highThreshold = 3.5;
    
    if (influence >= highThreshold && interest >= highThreshold) {
      return 'high-influence-high-interest';
    } else if (influence >= highThreshold && interest < highThreshold) {
      return 'high-influence-low-interest';
    } else if (influence < highThreshold && interest >= highThreshold) {
      return 'low-influence-high-interest';
    } else {
      return 'low-influence-low-interest';
    }
  },

  determineEngagementLevel(influence, interest, attitude) {
    const score = influence + interest;
    const attitudeMultiplier = {
      'champion': 1.2,
      'supporter': 1.1,
      'neutral': 1.0,
      'critic': 0.9,
      'blocker': 0.8
    };
    
    const adjustedScore = score * (attitudeMultiplier[attitude] || 1.0);
    
    if (adjustedScore >= 8) return 'high';
    if (adjustedScore >= 6) return 'medium';
    return 'low';
  },

  createStakeholderRiskProfile(stakeholder, influence, interest) {
    const risks = [];
    
    if (stakeholder.attitude === 'blocker' && influence >= 4) {
      risks.push({ type: 'blocking', severity: 'high', description: 'High influence blocker can derail project' });
    }
    
    if (stakeholder.attitude === 'critic' && interest >= 4) {
      risks.push({ type: 'criticism', severity: 'medium', description: 'High interest critic may create negative publicity' });
    }
    
    if (influence >= 4 && interest <= 2) {
      risks.push({ type: 'disengagement', severity: 'medium', description: 'High influence but low interest may lead to unexpected opposition' });
    }
    
    if (stakeholder.concerns && stakeholder.concerns.length > 0) {
      risks.push({ type: 'concerns', severity: 'low', description: `Has ${stakeholder.concerns.length} documented concerns` });
    }
    
    return {
      riskLevel: risks.length > 0 ? Math.max(...risks.map(r => r.severity === 'high' ? 3 : r.severity === 'medium' ? 2 : 1)) : 1,
      risks
    };
  },

  async createCommunicationPlan(context, analysis) {
    const plan = {
      overview: {
        frequency: context.communicationNeeds.frequency || 'weekly',
        formality: context.communicationNeeds.formality || 'semi-formal',
        primaryChannels: context.communicationNeeds.channels || ['email', 'meetings']
      },
      stakeholderPlans: {},
      templates: {},
      schedule: {},
      escalationPaths: {}
    };

    // Create individual communication plans for each stakeholder
    context.stakeholders.forEach(stakeholder => {
      const quadrant = analysis.matrix[stakeholder.name].quadrant;
      const engagementLevel = analysis.engagementLevels[stakeholder.name];
      
      plan.stakeholderPlans[stakeholder.name] = {
        frequency: this.determineCommunicationFrequency(quadrant, engagementLevel),
        methods: this.determineCommunicationMethods(stakeholder, quadrant),
        content: this.determineCommunicationContent(stakeholder, quadrant),
        owner: this.determineCommunicationOwner(stakeholder, context),
        timing: this.determineCommunicationTiming(stakeholder, context.projectPhase)
      };
    });

    // Create communication templates
    plan.templates = {
      'status-update': {
        purpose: 'Regular project status updates',
        audience: 'All stakeholders',
        frequency: 'Weekly',
        format: 'Email/Report',
        sections: ['Progress Summary', 'Upcoming Milestones', 'Issues & Risks', 'Action Items']
      },
      'decision-request': {
        purpose: 'Request decisions from governance stakeholders',
        audience: 'Decision makers',
        frequency: 'As needed',
        format: 'Formal document',
        sections: ['Decision Required', 'Options Analysis', 'Recommendation', 'Timeline']
      },
      'issue-escalation': {
        purpose: 'Escalate critical issues',
        audience: 'High influence stakeholders',
        frequency: 'As needed',
        format: 'Urgent communication',
        sections: ['Issue Description', 'Impact Analysis', 'Proposed Resolution', 'Support Needed']
      }
    };

    return plan;
  },

  determineCommunicationFrequency(quadrant, engagementLevel) {
    const frequencyMap = {
      'high-influence-high-interest': 'weekly',
      'high-influence-low-interest': 'bi-weekly',
      'low-influence-high-interest': 'weekly',
      'low-influence-low-interest': 'monthly'
    };
    return frequencyMap[quadrant] || 'bi-weekly';
  },

  determineCommunicationMethods(stakeholder, quadrant) {
    const preferredMethod = stakeholder.preferredCommunication || 'email';
    const methods = [preferredMethod];
    
    if (quadrant.includes('high-influence')) {
      methods.push('meetings');
    }
    
    if (quadrant.includes('high-interest')) {
      methods.push('detailed-reports');
    }
    
    return [...new Set(methods)];
  },

  determineCommunicationContent(stakeholder, quadrant) {
    const baseContent = ['project-status', 'upcoming-milestones'];
    
    if (quadrant.includes('high-influence')) {
      baseContent.push('decisions-needed', 'budget-status', 'resource-requests');
    }
    
    if (quadrant.includes('high-interest')) {
      baseContent.push('detailed-progress', 'technical-updates', 'user-impact');
    }
    
    if (stakeholder.expertise && stakeholder.expertise.length > 0) {
      baseContent.push('technical-deep-dives');
    }
    
    return baseContent;
  },

  determineCommunicationOwner(stakeholder, context) {
    // Simple logic - could be enhanced based on organizational structure
    const role = stakeholder.role.toLowerCase();
    
    if (role.includes('executive') || role.includes('director')) {
      return 'Project Sponsor';
    } else if (role.includes('user') || role.includes('customer')) {
      return 'Product Manager';
    } else if (role.includes('technical') || role.includes('developer')) {
      return 'Technical Lead';
    } else {
      return 'Project Manager';
    }
  },

  determineCommunicationTiming(stakeholder, projectPhase) {
    const timing = {
      'initiation': 'Project kickoff and role clarification',
      'planning': 'Requirements validation and plan review',
      'execution': 'Regular progress updates and issue resolution',
      'monitoring': 'Performance review and adjustment planning',
      'closure': 'Final deliverable review and lessons learned'
    };
    
    return timing[projectPhase] || 'Regular project updates';
  },

  async assessStakeholderRisks(context, analysis) {
    const assessment = {
      riskMatrix: {},
      mitigation: {},
      contingency: {},
      monitoring: {}
    };

    // Analyze risks for each stakeholder
    Object.entries(analysis.riskProfiles).forEach(([stakeholderName, profile]) => {
      const stakeholder = context.stakeholders.find(s => s.name === stakeholderName);
      
      assessment.riskMatrix[stakeholderName] = {
        riskLevel: profile.riskLevel,
        risks: profile.risks,
        impact: this.assessRiskImpact(stakeholder, analysis.matrix[stakeholderName]),
        probability: this.assessRiskProbability(stakeholder, context.projectPhase),
        mitigation: this.suggestRiskMitigation(stakeholder, profile.risks)
      };
    });

    return assessment;
  },

  assessRiskImpact(stakeholder, matrixData) {
    const influenceWeight = matrixData.influence / 5;
    const attitudeWeight = {
      'champion': 0.1,
      'supporter': 0.3,
      'neutral': 0.5,
      'critic': 0.7,
      'blocker': 0.9
    }[matrixData.attitude] || 0.5;
    
    return Math.round((influenceWeight + attitudeWeight) * 5);
  },

  assessRiskProbability(stakeholder, projectPhase) {
    // Simple probability assessment - could be enhanced
    let baseProbability = 3;
    
    if (stakeholder.attitude === 'blocker') baseProbability += 2;
    if (stakeholder.attitude === 'critic') baseProbability += 1;
    if (stakeholder.concerns && stakeholder.concerns.length > 2) baseProbability += 1;
    if (projectPhase === 'execution') baseProbability += 1;
    
    return Math.min(5, baseProbability);
  },

  suggestRiskMitigation(stakeholder, risks) {
    const mitigations = [];
    
    risks.forEach(risk => {
      switch (risk.type) {
        case 'blocking':
          mitigations.push('Early engagement and alignment sessions');
          mitigations.push('Involve in decision-making process');
          break;
        case 'criticism':
          mitigations.push('Regular communication and feedback sessions');
          mitigations.push('Address concerns proactively');
          break;
        case 'disengagement':
          mitigations.push('Targeted engagement activities');
          mitigations.push('Demonstrate value and relevance');
          break;
        case 'concerns':
          mitigations.push('Address documented concerns explicitly');
          break;
      }
    });
    
    return [...new Set(mitigations)];
  },

  async developManagementStrategies(context, analysis, riskAssessment) {
    const strategies = {
      byQuadrant: {},
      individual: {},
      overall: {}
    };

    // Strategies by quadrant
    Object.entries(analysis.quadrants).forEach(([quadrant, data]) => {
      strategies.byQuadrant[quadrant] = {
        strategy: data.strategy,
        tactics: this.getQuadrantTactics(quadrant),
        stakeholders: data.stakeholders.length,
        priority: this.getQuadrantPriority(quadrant)
      };
    });

    // Individual strategies
    context.stakeholders.forEach(stakeholder => {
      const matrixData = analysis.matrix[stakeholder.name];
      const riskData = riskAssessment.riskMatrix[stakeholder.name];
      
      strategies.individual[stakeholder.name] = {
        primaryStrategy: this.getPrimaryStrategy(matrixData, stakeholder),
        engagementActivities: this.getEngagementActivities(stakeholder, matrixData),
        successMetrics: this.getSuccessMetrics(stakeholder, matrixData),
        reviewSchedule: this.getReviewSchedule(matrixData.quadrant)
      };
    });

    return strategies;
  },

  getQuadrantTactics(quadrant) {
    const tactics = {
      'high-influence-high-interest': [
        'Regular one-on-one meetings',
        'Involve in key decisions',
        'Provide detailed updates',
        'Seek input and feedback actively'
      ],
      'high-influence-low-interest': [
        'Executive summaries',
        'Focus on business impact',
        'Minimal but quality interactions',
        'Alert to critical issues only'
      ],
      'low-influence-high-interest': [
        'Detailed project updates',
        'Include in working groups',
        'Regular communication',
        'Leverage as project advocates'
      ],
      'low-influence-low-interest': [
        'Periodic updates',
        'Mass communications',
        'Monitor for changes',
        'Minimal resource investment'
      ]
    };
    
    return tactics[quadrant] || [];
  },

  getQuadrantPriority(quadrant) {
    const priorities = {
      'high-influence-high-interest': 'critical',
      'high-influence-low-interest': 'high',
      'low-influence-high-interest': 'medium',
      'low-influence-low-interest': 'low'
    };
    
    return priorities[quadrant] || 'medium';
  },

  getPrimaryStrategy(matrixData, stakeholder) {
    const strategies = {
      'high-influence-high-interest': 'Partnership and Collaboration',
      'high-influence-low-interest': 'Satisfaction and Approval',
      'low-influence-high-interest': 'Information and Engagement',
      'low-influence-low-interest': 'Monitoring and Awareness'
    };
    
    let baseStrategy = strategies[matrixData.quadrant];
    
    if (stakeholder.attitude === 'blocker') {
      baseStrategy += ' with Resistance Management';
    } else if (stakeholder.attitude === 'champion') {
      baseStrategy += ' with Advocacy Leverage';
    }
    
    return baseStrategy;
  },

  getEngagementActivities(stakeholder, matrixData) {
    const activities = [];
    
    if (matrixData.quadrant.includes('high-influence')) {
      activities.push('Executive briefings', 'Strategic alignment sessions');
    }
    
    if (matrixData.quadrant.includes('high-interest')) {
      activities.push('Working group participation', 'Regular check-ins');
    }
    
    if (stakeholder.expertise && stakeholder.expertise.length > 0) {
      activities.push('Subject matter expert consultations');
    }
    
    if (stakeholder.attitude === 'critic' || stakeholder.attitude === 'blocker') {
      activities.push('Concern resolution sessions', 'Change management activities');
    }
    
    return activities;
  },

  getSuccessMetrics(stakeholder, matrixData) {
    const metrics = ['Engagement level', 'Communication responsiveness'];
    
    if (matrixData.quadrant.includes('high-influence')) {
      metrics.push('Decision support', 'Resource provision');
    }
    
    if (matrixData.quadrant.includes('high-interest')) {
      metrics.push('Participation rate', 'Feedback quality');
    }
    
    if (stakeholder.attitude === 'critic' || stakeholder.attitude === 'blocker') {
      metrics.push('Attitude improvement', 'Concern resolution');
    }
    
    return metrics;
  },

  getReviewSchedule(quadrant) {
    const schedules = {
      'high-influence-high-interest': 'Weekly',
      'high-influence-low-interest': 'Bi-weekly',
      'low-influence-high-interest': 'Bi-weekly',
      'low-influence-low-interest': 'Monthly'
    };
    
    return schedules[quadrant] || 'Monthly';
  },

  async formatStakeholderAnalysisOutput(context, mapping, analysis, communicationPlan, riskAssessment, strategies) {
    let output = `👥 **Stakeholder Analysis: ${context.projectName}**\n\n`;
    output += `📊 **Analysis Type:** ${context.analysisType}\n`;
    output += `🏗️ **Project Phase:** ${context.projectPhase}\n`;
    output += `👥 **Stakeholders Analyzed:** ${context.stakeholders.length}\n`;
    output += `📅 **Analysis Date:** ${new Date(context.timestamp).toLocaleDateString()}\n\n`;

    // Stakeholder Categories
    output += `## 📂 Stakeholder Categories\n\n`;
    Object.entries(mapping.categories).forEach(([category, data]) => {
      if (data.stakeholders.length > 0) {
        output += `**${category.charAt(0).toUpperCase() + category.slice(1)}** (${data.stakeholders.length})\n`;
        output += `*${data.description}*\n`;
        data.stakeholders.forEach(stakeholder => {
          output += `• ${stakeholder.name} - ${stakeholder.role}\n`;
        });
        output += '\n';
      }
    });

    // Influence/Interest Matrix
    output += `## 📊 Influence/Interest Matrix\n\n`;
    Object.entries(analysis.quadrants).forEach(([quadrant, data]) => {
      if (data.stakeholders.length > 0) {
        const quadrantName = quadrant.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        output += `**${quadrantName}** - ${data.strategy} (${data.stakeholders.length})\n`;
        output += `*Priority: ${strategies.byQuadrant[quadrant].priority}*\n`;
        data.stakeholders.forEach(stakeholder => {
          const matrixData = analysis.matrix[stakeholder.name];
          output += `• ${stakeholder.name} (I:${matrixData.influence}, Int:${matrixData.interest}, ${matrixData.attitude})\n`;
        });
        output += '\n';
      }
    });

    // High Priority Stakeholders
    const highPriorityStakeholders = context.stakeholders.filter(s => {
      const matrixData = analysis.matrix[s.name];
      return matrixData && matrixData.quadrant.includes('high-influence');
    });

    if (highPriorityStakeholders.length > 0) {
      output += `## ⭐ High Priority Stakeholders\n\n`;
      highPriorityStakeholders.forEach(stakeholder => {
        const matrixData = analysis.matrix[stakeholder.name];
        const riskData = riskAssessment.riskMatrix[stakeholder.name];
        
        output += `**${stakeholder.name}** - ${stakeholder.role}\n`;
        output += `*Strategy: ${strategies.individual[stakeholder.name].primaryStrategy}*\n`;
        output += `*Risk Level: ${riskData.riskLevel}/5*\n`;
        
        if (stakeholder.expectations && stakeholder.expectations.length > 0) {
          output += `*Expectations: ${stakeholder.expectations.join(', ')}*\n`;
        }
        
        if (stakeholder.concerns && stakeholder.concerns.length > 0) {
          output += `*Concerns: ${stakeholder.concerns.join(', ')}*\n`;
        }
        output += '\n';
      });
    }

    // Communication Plan Summary
    if (communicationPlan) {
      output += `## 📢 Communication Plan Summary\n\n`;
      output += `**Overall Frequency:** ${communicationPlan.overview.frequency}\n`;
      output += `**Formality Level:** ${communicationPlan.overview.formality}\n`;
      output += `**Primary Channels:** ${communicationPlan.overview.primaryChannels.join(', ')}\n\n`;
      
      output += `**Key Communication Templates:**\n`;
      Object.entries(communicationPlan.templates).forEach(([template, details]) => {
        output += `• **${template}:** ${details.purpose} (${details.frequency})\n`;
      });
      output += '\n';
    }

    // Risk Assessment Summary
    const highRiskStakeholders = Object.entries(riskAssessment.riskMatrix)
      .filter(([, data]) => data.riskLevel >= 4)
      .map(([name]) => name);

    if (highRiskStakeholders.length > 0) {
      output += `## ⚠️ High Risk Stakeholders\n\n`;
      highRiskStakeholders.forEach(stakeholderName => {
        const riskData = riskAssessment.riskMatrix[stakeholderName];
        output += `**${stakeholderName}** - Risk Level: ${riskData.riskLevel}/5\n`;
        
        riskData.risks.forEach(risk => {
          output += `• ${risk.description} (${risk.severity})\n`;
        });
        
        if (riskData.mitigation.length > 0) {
          output += `*Mitigation: ${riskData.mitigation.join('; ')}*\n`;
        }
        output += '\n';
      });
    }

    // Management Strategies
    output += `## 🎯 Management Strategies by Quadrant\n\n`;
    Object.entries(strategies.byQuadrant).forEach(([quadrant, strategy]) => {
      if (strategy.stakeholders > 0) {
        const quadrantName = quadrant.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        output += `**${quadrantName}** (${strategy.stakeholders} stakeholders)\n`;
        output += `*Strategy: ${strategy.strategy}*\n`;
        output += `*Priority: ${strategy.priority}*\n`;
        output += `*Key Tactics:*\n`;
        strategy.tactics.forEach(tactic => {
          output += `  - ${tactic}\n`;
        });
        output += '\n';
      }
    });

    // Action Items
    output += `## 🚀 Next Steps & Action Items\n\n`;
    output += `**Immediate Actions (This Week):**\n`;
    output += `• Schedule meetings with high-influence stakeholders\n`;
    output += `• Set up communication channels and schedules\n`;
    output += `• Address any critical concerns identified\n\n`;
    
    output += `**Short-term Actions (Next 2 Weeks):**\n`;
    output += `• Implement communication plan\n`;
    output += `• Begin risk mitigation activities\n`;
    output += `• Establish regular review cycles\n\n`;
    
    output += `**Ongoing Activities:**\n`;
    output += `• Monitor stakeholder engagement and satisfaction\n`;
    output += `• Update analysis as project progresses\n`;
    output += `• Adjust strategies based on stakeholder feedback\n\n`;

    output += `💡 **Stakeholder Management Tips:**\n`;
    output += `• Proactive communication prevents most issues\n`;
    output += `• Regular stakeholder reviews catch changes early\n`;
    output += `• Document all stakeholder interactions\n`;
    output += `• Tailor communication style to each stakeholder\n`;
    output += `• Address concerns before they become risks\n\n`;

    output += `📁 **Stakeholder analysis and communication plan saved to project.**`;

    return output;
  },

  async saveStakeholderAnalysisToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const stakeholderDir = join(saDir, 'stakeholder-analysis');
      if (!existsSync(stakeholderDir)) {
        require('fs').mkdirSync(stakeholderDir, { recursive: true });
      }
      
      const filename = `stakeholder-analysis-${context.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(stakeholderDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save stakeholder analysis:', error.message);
    }
  }
};