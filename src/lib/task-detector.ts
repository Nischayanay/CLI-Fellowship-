/**
 * Task Detector Module
 * 
 * Deterministic classification system that analyzes user prompts
 * and identifies task types for context-aware enhancement.
 */

/**
 * Valid task types supported by the detector
 */
export type TaskType = 
    | 'coding' 
    | 'creative' 
    | 'rewrite' 
    | 'structured' 
    | 'minimal' 
    | 'research' 
    | 'general';

/**
 * Result of task detection analysis
 */
export interface TaskDetectionResult {
    /** Detected task type */
    task_type: TaskType;
    /** Confidence score between 0.0 and 1.0 */
    confidence: number;
    /** Explanation of why this task type was selected */
    reasoning: string;
}

/**
 * Internal pattern configuration for keyword matching
 */
export interface KeywordPattern {
    /** Task type this pattern identifies */
    type: TaskType;
    /** Keywords that indicate this task type */
    keywords: string[];
    /** Weight for prioritization (higher = higher priority) */
    weight: number;
}


/**
 * Keyword patterns for each task type
 * Ordered by priority (highest weight = highest priority)
 */
const KEYWORD_PATTERNS: KeywordPattern[] = [
    {
        type: 'coding',
        keywords: [
            'code', 'bug', 'error', 'fix', 'typescript', 'python', 
            'javascript', 'function', 'class', 'variable', 'import', 
            'debug', 'compile', 'syntax', 'refactor', 'implement',
            'java', 'cpp', 'rust', 'go', 'ruby', 'php', 'swift',
            'method', 'api', 'endpoint', 'component', 'module'
        ],
        weight: 10
    },
    {
        type: 'structured',
        keywords: [
            'json', 'sql', 'schema', 'table', 'api spec', 
            'database', 'query', 'yaml', 'xml', 'csv',
            'data structure', 'format', 'parse', 'serialize'
        ],
        weight: 9
    },
    {
        type: 'rewrite',
        keywords: [
            'summarize', 'rewrite', 'shorten', 'paraphrase', 
            'rephrase', 'condense', 'simplify', 'improve',
            'edit', 'revise', 'refine'
        ],
        weight: 8
    },
    {
        type: 'creative',
        keywords: [
            'blog', 'story', 'screenplay', 'caption', 'write', 
            'creative', 'narrative', 'poem', 'article', 'content',
            'essay', 'post', 'copy', 'draft'
        ],
        weight: 7
    },
    {
        type: 'research',
        keywords: [
            'research', 'explain', 'compare', 'analyze', 
            'investigate', 'study', 'evaluate', 'explore',
            'understand', 'learn', 'why', 'how', 'what'
        ],
        weight: 6
    },
    {
        type: 'minimal',
        keywords: [
            'minimal', 'clean', 'apple style', 'short', 
            'concise', 'brief', 'simple', 'terse',
            'minimalist', 'stripped'
        ],
        weight: 5
    }
];

/**
 * Structural patterns for detecting specific formats
 */
