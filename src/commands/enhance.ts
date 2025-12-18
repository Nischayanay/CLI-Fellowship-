import { Command, Args, Flags } from '@oclif/core';
import { apiClient, updateApiClient } from '../lib/apiClient';
import { logger } from '../utils/logger';
import { detectTask, TaskDetectionResult } from '../lib/task-detector';
import { orchestrator, OrchestrationOptions, OrchestrationResult } from '../lib/orchestrator';
import colors from '../utils/colors';
import progress from '../utils/progress';
import reinforcement from '../utils/reinforcement';
import jsonOutput from '../utils/json-output';
import interactive from '../utils/interactive';
import boxes from '../utils/boxes';
import OutputFormatter from '../utils/output-formatter';
import PromptOptimizer from '../utils/prompt-optimizer';
import ContextDetector from '../utils/context-detector';
import ClipboardManager from '../utils/clipboard';


/**
 * Display comprehensive orchestration metadata to user
 */
function displayOrchestrationMetadata(metadata: OrchestrationResult['metadata'], backendResponse: any): void {
    const confidencePercent = Math.round(metadata.task_detection.confidence * 100);
    
    console.log('');
    
    // Task Detection
    console.log(
        colors.primary('🔍 Task Detected: ') + 
        colors.highlight(metadata.task_detection.task_type) + 
        colors.dim(` (confidence: ${confidencePercent}%)`)
    );
    console.log(colors.dim(`   💡 ${metadata.task_detection.reasoning}`));
    
    // Model Selection
    console.log(
        colors.primary('🤖 Model Selected: ') + 
        colors.highlight(metadata.model_routing.model_hint)
    );
    console.log(colors.dim(`   🎯 ${metadata.model_routing.reasoning}`));
    
    // Template Usage
    if (metadata.template_used.template) {
        console.log(
            colors.success('📝 Template Applied: ') + 
            colors.highlight(metadata.template_used.template.name) +
            colors.dim(` (${metadata.template_used.template.category})`)
        );
        console.log(colors.dim(`   📋 ${metadata.template_used.reasoning}`));
    } else {
        console.log(colors.dim('📝 No template applied'));
    }
    
    // Processing Time
    const processingTime = backendResponse?.metadata?.processing_time_ms || metadata.processing_time_ms;
    console.log(
        colors.metadata('⏱️  Processing Time: ') + 
        colors.highlight(`${processingTime}ms`)
    );
    
    // Context Sources (if available from backend)
    if (backendResponse?.metadata?.context_sources && backendResponse.metadata.context_sources.length > 0) {
        reinforcement.showContextSources(backendResponse.metadata.context_sources);
    }
    
    console.log('');
}

/**
 * Display enhanced prompt with clear formatting
 */
function displayEnhancedPrompt(original: string, enhanced: string): void {
    console.log(colors.heading('Original:'));
    console.log(colors.dim(original));
    console.log('');
    console.log(colors.heading('Enhanced:'));
    console.log(colors.success(enhanced));
}

export default class Enhance extends Command {
    static description = 'Enhance a prompt using the Context Engine';

    static args = {
        prompt: Args.string({ description: 'The prompt to enhance', required: true }),
    };

