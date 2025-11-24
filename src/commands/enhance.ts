import { Command, Args, Flags } from '@oclif/core';
import { apiClient } from '../lib/apiClient';
import { logger } from '../utils/logger';
import chalk from 'chalk';
import { detectTask, TaskDetectionResult } from '../lib/task-detector';
import { orchestrator, OrchestrationOptions, OrchestrationResult } from '../lib/orchestrator';

/**
 * Display comprehensive orchestration metadata to user
 */
function displayOrchestrationMetadata(metadata: OrchestrationResult['metadata'], backendResponse: any): void {
    const confidencePercent = Math.round(metadata.task_detection.confidence * 100);
    
    // Task Detection
    logger.log(
        chalk.cyan('🔍 Task Detected: ') + 
        chalk.cyan.bold(metadata.task_detection.task_type) + 
        chalk.dim(` (confidence: ${confidencePercent}%)`)
    );
    logger.dim(`💡 ${metadata.task_detection.reasoning}`);
    
    // Model Selection
    logger.log(
        chalk.blue('🤖 Model Selected: ') + 
        chalk.blue.bold(metadata.model_routing.model_hint)
    );
    logger.dim(`🎯 ${metadata.model_routing.reasoning}`);
    
    // Template Usage
    if (metadata.template_used.template) {
        logger.log(
            chalk.green('📝 Template Applied: ') + 
            chalk.green.bold(metadata.template_used.template.name) +
            chalk.dim(` (${metadata.template_used.template.category})`)
        );
        logger.dim(`📋 ${metadata.template_used.reasoning}`);
    } else {
        logger.dim('📝 No template applied');
    }
    
    // Processing Time
    const processingTime = backendResponse?.metadata?.processing_time_ms || metadata.processing_time_ms;
    logger.log(
        chalk.magenta('⏱️  Processing Time: ') + 
        chalk.magenta.bold(`${processingTime}ms`)
    );
    
    // Context Sources (if available from backend)
    if (backendResponse?.metadata?.context_sources && backendResponse.metadata.context_sources.length > 0) {
        logger.log(chalk.yellow('🔗 Context Sources:'));
        backendResponse.metadata.context_sources.forEach((source: any) => {
            logger.dim(`   • ${source.name || source.type} (${source.count || 1} snippets)`);
        });
    }
    
    logger.log('');  // Empty line for spacing
}

/**
 * Display enhanced prompt with clear formatting
 */
function displayEnhancedPrompt(original: string, enhanced: string): void {
    logger.log(chalk.bold('Original:'));
    logger.dim(original);
    logger.log('');
    logger.log(chalk.bold('Enhanced:'));
    logger.log(chalk.green(enhanced));
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
    };

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Enhance);
        const prompt = args.prompt;

        // Prepare orchestration options from flags
        const orchestrationOptions: OrchestrationOptions = {
            fast: flags.fast,
            budget: flags.budget as 'low' | 'medium' | 'high',
            template: flags.template
        };

        logger.info('Orchestrating enhancement...');

        try {
            // Run orchestration to prepare Phase-2 payload
            const orchestrationResult = await orchestrator.orchestrate(prompt, orchestrationOptions);

            // Display orchestration metadata
            displayOrchestrationMetadata(orchestrationResult.metadata, null);

            logger.info('Enhancing prompt...');

            // Send Phase-2 compliant payload to backend
            const { data } = await apiClient.post('/general', orchestrationResult.payload);

            logger.success('Prompt Enhanced!');
            logger.log('');

            // Display enhanced prompt
            displayEnhancedPrompt(prompt, data.enhanced_prompt || data.result || 'No enhancement returned.');

            // Update metadata display with backend response
            if (data.metadata) {
                logger.log('');
                displayOrchestrationMetadata(orchestrationResult.metadata, data);
            }

        } catch (error) {
            // Enhanced error handling with fallback to Phase-1 behavior
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any;
                if (axiosError.response?.status === 404 || axiosError.response?.status === 400) {
                    logger.warning('Phase-2 backend unavailable, falling back to Phase-1 behavior...');
                    await this.fallbackToPhase1(prompt);
                    return;
                }
            }
            
            // Error handled by interceptor for other cases
            logger.error('Enhancement failed. Please try again.');
        }
    }

    /**
     * Fallback to Phase-1 behavior when Phase-2 backend is unavailable
     */
    private async fallbackToPhase1(prompt: string): Promise<void> {
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

            logger.success('Prompt Enhanced! (Phase-1 mode)');
            logger.log('');
            displayEnhancedPrompt(prompt, data.enhanced_prompt || data.result || 'No enhancement returned.');

            // Display basic task detection info
            const confidencePercent = Math.round(detection.confidence * 100);
            logger.log('');
            logger.log(
                chalk.cyan('🔍 Task Detected: ') + 
                chalk.cyan.bold(detection.task_type) + 
                chalk.dim(` (confidence: ${confidencePercent}%)`)
            );

            if (data.context_sources && data.context_sources.length > 0) {
                logger.log('');
                logger.log(chalk.bold('Context Sources Used:'));
                data.context_sources.forEach((source: any) => {
                    logger.log(`  - ${source.name || source.type} (${source.count || 1} snippets)`);
                });
            }

        } catch (fallbackError) {
            logger.error('Both Phase-2 and Phase-1 enhancement failed. Please check your connection and try again.');
        }
    }
}
