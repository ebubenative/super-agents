import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, relative, extname } from 'path';
import { EventEmitter } from 'events';

/**
 * ContextGatherer - Intelligent context collection for AI research and analysis
 * Gathers context from tasks, files, and project structure with token optimization
 */
export default class ContextGatherer extends EventEmitter {
  constructor(projectRoot, tag = null, options = {}) {
    super();
    
    this.projectRoot = projectRoot;
    this.tag = tag;
    this.options = {
      maxTokens: options.maxTokens || 100000,
      tokensPerCharacter: options.tokensPerCharacter || 0.25, // Rough estimate
      includeFileExtensions: options.includeFileExtensions || [
        '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.rs',
        '.php', '.rb', '.swift', '.kt', '.scala', '.clj', '.elm', '.dart',
        '.md', '.txt', '.json', '.yaml', '.yml', '.xml', '.html', '.css',
        '.sql', '.sh', '.bash', '.zsh', '.ps1', '.dockerfile', '.makefile'
      ],
      excludePatterns: options.excludePatterns || [
        'node_modules/', 'dist/', 'build/', '.git/', '.next/', '.nuxt/',
        'vendor/', 'target/', 'bin/', 'obj/', 'logs/', 'tmp/', 'temp/',
        '*.log', '*.cache', '*.lock', 'package-lock.json', 'yarn.lock'
      ],
      ...options
    };

    this.taskManager = null; // Will be set by TaskManager if available
  }

  /**
   * Gather context from multiple sources
   * @param {Object} sources - Context sources configuration
   * @param {Array} sources.tasks - Task IDs to include
   * @param {Array} sources.files - File paths to include  
   * @param {string} sources.customContext - Custom context text
   * @param {boolean} sources.includeProjectTree - Include project structure
   * @param {string} sources.format - Output format ('research', 'analysis', 'summary')
   * @param {boolean} sources.includeTokenCounts - Include token analysis
   * @returns {Promise<Object>} Gathered context with metadata
   */
  async gather(sources = {}) {
    try {
      this.emit('gatherStarting', { sources });

      const {
        tasks = [],
        files = [],
        customContext = '',
        includeProjectTree = false,
        format = 'research',
        includeTokenCounts = true
      } = sources;

      const contextParts = [];
      const tokenBreakdown = {
        total: 0,
        customContext: null,
        tasks: [],
        files: [],
        projectTree: null
      };

      // Gather custom context
      if (customContext) {
        const customTokens = this.countTokens(customContext);
        contextParts.push({
          type: 'custom',
          content: customContext,
          tokens: customTokens
        });
        
        tokenBreakdown.customContext = {
          tokens: customTokens,
          characters: customContext.length
        };
        tokenBreakdown.total += customTokens;
      }

      // Gather task context
      if (tasks.length > 0) {
        const taskContext = await this.gatherTaskContext(tasks);
        contextParts.push({
          type: 'tasks',
          content: taskContext.content,
          tokens: taskContext.tokens,
          metadata: taskContext.metadata
        });
        
        tokenBreakdown.tasks = taskContext.breakdown;
        tokenBreakdown.total += taskContext.tokens;
      }

      // Gather file context
      if (files.length > 0) {
        const fileContext = await this.gatherFileContext(files);
        contextParts.push({
          type: 'files',
          content: fileContext.content,
          tokens: fileContext.tokens,
          metadata: fileContext.metadata
        });
        
        tokenBreakdown.files = fileContext.breakdown;
        tokenBreakdown.total += fileContext.tokens;
      }

      // Gather project tree context
      if (includeProjectTree) {
        const treeContext = await this.gatherProjectTree();
        contextParts.push({
          type: 'projectTree',
          content: treeContext.content,
          tokens: treeContext.tokens,
          metadata: treeContext.metadata
        });
        
        tokenBreakdown.projectTree = {
          tokens: treeContext.tokens,
          fileCount: treeContext.metadata.fileCount,
          dirCount: treeContext.metadata.dirCount
        };
        tokenBreakdown.total += treeContext.tokens;
      }

      // Format context based on requested format
      const formattedContext = this.formatContext(contextParts, format);
      
      const result = {
        context: formattedContext,
        contextParts,
        tokenBreakdown: includeTokenCounts ? tokenBreakdown : null,
        metadata: {
          totalSources: contextParts.length,
          projectRoot: this.projectRoot,
          tag: this.tag,
          format,
          timestamp: new Date().toISOString()
        }
      };

      this.emit('gatherCompleted', { result });
      return result;

    } catch (error) {
      this.emit('gatherError', { error });
      throw error;
    }
  }

