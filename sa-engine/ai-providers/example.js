/**
 * AI Provider System Usage Example
 * Demonstrates how to use the enhanced AI provider infrastructure
 */

import { 
  ProviderRegistry, 
  RoleBasedRouter, 
  AnthropicProvider, 
  OpenAIProvider 
} from './index.js';

/**
 * Example 1: Basic Provider Setup and Usage
 */
async function basicProviderExample() {
  console.log('\n=== Basic Provider Example ===');
  
  // Create provider registry
  const registry = new ProviderRegistry({
    enableAutoRegistration: true,
    enableHealthChecks: true
  });

  try {
    // Auto-register providers based on environment variables
    const results = await registry.autoRegisterProviders();
    console.log('Auto-registration results:', results);

    // Generate text using default role (main)
    const response = await registry.generateText({
      messages: [
        { role: 'user', content: 'Explain quantum computing in simple terms.' }
      ],
      maxTokens: 500
    });

    console.log('Generated response:', {
      provider: response.provider,
      text: response.text.substring(0, 100) + '...',
      usage: response.usage
    });

  } catch (error) {
    console.error('Basic example error:', error.message);
  }
}

/**
 * Example 2: Role-Based Routing
 */
async function roleBasedRoutingExample() {
  console.log('\n=== Role-Based Routing Example ===');
  
  const registry = new ProviderRegistry();
  await registry.autoRegisterProviders();
  
  const router = new RoleBasedRouter(registry, {
    enableContextAwareRouting: true,
    enablePerformanceRouting: true,
    enableCostOptimization: true
  });

  try {
    // Research role - should prefer Anthropic for analysis
    const researchResponse = await registry.generateText({
      role: 'research',
      messages: [
        { 
          role: 'user', 
          content: 'Conduct a comprehensive analysis of the current state of artificial intelligence in healthcare, including key applications, challenges, and future trends.' 
        }
      ],
      maxTokens: 2000
    });

    console.log('Research response:', {
      provider: researchResponse.provider,
      role: researchResponse.role,
      text: researchResponse.text.substring(0, 150) + '...'
    });

    // Coding role - should prefer OpenAI for code generation
    const codingResponse = await registry.generateText({
      role: 'coding',
      messages: [
        { 
          role: 'user', 
          content: 'Write a Python function to implement a binary search algorithm with comprehensive error handling and documentation.' 
        }
      ],
      maxTokens: 1000
    });

    console.log('Coding response:', {
      provider: codingResponse.provider,
      role: codingResponse.role,
      text: codingResponse.text.substring(0, 150) + '...'
    });

    // Fallback role - should use cost-effective models
    const fallbackResponse = await registry.generateText({
      role: 'fallback',
      messages: [
        { role: 'user', content: 'What is the capital of France?' }
      ],
      maxTokens: 50
    });

    console.log('Fallback response:', {
      provider: fallbackResponse.provider,
      role: fallbackResponse.role,
      text: fallbackResponse.text
    });

  } catch (error) {
    console.error('Role-based routing error:', error.message);
  }
}

/**
 * Example 3: Structured Object Generation
 */
async function structuredObjectExample() {
  console.log('\n=== Structured Object Generation Example ===');
  
  const registry = new ProviderRegistry();
  await registry.autoRegisterProviders();

  try {
    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        keyPoints: { 
          type: 'array',
          items: { type: 'string' }
        },
        confidence: { 
          type: 'number',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['title', 'summary', 'keyPoints', 'confidence']
    };

    const response = await registry.generateObject({
      messages: [
        { 
          role: 'user', 
          content: 'Analyze the benefits and drawbacks of remote work for software development teams.' 
        }
      ],
      schema,
      objectDescription: 'Analysis of remote work for software development',
      maxTokens: 1000
    });

    console.log('Structured object response:', {
      provider: response.provider,
      object: response.object
    });

  } catch (error) {
    console.error('Structured object error:', error.message);
  }
}

/**
 * Example 4: Streaming Response
 */
async function streamingExample() {
  console.log('\n=== Streaming Response Example ===');
  
  const registry = new ProviderRegistry();
  await registry.autoRegisterProviders();

  try {
    const stream = await registry.streamText({
      messages: [
        { 
          role: 'user', 
          content: 'Write a short story about a robot learning to paint.' 
        }
      ],
      maxTokens: 800
    });

    console.log('Streaming response:');
    let fullText = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'textDelta') {
        process.stdout.write(chunk.textDelta);
        fullText += chunk.textDelta;
      } else if (chunk.type === 'finish') {
        console.log('\n\nStreaming completed:', {
          finishReason: chunk.finishReason,
          totalLength: fullText.length
        });
      }
    }

  } catch (error) {
    console.error('Streaming error:', error.message);
  }
}

/**
 * Example 5: Provider Health Monitoring and Fallback
 */
