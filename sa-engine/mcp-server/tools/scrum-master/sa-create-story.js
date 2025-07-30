import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saCreateStory = {
  name: 'sa_create_story',
  description: 'Create well-structured user stories with template selection, requirements breakdown, and story validation',
  category: 'scrum-master',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      storyTitle: { type: 'string', minLength: 1 },
      storyTemplate: { 
        type: 'string', 
        enum: ['user-story', 'technical-story', 'bug-fix', 'spike', 'epic-breakdown'],
        default: 'user-story'
      },
      storyDetails: {
        type: 'object',
        properties: {
          userRole: { type: 'string' },
          action: { type: 'string' },
          value: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          storyPoints: { type: 'number' },
          epicId: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } }
        }
      },
      acceptanceCriteria: { type: 'array', items: { type: 'string' } },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['storyTitle']
  },

  validate(args) {
    const errors = [];
    if (!args.storyTitle?.trim()) errors.push('storyTitle is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const storyContext = {
        title: args.storyTitle.trim(),
        template: args.storyTemplate || 'user-story',
        details: args.storyDetails || {},
        acceptanceCriteria: args.acceptanceCriteria || [],
        timestamp: new Date().toISOString(),
        author: context?.userId || 'system',
        storyId: `STORY-${Date.now()}`
      };

      // Apply story template
      const templateData = await this.applyStoryTemplate(storyContext);
      
      // Generate acceptance criteria if not provided
      if (storyContext.acceptanceCriteria.length === 0) {
        storyContext.acceptanceCriteria = await this.generateAcceptanceCriteria(storyContext, templateData);
      }
      
      // Create story structure
      const storyStructure = await this.createStoryStructure(storyContext, templateData);
      
      // Validate story completeness
      const validation = await this.validateStory(storyStructure);
      
      // Generate story artifacts
      const artifacts = await this.generateStoryArtifacts(storyStructure);
      
      const output = await this.formatStoryOutput(storyContext, storyStructure, validation, artifacts);
      
      await this.saveStoryData(args.projectPath, storyContext, {
        structure: storyStructure,
        validation,
        artifacts
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          storyId: storyContext.storyId,
          template: storyContext.template,
          priority: storyStructure.priority,
          storyPoints: storyStructure.storyPoints,
          acceptanceCriteriaCount: storyContext.acceptanceCriteria.length,
          validationScore: validation.score,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to create story: ${error.message}` }],
        isError: true
      };
    }
  },

  async applyStoryTemplate(context) {
    const templates = {
      'user-story': {
        format: 'As a {userRole}, I want {action} so that {value}',
        requiredFields: ['userRole', 'action', 'value'],
        defaultPriority: 'medium',
        suggestedLabels: ['feature', 'user-story']
      },
      'technical-story': {
        format: 'As a developer, I need {action} so that {value}',
        requiredFields: ['action', 'value'],
        defaultPriority: 'medium',
        suggestedLabels: ['technical', 'infrastructure']
      },
      'bug-fix': {
        format: 'Fix: {action}',
        requiredFields: ['action'],
        defaultPriority: 'high',
        suggestedLabels: ['bug', 'fix']
      },
      'spike': {
        format: 'Research: {action}',
        requiredFields: ['action'],
        defaultPriority: 'medium',
        suggestedLabels: ['spike', 'research']
      },
      'epic-breakdown': {
        format: 'Epic breakdown: {action}',
        requiredFields: ['action'],
        defaultPriority: 'medium',
        suggestedLabels: ['epic', 'breakdown']
      }
    };

    return templates[context.template] || templates['user-story'];
  },

  async generateAcceptanceCriteria(context, templateData) {
    const criteria = [];
    
    switch (context.template) {
      case 'user-story':
        criteria.push(
          `Given I am a ${context.details.userRole || 'user'}, when I ${context.details.action || 'interact with the system'}, then I should see the expected result`,
          `Given valid input, when I complete the action, then the system should respond appropriately`,
          `Given invalid input, when I attempt the action, then I should receive clear error feedback`
        );
        break;
        
      case 'technical-story':
        criteria.push(
          'Given the technical requirements, when implemented, then the system should meet performance standards',
          'Given the implementation, when tested, then all technical specifications should be satisfied',
          'Given the solution, when deployed, then it should integrate seamlessly with existing systems'
        );
        break;
        
      case 'bug-fix':
        criteria.push(
          'Given the bug scenario, when the fix is applied, then the issue should be resolved',
          'Given the fix, when tested, then no regression should occur',
          'Given the solution, when deployed, then the system should function as expected'
        );
        break;
        
      case 'spike':
        criteria.push(
          'Given the research question, when investigation is complete, then findings should be documented',
          'Given the spike, when concluded, then recommendations should be provided',
          'Given the research, when finished, then next steps should be clearly defined'
        );
        break;
        
      default:
        criteria.push(
          'Given the requirements, when implemented, then the acceptance criteria should be met',
          'Given the solution, when tested, then it should work as expected'
        );
    }
    
    return criteria;
  },

  async createStoryStructure(context, templateData) {
    const structure = {
      id: context.storyId,
      title: context.title,
      template: context.template,
      description: this.generateDescription(context, templateData),
      priority: context.details.priority || templateData.defaultPriority,
      storyPoints: context.details.storyPoints || this.estimateStoryPoints(context),
      labels: context.details.labels || templateData.suggestedLabels,
      epicId: context.details.epicId,
      acceptanceCriteria: context.acceptanceCriteria,
      tasks: await this.generateTasks(context),
      definition: {
        userRole: context.details.userRole,
        action: context.details.action,
        value: context.details.value
      },
      metadata: {
        created: context.timestamp,
        author: context.author,
        status: 'draft'
      }
    };

    return structure;
  },

  generateDescription(context, templateData) {
    if (context.details.description) {
      return context.details.description;
    }

    // Generate based on template
    let description = templateData.format;
    description = description.replace('{userRole}', context.details.userRole || 'user');
    description = description.replace('{action}', context.details.action || context.title);
    description = description.replace('{value}', context.details.value || 'achieve the desired outcome');

    return description;
  },

  estimateStoryPoints(context) {
    // Simple estimation based on title length and complexity indicators
    const title = context.title.toLowerCase();
    const complexityIndicators = ['integrate', 'complex', 'multiple', 'advanced', 'system'];
    const simpleIndicators = ['simple', 'basic', 'quick', 'minor', 'fix'];
    
    let points = 3; // Base points
    
    if (complexityIndicators.some(indicator => title.includes(indicator))) {
      points += 2;
    }
    
    if (simpleIndicators.some(indicator => title.includes(indicator))) {
      points -= 1;
    }
    
    if (context.template === 'spike') {
      points = Math.min(points, 5); // Spikes are usually smaller
    }
    
    if (context.template === 'bug-fix') {
      points = Math.min(points, 3); // Bug fixes are usually smaller
    }
    
    return Math.max(1, Math.min(8, points));
  },

  async generateTasks(context) {
    const tasks = [];
    
    switch (context.template) {
      case 'user-story':
        tasks.push(
          'Analyze requirements and create detailed design',
          'Implement user interface components',
          'Implement backend logic',
          'Write unit tests',
          'Perform integration testing',
          'Update documentation'
        );
        break;
        
      case 'technical-story':
        tasks.push(
          'Research technical requirements',
          'Design technical solution',
          'Implement solution',
          'Create technical tests',
          'Update technical documentation'
        );
        break;
        
      case 'bug-fix':
        tasks.push(
          'Investigate and reproduce issue',
          'Identify root cause',
          'Implement fix',
          'Test fix thoroughly',
          'Verify no regression'
        );
        break;
        
      case 'spike':
        tasks.push(
          'Define research questions',
          'Conduct investigation',
          'Document findings',
          'Provide recommendations',
          'Present results to team'
        );
        break;
        
      default:
        tasks.push(
          'Break down requirements',
          'Implement solution',
          'Test implementation',
          'Review and refine'
        );
    }
    
    return tasks.map((task, index) => ({
      id: index + 1,
      description: task,
      status: 'todo',
      estimatedHours: this.estimateTaskHours(task)
    }));
  },

  estimateTaskHours(task) {
    const hourMap = {
      'analyze': 4,
      'design': 6,
      'implement': 8,
      'test': 4,
      'document': 2,
      'research': 6,
      'investigate': 4,
      'review': 2
    };
    
    const taskLower = task.toLowerCase();
    for (const [keyword, hours] of Object.entries(hourMap)) {
      if (taskLower.includes(keyword)) {
        return hours;
      }
    }
    
    return 4; // Default
  },

  async validateStory(story) {
    const validation = {
      score: 100,
      issues: [],
      warnings: [],
      suggestions: []
    };

    // Check required fields
    if (!story.title || story.title.trim().length === 0) {
      validation.issues.push('Story title is required');
      validation.score -= 20;
    }

    if (!story.description || story.description.trim().length < 10) {
      validation.issues.push('Story description is too short or missing');
      validation.score -= 15;
    }

    // Check acceptance criteria
    if (story.acceptanceCriteria.length === 0) {
      validation.issues.push('Acceptance criteria are required');
      validation.score -= 25;
    } else if (story.acceptanceCriteria.length < 2) {
      validation.warnings.push('Consider adding more acceptance criteria');
      validation.score -= 10;
    }

    // Check story points
    if (!story.storyPoints || story.storyPoints <= 0) {
      validation.warnings.push('Story points should be estimated');
      validation.score -= 5;
    } else if (story.storyPoints > 8) {
      validation.warnings.push('Consider breaking down large stories (>8 points)');
      validation.score -= 10;
    }

    // Check priority
    if (!story.priority) {
      validation.warnings.push('Story priority should be set');
      validation.score -= 5;
    }

    // Generate suggestions
    if (story.template === 'user-story' && !story.definition.userRole) {
      validation.suggestions.push('Define the user role for better clarity');
    }

    if (story.tasks.length === 0) {
      validation.suggestions.push('Add implementation tasks for better planning');
    }

    validation.score = Math.max(0, validation.score);
    validation.level = this.getValidationLevel(validation.score);

    return validation;
  },

  getValidationLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'acceptable';
    if (score >= 60) return 'needs-improvement';
    return 'incomplete';
  },

  async generateStoryArtifacts(story) {
    return {
      summary: this.generateStorySummary(story),
      checklist: this.generateDefinitionOfDone(story),
      testScenarios: this.generateTestScenarios(story),
      dependencies: this.identifyDependencies(story)
    };
  },

  generateStorySummary(story) {
    return {
      title: story.title,
      type: story.template,
      complexity: story.storyPoints <= 3 ? 'Simple' : story.storyPoints <= 5 ? 'Medium' : 'Complex',
      effort: `${story.storyPoints} story points`,
      taskCount: story.tasks.length,
      estimatedHours: story.tasks.reduce((sum, task) => sum + task.estimatedHours, 0)
    };
  },

  generateDefinitionOfDone(story) {
    const checklist = [
      'All acceptance criteria are met',
      'Code is reviewed and approved',
      'Unit tests are written and passing',
      'Integration tests are passing',
      'Documentation is updated',
      'Code follows coding standards',
      'No critical or high-severity bugs',
      'Feature is deployed to staging environment'
    ];

    if (story.template === 'user-story') {
      checklist.push('UX review completed');
      checklist.push('Accessibility requirements met');
    }

    if (story.template === 'technical-story') {
      checklist.push('Technical documentation updated');
      checklist.push('Performance requirements met');
    }

    return checklist;
  },

  generateTestScenarios(story) {
    return story.acceptanceCriteria.map((criteria, index) => ({
      id: `TEST-${index + 1}`,
      description: criteria,
      type: 'acceptance',
      priority: 'high',
      status: 'pending'
    }));
  },

  identifyDependencies(story) {
    const dependencies = [];
    
    // Check for common dependency patterns in title/description
    const text = `${story.title} ${story.description}`.toLowerCase();
    
    if (text.includes('integrate') || text.includes('api')) {
      dependencies.push({
        type: 'external-api',
        description: 'External API or service dependency'
      });
    }
    
    if (text.includes('database') || text.includes('data')) {
      dependencies.push({
        type: 'database',
        description: 'Database schema or data dependency'
      });
    }
    
    if (text.includes('design') || text.includes('ui')) {
      dependencies.push({
        type: 'design',
        description: 'Design or UX dependency'
      });
    }
    
    return dependencies;
  },

  async formatStoryOutput(context, story, validation, artifacts) {
    let output = `📋 **User Story Created: ${story.title}**\n\n`;
    output += `🆔 **Story ID:** ${story.id}\n`;
    output += `📝 **Template:** ${story.template}\n`;
    output += `⭐ **Priority:** ${story.priority}\n`;
    output += `🎯 **Story Points:** ${story.storyPoints}\n`;
    output += `📊 **Validation Score:** ${validation.score}/100 (${validation.level})\n\n`;

    // Story Description
    output += `## 📖 Story Description\n\n`;
    output += `${story.description}\n\n`;

    // Acceptance Criteria
    output += `## ✅ Acceptance Criteria (${story.acceptanceCriteria.length})\n\n`;
    story.acceptanceCriteria.forEach((criteria, index) => {
      output += `${index + 1}. ${criteria}\n`;
    });
    output += '\n';

    // Implementation Tasks
    output += `## 🔧 Implementation Tasks (${story.tasks.length})\n\n`;
    story.tasks.forEach(task => {
      output += `${task.id}. ${task.description} (${task.estimatedHours}h)\n`;
    });
    output += `\n**Total Estimated Hours:** ${artifacts.summary.estimatedHours}h\n\n`;

    // Definition of Done
    output += `## ✅ Definition of Done\n\n`;
    artifacts.checklist.forEach(item => {
      output += `• ${item}\n`;
    });
    output += '\n';

    // Dependencies
    if (artifacts.dependencies.length > 0) {
      output += `## 🔗 Dependencies\n\n`;
      artifacts.dependencies.forEach(dep => {
        output += `• **${dep.type}:** ${dep.description}\n`;
      });
      output += '\n';
    }

    // Validation Results
    if (validation.issues.length > 0 || validation.warnings.length > 0) {
      output += `## ⚠️ Validation Results\n\n`;
      
      if (validation.issues.length > 0) {
        output += `**Issues to Fix:**\n`;
        validation.issues.forEach(issue => {
          output += `• ${issue}\n`;
        });
        output += '\n';
      }
      
      if (validation.warnings.length > 0) {
        output += `**Warnings:**\n`;
        validation.warnings.forEach(warning => {
          output += `• ${warning}\n`;
        });
        output += '\n';
      }
      
      if (validation.suggestions.length > 0) {
        output += `**Suggestions:**\n`;
        validation.suggestions.forEach(suggestion => {
          output += `• ${suggestion}\n`;
        });
        output += '\n';
      }
    }

    // Labels and Metadata
    output += `## 🏷️ Story Metadata\n\n`;
    output += `**Labels:** ${story.labels.join(', ')}\n`;
    if (story.epicId) {
      output += `**Epic:** ${story.epicId}\n`;
    }
    output += `**Created:** ${story.metadata.created.split('T')[0]}\n`;
    output += `**Author:** ${story.metadata.author}\n`;
    output += `**Status:** ${story.metadata.status}\n\n`;

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    if (validation.score < 70) {
      output += `1. Address validation issues and warnings\n`;
      output += `2. Review and refine story details\n`;
      output += `3. Get stakeholder approval\n`;
      output += `4. Add to sprint backlog\n`;
    } else {
      output += `1. Review story with team\n`;
      output += `2. Add to sprint backlog if ready\n`;
      output += `3. Begin implementation when prioritized\n`;
    }
    output += '\n';

    output += `📁 **Complete story details and artifacts saved to project.**`;

    return output;
  },

  async saveStoryData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const storiesDir = join(saDir, 'user-stories');
      if (!existsSync(storiesDir)) {
        require('fs').mkdirSync(storiesDir, { recursive: true });
      }
      
      const filename = `story-${context.storyId}-${Date.now()}.json`;
      const filepath = join(storiesDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save story data:', error.message);
    }
  }
};