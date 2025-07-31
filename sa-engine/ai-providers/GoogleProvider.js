import { GoogleGenerativeAI } from '@google/generative-ai';
import BaseAIProvider from './BaseAIProvider.js';

/**
 * GoogleProvider - Google Gemini AI provider for Super Agents
 * Integrates with Google's Gemini models through the official SDK
 */
export default class GoogleProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({
      name: 'Google',
      version: '1.0.0',
      defaultModel: 'gemini-1.5-pro',
      supportedRoles: ['main', 'research', 'fallback'],
      timeout: 60000,
      maxRetries: 3,
      retryDelay: 2000,
      ...options
    });

    this.apiKey = options.apiKey || process.env.GOOGLE_API_KEY;
    this.client = null;
    this.models = new Map();
    
    // Model configurations
    this.availableModels = [
      {
        name: 'gemini-1.5-pro',
        maxTokens: 2097152,
        supportsStreaming: true,
        supportsObjects: true,
        costPer1KTokens: { input: 0.00125, output: 0.005 }
      },
      {
        name: 'gemini-1.5-flash',
        maxTokens: 1048576,
        supportsStreaming: true,
        supportsObjects: true,
        costPer1KTokens: { input: 0.000075, output: 0.0003 }
      },
      {
        name: 'gemini-1.5-flash-8b',
        maxTokens: 1048576,
        supportsStreaming: true,
        supportsObjects: true,
        costPer1KTokens: { input: 0.0000375, output: 0.00015 }
      }
    ];
  }

  /**
   * Initialize the Google provider
   */
  async initialize() {
    try {
      if (!this.apiKey) {
        throw new Error('Google API key is required. Set GOOGLE_API_KEY environment variable.');
      }

      this.client = new GoogleGenerativeAI(this.apiKey);
      
      // Initialize model instances
      for (const modelInfo of this.availableModels) {
        try {
          const model = this.client.getGenerativeModel({ model: modelInfo.name });
          this.models.set(modelInfo.name, {
            instance: model,
            info: modelInfo
          });
          this.log(`Initialized model: ${modelInfo.name}`);
        } catch (error) {
          this.log(`Failed to initialize model ${modelInfo.name}`, { error: error.message }, 'warn');
        }
      }

      if (this.models.size === 0) {
        throw new Error('No Google models could be initialized');
      }

      // Test connection
      await this.testConnection();
      
      this.log('Google provider initialized successfully', {
        availableModels: Array.from(this.models.keys())
      });

    } catch (error) {
      this.log('Failed to initialize Google provider', { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Internal text generation implementation
   */
  async _generateText(params) {
    const modelName = params.model || this.options.defaultModel;
    const modelData = this.models.get(modelName);
    
    if (!modelData) {
      throw new Error(`Model ${modelName} is not available`);
    }

    try {
      // Convert messages to Google format
      const googleMessages = this.convertMessages(params.messages);
      
      // Prepare generation config
      const generationConfig = {
        temperature: params.temperature ?? 0.7,
        topP: params.topP ?? 1,
        maxOutputTokens: params.maxTokens ?? 1000,
        candidateCount: 1
      };

      // Generate content
      const result = await modelData.instance.generateContent({
        contents: googleMessages,
        generationConfig
      });

      const response = result.response;
      const text = response.text();
      
      // Extract usage information
      const usage = response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0
      } : null;

      return {
        text,
        model: modelName,
        usage,
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        response: response
      };

    } catch (error) {
      this.log('Google text generation failed', { 
        model: modelName, 
        error: error.message 
      }, 'error');
      
      // Handle specific Google errors
      if (error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid Google API key');
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Google API quota exceeded');
      } else if (error.message?.includes('MODEL_NOT_FOUND')) {
        throw new Error(`Google model ${modelName} not found`);
      }
      
      throw error;
    }
  }

  /**
   * Internal object generation implementation
   */
  async _generateObject(params) {
    const modelName = params.model || this.options.defaultModel;
    const modelData = this.models.get(modelName);
    
    if (!modelData) {
      throw new Error(`Model ${modelName} is not available`);
    }

    if (!modelData.info.supportsObjects) {
      throw new Error(`Model ${modelName} does not support structured object generation`);
    }

    try {
      // Convert messages to Google format
      const googleMessages = this.convertMessages(params.messages);
      
      // Add schema instruction to the last message
      const schemaInstruction = `\n\nPlease respond with a valid JSON object that matches this schema:\n${JSON.stringify(params.schema, null, 2)}`;
      
      if (googleMessages.length > 0) {
        const lastMessage = googleMessages[googleMessages.length - 1];
        if (lastMessage.parts && lastMessage.parts[0]) {
          lastMessage.parts[0].text += schemaInstruction;
        }
      }

      // Prepare generation config for structured output
      const generationConfig = {
        temperature: params.temperature ?? 0.1, // Lower temperature for structured output
        topP: params.topP ?? 1,
        maxOutputTokens: params.maxTokens ?? 2000,
        candidateCount: 1
      };

      // Generate content
      const result = await modelData.instance.generateContent({
        contents: googleMessages,
        generationConfig
      });

      const response = result.response;
      const text = response.text();
      
      // Parse JSON response
      let parsedObject;
      try {
        // Extract JSON from response (handle potential markdown formatting)
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
        const jsonString = jsonMatch[1] || text;
        parsedObject = JSON.parse(jsonString.trim());
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError.message}\nRaw response: ${text}`);
      }

      // Extract usage information
      const usage = response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0
      } : null;

      return {
        object: parsedObject,
        model: modelName,
        usage,
        finishReason: response.candidates?.[0]?.finishReason || 'stop',
        rawText: text
      };

    } catch (error) {
      this.log('Google object generation failed', { 
        model: modelName, 
        error: error.message 
      }, 'error');
      throw error;
    }
  }

  /**
   * Internal text streaming implementation
   */
  async _streamText(params) {
    const modelName = params.model || this.options.defaultModel;
    const modelData = this.models.get(modelName);
    
    if (!modelData) {
      throw new Error(`Model ${modelName} is not available`);
    }

    if (!modelData.info.supportsStreaming) {
      throw new Error(`Model ${modelName} does not support streaming`);
    }

    try {
      // Convert messages to Google format
      const googleMessages = this.convertMessages(params.messages);
      
      // Prepare generation config
      const generationConfig = {
        temperature: params.temperature ?? 0.7,
        topP: params.topP ?? 1,
        maxOutputTokens: params.maxTokens ?? 1000,
        candidateCount: 1
      };

      // Generate streaming content
      const result = await modelData.instance.generateContentStream({
        contents: googleMessages,
        generationConfig
      });

      // Return async iterator
      return {
        async *[Symbol.asyncIterator]() {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                yield {
                  type: 'text',
                  text,
                  model: modelName,
                  usage: chunk.usageMetadata ? {
                    promptTokens: chunk.usageMetadata.promptTokenCount || 0,
                    completionTokens: chunk.usageMetadata.candidatesTokenCount || 0,
                    totalTokens: chunk.usageMetadata.totalTokenCount || 0
                  } : null
                };
              }
            }
          } catch (error) {
            yield {
              type: 'error',
              error: error.message,
              model: modelName
            };
          }
        }
      };

    } catch (error) {
      this.log('Google text streaming failed', { 
        model: modelName, 
        error: error.message 
      }, 'error');
      throw error;
    }
  }

  /**
   * Convert OpenAI-style messages to Google format
   */
  convertMessages(messages) {
    const googleMessages = [];
    
    for (const message of messages) {
      let role;
      
      // Map roles
      switch (message.role) {
        case 'system':
          // Google uses 'user' role for system messages with special formatting
          role = 'user';
          break;
        case 'user':
          role = 'user';
          break;
        case 'assistant':
          role = 'model';
          break;
        default:
          role = 'user';
      }

      const content = message.role === 'system' 
        ? `System: ${message.content}`
        : message.content;

      googleMessages.push({
        role,
        parts: [{ text: content }]
      });
    }

    return googleMessages;
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
      models: this.availableModels.map(m => ({
        name: m.name,
        maxTokens: m.maxTokens,
        features: {
          streaming: m.supportsStreaming,
          objects: m.supportsObjects
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
      costPer1KTokens: model.costPer1KTokens,
      features: {
        streaming: model.supportsStreaming,
        objectGeneration: model.supportsObjects
      }
    }));
  }

  /**
   * Get maximum tokens for current model
   */
  getMaxTokens() {
    const currentModel = this.availableModels.find(m => m.name === this.options.defaultModel);
    return currentModel?.maxTokens || 1048576;
  }

  /**
   * Get rate limits
   */
  getRateLimits() {
    return {
      requestsPerMinute: 15, // Conservative estimate for free tier
      tokensPerMinute: 32000,
      requestsPerDay: 1500
    };
  }

  /**
   * Get API key environment variable name
   */
  getApiKeyEnvVar() {
    return 'GOOGLE_API_KEY';
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
   * Test connection to Google API
   */
  async testConnection() {
    try {
      const defaultModel = this.models.get(this.options.defaultModel);
      if (!defaultModel) {
        throw new Error(`Default model ${this.options.defaultModel} not available`);
      }

      const result = await defaultModel.instance.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello, this is a connection test. Please respond with "OK".' }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 10,
          candidateCount: 1
        }
      });

      const response = result.response;
      const isConnected = !!response.text();
      
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
   * Shutdown provider
   */
  async shutdown() {
    this.log('Shutting down Google provider');
    this.models.clear();
    this.client = null;
    this.isConnected = false;
  }
}