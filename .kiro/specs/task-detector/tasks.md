# Implementation Plan

- [x] 1. Create task detector module with core types and interfaces
  - Create src/lib/task-detector.ts file
  - Define TaskType union type with all seven task types
  - Define TaskDetectionResult interface with task_type, confidence, and reasoning
  - Define internal KeywordPattern interface for pattern configuration
  - Export public types and interfaces
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement keyword pattern configuration
  - Define KEYWORD_PATTERNS array with all seven task types
  - Include comprehensive keyword lists for each type (coding, creative, rewrite, structured, minimal, research)
  - Assign weight values for priority ordering (coding=10, structured=9, rewrite=8, creative=7, research=6, minimal=5)
  - Define STRUCTURAL_PATTERNS for JSON, code blocks, SQL, and file extensions
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 3. Implement core detectTask function
  - Create detectTask function that accepts prompt string parameter
  - Implement input validation for empty and whitespace-only prompts
  - Implement prompt normalization (lowercase, trim)
  - Return TaskDetectionResult object
  - _Requirements: 1.1, 5.2, 5.3_

- [x] 4. Implement keyword matching algorithm
  - Scan normalized prompt for keyword matches across all patterns
  - Count matches per task type
  - Calculate weighted scores for each task type
  - Track which keywords were matched for reasoning generation
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 5. Implement structural pattern analysis
  - Check for JSON structures using regex patterns
  - Check for code blocks (markdown syntax)
  - Check for SQL keywords
  - Check for file extensions
  - Add structural bonuses to relevant task type scores
  - _Requirements: 2.1, 2.6_

- [x] 6. Implement task type selection logic
  - Select task type with highest score
  - Apply priority order for tie-breaking (coding > structured > rewrite > creative > research > minimal > general)
  - Default to 'general' type if no matches found
  - _Requirements: 1.2, 2.9, 7.1, 7.2_

- [x] 7. Implement confidence calculation
  - Calculate confidence based on number of matches and match strength
  - Ensure confidence is always between 0.0 and 1.0
  - Use formula: min(1.0, matches / expected_high_confidence_threshold)
  - Set low confidence (0.3) for empty/no-match prompts
  - _Requirements: 1.3, 7.3, 7.4_

- [x] 8. Implement reasoning generation
  - Generate reasoning string listing detected keywords
  - Mention structural patterns if found
  - Explain why the selected task type was chosen
  - Handle edge cases (empty prompt, no matches, errors)
  - _Requirements: 1.4_

- [x] 9. Implement error handling
  - Wrap detection logic in try-catch
  - Return safe default (general type, 0.5 confidence) on errors
  - Include error message in reasoning
  - Handle extremely long prompts (>10,000 chars) by truncating
  - _Requirements: 7.5_

- [ ]* 9.1 Write property test for valid task type output
  - **Property 1: Valid task type output**
  - Generate random prompt strings
  - Verify task_type is always one of the seven valid types
  - Run 100+ iterations
  - _Requirements: 1.2_

- [ ]* 9.2 Write property test for confidence range
  - **Property 2: Confidence range constraint**
  - Generate random prompt strings
  - Verify confidence is always between 0.0 and 1.0
  - Run 100+ iterations
  - _Requirements: 1.3_

- [ ]* 9.3 Write property test for reasoning non-empty
  - **Property 3: Reasoning non-empty**
  - Generate random prompt strings
  - Verify reasoning string length is always > 0
  - Run 100+ iterations
  - _Requirements: 1.4_

- [ ]* 9.4 Write property test for deterministic behavior
  - **Property 4: Deterministic classification**
  - Generate random prompt strings
  - Call detectTask twice with same prompt
  - Verify results are identical (deep equality)
  - Run 100+ iterations
  - _Requirements: 1.5_

- [ ]* 9.5 Write property test for keyword-based classification
  - **Property 5: Keyword-based classification**
  - Generate prompts containing specific task-type keywords
  - Verify classification matches expected type for each keyword category
  - Test all six keyword-based types (coding, creative, rewrite, structured, minimal, research)
  - Run 100+ iterations
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ]* 9.6 Write property test for output structure
  - **Property 6: Output structure completeness**
  - Generate random prompt strings
  - Verify output object has exactly three properties: task_type, confidence, reasoning
  - Verify types: task_type is string, confidence is number, reasoning is string
  - Run 100+ iterations
  - _Requirements: 5.3_

- [ ]* 9.7 Write unit tests for each task type classification
  - Test coding type with prompts like "Fix typescript bug"
  - Test creative type with prompts like "Write a blog post"
  - Test rewrite type with prompts like "Summarize this text"
  - Test structured type with prompts like "Generate JSON schema"
  - Test minimal type with prompts like "Make it minimal and clean"
  - Test research type with prompts like "Explain how this works"
  - Test general type with prompts like "Help me with this"
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ]* 9.8 Write unit tests for edge cases
  - Test empty string returns general type with low confidence
  - Test whitespace-only string returns general type with low confidence
  - Test very long prompt (>10,000 chars) is handled correctly
  - Test prompt with mixed signals selects highest priority type
  - Test prompt with equal-weight signals applies priority order
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Integrate task detector into enhance command
  - Import detectTask function in src/commands/enhance.ts
  - Call detectTask before API request
  - Store detection result
  - Pass result to display function
  - _Requirements: 1.1, 5.5_

- [x] 11. Create task detection display function
  - Create displayTaskDetection helper function
  - Format output with chalk colors (cyan for task type, dim for details)
  - Include emoji indicators (🔍 for detection, 💡 for reasoning)
  - Display task type, confidence percentage, and reasoning
  - Add spacing for clean layout
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 12. Update API client to include metadata
  - Define EnhancementMetadata interface in src/lib/apiClient.ts
  - Define EnhancementRequest interface with optional metadata field
  - Update /general endpoint call to include metadata in request body
  - Ensure metadata is optional (backward compatible)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 13. Update enhance command to send metadata
  - Modify API request in enhance command to include task detection metadata
  - Pass task_type, confidence, and reasoning in metadata field
  - Ensure existing error handling still works
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 13.1 Write integration test for enhance command with task detection
  - Mock API client
  - Call enhance command with test prompt
  - Verify detectTask is called
  - Verify task detection is displayed to user
  - Verify metadata is included in API request
  - Verify enhance command still completes successfully
  - _Requirements: 1.1, 3.1, 3.2, 4.1, 4.2, 4.3, 5.5_

- [x] 14. Add error handling for detection failures
  - Wrap detectTask call in try-catch in enhance command
  - Log error if detection fails but continue with enhancement
  - Use default metadata (general type, 0.5 confidence) if detection fails
  - Ensure enhancement request is never blocked by detection errors
  - _Requirements: 7.5_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

