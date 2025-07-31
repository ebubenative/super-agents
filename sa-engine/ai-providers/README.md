# Super Agents AI Provider System

A comprehensive, enterprise-grade AI provider management system that provides intelligent routing, fallback handling, and role-based provider selection for the Super Agents framework.

## Overview

The AI Provider system implements Phase 15 of the Super Agents Framework implementation plan, providing:

- **Unified Provider Interface**: Abstract base class for consistent provider implementations
- **Intelligent Provider Registry**: Centralized management with auto-registration and health monitoring
- **Role-Based Routing**: Smart provider selection based on request context and role
- **Fallback System**: Automatic failover to backup providers
- **Performance Analytics**: Real-time metrics and cost optimization
- **Streaming Support**: Real-time response streaming capabilities

## Architecture

```
AI Provider System
├── BaseAIProvider (Abstract Base Class)
├── ProviderManager (Core Management)
├── ProviderRegistry (Central Registry)
├── RoleBasedRouter (Intelligent Routing)
└── Provider Implementations
    ├── AnthropicProvider (Claude)
    ├── OpenAIProvider (GPT)
    └── [Future Providers]
```

## Key Features

### 🎯 Role-Based Routing

Automatically select the best AI provider based on task requirements:

- **Main Role**: General-purpose development assistance (balanced performance)
- **Research Role**: Deep analysis and comprehensive research (accuracy-focused)  
- **Fallback Role**: Fast, cost-effective responses (speed-optimized)
- **Creative Role**: Creative writing and artistic tasks
- **Coding Role**: Software development and debugging

### 🔄 Intelligent Fallback

- **Cascade Strategy**: Try providers in priority order
- **Performance-Based**: Route to fastest available provider
- **Cost-Optimized**: Select most cost-effective option
- **Health-Aware**: Automatic failover for unhealthy providers

### 📊 Performance Analytics

- Real-time provider health monitoring
- Request/response metrics tracking
- Cost analysis and optimization
- Routing performance statistics

### 🔧 Auto-Configuration

- Environment-based provider detection
- Automatic API key discovery
- Smart default configurations
- Role-specific model selection

## Quick Start

### Basic Usage

```javascript
import { ProviderRegistry } from './ai-providers/index.js';

// Create registry with auto-configuration
const registry = new ProviderRegistry({
  enableAutoRegistration: true,
  enableHealthChecks: true
});

// Auto-register providers based on environment variables
await registry.autoRegisterProviders();

// Generate text using intelligent provider selection
const response = await registry.generateText({
  messages: [
    { role: 'user', content: 'Explain quantum computing in simple terms.' }
  ],
  role: 'main', // Optional: specify role for intelligent routing
  maxTokens: 500
});

console.log(response.text);
```

### Role-Based Routing

```javascript
// Research-focused request (prefers Anthropic Claude)
const researchResponse = await registry.generateText({
  role: 'research',
  messages: [
    { role: 'user', content: 'Analyze the current state of AI in healthcare.' }
  ],
  maxTokens: 2000
});

// Coding request (prefers OpenAI GPT)
const codeResponse = await registry.generateText({
  role: 'coding', 
  messages: [
    { role: 'user', content: 'Write a Python binary search function.' }
  ],
  maxTokens: 1000
});

// Quick fallback request (uses cost-effective models)
const quickResponse = await registry.generateText({
  role: 'fallback',
  messages: [
    { role: 'user', content: 'What is the capital of France?' }
  ],
  maxTokens: 50
});
```

### Structured Object Generation

```javascript
const schema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['title', 'keyPoints', 'confidence']
};

const response = await registry.generateObject({
  messages: [
    { role: 'user', content: 'Analyze remote work benefits and drawbacks.' }
  ],
  schema,
  maxTokens: 800
});

console.log(response.object);
```

### Streaming Responses

```javascript
const stream = await registry.streamText({
  messages: [
    { role: 'user', content: 'Write a short story about AI.' }
  ],
  maxTokens: 800
});

for await (const chunk of stream) {
  if (chunk.type === 'textDelta') {
    process.stdout.write(chunk.textDelta);
  }
}
```

## Environment Setup

Set up environment variables for automatic provider registration:

```bash
# OpenAI Configuration
export OPENAI_API_KEY="sk-..."
export OPENAI_ORGANIZATION="org-..." # Optional
export OPENAI_PROJECT="proj_..." # Optional

# Anthropic Configuration  
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Advanced Configuration

### Custom Provider Registration

```javascript
const registry = new ProviderRegistry();

// Register OpenAI with custom settings
await registry.registerProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o-mini',
  roles: {
    main: { 
      priority: 3, 
      weight: 3,
      temperature: 0.7,
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

// Register Anthropic with research focus
await registry.registerProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-3-5-sonnet-20241022',
  roles: {
    research: { 
      priority: 3, 
      weight: 3,
      temperature: 0.2,
      maxTokens: 4000 
    }
  }
});
```

### Advanced Routing Configuration

```javascript
import { RoleBasedRouter } from './ai-providers/index.js';

const router = new RoleBasedRouter(registry, {
  enableContextAwareRouting: true,
  enablePerformanceRouting: true,
  enableCostOptimization: true
});

// Custom routing rule
router.addRoutingRule('data-analysis', {
  strategy: 'capability_focused',
  providers: [
    { 
      name: 'anthropic', 
      priority: 3, 
      models: ['claude-3-5-sonnet-20241022'],
      contextPatterns: ['data', 'analysis', 'statistics']
    }
  ],
  maxCostPerRequest: 0.15,
  performanceWeights: {
    accuracy: 0.6,
    speed: 0.4
  }
});
```

## Provider Implementations

### BaseAIProvider

Abstract base class providing standardized interface:

```javascript
export default class BaseAIProvider extends EventEmitter {
  // Core methods
  async initialize()
  async generateText(params)
  async generateObject(params) 
  async streamText(params)
  async testConnection()
  
