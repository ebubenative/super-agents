import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import ContextGatherer from './ContextGatherer.js';
import FuzzyTaskSearch from './FuzzyTaskSearch.js';

/**
 * ResearchEngine - AI-powered research system with project context awareness
 * Combines context gathering, fuzzy search, and AI analysis for comprehensive research
 */
export default class ResearchEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      tag: options.tag || null,
      maxTokens: options.maxTokens || 100000,
      defaultDetailLevel: options.defaultDetailLevel || 'medium',
      enableFollowUp: options.enableFollowUp !== false,
      enableSaveToFile: options.enableSaveToFile !== false,
      enableSaveToTask: options.enableSaveToTask !== false,
      researchDirectory: options.researchDirectory || '.super-agents/research',
      logLevel: options.logLevel || 'info',
      ...options
    };

    this.contextGatherer = null;
    this.fuzzySearch = null;
    this.aiProvider = null;
    this.conversationHistory = [];
    
    this.initialize();
  }

  /**
   * Initialize the research engine
   */
  initialize() {
    try {
      // Initialize context gatherer
      this.contextGatherer = new ContextGatherer(this.options.projectRoot, this.options.tag, {
        maxTokens: this.options.maxTokens
      });

      // Setup event forwarding
      this.contextGatherer.on('gatherStarting', (data) => this.emit('contextGatherStarting', data));
      this.contextGatherer.on('gatherCompleted', (data) => this.emit('contextGatherCompleted', data));
      this.contextGatherer.on('gatherError', (data) => this.emit('contextGatherError', data));

      this.log('Research engine initialized', 'info');

    } catch (error) {
      this.log(`Failed to initialize research engine: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Set AI provider for research queries
   * @param {Object} aiProvider - AI provider instance
   */
  setAIProvider(aiProvider) {
    this.aiProvider = aiProvider;
    this.log('AI provider set for research engine', 'info');
  }

  /**
   * Perform comprehensive research query
   * @param {string} query - Research query
   * @param {Object} options - Research options
   * @returns {Promise<Object>} Research results
   */
  async performResearch(query, options = {}) {
    try {
      this.emit('researchStarting', { query, options });

      // Merge options with defaults
      const researchOptions = {
        taskIds: [],
        filePaths: [],
        customContext: '',
        includeProjectTree: false,
        detailLevel: this.options.defaultDetailLevel,
        saveTo: null,
        saveToFile: false,
        autoDiscoverTasks: true,
        ...options
      };

      // Auto-discover relevant tasks if enabled
      if (researchOptions.autoDiscoverTasks) {
        const discoveredTasks = await this.discoverRelevantTasks(query, researchOptions);
        researchOptions.taskIds = [...new Set([...researchOptions.taskIds, ...discoveredTasks])];
      }

      // Gather context from multiple sources
      const contextResult = await this.contextGatherer.gather({
        tasks: researchOptions.taskIds,
        files: researchOptions.filePaths,
        customContext: researchOptions.customContext,
        includeProjectTree: researchOptions.includeProjectTree,
        format: 'research',
        includeTokenCounts: true
      });

      // Generate research prompt
      const researchPrompt = this.generateResearchPrompt(query, contextResult, researchOptions);

      // Perform AI research query
      const aiResult = await this.queryAI(researchPrompt, researchOptions);

      // Build research result
      const researchResult = {
        query,
        result: aiResult.content,
        detailLevel: researchOptions.detailLevel,
        contextSize: contextResult.context.length,
        contextTokens: contextResult.tokenBreakdown?.total || 0,
        tokenBreakdown: contextResult.tokenBreakdown,
        discoveredTasks: researchOptions.taskIds,
        sources: {
          tasks: researchOptions.taskIds.length,
          files: researchOptions.filePaths.length,
          customContext: !!researchOptions.customContext,
          projectTree: researchOptions.includeProjectTree
        },
        metadata: {
          timestamp: new Date().toISOString(),
          projectRoot: this.options.projectRoot,
          tag: this.options.tag,
          aiProvider: aiResult.provider,
          tokenUsage: aiResult.tokenUsage
        }
      };

      // Handle save operations
      if (researchOptions.saveTo) {
        await this.saveToTask(researchResult, researchOptions.saveTo);
      }

      if (researchOptions.saveToFile) {
        const filePath = await this.saveToFile(researchResult);
        researchResult.savedFilePath = filePath;
      }

      // Add to conversation history
      this.conversationHistory.push({
        type: 'initial',
        query,
        result: researchResult,
        timestamp: new Date().toISOString()
      });

      this.emit('researchCompleted', { query, result: researchResult });
      return researchResult;

    } catch (error) {
      this.emit('researchError', { error, query, options });
      throw error;
    }
  }

  /**
   * Perform follow-up research query
   * @param {string} followUpQuery - Follow-up query
   * @param {Object} options - Research options
   * @returns {Promise<Object>} Follow-up results
   */
  async performFollowUp(followUpQuery, options = {}) {
    try {
      if (!this.options.enableFollowUp) {
        throw new Error('Follow-up queries are disabled');
      }

      this.emit('followUpStarting', { query: followUpQuery, options });

      // Build conversation context from history
      const conversationContext = this.buildConversationContext();

      // Enhanced options with conversation context
      const followUpOptions = {
        ...options,
        customContext: conversationContext + (options.customContext ? `\n\n${options.customContext}` : ''),
        autoDiscoverTasks: true // Re-discover tasks for follow-up
      };

      // Perform follow-up research
      const result = await this.performResearch(followUpQuery, followUpOptions);

      // Update conversation history
      this.conversationHistory.push({
        type: 'followup',
        query: followUpQuery,
        result,
        timestamp: new Date().toISOString()
      });

      this.emit('followUpCompleted', { query: followUpQuery, result });
      return result;

    } catch (error) {
      this.emit('followUpError', { error, query: followUpQuery, options });
      throw error;
    }
  }

  /**
   * Discover relevant tasks for the query
   * @param {string} query - Research query
   * @param {Object} options - Discovery options
   * @returns {Promise<Array>} Array of task IDs
   */
  async discoverRelevantTasks(query, options = {}) {
    try {
      // Load tasks data
      const tasksData = await this.loadTasksData();
      if (!tasksData || !tasksData.tasks) {
        return [];
      }

      // Flatten tasks to include subtasks
      const flatTasks = this.flattenTasks(tasksData.tasks);

      // Initialize fuzzy search
      this.fuzzySearch = new FuzzyTaskSearch(flatTasks, 'research', {
        maxResults: options.maxDiscoveredTasks || 8,
        includeRecent: true,
        includeCategoryMatches: true
      });

      // Find relevant tasks
      const searchResults = this.fuzzySearch.findRelevantTasks(query, {
        maxResults: options.maxDiscoveredTasks || 8
      });

      // Extract task IDs
      const taskIds = this.fuzzySearch.getTaskIds(searchResults);

      this.log(`Discovered ${taskIds.length} relevant tasks for query: "${query}"`, 'info');
      return taskIds;

    } catch (error) {
      this.log(`Failed to discover relevant tasks: ${error.message}`, 'warn');
      return [];
    }
  }

  /**
   * Generate research prompt for AI
   * @param {string} query - Research query
   * @param {Object} contextResult - Context gathering result
   * @param {Object} options - Research options
   * @returns {Object} System and user prompts
   */
  generateResearchPrompt(query, contextResult, options) {
    const detailLevelInstructions = {
      low: 'Provide a concise, high-level response focusing on key insights and actionable recommendations.',
      medium: 'Provide a balanced response with clear explanations, relevant details, and practical recommendations.',
      high: 'Provide a comprehensive, detailed analysis with thorough explanations, examples, and step-by-step guidance.'
    };

    const systemPrompt = `You are a specialized AI research assistant with deep project context awareness. Your role is to provide insightful, accurate, and actionable research responses based on the provided project context.

## Research Guidelines

### Detail Level: ${options.detailLevel.toUpperCase()}
${detailLevelInstructions[options.detailLevel] || detailLevelInstructions.medium}

### Response Structure
1. **Executive Summary**: Brief overview of key findings
2. **Detailed Analysis**: In-depth examination of the query
3. **Context Integration**: How findings relate to the project context
4. **Recommendations**: Actionable next steps or suggestions
5. **Additional Considerations**: Related aspects worth noting

### Quality Standards
- Base responses on provided context when available
- Acknowledge context limitations or gaps
- Provide specific, actionable recommendations
- Use technical accuracy appropriate for software development
- Reference specific tasks, files, or project elements when relevant

### Context Awareness
- Prioritize project-specific information over general knowledge
- Consider task dependencies and project workflow
- Align recommendations with project architecture and patterns
- Account for current project status and priorities`;

    const userPrompt = `# Research Query
${query}

# Project Context
${contextResult.context || 'No specific project context provided.'}

Please provide a comprehensive research response following the guidelines above. Focus on practical insights that would be valuable for someone working on this project.`;

    return {
      systemPrompt,
      userPrompt,
      contextTokens: contextResult.tokenBreakdown?.total || 0,
      promptTokens: this.contextGatherer.countTokens(systemPrompt + userPrompt)
    };
  }

  /**
   * Query AI provider with research prompt
   * @param {Object} promptData - Prompt data with system and user prompts
   * @param {Object} options - Query options
   * @returns {Promise<Object>} AI response
   */
  async queryAI(promptData, options = {}) {
    if (!this.aiProvider) {
      throw new Error('AI provider not configured for research engine');
    }

    try {
      this.log('Querying AI provider for research', 'info');

      // Prepare AI request
      const aiRequest = {
        systemPrompt: promptData.systemPrompt,
        userPrompt: promptData.userPrompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxResponseTokens || 4000,
        model: options.model || 'default'
      };

      // Query AI provider
      const response = await this.aiProvider.generateText(aiRequest);

      return {
        content: response.content || response.text || response,
        provider: this.aiProvider.name || 'unknown',
        tokenUsage: response.tokenUsage || null,
        model: response.model || aiRequest.model
      };

    } catch (error) {
      this.log(`AI query failed: ${error.message}`, 'error');
      throw new Error(`Research AI query failed: ${error.message}`);
    }
  }

  /**
   * Save research results to a task or subtask
   * @param {Object} researchResult - Research result object
   * @param {string} taskId - Task ID to save to
   * @returns {Promise<void>}
   */
  async saveToTask(researchResult, taskId) {
    try {
      if (!this.options.enableSaveToTask) {
        throw new Error('Save to task is disabled');
      }

      // Load task manager if available
      if (!this.taskManager) {
        const { TaskManager } = await import('../tasks/TaskManager.js');
        this.taskManager = new TaskManager({ projectRoot: this.options.projectRoot });
      }

      // Format research content for task
      const researchContent = this.formatResearchForTask(researchResult);

      // Determine if it's a task or subtask
      const isSubtask = taskId.includes('.');

      if (isSubtask) {
        await this.taskManager.updateSubtask(taskId, researchContent, { appendMode: true });
      } else {
        await this.taskManager.updateTask(parseInt(taskId), researchContent, { appendMode: true });
      }

      this.log(`Research saved to ${isSubtask ? 'subtask' : 'task'} ${taskId}`, 'info');

    } catch (error) {
      this.log(`Failed to save research to task ${taskId}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Save research results to file
   * @param {Object} researchResult - Research result object
   * @returns {Promise<string>} File path
   */
  async saveToFile(researchResult) {
    try {
      if (!this.options.enableSaveToFile) {
        throw new Error('Save to file is disabled');
      }

      // Create research directory
      const researchDir = join(this.options.projectRoot, this.options.researchDirectory);
      if (!existsSync(researchDir)) {
        await mkdir(researchDir, { recursive: true });
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const querySlug = this.createSlug(researchResult.query);
      const filename = `${timestamp}_${querySlug}.md`;
      const filePath = join(researchDir, filename);

      // Format content for file
      const fileContent = this.formatResearchForFile(researchResult);

      // Write file
      await writeFile(filePath, fileContent, 'utf-8');

      this.log(`Research saved to file: ${filename}`, 'info');
      return filePath;

    } catch (error) {
      this.log(`Failed to save research to file: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Format research results for task saving
   * @param {Object} researchResult - Research result object
   * @returns {string} Formatted content
   */
  formatResearchForTask(researchResult) {
    const timestamp = new Date().toLocaleString();
    
    return `## Research Session - ${timestamp}

**Query:** ${researchResult.query}

**Response:**
${researchResult.result}

**Context:** ${researchResult.sources.tasks} tasks, ${researchResult.sources.files} files, ${researchResult.contextTokens} tokens
**Detail Level:** ${researchResult.detailLevel}

---

`;
  }

  /**
   * Format research results for file saving
   * @param {Object} researchResult - Research result object
   * @returns {string} Formatted file content
   */
  formatResearchForFile(researchResult) {
    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString();
    
    return `---
title: Research Session
query: "${researchResult.query}"
date: ${date}
timestamp: ${timestamp}
detail_level: ${researchResult.detailLevel}
context_tokens: ${researchResult.contextTokens}
sources:
  tasks: ${researchResult.sources.tasks}
  files: ${researchResult.sources.files}
  project_tree: ${researchResult.sources.projectTree}
discovered_tasks: [${researchResult.discoveredTasks.join(', ')}]
---

# Research Session

## Query
${researchResult.query}

## Response
${researchResult.result}

## Context Analysis
- **Context Size**: ${researchResult.contextSize} characters (${researchResult.contextTokens} tokens)
- **Sources**: ${researchResult.sources.tasks} tasks, ${researchResult.sources.files} files
- **Detail Level**: ${researchResult.detailLevel}
- **Discovered Tasks**: ${researchResult.discoveredTasks.join(', ') || 'None'}

${researchResult.tokenBreakdown ? this.formatTokenBreakdown(researchResult.tokenBreakdown) : ''}

## Metadata
- **Timestamp**: ${timestamp}
- **Project Root**: ${researchResult.metadata.projectRoot}
- **AI Provider**: ${researchResult.metadata.aiProvider}
${researchResult.metadata.tag ? `- **Tag**: ${researchResult.metadata.tag}` : ''}

---

*Generated by Super Agents Research Engine*`;
  }

  /**
   * Format token breakdown for display
   * @param {Object} tokenBreakdown - Token breakdown object
   * @returns {string} Formatted breakdown
   */
  formatTokenBreakdown(tokenBreakdown) {
    let breakdown = '## Token Usage Breakdown\n\n';
    
    if (tokenBreakdown.customContext) {
      breakdown += `- **Custom Context**: ${tokenBreakdown.customContext.tokens} tokens\n`;
    }
    
    if (tokenBreakdown.tasks && tokenBreakdown.tasks.length > 0) {
      const totalTaskTokens = tokenBreakdown.tasks.reduce((sum, task) => sum + task.tokens, 0);
      breakdown += `- **Tasks**: ${totalTaskTokens} tokens (${tokenBreakdown.tasks.length} tasks)\n`;
      
      for (const task of tokenBreakdown.tasks) {
        breakdown += `  - Task ${task.id}: ${task.tokens} tokens\n`;
      }
    }
    
    if (tokenBreakdown.files && tokenBreakdown.files.length > 0) {
      const totalFileTokens = tokenBreakdown.files.reduce((sum, file) => sum + file.tokens, 0);
      breakdown += `- **Files**: ${totalFileTokens} tokens (${tokenBreakdown.files.length} files)\n`;
      
      for (const file of tokenBreakdown.files) {
        breakdown += `  - ${file.path}: ${file.tokens} tokens\n`;
      }
    }
    
    if (tokenBreakdown.projectTree) {
      breakdown += `- **Project Tree**: ${tokenBreakdown.projectTree.tokens} tokens\n`;
    }

    breakdown += `\n**Total Context**: ${tokenBreakdown.total} tokens\n`;
    
    return breakdown;
  }

  /**
   * Build conversation context from history
   * @returns {string} Formatted conversation context
   */
  buildConversationContext() {
    if (this.conversationHistory.length === 0) {
      return '';
    }

    const contextParts = ['--- Previous Research Context ---'];

    for (const [index, entry] of this.conversationHistory.entries()) {
      const label = entry.type === 'initial' ? 'Initial Question' : `Follow-up ${index}`;
      contextParts.push(`\n${label}: ${entry.query}`);
      contextParts.push(`Answer: ${entry.result.result.substring(0, 1000)}${entry.result.result.length > 1000 ? '...' : ''}`);
    }

    return contextParts.join('\n');
  }

  /**
   * Load tasks data from project
   * @returns {Promise<Object>} Tasks data
   */
  async loadTasksData() {
    try {
      const tasksPath = join(this.options.projectRoot, 'sa-engine/data/tasks/tasks.json');
      
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
   * Flatten tasks to include subtasks
   * @param {Array} tasks - Tasks array
   * @returns {Array} Flattened tasks with subtasks
   */
  flattenTasks(tasks) {
    const flattened = [];
    
    for (const task of tasks) {
      // Add main task
      flattened.push({
        ...task,
        id: task.id.toString()
      });
      
      // Add subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        for (const subtask of task.subtasks) {
          flattened.push({
            ...subtask,
            id: `${task.id}.${subtask.id}`,
            parentId: task.id,
            isSubtask: true
          });
        }
      }
    }
    
    return flattened;
  }

  /**
   * Create URL-safe slug from text
   * @param {string} text - Text to slugify
   * @returns {string} URL-safe slug
   */
  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    this.log('Conversation history cleared', 'info');
  }

  /**
   * Get conversation history
   * @returns {Array} Conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Get research engine statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      projectRoot: this.options.projectRoot,
      tag: this.options.tag,
      conversationLength: this.conversationHistory.length,
      contextGathererStats: this.contextGatherer?.getStats(),
      fuzzySearchStats: this.fuzzySearch?.getStats(),
      aiProviderConfigured: !!this.aiProvider,
      options: this.options
    };
  }

  /**
   * Logging utility
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  log(message, level = 'info') {
    if (this.options.logLevel === 'debug' || level === 'error') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [ResearchEngine] [${level.toUpperCase()}] ${message}`);
    }
    
    this.emit('log', { message, level, timestamp: new Date().toISOString() });
  }
}