# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2024-11-30

### Added
- ✅ **Working signup and login!** Backend integration complete
- Secure backend proxy pattern for authentication

### Changed
- **BREAKING**: Auth endpoints now at `/api/auth/*` instead of `/auth/*`
- Signup/login use backend API proxy instead of direct Supabase calls
- Removed Supabase credentials from CLI (more secure)
- Backend handles all authentication with proper error handling

### Fixed
- Token refresh now uses backend API
- Improved error messages for auth failures
- Better handling of duplicate email errors

### Security
- ✅ No Supabase keys exposed in CLI code
- ✅ Backend proxy pattern for authentication
- ✅ Rate limiting and validation handled server-side
- ✅ Service role key stays server-side only

### Documentation
- Added `docs/BACKEND_AUTH_API.md` with endpoint specifications
- Added `SECURITY_AUDIT_REPORT.md` with complete security analysis
- Added `TODO_BEFORE_PUBLISH.md` with deployment checklist

## [0.1.4] - 2024-11-27

### Fixed
- **Critical**: Fixed double-echo issue in signup/login prompts
- Replaced custom prompt implementation with Node.js readline
- Email and password inputs now display correctly without duplication
- Improved input handling for both password (hidden) and text fields

## [0.1.3] - 2024-11-27

### Added
- **`pb signup` command** - New users can now create accounts directly from the CLI
  - Email validation
  - Password strength requirements (min 8 characters)
  - Optional full name field
  - Automatic login after successful signup
  - Clear error messages for duplicate accounts
  - Supabase integration for user management

### Changed
- Updated README with signup instructions
- Improved authentication documentation
- Enhanced Quick Start guide with signup flow

## [0.1.2] - 2024-11-27

### Fixed
- **Critical**: Include `/scripts` folder in npm package to fix postinstall error
- Users can now install without "MODULE_NOT_FOUND" error
- Welcome message now displays correctly after installation

### Changed
- Removed problematic `version` script that required oclif CLI

## [0.1.1] - 2024-11-27
*Skipped - version bump issue*

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
