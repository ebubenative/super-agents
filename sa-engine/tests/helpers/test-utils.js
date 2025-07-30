/**
 * Test utilities and helpers for Super Agents MCP tests
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mockFs from 'mock-fs';
import tmp from 'tmp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a mock MCP tool for testing
 */
export function createMockTool(name, options = {}) {
  return {
    name,
    description: options.description || `Mock tool: ${name}`,
    inputSchema: options.inputSchema || {
      type: 'object',
      properties: {
        input: { type: 'string' }
      }
    },
    execute: jest.fn().mockImplementation(options.execute || (async (args) => ({
      content: [{
        type: 'text',
        text: `Mock execution result for ${name}`
      }]
    }))),
    validate: options.validate,
    category: options.category || 'test',
    version: options.version || '1.0.0',
    enabled: options.enabled !== false
  };
}

/**
 * Create mock MCP server for testing
 */
export function createMockMCPServer(options = {}) {
  const server = {
    tools: new Map(),
    isConnected: false,
    
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    
    registerTool: jest.fn().mockImplementation((tool) => {
      server.tools.set(tool.name, tool);
      return Promise.resolve(true);
    }),
    
    unregisterTool: jest.fn().mockImplementation((toolName) => {
      server.tools.delete(toolName);
      return Promise.resolve(true);
    }),
    
    listTools: jest.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(server.tools.values()));
    }),
    
    callTool: jest.fn().mockImplementation(async (toolName, args) => {
      const tool = server.tools.get(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }
      return tool.execute(args);
    }),
    
    ...options
  };
  
  return server;
}

/**
 * Create mock task manager for testing
 */
export function createMockTaskManager(options = {}) {
  const tasks = new Map();
  
  return {
    tasks,
    
    createTask: jest.fn().mockImplementation((task) => {
      const taskWithId = { id: `task-${Date.now()}`, ...task };
      tasks.set(taskWithId.id, taskWithId);
      return Promise.resolve(taskWithId);
    }),
    
    getTask: jest.fn().mockImplementation((id) => {
      return Promise.resolve(tasks.get(id) || null);
    }),
    
    updateTask: jest.fn().mockImplementation((id, updates) => {
      const task = tasks.get(id);
      if (task) {
        const updatedTask = { ...task, ...updates };
        tasks.set(id, updatedTask);
        return Promise.resolve(updatedTask);
      }
      return Promise.resolve(null);
    }),
    
    deleteTask: jest.fn().mockImplementation((id) => {
      const deleted = tasks.delete(id);
      return Promise.resolve(deleted);
    }),
    
    listTasks: jest.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(tasks.values()));
    }),
    
    ...options
  };
}

/**
 * Create mock state manager for testing
 */
export function createMockStateManager(options = {}) {
  const state = new Map();
  
  return {
    state,
    
    get: jest.fn().mockImplementation((key) => {
      return Promise.resolve(state.get(key));
    }),
    
    set: jest.fn().mockImplementation((key, value) => {
      state.set(key, value);
      return Promise.resolve(true);
    }),
    
    delete: jest.fn().mockImplementation((key) => {
      const deleted = state.delete(key);
      return Promise.resolve(deleted);
    }),
    
    clear: jest.fn().mockImplementation(() => {
      state.clear();
      return Promise.resolve(true);
    }),
    
    keys: jest.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(state.keys()));
    }),
    
    ...options
  };
}

/**
 * Create mock AI provider for testing
 */
export function createMockAIProvider(options = {}) {
  return {
    name: options.name || 'mock-ai',
    
    generate: jest.fn().mockImplementation(async (prompt) => {
      return {
        text: options.mockResponse || 'Mock AI response',
        usage: { tokens: 100 },
        model: 'mock-model'
      };
    }),
    
    chat: jest.fn().mockImplementation(async (messages) => {
      return {
        message: { content: options.mockResponse || 'Mock AI response' },
        usage: { tokens: 100 },
        model: 'mock-model'
      };
    }),
    
    ...options
  };
}

/**
 * Setup mock file system for testing
 */
export function setupMockFileSystem(structure = {}) {
  mockFs(structure);
  
  return {
    cleanup: () => mockFs.restore()
  };
}

/**
 * Create temporary directory for testing
 */
export async function createTempDir() {
  return new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
      if (err) {
        reject(err);
      } else {
        resolve({ path, cleanup: cleanupCallback });
      }
    });
  });
}

/**
 * Wait for a condition to be true
 */
export function waitFor(condition, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime(fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  
  return {
    result,
    executionTime: Number(end - start) / 1000000 // Convert to milliseconds
  };
}

/**
 * Assert that a function throws a specific error
 */
export async function expectError(fn, expectedError) {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (expectedError instanceof RegExp) {
      expect(error.message).toMatch(expectedError);
    } else if (typeof expectedError === 'string') {
      expect(error.message).toContain(expectedError);
    } else {
      expect(error).toBeInstanceOf(expectedError);
    }
  }
}

/**
 * Create a mock event emitter for testing
 */
export function createMockEventEmitter() {
  const listeners = new Map();
  
  return {
    on: jest.fn().mockImplementation((event, callback) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(callback);
    }),
    
    emit: jest.fn().mockImplementation((event, ...args) => {
      const eventListeners = listeners.get(event) || [];
      eventListeners.forEach(callback => callback(...args));
    }),
    
    off: jest.fn().mockImplementation((event, callback) => {
      const eventListeners = listeners.get(event) || [];
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }),
    
    removeAllListeners: jest.fn().mockImplementation((event) => {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    })
  };
}

/**
 * Deep clone an object for testing
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate random test data
 */
export function generateRandomId() {
  return `test-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRandomString(length = 10) {
  return Math.random().toString(36).substr(2, length);
}

export function generateRandomNumber(min = 0, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulate network delay for testing
 */
export function simulateNetworkDelay(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate JSON schema
 */
export function validateSchema(data, schema) {
  // Simple schema validation for testing
  // In production, use a proper JSON schema validator like ajv
  
  if (schema.type === 'object' && typeof data !== 'object') {
    return { valid: false, errors: ['Expected object'] };
  }
  
  if (schema.properties) {
    const errors = [];
    
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (schema.required?.includes(key) && !(key in data)) {
        errors.push(`Missing required property: ${key}`);
      }
      
      if (key in data && propSchema.type && typeof data[key] !== propSchema.type) {
        errors.push(`Property ${key} should be of type ${propSchema.type}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  return { valid: true, errors: [] };
}

export default {
  createMockTool,
  createMockMCPServer,
  createMockTaskManager,
  createMockStateManager,
  createMockAIProvider,
  setupMockFileSystem,
  createTempDir,
  waitFor,
  measureExecutionTime,
  expectError,
  createMockEventEmitter,
  deepClone,
  generateRandomId,
  generateRandomString,
  generateRandomNumber,
  simulateNetworkDelay,
  validateSchema
};