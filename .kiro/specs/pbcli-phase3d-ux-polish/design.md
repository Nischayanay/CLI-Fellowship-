# Design Document

## Overview

PHASE-3D transforms PBCLI into a world-class CLI experience by implementing comprehensive UI/UX polish based on behavioral psychology, color theory, and industry-standard patterns from Stripe CLI, Vercel CLI, and Supabase CLI. This phase focuses exclusively on client-side improvements without modifying backend systems, APIs, or the context engine.

The design introduces a unified color psychology system, smooth progress indicators, intelligent messaging patterns, reinforcement hooks for habit formation, and consistent layout rules. All improvements are implemented through new utility modules and command refactoring, ensuring backward compatibility while elevating the developer experience.

## Architecture

### High-Level Structure

```
PBCLI (Client-Side Only)
├── UI/UX Layer (NEW)
│   ├── Color System
│   ├── Progress Indicators
│   ├── Message Formatter
│   ├── Reinforcement Display
│   └── Layout Engine
├── Commands Layer (REFACTORED)
│   ├── Existing Commands (Updated)
│   └── New Commands (doctor)
├── Utilities Layer (ENHANCED)
│   ├── formatting.ts (Extended)
│   ├── ui.ts (NEW)
│   └── progress.ts (NEW)
└── Backend Integration (UNCHANGED)
    ├── API Client
    ├── Auth
    └── Context Engine
```

### Design Principles

1. **Client-Side Only**: All changes are UI/UX improvements in PBCLI; no backend modifications
2. **Backward Compatible**: Existing functionality remains unchanged; only presentation improves
3. **Progressive Enhancement**: Features degrade gracefully on limited terminals
4. **Behavioral Psychology**: UI elements reinforce positive habits through feedback loops
5. **Brand Consistency**: All output follows the PromptBrain color palette and tone

## Components and Interfaces

### 1. Color System Module (`src/utils/colors.ts`)

Centralized color palette management with fallback support.

```typescript
interface ColorPalette {
  primary: string;      // Soft Cyan #38C9D6
  success: string;      // Mint Green #33E0A1
  warning: string;      // Amber #F5C04D
  error: string;        // Soft Red #E65C5C
  metadata: string;     // Stone Grey #9BA3AF
  neutral: string;      // White / Off-white
}

interface ColorSystem {
  // Core colors
  primary(text: string): string;
  success(text: string): string;
  warning(text: string): string;
  error(text: string): string;
  metadata(text: string): string;
  neutral(text: string): string;
  
  // Semantic helpers
  heading(text: string): string;
  highlight(text: string): string;
  dim(text: string): string;
  code(text: string): string;
  
  // Status indicators
  statusSuccess(text: string): string;
  statusWarning(text: string): string;
  statusError(text: string): string;
  statusInfo(text: string): string;
  
  // Utility
  isColorSupported(): boolean;
  disableColors(): void;
  enableColors(): void;
}
```

### 2. UI Formatter Module (`src/utils/ui.ts`)

High-level UI formatting utilities for consistent output.

```typescript
interface MessageOptions {
  prefix?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'metadata';
  dim?: boolean;
  indent?: number;
}

interface UIFormatter {
  // Message types
  tip(message: string): void;
  headsUp(message: string): void;
  goodNews(message: string): void;
  done(message?: string): void;
  
  // Sections
  section(title: string, content?: string): void;
  subsection(title: string, content?: string): void;
  
  // Lists
  list(items: string[], options?: { bullet?: string; indent?: number }): void;
  numberedList(items: string[]): void;
  
  // Tables
  table(data: Record<string, string>[], options?: { align?: 'left' | 'right' }): void;
  keyValue(key: string, value: string, options?: { keyWidth?: number }): void;
  
  // Spacing
  spacer(lines?: number): void;
  divider(char?: string): void;
  
  // Code/snippets
  codeBlock(code: string, language?: string): void;
  inlineCode(code: string): string;
}
```

### 3. Progress Indicator Module (`src/utils/progress.ts`)

Smooth, Apple-style progress indicators.

```typescript
interface ProgressOptions {
  message?: string;
  total?: number;
  current?: number;
}

interface ProgressIndicator {
  // Spinner (indeterminate)
  start(message: string): void;
  update(message: string): void;
  stop(): void;
  succeed(message?: string): void;
  fail(message?: string): void;
  
  // Progress bar (determinate)
  startBar(total: number, message?: string): void;
  updateBar(current: number, message?: string): void;
  completeBar(message?: string): void;
  
  // Multi-stage
  startStage(stageName: string, totalStages: number, currentStage: number): void;
  completeStage(): void;
}
```

### 4. Reinforcement Display Module (`src/utils/reinforcement.ts`)

Displays positive feedback to build habit loops.

