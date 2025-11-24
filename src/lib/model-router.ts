/**
 * Model Router Module
 * 
 * Lightweight local component that determines optimal model selection
 * based on task type, budget constraints, and speed preferences.
 * Does not perform actual LLM calls - only routing decisions.
 */

import { TaskType } from './task-detector';

/**
 * Model routing configuration options
 */
export interface ModelRoutingOptions {
  budget?: 'low' | 'medium' | 'high';
  fast?: boolean;
  contextRequirements?: {
    maxTokens?: number;
    requiresCodeContext?: boolean;
    requiresDesignContext?: boolean;
  };
}

/**
 * Result of model routing decision
 */
export interface ModelRoutingResult {
  model_hint: string;
  reasoning: string;
  metadata: {
    budget_mode: string;
    prefer_fast: boolean;
    fallback_used: boolean;
    context_requirements: {
      max_tokens: number;
      requires_code_context: boolean;
      requires_design_context: boolean;
    };
  };
}

/**
 * Model configuration for different scenarios
 */
interface ModelConfig {
  name: string;
  cost: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'good' | 'excellent';
  maxTokens: number;
  specialties: string[];
}

/**
 * Available models with their characteristics
 */
const MODEL_CATALOG: ModelConfig[] = [
  {
    name: 'gpt-4o-mini',
    cost: 'low',
    speed: 'fast',
    quality: 'good',
    maxTokens: 128000,
    specialties: ['general', 'coding', 'structured']
  },
  {
    name: 'gpt-4o',
    cost: 'high',
    speed: 'medium',
    quality: 'excellent',
    maxTokens: 128000,
    specialties: ['coding', 'creative', 'research', 'structured']
  },
  {
    name: 'claude-3-haiku',
    cost: 'low',
    speed: 'fast',
    quality: 'good',
    maxTokens: 200000,
    specialties: ['general', 'rewrite', 'minimal']
  },
  {
    name: 'claude-3-sonnet',
    cost: 'medium',
    speed: 'medium',
    quality: 'excellent',
    maxTokens: 200000,
    specialties: ['coding', 'creative', 'structured', 'research']
  },
  {
    name: 'claude-3-opus',
    cost: 'high',
    speed: 'slow',
    quality: 'excellent',
    maxTokens: 200000,
    specialties: ['creative', 'research', 'minimal']
  }
];

/**
 * Default model for fallback scenarios
 */
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Model Router class for intelligent model selection
 */
export class ModelRouter {
  /**
   * Route to optimal model based on task type and constraints
   */
  route(taskType: TaskType, options: ModelRoutingOptions = {}): ModelRoutingResult {
    try {
      const budget = options.budget || 'medium';
      const preferFast = options.fast || false;
      const contextReqs = options.contextRequirements || {};

      // Determine context requirements based on task type
      const contextRequirements = this.determineContextRequirements(taskType, contextReqs);

      // Select model based on constraints
      const selectedModel = this.selectModelForTask(taskType, budget, preferFast, contextRequirements);
      
      // Build reasoning
      const reasoning = this.buildReasoning(selectedModel, taskType, budget, preferFast);

      return {
        model_hint: selectedModel.name,
        reasoning,
        metadata: {
          budget_mode: budget,
          prefer_fast: preferFast,
          fallback_used: false,
          context_requirements: contextRequirements
        }
      };

    } catch (error) {
      // Fallback to default model on any error
      return this.createFallbackResult(options, error);
    }
  }

  /**
   * Determine context requirements based on task type
   */
  private determineContextRequirements(
    taskType: TaskType, 
    userReqs: ModelRoutingOptions['contextRequirements'] = {}
  ): ModelRoutingResult['metadata']['context_requirements'] {
    const defaults = {
      max_tokens: userReqs.maxTokens || 4000,
      requires_code_context: userReqs.requiresCodeContext || false,
      requires_design_context: userReqs.requiresDesignContext || false
    };

    // Adjust based on task type
    switch (taskType) {
      case 'coding':
        return {
          ...defaults,
          max_tokens: Math.max(defaults.max_tokens, 8000),
          requires_code_context: true
        };
      case 'creative':
        return {
          ...defaults,
          max_tokens: Math.max(defaults.max_tokens, 6000)
        };
      case 'structured':
        return {
          ...defaults,
          max_tokens: Math.max(defaults.max_tokens, 4000),
          requires_code_context: true
        };
      case 'research':
        return {
          ...defaults,
          max_tokens: Math.max(defaults.max_tokens, 10000)
        };
      case 'minimal':
        return {
          ...defaults,
          max_tokens: Math.min(defaults.max_tokens, 2000),
          requires_design_context: true
        };
      default:
        return defaults;
    }
  }

