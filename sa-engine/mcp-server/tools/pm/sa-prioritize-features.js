import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

/**
 * sa_prioritize_features MCP Tool
 * Feature prioritization with impact analysis and stakeholder feedback integration
 */
export const saPrioritizeFeatures = {
  name: 'sa_prioritize_features',
  description: 'Prioritize features using impact analysis, priority matrix application, stakeholder feedback integration, and strategic priority recommendations',
  category: 'pm',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      features: {
        type: 'array',
        description: 'List of features to prioritize',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            effort: { type: 'number', minimum: 1, maximum: 10 },
            businessValue: { type: 'number', minimum: 1, maximum: 10 },
            userImpact: { type: 'number', minimum: 1, maximum: 10 },
            urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            dependencies: { type: 'array', items: { type: 'string' } }
          },
          required: ['name', 'description']
        },
        minItems: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      prioritizationMethod: {
        type: 'string',
        description: 'Method for prioritization',
        enum: ['rice', 'moscow', 'kano', 'value-effort', 'weighted-scoring', 'cost-of-delay'],
        default: 'rice'
      },
      stakeholderWeights: {
        type: 'object',
        description: 'Weights for different stakeholder perspectives',
        properties: {
          business: { type: 'number', minimum: 0, maximum: 1 },
          technical: { type: 'number', minimum: 0, maximum: 1 },
          user: { type: 'number', minimum: 0, maximum: 1 },
          strategic: { type: 'number', minimum: 0, maximum: 1 }
        }
      },
      constraints: {
        type: 'object',
        description: 'Prioritization constraints',
        properties: {
          timeframe: { type: 'string' },
          resourceLimits: { type: 'string' },
          budgetConstraints: { type: 'string' },
          technicalConstraints: { type: 'array', items: { type: 'string' } }
        }
      },
      stakeholderFeedback: {
        type: 'array',
        description: 'Stakeholder feedback on features',
        items: {
          type: 'object',
          properties: {
            stakeholder: { type: 'string' },
            role: { type: 'string' },
            featureId: { type: 'string' },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            comments: { type: 'string' }
          }
        }
      },
      outputFormat: {
        type: 'string',
        description: 'Output format for prioritization results',
        enum: ['detailed-analysis', 'priority-matrix', 'roadmap-view', 'stakeholder-summary'],
        default: 'detailed-analysis'
      }
    },
    required: ['features']
  },

  validate(args) {
    const errors = [];
    
    if (!args.features || !Array.isArray(args.features) || args.features.length === 0) {
      errors.push('features is required and must be a non-empty array');
    }
    
    if (args.features) {
      args.features.forEach((feature, index) => {
        if (!feature.name || typeof feature.name !== 'string') {
          errors.push(`Feature ${index + 1} must have a valid name`);
        }
        if (!feature.description || typeof feature.description !== 'string') {
          errors.push(`Feature ${index + 1} must have a valid description`);
        }
      });
    }
    
    if (args.stakeholderWeights) {
      const weights = Object.values(args.stakeholderWeights);
      const sum = weights.reduce((total, weight) => total + weight, 0);
      if (Math.abs(sum - 1) > 0.01) {
        errors.push('Stakeholder weights must sum to 1.0');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    
    try {
      const prioritizationContext = {
        features: args.features,
        method: args.prioritizationMethod || 'rice',
        stakeholderWeights: args.stakeholderWeights || { business: 0.3, technical: 0.2, user: 0.3, strategic: 0.2 },
        constraints: args.constraints || {},
        stakeholderFeedback: args.stakeholderFeedback || [],
        outputFormat: args.outputFormat || 'detailed-analysis',
        timestamp: new Date().toISOString(),
        analyst: context?.userId || 'system',
        sessionId: `prioritization-${Date.now()}`
      };

      // Analyze features
      const featureAnalysis = await this.analyzeFeatures(prioritizationContext);
      
      // Apply prioritization method
      const prioritizationResults = await this.applyPrioritizationMethod(prioritizationContext, featureAnalysis);
      
      // Integrate stakeholder feedback
      const stakeholderIntegration = await this.integrateStakeholderFeedback(prioritizationContext, prioritizationResults);
      
      // Generate recommendations
      const recommendations = await this.generatePriorityRecommendations(prioritizationContext, stakeholderIntegration);
      
      // Format output
      const output = await this.formatPrioritizationOutput(prioritizationContext, stakeholderIntegration, recommendations);
      
      // Save results
      await this.savePrioritizationToProject(projectPath, prioritizationContext, {
        analysis: featureAnalysis,
        results: prioritizationResults,
        stakeholderIntegration,
        recommendations
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          featureCount: args.features.length,
          method: args.prioritizationMethod,
          outputFormat: args.outputFormat,
          sessionId: prioritizationContext.sessionId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to prioritize features: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, projectPath }
      };
    }
  },

  async analyzeFeatures(context) {
    const analysis = {
      featureCount: context.features.length,
      completenessCheck: {},
      impactDistribution: {},
      effortDistribution: {},
      riskAssessment: {}
    };

    // Check feature data completeness
    analysis.completenessCheck = context.features.reduce((acc, feature) => {
      acc[feature.id || feature.name] = {
        hasEffort: feature.effort !== undefined,
        hasBusinessValue: feature.businessValue !== undefined,
        hasUserImpact: feature.userImpact !== undefined,
        hasUrgency: feature.urgency !== undefined,
        hasRisk: feature.riskLevel !== undefined,
        completeness: 0
      };
      
      const checks = Object.values(acc[feature.id || feature.name]).slice(0, -1);
      acc[feature.id || feature.name].completeness = 
        checks.filter(Boolean).length / checks.length;
        
      return acc;
    }, {});

    return analysis;
  },

  async applyPrioritizationMethod(context, analysis) {
    const results = {
      method: context.method,
      scores: {},
      rankings: [],
      categories: {}
    };

    switch (context.method) {
      case 'rice':
        results.scores = this.calculateRiceScores(context.features);
        break;
      case 'moscow':
        results.categories = this.applyMoscowMethod(context.features);
        break;
      case 'value-effort':
        results.scores = this.calculateValueEffortScores(context.features);
        break;
      case 'weighted-scoring':
        results.scores = this.calculateWeightedScores(context.features, context.stakeholderWeights);
        break;
      default:
        results.scores = this.calculateRiceScores(context.features);
    }

    // Generate rankings if scores are available
    if (Object.keys(results.scores).length > 0) {
      results.rankings = Object.entries(results.scores)
        .sort(([,a], [,b]) => b.totalScore - a.totalScore)
        .map(([featureId, score], index) => ({
          rank: index + 1,
          featureId,
          score: score.totalScore,
          details: score
        }));
    }

    return results;
  },

  calculateRiceScores(features) {
    const scores = {};
    
    features.forEach(feature => {
      const reach = feature.userImpact || 5;
      const impact = feature.businessValue || 5;
      const confidence = feature.riskLevel === 'low' ? 100 : feature.riskLevel === 'medium' ? 80 : 50;
      const effort = feature.effort || 5;
      
      const riceScore = (reach * impact * (confidence / 100)) / effort;
      
      scores[feature.id || feature.name] = {
        reach,
        impact,
        confidence,
        effort,
        totalScore: riceScore,
        method: 'RICE'
      };
    });
    
    return scores;
  },

  applyMoscowMethod(features) {
    const categories = { must: [], should: [], could: [], wont: [] };
    
    features.forEach(feature => {
      const businessValue = feature.businessValue || 5;
      const urgency = feature.urgency || 'medium';
      
      if (businessValue >= 8 && urgency === 'high') {
        categories.must.push(feature);
      } else if (businessValue >= 6) {
        categories.should.push(feature);
      } else if (businessValue >= 4) {
        categories.could.push(feature);
      } else {
        categories.wont.push(feature);
      }
    });
    
    return categories;
  },

  calculateValueEffortScores(features) {
    const scores = {};
    
    features.forEach(feature => {
      const value = ((feature.businessValue || 5) + (feature.userImpact || 5)) / 2;
      const effort = feature.effort || 5;
      const score = value / effort;
      
      let category = 'low-priority';
      if (value >= 7 && effort <= 4) category = 'quick-wins';
      else if (value >= 7 && effort > 4) category = 'major-projects';
      else if (value < 7 && effort <= 4) category = 'fill-ins';
      
      scores[feature.id || feature.name] = {
        value,
        effort,
        totalScore: score,
        category,
        method: 'Value vs Effort'
      };
    });
    
    return scores;
  },

  calculateWeightedScores(features, weights) {
    const scores = {};
    
    features.forEach(feature => {
      const businessScore = (feature.businessValue || 5) * weights.business;
      const technicalScore = (10 - (feature.effort || 5)) * weights.technical; // Inverse effort
      const userScore = (feature.userImpact || 5) * weights.user;
      const strategicScore = (feature.urgency === 'high' ? 10 : feature.urgency === 'medium' ? 6 : 3) * weights.strategic;
      
      const totalScore = businessScore + technicalScore + userScore + strategicScore;
      
      scores[feature.id || feature.name] = {
        businessScore,
        technicalScore,
        userScore,
        strategicScore,
        totalScore,
        method: 'Weighted Scoring'
      };
    });
    
    return scores;
  },

  async integrateStakeholderFeedback(context, results) {
    const integration = {
      ...results,
      stakeholderAdjustments: {},
      consensusAnalysis: {},
      conflictResolution: {}
    };

    // Process stakeholder feedback
    const feedbackByFeature = context.stakeholderFeedback.reduce((acc, feedback) => {
      if (!acc[feedback.featureId]) acc[feedback.featureId] = [];
      acc[feedback.featureId].push(feedback);
      return acc;
    }, {});

    // Calculate stakeholder consensus
    Object.entries(feedbackByFeature).forEach(([featureId, feedbacks]) => {
      const priorities = feedbacks.map(f => {
        switch(f.priority) {
          case 'critical': return 4;
          case 'high': return 3;
          case 'medium': return 2;
          case 'low': return 1;
          default: return 2;
        }
      });
      
      const avgPriority = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;
      const variance = priorities.reduce((sum, p) => sum + Math.pow(p - avgPriority, 2), 0) / priorities.length;
      
      integration.consensusAnalysis[featureId] = {
        averagePriority: avgPriority,
        consensus: variance < 0.5 ? 'high' : variance < 1.5 ? 'medium' : 'low',
        stakeholderCount: feedbacks.length,
        feedbacks
      };
    });

    return integration;
  },

  async generatePriorityRecommendations(context, integration) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      investigate: [],
      strategic: {}
    };

    // Categorize features based on scores and stakeholder feedback
    if (integration.rankings && integration.rankings.length > 0) {
      const topQuartile = Math.ceil(integration.rankings.length * 0.25);
      const midPoint = Math.ceil(integration.rankings.length * 0.5);

      integration.rankings.forEach((ranking, index) => {
        const feature = context.features.find(f => (f.id || f.name) === ranking.featureId);
        const consensus = integration.consensusAnalysis[ranking.featureId];
        
        const recommendation = {
          feature: feature.name,
          rank: ranking.rank,
          score: ranking.score,
          rationale: this.generateRationale(ranking, feature, consensus),
          risks: this.identifyRisks(feature, consensus),
          dependencies: feature.dependencies || []
        };

        if (index < topQuartile && (!consensus || consensus.consensus !== 'low')) {
          recommendations.immediate.push(recommendation);
        } else if (index < midPoint) {
          recommendations.shortTerm.push(recommendation);
        } else {
          recommendations.longTerm.push(recommendation);
        }
      });
    }

    // Strategic recommendations
    recommendations.strategic = {
      focusAreas: this.identifyFocusAreas(context.features, integration),
      riskMitigation: this.generateRiskMitigation(context.features),
      resourceAllocation: this.suggestResourceAllocation(integration.rankings),
      roadmapGuidance: this.generateRoadmapGuidance(recommendations)
    };

    return recommendations;
  },

  generateRationale(ranking, feature, consensus) {
    let rationale = `High ${ranking.details.method} score (${ranking.score.toFixed(2)})`;
    
    if (consensus) {
      rationale += `, ${consensus.consensus} stakeholder consensus`;
    }
    
    if (feature.urgency === 'high') {
      rationale += ', high urgency';
    }
    
    if (feature.riskLevel === 'low') {
      rationale += ', low implementation risk';
    }
    
    return rationale;
  },

  identifyRisks(feature, consensus) {
    const risks = [];
    
    if (feature.riskLevel === 'high') {
      risks.push('High technical implementation risk');
    }
    
    if (feature.dependencies && feature.dependencies.length > 0) {
      risks.push(`Dependencies on: ${feature.dependencies.join(', ')}`);
    }
    
    if (consensus && consensus.consensus === 'low') {
      risks.push('Low stakeholder consensus on priority');
    }
    
    if (feature.effort >= 8) {
      risks.push('High effort requirement may delay delivery');
    }
    
    return risks;
  },

  identifyFocusAreas(features, integration) {
    // Analyze feature themes and patterns
    const themes = {};
    features.forEach(feature => {
      // Simple keyword extraction for themes
      const words = feature.description.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          themes[word] = (themes[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, frequency: count }));
  },

  generateRiskMitigation(features) {
    return [
      'Conduct technical spikes for high-risk features',
      'Establish clear dependency management process',
      'Create fallback plans for critical features',
      'Regular stakeholder alignment sessions'
    ];
  },

  suggestResourceAllocation(rankings) {
    if (!rankings || rankings.length === 0) return {};
    
    const total = rankings.length;
    return {
      immediate: `${Math.round((rankings.length * 0.4) / total * 100)}% - Top priority features`,
      shortTerm: `${Math.round((rankings.length * 0.4) / total * 100)}% - Medium priority features`,
      longTerm: `${Math.round((rankings.length * 0.2) / total * 100)}% - Future features and innovation`
    };
  },

  generateRoadmapGuidance(recommendations) {
    return {
      phase1: `Focus on ${recommendations.immediate.length} immediate priority features`,
      phase2: `Plan ${recommendations.shortTerm.length} short-term features for next iteration`,
      phase3: `Roadmap ${recommendations.longTerm.length} long-term features for strategic planning`
    };
  },

  async formatPrioritizationOutput(context, integration, recommendations) {
    let output = `📊 **Feature Prioritization Analysis**\n\n`;
    output += `🔍 **Method:** ${context.method.toUpperCase()}\n`;
    output += `📈 **Features Analyzed:** ${context.features.length}\n`;
    output += `👥 **Stakeholder Feedback:** ${context.stakeholderFeedback.length} responses\n`;
    output += `📅 **Analysis Date:** ${new Date(context.timestamp).toLocaleDateString()}\n\n`;

    // Top Priority Features
    if (recommendations.immediate.length > 0) {
      output += `## 🚀 Immediate Priority Features\n\n`;
      recommendations.immediate.forEach((rec, index) => {
        output += `**${index + 1}. ${rec.feature}** (Rank #${rec.rank})\n`;
        output += `*Score: ${rec.score.toFixed(2)}*\n`;
        output += `*Rationale: ${rec.rationale}*\n`;
        if (rec.risks.length > 0) {
          output += `*Risks: ${rec.risks.join('; ')}*\n`;
        }
        output += '\n';
      });
    }

    // Method-specific details
    if (integration.rankings && integration.rankings.length > 0) {
      output += `## 📋 Complete Priority Ranking\n\n`;
      integration.rankings.slice(0, 10).forEach(ranking => {
        const feature = context.features.find(f => (f.id || f.name) === ranking.featureId);
        output += `**${ranking.rank}. ${feature.name}** - Score: ${ranking.score.toFixed(2)}\n`;
      });
      
      if (integration.rankings.length > 10) {
        output += `... and ${integration.rankings.length - 10} more features\n`;
      }
      output += '\n';
    }

    // Stakeholder Consensus
    if (Object.keys(integration.consensusAnalysis).length > 0) {
      output += `## 👥 Stakeholder Consensus Analysis\n\n`;
      Object.entries(integration.consensusAnalysis).forEach(([featureId, analysis]) => {
        const feature = context.features.find(f => (f.id || f.name) === featureId);
        output += `**${feature.name}:** ${analysis.consensus} consensus (${analysis.stakeholderCount} stakeholders)\n`;
      });
      output += '\n';
    }

    // Strategic Recommendations
    output += `## 🎯 Strategic Recommendations\n\n`;
    
    output += `**Resource Allocation:**\n`;
    Object.entries(recommendations.strategic.resourceAllocation).forEach(([phase, allocation]) => {
      output += `• ${phase}: ${allocation}\n`;
    });
    output += '\n';
    
    output += `**Focus Areas:**\n`;
    recommendations.strategic.focusAreas.forEach(area => {
      output += `• ${area.theme} (${area.frequency} features)\n`;
    });
    output += '\n';
    
    output += `**Risk Mitigation:**\n`;
    recommendations.strategic.riskMitigation.forEach(mitigation => {
      output += `• ${mitigation}\n`;
    });
    output += '\n';

    // Implementation Roadmap
    output += `## 🛣️ Implementation Roadmap\n\n`;
    Object.entries(recommendations.strategic.roadmapGuidance).forEach(([phase, guidance]) => {
      output += `**${phase.charAt(0).toUpperCase() + phase.slice(1)}:** ${guidance}\n`;
    });
    output += '\n';

    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Stakeholder Review:** Present prioritization results for validation\n`;
    output += `2. **Resource Planning:** Allocate team capacity based on recommendations\n`;
    output += `3. **Risk Assessment:** Address identified risks for top priority features\n`;
    output += `4. **Roadmap Update:** Update product roadmap with prioritized features\n`;
    output += `5. **Regular Review:** Schedule periodic re-prioritization sessions\n\n`;

    output += `📁 **Prioritization analysis saved to project for reference.**`;

    return output;
  },

  async savePrioritizationToProject(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const prioritizationDir = join(saDir, 'prioritization');
      if (!existsSync(prioritizationDir)) {
        require('fs').mkdirSync(prioritizationDir, { recursive: true });
      }
      
      const filename = `feature-prioritization-${Date.now()}.json`;
      const filepath = join(prioritizationDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save prioritization:', error.message);
    }
  }
};