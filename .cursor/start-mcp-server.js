#!/usr/bin/env node

/**
 * Super Agents MCP Server Startup Script for Cursor
 * This script starts the MCP server with Cursor-specific optimizations
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROJECT_ROOT = process.env.SA_PROJECT_ROOT || join(__dirname, '..');
const MCP_SERVER_PATH = join(PROJECT_ROOT, 'sa-engine', 'mcp-server', 'index.js');

console.log('🚀 Starting Super Agents MCP Server for Cursor...');
console.log('Project Root:', PROJECT_ROOT);
console.log('MCP Server Path:', MCP_SERVER_PATH);

// Set environment variables for Cursor integration
process.env.SA_IDE = 'cursor';
process.env.SA_LOG_LEVEL = process.env.SA_LOG_LEVEL || 'info';

// Start MCP server
const mcpServer = spawn('node', [MCP_SERVER_PATH], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SA_PROJECT_ROOT: PROJECT_ROOT,
    SA_IDE: 'cursor'
  }
});

mcpServer.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error.message);
  process.exit(1);
});

mcpServer.on('close', (code) => {
  console.log(`🔄 MCP server exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP server...');
  mcpServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down MCP server...');
  mcpServer.kill('SIGTERM');
});
