# Requirements Document

## Introduction

The Phase-2 Task Detector is a deterministic classification system for the PromptBrain CLI (PBCLI) that analyzes user prompts and identifies the task type before sending enhancement requests to the PromptBrain Context Engine (PCE). This feature enables task-aware prompt enhancement by providing the backend with task classification metadata, allowing the PCE to apply appropriate enhancement strategies based on the detected task type.

## Glossary

- **PBCLI**: PromptBrain Command Line Interface - the client-side CLI tool
- **PCE**: PromptBrain Context Engine - the backend service that enhances prompts
- **Task Type**: A classification category representing the nature of the user's request (coding, creative, rewrite, structured, minimal, research, general)
- **Task Detector**: The deterministic classification module that analyzes prompts and returns task type, confidence, and reasoning
- **Confidence Score**: A numerical value between 0.0 and 1.0 indicating the certainty of the task classification
- **Enhancement Request**: An API call from PBCLI to PCE containing the user's prompt and metadata
- **Deterministic Rules**: Pattern-matching logic based on keywords, structure, and syntax that produces consistent results without randomness

## Requirements

### Requirement 1

**User Story:** As a CLI user, I want the system to automatically detect what type of task I'm trying to accomplish, so that my prompts are enhanced appropriately without manual classification.

#### Acceptance Criteria

1. WHEN a user invokes the enhance command with a prompt THEN the Task Detector SHALL analyze the prompt before sending it to the PCE
2. WHEN the Task Detector analyzes a prompt THEN the Task Detector SHALL return a task type from the valid set: coding, creative, rewrite, structured, minimal, research, general
3. WHEN the Task Detector analyzes a prompt THEN the Task Detector SHALL return a confidence score between 0.0 and 1.0
4. WHEN the Task Detector analyzes a prompt THEN the Task Detector SHALL return a reasoning string explaining the classification decision
5. WHEN the Task Detector processes identical prompts THEN the Task Detector SHALL return identical results (deterministic behavior)

### Requirement 2

**User Story:** As a developer, I want the task detection logic to use deterministic pattern-matching rules, so that the classification is predictable, testable, and does not require external API calls.

#### Acceptance Criteria

1. WHEN the Task Detector classifies a prompt THEN the Task Detector SHALL use only keyword matching, structural analysis, and syntax patterns
2. WHEN the Task Detector executes THEN the Task Detector SHALL NOT make any external API calls or use machine learning models
3. WHEN a prompt contains coding-related keywords (code, bug, error, fix, typescript, python, function, class, variable, import, debug) THEN the Task Detector SHALL classify it as coding type
4. WHEN a prompt contains creative-related keywords (blog, story, script, caption, write, creative, narrative, poem, article) THEN the Task Detector SHALL classify it as creative type
5. WHEN a prompt contains rewrite-related keywords (summarize, rewrite, shorten, paraphrase, rephrase, condense, simplify) THEN the Task Detector SHALL classify it as rewrite type
6. WHEN a prompt contains structured data indicators (JSON, SQL, schema, table, API spec, database, query, YAML, XML) THEN the Task Detector SHALL classify it as structured type
7. WHEN a prompt contains minimal style keywords (minimal, clean, apple style, short, concise, brief, simple) THEN the Task Detector SHALL classify it as minimal type
8. WHEN a prompt contains research-related keywords (research, explain, compare, analyze, investigate, study, evaluate) THEN the Task Detector SHALL classify it as research type
9. WHEN a prompt does not match any specific task type patterns THEN the Task Detector SHALL classify it as general type

### Requirement 3

**User Story:** As a CLI user, I want to see what task type was detected and how confident the system is, so that I understand how my prompt will be processed.

#### Acceptance Criteria

1. WHEN the Task Detector completes classification THEN the PBCLI SHALL display the detected task type to the user
2. WHEN the Task Detector completes classification THEN the PBCLI SHALL display the confidence score to the user
3. WHEN the PBCLI displays task detection results THEN the PBCLI SHALL format the output in a clean, readable manner using colors
4. WHEN the PBCLI displays task detection results THEN the PBCLI SHALL NOT disrupt the existing enhance command user experience

### Requirement 4

**User Story:** As a backend engineer, I want the CLI to send task detection metadata with enhancement requests, so that the PCE can apply task-aware enhancement strategies.

#### Acceptance Criteria

1. WHEN the PBCLI sends an enhancement request to the PCE THEN the PBCLI SHALL include the task_type in the request metadata
2. WHEN the PBCLI sends an enhancement request to the PCE THEN the PBCLI SHALL include the confidence score in the request metadata
3. WHEN the PBCLI sends an enhancement request to the PCE THEN the PBCLI SHALL include the reasoning in the request metadata
4. WHEN the PBCLI sends task metadata to the PCE THEN the PBCLI SHALL NOT modify the existing request structure in a breaking way

### Requirement 5

**User Story:** As a developer, I want the task detector to be implemented as a pure, testable module, so that it can be easily maintained, tested, and integrated without side effects.

#### Acceptance Criteria

1. WHEN the Task Detector module is created THEN the Task Detector SHALL be implemented in src/lib/task-detector.ts
2. WHEN the Task Detector module exports functions THEN the Task Detector SHALL export a detectTask function that accepts a prompt string
3. WHEN the detectTask function is called THEN the detectTask function SHALL return an object containing task_type, confidence, and reasoning properties
4. WHEN the Task Detector module is implemented THEN the Task Detector SHALL NOT have side effects or maintain internal state
5. WHEN the Task Detector is integrated into the enhance command THEN the integration SHALL NOT break existing enhance command functionality

### Requirement 6

**User Story:** As a quality assurance engineer, I want comprehensive unit tests for the task detector, so that I can verify correct classification across various prompt types and edge cases.

#### Acceptance Criteria

1. WHEN unit tests are created for the Task Detector THEN the tests SHALL be placed in test/lib/task-detector.test.ts
2. WHEN unit tests execute THEN the tests SHALL verify correct classification for each task type (coding, creative, rewrite, structured, minimal, research, general)
3. WHEN unit tests execute THEN the tests SHALL verify that confidence scores are between 0.0 and 1.0
4. WHEN unit tests execute THEN the tests SHALL verify that reasoning strings are non-empty
5. WHEN unit tests execute THEN the tests SHALL verify deterministic behavior by testing identical prompts produce identical results
6. WHEN unit tests execute THEN the tests SHALL verify edge cases including empty strings, very long prompts, and prompts with mixed signals

### Requirement 7

**User Story:** As a system architect, I want the task detector to handle ambiguous prompts gracefully, so that the system always provides a classification even when signals are unclear.

#### Acceptance Criteria

1. WHEN a prompt contains keywords from multiple task types THEN the Task Detector SHALL select the task type with the strongest signal
2. WHEN a prompt contains keywords from multiple task types with equal strength THEN the Task Detector SHALL apply a priority order (coding > structured > rewrite > creative > research > minimal > general)
3. WHEN a prompt is empty or contains only whitespace THEN the Task Detector SHALL classify it as general type with low confidence
4. WHEN a prompt contains no recognizable keywords THEN the Task Detector SHALL classify it as general type with low confidence
5. WHEN the Task Detector encounters an error during classification THEN the Task Detector SHALL return general type with confidence 0.5 and include error information in reasoning
