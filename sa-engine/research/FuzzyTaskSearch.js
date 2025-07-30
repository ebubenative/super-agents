import { EventEmitter } from 'events';

/**
 * FuzzyTaskSearch - Intelligent task discovery for research and context gathering
 * Finds relevant tasks based on query similarity and context matching
 */
export default class FuzzyTaskSearch extends EventEmitter {
  constructor(tasks, searchContext = 'general', options = {}) {
    super();
    
    this.tasks = tasks || [];
    this.searchContext = searchContext;
    this.options = {
      // Scoring weights
      titleWeight: 0.4,
      descriptionWeight: 0.3,
      detailsWeight: 0.2,
      categoryWeight: 0.1,
      
      // Search parameters
      minScore: 0.1,
      maxResults: 10,
      includeRecent: true,
      includeCategoryMatches: true,
      fuzzyThreshold: 0.6,
      
      // Context-specific boosts
      contextBoosts: {
        research: ['analysis', 'investigate', 'study', 'explore'],
        implementation: ['implement', 'build', 'create', 'develop'],
        testing: ['test', 'validate', 'verify', 'check'],
        documentation: ['document', 'write', 'explain', 'describe']
      },
      
      ...options
    };
    
    // Pre-process tasks for faster searching
    this.processedTasks = this.preprocessTasks();
  }

  /**
   * Find relevant tasks based on query
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Array of relevant tasks with scores
   */
  findRelevantTasks(query, options = {}) {
    const searchOptions = { ...this.options, ...options };
    
    try {
      this.emit('searchStarting', { query, options: searchOptions });

      if (!query || query.trim().length === 0) {
        return this.getRecentTasks(searchOptions.maxResults);
      }

      const queryTerms = this.extractQueryTerms(query);
      const results = [];

      // Score each task
      for (const task of this.processedTasks) {
        const score = this.calculateTaskScore(task, queryTerms, searchOptions);
        
        if (score >= searchOptions.minScore) {
          results.push({
            ...task.original,
            searchScore: score,
            matchDetails: this.getMatchDetails(task, queryTerms)
          });
        }
      }

      // Sort by score (descending)
      results.sort((a, b) => b.searchScore - a.searchScore);

      // Apply result limits and filters
      let filteredResults = results.slice(0, searchOptions.maxResults);

      // Add recent tasks if requested and we don't have enough results
      if (searchOptions.includeRecent && filteredResults.length < searchOptions.maxResults) {
        const recentTasks = this.getRecentTasks(searchOptions.maxResults - filteredResults.length);
        const recentIds = new Set(filteredResults.map(t => t.id));
        
        for (const recent of recentTasks) {
          if (!recentIds.has(recent.id)) {
            filteredResults.push({
              ...recent,
              searchScore: 0.05, // Low score for recent tasks
              matchDetails: { type: 'recent', reason: 'Recently modified' }
            });
          }
        }
      }

      // Add category matches if requested
      if (searchOptions.includeCategoryMatches) {
        const categoryMatches = this.findCategoryMatches(queryTerms, searchOptions);
        const existingIds = new Set(filteredResults.map(t => t.id));
        
        for (const match of categoryMatches) {
          if (!existingIds.has(match.id) && filteredResults.length < searchOptions.maxResults) {
            filteredResults.push(match);
          }
        }
      }

      this.emit('searchCompleted', { 
        query, 
        resultsCount: filteredResults.length, 
        totalScanned: this.processedTasks.length 
      });

      return filteredResults;

    } catch (error) {
      this.emit('searchError', { error, query });
      return [];
    }
  }

  /**
   * Get task IDs from search results
   * @param {Array} searchResults - Results from findRelevantTasks
   * @returns {Array} Array of task ID strings
   */
  getTaskIds(searchResults) {
    return searchResults.map(result => result.id.toString());
  }

  /**
   * Find tasks by category or type
   * @param {string|Array} categories - Categories to search for
   * @param {Object} options - Search options
   * @returns {Array} Matching tasks
   */
  findByCategory(categories, options = {}) {
    const searchCategories = Array.isArray(categories) ? categories : [categories];
    const searchOptions = { ...this.options, ...options };
    
    const results = [];
    
    for (const task of this.processedTasks) {
      const matchesCategory = searchCategories.some(category => 
        this.matchesCategory(task, category)
      );
      
      if (matchesCategory) {
        results.push({
          ...task.original,
          searchScore: 0.8,
          matchDetails: { type: 'category', categories: searchCategories }
        });
      }
    }

    return results.slice(0, searchOptions.maxResults);
  }

