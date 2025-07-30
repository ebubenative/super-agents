import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Super Agents Research Save Tool - Save research results to tasks or files
 * Provides flexible saving options for research results and conversation history
 */

const toolDefinition = {
  name: 'sa-research-save',
  description: 'Save research results and conversations to tasks, subtasks, or files with various formatting options',
  category: 'research',
  
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Research content to save (query + response + context)'
      },
      saveTarget: {
        type: 'string',
        enum: ['task', 'subtask', 'file'],
        description: 'Where to save the research results'
      },
      targetId: {
        type: 'string',
        description: 'Task ID (e.g., "15") or subtask ID (e.g., "15.2") when saving to task/subtask'
      },
      fileName: {
        type: 'string',
        description: 'Custom filename when saving to file (optional, auto-generated if not provided)'
      },
      format: {
        type: 'string',
        enum: ['markdown', 'text', 'json'],
        description: 'Format for saved content (default: markdown)'
      },
      appendMode: {
        type: 'boolean',
        description: 'Append to existing content instead of replacing (default: true)'
      },
      includeMetadata: {
        type: 'boolean',
        description: 'Include metadata like timestamps and context info (default: true)'
      },
      conversationHistory: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            response: { type: 'string' },
            timestamp: { type: 'string' },
            type: { type: 'string' }
          }
        },
        description: 'Full conversation history to save'
      },
      customMetadata: {
        type: 'object',
        description: 'Additional metadata to include in saved content'
      },
      directory: {
        type: 'string',
        description: 'Custom directory for file saves (default: .super-agents/research)'
      }
    },
    required: ['content', 'saveTarget']
  },

  async execute(args, context = {}) {
    try {
      const {
        content,
        saveTarget,
        targetId,
        fileName,
        format = 'markdown',
        appendMode = true,
        includeMetadata = true,
        conversationHistory = [],
        customMetadata = {},
        directory = '.super-agents/research'
      } = args;

      let result;

      switch (saveTarget) {
        case 'task':
        case 'subtask':
          result = await this.saveToTask(content, targetId, {
            format,
            appendMode,
            includeMetadata,
            conversationHistory,
            customMetadata
          });
          break;
          
        case 'file':
          result = await this.saveToFile(content, {
            fileName,
            format,
            includeMetadata,
            conversationHistory,
            customMetadata,
            directory
          });
          break;
          
        default:
          throw new Error(`Unsupported save target: ${saveTarget}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: `# Research Saved Successfully

${result.message}

## Save Details
- **Target**: ${saveTarget}${targetId ? ` (${targetId})` : ''}
- **Format**: ${format}
- **Location**: ${result.location}
- **Content Size**: ${content.length} characters
- **Append Mode**: ${appendMode}
${conversationHistory.length > 0 ? `- **Conversation Exchanges**: ${conversationHistory.length}` : ''}

${result.metadata ? `## Metadata Included
${Object.entries(result.metadata).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}` : ''}

---
*Saved by Super Agents Research Save Tool*`
          }
        ],
        isError: false,
        metadata: {
          toolName: 'sa-research-save',
          saveTarget,
          targetId,
          location: result.location,
          format,
          contentSize: content.length,
          conversationLength: conversationHistory.length,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error saving research: ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          toolName: 'sa-research-save',
          error: error.message
        }
      };
    }
  },

  /**
   * Save research content to a task or subtask
   */
  async saveToTask(content, targetId, options = {}) {
    const {
      format = 'markdown',
      appendMode = true,
      includeMetadata = true,
      conversationHistory = [],
      customMetadata = {}
    } = options;

    if (!targetId) {
      throw new Error('Target ID is required for task/subtask saves');
    }

    // Load tasks data
    const tasksPath = join(process.cwd(), 'sa-engine/data/tasks/tasks.json');
    
    if (!existsSync(tasksPath)) {
      throw new Error('Tasks file not found. Please run sa-initialize-project first.');
    }

    const tasksData = JSON.parse(await readFile(tasksPath, 'utf-8'));
    
    if (!tasksData || !tasksData.tasks) {
      throw new Error('No valid tasks found in tasks file');
    }

    // Determine if it's a task or subtask
    const isSubtask = targetId.includes('.');
    
    // Format content for task/subtask
    const formattedContent = this.formatContentForTask(content, {
      format,
      includeMetadata,
      conversationHistory,
      customMetadata,
      targetId,
      isSubtask
    });

    if (isSubtask) {
      // Handle subtask save
      const [parentId, subtaskId] = targetId.split('.').map(id => parseInt(id));
      const parentTask = tasksData.tasks.find(t => t.id === parentId);
      
      if (!parentTask) {
        throw new Error(`Parent task ${parentId} not found`);
      }

      const subtask = parentTask.subtasks?.find(st => st.id === subtaskId);
      if (!subtask) {
        throw new Error(`Subtask ${targetId} not found`);
      }

      // Update subtask details
      if (appendMode && subtask.details) {
        subtask.details += '\n\n' + formattedContent;
      } else {
        subtask.details = formattedContent;
      }

      subtask.lastModified = new Date().toISOString();

    } else {
      // Handle task save
      const taskId = parseInt(targetId);
      const task = tasksData.tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error(`Task ${targetId} not found`);
      }

      // Update task details
      if (appendMode && task.details) {
        task.details += '\n\n' + formattedContent;
      } else {
        task.details = formattedContent;
      }

      task.lastModified = new Date().toISOString();
    }

    // Save updated tasks
    await writeFile(tasksPath, JSON.stringify(tasksData, null, 2));

    return {
      message: `Research saved to ${isSubtask ? 'subtask' : 'task'} ${targetId}`,
      location: `Task ${targetId}`,
      metadata: {
        taskId: targetId,
        format,
        appendMode,
        lastModified: new Date().toISOString()
      }
    };
  },

  /**
   * Save research content to a file
   */
  async saveToFile(content, options = {}) {
    const {
      fileName,
      format = 'markdown',
      includeMetadata = true,
      conversationHistory = [],
      customMetadata = {},
      directory = '.super-agents/research'
    } = options;

    // Create research directory
    const researchDir = join(process.cwd(), directory);
    if (!existsSync(researchDir)) {
      await mkdir(researchDir, { recursive: true });
    }

    // Generate filename if not provided
    let finalFileName = fileName;
    if (!finalFileName) {
      const timestamp = new Date().toISOString().split('T')[0];
      const contentSlug = this.createSlug(content.substring(0, 50));
      const extension = format === 'json' ? 'json' : (format === 'text' ? 'txt' : 'md');
      finalFileName = `${timestamp}_${contentSlug}.${extension}`;
    }

    const filePath = join(researchDir, finalFileName);

    // Format content for file
    const formattedContent = this.formatContentForFile(content, {
      format,
      includeMetadata,
      conversationHistory,
      customMetadata,
      fileName: finalFileName
    });

    // Write file
    await writeFile(filePath, formattedContent, 'utf-8');

    return {
      message: `Research saved to file: ${finalFileName}`,
      location: filePath,
      metadata: {
        fileName: finalFileName,
        directory,
        format,
        fileSize: formattedContent.length,
        timestamp: new Date().toISOString()
      }
    };
  },

  /**
   * Format content for task/subtask saving
   */
  formatContentForTask(content, options = {}) {
    const {
      format,
      includeMetadata,
      conversationHistory,
      customMetadata,
      targetId,
      isSubtask
    } = options;

    let formatted = '';

    if (includeMetadata) {
      const timestamp = new Date().toLocaleString();
      formatted += `## Research Session - ${timestamp}\n\n`;
      
      if (customMetadata && Object.keys(customMetadata).length > 0) {
        formatted += `**Metadata:**\n`;
        for (const [key, value] of Object.entries(customMetadata)) {
          formatted += `- ${key}: ${value}\n`;
        }
        formatted += '\n';
      }
    }

    if (conversationHistory.length > 0 && format === 'markdown') {
      formatted += `**Research Conversation (${conversationHistory.length} exchanges):**\n\n`;
      
      conversationHistory.forEach((exchange, index) => {
        const label = exchange.type === 'initial' ? 'Initial Query' : `Follow-up ${index}`;
        formatted += `### ${label}\n**Q:** ${exchange.query}\n\n**A:** ${exchange.response}\n\n`;
        
        if (index < conversationHistory.length - 1) {
          formatted += '---\n\n';
        }
      });
    } else {
      formatted += content;
    }

    if (includeMetadata) {
      formatted += `\n\n*Saved to ${isSubtask ? 'subtask' : 'task'} ${targetId} on ${new Date().toLocaleString()}*`;
    }

    return formatted;
  },

  /**
   * Format content for file saving
   */
  formatContentForFile(content, options = {}) {
    const {
      format,
      includeMetadata,
      conversationHistory,
      customMetadata,
      fileName
    } = options;

    if (format === 'json') {
      return JSON.stringify({
        content,
        conversationHistory,
        metadata: {
          ...customMetadata,
          fileName,
          timestamp: new Date().toISOString(),
          format
        }
      }, null, 2);
    }

    if (format === 'text') {
      let formatted = content;
      
      if (conversationHistory.length > 0) {
        formatted = conversationHistory.map(exchange => 
          `Q: ${exchange.query}\n\nA: ${exchange.response}\n\n---\n\n`
        ).join('') + formatted;
      }

      if (includeMetadata) {
        formatted += `\n\nSaved: ${new Date().toLocaleString()}`;
      }

      return formatted;
    }

    // Markdown format (default)
    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString();
    
    let formatted = '';

    if (includeMetadata) {
      formatted += `---
title: Research Session
date: ${date}
timestamp: ${timestamp}
file: ${fileName}`;
      
      if (customMetadata && Object.keys(customMetadata).length > 0) {
        formatted += `\nmetadata:\n`;
        for (const [key, value] of Object.entries(customMetadata)) {
          formatted += `  ${key}: ${value}\n`;
        }
      }
      
      formatted += `---\n\n# Research Session\n\n`;
    }

    if (conversationHistory.length > 0) {
      formatted += `## Research Conversation\n\n`;
      
      conversationHistory.forEach((exchange, index) => {
        const label = exchange.type === 'initial' ? 'Initial Query' : `Follow-up ${index}`;
        formatted += `### ${label}\n\n**Question:** ${exchange.query}\n\n**Response:**\n\n${exchange.response}\n\n`;
        
        if (index < conversationHistory.length - 1) {
          formatted += '---\n\n';
        }
      });
    } else {
      formatted += content;
    }

    if (includeMetadata) {
      formatted += `\n\n---\n\n*Generated by Super Agents Research Save Tool*  \n*Timestamp: ${timestamp}*\n`;
    }

    return formatted;
  },

  /**
   * Create URL-safe slug from text
   */
  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30)
      .replace(/^-+|-+$/g, '');
  },

  // Validation function for input parameters
  validate(args) {
    const errors = [];
    
    if (!args.content || typeof args.content !== 'string' || args.content.trim().length === 0) {
      errors.push('Content is required and must be a non-empty string');
    }

    if (!args.saveTarget || !['task', 'subtask', 'file'].includes(args.saveTarget)) {
      errors.push('saveTarget must be one of: task, subtask, file');
    }

    if ((args.saveTarget === 'task' || args.saveTarget === 'subtask') && !args.targetId) {
      errors.push('targetId is required when saving to task or subtask');
    }

    if (args.format && !['markdown', 'text', 'json'].includes(args.format)) {
      errors.push('format must be one of: markdown, text, json');
    }

    if (args.conversationHistory && !Array.isArray(args.conversationHistory)) {
      errors.push('conversationHistory must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Example usage
  examples: [
    {
      title: 'Save to Task',
      description: 'Save research results to a specific task',
      input: {
        content: 'Research findings about authentication implementation...',
        saveTarget: 'task',
        targetId: '5',
        format: 'markdown',
        appendMode: true
      }
    },
    {
      title: 'Save to Subtask',
      description: 'Save research to a subtask with conversation history',
      input: {
        content: 'Detailed implementation analysis...',
        saveTarget: 'subtask',
        targetId: '5.2',
        conversationHistory: [
          {
            query: 'How should we implement JWT?',
            response: 'Use bcrypt for hashing...',
            type: 'initial',
            timestamp: '2025-01-30T10:00:00Z'
          }
        ]
      }
    },
    {
      title: 'Save to Custom File',
      description: 'Save research conversation to a custom file',
      input: {
        content: 'Architecture research session...',
        saveTarget: 'file',
        fileName: 'auth-architecture-research.md',
        format: 'markdown',
        includeMetadata: true
      }
    },
    {
      title: 'Save as JSON',
      description: 'Save research data in JSON format for processing',
      input: {
        content: 'Research analysis data...',
        saveTarget: 'file',
        format: 'json',
        customMetadata: {
          project: 'super-agents',
          researcher: 'AI Assistant',
          category: 'architecture'
        }
      }
    }
  ],

  // Tool metadata
  metadata: {
    category: 'research',
    tags: ['save', 'research', 'tasks', 'files', 'conversation', 'storage'],
    version: '1.0.0',
    author: 'Super Agents Framework',
    complexity: 'low',
    estimatedTime: '5-15 seconds',
    prerequisites: ['Research content to save', 'Valid task ID (for task saves)'],
    outputs: ['Saved content', 'Save confirmation', 'Location details'],
    relatedTools: ['sa-research', 'sa-follow-up-research', 'sa-get-task', 'sa-update-task-status']
  }
};

export default toolDefinition;