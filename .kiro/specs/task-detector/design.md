# Design Document: Phase-2 Task Detector

## Overview

The Phase-2 Task Detector is a deterministic classification system that analyzes user prompts to identify task types before enhancement. The system uses pattern-matching rules based on keywords, structural indicators, and syntax patterns to classify prompts into one of seven categories: coding, creative, rewrite, structured, minimal, research, or general.

The detector is implemented as a pure function module with no side effects, making it highly testable and maintainable. It integrates seamlessly into the existing `pb enhance` command workflow, providing task metadata to the backend PCE without disrupting the user experience.

## Architecture

### High-Level Flow

```
User Input (prompt)
    ↓
pb enhance command
    ↓
Task Detector Module
    ↓
Classification Result (task_type, confidence, reasoning)
    ↓
Display to User
    ↓
API Client (with metadata)
    ↓
PCE Backend (/general endpoint)
```

### Component Interaction

```mermaid
graph TD
    A[User] -->|pb enhance "prompt"| B[Enhance Command]
    B -->|prompt string| C[Task Detector]
    C -->|TaskDetectionResult| B
    B -->|Display| D[Console Output]
    B -->|API Request + metadata| E[API Client]
    E -->|POST /general| F[PCE Backend]
    F -->|Enhanced Prompt| B
    B -->|Display| D
```

### Design Principles

1. **Deterministic**: Same input always produces same output
2. **Pure Functions**: No side effects, no external dependencies
3. **Zero External Calls**: No API calls, no ML models, no network requests
4. **Fail-Safe**: Always returns a valid classification (defaults to 'general')
5. **Non-Breaking**: Integrates without modifying existing command behavior

## Components and Interfaces

### 1. Task Detector Module (`src/lib/task-detector.ts`)

#### Core Interface

```typescript
export interface TaskDetectionResult {
    task_type: TaskType;
    confidence: number;  // 0.0 to 1.0
    reasoning: string;
}

export type TaskType = 
    | 'coding' 
    | 'creative' 
    | 'rewrite' 
    | 'structured' 
    | 'minimal' 
    | 'research' 
    | 'general';

export function detectTask(prompt: string): TaskDetectionResult;
```

#### Internal Components

**Keyword Patterns**
```typescript
interface KeywordPattern {
    type: TaskType;
    keywords: string[];
    weight: number;  // For prioritization when multiple matches
}
```

**Detection Strategy**
- Normalize prompt (lowercase, trim)
- Scan for keyword matches across all patterns
- Calculate match scores for each task type
- Apply structural analysis (JSON detection, code syntax)
- Select highest-scoring task type
- Calculate confidence based on match strength
- Generate reasoning explanation

### 2. Enhanced Command Integration (`src/commands/enhance.ts`)

#### Modified Flow

```typescript
async run(): Promise<void> {
    const { args } = await this.parse(Enhance);
    const prompt = args.prompt;

    // NEW: Detect task type
    const detection = detectTask(prompt);
    
    // NEW: Display detection result
    displayTaskDetection(detection);

    logger.info('Enhancing prompt...');

    try {
        // MODIFIED: Include metadata in request
        const { data } = await apiClient.post('/general', { 
            prompt,
            metadata: {
                task_type: detection.task_type,
                confidence: detection.confidence,
                reasoning: detection.reasoning
            }
        });

        // Existing display logic...
    } catch (error) {
        // Existing error handling...
    }
}
```

### 3. API Client Extension (`src/lib/apiClient.ts`)

#### Request Metadata Type

```typescript
export interface EnhancementMetadata {
    task_type: string;
    confidence: number;
    reasoning: string;
}

export interface EnhancementRequest {
    prompt: string;
    metadata?: EnhancementMetadata;
}
```

## Data Models

### TaskDetectionResult

```typescript
{
    task_type: 'coding',
    confidence: 0.85,
    reasoning: 'Detected coding keywords: "typescript", "bug", "fix". Strong match for coding task type.'
}
```

### Keyword Pattern Configuration

