import ResearchEngine from '../../../research/ResearchEngine.js';

/**
 * Super Agents Research Tool - AI-powered research with project context awareness
 * Performs intelligent research queries using context gathering and fuzzy task discovery
 */

const toolDefinition = {
  name: 'sa-research',
  description: 'Perform AI-powered research queries with project context awareness and intelligent task discovery',
  category: 'research',
  
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Research query or question to investigate'
      },
      taskIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific task IDs to include for context (e.g., ["1", "2.3", "4"])'
      },
      filePaths: {
        type: 'array', 
        items: { type: 'string' },
        description: 'File paths to include for context (e.g., ["src/api.js", "docs/readme.md"])'
      },
      customContext: {
        type: 'string',
        description: 'Additional custom context text to include in the research'
      },
      includeProjectTree: {
        type: 'boolean',
        description: 'Include project file tree structure in context (default: false)'
      },
      detailLevel: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Detail level for the research response (default: medium)'
      },
      autoDiscoverTasks: {
        type: 'boolean',
        description: 'Automatically discover relevant tasks using AI analysis (default: true)'
      },
      maxDiscoveredTasks: {
        type: 'number',
        description: 'Maximum number of tasks to auto-discover (default: 8)'
      },
      saveTo: {
        type: 'string',
        description: 'Save research results to specified task/subtask ID (e.g., "15" or "15.2")'
      },
      saveToFile: {
        type: 'boolean',
        description: 'Save research results to .super-agents/research/ directory (default: false)'
      },
      temperature: {
        type: 'number',
        description: 'AI temperature for research query (0.0-1.0, default: 0.7)'
      },
      maxResponseTokens: {
        type: 'number',
        description: 'Maximum tokens for research response (default: 4000)'
      }
    },
    required: ['query']
  },

  async execute(args, context = {}) {
    try {
      const {
        query,
        taskIds = [],
        filePaths = [],
        customContext = '',
        includeProjectTree = false,
        detailLevel = 'medium',
        autoDiscoverTasks = true,
        maxDiscoveredTasks = 8,
        saveTo = null,
        saveToFile = false,
        temperature = 0.7,
        maxResponseTokens = 4000
      } = args;

      // Initialize research engine
      const researchEngine = new ResearchEngine({
        projectRoot: process.cwd(),
        enableSaveToFile: true,
        enableSaveToTask: true,
        researchDirectory: '.super-agents/research'
      });

      // Set AI provider if available
      if (context.aiProvider) {
        researchEngine.setAIProvider(context.aiProvider);
      }

      // Prepare research options
      const researchOptions = {
        taskIds,
        filePaths,
        customContext,
        includeProjectTree,
        detailLevel,
        autoDiscoverTasks,
        maxDiscoveredTasks,
        saveTo,
        saveToFile,
        temperature,
        maxResponseTokens
      };

      // Perform research
      const result = await researchEngine.performResearch(query, researchOptions);

      // Format response for MCP
      return {
        content: [
          {
            type: 'text',
            text: `# Research Results

## Query
${query}

## Response
${result.result}

## Context Analysis
- **Sources**: ${result.sources.tasks} tasks, ${result.sources.files} files${result.sources.projectTree ? ', project tree' : ''}
- **Context Size**: ${result.contextSize} characters (${result.contextTokens} tokens)
- **Detail Level**: ${result.detailLevel}
- **Auto-discovered Tasks**: ${result.discoveredTasks.join(', ') || 'None'}

${result.savedFilePath ? `\n**Saved to File**: ${result.savedFilePath}` : ''}
${result.metadata.tokenUsage ? `\n**AI Token Usage**: ${JSON.stringify(result.metadata.tokenUsage)}` : ''}

---
*Generated by Super Agents Research Engine*`
          }
        ],
        isError: false,
        metadata: {
          toolName: 'sa-research',
          query,
          contextTokens: result.contextTokens,
          discoveredTasks: result.discoveredTasks,
          detailLevel: result.detailLevel,
          sources: result.sources,
          timestamp: result.metadata.timestamp,
          savedFilePath: result.savedFilePath || null
        }
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error performing research: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          toolName: 'sa-research',
          error: error.message
        }
      };
    }
  },

  // Validation function for input parameters
  validate(args) {
    const errors = [];
    
    if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
      errors.push('Query is required and must be a non-empty string');
    }

    if (args.query && args.query.length > 1000) {
      errors.push('Query must be less than 1000 characters');
    }

    if (args.taskIds && !Array.isArray(args.taskIds)) {
      errors.push('taskIds must be an array of strings');
    }

    if (args.filePaths && !Array.isArray(args.filePaths)) {
      errors.push('filePaths must be an array of strings');
    }

    if (args.detailLevel && !['low', 'medium', 'high'].includes(args.detailLevel)) {
      errors.push('detailLevel must be one of: low, medium, high');
    }

    if (args.temperature && (typeof args.temperature !== 'number' || args.temperature < 0 || args.temperature > 1)) {
      errors.push('temperature must be a number between 0.0 and 1.0');
    }

    if (args.maxResponseTokens && (typeof args.maxResponseTokens !== 'number' || args.maxResponseTokens < 100 || args.maxResponseTokens > 10000)) {
      errors.push('maxResponseTokens must be a number between 100 and 10000');
    }

    if (args.maxDiscoveredTasks && (typeof args.maxDiscoveredTasks !== 'number' || args.maxDiscoveredTasks < 1 || args.maxDiscoveredTasks > 20)) {
      errors.push('maxDiscoveredTasks must be a number between 1 and 20');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Example usage
  examples: [
    {
      title: 'Basic Research Query',
      description: 'Perform a simple research query with auto-discovery',
      input: {
        query: 'How should I implement user authentication in this project?',
        detailLevel: 'medium'
      }
    },
    {
      title: 'Research with Specific Context',
      description: 'Research with specific tasks and files for context',
      input: {
        query: 'What are the security implications of the current API design?',
        taskIds: ['3', '4.2', '5'],
        filePaths: ['src/api/auth.js', 'src/middleware/security.js'],
        detailLevel: 'high'
      }
    },
    {
      title: 'Architecture Research with Project Tree',
      description: 'Research system architecture with full project context',
      input: {
        query: 'How can I refactor this codebase to improve scalability?',
        includeProjectTree: true,
        detailLevel: 'high',
        saveToFile: true
      }
    },
    {
      title: 'Quick Research with Low Detail',
      description: 'Fast research query for quick insights',
      input: {
        query: 'What testing framework should I use for this project?',
        detailLevel: 'low',
        autoDiscoverTasks: false
      }
    }
  ],

  // Tool metadata
  metadata: {
    category: 'research',
    tags: ['ai', 'research', 'context', 'analysis', 'discovery'],
    version: '1.0.0',
    author: 'Super Agents Framework',
    complexity: 'medium',
    estimatedTime: '30-120 seconds',
    prerequisites: ['AI provider configured', 'Project initialized'],
    outputs: ['Research analysis', 'Context breakdown', 'Task discovery', 'Optional file saves']
  }
};

export default toolDefinition;