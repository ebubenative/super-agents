/**
 * Global test setup for Super Agents MCP tests
 */

import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up global test environment
global.__dirname = __dirname;
global.__filename = __filename;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.SA_TEST_MODE = 'true';
process.env.SA_LOG_LEVEL = 'error'; // Minimize logging during tests