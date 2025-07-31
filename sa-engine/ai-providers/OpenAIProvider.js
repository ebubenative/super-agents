import BaseAIProvider from './BaseAIProvider.js';
import OpenAI from 'openai';

/**
 * OpenAIProvider - OpenAI GPT provider implementation
 * Provides integration with OpenAI's GPT models for Super Agents
 */
export default class OpenAIProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({
      name: 'openai',
      version: '1.0.0',
      defaultModel: 'gpt-4o',
      supportedRoles: ['main', 'research', 'fallback'],
      ...options
    });

    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.organization = options.organization || process.env.OPENAI_ORGANIZATION;
    this.project = options.project || process.env.OPENAI_PROJECT;
    this.openai = null;
    
    // Model configurations with pricing and capabilities
    this.models = {
      'gpt-4o': {
        maxTokens: 128000,
        contextWindow: 128000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.015,
        capabilities: ['text', 'reasoning', 'code', 'analysis', 'function-calling', 'vision']
      },
      'gpt-4o-mini': {
        maxTokens: 128000,
        contextWindow: 128000,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        capabilities: ['text', 'speed', 'efficiency', 'function-calling']
      },
      'gpt-4-turbo': {
        maxTokens: 128000,
        contextWindow: 128000,
        costPer1kInput: 0.01,
        costPer1kOutput: 0.03,
        capabilities: ['text', 'reasoning', 'code', 'analysis', 'function-calling', 'vision']
      },
      'gpt-4': {
        maxTokens: 8192,
        contextWindow: 8192,
        costPer1kInput: 0.03,
        costPer1kOutput: 0.06,
        capabilities: ['text', 'reasoning', 'complex-analysis']
      },
      'gpt-3.5-turbo': {
        maxTokens: 16385,
        contextWindow: 16385,
        costPer1kInput: 0.0005,
        costPer1kOutput: 0.0015,
        capabilities: ['text', 'speed', 'efficiency']
      }
    };

    // Set default role configurations
    this.setDefaultRoleConfigs();
  }

  /**
   * Initialize the OpenAI provider
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key is required');
      }

      const clientOptions = {
        apiKey: this.apiKey,
        timeout: this.options.timeout
      };

      if (this.organization) {
        clientOptions.organization = this.organization;
      }

      if (this.project) {
        clientOptions.project = this.project;
      }

      this.openai = new OpenAI(clientOptions);

      // Test connection
      await this.testConnection();
      
      this.log('OpenAI provider initialized successfully');
      this.emit('initialized');
      
      return true;

    } catch (error) {
      this.log('Failed to initialize OpenAI provider', { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Set default role configurations
   */
  setDefaultRoleConfigs() {
    // Main role - balanced for general tasks
    this.configureRole('main', {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1
    });

    // Research role - optimized for analysis and research
    this.configureRole('research', {
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 8000,
      topP: 0.9
    });

    // Fallback role - fast and efficient
    this.configureRole('fallback', {
      model: 'gpt-4o-mini',
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

      const request = {
        model: params.model || this.options.defaultModel,
        messages,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature ?? 0.7,
        top_p: params.topP ?? 1,
        frequency_penalty: params.frequencyPenalty ?? 0,
        presence_penalty: params.presencePenalty ?? 0
      };

      // Add function calling if provided
      if (params.functions) {
        request.functions = params.functions;
      }

      if (params.function_call) {
        request.function_call = params.function_call;
      }

      // Add tools if provided (newer format)
      if (params.tools) {
        request.tools = params.tools;
      }

      if (params.tool_choice) {
        request.tool_choice = params.tool_choice;
      }

      const response = await this.openai.chat.completions.create(request);

      return {
        text: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        finishReason: response.choices[0]?.finish_reason,
        id: response.id,
        functionCall: response.choices[0]?.message?.function_call,
        toolCalls: response.choices[0]?.message?.tool_calls
      };

    } catch (error) {
      this.handleOpenAIError(error);
    }
  }

  /**
   * Internal object generation implementation
   */
  async _generateObject(params) {
    try {
      const messages = this.formatMessages(params.messages);
      
      // Add system message for structured output
      const systemMessage = this.buildObjectSystemMessage(params.schema, params.objectDescription);
      messages.unshift({
        role: 'system',
        content: systemMessage
      });

      const request = {
        model: params.model || this.options.defaultModel,
        messages,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature ?? 0.3,
        top_p: params.topP ?? 0.9,
        response_format: { type: 'json_object' }
      };

      const response = await this.openai.chat.completions.create(request);
      const textResponse = response.choices[0]?.message?.content || '';

      // Parse JSON response
      let parsedObject;
      try {
        parsedObject = JSON.parse(textResponse);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedObject = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse structured response as JSON');
        }
      }

      return {
        object: parsedObject,
        text: textResponse,
        model: response.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        finishReason: response.choices[0]?.finish_reason,
        id: response.id
      };

    } catch (error) {
      this.handleOpenAIError(error);
    }
  }

  /**
   * Internal text streaming implementation
   */
  async _streamText(params) {
    try {
      const messages = this.formatMessages(params.messages);

      const request = {
        model: params.model || this.options.defaultModel,
        messages,
        max_tokens: params.maxTokens || 4000,
        temperature: params.temperature ?? 0.7,
        top_p: params.topP ?? 1,
        frequency_penalty: params.frequencyPenalty ?? 0,
        presence_penalty: params.presencePenalty ?? 0,
        stream: true
      };

      const stream = await this.openai.chat.completions.create(request);
      
      return this.createStreamWrapper(stream);

    } catch (error) {
      this.handleOpenAIError(error);
    }
  }

  /**
   * Format messages for OpenAI API
   */
  formatMessages(messages) {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
      ...(msg.function_call && { function_call: msg.function_call }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id })
    }));
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
          const delta = chunk.choices[0]?.delta;
          
          if (delta?.content) {
            const text = delta.content;
            buffer += text;
            
            yield {
              type: 'textDelta',
              textDelta: text,
              fullText: buffer,
              finishReason: chunk.choices[0]?.finish_reason
            };
          }
          
          if (chunk.choices[0]?.finish_reason) {
            yield {
              type: 'finish',
              fullText: buffer,
              finishReason: chunk.choices[0].finish_reason,
              usage: chunk.usage
            };
          }
        }
      }
    };
  }

  /**
   * Handle OpenAI-specific errors
   */
  handleOpenAIError(error) {
    let errorMessage = error.message || 'Unknown OpenAI API error';
    let errorType = 'api_error';

    if (error.status) {
      switch (error.status) {
        case 400:
          errorType = 'invalid_request';
          break;
        case 401:
          errorType = 'authentication_error';
          errorMessage = 'Invalid OpenAI API key';
          break;
        case 403:
          errorType = 'permission_error';
          break;
        case 404:
          errorType = 'not_found';
          errorMessage = 'OpenAI model or endpoint not found';
          break;
        case 429:
          errorType = 'rate_limit';
          errorMessage = 'OpenAI API rate limit exceeded';
          break;
        case 500:
        case 502:
        case 503:
          errorType = 'service_error';
          errorMessage = 'OpenAI service temporarily unavailable';
          break;
      }
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.type = errorType;
    enhancedError.status = error.status;
    enhancedError.provider = 'openai';
    
    throw enhancedError;
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    try {
      const response = await this.openai.models.list();
      return response.data
        .filter(model => model.id.startsWith('gpt-'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      // Fallback to predefined models if API call fails
      return Object.keys(this.models);
    }
  }

  /**
   * Get maximum tokens for model
   */
  getMaxTokens(model = null) {
    const modelName = model || this.options.defaultModel;
    return this.models[modelName]?.maxTokens || 128000;
  }

  /**
   * Get rate limits
   */
  getRateLimits() {
    return {
      requestsPerMinute: 3500,
      tokensPerMinute: 350000,
      requestsPerDay: 10000
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
    return 'OPENAI_API_KEY';
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey) {
    return apiKey && typeof apiKey === 'string' && apiKey.startsWith('sk-');
  }

  /**
   * Test specific OpenAI connection with simple completion
   */
  async testConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });

      this.isConnected = !!response.choices[0]?.message?.content;
      return this.isConnected;

    } catch (error) {
      this.isConnected = false;
      this.lastError = error;
      throw error;
    }
  }
}