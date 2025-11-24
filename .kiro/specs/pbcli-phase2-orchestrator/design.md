# Design Document

## Overview

The PBCLI Phase-2 Orchestrator enhancement transforms the current simple prompt enhancement workflow into a sophisticated, multi-component system that provides intelligent model routing, template integration, and comprehensive orchestration. The system maintains backward compatibility while introducing advanced features through a modular architecture that mirrors backend routing logic locally.

The enhancement introduces four core components:
1. **Model Router** - Intelligent model selection based on task type, budget, and context
2. **Enhanced Template System** - Hierarchical template management with automatic selection
3. **Orchestrator** - Central coordination of the complete enhancement pipeline
4. **Enhanced Command Interface** - Extended CLI with new flags and metadata display

## Architecture

The system follows a pipeline architecture where each component has a specific responsibility and can fail gracefully without blocking the entire workflow:

```
User Input → Task Detector → Template Resolver → Model Router → Orchestrator → Backend → Response Display
```

### Component Interaction Flow

1. **Input Processing**: User provides prompt with optional flags (--fast, --budget, --template)
2. **Task Detection**: Existing task detector analyzes prompt and returns task type with confidence
3. **Template Resolution**: Template system selects appropriate template based on task type or user specification
4. **Model Routing**: Model router determines optimal model configuration based on task, budget, and context
5. **Orchestration**: Orchestrator combines all components and builds Phase-2 compliant backend payload
6. **Backend Communication**: Enhanced API call to Phase-2 endpoint with structured metadata
7. **Response Processing**: Display enhanced prompt with comprehensive metadata to user

### Error Handling Strategy

Each component implements graceful degradation:
- Task detection failure → Continue with 'general' task type
- Template resolution failure → Continue without template enhancement
- Model routing failure → Fall back to default model configuration
- Backend communication failure → Provide meaningful error with suggested actions

## Components and Interfaces

### Model Router (`src/lib/model-router.ts`)

The Model Router is a lightweight, local component that determines optimal model selection without performing actual LLM calls.

```typescript
export interface ModelRoutingConfig {
  model_hint: string;
  reasoning: string;
  budget_mode: 'low' | 'medium' | 'high';
  prefer_fast: boolean;
  context_requirements: {
    max_tokens: number;
    requires_code_context: boolean;
    requires_design_context: boolean;
  };
}

export interface ModelRoutingResult {
  model_hint: string;
  reasoning: string;
  metadata: {
    budget_mode: string;
    prefer_fast: boolean;
    fallback_used: boolean;
  };
}

export class ModelRouter {
  route(taskType: TaskType, options: ModelRoutingOptions): ModelRoutingResult;
  private selectModelForTask(taskType: TaskType, budget: string): string;
  private buildReasoning(model: string, taskType: TaskType, options: ModelRoutingOptions): string;
}
```

**Routing Logic:**
- **Coding tasks**: Prefer code-specialized models (claude-3-sonnet for high budget, gpt-4o-mini for low budget)
- **Creative tasks**: Prefer creative-optimized models with higher context windows
- **Structured tasks**: Prefer models with strong JSON/structured output capabilities
- **Fast mode**: Override quality preferences with speed-optimized models
- **Budget constraints**: Respect cost limitations while maintaining task-appropriate capabilities

### Enhanced Template System (`src/lib/templateLoader.ts`)

Extended template system with intelligent selection and merging capabilities.

```typescript
export interface TemplateResolutionResult {
  template: Template | null;
  reasoning: string;
  source: 'user' | 'system' | 'auto-selected' | 'none';
}

export interface TemplateExpansionContext {
  task_type: TaskType;
  confidence: number;
  user_prompt: string;
  metadata: Record<string, any>;
}

// Extended TemplateLoader class
export class TemplateLoader {
  // Existing methods...
  
  resolveTemplateForTask(taskType: TaskType): Promise<TemplateResolutionResult>;
  expandTemplate(template: Template, context: TemplateExpansionContext): string;
  mergePromptWithTemplate(userPrompt: string, template: Template): string;
  listTemplatesByCategory(category: 'code' | 'design'): Promise<Template[]>;
}
```

