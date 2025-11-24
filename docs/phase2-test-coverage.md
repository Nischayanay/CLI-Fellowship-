# Phase 2 Test Coverage

This document outlines the test strategy and coverage for the PBCLI Phase 2 Template System.

## Test Strategy

We use **Mocha** and **Chai** for testing, along with **@oclif/test** for CLI command simulation.

- **Unit Tests**: Focus on individual components (`TemplateLoader`) and commands in isolation.
- **Integration Tests**: Verify the flow of data between commands and the file system.
- **Environment**: Tests run in a temporary directory (`os.tmpdir()`) to avoid polluting the user's actual environment.

## Test Files

### 1. Library Tests (`test/lib/`)
**`templateLoader.test.ts`**
- [x] `loadSystemTemplates`: Loads from distribution folder.
- [x] `loadUserTemplates`: Loads from user home directory.
- [x] `addTemplate`: correctly saves JSON files.
- [x] `removeTemplate`: deletes files, prevents system deletion.
- [x] `mergeTemplates`: User templates override system templates.
- [x] Filename sanitization.

### 2. Command Tests (`test/commands/`)
**`lib-list.test.ts`**
- [x] Displays system templates.
- [x] Displays user templates.
- [x] Handles empty states.

**`lib-add.test.ts`**
- [x] interactive prompt simulation.
- [x] Validation (required fields).
- [x] Success output.

**`lib-remove.test.ts`**
- [x] Argument parsing.
- [x] Success output.
- [x] Error handling (not found, system template).

### 3. Integration Tests (`test/integration/`)
**`template-flow.test.ts`**
- [x] **Lifecycle**: Add -> List -> Remove -> List.
- [x] **Persistence**: Verify files exist on disk after CLI commands.
- [x] **Overriding**: Verify system template override flow.

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx mocha test/lib/templateLoader.test.ts
```

### Build & Test
Verify that tests work against the compiled `dist/` output (simulating production).
```bash
npm run build && npm test
```
