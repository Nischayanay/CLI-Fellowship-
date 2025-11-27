# Project Detection Documentation

Complete guide to PBCLI's intelligent project detection and auto-configuration system.

## Overview

PBCLI automatically detects your project's frameworks, dependencies, and technologies to provide context-aware enhancements and optimized templates.

## Features

### 1. Framework Detection

PBCLI detects popular frameworks automatically:

**Supported Frameworks:**
- **Next.js** - React framework for production
- **React** - UI library
- **Vue** - Progressive framework
- **Svelte** - Compiler-based framework
- **Angular** - Platform for web apps
- **Nuxt** - Vue framework
- **Remix** - Full stack web framework
- **Astro** - Content-focused framework
- **Vite** - Build tool
- **Express** - Node.js web framework
- **Fastify** - Fast web framework
- **NestJS** - Progressive Node.js framework
- **Supabase** - Backend as a service
- **Prisma** - Next-generation ORM
- **tRPC** - End-to-end typesafe APIs
- **GraphQL** - Query language
- **Apollo** - GraphQL implementation
- **Tailwind CSS** - Utility-first CSS
- **Electron** - Desktop apps
- **React Native** - Mobile apps
- **Expo** - React Native platform

### 2. Dependency Analysis

Analyzes `package.json` to extract:
- **Dependencies** - Production packages
- **DevDependencies** - Development packages
- **Package Manager** - npm, yarn, pnpm, or bun
- **TypeScript** - Presence of TypeScript

### 3. Project Type Classification

Automatically classifies projects:
- **Next.js Application**
- **Remix Application**
- **Astro Application**
- **Nuxt Application**
- **Mobile Application** (React Native/Expo)
- **Desktop Application** (Electron)
- **Web Application** (React/Vue/Svelte)
- **Backend Service** (Express/Fastify/NestJS)
- **ES Module Project**
- **Node.js Project**

### 4. Auto-Configuration

Creates `.promptbrain/` directory with:
- `config.json` - Project configuration
- `project.json` - Detected project info
- Framework-specific templates
- Optimized settings

## Usage

### Initialize Project

```bash
cd your-project
pb init
```

**Output:**
```
🚀 Initializing PromptBrain

✓ Project initialized successfully!

Project Detection Results

Project Type:     Next.js Application
Frameworks:       Next.js, React, Tailwind CSS, Supabase
Package Manager:  npm
TypeScript:       Yes
Dependencies:     42 packages

────────────────────────────────────────────────────────────────────────────────

✓ Created .promptbrain/ directory
✓ Saved project configuration
✓ Detected frameworks and dependencies
✓ Optimized templates for your stack
```

### JSON Output

```bash
pb init --json
```

**Response:**
```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "initialized": true,
    "projectInfo": {
      "frameworks": ["Next.js", "React", "Tailwind CSS", "Supabase"],
      "dependencies": {
        "next": "14.0.0",
        "react": "18.2.0",
        "@supabase/supabase-js": "2.38.0"
      },
      "devDependencies": {
        "typescript": "5.2.2",
        "tailwindcss": "3.3.0"
      },
      "packageManager": "npm",
      "projectType": "Next.js Application",
      "hasTypeScript": true,
      "detectedAt": "2024-01-15T10:30:00.000Z"
    },
    "configPath": ".promptbrain/config.json"
  }
}
```

## Detection Logic

### Framework Detection Rules

**Next.js:**
- Presence of `next` package
- High confidence

**Supabase:**
- Presence of `@supabase/supabase-js` package
- High confidence

**React:**
- Presence of `react` and `react-dom` packages
- High confidence

**TypeScript:**
- Presence of `typescript` package OR
- Presence of `tsconfig.json` file
- High confidence

### Package Manager Detection

**Priority Order:**
1. `pnpm-lock.yaml` → pnpm
2. `yarn.lock` → yarn
3. `bun.lockb` → bun
4. `package-lock.json` → npm
5. None found → unknown