**Template Selection Logic:**
1. If `--template=<name>` specified → Use exact template (error if not found)
2. If task type detected → Auto-select best matching template by category and keywords
3. If no suitable template → Continue without template enhancement
4. User templates always override system templates with same name

**Template Categories:**
- **code**: Templates for coding tasks (refactor-safe, find-errors-secure, setup-supabase-cli)
- **design**: Templates for design tasks (apple-minimal-ui, custom-hover-effects, clean-navbar)

### Orchestrator (`src/lib/orchestrator.ts`)

Central coordination component that manages the complete enhancement workflow.

```typescript
export interface OrchestrationOptions {
  fast?: boolean;
  budget?: 'low' | 'medium' | 'high';
  template?: string;
}

export interface OrchestrationResult {
  payload: Phase2BackendPayload;
  metadata: OrchestrationMetadata;
}

export interface OrchestrationMetadata {
  task_detection: TaskDetectionResult;
  template_used: TemplateResolutionResult;
  model_routing: ModelRoutingResult;
  processing_time_ms: number;
}

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
  };
}

export class Orchestrator {
  async orchestrate(userPrompt: string, options: OrchestrationOptions): Promise<OrchestrationResult>;
  private async runTaskDetection(prompt: string): Promise<TaskDetectionResult>;
  private async resolveTemplate(taskType: TaskType, templateName?: string): Promise<TemplateResolutionResult>;
  private routeModel(taskType: TaskType, options: OrchestrationOptions): ModelRoutingResult;
  private buildBackendPayload(prompt: string, detection: TaskDetectionResult, template: TemplateResolutionResult, routing: ModelRoutingResult): Phase2BackendPayload;
}
```

**Orchestration Flow:**
1. Run task detection with error handling
2. Resolve template based on task type or user specification
3. Perform model routing with budget and speed preferences
4. Merge user prompt with template if applicable
5. Build Phase-2 compliant backend payload
6. Return orchestrated result with comprehensive metadata

### Enhanced Command Interface (`src/commands/enhance.ts`)

Extended enhance command with new flags and metadata display.

```typescript
export default class Enhance extends Command {
  static flags = {
    fast: Flags.boolean({ description: 'Enable fast mode for speed-optimized processing' }),
    budget: Flags.string({ 
      description: 'Budget mode for model selection',
      options: ['low', 'medium', 'high'],
      default: 'medium'
    }),
    template: Flags.string({ description: 'Specify template name to use' }),
  };

  private displayMetadata(metadata: OrchestrationMetadata, backendResponse: any): void;
  private displayEnhancedPrompt(original: string, enhanced: string): void;
}
```

## Data Models

### Backend Response Contract

The Phase-2 backend returns a structured response that the CLI must handle:

```typescript
export interface Phase2BackendResponse {
  enhanced_prompt: string;
  task_type: string;
  confidence: number;
  model_hint: string;
  tokens_estimated: number;
  metadata: {
    processing_time_ms: number;
    snippets_count: number;
    memory_nodes_count: number;
    context_sources: Array<{
      name: string;
      type: string;
      count: number;
    }>;
  };
  template_used: string | null;
}
```

### Internal Data Flow