```typescript
interface ReinforcementMetrics {
  tokensSaved?: number;
  memoryHits?: number;
  crossToolContext?: string[];
  processingTime?: number;
}

interface ReinforcementDisplay {
  // Show metrics after successful operations
  showMetrics(metrics: ReinforcementMetrics): void;
  
  // Show savings
  showTokenSavings(saved: number, total: number): void;
  
  // Show context sources
  showContextSources(sources: Array<{ name: string; count: number }>): void;
  
  // Show efficiency gains
  showEfficiencyGains(metrics: ReinforcementMetrics): void;
}
```

### 5. ASCII Sigil Module (`src/utils/sigil.ts`)

Minimalistic brand identity display.

```typescript
interface Sigil {
  // Display sigil
  show(options?: { color?: boolean; size?: 'small' | 'normal' }): void;
  
  // Get sigil as string
  toString(options?: { color?: boolean }): string;
}
```

### 6. Doctor Command (`src/commands/doctor.ts`)

Diagnostic command for troubleshooting.

```typescript
interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  suggestion?: string;
}

interface DoctorCommand {
  // Run all checks
  runDiagnostics(): Promise<DiagnosticCheck[]>;
  
  // Individual checks
  checkAuth(): Promise<DiagnosticCheck>;
  checkConnectivity(): Promise<DiagnosticCheck>;
  checkConfig(): Promise<DiagnosticCheck>;
  checkVersion(): Promise<DiagnosticCheck>;
  
  // Display results
  displayResults(checks: DiagnosticCheck[]): void;
}
```

## Data Models

### Color Configuration

```typescript
interface ColorConfig {
  palette: ColorPalette;
  enabled: boolean;
  colorBlindMode: boolean;
}
```

### Message Template

```typescript
interface MessageTemplate {
  type: 'tip' | 'headsUp' | 'goodNews' | 'done' | 'error' | 'warning' | 'info';
  prefix: string;
  color: string;
  icon?: string;
}
```

### Progress State

```typescript
interface ProgressState {
  type: 'spinner' | 'bar' | 'stage';
  active: boolean;
  message: string;
  current?: number;
  total?: number;
  startTime: number;
}
```

### Diagnostic Result

