/**
 * Advanced Workflow Customization and Template System
 * Allows users to create, modify, and share custom workflow templates
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowCustomizationSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.templatesDir = options.templatesDir || path.join(process.cwd(), '.sa-workflows', 'templates');
    this.customTemplatesDir = options.customTemplatesDir || path.join(process.cwd(), '.sa-workflows', 'custom-templates');
    this.sharedTemplatesDir = options.sharedTemplatesDir || path.join(process.cwd(), '.sa-workflows', 'shared-templates');
    
    this.baseTemplates = new Map();
    this.customTemplates = new Map();
    this.templateHierarchy = new Map();
    this.templateValidators = new Map();
    this.templateTransformers = new Map();
    
    this.customizationRules = new Map();
    this.templateVersions = new Map();
    this.templateUsageStats = new Map();
  }

  /**
   * Initialize the customization system
   */
  async initialize() {
    try {
      await this.setupDirectories();
      await this.loadBaseTemplates();
      await this.loadCustomTemplates();
      await this.loadSharedTemplates();
      await this.setupDefaultValidators();
      await this.setupDefaultTransformers();
      
      this.emit('customization:initialized', {
        baseTemplates: this.baseTemplates.size,
        customTemplates: this.customTemplates.size,
        totalTemplates: this.baseTemplates.size + this.customTemplates.size
      });

      return {
        success: true,
        message: 'Workflow customization system initialized',
        templateCount: this.baseTemplates.size + this.customTemplates.size
      };
    } catch (error) {
      this.emit('customization:error', error);
      throw new Error(`Failed to initialize customization system: ${error.message}`);
    }
  }

  /**
   * Setup directory structure
   */
  async setupDirectories() {
    const directories = [
      this.templatesDir,
      this.customTemplatesDir,
      this.sharedTemplatesDir,
      path.join(this.customTemplatesDir, 'user'),
      path.join(this.customTemplatesDir, 'team'),
      path.join(this.customTemplatesDir, 'organization'),
      path.join(this.sharedTemplatesDir, 'community'),
      path.join(this.sharedTemplatesDir, 'marketplace')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load base workflow templates
   */
  async loadBaseTemplates() {
    const baseTemplateFiles = [
      path.join(process.cwd(), 'sa-engine', 'workflows', 'enhanced-greenfield-fullstack.yaml'),
      path.join(process.cwd(), 'sa-engine', 'workflows', 'enhanced-brownfield-fullstack.yaml'),
      path.join(process.cwd(), 'sa-engine', 'workflows', 'enhanced-greenfield-ui.yaml'),
      path.join(process.cwd(), 'sa-engine', 'workflows', 'enhanced-brownfield-ui.yaml'),
      path.join(process.cwd(), 'sa-engine', 'workflows', 'enhanced-greenfield-service.yaml'),
      path.join(process.cwd(), 'sa-engine', 'workflows', 'enhanced-brownfield-service.yaml')
    ];

    for (const templateFile of baseTemplateFiles) {
      try {
        const content = await fs.readFile(templateFile, 'utf-8');
        const template = yaml.parse(content);
        
        if (template && template.workflow) {
          const templateId = template.workflow.id;
          this.baseTemplates.set(templateId, {
            ...template.workflow,
            source: 'base',
            filePath: templateFile,
            loadedAt: new Date().toISOString(),
            customizable: true,
            category: this.categorizeTemplate(template.workflow)
          });
        }
      } catch (error) {
        console.warn(`Could not load base template ${templateFile}: ${error.message}`);
      }
    }
  }

  /**
   * Load custom user templates
   */
  async loadCustomTemplates() {
    const customDirs = [
      path.join(this.customTemplatesDir, 'user'),
      path.join(this.customTemplatesDir, 'team'),
      path.join(this.customTemplatesDir, 'organization')
    ];

    for (const dir of customDirs) {
      try {
        const files = await fs.readdir(dir);
        const scope = path.basename(dir);
        
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(dir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const template = yaml.parse(content);
            
            if (template && template.workflow) {
              const templateId = template.workflow.id;
              this.customTemplates.set(templateId, {
                ...template.workflow,
                source: 'custom',
                scope,
                filePath,
                loadedAt: new Date().toISOString(),
                customizable: true,
                category: this.categorizeTemplate(template.workflow)
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not load custom templates from ${dir}: ${error.message}`);
      }
    }
  }

  /**
   * Load shared community templates
   */
  async loadSharedTemplates() {
    const sharedDirs = [
      path.join(this.sharedTemplatesDir, 'community'),
      path.join(this.sharedTemplatesDir, 'marketplace')
    ];

    for (const dir of sharedDirs) {
      try {
        const files = await fs.readdir(dir);
        const scope = path.basename(dir);
        
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(dir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const template = yaml.parse(content);
            
            if (template && template.workflow) {
              const templateId = template.workflow.id;
              // Store shared templates in custom templates map with shared flag
              this.customTemplates.set(templateId, {
                ...template.workflow,
                source: 'shared',
                scope,
                filePath,
                loadedAt: new Date().toISOString(),
                customizable: false,
                shared: true,
                category: this.categorizeTemplate(template.workflow)
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Could not load shared templates from ${dir}: ${error.message}`);
      }
    }
  }

  /**
   * Categorize template based on its properties
   */
  categorizeTemplate(template) {
    if (template.type === 'greenfield') {
      if (template.project_types?.includes('fullstack') || template.id.includes('fullstack')) {
        return 'greenfield_fullstack';
      } else if (template.project_types?.includes('ui') || template.id.includes('ui')) {
        return 'greenfield_ui';
      } else if (template.project_types?.includes('service') || template.id.includes('service')) {
        return 'greenfield_service';
      }
      return 'greenfield_other';
    } else if (template.type === 'brownfield') {
      if (template.project_types?.includes('fullstack') || template.id.includes('fullstack')) {
        return 'brownfield_fullstack';
      } else if (template.project_types?.includes('ui') || template.id.includes('ui')) {
        return 'brownfield_ui';
      } else if (template.project_types?.includes('service') || template.id.includes('service')) {
        return 'brownfield_service';
      }
      return 'brownfield_other';
    }
    return 'custom';
  }

  /**
   * Create custom workflow template
   */
  async createCustomTemplate(templateConfig, options = {}) {
    try {
      const templateId = templateConfig.id || `custom-${uuidv4()}`;
      const scope = options.scope || 'user';
      const baseTemplate = options.baseTemplate;

      // Validate template configuration
      const validationResult = await this.validateTemplate(templateConfig);
      if (!validationResult.valid) {
        throw new Error(`Template validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Create template from base if specified
      let template = templateConfig;
      if (baseTemplate) {
        template = await this.deriveFromBase(baseTemplate, templateConfig);
      }

      // Add metadata
      template.metadata = {
        ...template.metadata,
        id: templateId,
        source: 'custom',
        scope,
        createdAt: new Date().toISOString(),
        createdBy: options.createdBy || 'system',
        version: '1.0.0',
        baseTemplate: baseTemplate || null,
        customizations: options.customizations || []
      };

      // Apply transformations
      if (options.transformations) {
        template = await this.applyTransformations(template, options.transformations);
      }

      // Store template
      this.customTemplates.set(templateId, template);

      // Save to file
      const templateDir = path.join(this.customTemplatesDir, scope);
      const templateFile = path.join(templateDir, `${templateId}.yaml`);
      
      await fs.writeFile(templateFile, yaml.stringify({ workflow: template }, { indent: 2 }));

      // Track template creation
      this.trackTemplateUsage(templateId, 'created');

      this.emit('template:created', {
        templateId,
        scope,
        baseTemplate,
        createdBy: options.createdBy
      });

      return {
        success: true,
        templateId,
        template,
        message: 'Custom template created successfully'
      };
    } catch (error) {
      this.emit('customization:error', error);
      throw error;
    }
  }

  /**
   * Customize existing template
   */
  async customizeTemplate(templateId, customizations, options = {}) {
    try {
      const baseTemplate = this.getTemplate(templateId);
      if (!baseTemplate) {
        throw new Error(`Template not found: ${templateId}`);
      }

      if (!baseTemplate.customizable) {
        throw new Error(`Template is not customizable: ${templateId}`);
      }

      const customizedId = options.newId || `${templateId}-custom-${uuidv4()}`;
      
      // Apply customizations
      let customizedTemplate = JSON.parse(JSON.stringify(baseTemplate));
      customizedTemplate = await this.applyCustomizations(customizedTemplate, customizations);

      // Update metadata
      customizedTemplate.id = customizedId;
      customizedTemplate.metadata = {
        ...customizedTemplate.metadata,
        source: 'customized',
        baseTemplate: templateId,
        customizedAt: new Date().toISOString(),
        customizedBy: options.customizedBy || 'system',
        customizations: customizations,
        version: '1.0.0'
      };

      return await this.createCustomTemplate(customizedTemplate, {
        scope: options.scope || 'user',
        createdBy: options.customizedBy
      });
    } catch (error) {
      this.emit('customization:error', error);
      throw error;
    }
  }

  /**
   * Apply customizations to template
   */
  async applyCustomizations(template, customizations) {
    let customizedTemplate = { ...template };

    for (const customization of customizations) {
      switch (customization.type) {
        case 'add_phase':
          customizedTemplate = await this.addPhase(customizedTemplate, customization);
          break;
        case 'remove_phase':
          customizedTemplate = await this.removePhase(customizedTemplate, customization);
          break;
        case 'modify_phase':
          customizedTemplate = await this.modifyPhase(customizedTemplate, customization);
          break;
        case 'add_validation_gate':
          customizedTemplate = await this.addValidationGate(customizedTemplate, customization);
          break;
        case 'remove_validation_gate':
          customizedTemplate = await this.removeValidationGate(customizedTemplate, customization);
          break;
        case 'modify_metadata':
          customizedTemplate = await this.modifyMetadata(customizedTemplate, customization);
          break;
        case 'add_tool':
          customizedTemplate = await this.addTool(customizedTemplate, customization);
          break;
        case 'modify_flow':
          customizedTemplate = await this.modifyFlow(customizedTemplate, customization);
          break;
        default:
          console.warn(`Unknown customization type: ${customization.type}`);
      }
    }

    return customizedTemplate;
  }

  /**
   * Add phase to template
   */
  async addPhase(template, customization) {
    const { phase, position = 'end' } = customization;
    
    if (!template.phases) {
      template.phases = [];
    }

    if (position === 'start') {
      template.phases.unshift(phase);
    } else if (position === 'end') {
      template.phases.push(phase);
    } else if (typeof position === 'number') {
      template.phases.splice(position, 0, phase);
    } else if (position.after) {
      const afterIndex = template.phases.findIndex(p => p.id === position.after);
      if (afterIndex !== -1) {
        template.phases.splice(afterIndex + 1, 0, phase);
      } else {
        template.phases.push(phase);
      }
    }

    return template;
  }

  /**
   * Remove phase from template
   */
  async removePhase(template, customization) {
    const { phaseId } = customization;
    
    if (template.phases) {
      template.phases = template.phases.filter(p => p.id !== phaseId);
    }

    return template;
  }

  /**
   * Modify existing phase
   */
  async modifyPhase(template, customization) {
    const { phaseId, modifications } = customization;
    
    if (template.phases) {
      const phaseIndex = template.phases.findIndex(p => p.id === phaseId);
      if (phaseIndex !== -1) {
        template.phases[phaseIndex] = {
          ...template.phases[phaseIndex],
          ...modifications
        };
      }
    }

    return template;
  }

  /**
   * Add validation gate
   */
  async addValidationGate(template, customization) {
    const { phaseId, gate } = customization;
    
    if (template.phases) {
      const phase = template.phases.find(p => p.id === phaseId);
      if (phase) {
        if (!phase.validation_gates) {
          phase.validation_gates = [];
        }
        phase.validation_gates.push(gate);
      }
    }

    // Also add to validation gates config if not exists
    if (!template.validation_gates_config) {
      template.validation_gates_config = {};
    }
    
    if (gate.config) {
      template.validation_gates_config[gate.id] = gate.config;
    }

    return template;
  }

  /**
   * Remove validation gate
   */
  async removeValidationGate(template, customization) {
    const { phaseId, gateId } = customization;
    
    if (template.phases) {
      const phase = template.phases.find(p => p.id === phaseId);
      if (phase && phase.validation_gates) {
        phase.validation_gates = phase.validation_gates.filter(g => g !== gateId && g.id !== gateId);
      }
    }

    // Remove from validation gates config
    if (template.validation_gates_config && template.validation_gates_config[gateId]) {
      delete template.validation_gates_config[gateId];
    }

    return template;
  }

  /**
   * Modify template metadata
   */
  async modifyMetadata(template, customization) {
    const { modifications } = customization;
    
    template.metadata = {
      ...template.metadata,
      ...modifications
    };

    return template;
  }

  /**
   * Add tool to template
   */
  async addTool(template, customization) {
    const { phaseId, stepId, tool } = customization;
    
    if (template.phases) {
      const phase = template.phases.find(p => p.id === phaseId);
      if (phase && phase.sequence) {
        const step = phase.sequence.find(s => s.step === stepId);
        if (step) {
          if (!step.tools) {
            step.tools = [];
          }
          if (!step.tools.includes(tool)) {
            step.tools.push(tool);
          }
        }
      }
    }

    // Add to integration section
    if (!template.integration) {
      template.integration = {};
    }
    if (!template.integration.required_tools) {
      template.integration.required_tools = [];
    }
    if (!template.integration.required_tools.includes(tool)) {
      template.integration.required_tools.push(tool);
    }

    return template;
  }

  /**
   * Modify workflow flow
   */
  async modifyFlow(template, customization) {
    const { modifications } = customization;
    
    if (modifications.flow_diagram) {
      template.flow_diagram = modifications.flow_diagram;
    }

    if (modifications.handoff_prompts) {
      template.handoff_prompts = {
        ...template.handoff_prompts,
        ...modifications.handoff_prompts
      };
    }

    return template;
  }

  /**
   * Derive template from base template
   */
  async deriveFromBase(baseTemplateId, overrides = {}) {
    const baseTemplate = this.getTemplate(baseTemplateId);
    if (!baseTemplate) {
      throw new Error(`Base template not found: ${baseTemplateId}`);
    }

    // Deep clone base template
    const derivedTemplate = JSON.parse(JSON.stringify(baseTemplate));
    
    // Apply overrides
    Object.assign(derivedTemplate, overrides);

    // Update metadata to reflect derivation
    derivedTemplate.metadata = {
      ...derivedTemplate.metadata,
      ...overrides.metadata,
      baseTemplate: baseTemplateId,
      derivedAt: new Date().toISOString()
    };

    return derivedTemplate;
  }

  /**
   * Validate template configuration
   */
  async validateTemplate(template) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Required fields validation
    const requiredFields = ['id', 'name', 'description', 'type', 'phases'];
    for (const field of requiredFields) {
      if (!template[field]) {
        result.valid = false;
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Phases validation
    if (template.phases) {
      for (let i = 0; i < template.phases.length; i++) {
        const phase = template.phases[i];
        if (!phase.id) {
          result.valid = false;
          result.errors.push(`Phase ${i} missing required field: id`);
        }
        if (!phase.name) {
          result.valid = false;
          result.errors.push(`Phase ${i} missing required field: name`);
        }
        if (!phase.sequence || !Array.isArray(phase.sequence)) {
          result.errors.push(`Phase ${phase.id || i} missing or invalid sequence`);
        }
      }
    }

    // Validation gates configuration validation
    if (template.validation_gates_config) {
      for (const [gateId, gateConfig] of Object.entries(template.validation_gates_config)) {
        if (!gateConfig.description) {
          result.warnings.push(`Validation gate ${gateId} missing description`);
        }
        if (!gateConfig.rules || !Array.isArray(gateConfig.rules)) {
          result.warnings.push(`Validation gate ${gateId} missing or invalid rules`);
        }
      }
    }

    // Custom validator execution
    for (const [validatorName, validator] of this.templateValidators) {
      try {
        const validatorResult = await validator(template);
        if (!validatorResult.valid) {
          result.valid = false;
          result.errors.push(...validatorResult.errors);
        }
        if (validatorResult.warnings) {
          result.warnings.push(...validatorResult.warnings);
        }
      } catch (error) {
        result.warnings.push(`Validator ${validatorName} failed: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Setup default validators
   */
  async setupDefaultValidators() {
    // Phase flow validator
    this.templateValidators.set('phase_flow', async (template) => {
      const result = { valid: true, errors: [], warnings: [] };
      
      if (template.phases) {
        // Check for circular dependencies
        const phaseIds = template.phases.map(p => p.id);
        const dependencies = new Map();
        
        template.phases.forEach(phase => {
          if (phase.sequence) {
            phase.sequence.forEach(step => {
              if (step.requires && Array.isArray(step.requires)) {
                step.requires.forEach(req => {
                  if (phaseIds.includes(req)) {
                    if (!dependencies.has(phase.id)) {
                      dependencies.set(phase.id, []);
                    }
                    dependencies.get(phase.id).push(req);
                  }
                });
              }
            });
          }
        });

        // Simple cycle detection
        for (const [phaseId, deps] of dependencies) {
          if (deps.includes(phaseId)) {
            result.valid = false;
            result.errors.push(`Circular dependency detected in phase: ${phaseId}`);
          }
        }
      }
      
      return result;
    });

    // Tools validator
    this.templateValidators.set('tools', async (template) => {
      const result = { valid: true, errors: [], warnings: [] };
      
      const availableTools = [
        'sa_research_market', 'sa_create_brief', 'sa_generate_prd',
        'sa_create_frontend_spec', 'sa_design_system', 'sa_create_architecture',
        'sa_implement_story', 'sa_run_tests', 'sa_validate_implementation'
      ];
      
      if (template.phases) {
        template.phases.forEach(phase => {
          if (phase.sequence) {
            phase.sequence.forEach(step => {
              if (step.tools) {
                step.tools.forEach(tool => {
                  if (!availableTools.includes(tool)) {
                    result.warnings.push(`Unknown tool referenced: ${tool} in phase ${phase.id}`);
                  }
                });
              }
            });
          }
        });
      }
      
      return result;
    });
  }

  /**
   * Setup default transformers
   */
  async setupDefaultTransformers() {
    // Template minification transformer
    this.templateTransformers.set('minify', async (template) => {
      const minified = { ...template };
      
      // Remove optional fields for minification
      delete minified.flow_diagram;
      delete minified.decision_guidance;
      delete minified.handoff_prompts;
      
      return minified;
    });

    // Template expansion transformer
    this.templateTransformers.set('expand', async (template) => {
      const expanded = { ...template };
      
      // Add default fields if missing
      if (!expanded.decision_guidance) {
        expanded.decision_guidance = {
          when_to_use: ['Custom workflow for specific needs'],
          alternatives: []
        };
      }
      
      if (!expanded.quality_metrics) {
        expanded.quality_metrics = {
          coverage_threshold: 80,
          performance_requirements: 'standard'
        };
      }
      
      return expanded;
    });
  }

  /**
   * Apply transformations to template
   */
  async applyTransformations(template, transformations) {
    let transformedTemplate = { ...template };
    
    for (const transformation of transformations) {
      const transformer = this.templateTransformers.get(transformation.type);
      if (transformer) {
        transformedTemplate = await transformer(transformedTemplate, transformation.options);
      } else {
        console.warn(`Unknown transformation type: ${transformation.type}`);
      }
    }
    
    return transformedTemplate;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.baseTemplates.get(templateId) || this.customTemplates.get(templateId);
  }

  /**
   * Get all templates
   */
  getAllTemplates(options = {}) {
    const allTemplates = new Map([...this.baseTemplates, ...this.customTemplates]);
    
    if (options.category) {
      const filtered = new Map();
      for (const [id, template] of allTemplates) {
        if (template.category === options.category) {
          filtered.set(id, template);
        }
      }
      return Array.from(filtered.values());
    }
    
    if (options.source) {
      const filtered = new Map();
      for (const [id, template] of allTemplates) {
        if (template.source === options.source) {
          filtered.set(id, template);
        }
      }
      return Array.from(filtered.values());
    }
    
    return Array.from(allTemplates.values());
  }

  /**
   * Search templates
   */
  searchTemplates(query, options = {}) {
    const allTemplates = this.getAllTemplates();
    const searchFields = options.fields || ['name', 'description', 'project_types'];
    
    return allTemplates.filter(template => {
      return searchFields.some(field => {
        const value = template[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query.toLowerCase());
        } else if (Array.isArray(value)) {
          return value.some(item => 
            typeof item === 'string' && item.toLowerCase().includes(query.toLowerCase())
          );
        }
        return false;
      });
    });
  }

  /**
   * Export template
   */
  async exportTemplate(templateId, format = 'yaml', options = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let exportData = template;
    
    // Apply transformations if specified
    if (options.transformations) {
      exportData = await this.applyTransformations(template, options.transformations);
    }

    // Add export metadata
    exportData.export_metadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: options.exportedBy || 'system',
      format,
      version: exportData.version || '1.0.0'
    };

    switch (format) {
      case 'yaml':
        return yaml.stringify({ workflow: exportData }, { indent: 2 });
      case 'json':
        return JSON.stringify({ workflow: exportData }, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import template
   */
  async importTemplate(templateData, format = 'yaml', options = {}) {
    let template;

    switch (format) {
      case 'yaml':
        const parsed = yaml.parse(templateData);
        template = parsed.workflow || parsed;
        break;
      case 'json':
        const jsonParsed = JSON.parse(templateData);
        template = jsonParsed.workflow || jsonParsed;
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    // Validate imported template
    const validationResult = await this.validateTemplate(template);
    if (!validationResult.valid) {
      throw new Error(`Invalid template: ${validationResult.errors.join(', ')}`);
    }

    // Generate new ID if not provided or conflicts
    if (!template.id || this.getTemplate(template.id)) {
      template.id = `imported-${uuidv4()}`;
    }

    // Add import metadata
    template.metadata = {
      ...template.metadata,
      importedAt: new Date().toISOString(),
      importedBy: options.importedBy || 'system',
      source: 'imported'
    };

    // Save imported template
    return await this.createCustomTemplate(template, {
      scope: options.scope || 'user',
      createdBy: options.importedBy
    });
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId, options = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const clonedTemplate = JSON.parse(JSON.stringify(template));
    clonedTemplate.id = options.newId || `${templateId}-clone-${uuidv4()}`;
    clonedTemplate.name = options.newName || `${template.name} (Clone)`;
    
    clonedTemplate.metadata = {
      ...clonedTemplate.metadata,
      clonedFrom: templateId,
      clonedAt: new Date().toISOString(),
      clonedBy: options.clonedBy || 'system'
    };

    return await this.createCustomTemplate(clonedTemplate, {
      scope: options.scope || 'user',
      createdBy: options.clonedBy
    });
  }

  /**
   * Track template usage
   */
  trackTemplateUsage(templateId, action, metadata = {}) {
    const stats = this.templateUsageStats.get(templateId) || {
      created: 0,
      used: 0,
      cloned: 0,
      exported: 0,
      lastUsed: null
    };

    stats[action] = (stats[action] || 0) + 1;
    stats.lastUsed = new Date().toISOString();

    this.templateUsageStats.set(templateId, stats);

    this.emit('template:usage_tracked', {
      templateId,
      action,
      stats,
      metadata
    });
  }

  /**
   * Get template usage statistics
   */
  getTemplateUsageStats(templateId = null) {
    if (templateId) {
      return this.templateUsageStats.get(templateId);
    }
    
    return Object.fromEntries(this.templateUsageStats);
  }

  /**
   * Get template recommendations
   */
  getTemplateRecommendations(context = {}) {
    const allTemplates = this.getAllTemplates();
    const recommendations = [];

    // Basic recommendation logic
    if (context.projectType) {
      const matchingTemplates = allTemplates.filter(template => 
        template.project_types && template.project_types.includes(context.projectType)
      );
      recommendations.push(...matchingTemplates.slice(0, 3));
    }

    if (context.complexity) {
      const complexityMatches = allTemplates.filter(template =>
        template.metadata && template.metadata.complexity === context.complexity
      );
      recommendations.push(...complexityMatches.slice(0, 2));
    }

    // Remove duplicates and sort by usage
    const uniqueRecommendations = recommendations
      .filter((template, index, self) => 
        self.findIndex(t => t.id === template.id) === index
      )
      .sort((a, b) => {
        const statsA = this.templateUsageStats.get(a.id) || { used: 0 };
        const statsB = this.templateUsageStats.get(b.id) || { used: 0 };
        return statsB.used - statsA.used;
      });

    return uniqueRecommendations.slice(0, 5);
  }

  /**
   * Shutdown the customization system
   */
  async shutdown() {
    // Save usage statistics
    try {
      const statsFile = path.join(this.customTemplatesDir, 'usage-stats.json');
      const statsData = Object.fromEntries(this.templateUsageStats);
      await fs.writeFile(statsFile, JSON.stringify(statsData, null, 2));
    } catch (error) {
      console.error('Failed to save usage statistics:', error.message);
    }

    this.baseTemplates.clear();
    this.customTemplates.clear();
    this.templateUsageStats.clear();
    
    this.emit('customization:shutdown');

    return {
      success: true,
      message: 'Workflow customization system shutdown complete'
    };
  }
}

export default WorkflowCustomizationSystem;