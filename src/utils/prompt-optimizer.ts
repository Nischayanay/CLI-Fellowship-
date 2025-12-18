import colors from './colors';
import boxes from './boxes';

/**
 * Prompt length guidelines
 */
export const PROMPT_GUIDELINES = {
  OPTIMAL: { min: 150, max: 300, label: 'Optimal', color: colors.success },
  GOOD: { min: 300, max: 500, label: 'Good', color: colors.warning },
  TOO_LONG: { min: 500, max: Infinity, label: 'Too Verbose', color: colors.error },
  TOO_SHORT: { min: 0, max: 150, label: 'Too Brief', color: colors.warning },
} as const;

/**
 * Context keywords for auto-detection
 */
const CONTEXT_KEYWORDS = {
  auth: ['auth', 'authentication', 'login', 'signup', 'user', 'session', 'jwt', 'oauth'],
  ui: ['component', 'react', 'vue', 'angular', 'button', 'form', 'modal', 'design'],
  api: ['api', 'endpoint', 'rest', 'graphql', 'database', 'crud', 'backend'],
  styling: ['css', 'tailwind', 'styled', 'theme', 'color', 'responsive', 'layout'],
} as const;

/**
 * Smart prompt analysis and optimization
 */
export class PromptOptimizer {
  /**
   * Analyze prompt characteristics
   */
  static analyzePrompt(prompt: string): PromptAnalysis {
    const length = prompt.length;
    const wordCount = prompt.split(/\s+/).length;
    const complexity = this.calculateComplexity(prompt);
    const lengthCategory = this.categorizeLengthCategory(length);
    const detectedContexts = this.detectContexts(prompt);
    const tokenEstimate = Math.ceil(wordCount * 1.3); // Rough token estimation

    return {
      length,
      wordCount,
      tokenEstimate,
      complexity,
      lengthCategory,
      detectedContexts,
      suggestions: this.generateSuggestions(prompt, lengthCategory, complexity),
    };
  }

  /**
   * Generate optimized version of prompt
   */
  static optimizePrompt(prompt: string, contexts: string[] = []): OptimizedPrompt {
    const analysis = this.analyzePrompt(prompt);
    
    // Extract key requirements
    const keyRequirements = this.extractKeyRequirements(prompt);
    
    // Build optimized prompt
    let optimized = keyRequirements.join('. ');
    
    // Add context-specific enhancements
    if (contexts.length > 0) {
      const contextSpecs = this.getContextSpecs(contexts);
      optimized += `. ${contextSpecs}`;
    }

    const originalLength = prompt.length;
    const optimizedLength = optimized.length;
    const reductionPercent = Math.round(((originalLength - optimizedLength) / originalLength) * 100);

    return {
      original: prompt,
      optimized,
      reductionPercent,
      analysis: this.analyzePrompt(optimized),
    };
  }

  /**
   * Create prompt analysis display
   */
  static displayAnalysis(analysis: PromptAnalysis): string {
    const lengthStatus = this.getLengthStatus(analysis.lengthCategory);
    const complexityLevel = this.getComplexityLevel(analysis.complexity);

    const content = [
      `Length: ${analysis.length} chars (${lengthStatus})`,
      `Complexity: ${complexityLevel}`,
      `Tokens: ~${analysis.tokenEstimate}`,
      analysis.detectedContexts.length > 0 
        ? `Context: ${analysis.detectedContexts.join(', ')} detected`
        : 'Context: General'
    ].join('\n');

    return boxes.box(content, {
      title: 'Prompt Analysis',
      borderColor: analysis.lengthCategory.color,
      padding: 1,
    });
  }

  /**
   * Display optimization results
   */
  static displayOptimization(result: OptimizedPrompt): string {
    const reductionColor = result.reductionPercent > 50 ? colors.success : colors.warning;
    
    return boxes.success(
      `Optimized prompt ready (${reductionColor(result.reductionPercent + '% shorter')})\n` +
      `New length: ${result.analysis.length} chars • Tokens: ~${result.analysis.tokenEstimate}`,
      'Optimization Complete'
    );
  }