  /**
   * Find tasks by status
   * @param {string|Array} statuses - Statuses to search for
   * @param {Object} options - Search options
   * @returns {Array} Matching tasks
   */
  findByStatus(statuses, options = {}) {
    const searchStatuses = Array.isArray(statuses) ? statuses : [statuses];
    const searchOptions = { ...this.options, ...options };
    
    const results = this.tasks.filter(task => 
      searchStatuses.includes(task.status)
    );

    return results.slice(0, searchOptions.maxResults).map(task => ({
      ...task,
      searchScore: 0.9,
      matchDetails: { type: 'status', statuses: searchStatuses }
    }));
  }

  /**
   * Preprocess tasks for faster searching
   * @returns {Array} Processed tasks
   */
  preprocessTasks() {
    return this.tasks.map(task => {
      const processed = {
        original: task,
        id: task.id,
        
        // Normalized text fields for matching
        titleNorm: this.normalizeText(task.title || ''),
        descriptionNorm: this.normalizeText(task.description || ''),
        detailsNorm: this.normalizeText(task.details || ''),
        
        // Extracted keywords
        titleKeywords: this.extractKeywords(task.title || ''),
        descriptionKeywords: this.extractKeywords(task.description || ''),
        detailsKeywords: this.extractKeywords(task.details || ''),
        
        // Metadata
        status: task.status,
        priority: task.priority,
        category: this.inferCategory(task),
        lastModified: task.lastModified || task.updatedAt || null,
        
        // Pre-computed category indicators
        isImplementation: this.isImplementationTask(task),
        isAnalysis: this.isAnalysisTask(task),
        isTesting: this.isTestingTask(task),
        isDocumentation: this.isDocumentationTask(task)
      };
      
      return processed;
    });
  }

