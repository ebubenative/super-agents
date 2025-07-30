import { promises as fs } from 'fs';
import { join, resolve } from 'path';

export class StateManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.stateDir = resolve(this.projectRoot, '.super-agents');
    this.statePath = join(this.stateDir, 'state.json');
    this.tasksDir = join(this.stateDir, 'tasks');
    this.docsDir = join(this.stateDir, 'docs');
    this.logsDir = join(this.stateDir, 'logs');
  }

  /**
   * Initialize state management
   */
  async initialize(options = {}) {
    // Create directories
    await fs.mkdir(this.stateDir, { recursive: true });
    await fs.mkdir(this.tasksDir, { recursive: true });
    await fs.mkdir(this.docsDir, { recursive: true });
    await fs.mkdir(this.logsDir, { recursive: true });

    // Create initial state
    const initialState = {
      version: "1.0.0",
      initialized: true,
      project: {
        name: options.projectName || "",
        type: options.projectType || "fullstack",
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      tasks: {
        current: null,
        completed: [],
        in_progress: [],
        pending: []
      },
      agents: {
        active: null,
        last_used: null,
        usage_stats: {}
      },
      workflows: {
        active: null,
        history: []
      },
      session: {
        id: this.generateSessionId(),
        started_at: new Date().toISOString(),
        context: {}
      }
    };

    await this.saveState(initialState);
    return initialState;
  }

  /**
   * Load current state
   */
  async loadState() {
    try {
      const stateData = await fs.readFile(this.statePath, 'utf8');
      return JSON.parse(stateData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Return default state if file doesn't exist
        return {
          version: "1.0.0",
          initialized: false,
          project: {},
          tasks: { current: null, completed: [], in_progress: [], pending: [] },
          agents: { active: null, last_used: null, usage_stats: {} },
          workflows: { active: null, history: [] },
          session: { id: "", started_at: "", context: {} }
        };
      }
      throw error;
    }
  }

  /**
   * Save state to file
   */
  async saveState(state) {
    // Update last_updated timestamp
    state.project.last_updated = new Date().toISOString();
    
    // Ensure directory exists
    await fs.mkdir(this.stateDir, { recursive: true });
    
    // Write state with pretty formatting
    await fs.writeFile(this.statePath, JSON.stringify(state, null, 2), 'utf8');
    return state;
  }

  /**
   * Update specific state property
   */
  async updateState(updates) {
    const currentState = await this.loadState();
    const newState = this.deepMerge(currentState, updates);
    return await this.saveState(newState);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Check if state is initialized
   */
  async isInitialized() {
    try {
      const state = await this.loadState();
      return state.initialized === true;
    } catch {
      return false;
    }
  }

  /**
   * Get state file path
   */
  getStatePath() {
    return this.statePath;
  }

  /**
   * Create backup of current state
   */
  async createBackup() {
    const state = await this.loadState();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.stateDir, `state.backup.${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(state, null, 2), 'utf8');
    return backupPath;
  }

  /**
   * Restore state from backup
   */
  async restoreFromBackup(backupPath) {
    const backupData = await fs.readFile(backupPath, 'utf8');
    const backupState = JSON.parse(backupData);
    
    return await this.saveState(backupState);
  }
}