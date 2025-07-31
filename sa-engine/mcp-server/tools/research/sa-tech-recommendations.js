import ResearchEngine from '../../../research/ResearchEngine.js';

/**
 * Super Agents Technology Recommendations Tool - Latest technology recommendations system
 * Provides intelligent technology recommendations based on project context and industry trends
 */

const toolDefinition = {
  name: 'sa-tech-recommendations',
  description: 'Get latest technology recommendations and trend analysis for your project with decision support tools',
  category: 'research',
  
  inputSchema: {
    type: 'object',
    properties: {
      projectType: {
        type: 'string',
        enum: ['web', 'mobile', 'desktop', 'api', 'microservices', 'ai/ml', 'blockchain', 'iot', 'game', 'data'],
        description: 'Type of project to get recommendations for'
      },
      currentTech: {
        type: 'array',
        items: { type: 'string' },
        description: 'Current technologies in use (e.g., ["React", "Node.js", "PostgreSQL"])'
      },
      requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific requirements or constraints (e.g., ["real-time", "scalable", "secure", "offline"])'
      },
      teamSize: {
        type: 'string',
        enum: ['solo', 'small', 'medium', 'large', 'enterprise'],
        description: 'Team size context for recommendations'
      },
      budget: {
        type: 'string',
        enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
        description: 'Budget context for technology choices'
      },
      timeframe: {
        type: 'string',
        enum: ['prototype', 'mvp', 'short-term', 'long-term', 'enterprise'],
        description: 'Project timeline context'
      },
      focus: {
        type: 'string',
        enum: ['performance', 'developer-experience', 'maintainability', 'cost', 'security', 'scalability'],
        description: 'Primary focus for recommendations'
      },
      includeProjectContext: {
        type: 'boolean',
        description: 'Include current project files and tasks for context-aware recommendations (default: true)'
      },
      trendsOnly: {
        type: 'boolean',
        description: 'Focus only on latest trends and emerging technologies (default: false)'
      },
      saveToFile: {
        type: 'boolean',
        description: 'Save recommendations to .super-agents/research/ directory (default: false)'
      },
      includeAlternatives: {
        type: 'boolean',
        description: 'Include alternative technology options with comparisons (default: true)'
      }
    },
    required: ['projectType']
  },

  async execute(args, context = {}) {
    try {
      const {
        projectType,
        currentTech = [],
        requirements = [],
        teamSize = 'medium',
        budget = 'medium',
        timeframe = 'long-term',
        focus = 'maintainability',
        includeProjectContext = true,
        trendsOnly = false,
        saveToFile = false,
        includeAlternatives = true
      } = args;

      // Initialize research engine
      const researchEngine = new ResearchEngine({
        projectRoot: process.cwd(),
        enableSaveToFile: true,
        enableSaveToTask: false,
        researchDirectory: '.super-agents/research'
      });

      // Set AI provider if available
      if (context.aiProvider) {
        researchEngine.setAIProvider(context.aiProvider);
      }

      // Build comprehensive research query
      const query = this.buildTechRecommendationQuery({
        projectType,
        currentTech,
        requirements,
        teamSize,
        budget,
        timeframe,
        focus,
        trendsOnly,
        includeAlternatives
      });

      // Build custom context for technology recommendations
      const customContext = this.buildTechContext({
        projectType,
        currentTech,
        requirements,
        teamSize,
        budget,
        timeframe,
        focus
      });

      // Prepare research options
      const researchOptions = {
        taskIds: [],
        filePaths: includeProjectContext ? await this.discoverRelevantFiles(projectType) : [],
        customContext,
        includeProjectTree: includeProjectContext,
        detailLevel: 'high',
        autoDiscoverTasks: includeProjectContext,
        maxDiscoveredTasks: 5,
        saveTo: null,
        saveToFile,
        temperature: 0.3, // Lower temperature for more consistent recommendations
        maxResponseTokens: 6000
      };

      // Perform technology research
      const result = await researchEngine.performResearch(query, researchOptions);

      // Parse and enhance recommendations
      const recommendations = this.parseRecommendations(result.result, {
        projectType,
        currentTech,
        requirements,
        includeAlternatives
      });

      // Format response for MCP
      return {
        content: [
          {
            type: 'text',
            text: `# Technology Recommendations for ${projectType.toUpperCase()} Project

## Executive Summary
${recommendations.summary || 'Comprehensive technology recommendations based on your project requirements.'}

## Recommended Technology Stack
${recommendations.primaryStack || result.result}

${recommendations.alternatives && includeAlternatives ? `
## Alternative Options
${recommendations.alternatives}
` : ''}

${recommendations.migration && currentTech.length > 0 ? `
## Migration Strategy
${recommendations.migration}
` : ''}

## Decision Matrix
${this.formatDecisionMatrix(recommendations.decisionMatrix, focus)}

## Implementation Roadmap
${recommendations.roadmap || this.generateBasicRoadmap(projectType, teamSize, timeframe)}

## Cost Analysis
${recommendations.costAnalysis || this.generateCostAnalysis(budget, teamSize)}

## Risk Assessment
${recommendations.risks || this.generateRiskAssessment(projectType, teamSize)}

## Context Analysis
- **Project Type**: ${projectType}
- **Team Size**: ${teamSize}
- **Budget**: ${budget}
- **Timeframe**: ${timeframe}
- **Primary Focus**: ${focus}
- **Current Tech**: ${currentTech.join(', ') || 'None specified'}
- **Requirements**: ${requirements.join(', ') || 'None specified'}
- **Context Sources**: ${result.sources.tasks} tasks, ${result.sources.files} files

${result.savedFilePath ? `\n**Saved to File**: ${result.savedFilePath}` : ''}

---
*Generated by Super Agents Technology Recommendations Engine*`
          }
        ],
        isError: false,
        metadata: {
          toolName: 'sa-tech-recommendations',
          projectType,
          recommendations: recommendations.primaryStack,
          alternatives: recommendations.alternatives,
          decisionMatrix: recommendations.decisionMatrix,
          contextTokens: result.contextTokens,
          focus,
          timestamp: result.metadata.timestamp,
          savedFilePath: result.savedFilePath || null
        }
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating technology recommendations: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          toolName: 'sa-tech-recommendations',
          error: error.message
        }
      };
    }
  },

  /**
   * Build comprehensive technology recommendation query
   */
  buildTechRecommendationQuery(params) {
    const {
      projectType,
      currentTech,
      requirements,
      teamSize,
      budget,
      timeframe,
      focus,
      trendsOnly,
      includeAlternatives
    } = params;

    let query = `Provide comprehensive technology recommendations for a ${projectType} project`;

    if (currentTech.length > 0) {
      query += ` currently using: ${currentTech.join(', ')}`;
    }

    if (requirements.length > 0) {
      query += ` with requirements: ${requirements.join(', ')}`;
    }

    query += `. Team size: ${teamSize}, Budget: ${budget}, Timeframe: ${timeframe}, Primary focus: ${focus}`;

    if (trendsOnly) {
      query += '. Focus on latest trends, emerging technologies, and cutting-edge solutions from 2024-2025';
    } else {
      query += '. Include both proven stable technologies and promising emerging options';
    }

    if (includeAlternatives) {
      query += '. Provide multiple alternatives with trade-off analysis';
    }

    query += '. Include implementation strategy, cost considerations, and risk assessment.';

    return query;
  },

  /**
   * Build custom context for technology recommendations
   */
  buildTechContext(params) {
    const {
      projectType,
      currentTech,
      requirements,
      teamSize,
      budget,
      timeframe,
      focus
    } = params;

    return `
## Technology Recommendation Context

**Project Profile:**
- Type: ${projectType}
- Team Size: ${teamSize}
- Budget Level: ${budget}
- Timeline: ${timeframe}
- Primary Focus: ${focus}

**Current Technology Stack:**
${currentTech.length > 0 ? currentTech.map(tech => `- ${tech}`).join('\n') : 'No current technologies specified'}

**Requirements & Constraints:**
${requirements.length > 0 ? requirements.map(req => `- ${req}`).join('\n') : 'No specific requirements provided'}

**Analysis Guidelines:**
1. Consider industry best practices for ${projectType} projects
2. Factor in team size and skill requirements
3. Align with budget constraints and total cost of ownership
4. Match timeline expectations and delivery requirements
5. Prioritize ${focus} in all recommendations
6. Consider long-term maintainability and scalability
7. Include security and performance implications
8. Account for ecosystem maturity and community support
`;
  },

  /**
   * Discover relevant files based on project type
   */
  async discoverRelevantFiles(projectType) {
    const filePatterns = {
      web: ['package.json', 'webpack.config.js', 'vite.config.js', 'next.config.js', 'src/components/**'],
      mobile: ['package.json', 'android/**', 'ios/**', 'expo.json', 'metro.config.js'],
      api: ['package.json', 'src/routes/**', 'src/controllers/**', 'src/models/**'],
      microservices: ['docker-compose.yml', 'k8s/**', 'services/**', 'package.json'],
      'ai/ml': ['requirements.txt', 'environment.yml', 'models/**', 'notebooks/**'],
      data: ['requirements.txt', 'sql/**', 'schemas/**', 'pipelines/**']
    };

    return filePatterns[projectType] || ['package.json', 'README.md', 'docs/**'];
  },

  /**
   * Parse recommendations from AI response
   */
  parseRecommendations(aiResponse, params) {
    // This is a simplified parser - in a real implementation,
    // you might use more sophisticated NLP or structured prompting
    const sections = aiResponse.split(/##\s+/);
    
    return {
      summary: this.extractSection(sections, ['Executive Summary', 'Summary']),
      primaryStack: this.extractSection(sections, ['Recommended', 'Primary', 'Main Stack']),
      alternatives: this.extractSection(sections, ['Alternative', 'Options', 'Other Options']),
      migration: this.extractSection(sections, ['Migration', 'Transition']),
      roadmap: this.extractSection(sections, ['Roadmap', 'Implementation']),
      costAnalysis: this.extractSection(sections, ['Cost', 'Budget']),
      risks: this.extractSection(sections, ['Risk', 'Risks', 'Considerations']),
      decisionMatrix: this.extractDecisionMatrix(aiResponse)
    };
  },

  /**
   * Extract specific section from AI response
   */
  extractSection(sections, keywords) {
    for (const section of sections) {
      for (const keyword of keywords) {
        if (section.toLowerCase().includes(keyword.toLowerCase())) {
          return section.replace(/^[^:]*:?\s*/, '').trim();
        }
      }
    }
    return null;
  },

  /**
   * Extract decision matrix from response
   */
  extractDecisionMatrix(response) {
    // Look for table-like structures or structured comparisons
    const matrixMatch = response.match(/\|.*\|[\s\S]*?\|.*\|/);
    return matrixMatch ? matrixMatch[0] : null;
  },

  /**
   * Format decision matrix for display
   */
  formatDecisionMatrix(matrix, focus) {
    if (matrix) return matrix;

    return `
| Criteria | Weight | Primary Rec | Alternative 1 | Alternative 2 |
|----------|---------|-------------|---------------|---------------|
| ${focus.charAt(0).toUpperCase() + focus.slice(1)} | High | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Learning Curve | Medium | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| Community Support | Medium | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Total Cost | High | ⭐⭐ | ⭐⭐⭐ | ⭐ |
`;
  },

  /**
   * Generate basic roadmap
   */
  generateBasicRoadmap(projectType, teamSize, timeframe) {
    const phases = {
      prototype: ['Week 1-2: Setup & Core Tech', 'Week 3-4: Basic Implementation'],
      mvp: ['Month 1: Foundation', 'Month 2: Core Features', 'Month 3: Polish & Deploy'],
      'short-term': ['Q1: Planning & Setup', 'Q2: Development', 'Q3: Testing & Launch'],
      'long-term': ['Phase 1: Foundation (3-6 months)', 'Phase 2: Core Development (6-12 months)', 'Phase 3: Scale & Optimize (12+ months)']
    };

    return phases[timeframe] ? phases[timeframe].map(phase => `- ${phase}`).join('\n') : 
      '- Phase 1: Technology setup and team training\n- Phase 2: Core development and testing\n- Phase 3: Deployment and optimization';
  },

  /**
   * Generate cost analysis
   */
  generateCostAnalysis(budget, teamSize) {
    const costs = {
      startup: 'Focus on free/open-source solutions, minimal infrastructure costs',
      small: 'Balance of free tools with some paid services for productivity',
      medium: 'Mix of enterprise tools and managed services for efficiency',
      large: 'Enterprise solutions with dedicated support and SLAs',
      enterprise: 'Full enterprise stack with premium support and compliance'
    };

    return costs[budget] || 'Cost analysis based on requirements and scale';
  },

  /**
   * Generate risk assessment
   */
  generateRiskAssessment(projectType, teamSize) {
    const risks = {
      web: 'Browser compatibility, security vulnerabilities, performance at scale',
      mobile: 'Platform fragmentation, app store policies, device compatibility',
      api: 'Rate limiting, security, backward compatibility',
      'ai/ml': 'Model accuracy, data privacy, computational costs'
    };

    return risks[projectType] || 'Technology adoption risks, skill gaps, maintenance overhead';
  },

  // Validation function for input parameters
  validate(args) {
    const errors = [];
    
    if (!args.projectType) {
      errors.push('projectType is required');
    }

    const validProjectTypes = ['web', 'mobile', 'desktop', 'api', 'microservices', 'ai/ml', 'blockchain', 'iot', 'game', 'data'];
    if (args.projectType && !validProjectTypes.includes(args.projectType)) {
      errors.push(`projectType must be one of: ${validProjectTypes.join(', ')}`);
    }

    if (args.currentTech && !Array.isArray(args.currentTech)) {
      errors.push('currentTech must be an array of strings');
    }

    if (args.requirements && !Array.isArray(args.requirements)) {
      errors.push('requirements must be an array of strings');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Example usage
  examples: [
    {
      title: 'Web Application Recommendations',
      description: 'Get technology recommendations for a web application',
      input: {
        projectType: 'web',
        currentTech: ['React', 'Node.js'],
        requirements: ['real-time', 'scalable'],
        teamSize: 'small',
        budget: 'medium',
        focus: 'performance'
      }
    },
    {
      title: 'Mobile App Tech Stack',
      description: 'Recommendations for a mobile application project',
      input: {
        projectType: 'mobile',
        requirements: ['offline', 'cross-platform'],
        teamSize: 'medium',
        timeframe: 'mvp',
        focus: 'developer-experience'
      }
    },
    {
      title: 'Latest Trends Analysis',
      description: 'Focus on cutting-edge technologies and trends',
      input: {
        projectType: 'ai/ml',
        trendsOnly: true,
        focus: 'performance',
        saveToFile: true
      }
    }
  ],

  // Tool metadata
  metadata: {
    category: 'research',
    tags: ['technology', 'recommendations', 'trends', 'decision-support', 'analysis'],
    version: '1.0.0',
    author: 'Super Agents Framework',
    complexity: 'high',
    estimatedTime: '60-180 seconds',
    prerequisites: ['AI provider configured'],
    outputs: ['Technology recommendations', 'Decision matrix', 'Cost analysis', 'Risk assessment', 'Implementation roadmap']
  }
};

export default toolDefinition;