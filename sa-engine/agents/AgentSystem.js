import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AgentSystem extends EventEmitter {
    constructor(agentsDir = __dirname) {
        super();
        this.agentsDir = agentsDir;
        this.agents = new Map();
        this.cache = new Map();
        this.watchers = new Map();
        this.schema = this.createAgentSchema();
    }

    createAgentSchema() {
        return {
            required: ['metadata', 'agent', 'persona', 'capabilities'],
            properties: {
                metadata: {
                    required: ['version', 'created', 'framework'],
                    properties: {
                        version: { type: 'string' },
                        created: { type: 'string' },
                        framework: { type: 'string' }
                    }
                },
                agent: {
                    required: ['id', 'name', 'title', 'type', 'status'],
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        title: { type: 'string' },
                        icon: { type: 'string' },
                        type: { enum: ['primary', 'secondary', 'utility', 'meta'] },
                        status: { enum: ['active', 'inactive', 'deprecated'] }
                    }
                },
                persona: {
                    required: ['role', 'style', 'identity', 'focus', 'core_principles'],
                    properties: {
                        role: { type: 'string' },
                        style: { type: 'string' },
                        identity: { type: 'string' },
                        focus: { type: 'string' },
                        core_principles: { type: 'array', items: { type: 'string' } }
                    }
                },
                capabilities: {
                    required: ['commands'],
                    properties: {
                        commands: {
                            type: 'array',
                            items: {
                                required: ['name', 'description', 'usage'],
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    usage: { type: 'string' },
                                    mcp_tool: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    async loadAllAgents() {
        try {
            const files = fs.readdirSync(this.agentsDir)
                .filter(file => file.endsWith('.json'));

            const loadPromises = files.map(file => this.loadAgent(file));
            const results = await Promise.allSettled(loadPromises);

            let loaded = 0;
            let failed = 0;

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    loaded++;
                } else {
                    failed++;
                    console.error(`Failed to load ${files[index]}: ${result.reason.message}`);
                }
            });

            this.emit('agents_loaded', { loaded, failed, total: files.length });
            return { loaded, failed, total: files.length };
        } catch (error) {
            this.emit('error', new Error(`Failed to scan agents directory: ${error.message}`));
            throw error;
        }
    }

    async loadAgent(filename) {
        try {
            const agentPath = path.join(this.agentsDir, filename);
            const agentData = await this.parseAgentFile(agentPath);
            
            if (!this.validateAgent(agentData)) {
                throw new Error(`Agent validation failed for ${filename}`);
            }

            const agentId = agentData.agent.id;
            this.agents.set(agentId, {
                ...agentData,
                _metadata: {
                    filename,
                    filepath: agentPath,
                    loaded: new Date(),
                    status: 'loaded'
                }
            });

            this.cache.set(agentId, {
                lastAccess: new Date(),
                accessCount: 0,
                data: agentData
            });

            this.emit('agent_loaded', { id: agentId, filename });
            return agentData;
        } catch (error) {
            this.emit('agent_load_error', { filename, error: error.message });
            throw new Error(`Failed to load agent ${filename}: ${error.message}`);
        }
    }

    async parseAgentFile(filepath) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            const agentData = JSON.parse(content);
            return agentData;
        } catch (error) {
            throw new Error(`Failed to parse agent file ${filepath}: ${error.message}`);
        }
    }

    validateAgent(agentData) {
        try {
            const errors = [];

            if (!this.validateObject(agentData, this.schema, '', errors)) {
                console.error('Agent validation errors:', errors);
                return false;
            }

            if (agentData.dependencies) {
                if (!this.validateDependencies(agentData.dependencies)) {
                    errors.push('Invalid dependencies structure');
                    console.error('Dependencies validation error:', errors);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Agent validation error:', error.message);
            return false;
        }
    }

    validateObject(obj, schema, path, errors) {
        if (schema.required) {
            for (const requiredField of schema.required) {
                if (!(requiredField in obj)) {
                    errors.push(`Missing required field: ${path}.${requiredField}`);
                    return false;
                }
            }
        }

        if (schema.properties) {
            for (const [key, value] of Object.entries(obj)) {
                const fieldSchema = schema.properties[key];
                if (fieldSchema) {
                    const fieldPath = path ? `${path}.${key}` : key;
                    if (!this.validateField(value, fieldSchema, fieldPath, errors)) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    validateField(value, schema, path, errors) {
        if (schema.type) {
            if (schema.type === 'array' && !Array.isArray(value)) {
                errors.push(`Field ${path} must be an array`);
                return false;
            }
            if (schema.type === 'string' && typeof value !== 'string') {
                errors.push(`Field ${path} must be a string`);
                return false;
            }
        }

        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Field ${path} must be one of: ${schema.enum.join(', ')}`);
            return false;
        }

        if (schema.items && Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                if (!this.validateField(value[i], schema.items, `${path}[${i}]`, errors)) {
                    return false;
                }
            }
        }

        if (schema.properties && typeof value === 'object') {
            return this.validateObject(value, schema, path, errors);
        }

        return true;
    }

    validateDependencies(dependencies) {
        const validTypes = ['tasks', 'templates', 'checklists', 'data', 'workflows', 'utils'];
        
        for (const [type, deps] of Object.entries(dependencies)) {
            if (!validTypes.includes(type)) {
                console.error(`Invalid dependency type: ${type}. Valid types: ${validTypes.join(', ')}`);
                return false;
            }
            if (!Array.isArray(deps)) {
                console.error(`Dependencies for type ${type} must be an array`);
                return false;
            }
        }
        
        return true;
    }

    getAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return null;
        }

        this.updateCache(agentId);
        return agent;
    }

    updateCache(agentId) {
        const cacheEntry = this.cache.get(agentId);
        if (cacheEntry) {
            cacheEntry.lastAccess = new Date();
            cacheEntry.accessCount++;
        }
    }

    listAgents(filters = {}) {
        const agents = Array.from(this.agents.values());
        
        return agents.filter(agent => {
            if (filters.type && agent.agent.type !== filters.type) {
                return false;
            }
            if (filters.status && agent.agent.status !== filters.status) {
                return false;
            }
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableText = [
                    agent.agent.name,
                    agent.agent.title,
                    agent.agent.id,
                    agent.persona.role
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });
    }

    searchAgents(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (const agent of this.agents.values()) {
            let score = 0;
            const matches = [];

            if (agent.agent.name.toLowerCase().includes(searchTerm)) {
                score += 10;
                matches.push('name');
            }
            if (agent.agent.title.toLowerCase().includes(searchTerm)) {
                score += 8;
                matches.push('title');
            }
            if (agent.agent.id.toLowerCase().includes(searchTerm)) {
                score += 6;
                matches.push('id');
            }
            if (agent.persona.role.toLowerCase().includes(searchTerm)) {
                score += 5;
                matches.push('role');
            }
            if (agent.agent.whenToUse && agent.agent.whenToUse.toLowerCase().includes(searchTerm)) {
                score += 4;
                matches.push('whenToUse');
            }

            if (score > 0) {
                results.push({
                    agent,
                    score,
                    matches
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    resolveDependencies(agentId) {
        const agent = this.getAgent(agentId);
        if (!agent || !agent.dependencies) {
            return { resolved: [], missing: [] };
        }

        const resolved = [];
        const missing = [];

        for (const [type, deps] of Object.entries(agent.dependencies)) {
            for (const dep of deps) {
                if (this.checkDependency(type, dep)) {
                    resolved.push({ type, name: dep });
                } else {
                    missing.push({ type, name: dep });
                }
            }
        }

        return { resolved, missing };
    }

    checkDependency(type, name) {
        switch (type) {
            case 'tasks':
                return fs.existsSync(path.join(this.agentsDir, '../tasks', `${name}`));
            case 'templates':
                return fs.existsSync(path.join(this.agentsDir, '../templates', `${name}`));
            case 'checklists':
                return fs.existsSync(path.join(this.agentsDir, '../checklists', `${name}`));
            case 'data':
                return fs.existsSync(path.join(this.agentsDir, '../data', `${name}`));
            case 'workflows':
                return fs.existsSync(path.join(this.agentsDir, '../workflows', `${name}`));
            case 'utils':
                return fs.existsSync(path.join(this.agentsDir, '../utils', `${name}`));
            default:
                return false;
        }
    }

    activateAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        if (agent._metadata.status === 'active') {
            return { success: true, message: 'Agent already active' };
        }

        const dependencies = this.resolveDependencies(agentId);
        if (dependencies.missing.length > 0) {
            return {
                success: false,
                message: 'Missing dependencies',
                missing: dependencies.missing
            };
        }

        agent._metadata.status = 'active';
        agent._metadata.activated = new Date();
        
        this.emit('agent_activated', { id: agentId });
        return { success: true, message: 'Agent activated successfully' };
    }

    deactivateAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        agent._metadata.status = 'inactive';
        agent._metadata.deactivated = new Date();
        
        this.emit('agent_deactivated', { id: agentId });
        return { success: true, message: 'Agent deactivated successfully' };
    }

    enableHotReload() {
        try {
            for (const [agentId, agent] of this.agents.entries()) {
                const filepath = agent._metadata.filepath;
                
                if (this.watchers.has(agentId)) {
                    continue;
                }

                const watcher = fs.watchFile(filepath, (curr, prev) => {
                    if (curr.mtime > prev.mtime) {
                        this.reloadAgent(agentId).catch(error => {
                            this.emit('reload_error', { id: agentId, error: error.message });
                        });
                    }
                });

                this.watchers.set(agentId, watcher);
            }

            this.emit('hot_reload_enabled');
            return { success: true, message: 'Hot reload enabled for all agents' };
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    disableHotReload() {
        for (const [agentId, watcher] of this.watchers.entries()) {
            fs.unwatchFile(watcher);
            this.watchers.delete(agentId);
        }

        this.emit('hot_reload_disabled');
        return { success: true, message: 'Hot reload disabled' };
    }

    async reloadAgent(agentId) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }

            const filepath = agent._metadata.filepath;
            const newAgentData = await this.parseAgentFile(filepath);
            
            if (!this.validateAgent(newAgentData)) {
                throw new Error(`Validation failed for reloaded agent ${agentId}`);
            }

            this.agents.set(agentId, {
                ...newAgentData,
                _metadata: {
                    ...agent._metadata,
                    reloaded: new Date(),
                    reloadCount: (agent._metadata.reloadCount || 0) + 1
                }
            });

            this.cache.delete(agentId);
            
            this.emit('agent_reloaded', { id: agentId });
            return { success: true, message: `Agent ${agentId} reloaded successfully` };
        } catch (error) {
            this.emit('reload_error', { id: agentId, error: error.message });
            throw error;
        }
    }

    getAgentStats() {
        const stats = {
            total: this.agents.size,
            active: 0,
            inactive: 0,
            types: { primary: 0, secondary: 0, utility: 0, meta: 0 },
            mostAccessed: null,
            leastAccessed: null,
            totalAccess: 0
        };

        let maxAccess = -1;
        let minAccess = Infinity;

        for (const [agentId, agent] of this.agents.entries()) {
            if (agent.agent.status === 'active') {
                stats.active++;
            } else {
                stats.inactive++;
            }

            stats.types[agent.agent.type]++;

            const cacheEntry = this.cache.get(agentId);
            if (cacheEntry) {
                stats.totalAccess += cacheEntry.accessCount;
                
                if (cacheEntry.accessCount > maxAccess) {
                    maxAccess = cacheEntry.accessCount;
                    stats.mostAccessed = agentId;
                }
                
                if (cacheEntry.accessCount < minAccess) {
                    minAccess = cacheEntry.accessCount;
                    stats.leastAccessed = agentId;
                }
            }
        }

        return stats;
    }

    cleanup() {
        this.disableHotReload();
        this.agents.clear();
        this.cache.clear();
        this.removeAllListeners();
    }
}

export default AgentSystem;