import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_tech_recommendations MCP Tool
 * Technology selection with stack analysis, framework comparison, and selection criteria
 */
export const saTechRecommendations = {
  name: 'sa_tech_recommendations',
  description: 'Provide technology selection recommendations with stack analysis, framework comparison, performance considerations, and technology selection criteria',
  category: 'architect',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        description: 'Name of the project requiring technology recommendations',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      projectType: {
        type: 'string',
        description: 'Type of project',
        enum: ['web-application', 'mobile-app', 'api-service', 'microservices', 'data-platform', 'desktop-app', 'iot-system'],
        default: 'web-application'
      },
      requirements: {
        type: 'object',
        description: 'Project requirements and constraints',
        properties: {
          performance: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          scalability: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          security: { type: 'string', enum: ['basic', 'standard', 'high', 'critical'] },
          maintainability: { type: 'string', enum: ['low', 'medium', 'high'] },
          timeToMarket: { type: 'string', enum: ['flexible', 'standard', 'urgent'] },
          budget: { type: 'string', enum: ['low', 'medium', 'high', 'unlimited'] }
        }
      },
      teamSkills: {
        type: 'object',
        description: 'Team skills and experience',
        properties: {
          languages: { type: 'array', items: { type: 'string' } },
          frameworks: { type: 'array', items: { type: 'string' } },
          databases: { type: 'array', items: { type: 'string' } },
          cloudPlatforms: { type: 'array', items: { type: 'string' } },
          experienceLevel: { type: 'string', enum: ['junior', 'intermediate', 'senior', 'expert'] }
        }
      },
      constraints: {
        type: 'object',
        description: 'Technology constraints',
        properties: {
          mustUse: { type: 'array', items: { type: 'string' } },
          cannotUse: { type: 'array', items: { type: 'string' } },
          preferredVendors: { type: 'array', items: { type: 'string' } },
          complianceRequirements: { type: 'array', items: { type: 'string' } },
          integrationRequirements: { type: 'array', items: { type: 'string' } }
        }
      },
      analysisDepth: {
        type: 'string',
        description: 'Depth of technology analysis',
        enum: ['overview', 'detailed', 'comprehensive'],
        default: 'detailed'
      },
      includeAlternatives: {
        type: 'boolean',
        description: 'Include alternative technology options',
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
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const projectName = args.projectName.trim();
    
    try {
      const analysisContext = {
        projectName,
        projectType: args.projectType || 'web-application',
        requirements: args.requirements || {},
        teamSkills: args.teamSkills || {},
        constraints: args.constraints || {},
        analysisDepth: args.analysisDepth || 'detailed',
        includeAlternatives: args.includeAlternatives !== false,
        timestamp: new Date().toISOString(),
        analyst: context?.userId || 'system',
        analysisId: `tech-recommendations-${Date.now()}`
      };

      // Technology landscape analysis
      const technologyLandscape = await this.analyzeTechnologyLandscape(analysisContext);
      
      // Framework comparison
      const frameworkComparison = await this.compareFrameworks(analysisContext, technologyLandscape);
      
      // Technology recommendations
      const recommendations = await this.generateRecommendations(analysisContext, frameworkComparison);
      
      // Alternative options
      let alternatives = null;
      if (analysisContext.includeAlternatives) {
        alternatives = await this.generateAlternatives(analysisContext, recommendations);
      }
      
      // Implementation roadmap
      const roadmap = await this.createImplementationRoadmap(analysisContext, recommendations);
      
      // Format output
      const output = await this.formatTechRecommendationsOutput(
        analysisContext, 
        technologyLandscape, 
        frameworkComparison, 
        recommendations, 
        alternatives, 
        roadmap
      );
      
      // Save recommendations
      await this.saveTechRecommendationsToProject(projectPath, analysisContext, {
        landscape: technologyLandscape,
        comparison: frameworkComparison,
        recommendations,
        alternatives,
        roadmap
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          projectName,
          projectType: args.projectType,
          analysisDepth: args.analysisDepth,
          includeAlternatives: args.includeAlternatives,
          analysisId: analysisContext.analysisId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to generate tech recommendations for ${projectName}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, projectName, projectPath }
      };
    }
  },

  async analyzeTechnologyLandscape(context) {
    const landscape = {
      primaryTechnologies: this.identifyPrimaryTechnologies(context),
      supportingTechnologies: this.identifySupportingTechnologies(context),
      technologyTrends: this.analyzeTechnologyTrends(context),
      riskAssessment: this.assessTechnologyRisks(context)
    };
    
    return landscape;
  },

  identifyPrimaryTechnologies(context) {
    const technologies = {
      frontend: [],
      backend: [],
      database: [],
      infrastructure: [],
      mobile: []
    };
    
    switch (context.projectType) {
      case 'web-application':
        technologies.frontend = ['React', 'Vue.js', 'Angular', 'Svelte'];
        technologies.backend = ['Node.js', 'Python (Django/FastAPI)', 'Java (Spring)', 'C# (.NET)'];
        technologies.database = ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'];
        technologies.infrastructure = ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'];
        break;
        
      case 'mobile-app':
        technologies.mobile = ['React Native', 'Flutter', 'Native iOS/Android', 'Ionic'];
        technologies.backend = ['Node.js', 'Python', 'Java', 'Go'];
        technologies.database = ['Firebase', 'PostgreSQL', 'MongoDB', 'SQLite'];
        technologies.infrastructure = ['AWS Mobile', 'Firebase', 'Azure Mobile'];
        break;
        
      case 'api-service':
        technologies.backend = ['Node.js (Express/Fastify)', 'Python (FastAPI)', 'Go', 'Java (Spring Boot)'];
        technologies.database = ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'];
        technologies.infrastructure = ['Docker', 'Kubernetes', 'API Gateway', 'Load Balancer'];
        break;
        
      case 'microservices':
        technologies.backend = ['Node.js', 'Go', 'Java (Spring Boot)', 'Python'];
        technologies.database = ['PostgreSQL', 'MongoDB', 'Redis', 'Event Store'];
        technologies.infrastructure = ['Kubernetes', 'Service Mesh', 'API Gateway', 'Message Queue'];
        break;
        
      case 'data-platform':
        technologies.backend = ['Python', 'Scala', 'Java', 'R'];
        technologies.database = ['PostgreSQL', 'MongoDB', 'Cassandra', 'InfluxDB', 'Data Lake'];
        technologies.infrastructure = ['Apache Spark', 'Kafka', 'Airflow', 'Jupyter'];
        break;
    }
    
    return technologies;
  },

  identifySupportingTechnologies(context) {
    return {
      testing: ['Jest', 'Cypress', 'Selenium', 'JUnit', 'pytest'],
      cicd: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'Azure DevOps'],
      monitoring: ['Prometheus', 'Grafana', 'DataDog', 'New Relic'],
      security: ['OAuth 2.0', 'JWT', 'HTTPS/TLS', 'OWASP Tools'],
      documentation: ['OpenAPI/Swagger', 'GitBook', 'Confluence'],
      versionControl: ['Git', 'GitHub', 'GitLab', 'Bitbucket']
    };
  },

  analyzeTechnologyTrends(context) {
    return {
      emerging: ['WebAssembly', 'Edge Computing', 'Serverless', 'GraphQL', 'JAMstack'],
      declining: ['jQuery', 'AngularJS', 'Flash', 'SOAP', 'Monolithic architectures'],
      stable: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
      considerations: [
        'AI/ML integration becoming standard',
        'Cloud-native architectures preferred',
        'Security-first development approach',
        'Performance optimization critical',
        'Developer experience increasingly important'
      ]
    };
  },

  assessTechnologyRisks(context) {
    return {
      adoptionRisks: [
        'Learning curve for new technologies',
        'Limited community support for newer frameworks',
        'Integration challenges with existing systems',
        'Vendor lock-in with proprietary solutions'
      ],
      technicalRisks: [
        'Performance bottlenecks with incorrect technology choices',
        'Scalability limitations',
        'Security vulnerabilities in dependencies',
        'Maintenance burden of complex technology stacks'
      ],
      businessRisks: [
        'Increased development time due to technology learning',
        'Higher costs for specialized expertise',
        'Difficulty finding qualified developers',
        'Technology obsolescence over project lifetime'
      ]
    };
  },

  async compareFrameworks(context, landscape) {
    const comparison = {};
    
    // Compare frameworks for each technology category
    Object.entries(landscape.primaryTechnologies).forEach(([category, technologies]) => {
      if (technologies.length > 0) {
        comparison[category] = this.compareFrameworksInCategory(category, technologies, context);
      }
    });
    
    return comparison;
  },

  compareFrameworksInCategory(category, technologies, context) {
    const comparison = {};
    
    technologies.forEach(tech => {
      comparison[tech] = {
        pros: this.getTechnologyPros(tech, context),
        cons: this.getTechnologyCons(tech, context),
        suitability: this.assessSuitability(tech, context),
        learningCurve: this.assessLearningCurve(tech, context),
        communitySupport: this.assessCommunitySupport(tech),
        performance: this.assessPerformance(tech, context),
        ecosystem: this.assessEcosystem(tech)
      };
    });
    
    return comparison;
  },

  getTechnologyPros(tech, context) {
    const prosMap = {
      'React': ['Large ecosystem', 'Strong community', 'Flexible architecture', 'Great developer tools'],
      'Vue.js': ['Easy learning curve', 'Great documentation', 'Gradual adoption possible', 'Good performance'],
      'Angular': ['Full framework', 'TypeScript by default', 'Enterprise ready', 'Comprehensive CLI'],
      'Node.js': ['JavaScript everywhere', 'Fast development', 'Large package ecosystem', 'Non-blocking I/O'],
      'Python': ['Readable syntax', 'Rich libraries', 'Great for data science', 'Rapid prototyping'],
      'Go': ['High performance', 'Simple syntax', 'Built-in concurrency', 'Fast compilation'],
      'PostgreSQL': ['ACID compliance', 'Rich feature set', 'Extensible', 'Strong consistency'],
      'MongoDB': ['Flexible schema', 'Horizontal scaling', 'JSON-like documents', 'Rich query language']
    };
    
    return prosMap[tech] || ['Industry adoption', 'Active development', 'Good documentation'];
  },

  getTechnologyCons(tech, context) {
    const consMap = {
      'React': ['Steep learning curve', 'Rapid ecosystem changes', 'JSX learning required', 'State management complexity'],
      'Vue.js': ['Smaller ecosystem than React', 'Less enterprise adoption', 'Fewer job opportunities'],
      'Angular': ['Steep learning curve', 'Complex framework', 'Frequent major updates', 'Opinionated structure'],
      'Node.js': ['Single-threaded limitations', 'Callback hell potential', 'Rapid ecosystem changes'],
      'Python': ['Performance limitations', 'Global Interpreter Lock', 'Package management complexity'],
      'Go': ['Limited generics support', 'Verbose error handling', 'Smaller ecosystem'],
      'PostgreSQL': ['Configuration complexity', 'Resource intensive', 'Learning curve for advanced features'],
      'MongoDB': ['Eventual consistency', 'Memory usage', 'Schema design challenges']
    };
    
    return consMap[tech] || ['Learning curve', 'Potential compatibility issues', 'Maintenance overhead'];
  },

  assessSuitability(tech, context) {
    const requirements = context.requirements;
    let score = 50; // Base score
    
    // Adjust based on requirements
    if (requirements.performance === 'critical' && ['Go', 'Rust', 'C++'].includes(tech)) score += 20;
    if (requirements.timeToMarket === 'urgent' && ['React', 'Vue.js', 'Python', 'Node.js'].includes(tech)) score += 15;
    if (requirements.scalability === 'critical' && ['Go', 'Kubernetes', 'PostgreSQL'].includes(tech)) score += 20;
    
    // Adjust based on team skills
    if (context.teamSkills.languages && context.teamSkills.languages.includes(tech)) score += 25;
    if (context.teamSkills.frameworks && context.teamSkills.frameworks.includes(tech)) score += 25;
    
    return Math.min(100, Math.max(0, score));
  },

  assessLearningCurve(tech, context) {
    const difficultyMap = {
      'React': 'Medium',
      'Vue.js': 'Low',
      'Angular': 'High',
      'Node.js': 'Low',
      'Python': 'Low',
      'Go': 'Medium',
      'Java': 'Medium',
      'PostgreSQL': 'Medium',
      'MongoDB': 'Low'
    };
    
    const baseDifficulty = difficultyMap[tech] || 'Medium';
    const teamLevel = context.teamSkills.experienceLevel || 'intermediate';
    
    if (teamLevel === 'expert') return 'Low';
    if (teamLevel === 'junior' && baseDifficulty === 'High') return 'Very High';
    
    return baseDifficulty;
  },

  assessCommunitySupport(tech) {
    const supportMap = {
      'React': 'Excellent',
      'Vue.js': 'Good',
      'Angular': 'Good',
      'Node.js': 'Excellent',
      'Python': 'Excellent',
      'Go': 'Good',
      'PostgreSQL': 'Excellent',
      'MongoDB': 'Good'
    };
    
    return supportMap[tech] || 'Fair';
  },

  assessPerformance(tech, context) {
    const performanceMap = {
      'React': 'Good',
      'Vue.js': 'Good',
      'Angular': 'Fair',
      'Node.js': 'Good',
      'Python': 'Fair',
      'Go': 'Excellent',
      'PostgreSQL': 'Excellent',
      'MongoDB': 'Good'
    };
    
    return performanceMap[tech] || 'Fair';
  },

  assessEcosystem(tech) {
    const ecosystemMap = {
      'React': 'Excellent',
      'Vue.js': 'Good',
      'Angular': 'Good',
      'Node.js': 'Excellent',
      'Python': 'Excellent',
      'Go': 'Good',
      'PostgreSQL': 'Excellent',
      'MongoDB': 'Good'
    };
    
    return ecosystemMap[tech] || 'Fair';
  },

  async generateRecommendations(context, comparison) {
    const recommendations = {
      primaryRecommendations: {},
      reasoningMatrix: {},
      riskAssessment: {},
      implementationConsiderations: {}
    };
    
    // Generate recommendations for each category
    Object.entries(comparison).forEach(([category, frameworks]) => {
      recommendations.primaryRecommendations[category] = this.selectBestFramework(frameworks, context);
      recommendations.reasoningMatrix[category] = this.generateReasoning(frameworks, context);
    });
    
    // Overall risk assessment
    recommendations.riskAssessment = this.assessOverallRisk(recommendations.primaryRecommendations, context);
    
    // Implementation considerations
    recommendations.implementationConsiderations = this.generateImplementationConsiderations(recommendations.primaryRecommendations, context);
    
    return recommendations;
  },

  selectBestFramework(frameworks, context) {
    let bestFramework = null;
    let bestScore = 0;
    
    Object.entries(frameworks).forEach(([framework, analysis]) => {
      if (analysis.suitability > bestScore) {
        bestScore = analysis.suitability;
        bestFramework = {
          name: framework,
          score: bestScore,
          rationale: this.generateSelectionRationale(framework, analysis, context)
        };
      }
    });
    
    return bestFramework;
  },

  generateSelectionRationale(framework, analysis, context) {
    const reasons = [];
    
    if (analysis.suitability >= 80) {
      reasons.push('High suitability for project requirements');
    }
    
    if (analysis.learningCurve === 'Low') {
      reasons.push('Low learning curve for team');
    }
    
    if (analysis.communitySupport === 'Excellent') {
      reasons.push('Excellent community support');
    }
    
    if (analysis.performance === 'Excellent' && context.requirements.performance === 'critical') {
      reasons.push('High performance meets critical requirements');
    }
    
    return reasons.join('; ');
  },

  generateReasoning(frameworks, context) {
    const matrix = {};
    
    Object.entries(frameworks).forEach(([framework, analysis]) => {
      matrix[framework] = {
        strengths: analysis.pros.slice(0, 3),
        weaknesses: analysis.cons.slice(0, 2),
        bestFor: this.identifyBestUseCase(framework, analysis),
        recommendation: analysis.suitability >= 70 ? 'Recommended' : analysis.suitability >= 50 ? 'Consider' : 'Not Recommended'
      };
    });
    
    return matrix;
  },

  identifyBestUseCase(framework, analysis) {
    const useCases = {
      'React': 'Complex interactive UIs with frequent state changes',
      'Vue.js': 'Teams new to modern frameworks or gradual migration',
      'Angular': 'Large enterprise applications with complex requirements',
      'Node.js': 'Real-time applications and JavaScript-centric teams',
      'Python': 'Data-heavy applications and rapid prototyping',
      'Go': 'High-performance microservices and system programming',
      'PostgreSQL': 'Applications requiring strong consistency and complex queries',
      'MongoDB': 'Applications with evolving schemas and document-based data'
    };
    
    return useCases[framework] || 'General purpose applications';
  },

  assessOverallRisk(recommendations, context) {
    let totalRisk = 0;
    let riskFactors = [];
    
    Object.values(recommendations).forEach(rec => {
      if (rec && rec.score < 60) {
        totalRisk += 20;
        riskFactors.push(`Low suitability score for ${rec.name}`);
      }
    });
    
    if (context.teamSkills.experienceLevel === 'junior') {
      totalRisk += 15;
      riskFactors.push('Junior team may face learning curve challenges');
    }
    
    if (context.requirements.timeToMarket === 'urgent') {
      totalRisk += 10;
      riskFactors.push('Urgent timeline increases implementation risk');
    }
    
    return {
      riskLevel: totalRisk > 50 ? 'High' : totalRisk > 25 ? 'Medium' : 'Low',
      riskScore: totalRisk,
      riskFactors,
      mitigationStrategies: this.generateRiskMitigation(riskFactors, context)
    };
  },

  generateRiskMitigation(riskFactors, context) {
    const strategies = [];
    
    if (riskFactors.some(f => f.includes('learning curve'))) {
      strategies.push('Provide team training and learning resources');
      strategies.push('Start with pilot project or proof of concept');
    }
    
    if (riskFactors.some(f => f.includes('timeline'))) {
      strategies.push('Use proven technologies over cutting-edge options');
      strategies.push('Implement MVP first, then iterate');
    }
    
    if (riskFactors.some(f => f.includes('suitability'))) {
      strategies.push('Consider alternative technology options');
      strategies.push('Validate technology choices with prototypes');
    }
    
    return strategies;
  },

  generateImplementationConsiderations(recommendations, context) {
    return {
      developmentSetup: 'Configure development environment and tooling',
      teamTraining: 'Plan training schedule for new technologies',
      migrationStrategy: 'If upgrading, plan migration from existing technologies',
      qualityAssurance: 'Establish testing and quality assurance processes',
      deployment: 'Set up CI/CD pipelines and deployment infrastructure',
      monitoring: 'Implement application monitoring and logging',
      maintenance: 'Plan for ongoing maintenance and updates'
    };
  },

  async generateAlternatives(context, recommendations) {
    const alternatives = {};
    
    Object.entries(recommendations.primaryRecommendations).forEach(([category, primary]) => {
      alternatives[category] = this.generateAlternativeOptions(category, primary, context);
    });
    
    return alternatives;
  },

  generateAlternativeOptions(category, primary, context) {
    const alternativeMap = {
      frontend: {
        'React': ['Vue.js', 'Angular', 'Svelte'],
        'Vue.js': ['React', 'Angular', 'Svelte'],
        'Angular': ['React', 'Vue.js', 'Svelte']
      },
      backend: {
        'Node.js': ['Python (FastAPI)', 'Go', 'Java (Spring Boot)'],
        'Python': ['Node.js', 'Go', 'Java'],
        'Go': ['Node.js', 'Python', 'Rust']
      },
      database: {
        'PostgreSQL': ['MongoDB', 'MySQL', 'CockroachDB'],
        'MongoDB': ['PostgreSQL', 'CouchDB', 'DynamoDB'],
        'MySQL': ['PostgreSQL', 'MariaDB', 'SQLite']
      }
    };
    
    const primaryName = primary ? primary.name : '';
    const alternatives = alternativeMap[category] && alternativeMap[category][primaryName] 
      ? alternativeMap[category][primaryName] 
      : [];
    
    return alternatives.map(alt => ({
      name: alt,
      reason: this.generateAlternativeReason(alt, primaryName, context),
      tradeoffs: this.generateTradeoffs(alt, primaryName)
    }));
  },

  generateAlternativeReason(alternative, primary, context) {
    const reasons = {
      'Vue.js': 'Easier learning curve and gradual adoption',
      'Angular': 'More opinionated structure and enterprise features',
      'Svelte': 'Smaller bundle size and compile-time optimizations',
      'Python (FastAPI)': 'Excellent for API development with automatic documentation',
      'Go': 'Superior performance and built-in concurrency',
      'Java (Spring Boot)': 'Enterprise-grade features and ecosystem',
      'MongoDB': 'Better for flexible, document-based data models',
      'MySQL': 'Simpler setup and widespread hosting support'
    };
    
    return reasons[alternative] || 'Alternative technology option with different trade-offs';
  },

  generateTradeoffs(alternative, primary) {
    return {
      advantages: [`Potential benefits over ${primary}`],
      disadvantages: [`Potential drawbacks compared to ${primary}`]
    };
  },

  async createImplementationRoadmap(context, recommendations) {
    return {
      phases: [
        {
          phase: 'Setup & Planning',
          duration: '1-2 weeks',
          activities: [
            'Environment setup and tooling configuration',
            'Team training and onboarding',
            'Architecture planning and documentation',
            'Initial project structure creation'
          ]
        },
        {
          phase: 'Foundation Development',
          duration: '2-4 weeks',
          activities: [
            'Core infrastructure implementation',
            'Basic component structure',
            'Initial integrations and APIs',
            'Testing framework setup'
          ]
        },
        {
          phase: 'Feature Development',
          duration: '4-12 weeks',
          activities: [
            'Implement core features',
            'User interface development',
            'Business logic implementation',
            'Integration testing'
          ]
        },
        {
          phase: 'Integration & Testing',
          duration: '2-4 weeks',
          activities: [
            'System integration testing',
            'Performance optimization',
            'Security testing',
            'User acceptance testing'
          ]
        },
        {
          phase: 'Deployment & Launch',
          duration: '1-2 weeks',
          activities: [
            'Production deployment',
            'Monitoring setup',
            'Documentation finalization',
            'Team training on operations'
          ]
        }
      ],
      keyMilestones: [
        'Technology stack finalized',
        'Development environment ready',
        'Core architecture implemented',
        'MVP features complete',
        'Production deployment successful'
      ],
      dependencies: [
        'Team training completion',
        'Infrastructure provisioning',
        'Third-party service integrations',
        'Security reviews and approvals'
      ]
    };
  },

  async formatTechRecommendationsOutput(context, landscape, comparison, recommendations, alternatives, roadmap) {
    let output = `⚙️ **Technology Recommendations: ${context.projectName}**\n\n`;
    output += `🎯 **Project Type:** ${context.projectType}\n`;
    output += `📊 **Analysis Depth:** ${context.analysisDepth}\n`;
    output += `📅 **Analysis Date:** ${new Date(context.timestamp).toLocaleDateString()}\n`;
    output += `🆔 **Analysis ID:** ${context.analysisId}\n\n`;

    // Primary Recommendations
    output += `## 🎯 Primary Technology Recommendations\n\n`;
    Object.entries(recommendations.primaryRecommendations).forEach(([category, rec]) => {
      if (rec) {
        output += `**${category.charAt(0).toUpperCase() + category.slice(1)}:** ${rec.name} (Score: ${rec.score}/100)\n`;
        output += `*Rationale:* ${rec.rationale}\n`;
      }
    });
    output += '\n';

    // Framework Comparison Summary
    output += `## 📊 Framework Analysis Summary\n\n`;
    Object.entries(comparison).forEach(([category, frameworks]) => {
      output += `**${category.charAt(0).toUpperCase() + category.slice(1)} Options:**\n`;
      Object.entries(frameworks).slice(0, 3).forEach(([framework, analysis]) => {
        output += `• **${framework}** - Suitability: ${analysis.suitability}/100, Learning: ${analysis.learningCurve}\n`;
        output += `  Strengths: ${analysis.pros.slice(0, 2).join(', ')}\n`;
      });
      output += '\n';
    });

    // Risk Assessment
    if (recommendations.riskAssessment) {
      output += `## ⚠️ Risk Assessment\n\n`;
      output += `**Overall Risk Level:** ${recommendations.riskAssessment.riskLevel}\n`;
      output += `**Risk Score:** ${recommendations.riskAssessment.riskScore}/100\n\n`;
      
      if (recommendations.riskAssessment.riskFactors.length > 0) {
        output += `**Risk Factors:**\n`;
        recommendations.riskAssessment.riskFactors.forEach(factor => {
          output += `• ${factor}\n`;
        });
        output += '\n';
      }
      
      if (recommendations.riskAssessment.mitigationStrategies.length > 0) {
        output += `**Mitigation Strategies:**\n`;
        recommendations.riskAssessment.mitigationStrategies.forEach(strategy => {
          output += `• ${strategy}\n`;
        });
        output += '\n';
      }
    }

    // Alternative Options
    if (alternatives && Object.keys(alternatives).length > 0) {
      output += `## 🔄 Alternative Technology Options\n\n`;
      Object.entries(alternatives).forEach(([category, alts]) => {
        if (alts.length > 0) {
          output += `**${category.charAt(0).toUpperCase() + category.slice(1)} Alternatives:**\n`;
          alts.forEach(alt => {
            output += `• **${alt.name}:** ${alt.reason}\n`;
          });
          output += '\n';
        }
      });
    }

    // Implementation Roadmap
    output += `## 🛣️ Implementation Roadmap\n\n`;
    roadmap.phases.forEach((phase, index) => {
      output += `**Phase ${index + 1}: ${phase.phase}** (${phase.duration})\n`;
      phase.activities.forEach(activity => {
        output += `• ${activity}\n`;
      });
      output += '\n';
    });

    // Technology Trends
    output += `## 📈 Technology Landscape Insights\n\n`;
    output += `**Emerging Technologies:** ${landscape.technologyTrends.emerging.join(', ')}\n`;
    output += `**Stable Technologies:** ${landscape.technologyTrends.stable.join(', ')}\n`;
    output += `**Key Considerations:**\n`;
    landscape.technologyTrends.considerations.forEach(consideration => {
      output += `• ${consideration}\n`;
    });
    output += '\n';

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Technology Validation:** Create proof-of-concept with recommended stack\n`;
    output += `2. **Team Preparation:** Plan training and skill development\n`;
    output += `3. **Environment Setup:** Configure development and deployment environments\n`;
    output += `4. **Architecture Finalization:** Create detailed technical architecture\n`;
    output += `5. **Implementation Planning:** Develop detailed project timeline\n\n`;

    output += `💡 **Technology Selection Tips:**\n`;
    output += `• Prioritize team expertise and learning capacity\n`;
    output += `• Consider long-term maintenance and support\n`;
    output += `• Validate choices with small prototypes\n`;
    output += `• Plan for technology evolution and updates\n`;
    output += `• Balance innovation with proven stability\n\n`;

    output += `📁 **Complete technology analysis and recommendations saved to project.**`;

    return output;
  },

  async saveTechRecommendationsToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const techDir = join(saDir, 'technology-recommendations');
      if (!existsSync(techDir)) {
        require('fs').mkdirSync(techDir, { recursive: true });
      }
      
      const filename = `tech-recommendations-${context.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(techDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save tech recommendations:', error.message);
    }
  }
};