const STRUCTURAL_PATTERNS = {
    json: /\{[\s\S]*\}/,
    codeBlock: /```[\s\S]*```/,
    sqlQuery: /\b(SELECT\s+[\w*]+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i,
    fileExtension: /\.(ts|js|py|java|cpp|c|go|rs|rb|php|swift|kt|scala)\b/i
};


/**
 * Detects the task type from a user prompt using deterministic pattern matching
 * 
 * @param prompt - The user's input prompt
 * @returns TaskDetectionResult with task_type, confidence, and reasoning
 */
export function detectTask(prompt: string): TaskDetectionResult {
    try {
        // Input validation
        if (!prompt || prompt.trim().length === 0) {
            return {
                task_type: 'general',
                confidence: 0.3,
                reasoning: prompt.length === 0 
                    ? 'Empty prompt provided' 
                    : 'Prompt contains only whitespace'
            };
        }

        // Handle extremely long prompts
        const maxLength = 10000;
        let analyzedPrompt = prompt;
        let truncated = false;
        if (prompt.length > maxLength) {
            analyzedPrompt = prompt.substring(0, maxLength);
            truncated = true;
        }

        // Normalize for keyword matching
        const normalized = analyzedPrompt.toLowerCase();

        // Track matches for each task type
        const scores: Map<TaskType, number> = new Map();
        const matchedKeywords: Map<TaskType, string[]> = new Map();

        // Initialize maps
        KEYWORD_PATTERNS.forEach(pattern => {
            scores.set(pattern.type, 0);
            matchedKeywords.set(pattern.type, []);
        });

        // Keyword matching with priority bonuses
        KEYWORD_PATTERNS.forEach(pattern => {
            pattern.keywords.forEach(keyword => {
                if (normalized.includes(keyword.toLowerCase())) {
                    let weight = pattern.weight;
                    
                    // Give extra weight to high-priority keywords
                    if (pattern.type === 'coding' && keyword === 'code') {
                        weight += 15; // Extra bonus for "code" keyword
                    }
                    if (pattern.type === 'structured' && (keyword === 'json' || keyword === 'schema')) {
                        weight += 5; // Extra bonus for strong structured indicators
                    }
                    
                    const currentScore = scores.get(pattern.type) || 0;
                    scores.set(pattern.type, currentScore + weight);
                    matchedKeywords.get(pattern.type)?.push(keyword);
                }
            });
        });

        // Structural pattern analysis
        let structuralBonus = '';
        
        // JSON detection
        if (STRUCTURAL_PATTERNS.json.test(analyzedPrompt)) {
            const currentScore = scores.get('structured') || 0;
            scores.set('structured', currentScore + 15);
            structuralBonus += 'JSON structure detected. ';
        }

        // Code block detection
        if (STRUCTURAL_PATTERNS.codeBlock.test(analyzedPrompt)) {
            const currentScore = scores.get('coding') || 0;
            scores.set('coding', currentScore + 15);
            structuralBonus += 'Code block detected. ';
        }

        // SQL query detection
        if (STRUCTURAL_PATTERNS.sqlQuery.test(analyzedPrompt)) {
            const currentScore = scores.get('structured') || 0;
            scores.set('structured', currentScore + 15);
            structuralBonus += 'SQL query detected. ';
        }

        // File extension detection
        if (STRUCTURAL_PATTERNS.fileExtension.test(analyzedPrompt)) {
            const currentScore = scores.get('coding') || 0;
            scores.set('coding', currentScore + 15);
            structuralBonus += 'Code file extension detected. ';
        }

        // Find highest scoring task type
        let selectedType: TaskType = 'general';
        let maxScore = 0;

        // Priority order for tie-breaking
        const priorityOrder: TaskType[] = ['coding', 'structured', 'rewrite', 'creative', 'research', 'minimal', 'general'];

        for (const type of priorityOrder) {
            const score = scores.get(type) || 0;
            if (score > maxScore) {
                maxScore = score;
                selectedType = type;
            }
        }

        // Calculate confidence
        let confidence: number;
        const totalMatches = Array.from(matchedKeywords.values())
            .reduce((sum, keywords) => sum + keywords.length, 0);

        if (maxScore === 0) {
            confidence = 0.3; // Low confidence for no matches
        } else if (totalMatches === 1) {
            confidence = 0.5;
        } else if (totalMatches === 2) {
            confidence = 0.7;
        } else {
            confidence = Math.min(1.0, 0.8 + (totalMatches - 3) * 0.05);
        }

        // Generate reasoning
        let reasoning = '';
        const keywords = matchedKeywords.get(selectedType) || [];
        
        if (keywords.length > 0) {
            const keywordList = keywords.slice(0, 5).map(k => `"${k}"`).join(', ');
            reasoning = `Detected ${selectedType} keywords: ${keywordList}. `;
        }

        if (structuralBonus) {
            reasoning += structuralBonus;
        }

        if (reasoning) {
            reasoning += `Strong match for ${selectedType} task type.`;
        } else {
            reasoning = 'No specific task indicators detected. Defaulting to general task type.';
        }

        if (truncated) {
            reasoning += ' (Analyzed first 10,000 characters)';
        }

        return {
            task_type: selectedType,
            confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
            reasoning
        };

    } catch (error) {
        // Error handling - return safe default
        return {
            task_type: 'general',
            confidence: 0.5,
            reasoning: `Error during classification: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
