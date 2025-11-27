# Design Document

## Overview

PHASE-3D completes PBCLI's transformation into a production-ready, globally distributed CLI tool. This phase implements three critical systems: (D1) Professional installer and distribution infrastructure, (D2) UX consistency enforcement across all commands, and (D3) Intelligent project detection with automatic template loading.

The design ensures PBCLI matches industry standards set by Vercel CLI, Supabase CLI, and Stripe CLI while maintaining security, reliability, and an exceptional developer experience.

## Architecture

### High-Level Structure

```
PBCLI Distribution & Intelligence
├── D1: Installer System
│   ├── npm Global Package
│   ├── Homebrew Tap & Formula
│   ├── Update Command
│   ├── Version Checker
│   └── GitHub Release Workflow
├── D2: UX Integration
│   ├── Command Consistency
│   ├── JSON Output Everywhere
│   ├── Brand Identity
│   └── Reinforcement UX
└── D3: Project Detection
    ├── Enhanced project-detector
    ├── Init Command Integration
    ├── Template Auto-loading
    └── Framework-Specific Tips
```

### Design Principles

1. **Zero Breaking Changes**: All existing functionality preserved
2. **Security First**: Checksum verification, no secret storage
3. **Developer Experience**: 5-second install, automatic updates
4. **Brand Consistency**: PB identity throughout
5. **Intelligence**: Context-aware assistance

## Components and Interfaces

### 1. Version Checker Module (`src/lib/version-checker.ts`)

Checks for updates and notifies users.

```typescript
interface VersionInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
  releaseUrl: string;
  changelog?: string;
}

interface VersionChecker {
  // Check for updates
  checkForUpdates(): Promise<VersionInfo>;
  
  // Get latest version from GitHub
  getLatestVersion(): Promise<string>;
  
  // Compare versions
  isNewer(latest: string, current: string): boolean;
  
  // Show update notification
  showUpdateNotification(info: VersionInfo): void;
  
  // Check if should notify (once per day)
  shouldCheckForUpdates(): boolean;
  
  // Update last check timestamp
  updateLastCheckTime(): Promise<void>;
}
```

### 2. Update Command (`src/commands/update.ts`)

Handles self-updates.

```typescript
interface UpdateCommand {
  // Main update flow
  run(): Promise<void>;
  
  // Check for updates
  checkUpdates(): Promise<VersionInfo>;
  
  // Download latest version
  downloadUpdate(url: string): Promise<string>;
  
  // Verify checksum
  verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean>;
  
  // Install update
  installUpdate(filePath: string): Promise<void>;
  
  // Show progress
  showProgress(current: number, total: number): void;
}
```

### 3. Enhanced Project Detector (`src/utils/project-detector.ts`)

Extended framework detection.

```typescript
interface ProjectInfo {
  framework: string;
  version?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  hasSupabase: boolean;
  hasDatabase: boolean;
  configFiles: string[];
}

interface ProjectDetector {
  // Detect project framework
  detect(directory: string): Promise<ProjectInfo | null>;
  
  // Individual framework detectors
  detectNextJS(directory: string): Promise<boolean>;
  detectRemix(directory: string): Promise<boolean>;
  detectNuxt(directory: string): Promise<boolean>;
  detectLaravel(directory: string): Promise<boolean>;
  detectFastAPI(directory: string): Promise<boolean>;
  detectVite(directory: string): Promise<boolean>;
  detectAstro(directory: string): Promise<boolean>;
  
  // Get recommended templates
  getRecommendedTemplates(framework: string): string[];
  
  // Get framework-specific tips
  getFrameworkTips(framework: string): string[];
}
```

### 4. Template Auto-Loader (`src/lib/template-loader.ts`)

Automatic template selection and loading.

```typescript
interface TemplateLoader {
  // Load templates based on project
  loadForProject(projectInfo: ProjectInfo): Promise<string[]>;
  
  // Copy system templates to user directory
  copyTemplates(templates: string[], destination: string): Promise<void>;
  
  // Get template metadata
  getTemplateMetadata(templateName: string): TemplateMetadata;
  
  // Check if templates exist
  templatesExist(templates: string[]): boolean;
}

interface TemplateMetadata {
  name: string;
  framework: string;
  category: string;
  description: string;
}
```

### 5. Homebrew Formula Generator (`scripts/generate-formula.ts`)

Generates Homebrew formula.

