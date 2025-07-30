import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import Joi from 'joi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * BundleManager - Manages Super Agents bundles and team configurations
 * Handles bundle loading, validation, creation, and export
 */
class BundleManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            bundlesPath: options.bundlesPath || path.join(__dirname, '../../integrations/standalone/bundles'),
            customBundlesPath: options.customBundlesPath || path.join(process.cwd(), '.super-agents/bundles'),
            logLevel: options.logLevel || 'info',
            validateOnLoad: options.validateOnLoad !== false,
            ...options
        };
        
        this.bundles = new Map();
        this.bundleTypes = ['team-bundles', 'single-agents', 'custom-configs'];
        this.schema = this.createBundleSchema();
        
        this.log('BundleManager initialized', { options: this.options });
    }

    /**
     * Create bundle validation schema
     * @returns {Object} Joi schema for bundle validation
     */
    createBundleSchema() {
        return Joi.object({
            bundle: Joi.object({
                id: Joi.string().required(),
                name: Joi.string().required(),
                version: Joi.string().default('1.0.0'),
                description: Joi.string().required(),
                category: Joi.string().valid('team', 'single', 'custom').default('custom')
            }).required(),
            
            metadata: Joi.object({
                author: Joi.string().optional(),
                created: Joi.date().optional(),
                framework: Joi.string().default('super-agents-v1'),
                target_audience: Joi.alternatives().try(
                    Joi.string(),
                    Joi.array().items(Joi.string())
                ).optional(),
                project_types: Joi.array().items(Joi.string()).optional()
            }).optional(),
            
            configuration: Joi.object({
                installation_type: Joi.string().optional(),
                mcp_integration: Joi.alternatives().try(
                    Joi.boolean(),
                    Joi.string().valid('basic', 'advanced', 'enterprise')
                ).optional(),
                template_integration: Joi.alternatives().try(
                    Joi.boolean(),
                    Joi.string().valid('basic', 'comprehensive')
                ).optional(),
                task_management: Joi.string().valid('simple', 'hierarchical', 'hierarchical-advanced').optional(),
                workflow_orchestration: Joi.boolean().optional(),
                governance: Joi.boolean().optional()
            }).optional(),
            
            agents: Joi.array().items(
                Joi.object({
                    id: Joi.string().required(),
                    role: Joi.string().required(),
                    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
                    required: Joi.boolean().default(true),
                    tools: Joi.array().items(Joi.string()).optional(),
                    templates: Joi.array().items(Joi.string()).optional(),
                    focus: Joi.string().optional(),
                    note: Joi.string().optional(),
                    authority: Joi.string().optional(),
                    responsibilities: Joi.array().items(Joi.string()).optional()
                })
            ).min(1).required(),
            
            workflows: Joi.object().pattern(
                Joi.string(),
                Joi.object({
                    name: Joi.string().required(),
                    description: Joi.string().required(),
                    phases: Joi.array().items(
                        Joi.object({
                            name: Joi.string().required(),
                            agents: Joi.array().items(Joi.string()).required(),
                            tools: Joi.array().items(Joi.string()).optional(),
                            templates: Joi.array().items(Joi.string()).optional(),
                            governance: Joi.array().items(Joi.string()).optional(),
                            duration: Joi.string().optional()
                        })
                    ).optional()
                })
            ).optional(),
            
            tools: Joi.object().pattern(
                Joi.string(),
                Joi.array().items(Joi.string())
            ).optional(),
            
            templates: Joi.object().pattern(
                Joi.string(),
                Joi.array().items(Joi.string())
            ).optional(),
            
            ide_integrations: Joi.object().optional(),
            installation: Joi.object().optional(),
            usage_examples: Joi.object().optional(),
            best_practices: Joi.object().optional(),
            excluded_components: Joi.object().optional(),
            support: Joi.object().optional()
        });
    }

    /**
     * Initialize bundle manager and load all bundles
     * @returns {Promise<Object>} Initialization result
     */
    async initialize() {
        try {
            this.log('Initializing BundleManager');
            this.emit('initializationStarted');
            
            // Create custom bundles directory if it doesn't exist
            if (!fs.existsSync(this.options.customBundlesPath)) {
                fs.mkdirSync(this.options.customBundlesPath, { recursive: true });
            }
            
            // Load all bundles
            const loadResult = await this.loadAllBundles();
            
            this.log('BundleManager initialized successfully', { 
                bundlesLoaded: loadResult.loaded,
                bundlesFailed: loadResult.failed 
            });
            
            this.emit('initializationCompleted', loadResult);
            
            return {
                success: true,
                bundlesLoaded: loadResult.loaded,
                bundlesFailed: loadResult.failed,
                totalBundles: this.bundles.size
            };
            
        } catch (error) {
            this.log('BundleManager initialization failed', { error: error.message }, 'error');
            this.emit('initializationFailed', { error });
            throw error;
        }
    }

    /**
     * Load all bundles from configured directories
     * @returns {Promise<Object>} Load result
     */
    async loadAllBundles() {
        const results = { loaded: 0, failed: 0, errors: [] };
        
        // Load from standard bundle directories
        for (const bundleType of this.bundleTypes) {
            const bundleDir = path.join(this.options.bundlesPath, bundleType);
            
            if (fs.existsSync(bundleDir)) {
                const typeResult = await this.loadBundlesFromDirectory(bundleDir, bundleType);
                results.loaded += typeResult.loaded;
                results.failed += typeResult.failed;
                results.errors.push(...typeResult.errors);
            }
        }
        
        // Load from custom bundles directory
        if (fs.existsSync(this.options.customBundlesPath)) {
            const customResult = await this.loadBundlesFromDirectory(this.options.customBundlesPath, 'custom');
            results.loaded += customResult.loaded;
            results.failed += customResult.failed;
            results.errors.push(...customResult.errors);
        }
        
        return results;
    }

    /**
     * Load bundles from a specific directory
     * @param {string} directory - Directory path
     * @param {string} type - Bundle type
     * @returns {Promise<Object>} Load result
     */
    async loadBundlesFromDirectory(directory, type) {
        const results = { loaded: 0, failed: 0, errors: [] };
        
        try {
            const files = fs.readdirSync(directory);
            const bundleFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
            
            for (const file of bundleFiles) {
                try {
                    const filePath = path.join(directory, file);
                    await this.loadBundle(filePath, type);
                    results.loaded++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        file,
                        error: error.message,
                        type
                    });
                    this.log(`Failed to load bundle ${file}`, { error: error.message, type }, 'warn');
                }
            }
            
        } catch (error) {
            this.log(`Failed to read directory ${directory}`, { error: error.message }, 'error');
        }
        
        return results;
    }

    /**
     * Load a single bundle from file
     * @param {string} filePath - Bundle file path
     * @param {string} type - Bundle type
     * @returns {Promise<Object>} Loaded bundle
     */
    async loadBundle(filePath, type) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const bundleData = yaml.parse(content);
            
            // Validate bundle if enabled
            if (this.options.validateOnLoad) {
                const validation = this.validateBundle(bundleData);
                if (!validation.isValid) {
                    throw new Error(`Bundle validation failed: ${validation.errors.join(', ')}`);
                }
            }
            
            // Add metadata
            const bundle = {
                ...bundleData,
                _metadata: {
                    filePath,
                    type,
                    loaded: new Date(),
                    filename: path.basename(filePath)
                }
            };
            
            // Store bundle
            this.bundles.set(bundle.bundle.id, bundle);
            
            this.log(`Loaded bundle: ${bundle.bundle.id}`, { 
                name: bundle.bundle.name,
                type,
                agents: bundle.agents?.length || 0
            });
            
            this.emit('bundleLoaded', { 
                id: bundle.bundle.id, 
                bundle,
                type 
            });
            
            return bundle;
            
        } catch (error) {
            this.emit('bundleLoadError', { filePath, error });
            throw new Error(`Failed to load bundle from ${filePath}: ${error.message}`);
        }
    }

    /**
     * Validate bundle data
     * @param {Object} bundleData - Bundle data to validate
     * @returns {Object} Validation result
     */
    validateBundle(bundleData) {
        try {
            const { error, value } = this.schema.validate(bundleData, {
                allowUnknown: true,
                stripUnknown: false,
                abortEarly: false
            });
            
            if (error) {
                return {
                    isValid: false,
                    errors: error.details.map(detail => detail.message),
                    value: null
                };
            }
            
            return {
                isValid: true,
                errors: [],
                value
            };
            
        } catch (error) {
            return {
                isValid: false,
                errors: [error.message],
                value: null
            };
        }
    }

    /**
     * Get bundle by ID
     * @param {string} bundleId - Bundle ID
     * @returns {Object|null} Bundle or null if not found
     */
    getBundle(bundleId) {
        return this.bundles.get(bundleId) || null;
    }

    /**
     * List all bundles with optional filters
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered bundles
     */
    listBundles(filters = {}) {
        let bundles = Array.from(this.bundles.values());
        
        // Filter by type
        if (filters.type) {
            bundles = bundles.filter(bundle => bundle._metadata.type === filters.type);
        }
        
        // Filter by category
        if (filters.category) {
            bundles = bundles.filter(bundle => bundle.bundle.category === filters.category);
        }
        
        // Filter by agent count
        if (filters.minAgents) {
            bundles = bundles.filter(bundle => 
                bundle.agents && bundle.agents.length >= filters.minAgents
            );
        }
        
        if (filters.maxAgents) {
            bundles = bundles.filter(bundle => 
                !bundle.agents || bundle.agents.length <= filters.maxAgents
            );
        }
        
        // Filter by search term
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            bundles = bundles.filter(bundle => {
                const searchableText = [
                    bundle.bundle.name,
                    bundle.bundle.description,
                    bundle.bundle.id,
                    ...(bundle.metadata?.target_audience ? [bundle.metadata.target_audience].flat() : []),
                    ...(bundle.metadata?.project_types || [])
                ].join(' ').toLowerCase();
                
                return searchableText.includes(searchTerm);
            });
        }
        
        // Sort bundles
        const sortBy = filters.sortBy || 'name';
        bundles.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.bundle.name.localeCompare(b.bundle.name);
                case 'id':
                    return a.bundle.id.localeCompare(b.bundle.id);
                case 'agents':
                    return (b.agents?.length || 0) - (a.agents?.length || 0);
                case 'created':
                    return new Date(b._metadata.loaded) - new Date(a._metadata.loaded);
                default:
                    return 0;
            }
        });
        
        return bundles;
    }

    /**
     * Create a new bundle
     * @param {Object} bundleData - Bundle configuration
     * @param {string} outputPath - Output file path (optional)
     * @returns {Promise<Object>} Created bundle
     */
    async createBundle(bundleData, outputPath = null) {
        try {
            this.log('Creating new bundle', { id: bundleData.bundle?.id });
            this.emit('bundleCreationStarted', { bundleData });
            
            // Validate bundle data
            const validation = this.validateBundle(bundleData);
            if (!validation.isValid) {
                throw new Error(`Bundle validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Generate output path if not provided
            if (!outputPath) {
                const filename = `${bundleData.bundle.id}.yaml`;
                outputPath = path.join(this.options.customBundlesPath, filename);
            }
            
            // Add creation metadata
            const bundle = {
                ...bundleData,
                metadata: {
                    ...bundleData.metadata,
                    created: new Date(),
                    framework: 'super-agents-v1'
                }
            };
            
            // Write bundle to file
            const yamlContent = yaml.stringify(bundle, { indent: 2 });
            fs.writeFileSync(outputPath, yamlContent, 'utf8');
            
            // Load the bundle
            await this.loadBundle(outputPath, 'custom');
            
            this.log(`Bundle created: ${bundle.bundle.id}`, { outputPath });
            this.emit('bundleCreated', { 
                id: bundle.bundle.id, 
                bundle, 
                outputPath 
            });
            
            return {
                success: true,
                bundle,
                outputPath,
                id: bundle.bundle.id
            };
            
        } catch (error) {
            this.log('Bundle creation failed', { error: error.message }, 'error');
            this.emit('bundleCreationFailed', { error, bundleData });
            throw error;
        }
    }

    /**
     * Export bundle for installation
     * @param {string} bundleId - Bundle ID to export
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async exportBundle(bundleId, options = {}) {
        try {
            const bundle = this.getBundle(bundleId);
            if (!bundle) {
                throw new Error(`Bundle not found: ${bundleId}`);
            }
            
            this.log(`Exporting bundle: ${bundleId}`, options);
            this.emit('bundleExportStarted', { bundleId, options });
            
            const exportDir = options.outputPath || 
                path.join(process.cwd(), `bundle-export-${bundleId}`);
            
            // Create export directory
            fs.mkdirSync(exportDir, { recursive: true });
            
            const exportResult = {
                bundleId,
                bundleName: bundle.bundle.name,
                exportPath: exportDir,
                files: [],
                agents: bundle.agents || [],
                tools: this.extractToolsList(bundle),
                templates: this.extractTemplatesList(bundle),
                workflows: Object.keys(bundle.workflows || {}),
                metadata: bundle.metadata
            };
            
            // Export bundle configuration
            const bundleConfigPath = path.join(exportDir, 'bundle.yaml');
            const bundleConfig = { ...bundle };
            delete bundleConfig._metadata; // Remove internal metadata
            
            fs.writeFileSync(bundleConfigPath, yaml.stringify(bundleConfig, { indent: 2 }));
            exportResult.files.push(bundleConfigPath);
            
            // Export installation instructions
            const installInstructions = this.generateInstallationInstructions(bundle);
            const installPath = path.join(exportDir, 'INSTALL.md');
            fs.writeFileSync(installPath, installInstructions);
            exportResult.files.push(installPath);
            
            // Export agent list
            const agentsList = this.generateAgentsList(bundle);
            const agentsPath = path.join(exportDir, 'AGENTS.md');
            fs.writeFileSync(agentsPath, agentsList);
            exportResult.files.push(agentsPath);
            
            // Export usage guide
            const usageGuide = this.generateUsageGuide(bundle);
            const usagePath = path.join(exportDir, 'USAGE.md');
            fs.writeFileSync(usagePath, usageGuide);
            exportResult.files.push(usagePath);
            
            this.log(`Bundle exported: ${bundleId}`, { exportPath: exportDir });
            this.emit('bundleExported', { bundleId, exportResult });
            
            return exportResult;
            
        } catch (error) {
            this.log('Bundle export failed', { error: error.message, bundleId }, 'error');
            this.emit('bundleExportFailed', { error, bundleId });
            throw error;
        }
    }

    /**
     * Extract tools list from bundle
     * @param {Object} bundle - Bundle data
     * @returns {Array} Tools list
     */
    extractToolsList(bundle) {
        const tools = new Set();
        
        // Add core tools
        if (bundle.tools?.core) {
            bundle.tools.core.forEach(tool => tools.add(tool));
        }
        
        // Add agent-specific tools
        if (bundle.agents) {
            bundle.agents.forEach(agent => {
                if (agent.tools) {
                    agent.tools.forEach(tool => tools.add(tool));
                }
            });
        }
        
        // Add tools from bundle.tools object
        if (bundle.tools) {
            Object.values(bundle.tools).forEach(toolList => {
                if (Array.isArray(toolList)) {
                    toolList.forEach(tool => tools.add(tool));
                }
            });
        }
        
        return Array.from(tools).sort();
    }

    /**
     * Extract templates list from bundle
     * @param {Object} bundle - Bundle data
     * @returns {Array} Templates list
     */
    extractTemplatesList(bundle) {
        const templates = new Set();
        
        // Add agent-specific templates
        if (bundle.agents) {
            bundle.agents.forEach(agent => {
                if (agent.templates) {
                    agent.templates.forEach(template => templates.add(template));
                }
            });
        }
        
        // Add templates from bundle.templates object
        if (bundle.templates) {
            Object.values(bundle.templates).forEach(templateList => {
                if (Array.isArray(templateList)) {
                    templateList.forEach(template => templates.add(template));
                }
            });
        }
        
        return Array.from(templates).sort();
    }

    /**
     * Generate installation instructions
     * @param {Object} bundle - Bundle data
     * @returns {string} Installation instructions
     */
    generateInstallationInstructions(bundle) {
        return `# ${bundle.bundle.name} - Installation Instructions

## Overview
${bundle.bundle.description}

## Prerequisites
${bundle.installation?.prerequisites ? 
    Object.entries(bundle.installation.prerequisites)
        .map(([key, value]) => `- **${key}**: ${value}`)
        .join('\n') :
    '- Node.js 18+\n- npm 8+\n- Git 2+'
}

## Installation Steps

### 1. Install Super Agents Framework
\`\`\`bash
# Install Super Agents if not already installed
npm install -g super-agents-framework
\`\`\`

### 2. Install Bundle
\`\`\`bash
# Install this bundle
sa bundle install ${bundle.bundle.id}
\`\`\`

### 3. Configure IDE Integration
Choose your preferred IDE integration:

#### Claude Code
\`\`\`bash
sa export --bundle=${bundle.bundle.id} --format=claude-code
\`\`\`

#### Cursor
\`\`\`bash
sa export --bundle=${bundle.bundle.id} --format=cursor
\`\`\`

#### VS Code
\`\`\`bash
sa export --bundle=${bundle.bundle.id} --format=vscode
\`\`\`

### 4. Verify Installation
\`\`\`bash
sa bundle validate ${bundle.bundle.id}
\`\`\`

## Included Components

### Agents (${bundle.agents?.length || 0})
${bundle.agents?.map(agent => 
    `- **${agent.role}** (\`${agent.id}\`): ${agent.focus || 'Specialized agent functionality'}`
).join('\n') || 'No agents specified'}

### Tools
${this.extractToolsList(bundle).map(tool => `- ${tool}`).join('\n')}

### Templates
${this.extractTemplatesList(bundle).map(template => `- ${template}`).join('\n')}

### Workflows
${Object.keys(bundle.workflows || {}).map(workflow => `- ${workflow}`).join('\n')}

## Configuration
${bundle.configuration ? yaml.stringify(bundle.configuration, { indent: 2 }) : 'Default configuration will be used.'}

## Support
${bundle.support ? 
    Object.entries(bundle.support)
        .map(([key, value]) => `### ${key}\n${Array.isArray(value) ? value.map(v => `- ${v}`).join('\n') : value}`)
        .join('\n\n') :
    'Refer to Super Agents documentation for support.'
}

Generated on: ${new Date().toISOString()}
Bundle Version: ${bundle.bundle.version}
`;
    }

    /**
     * Generate agents list documentation
     * @param {Object} bundle - Bundle data
     * @returns {string} Agents list
     */
    generateAgentsList(bundle) {
        return `# ${bundle.bundle.name} - Agents Reference

${bundle.agents?.map(agent => `## ${agent.role} (\`${agent.id}\`)

**Priority**: ${agent.priority}
**Required**: ${agent.required ? 'Yes' : 'No'}

${agent.focus ? `**Focus**: ${agent.focus}` : ''}
${agent.note ? `**Note**: ${agent.note}` : ''}
${agent.authority ? `**Authority**: ${agent.authority}` : ''}

### Responsibilities
${agent.responsibilities ? 
    agent.responsibilities.map(r => `- ${r}`).join('\n') :
    'Standard agent responsibilities as defined in agent definition'
}

### Tools
${agent.tools ? 
    agent.tools.map(tool => `- \`${tool}\``).join('\n') :
    'No specific tools assigned'
}

### Templates
${agent.templates ? 
    agent.templates.map(template => `- \`${template}\``).join('\n') :
    'No specific templates assigned'
}

---
`).join('\n') || 'No agents defined in this bundle.'}

Generated on: ${new Date().toISOString()}
`;
    }

    /**
     * Generate usage guide
     * @param {Object} bundle - Bundle data
     * @returns {string} Usage guide
     */
    generateUsageGuide(bundle) {
        return `# ${bundle.bundle.name} - Usage Guide

## Getting Started

After installation, you can use this bundle's agents and workflows in your development process.

## Available Workflows

${Object.entries(bundle.workflows || {}).map(([key, workflow]) => `### ${workflow.name}
${workflow.description}

**Phases**:
${workflow.phases?.map(phase => 
    `1. **${phase.name}**: ${phase.agents.join(', ')}`
).join('\n') || 'No phases defined'}
`).join('\n')}

## Usage Examples

${Object.entries(bundle.usage_examples || {}).map(([key, example]) => `### ${example.description}
${example.commands ? 
    example.commands.map(cmd => `- \`${cmd}\``).join('\n') :
    'No specific commands provided'
}
`).join('\n')}

## Best Practices

${Object.entries(bundle.best_practices || {}).map(([category, practices]) => `### ${category}
${Array.isArray(practices) ? 
    practices.map(practice => `- ${practice}`).join('\n') :
    typeof practices === 'object' ?
        Object.entries(practices).map(([key, value]) => 
            `#### ${key}\n${Array.isArray(value) ? value.map(v => `- ${v}`).join('\n') : value}`
        ).join('\n\n') :
        practices
}
`).join('\n\n')}

## Team Structure

${bundle.team_structure ? yaml.stringify(bundle.team_structure, { indent: 2 }) : 'No specific team structure defined.'}

## Technology Focus

${bundle.technology_focus ? yaml.stringify(bundle.technology_focus, { indent: 2 }) : 'No specific technology focus defined.'}

Generated on: ${new Date().toISOString()}
`;
    }

    /**
     * Delete a bundle
     * @param {string} bundleId - Bundle ID to delete
     * @param {boolean} deleteFile - Whether to delete the file
     * @returns {Promise<boolean>} Success status
     */
    async deleteBundle(bundleId, deleteFile = false) {
        try {
            const bundle = this.getBundle(bundleId);
            if (!bundle) {
                throw new Error(`Bundle not found: ${bundleId}`);
            }
            
            // Remove from memory
            this.bundles.delete(bundleId);
            
            // Delete file if requested and it's a custom bundle
            if (deleteFile && bundle._metadata.type === 'custom') {
                if (fs.existsSync(bundle._metadata.filePath)) {
                    fs.unlinkSync(bundle._metadata.filePath);
                }
            }
            
            this.log(`Bundle deleted: ${bundleId}`, { deleteFile });
            this.emit('bundleDeleted', { bundleId, deleteFile });
            
            return true;
            
        } catch (error) {
            this.log('Bundle deletion failed', { error: error.message, bundleId }, 'error');
            this.emit('bundleDeletionFailed', { error, bundleId });
            throw error;
        }
    }

    /**
     * Get bundle statistics
     * @returns {Object} Bundle statistics
     */
    getBundleStats() {
        const stats = {
            totalBundles: this.bundles.size,
            byType: {},
            byCategory: {},
            agentCounts: {},
            mostPopularAgents: {},
            averageAgentsPerBundle: 0
        };
        
        let totalAgents = 0;
        const agentFrequency = {};
        
        for (const bundle of this.bundles.values()) {
            // Count by type
            const type = bundle._metadata.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            
            // Count by category
            const category = bundle.bundle.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            
            // Count agents
            const agentCount = bundle.agents?.length || 0;
            totalAgents += agentCount;
            
            const agentCountRange = this.getAgentCountRange(agentCount);
            stats.agentCounts[agentCountRange] = (stats.agentCounts[agentCountRange] || 0) + 1;
            
            // Track agent frequency
            if (bundle.agents) {
                bundle.agents.forEach(agent => {
                    agentFrequency[agent.id] = (agentFrequency[agent.id] || 0) + 1;
                });
            }
        }
        
        // Calculate average agents per bundle
        stats.averageAgentsPerBundle = this.bundles.size > 0 ? 
            Math.round(totalAgents / this.bundles.size * 100) / 100 : 0;
        
        // Find most popular agents
        stats.mostPopularAgents = Object.entries(agentFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [agent, count]) => {
                obj[agent] = count;
                return obj;
            }, {});
        
        return stats;
    }

    /**
     * Get agent count range for statistics
     * @param {number} count - Agent count
     * @returns {string} Count range
     */
    getAgentCountRange(count) {
        if (count === 0) return '0';
        if (count <= 3) return '1-3';
        if (count <= 6) return '4-6';
        if (count <= 10) return '7-10';
        return '10+';
    }

    /**
     * Search bundles
     * @param {string} query - Search query
     * @returns {Array} Search results
     */
    searchBundles(query) {
        const searchTerm = query.toLowerCase();
        const results = [];
        
        for (const bundle of this.bundles.values()) {
            let score = 0;
            const matches = [];
            
            // Check bundle name
            if (bundle.bundle.name.toLowerCase().includes(searchTerm)) {
                score += 10;
                matches.push('name');
            }
            
            // Check bundle ID
            if (bundle.bundle.id.toLowerCase().includes(searchTerm)) {
                score += 8;
                matches.push('id');
            }
            
            // Check description
            if (bundle.bundle.description.toLowerCase().includes(searchTerm)) {
                score += 6;
                matches.push('description');
            }
            
            // Check agents
            if (bundle.agents) {
                const agentMatches = bundle.agents.filter(agent => 
                    agent.id.toLowerCase().includes(searchTerm) ||
                    agent.role.toLowerCase().includes(searchTerm)
                );
                if (agentMatches.length > 0) {
                    score += agentMatches.length * 3;
                    matches.push('agents');
                }
            }
            
            // Check target audience
            if (bundle.metadata?.target_audience) {
                const audience = Array.isArray(bundle.metadata.target_audience) ?
                    bundle.metadata.target_audience.join(' ') :
                    bundle.metadata.target_audience;
                
                if (audience.toLowerCase().includes(searchTerm)) {
                    score += 4;
                    matches.push('target_audience');
                }
            }
            
            if (score > 0) {
                results.push({
                    bundle,
                    score,
                    matches
                });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Logging utility
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @param {string} level - Log level
     */
    log(message, data = {}, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            component: 'BundleManager',
            ...data
        };
        
        this.emit('log', logEntry);
        
        const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = logLevels[this.options.logLevel] || 1;
        const messageLevel = logLevels[level] || 1;
        
        if (messageLevel >= currentLevel) {
            const prefix = `[BundleManager ${level.toUpperCase()}]`;
            console.log(`${prefix} ${message}`, Object.keys(data).length > 0 ? data : '');
        }
    }

    /**
     * Cleanup resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        this.bundles.clear();
        this.removeAllListeners();
    }
}

export default BundleManager;