  /**
   * Calculate relevance score for a task
   * @param {Object} task - Processed task
   * @param {Array} queryTerms - Query terms
   * @param {Object} options - Search options
   * @returns {number} Relevance score (0-1)
   */
  calculateTaskScore(task, queryTerms, options) {
    let score = 0;
    
    // Title matching (highest weight)
    const titleScore = this.calculateTextScore(task.titleNorm, task.titleKeywords, queryTerms);
    score += titleScore * options.titleWeight;
    
    // Description matching
    const descriptionScore = this.calculateTextScore(task.descriptionNorm, task.descriptionKeywords, queryTerms);
    score += descriptionScore * options.descriptionWeight;
    
    // Details matching
    const detailsScore = this.calculateTextScore(task.detailsNorm, task.detailsKeywords, queryTerms);
    score += detailsScore * options.detailsWeight;
    
    // Category matching
    const categoryScore = this.calculateCategoryScore(task, queryTerms);
    score += categoryScore * options.categoryWeight;
    
    // Context-specific boosts
    const contextBoost = this.calculateContextBoost(task, queryTerms, options);
    score += contextBoost;
    
    // Recency boost (small)
    const recencyBoost = this.calculateRecencyBoost(task);
    score += recencyBoost;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate text matching score
   * @param {string} normalizedText - Normalized text
   * @param {Array} keywords - Extracted keywords
   * @param {Array} queryTerms - Query terms
   * @returns {number} Text score (0-1)
   */
  calculateTextScore(normalizedText, keywords, queryTerms) {
    if (!normalizedText || queryTerms.length === 0) return 0;
    
    let score = 0;
    let matches = 0;
    
    for (const term of queryTerms) {
      // Exact word matching
      if (keywords.includes(term)) {
        score += 0.8;
        matches++;
      }
      // Partial matching
      else if (normalizedText.includes(term)) {
        score += 0.4;
        matches++;
      }
      // Fuzzy matching for longer terms
      else if (term.length > 4) {
        const fuzzyScore = this.calculateFuzzyMatch(term, normalizedText);
        if (fuzzyScore > this.options.fuzzyThreshold) {
          score += fuzzyScore * 0.3;
          matches++;
        }
      }
    }
    
    // Normalize by query length and apply match ratio bonus
    const baseScore = score / queryTerms.length;
    const matchRatio = matches / queryTerms.length;
    
    return baseScore * (0.5 + matchRatio * 0.5);
  }

  /**
   * Calculate category matching score
   * @param {Object} task - Processed task
   * @param {Array} queryTerms - Query terms
   * @returns {number} Category score (0-1)
   */
  calculateCategoryScore(task, queryTerms) {
    let score = 0;
    
    // Check for category-specific terms in query
    for (const term of queryTerms) {
      if (task.isImplementation && this.isImplementationTerm(term)) {
        score += 0.3;
      }
      if (task.isAnalysis && this.isAnalysisTerm(term)) {
        score += 0.3;
      }
      if (task.isTesting && this.isTestingTerm(term)) {
        score += 0.3;
      }
      if (task.isDocumentation && this.isDocumentationTerm(term)) {
        score += 0.3;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate context-specific boost
   * @param {Object} task - Processed task
   * @param {Array} queryTerms - Query terms
   * @param {Object} options - Search options
   * @returns {number} Context boost (0-0.2)
   */
  calculateContextBoost(task, queryTerms, options) {
    const contextBoosts = options.contextBoosts[this.searchContext] || [];
    
    let boost = 0;
    for (const term of queryTerms) {
      if (contextBoosts.includes(term)) {
        boost += 0.05;
      }
    }
    
    return Math.min(boost, 0.2);
  }

  /**
   * Calculate recency boost
   * @param {Object} task - Processed task
   * @returns {number} Recency boost (0-0.1)
   */
  calculateRecencyBoost(task) {
    if (!task.lastModified) return 0;
    
    const now = new Date();
    const modified = new Date(task.lastModified);
    const daysDiff = (now - modified) / (1000 * 60 * 60 * 24);
    
    // Boost recent tasks (within 7 days)
    if (daysDiff <= 7) {
      return 0.1 * (1 - daysDiff / 7);
    }
    
    return 0;
  }

  /**
   * Get recent tasks
   * @param {number} limit - Maximum number of tasks
   * @returns {Array} Recent tasks
   */
  getRecentTasks(limit = 5) {
    const tasksWithDates = this.tasks
      .filter(task => task.lastModified || task.updatedAt)
      .sort((a, b) => {
        const dateA = new Date(a.lastModified || a.updatedAt);
        const dateB = new Date(b.lastModified || b.updatedAt);
        return dateB - dateA;
      });
    
    return tasksWithDates.slice(0, limit);
  }

  /**
   * Find category matches
   * @param {Array} queryTerms - Query terms
   * @param {Object} options - Search options
   * @returns {Array} Category matches
   */
  findCategoryMatches(queryTerms, options) {
    const matches = [];
    
    // Look for tasks that match query categories but didn't score high in text matching
    for (const task of this.processedTasks) {
      const categoryScore = this.calculateCategoryScore(task, queryTerms);
      
      if (categoryScore > 0.2) {
        matches.push({
          ...task.original,
          searchScore: categoryScore * 0.6, // Lower than text matches
          matchDetails: { type: 'category', score: categoryScore }
        });
      }
    }
    
    return matches
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, Math.floor(options.maxResults / 3)); // Limit category matches
  }

  /**
   * Get match details for a task
   * @param {Object} task - Processed task
   * @param {Array} queryTerms - Query terms
   * @returns {Object} Match details
   */
  getMatchDetails(task, queryTerms) {
    const details = {
      type: 'text',
      matches: []
    };
    
    // Find specific matches
    for (const term of queryTerms) {
      if (task.titleKeywords.includes(term)) {
        details.matches.push({ field: 'title', term, type: 'exact' });
      } else if (task.titleNorm.includes(term)) {
        details.matches.push({ field: 'title', term, type: 'partial' });
      }
      
      if (task.descriptionKeywords.includes(term)) {
        details.matches.push({ field: 'description', term, type: 'exact' });
      } else if (task.descriptionNorm.includes(term)) {
        details.matches.push({ field: 'description', term, type: 'partial' });
      }
    }
    
    return details;
  }

  /**
   * Extract and normalize query terms
   * @param {string} query - Search query
   * @returns {Array} Normalized query terms
   */
  extractQueryTerms(query) {
    return this.normalizeText(query)
      .split(/\s+/)
      .filter(term => term.length > 2) // Filter short terms
      .slice(0, 10); // Limit query terms
  }

  /**
   * Normalize text for searching
   * @param {string} text - Text to normalize
   * @returns {string} Normalized text
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Array} Extracted keywords
   */
  extractKeywords(text) {
    const normalized = this.normalizeText(text);
    const words = normalized.split(/\s+/);
    
    // Filter out common words and short words
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'for',
      'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'you',
      'they', 'them', 'their', 'our', 'your', 'my', 'me', 'him', 'her'
    ]);
    
    return words.filter(word => 
      word.length > 2 && !commonWords.has(word)
    );
  }

  /**
   * Calculate fuzzy match score
   * @param {string} term - Search term
   * @param {string} text - Text to match against
   * @returns {number} Fuzzy match score (0-1)
   */
  calculateFuzzyMatch(term, text) {
    // Simple fuzzy matching using Levenshtein-like algorithm
    const words = text.split(/\s+/);
    let bestScore = 0;
    
    for (const word of words) {
      if (word.length === 0) continue;
      
      const score = this.levenshteinSimilarity(term, word);
      bestScore = Math.max(bestScore, score);
    }
    
    return bestScore;
  }

  /**
   * Calculate Levenshtein similarity
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Similarity score (0-1)
   */
  levenshteinSimilarity(a, b) {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(a, b);
    return 1 - distance / maxLen;
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }

  /**
   * Infer task category from content
   * @param {Object} task - Task object
   * @returns {string} Inferred category
   */
  inferCategory(task) {
    const text = `${task.title} ${task.description} ${task.details}`.toLowerCase();
    
    if (this.isImplementationTask(task)) return 'implementation';
    if (this.isAnalysisTask(task)) return 'analysis';
    if (this.isTestingTask(task)) return 'testing';
    if (this.isDocumentationTask(task)) return 'documentation';
    
    return 'general';
  }

  /**
   * Check if task is implementation-related
   * @param {Object} task - Task object
   * @returns {boolean} True if implementation task
   */
  isImplementationTask(task) {
    const text = `${task.title} ${task.description} ${task.details}`.toLowerCase();
    const implTerms = ['implement', 'build', 'create', 'develop', 'code', 'program', 'write'];
    return implTerms.some(term => text.includes(term));
  }

  /**
   * Check if task is analysis-related
   * @param {Object} task - Task object
   * @returns {boolean} True if analysis task
   */
  isAnalysisTask(task) {
    const text = `${task.title} ${task.description} ${task.details}`.toLowerCase();
    const analysisTerms = ['analyze', 'study', 'research', 'investigate', 'explore', 'examine'];
    return analysisTerms.some(term => text.includes(term));
  }

  /**
   * Check if task is testing-related
   * @param {Object} task - Task object
   * @returns {boolean} True if testing task
   */
  isTestingTask(task) {
    const text = `${task.title} ${task.description} ${task.details}`.toLowerCase();
    const testTerms = ['test', 'validate', 'verify', 'check', 'qa', 'quality'];
    return testTerms.some(term => text.includes(term));
  }

  /**
   * Check if task is documentation-related
   * @param {Object} task - Task object
   * @returns {boolean} True if documentation task
   */
  isDocumentationTask(task) {
    const text = `${task.title} ${task.description} ${task.details}`.toLowerCase();
    const docTerms = ['document', 'write', 'explain', 'describe', 'readme', 'guide', 'manual'];
    return docTerms.some(term => text.includes(term));
  }

  /**
   * Check if term is implementation-related
   * @param {string} term - Term to check
   * @returns {boolean} True if implementation term
   */
  isImplementationTerm(term) {
    const implTerms = ['implement', 'build', 'create', 'develop', 'code', 'program'];
    return implTerms.includes(term);
  }

  /**
   * Check if term is analysis-related
   * @param {string} term - Term to check
   * @returns {boolean} True if analysis term
   */
  isAnalysisTerm(term) {
    const analysisTerms = ['analyze', 'study', 'research', 'investigate', 'explore'];
    return analysisTerms.includes(term);
  }

  /**
   * Check if term is testing-related
   * @param {string} term - Term to check
   * @returns {boolean} True if testing term
   */
  isTestingTerm(term) {
    const testTerms = ['test', 'validate', 'verify', 'check', 'qa'];
    return testTerms.includes(term);
  }

  /**
   * Check if term is documentation-related
   * @param {string} term - Term to check
   * @returns {boolean} True if documentation term
   */
  isDocumentationTerm(term) {
    const docTerms = ['document', 'write', 'explain', 'describe', 'guide'];
    return docTerms.includes(term);
  }

  /**
   * Check if task matches category
   * @param {Object} task - Processed task
   * @param {string} category - Category to match
   * @returns {boolean} True if matches
   */
  matchesCategory(task, category) {
    return task.category === category ||
           (category === 'implementation' && task.isImplementation) ||
           (category === 'analysis' && task.isAnalysis) ||
           (category === 'testing' && task.isTesting) ||
           (category === 'documentation' && task.isDocumentation);
  }

  /**
   * Get search statistics
   * @returns {Object} Search statistics
   */
  getStats() {
    return {
      totalTasks: this.tasks.length,
      processedTasks: this.processedTasks.length,
      searchContext: this.searchContext,
      options: this.options
    };
  }
}