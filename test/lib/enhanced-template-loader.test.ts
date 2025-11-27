import { expect } from 'chai';
import * as fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { TemplateLoader, Template, TemplateResolutionResult, TemplateExpansionContext } from '../../src/lib/templateLoader';
import { TaskType } from '../../src/lib/task-detector';

describe('Enhanced Template Loader', () => {
    let templateLoader: TemplateLoader;
    let testDir: string;
    let systemDir: string;
    let userDir: string;

    beforeEach(async () => {
        // Setup test directories
        testDir = path.join(os.tmpdir(), 'pbcli-test-enhanced-loader');
        systemDir = path.join(testDir, 'system');
        userDir = path.join(testDir, 'user');
        
        await fs.ensureDir(systemDir);
        await fs.ensureDir(userDir);

        // Create new instance and override paths
        templateLoader = new TemplateLoader();
        (templateLoader as any).systemTemplatesPath = systemDir;
        (templateLoader as any).userTemplatesPath = userDir;

        // Create test templates
        await fs.writeJson(path.join(systemDir, 'code-templates.json'), [
            {
                name: 'test-code-template',
                description: 'Test coding template',
                category: 'code',
                content: 'Code template content for {{task_type}}',
                isSystem: true
            },
            {
                name: 'locked-template',
                description: 'System locked template',
                category: 'code',
                content: 'Locked content',
                isSystem: true,
                systemLocked: true
            }
        ]);

        await fs.writeJson(path.join(systemDir, 'design-templates.json'), [
            {
                name: 'test-design-template',
                description: 'Test design template',
                category: 'design',
                content: 'Design template content',
                isSystem: true
            }
        ]);
    });

    afterEach(async () => {
        await fs.remove(testDir);
    });

    describe('Property-Based Tests', () => {
        // **Feature: pbcli-phase2-orchestrator, Property 4: Template resolution by name**
        it('should resolve templates by name correctly or handle errors appropriately', () => {
            fc.assert(fc.asyncProperty(
                fc.record({
                    templateName: fc.string({ minLength: 1, maxLength: 50 }),
                    taskType: fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general')
                }),
                async (input) => {
                    const result = await templateLoader.resolveTemplateForTask(
                        input.taskType as TaskType, 
                        input.templateName
                    );

                    // Verify result structure
                    expect(result).to.have.property('template');
                    expect(result).to.have.property('reasoning');
                    expect(result).to.have.property('source');

                    // Verify reasoning is provided
                    expect(result.reasoning).to.be.a('string');
                    expect(result.reasoning.length).to.be.greaterThan(0);

                    // Verify source is valid
                    expect(result.source).to.be.oneOf(['user', 'system', 'auto-selected', 'none']);

                    // If template found, verify structure
                    if (result.template) {
                        expect(result.template).to.have.property('name');
                        expect(result.template).to.have.property('description');
                        expect(result.template).to.have.property('category');
                        expect(result.template).to.have.property('content');
                        expect(result.template.name).to.be.a('string');
                        expect(result.template.content).to.be.a('string');
                        expect(result.source).to.be.oneOf(['user', 'system']);
                    } else {
                        // If no template found, source should be 'none'
                        expect(result.source).to.equal('none');
                        expect(result.reasoning).to.include('not found');
                    }
                }
            ), { numRuns: 50 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 5: Automatic template selection**
        it('should automatically select appropriate templates based on task type', () => {
            fc.assert(fc.asyncProperty(
                fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'),
                async (taskType) => {
                    const result = await templateLoader.resolveTemplateForTask(taskType as TaskType);

                    // Verify result structure
                    expect(result).to.have.property('template');
                    expect(result).to.have.property('reasoning');
                    expect(result).to.have.property('source');

                    // Verify reasoning is provided
                    expect(result.reasoning).to.be.a('string');
                    expect(result.reasoning.length).to.be.greaterThan(0);

                    // Source should be auto-selected or none
                    expect(result.source).to.be.oneOf(['auto-selected', 'none']);

                    // If template selected, verify it's appropriate for task type
                    if (result.template) {
                        expect(result.source).to.equal('auto-selected');
                        expect(result.template.category).to.be.oneOf(['code', 'design']);
                        
                        // Verify task-category matching logic
                        if (taskType === 'coding' || taskType === 'structured') {
                            expect(result.template.category).to.equal('code');
                        }
                        if (taskType === 'creative' || taskType === 'minimal' || taskType === 'rewrite') {
                            expect(result.template.category).to.equal('design');
                        }
                    } else {
                        expect(result.source).to.equal('none');
                    }
                }
            ), { numRuns: 50 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 6: Template precedence rules**
        it('should prioritize user templates over system templates with same name', async () => {
            // Create user template with same name as system template
            await fs.writeJson(path.join(userDir, 'override-test.json'), {
                name: 'test-code-template',
                description: 'User override template',
                category: 'code',
                content: 'User override content',
                isSystem: false
            });

            const result = await templateLoader.resolveTemplateForTask('coding', 'test-code-template');

            expect(result.template).to.not.be.null;
            expect(result.template!.content).to.equal('User override content');
            expect(result.template!.isSystem).to.be.false;
            expect(result.source).to.equal('user');
        });

        // **Feature: pbcli-phase2-orchestrator, Property 7: Template access control**
        it('should prevent user access to system-locked templates', async () => {
            const result = await templateLoader.resolveTemplateForTask('coding', 'locked-template');

            expect(result.template).to.be.null;
            expect(result.source).to.equal('none');
            expect(result.reasoning).to.include('system-locked');
        });

        // **Feature: pbcli-phase2-orchestrator, Property 8: Template expansion consistency**
        it('should consistently expand templates with context and metadata', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    taskType: fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'),
                    confidence: fc.float({ min: 0, max: 1 }),
                    userPrompt: fc.string({ minLength: 1, maxLength: 100 }),
                    metadataKey: fc.string({ minLength: 1, maxLength: 20 }),
                    metadataValue: fc.string({ minLength: 1, maxLength: 50 })
                }),
                async (input) => {
                    const template: Template = {
                        name: 'test-template',
                        description: 'Test template',
                        category: 'code',
                        content: 'Template for {{task_type}} with confidence {{confidence}}'
                    };

                    const context: TemplateExpansionContext = {
                        task_type: input.taskType as TaskType,
                        confidence: input.confidence,
                        user_prompt: input.userPrompt,
                        metadata: { [input.metadataKey]: input.metadataValue }
                    };

                    const expanded = templateLoader.expandTemplate(template, context);

                    // Verify expansion occurred
                    expect(expanded).to.be.a('string');
                    expect(expanded.length).to.be.greaterThan(template.content.length);

                    // Verify placeholders were replaced
                    expect(expanded).to.include(input.taskType);
                    expect(expanded).to.include((input.confidence * 100).toFixed(0) + '%');

                    // Verify metadata was injected
                    expect(expanded).to.include(input.metadataKey);
                    expect(expanded).to.include(input.metadataValue);
                }
            ), { numRuns: 50 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 17: Template loading consistency**
        it('should consistently load templates from correct directories', async () => {
            const templates = await templateLoader.loadTemplates();

            // Should have loaded system templates
            const systemTemplate = templates.find(t => t.name === 'test-code-template');
            expect(systemTemplate).to.exist;
            expect(systemTemplate!.isSystem).to.be.true;

            // Should have loaded from system directory
            const designTemplate = templates.find(t => t.name === 'test-design-template');
            expect(designTemplate).to.exist;
            expect(designTemplate!.isSystem).to.be.true;
            expect(designTemplate!.category).to.equal('design');
        });

        // **Feature: pbcli-phase2-orchestrator, Property 18: Template categorization and routing**
        it('should properly categorize templates and route based on task types', () => {
            fc.assert(fc.asyncProperty(
                fc.constantFrom('code', 'design'),
                async (category) => {
                    const templates = await templateLoader.listTemplatesByCategory(category as 'code' | 'design');

                    // All returned templates should match the requested category
                    templates.forEach(template => {
                        expect(template.category).to.equal(category);
                        expect(template.systemLocked).to.not.be.true; // Should not include locked templates
                    });

                    // Should be an array
                    expect(templates).to.be.an('array');
                }
            ), { numRuns: 10 });
        });
    });

    describe('Unit Tests', () => {
        it('should merge prompts with templates correctly', () => {
            const template: Template = {
                name: 'test-template',
                description: 'Test template',
                category: 'code',
                content: 'Template content: {{user_prompt}}'
            };

            const userPrompt = 'Fix this bug';
            const merged = templateLoader.mergePromptWithTemplate(userPrompt, template);

            expect(merged).to.include('Fix this bug');
            expect(merged).to.include('Template content');
            expect(merged).to.not.include('{{user_prompt}}');
        });

        it('should handle templates without placeholders', () => {
            const template: Template = {
                name: 'simple-template',
                description: 'Simple template',
                category: 'code',
                content: 'Simple template content'
            };

            const userPrompt = 'User request';
            const merged = templateLoader.mergePromptWithTemplate(userPrompt, template);

            expect(merged).to.include('Simple template content');
            expect(merged).to.include('User request');
        });

        it('should score templates appropriately for task types', async () => {
            // Create templates with different characteristics
            await fs.writeJson(path.join(userDir, 'coding-specific.json'), {
                name: 'refactor-helper',
                description: 'Helps with code refactoring and bug fixes',
                category: 'code',
                content: 'Refactoring template',
                isSystem: false
            });

            await fs.writeJson(path.join(userDir, 'design-specific.json'), {
                name: 'ui-designer',
                description: 'Creates beautiful minimal designs',
                category: 'design',
                content: 'Design template',
                isSystem: false
            });

            const codingResult = await templateLoader.resolveTemplateForTask('coding');
            const minimalResult = await templateLoader.resolveTemplateForTask('minimal');

            if (codingResult.template) {
                expect(codingResult.template.category).to.equal('code');
            }
            if (minimalResult.template) {
                expect(minimalResult.template.category).to.equal('design');
            }
        });
    });
});