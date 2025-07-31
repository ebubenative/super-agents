import BaseAIProvider from './BaseAIProvider.js';

/**
 * PerplexityProvider - Perplexity AI provider for Super Agents
 * Integrates with Perplexity's API for research-focused AI interactions
 */
export default class PerplexityProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({
      name: 'Perplexity',
      version: '1.0.0',
      defaultModel: 'llama-3.1-sonar-large-128k-online',
      supportedRoles: ['research', 'main', 'fallback'],
      timeout: 60000,
      maxRetries: 3,
      retryDelay: 2000,
      ...options
    });

    this.apiKey = options.apiKey || process.env.PERPLEXITY_API_KEY;
    this.baseURL = options.baseURL || 'https://api.perplexity.ai';
    
    // Model configurations
    this.availableModels = [
      {
        name: 'llama-3.1-sonar-large-128k-online',
        maxTokens: 127072,
        supportsStreaming: true,
        isOnline: true,
        contextWindow: 127072,
        costPer1KTokens: { input: 0.001, output: 0.001 }
      },
      {
        name: 'llama-3.1-sonar-small-128k-online',
        maxTokens: 127072,
        supportsStreaming: true,
        isOnline: true,
        contextWindow: 127072,
        costPer1KTokens: { input: 0.0002, output: 0.0002 }
      },
      {
        name: 'llama-3.1-sonar-large-128k-chat',
        maxTokens: 127072,
        supportsStreaming: true,
        isOnline: false,
        contextWindow: 127072,
        costPer1KTokens: { input: 0.001, output: 0.001 }
      },
      {
        name: 'llama-3.1-sonar-small-128k-chat',
        maxTokens: 127072,
        supportsStreaming: true,
        isOnline: false,
        contextWindow: 127072,
        costPer1KTokens: { input: 0.0002, output: 0.0002 }
      },
      {
        name: 'llama-3.1-8b-instruct',
        maxTokens: 131072,
        supportsStreaming: true,
        isOnline: false,
        contextWindow: 131072,
        costPer1KTokens: { input: 0.0002, output: 0.0002 }
      },
      {
        name: 'llama-3.1-70b-instruct',
        maxTokens: 131072,
        supportsStreaming: true,
        isOnline: false,
        contextWindow: 131072,
        costPer1KTokens: { input: 0.001, output: 0.001 }
      }
    ];
  }

  /**
   * Initialize the Perplexity provider
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key is required. Set PERPLEXITY_API_KEY environment variable.');
      }

      // Test connection
      await this.testConnection();
      
      this.log('Perplexity provider initialized successfully', {
        availableModels: this.availableModels.map(m => m.name),
        baseURL: this.baseURL
      });

    } catch (error) {
      this.log('Failed to initialize Perplexity provider', { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Internal text generation implementation
   */
  async _generateText(params) {
    const modelName = params.model || this.options.defaultModel;
    const modelInfo = this.availableModels.find(m => m.name === modelName);
    
    if (!modelInfo) {
      throw new Error(`Model ${modelName} is not available`);
    }

    try {
      const requestBody = {
        model: modelName,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        top_p: params.topP ?? 1,
        max_tokens: params.maxTokens ?? 1000,
        stream: false
      };

      // Add search domain restriction for online models if specified
      if (modelInfo.isOnline && params.searchDomainFilter) {
        requestBody.search_domain_filter = params.searchDomainFilter;
      }

      // Add search recency filter for online models
      if (modelInfo.isOnline && params.searchRecencyFilter) {
        requestBody.search_recency_filter = params.searchRecencyFilter;
      }

      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from Perplexity API');
      }

      const choice = data.choices[0];
      const text = choice.message?.content || '';

      // Extract usage information
      const usage = data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0
      } : null;

      return {
        text,
        model: modelName,
        usage,
        finishReason: choice.finish_reason || 'stop',
        citations: data.citations || null,
        response: data
      };

    } catch (error) {
      this.log('Perplexity text generation failed', { 
        model: modelName, 
        error: error.message 
      }, 'error');
      
      // Handle specific Perplexity errors
      if (error.message?.includes('401')) {
        throw new Error('Invalid Perplexity API key');
      } else if (error.message?.includes('429')) {
        throw new Error('Perplexity API rate limit exceeded');
      } else if (error.message?.includes('400')) {
        throw new Error(`Perplexity API request error: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Internal object generation implementation
   */
  async _generateObject(params) {
    // Perplexity doesn't have native structured output, so we use text generation with schema prompt
    const enhancedMessages = [...params.messages];
    
    // Add schema instruction to the last message or create a new system message
    const schemaInstruction = `\n\nIMPORTANT: Please respond with a valid JSON object that exactly matches this schema:\n${JSON.stringify(params.schema, null, 2)}\n\nRespond only with the JSON object, no additional text or formatting.`;
    
    if (enhancedMessages.length > 0) {
      const lastMessage = enhancedMessages[enhancedMessages.length - 1];
      if (lastMessage.role === 'user') {
        lastMessage.content += schemaInstruction;
      } else {
        enhancedMessages.push({
          role: 'user',
          content: schemaInstruction
        });
      }
    }

    const textResult = await this._generateText({
      ...params,
      messages: enhancedMessages,
      temperature: params.temperature ?? 0.1, // Lower temperature for structured output
      maxTokens: params.maxTokens ?? 2000
    });

    try {
      // Parse JSON response
      let parsedObject;
      const text = textResult.text.trim();
      
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
      const jsonString = jsonMatch[1] || text;
      
      parsedObject = JSON.parse(jsonString);

      return {
        object: parsedObject,
        model: textResult.model,
        usage: textResult.usage,
        finishReason: textResult.finishReason,
        rawText: text,
        citations: textResult.citations
      };

    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${parseError.message}\nRaw response: ${textResult.text}`);
    }
  }

  /**
   * Internal text streaming implementation
   */
  async _streamText(params) {
    const modelName = params.model || this.options.defaultModel;
    const modelInfo = this.availableModels.find(m => m.name === modelName);
    
    if (!modelInfo) {
      throw new Error(`Model ${modelName} is not available`);
    }

    if (!modelInfo.supportsStreaming) {
      throw new Error(`Model ${modelName} does not support streaming`);
    }

    try {
      const requestBody = {
        model: modelName,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        top_p: params.topP ?? 1,
        max_tokens: params.maxTokens ?? 1000,
        stream: true
      };

      // Add search domain restriction for online models if specified
      if (modelInfo.isOnline && params.searchDomainFilter) {
        requestBody.search_domain_filter = params.searchDomainFilter;
      }

      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Perplexity API error (${response.status}): ${errorData}`);
      }

      // Return async iterator for streaming
      return {
        async *[Symbol.asyncIterator]() {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;
                
                if (trimmedLine.startsWith('data: ')) {
                  try {
                    const jsonStr = trimmedLine.slice(6);
                    const data = JSON.parse(jsonStr);
                    
                    if (data.choices && data.choices[0]?.delta?.content) {
                      yield {
                        type: 'text',
                        text: data.choices[0].delta.content,
                        model: modelName,
                        usage: data.usage ? {
                          promptTokens: data.usage.prompt_tokens || 0,
                          completionTokens: data.usage.completion_tokens || 0,
                          totalTokens: data.usage.total_tokens || 0
                        } : null,
                        finishReason: data.choices[0].finish_reason
                      };
                    }
                  } catch (parseError) {
                    // Skip malformed JSON chunks
                    continue;
                  }
                }
              }
            }
          } catch (error) {
            yield {
              type: 'error',
              error: error.message,
              model: modelName
            };
          } finally {
            reader.releaseLock();
          }
        }
      };

    } catch (error) {
      this.log('Perplexity text streaming failed', { 
        model: modelName, 
        error: error.message 
      }, 'error');
      throw error;
    }
  }

  /**
   * Make HTTP request with timeout
   */
  async makeRequest(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.options.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.options.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      textGeneration: true,
      objectGeneration: true, // Via text generation with schema prompting
      streaming: true,
      imageGeneration: false,
      imageAnalysis: false,
      functionCalling: false,
      onlineSearch: true, // Unique to Perplexity
      citations: true, // Unique to Perplexity
      supportedRoles: this.options.supportedRoles,
      maxTokens: this.getMaxTokens(),
      supportedFormats: ['text', 'json'],
      rateLimits: this.getRateLimits(),
      models: this.availableModels.map(m => ({
        name: m.name,
        maxTokens: m.maxTokens,
        isOnline: m.isOnline,
        features: {
          streaming: m.supportsStreaming,
          search: m.isOnline
        }
      }))
    };
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    return this.availableModels.map(model => ({
      id: model.name,
      name: model.name,
      maxTokens: model.maxTokens,
      contextWindow: model.contextWindow,
      costPer1KTokens: model.costPer1KTokens,
      features: {
        streaming: model.supportsStreaming,
        onlineSearch: model.isOnline
      }
    }));
  }

  /**
   * Get maximum tokens for current model
   */
  getMaxTokens() {
    const currentModel = this.availableModels.find(m => m.name === this.options.defaultModel);
    return currentModel?.maxTokens || 127072;
  }

  /**
   * Get rate limits
   */
  getRateLimits() {
    return {
      requestsPerMinute: 20,
      tokensPerMinute: 40000,
      requestsPerDay: 2000
    };
  }

  /**
   * Get API key environment variable name
   */
  getApiKeyEnvVar() {
    return 'PERPLEXITY_API_KEY';
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(usage, modelName = null) {
    if (!usage) return 0;
    
    const model = this.availableModels.find(m => m.name === (modelName || this.options.defaultModel));
    if (!model?.costPer1KTokens) return 0;

    const inputCost = (usage.promptTokens || 0) / 1000 * model.costPer1KTokens.input;
    const outputCost = (usage.completionTokens || 0) / 1000 * model.costPer1KTokens.output;
    
    return inputCost + outputCost;
  }

  /**
   * Test connection to Perplexity API
   */
  async testConnection() {
    try {
      const result = await this._generateText({
        messages: [{ 
          role: 'user', 
          content: 'Hello, this is a connection test. Please respond with "OK".' 
        }],
        maxTokens: 10,
        temperature: 0
      });

      const isConnected = !!result?.text;
      
      this.isConnected = isConnected;
      this.emit('connectionTested', { success: isConnected });
      
      return isConnected;

    } catch (error) {
      this.isConnected = false;
      this.lastError = error;
      this.emit('connectionError', { error });
      return false;
    }
  }

  /**
   * Research-specific method using online models
   */
  async research(query, options = {}) {
    const researchModel = options.model || 'llama-3.1-sonar-large-128k-online';
    
    const messages = [
      {
        role: 'system',
        content: 'You are a research assistant. Provide comprehensive, well-sourced answers with citations when available.'
      },
      {
        role: 'user',
        content: query
      }
    ];

    return await this._generateText({
      messages,
      model: researchModel,
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 2000,
      searchDomainFilter: options.searchDomainFilter,
      searchRecencyFilter: options.searchRecencyFilter || 'month'
    });
  }

  /**
   * Shutdown provider
   */
  async shutdown() {
    this.log('Shutting down Perplexity provider');
    this.isConnected = false;
  }
}