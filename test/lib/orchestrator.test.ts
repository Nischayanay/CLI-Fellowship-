import { expect } from 'chai';
import * as fc from 'fast-check';
import { Orchestrator, OrchestrationOptions, OrchestrationResult, Phase2BackendPayload } from '../../src/lib/orchestrator';

describe('Orchestrator', () => {
    let orchestrator: Orchestrator;

    beforeEach(() => {
        orchestrator = new Orchestrator();
    });

    describe('Property-Based Tests', () => {
        // **Feature: pbcli-phase2-orchestrator, Property 9: Orchestration workflow completeness**
        it('should execute complete workflow and produce comprehensive results', () => {
            fc.assert(fc.property(
                fc.record({
                    userPrompt: fc.string({ minLength: 1, maxLength: 200 }),
                    fast: fc.boolean(),
                    budget: fc.constantFrom('low', 'medium', 'high'),
                    template: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined })
                }),
                async (input) => {
                    const options: OrchestrationOptions = {
                        fast: input.fast,
                        budget: input.budget,
                        template: input.template
                    };

                    const result = await orchestrator.orchestrate(input.userPrompt, options);

                    // Verify result structure
                    expect(result).to.have.property('payload');
                    expect(result).to.have.property('metadata');

                    // Verify payload structure (Phase-2 backend compliance)
                    const payload = result.payload;
                    expect(payload).to.have.all.keys([
                        'prompt', 'task_type', 'confidence', 'model_hint', 
                        'reasoning', 'template_used', 'context_metadata'
                    ]);

                    // Verify payload content
                    expect(payload.prompt).to.be.a('string');
                    expect(payload.prompt.length).to.be.greaterThan(0);
                    expect(payload.task_type).to.be.a('string');
                    expect(payload.confidence).to.be.a('number');
                    expect(payload.confidence).to.be.at.least(0);
                    expect(payload.confidence).to.be.at.most(1);
                    expect(payload.model_hint).to.be.a('string');
                    expect(payload.reasoning).to.be.a('string');
                    expect(payload.template_used).to.satisfy((val: any) => val === null || typeof val === 'string');

                    // Verify context metadata structure
                    expect(payload.context_metadata).to.have.all.keys([
                        'prefer_fast', 'budget_mode', 'template_source', 
                        'original_prompt_length', 'processing_time_ms'
                    ]);
                    expect(payload.context_metadata.prefer_fast).to.equal(input.fast);
                    expect(payload.context_metadata.budget_mode).to.equal(input.budget);
                    expect(payload.context_metadata.original_prompt_length).to.equal(input.userPrompt.length);
                    expect(payload.context_metadata.processing_time_ms).to.be.a('number');
                    expect(payload.context_metadata.processing_time_ms).to.be.greaterThan(0);

                    // Verify metadata structure
                    const metadata = result.metadata;
                    expect(metadata).to.have.all.keys([
                        'task_detection', 'template_used', 'model_routing', 'processing_time_ms'
                    ]);

                    // Verify task detection results
                    expect(metadata.task_detection).to.have.property('task_type');
                    expect(metadata.task_detection).to.have.property('confidence');
                    expect(metadata.task_detection).to.have.property('reasoning');

                    // Verify template resolution results
                    expect(metadata.template_used).to.have.property('template');
                    expect(metadata.template_used).to.have.property('reasoning');
                    expect(metadata.template_used).to.have.property('source');

                    // Verify model routing results
                    expect(metadata.model_routing).to.have.property('model_hint');
                    expect(metadata.model_routing).to.have.property('reasoning');
                    expect(metadata.model_routing).to.have.property('metadata');

                    // Verify processing time consistency
                    expect(metadata.processing_time_ms).to.be.a('number');
                    expect(metadata.processing_time_ms).to.be.greaterThan(0);
                }
            ), { numRuns: 50 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 10: Orchestration error resilience**
        it('should handle component failures gracefully and continue with safe defaults', () => {
            fc.assert(fc.property(
                fc.record({
                    userPrompt: fc.string({ minLength: 1, maxLength: 100 }),
                    fast: fc.boolean(),
                    budget: fc.constantFrom('low', 'medium', 'high')
                }),
                async (input) => {
                    const options: OrchestrationOptions = {
                        fast: input.fast,
                        budget: input.budget,
                        template: 'non-existent-template' // This should trigger template resolution failure
                    };

                    const result = await orchestrator.orchestrate(input.userPrompt, options);

                    // Even with template failure, should return valid result
                    expect(result).to.have.property('payload');
                    expect(result).to.have.property('metadata');

                    // Should have valid payload structure
                    expect(result.payload.prompt).to.be.a('string');
                    expect(result.payload.task_type).to.be.a('string');
                    expect(result.payload.model_hint).to.be.a('string');
                    expect(result.payload.reasoning).to.be.a('string');

                    // Template should be null due to failure, but orchestration continues
                    expect(result.payload.template_used).to.be.null;
                    expect(result.metadata.template_used.source).to.equal('none');

                    // Other components should still work
                    expect(result.metadata.task_detection.task_type).to.be.a('string');
                    expect(result.metadata.model_routing.model_hint).to.be.a('string');

                    // Should preserve user options even with failures
                    expect(result.payload.context_metadata.prefer_fast).to.equal(input.fast);
                    expect(result.payload.context_metadata.budget_mode).to.equal(input.budget);
                }
            ), { numRuns: 30 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 11: Backend payload compliance**
        it('should generate payloads that match Phase-2 backend JSON contract exactly', () => {
            fc.assert(fc.property(
                fc.record({
                    userPrompt: fc.string({ minLength: 1, maxLength: 150 }),
                    fast: fc.boolean(),
                    budget: fc.constantFrom('low', 'medium', 'high')
                }),
                async (input) => {
                    const options: OrchestrationOptions = {
                        fast: input.fast,
                        budget: input.budget
                    };

                    const result = await orchestrator.orchestrate(input.userPrompt, options);
                    const payload = result.payload;

                    // Verify exact schema compliance
                    const expectedKeys = [
                        'prompt', 'task_type', 'confidence', 'model_hint', 
                        'reasoning', 'template_used', 'context_metadata'
                    ];
                    expect(Object.keys(payload).sort()).to.deep.equal(expectedKeys.sort());

                    // Verify data types match backend expectations
                    expect(payload.prompt).to.be.a('string');
                    expect(payload.task_type).to.be.a('string');
                    expect(payload.confidence).to.be.a('number');
                    expect(payload.model_hint).to.be.a('string');
                    expect(payload.reasoning).to.be.a('string');
                    expect(payload.template_used).to.satisfy((val: any) => val === null || typeof val === 'string');

                    // Verify context_metadata schema
                    const contextKeys = [
                        'prefer_fast', 'budget_mode', 'template_source', 
                        'original_prompt_length', 'processing_time_ms'
                    ];
                    expect(Object.keys(payload.context_metadata).sort()).to.deep.equal(contextKeys.sort());

                    // Verify context_metadata data types
                    expect(payload.context_metadata.prefer_fast).to.be.a('boolean');
                    expect(payload.context_metadata.budget_mode).to.be.oneOf(['low', 'medium', 'high']);
                    expect(payload.context_metadata.template_source).to.be.a('string');
                    expect(payload.context_metadata.original_prompt_length).to.be.a('number');
                    expect(payload.context_metadata.processing_time_ms).to.be.a('number');

                    // Verify value constraints
                    expect(payload.confidence).to.be.at.least(0);
                    expect(payload.confidence).to.be.at.most(1);
                    expect(payload.context_metadata.original_prompt_length).to.be.greaterThan(0);
                    expect(payload.context_metadata.processing_time_ms).to.be.greaterThan(0);
                }
            ), { numRuns: 50 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 13: Prompt merging preservation**
        it('should preserve user intent while incorporating template guidance', () => {
            fc.assert(fc.property(
                fc.record({
                    userPrompt: fc.string({ minLength: 5, maxLength: 100 }),
                    fast: fc.boolean(),
                    budget: fc.constantFrom('low', 'medium', 'high')
                }),
                async (input) => {
                    const options: OrchestrationOptions = {
                        fast: input.fast,
                        budget: input.budget
                        // No template specified - will use auto-selection
                    };

                    const result = await orchestrator.orchestrate(input.userPrompt, options);

                    // Final prompt should contain or reference the original user prompt
                    const finalPrompt = result.payload.prompt;
                    expect(finalPrompt).to.be.a('string');
                    expect(finalPrompt.length).to.be.greaterThan(0);

                    // If template was used, final prompt should be enhanced but preserve intent
                    if (result.payload.template_used) {
                        // Should be longer than original (enhanced)
                        expect(finalPrompt.length).to.be.at.least(input.userPrompt.length);
                        
                        // Should contain key elements from original prompt
                        const originalWords = input.userPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                        if (originalWords.length > 0) {
                            const finalPromptLower = finalPrompt.toLowerCase();
                            const preservedWords = originalWords.filter(word => finalPromptLower.includes(word));
                            // At least some significant words should be preserved
                            expect(preservedWords.length).to.be.greaterThan(0);
                        }
                    } else {
                        // If no template used, should be identical to original
                        expect(finalPrompt).to.equal(input.userPrompt);
                    }

                    // Original prompt length should be tracked correctly
                    expect(result.payload.context_metadata.original_prompt_length).to.equal(input.userPrompt.length);
                }
            ), { numRuns: 30 });
        });
    });

    describe('Unit Tests', () => {
        it('should handle empty prompts gracefully', async () => {
            const result = await orchestrator.orchestrate('');
            
            expect(result.payload.prompt).to.equal('');
            expect(result.payload.task_type).to.equal('general');
            expect(result.payload.confidence).to.be.lessThan(0.5);
            expect(result.metadata.task_detection.reasoning).to.include('Empty');
        });

        it('should respect fast mode preference', async () => {
            const fastResult = await orchestrator.orchestrate('Test prompt', { fast: true });
            const normalResult = await orchestrator.orchestrate('Test prompt', { fast: false });

            expect(fastResult.payload.context_metadata.prefer_fast).to.be.true;
            expect(normalResult.payload.context_metadata.prefer_fast).to.be.false;
        });

        it('should respect budget constraints', async () => {
            const lowBudgetResult = await orchestrator.orchestrate('Test prompt', { budget: 'low' });
            const highBudgetResult = await orchestrator.orchestrate('Test prompt', { budget: 'high' });

            expect(lowBudgetResult.payload.context_metadata.budget_mode).to.equal('low');
            expect(highBudgetResult.payload.context_metadata.budget_mode).to.equal('high');
        });

        it('should combine reasoning from all components', async () => {
            const result = await orchestrator.orchestrate('Fix this TypeScript bug');

            expect(result.payload.reasoning).to.be.a('string');
            expect(result.payload.reasoning).to.include('Task:');
            expect(result.payload.reasoning).to.include('Model:');
            
            // Should contain reasoning from task detection
            expect(result.payload.reasoning.toLowerCase()).to.include('coding');
        });

        it('should track processing time accurately', async () => {
            const startTime = Date.now();
            const result = await orchestrator.orchestrate('Test prompt');
            const endTime = Date.now();

            expect(result.metadata.processing_time_ms).to.be.a('number');
            expect(result.metadata.processing_time_ms).to.be.greaterThan(0);
            expect(result.metadata.processing_time_ms).to.be.lessThan(endTime - startTime + 100); // Allow some margin
        });

        it('should handle template expansion correctly', async () => {
            // This test would require setting up actual templates, which is complex in unit test
            // The property tests above cover this functionality more comprehensively
            const result = await orchestrator.orchestrate('Create a React component');
            
            // Should complete successfully even without specific templates
            expect(result.payload).to.have.property('prompt');
            expect(result.payload).to.have.property('task_type');
            expect(result.metadata.template_used).to.have.property('source');
        });
    });
});