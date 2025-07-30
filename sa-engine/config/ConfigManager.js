import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import YAML from 'yaml';
import Joi from 'joi';
import { homedir } from 'os';

// Configuration schema validation
const configSchema = Joi.object({
  super_agents: Joi.object({
    version: Joi.string().required(),
    methodology: Joi.object({
      workflow_type: Joi.string().valid('agile-ai', 'waterfall-ai', 'kanban-ai').default('agile-ai'),
      default_agents: Joi.array().items(Joi.string()).default(['analyst', 'pm', 'architect', 'developer', 'qa']),
      quality_gates: Joi.boolean().default(true)
    }).default(),
    ai: Joi.object({
      providers: Joi.object({
        primary: Joi.string().valid('anthropic', 'openai', 'google', 'local').default('anthropic'),
        fallback: Joi.string().valid('anthropic', 'openai', 'google', 'local').optional(),
        research: Joi.string().valid('anthropic', 'openai', 'google', 'perplexity').optional()
      }).default(),
      models: Joi.object().pattern(
        Joi.string(),
        Joi.string()
      ).default({})
    }).default(),
    integrations: Joi.object({
      ide: Joi.string().valid('claude-code', 'cursor', 'vscode', 'windsurf').optional(),
      mcp_enabled: Joi.boolean().default(false),
      cli_enabled: Joi.boolean().default(true)
    }).default(),
    workspace: Joi.object({
      docs_dir: Joi.string().default('docs/'),
      tasks_dir: Joi.string().default('.super-agents/tasks/'),
      state_file: Joi.string().default('.super-agents/state.json')
    }).default(),
    project: Joi.object({
      name: Joi.string().optional(),
      type: Joi.string().valid('fullstack', 'frontend', 'backend', 'mobile', 'minimal', 'enterprise').default('fullstack'),
      initialized: Joi.boolean().default(false),
      created_at: Joi.string().isoDate().optional()
    }).default()
  }).required()
});

export class ConfigManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.globalConfigDir = join(homedir(), '.super-agents');
    this.projectConfigPath = resolve(this.projectRoot, '.super-agents', 'config.yaml');
    this.globalConfigPath = join(this.globalConfigDir, 'config.yaml');
  }

  /**
   * Load configuration with hierarchical loading
   * Priority: project > global > defaults
   */
  async loadConfig(useGlobal = false) {
    let config = this.getDefaultConfig();

    try {
      // Load global config if it exists
      if (await this.fileExists(this.globalConfigPath)) {
        const globalConfig = await this.loadConfigFile(this.globalConfigPath);
        config = this.mergeConfigs(config, globalConfig);
      }

      // Load project config if not using global and it exists
      if (!useGlobal && await this.fileExists(this.projectConfigPath)) {
        const projectConfig = await this.loadConfigFile(this.projectConfigPath);
        config = this.mergeConfigs(config, projectConfig);
      }

      // Validate the merged configuration
      const { error, value } = configSchema.validate(config);
      if (error) {
        throw new Error(`Configuration validation failed: ${error.details[0].message}`);
      }

      return value;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return config; // Return defaults if no config file exists
      }
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config, useGlobal = false) {
    // Validate before saving
    const { error, value } = configSchema.validate(config);
    if (error) {
      throw new Error(`Configuration validation failed: ${error.details[0].message}`);
    }

    const configPath = useGlobal ? this.globalConfigPath : this.projectConfigPath;
    const configDir = useGlobal ? this.globalConfigDir : resolve(this.projectRoot, '.super-agents');

    // Ensure directory exists
    await fs.mkdir(configDir, { recursive: true });

    // Write configuration
    await fs.writeFile(configPath, YAML.stringify(value), 'utf8');
    return value;
  }

  /**
   * Get configuration value using dot notation
   */
  getValue(config, key) {
    return key.split('.').reduce((obj, prop) => obj?.[prop], config);
  }

  /**
   * Set configuration value using dot notation
   */
  setValue(config, key, value) {
    const keys = key.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = this.parseValue(value);
    return config;
  }

  /**
   * Unset configuration value using dot notation
   */
  unsetValue(config, key) {
    const keys = key.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        return config; // Key doesn't exist
      }
      current = current[keys[i]];
    }

    delete current[keys[keys.length - 1]];
    return config;
  }

  /**
   * Initialize project configuration
   */
  async initializeProject(options = {}) {
    const config = this.getDefaultConfig();
    
    // Set project-specific values
    config.super_agents.project = {
      name: options.name || this.projectRoot.split('/').pop(),
      type: options.template || 'fullstack',
      initialized: true,
      created_at: new Date().toISOString()
    };

    await this.saveConfig(config, false);
    return config;
  }

  /**
   * Check if configuration is initialized
   */
  async isInitialized() {
    try {
      const config = await this.loadConfig();
      return config.super_agents.project.initialized;
    } catch {
      return false;
    }
  }

  /**
   * Load configuration from file
   */
  async loadConfigFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return YAML.parse(content);
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      super_agents: {
        version: "1.0.0",
        methodology: {
          workflow_type: "agile-ai",
          default_agents: ["analyst", "pm", "architect", "developer", "qa"],
          quality_gates: true
        },
        ai: {
          providers: {
            primary: "anthropic",
            fallback: "openai",
            research: "perplexity"
          },
          models: {
            analyst: "claude-3-5-sonnet",
            architect: "claude-3-5-sonnet",
            developer: "claude-3-5-sonnet",
            qa: "gpt-4o",
            pm: "claude-3-5-sonnet",
            scrum_master: "claude-3-5-sonnet",
            product_owner: "claude-3-5-sonnet",
            ux_expert: "claude-3-5-sonnet",
            bmad_master: "claude-3-5-sonnet",
            bmad_orchestrator: "claude-3-5-sonnet"
          }
        },
        integrations: {
          mcp_enabled: false,
          cli_enabled: true
        },
        workspace: {
          docs_dir: "docs/",
          tasks_dir: ".super-agents/tasks/",
          state_file: ".super-agents/state.json"
        },
        project: {
          name: "",
          type: "fullstack",
          initialized: false,
          created_at: ""
        }
      }
    };
  }

  /**
   * Merge two configuration objects
   */
  mergeConfigs(base, override) {
    const result = JSON.parse(JSON.stringify(base)); // Deep clone
    return this.deepMerge(result, override);
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Parse configuration value from string
   */
  parseValue(value) {
    // Try to parse as JSON first (for arrays, objects, booleans, numbers)
    try {
      return JSON.parse(value);
    } catch {
      // Return as string if JSON parsing fails
      return value;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration file path
   */
  getConfigPath(useGlobal = false) {
    return useGlobal ? this.globalConfigPath : this.projectConfigPath;
  }

  /**
   * Migrate configuration to new version
   */
  async migrateConfig(config) {
    // Future: Add configuration migration logic here
    return config;
  }
}