```typescript
// Task Detection (existing)
TaskDetectionResult → task_type, confidence, reasoning

// Template Resolution (new)
TemplateResolutionResult → template, reasoning, source

// Model Routing (new)
ModelRoutingResult → model_hint, reasoning, metadata

// Orchestration (new)
OrchestrationResult → Phase2BackendPayload + OrchestrationMetadata

// Backend Response (enhanced)
Phase2BackendResponse → enhanced_prompt + comprehensive metadata
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, several redundancies and consolidation opportunities were identified:

**Redundant Properties Identified:**
- Properties 1.2 and 4.1 both test fast flag behavior - can be consolidated
- Properties 1.3, 4.2, 4.3, and 4.4 all test budget mode behavior - can be consolidated into one comprehensive property
- Properties 2.1 and 4.5 both test explicit template specification - can be consolidated
- Properties 2.3 and 7.3 both test template precedence - can be consolidated
- Properties 1.4 and 8.2 both test model routing fallback - can be consolidated

**Consolidation Strategy:**
- Combine budget-related properties into one comprehensive budget constraint property
- Merge fast mode properties into one comprehensive speed optimization property
- Consolidate template precedence properties
- Combine error handling properties where they test the same underlying mechanism

### Correctness Properties

Property 1: Model routing respects constraints
*For any* task type, budget mode, and speed preference combination, the model router should return a valid model selection that respects the specified constraints and provides appropriate reasoning
**Validates: Requirements 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4**

Property 2: Model routing graceful fallback
*For any* failure condition in model routing, the system should return a safe default model configuration without crashing
**Validates: Requirements 1.4, 8.2**

Property 3: Model router output format compliance
*For any* valid input, the model router should return metadata in the exact backend format without performing network calls
**Validates: Requirements 1.5**

Property 4: Template resolution by name
*For any* specified template name, the template system should either return the correct template or provide appropriate error handling if the template doesn't exist or isn't accessible
**Validates: Requirements 2.1, 4.5**

Property 5: Automatic template selection
*For any* detected task type, the template system should select an appropriate template or explicitly indicate no template is suitable
**Validates: Requirements 2.2**

Property 6: Template precedence rules
*For any* template name conflict between system and user templates, user templates should always take precedence
**Validates: Requirements 2.3, 7.3**

Property 7: Template access control
*For any* system-locked template, user access should be prevented while internal functionality remains available
**Validates: Requirements 2.4**

Property 8: Template expansion consistency
*For any* template and context combination, template expansion should consistently inject relevant metadata and preserve template structure
**Validates: Requirements 2.5**

Property 9: Orchestration workflow completeness
*For any* user prompt and options, the orchestrator should execute all required steps (task detection, template selection, model routing, metadata preparation) and produce a complete result
**Validates: Requirements 3.1**

Property 10: Orchestration error resilience
*For any* step failure in the orchestration pipeline, the system should continue with safe defaults and complete the workflow
**Validates: Requirements 3.2**

Property 11: Backend payload compliance
*For any* orchestration result, the generated payload should match the Phase-2 backend JSON contract exactly
**Validates: Requirements 3.3**

Property 12: Metadata display completeness
*For any* successful enhancement, all required metadata (task type, model, confidence, timing, template) should be displayed to the user
**Validates: Requirements 3.4, 5.1, 5.2, 5.3, 5.4**

Property 13: Prompt merging preservation
*For any* user prompt and template combination, the merged result should preserve user intent while incorporating template guidance
**Validates: Requirements 3.5**

Property 14: Backward compatibility preservation
*For any* existing command usage without new flags, the system should behave identically to the current implementation
**Validates: Requirements 6.1**

Property 15: Graceful degradation
*For any* backend unavailability or component failure, the system should fall back to existing functionality rather than blocking operations
**Validates: Requirements 6.2, 6.3**

Property 16: Configuration resilience
*For any* invalid user configuration or API contract change, the system should use safe defaults and continue processing
**Validates: Requirements 6.4, 6.5**

Property 17: Template loading consistency
*For any* system state, templates should be loaded from the correct directories (system templates from built-in directory, user templates from home directory)
**Validates: Requirements 7.1, 7.2**

Property 18: Template categorization and routing
*For any* template, it should be properly categorized and routed based on its category and task type matching
**Validates: Requirements 7.4, 7.5**

Property 19: Error handling graceful continuation
*For any* component failure (task detection, template loading, backend communication, timeouts), the system should handle errors gracefully and continue with appropriate fallbacks
**Validates: Requirements 8.1, 8.3, 8.4, 8.5**

## Error Handling

### Error Categories and Responses

**Task Detection Errors:**
- Input validation failures → Continue with 'general' task type, confidence 0.3
- Classification algorithm errors → Log error, use 'general' with appropriate reasoning
- Timeout errors → Use cached result or default to 'general'

**Template System Errors:**
- Template file corruption → Skip corrupted template, continue with others
- Template not found → Clear error message, continue without template
- Template access denied → Security error, fall back to public templates
- Template expansion errors → Use original prompt, log expansion failure

**Model Router Errors:**
- Invalid task type → Use 'general' task type routing
- Budget constraint conflicts → Default to 'medium' budget
- Model availability issues → Fall back to default model configuration
- Configuration parsing errors → Use built-in default configuration

**Orchestrator Errors:**
- Component initialization failure → Initialize with safe defaults
- Workflow interruption → Complete partial workflow, mark incomplete steps
- Payload generation errors → Generate minimal valid payload
- Metadata collection errors → Provide partial metadata, mark missing fields

**Backend Communication Errors:**
- Network connectivity issues → Retry with exponential backoff, then fail gracefully
- Authentication failures → Clear error message, suggest re-login
- API contract mismatches → Attempt graceful parsing, log version mismatch
- Timeout errors → Cancel request, provide cached or default response

### Error Recovery Strategies

**Graceful Degradation Levels:**
1. **Full Functionality**: All components working normally
2. **Reduced Functionality**: Some components failed, core features available
3. **Basic Functionality**: Major failures, fall back to Phase-1 behavior
4. **Emergency Mode**: Critical failures, minimal prompt enhancement only

**Recovery Mechanisms:**
- Component isolation: Failures in one component don't cascade
- Default value injection: Safe defaults for all configuration parameters
- Partial result handling: Accept and process incomplete data where possible
- User notification: Clear communication about degraded functionality

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Testing Focus:**
- Specific examples demonstrating correct behavior
- Integration points between components
- Error conditions and edge cases
- API contract compliance
- Configuration parsing and validation

**Property-Based Testing Focus:**
- Universal properties that should hold across all inputs
- Model routing behavior across all task types and constraints
- Template resolution across all possible template and task combinations
- Orchestration workflow completeness across all input variations
- Error handling resilience across all failure scenarios

### Property-Based Testing Configuration

**Testing Library**: fast-check (TypeScript property-based testing library)
**Minimum Iterations**: 100 iterations per property test
**Property Test Tagging**: Each property-based test must include a comment with the format:
`**Feature: pbcli-phase2-orchestrator, Property {number}: {property_text}**`

**Example Property Test Structure:**
```typescript
// **Feature: pbcli-phase2-orchestrator, Property 1: Model routing respects constraints**
it('should respect model routing constraints across all inputs', () => {
  fc.assert(fc.property(
    fc.record({
      taskType: fc.constantFrom('coding', 'creative', 'rewrite', 'structured', 'minimal', 'research', 'general'),
      budget: fc.constantFrom('low', 'medium', 'high'),
      preferFast: fc.boolean()
    }),
    (input) => {
      const result = modelRouter.route(input.taskType, {
        budget: input.budget,
        fast: input.preferFast
      });
      
      expect(result.model_hint).to.be.a('string');
      expect(result.reasoning).to.be.a('string');
      expect(result.metadata.budget_mode).to.equal(input.budget);
      expect(result.metadata.prefer_fast).to.equal(input.preferFast);
    }
  ), { numRuns: 100 });
});
```

### Integration Testing Strategy

**Component Integration Tests:**
- Task Detector → Template Resolver integration
- Template Resolver → Model Router integration  
- Model Router → Orchestrator integration
- Orchestrator → Backend API integration

**End-to-End Workflow Tests:**
- Complete enhancement pipeline with various flag combinations
- Error injection at different pipeline stages
- Backend response handling and metadata display
- Backward compatibility with existing workflows

### Test Data Management

**Mock Data Strategy:**
- Realistic task detection scenarios
- Comprehensive template library for testing
- Various backend response formats
- Network failure simulation
- Configuration edge cases

**Test Environment Setup:**
- Isolated test directories for template loading
- Mock backend endpoints for API testing
- Configurable timeout and retry settings
- Test-specific logging and debugging

This testing strategy ensures that both specific examples work correctly (unit tests) and that general correctness properties hold across all possible inputs (property tests), providing comprehensive validation of the Phase-2 enhancement functionality.