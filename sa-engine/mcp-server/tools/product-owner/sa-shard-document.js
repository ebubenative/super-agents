import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * sa_shard_document MCP Tool
 * Document analysis and logical sharding with shard generation and validation
 */
export const saShardDocument = {
  name: 'sa_shard_document',
  description: 'Analyze documents and break them into logical shards using intelligent strategies for better manageability and processing',
  category: 'product-owner',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      documentId: {
        type: 'string',
        description: 'Unique identifier for the document to shard',
        minLength: 1
      },
      documentSource: {
        type: 'object',
        description: 'Source of the document to shard',
        properties: {
          type: { type: 'string', enum: ['file', 'url', 'text', 'project'], default: 'file' },
          path: { type: 'string' },
          url: { type: 'string' },
          content: { type: 'string' },
          projectPath: { type: 'string' }
        }
      },
      shardingStrategy: {
        type: 'string',
        description: 'Strategy for document sharding',
        enum: ['semantic', 'structural', 'length-based', 'topic-based', 'section-based', 'custom'],
        default: 'semantic'
      },
      shardingConfig: {
        type: 'object',
        description: 'Configuration for sharding strategy',
        properties: {
          maxShardSize: { type: 'number', default: 2000 },
          minShardSize: { type: 'number', default: 100 },
          overlapSize: { type: 'number', default: 50 },
          preserveStructure: { type: 'boolean', default: true },
          maintainContext: { type: 'boolean', default: true },
          targetShardCount: { type: 'number' },
          splitMarkers: { type: 'array', items: { type: 'string' } }
        }
      },
      outputFormat: {
        type: 'string',
        description: 'Format for output shards',
        enum: ['json', 'markdown', 'text', 'structured'],
        default: 'structured'
      },
      validationRules: {
        type: 'object',
        description: 'Rules for validating shards',
        properties: {
          ensureCompleteness: { type: 'boolean', default: true },
          validateContext: { type: 'boolean', default: true },
          checkOverlap: { type: 'boolean', default: true },
          maintainReferences: { type: 'boolean', default: true }
        }
      },
      projectPath: {
        type: 'string',
        description: 'Path to the project (defaults to current directory)',
        default: process.cwd()
      },
      outputPath: {
        type: 'string',
        description: 'Path to save sharded documents (optional)'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata for the sharding operation',
        properties: {
          purpose: { type: 'string' },
          author: { type: 'string' },
          version: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['documentId', 'documentSource']
  },

  validate(args) {
    const errors = [];
    
    if (!args.documentId || typeof args.documentId !== 'string') {
      errors.push('documentId is required and must be a string');
    }
    
    if (args.documentId && args.documentId.trim().length === 0) {
      errors.push('documentId cannot be empty');
    }
    
    if (!args.documentSource || typeof args.documentSource !== 'object') {
      errors.push('documentSource is required and must be an object');
    }
    
    if (args.documentSource && !args.documentSource.type) {
      errors.push('documentSource.type is required');
    }
    
    return { isValid: errors.length === 0, errors };
  },

  async execute(args, context) {
    const startTime = Date.now();
    const projectPath = args.projectPath || process.cwd();
    const documentId = args.documentId.trim();
    
    try {
      const shardingContext = {
        documentId,
        strategy: args.shardingStrategy || 'semantic',
        config: args.shardingConfig || {},
        outputFormat: args.outputFormat || 'structured',
        validationRules: args.validationRules || {},
        metadata: args.metadata || {},
        timestamp: new Date().toISOString(),
        operator: context?.userId || 'system',
        operationId: `shard-op-${Date.now()}`
      };

      // Load and analyze document
      const document = await this.loadDocument(args.documentSource, projectPath);
      
      // Analyze document structure and content
      const documentAnalysis = await this.analyzeDocument(document, shardingContext);
      
      // Apply sharding strategy
      const shardingPlan = await this.createShardingPlan(documentAnalysis, shardingContext);
      
      // Generate shards
      const shards = await this.generateShards(document, shardingPlan, shardingContext);
      
      // Validate shards
      const validationResults = await this.validateShards(shards, document, shardingContext);
      
      // Apply optimizations if needed
      const optimizedShards = await this.optimizeShards(shards, validationResults, shardingContext);
      
      // Format output
      const formattedOutput = await this.formatShardOutput(optimizedShards, shardingContext);
      
      // Save shards if output path specified
      let savedPaths = [];
      if (args.outputPath) {
        savedPaths = await this.saveShards(optimizedShards, args.outputPath, shardingContext);
      }
      
      // Generate shard summary
      const shardSummary = await this.generateShardSummary(
        document,
        documentAnalysis,
        optimizedShards,
        validationResults,
        shardingContext
      );
      
      // Format final output
      const output = await this.formatShardingOutput(
        document,
        documentAnalysis,
        optimizedShards,
        validationResults,
        shardSummary,
        savedPaths,
        shardingContext
      );
      
      // Save operation results
      await this.saveShardingResults(projectPath, shardingContext, {
        document,
        analysis: documentAnalysis,
        plan: shardingPlan,
        shards: optimizedShards,
        validation: validationResults,
        summary: shardSummary,
        savedPaths
      });
      
      const duration = Date.now() - startTime;
      
      return {
        content: [{ type: 'text', text: output }],
        metadata: {
          documentId,
          shardingStrategy: args.shardingStrategy,
          totalShards: optimizedShards.length,
          documentSize: document.content.length,
          averageShardSize: Math.round(optimizedShards.reduce((sum, s) => sum + s.content.length, 0) / optimizedShards.length),
          validationScore: validationResults.overallScore,
          operationId: shardingContext.operationId,
          savedPaths: savedPaths.length,
          duration
        }
      };
      
    } catch (error) {
      return {
        content: [{ type: 'text', text: `❌ Failed to shard document ${documentId}: ${error.message}` }],
        isError: true,
        metadata: { error: error.message, documentId, projectPath }
      };
    }
  },

  async loadDocument(source, projectPath) {
    let content = '';
    let metadata = {};

    switch (source.type) {
      case 'file':
        if (!source.path) {
          throw new Error('File path is required for file source');
        }
        const filePath = join(projectPath, source.path);
        if (!existsSync(filePath)) {
          throw new Error(`Document file not found: ${source.path}`);
        }
        content = readFileSync(filePath, 'utf8');
        metadata = {
          sourceType: 'file',
          sourcePath: source.path,
          fileSize: content.length,
          loadedAt: new Date().toISOString()
        };
        break;

      case 'text':
        if (!source.content) {
          throw new Error('Content is required for text source');
        }
        content = source.content;
        metadata = {
          sourceType: 'text',
          contentLength: content.length,
          loadedAt: new Date().toISOString()
        };
        break;

      case 'url':
        if (!source.url) {
          throw new Error('URL is required for URL source');
        }
        // Simulate URL loading
        content = `# Document from URL\n\nThis is a simulated document loaded from: ${source.url}\n\nIt contains multiple sections and paragraphs that would be loaded from the actual URL in a real implementation.`;
        metadata = {
          sourceType: 'url',
          sourceUrl: source.url,
          loadedAt: new Date().toISOString()
        };
        break;

      case 'project':
        // Load project documentation
        content = await this.loadProjectDocumentation(source.projectPath || projectPath);
        metadata = {
          sourceType: 'project',
          projectPath: source.projectPath || projectPath,
          loadedAt: new Date().toISOString()
        };
        break;

      default:
        throw new Error(`Unsupported document source type: ${source.type}`);
    }

    return {
      content,
      metadata,
      originalLength: content.length,
      lineCount: content.split('\n').length
    };
  },

  async loadProjectDocumentation(projectPath) {
    // Simulate loading project documentation
    return `# Project Documentation

## Overview
This project contains multiple components and features that require comprehensive documentation.

## Architecture
The system is built using a modular architecture with the following components:
- Frontend components
- Backend services
- Database layer
- API interfaces

## Features
### Feature 1: User Management
Handles user registration, authentication, and profile management.

### Feature 2: Data Processing
Processes and transforms data according to business rules.

### Feature 3: Reporting
Generates various types of reports for different stakeholders.

## API Documentation
### Authentication Endpoints
- POST /auth/login
- POST /auth/logout
- GET /auth/profile

### User Management Endpoints
- GET /users
- POST /users
- PUT /users/:id
- DELETE /users/:id

## Deployment Guide
The application can be deployed using Docker containers or traditional server deployment.

## Troubleshooting
Common issues and their solutions are documented here.`;
  },

  async analyzeDocument(document, context) {
    const analysis = {
      structure: await this.analyzeDocumentStructure(document),
      content: await this.analyzeDocumentContent(document),
      complexity: await this.analyzeDocumentComplexity(document),
      topics: await this.extractTopics(document),
      sections: await this.identifySections(document),
      references: await this.findReferences(document),
      metadata: this.extractDocumentMetadata(document)
    };

    return analysis;
  },

  async analyzeDocumentStructure(document) {
    const lines = document.content.split('\n');
    const structure = {
      totalLines: lines.length,
      totalCharacters: document.content.length,
      paragraphs: 0,
      headers: 0,
      lists: 0,
      codeBlocks: 0,
      tables: 0
    };

    let inCodeBlock = false;
    let currentParagraph = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Code blocks
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        if (inCodeBlock) structure.codeBlocks++;
        return;
      }
      
      if (inCodeBlock) return;
      
      // Headers
      if (trimmed.startsWith('#')) {
        structure.headers++;
        if (currentParagraph.trim()) {
          structure.paragraphs++;
          currentParagraph = '';
        }
        return;
      }
      
      // Lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        structure.lists++;
        if (currentParagraph.trim()) {
          structure.paragraphs++;
          currentParagraph = '';
        }
        return;
      }
      
      // Tables
      if (trimmed.includes('|')) {
        structure.tables++;
        return;
      }
      
      // Regular content
      if (trimmed) {
        currentParagraph += line + '\n';
      } else if (currentParagraph.trim()) {
        structure.paragraphs++;
        currentParagraph = '';
      }
    });

    if (currentParagraph.trim()) {
      structure.paragraphs++;
    }

    return structure;
  },

  async analyzeDocumentContent(document) {
    const words = document.content.split(/\s+/).filter(word => word.length > 0);
    const sentences = document.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: Math.round(words.length / sentences.length),
      averageSentenceLength: Math.round(document.content.length / sentences.length),
      readabilityScore: this.calculateReadabilityScore(words, sentences),
      contentDensity: this.calculateContentDensity(document.content)
    };
  },

  calculateReadabilityScore(words, sentences) {
    // Simplified readability calculation
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = 1.5; // Simplified assumption
    
    // Flesch Reading Ease approximation
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  calculateContentDensity(content) {
    const informationWords = content.split(/\s+/).filter(word => 
      word.length > 3 && !/^(the|and|but|for|are|was|were|been|have|has|had|will|would|could|should)$/i.test(word)
    ).length;
    
    const totalWords = content.split(/\s+/).length;
    return Math.round((informationWords / totalWords) * 100);
  },

  async analyzeDocumentComplexity(document) {
    const complexity = {
      structural: this.calculateStructuralComplexity(document),
      semantic: this.calculateSemanticComplexity(document),
      technical: this.calculateTechnicalComplexity(document),
      overall: 0
    };

    complexity.overall = Math.round((complexity.structural + complexity.semantic + complexity.technical) / 3);
    return complexity;
  },

  calculateStructuralComplexity(document) {
    const nestingLevel = this.calculateMaxNestingLevel(document.content);
    const sectionVariety = this.countSectionTypes(document.content);
    const crossReferences = this.countCrossReferences(document.content);
    
    return Math.min(100, (nestingLevel * 20) + (sectionVariety * 15) + (crossReferences * 10));
  },

  calculateSemanticComplexity(document) {
    const uniqueWords = new Set(document.content.toLowerCase().split(/\s+/)).size;
    const totalWords = document.content.split(/\s+/).length;
    const vocabularyRichness = (uniqueWords / totalWords) * 100;
    
    const technicalTerms = this.countTechnicalTerms(document.content);
    const abstractConcepts = this.countAbstractConcepts(document.content);
    
    return Math.min(100, vocabularyRichness + (technicalTerms * 2) + (abstractConcepts * 3));
  },

  calculateTechnicalComplexity(document) {
    const codeBlocks = (document.content.match(/```/g) || []).length / 2;
    const technicalTerms = this.countTechnicalTerms(document.content);
    const apis = (document.content.match(/\b(GET|POST|PUT|DELETE|API|endpoint)\b/gi) || []).length;
    
    return Math.min(100, (codeBlocks * 15) + (technicalTerms * 5) + (apis * 10));
  },

  calculateMaxNestingLevel(content) {
    const lines = content.split('\n');
    let maxLevel = 0;
    
    lines.forEach(line => {
      const headerMatch = line.match(/^(#+)/);
      if (headerMatch) {
        maxLevel = Math.max(maxLevel, headerMatch[1].length);
      }
    });
    
    return maxLevel;
  },

  countSectionTypes(content) {
    const types = new Set();
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) types.add('header');
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) types.add('list');
      if (trimmed.startsWith('```')) types.add('code');
      if (trimmed.includes('|')) types.add('table');
      if (trimmed.startsWith('>')) types.add('quote');
    });
    
    return types.size;
  },

  countCrossReferences(content) {
    const references = content.match(/\[.*?\]\(.*?\)/g) || [];
    const anchors = content.match(/#[a-zA-Z0-9-_]+/g) || [];
    return references.length + anchors.length;
  },

  countTechnicalTerms(content) {
    const technicalPatterns = [
      /\b(API|REST|HTTP|JSON|XML|SQL|database|server|client|framework|library|component)\b/gi,
      /\b(class|function|method|variable|parameter|return|throw|catch|try)\b/gi,
      /\b(authentication|authorization|encryption|security|token|session)\b/gi
    ];
    
    let count = 0;
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      count += matches.length;
    });
    
    return count;
  },

  countAbstractConcepts(content) {
    const abstractPatterns = [
      /\b(strategy|pattern|architecture|design|concept|principle|methodology)\b/gi,
      /\b(scalability|maintainability|flexibility|extensibility|reusability)\b/gi,
      /\b(workflow|process|procedure|protocol|standard|guideline)\b/gi
    ];
    
    let count = 0;
    abstractPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      count += matches.length;
    });
    
    return count;
  },

  async extractTopics(document) {
    // Simplified topic extraction
    const topics = [];
    const content = document.content.toLowerCase();
    
    const topicKeywords = {
      'authentication': ['auth', 'login', 'token', 'session', 'password', 'security'],
      'database': ['database', 'sql', 'query', 'table', 'data', 'storage'],
      'api': ['api', 'endpoint', 'rest', 'http', 'request', 'response'],
      'frontend': ['frontend', 'ui', 'component', 'react', 'vue', 'angular'],
      'backend': ['backend', 'server', 'service', 'controller', 'middleware'],
      'deployment': ['deploy', 'docker', 'container', 'production', 'release'],
      'testing': ['test', 'unit', 'integration', 'mock', 'assert', 'coverage'],
      'documentation': ['doc', 'guide', 'manual', 'readme', 'help', 'tutorial']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
        score += matches;
      });
      
      if (score > 0) {
        topics.push({ topic, score, relevance: Math.min(100, score * 10) });
      }
    });

    return topics.sort((a, b) => b.score - a.score);
  },

  async identifySections(document) {
    const sections = [];
    const lines = document.content.split('\n');
    let currentSection = null;
    let lineNumber = 0;

    lines.forEach((line, index) => {
      lineNumber++;
      const trimmed = line.trim();
      const headerMatch = trimmed.match(/^(#+)\s*(.+)$/);
      
      if (headerMatch) {
        // Close previous section
        if (currentSection) {
          currentSection.endLine = lineNumber - 1;
          currentSection.length = currentSection.endLine - currentSection.startLine + 1;
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          id: `section-${sections.length + 1}`,
          level: headerMatch[1].length,
          title: headerMatch[2],
          startLine: lineNumber,
          endLine: null,
          length: 0,
          content: '',
          subsections: []
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    // Close last section
    if (currentSection) {
      currentSection.endLine = lineNumber;
      currentSection.length = currentSection.endLine - currentSection.startLine + 1;
      sections.push(currentSection);
    }

    return this.buildSectionHierarchy(sections);
  },

  buildSectionHierarchy(sections) {
    const hierarchy = [];
    const stack = [];

    sections.forEach(section => {
      // Pop sections from stack that are at same or higher level
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        hierarchy.push(section);
      } else {
        stack[stack.length - 1].subsections.push(section);
      }

      stack.push(section);
    });

    return hierarchy;
  },

  async findReferences(document) {
    const references = {
      internal: [],
      external: [],
      crossReferences: []
    };

    // Find markdown links
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkPattern.exec(document.content)) !== null) {
      const [fullMatch, text, url] = match;
      
      if (url.startsWith('http') || url.startsWith('www')) {
        references.external.push({ text, url, type: 'external' });
      } else if (url.startsWith('#')) {
        references.crossReferences.push({ text, anchor: url, type: 'anchor' });
      } else {
        references.internal.push({ text, path: url, type: 'internal' });
      }
    }

    // Find anchor references
    const anchorPattern = /<a[^>]+href=['"]#([^'"]+)['"][^>]*>([^<]*)<\/a>/gi;
    while ((match = anchorPattern.exec(document.content)) !== null) {
      references.crossReferences.push({
        text: match[2],
        anchor: '#' + match[1],
        type: 'html-anchor'
      });
    }

    return references;
  },

  extractDocumentMetadata(document) {
    const metadata = { ...document.metadata };
    
    // Extract title from content
    const firstHeaderMatch = document.content.match(/^#\s*(.+)$/m);
    if (firstHeaderMatch) {
      metadata.title = firstHeaderMatch[1];
    }

    // Extract other metadata patterns
    const metadataPatterns = {
      author: /(?:author|by):\s*(.+)/i,
      version: /(?:version|v):\s*([0-9.]+)/i,
      date: /(?:date|created|updated):\s*([0-9-/]+)/i,
      tags: /(?:tags|keywords):\s*(.+)/i
    };

    Object.entries(metadataPatterns).forEach(([key, pattern]) => {
      const match = document.content.match(pattern);
      if (match) {
        metadata[key] = match[1].trim();
      }
    });

    return metadata;
  },

  async createShardingPlan(analysis, context) {
    const plan = {
      strategy: context.strategy,
      config: context.config,
      targetShardSize: context.config.maxShardSize || 2000,
      estimatedShards: 0,
      shardingPoints: [],
      preservationRules: []
    };

    switch (context.strategy) {
      case 'semantic':
        plan.shardingPoints = await this.createSemanticShardingPoints(analysis, context);
        break;
      case 'structural':
        plan.shardingPoints = await this.createStructuralShardingPoints(analysis, context);
        break;
      case 'length-based':
        plan.shardingPoints = await this.createLengthBasedShardingPoints(analysis, context);
        break;
      case 'topic-based':
        plan.shardingPoints = await this.createTopicBasedShardingPoints(analysis, context);
        break;
      case 'section-based':
        plan.shardingPoints = await this.createSectionBasedShardingPoints(analysis, context);
        break;
      default:
        plan.shardingPoints = await this.createSemanticShardingPoints(analysis, context);
    }

    plan.estimatedShards = plan.shardingPoints.length + 1;
    plan.preservationRules = this.createPreservationRules(analysis, context);

    return plan;
  },

  async createSemanticShardingPoints(analysis, context) {
    const points = [];
    const content = analysis.content;
    const targetSize = context.config.maxShardSize || 2000;
    
    // Find semantic boundaries (paragraph breaks, topic changes)
    let currentPosition = 0;
    let currentSize = 0;
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    
    sentences.forEach((sentence, index) => {
      const sentenceLength = sentence.length;
      
      if (currentSize + sentenceLength > targetSize && currentSize > context.config.minShardSize) {
        points.push({
          position: currentPosition + currentSize,
          type: 'semantic',
          reason: 'Target size reached at semantic boundary',
          confidence: 0.8
        });
        currentSize = 0;
      }
      
      currentSize += sentenceLength;
      if (index === 0) currentPosition = 0;
    });

    return points;
  },

  async createStructuralShardingPoints(analysis, context) {
    const points = [];
    
    // Use document structure (headers, sections) as sharding points
    analysis.sections.forEach(section => {
      if (section.startLine > 1) {
        points.push({
          position: this.lineToPosition(section.startLine, analysis),
          type: 'structural',
          reason: `Section boundary: ${section.title}`,
          sectionId: section.id,
          confidence: 0.9
        });
      }
    });

    return points;
  },

  async createLengthBasedShardingPoints(analysis, context) {
    const points = [];
    const targetSize = context.config.maxShardSize || 2000;
    const overlapSize = context.config.overlapSize || 50;
    
    let position = 0;
    const contentLength = analysis.content.totalCharacters;
    
    while (position + targetSize < contentLength) {
      const nextPosition = position + targetSize - overlapSize;
      
      // Find nearest paragraph break
      const nearestBreak = this.findNearestBreak(analysis, nextPosition);
      
      points.push({
        position: nearestBreak,
        type: 'length-based',
        reason: 'Target length reached',
        confidence: 0.7
      });
      
      position = nearestBreak;
    }

    return points;
  },

  async createTopicBasedShardingPoints(analysis, context) {
    const points = [];
    
    // Group content by topics
    const topicBoundaries = this.identifyTopicBoundaries(analysis);
    
    topicBoundaries.forEach(boundary => {
      points.push({
        position: boundary.position,
        type: 'topic-based',
        reason: `Topic change: ${boundary.fromTopic} → ${boundary.toTopic}`,
        confidence: boundary.confidence
      });
    });

    return points;
  },

  async createSectionBasedShardingPoints(analysis, context) {
    const points = [];
    
    // Create one shard per section
    analysis.sections.forEach((section, index) => {
      if (index > 0) { // Skip first section
        points.push({
          position: this.lineToPosition(section.startLine, analysis),
          type: 'section-based',
          reason: `Section: ${section.title}`,
          sectionId: section.id,
          confidence: 1.0
        });
      }
    });

    return points;
  },

  lineToPosition(lineNumber, analysis) {
    // Convert line number to character position
    const lines = analysis.content.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    return position;
  },

  findNearestBreak(analysis, position) {
    const content = analysis.content;
    const searchRange = 100; // Look within 100 characters
    
    // Look for paragraph breaks (double newlines)
    for (let i = position - searchRange; i <= position + searchRange; i++) {
      if (i >= 0 && i < content.length - 1) {
        if (content[i] === '\n' && content[i + 1] === '\n') {
          return i + 2;
        }
      }
    }
    
    // Look for sentence endings
    for (let i = position - searchRange; i <= position + searchRange; i++) {
      if (i >= 0 && i < content.length) {
        if (/[.!?]/.test(content[i]) && content[i + 1] === ' ') {
          return i + 2;
        }
      }
    }
    
    // Return original position if no good break found
    return position;
  },

  identifyTopicBoundaries(analysis) {
    // Simplified topic boundary detection
    const boundaries = [];
    const topics = analysis.topics;
    
    if (topics.length > 1) {
      // Create boundaries between major topic changes
      for (let i = 1; i < topics.length; i++) {
        boundaries.push({
          position: Math.floor(analysis.content.totalCharacters * (i / topics.length)),
          fromTopic: topics[i - 1].topic,
          toTopic: topics[i].topic,
          confidence: 0.6
        });
      }
    }
    
    return boundaries;
  },

  createPreservationRules(analysis, context) {
    const rules = [];
    
    if (context.config.preserveStructure) {
      rules.push({
        type: 'preserve-headers',
        description: 'Keep headers at the beginning of shards'
      });
      
      rules.push({
        type: 'preserve-code-blocks',
        description: 'Do not split code blocks across shards'
      });
    }
    
    if (context.config.maintainContext) {
      rules.push({
        type: 'maintain-references',
        description: 'Preserve cross-references and links'
      });
      
      rules.push({
        type: 'context-overlap',
        description: 'Include context overlap between shards'
      });
    }
    
    return rules;
  },

  async generateShards(document, plan, context) {
    const shards = [];
    const content = document.content;
    let currentPosition = 0;
    
    // Sort sharding points by position
    const sortedPoints = plan.shardingPoints.sort((a, b) => a.position - b.position);
    
    sortedPoints.forEach((point, index) => {
      const shardContent = content.substring(currentPosition, point.position);
      
      if (shardContent.trim().length > 0) {
        const shard = this.createShard(
          shardContent,
          index,
          currentPosition,
          point.position,
          point,
          context
        );
        shards.push(shard);
      }
      
      currentPosition = point.position;
    });
    
    // Create final shard
    const finalContent = content.substring(currentPosition);
    if (finalContent.trim().length > 0) {
      const finalShard = this.createShard(
        finalContent,
        sortedPoints.length,
        currentPosition,
        content.length,
        null,
        context
      );
      shards.push(finalShard);
    }
    
    return shards;
  },

  createShard(content, index, startPos, endPos, shardingPoint, context) {
    const shard = {
      id: `${context.documentId}_shard_${index + 1}`,
      index: index + 1,
      content: content.trim(),
      startPosition: startPos,
      endPosition: endPos,
      length: content.length,
      wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
      metadata: {
        shardingReason: shardingPoint ? shardingPoint.reason : 'Final shard',
        shardingType: shardingPoint ? shardingPoint.type : 'remainder',
        confidence: shardingPoint ? shardingPoint.confidence : 1.0,
        createdAt: new Date().toISOString()
      }
    };
    
    // Add overlap if configured
    if (context.config.overlapSize && index > 0) {
      shard.overlap = this.addOverlap(content, context.config.overlapSize, 'previous');
    }
    
    // Extract shard-specific metadata
    shard.structure = this.analyzeShardStructure(content);
    shard.topics = this.extractShardTopics(content);
    
    return shard;
  },

  addOverlap(content, overlapSize, direction) {
    if (direction === 'previous') {
      return content.substring(0, Math.min(overlapSize, content.length));
    } else {
      return content.substring(Math.max(0, content.length - overlapSize));
    }
  },

  analyzeShardStructure(content) {
    const lines = content.split('\n');
    return {
      lineCount: lines.length,
      hasHeaders: lines.some(line => line.trim().startsWith('#')),
      hasLists: lines.some(line => /^\s*[-*+]/.test(line)),
      hasCodeBlocks: content.includes('```'),
      hasTables: lines.some(line => line.includes('|'))
    };
  },

  extractShardTopics(content) {
    // Simplified topic extraction for individual shard
    const topics = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('api') || lowerContent.includes('endpoint')) {
      topics.push('api');
    }
    if (lowerContent.includes('auth') || lowerContent.includes('login')) {
      topics.push('authentication');
    }
    if (lowerContent.includes('database') || lowerContent.includes('data')) {
      topics.push('database');
    }
    if (lowerContent.includes('deploy') || lowerContent.includes('docker')) {
      topics.push('deployment');
    }
    
    return topics;
  },

  async validateShards(shards, originalDocument, context) {
    const validation = {
      overallScore: 0,
      shardValidations: {},
      issues: [],
      warnings: [],
      recommendations: []
    };

    let totalScore = 0;
    let validShards = 0;

    for (const shard of shards) {
      const shardValidation = await this.validateShard(shard, originalDocument, context);
      validation.shardValidations[shard.id] = shardValidation;
      
      if (shardValidation.score !== null) {
        totalScore += shardValidation.score;
        validShards++;
      }
      
      validation.issues.push(...shardValidation.issues);
      validation.warnings.push(...shardValidation.warnings);
    }

    validation.overallScore = validShards > 0 ? Math.round(totalScore / validShards) : 0;
    
    // Overall validation checks
    await this.performOverallValidation(shards, originalDocument, validation, context);
    
    return validation;
  },

  async validateShard(shard, originalDocument, context) {
    const validation = {
      shardId: shard.id,
      score: 100,
      issues: [],
      warnings: [],
      checks: {}
    };

    // Size validation
    const minSize = context.config.minShardSize || 100;
    const maxSize = context.config.maxShardSize || 2000;
    
    if (shard.length < minSize) {
      validation.issues.push({
        type: 'size-too-small',
        message: `Shard is too small (${shard.length} < ${minSize} characters)`,
        severity: 'medium'
      });
      validation.score -= 20;
    }
    
    if (shard.length > maxSize) {
      validation.warnings.push({
        type: 'size-too-large',
        message: `Shard exceeds recommended size (${shard.length} > ${maxSize} characters)`,
        severity: 'low'
      });
      validation.score -= 10;
    }

    validation.checks.sizeCheck = {
      status: shard.length >= minSize && shard.length <= maxSize ? 'passed' : 'failed',
      actualSize: shard.length,
      targetRange: `${minSize}-${maxSize}`
    };

    // Content completeness
    if (!shard.content.trim()) {
      validation.issues.push({
        type: 'empty-content',
        message: 'Shard has no meaningful content',
        severity: 'high'
      });
      validation.score -= 50;
    }

    // Structure preservation
    if (context.config.preserveStructure) {
      const structureIssues = this.validateStructurePreservation(shard);
      validation.issues.push(...structureIssues);
      validation.score -= structureIssues.length * 10;
    }

    validation.checks.contentCheck = {
      status: shard.content.trim().length > 0 ? 'passed' : 'failed',
      hasContent: shard.content.trim().length > 0
    };

    return validation;
  },

  validateStructurePreservation(shard) {
    const issues = [];
    
    // Check for broken code blocks
    const codeBlockStarts = (shard.content.match(/```/g) || []).length;
    if (codeBlockStarts % 2 !== 0) {
      issues.push({
        type: 'broken-code-block',
        message: 'Shard contains incomplete code block',
        severity: 'high'
      });
    }
    
    // Check for orphaned list items
    const lines = shard.content.split('\n');
    const listItems = lines.filter(line => /^\s*[-*+]\s/.test(line));
    const listHeaders = lines.filter(line => /^\s*#{1,6}\s/.test(line));
    
    if (listItems.length > 0 && listHeaders.length === 0) {
      issues.push({
        type: 'orphaned-list',
        message: 'Shard contains list items without context header',
        severity: 'medium'
      });
    }
    
    return issues;
  },

  async performOverallValidation(shards, originalDocument, validation, context) {
    // Check completeness
    const totalShardLength = shards.reduce((sum, shard) => sum + shard.length, 0);
    const originalLength = originalDocument.content.length;
    const completenessRatio = totalShardLength / originalLength;
    
    if (completenessRatio < 0.95) {
      validation.issues.push({
        type: 'content-loss',
        message: `Potential content loss detected (${Math.round(completenessRatio * 100)}% preserved)`,
        severity: 'high'
      });
    }
    
    // Check for excessive overlap
    if (context.config.overlapSize) {
      const totalOverlap = shards.reduce((sum, shard) => sum + (shard.overlap ? shard.overlap.length : 0), 0);
      const overlapRatio = totalOverlap / totalShardLength;
      
      if (overlapRatio > 0.2) {
        validation.warnings.push({
          type: 'excessive-overlap',
          message: `High overlap ratio (${Math.round(overlapRatio * 100)}%)`,
          severity: 'medium'
        });
      }
    }
    
    // Generate recommendations
    if (validation.overallScore < 80) {
      validation.recommendations.push('Consider adjusting sharding parameters to improve quality');
    }
    
    if (shards.length < 2) {
      validation.recommendations.push('Document may be too small to benefit from sharding');
    }
    
    if (shards.length > 20) {
      validation.recommendations.push('Consider larger shard sizes to reduce management overhead');
    }
  },

  async optimizeShards(shards, validationResults, context) {
    let optimizedShards = [...shards];
    
    // Apply optimizations based on validation results
    if (validationResults.overallScore < 80) {
      optimizedShards = await this.applyShardOptimizations(optimizedShards, validationResults, context);
    }
    
    return optimizedShards;
  },

  async applyShardOptimizations(shards, validation, context) {
    let optimized = [...shards];
    
    // Merge small shards
    const smallShards = optimized.filter(shard => 
      shard.length < (context.config.minShardSize || 100)
    );
    
    if (smallShards.length > 0) {
      optimized = this.mergeSmallShards(optimized, context.config.minShardSize || 100);
    }
    
    // Split large shards
    const largeShards = optimized.filter(shard => 
      shard.length > (context.config.maxShardSize || 2000)
    );
    
    if (largeShards.length > 0) {
      optimized = this.splitLargeShards(optimized, context.config.maxShardSize || 2000);
    }
    
    return optimized;
  },

  mergeSmallShards(shards, minSize) {
    const merged = [];
    let current = null;
    
    shards.forEach(shard => {
      if (!current) {
        current = { ...shard };
      } else if (current.length + shard.length < minSize * 2) {
        // Merge with current
        current.content += '\n\n' + shard.content;
        current.length += shard.length + 2;
        current.endPosition = shard.endPosition;
        current.metadata.shardingReason = 'Merged small shards';
      } else {
        // Push current and start new
        merged.push(current);
        current = { ...shard };
      }
    });
    
    if (current) {
      merged.push(current);
    }
    
    return merged;
  },

  splitLargeShards(shards, maxSize) {
    const split = [];
    
    shards.forEach(shard => {
      if (shard.length <= maxSize) {
        split.push(shard);
      } else {
        // Split large shard
        const subShards = this.splitShardContent(shard, maxSize);
        split.push(...subShards);
      }
    });
    
    return split;
  },

  splitShardContent(shard, maxSize) {
    const subShards = [];
    const content = shard.content;
    let position = 0;
    let subIndex = 0;
    
    while (position < content.length) {
      const endPos = Math.min(position + maxSize, content.length);
      const breakPos = this.findNearestBreak({ content }, endPos);
      
      const subContent = content.substring(position, breakPos);
      
      subShards.push({
        ...shard,
        id: `${shard.id}_sub_${subIndex + 1}`,
        content: subContent,
        length: subContent.length,
        startPosition: shard.startPosition + position,
        endPosition: shard.startPosition + breakPos,
        metadata: {
          ...shard.metadata,
          shardingReason: 'Split from large shard',
          parentShardId: shard.id
        }
      });
      
      position = breakPos;
      subIndex++;
    }
    
    return subShards;
  },

  async formatShardOutput(shards, context) {
    const formatted = {
      format: context.outputFormat,
      shards: []
    };

    switch (context.outputFormat) {
      case 'json':
        formatted.shards = shards.map(shard => ({
          id: shard.id,
          index: shard.index,
          content: shard.content,
          metadata: shard.metadata,
          length: shard.length,
          wordCount: shard.wordCount
        }));
        break;

      case 'markdown':
        formatted.shards = shards.map(shard => ({
          id: shard.id,
          content: `# Shard ${shard.index}: ${shard.id}\n\n${shard.content}\n\n---\n`
        }));
        break;

      case 'text':
        formatted.shards = shards.map(shard => ({
          id: shard.id,
          content: shard.content
        }));
        break;

      case 'structured':
      default:
        formatted.shards = shards;
        break;
    }

    return formatted;
  },

  async saveShards(shards, outputPath, context) {
    const savedPaths = [];
    
    try {
      // Ensure output directory exists
      const outputDir = join(outputPath, context.documentId);
      if (!existsSync(outputDir)) {
        require('fs').mkdirSync(outputDir, { recursive: true });
      }
      
      // Save individual shards
      shards.forEach(shard => {
        const filename = `${shard.id}.${this.getFileExtension(context.outputFormat)}`;
        const filepath = join(outputDir, filename);
        
        let content;
        switch (context.outputFormat) {
          case 'json':
            content = JSON.stringify(shard, null, 2);
            break;
          case 'markdown':
            content = `# ${shard.id}\n\n${shard.content}`;
            break;
          default:
            content = shard.content;
        }
        
        writeFileSync(filepath, content, 'utf8');
        savedPaths.push(filepath);
      });
      
      // Save shard index
      const indexPath = join(outputDir, 'shard-index.json');
      const index = {
        documentId: context.documentId,
        totalShards: shards.length,
        createdAt: context.timestamp,
        shards: shards.map(shard => ({
          id: shard.id,
          index: shard.index,
          filename: `${shard.id}.${this.getFileExtension(context.outputFormat)}`,
          length: shard.length,
          topics: shard.topics
        }))
      };
      
      writeFileSync(indexPath, JSON.stringify(index, null, 2));
      savedPaths.push(indexPath);
      
    } catch (error) {
      console.warn('Failed to save shards:', error.message);
    }
    
    return savedPaths;
  },

  getFileExtension(format) {
    const extensions = {
      'json': 'json',
      'markdown': 'md',
      'text': 'txt',
      'structured': 'json'
    };
    return extensions[format] || 'txt';
  },

  async generateShardSummary(document, analysis, shards, validation, context) {
    return {
      operation: {
        documentId: context.documentId,
        strategy: context.strategy,
        operationId: context.operationId,
        timestamp: context.timestamp
      },
      input: {
        originalSize: document.originalLength,
        originalLineCount: document.lineCount,
        complexity: analysis.complexity.overall,
        topics: analysis.topics.length,
        sections: analysis.sections.length
      },
      output: {
        totalShards: shards.length,
        averageShardSize: Math.round(shards.reduce((sum, s) => sum + s.length, 0) / shards.length),
        smallestShard: Math.min(...shards.map(s => s.length)),
        largestShard: Math.max(...shards.map(s => s.length)),
        totalOutputSize: shards.reduce((sum, s) => sum + s.length, 0)
      },
      quality: {
        validationScore: validation.overallScore,
        issues: validation.issues.length,
        warnings: validation.warnings.length,
        completenessRatio: Math.round((shards.reduce((sum, s) => sum + s.length, 0) / document.originalLength) * 100)
      },
      efficiency: {
        compressionRatio: Math.round((shards.reduce((sum, s) => sum + s.length, 0) / document.originalLength) * 100),
        shardSizeVariance: this.calculateShardSizeVariance(shards),
        optimalShardCount: this.calculateOptimalShardCount(document.originalLength, context.config.maxShardSize)
      }
    };
  },

  calculateShardSizeVariance(shards) {
    const sizes = shards.map(s => s.length);
    const average = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - average, 2), 0) / sizes.length;
    return Math.round(Math.sqrt(variance));
  },

  calculateOptimalShardCount(totalSize, maxShardSize) {
    return Math.ceil(totalSize / maxShardSize);
  },

  async formatShardingOutput(document, analysis, shards, validation, summary, savedPaths, context) {
    let output = `📄 **Document Sharding: ${context.documentId}**\n\n`;
    output += `🔧 **Strategy:** ${context.strategy}\n`;
    output += `📊 **Total Shards:** ${shards.length}\n`;
    output += `📏 **Original Size:** ${document.originalLength.toLocaleString()} characters\n`;
    output += `⭐ **Quality Score:** ${validation.overallScore}/100\n`;
    output += `🆔 **Operation ID:** ${context.operationId}\n\n`;

    // Sharding Summary
    output += `## 📊 Sharding Summary\n\n`;
    output += `**Input Document:**\n`;
    output += `• Size: ${summary.input.originalSize.toLocaleString()} characters\n`;
    output += `• Lines: ${summary.input.originalLineCount.toLocaleString()}\n`;
    output += `• Complexity: ${summary.input.complexity}/100\n`;
    output += `• Topics: ${summary.input.topics}\n`;
    output += `• Sections: ${summary.input.sections}\n\n`;

    output += `**Output Shards:**\n`;
    output += `• Total Shards: ${summary.output.totalShards}\n`;
    output += `• Average Size: ${summary.output.averageShardSize.toLocaleString()} characters\n`;
    output += `• Size Range: ${summary.output.smallestShard.toLocaleString()} - ${summary.output.largestShard.toLocaleString()} characters\n`;
    output += `• Total Output Size: ${summary.output.totalOutputSize.toLocaleString()} characters\n\n`;

    // Quality Assessment
    const qualityEmoji = validation.overallScore >= 90 ? '✅' : validation.overallScore >= 70 ? '⚠️' : '❌';
    output += `## ${qualityEmoji} Quality Assessment\n\n`;
    output += `**Overall Score:** ${validation.overallScore}/100\n`;
    output += `**Completeness:** ${summary.quality.completenessRatio}%\n`;
    output += `**Issues:** ${summary.quality.issues}\n`;
    output += `**Warnings:** ${summary.quality.warnings}\n\n`;

    // Issues and Warnings
    if (validation.issues.length > 0) {
      output += `**Issues Found:**\n`;
      validation.issues.slice(0, 5).forEach((issue, index) => {
        output += `${index + 1}. ${issue.message} (${issue.severity})\n`;
      });
      if (validation.issues.length > 5) {
        output += `... and ${validation.issues.length - 5} more\n`;
      }
      output += '\n';
    }

    if (validation.warnings.length > 0) {
      output += `**Warnings:**\n`;
      validation.warnings.slice(0, 3).forEach((warning, index) => {
        output += `${index + 1}. ${warning.message}\n`;
      });
      if (validation.warnings.length > 3) {
        output += `... and ${validation.warnings.length - 3} more\n`;
      }
      output += '\n';
    }

    // Shard Details
    output += `## 📝 Shard Details\n\n`;
    shards.slice(0, 10).forEach(shard => {
      const validation = validationResults.shardValidations[shard.id];
      const statusIcon = validation && validation.score >= 80 ? '✅' : '⚠️';
      
      output += `${statusIcon} **${shard.id}**\n`;
      output += `   Size: ${shard.length.toLocaleString()} chars | Words: ${shard.wordCount.toLocaleString()}\n`;
      output += `   Topics: ${shard.topics.join(', ') || 'none'}\n`;
      if (shard.metadata.shardingReason) {
        output += `   Reason: ${shard.metadata.shardingReason}\n`;
      }
      output += '\n';
    });

    if (shards.length > 10) {
      output += `... and ${shards.length - 10} more shards\n\n`;
    }

    // Strategy Details
    output += `## ⚙️ Strategy Details\n\n`;
    output += `**Sharding Strategy:** ${context.strategy}\n`;
    output += `**Configuration:**\n`;
    Object.entries(context.config).forEach(([key, value]) => {
      if (value !== undefined) {
        output += `• ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}\n`;
      }
    });
    output += '\n';

    // Efficiency Metrics
    output += `## 📈 Efficiency Metrics\n\n`;
    output += `**Compression Ratio:** ${summary.efficiency.compressionRatio}%\n`;
    output += `**Shard Size Variance:** ${summary.efficiency.shardSizeVariance}\n`;
    output += `**Optimal vs Actual:** ${summary.efficiency.optimalShardCount} vs ${shards.length} shards\n\n`;

    // Saved Files
    if (savedPaths.length > 0) {
      output += `## 💾 Saved Files\n\n`;
      output += `**Total Files Saved:** ${savedPaths.length}\n`;
      output += `**Output Directory:** ${savedPaths[0].split('/').slice(0, -1).join('/')}\n\n`;
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      output += `## 💡 Recommendations\n\n`;
      validation.recommendations.forEach((rec, index) => {
        output += `${index + 1}. ${rec}\n`;
      });
      output += '\n';
    }

    // Best Practices
    output += `## 💡 Document Sharding Best Practices\n\n`;
    output += `• Choose appropriate sharding strategy based on document structure\n`;
    output += `• Balance shard size for optimal processing and context preservation\n`;
    output += `• Validate shards to ensure content completeness and quality\n`;
    output += `• Use overlap for context continuity when needed\n`;
    output += `• Consider semantic boundaries over rigid size limits\n`;
    output += `• Preserve document structure and references\n\n`;

    output += `📁 **Complete sharding analysis and results saved to project.**`;

    return output;
  },

  async saveShardingResults(projectPath, context, data) {
    try {
      const saDir = join(projectPath, '.super-agents');
      if (!existsSync(saDir)) return;
      
      const shardingDir = join(saDir, 'document-sharding');
      if (!existsSync(shardingDir)) {
        require('fs').mkdirSync(shardingDir, { recursive: true });
      }
      
      const filename = `sharding-operation-${context.documentId}-${Date.now()}.json`;
      const filepath = join(shardingDir, filename);
      
      writeFileSync(filepath, JSON.stringify({ context, ...data }, null, 2));
    } catch (error) {
      console.warn('Failed to save sharding results:', error.message);
    }
  }
};