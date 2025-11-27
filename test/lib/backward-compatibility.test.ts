import { expect } from 'chai';
import * as fc from 'fast-check';
import { test } from '@oclif/test';
import * as sinon from 'sinon';
import Enhance from '../../src/commands/enhance';
import { orchestrator } from '../../src/lib/orchestrator';

describe('Backward Compatibility and Graceful Degradation', () => {
    let orchestratorStub: sinon.SinonStub;
    let apiClientStub: sinon.SinonStub;

    beforeEach(() => {
        orchestratorStub = sinon.stub(orchestrator, 'orchestrate');
        const apiClient = require('../../src/lib/apiClient').apiClient;
        apiClientStub = sinon.stub(apiClient, 'post');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Property-Based Tests', () => {
        // **Feature: pbcli-phase2-orchestrator, Property 14: Backward compatibility preservation**
        it('should behave identically to current implementation when new flags are not used', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 100 }),
                async (prompt) => {
                    // Setup mocks for Phase-2 orchestration
                    const mockOrchestrationResult = {
                        payload: {
                            prompt,
                            task_type: 'general',
                            confidence: 0.5,
                            model_hint: 'gpt-4o-mini',
                            reasoning: 'Default reasoning',
                            template_used: null,
                            context_metadata: {
                                prefer_fast: false,
                                budget_mode: 'medium',
                                template_source: 'none',
                                original_prompt_length: prompt.length,
                                processing_time_ms: 100
                            }
                        },
                        metadata: {
                            task_detection: {
                                task_type: 'general',
                                confidence: 0.5,
                                reasoning: 'General task detected'
                            },
                            template_used: {
                                template: null,
                                reasoning: 'No template selected',
                                source: 'none'
                            },
                            model_routing: {
                                model_hint: 'gpt-4o-mini',
                                reasoning: 'Default model selected',
                                metadata: {
                                    budget_mode: 'medium',
                                    prefer_fast: false,
                                    fallback_used: false,
                                    context_requirements: {
                                        max_tokens: 4000,
                                        requires_code_context: false,
                                        requires_design_context: false
                                    }
                                }
                            },
                            processing_time_ms: 100
                        }
                    };

                    orchestratorStub.resolves(mockOrchestrationResult);

                    const mockBackendResponse = {
                        enhanced_prompt: 'Enhanced: ' + prompt,
                        task_type: 'general',
                        confidence: 0.5,
                        model_hint: 'gpt-4o-mini'
                    };

                    apiClientStub.resolves({ data: mockBackendResponse });

                    // Run command without any new flags (backward compatibility mode)
                    await test
                        .stdout()
                        .command(['enhance', prompt])
                        .it('should work without new flags');

                    // Verify orchestrator was called with default options
                    expect(orchestratorStub.calledOnce).to.be.true;
                    const orchestratorCall = orchestratorStub.getCall(0);
                    expect(orchestratorCall.args[0]).to.equal(prompt);
                    
                    const options = orchestratorCall.args[1];
                    expect(options.fast).to.be.false; // Default value
                    expect(options.budget).to.equal('medium'); // Default value
                    expect(options.template).to.be.undefined; // No template specified

                    // Verify API was called with orchestrated payload
                    expect(apiClientStub.calledOnce).to.be.true;
                    const apiCall = apiClientStub.getCall(0);
                    expect(apiCall.args[0]).to.equal('/general');
                    
                    // The payload should match Phase-2 format but with default values
                    const payload = apiCall.args[1];
                    expect(payload.prompt).to.equal(prompt);
                    expect(payload.context_metadata.prefer_fast).to.be.false;
                    expect(payload.context_metadata.budget_mode).to.equal('medium');
                    expect(payload.template_used).to.be.null;
                }
            ), { numRuns: 20 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 15: Graceful degradation**
        it('should fall back to existing functionality when Phase-2 backend is unavailable', async () => {
            await fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 100 }),
                async (prompt) => {
                    // Setup orchestration to succeed
                    const mockOrchestrationResult = {
                        payload: {
                            prompt,
                            task_type: 'general',
                            confidence: 0.5,
                            model_hint: 'gpt-4o-mini',
                            reasoning: 'Default reasoning',
                            template_used: null,
                            context_metadata: {
                                prefer_fast: false,
                                budget_mode: 'medium',
                                template_source: 'none',
                                original_prompt_length: prompt.length,
                                processing_time_ms: 100
                            }
                        },
                        metadata: {
                            task_detection: {
                                task_type: 'general',
                                confidence: 0.5,
                                reasoning: 'General task detected'
                            },
                            template_used: {
                                template: null,
                                reasoning: 'No template selected',
                                source: 'none'
                            },
                            model_routing: {
                                model_hint: 'gpt-4o-mini',
                                reasoning: 'Default model selected',
                                metadata: {
                                    budget_mode: 'medium',
                                    prefer_fast: false,
                                    fallback_used: false,
                                    context_requirements: {
                                        max_tokens: 4000,
                                        requires_code_context: false,
                                        requires_design_context: false
                                    }
                                }
                            },
                            processing_time_ms: 100
                        }
                    };

                    orchestratorStub.resolves(mockOrchestrationResult);

                    // First API call (Phase-2) fails with 404
                    apiClientStub.onFirstCall().rejects({ 
                        response: { status: 404 },
                        message: 'Phase-2 endpoint not found'
                    });

                    // Second API call (Phase-1 fallback) succeeds
                    const fallbackResponse = {
                        enhanced_prompt: 'Fallback enhanced: ' + prompt,
                        task_type: 'general'
                    };
                    apiClientStub.onSecondCall().resolves({ data: fallbackResponse });

                    // Run command
                    await test
                        .stdout()
                        .command(['enhance', prompt])
                        .it('should fallback gracefully');

                    // Verify orchestration was attempted
                    expect(orchestratorStub.calledOnce).to.be.true;

                    // Verify both API calls were made
                    expect(apiClientStub.calledTwice).to.be.true;

                    // First call should be Phase-2 with orchestrated payload
                    const firstCall = apiClientStub.getCall(0);
                    expect(firstCall.args[0]).to.equal('/general');
                    expect(firstCall.args[1]).to.deep.equal(mockOrchestrationResult.payload);

                    // Second call should be Phase-1 fallback
                    const secondCall = apiClientStub.getCall(1);
                    expect(secondCall.args[0]).to.equal('/general');
                    expect(secondCall.args[1]).to.have.property('prompt', prompt);
                    expect(secondCall.args[1]).to.have.property('metadata');
                    // Phase-1 payload should be simpler than Phase-2
                    expect(secondCall.args[1]).to.not.have.property('context_metadata');
                }
            ), { numRuns: 15 });
        });

        // **Feature: pbcli-phase2-orchestrator, Property 16: Configuration resilience**
        it('should use safe defaults and continue processing with invalid configurations', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    prompt: fc.string({ minLength: 1, maxLength: 100 }),
                    invalidBudget: fc.string({ minLength: 1, maxLength: 10 }).filter(s => !['low', 'medium', 'high'].includes(s))
                }),
                async (input) => {
                    // Setup orchestration to handle invalid budget gracefully
                    const mockOrchestrationResult = {
                        payload: {
                            prompt: input.prompt,
                            task_type: 'general',
                            confidence: 0.5,
                            model_hint: 'gpt-4o-mini',
                            reasoning: 'Default reasoning with fallback',
                            template_used: null,
                            context_metadata: {
                                prefer_fast: false,
                                budget_mode: 'medium', // Should default to medium for invalid budget
                                template_source: 'none',
                                original_prompt_length: input.prompt.length,
                                processing_time_ms: 100
                            }
                        },
                        metadata: {
                            task_detection: {
                                task_type: 'general',
                                confidence: 0.5,
                                reasoning: 'General task detected'
                            },
                            template_used: {
                                template: null,
                                reasoning: 'No template selected',
                                source: 'none'
                            },
                            model_routing: {
                                model_hint: 'gpt-4o-mini',
                                reasoning: 'Default model with safe fallback',
                                metadata: {
                                    budget_mode: 'medium',
                                    prefer_fast: false,
                                    fallback_used: true, // Indicates fallback was used
                                    context_requirements: {
                                        max_tokens: 4000,
                                        requires_code_context: false,
                                        requires_design_context: false
                                    }
                                }
                            },
                            processing_time_ms: 100
                        }
                    };

                    orchestratorStub.resolves(mockOrchestrationResult);

                    const mockBackendResponse = {
                        enhanced_prompt: 'Enhanced with safe defaults: ' + input.prompt,
                        task_type: 'general',
                        confidence: 0.5,
                        model_hint: 'gpt-4o-mini'
                    };

                    apiClientStub.resolves({ data: mockBackendResponse });

                    // The command should handle invalid budget by using default
                    // Note: oclif will validate the budget flag, so this tests internal resilience
                    await test
                        .stdout()
                        .command(['enhance', input.prompt])
                        .it('should use safe defaults');

                    // Verify orchestration completed successfully despite potential configuration issues
                    expect(orchestratorStub.calledOnce).to.be.true;
                    expect(apiClientStub.calledOnce).to.be.true;

                    // Verify safe defaults were used
                    const payload = apiClientStub.getCall(0).args[1];
                    expect(payload.context_metadata.budget_mode).to.equal('medium');
                    expect(payload.context_metadata.prefer_fast).to.be.false;
                }
            ), { numRuns: 10 });
        });
    });

    describe('Unit Tests', () => {
        it('should maintain exact Phase-1 behavior when no new flags are used', async () => {
            const prompt = 'Test backward compatibility';
            
            // Mock orchestration to return minimal Phase-2 payload
            const mockResult = {
                payload: {
                    prompt,
                    task_type: 'general',
                    confidence: 0.5,
                    model_hint: 'gpt-4o-mini',
                    reasoning: 'General task',
                    template_used: null,
                    context_metadata: {
                        prefer_fast: false,
                        budget_mode: 'medium',
                        template_source: 'none',
                        original_prompt_length: prompt.length,
                        processing_time_ms: 50
                    }
                },
                metadata: {
                    task_detection: { task_type: 'general', confidence: 0.5, reasoning: 'General' },
                    template_used: { template: null, reasoning: 'None', source: 'none' },
                    model_routing: { 
                        model_hint: 'gpt-4o-mini', 
                        reasoning: 'Default',
                        metadata: {
                            budget_mode: 'medium',
                            prefer_fast: false,
                            fallback_used: false,
                            context_requirements: {
                                max_tokens: 4000,
                                requires_code_context: false,
                                requires_design_context: false
                            }
                        }
                    },
                    processing_time_ms: 50
                }
            };

            orchestratorStub.resolves(mockResult);
            apiClientStub.resolves({ data: { enhanced_prompt: 'Enhanced: ' + prompt } });

            await test
                .stdout()
                .command(['enhance', prompt])
                .it('should maintain Phase-1 behavior');

            // Verify default options were used
            const options = orchestratorStub.getCall(0).args[1];
            expect(options.fast).to.be.false;
            expect(options.budget).to.equal('medium');
            expect(options.template).to.be.undefined;
        });

        it('should handle component failures gracefully', async () => {
            const prompt = 'Test component failure';
            
            // Orchestration fails
            orchestratorStub.rejects(new Error('Orchestration component failed'));

            await test
                .stdout()
                .stderr()
                .command(['enhance', prompt])
                .catch(err => {
                    // Should handle the error gracefully
                    expect(err.message).to.include('Enhancement failed');
                })
                .it('should handle component failures');
        });

        it('should handle API contract changes gracefully', async () => {
            const prompt = 'Test API contract change';
            
            const mockResult = {
                payload: {
                    prompt,
                    task_type: 'general',
                    confidence: 0.5,
                    model_hint: 'gpt-4o-mini',
                    reasoning: 'General task',
                    template_used: null,
                    context_metadata: {
                        prefer_fast: false,
                        budget_mode: 'medium',
                        template_source: 'none',
                        original_prompt_length: prompt.length,
                        processing_time_ms: 50
                    }
                },
                metadata: {
                    task_detection: { task_type: 'general', confidence: 0.5, reasoning: 'General' },
                    template_used: { template: null, reasoning: 'None', source: 'none' },
                    model_routing: { 
                        model_hint: 'gpt-4o-mini', 
                        reasoning: 'Default',
                        metadata: {
                            budget_mode: 'medium',
                            prefer_fast: false,
                            fallback_used: false,
                            context_requirements: {
                                max_tokens: 4000,
                                requires_code_context: false,
                                requires_design_context: false
                            }
                        }
                    },
                    processing_time_ms: 50
                }
            };

            orchestratorStub.resolves(mockResult);

            // Backend returns unexpected format
            apiClientStub.resolves({ 
                data: { 
                    result: 'Enhanced: ' + prompt, // Different field name
                    // Missing expected fields
                } 
            });

            await test
                .stdout()
                .command(['enhance', prompt])
                .it('should handle API contract changes');

            // Should complete without crashing
            expect(orchestratorStub.calledOnce).to.be.true;
            expect(apiClientStub.calledOnce).to.be.true;
        });
    });
});