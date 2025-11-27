# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-27

### Added
- Initial public release on npm
- Core CLI commands:
  - `pb login` - Session-based authentication
  - `pb logout` - Sign out from account
  - `pb whoami` - Display user information
  - `pb enhance` - Enhance prompts using Context Engine
  - `pb init` - Initialize project with auto-detection
  - `pb doctor` - System health check
  - `pb health` - API health status
  - `pb usage` - Check API usage and quota
  - `pb quota` - View plan limits
  - `pb update` - Update CLI to latest version
  - `pb config` - Manage CLI configuration
  - `pb devsync` - Developer sync utilities

- API Key Management:
  - `pb api key create` - Create new API keys
  - `pb api key list` - List all API keys
  - `pb api key revoke` - Revoke API keys

- Billing:
  - `pb billing open` - Open Stripe billing portal

- Integration Links:
  - `pb link notion` - Link Notion workspace
  - `pb link cursor` - Link Cursor IDE
  - `pb link chatgpt` - Link ChatGPT
  - `pb link figma` - Link Figma
  - `pb link list` - View all integrations

- Template Library:
  - `pb lib list` - List available templates
  - `pb lib add` - Add custom templates
  - `pb lib remove` - Remove custom templates

### Features
- Intelligent project detection (20+ frameworks)
- Auto-suggestions for mistyped commands
- Rich help pages with examples
- Smart error messages with context
- Token savings tracking
- Color psychology-optimized UI
- Secure credential storage (OS keychain)
- Automatic retry logic for network errors
- Offline queue for failed requests
- Progress tracking and reinforcement
- Behavioral psychology-driven UX

### Security
- API keys stored in OS keychain
- Encrypted filesystem backup
- Keys never logged in debug mode
- Session-based authentication support

### Infrastructure
- Built with oclif framework
- TypeScript codebase
- Comprehensive test suite (97 passing tests)
- Homebrew tap support
- npm global installation support

### Documentation
- Complete README with examples
- Installation guide
- Update guide
- UX polish documentation
- Project detection guide
- Release workflow documentation

---

## Release Notes

### How to Update
```bash
npm update -g promptbrain-cli
# or
pb update
```

### Breaking Changes
None - this is the initial release.

### Known Issues
- Some property-based tests failing (non-critical features)
- Template loader edge cases being addressed

---

[0.1.0]: https://github.com/promptbrain/cli/releases/tag/v0.1.0
