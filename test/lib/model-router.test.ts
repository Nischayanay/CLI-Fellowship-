import { expect } from 'chai';
import * as fc from 'fast-check';
import { ModelRouter, ModelRoutingOptions, ModelRoutingResult } from '../../src/lib/model-router';
import { TaskType } from '../../src/lib/task-detector';

describe('Model Router', () => {
    let modelRouter: ModelRouter;

    beforeEach(() => {
        modelRouter = new ModelRouter();
    });

    describe('Property-Based Tests', () => {
        // **Feature: pbcli-phase2-orchestrator, Property 1: Model routing respects constraints**
        it('should respect model routing constraints across all inputs', () => {
            fc.assert(fc.property(
                fc.record({
                    taskType: fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'),
                    budget: fc.constantFrom('low', 'medium', 'high'),
                    preferFast: fc.boolean(),
                    maxTokens: fc.integer({ min: 1000, max: 50000 })
                }),
                (input) => {
                    const options: ModelRoutingOptions = {
                        budget: input.budget,
                        fast: input.preferFast,
                        contextRequirements: {
                            maxTokens: input.maxTokens
                        }
                    };

                    const result = modelRouter.route(input.taskType as TaskType, options);

                    // Verify result structure
                    expect(result).to.have.property('model_hint');
                    expect(result).to.have.property('reasoning');
                    expect(result).to.have.property('metadata');

                    // Verify model_hint is a valid string
                    expect(result.model_hint).to.be.a('string');
                    expect(result.model_hint.length).to.be.greaterThan(0);

                    // Verify reasoning is provided
                    expect(result.reasoning).to.be.a('string');
                    expect(result.reasoning.length).to.be.greaterThan(0);

                    // Verify metadata structure and constraints
                    expect(result.metadata.budget_mode).to.equal(input.budget);
                    expect(result.metadata.prefer_fast).to.equal(input.preferFast);
                    expect(result.metadata.fallback_used).to.be.a('boolean');

                    // Verify context requirements
                    expect(result.metadata.context_requirements).to.have.property('max_tokens');
                    expect(result.metadata.context_requirements).to.have.property('requires_code_context');
                    expect(result.metadata.context_requirements).to.have.property('requires_design_context');

                    // Verify context requirements are reasonable
                    expect(result.metadata.context_requirements.max_tokens).to.be.at.least(1000);
                    expect(result.metadata.context_requirements.requires_code_context).to.be.a('boolean');
                    expect(result.metadata.context_requirements.requires_design_context).to.be.a('boolean');

                    // Verify task-specific context requirements
                    if (input.taskType === 'coding' || input.taskType === 'structured') {
                        expect(result.metadata.context_requirements.requires_code_context).to.be.true;
                    }
                    if (input.taskType === 'minimal') {
                        expect(result.metadata.context_requirements.requires_design_context).to.be.true;
                    }
                }
            ), { numRuns: 100 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 2: Model routing graceful fallback**
        it('should handle routing failures gracefully with fallback', () => {
            fc.assert(fc.property(
                fc.record({
                    taskType: fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'),
                    budget: fc.constantFrom('low', 'medium', 'high'),
                    preferFast: fc.boolean()
                }),
                (input) => {
                    // Test with extreme/invalid token requirements to potentially trigger fallback
                    const options: ModelRoutingOptions = {
                        budget: input.budget,
                        fast: input.preferFast,
                        contextRequirements: {
                            maxTokens: 1000000 // Extremely high token requirement
                        }
                    };

                    const result = modelRouter.route(input.taskType as TaskType, options);

                    // Even with extreme requirements, should return valid result
                    expect(result).to.have.property('model_hint');
                    expect(result).to.have.property('reasoning');
                    expect(result).to.have.property('metadata');

                    // Should have valid model hint
                    expect(result.model_hint).to.be.a('string');
                    expect(result.model_hint.length).to.be.greaterThan(0);

                    // Should have reasoning explaining the decision
                    expect(result.reasoning).to.be.a('string');
                    expect(result.reasoning.length).to.be.greaterThan(0);

                    // Metadata should be consistent
                    expect(result.metadata.budget_mode).to.equal(input.budget);
                    expect(result.metadata.prefer_fast).to.equal(input.preferFast);
                    expect(result.metadata.fallback_used).to.be.a('boolean');
                }
            ), { numRuns: 100 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 3: Model router output format compliance**
        it('should return output in exact backend format without network calls', () => {
            fc.assert(fc.property(
                fc.record({
                    taskType: fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'),
                    budget: fc.constantFrom('low', 'medium', 'high'),
                    preferFast: fc.boolean()
                }),
                (input) => {
                    const startTime = Date.now();
                    const result = modelRouter.route(input.taskType as TaskType, {
                        budget: input.budget,
                        fast: input.preferFast
                    });
                    const endTime = Date.now();

                    // Should complete very quickly (no network calls)
                    expect(endTime - startTime).to.be.lessThan(100); // Less than 100ms

                    // Verify exact backend format compliance
                    expect(result).to.have.all.keys(['model_hint', 'reasoning', 'metadata']);

                    // Verify model_hint format
                    expect(result.model_hint).to.be.a('string');
                    expect(result.model_hint).to.match(/^[a-z0-9-]+$/); // Valid model name format

                    // Verify reasoning format
                    expect(result.reasoning).to.be.a('string');
                    expect(result.reasoning).to.include('Selected');

                    // Verify metadata structure exactly matches backend format
                    expect(result.metadata).to.have.all.keys([
                        'budget_mode', 
                        'prefer_fast', 
                        'fallback_used', 
                        'context_requirements'
                    ]);

                    expect(result.metadata.budget_mode).to.be.oneOf(['low', 'medium', 'high']);
                    expect(result.metadata.prefer_fast).to.be.a('boolean');
                    expect(result.metadata.fallback_used).to.be.a('boolean');

                    // Verify context_requirements structure
                    expect(result.metadata.context_requirements).to.have.all.keys([
                        'max_tokens',
                        'requires_code_context',
                        'requires_design_context'
                    ]);

                    expect(result.metadata.context_requirements.max_tokens).to.be.a('number');
                    expect(result.metadata.context_requirements.max_tokens).to.be.greaterThan(0);
                    expect(result.metadata.context_requirements.requires_code_context).to.be.a('boolean');
                    expect(result.metadata.context_requirements.requires_design_context).to.be.a('boolean');
                }
            ), { numRuns: 100 });
        });
    });

    describe('Unit Tests', () => {
        it('should select appropriate models for coding tasks', () => {
            const result = modelRouter.route('coding', { budget: 'high' });
            
            expect(result.model_hint).to.be.oneOf(['gpt-4o', 'claude-3-sonnet']);
            expect(result.reasoning).to.include('coding');
            expect(result.metadata.context_requirements.requires_code_context).to.be.true;
        });

        it('should respect fast mode preference', () => {
            const fastResult = modelRouter.route('general', { fast: true, budget: 'medium' });
            const normalResult = modelRouter.route('general', { fast: false, budget: 'medium' });
            
            expect(fastResult.metadata.prefer_fast).to.be.true;
            expect(normalResult.metadata.prefer_fast).to.be.false;
            
            // Fast mode should prefer faster models
            expect(fastResult.reasoning).to.include('speed');
        });

        it('should respect budget constraints', () => {
            const lowBudgetResult = modelRouter.route('coding', { budget: 'low' });
            const highBudgetResult = modelRouter.route('coding', { budget: 'high' });
            
            expect(lowBudgetResult.model_hint).to.be.oneOf(['gpt-4o-mini', 'claude-3-haiku']);
            expect(highBudgetResult.reasoning).to.include('budget');
        });

        it('should handle fallback scenarios', () => {
            // Create a scenario that might trigger fallback by mocking an error
            const originalRoute = modelRouter.route;
            let callCount = 0;
            
            // Mock to throw error on first call, succeed on second
            (modelRouter as any).selectModelForTask = () => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Test error');
                }
                return { name: 'gpt-4o-mini', cost: 'low', speed: 'fast', quality: 'good', maxTokens: 128000, specialties: ['general'] };
            };

            const result = modelRouter.route('general');
            
            expect(result.model_hint).to.equal('gpt-4o-mini');
            expect(result.metadata.fallback_used).to.be.true;
            expect(result.reasoning).to.include('Fallback');
        });

        it('should adjust context requirements based on task type', () => {
            const codingResult = modelRouter.route('coding');
            const minimalResult = modelRouter.route('minimal');
            const researchResult = modelRouter.route('research');
            
            expect(codingResult.metadata.context_requirements.requires_code_context).to.be.true;
            expect(codingResult.metadata.context_requirements.max_tokens).to.be.at.least(8000);
            
            expect(minimalResult.metadata.context_requirements.requires_design_context).to.be.true;
            expect(minimalResult.metadata.context_requirements.max_tokens).to.be.at.most(2000);
            
            expect(researchResult.metadata.context_requirements.max_tokens).to.be.at.least(10000);
        });
    });
});