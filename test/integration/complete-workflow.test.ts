import { expect } from 'chai';
import * as fc from 'fast-check';
import { test } from '@oclif/test';
import * as sinon from 'sinon';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { orchestrator } from '../../src/lib/orchestrator';
import { templateLoader } from '../../src/lib/templateLoader';

describe('Complete Enhancement Workflow Integration Tests', () => {
    let testDir: string;
    let systemDir: string;
    let userDir: string;
    let apiClientStub: sinon.SinonStub;

    beforeEach(async () => {
        // Setup test directories for templates
        testDir = path.join(os.tmpdir(), 'pbcli-integration-test');
        systemDir = path.join(testDir, 'system');
        userDir = path.join(testDir, 'user');
        
        await fs.ensureDir(systemDir);
        await fs.ensureDir(userDir);

        // Override template loader paths
        (templateLoader as any).systemTemplatesPath = systemDir;
        (templateLoader as any).userTemplatesPath = userDir;

        // Create test templates
        await fs.writeJson(path.join(systemDir, 'code-templates.json'), [
            {
                name: 'refactor-safe',
                description: 'Step-by-step refactoring strategy ensuring zero breakage',
                category: 'code',
                content: 'When refactoring {{user_prompt}}, always start by adding tests if they don\'t exist. Make small, incremental changes. Verify behavior after each change.',
                isSystem: true
            },
            {
                name: 'debug-helper',
                description: 'Systematic debugging approach for code issues',
                category: 'code',
                content: 'To debug {{user_prompt}}: 1) Reproduce the issue consistently, 2) Add logging/breakpoints, 3) Trace execution flow, 4) Identify root cause.',
                isSystem: true
            }
        ]);

        await fs.writeJson(path.join(systemDir, 'design-templates.json'), [
            {
                name: 'apple-minimal-ui',
                description: 'Clean, whitespace-heavy Apple-style UI components',
                category: 'design',
                content: 'For {{user_prompt}}, use a minimal color palette with plenty of whitespace. Focus on typography and subtle shadows. Rounded corners should be consistent.',
                isSystem: true
            }
        ]);

        // Create user template that overrides system template
        await fs.writeJson(path.join(userDir, 'custom-refactor.json'), {
            name: 'refactor-safe',
            description: 'Custom refactoring approach',
            category: 'code',
            content: 'Custom refactoring for {{user_prompt}}: Start with comprehensive tests, then refactor incrementally with continuous validation.',
            isSystem: false
        });

        // Mock API client
        const apiClient = require('../../src/lib/apiClient').apiClient;
        apiClientStub = sinon.stub(apiClient, 'post');
    });

    afterEach(async () => {
        await fs.remove(testDir);
        sinon.restore();
    });

    describe('End-to-End Workflow Tests', () => {
        it('should complete full enhancement pipeline with coding task and template', async () => {
            // Setup backend response
            const mockBackendResponse = {
                enhanced_prompt: 'Enhanced refactoring guidance for TypeScript component',
                task_type: 'coding',
                confidence: 0.9,
                model_hint: 'claude-3-sonnet',
                tokens_estimated: 150,
                metadata: {
                    processing_time_ms: 250,
                    snippets_count: 8,
                    memory_nodes_count: 15,
                    context_sources: [
                        { name: 'typescript-docs', type: 'code', count: 5 },
                        { name: 'react-patterns', type: 'code', count: 3 }
                    ]
                },
                template_used: 'refactor-safe'
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            const output = await test
                .stdout()
                .command(['enhance', 'Refactor this TypeScript React component', '--budget=high', '--template=refactor-safe'])
                .it('should complete full coding workflow');

            // Verify API was called with correct Phase-2 payload
            expect(apiClientStub.calledOnce).to.be.true;
            const apiCall = apiClientStub.getCall(0);
            expect(apiCall.args[0]).to.equal('/general');
            
            const payload = apiCall.args[1];
            expect(payload).to.have.property('prompt');
            expect(payload).to.have.property('task_type', 'coding');
            expect(payload).to.have.property('confidence');
            expect(payload).to.have.property('model_hint');
            expect(payload).to.have.property('reasoning');
            expect(payload).to.have.property('template_used', 'refactor-safe');
            expect(payload).to.have.property('context_metadata');

            // Verify context metadata
            expect(payload.context_metadata.prefer_fast).to.be.false;
            expect(payload.context_metadata.budget_mode).to.equal('high');
            expect(payload.context_metadata.template_source).to.equal('user'); // Should use user override
            expect(payload.context_metadata.original_prompt_length).to.be.greaterThan(0);

            // Verify prompt was enhanced with template
            expect(payload.prompt).to.include('Custom refactoring'); // User template content
            expect(payload.prompt).to.include('TypeScript React component'); // Original prompt preserved
        });

        it('should handle creative task with design template auto-selection', async () => {
            const mockBackendResponse = {
                enhanced_prompt: 'Enhanced UI design guidance with minimal aesthetic',
                task_type: 'creative',
                confidence: 0.8,
                model_hint: 'claude-3-opus',
                tokens_estimated: 200,
                metadata: {
                    processing_time_ms: 180,
                    snippets_count: 4,
                    memory_nodes_count: 8,
                    context_sources: [
                        { name: 'design-patterns', type: 'design', count: 4 }
                    ]
                },
                template_used: 'apple-minimal-ui'
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            await test
                .stdout()
                .command(['enhance', 'Design a clean login form', '--budget=medium'])
                .it('should auto-select design template');

            const payload = apiClientStub.getCall(0).args[1];
            expect(payload.task_type).to.equal('creative');
            expect(payload.template_used).to.equal('apple-minimal-ui');
            expect(payload.context_metadata.budget_mode).to.equal('medium');
            
            // Should have auto-selected design template
            expect(payload.prompt).to.include('minimal color palette');
            expect(payload.prompt).to.include('clean login form');
        });

        it('should handle fast mode with appropriate model selection', async () => {
            const mockBackendResponse = {
                enhanced_prompt: 'Quick enhancement for general task',
                task_type: 'general',
                confidence: 0.6,
                model_hint: 'gpt-4o-mini',
                tokens_estimated: 80,
                metadata: {
                    processing_time_ms: 120,
                    snippets_count: 2,
                    memory_nodes_count: 4,
                    context_sources: []
                },
                template_used: null
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            await test
                .stdout()
                .command(['enhance', 'Help me with this task', '--fast'])
                .it('should use fast mode');

            const payload = apiClientStub.getCall(0).args[1];
            expect(payload.context_metadata.prefer_fast).to.be.true;
            expect(payload.model_hint).to.equal('gpt-4o-mini'); // Fast model
            expect(payload.template_used).to.be.null; // No template for general task
        });

        it('should handle low budget constraints', async () => {
            const mockBackendResponse = {
                enhanced_prompt: 'Budget-optimized enhancement',
                task_type: 'structured',
                confidence: 0.7,
                model_hint: 'gpt-4o-mini',
                tokens_estimated: 60,
                metadata: {
                    processing_time_ms: 100,
                    snippets_count: 1,
                    memory_nodes_count: 2,
                    context_sources: []
                },
                template_used: null
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            await test
                .stdout()
                .command(['enhance', 'Create a JSON schema', '--budget=low'])
                .it('should respect budget constraints');

            const payload = apiClientStub.getCall(0).args[1];
            expect(payload.context_metadata.budget_mode).to.equal('low');
            expect(payload.model_hint).to.equal('gpt-4o-mini'); // Budget model
            expect(payload.task_type).to.equal('structured');
        });

        it('should fallback gracefully when Phase-2 backend is unavailable', async () => {
            // First call fails (Phase-2), second succeeds (Phase-1 fallback)
            apiClientStub.onFirstCall().rejects({ response: { status: 404 } });
            apiClientStub.onSecondCall().resolves({ 
                data: { 
                    enhanced_prompt: 'Fallback enhanced prompt',
                    task_type: 'coding'
                } 
            });

            await test
                .stdout()
                .command(['enhance', 'Fix this bug', '--template=debug-helper'])
                .it('should fallback to Phase-1');

            expect(apiClientStub.calledTwice).to.be.true;

            // First call should be Phase-2
            const firstCall = apiClientStub.getCall(0);
            expect(firstCall.args[1]).to.have.property('context_metadata');

            // Second call should be Phase-1 (simpler payload)
            const secondCall = apiClientStub.getCall(1);
            expect(secondCall.args[1]).to.have.property('prompt');
            expect(secondCall.args[1]).to.have.property('metadata');
            expect(secondCall.args[1]).to.not.have.property('context_metadata');
        });

        it('should handle template not found gracefully', async () => {
            const mockBackendResponse = {
                enhanced_prompt: 'Enhanced without template',
                task_type: 'general',
                confidence: 0.5,
                model_hint: 'gpt-4o-mini',
                tokens_estimated: 50,
                metadata: {
                    processing_time_ms: 90,
                    snippets_count: 0,
                    memory_nodes_count: 0,
                    context_sources: []
                },
                template_used: null
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            await test
                .stdout()
                .command(['enhance', 'General task', '--template=non-existent-template'])
                .it('should handle missing template');

            const payload = apiClientStub.getCall(0).args[1];
            expect(payload.template_used).to.be.null;
            expect(payload.prompt).to.equal('General task'); // Original prompt unchanged
            expect(payload.context_metadata.template_source).to.equal('none');
        });

        it('should handle multiple flag combinations correctly', async () => {
            const mockBackendResponse = {
                enhanced_prompt: 'Complex enhancement with all options',
                task_type: 'coding',
                confidence: 0.95,
                model_hint: 'gpt-4o',
                tokens_estimated: 300,
                metadata: {
                    processing_time_ms: 400,
                    snippets_count: 12,
                    memory_nodes_count: 25,
                    context_sources: [
                        { name: 'advanced-patterns', type: 'code', count: 8 },
                        { name: 'best-practices', type: 'code', count: 4 }
                    ]
                },
                template_used: 'refactor-safe'
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            await test
                .stdout()
                .command(['enhance', 'Optimize this complex algorithm', '--fast', '--budget=high', '--template=refactor-safe'])
                .it('should handle multiple flags');

            const payload = apiClientStub.getCall(0).args[1];
            expect(payload.context_metadata.prefer_fast).to.be.true;
            expect(payload.context_metadata.budget_mode).to.equal('high');
            expect(payload.template_used).to.equal('refactor-safe');
            expect(payload.task_type).to.equal('coding');
            
            // Should use user template override
            expect(payload.prompt).to.include('Custom refactoring');
        });
    });

    describe('Error Recovery Integration Tests', () => {
        it('should recover from orchestration component failures', async () => {
            // Mock a component failure during orchestration
            const originalOrchestrate = orchestrator.orchestrate;
            let callCount = 0;
            
            sinon.stub(orchestrator, 'orchestrate').callsFake(async (prompt, options) => {
                callCount++;
                if (callCount === 1) {
                    // First call fails
                    throw new Error('Orchestration component failure');
                }
                // Subsequent calls succeed
                return originalOrchestrate.call(orchestrator, prompt, options);
            });

            // Should still attempt fallback
            await test
                .stdout()
                .stderr()
                .command(['enhance', 'Test prompt'])
                .catch(err => {
                    expect(err.message).to.include('Enhancement failed');
                })
                .it('should handle orchestration failures');
        });

        it('should handle network timeouts gracefully', async () => {
            // Simulate network timeout
            apiClientStub.rejects({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' });

            await test
                .stdout()
                .stderr()
                .command(['enhance', 'Test network timeout'])
                .catch(err => {
                    // Should provide meaningful error message
                    expect(err.message).to.include('Enhancement failed');
                })
                .it('should handle network timeouts');
        });

        it('should handle authentication failures', async () => {
            // Simulate auth failure
            apiClientStub.rejects({ response: { status: 401, data: { error: 'Unauthorized' } } });

            await test
                .stdout()
                .stderr()
                .command(['enhance', 'Test auth failure'])
                .catch(err => {
                    // Should be handled by API client interceptor
                    expect(apiClientStub.calledOnce).to.be.true;
                })
                .it('should handle auth failures');
        });
    });

    describe('Performance Integration Tests', () => {
        it('should complete enhancement within reasonable time limits', async () => {
            const mockBackendResponse = {
                enhanced_prompt: 'Performance test enhancement',
                task_type: 'general',
                confidence: 0.6,
                model_hint: 'gpt-4o-mini',
                tokens_estimated: 100,
                metadata: {
                    processing_time_ms: 150,
                    snippets_count: 3,
                    memory_nodes_count: 6,
                    context_sources: []
                },
                template_used: null
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            const startTime = Date.now();
            
            await test
                .stdout()
                .command(['enhance', 'Performance test prompt'])
                .it('should complete within time limits');

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should complete within reasonable time (excluding network calls)
            expect(totalTime).to.be.lessThan(5000); // 5 seconds max
            expect(apiClientStub.calledOnce).to.be.true;
        });

        it('should handle large prompts efficiently', async () => {
            const largePrompt = 'Large prompt: ' + 'x'.repeat(5000); // 5KB prompt
            
            const mockBackendResponse = {
                enhanced_prompt: 'Enhanced large prompt',
                task_type: 'general',
                confidence: 0.5,
                model_hint: 'gpt-4o-mini',
                tokens_estimated: 1000,
                metadata: {
                    processing_time_ms: 300,
                    snippets_count: 1,
                    memory_nodes_count: 2,
                    context_sources: []
                },
                template_used: null
            };

            apiClientStub.resolves({ data: mockBackendResponse });

            await test
                .stdout()
                .command(['enhance', largePrompt])
                .it('should handle large prompts');

            const payload = apiClientStub.getCall(0).args[1];
            expect(payload.prompt).to.equal(largePrompt);
            expect(payload.context_metadata.original_prompt_length).to.equal(largePrompt.length);
        });
    });
});