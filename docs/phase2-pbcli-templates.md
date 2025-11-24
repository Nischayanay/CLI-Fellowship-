# PBCLI Templates System

The PBCLI Templates System allows users to manage and use prompt templates for the `pb enhance` command. It supports both built-in system templates and custom user templates.

## Concepts

### System Templates
- **Location**: Bundled with the CLI in `dist/lib/templates/system`.
- **Read-only**: Users cannot modify or delete these directly via CLI.
- **Updates**: Updated when the CLI is updated.

### User Templates
- **Location**: Stored in `~/.promptbrain/templates/user`.
- **Editable**: Users can add, remove, and manage these templates.
- **Persistence**: Persist across CLI updates.

### Overriding
If a user creates a template with the same `name` as a system template, the user template **overrides** the system template. This allows users to customize default behaviors.

## Template Schema

Templates are stored as JSON files.

```json
{
  "name": "my-template",
  "description": "A brief description of what this template does",
  "category": "custom",
  "content": "The actual prompt content..."
}
```

- **name**: Unique identifier (kebab-case recommended).
- **description**: Human-readable description shown in `pb lib list`.
- **category**: Grouping identifier (e.g., 'code', 'design', 'custom').
- **content**: The prompt text to be sent to the Context Engine.

## Commands

### List Templates
View all available templates (both system and user).

```bash
pb lib list
```

### Add Template
Create a new custom template interactively.

```bash
pb lib add
```
You will be prompted for:
- Name
- Description
- Content

### Remove Template
Delete a custom template.

```bash
pb lib remove <template-name>
```
*Note: You cannot remove system templates.*

## Integration with Enhance

Templates are used by the `enhance` command (and others) to structure the prompt sent to the LLM.

```bash
pb enhance --template <template-name>
```

If `<template-name>` matches a user template, that one is used. Otherwise, it looks for a system template.
