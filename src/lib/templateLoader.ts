import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { TaskType } from './task-detector';

export interface Template {
    name: string;
    description: string;
    category: string;
    content: string;
    isSystem?: boolean;
    systemLocked?: boolean;
}

/**
 * Result of template resolution
 */
export interface TemplateResolutionResult {
    template: Template | null;
    reasoning: string;
    source: 'user' | 'system' | 'auto-selected' | 'none';
}

/**
 * Context for template expansion
 */
export interface TemplateExpansionContext {
    task_type: TaskType;
    confidence: number;
    user_prompt: string;
    metadata: Record<string, any>;
}

export class TemplateLoader {
    private systemTemplatesPath: string;
    private userTemplatesPath: string;

    constructor() {
        const currentDir = __dirname;

        // System templates are always loaded from dist/lib/templates/system
        // This works for both dev (ts-node) and production (compiled)
        this.systemTemplatesPath = path.join(currentDir, 'templates', 'system');

        // User templates are stored in the user's home directory
        // This ensures they persist across CLI updates and work with global installs
        const homeDir = os.homedir();
        this.userTemplatesPath = path.join(homeDir, '.promptbrain', 'templates', 'user');
    }

    async loadTemplates(): Promise<Template[]> {
        const systemTemplates = await this.loadSystemTemplates();
        const userTemplates = await this.loadUserTemplates();

        // Create a map to handle overrides
        const templateMap = new Map<string, Template>();

        // Add system templates first
        systemTemplates.forEach(t => templateMap.set(t.name, t));

        // Add user templates (overriding system ones if name matches)
        userTemplates.forEach(t => templateMap.set(t.name, t));

        return Array.from(templateMap.values());
    }