async function healthMonitoringExample() {
  console.log('\n=== Health Monitoring Example ===');
  
  const registry = new ProviderRegistry({
    enableHealthChecks: true,
    healthCheckInterval: 5000 // Check every 5 seconds
  });

  // Set up event listeners
  registry.on('providerUnhealthy', (data) => {
    console.log(`Provider ${data.provider} marked as unhealthy:`, data.error.message);
  });

  registry.on('providerRecovered', (data) => {
    console.log(`Provider ${data.provider} recovered and is healthy again`);
  });

  registry.on('textGenerationCompleted', (data) => {
    console.log(`Request completed using ${data.provider} (${data.result.usage?.totalTokens} tokens)`);
  });

  try {
    await registry.autoRegisterProviders();
    registry.startHealthCheck();

    // Make several requests to demonstrate fallback behavior
    for (let i = 0; i < 3; i++) {
      const response = await registry.generateText({
        messages: [
          { role: 'user', content: `Tell me an interesting fact about space (request ${i + 1}).` }
        ],
        maxTokens: 100
      });

      console.log(`Response ${i + 1}:`, response.text.substring(0, 80) + '...');
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Get provider status
    const status = registry.getStatus();
    console.log('\nProvider status:', {
      totalProviders: status.totalProviders,
      healthyProviders: status.healthyProviders,
      activeRequests: status.activeRequests
    });

  } catch (error) {
    console.error('Health monitoring error:', error.message);
  } finally {
    registry.stopHealthCheck();
  }
}

/**
 * Example 6: Custom Provider Configuration
 */
async function customConfigurationExample() {
  console.log('\n=== Custom Configuration Example ===');
  
  const registry = new ProviderRegistry();

  try {
    // Register providers with custom configurations
    await registry.registerProvider('openai', {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o-mini', // Use mini model for cost efficiency
      roles: {
        main: { 
          priority: 3, 
          weight: 3,
          temperature: 0.5,
          maxTokens: 2000
        },
        fallback: { 
          priority: 2, 
          weight: 2,
          temperature: 0.3,
          maxTokens: 1000
        }
      }
    });

    await registry.registerProvider('anthropic', {
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-3-5-haiku-20241022', // Use Haiku for speed
      roles: {
        research: { 
          priority: 3, 
          weight: 3,
          temperature: 0.2,
          maxTokens: 4000
        }
      }
    });

    // Test custom configuration
    const response = await registry.generateText({
      role: 'main',
      messages: [
        { role: 'user', content: 'Explain the concept of technical debt in software development.' }
      ]
    });

    console.log('Custom configuration response:', {
      provider: response.provider,
      model: response.model,
      text: response.text.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('Custom configuration error:', error.message);
  }
}

/**
 * Example 7: Cost and Performance Analytics
 */
async function analyticsExample() {
  console.log('\n=== Analytics Example ===');
  
  const registry = new ProviderRegistry({
    enableMetrics: true
  });

  const router = new RoleBasedRouter(registry, {
    routingMetrics: true,
    enableCostOptimization: true
  });

  try {
    await registry.autoRegisterProviders();

    // Make several requests across different roles
    const requests = [
      { role: 'main', content: 'Write a function to sort an array' },
      { role: 'research', content: 'Analyze the impact of AI on education' },
      { role: 'fallback', content: 'What is 2 + 2?' },
      { role: 'creative', content: 'Write a haiku about programming' },
      { role: 'coding', content: 'Debug this JavaScript function: function test() { return undefined; }' }
    ];

    for (const req of requests) {
      try {
        const response = await registry.generateText({
          role: req.role,
          messages: [{ role: 'user', content: req.content }],
          maxTokens: 300
        });

        console.log(`${req.role} request completed using ${response.provider}`);
      } catch (error) {
        console.log(`${req.role} request failed:`, error.message);
      }
    }

    // Get analytics
    const registryStatus = registry.getStatus();
    const routerStats = router.getRoutingStats();

    console.log('\nAnalytics Summary:');
    console.log('Provider Status:', {
      totalProviders: registryStatus.totalProviders,
      healthyProviders: registryStatus.healthyProviders
    });

    console.log('Routing Statistics:', {
      totalRequests: routerStats.totalRequests,
      avgRoutingTime: Math.round(routerStats.avgRoutingTime),
      providerDistribution: routerStats.providerDistribution,
      roleDistribution: routerStats.roleDistribution
    });

  } catch (error) {
    console.error('Analytics error:', error.message);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Super Agents AI Provider System Examples\n');

  try {
    await basicProviderExample();
    await roleBasedRoutingExample();  
    await structuredObjectExample();
    await streamingExample();
    await healthMonitoringExample();
    await customConfigurationExample();
    await analyticsExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
  }
}

// Export examples for individual testing
export {
  basicProviderExample,
  roleBasedRoutingExample,
  structuredObjectExample,
  streamingExample,
  healthMonitoringExample,
  customConfigurationExample,
  analyticsExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}