import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';

export const saGenerateUiPrompt = {
  name: 'sa_generate_ui_prompt',
  description: 'Generate AI UI generation prompts optimized for tools like v0, Lovable, and other AI design platforms',
  category: 'ux-expert',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      promptId: { type: 'string', minLength: 1 },
      targetTool: { type: 'string', enum: ['v0', 'lovable', 'cursor', 'bolt', 'claude-artifacts', 'generic'], default: 'generic' },
      componentType: { type: 'string' },
      requirements: {
        type: 'object',
        properties: {
          functionality: { type: 'array', items: { type: 'string' } },
          styling: { type: 'object' },
          interactions: { type: 'array', items: { type: 'string' } },
          data: { type: 'object' }
        }
      },
      constraints: {
        type: 'object',
        properties: {
          framework: { type: 'string' },
          libraries: { type: 'array', items: { type: 'string' } },
          responsive: { type: 'boolean', default: true },
          accessibility: { type: 'boolean', default: true }
        }
      },
      projectPath: { type: 'string', default: process.cwd() }
    },
    required: ['promptId', 'componentType']
  },

  validate(args) {
    const errors = [];
    if (!args.promptId?.trim()) errors.push('promptId is required');
    if (!args.componentType?.trim()) errors.push('componentType is required');
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    
    try {
      const promptContext = {
        promptId: args.promptId.trim(),
        targetTool: args.targetTool || 'generic',
        componentType: args.componentType,
        requirements: args.requirements || {},
        constraints: args.constraints || {},
        timestamp: new Date().toISOString(),
        author: context?.userId || 'system'
      };

      const generatedPrompt = await this.generatePrompt(promptContext);
      const variations = await this.generatePromptVariations(promptContext, generatedPrompt);
      const bestPractices = await this.getBestPractices(promptContext.targetTool);
      
      const output = await this.formatPromptOutput(promptContext, generatedPrompt, variations, bestPractices);
      
      await this.savePromptData(args.projectPath, promptContext, { 
        mainPrompt: generatedPrompt, 
        variations, 
        bestPractices 
      });
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          promptId: promptContext.promptId,
          targetTool: promptContext.targetTool,
          componentType: promptContext.componentType,
          promptLength: generatedPrompt.length,
          variationsCount: variations.length,
          duration: Date.now() - startTime
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to generate UI prompt: ${error.message}` }],
        isError: true
      };
    }
  },

  async generatePrompt(context) {
    const basePrompt = this.buildBasePrompt(context);
    const toolSpecificPrompt = this.addToolSpecificOptimizations(basePrompt, context.targetTool);
    const enhancedPrompt = this.addDetailedRequirements(toolSpecificPrompt, context);
    
    return enhancedPrompt;
  },

  buildBasePrompt(context) {
    let prompt = `Create a ${context.componentType}`;
    
    if (context.requirements.functionality?.length > 0) {
      prompt += ` that ${context.requirements.functionality.join(', ')}`;
    }
    
    if (context.constraints.framework) {
      prompt += ` using ${context.constraints.framework}`;
    }
    
    if (context.constraints.responsive) {
      prompt += ` with responsive design`;
    }
    
    if (context.constraints.accessibility) {
      prompt += ` following accessibility best practices`;
    }
    
    return prompt;
  },

  addToolSpecificOptimizations(basePrompt, targetTool) {
    const optimizations = {
      'v0': `${basePrompt}. Use shadcn/ui components and Tailwind CSS. Include TypeScript types. Make it production-ready with proper error handling.`,
      'lovable': `${basePrompt}. Use modern React patterns with hooks. Include proper state management and event handlers. Style with Tailwind CSS.`,
      'cursor': `${basePrompt}. Write clean, well-commented code. Include proper TypeScript interfaces. Use modern CSS techniques.`,
      'claude-artifacts': `${basePrompt}. Create a complete, working component with all necessary imports and styling. Include interactive features.`,
      'generic': `${basePrompt}. Include all necessary code, styling, and functionality in a complete implementation.`
    };
    
    return optimizations[targetTool] || optimizations.generic;
  },

  addDetailedRequirements(prompt, context) {
    let enhanced = prompt;
    
    // Add styling requirements
    if (context.requirements.styling) {
      const styling = context.requirements.styling;
      if (styling.theme) enhanced += ` Use ${styling.theme} theme.`;
      if (styling.colors) enhanced += ` Color scheme: ${Object.entries(styling.colors).map(([k,v]) => `${k}: ${v}`).join(', ')}.`;
      if (styling.layout) enhanced += ` Layout: ${styling.layout}.`;
    }
    
    // Add interaction requirements
    if (context.requirements.interactions?.length > 0) {
      enhanced += ` Include these interactions: ${context.requirements.interactions.join(', ')}.`;
    }
    
    // Add data requirements
    if (context.requirements.data) {
      enhanced += ` Handle data: ${JSON.stringify(context.requirements.data)}.`;
    }
    
    // Add library constraints
    if (context.constraints.libraries?.length > 0) {
      enhanced += ` Use these libraries: ${context.constraints.libraries.join(', ')}.`;
    }
    
    return enhanced;
  },

  async generatePromptVariations(context, mainPrompt) {
    return [
      {
        name: 'Detailed Version',
        prompt: this.createDetailedVariation(mainPrompt, context),
        useCase: 'When you need more specific implementation details'
      },
      {
        name: 'Minimal Version', 
        prompt: this.createMinimalVariation(mainPrompt, context),
        useCase: 'When you want a simple, clean implementation'
      },
      {
        name: 'Advanced Version',
        prompt: this.createAdvancedVariation(mainPrompt, context),
        useCase: 'When you need advanced features and optimizations'
      }
    ];
  },

  createDetailedVariation(mainPrompt, context) {
    return `${mainPrompt}

Detailed requirements:
- Include proper loading states and error handling
- Add comprehensive prop validation and TypeScript types
- Implement keyboard navigation and screen reader support
- Use semantic HTML elements
- Include unit tests with testing library
- Add proper documentation and usage examples
- Optimize for performance with memoization where needed`;
  },

  createMinimalVariation(mainPrompt, context) {
    return `Create a simple ${context.componentType} with clean, minimal design. Focus on core functionality only. Use standard HTML/CSS/JS patterns.`;
  },

  createAdvancedVariation(mainPrompt, context) {
    return `${mainPrompt}

Advanced features:
- Implement advanced state management with context/redux
- Add animation and transition effects
- Include drag and drop functionality if applicable
- Implement virtual scrolling for large datasets
- Add internationalization support
- Include advanced keyboard shortcuts
- Implement advanced accessibility features (ARIA live regions, etc.)
- Add comprehensive error boundaries and fallbacks`;
  },

  async getBestPractices(targetTool) {
    const practices = {
      'v0': [
        'Use shadcn/ui components for consistency',
        'Leverage Tailwind CSS utilities effectively',
        'Include proper TypeScript types',
        'Follow React best practices with hooks',
        'Implement proper error boundaries'
      ],
      'lovable': [
        'Use modern React patterns and hooks',
        'Implement responsive design with Tailwind',
        'Include proper state management',
        'Add loading and error states',
        'Follow accessibility guidelines'
      ],
      'generic': [
        'Write semantic HTML',
        'Use modern CSS techniques',
        'Implement proper accessibility',
        'Follow component best practices',
        'Include proper error handling'
      ]
    };
    
    return practices[targetTool] || practices.generic;
  },

  async formatPromptOutput(context, mainPrompt, variations, bestPractices) {
    let output = `🤖 **AI UI Prompt: ${context.componentType}**\n\n`;
    output += `🎯 **Target Tool:** ${context.targetTool}\n`;
    output += `🆔 **Prompt ID:** ${context.promptId}\n`;
    output += `📅 **Generated:** ${context.timestamp.split('T')[0]}\n\n`;

    output += `## 🚀 Main Prompt\n\n`;
    output += `\`\`\`\n${mainPrompt}\n\`\`\`\n\n`;

    output += `## 🔄 Prompt Variations\n\n`;
    variations.forEach((variation, index) => {
      output += `### ${index + 1}. ${variation.name}\n`;
      output += `*${variation.useCase}*\n\n`;
      output += `\`\`\`\n${variation.prompt}\n\`\`\`\n\n`;
    });

    output += `## 💡 ${context.targetTool.toUpperCase()} Best Practices\n\n`;
    bestPractices.forEach(practice => {
      output += `• ${practice}\n`;
    });
    output += '\n';

    output += `## 🎨 Usage Tips\n\n`;
    output += `• Start with the main prompt and iterate based on results\n`;
    output += `• Use variations for different complexity levels\n`;
    output += `• Combine multiple prompts for complex components\n`;
    output += `• Always specify framework and styling preferences\n`;
    output += `• Include accessibility requirements in prompts\n\n`;

    output += `📁 **Prompt variations and best practices saved to project.**`;

    return output;
  },

  async savePromptData(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const promptsDir = join(saDir, 'ui-prompts');
      if (!existsSync(promptsDir)) {
        require('fs').mkdirSync(promptsDir, { recursive: true });
      }
      
      const filename = `ui-prompt-${context.promptId}-${Date.now()}.json`;
      const filepath = join(promptsDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save UI prompt data:', error.message);
    }
  }
};