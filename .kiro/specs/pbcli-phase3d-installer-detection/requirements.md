# Requirements Document

## Introduction

PHASE-3D completes the transformation of PBCLI into a world-class developer CLI tool by implementing a professional installer system, global distribution, automatic updates, and intelligent project detection. This phase ensures PBCLI matches the quality and developer experience of industry leaders like Vercel CLI, Supabase CLI, and Stripe CLI.

The implementation focuses on three core areas: (D1) Installer System for global distribution, (D2) UX Polish integration across all commands, and (D3) Project Auto-Detection for intelligent context-aware assistance.

## Glossary

- **PBCLI**: PromptBrain Command Line Interface, the client-side CLI tool
- **Homebrew**: Package manager for macOS and Linux
- **Homebrew Tap**: Custom repository for Homebrew formulas
- **Formula**: Homebrew package definition file
- **npm Global Install**: Installing a package globally via npm for system-wide access
- **GitHub Releases**: GitHub feature for distributing versioned software packages
- **Checksum**: Cryptographic hash for verifying file integrity
- **Project Detector**: Module that identifies framework and project type
- **Template Auto-loading**: Automatic selection of templates based on detected project
- **Context Metadata**: Additional information sent to backend about project context
- **Framework Detection**: Identifying the web framework used in a project
- **Version Checker**: Module that compares local and remote versions
- **Binary Distribution**: Compiled executable for direct installation
- **Semantic Versioning**: Version numbering scheme (MAJOR.MINOR.PATCH)

## Requirements

### Requirement 1: Global npm Installation

**User Story:** As a developer, I want to install PBCLI globally via npm, so that I can use it from anywhere on my system.

#### Acceptance Criteria

1. WHEN a developer runs `npm install -g promptbrain-cli` THEN the system SHALL install PBCLI globally
2. WHEN PBCLI is installed globally THEN the system SHALL make the `pb` command available in the PATH
3. WHEN a developer runs `pb --version` THEN the system SHALL display the current version number
4. WHEN PBCLI is built THEN the system SHALL generate runnable JavaScript files in the dist directory
5. WHEN package.json is configured THEN the system SHALL include a bin entry pointing to the executable

### Requirement 2: Homebrew Distribution

**User Story:** As a macOS or Linux developer, I want to install PBCLI via Homebrew, so that I can manage it alongside my other development tools.

#### Acceptance Criteria

1. WHEN a developer runs `brew tap promptbrain/tap` THEN the system SHALL add the PromptBrain Homebrew tap
2. WHEN a developer runs `brew install pb` THEN the system SHALL install PBCLI via Homebrew
3. WHEN a new version is released THEN the system SHALL automatically update the Homebrew formula
4. WHEN the formula is generated THEN the system SHALL include correct download URLs and checksums
5. WHEN Homebrew installs PBCLI THEN the system SHALL place the binary in the Homebrew bin directory

### Requirement 3: Automatic Updates

**User Story:** As a PBCLI user, I want to update to the latest version with a single command, so that I always have the newest features and fixes.

#### Acceptance Criteria

1. WHEN a user runs `pb update` THEN the system SHALL check for newer versions on GitHub releases
2. WHEN a newer version is available THEN the system SHALL display the version number and changelog
3. WHEN the user confirms the update THEN the system SHALL download the latest version
4. WHEN downloading updates THEN the system SHALL display a progress bar
5. WHEN the download completes THEN the system SHALL verify the checksum
6. WHEN the checksum is valid THEN the system SHALL replace the local installation
7. WHEN the update succeeds THEN the system SHALL display a success message with the new version

### Requirement 4: Version Checking

**User Story:** As a PBCLI user, I want to be notified when updates are available, so that I can stay current without manually checking.

#### Acceptance Criteria

1. WHEN PBCLI runs any command THEN the system SHALL check for updates in the background (max once per day)
2. WHEN a newer version is available THEN the system SHALL display a subtle notification
3. WHEN displaying the notification THEN the system SHALL not interrupt the current command
4. WHEN the version check fails THEN the system SHALL fail silently without errors
5. WHEN the user has disabled update checks THEN the system SHALL respect that preference

### Requirement 5: GitHub Release Workflow

**User Story:** As a maintainer, I want automated release workflows, so that new versions are distributed consistently and reliably.

#### Acceptance Criteria

1. WHEN a new version tag is pushed THEN the system SHALL trigger the release workflow
2. WHEN the workflow runs THEN the system SHALL build PBCLI for all platforms
3. WHEN builds complete THEN the system SHALL generate checksums for all artifacts
4. WHEN checksums are generated THEN the system SHALL create a GitHub release
5. WHEN the release is created THEN the system SHALL update the Homebrew formula automatically
6. WHEN the formula is updated THEN the system SHALL commit and push to the tap repository

