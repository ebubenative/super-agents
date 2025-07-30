import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import Handlebars from 'handlebars';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import Joi from 'joi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        // Handle both string path and options object
        if (typeof options === 'string') {
            this.templatesDir = options;
        } else {
            this.templatesDir = options.templatesPath || options.templatesDir || __dirname;
        }
        this.cache = new Map();
        this.partials = new Map();
        this.helpers = new Map();
        this.compiledTemplates = new Map();
        this.schema = this.createTemplateSchema();
        this.registerDefaultHelpers();
    }

    createTemplateSchema() {
        return Joi.object({
            template: Joi.object({
                id: Joi.string().required(),
                name: Joi.string().required(),
                version: Joi.string().default('1.0'),
                description: Joi.string().optional(),
                tags: Joi.array().items(Joi.string()).default([]),
                extends: Joi.string().optional(),
                output: Joi.object({
                    format: Joi.string().valid('markdown', 'text', 'html', 'json').default('markdown'),
                    filename: Joi.string().optional(),
                    title: Joi.string().optional()
                }).optional()
            }).required(),
            
            metadata: Joi.object({
                author: Joi.string().optional(),
                created: Joi.date().optional(),
                modified: Joi.date().optional(),
                framework: Joi.string().default('super-agents'),
                bmadCompatible: Joi.boolean().default(true)
            }).default({}),
            
            workflow: Joi.object({
                mode: Joi.string().valid('interactive', 'yolo', 'guided').default('interactive'),
                elicitation: Joi.string().optional(),
                customElicitation: Joi.object({
                    title: Joi.string().optional(),
                    options: Joi.array().items(Joi.string()).optional()
                }).optional(),
                hooks: Joi.object({
                    beforeRender: Joi.string().optional(),
                    afterRender: Joi.string().optional(),
                    onError: Joi.string().optional()
                }).optional()
            }).optional(),
            
            variables: Joi.object({
                required: Joi.array().items(Joi.string()).default([]),
                optional: Joi.array().items(Joi.string()).default([]),
                defaults: Joi.object().optional()
            }).optional(),
            
            sections: Joi.array().items(
                Joi.object({
                    id: Joi.string().required(),
                    title: Joi.string().optional(),
                    instruction: Joi.string().optional(),
                    template: Joi.string().optional(),
                    content: Joi.string().optional(),
                    type: Joi.string().valid('text', 'markdown', 'bullet-list', 'numbered-list', 'table', 'code').optional(),
                    elicit: Joi.boolean().default(false),
                    required: Joi.boolean().default(true),
                    conditions: Joi.object().optional(),
                    sections: Joi.array().items(Joi.link('#section')).optional(),
                    examples: Joi.array().items(Joi.string()).optional(),
                    validation: Joi.object().optional()
                }).id('section')
            ).default([]),
            
            partials: Joi.object().optional(),
            
            inheritance: Joi.object({
                parent: Joi.string().optional(),
                blocks: Joi.object().optional(),
                overrides: Joi.object().optional()
            }).optional()
        });
    }

    registerDefaultHelpers() {
        Handlebars.registerHelper('toUpperCase', (str) => {
            return typeof str === 'string' ? str.toUpperCase() : str;
        });
        
        Handlebars.registerHelper('toLowerCase', (str) => {
            return typeof str === 'string' ? str.toLowerCase() : str;
        });
        
        Handlebars.registerHelper('capitalize', (str) => {
            return typeof str === 'string' ? 
                str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;
        });
        
        Handlebars.registerHelper('date', (format) => {
            const now = new Date();
            switch (format) {
                case 'iso': return now.toISOString();
                case 'short': return now.toLocaleDateString();
                case 'long': return now.toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                });
                default: return now.toString();
            }
        });
        
        Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });
        
        Handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
            return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
        });
        
        Handlebars.registerHelper('repeat', function(count, options) {
            let result = '';
            for (let i = 0; i < count; i++) {
                result += options.fn({ index: i, count: count });
            }
            return result;
        });
        
        Handlebars.registerHelper('markdown', (text) => {
            return new Handlebars.SafeString(text);
        });
        
        Handlebars.registerHelper('bullet', function(items, options) {
            if (!Array.isArray(items)) return '';
            return items.map(item => `- ${item}`).join('\n');
        });
        
        Handlebars.registerHelper('numbered', function(items, options) {
            if (!Array.isArray(items)) return '';
            return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
        });

        Handlebars.registerHelper('includes', function(array, item) {
            return Array.isArray(array) && array.includes(item);
        });

        Handlebars.registerHelper('eq', function(a, b) {
            return a === b;
        });

        Handlebars.registerHelper('kebabCase', function(str) {
            return typeof str === 'string' ? 
                str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : str;
        });
    }

    registerHelper(name, helperFunction) {
        Handlebars.registerHelper(name, helperFunction);
        this.helpers.set(name, helperFunction);
        this.emit('helper_registered', { name });
    }

    registerPartial(name, template) {
        Handlebars.registerPartial(name, template);
        this.partials.set(name, template);
        this.emit('partial_registered', { name });
    }

    async loadTemplate(templateName) {
        try {
            if (this.cache.has(templateName)) {
                const cached = this.cache.get(templateName);
                if (this.isTemplateFresh(cached)) {
                    return cached.template;
                }
            }

            const templatePath = this.resolveTemplatePath(templateName);
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            const templateData = yaml.parse(templateContent);
            
            const validatedTemplate = this.validateTemplate(templateData);
            
            if (validatedTemplate.template.extends) {
                const parentTemplate = await this.loadTemplate(validatedTemplate.template.extends);
                validatedTemplate = this.mergeWithParent(validatedTemplate, parentTemplate);
            }
            
            this.cache.set(templateName, {
                template: validatedTemplate,
                loaded: new Date(),
                filepath: templatePath,
                stats: fs.statSync(templatePath)
            });
            
            this.emit('template_loaded', { name: templateName, path: templatePath });
            return validatedTemplate;
            
        } catch (error) {
            this.emit('template_load_error', { name: templateName, error: error.message });
            throw new Error(`Failed to load template '${templateName}': ${error.message}`);
        }
    }

    resolveTemplatePath(templateName) {
        const extensions = ['.yaml', '.yml'];
        
        for (const ext of extensions) {
            const fullPath = path.join(this.templatesDir, templateName + ext);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
            
            const withTemplate = path.join(this.templatesDir, templateName + '-tmpl' + ext);
            if (fs.existsSync(withTemplate)) {
                return withTemplate;
            }
        }
        
        throw new Error(`Template file not found: ${templateName}`);
    }

    isTemplateFresh(cached) {
        try {
            const currentStats = fs.statSync(cached.filepath);
            return currentStats.mtime <= cached.stats.mtime;
        } catch (error) {
            return false;
        }
    }

    validateTemplate(templateData) {
        const { error, value } = this.schema.validate(templateData, {
            allowUnknown: false,
            stripUnknown: true,
            abortEarly: false
        });
        
        if (error) {
            throw new Error(`Template validation failed: ${error.details.map(d => d.message).join(', ')}`);
        }
        
        return value;
    }

    mergeWithParent(childTemplate, parentTemplate) {
        const merged = JSON.parse(JSON.stringify(parentTemplate));
        
        merged.template = { ...parentTemplate.template, ...childTemplate.template };
        merged.metadata = { ...parentTemplate.metadata, ...childTemplate.metadata };
        merged.workflow = { ...parentTemplate.workflow, ...childTemplate.workflow };
        merged.variables = { ...parentTemplate.variables, ...childTemplate.variables };
        
        if (childTemplate.inheritance?.overrides) {
            for (const [sectionId, override] of Object.entries(childTemplate.inheritance.overrides)) {
                const section = this.findSection(merged.sections, sectionId);
                if (section) {
                    Object.assign(section, override);
                }
            }
        }
        
        if (childTemplate.sections && childTemplate.sections.length > 0) {
            merged.sections = [...merged.sections, ...childTemplate.sections];
        }
        
        return merged;
    }

    findSection(sections, sectionId) {
        for (const section of sections) {
            if (section.id === sectionId) {
                return section;
            }
            if (section.sections) {
                const found = this.findSection(section.sections, sectionId);
                if (found) return found;
            }
        }
        return null;
    }

    async renderTemplate(templateName, context = {}, options = {}) {
        try {
            const template = await this.loadTemplate(templateName);
            
            const renderContext = {
                ...template.variables?.defaults,
                ...context,
                _template: template.template,
                _metadata: template.metadata,
                _workflow: template.workflow
            };
            
            if (template.variables?.required) {
                for (const required of template.variables.required) {
                    if (!(required in renderContext)) {
                        throw new Error(`Required variable '${required}' not provided`);
                    }
                }
            }
            
            const renderedSections = await this.renderSections(template.sections, renderContext, options);
            
            let output = '';
            if (template.template.output?.title) {
                const titleTemplate = Handlebars.compile(template.template.output.title);
                output += `# ${titleTemplate(renderContext)}\n\n`;
            }
            
            output += renderedSections;
            
            this.emit('template_rendered', { 
                name: templateName, 
                context: Object.keys(renderContext),
                outputLength: output.length
            });
            
            return {
                content: output,
                metadata: {
                    template: template.template,
                    renderedAt: new Date(),
                    context: renderContext,
                    sections: template.sections.length
                }
            };
            
        } catch (error) {
            this.emit('template_render_error', { name: templateName, error: error.message });
            throw error;
        }
    }

    async renderSections(sections, context, options, depth = 0) {
        let output = '';
        const indent = '  '.repeat(depth);
        
        for (const section of sections) {
            if (section.conditions) {
                if (!this.evaluateConditions(section.conditions, context)) {
                    continue;
                }
            }
            
            if (section.title) {
                const level = Math.min(depth + 2, 6);
                const titleTemplate = Handlebars.compile(section.title);
                output += `${'#'.repeat(level)} ${titleTemplate(context)}\n\n`;
            }
            
            if (section.instruction && options.includeInstructions) {
                output += `<!-- ${section.instruction} -->\n\n`;
            }
            
            if (section.template) {
                const sectionTemplate = Handlebars.compile(section.template);
                output += sectionTemplate(context) + '\n\n';
            }
            
            if (section.content) {
                const contentTemplate = Handlebars.compile(section.content);
                output += contentTemplate(context) + '\n\n';
            }
            
            if (section.sections && section.sections.length > 0) {
                output += await this.renderSections(section.sections, context, options, depth + 1);
            }
            
            if (section.examples && options.includeExamples) {
                output += '**Examples:**\n';
                for (const example of section.examples) {
                    const exampleTemplate = Handlebars.compile(example);
                    output += `- ${exampleTemplate(context)}\n`;
                }
                output += '\n';
            }
        }
        
        return output;
    }

    evaluateConditions(conditions, context) {
        for (const [key, value] of Object.entries(conditions)) {
            if (context[key] !== value) {
                return false;
            }
        }
        return true;
    }

    async previewTemplate(templateName, context = {}, options = {}) {
        const previewOptions = { 
            ...options, 
            includeInstructions: true, 
            includeExamples: true 
        };
        
        const result = await this.renderTemplate(templateName, context, previewOptions);
        
        return {
            ...result,
            preview: true,
            sections: await this.getTemplateSections(templateName)
        };
    }

    async getTemplateSections(templateName) {
        const template = await this.loadTemplate(templateName);
        return this.extractSectionInfo(template.sections);
    }

    extractSectionInfo(sections, depth = 0) {
        const sectionInfo = [];
        
        for (const section of sections) {
            const info = {
                id: section.id,
                title: section.title,
                type: section.type || 'text',
                required: section.required,
                elicit: section.elicit,
                depth,
                hasSubSections: section.sections && section.sections.length > 0
            };
            
            sectionInfo.push(info);
            
            if (section.sections) {
                sectionInfo.push(...this.extractSectionInfo(section.sections, depth + 1));
            }
        }
        
        return sectionInfo;
    }

    async validateTemplateContext(templateName, context) {
        const template = await this.loadTemplate(templateName);
        const errors = [];
        const warnings = [];
        
        if (template.variables?.required) {
            for (const required of template.variables.required) {
                if (!(required in context)) {
                    errors.push(`Required variable '${required}' is missing`);
                }
            }
        }
        
        if (template.variables?.optional) {
            for (const optional of template.variables.optional) {
                if (!(optional in context)) {
                    warnings.push(`Optional variable '${optional}' not provided`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    listTemplates() {
        try {
            const files = fs.readdirSync(this.templatesDir);
            const templates = [];
            
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    try {
                        const templatePath = path.join(this.templatesDir, file);
                        const content = fs.readFileSync(templatePath, 'utf8');
                        const templateData = yaml.parse(content);
                        
                        if (templateData.template) {
                            templates.push({
                                filename: file,
                                id: templateData.template.id,
                                name: templateData.template.name,
                                version: templateData.template.version,
                                description: templateData.template.description,
                                tags: templateData.template.tags || [],
                                extends: templateData.template.extends,
                                size: fs.statSync(templatePath).size,
                                modified: fs.statSync(templatePath).mtime
                            });
                        }
                    } catch (error) {
                        console.warn(`Skipping invalid template file: ${file} - ${error.message}`);
                    }
                }
            }
            
            return templates.sort((a, b) => a.name.localeCompare(b.name));
            
        } catch (error) {
            this.emit('template_list_error', { error: error.message });
            throw new Error(`Failed to list templates: ${error.message}`);
        }
    }

    async saveTemplate(templateName, templateData) {
        try {
            const validatedTemplate = this.validateTemplate(templateData);
            const templatePath = path.join(this.templatesDir, templateName + '.yaml');
            
            validatedTemplate.metadata = {
                ...validatedTemplate.metadata,
                modified: new Date(),
                framework: 'super-agents'
            };
            
            if (!validatedTemplate.metadata.created) {
                validatedTemplate.metadata.created = new Date();
            }
            
            const yamlContent = yaml.stringify(validatedTemplate, { indent: 2 });
            fs.writeFileSync(templatePath, yamlContent, 'utf8');
            
            if (this.cache.has(templateName)) {
                this.cache.delete(templateName);
            }
            
            this.emit('template_saved', { name: templateName, path: templatePath });
            return templatePath;
            
        } catch (error) {
            this.emit('template_save_error', { name: templateName, error: error.message });
            throw new Error(`Failed to save template '${templateName}': ${error.message}`);
        }
    }

    async copyTemplate(sourceTemplate, targetName, modifications = {}) {
        const template = await this.loadTemplate(sourceTemplate);
        const copied = JSON.parse(JSON.stringify(template));
        
        copied.template.id = targetName;
        copied.template.name = modifications.name || copied.template.name + ' (Copy)';
        copied.template.version = '1.0';
        copied.metadata.created = new Date();
        copied.metadata.modified = new Date();
        
        Object.assign(copied.template, modifications);
        
        return await this.saveTemplate(targetName, copied);
    }

    clearCache() {
        this.cache.clear();
        this.compiledTemplates.clear();
        this.emit('cache_cleared');
    }

    getStats() {
        return {
            templatesLoaded: this.cache.size,
            compiledTemplates: this.compiledTemplates.size,
            helpersRegistered: this.helpers.size,
            partialsRegistered: this.partials.size,
            cacheSize: this.cache.size
        };
    }

    async getTemplate(templateName) {
        return await this.loadTemplate(templateName);
    }

    async initialize() {
        // Template engine is ready to use immediately
        this.emit('template_engine_initialized');
        return true;
    }

    templateExists(templateName) {
        try {
            this.resolveTemplatePath(templateName);
            return true;
        } catch (error) {
            return false;
        }
    }

    async renderTemplateToString(templateName, context = {}, options = {}) {
        const result = await this.renderTemplate(templateName, context, options);
        return result.content;
    }

    async cleanup() {
        this.clearCache();
        this.removeAllListeners();
    }
}

export default TemplateEngine;