```typescript
interface DiagnosticResult {
  checks: DiagnosticCheck[];
  overallStatus: 'healthy' | 'issues' | 'critical';
  timestamp: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, several redundancies were identified:

**Redundancies Identified:**
1. Properties 1.1-1.6 (color usage) can be consolidated into a single comprehensive color palette property
2. Properties 4.1-4.4 (message prefixes) can be combined into one message formatting property
3. Properties 9.2-9.4 (status indicators) overlap and can be merged
4. Properties 10.1 and 10.4 (JSON validity) are redundant
5. Properties 12.1-12.4 (command updates) can be consolidated into fewer comprehensive properties

**Consolidated Properties:**
- Color palette property covers all color requirements (1.1-1.6)
- Message formatting property covers all prefix patterns (4.1-4.4)
- Status indicator property covers all status types (9.2-9.4)
- JSON validity property covers parsing and validation (10.1, 10.4)
- Command consistency property covers palette, messaging, and layout (12.1-12.3)

### Correctness Properties

Property 1: Color palette consistency
*For any* message type (important, success, warning, error, metadata, neutral), the rendered output should use the corresponding color from the official palette (#38C9D6, #33E0A1, #F5C04D, #E65C5C, #9BA3AF, white)
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

Property 2: Message prefix consistency
*For any* message type (tip, headsUp, goodNews, done), the formatted output should include the correct prefix ("Tip:", "Heads up:", "Good news:", "Done.") with consistent styling
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 3: Section spacing consistency
*For any* multi-section output, consecutive sections should be separated by exactly one blank line
**Validates: Requirements 6.1**

Property 4: Indentation consistency
*For any* nested content, the indentation level should be consistent and proportional to nesting depth
**Validates: Requirements 6.2**

Property 5: Column alignment consistency
*For any* tabular data, columns should be properly aligned with consistent spacing
**Validates: Requirements 6.3**

Property 6: Line width constraint
*For any* text content, lines should not exceed 100 characters unless containing unbreakable content (URLs, code)
**Validates: Requirements 6.4**

Property 7: List formatting consistency
*For any* list output, bullet or numbering styles should be consistent throughout
**Validates: Requirements 6.5**

Property 8: Progress indicator cleanup
*For any* operation with a progress indicator, when the operation completes, the indicator should be removed and replaced with a completion message
**Validates: Requirements 3.5**

Property 9: Multi-stage progress clarity
*For any* multi-stage operation, the current stage number and total stages should be clearly indicated
**Validates: Requirements 3.4**

Property 10: Reinforcement feedback presence
*For any* successful command that uses context, token savings and/or memory graph hits should be displayed
**Validates: Requirements 5.2, 5.3**

Property 11: Cross-tool context attribution
*For any* command that uses cross-tool context, the contributing tools should be listed
**Validates: Requirements 5.4**

Property 12: Sigil color consistency
*For any* sigil display, the output should use the primary brand color (Soft Cyan #38C9D6)
**Validates: Requirements 8.2**

Property 13: Sigil size constraint
*For any* sigil display, the output should not exceed 5 lines in height
**Validates: Requirements 8.4**

Property 14: Color-blind mode indicators
*For any* status display in color-blind mode, text-based indicators (symbols or labels) should be present in addition to or instead of colors
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

Property 15: Color-blind mode functionality preservation
*For any* command executed in color-blind mode, the functional output should be identical to normal mode (only presentation differs)
**Validates: Requirements 9.5**

Property 16: JSON output validity
*For any* command with JSON flag enabled, the output should be valid, parseable JSON
**Validates: Requirements 10.1, 10.4**

Property 17: JSON output purity
*For any* command with JSON flag enabled, the output should contain no ANSI codes, decorative elements, or non-JSON text
**Validates: Requirements 10.2**

Property 18: JSON schema consistency
*For any* two commands with JSON flag enabled, common fields (status, timestamp, error) should have consistent types and formats
**Validates: Requirements 10.5**

Property 19: Command color consistency
*For any* existing command, the output should use only colors from the official palette
**Validates: Requirements 12.1**

Property 20: Command backward compatibility
*For any* existing command, the functional behavior and exit codes should remain unchanged after UI updates
**Validates: Requirements 12.5**

## Error Handling

### Color System Errors

**Scenario**: Terminal doesn't support colors
- **Handling**: Detect color support using `chalk.supportsColor`
- **Fallback**: Disable all color codes, output plain text
- **User Impact**: Functionality preserved, only visual styling lost

**Scenario**: Invalid color code provided
- **Handling**: Log warning, fall back to default color
- **Fallback**: Use neutral/white color
- **User Impact**: Minimal, output still readable

### Progress Indicator Errors

**Scenario**: Terminal doesn't support cursor manipulation
- **Handling**: Detect terminal capabilities
- **Fallback**: Use line-by-line progress updates instead of in-place updates
- **User Impact**: More verbose output, but progress still visible

**Scenario**: Progress indicator interrupted by error
- **Handling**: Ensure cleanup in finally blocks
- **Fallback**: Clear indicator, show error message
- **User Impact**: Clean error display without leftover spinners

### JSON Output Errors

**Scenario**: Command fails during JSON mode
- **Handling**: Output valid JSON error object
- **Format**: `{ "status": "error", "message": "...", "code": "..." }`
- **User Impact**: Parseable error for automation scripts

**Scenario**: Data contains non-serializable values
- **Handling**: Convert to serializable format (dates to ISO strings, etc.)
- **Fallback**: Omit field with warning in stderr
- **User Impact**: Partial data with warning

### Doctor Command Errors

**Scenario**: Individual diagnostic check fails
- **Handling**: Continue with remaining checks
- **Display**: Show failed check with error details
- **User Impact**: Partial diagnostic results still useful

**Scenario**: Cannot connect to API
- **Handling**: Mark connectivity check as failed
- **Suggestion**: Provide troubleshooting steps
- **User Impact**: Clear indication of connectivity issue

## Testing Strategy

### Unit Testing Approach

Unit tests will verify specific formatting functions and edge cases:

1. **Color System Tests**
   - Test each color function returns correct ANSI codes
   - Test color fallback when colors disabled
   - Test color-blind mode adds appropriate indicators

2. **Message Formatting Tests**
   - Test each message type (tip, headsUp, etc.) has correct prefix
   - Test message wrapping at line width limits
   - Test indentation levels

3. **Progress Indicator Tests**
   - Test spinner start/stop/update
   - Test progress bar rendering at various percentages
   - Test cleanup on completion/error

4. **JSON Output Tests**
   - Test JSON validity for each command
   - Test JSON mode suppresses decorative output
   - Test error handling in JSON mode

5. **Doctor Command Tests**
   - Test each diagnostic check individually
   - Test overall status calculation
   - Test recommendation generation

### Property-Based Testing Approach

Property-based tests will verify universal properties across all inputs using **fast-check** (already in package.json):

**Configuration**: Each property test will run a minimum of 100 iterations to ensure thorough coverage.

**Tagging**: Each property-based test will include a comment with the format:
`// Feature: pbcli-phase3d-ux-polish, Property {number}: {property_text}`

**Test Organization**: Property tests will be co-located with unit tests in `test/utils/` directory.

**Key Property Tests**:

1. **Color Palette Consistency** (Property 1)
   - Generate random message types and content
   - Verify output contains correct color codes
   - Verify no colors outside the official palette

