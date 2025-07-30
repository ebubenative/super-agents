/**
 * Mock data and test fixtures for Super Agents MCP tests
 */

// Sample task data structures
export const mockTasks = {
  simpleTask: {
    id: 'task-001',
    title: 'Implement user authentication',
    description: 'Create login and registration functionality',
    status: 'pending',
    priority: 'high',
    assignee: 'developer',
    estimatedHours: 8,
    tags: ['backend', 'security'],
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T10:00:00Z').toISOString()
  },
  
  complexTask: {
    id: 'task-002',
    title: 'Build analytics dashboard',
    description: 'Create comprehensive dashboard with charts and metrics',
    status: 'in_progress',
    priority: 'medium',
    assignee: 'developer',
    estimatedHours: 24,
    dependencies: ['task-001'],
    subtasks: [
      {
        id: 'subtask-001',
        title: 'Design dashboard layout',
        status: 'completed',
        estimatedHours: 4
      },
      {
        id: 'subtask-002',
        title: 'Implement charts',
        status: 'in_progress',
        estimatedHours: 12
      }
    ],
    tags: ['frontend', 'analytics'],
    createdAt: new Date('2024-01-02T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-02T14:30:00Z').toISOString()
  },

  epicTask: {
    id: 'epic-001',
    title: 'E-commerce Platform',
    description: 'Complete e-commerce solution with cart, payments, and admin',
    type: 'epic',
    status: 'planning',
    priority: 'high',
    estimatedHours: 160,
    stories: [
      {
        id: 'story-001',
        title: 'Product catalog',
        status: 'pending',
        estimatedHours: 40
      },
      {
        id: 'story-002',
        title: 'Shopping cart',
        status: 'pending',
        estimatedHours: 32
      }
    ],
    tags: ['epic', 'ecommerce'],
    createdAt: new Date('2024-01-01T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-01T08:00:00Z').toISOString()
  }
};

// Sample PRD (Product Requirements Document)
export const mockPRD = {
  simple: `
# Product Requirements Document: Task Management System

## Overview
A simple task management system for teams to track and manage their work.

## Features
1. Task Creation and Management
   - Create, edit, and delete tasks
   - Assign tasks to team members
   - Set priorities and due dates

2. Task Organization
   - Categorize tasks with tags
   - Create task dependencies
   - Filter and search tasks

## Acceptance Criteria
- Users can create tasks with title, description, priority
- Tasks can be assigned to team members
- Task status can be updated (pending, in_progress, completed)
- Users can view all tasks in a list format
`,
  
  complex: `
# Product Requirements Document: E-commerce Platform

## Executive Summary
Build a comprehensive e-commerce platform with modern features for both customers and administrators.

## Core Features

### Customer Features
1. Product Catalog
   - Browse products by category
   - Search and filter functionality
   - Product details with images and reviews

2. Shopping Experience
   - Shopping cart functionality
   - Checkout process with payment integration
   - Order tracking and history

3. User Management
   - User registration and authentication
   - Profile management
   - Wishlist functionality

### Admin Features
1. Product Management
   - Add, edit, and remove products
   - Inventory management
   - Category management

2. Order Management
   - View and process orders
   - Update order status
   - Generate reports

## Technical Requirements
- Responsive web design
- Payment gateway integration (Stripe, PayPal)
- Email notifications
- Search functionality
- Performance optimization for large product catalogs

## Acceptance Criteria
- All user stories must have automated tests
- Site must load within 3 seconds
- Mobile-responsive design required
- Security audit passed
`
};

// Sample AI provider responses
export const mockAIResponses = {  
  taskAnalysis: {
    complexity: 'medium',
    estimatedHours: 16,
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
    risks: ['API integration complexity', 'Performance with large datasets'],
    recommendations: [
      'Break down into smaller subtasks',
      'Set up proper error handling',
      'Add comprehensive testing'
    ]
  },
  
  taskGeneration: [
    {
      title: 'Set up project structure',
      description: 'Initialize project with proper folder structure and dependencies',
      priority: 'high',
      estimatedHours: 4,
      tags: ['setup', 'infrastructure']
    },
    {
      title: 'Implement user authentication',
      description: 'Create login/logout functionality with JWT tokens',
      priority: 'high',
      estimatedHours: 8,
      tags: ['backend', 'security'],
      dependencies: ['Set up project structure']
    },
    {
      title: 'Build user dashboard',
      description: 'Create main dashboard interface for logged-in users',
      priority: 'medium',
      estimatedHours: 12,
      tags: ['frontend', 'ui'],
      dependencies: ['Implement user authentication']
    }
  ],

  codeReview: {
    overall_rating: 8,
    issues: [
      {
        type: 'warning',
        file: 'src/auth.js',
        line: 23,
        message: 'Consider adding input validation',
        suggestion: 'Add joi or yup validation schema'
      },
      {
        type: 'error',
        file: 'src/database.js',
        line: 45,
        message: 'SQL injection vulnerability',
        suggestion: 'Use parameterized queries'
      }
    ],
    suggestions: [
      'Add more unit tests for edge cases',
      'Consider implementing rate limiting',
      'Add API documentation with OpenAPI'
    ]
  }
};