  /**
   * Gather context from tasks
   * @param {Array} taskIds - Task IDs to gather context from
   * @returns {Promise<Object>} Task context data
   */
  async gatherTaskContext(taskIds) {
    try {
      const taskContexts = [];
      const breakdown = [];
      let totalTokens = 0;

      // Load tasks data
      const tasksData = await this.loadTasksData();
      if (!tasksData || !tasksData.tasks) {
        return { content: '', tokens: 0, breakdown: [], metadata: {} };
      }

      // Process each task ID
      for (const taskId of taskIds) {
        const taskContext = await this.extractTaskContext(tasksData, taskId);
        if (taskContext) {
          const tokens = this.countTokens(taskContext.content);
          
          taskContexts.push(taskContext.content);
          breakdown.push({
            id: taskId,
            title: taskContext.title,
            tokens,
            type: taskContext.type
          });
          totalTokens += tokens;
        }
      }

      const content = taskContexts.join('\n\n---\n\n');
      
      return {
        content,
        tokens: totalTokens,
        breakdown,
        metadata: {
          taskCount: taskContexts.length,
          requestedCount: taskIds.length
        }
      };

    } catch (error) {
      // Return empty context if tasks can't be loaded
      return { content: '', tokens: 0, breakdown: [], metadata: { error: error.message } };
    }
  }

