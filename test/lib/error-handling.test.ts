import { expect } from 'chai';
import * as fc from 'fast-check';
import * as sinon from 'sinon';
import { ModelRouter } from '../../src/lib/model-router';
import { TemplateLoader } from '../../src/lib/templateLoader';
import { Orchestrator } from '../../src/lib/orchestrator';
import { detectTask } from '../../src/lib/task-detector';

describe('Error Handling and Graceful Continuation', () => {
    let modelRouter: ModelRouter;
    let templateLoader: TemplateLoader;
    let orchestrator: Orchestrator;

    beforeEach(() => {
        modelRouter = new ModelRouter();
        templateLoader = new TemplateLoader();
        orchestrator = new Orchestrator();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Property-Based Tests', () => {
        // **Feature: pbcli-phase2-orchestrator, Property 19: Error handling graceful continuation**
        it('should handle component failures gracefully and continue with appropriate fallbacks', () => {
            fc.assert(fc.asyncProperty(
                fc.record({
                    prompt: fc.string({ minLength: 1, maxLength: 100 }),
                    fast: fc.boolean(),
                    budget: fc.constantFrom('low', 'medium', 'high'),
                    errorType: fc.constantFrom('task_detection', 'template_loading', 'model_routing', 'orchestration')
                }),
                async (input) => {
                    let taskDetectionStub: sinon.SinonStub | undefined;
                    let templateStub: sinon.SinonStub | undefined;
                    let modelRouterStub: sinon.SinonStub | undefined;

                    try {
                        // Inject errors based on error type
                        switch (input.errorType) {
                            case 'task_detection':
                                // Mock task detection to fail
                                taskDetectionStub = sinon.stub(require('../../src/lib/task-detector'), 'detectTask');
                                taskDetectionStub.throws(new Error('Task detection failed'));
                                break;

                            case 'template_loading':
                                // Mock template loading to fail
                                templateStub = sinon.stub(templateLoader, 'resolveTemplateForTask');
                                templateStub.rejects(new Error('Template loading failed'));
                                break;

                            case 'model_routing':
                                // Mock model routing to fail
                                modelRouterStub = sinon.stub(modelRouter, 'route');
                                modelRouterStub.throws(new Error('Model routing failed'));
                                break;

                            case 'orchestration':
                                // This will be tested by injecting errors in sub-components
                                break;
                        }

                        const options = {
                            fast: input.fast,
                            budget: input.budget
                        };

                        const result = await orchestrator.orchestrate(input.prompt, options);

                        // Even with component failures, orchestration should complete
                        expect(result).to.have.property('payload');
                        expect(result).to.have.property('metadata');

                        // Verify payload structure is maintained
                        expect(result.payload).to.have.property('prompt');
                        expect(result.payload).to.have.property('task_type');
                        expect(result.payload).to.have.property('confidence');
                        expect(result.payload).to.have.property('model_hint');
                        expect(result.payload).to.have.property('reasoning');
                        expect(result.payload).to.have.property('template_used');
                        expect(result.payload).to.have.property('context_metadata');

                        // Verify basic data types are correct
                        expect(result.payload.prompt).to.be.a('string');
                        expect(result.payload.task_type).to.be.a('string');
                        expect(result.payload.confidence).to.be.a('number');
                        expect(result.payload.model_hint).to.be.a('string');
                        expect(result.payload.reasoning).to.be.a('string');

                        // Verify metadata structure is maintained
                        expect(result.metadata).to.have.property('task_detection');
                        expect(result.metadata).to.have.property('template_used');
                        expect(result.metadata).to.have.property('model_routing');
                        expect(result.metadata).to.have.property('processing_time_ms');

                        // Verify error handling based on error type
                        switch (input.errorType) {
                            case 'task_detection':
                                // Should fall back to general task type
                                expect(result.payload.task_type).to.equal('general');
                                expect(result.payload.confidence).to.be.lessThan(0.5);
                                expect(result.payload.reasoning).to.include('failed');
                                break;

                            case 'template_loading':
                                // Should continue without template
                                expect(result.payload.template_used).to.be.null;
                                expect(result.metadata.template_used.source).to.equal('none');
                                expect(result.metadata.template_used.reasoning).to.include('failed');
                                break;

                            case 'model_routing':
                                // Should fall back to default model
                                expect(result.payload.model_hint).to.be.a('string');
                                expect(result.metadata.model_routing.metadata.fallback_used).to.be.true;
                                expect(result.payload.reasoning).to.include('failed');
                                break;
                        }

                        // User options should still be preserved
                        expect(result.payload.context_metadata.prefer_fast).to.equal(input.fast);
                        expect(result.payload.context_metadata.budget_mode).to.equal(input.budget);

                    } finally {
                        // Clean up stubs
                        if (taskDetectionStub) taskDetectionStub.restore();
                        if (templateStub) templateStub.restore();
                        if (modelRouterStub) modelRouterStub.restore();
                    }
                }
            ), { numRuns: 20 });
        });
    });

    describe('Unit Tests', () => {
        it('should handle task detection failures gracefully', async () => {
            const stub = sinon.stub(require('../../src/lib/task-detector'), 'detectTask');
            stub.throws(new Error('Task detection network error'));

            try {
                const result = await orchestrator.orchestrate('Test prompt');

                expect(result.payload.task_type).to.equal('general');
                expect(result.payload.confidence).to.equal(0.3);
                expect(result.payload.reasoning).to.include('Task detection failed');
                expect(result.metadata.task_detection.reasoning).to.include('failed');
            } finally {
                stub.restore();
            }
        });

        it('should handle template loading failures gracefully', async () => {
            const stub = sinon.stub(templateLoader, 'resolveTemplateForTask');
            stub.rejects(new Error('Template file corrupted'));

            const result = await orchestrator.orchestrate('Test prompt', { template: 'test-template' });

            expect(result.payload.template_used).to.be.null;
            expect(result.metadata.template_used.source).to.equal('none');
            expect(result.metadata.template_used.reasoning).to.include('Template resolution failed');
            
            // Should still complete successfully
            expect(result.payload.prompt).to.equal('Test prompt');
            expect(result.payload.task_type).to.be.a('string');
        });

        it('should handle model routing failures gracefully', async () => {
            const stub = sinon.stub(modelRouter, 'route');
            stub.throws(new Error('Model routing service unavailable'));

            const result = await orchestrator.orchestrate('Test prompt');

            expect(result.payload.model_hint).to.equal('gpt-4o-mini'); // Default fallback
            expect(result.metadata.model_routing.metadata.fallback_used).to.be.true;
            expect(result.payload.reasoning).to.include('Model routing failed');
        });

        it('should handle multiple component failures simultaneously', async () => {
            const taskStub = sinon.stub(require('../../src/lib/task-detector'), 'detectTask');
            taskStub.throws(new Error('Task detection failed'));

            const templateStub = sinon.stub(templateLoader, 'resolveTemplateForTask');
            templateStub.rejects(new Error('Template loading failed'));

            const modelStub = sinon.stub(modelRouter, 'route');
            modelStub.throws(new Error('Model routing failed'));

            try {
                const result = await orchestrator.orchestrate('Test prompt', { 
                    template: 'test-template',
                    fast: true,
                    budget: 'high'
                });

                // Should still produce a valid result with all fallbacks
                expect(result.payload.task_type).to.equal('general');
                expect(result.payload.template_used).to.be.null;
                expect(result.payload.model_hint).to.equal('gpt-4o-mini');
                
                // Should preserve user options
                expect(result.payload.context_metadata.prefer_fast).to.be.true;
                expect(result.payload.context_metadata.budget_mode).to.equal('high');

                // All components should indicate failures
                expect(result.metadata.task_detection.reasoning).to.include('failed');
                expect(result.metadata.template_used.reasoning).to.include('failed');
                expect(result.metadata.model_routing.metadata.fallback_used).to.be.true;

            } finally {
                taskStub.restore();
                templateStub.restore();
                modelStub.restore();
            }
        });

        it('should handle timeout scenarios gracefully', async () => {
            // Simulate a slow template loading operation
            const stub = sinon.stub(templateLoader, 'resolveTemplateForTask');
            stub.callsFake(() => new Promise(resolve => setTimeout(resolve, 5000))); // 5 second delay

            const startTime = Date.now();
            const result = await orchestrator.orchestrate('Test prompt', { template: 'slow-template' });
            const endTime = Date.now();

            // Should complete in reasonable time (not wait for the 5 second timeout)
            expect(endTime - startTime).to.be.lessThan(1000);

            // Should have fallback behavior
            expect(result.payload).to.have.property('prompt');
            expect(result.payload).to.have.property('task_type');
            expect(result.metadata.processing_time_ms).to.be.a('number');
        });

        it('should handle malformed configuration gracefully', async () => {
            // Test with extreme/invalid values that might cause issues
            const result = await orchestrator.orchestrate('', { // Empty prompt
                fast: true,
                budget: 'high'
            });

            // Should handle empty prompt gracefully
            expect(result.payload.prompt).to.equal('');
            expect(result.payload.task_type).to.equal('general');
            expect(result.payload.confidence).to.be.lessThan(0.5);
            expect(result.metadata.task_detection.reasoning).to.include('Empty');
        });

        it('should provide meaningful error messages', async () => {
            const stub = sinon.stub(require('../../src/lib/task-detector'), 'detectTask');
            stub.throws(new Error('Network connection timeout'));

            try {
                const result = await orchestrator.orchestrate('Test prompt');

                // Error message should be informative
                expect(result.payload.reasoning).to.include('Task detection failed');
                expect(result.payload.reasoning).to.include('Network connection timeout');
                expect(result.metadata.task_detection.reasoning).to.include('Network connection timeout');

            } finally {
                stub.restore();
            }
        });

        it('should maintain processing time tracking even with errors', async () => {
            const stub = sinon.stub(templateLoader, 'resolveTemplateForTask');
            stub.rejects(new Error('Template error'));

            const result = await orchestrator.orchestrate('Test prompt');

            expect(result.metadata.processing_time_ms).to.be.a('number');
            expect(result.metadata.processing_time_ms).to.be.greaterThan(0);
            expect(result.payload.context_metadata.processing_time_ms).to.be.a('number');
            expect(result.payload.context_metadata.processing_time_ms).to.be.greaterThan(0);
        });
    });
});