  // Configuration
  configureRole(role, config)
  getRoleConfig(role)
  
  // Utilities
  getCapabilities()
  getStatus()
  getAvailableModels()
  calculateCost(usage, model)
}
```

### AnthropicProvider

Claude AI integration with comprehensive model support:

- **Models**: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
- **Capabilities**: Text generation, structured output, streaming, vision
- **Optimized for**: Research, analysis, creative writing

### OpenAIProvider  

GPT integration with full feature support:

- **Models**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Capabilities**: Text generation, structured output, streaming, function calling
- **Optimized for**: Coding, general assistance, rapid responses

## Monitoring and Analytics

### Provider Health Monitoring

```javascript
// Enable health checks
registry.startHealthCheck();

// Listen for health events
registry.on('providerUnhealthy', (data) => {
  console.log(`Provider ${data.provider} is unhealthy:`, data.error);
});

registry.on('providerRecovered', (data) => {
  console.log(`Provider ${data.provider} recovered`);
});
```

### Performance Metrics

```javascript
// Get provider status
const status = registry.getStatus();
console.log('Registry Status:', {
  totalProviders: status.totalProviders,
  healthyProviders: status.healthyProviders,
  activeRequests: status.activeRequests
});

// Get routing statistics
const routerStats = router.getRoutingStats();
console.log('Routing Stats:', {
  totalRequests: routerStats.totalRequests,
  avgRoutingTime: routerStats.avgRoutingTime,
  providerDistribution: routerStats.providerDistribution
});
```

## Error Handling

The system provides comprehensive error handling with automatic fallback:

```javascript
try {
  const response = await registry.generateText({
    messages: [{ role: 'user', content: 'Hello' }],
    role: 'main'
  });
} catch (error) {
  if (error.type === 'rate_limit') {
    // Handle rate limiting
  } else if (error.type === 'authentication_error') {
    // Handle auth issues  
  } else {
    // Handle other errors
  }
}
```

## Event System

The provider system emits events for monitoring and integration:

```javascript
registry.on('textGenerationCompleted', (data) => {
  console.log(`Request completed: ${data.provider} (${data.result.usage.totalTokens} tokens)`);
});

registry.on('providerRegistered', (data) => {
  console.log(`Provider registered: ${data.provider.name}`);
});

registry.on('routingCompleted', (decision) => {
  console.log(`Routed to ${decision.provider.name} for ${decision.role} role`);
});
```

## Best Practices

### 1. Environment Configuration
- Set up environment variables for automatic provider detection
- Use different API keys for development and production
- Configure appropriate rate limits and timeouts

### 2. Role Selection
- Use `research` role for analysis and comprehensive tasks
- Use `coding` role for software development tasks  
- Use `fallback` role for simple, cost-sensitive requests
- Use `main` role for general-purpose tasks

### 3. Error Handling
- Implement proper error handling for rate limits and API issues
- Use fallback strategies for critical applications
- Monitor provider health and performance

### 4. Cost Optimization
- Enable cost optimization for budget-conscious applications
- Use appropriate models for different task complexities
- Monitor token usage and costs

### 5. Performance Monitoring
- Enable health checks for production deployments
- Monitor routing performance and provider metrics
- Set up alerting for provider failures

## Examples

See `example.js` for comprehensive usage examples including:

- Basic provider setup and usage
- Role-based routing demonstrations
- Structured object generation
- Streaming responses
- Health monitoring
- Custom configurations
- Analytics and metrics

## API Reference

### ProviderRegistry

| Method | Description |
|--------|-------------|
| `autoRegisterProviders()` | Auto-register providers based on environment |
| `registerProvider(name, config)` | Register a specific provider |
| `generateText(params)` | Generate text using intelligent routing |
| `generateObject(params)` | Generate structured objects |
| `streamText(params)` | Stream text responses |
| `getStatus()` | Get registry status and metrics |

### RoleBasedRouter

| Method | Description |
|--------|-------------|
| `routeRequest(params)` | Route request to optimal provider |
| `addRoutingRule(role, rule)` | Add custom routing rule |
| `getRoutingStats()` | Get routing performance statistics |

### BaseAIProvider

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize provider connection |
| `generateText(params)` | Generate text response |
| `generateObject(params)` | Generate structured object |
| `streamText(params)` | Stream text response |
| `testConnection()` | Test provider availability |
| `getCapabilities()` | Get provider capabilities |

## Contributing

To add a new AI provider:

1. Extend `BaseAIProvider`
2. Implement required abstract methods
3. Add provider registration to `ProviderRegistry`
4. Update routing rules as needed
5. Add comprehensive tests

## Troubleshooting

### Common Issues

**Provider not registered automatically**
- Check environment variables are set correctly
- Verify API key format and validity
- Check provider initialization logs

**High latency or timeouts**  
- Adjust timeout settings in provider configuration
- Enable health monitoring to detect slow providers
- Use fallback providers for better availability

**Cost concerns**
- Enable cost optimization in router settings
- Use appropriate models for task complexity
- Monitor token usage and set cost thresholds

**Rate limiting**
- Implement retry logic with exponential backoff
- Use multiple providers to distribute load
- Configure appropriate rate limits

For more detailed troubleshooting, check the provider logs and health monitoring events.

## License

Part of the Super Agents Framework - see main project license.