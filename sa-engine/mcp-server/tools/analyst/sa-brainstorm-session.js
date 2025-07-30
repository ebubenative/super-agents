import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_brainstorm_session MCP Tool
 * Facilitated brainstorming with idea collection, organization, and synthesis
 */
export const saBrainstormSession = {
  name: 'sa_brainstorm_session',
  description: 'Facilitate structured brainstorming sessions with idea collection, organization, session progress tracking, and output synthesis',
  category: 'analyst',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Topic or challenge for brainstorming',
        minLength: 1
      },
      sessionType: {
        type: 'string',
        description: 'Type of brainstorming session',
        enum: ['creative-ideation', 'problem-solving', 'feature-brainstorm', 'strategic-planning', 'risk-assessment', 'opportunity-exploration'],
        default: 'creative-ideation'
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      participants: {
        type: 'array',
        description: 'List of brainstorming participants',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            expertise: { type: 'string' }
          },
          required: ['name', 'role']
        }
      },
      duration: {
        type: 'integer',
        description: 'Session duration in minutes',
        minimum: 15,
        maximum: 240,
        default: 60
      },
      technique: {
        type: 'string',
        description: 'Brainstorming technique to use',
        enum: ['mind-mapping', 'six-thinking-hats', 'scamper', 'brainwriting', 'rapid-ideation', 'affinity-mapping', 'crazy-8s'],
        default: 'rapid-ideation'
      },
      context: {
        type: 'object',
        description: 'Additional context for the session',
        properties: {
          background: { type: 'string' },
          constraints: { type: 'array', items: { type: 'string' } },
          goals: { type: 'array', items: { type: 'string' } },
          successCriteria: { type: 'string' }
        }
      },
      facilitationMode: {
        type: 'string',
        description: 'Level of facilitation guidance',
        enum: ['guided', 'structured', 'freestyle'],
        default: 'structured'
      },
      outputFormat: {
        type: 'string',
        description: 'Format for session output',
        enum: ['detailed-report', 'action-items', 'idea-catalog', 'mind-map'],
        default: 'detailed-report'
      }
    },
    required: ['topic']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.topic || typeof args.topic !== 'string') {
      errors.push('topic is required and must be a string');
    }
    
    if (args.topic && args.topic.trim().length === 0) {
      errors.push('topic cannot be empty');
    }
    
    if (args.duration && (typeof args.duration !== 'number' || args.duration < 15 || args.duration > 240)) {
      errors.push('duration must be a number between 15 and 240 minutes');
    }
    
    if (args.participants && !Array.isArray(args.participants)) {
      errors.push('participants must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute brainstorming session
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const topic = args.topic.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      // Prepare session context
      const sessionContext = {
        topic,
        sessionType: args.sessionType || 'creative-ideation',
        technique: args.technique || 'rapid-ideation',
        duration: args.duration || 60,
        participants: args.participants || [],
        context: args.context || {},
        facilitationMode: args.facilitationMode || 'structured',
        outputFormat: args.outputFormat || 'detailed-report',
        timestamp: new Date().toISOString(),
        facilitator: context?.userId || 'system',
        sessionId: `brainstorm-${Date.now()}`
      };
      
      // Load brainstorming template
      const brainstormTemplate = await this.loadBrainstormTemplate(templateEngine);
      
      // Create session structure
      const sessionStructure = await this.createSessionStructure(sessionContext, brainstormTemplate);
      
      // Generate facilitation guide
      const facilitationGuide = await this.generateFacilitationGuide(sessionContext, sessionStructure);
      
      // Create session tracking framework
      const trackingFramework = await this.createTrackingFramework(sessionContext);
      
      // Format output based on facilitation mode
      let output;
      switch (sessionContext.facilitationMode) {
        case 'guided':
          output = await this.formatGuidedOutput(sessionContext, sessionStructure, facilitationGuide, trackingFramework);
          break;
        case 'freestyle':
          output = await this.formatFreestyleOutput(sessionContext, sessionStructure, facilitationGuide);
          break;
        default:
          output = await this.formatStructuredOutput(sessionContext, sessionStructure, facilitationGuide, trackingFramework);
      }
      
      // Save session to project
      await this.saveSessionToProject(projectPath, sessionContext, sessionStructure, facilitationGuide);
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          topic,
          sessionType: args.sessionType,
          technique: args.technique,
          duration: args.duration,
          participantCount: sessionContext.participants.length,
          facilitationMode: args.facilitationMode,
          sessionId: sessionContext.sessionId,
          duration: duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to setup brainstorming session for "${topic}": ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          topic,
          projectPath
        }
      };
    }
  },

  /**
   * Load brainstorming template
   * @param {TemplateEngine} templateEngine - Template engine instance
   * @returns {Promise<Object>} Brainstorming template
   */
  async loadBrainstormTemplate(templateEngine) {
    try {
      const template = await templateEngine.getTemplate('brainstorming-output-tmpl.yaml');
      return template;
    } catch (error) {
      // Return default template
      return {
        name: 'Brainstorming Session Template',
        phases: ['diverge', 'converge', 'decide'],
        techniques: {
          'mind-mapping': {
            description: 'Visual idea mapping around central topic',
            duration: '20-30 minutes',
            steps: ['Start with central topic', 'Branch out with related ideas', 'Connect related concepts', 'Refine and organize']
          },
          'rapid-ideation': {
            description: 'Fast-paced idea generation',
            duration: '15-20 minutes', 
            steps: ['Set timer', 'Generate ideas quickly', 'No judgment', 'Build on others\' ideas']
          },
          'six-thinking-hats': {
            description: 'Structured thinking from different perspectives',
            duration: '30-45 minutes',
            steps: ['White hat - Facts', 'Red hat - Emotions', 'Black hat - Caution', 'Yellow hat - Optimism', 'Green hat - Creativity', 'Blue hat - Process']
          }
        }
      };
    }
  },

  /**
   * Create session structure
   * @param {Object} context - Session context
   * @param {Object} template - Brainstorming template
   * @returns {Promise<Object>} Session structure
   */
  async createSessionStructure(context, template) {
    const structure = {
      sessionInfo: {
        id: context.sessionId,
        topic: context.topic,
        type: context.sessionType,
        technique: context.technique,
        duration: context.duration,
        facilitationMode: context.facilitationMode
      },
      phases: [],
      timeAllocations: {}
    };
    
    // Create phases based on technique
    switch (context.technique) {
      case 'mind-mapping':
        structure.phases = [
          {
            id: 'setup',
            name: 'Session Setup',
            duration: 5,
            activities: ['Introduce participants', 'Explain rules', 'Set up materials']
          },
          {
            id: 'central-topic',
            name: 'Central Topic',
            duration: 5,
            activities: ['Place topic at center', 'Ensure understanding', 'Start first branches']
          },
          {
            id: 'ideation',
            name: 'Idea Generation',
            duration: Math.floor(context.duration * 0.6),
            activities: ['Branch out ideas', 'Connect concepts', 'Build on ideas']
          },
          {
            id: 'organization',
            name: 'Organization',
            duration: Math.floor(context.duration * 0.2),
            activities: ['Group related ideas', 'Identify themes', 'Prioritize branches']
          },
          {
            id: 'synthesis',
            name: 'Synthesis',
            duration: Math.floor(context.duration * 0.15),
            activities: ['Synthesize key insights', 'Identify action items', 'Plan next steps']
          }
        ];
        break;
        
      case 'six-thinking-hats':
        const hatDuration = Math.floor((context.duration - 10) / 6);
        structure.phases = [
          {
            id: 'setup',
            name: 'Session Setup',
            duration: 10,
            activities: ['Explain six thinking hats', 'Set ground rules', 'Clarify topic']
          },
          {
            id: 'white-hat',
            name: 'White Hat - Facts',
            duration: hatDuration,
            activities: ['Gather known facts', 'Identify information gaps', 'List what we know']
          },
          {
            id: 'red-hat',
            name: 'Red Hat - Emotions',
            duration: hatDuration,
            activities: ['Share gut feelings', 'Express emotions', 'Identify concerns']
          },
          {
            id: 'black-hat',
            name: 'Black Hat - Caution',
            duration: hatDuration,
            activities: ['Identify risks', 'Point out problems', 'Consider downsides']
          },
          {
            id: 'yellow-hat',
            name: 'Yellow Hat - Optimism',
            duration: hatDuration,
            activities: ['Find benefits', 'Identify opportunities', 'Explore positives']
          },
          {
            id: 'green-hat',
            name: 'Green Hat - Creativity',
            duration: hatDuration,
            activities: ['Generate new ideas', 'Think creatively', 'Propose alternatives']
          },
          {
            id: 'blue-hat',
            name: 'Blue Hat - Process',
            duration: hatDuration,
            activities: ['Synthesize insights', 'Plan next steps', 'Organize outcomes']
          }
        ];
        break;
        
      case 'rapid-ideation':
      default:
        structure.phases = [
          {
            id: 'warmup',
            name: 'Warm-up',
            duration: 5,
            activities: ['Quick introductions', 'Set energy', 'Explain rules']
          },
          {
            id: 'diverge',
            name: 'Divergent Thinking',
            duration: Math.floor(context.duration * 0.5),
            activities: ['Generate many ideas', 'No judgment', 'Build on others', 'Go for quantity']
          },
          {
            id: 'organize',
            name: 'Organize Ideas',
            duration: Math.floor(context.duration * 0.2),
            activities: ['Group similar ideas', 'Identify themes', 'Remove duplicates']
          },
          {
            id: 'converge',
            name: 'Convergent Thinking',
            duration: Math.floor(context.duration * 0.2),
            activities: ['Evaluate ideas', 'Prioritize options', 'Select best concepts']
          },
          {
            id: 'actionize',
            name: 'Action Planning',
            duration: Math.floor(context.duration * 0.1),
            activities: ['Define next steps', 'Assign owners', 'Set timelines']
          }
        ];
    }
    
    return structure;
  },

  /**
   * Generate facilitation guide
   * @param {Object} context - Session context
   * @param {Object} structure - Session structure
   * @returns {Promise<Object>} Facilitation guide
   */
  async generateFacilitationGuide(context, structure) {
    const guide = {
      preparation: {
        materials: this.getMaterialsList(context.technique),
        environment: this.getEnvironmentSetup(context),
        rules: this.getSessionRules(context.technique)
      },
      execution: {
        phases: structure.phases.map(phase => ({
          ...phase,
          facilitatorNotes: this.getFacilitatorNotes(phase, context),
          prompts: this.getPhasePrompts(phase, context),
          timeManagement: this.getTimeManagement(phase, context)
        }))
      },
      troubleshooting: this.getTroubleshootingGuide(context),
      synthesis: this.getSynthesisFramework(context)
    };
    
    return guide;
  },

  /**
   * Get materials list for technique
   * @param {string} technique - Brainstorming technique
   * @returns {Array} Materials list
   */
  getMaterialsList(technique) {
    const baseMaterials = ['Sticky notes', 'Markers', 'Flip chart paper', 'Timer'];
    
    switch (technique) {
      case 'mind-mapping':
        return [...baseMaterials, 'Large whiteboard', 'Colored pens', 'Connecting lines'];
      case 'six-thinking-hats':
        return [...baseMaterials, 'Hat cards or visuals', 'Thinking hat guide'];
      case 'affinity-mapping':
        return [...baseMaterials, 'Wall space', 'Dots for voting'];
      default:
        return baseMaterials;
    }
  },

  /**
   * Get environment setup requirements
   * @param {Object} context - Session context
   * @returns {Object} Environment setup
   */
  getEnvironmentSetup(context) {
    return {
      space: 'Open space for movement and collaboration',
      seating: 'Circular or U-shaped arrangement',
      lighting: 'Bright, energizing lighting',
      distractions: 'Remove or minimize distractions',
      technology: context.participants.length > 0 ? 'Digital collaboration tools if remote' : 'Minimal technology'
    };
  },

  /**
   * Get session rules
   * @param {string} technique - Brainstorming technique
   * @returns {Array} Session rules
   */
  getSessionRules(technique) {
    const baseRules = [
      'No criticism or judgment during ideation',
      'Build on others\' ideas',
      'Stay focused on the topic',
      'One conversation at a time',
      'Encourage wild ideas'
    ];
    
    switch (technique) {
      case 'rapid-ideation':
        return [...baseRules, 'Quantity over quality', 'Keep ideas brief', 'Move fast'];
      case 'six-thinking-hats':
        return [...baseRules, 'Stay in the current hat', 'Switch hats together', 'No mixing perspectives'];
      default:
        return baseRules;
    }
  },

  /**
   * Get facilitator notes for phase
   * @param {Object} phase - Session phase
   * @param {Object} context - Session context
   * @returns {Array} Facilitator notes
   */
  getFacilitatorNotes(phase, context) {
    const notes = [];
    
    switch (phase.id) {
      case 'setup':
      case 'warmup':
        notes.push('Create energy and enthusiasm');
        notes.push('Ensure everyone understands the rules');
        notes.push('Set clear expectations for participation');
        break;
      case 'ideation':
      case 'diverge':
        notes.push('Encourage quantity over quality');
        notes.push('Keep energy high');
        notes.push('Gently redirect off-topic discussions');
        notes.push('Model building on ideas');
        break;
      case 'organization':
      case 'organize':
        notes.push('Look for natural groupings');
        notes.push('Allow participants to suggest categories');
        notes.push('Don\'t overthink the organization');
        break;
      case 'converge':
        notes.push('Help evaluate ideas objectively');
        notes.push('Consider feasibility and impact');
        notes.push('Encourage different perspectives');
        break;
      case 'synthesis':
      case 'actionize':
        notes.push('Focus on concrete next steps');
        notes.push('Assign clear ownership');
        notes.push('Set realistic timelines');
        break;
    }
    
    return notes;
  },

  /**
   * Get prompts for phase
   * @param {Object} phase - Session phase
   * @param {Object} context - Session context
   * @returns {Array} Phase prompts
   */
  getPhasePrompts(phase, context) {
    const prompts = [];
    
    switch (phase.id) {
      case 'ideation':
      case 'diverge':
        prompts.push(`What are all the ways we could approach ${context.topic}?`);
        prompts.push('What would we do if budget wasn\'t a constraint?');
        prompts.push('How might someone completely outside our industry solve this?');
        prompts.push('What if we had to solve this in 24 hours?');
        break;
      case 'organization':
        prompts.push('What themes do you see emerging?');
        prompts.push('Which ideas seem to go together?');
        prompts.push('What patterns do you notice?');
        break;
      case 'converge':
        prompts.push('Which ideas excite you most?');
        prompts.push('What would have the biggest impact?');
        prompts.push('Which ideas are most feasible to implement?');
        break;
    }
    
    return prompts;
  },

  /**
   * Get time management guidance
   * @param {Object} phase - Session phase
   * @param {Object} context - Session context
   * @returns {Object} Time management guidance
   */
  getTimeManagement(phase, context) {
    return {
      duration: phase.duration,
      checkpoints: Math.floor(phase.duration / 3),
      warnings: [
        { time: Math.floor(phase.duration * 0.75), message: '25% time remaining' },
        { time: Math.floor(phase.duration * 0.9), message: '10% time remaining - start wrapping up' }
      ],
      flexibility: phase.id === 'ideation' || phase.id === 'diverge' ? 'Can extend if energy is high' : 'Stay on schedule'
    };
  },

  /**
   * Get troubleshooting guide
   * @param {Object} context - Session context
   * @returns {Object} Troubleshooting guide
   */
  getTroubleshootingGuide(context) {
    return {
      'Low participation': [
        'Ask direct questions to quieter participants',
        'Use round-robin technique',
        'Break into smaller groups'
      ],
      'Dominant participants': [
        'Gently redirect to others',
        'Use silent brainstorming',
        'Set speaking time limits'
      ],
      'Going off topic': [
        'Acknowledge the idea and park it',
        'Refocus on the main topic',
        'Use the "parking lot" technique'
      ],
      'Criticism during ideation': [
        'Remind of no-judgment rule',
        'Redirect to building on ideas',
        'Save evaluation for later phases'
      ],
      'Running out of ideas': [
        'Use different prompts',
        'Try perspective shifting',
        'Take a short break'
      ]
    };
  },

  /**
   * Get synthesis framework
   * @param {Object} context - Session context
   * @returns {Object} Synthesis framework
   */
  getSynthesisFramework(context) {
    return {
      categorization: {
        method: 'Affinity grouping',
        criteria: ['Feasibility', 'Impact', 'Resources required', 'Timeline']
      },
      prioritization: {
        method: 'Impact vs Effort matrix',
        quadrants: ['Quick wins', 'Major projects', 'Fill-ins', 'Thankless tasks']
      },
      documentation: {
        structure: ['Key insights', 'Top ideas', 'Action items', 'Next steps'],
        format: context.outputFormat
      },
      followUp: {
        timeline: '48 hours for summary',
        ownership: 'Assigned during session',
        nextSession: 'Based on outcomes'
      }
    };
  },

  /**
   * Create tracking framework
   * @param {Object} context - Session context
   * @returns {Promise<Object>} Tracking framework
   */
  async createTrackingFramework(context) {
    return {
      metrics: {
        participation: 'Track contributions per participant',
        ideaGeneration: 'Count total ideas generated',
        ideaQuality: 'Rate ideas on feasibility and creativity',
        timeManagement: 'Track phase completion times',
        engagement: 'Monitor energy and participation levels'
      },
      checkpoints: {
        quarter: 'Check energy and participation',
        halfway: 'Assess progress and adjust if needed',
        threeQuarter: 'Prepare for convergence phase'
      },
      outputs: {
        ideaList: 'Comprehensive list of all ideas',
        groupings: 'Ideas organized by theme',
        priorities: 'Top ideas ranked by criteria',
        actionItems: 'Specific next steps with owners'
      }
    };
  },

  /**
   * Format structured output
   * @param {Object} context - Session context
   * @param {Object} structure - Session structure
   * @param {Object} guide - Facilitation guide
   * @param {Object} tracking - Tracking framework
   * @returns {Promise<string>} Formatted output
   */
  async formatStructuredOutput(context, structure, guide, tracking) {
    let output = `🧠 **Brainstorming Session: ${context.topic}**\n\n`;
    output += `🎯 **Session Type:** ${context.sessionType}\n`;
    output += `🛠️ **Technique:** ${context.technique}\n`;
    output += `⏱️ **Duration:** ${context.duration} minutes\n`;
    output += `👥 **Participants:** ${context.participants.length}\n`;
    output += `🎭 **Mode:** ${context.facilitationMode}\n\n`;
    
    if (context.participants.length > 0) {
      output += `👥 **Participants:**\n`;
      context.participants.forEach(p => {
        output += `• ${p.name} - ${p.role}${p.expertise ? ` (${p.expertise})` : ''}\n`;
      });
      output += '\n';
    }
    
    // Context and background
    if (context.context.background) {
      output += `📋 **Background:** ${context.context.background}\n\n`;
    }
    
    if (context.context.goals && context.context.goals.length > 0) {
      output += `🎯 **Goals:**\n`;
      context.context.goals.forEach(goal => {
        output += `• ${goal}\n`;
      });
      output += '\n';
    }
    
    if (context.context.constraints && context.context.constraints.length > 0) {
      output += `⚠️ **Constraints:**\n`;
      context.context.constraints.forEach(constraint => {
        output += `• ${constraint}\n`;
      });
      output += '\n';
    }
    
    // Materials and setup
    output += `📦 **Materials Needed:**\n`;
    guide.preparation.materials.forEach(material => {
      output += `• ${material}\n`;
    });
    output += '\n';
    
    output += `🏗️ **Environment Setup:**\n`;
    Object.entries(guide.preparation.environment).forEach(([key, value]) => {
      output += `• **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${value}\n`;
    });
    output += '\n';
    
    // Session rules
    output += `📋 **Session Rules:**\n`;
    guide.preparation.rules.forEach(rule => {
      output += `• ${rule}\n`;
    });
    output += '\n';
    
    // Session timeline
    output += `⏰ **Session Timeline:**\n\n`;
    guide.execution.phases.forEach((phase, index) => {
      output += `**Phase ${index + 1}: ${phase.name}** (${phase.duration} minutes)\n`;
      output += `*Activities:*\n`;
      phase.activities.forEach(activity => {
        output += `• ${activity}\n`;
      });
      
      if (phase.facilitatorNotes && phase.facilitatorNotes.length > 0) {
        output += `*Facilitator Notes:*\n`;
        phase.facilitatorNotes.forEach(note => {
          output += `  - ${note}\n`;
        });
      }
      
      if (phase.prompts && phase.prompts.length > 0) {
        output += `*Key Prompts:*\n`;
        phase.prompts.forEach(prompt => {
          output += `  - "${prompt}"\n`;
        });
      }
      output += '\n';
    });
    
    // Tracking metrics
    output += `📊 **Session Tracking:**\n\n`;
    Object.entries(tracking.metrics).forEach(([metric, description]) => {
      output += `**${metric.charAt(0).toUpperCase() + metric.slice(1)}:** ${description}\n`;
    });
    output += '\n';
    
    // Expected outputs
    output += `📤 **Expected Outputs:**\n`;
    Object.entries(tracking.outputs).forEach(([outputType, description]) => {
      output += `• **${outputType.charAt(0).toUpperCase() + outputType.slice(1)}:** ${description}\n`;
    });
    output += '\n';
    
    // Troubleshooting
    output += `🚨 **Troubleshooting Guide:**\n\n`;
    Object.entries(guide.troubleshooting).forEach(([situation, solutions]) => {
      output += `**${situation}:**\n`;
      solutions.forEach(solution => {
        output += `• ${solution}\n`;
      });
      output += '\n';
    });
    
    // Synthesis framework
    output += `🔄 **Synthesis Framework:**\n\n`;
    output += `**Categorization:** ${guide.synthesis.categorization.method}\n`;
    output += `**Criteria:** ${guide.synthesis.categorization.criteria.join(', ')}\n\n`;
    output += `**Prioritization:** ${guide.synthesis.prioritization.method}\n`;
    output += `**Quadrants:** ${guide.synthesis.prioritization.quadrants.join(', ')}\n\n`;
    
    // Next steps
    output += `🚀 **Next Steps:**\n`;
    output += `1. Set up environment and gather materials\n`;
    output += `2. Brief participants on rules and process\n`;
    output += `3. Execute session following timeline\n`;
    output += `4. Document all ideas during session\n`;
    output += `5. Synthesize results within 48 hours\n`;
    output += `6. Share summary with all participants\n`;
    output += `7. Follow up on action items\n\n`;
    
    output += `💡 **Pro Tips:**\n`;
    output += `• Keep energy high throughout\n`;
    output += `• Encourage building on ideas\n`;
    output += `• Stay flexible with timing if productive\n`;
    output += `• Capture everything - judge later\n`;
    output += `• End with clear action items\n\n`;
    
    output += `📁 **Session plan saved to project for execution.**`;
    
    return output;
  },

  /**
   * Format guided output
   * @param {Object} context - Session context
   * @param {Object} structure - Session structure
   * @param {Object} guide - Facilitation guide
   * @param {Object} tracking - Tracking framework
   * @returns {Promise<string>} Formatted output
   */
  async formatGuidedOutput(context, structure, guide, tracking) {
    let output = `🧠 **Guided Brainstorming: ${context.topic}**\n\n`;
    output += `I'll guide you through a ${context.duration}-minute ${context.technique} session.\n\n`;
    
    output += `**Let's start with Phase 1: ${structure.phases[0].name}**\n\n`;
    
    const firstPhase = guide.execution.phases[0];
    output += `For the next ${firstPhase.duration} minutes, we'll focus on:\n`;
    firstPhase.activities.forEach(activity => {
      output += `• ${activity}\n`;
    });
    output += '\n';
    
    if (firstPhase.prompts && firstPhase.prompts.length > 0) {
      output += `Key questions to consider:\n`;
      firstPhase.prompts.forEach(prompt => {
        output += `• ${prompt}\n`;
      });
      output += '\n';
    }
    
    output += `**Rules for this session:**\n`;
    guide.preparation.rules.forEach(rule => {
      output += `• ${rule}\n`;
    });
    output += '\n';
    
    output += `When you're ready to move to the next phase, let me know and I'll provide guidance for "${structure.phases[1]?.name}".`;
    
    return output;
  },

  /**
   * Format freestyle output
   * @param {Object} context - Session context
   * @param {Object} structure - Session structure
   * @param {Object} guide - Facilitation guide
   * @returns {Promise<string>} Formatted output
   */
  async formatFreestyleOutput(context, structure, guide) {
    let output = `🧠 **Freestyle Brainstorming: ${context.topic}**\n\n`;
    output += `Go wild! Here's your creative playground for the next ${context.duration} minutes.\n\n`;
    
    output += `**Topic Focus:** ${context.topic}\n\n`;
    
    if (context.context.background) {
      output += `**Background:** ${context.context.background}\n\n`;
    }
    
    output += `**Simple Rules:**\n`;
    output += `• No idea is too crazy\n`;
    output += `• Build on what comes before\n`;
    output += `• Keep generating, don't evaluate yet\n`;
    output += `• Have fun with it!\n\n`;
    
    output += `**Some prompts to spark creativity:**\n`;
    output += `• What if we had unlimited resources?\n`;
    output += `• How would a child solve this?\n`;
    output += `• What would we do if we had to solve this tomorrow?\n`;
    output += `• What's the most outrageous solution we could imagine?\n`;
    output += `• What would our biggest competitor never do?\n\n`;
    
    output += `**When you're done brainstorming:**\n`;
    output += `• Group your ideas into themes\n`;
    output += `• Pick your top 3-5 favorites\n`;
    output += `• Think about what would be needed to make them happen\n\n`;
    
    output += `Ready? Let your creativity flow! 🚀`;
    
    return output;
  },

  /**
   * Save session to project
   * @param {string} projectPath - Project path
   * @param {Object} context - Session context
   * @param {Object} structure - Session structure
   * @param {Object} guide - Facilitation guide
   * @returns {Promise<void>}
   */
  async saveSessionToProject(projectPath, context, structure, guide) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) {
        return; // No SA project, skip saving
      }
      
      const brainstormDir = join(saDir, 'brainstorming');
      if (!existsSync(brainstormDir)) {
        require('fs').mkdirSync(brainstormDir, { recursive: true });
      }
      
      const sessionData = {
        context,
        structure,
        guide,
        createdAt: new Date().toISOString()
      };
      
      const filename = `brainstorm-${context.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(brainstormDir, filename);
      
      writeFileSync(filepath, JSON.stringify(sessionData, null, 2));
      
    } catch (error) {
      // Silent fail - session saving is optional
      console.warn('Failed to save brainstorming session:', error.message);
    }
  }
};