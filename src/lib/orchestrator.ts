/**
 * Orchestrator Module
 * 
 * Central coordination component that manages the complete enhancement workflow
 * from task detection through backend payload preparation.
 */

import { detectTask, TaskDetectionResult, TaskType } from './task-detector';
import { modelRouter, ModelRoutingResult, ModelRoutingOptions } from './model-router';
import { templateLoader, TemplateResolutionResult, TemplateExpansionContext } from './templateLoader';

/**
 * Orchestration options from command-line flags
 */
export interface OrchestrationOptions {
  fast?: boolean;
  budget?: 'low' | 'medium' | 'high';
  template?: string;
}

/**
 * Metadata collected during orchestration
 */
export interface OrchestrationMetadata {
  task_detection: TaskDetectionResult;
  template_used: TemplateResolutionResult;
  model_routing: ModelRoutingResult;
  processing_time_ms: number;
}

/**
 * Phase-2 backend payload structure
 */
export interface Phase2BackendPayload {
  prompt: string;
  task_type: string;
  confidence: number;
  model_hint: string;
  reasoning: string;
  template_used: string | null;
  context_metadata: {
    prefer_fast: boolean;
    budget_mode: string;
    template_source: string;
    original_prompt_length: number;
    processing_time_ms: number;
  };
}

/**
 * Complete orchestration result
 */
export interface OrchestrationResult {
  payload: Phase2BackendPayload;
  metadata: OrchestrationMetadata;
}

/**
 * Orchestrator class for coordinating the enhancement workflow
 */
export class Orchestrator {
  /**
   * Orchestrate the complete enhancement workflow
   */
  async orchestrate(userPrompt: string, options: OrchestrationOptions = {}): Promise<OrchestrationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Run task detection
      const taskDetection = await this.runTaskDetection(userPrompt);

      // Step 2: Resolve template
      const templateResolution = await this.resolveTemplate(taskDetection.task_type, options.template);

      // Step 3: Route model
      const modelRouting = this.routeModel(taskDetection.task_type, options);

      // Step 4: Prepare final prompt (merge with template if applicable)
      const finalPrompt = this.prepareFinalPrompt(userPrompt, templateResolution, taskDetection);

      // Step 5: Build backend payload
      const payload = this.buildBackendPayload(
        finalPrompt,
        taskDetection,
        templateResolution,
        modelRouting,
        options,
        userPrompt.length,
        Date.now() - startTime
      );

      // Step 6: Collect metadata
      const metadata: OrchestrationMetadata = {
        task_detection: taskDetection,
        template_used: templateResolution,
        model_routing: modelRouting,
        processing_time_ms: Date.now() - startTime
      };

