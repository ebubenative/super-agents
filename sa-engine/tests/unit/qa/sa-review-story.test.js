import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SaReviewStoryTool } from '../../../mcp-server/tools/qa/sa-review-story.js';
import { MockTaskManager } from '../../helpers/test-utils.js';
import { mockToolData } from '../../fixtures/mock-data.js';

describe('SaReviewStoryTool', () => {
  let tool;
  let mockTaskManager;

  beforeEach(() => {
    mockTaskManager = new MockTaskManager();
    tool = new SaReviewStoryTool(mockTaskManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with task manager', () => {
      expect(tool.taskManager).toBe(mockTaskManager);
      expect(tool.name).toBe('sa-review-story');
    });
  });

  describe('validate method', () => {
    it('should validate required parameters', async () => {
      const result = await tool.validate({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should pass validation with valid parameters', async () => {
      const validParams = mockToolData.qa.sa_review_story.validParams;
      const result = await tool.validate(validParams);
      expect(result.isValid).toBe(true);
    });
  });

  describe('execute method', () => {
    it('should execute successfully with valid parameters', async () => {
      const validParams = mockToolData.qa.sa_review_story.validParams;
      const result = await tool.execute(validParams);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const invalidParams = mockToolData.qa.sa_review_story.invalidParams;
      const result = await tool.execute(invalidParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track execution metrics', async () => {
      const validParams = mockToolData.qa.sa_review_story.validParams;
      const startTime = Date.now();
      
      await tool.execute(validParams);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Performance requirement
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      jest.spyOn(tool, 'makeAPICall').mockRejectedValue(new Error('Network error'));
      
      const result = await tool.execute(mockToolData.qa.sa_review_story.validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle timeout errors', async () => {
      jest.spyOn(tool, 'makeAPICall').mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      const result = await tool.execute(mockToolData.qa.sa_review_story.validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('integration with task manager', () => {
    it('should update task status correctly', async () => {
      const validParams = mockToolData.qa.sa_review_story.validParams;
      
      await tool.execute(validParams);
      
      expect(mockTaskManager.updateTaskStatus).toHaveBeenCalled();
    });

    it('should handle task manager errors', async () => {
      jest.spyOn(mockTaskManager, 'updateTaskStatus').mockRejectedValue(new Error('Task manager error'));
      
      const result = await tool.execute(mockToolData.qa.sa_review_story.validParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task manager error');
    });
  });
});