  private static calculateComplexity(prompt: string): number {
    const factors = [
      prompt.split(/[.!?]/).length, // Sentence count
      prompt.split(',').length, // Comma count (complexity indicator)
      (prompt.match(/\b(and|or|but|however|therefore|because)\b/gi) || []).length, // Conjunctions
      (prompt.match(/\b(create|build|implement|design|develop)\b/gi) || []).length, // Action words
    ];
    
    return Math.min(factors.reduce((sum, factor) => sum + factor, 0) / 10, 1);
  }

  private static categorizeLengthCategory(length: number): typeof PROMPT_GUIDELINES[keyof typeof PROMPT_GUIDELINES] {
    if (length < PROMPT_GUIDELINES.TOO_SHORT.max) return PROMPT_GUIDELINES.TOO_SHORT;
    if (length <= PROMPT_GUIDELINES.OPTIMAL.max) return PROMPT_GUIDELINES.OPTIMAL;
    if (length <= PROMPT_GUIDELINES.GOOD.max) return PROMPT_GUIDELINES.GOOD;
    return PROMPT_GUIDELINES.TOO_LONG;
  }

  private static detectContexts(prompt: string): string[] {
    const detected: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    for (const [context, keywords] of Object.entries(CONTEXT_KEYWORDS)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        detected.push(context);
      }
    }

    return detected;
  }

  private static extractKeyRequirements(prompt: string): string[] {
    // Simple extraction - split by sentences and filter important ones
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Prioritize sentences with action words
    const actionWords = ['create', 'build', 'implement', 'design', 'develop', 'make', 'add', 'include'];
    const prioritized = sentences.filter(sentence => 
      actionWords.some(word => sentence.toLowerCase().includes(word))
    );

    return prioritized.length > 0 ? prioritized.slice(0, 3) : sentences.slice(0, 2);
  }

  private static getContextSpecs(contexts: string[]): string {
    const specs: Record<string, string> = {
      auth: 'Include secure authentication patterns, form validation, and error handling',
      ui: 'Follow modern UI/UX principles with responsive design',
      api: 'Implement RESTful patterns with proper error handling',
      styling: 'Use consistent design tokens and accessibility standards',
    };

    return contexts.map(context => specs[context]).filter(Boolean).join('. ');
  }

  private static generateSuggestions(prompt: string, lengthCategory: any, complexity: number): string[] {
    const suggestions: string[] = [];

    if (lengthCategory === PROMPT_GUIDELINES.TOO_LONG) {
      suggestions.push('Consider breaking into smaller, focused requests');
      suggestions.push('Remove unnecessary details and focus on core requirements');
    }

    if (lengthCategory === PROMPT_GUIDELINES.TOO_SHORT) {
      suggestions.push('Add more specific requirements and constraints');
      suggestions.push('Include technology stack and design preferences');
    }

    if (complexity > 0.7) {
      suggestions.push('Simplify by focusing on one main feature at a time');
    }

    return suggestions;
  }

  private static getLengthStatus(category: any): string {
    return category.color(category.label + ' ✓');
  }

  private static getComplexityLevel(complexity: number): string {
    if (complexity < 0.3) return colors.success('Simple');
    if (complexity < 0.7) return colors.warning('Medium');
    return colors.error('Complex');
  }
}

/**
 * Types for prompt analysis
 */
export interface PromptAnalysis {
  length: number;
  wordCount: number;
  tokenEstimate: number;
  complexity: number;
  lengthCategory: typeof PROMPT_GUIDELINES[keyof typeof PROMPT_GUIDELINES];
  detectedContexts: string[];
  suggestions: string[];
}

export interface OptimizedPrompt {
  original: string;
  optimized: string;
  reductionPercent: number;
  analysis: PromptAnalysis;
}

export default PromptOptimizer;