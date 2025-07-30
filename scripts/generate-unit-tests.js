#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_DIR = path.join(__dirname, '../sa-engine/mcp-server/tools');
const TESTS_DIR = path.join(__dirname, '../sa-engine/tests/unit');

const TOOL_CATEGORIES = [
  'core',
  'analyst', 
  'architect',
  'dependencies',
  'developer',
  'pm',
  'product-owner',
  'qa',
  'scrum-master',
  'task-master',
  'ux-expert',
  'workflow'
];

async function generateTestTemplate(toolName, category, toolPath) {
  const className = toolName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') + 'Tool';

  const testTemplate = `import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ${className} } from '../../../mcp-server/tools/${category}/${toolName}.js';
import { MockTaskManager } from '../../helpers/test-utils.js';
import { mockToolData } from '../../fixtures/mock-data.js';

describe('${className}', () => {
  let tool;
  let mockTaskManager;

  beforeEach(() => {
    mockTaskManager = new MockTaskManager();
    tool = new ${className}(mockTaskManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with task manager', () => {
      expect(tool.taskManager).toBe(mockTaskManager);
      expect(tool.name).toBe('${toolName}');
    });
  });

  describe('validate method', () => {
    it('should validate required parameters', async () => {
      const result = await tool.validate({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should pass validation with valid parameters', async () => {
      const validParams = mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams;
      const result = await tool.validate(validParams);
      expect(result.isValid).toBe(true);
    });
  });

  describe('execute method', () => {
    it('should execute successfully with valid parameters', async () => {
      const validParams = mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams;
      const result = await tool.execute(validParams);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const invalidParams = mockToolData.${category}.${toolName.replace(/-/g, '_')}.invalidParams;
      const result = await tool.execute(invalidParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track execution metrics', async () => {
      const validParams = mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams;
      const startTime = Date.now();
      
      await tool.execute(validParams);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Performance requirement
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      jest.spyOn(tool, 'makeAPICall').mockRejectedValue(new Error('Network error'));
      
      const result = await tool.execute(mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle timeout errors', async () => {
      jest.spyOn(tool, 'makeAPICall').mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      const result = await tool.execute(mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('integration with task manager', () => {
    it('should update task status correctly', async () => {
      const validParams = mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams;
      
      await tool.execute(validParams);
      
      expect(mockTaskManager.updateTaskStatus).toHaveBeenCalled();
    });

    it('should handle task manager errors', async () => {
      jest.spyOn(mockTaskManager, 'updateTaskStatus').mockRejectedValue(new Error('Task manager error'));
      
      const result = await tool.execute(mockToolData.${category}.${toolName.replace(/-/g, '_')}.validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task manager error');
    });
  });
});
`;

  return testTemplate;
}

async function updateMockData() {
  const mockDataPath = path.join(TESTS_DIR, 'fixtures/mock-data.js');
  
  let mockDataContent = `export const mockToolData = {\n`;
  
  for (const category of TOOL_CATEGORIES) {
    const categoryPath = path.join(TOOLS_DIR, category);
    
    try {
      const files = await fs.readdir(categoryPath);
      const toolFiles = files.filter(file => file.endsWith('.js'));
      
      mockDataContent += `  ${category}: {\n`;
      
      for (const file of toolFiles) {
        const toolName = file.replace('.js', '');
        const toolKey = toolName.replace(/-/g, '_');
        
        mockDataContent += `    ${toolKey}: {
      validParams: {
        // TODO: Add valid parameters for ${toolName}
        id: 'test-id-123',
        name: 'Test Task',
        description: 'Test description'
      },
      invalidParams: {
        // TODO: Add invalid parameters for ${toolName}
      },
      expectedResult: {
        success: true,
        data: {
          // TODO: Add expected result structure for ${toolName}
        }
      }
    },\n`;
      }
      
      mockDataContent += `  },\n`;
    } catch (error) {
      console.log(`Category ${category} not found, skipping...`);
    }
  }
  
  mockDataContent += `};\n\nexport const mockAgentData = {
  analyst: {
    capabilities: ['market-research', 'competitive-analysis', 'brainstorming'],
    tools: ['sa-brainstorm-session', 'sa-competitor-analysis', 'sa-create-brief', 'sa-research-market']
  },
  architect: {
    capabilities: ['system-design', 'technology-recommendations', 'architecture-analysis'],
    tools: ['sa-analyze-brownfield', 'sa-create-architecture', 'sa-design-system', 'sa-tech-recommendations']
  },
  developer: {
    capabilities: ['implementation', 'testing', 'debugging', 'validation'],
    tools: ['sa-debug-issue', 'sa-implement-story', 'sa-run-tests', 'sa-validate-implementation']
  }
};
`;

  await fs.writeFile(mockDataPath, mockDataContent);
}

async function updateTestUtils() {
  const testUtilsPath = path.join(TESTS_DIR, 'helpers/test-utils.js');
  
  const testUtilsContent = `import { jest } from '@jest/globals';

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
`;

  await fs.writeFile(testUtilsPath, testUtilsContent);
}

async function generateAllTests() {
  console.log('🚀 Generating comprehensive test suite...\n');
  
  // Create directories
  for (const category of TOOL_CATEGORIES) {
    const categoryTestDir = path.join(TESTS_DIR, category);
    await fs.mkdir(categoryTestDir, { recursive: true });
  }
  
  // Create fixtures and helpers directories
  await fs.mkdir(path.join(TESTS_DIR, 'fixtures'), { recursive: true });
  await fs.mkdir(path.join(TESTS_DIR, 'helpers'), { recursive: true });
  
  let totalTests = 0;
  
  // Generate tests for each category
  for (const category of TOOL_CATEGORIES) {
    const categoryPath = path.join(TOOLS_DIR, category);
    
    try {
      const files = await fs.readdir(categoryPath);
      const toolFiles = files.filter(file => file.endsWith('.js'));
      
      console.log(`📁 Processing ${category} category (${toolFiles.length} tools):`);
      
      for (const file of toolFiles) {
        const toolName = file.replace('.js', '');
        const testContent = await generateTestTemplate(toolName, category, path.join(categoryPath, file));
        const testPath = path.join(TESTS_DIR, category, `${toolName}.test.js`);
        
        await fs.writeFile(testPath, testContent);
        console.log(`   ✅ Generated test: ${toolName}.test.js`);
        totalTests++;
      }
      
      console.log('');
    } catch (error) {
      console.log(`   ⚠️  Category ${category} not found, skipping...`);
    }
  }
  
  // Update mock data and test utilities
  console.log('📝 Updating mock data and test utilities...');
  await updateMockData();
  await updateTestUtils();
  
  console.log(`\n🎉 Test generation complete!`);
  console.log(`   Generated ${totalTests} unit test files`);
  console.log(`   Updated mock data and test utilities`);
  console.log(`\nNext steps:`);
  console.log(`   1. cd sa-engine/tests`);
  console.log(`   2. npm install`);
  console.log(`   3. npm run test:unit`);
}

// Run the generator
generateAllTests().catch(console.error);