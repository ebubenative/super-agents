import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import TaskManager from '../../../tasks/TaskManager.js';
import TemplateEngine from '../../../templates/TemplateEngine.js';

/**
 * sa_initialize_project MCP Tool
 * Initializes a new Super Agents project with templates and configuration
 */
export const saInitializeProject = {
  name: 'sa_initialize_project',
  description: 'Initialize a new Super Agents project with templates, configuration, and initial task setup',
  category: 'project',
  version: '1.0.0',
  enabled: true,
  
  inputSchema: {
    type: 'object',
    properties: {
      projectName: {
        type: 'string',
        description: 'Name of the project to initialize',
        minLength: 1
      },
      projectPath: {
        type: 'string',
        description: 'Path where the project should be created',
        default: process.cwd()
      },
      template: {
        type: 'string',
        description: 'Project template to use (optional)',
        enum: ['basic', 'full-stack', 'api', 'frontend', 'library'],
        default: 'basic'
      },
      description: {
        type: 'string',
        description: 'Project description (optional)'
      },
      author: {
        type: 'string',
        description: 'Project author (optional)'
      },
      license: {
        type: 'string',
        description: 'Project license (optional)',
        default: 'MIT'
      },
      createTasks: {
        type: 'boolean',
        description: 'Create initial project tasks',
        default: true
      },
      createDocs: {
        type: 'boolean',
        description: 'Generate initial documentation',
        default: true
      }
    },
    required: ['projectName']
  },

  /**
   * Validate tool arguments
   * @param {Object} args - Tool arguments
   * @returns {Object} Validation result
   */
  validate(args) {
    const errors = [];
    
    if (!args.projectName || typeof args.projectName !== 'string') {
      errors.push('projectName is required and must be a string');
    }
    
    if (args.projectName && args.projectName.length === 0) {
      errors.push('projectName cannot be empty');
    }
    
    if (args.projectPath && typeof args.projectPath !== 'string') {
      errors.push('projectPath must be a string');
    }
    
    if (args.template && !['basic', 'full-stack', 'api', 'frontend', 'library'].includes(args.template)) {
      errors.push('template must be one of: basic, full-stack, api, frontend, library');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Execute the project initialization
   * @param {Object} args - Tool arguments
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async execute(args, context) {
    const startTime = Date.now();
    const projectName = args.projectName;
    const projectPath = args.projectPath || process.cwd();
    const fullProjectPath = join(projectPath, projectName);
    
    try {
      // Check if project directory already exists
      if (existsSync(fullProjectPath)) {
        throw new Error(`Project directory already exists: ${fullProjectPath}`);
      }

      const result = {
        projectName,
        projectPath: fullProjectPath,
        template: args.template || 'basic',
        createdFiles: [],
        createdTasks: [],
        errors: [],
        warnings: []
      };

      // Create project directory structure
      await this.createProjectStructure(fullProjectPath, result);
      
      // Generate project configuration
      await this.createProjectConfiguration(fullProjectPath, args, result);
      
      // Initialize Super Agents components
      await this.initializeSuperAgentsComponents(fullProjectPath, args, result);
      
      // Create initial tasks if requested
      if (args.createTasks) {
        await this.createInitialTasks(fullProjectPath, args, result);
      }
      
      // Generate documentation if requested
      if (args.createDocs) {
        await this.generateInitialDocumentation(fullProjectPath, args, result);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Project '${projectName}' initialized successfully!\n\n` +
                  `📁 Location: ${fullProjectPath}\n` +
                  `📋 Template: ${result.template}\n` +
                  `📄 Files created: ${result.createdFiles.length}\n` +
                  `📝 Tasks created: ${result.createdTasks.length}\n` +
                  `⏱️  Duration: ${duration}ms\n\n` +
                  `Next steps:\n` +
                  `1. cd ${projectName}\n` +
                  `2. Review the generated files and tasks\n` +
                  `3. Run 'sa task list' to see your project tasks\n` +
                  `4. Start developing with 'sa task show <task-id>'`
          }
        ],
        metadata: {
          projectName,
          projectPath: fullProjectPath,
          template: result.template,
          filesCreated: result.createdFiles.length,
          tasksCreated: result.createdTasks.length,
          duration,
          warnings: result.warnings,
          errors: result.errors
        }
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to initialize project '${projectName}': ${error.message}`
          }
        ],
        isError: true,
        metadata: {
          error: error.message,
          projectName,
          projectPath: fullProjectPath
        }
      };
    }
  },

  /**
   * Create project directory structure
   * @param {string} projectPath - Full project path
   * @param {Object} result - Result object to update
   */
  async createProjectStructure(projectPath, result) {
    const directories = [
      'src',
      'docs',
      'tests',
      'config',
      '.super-agents',
      '.super-agents/tasks',
      '.super-agents/templates',
      '.super-agents/procedures'
    ];
    
    // Create main project directory
    mkdirSync(projectPath, { recursive: true });
    
    // Create subdirectories
    directories.forEach(dir => {
      const dirPath = join(projectPath, dir);
      mkdirSync(dirPath, { recursive: true });
    });
    
    result.createdFiles.push(...directories.map(dir => join(projectPath, dir)));
  },

  /**
   * Create project configuration files
   * @param {string} projectPath - Full project path
   * @param {Object} args - Tool arguments
   * @param {Object} result - Result object to update
   */
  async createProjectConfiguration(projectPath, args, result) {
    // Create package.json
    const packageJson = {
      name: args.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: args.description || `${args.projectName} - Super Agents Project`,
      main: 'src/index.js',
      scripts: {
        start: 'node src/index.js',
        test: 'npm test',
        dev: 'node --watch src/index.js'
      },
      author: args.author || '',
      license: args.license || 'MIT',
      superAgents: {
        template: args.template,
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    const packageJsonPath = join(projectPath, 'package.json');
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    result.createdFiles.push(packageJsonPath);
    
    // Create .gitignore
    const gitignore = `node_modules/
.env
.env.local
*.log
.DS_Store
dist/
build/
.super-agents/state.json
.super-agents/backups/
`;
    
    const gitignorePath = join(projectPath, '.gitignore');
    await writeFile(gitignorePath, gitignore);
    result.createdFiles.push(gitignorePath);
    
    // Create README.md
    const readme = `# ${args.projectName}

${args.description || 'A Super Agents powered project'}

## Getting Started

This project was initialized with Super Agents framework.

### Available Commands

- \`sa task list\` - List all project tasks
- \`sa task show <id>\` - Show task details
- \`sa task create\` - Create a new task
- \`sa template list\` - List available templates
- \`sa procedure run <name>\` - Run a procedure

### Project Structure

- \`src/\` - Source code
- \`docs/\` - Documentation
- \`tests/\` - Test files
- \`config/\` - Configuration files
- \`.super-agents/\` - Super Agents project data

## License

${args.license || 'MIT'}
`;
    
    const readmePath = join(projectPath, 'README.md');
    await writeFile(readmePath, readme);
    result.createdFiles.push(readmePath);
  },

  /**
   * Initialize Super Agents specific components
   * @param {string} projectPath - Full project path
   * @param {Object} args - Tool arguments
   * @param {Object} result - Result object to update
   */
  async initializeSuperAgentsComponents(projectPath, args, result) {
    // Create Super Agents config
    const saConfig = {
      projectName: args.projectName,
      template: args.template || 'basic',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      taskManager: {
        dataPath: '.super-agents/tasks',
        autoBackup: true,
        maxBackups: 10
      },
      templateEngine: {
        templatesPath: '.super-agents/templates',
        enableInheritance: true,
        enableCaching: true
      },
      procedureRunner: {
        proceduresPath: '.super-agents/procedures',
        enableLogging: true,
        autoSave: true
      }
    };
    
    const configPath = join(projectPath, '.super-agents', 'config.json');
    await writeFile(configPath, JSON.stringify(saConfig, null, 2));
    result.createdFiles.push(configPath);
    
    // Create initial task storage
    const tasksPath = join(projectPath, '.super-agents', 'tasks.json');
    const initialTasks = {
      tasks: [],
      lastId: 0,
      created: new Date().toISOString()
    };
    
    await writeFile(tasksPath, JSON.stringify(initialTasks, null, 2));
    result.createdFiles.push(tasksPath);
  },

  /**
   * Create initial project tasks
   * @param {string} projectPath - Full project path
   * @param {Object} args - Tool arguments
   * @param {Object} result - Result object to update
   */
  async createInitialTasks(projectPath, args, result) {
    try {
      const taskManager = new TaskManager({
        dataPath: join(projectPath, '.super-agents', 'tasks.json')
      });
      
      await taskManager.initialize();
      
      // Create initial tasks based on template
      const initialTasks = this.getInitialTasksForTemplate(args.template || 'basic', args);
      
      for (const taskData of initialTasks) {
        const task = await taskManager.createTask(taskData);
        result.createdTasks.push({
          id: task.id,
          title: task.title,
          status: task.status
        });
      }
      
    } catch (error) {
      result.warnings.push(`Failed to create initial tasks: ${error.message}`);
    }
  },

  /**
   * Generate initial documentation
   * @param {string} projectPath - Full project path
   * @param {Object} args - Tool arguments
   * @param {Object} result - Result object to update
   */
  async generateInitialDocumentation(projectPath, args, result) {
    try {
      // Create basic documentation structure
      const docs = [
        {
          name: 'CONTRIBUTING.md',
          content: `# Contributing to ${args.projectName}

Thank you for considering contributing to this project!

## Development Setup

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Start development server: \`npm run dev\`

## Project Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use Super Agents tools for task management

## Super Agents Workflow

- Use \`sa task create\` to track new features
- Use templates for consistent code structure
- Run procedures for common development tasks
`
        },
        {
          name: 'ARCHITECTURE.md',
          content: `# ${args.projectName} Architecture

## Overview

This project uses the Super Agents framework for development workflow management.

## Project Structure

- \`src/\` - Application source code
- \`docs/\` - Project documentation
- \`tests/\` - Test suites and test utilities
- \`config/\` - Configuration files
- \`.super-agents/\` - Super Agents framework data

## Super Agents Integration

- **Task Management**: Centralized task tracking and status management
- **Templates**: Code generation and project scaffolding
- **Procedures**: Automated development workflows
- **MCP Integration**: IDE integration for seamless development

## Getting Started

1. Review the initial tasks: \`sa task list\`
2. Choose a task to work on: \`sa task show <id>\`
3. Use templates for consistent code: \`sa template list\`
4. Run procedures for common operations: \`sa procedure list\`
`
        }
      ];
      
      for (const doc of docs) {
        const docPath = join(projectPath, 'docs', doc.name);
        await writeFile(docPath, doc.content);
        result.createdFiles.push(docPath);
      }
      
    } catch (error) {
      result.warnings.push(`Failed to generate documentation: ${error.message}`);
    }
  },

  /**
   * Get initial tasks based on project template
   * @param {string} template - Project template
   * @param {Object} args - Tool arguments
   * @returns {Array} Initial task definitions
   */
  getInitialTasksForTemplate(template, args) {
    const baseTasks = [
      {
        title: 'Project Setup Complete',
        description: 'Initial project setup and configuration',
        type: 'setup',
        status: 'completed',
        priority: 'high',
        metadata: {
          template,
          createdBy: 'sa_initialize_project'
        }
      },
      {
        title: 'Review Project Structure',
        description: 'Review the generated project structure and configuration files',
        type: 'review',
        status: 'pending',
        priority: 'high',
        metadata: {
          assignee: args.author || 'developer',
          estimatedHours: 0.5
        }
      }
    ];
    
    // Add template-specific tasks
    switch (template) {
      case 'full-stack':
        baseTasks.push(
          {
            title: 'Setup Frontend Framework',
            description: 'Choose and setup frontend framework (React, Vue, etc.)',
            type: 'setup',
            status: 'pending',
            priority: 'high'
          },
          {
            title: 'Setup Backend API',
            description: 'Create backend API structure and routes',
            type: 'development',
            status: 'pending',
            priority: 'high'
          },
          {
            title: 'Setup Database',
            description: 'Choose and configure database solution',
            type: 'setup',
            status: 'pending',
            priority: 'medium'
          }
        );
        break;
        
      case 'api':
        baseTasks.push(
          {
            title: 'Define API Endpoints',
            description: 'Design and document API endpoints',
            type: 'design',
            status: 'pending',
            priority: 'high'
          },
          {
            title: 'Setup API Framework',
            description: 'Choose and setup API framework (Express, Fastify, etc.)',
            type: 'setup',
            status: 'pending',
            priority: 'high'
          }
        );
        break;
        
      case 'frontend':
        baseTasks.push(
          {
            title: 'Setup UI Framework',
            description: 'Choose and setup UI framework and styling',
            type: 'setup',
            status: 'pending',
            priority: 'high'
          },
          {
            title: 'Create Component Structure',
            description: 'Design and create reusable component structure',
            type: 'development',
            status: 'pending',
            priority: 'medium'
          }
        );
        break;
        
      case 'library':
        baseTasks.push(
          {
            title: 'Define Library API',
            description: 'Design public API and interfaces',
            type: 'design',
            status: 'pending',
            priority: 'high'
          },
          {
            title: 'Setup Build Process',
            description: 'Configure build tools and distribution',
            type: 'setup',
            status: 'pending',
            priority: 'medium'
          }
        );
        break;
    }
    
    // Add common final tasks
    baseTasks.push(
      {
        title: 'Write Initial Tests',
        description: 'Create initial test structure and basic tests',
        type: 'testing',
        status: 'pending',
        priority: 'medium'
      },
      {
        title: 'Setup CI/CD',
        description: 'Configure continuous integration and deployment',
        type: 'devops',
        status: 'pending',
        priority: 'low'
      }
    );
    
    return baseTasks;
  }
};