### Requirement 6: Project Auto-Detection in Init

**User Story:** As a developer initializing PBCLI in my project, I want automatic framework detection, so that I get relevant templates without manual configuration.

#### Acceptance Criteria

1. WHEN a user runs `pb init` THEN the system SHALL detect the project framework
2. WHEN a framework is detected THEN the system SHALL display the detected framework name
3. WHEN displaying the detection THEN the system SHALL ask if the user wants to load recommended templates
4. WHEN the user confirms THEN the system SHALL copy appropriate templates from system to user directory
5. WHEN templates are copied THEN the system SHALL save detection metadata to .promptbrain/config.json
6. WHEN no framework is detected THEN the system SHALL proceed with generic initialization

### Requirement 7: Smart Template Auto-Loading

**User Story:** As a developer using PBCLI, I want templates to load automatically based on my project, so that I get relevant context without manual selection.

#### Acceptance Criteria

1. WHEN a user runs `pb enhance` or `pb devsync` THEN the system SHALL check for .promptbrain/config.json
2. WHEN config.json contains project metadata THEN the system SHALL preload matching templates
3. WHEN templates are preloaded THEN the system SHALL add context_metadata.project_framework to the backend payload
4. WHEN no config exists THEN the system SHALL proceed without auto-loading
5. WHEN auto-loading fails THEN the system SHALL fall back to manual template selection

### Requirement 8: Framework Detection Expansion

**User Story:** As a developer using various frameworks, I want PBCLI to recognize my project type, so that I get framework-specific assistance.

#### Acceptance Criteria

1. WHEN project-detector runs THEN the system SHALL detect Next.js projects
2. WHEN project-detector runs THEN the system SHALL detect Remix projects
3. WHEN project-detector runs THEN the system SHALL detect Nuxt projects
4. WHEN project-detector runs THEN the system SHALL detect Laravel projects
5. WHEN project-detector runs THEN the system SHALL detect FastAPI projects
6. WHEN project-detector runs THEN the system SHALL detect Supabase projects
7. WHEN project-detector runs THEN the system SHALL detect Vite projects
8. WHEN project-detector runs THEN the system SHALL detect Astro projects

### Requirement 9: Developer Assist Messages

**User Story:** As a developer entering a project for the first time, I want helpful tips based on my framework, so that I know how to use PBCLI effectively.

#### Acceptance Criteria

1. WHEN a framework is detected for the first time THEN the system SHALL display helpful tips
2. WHEN displaying tips THEN the system SHALL suggest relevant commands for the framework
3. WHEN displaying tips THEN the system SHALL use the new UI system for consistent formatting
4. WHEN tips are shown THEN the system SHALL not repeat them on subsequent runs
5. WHEN the user dismisses tips THEN the system SHALL remember the preference

### Requirement 10: UX Consistency Across All Commands

**User Story:** As a PBCLI user, I want consistent visual design across all commands, so that the CLI feels cohesive and professional.

#### Acceptance Criteria

1. WHEN any command runs THEN the system SHALL use the color system for all output
2. WHEN any command supports data output THEN the system SHALL support JSON mode via --json flag
3. WHEN installer messages are displayed THEN the system SHALL include the PB ASCII header
4. WHEN color-blind mode is enabled THEN the system SHALL respect it across all commands
5. WHEN reinforcement UX is applicable THEN the system SHALL display it after install and update
6. WHEN any command outputs text THEN the system SHALL use the UI layer instead of raw console.log

### Requirement 11: Security and Safety

**User Story:** As a security-conscious developer, I want PBCLI to handle updates and installations securely, so that my system remains protected.

#### Acceptance Criteria

1. WHEN downloading updates THEN the system SHALL verify checksums before installation
2. WHEN installing PBCLI THEN the system SHALL not store secrets in the installer
3. WHEN updating PBCLI THEN the system SHALL not write outside ~/.pb except for Homebrew installs
4. WHEN handling tokens THEN the system SHALL not store them globally
5. WHEN verifying checksums THEN the system SHALL use SHA-256 or stronger

### Requirement 12: Installation Documentation

**User Story:** As a new PBCLI user, I want clear installation instructions, so that I can get started quickly on any platform.

#### Acceptance Criteria

1. WHEN documentation is provided THEN the system SHALL include INSTALL.md with all installation methods
2. WHEN documentation is provided THEN the system SHALL include UPDATE.md with update instructions
3. WHEN documentation is provided THEN the system SHALL include HOMEBREW.md with tap setup
4. WHEN documentation is provided THEN the system SHALL include AUTO-DETECTION.md explaining project detection
5. WHEN documentation is provided THEN the system SHALL include RELEASE_WORKFLOW.md for maintainers
