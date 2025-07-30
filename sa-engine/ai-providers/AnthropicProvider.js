import BaseAIProvider from './BaseAIProvider.js';
import Anthropic from '@anthropic-ai/sdk';

/**
 * AnthropicProvider - Claude AI provider implementation
 * Provides integration with Anthropic's Claude models for Super Agents
 */
export default class AnthropicProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({
      name: 'anthropic',
      version: '1.0.0',
      defaultModel: 'claude-3-5-sonnet-20241022',
      supportedRoles: ['main', 'research', 'fallback'],
      ...options
    });

    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.anthropic = null;
    
    // Model configurations
    this.models = {
      'claude-3-5-sonnet-20241022': {
        maxTokens: 200000,
        contextWindow: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        capabilities: ['text', 'reasoning', 'code', 'analysis']
      },
      'claude-3-5-haiku-20241022': {
        maxTokens: 200000,
        contextWindow: 200000,
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.00125,
        capabilities: ['text', 'speed', 'efficiency']
      },
      'claude-3-opus-20240229': {
        maxTokens: 200000,
        contextWindow: 200000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        capabilities: ['text', 'reasoning', 'complex-analysis', 'creative']
      }
    };

    // Set default role configurations
    this.setDefaultRoleConfigs();
  }

  /**
   * Initialize the Anthropic provider
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('Anthropic API key is required');
      }

      this.anthropic = new Anthropic({
        apiKey: this.apiKey,
        timeout: this.options.timeout
      });

      // Test connection
      await this.testConnection();
      
      this.log('Anthropic provider initialized successfully');
      this.emit('initialized');
      
      return true;

    } catch (error) {
      this.log('Failed to initialize Anthropic provider', { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Set default role configurations
   */
  setDefaultRoleConfigs() {
    // Main role - balanced for general tasks
    this.configureRole('main', {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1
    });

    // Research role - optimized for analysis and research
    this.configureRole('research', {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      maxTokens: 8000,
      topP: 0.9
    });

    // Fallback role - fast and efficient
    this.configureRole('fallback', {
      model: 'claude-3-5-haiku-20241022',
      temperature: 0.5,
      maxTokens: 2000,
      topP: 1
    });
  }

  /**
   * Internal text generation implementation
   */
  async _generateText(params) {
    try {
      const messages = this.formatMessages(params.messages);
      const systemMessage = this.extractSystemMessage(params.messages);

      const request = {
        model: params.model || this.options.defaultModel,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature ?? 0.7,
        top_p: params.topP ?? 1,
        messages,
        ...(systemMessage && { system: systemMessage })
      };

      const response = await this.anthropic.messages.create(request);

      return {
        text: response.content[0]?.text || '',
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        finishReason: response.stop_reason,
        id: response.id
      };

    } catch (error) {
      this.handleAnthropicError(error);
    }
  }

  /**
   * Internal object generation implementation
   */
  async _generateObject(params) {
    try {
      // Anthropic doesn't have native structured output, so we'll use JSON mode
      const messages = this.formatMessages(params.messages);
      const systemMessage = this.buildObjectSystemMessage(params.schema, params.objectDescription);

      const request = {
        model: params.model || this.options.defaultModel,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature ?? 0.3,
        top_p: params.topP ?? 0.9,
        messages,
        system: systemMessage
      };

      const response = await this.anthropic.messages.create(request);
      const textResponse = response.content[0]?.text || '';

      // Parse JSON response
      let parsedObject;
      try {
        parsedObject = JSON.parse(textResponse);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsedObject = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse structured response as JSON');
        }
      }

      return {
        object: parsedObject,
        text: textResponse,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        finishReason: response.stop_reason,
        id: response.id
      };

    } catch (error) {
      this.handleAnthropicError(error);
    }
  }

  /**
   * Internal text streaming implementation
   */
  async _streamText(params) {
    try {
      const messages = this.formatMessages(params.messages);
      const systemMessage = this.extractSystemMessage(params.messages);

      const request = {
        model: params.model || this.options.defaultModel,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature ?? 0.7,
        top_p: params.topP ?? 1,
        messages,
        stream: true,
        ...(systemMessage && { system: systemMessage })
      };

      const stream = await this.anthropic.messages.create(request);
      
      return this.createStreamWrapper(stream);

    } catch (error) {
      this.handleAnthropicError(error);
    }
  }

  /**
   * Format messages for Anthropic API
   */
  formatMessages(messages) {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
  }

  /**
   * Extract system message from messages array
   */
  extractSystemMessage(messages) {
    const systemMsg = messages.find(msg => msg.role === 'system');
    return systemMsg?.content || null;
  }

  /**
   * Build system message for object generation
   */
  buildObjectSystemMessage(schema, description) {
    const schemaStr = JSON.stringify(schema, null, 2);
    
    return `You are a helpful assistant that generates structured JSON responses.

${description ? `Task: ${description}` : ''}

Please respond with valid JSON that conforms to this schema:
${schemaStr}

Rules:
1. Respond only with valid JSON
2. Do not include any text outside the JSON response
3. Ensure all required fields are present
4. Follow the exact schema structure`;
  }

  /**
   * Create stream wrapper for consistent interface
   */
  createStreamWrapper(stream) {
    return {
      async *[Symbol.asyncIterator]() {
        let buffer = '';
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            const text = chunk.delta?.text || '';
            buffer += text;
            
            yield {
              type: 'textDelta',
              textDelta: text,
              fullText: buffer
            };
          } else if (chunk.type === 'message_stop') {
            yield {
              type: 'finish',
              fullText: buffer,
              finishReason: chunk.stop_reason || 'stop'
            };
          }
        }
      }
    };
  }

  /**
   * Handle Anthropic-specific errors
   */
  handleAnthropicError(error) {
    let errorMessage = error.message || 'Unknown Anthropic API error';
    let errorType = 'api_error';

    if (error.status) {
      switch (error.status) {
        case 400:
          errorType = 'invalid_request';
          break;
        case 401:
          errorType = 'authentication_error';
          errorMessage = 'Invalid Anthropic API key';
          break;
        case 403:
          errorType = 'permission_error';
          break;
        case 429:
          errorType = 'rate_limit';
          errorMessage = 'Anthropic API rate limit exceeded';
          break;
        case 500:
        case 502:
        case 503:
          errorType = 'service_error';
          errorMessage = 'Anthropic service temporarily unavailable';
          break;
      }
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.type = errorType;
    enhancedError.status = error.status;
    enhancedError.provider = 'anthropic';
    
    throw enhancedError;
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    return Object.keys(this.models);
  }

  /**
   * Get maximum tokens for model
   */
  getMaxTokens(model = null) {
    const modelName = model || this.options.defaultModel;
    return this.models[modelName]?.maxTokens || 200000;
  }

  /**
   * Get rate limits
   */
  getRateLimits() {
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 200000,
      requestsPerDay: 1000
    };
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      textGeneration: true,
      objectGeneration: true,
      streaming: true,
      imageGeneration: false,
      imageAnalysis: true,
      functionCalling: true,
      supportedRoles: this.options.supportedRoles,
      maxTokens: this.getMaxTokens(),
      supportedFormats: ['text', 'json'],
      rateLimits: this.getRateLimits(),
      models: this.models
    };
  }

  /**
   * Get model information
   */
  getModelInfo(model) {
    return this.models[model] || null;
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(usage, model = null) {
    const modelName = model || this.options.defaultModel;
    const modelInfo = this.models[modelName];
    
    if (!modelInfo || !usage) {
      return null;
    }

    const inputCost = (usage.inputTokens / 1000) * modelInfo.costPer1kInput;
    const outputCost = (usage.outputTokens / 1000) * modelInfo.costPer1kOutput;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD'
    };
  }

  /**
   * Get API key environment variable name
   */
  getApiKeyEnvVar() {
    return 'ANTHROPIC_API_KEY';
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey) {
    return apiKey && typeof apiKey === 'string' && apiKey.startsWith('sk-ant-');
  }
}