  /**
   * Select optimal model for given constraints
   */
  private selectModelForTask(
    taskType: TaskType,
    budget: string,
    preferFast: boolean,
    contextReqs: ModelRoutingResult['metadata']['context_requirements']
  ): ModelConfig {
    // Filter models by budget constraint
    let candidates = MODEL_CATALOG.filter(model => {
      switch (budget) {
        case 'low':
          return model.cost === 'low';
        case 'medium':
          return model.cost === 'low' || model.cost === 'medium';
        case 'high':
          return true; // All models available
        default:
          return model.cost === 'medium';
      }
    });

    // Filter by token requirements
    candidates = candidates.filter(model => model.maxTokens >= contextReqs.max_tokens);

    // If no candidates meet token requirements, use models with highest token limits
    if (candidates.length === 0) {
      candidates = MODEL_CATALOG.filter(model => {
        switch (budget) {
          case 'low':
            return model.cost === 'low';
          case 'medium':
            return model.cost === 'low' || model.cost === 'medium';
          case 'high':
            return true;
          default:
            return model.cost === 'medium';
        }
      }).sort((a, b) => b.maxTokens - a.maxTokens);
    }

    // Score candidates based on task type and preferences
    const scoredCandidates = candidates.map(model => ({
      model,
      score: this.scoreModel(model, taskType, preferFast)
    }));

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Return best candidate or fallback
    return scoredCandidates[0]?.model || MODEL_CATALOG.find(m => m.name === DEFAULT_MODEL)!;
  }

  /**
   * Score a model based on task type and preferences
   */
  private scoreModel(model: ModelConfig, taskType: TaskType, preferFast: boolean): number {
    let score = 0;

    // Task specialty bonus
    if (model.specialties.includes(taskType)) {
      score += 10;
    }

    // Quality bonus
    switch (model.quality) {
      case 'excellent':
        score += 6;
        break;
      case 'good':
        score += 3;
        break;
      case 'basic':
        score += 1;
        break;
    }

    // Speed preference
    if (preferFast) {
      switch (model.speed) {
        case 'fast':
          score += 8;
          break;
        case 'medium':
          score += 4;
          break;
        case 'slow':
          score -= 2;
          break;
      }
    } else {
      // Prefer quality over speed when not in fast mode
      switch (model.speed) {
        case 'fast':
          score += 2;
          break;
        case 'medium':
          score += 4;
          break;
        case 'slow':
          score += 1; // Don't penalize slow if quality is good
          break;
      }
    }

    return score;
  }

  /**
   * Build human-readable reasoning for model selection
   */
  private buildReasoning(
    selectedModel: ModelConfig,
    taskType: TaskType,
    budget: string,
    preferFast: boolean
  ): string {
    const reasons: string[] = [];

    // Task type reasoning
    if (selectedModel.specialties.includes(taskType)) {
      reasons.push(`optimized for ${taskType} tasks`);
    } else {
      reasons.push(`general-purpose model suitable for ${taskType} tasks`);
    }

    // Budget reasoning
    reasons.push(`fits ${budget} budget constraints`);

    // Speed reasoning
    if (preferFast) {
      reasons.push(`prioritizes speed as requested`);
    }

    // Quality reasoning
    if (selectedModel.quality === 'excellent') {
      reasons.push(`provides excellent output quality`);
    }

    return `Selected ${selectedModel.name}: ${reasons.join(', ')}.`;
  }

  /**
   * Create fallback result when routing fails
   */
  private createFallbackResult(
    options: ModelRoutingOptions,
    error: unknown
  ): ModelRoutingResult {
    const budget = options.budget || 'medium';
    const preferFast = options.fast || false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      model_hint: DEFAULT_MODEL,
      reasoning: `Fallback to ${DEFAULT_MODEL} due to routing error: ${errorMessage}`,
      metadata: {
        budget_mode: budget,
        prefer_fast: preferFast,
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
 * Singleton instance for global use
 */
export const modelRouter = new ModelRouter();