```typescript
interface FormulaGenerator {
  // Generate formula file
  generate(version: string, checksums: Checksums): string;
  
  // Get download URLs
  getDownloadUrls(version: string): DownloadUrls;
  
  // Calculate checksums
  calculateChecksums(files: string[]): Promise<Checksums>;
  
  // Write formula to file
  writeFormula(formula: string, outputPath: string): Promise<void>;
}

interface Checksums {
  darwin_arm64: string;
  darwin_x64: string;
  linux_x64: string;
}

interface DownloadUrls {
  darwin_arm64: string;
  darwin_x64: string;
  linux_x64: string;
}
```

### 6. Release Workflow (`.github/workflows/release.yml`)

Automated release process.

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    # Build for all platforms
  release:
    # Create GitHub release
  homebrew:
    # Update Homebrew formula
```

## Data Models

### Version Information

```typescript
interface VersionInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
  releaseUrl: string;
  changelog?: string;
  publishedAt: string;
}
```

### Project Configuration

```typescript
interface ProjectConfig {
  framework: string;
  version: string;
  templates: string[];
  detectedAt: string;
  packageManager: string;
  features: {
    hasSupabase: boolean;
    hasDatabase: boolean;
    hasAuth: boolean;
  };
}
```

### Update Metadata

```typescript
interface UpdateMetadata {
  lastCheckTime: number;
  lastNotifiedVersion: string;
  updateCheckEnabled: boolean;
}
```

## Implementation Details

### D1: Installer System

#### npm Global Installation

**package.json Configuration:**
```json
{
  "name": "promptbrain-cli",
  "version": "0.1.0",
  "bin": {
    "pb": "./bin/pb"
  },
  "files": [
    "/bin",
    "/dist",
    "/oclif.manifest.json"
  ],
  "preferGlobal": true
}
```

**Build Process:**
1. TypeScript compilation to `dist/`
2. Copy templates to `dist/lib/templates/`
3. Generate oclif manifest
4. Ensure `bin/pb` is executable

#### Homebrew Distribution

**Formula Structure:**
```ruby
class Pb < Formula
  desc "PromptBrain CLI - AI-powered prompt enhancement"
  homepage "https://promptbrain.io"
  version "0.1.0"
  
  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/promptbrain/cli/releases/download/v0.1.0/pb-darwin-arm64.tar.gz"
      sha256 "..."
    else
      url "https://github.com/promptbrain/cli/releases/download/v0.1.0/pb-darwin-x64.tar.gz"
      sha256 "..."
    end
  end
  
  on_linux do
    url "https://github.com/promptbrain/cli/releases/download/v0.1.0/pb-linux-x64.tar.gz"
    sha256 "..."
  end
  
  def install
    bin.install "pb"
  end
  
  test do
    system "#{bin}/pb", "--version"
  end