```typescript
const KEYWORD_PATTERNS: KeywordPattern[] = [
    {
        type: 'coding',
        keywords: [
            'code', 'bug', 'error', 'fix', 'typescript', 'python', 
            'javascript', 'function', 'class', 'variable', 'import', 
            'debug', 'compile', 'syntax', 'refactor', 'implement'
        ],
        weight: 10
    },
    {
        type: 'structured',
        keywords: [
            'json', 'sql', 'schema', 'table', 'api spec', 
            'database', 'query', 'yaml', 'xml', 'csv'
        ],
        weight: 9
    },
    {
        type: 'rewrite',
        keywords: [
            'summarize', 'rewrite', 'shorten', 'paraphrase', 
            'rephrase', 'condense', 'simplify', 'improve'
        ],
        weight: 8
    },
    {
        type: 'creative',
        keywords: [
            'blog', 'story', 'script', 'caption', 'write', 
            'creative', 'narrative', 'poem', 'article', 'content'
        ],
        weight: 7
    },
    {
        type: 'research',
        keywords: [
            'research', 'explain', 'compare', 'analyze', 
            'investigate', 'study', 'evaluate', 'explore'
        ],
        weight: 6
    },
    {
        type: 'minimal',
        keywords: [
            'minimal', 'clean', 'apple style', 'short', 
            'concise', 'brief', 'simple', 'terse'
        ],
        weight: 5
    }
];
```

### Structural Patterns

```typescript
const STRUCTURAL_PATTERNS = {
    json: /\{[\s\S]*\}/,  // JSON object detection
    code_block: /```[\s\S]*```/,  // Markdown code block
    sql_query: /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i,
    file_extension: /\.(ts|js|py|java|cpp|go|rs|rb)\b/i
};
```

## Detection Algorithm

### Step-by-Step Process

1. **Input Validation**
   - Check for empty/whitespace-only prompts
   - Return general type with low confidence if invalid

2. **Normalization**
   - Convert to lowercase for case-insensitive matching
   - Preserve original for structural analysis

3. **Keyword Matching**
   - Scan normalized prompt for each keyword pattern
   - Count matches per task type
   - Calculate weighted scores

4. **Structural Analysis**
   - Check for JSON structures → boost 'structured' score
   - Check for code blocks → boost 'coding' score
   - Check for SQL keywords → boost 'structured' score
   - Check for file extensions → boost 'coding' score

5. **Score Calculation**
   ```
   score = (keyword_matches * weight) + structural_bonus
   ```

6. **Task Type Selection**
   - Select task type with highest score
   - If no matches, default to 'general'
   - Apply priority order for ties: coding > structured > rewrite > creative > research > minimal > general

7. **Confidence Calculation**
   ```
   confidence = min(1.0, (total_matches / expected_matches_for_high_confidence))
   
   Where:
   - 0 matches = 0.3 (low confidence, general type)
   - 1-2 matches = 0.5-0.7 (medium confidence)
   - 3+ matches = 0.8-1.0 (high confidence)
   ```

8. **Reasoning Generation**
   - List detected keywords
   - Mention structural patterns if found
   - Explain why this task type was selected

### Example Classifications

**Example 1: Coding Task**
```
Input: "Fix the typescript bug in my React component"
Output: {
    task_type: 'coding',
    confidence: 0.9,
    reasoning: 'Detected coding keywords: "fix", "typescript", "bug", "component". Strong match for coding task type.'
}
```

**Example 2: Creative Task**
```
Input: "Write a blog post about AI trends"
Output: {
    task_type: 'creative',
    confidence: 0.85,
    reasoning: 'Detected creative keywords: "write", "blog". Strong match for creative task type.'
}
```

**Example 3: Structured Task**
```
Input: "Generate a JSON schema for user profiles"
Output: {
    task_type: 'structured',
    confidence: 0.95,
    reasoning: 'Detected structured keywords: "json", "schema". Strong match for structured task type.'
}
```