// Sample project configurations
export const mockProjectConfig = {
  basic: {
    name: 'Test Project',
    type: 'web-app',
    framework: 'react',
    backend: 'node.js',
    database: 'postgresql',
    testing: 'jest',
    deployment: 'vercel'
  },
  
  complex: {
    name: 'Enterprise Platform',
    type: 'microservices',
    services: [
      {
        name: 'user-service',
        framework: 'express',
        database: 'postgresql'
      },
      {
        name: 'product-service', 
        framework: 'fastify',
        database: 'mongodb'
      },
      {
        name: 'frontend',
        framework: 'next.js',
        styling: 'tailwind'
      }
    ],
    infrastructure: {
      containerization: 'docker',
      orchestration: 'kubernetes',
      monitoring: 'prometheus',
      logging: 'elk-stack'
    }
  }
};

// Sample workflow definitions
export const mockWorkflows = {
  basic: {
    id: 'workflow-001',
    name: 'Feature Development',
    type: 'development',
    stages: [
      {
        name: 'planning',
        status: 'completed',
        tasks: ['Create PRD', 'Break down requirements']
      },
      {
        name: 'development',
        status: 'in_progress',
        tasks: ['Implement features', 'Write tests']
      },
      {
        name: 'review',
        status: 'pending',
        tasks: ['Code review', 'QA testing']
      }
    ],
    progress: 0.4,
    assignedAgents: ['pm', 'developer', 'qa']
  },

  agile: {
    id: 'workflow-002',
    name: 'Agile Sprint',
    type: 'agile',
    sprintNumber: 5,
    stages: [
      {
        name: 'sprint_planning',
        status: 'completed',
        tasks: ['Story estimation', 'Sprint backlog creation']
      },
      {
        name: 'development',
        status: 'in_progress',
        tasks: ['Daily standups', 'Feature implementation'],
        dailyProgress: [
          { date: '2024-01-15', completed: 2, remaining: 8 },
          { date: '2024-01-16', completed: 4, remaining: 6 }
        ]
      },
      {
        name: 'review',
        status: 'pending',
        tasks: ['Sprint review', 'Retrospective']
      }
    ],
    burndownChart: {
      planned: [10, 8, 6, 4, 2, 0],
      actual: [10, 9, 6, 5, 3, 1]
    }
  }
};

// Error scenarios for testing
export const mockErrors = {
  networkError: new Error('Network request failed'),
  validationError: new Error('Invalid input parameters'),
  authenticationError: new Error('Authentication failed'),
  notFoundError: new Error('Resource not found'),
  permissionError: new Error('Insufficient permissions'),
  timeoutError: new Error('Request timeout'),
  serverError: new Error('Internal server error')
};

// Test file system structure
export const mockFileSystem = {
  'package.json': JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
    dependencies: {
      'react': '^18.0.0',
      'express': '^4.18.0'
    }
  }),
  'src/': {
    'index.js': 'console.log("Hello World");',
    'components/': {
      'Header.jsx': 'export const Header = () => <h1>Header</h1>;',
      'Footer.jsx': 'export const Footer = () => <footer>Footer</footer>;'
    },
    'utils/': {
      'helpers.js': 'export const formatDate = (date) => date.toISOString();'
    }
  },
  'tests/': {
    'Header.test.js': 'test("renders header", () => {});'
  }
};

// Performance metrics for benchmarking
export const mockPerformanceMetrics = {
  toolExecutionTimes: {
    'sa-parse-prd': { min: 150, max: 500, avg: 280 },
    'sa-expand-task': { min: 100, max: 300, avg: 180 },
    'sa-analyze-complexity': { min: 200, max: 800, avg: 400 },
    'sa-generate-tasks': { min: 300, max: 1200, avg: 650 }
  },
  
  memoryUsage: {
    baseline: 45,
    afterToolLoad: 52,
    afterExecution: 58,
    afterCleanup: 46
  },
  
  concurrentExecutions: {
    maxConcurrent: 10,
    avgResponseTime: 320,
    errorRate: 0.02
  }
};

export default {
  mockTasks,
  mockPRD,
  mockAIResponses,
  mockProjectConfig,
  mockWorkflows,
  mockErrors,
  mockFileSystem,
  mockPerformanceMetrics
};