    static flags = {
        fast: Flags.boolean({ 
            description: 'Enable fast mode for speed-optimized processing',
            default: false
        }),
        budget: Flags.string({ 
            description: 'Budget mode for model selection',
            options: ['low', 'medium', 'high'],
            default: 'medium'
        }),
        template: Flags.string({ 
            description: 'Specify template name to use for enhancement',
            char: 't'
        }),
        interactive: Flags.boolean({
            description: 'Launch interactive prompt editor',
            char: 'i',
            default: false
        }),
        stream: Flags.boolean({
            description: 'Stream the enhanced prompt in real-time',
            default: false
        }),

        optimize: Flags.boolean({
            description: 'Show prompt optimization analysis',
            char: 'o',
            default: true
        }),

        'no-copy': Flags.boolean({
            description: 'Disable automatic clipboard copy',
            default: false
        }),
    };

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Enhance);
        let prompt = args.prompt;

        // Interactive mode
        if (flags.interactive) {
            prompt = await this.runInteractiveMode();
        }

        // Check for JSON output mode
        const useJson = jsonOutput.isEnabled();

        // Smart prompt optimization and analysis
        if (flags.optimize && !useJson) {
            const optimizationResult = await this.runPromptOptimization(prompt);
            prompt = optimizationResult.finalPrompt;
        }

        // Prepare orchestration options from flags
        const orchestrationOptions: OrchestrationOptions = {
            fast: flags.fast,
            budget: flags.budget as 'low' | 'medium' | 'high',
            template: flags.template
        };

        // Update API client with current config
        await updateApiClient();

        if (!useJson) {
            progress.thinking('Orchestrating enhancement...');
        }

        try {
            // Run orchestration to prepare Phase-2 payload
            const orchestrationResult = await orchestrator.orchestrate(prompt, orchestrationOptions);

            if (!useJson) {
                progress.processing('Enhancing prompt...');
            }

            // Send Phase-2 compliant payload to backend
            const { data } = await apiClient.post('/api/enhance', { prompt });

            if (useJson) {
                // JSON output mode
                jsonOutput.success({
                    original: prompt,
                    enhanced: data.enhanced_prompt || data.result,
                    metadata: {
                        task_detection: orchestrationResult.metadata.task_detection,
                        model_routing: orchestrationResult.metadata.model_routing,
                        template_used: orchestrationResult.metadata.template_used,
                        processing_time_ms: data.metadata?.processing_time_ms || orchestrationResult.metadata.processing_time_ms,
                        context_sources: data.metadata?.context_sources,
                    },
                });
            } else {
                progress.succeed('Enhancement Complete!');
                
                const enhancedPrompt = data.enhanced_prompt || data.result || 'No enhancement returned.';
                
                // Use new output formatter
                this.displayEnhancedResults(
                    prompt, 
                    enhancedPrompt,
                    orchestrationResult.metadata,
                    data
                );

                // Auto-copy to clipboard (unless disabled)
                if (!flags['no-copy']) {
                    await this.handleClipboardCopy(enhancedPrompt);
                } else {
                    // Show completion message without clipboard
                    console.log('');
                    console.log(colors.success('✓ Enhancement complete! Copy the enhanced prompt above to use it.'));
                    console.log('');
                }
            }

        } catch (error) {
            if (!useJson) {
                progress.fail('Enhancement failed');
            }

            // Enhanced error handling with fallback to Phase-1 behavior
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                if (axiosError.response?.status === 404 || axiosError.response?.status === 400) {
                    if (!useJson) {
                        logger.warning('Phase-2 backend unavailable, falling back to Phase-1 behavior...');
                    }
                    await this.fallbackToPhase1(prompt, useJson);
                    return;
                }
            }
            
            if (useJson) {
                jsonOutput.error('ENHANCEMENT_FAILED', 'Enhancement failed. Please try again.');
            } else {
                logger.error('Enhancement failed. Please try again.');
            }
        }
    }

    /**
     * Fallback to Phase-1 behavior when Phase-2 backend is unavailable
     */
    private async fallbackToPhase1(prompt: string, useJson: boolean = false): Promise<void> {
        try {
            // Use original Phase-1 logic
            let detection: TaskDetectionResult;
            try {
                detection = detectTask(prompt);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                detection = {
                    task_type: 'general',
                    confidence: 0.5,
                    reasoning: `Task detection failed: ${errorMessage}`
                };
            }

            // Prepare Phase-1 request
            const requestBody: any = { prompt };
            if (detection && detection.task_type) {
                requestBody.metadata = {
                    task_type: detection.task_type,
                    confidence: detection.confidence || 0.5,
                    reasoning: detection.reasoning || 'No reasoning available'
                };
            }

            const { data } = await apiClient.post('/general', requestBody);

            if (useJson) {
                jsonOutput.success({
                    original: prompt,
                    enhanced: data.enhanced_prompt || data.result,
                    metadata: {
                        task_detection: detection,
                        phase: 1,
                        context_sources: data.context_sources,
                    },
                });
            } else {
                const enhancedPrompt = data.enhanced_prompt || data.result || 'No enhancement returned.';
                
                // Clean enhanced prompt display
                console.log('');
                console.log(colors.success('Enhanced Prompt:'));
                console.log(colors.dim('─'.repeat(60)));
                console.log(colors.neutral(enhancedPrompt));
                console.log(colors.dim('─'.repeat(60)));

                // Developer metrics
                const originalTokens = Math.ceil(prompt.split(/\s+/).length * 1.3);
                const enhancedTokens = Math.ceil(enhancedPrompt.split(/\s+/).length * 1.3);
                const tokensAdded = enhancedTokens - originalTokens;
                
                console.log('');
                console.log(
                    colors.dim('Tokens: ') + colors.highlight(`${enhancedTokens}`) +
                    (tokensAdded > 0 ? colors.success(` (+${tokensAdded})`) : colors.warning(` (saved)`)) +
                    colors.dim(' • Task: ') + colors.highlight(detection.task_type)
                );

                // Context sources
                if (data.context_sources && data.context_sources.length > 0) {
                    const sources = data.context_sources
                        .map((source: any) => source.type || source.name)
                        .join(', ');
                    console.log(colors.dim('Context from: ') + colors.primary(sources));
                }

                // Auto-copy to clipboard for Phase-1 fallback too
                const { flags } = await this.parse(Enhance);
                if (!flags['no-copy']) {
                    await this.handleClipboardCopy(enhancedPrompt);
                }
            }

        } catch (fallbackError) {
            if (useJson) {
                jsonOutput.error('FALLBACK_FAILED', 'Both Phase-2 and Phase-1 enhancement failed. Please check your connection and try again.');
            } else {
                logger.error('Both Phase-2 and Phase-1 enhancement failed. Please check your connection and try again.');
            }
        }
    }

    /**
     * Smart prompt optimization workflow - minimal developer output
     */
    private async runPromptOptimization(prompt: string): Promise<{ finalPrompt: string }> {
        // Quick analysis without verbose output
        const analysis = PromptOptimizer.analyzePrompt(prompt);
        
        // Detect integrations silently
        const integrations = await ContextDetector.detectIntegrations(prompt);
        
        // Generate optimized prompt
        const contextualPrompt = ContextDetector.enhancePromptWithContext(prompt, integrations);
        const optimization = PromptOptimizer.optimizePrompt(contextualPrompt);

        // Show minimal analysis info
        console.log('');
        console.log(
            colors.dim('Analysis: ') + 
            colors.highlight(`${analysis.length} chars`) +
            colors.dim(' • ') + 
            colors.highlight(`~${analysis.tokenEstimate} tokens`) +
            (analysis.detectedContexts.length > 0 ? 
                colors.dim(' • ') + colors.primary(analysis.detectedContexts.join(', ')) : '')
        );

        return { finalPrompt: optimization.optimized };
    }

    /**
     * Display enhanced results - developer-focused format
     */
    private displayEnhancedResults(
        original: string, 
        enhanced: string, 
        metadata: OrchestrationResult['metadata'], 
        backendResponse: any
    ): void {
        console.log('');
        
        // Clean enhanced prompt display
        console.log(colors.success('Enhanced Prompt:'));
        console.log(colors.dim('─'.repeat(60)));
        console.log(colors.neutral(enhanced));
        console.log(colors.dim('─'.repeat(60)));

        // Developer metrics in one line
        const originalTokens = Math.ceil(original.split(/\s+/).length * 1.3);
        const enhancedTokens = Math.ceil(enhanced.split(/\s+/).length * 1.3);
        const tokensSaved = originalTokens < enhancedTokens ? 0 : originalTokens - enhancedTokens;
        const tokensAdded = enhancedTokens - originalTokens;
        
        const processingTime = backendResponse?.metadata?.processing_time_ms || metadata.processing_time_ms;
        
        console.log('');
        console.log(
            colors.dim('Tokens: ') + colors.highlight(`${enhancedTokens}`) +
            (tokensAdded > 0 ? colors.success(` (+${tokensAdded})`) : colors.warning(` (${tokensSaved} saved)`)) +
            colors.dim(' • Time: ') + colors.highlight(`${processingTime}ms`) +
            colors.dim(' • Task: ') + colors.highlight(metadata.task_detection.task_type)
        );

        // Context sources - show what integrations were used
        if (backendResponse?.metadata?.context_sources && backendResponse.metadata.context_sources.length > 0) {
            const sources = backendResponse.metadata.context_sources
                .map((source: any) => source.type || source.name)
                .join(', ');
            console.log(colors.dim('Context from: ') + colors.primary(sources));
        }
    }



    /**
     * Interactive prompt editor mode
     */
    private async runInteractiveMode(): Promise<string> {
        console.log('');
        console.log(colors.heading('🎨 Interactive Prompt Editor'));
        console.log('');

        // Show welcome box
        console.log(boxes.info(
            'Welcome to the interactive prompt editor!\nYou can write multi-line prompts with rich editing features.',
            'Interactive Mode'
        ));
        console.log('');

        // Get the prompt
        const prompt = await interactive.multilineInput({
            message: 'Enter your prompt:',
            multiline: true,
        });

        // Show preview with analysis
        console.log('');
        const analysis = PromptOptimizer.analyzePrompt(prompt);
        console.log(PromptOptimizer.displayAnalysis(analysis));

        // Confirm
        const confirmed = await interactive.confirm({
            message: 'Enhance this prompt?',
            default: true,
        });

        if (!confirmed) {
            console.log(colors.warning('Cancelled'));
            process.exit(0);
        }

        return prompt;
    }

    /**
     * Handle clipboard copy with premium notifications
     */
    private async handleClipboardCopy(enhancedPrompt: string): Promise<void> {
        try {
            const success = await ClipboardManager.copyEnhancedPrompt(enhancedPrompt, true);
            
            if (!success) {
                // Show manual copy instructions
                console.log('');
                console.log(colors.warning('⚠️  Auto-copy failed. Please manually copy the enhanced prompt above.'));
                console.log(colors.dim('Tip: Use --no-copy flag to disable auto-copy attempts.'));
                console.log('');
            }
        } catch (error) {
            // Graceful fallback - don't break the command if clipboard fails
            console.log('');
            console.log(colors.dim('📋 Clipboard not available. Enhanced prompt is ready above.'));
            console.log('');
        }
    }


}
