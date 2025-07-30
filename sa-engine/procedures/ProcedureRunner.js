import { EventEmitter } from 'events';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ProcedureRunner - Executes YAML-defined procedures with interactive user prompts
 * Supports step-by-step execution, state management, and user interaction patterns
 */
export default class ProcedureRunner extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      proceduresPath: options.proceduresPath || join(__dirname),
      templatesPath: options.templatesPath || join(__dirname, '../templates'),
      outputPath: options.outputPath || join(process.cwd(), 'generated'),
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 300000, // 5 minutes
      enableLogging: options.enableLogging !== false,
      autoSave: options.autoSave !== false,
      ...options
    };

    this.currentProcedure = null;
    this.executionState = {
      procedureId: null,
      currentStep: null,
      stepIndex: 0,
      variables: {},
      outputs: {},
      stepHistory: [],
      startTime: null,
      lastSaveTime: null,
      userInteractions: []
    };

    this.rl = null;
    this.isRunning = false;
    
    this.log('ProcedureRunner initialized', { options: this.options });
  }

  /**
   * Load and execute a procedure by ID or file path
   * @param {string} procedureIdOrPath - Procedure ID or file path
   * @param {Object} initialVariables - Initial variables for the procedure
   * @param {Object} executionOptions - Execution-specific options
   * @returns {Promise<Object>} Execution results
   */
  async execute(procedureIdOrPath, initialVariables = {}, executionOptions = {}) {
    try {
      this.log('Starting procedure execution', { procedureIdOrPath, initialVariables });
      
      // Load procedure
      this.currentProcedure = await this.loadProcedure(procedureIdOrPath);
      
      // Initialize execution state
      this.initializeExecution(initialVariables, executionOptions);
      
      // Setup readline interface for user interaction
      this.setupReadlineInterface();
      
      // Execute procedure steps
      const results = await this.executeProcedureSteps();
      
      this.log('Procedure execution completed', { results });
      return results;
      
    } catch (error) {
      this.log('Procedure execution failed', { error: error.message });
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Load procedure from file
   * @param {string} procedureIdOrPath - Procedure ID or file path
   * @returns {Promise<Object>} Loaded procedure
   */
  async loadProcedure(procedureIdOrPath) {
    let filePath;
    
    if (procedureIdOrPath.endsWith('.yaml') || procedureIdOrPath.endsWith('.yml')) {
      filePath = procedureIdOrPath;
    } else {
      filePath = join(this.options.proceduresPath, `${procedureIdOrPath}.yaml`);
    }
    
    if (!existsSync(filePath)) {
      throw new Error(`Procedure file not found: ${filePath}`);
    }
    
    const content = await readFile(filePath, 'utf-8');
    const procedure = yaml.load(content);
    
    this.validateProcedure(procedure);
    
    this.emit('procedureLoaded', { procedure, filePath });
    return procedure;
  }

  /**
   * Validate procedure structure
   * @param {Object} procedure - Procedure object to validate
   */
  validateProcedure(procedure) {
    if (!procedure.procedure || !procedure.procedure.id) {
      throw new Error('Procedure must have an id');
    }
    
    if (!procedure.steps || !Array.isArray(procedure.steps)) {
      throw new Error('Procedure must have steps array');
    }
    
    // Validate each step
    procedure.steps.forEach((step, index) => {
      if (!step.id || !step.name) {
        throw new Error(`Step ${index} must have id and name`);
      }
    });
  }

  /**
   * Initialize execution state
   * @param {Object} initialVariables - Initial variables
   * @param {Object} executionOptions - Execution options
   */
  initializeExecution(initialVariables, executionOptions) {
    this.executionState = {
      procedureId: this.currentProcedure.procedure.id,
      currentStep: null,
      stepIndex: 0,
      variables: {
        ...this.currentProcedure.variables?.defaults || {},
        ...initialVariables
      },
      outputs: {},
      stepHistory: [],
      startTime: new Date(),
      lastSaveTime: null,
      userInteractions: [],
      executionOptions
    };

    this.isRunning = true;
    this.emit('executionStarted', { 
      procedure: this.currentProcedure, 
      initialState: this.executionState 
    });
  }

  /**
   * Setup readline interface for user interaction
   */
  setupReadlineInterface() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }

  /**
   * Execute all procedure steps
   * @returns {Promise<Object>} Final execution results
   */
  async executeProcedureSteps() {
    const steps = this.currentProcedure.steps;
    
    while (this.executionState.stepIndex < steps.length && this.isRunning) {
      const step = steps[this.executionState.stepIndex];
      this.executionState.currentStep = step;
      
      try {
        this.log(`Executing step: ${step.name}`, { stepIndex: this.executionState.stepIndex });
        
        // Execute step based on type
        const stepResult = await this.executeStep(step);
        
        // Record step completion
        this.executionState.stepHistory.push({
          step: step.id,
          startTime: new Date(),
          result: stepResult,
          completedAt: new Date()
        });
        
        // Update outputs
        if (stepResult.outputs) {
          Object.assign(this.executionState.outputs, stepResult.outputs);
        }
        
        // Auto-save if enabled
        if (this.options.autoSave) {
          await this.saveState();
        }
        
        this.emit('stepCompleted', { step, result: stepResult });
        
        // Move to next step
        this.executionState.stepIndex++;
        
      } catch (error) {
        this.log(`Step execution failed: ${step.name}`, { error: error.message });
        
        const shouldContinue = await this.handleStepError(step, error);
        if (!shouldContinue) {
          throw error;
        }
      }
    }
    
    return this.finalizeExecution();
  }

  /**
   * Execute a single step based on its type
   * @param {Object} step - Step to execute
   * @returns {Promise<Object>} Step execution result
   */
  async executeStep(step) {
    this.emit('stepStarted', { step });
    
    switch (step.type) {
      case 'preparation':
        return await this.executePreparationStep(step);
      case 'configuration':
        return await this.executeConfigurationStep(step);
      case 'iterative':
        return await this.executeIterativeStep(step);
      case 'selection':
        return await this.executeSelectionStep(step);
      case 'completion':
        return await this.executeCompletionStep(step);
      default:
        return await this.executeGenericStep(step);
    }
  }

  /**
   * Execute preparation step
   */
  async executePreparationStep(step) {
    console.log(`\n=== ${step.name} ===`);
    console.log(step.description || '');
    
    if (step.instructions) {
      console.log('\nInstructions:');
      console.log(step.instructions);
    }
    
    const outputs = {};
    
    // Handle validation requirements
    if (step.validation) {
      const validationResults = await this.performValidation(step.validation);
      outputs.validation = validationResults;
    }
    
    // Wait for user acknowledgment
    await this.promptUser('\nPress Enter to continue...', 'confirm');
    
    return { outputs, status: 'completed' };
  }

  /**
   * Execute configuration step
   */
  async executeConfigurationStep(step) {
    console.log(`\n=== ${step.name} ===`);
    console.log(step.description || '');
    
    const outputs = {};
    
    // Process prompts if defined
    if (step.prompts) {
      for (const prompt of step.prompts) {
        const response = await this.handlePrompt(prompt);
        if (prompt.variable) {
          this.executionState.variables[prompt.variable] = response;
          outputs[prompt.variable] = response;
        }
      }
    }
    
    return { outputs, status: 'completed' };
  }

  /**
   * Execute iterative step
   */
  async executeIterativeStep(step) {
    console.log(`\n=== ${step.name} ===`);
    console.log(step.description || '');
    
    const outputs = {
      iterations: [],
      totalIterations: 0
    };
    
    let continueIterating = true;
    let iterationCount = 0;
    
    while (continueIterating && this.isRunning) {
      iterationCount++;
      console.log(`\n--- Iteration ${iterationCount} ---`);
      
      // Execute iteration logic
      const iterationResult = await this.executeIteration(step, iterationCount);
      outputs.iterations.push(iterationResult);
      
      // Check flow control conditions
      if (step.flow_control) {
        continueIterating = await this.evaluateFlowControl(step.flow_control, iterationCount, iterationResult);
      } else {
        // Default: ask user if they want to continue
        const userChoice = await this.promptUser('Continue with another iteration? (y/n)', 'confirm');
        continueIterating = userChoice.toLowerCase().startsWith('y');
      }
    }
    
    outputs.totalIterations = iterationCount;
    return { outputs, status: 'completed' };
  }

  /**
   * Execute selection step
   */
  async executeSelectionStep(step) {
    console.log(`\n=== ${step.name} ===`);
    console.log(step.description || '');
    
    if (step.instructions) {
      console.log('\nInstructions:');
      console.log(step.instructions);
    }
    
    const outputs = {};
    
    // Process prompts for selection
    if (step.prompts) {
      for (const prompt of step.prompts) {
        const response = await this.handlePrompt(prompt);
        if (prompt.variable) {
          this.executionState.variables[prompt.variable] = response;
          outputs[prompt.variable] = response;
        }
      }
    }
    
    return { outputs, status: 'completed' };
  }

  /**
   * Execute completion step
   */
  async executeCompletionStep(step) {
    console.log(`\n=== ${step.name} ===`);
    console.log(step.description || '');
    
    if (step.instructions) {
      console.log('\nInstructions:');
      console.log(step.instructions);
    }
    
    const outputs = {};
    
    // Handle validation if specified
    if (step.validation) {
      const validationResults = await this.performValidation(step.validation);
      outputs.validation = validationResults;
      
      if (!validationResults.passed) {
        throw new Error(`Completion validation failed: ${validationResults.errors.join(', ')}`);
      }
    }
    
    // Process final prompts
    if (step.prompts) {
      for (const prompt of step.prompts) {
        const response = await this.handlePrompt(prompt);
        if (prompt.variable) {
          this.executionState.variables[prompt.variable] = response;
          outputs[prompt.variable] = response;
        }
      }
    }
    
    return { outputs, status: 'completed' };
  }

  /**
   * Execute generic step
   */
  async executeGenericStep(step) {
    console.log(`\n=== ${step.name} ===`);
    console.log(step.description || '');
    
    if (step.instructions) {
      console.log('\nInstructions:');
      console.log(step.instructions);
    }
    
    const outputs = {};
    
    // Handle prompts if defined
    if (step.prompts) {
      for (const prompt of step.prompts) {
        const response = await this.handlePrompt(prompt);
        if (prompt.variable) {
          this.executionState.variables[prompt.variable] = response;
          outputs[prompt.variable] = response;
        }
      }
    }
    
    return { outputs, status: 'completed' };
  }

  /**
   * Handle different types of user prompts
   * @param {Object} prompt - Prompt configuration
   * @returns {Promise<any>} User response
   */
  async handlePrompt(prompt) {
    const message = this.interpolateVariables(prompt.message);
    
    switch (prompt.type) {
      case 'input':
        return await this.promptUser(message, 'input', {
          required: prompt.required,
          default: prompt.default
        });
        
      case 'choice':
        return await this.promptChoice(message, prompt.options, {
          required: prompt.required,
          default: prompt.default
        });
        
      case 'multiselect':
        return await this.promptMultiSelect(message, prompt.options, {
          required: prompt.required
        });
        
      case 'confirm':
        return await this.promptUser(message, 'confirm', {
          default: prompt.default
        });
        
      default:
        return await this.promptUser(message, 'input');
    }
  }

  /**
   * Prompt user for input
   * @param {string} message - Prompt message
   * @param {string} type - Prompt type
   * @param {Object} options - Prompt options
   * @returns {Promise<any>} User response
   */
  async promptUser(message, type = 'input', options = {}) {
    return new Promise((resolve) => {
      const fullMessage = options.default ? `${message} [${options.default}]: ` : `${message}: `;
      
      this.rl.question(fullMessage, (answer) => {
        const trimmedAnswer = answer.trim();
        
        // Handle empty input with default
        if (!trimmedAnswer && options.default !== undefined) {
          resolve(options.default);
          return;
        }
        
        // Handle required fields
        if (options.required && !trimmedAnswer) {
          console.log('This field is required. Please provide a value.');
          resolve(this.promptUser(message, type, options));
          return;
        }
        
        // Process based on type
        switch (type) {
          case 'confirm':
            resolve(trimmedAnswer.toLowerCase().startsWith('y') || trimmedAnswer === '1');
            break;
          case 'number':
            const num = parseInt(trimmedAnswer);
            resolve(isNaN(num) ? null : num);
            break;
          default:
            resolve(trimmedAnswer);
        }
        
        // Record interaction
        this.executionState.userInteractions.push({
          timestamp: new Date(),
          prompt: message,
          response: trimmedAnswer,
          type
        });
      });
    });
  }

  /**
   * Prompt user for choice selection
   * @param {string} message - Prompt message
   * @param {Array|Object} options - Choice options
   * @param {Object} config - Prompt configuration
   * @returns {Promise<any>} Selected choice
   */
  async promptChoice(message, options, config = {}) {
    console.log(`\n${message}`);
    
    let optionsList = [];
    
    if (Array.isArray(options)) {
      optionsList = options;
    } else if (typeof options === 'object') {
      optionsList = Object.entries(options).map(([key, value]) => ({ key, value }));
    }
    
    // Display options
    optionsList.forEach((option, index) => {
      if (typeof option === 'object' && option.key && option.value) {
        console.log(`${option.key}. ${option.value}`);
      } else {
        console.log(`${index + 1}. ${option}`);
      }
    });
    
    const response = await this.promptUser('Select your choice', 'input', config);
    
    // Parse response
    if (typeof options === 'object' && !Array.isArray(options)) {
      return options[response] || response;
    } else {
      const index = parseInt(response) - 1;
      return optionsList[index] || response;
    }
  }

  /**
   * Prompt user for multiple selections
   * @param {string} message - Prompt message
   * @param {Array} options - Available options
   * @param {Object} config - Prompt configuration
   * @returns {Promise<Array>} Selected options
   */
  async promptMultiSelect(message, options, config = {}) {
    console.log(`\n${message}`);
    
    // Display options with numbers
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });
    
    console.log('\nEnter your selections (comma-separated numbers or text):');
    const response = await this.promptUser('Selections', 'input', config);
    
    // Parse selections
    const selections = response.split(',').map(s => s.trim());
    const results = [];
    
    selections.forEach(selection => {
      const index = parseInt(selection) - 1;
      if (!isNaN(index) && index >= 0 && index < options.length) {
        results.push(options[index]);
      } else {
        results.push(selection);
      }
    });
    
    return results;
  }

  /**
   * Execute a single iteration in an iterative step
   * @param {Object} step - Iterative step configuration
   * @param {number} iterationCount - Current iteration number
   * @returns {Promise<Object>} Iteration result
   */
  async executeIteration(step, iterationCount) {
    const result = {
      iteration: iterationCount,
      timestamp: new Date(),
      outputs: {}
    };
    
    // Execute step instructions
    if (step.instructions) {
      console.log('\nIteration Instructions:');
      console.log(step.instructions);
    }
    
    // Handle prompts for this iteration
    if (step.prompts) {
      for (const prompt of step.prompts) {
        const response = await this.handlePrompt(prompt);
        if (prompt.variable) {
          result.outputs[prompt.variable] = response;
        }
      }
    }
    
    return result;
  }

  /**
   * Evaluate flow control conditions
   * @param {Object} flowControl - Flow control configuration
   * @param {number} iterationCount - Current iteration count
   * @param {Object} iterationResult - Result of current iteration
   * @returns {Promise<boolean>} Whether to continue iterating
   */
  async evaluateFlowControl(flowControl, iterationCount, iterationResult) {
    // Handle different flow control types
    switch (flowControl.type) {
      case 'continuous':
        if (flowControl.condition === 'while user engaged') {
          const continueChoice = await this.promptUser('Continue with this process? (y/n)', 'confirm');
          return continueChoice;
        }
        break;
        
      case 'loop':
        if (flowControl.condition === 'while sections remaining') {
          // This would be context-specific logic
          return true;
        }
        break;
        
      default:
        return false;
    }
    
    return false;
  }

  /**
   * Perform validation based on validation configuration
   * @param {Object} validation - Validation configuration
   * @returns {Promise<Object>} Validation results
   */
  async performValidation(validation) {
    const results = {
      passed: true,
      errors: [],
      warnings: []
    };
    
    for (const [key, expected] of Object.entries(validation)) {
      try {
        switch (key) {
          case 'template_exists':
            if (expected && !this.validateTemplateExists()) {
              results.errors.push('Required template does not exist');
              results.passed = false;
            }
            break;
            
          case 'all_required_sections':
            if (expected === 'completed' && !this.validateAllSectionsCompleted()) {
              results.errors.push('Not all required sections are completed');
              results.passed = false;
            }
            break;
            
          default:
            // Custom validation logic would go here
            break;
        }
      } catch (error) {
        results.errors.push(`Validation error for ${key}: ${error.message}`);
        results.passed = false;
      }
    }
    
    return results;
  }

  /**
   * Handle errors during step execution
   * @param {Object} step - Step that failed
   * @param {Error} error - Error that occurred
   * @returns {Promise<boolean>} Whether to continue execution
   */
  async handleStepError(step, error) {
    console.error(`\nError in step "${step.name}": ${error.message}`);
    
    const choice = await this.promptChoice(
      'How would you like to proceed?',
      {
        '1': 'Retry this step',
        '2': 'Skip this step',
        '3': 'Abort procedure'
      }
    );
    
    switch (choice) {
      case 'Retry this step':
        return true; // Continue with retry
      case 'Skip this step':
        this.executionState.stepIndex++; // Skip to next step
        return true;
      case 'Abort procedure':
        this.isRunning = false;
        return false;
      default:
        return false;
    }
  }

  /**
   * Interpolate variables in strings
   * @param {string} text - Text with variable placeholders
   * @returns {string} Text with variables replaced
   */
  interpolateVariables(text) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return this.executionState.variables[varName] || match;
    });
  }

  /**
   * Save current execution state
   * @returns {Promise<void>}
   */
  async saveState() {
    const stateFile = join(this.options.outputPath, `${this.executionState.procedureId}-state.json`);
    const stateData = {
      ...this.executionState,
      procedure: this.currentProcedure,
      savedAt: new Date()
    };
    
    await writeFile(stateFile, JSON.stringify(stateData, null, 2));
    this.executionState.lastSaveTime = new Date();
    
    this.emit('stateSaved', { stateFile, timestamp: this.executionState.lastSaveTime });
  }

  /**
   * Finalize execution and return results
   * @returns {Object} Final execution results
   */
  finalizeExecution() {
    const endTime = new Date();
    const duration = endTime - this.executionState.startTime;
    
    const results = {
      procedureId: this.executionState.procedureId,
      status: 'completed',
      startTime: this.executionState.startTime,
      endTime,
      duration,
      stepsCompleted: this.executionState.stepHistory.length,
      variables: this.executionState.variables,
      outputs: this.executionState.outputs,
      userInteractions: this.executionState.userInteractions.length
    };
    
    this.emit('executionCompleted', results);
    return results;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    
    this.isRunning = false;
    this.currentProcedure = null;
  }

  /**
   * Helper validation methods
   */
  validateTemplateExists() {
    // Implementation would check if required templates exist
    return true;
  }

  validateAllSectionsCompleted() {
    // Implementation would check if all required sections are completed
    return true;
  }

  /**
   * Logging utility
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(message, data = {}) {
    if (this.options.enableLogging) {
      console.log(`[ProcedureRunner] ${message}`, data);
    }
  }
}