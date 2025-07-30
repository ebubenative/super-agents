import { jest } from '@jest/globals';

export class MockTaskManager {
  constructor() {
    this.tasks = new Map();
    this.dependencies = new Map();
    this.state = {
      currentTask: null,
      workflowStatus: 'idle'
    };
    
    // Mock methods
    this.createTask = jest.fn();
    this.updateTask = jest.fn();
    this.deleteTask = jest.fn();
    this.getTask = jest.fn();
    this.listTasks = jest.fn();
    this.updateTaskStatus = jest.fn();
    this.addDependency = jest.fn();
    this.removeDependency = jest.fn();
    this.validateDependencies = jest.fn();
    this.generateDependencyGraph = jest.fn();
  }

  reset() {
    this.tasks.clear();
    this.dependencies.clear();
    this.state = {
      currentTask: null,
      workflowStatus: 'idle'
    };
    jest.clearAllMocks();
  }
}

export class MockStateManager {
  constructor() {
    this.state = {};
    this.saveState = jest.fn();
    this.loadState = jest.fn();
    this.clearState = jest.fn();
  }

  reset() {
    this.state = {};
    jest.clearAllMocks();
  }
}

export class MockTemplateEngine {
  constructor() {
    this.templates = new Map();
    this.renderTemplate = jest.fn();
    this.loadTemplate = jest.fn();
    this.validateTemplate = jest.fn();
  }

  reset() {
    this.templates.clear();
    jest.clearAllMocks();
  }
}

export function createMockAPIResponse(data, success = true) {
  return {
    success,
    data: success ? data : null,
    error: success ? null : data,
    timestamp: new Date().toISOString(),
    executionTime: Math.random() * 1000
  };
}

export function createMockTask(overrides = {}) {
  return {
    id: 'mock-task-' + Math.random().toString(36).substr(2, 9),
    title: 'Mock Task',
    description: 'Mock task description',
    status: 'pending',
    priority: 'medium',
    assignee: 'test-agent',
    dependencies: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function expectValidToolResult(result) {
  expect(result).toBeDefined();
  expect(typeof result).toBe('object');
  expect(result.success).toBeDefined();
  expect(typeof result.success).toBe('boolean');
  
  if (result.success) {
    expect(result.data).toBeDefined();
  } else {
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  }
}

export function createTestTimeout(ms = 5000) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Test timeout')), ms);
  });
}