      return {
        payload,
        metadata
      };

    } catch (error) {
      // Handle orchestration errors gracefully
      return this.createFallbackResult(userPrompt, options, error, Date.now() - startTime);
    }
  }

  /**
   * Run task detection with error handling
   */
  private async runTaskDetection(prompt: string): Promise<TaskDetectionResult> {
    try {
      return detectTask(prompt);
    } catch (error) {
      // Fallback to general task type on detection failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        task_type: 'general',
        confidence: 0.3,
        reasoning: `Task detection failed (${errorMessage}), using general task type`
      };
    }
  }

  /**
   * Resolve template based on task type or user specification
   */
  private async resolveTemplate(taskType: TaskType, templateName?: string): Promise<TemplateResolutionResult> {
    try {
      return await templateLoader.resolveTemplateForTask(taskType, templateName);
    } catch (error) {
      // Continue without template on resolution failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        template: null,
        reasoning: `Template resolution failed: ${errorMessage}`,
        source: 'none'
      };
    }
  }

  /**
   * Route model based on task type and options
   */
  private routeModel(taskType: TaskType, options: OrchestrationOptions): ModelRoutingResult {
    try {
      const routingOptions: ModelRoutingOptions = {
        budget: options.budget || 'medium',
        fast: options.fast || false
      };

      return modelRouter.route(taskType, routingOptions);
    } catch (error) {
      // Fallback to default model on routing failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        model_hint: 'gpt-4o-mini',
        reasoning: `Model routing failed (${errorMessage}), using default model`,
        metadata: {
          budget_mode: options.budget || 'medium',
          prefer_fast: options.fast || false,
          fallback_used: true,
          context_requirements: {
            max_tokens: 4000,
            requires_code_context: false,
            requires_design_context: false
          }
        }
      };
    }
  }

  /**
   * Prepare final prompt by merging with template if applicable
   */
  private prepareFinalPrompt(
    userPrompt: string,
    templateResolution: TemplateResolutionResult,
    taskDetection: TaskDetectionResult
  ): string {
    if (!templateResolution.template) {
      return userPrompt;
    }

    try {
      // Expand template with context
      const expansionContext: TemplateExpansionContext = {
        task_type: taskDetection.task_type,
        confidence: taskDetection.confidence,
        user_prompt: userPrompt,
        metadata: {
          template_source: templateResolution.source,
          reasoning: taskDetection.reasoning
        }
      };

      const expandedTemplate = templateLoader.expandTemplate(templateResolution.template, expansionContext);
      
      // Merge user prompt with expanded template
      return templateLoader.mergePromptWithTemplate(userPrompt, {
        ...templateResolution.template,
        content: expandedTemplate
      });

    } catch (error) {
      // If template processing fails, return original prompt
      return userPrompt;
    }
  }

  /**
   * Build Phase-2 compliant backend payload
   */
  private buildBackendPayload(
    finalPrompt: string,
    taskDetection: TaskDetectionResult,
    templateResolution: TemplateResolutionResult,
    modelRouting: ModelRoutingResult,
    options: OrchestrationOptions,
    originalPromptLength: number,
    processingTimeMs: number
  ): Phase2BackendPayload {
    return {
      prompt: finalPrompt,
      task_type: taskDetection.task_type,
      confidence: taskDetection.confidence,
      model_hint: modelRouting.model_hint,
      reasoning: this.combineReasoning(taskDetection, templateResolution, modelRouting),
      template_used: templateResolution.template?.name || null,
      context_metadata: {
        prefer_fast: options.fast || false,
        budget_mode: options.budget || 'medium',
        template_source: templateResolution.source,
        original_prompt_length: originalPromptLength,
        processing_time_ms: processingTimeMs
      }
    };
  }

  /**
   * Combine reasoning from all components
   */
  private combineReasoning(
    taskDetection: TaskDetectionResult,
    templateResolution: TemplateResolutionResult,
    modelRouting: ModelRoutingResult
  ): string {
    const reasoningParts: string[] = [];

    // Task detection reasoning
    reasoningParts.push(`Task: ${taskDetection.reasoning}`);

    // Template reasoning
    if (templateResolution.template) {
      reasoningParts.push(`Template: ${templateResolution.reasoning}`);
    }

    // Model routing reasoning
    reasoningParts.push(`Model: ${modelRouting.reasoning}`);

    return reasoningParts.join(' | ');
  }

  /**
   * Create fallback result when orchestration fails
   */
  private createFallbackResult(
    userPrompt: string,
    options: OrchestrationOptions,
    error: unknown,
    processingTimeMs: number
  ): OrchestrationResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Create minimal fallback components
    const fallbackTaskDetection: TaskDetectionResult = {
      task_type: 'general',
      confidence: 0.3,
      reasoning: `Orchestration failed: ${errorMessage}`
    };

    const fallbackTemplateResolution: TemplateResolutionResult = {
      template: null,
      reasoning: 'No template due to orchestration failure',
      source: 'none'
    };

    const fallbackModelRouting: ModelRoutingResult = {
      model_hint: 'gpt-4o-mini',
      reasoning: 'Default model due to orchestration failure',
      metadata: {
        budget_mode: options.budget || 'medium',
        prefer_fast: options.fast || false,
        fallback_used: true,
        context_requirements: {
          max_tokens: 4000,
          requires_code_context: false,
          requires_design_context: false
        }
      }
    };

    const payload: Phase2BackendPayload = {
      prompt: userPrompt,
      task_type: 'general',
      confidence: 0.3,
      model_hint: 'gpt-4o-mini',
      reasoning: `Orchestration failed: ${errorMessage}`,
      template_used: null,
      context_metadata: {
        prefer_fast: options.fast || false,
        budget_mode: options.budget || 'medium',
        template_source: 'none',
        original_prompt_length: userPrompt.length,
        processing_time_ms: processingTimeMs
      }
    };

    const metadata: OrchestrationMetadata = {
      task_detection: fallbackTaskDetection,
      template_used: fallbackTemplateResolution,
      model_routing: fallbackModelRouting,
      processing_time_ms: processingTimeMs
    };

    return {
      payload,
      metadata
    };
  }
}

/**
 * Singleton instance for global use
 */
export const orchestrator = new Orchestrator();