**Example 4: Ambiguous/General**
```
Input: "Help me with this"
Output: {
    task_type: 'general',
    confidence: 0.3,
    reasoning: 'No specific task indicators detected. Defaulting to general task type.'
}
```

## Error Handling

### Error Scenarios

1. **Empty Prompt**
   - Return: `{ task_type: 'general', confidence: 0.3, reasoning: 'Empty prompt provided' }`

2. **Whitespace-Only Prompt**
   - Return: `{ task_type: 'general', confidence: 0.3, reasoning: 'Prompt contains only whitespace' }`

3. **Extremely Long Prompt (>10,000 chars)**
   - Truncate to first 10,000 characters for analysis
   - Include note in reasoning: "Analyzed first 10,000 characters"

4. **Unexpected Errors**
   - Catch all exceptions
   - Return: `{ task_type: 'general', confidence: 0.5, reasoning: 'Error during classification: <error message>' }`

### Integration Error Handling

- If `detectTask()` throws an exception, the enhance command should catch it and continue with default metadata
- Log error for debugging but don't block the enhancement request
- Graceful degradation: enhancement works even if detection fails

## Testing Strategy

### Unit Testing Framework

We will use **Vitest** (already configured in the project) for unit testing the task detector module.

### Unit Tests

Unit tests will cover:

1. **Basic Classification Tests**
   - Test each task type with clear, unambiguous prompts
   - Verify correct task_type is returned
   - Example: "Fix this Python bug" → coding

2. **Confidence Score Tests**
   - Verify confidence is always between 0.0 and 1.0
   - Test that strong matches have high confidence (>0.8)
   - Test that weak matches have low confidence (<0.5)

3. **Reasoning Tests**
   - Verify reasoning string is non-empty
   - Verify reasoning mentions detected keywords

4. **Edge Case Tests**
   - Empty string
   - Whitespace-only string
   - Very long prompts (>10,000 chars)
   - Special characters and Unicode
   - Prompts with mixed signals

5. **Determinism Tests**
   - Call detectTask() multiple times with same input
   - Verify identical results every time

6. **Priority Tests**
   - Test prompts with multiple task type signals
   - Verify correct priority order is applied

### Property-Based Testing

We will use **fast-check** for property-based testing to verify universal properties across many generated inputs.

**Configuration:**
- Minimum 100 iterations per property test
- Each property test tagged with: `**Feature: task-detector, Property {N}: {description}**`

### Integration Tests

Integration tests will verify:

1. **Enhance Command Integration**
   - Mock API client
   - Verify detectTask is called before API request
   - Verify metadata is included in API request
   - Verify task detection is displayed to user

2. **API Client Metadata**
   - Verify metadata structure matches expected format
   - Verify metadata is optional (backward compatible)

### Test Coverage Goals

- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: 100%

## Corr
ectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid task type output

*For any* input prompt string, the detectTask function should return a task_type that is one of the seven valid types: 'coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', or 'general'.

**Validates: Requirements 1.2**

### Property 2: Confidence range constraint

*For any* input prompt string, the detectTask function should return a confidence score that is a number between 0.0 and 1.0 (inclusive).

**Validates: Requirements 1.3**

### Property 3: Reasoning non-empty

*For any* input prompt string, the detectTask function should return a reasoning string that is non-empty (length > 0).

**Validates: Requirements 1.4**

### Property 4: Deterministic classification

*For any* input prompt string, calling detectTask multiple times with the same prompt should produce identical results (same task_type, confidence, and reasoning).

**Validates: Requirements 1.5**

### Property 5: Keyword-based classification

*For any* prompt containing specific task-type keywords, the detectTask function should classify it according to the keyword patterns:
- Prompts with coding keywords ('code', 'bug', 'error', 'fix', 'typescript', 'python', etc.) should be classified as 'coding'
- Prompts with creative keywords ('blog', 'story', 'script', 'caption', etc.) should be classified as 'creative'
- Prompts with rewrite keywords ('summarize', 'rewrite', 'shorten', 'paraphrase', etc.) should be classified as 'rewrite'
- Prompts with structured keywords ('JSON', 'SQL', 'schema', 'table', etc.) should be classified as 'structured'
- Prompts with minimal keywords ('minimal', 'clean', 'apple style', 'short', etc.) should be classified as 'minimal'
- Prompts with research keywords ('research', 'explain', 'compare', 'analyze', etc.) should be classified as 'research'

**Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

### Property 6: Output structure completeness

*For any* input prompt string, the detectTask function should return an object that contains exactly three properties: task_type (string), confidence (number), and reasoning (string).

**Validates: Requirements 5.3**

## Display and User Experience

### Task Detection Display

When the enhance command runs, it will display the task detection result before showing the enhancement progress:

```
$ pb enhance "Fix the typescript bug in my component"

🔍 Task Detected: coding (confidence: 0.9)
💡 Reasoning: Detected coding keywords: "fix", "typescript", "bug", "component"

Enhancing prompt...
```

### Display Format

- Use chalk colors for visual clarity:
  - Task type: cyan bold
  - Confidence: dim
  - Reasoning: dim
- Keep display compact (2-3 lines max)
- Use emojis for visual appeal: 🔍 for detection, 💡 for reasoning
- Ensure display doesn't disrupt existing enhance command flow

### Display Function

```typescript
function displayTaskDetection(result: TaskDetectionResult): void {
    const confidencePercent = Math.round(result.confidence * 100);
    logger.log(
        chalk.cyan('🔍 Task Detected: ') + 
        chalk.cyan.bold(result.task_type) + 
        chalk.dim(` (confidence: ${confidencePercent}%)`)
    );
    logger.dim(`💡 ${result.reasoning}`);
    logger.log('');  // Empty line for spacing
}
```

## Performance Considerations

### Time Complexity

- Keyword matching: O(n * m) where n = prompt length, m = total keywords
- Expected runtime: <1ms for typical prompts (<1000 chars)
- Maximum runtime: <10ms for very long prompts (10,000 chars)

### Space Complexity

- O(1) - constant space for keyword patterns (defined at module load)
- O(n) - space for normalized prompt string
- No memory leaks or accumulation

### Optimization Strategies

1. **Early Exit**: If high-confidence match found, skip remaining patterns
2. **Keyword Indexing**: Use Set for O(1) keyword lookups
3. **Lazy Evaluation**: Only run structural analysis if keyword matching is ambiguous
4. **Caching**: Not needed due to fast execution and stateless design

## Security Considerations

### Input Validation

- No code execution or eval() calls
- No file system access
- No network requests
- Safe string operations only

### Injection Prevention

- Treat all input as plain text
- No interpretation of special characters as commands
- No regex injection vulnerabilities (use simple string matching)

### Privacy

- No logging of user prompts
- No transmission of prompts except to PCE (existing behavior)
- Task detection happens locally before API call

## Backward Compatibility

### Non-Breaking Changes

1. **API Request Structure**
   - Metadata field is optional
   - Backend can ignore metadata if not supported
   - Existing requests without metadata still work

2. **Enhance Command**
   - All existing functionality preserved
   - Task detection adds new output but doesn't change core behavior
   - Error in detection doesn't block enhancement

3. **Module Exports**
   - New module doesn't affect existing modules
   - No changes to existing function signatures
   - No changes to existing types

### Migration Path

- No migration needed
- Feature is additive only
- Can be disabled by removing detectTask call if needed

## Future Enhancements

### Potential Improvements

1. **Custom Patterns**: Allow users to define custom task types and keywords
2. **Learning Mode**: Track user corrections to improve patterns
3. **Multi-Language Support**: Detect task types in non-English prompts
4. **Confidence Tuning**: Adjust confidence calculation based on user feedback
5. **Context Awareness**: Consider previous prompts in session for better classification

### Extensibility Points

- Keyword patterns defined as configuration (easy to extend)
- Detection algorithm separated from display logic
- Pluggable confidence calculation
- Modular structural pattern matching