end
```

#### Update Command Flow

1. **Check for Updates**
   - Fetch latest release from GitHub API
   - Compare with current version using semver
   - Display changelog if available

2. **Download Update**
   - Determine platform (darwin/linux, arm64/x64)
   - Download appropriate tarball
   - Show progress bar during download

3. **Verify Integrity**
   - Calculate SHA-256 checksum
   - Compare with published checksum
   - Abort if mismatch

4. **Install Update**
   - Extract tarball to temp directory
   - Replace current installation
   - Verify new installation works
   - Clean up temp files

5. **Post-Update**
   - Display success message
   - Show new version number
   - Display reinforcement UX

### D2: UX Integration

#### Command Consistency Checklist

All commands must:
- Use `colors` module for all colored output
- Support `--json` flag for structured output
- Use `ui` module for messages (tip, headsUp, goodNews, done)
- Use `progress` module for long operations
- Display reinforcement metrics where applicable
- Follow spacing rules (1 blank line between sections)

#### JSON Output Standard

```typescript
interface CommandOutput {
  status: 'success' | 'error';
  timestamp: string;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    processingTime?: number;
    [key: string]: any;
  };
}
```

### D3: Project Detection

#### Framework Detection Logic

**Next.js:**
- Check for `next.config.js` or `next.config.mjs`
- Check for `pages/` or `app/` directory
- Check for `next` in dependencies

**Remix:**
- Check for `remix.config.js`
- Check for `@remix-run/` packages in dependencies

**Nuxt:**
- Check for `nuxt.config.ts` or `nuxt.config.js`
- Check for `nuxt` in dependencies

**Laravel:**
- Check for `artisan` file
- Check for `composer.json` with `laravel/framework`

**FastAPI:**
- Check for `main.py` with FastAPI imports
- Check for `fastapi` in `requirements.txt` or `pyproject.toml`

**Vite:**
- Check for `vite.config.js` or `vite.config.ts`
- Check for `vite` in dependencies

**Astro:**
- Check for `astro.config.mjs`
- Check for `astro` in dependencies

#### Template Mapping

```typescript
const FRAMEWORK_TEMPLATES: Record<string, string[]> = {
  'nextjs': ['nextjs-api-route', 'nextjs-component', 'nextjs-page'],
  'remix': ['remix-loader', 'remix-action', 'remix-route'],
  'nuxt': ['nuxt-composable', 'nuxt-page', 'nuxt-api'],
  'laravel': ['laravel-controller', 'laravel-model', 'laravel-migration'],
  'fastapi': ['fastapi-endpoint', 'fastapi-model', 'fastapi-router'],
  'vite': ['vite-component', 'vite-config'],
  'astro': ['astro-component', 'astro-page'],
};
```

#### Framework Tips

```typescript
const FRAMEWORK_TIPS: Record<string, string[]> = {
  'nextjs': [
    'Try: pb enhance "create Next.js API route"',
    'Try: pb devsync for context-aware development',
    'Templates loaded: nextjs-api-route, nextjs-component, nextjs-page',
  ],
  'remix': [
    'Try: pb enhance "create Remix loader"',
    'Try: pb devsync for Remix-specific context',
  ],
  // ... more frameworks
};
```

## Error Handling

### Update Command Errors

**Scenario**: Network failure during download
- **Handling**: Retry up to 3 times with exponential backoff
- **Fallback**: Show error with suggestion to try again later
- **User Impact**: Clear error message, no partial installation

**Scenario**: Checksum mismatch
- **Handling**: Delete downloaded file, show error
- **Fallback**: Suggest checking internet connection
- **User Impact**: Installation aborted safely

**Scenario**: Insufficient permissions
- **Handling**: Detect permission error
- **Fallback**: Suggest using sudo or reinstalling via Homebrew
- **User Impact**: Clear instructions for resolution

### Project Detection Errors

**Scenario**: Multiple frameworks detected
- **Handling**: Show all detected frameworks
- **Fallback**: Ask user to choose primary framework
- **User Impact**: User makes informed choice

**Scenario**: No framework detected
- **Handling**: Proceed with generic initialization
- **Fallback**: Offer manual framework selection
- **User Impact**: Still functional, just less automated

## Testing Strategy

### Unit Tests

1. **Version Checker Tests**
   - Test version comparison logic
   - Test update notification display
   - Test last check time tracking

2. **Project Detector Tests**
   - Test each framework detection
   - Test with sample project structures
   - Test edge cases (multiple frameworks)

3. **Template Loader Tests**
   - Test template copying
   - Test template existence checks
   - Test metadata retrieval

### Integration Tests

1. **Update Command Tests**
   - Test full update flow (mocked downloads)
   - Test checksum verification
   - Test rollback on failure

2. **Init Command Tests**
   - Test with various project types
   - Test template loading
   - Test config file creation

### Manual Testing

1. **Installation Testing**
   - Test npm global install on macOS, Linux, Windows
   - Test Homebrew install on macOS
   - Verify `pb` command available globally

2. **Update Testing**
   - Test update from older version
   - Test update with network interruption
   - Test update with invalid checksum

3. **Detection Testing**
   - Test in Next.js project
   - Test in Remix project
   - Test in Laravel project
   - Test in empty directory

## Security Considerations

### Checksum Verification

- Use SHA-256 for all downloads
- Verify before extraction
- Abort on mismatch

### Permission Model

- Never require sudo for updates (except Homebrew)
- Write only to ~/.pb for user data
- Homebrew manages its own permissions

### Secret Management

- No secrets in installer scripts
- No global token storage
- Use keytar for secure credential storage

## Performance Considerations

- Version checks cached for 24 hours
- Background checks don't block commands
- Project detection cached per directory
- Template loading is lazy (only when needed)

## Documentation Structure

### INSTALL.md
- npm installation instructions
- Homebrew installation instructions
- Windows installation (via npm)
- Verification steps

### UPDATE.md
- Using `pb update` command
- Manual update process
- Troubleshooting update issues

### HOMEBREW.md
- Setting up the tap
- Installing via Homebrew
- Updating via Homebrew
- Uninstalling

### AUTO-DETECTION.md
- How project detection works
- Supported frameworks
- Manual framework selection
- Template customization

### RELEASE_WORKFLOW.md
- Creating a new release
- GitHub Actions workflow
- Homebrew formula update
- Versioning strategy

## Future Enhancements

1. **Binary Distribution**: Compile to native binaries with pkg or nexe
2. **Auto-Update**: Silent background updates with user consent
3. **Plugin System**: Third-party framework detectors
4. **Cloud Sync**: Sync templates and config across machines
5. **Telemetry**: Anonymous usage analytics (opt-in)