### Project Type Classification

**Logic:**
```
if (has Next.js) → "Next.js Application"
else if (has Remix) → "Remix Application"
else if (has Astro) → "Astro Application"
else if (has React Native/Expo) → "Mobile Application"
else if (has Electron) → "Desktop Application"
else if (has React/Vue/Svelte) → "Web Application"
else if (has Express/Fastify/NestJS) → "Backend Service"
else if (type: "module") → "ES Module Project"
else → "Node.js Project"
```

## Configuration Files

### .promptbrain/config.json

Main configuration file created by `pb init`:

```json
{
  "version": "0.1.0",
  "projectInfo": {
    "frameworks": ["Next.js", "React"],
    "dependencies": { ... },
    "devDependencies": { ... },
    "packageManager": "npm",
    "projectType": "Next.js Application",
    "hasTypeScript": true,
    "detectedAt": "2024-01-15T10:30:00.000Z"
  },
  "initializedAt": "2024-01-15T10:30:00.000Z"
}
```

### .promptbrain/project.json

Detailed project information:

```json
{
  "frameworks": ["Next.js", "React", "Tailwind CSS"],
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "tailwindcss": "3.3.0"
  },
  "devDependencies": {
    "typescript": "5.2.2"
  },
  "packageManager": "npm",
  "projectType": "Next.js Application",
  "hasTypeScript": true,
  "detectedAt": "2024-01-15T10:30:00.000Z"
}
```

## Integration with Commands

### pb enhance

Uses project detection for:
- Framework-specific templates
- Context-aware suggestions
- Technology-specific optimizations

**Example:**
```bash
# In a Next.js project
pb enhance "create a new page"

# PBCLI knows:
# - You're using Next.js
# - App Router or Pages Router
# - TypeScript is enabled
# - Tailwind CSS is available

# Result: Next.js-specific enhancement with:
# - Correct file structure
# - TypeScript types
# - Tailwind classes
# - Next.js best practices
```

### pb devsync

Uses project detection for:
- Folder structure analysis
- Known dependencies context
- Framework-specific patterns
- Recent command history

**Example:**
```bash
pb devsync

# Gathers:
# - Project structure (src/, app/, pages/)
# - Detected frameworks (Next.js, Supabase)
# - Dependencies (React, Tailwind)
# - Last pb commands
# - Current git branch
```

### pb lib

Uses project detection for:
- Framework-specific templates
- Technology-aware snippets
- Project-optimized helpers

## API

### detectProject()

```typescript
import { detectProject } from './lib/project-detector';

const projectInfo = await detectProject('/path/to/project');

console.log(projectInfo);
// {
//   frameworks: ['Next.js', 'React'],
//   dependencies: { ... },
//   devDependencies: { ... },
//   packageManager: 'npm',
//   projectType: 'Next.js Application',
//   hasTypeScript: true,
//   detectedAt: '2024-01-15T10:30:00.000Z'
// }
```

### getFrameworkDetection()

```typescript
import { getFrameworkDetection } from './lib/project-detector';

const detections = await getFrameworkDetection('/path/to/project');

console.log(detections);
// [
//   {
//     name: 'Next.js',
//     detected: true,
//     confidence: 'high',
//     indicators: ['next package', 'pages/ or app/ directory']
//   },
//   {
//     name: 'Supabase',
//     detected: true,
//     confidence: 'high',
//     indicators: ['@supabase/supabase-js package']
//   }
// ]
```

### saveProjectInfo()

```typescript
import { saveProjectInfo } from './lib/project-detector';

await saveProjectInfo(projectInfo, '/path/to/project');
// Saves to .promptbrain/project.json
```

### loadProjectInfo()

```typescript
import { loadProjectInfo } from './lib/project-detector';

const projectInfo = await loadProjectInfo('/path/to/project');
// Loads from .promptbrain/project.json
```

## Template System