    private async loadSystemTemplates(): Promise<Template[]> {
        const templates: Template[] = [];
        if (await fs.pathExists(this.systemTemplatesPath)) {
            const files = await fs.readdir(this.systemTemplatesPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await fs.readJson(path.join(this.systemTemplatesPath, file));
                        if (Array.isArray(content)) {
                            templates.push(...content.map((t: any) => ({ ...t, isSystem: true })));
                        }
                    } catch (error) {
                        // Silently fail for system template load errors to avoid crashing
                    }
                }
            }
        }
        return templates;
    }

    private async loadUserTemplates(): Promise<Template[]> {
        const templates: Template[] = [];
        // Ensure user directory exists
        await fs.ensureDir(this.userTemplatesPath);

        const files = await fs.readdir(this.userTemplatesPath);
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = await fs.readJson(path.join(this.userTemplatesPath, file));
                    templates.push({ ...content, isSystem: false });
                } catch (e) {
                    // Ignore malformed files
                }
            }
        }
        return templates;
    }

    async addTemplate(template: Omit<Template, 'isSystem'>): Promise<void> {
        await fs.ensureDir(this.userTemplatesPath);
        // Sanitize filename
        const safeName = template.name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
        const filePath = path.join(this.userTemplatesPath, `${safeName}.json`);

        // We store the original name in the file content
        await fs.writeJson(filePath, template, { spaces: 2 });
    }

    async removeTemplate(name: string): Promise<void> {
        // Check if it's a system template
        const systemTemplates = await this.loadSystemTemplates();
        if (systemTemplates.find(t => t.name === name)) {
            throw new Error('This is a system template and cannot be removed.');
        }

        // Try to find the file. Since we sanitize names on save, we should sanitize here too.
        // But user might provide the exact name.
        // Let's iterate user templates to find the matching one to get the filename if needed,
        // or just rely on the name -> filename mapping.

        const userTemplates = await this.loadUserTemplates();
        const target = userTemplates.find(t => t.name === name);

        if (!target) {
            throw new Error(`Template "${name}" not found.`);
        }

        const safeName = target.name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
        const filePath = path.join(this.userTemplatesPath, `${safeName}.json`);

        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
        } else {
            // Fallback: maybe the file is named differently?
            // For now, assume strict mapping.
            throw new Error(`Template file for "${name}" not found.`);
        }
    }

    async getTemplate(name: string): Promise<Template | undefined> {
        const templates = await this.loadTemplates();
        return templates.find(t => t.name === name);
    }

    /**
     * Resolve template for a specific task type with intelligent selection
     */
    async resolveTemplateForTask(taskType: TaskType, templateName?: string): Promise<TemplateResolutionResult> {
        try {
            // If specific template requested, try to find it
            if (templateName) {
                const template = await this.getTemplate(templateName);
                if (template) {
                    // Check if template is system-locked and prevent user access
                    if (template.systemLocked && !template.isSystem) {
                        return {
                            template: null,
                            reasoning: `Template "${templateName}" is system-locked and not accessible`,
                            source: 'none'
                        };
                    }
                    return {
                        template,
                        reasoning: `Explicitly requested template "${templateName}" found`,
                        source: template.isSystem ? 'system' : 'user'
                    };
                } else {
                    return {
                        template: null,
                        reasoning: `Requested template "${templateName}" not found`,
                        source: 'none'
                    };
                }
            }

            // Auto-select template based on task type
            const templates = await this.loadTemplates();
            const suitableTemplate = this.selectTemplateForTaskType(templates, taskType);

            if (suitableTemplate) {
                return {
                    template: suitableTemplate,
                    reasoning: `Auto-selected template "${suitableTemplate.name}" for ${taskType} task`,
                    source: 'auto-selected'
                };
            }

            return {
                template: null,
                reasoning: `No suitable template found for ${taskType} task`,
                source: 'none'
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                template: null,
                reasoning: `Template resolution failed: ${errorMessage}`,
                source: 'none'
            };
        }
    }

    /**
     * Select best template for a given task type
     */
    private selectTemplateForTaskType(templates: Template[], taskType: TaskType): Template | null {
        // Filter templates by category based on task type
        const categoryMap: Record<TaskType, string[]> = {
            'coding': ['code'],
            'structured': ['code'],
            'creative': ['design'],
            'minimal': ['design'],
            'rewrite': ['design'],
            'research': ['code', 'design'],
            'general': ['code', 'design']
        };

        const preferredCategories = categoryMap[taskType] || ['code', 'design'];
        
        // Find templates in preferred categories
        const categoryTemplates = templates.filter(t => 
            preferredCategories.includes(t.category) && !t.systemLocked
        );

        if (categoryTemplates.length === 0) {
            return null;
        }

        // Score templates based on task type relevance
        const scoredTemplates = categoryTemplates.map(template => ({
            template,
            score: this.scoreTemplateForTask(template, taskType)
        }));

        // Sort by score (highest first)
        scoredTemplates.sort((a, b) => b.score - a.score);

        return scoredTemplates[0]?.template || null;
    }

    /**
     * Score a template's relevance for a task type
     */
    private scoreTemplateForTask(template: Template, taskType: TaskType): number {
        let score = 0;

        // Category match bonus
        if (taskType === 'coding' || taskType === 'structured') {
            if (template.category === 'code') score += 10;
        }
        if (taskType === 'creative' || taskType === 'minimal' || taskType === 'rewrite') {
            if (template.category === 'design') score += 10;
        }

        // Keyword matching in name and description
        const keywords = this.getTaskKeywords(taskType);
        const templateText = `${template.name} ${template.description}`.toLowerCase();
        
        keywords.forEach(keyword => {
            if (templateText.includes(keyword.toLowerCase())) {
                score += 5;
            }
        });

        // User templates get slight preference over system templates
        if (!template.isSystem) {
            score += 1;
        }

        return score;
    }

    /**
     * Get relevant keywords for a task type
     */
    private getTaskKeywords(taskType: TaskType): string[] {
        const keywordMap: Record<TaskType, string[]> = {
            'coding': ['code', 'bug', 'error', 'refactor', 'typescript', 'javascript', 'python'],
            'creative': ['blog', 'story', 'creative', 'write', 'content'],
            'rewrite': ['summarize', 'rewrite', 'improve', 'edit'],
            'structured': ['json', 'schema', 'api', 'database'],
            'minimal': ['minimal', 'clean', 'simple', 'apple'],
            'research': ['research', 'explain', 'analyze'],
            'general': ['general', 'help', 'assist']
        };

        return keywordMap[taskType] || [];
    }

    /**
     * Expand template with context and metadata
     */
    expandTemplate(template: Template, context: TemplateExpansionContext): string {
        let expandedContent = template.content;

        // Replace common placeholders
        const replacements: Record<string, string> = {
            '{{task_type}}': context.task_type,
            '{{confidence}}': (context.confidence * 100).toFixed(0) + '%',
            '{{user_prompt}}': context.user_prompt,
            '{{template_name}}': template.name,
            '{{template_category}}': template.category
        };

        // Apply replacements
        Object.entries(replacements).forEach(([placeholder, value]) => {
            expandedContent = expandedContent.replace(new RegExp(placeholder, 'g'), value);
        });

        // Add metadata injection
        if (Object.keys(context.metadata).length > 0) {
            const metadataString = Object.entries(context.metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            expandedContent += `\n\nContext: ${metadataString}`;
        }

        return expandedContent;
    }

    /**
     * Merge user prompt with template content
     */
    mergePromptWithTemplate(userPrompt: string, template: Template): string {
        // Simple merge strategy: template content + user prompt
        // More sophisticated merging could be implemented based on template structure
        
        if (template.content.includes('{{user_prompt}}')) {
            // Template has explicit placeholder for user prompt
            return template.content.replace(/\{\{user_prompt\}\}/g, userPrompt);
        } else {
            // Append user prompt to template
            return `${template.content}\n\nUser Request: ${userPrompt}`;
        }
    }

    /**
     * List templates by category
     */
    async listTemplatesByCategory(category: 'code' | 'design'): Promise<Template[]> {
        const templates = await this.loadTemplates();
        return templates.filter(t => t.category === category && !t.systemLocked);
    }
}

export const templateLoader = new TemplateLoader();