2. **Message Prefix Consistency** (Property 2)
   - Generate random message content for each type
   - Verify correct prefix appears in output
   - Verify prefix styling is consistent

3. **Spacing Consistency** (Property 3)
   - Generate random multi-section content
   - Verify exactly one blank line between sections
   - Verify no extra spacing

4. **Indentation Consistency** (Property 4)
   - Generate random nested structures
   - Verify indentation increases consistently
   - Verify indentation uses spaces (not tabs)

5. **Line Width Constraint** (Property 6)
   - Generate random text of varying lengths
   - Verify lines don't exceed 100 characters
   - Verify wrapping preserves readability

6. **JSON Validity** (Property 16)
   - Generate random command outputs
   - Parse JSON output
   - Verify round-trip: parse(output) succeeds

7. **Backward Compatibility** (Property 20)
   - Run existing commands with new UI
   - Compare exit codes and functional output
   - Verify behavior unchanged

### Integration Testing

Integration tests will verify end-to-end command execution:

1. **Command Output Tests**
   - Execute each command with new UI
   - Verify output follows all formatting rules
   - Verify reinforcement feedback appears

2. **Platform Compatibility Tests**
   - Run tests on macOS, Linux, Windows (CI/CD)
   - Verify visual elements render correctly
   - Verify fallbacks work on limited terminals

3. **Doctor Command Integration**
   - Run doctor command in various states (authenticated, not authenticated, offline)
   - Verify all checks execute
   - Verify recommendations are actionable

### Manual Testing Checklist

1. Visual inspection of all commands on different terminals
2. Color-blind mode verification with color-blind simulators
3. JSON output validation with automation scripts
4. Doctor command testing in various failure scenarios
5. Cross-platform rendering verification

## Implementation Notes

### Dependencies

- **chalk** (v4.1.2): Already installed, used for color management
- **fast-check** (v4.3.0): Already installed, used for property-based testing
- No new dependencies required

### File Structure

```
src/
├── utils/
│   ├── colors.ts          (NEW - Color system)
│   ├── ui.ts              (NEW - UI formatter)
│   ├── progress.ts        (NEW - Progress indicators)
│   ├── reinforcement.ts   (NEW - Reinforcement display)
│   ├── sigil.ts           (NEW - ASCII sigil)
│   └── formatting.ts      (EXTEND - Add new helpers)
├── commands/
│   ├── doctor.ts          (NEW - Diagnostic command)
│   └── *.ts               (UPDATE - Apply new UI)
└── lib/
    └── (UNCHANGED)

test/
├── utils/
│   ├── colors.test.ts     (NEW)
│   ├── ui.test.ts         (NEW)
│   ├── progress.test.ts   (NEW)
│   └── formatting.test.ts (UPDATE)
└── commands/
    └── doctor.test.ts     (NEW)
```

### Migration Strategy

1. **Phase 1**: Create new utility modules (colors, ui, progress, reinforcement, sigil)
2. **Phase 2**: Implement doctor command
3. **Phase 3**: Update existing commands one by one to use new utilities
4. **Phase 4**: Add property-based tests
5. **Phase 5**: Verify backward compatibility

### Backward Compatibility

- All existing command functionality preserved
- Exit codes unchanged
- Command arguments and flags unchanged
- Only visual presentation enhanced
- JSON mode provides automation-friendly output

### Performance Considerations

- Color detection cached on startup
- Progress indicators use efficient terminal updates
- No additional API calls or network overhead
- Minimal memory footprint for UI state

### Accessibility

- Color-blind friendly mode with text indicators
- Plain text fallback for limited terminals
- Screen reader friendly output (no excessive decorations)
- High contrast color palette for visibility

## Future Enhancements

Potential improvements for future phases:

1. **Interactive Mode**: TUI for complex operations
2. **Themes**: User-customizable color schemes
3. **Localization**: Multi-language support
4. **Rich Output**: Images/charts in supported terminals
5. **Telemetry**: Anonymous usage analytics for UX improvements
6. **Plugins**: Third-party UI extensions

## References

- [Stripe CLI](https://stripe.com/docs/cli) - Industry-standard CLI UX
- [Vercel CLI](https://vercel.com/docs/cli) - Modern CLI design patterns
- [Supabase CLI](https://supabase.com/docs/guides/cli) - Developer-friendly CLI
- [Chalk Documentation](https://github.com/chalk/chalk) - Terminal styling
- [Fast-check Documentation](https://fast-check.dev/) - Property-based testing
- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code) - Terminal control
- [Color Psychology](https://www.interaction-design.org/literature/article/color-psychology) - UI color theory
- [Behavioral Design](https://www.behavioraleconomics.com/resources/mini-encyclopedia-of-be/behavioral-design/) - Habit formation