  /**
   * Gather context from files
   * @param {Array} filePaths - File paths to gather context from
   * @returns {Promise<Object>} File context data
   */
  async gatherFileContext(filePaths) {
    const fileContexts = [];
    const breakdown = [];
    let totalTokens = 0;

    for (const filePath of filePaths) {
      try {
        const absolutePath = this.resolveFilePath(filePath);
        
        if (!existsSync(absolutePath)) {
          continue;
        }

        const fileStats = await stat(absolutePath);
        if (fileStats.isDirectory()) {
          continue;
        }

        // Check if file extension is supported
        const ext = extname(absolutePath).toLowerCase();
        if (!this.options.includeFileExtensions.includes(ext)) {
          continue;
        }

        // Check file size (skip very large files)
        const maxSizeBytes = 1024 * 1024; // 1MB
        if (fileStats.size > maxSizeBytes) {
          continue;
        }

        const content = await readFile(absolutePath, 'utf-8');
        const relativePath = relative(this.projectRoot, absolutePath);
        
        const fileContext = `## File: ${relativePath}\n\n\`\`\`${ext.slice(1)}\n${content}\n\`\`\``;
        const tokens = this.countTokens(fileContext);
        
        fileContexts.push(fileContext);
        breakdown.push({
          path: relativePath,
          tokens,
          sizeKB: Math.round(fileStats.size / 1024),
          extension: ext
        });
        totalTokens += tokens;

      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    const content = fileContexts.join('\n\n');
    
    return {
      content,
      tokens: totalTokens,
      breakdown,
      metadata: {
        fileCount: fileContexts.length,
        requestedCount: filePaths.length
      }
    };
  }

  /**
   * Gather project tree structure
   * @returns {Promise<Object>} Project tree context data
   */
  async gatherProjectTree() {
    try {
      const tree = await this.buildProjectTree(this.projectRoot);
      const content = `## Project Structure\n\n\`\`\`\n${tree.content}\n\`\`\``;
      const tokens = this.countTokens(content);

      return {
        content,
        tokens,
        metadata: {
          fileCount: tree.fileCount,
          dirCount: tree.dirCount,
          depth: tree.maxDepth
        }
      };

    } catch (error) {
      return {
        content: '## Project Structure\n\n*Could not generate project tree*',
        tokens: 50,
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Build project tree structure
   * @param {string} dirPath - Directory path to scan
   * @param {number} depth - Current depth
   * @param {string} prefix - Tree prefix for formatting
   * @returns {Promise<Object>} Tree structure data
   */
  async buildProjectTree(dirPath, depth = 0, prefix = '') {
    const { readdir, stat } = await import('fs/promises');
    const maxDepth = 4; // Limit tree depth
    
    if (depth > maxDepth) {
      return { content: '', fileCount: 0, dirCount: 0, maxDepth: depth };
    }

    let content = '';
    let fileCount = 0;
    let dirCount = 0;
    let currentMaxDepth = depth;

    try {
      const items = await readdir(dirPath);
      const sortedItems = items.sort();

      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        
        // Skip excluded patterns
        if (this.shouldExcludeFromTree(item)) {
          continue;
        }

        const itemPath = join(dirPath, item);
        const itemStats = await stat(itemPath);
        const isLast = i === sortedItems.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');

        content += `${prefix}${connector}${item}\n`;

        if (itemStats.isDirectory()) {
          dirCount++;
          const subTree = await this.buildProjectTree(itemPath, depth + 1, nextPrefix);
          content += subTree.content;
          fileCount += subTree.fileCount;
          dirCount += subTree.dirCount;
          currentMaxDepth = Math.max(currentMaxDepth, subTree.maxDepth);
        } else {
          fileCount++;
        }
      }

    } catch (error) {
      // Skip directories that can't be read
    }

    return {
      content,
      fileCount,
      dirCount,
      maxDepth: currentMaxDepth
    };
  }

  /**
   * Format context parts into final context string
   * @param {Array} contextParts - Array of context parts
   * @param {string} format - Output format
   * @returns {string} Formatted context
   */
  formatContext(contextParts, format) {
    if (contextParts.length === 0) {
      return '';
    }

    const formatters = {
      research: this.formatForResearch.bind(this),
      analysis: this.formatForAnalysis.bind(this),
      summary: this.formatForSummary.bind(this)
    };

    const formatter = formatters[format] || formatters.research;
    return formatter(contextParts);
  }

  /**
   * Format context for research purposes
   * @param {Array} contextParts - Context parts to format
   * @returns {string} Formatted context
   */
  formatForResearch(contextParts) {
    const sections = [];

    for (const part of contextParts) {
      switch (part.type) {
        case 'custom':
          sections.push(`## Custom Context\n\n${part.content}`);
          break;
        case 'tasks':
          sections.push(`## Relevant Tasks\n\n${part.content}`);
          break;
        case 'files':
          sections.push(`## Source Files\n\n${part.content}`);
          break;
        case 'projectTree':
          sections.push(part.content);
          break;
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Format context for analysis purposes
   * @param {Array} contextParts - Context parts to format
   * @returns {string} Formatted context
   */
  formatForAnalysis(contextParts) {
    // More structured format for analysis
    let content = '# Project Analysis Context\n\n';

    for (const part of contextParts) {
      content += `## ${part.type.toUpperCase()}\n\n${part.content}\n\n`;
    }

    return content;
  }

  /**
   * Format context for summary purposes
   * @param {Array} contextParts - Context parts to format
   * @returns {string} Formatted context
   */
  formatForSummary(contextParts) {
    // Condensed format for summaries
    const summaries = contextParts.map(part => {
      const summary = part.content.substring(0, 500);
      return `**${part.type}**: ${summary}${part.content.length > 500 ? '...' : ''}`;
    });

    return summaries.join('\n\n');
  }

  /**
   * Load tasks data from the project
   * @returns {Promise<Object>} Tasks data
   */
  async loadTasksData() {
    try {
      const tasksPath = join(this.projectRoot, 'sa-engine/data/tasks/tasks.json');
      
      if (!existsSync(tasksPath)) {
        return null;
      }

      const content = await readFile(tasksPath, 'utf-8');
      return JSON.parse(content);

    } catch (error) {
      return null;
    }
  }

  /**
   * Extract context from a specific task
   * @param {Object} tasksData - Tasks data
   * @param {string} taskId - Task ID to extract
   * @returns {Object} Task context
   */
  async extractTaskContext(tasksData, taskId) {
    try {
      // Handle both main tasks (1, 2, 3) and subtasks (1.1, 1.2, etc.)
      const [mainId, subId] = taskId.split('.').map(id => parseInt(id));
      
      const task = tasksData.tasks.find(t => t.id === mainId);
      if (!task) {
        return null;
      }

      if (subId) {
        // Extract subtask context
        const subtask = task.subtasks?.find(st => st.id === subId);
        if (!subtask) {
          return null;
        }

        const content = `### Subtask ${taskId}: ${subtask.title}\n\n` +
          `**Description**: ${subtask.description || 'No description'}\n` +
          `**Status**: ${subtask.status}\n` +
          `**Priority**: ${subtask.priority || 'normal'}\n` +
          (subtask.details ? `**Details**: ${subtask.details}\n` : '') +
          (subtask.testStrategy ? `**Test Strategy**: ${subtask.testStrategy}\n` : '');

        return {
          content,
          title: subtask.title,
          type: 'subtask'
        };
      } else {
        // Extract main task context
        const content = `### Task ${taskId}: ${task.title}\n\n` +
          `**Description**: ${task.description || 'No description'}\n` +
          `**Status**: ${task.status}\n` +
          `**Priority**: ${task.priority || 'normal'}\n` +
          (task.details ? `**Details**: ${task.details}\n` : '') +
          (task.testStrategy ? `**Test Strategy**: ${task.testStrategy}\n` : '') +
          (task.dependencies?.length ? `**Dependencies**: ${task.dependencies.join(', ')}\n` : '') +
          (task.subtasks?.length ? `**Subtasks**: ${task.subtasks.length} subtasks\n` : '');

        return {
          content,
          title: task.title,
          type: 'task'
        };
      }

    } catch (error) {
      return null;
    }
  }

  /**
   * Resolve file path relative to project root
   * @param {string} filePath - File path to resolve
   * @returns {string} Absolute file path
   */
  resolveFilePath(filePath) {
    if (filePath.startsWith('/')) {
      return filePath;
    }
    
    return join(this.projectRoot, filePath);
  }

  /**
   * Check if item should be excluded from project tree
   * @param {string} item - Item name to check
   * @returns {boolean} True if should be excluded
   */
  shouldExcludeFromTree(item) {
    return this.options.excludePatterns.some(pattern => {
      if (pattern.endsWith('/')) {
        return item === pattern.slice(0, -1);
      }
      
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(item);
      }
      
      return item === pattern;
    });
  }

  /**
   * Count tokens in text (rough estimate)
   * @param {string} text - Text to count tokens for
   * @returns {number} Estimated token count
   */
  countTokens(text) {
    if (!text) return 0;
    
    // Rough token estimation: ~0.25 tokens per character for English text
    // This is an approximation - actual tokenization would require the specific model's tokenizer
    return Math.ceil(text.length * this.options.tokensPerCharacter);
  }

  /**
   * Get context gathering statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      projectRoot: this.projectRoot,
      tag: this.tag,
      options: this.options,
      supportedExtensions: this.options.includeFileExtensions.length,
      excludePatterns: this.options.excludePatterns.length
    };
  }
}