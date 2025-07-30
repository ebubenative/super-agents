import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_competitor_analysis MCP Tool
 * Competitive analysis with identification, framework application, and strategic recommendations
 */
export const saCompetitorAnalysis = {
  name: 'sa_competitor_analysis',
  description: 'Conduct comprehensive competitive analysis with competitor identification, analysis framework application, competitive landscape mapping, and strategic recommendations',
  category: 'analyst',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      industry: {
        type: 'string',
        description: 'Industry or market segment for analysis',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      competitors: {
        type: 'array',
        description: 'Known competitors to analyze',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['direct', 'indirect', 'substitute'] },
            url: { type: 'string' },
            marketShare: { type: 'string' },
            notes: { type: 'string' }
          },
          required: ['name', 'type']
        }
      },
      analysisScope: {
        type: 'string',
        description: 'Scope of competitive analysis',
        enum: ['comprehensive', 'feature-focused', 'market-positioning', 'pricing-analysis', 'swot-analysis'],
        default: 'comprehensive'
      },
      targetProduct: {
        type: 'object',
        description: 'Your product/service being positioned',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          targetMarket: { type: 'string' },
          keyFeatures: { type: 'array', items: { type: 'string' } },
          valueProposition: { type: 'string' }
        }
      },
      analysisFramework: {
        type: 'string',
        description: 'Analysis framework to use',
        enum: ['porter-five-forces', 'swot-matrix', 'feature-comparison', 'positioning-map', 'blue-ocean'],
        default: 'swot-matrix'
      },
      geoScope: {
        type: 'string',
        description: 'Geographic scope for analysis',
        enum: ['local', 'national', 'regional', 'global'],
        default: 'national'
      },
      outputFormat: {
        type: 'string',
        description: 'Output format for analysis',
        enum: ['detailed-report', 'executive-summary', 'comparison-matrix', 'strategic-brief'],
        default: 'detailed-report'
      },
      includeRecommendations: {
        type: 'boolean',
        description: 'Include strategic recommendations',
        default: true
      }
    },
    required: ['industry']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.industry || typeof args.industry !== 'string') {
      errors.push('industry is required and must be a string');
    }
    
    if (args.industry && args.industry.trim().length === 0) {
      errors.push('industry cannot be empty');
    }
    
    if (args.competitors && !Array.isArray(args.competitors)) {
      errors.push('competitors must be an array');
    }
    
    if (args.targetProduct && typeof args.targetProduct !== 'object') {
      errors.push('targetProduct must be an object');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute competitive analysis
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const industry = args.industry.trim();
    
    try {
      // Initialize template engine
      const templateEngine = new TemplateEngine({
        templatesPath: join(projectPath, 'sa-engine', 'templates')
      });
      
      await templateEngine.initialize();
      
      // Prepare analysis context
      const analysisContext = {
        industry,
        analysisScope: args.analysisScope || 'comprehensive',
        framework: args.analysisFramework || 'swot-matrix',
        geoScope: args.geoScope || 'national',
        outputFormat: args.outputFormat || 'detailed-report',
        competitors: args.competitors || [],
        targetProduct: args.targetProduct || {},
        includeRecommendations: args.includeRecommendations !== false,
        timestamp: new Date().toISOString(),
        analyst: context?.userId || 'system',
        analysisId: `competitor-analysis-${Date.now()}`
      };
      
      // Load competitor analysis template
      const analysisTemplate = await this.loadAnalysisTemplate(templateEngine);
      
      // Generate competitor identification framework
      const identificationFramework = await this.createCompetitorIdentificationFramework(analysisContext);
      
      // Create analysis framework
      const analysisFramework = await this.createAnalysisFramework(analysisContext, analysisTemplate);
      
      // Generate competitive landscape map
      const landscapeMap = await this.createCompetitiveLandscapeMap(analysisContext);
      
      // Generate strategic recommendations
      let recommendations = null;
      if (analysisContext.includeRecommendations) {
        recommendations = await this.generateStrategicRecommendations(analysisContext, analysisFramework);
      }
      
      // Format output based on format preference
      const output = await this.formatAnalysisOutput(
        analysisContext, 
        identificationFramework, 
        analysisFramework, 
        landscapeMap, 
        recommendations
      );
      
      // Save analysis to project
      await this.saveAnalysisToProject(projectPath, analysisContext, {
        identificationFramework,
        analysisFramework,
        landscapeMap,
        recommendations
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: output
          }
        ],
        metadata: {
          industry,
          analysisScope: args.analysisScope,
          framework: args.analysisFramework,
          competitorCount: analysisContext.competitors.length,
          outputFormat: args.outputFormat,
          includeRecommendations: args.includeRecommendations,
          analysisId: analysisContext.analysisId,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to conduct competitive analysis for ${industry}: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          industry,
          projectPath
        }
      };
    }
  },

  /**
   * Load analysis template
   * @param {TemplateEngine} templateEngine - Template engine instance
   * @returns {Promise<Object>} Analysis template
   */
  async loadAnalysisTemplate(templateEngine) {
    try {
      const template = await templateEngine.getTemplate('competitor-analysis-tmpl.yaml');
      return template;
    } catch (error) {
      // Return default template
      return {
        name: 'Competitive Analysis Template',
        sections: [
          'Executive Summary',
          'Market Overview',
          'Competitor Identification',
          'Competitive Analysis',
          'Market Positioning',
          'SWOT Analysis',
          'Strategic Recommendations'
        ],
        frameworks: {
          'swot-matrix': ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'],
          'porter-five-forces': ['Competitive Rivalry', 'Supplier Power', 'Buyer Power', 'Threat of Substitution', 'Threat of New Entry'],
          'feature-comparison': ['Core Features', 'Unique Features', 'Missing Features', 'Feature Quality']
        }
      };
    }
  },

  /**
   * Create competitor identification framework
   * @param {Object} context - Analysis context
   * @returns {Promise<Object>} Identification framework
   */
  async createCompetitorIdentificationFramework(context) {
    const framework = {
      categories: {
        direct: {
          description: 'Companies offering similar products/services to the same target market',
          criteria: ['Same target market', 'Similar value proposition', 'Competing for same customers'],
          examples: []
        },
        indirect: {
          description: 'Companies solving the same problem with different approaches',
          criteria: ['Different approach', 'Same customer need', 'Alternative solutions'],
          examples: []
        },
        substitute: {
          description: 'Products/services that can replace yours in meeting customer needs',
          criteria: ['Fulfills same need', 'Different category', 'Customer would choose instead of yours'],
          examples: []
        }
      },
      identificationMethods: [
        'Google search analysis',
        'Industry reports and publications',
        'Customer surveys and interviews',
        'Social media monitoring',
        'Patent and trademark searches',
        'Trade show and conference analysis',
        'Funding and investment tracking',
        'Job posting analysis'
      ],
      researchQuestions: [
        'Who else is targeting our customer segment?',
        'What alternatives do customers currently use?',
        'Which companies appear in the same industry reports?',
        'Who do customers compare us to?',
        'What solutions would customers use if we didn\'t exist?',
        'Who are the market leaders and innovators?',
        'Which companies have similar funding or growth patterns?',
        'Who appears in similar search results?'
      ]
    };
    
    // Categorize known competitors
    if (context.competitors.length > 0) {
      context.competitors.forEach(competitor => {
        framework.categories[competitor.type].examples.push({
          name: competitor.name,
          url: competitor.url,
          marketShare: competitor.marketShare,
          notes: competitor.notes
        });
      });
    }
    
    return framework;
  },

  /**
   * Create analysis framework
   * @param {Object} context - Analysis context
   * @param {Object} template - Analysis template
   * @returns {Promise<Object>} Analysis framework
   */
  async createAnalysisFramework(context, template) {
    const framework = {
      methodology: context.framework,
      analysisAreas: [],
      evaluationCriteria: {},
      comparisonMatrix: {}
    };
    
    switch (context.framework) {
      case 'porter-five-forces':
        framework.analysisAreas = [
          {
            name: 'Competitive Rivalry',
            description: 'Intensity of competition among existing players',
            factors: ['Number of competitors', 'Market growth rate', 'Product differentiation', 'Switching costs', 'Exit barriers'],
            questions: [
              'How many competitors are in the market?',
              'How intense is the price competition?',
              'How differentiated are the products?',
              'How easy is it for customers to switch?'
            ]
          },
          {
            name: 'Supplier Power',
            description: 'Bargaining power of suppliers',
            factors: ['Number of suppliers', 'Uniqueness of service', 'Switching costs', 'Forward integration threat'],
            questions: [
              'How many suppliers are available?',
              'How unique are the supplier offerings?',
              'What are the costs of switching suppliers?',
              'Could suppliers integrate forward?'
            ]
          },
          {
            name: 'Buyer Power',
            description: 'Bargaining power of customers',
            factors: ['Buyer concentration', 'Switching costs', 'Price sensitivity', 'Backward integration threat'],
            questions: [
              'How concentrated are the buyers?',
              'How price-sensitive are customers?',
              'What are customer switching costs?',
              'Could customers integrate backward?'
            ]
          },
          {
            name: 'Threat of Substitution',
            description: 'Likelihood of customers finding alternatives',
            factors: ['Substitute availability', 'Relative price', 'Performance comparison', 'Switching costs'],
            questions: [
              'What substitute products exist?',
              'How do substitutes compare on price?',
              'How do substitutes compare on performance?',
              'How easy is it to switch to substitutes?'
            ]
          },
          {
            name: 'Threat of New Entry',
            description: 'Likelihood of new competitors entering',
            factors: ['Entry barriers', 'Capital requirements', 'Economies of scale', 'Government regulations'],
            questions: [
              'What are the barriers to entry?',
              'How much capital is required to enter?',
              'Are there economies of scale advantages?',
              'What regulatory requirements exist?'
            ]
          }
        ];
        break;
        
      case 'swot-matrix':
        framework.analysisAreas = [
          {
            name: 'Strengths',
            description: 'Internal positive factors',
            categories: ['Resources', 'Capabilities', 'Market position', 'Brand reputation', 'Financial position'],
            questions: [
              'What does this competitor do well?',
              'What unique resources do they have?',
              'What advantages do they have over others?',
              'What do customers see as their strengths?'
            ]
          },
          {
            name: 'Weaknesses',
            description: 'Internal negative factors',
            categories: ['Resource limitations', 'Capability gaps', 'Market disadvantages', 'Operational issues'],
            questions: [
              'Where could this competitor improve?',
              'What do they lack compared to others?',
              'What do customers complain about?',
              'Where are they vulnerable?'
            ]
          },
          {
            name: 'Opportunities',
            description: 'External positive factors',
            categories: ['Market trends', 'Technology changes', 'Regulatory changes', 'Customer needs'],
            questions: [
              'What market opportunities exist?',
              'What trends could benefit them?',
              'What unmet customer needs exist?',
              'What partnerships could they form?'
            ]
          },
          {
            name: 'Threats',
            description: 'External negative factors',
            categories: ['Market challenges', 'Competitive threats', 'Technology disruption', 'Regulatory risks'],
            questions: [
              'What threatens their market position?',
              'What could disrupt their business?',
              'What competitive actions threaten them?',
              'What external risks do they face?'
            ]
          }
        ];
        break;
        
      case 'feature-comparison':
        framework.analysisAreas = [
          {
            name: 'Core Features',
            description: 'Essential product/service features',
            evaluation: ['Availability', 'Quality', 'Usability', 'Performance'],
            questions: [
              'What are the must-have features in this market?',
              'How well does each competitor deliver core features?',
              'Which competitor has the best implementation?',
              'Are there gaps in core feature delivery?'
            ]
          },
          {
            name: 'Unique Features',
            description: 'Differentiating features and capabilities',
            evaluation: ['Innovation', 'Uniqueness', 'Value addition', 'Competitive advantage'],
            questions: [
              'What unique features does each competitor offer?',
              'Which features provide competitive advantage?',
              'How innovative are the unique features?',
              'Which unique features drive customer choice?'
            ]
          },
          {
            name: 'Feature Gaps',
            description: 'Missing or underperformed features',
            evaluation: ['Customer demand', 'Market opportunity', 'Implementation difficulty', 'Strategic importance'],
            questions: [
              'What features are customers asking for?',
              'Where do competitors fall short?',
              'What features could provide advantage?',
              'Which gaps represent opportunities?'
            ]
          }
        ];
        break;
        
      default:
        framework.analysisAreas = [
          {
            name: 'Market Position',
            description: 'Competitive positioning in the market',
            factors: ['Market share', 'Brand recognition', 'Customer loyalty', 'Growth rate'],
            questions: [
              'What is their market position?',
              'How strong is their brand?',
              'What is their growth trajectory?',
              'How loyal are their customers?'
            ]
          },
          {
            name: 'Product/Service Analysis',
            description: 'Product or service offering evaluation',
            factors: ['Features', 'Quality', 'Pricing', 'Innovation'],
            questions: [
              'What do they offer?',
              'How does their offering compare?',
              'What is their pricing strategy?',
              'How innovative are they?'
            ]
          }
        ];
    }
    
    return framework;
  },

  /**
   * Create competitive landscape map
   * @param {Object} context - Analysis context
   * @returns {Promise<Object>} Landscape map
   */
  async createCompetitiveLandscapeMap(context) {
    const map = {
      dimensions: {},
      segments: {},
      positioningMap: {},
      marketDynamics: {}
    };
    
    // Define positioning dimensions based on analysis scope
    switch (context.analysisScope) {
      case 'market-positioning':
        map.dimensions = {
          xAxis: {
            name: 'Price Point',
            scale: ['Low', 'Medium', 'High', 'Premium'],
            description: 'Pricing strategy relative to market'
          },
          yAxis: {
            name: 'Product Sophistication',
            scale: ['Basic', 'Standard', 'Advanced', 'Enterprise'],
            description: 'Complexity and feature richness'
          }
        };
        break;
        
      case 'feature-focused':
        map.dimensions = {
          xAxis: {
            name: 'Feature Breadth',
            scale: ['Narrow', 'Focused', 'Broad', 'Comprehensive'],
            description: 'Range of features offered'
          },
          yAxis: {
            name: 'Feature Depth',
            scale: ['Basic', 'Standard', 'Advanced', 'Expert'],
            description: 'Sophistication of features'
          }
        };
        break;
        
      default:
        map.dimensions = {
          xAxis: {
            name: 'Market Share',
            scale: ['Niche', 'Growing', 'Established', 'Leader'],
            description: 'Relative market presence'
          },
          yAxis: {
            name: 'Innovation Level',
            scale: ['Follower', 'Adapter', 'Innovator', 'Pioneer'],
            description: 'Innovation and disruption capability'
          }
        };
    }
    
    // Define market segments
    map.segments = {
      leaders: {
        description: 'Market leaders with significant share and influence',
        characteristics: ['High market share', 'Strong brand', 'Broad reach', 'Resource advantage'],
        strategy: 'Maintain leadership position'
      },
      challengers: {
        description: 'Strong competitors challenging leaders',
        characteristics: ['Growing market share', 'Aggressive strategy', 'Innovation focus', 'Customer acquisition'],
        strategy: 'Challenge leader position'
      },
      followers: {
        description: 'Competitors following market trends',
        characteristics: ['Stable position', 'Cost focus', 'Niche specialization', 'Risk aversion'],
        strategy: 'Follow market trends'
      },
      nichers: {
        description: 'Specialists serving specific segments',
        characteristics: ['Narrow focus', 'Deep specialization', 'Premium positioning', 'Customer intimacy'],
        strategy: 'Dominate niche segments'
      }
    };
    
    // Market dynamics
    map.marketDynamics = {
      growth: {
        stage: 'Identify market maturity stage',
        rate: 'Analyze growth rate trends',
        drivers: 'Key factors driving growth'
      },
      competition: {
        intensity: 'Level of competitive rivalry',
        basis: 'Primary competitive factors',
        trends: 'Emerging competitive patterns'
      },
      innovation: {
        pace: 'Rate of innovation in market',
        areas: 'Key innovation focus areas',
        disruptors: 'Potential disruptive threats'
      },
      customers: {
        behavior: 'Customer behavior trends',
        needs: 'Evolving customer needs',
        switching: 'Customer switching patterns'
      }
    };
    
    return map;
  },

  /**
   * Generate strategic recommendations
   * @param {Object} context - Analysis context
   * @param {Object} framework - Analysis framework
   * @returns {Promise<Object>} Strategic recommendations
   */
  async generateStrategicRecommendations(context, framework) {
    const recommendations = {
      positioning: {},
      differentiation: {},
      competitive: {},
      strategic: {},
      tactical: {}
    };
    
    // Positioning recommendations
    recommendations.positioning = {
      category: 'Market Positioning',
      recommendations: [
        {
          title: 'Define Unique Value Proposition',
          description: 'Clearly articulate what makes your offering different and valuable',
          priority: 'high',
          rationale: 'Essential for competitive differentiation',
          actionItems: [
            'Identify unique strengths vs competitors',
            'Validate value proposition with customers',
            'Communicate positioning consistently across channels'
          ]
        },
        {
          title: 'Choose Competitive Position',
          description: 'Select optimal position relative to competitors',
          priority: 'high',
          rationale: 'Determines competitive strategy and resource allocation',
          actionItems: [
            'Analyze positioning map opportunities',
            'Evaluate feasibility of different positions',
            'Select defensible position'
          ]
        }
      ]
    };
    
    // Differentiation recommendations
    recommendations.differentiation = {
      category: 'Competitive Differentiation',
      recommendations: [
        {
          title: 'Leverage Competitive Advantages',
          description: 'Build on existing strengths and capabilities',
          priority: 'high',
          rationale: 'Maximize return on existing investments',
          actionItems: [
            'Identify sustainable competitive advantages',
            'Invest in strengthening key advantages',
            'Communicate advantages to market'
          ]
        },
        {
          title: 'Address Competitive Gaps',
          description: 'Close critical gaps vs competitors',
          priority: 'medium',
          rationale: 'Prevent competitive disadvantages',
          actionItems: [
            'Prioritize gaps by customer impact',
            'Develop plans to close priority gaps',
            'Monitor competitor improvements'
          ]
        }
      ]
    };
    
    // Competitive strategy recommendations
    recommendations.competitive = {
      category: 'Competitive Strategy',
      recommendations: [
        {
          title: 'Monitor Competitive Activity',
          description: 'Establish ongoing competitive intelligence',
          priority: 'medium',
          rationale: 'Stay informed of competitive changes',
          actionItems: [
            'Set up competitive monitoring systems',
            'Track competitor product/pricing changes',
            'Monitor competitor marketing activities'
          ]
        },
        {
          title: 'Anticipate Competitive Responses',
          description: 'Plan for likely competitor reactions',
          priority: 'medium',
          rationale: 'Prepare for competitive dynamics',
          actionItems: [
            'Model competitor response scenarios',
            'Prepare counter-strategies',
            'Build response flexibility'
          ]
        }
      ]
    };
    
    // Strategic recommendations
    recommendations.strategic = {
      category: 'Strategic Actions',
      recommendations: [
        {
          title: 'Focus on Defendable Advantages',
          description: 'Build advantages that are hard to replicate',
          priority: 'high',
          rationale: 'Create sustainable competitive position',
          actionItems: [
            'Identify defendable advantage sources',
            'Invest in building moats',
            'Strengthen customer relationships'
          ]
        },
        {
          title: 'Consider Strategic Partnerships',
          description: 'Explore partnerships to strengthen position',
          priority: 'medium',
          rationale: 'Leverage external capabilities',
          actionItems: [
            'Identify potential strategic partners',
            'Evaluate partnership opportunities',
            'Negotiate win-win partnerships'
          ]
        }
      ]
    };
    
    // Tactical recommendations
    recommendations.tactical = {
      category: 'Tactical Initiatives',
      recommendations: [
        {
          title: 'Optimize Pricing Strategy',
          description: 'Adjust pricing based on competitive analysis',
          priority: 'medium',
          rationale: 'Maximize revenue and competitiveness',
          actionItems: [
            'Analyze competitor pricing strategies',
            'Test price sensitivity',
            'Optimize pricing structure'
          ]
        },
        {
          title: 'Enhance Customer Experience',
          description: 'Differentiate through superior customer experience',
          priority: 'high',
          rationale: 'Create competitive advantage through experience',
          actionItems: [
            'Map customer journey vs competitors',
            'Identify experience improvement opportunities',
            'Implement experience enhancements'
          ]
        }
      ]
    };
    
    return recommendations;
  },

  /**
   * Format analysis output
   * @param {Object} context - Analysis context
   * @param {Object} identification - Identification framework
   * @param {Object} framework - Analysis framework
   * @param {Object} landscape - Landscape map
   * @param {Object} recommendations - Strategic recommendations
   * @returns {Promise<string>} Formatted output
   */
  async formatAnalysisOutput(context, identification, framework, landscape, recommendations) {
    let output = `🏢 **Competitive Analysis: ${context.industry}**\n\n`;
    output += `📊 **Analysis Scope:** ${context.analysisScope}\n`;
    output += `🔍 **Framework:** ${context.framework}\n`;
    output += `🌍 **Geographic Scope:** ${context.geoScope}\n`;
    output += `📋 **Output Format:** ${context.outputFormat}\n`;
    output += `🏪 **Known Competitors:** ${context.competitors.length}\n\n`;
    
    if (context.targetProduct.name) {
      output += `🎯 **Target Product:** ${context.targetProduct.name}\n`;
      if (context.targetProduct.description) {
        output += `📝 **Description:** ${context.targetProduct.description}\n`;
      }
      if (context.targetProduct.valueProposition) {
        output += `💡 **Value Proposition:** ${context.targetProduct.valueProposition}\n`;
      }
      output += '\n';
    }
    
    // Competitor Identification Framework
    output += `## 🔍 Competitor Identification Framework\n\n`;
    
    Object.entries(identification.categories).forEach(([type, category]) => {
      output += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Competitors\n`;
      output += `**Definition:** ${category.description}\n\n`;
      output += `**Criteria:**\n`;
      category.criteria.forEach(criterion => {
        output += `• ${criterion}\n`;
      });
      
      if (category.examples.length > 0) {
        output += `\n**Identified ${type} competitors:**\n`;
        category.examples.forEach(example => {
          output += `• **${example.name}**`;
          if (example.url) output += ` - ${example.url}`;
          if (example.marketShare) output += ` (Market Share: ${example.marketShare})`;
          if (example.notes) output += ` - ${example.notes}`;
          output += '\n';
        });
      }
      output += '\n';
    });
    
    output += `**Research Methods for Competitor Identification:**\n`;
    identification.identificationMethods.forEach(method => {
      output += `• ${method}\n`;
    });
    output += '\n';
    
    output += `**Key Research Questions:**\n`;
    identification.researchQuestions.forEach(question => {
      output += `• ${question}\n`;
    });
    output += '\n';
    
    // Analysis Framework
    output += `## 📊 Analysis Framework: ${framework.methodology}\n\n`;
    
    framework.analysisAreas.forEach((area, index) => {
      output += `### ${index + 1}. ${area.name}\n`;
      output += `**Description:** ${area.description}\n\n`;
      
      if (area.factors) {
        output += `**Key Factors:**\n`;
        area.factors.forEach(factor => {
          output += `• ${factor}\n`;
        });
        output += '\n';
      }
      
      if (area.categories) {
        output += `**Analysis Categories:**\n`;
        area.categories.forEach(category => {
          output += `• ${category}\n`;
        });
        output += '\n';
      }
      
      if (area.evaluation) {
        output += `**Evaluation Criteria:**\n`;
        area.evaluation.forEach(criterion => {
          output += `• ${criterion}\n`;
        });
        output += '\n';
      }
      
      output += `**Key Questions:**\n`;
      area.questions.forEach(question => {
        output += `• ${question}\n`;
      });
      output += '\n';
    });
    
    // Competitive Landscape Map
    output += `## 🗺️ Competitive Landscape Map\n\n`;
    
    output += `**Positioning Dimensions:**\n`;
    output += `• **X-Axis:** ${landscape.dimensions.xAxis.name} (${landscape.dimensions.xAxis.scale.join(' → ')})\n`;
    output += `  ${landscape.dimensions.xAxis.description}\n`;
    output += `• **Y-Axis:** ${landscape.dimensions.yAxis.name} (${landscape.dimensions.yAxis.scale.join(' → ')})\n`;
    output += `  ${landscape.dimensions.yAxis.description}\n\n`;
    
    output += `**Market Segments:**\n\n`;
    Object.entries(landscape.segments).forEach(([segment, info]) => {
      output += `**${segment.charAt(0).toUpperCase() + segment.slice(1)}**\n`;
      output += `${info.description}\n`;
      output += `*Characteristics:* ${info.characteristics.join(', ')}\n`;
      output += `*Strategy:* ${info.strategy}\n\n`;
    });
    
    output += `**Market Dynamics Analysis:**\n\n`;
    Object.entries(landscape.marketDynamics).forEach(([category, dynamics]) => {
      output += `**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
      Object.entries(dynamics).forEach(([aspect, description]) => {
        output += `• *${aspect.charAt(0).toUpperCase() + aspect.slice(1)}:* ${description}\n`;
      });
      output += '\n';
    });
    
    // Strategic Recommendations
    if (recommendations) {
      output += `## 🎯 Strategic Recommendations\n\n`;
      
      Object.entries(recommendations).forEach(([category, section]) => {
        output += `### ${section.category}\n\n`;
        
        section.recommendations.forEach((rec, index) => {
          output += `**${index + 1}. ${rec.title}** (Priority: ${rec.priority})\n`;
          output += `${rec.description}\n\n`;
          output += `*Rationale:* ${rec.rationale}\n\n`;
          output += `*Action Items:*\n`;
          rec.actionItems.forEach(item => {
            output += `• ${item}\n`;
          });
          output += '\n';
        });
      });
    }
    
    // Implementation Roadmap
    output += `## 🛣️ Implementation Roadmap\n\n`;
    output += `**Phase 1: Research & Analysis (Weeks 1-2)**\n`;
    output += `• Complete competitor identification using research methods\n`;
    output += `• Gather data for each competitor using analysis framework\n`;
    output += `• Map competitors on positioning dimensions\n`;
    output += `• Validate findings with customer interviews\n\n`;
    
    output += `**Phase 2: Strategic Planning (Weeks 3-4)**\n`;
    output += `• Develop positioning strategy based on analysis\n`;
    output += `• Create differentiation plan\n`;
    output += `• Define competitive monitoring system\n`;
    output += `• Prepare response strategies\n\n`;
    
    output += `**Phase 3: Implementation (Weeks 5-8)**\n`;
    output += `• Execute tactical recommendations\n`;
    output += `• Launch positioning and messaging updates\n`;
    output += `• Implement competitive monitoring\n`;
    output += `• Measure and adjust strategy\n\n`;
    
    output += `**Phase 4: Monitoring & Optimization (Ongoing)**\n`;
    output += `• Regular competitive intelligence updates\n`;
    output += `• Quarterly strategy reviews\n`;
    output += `• Continuous optimization based on market changes\n`;
    output += `• Annual comprehensive analysis updates\n\n`;
    
    // Next Steps
    output += `## 🚀 Next Steps\n\n`;
    output += `1. **Immediate Actions (This Week):**\n`;
    output += `   • Set up competitive monitoring tools\n`;
    output += `   • Begin primary research on identified competitors\n`;
    output += `   • Validate competitor categorization\n\n`;
    
    output += `2. **Short-term Actions (Next 2 Weeks):**\n`;
    output += `   • Complete competitive analysis framework\n`;
    output += `   • Create detailed competitor profiles\n`;
    output += `   • Map competitive landscape\n\n`;
    
    output += `3. **Medium-term Actions (Next Month):**\n`;
    output += `   • Develop strategic response plans\n`;
    output += `   • Implement differentiation strategies\n`;
    output += `   • Launch positioning updates\n\n`;
    
    output += `💡 **Analysis Tips:**\n`;
    output += `• Focus on actionable insights over data collection\n`;
    output += `• Validate assumptions with customer feedback\n`;
    output += `• Update analysis regularly as market evolves\n`;
    output += `• Consider both direct and indirect competitive threats\n`;
    output += `• Look for white space opportunities in the competitive map\n\n`;
    
    output += `📁 **Competitive analysis framework saved to project for execution.**`;
    
    return output;
  },

  /**
   * Save analysis to project
   * @param {string} projectPath - Project path
   * @param {Object} context - Analysis context
   * @param {Object} analysis - Analysis data
   * @returns {Promise<void>}
   */
  async saveAnalysisToProject(projectPath, context, analysis) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) {
        return; // No SA project, skip saving
      }
      
      const analysisDir = join(saDir, 'competitive-analysis');
      if (!existsSync(analysisDir)) {
        require('fs').mkdirSync(analysisDir, { recursive: true });
      }
      
      const analysisData = {
        context,
        analysis,
        createdAt: new Date().toISOString()
      };
      
      const filename = `competitive-analysis-${context.industry.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
      const filepath = join(analysisDir, filename);
      
      writeFileSync(filepath, JSON.stringify(analysisData, null, 2));
      
    } catch (error) {
      // Silent fail - analysis saving is optional
      console.warn('Failed to save competitive analysis:', error.message);
    }
  }
};