### Auto-Loading Templates

When frameworks are detected, PBCLI automatically loads:

**Next.js:**
- Page component templates
- API route templates
- Server component patterns
- Client component patterns
- Middleware templates

**Supabase:**
- Database query helpers
- Auth integration patterns
- Real-time subscription templates
- Storage helpers

**Express:**
- Route handler templates
- Middleware patterns
- Error handling
- API endpoint structures

### Custom Templates

Add project-specific templates:

```bash
pb lib add my-template
```

Templates are stored in:
```
.promptbrain/
└── templates/
    ├── system/          # PBCLI built-in
    ├── framework/       # Auto-loaded based on detection
    └── user/            # Your custom templates
```

## Best Practices

### 1. Initialize Early

Run `pb init` when starting a new project:
```bash
npx create-next-app my-app
cd my-app
pb init
```

### 2. Re-initialize After Major Changes

After adding new frameworks:
```bash
npm install @supabase/supabase-js
pb init  # Re-detects and updates
```

### 3. Check Detection

Verify what was detected:
```bash
cat .promptbrain/project.json
```

### 4. Use Framework-Aware Commands

Let PBCLI optimize for your stack:
```bash
pb enhance "create a new component"
# Automatically uses React/Next.js patterns
```

## Troubleshooting

### Framework Not Detected

**Problem:** PBCLI didn't detect your framework

**Solutions:**
1. Ensure `package.json` exists
2. Check framework package is installed
3. Run `pb init` again
4. Manually edit `.promptbrain/project.json`

### Wrong Project Type

**Problem:** Project classified incorrectly

**Solution:**
Edit `.promptbrain/config.json`:
```json
{
  "projectInfo": {
    "projectType": "Your Correct Type"
  }
}
```

### Missing Dependencies

**Problem:** Some dependencies not detected

**Solution:**
Run `npm install` first, then `pb init`

## Advanced Usage

### Multi-Project Workspaces

For monorepos:
```bash
# Initialize each project
cd packages/web
pb init

cd ../api
pb init

cd ../mobile
pb init
```

Each project gets its own `.promptbrain/` directory.

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
- name: Initialize PBCLI
  run: pb init --json > project-info.json

- name: Use project info
  run: |
    PROJECT_TYPE=$(jq -r '.data.projectInfo.projectType' project-info.json)
    echo "Detected: $PROJECT_TYPE"
```

### Custom Detection Logic

Extend detection in your project:
```typescript
// scripts/detect-custom.ts
import { detectProject } from 'promptbrain-cli/lib/project-detector';

const projectInfo = await detectProject();

// Add custom logic
if (projectInfo.dependencies['my-custom-framework']) {
  projectInfo.frameworks.push('My Custom Framework');
}

// Save
await saveProjectInfo(projectInfo);
```

## Performance

- **Detection Time:** <100ms for typical projects
- **File System Reads:** Minimal (only package.json and lock files)
- **Memory Usage:** <5MB
- **Cache:** Results cached in `.promptbrain/project.json`

## Future Enhancements

1. **More Frameworks** - Qwik, SolidJS, etc.
2. **Monorepo Support** - Turborepo, Nx detection
3. **Docker Detection** - Dockerfile analysis
4. **Database Detection** - PostgreSQL, MongoDB, etc.
5. **Cloud Platform Detection** - Vercel, AWS, etc.
6. **Git Integration** - Branch-specific configs
7. **Team Sharing** - Shared project configs
8. **Auto-Update** - Re-detect on dependency changes

## Support

- **Documentation**: https://promptbrain.io/docs/project-detection
- **Discord**: https://discord.gg/promptbrain
- **Issues**: https://github.com/promptbrain/cli/issues

## References

- [Framework Detection Patterns](https://promptbrain.io/docs/frameworks)
- [Template System](https://promptbrain.io/docs/templates)
- [Configuration Guide](https://promptbrain.io/docs/configuration)
