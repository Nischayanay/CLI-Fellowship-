# PromptBrain CLI (PBCLI)

Official CLI tool for interacting with the PromptBrain Context Engine.

**World-class developer experience with intelligent project detection and behavioral psychology-driven UX.**

## Installation

### npm (Recommended for all platforms)

```bash
npm install -g promptbrain-cli
```

### Homebrew (macOS)

```bash
brew tap promptbrain/tap
brew install pb
```

### From Source

```bash
git clone https://github.com/promptbrain/cli.git
cd cli
npm install
npm run build
npm link
```

**Verify installation:**
```bash
pb --version
pb doctor
```

For detailed installation instructions, see [Installation Guide](./docs/INSTALL.md).

## Features

### 🎨 World-Class UX

- **Auto-Suggestions** - "Did you mean?" for mistyped commands
- **Rich Help Pages** - Comprehensive documentation for every command
- **Smart Error Messages** - Contextual, helpful, non-hostile errors
- **Intelligent Tips** - Token savings, memory hits, cross-app context
- **Color Psychology** - Psychologically optimized palette for developer delight
- **Onboarding Flow** - Beautiful first-run experience

### 🚀 Intelligent Project Detection

- **Auto-Detects Frameworks** - Next.js, React, Supabase, and 20+ more
- **Smart Templates** - Framework-specific optimizations
- **Context-Aware** - Knows your tech stack
- **One Command Setup** - `pb init` configures everything

### 💡 Behavioral Psychology

- **Positive Reinforcement** - Celebrate token savings and efficiency
- **Habit Formation** - Immediate feedback and progress visibility
- **Trust Building** - Transparent operations and safe defaults

See [UX Polish Guide](./docs/UX_POLISH.md) and [Project Detection Guide](./docs/PROJECT_DETECTION.md) for details.

## Quick Start

```bash
# Create a new account (first time users)
pb signup

# Or login to existing account
pb login

# Initialize your project (auto-detects frameworks)
pb init

# Enhance a prompt
pb enhance "create a React component"

# Check system health
pb doctor
```

## Authentication

PBCLI supports two authentication methods:

### Session-Based Authentication (Default)

**New users:**
```bash
pb signup
```

Create a new account directly from the CLI. You'll be prompted for:
- Email address
- Password (minimum 8 characters)
- Full name (optional)

**Existing users:**
```bash
pb login
```

Login with your email and password. Your session token will be stored securely in your OS keychain.

### API Key Authentication (Recommended for CI/CD)

For programmatic access and CI/CD environments, you can use API keys:

```bash
# Create a new API key
pb api key create

# List your API keys
pb api key list

# Revoke an API key
pb api key revoke <key-id>
```

API keys are stored securely in your OS keychain with an encrypted filesystem backup. The CLI automatically uses API keys when available, falling back to session tokens if no API key is present.

**Security Best Practices:**
- API keys are displayed in full only once during creation
- Keys are never logged, even in debug mode
- Store keys securely and rotate them regularly
- Revoke compromised keys immediately

## Updating

Keep PBCLI up to date with the latest features and bug fixes:

```bash
pb update
```

**Check for updates without installing:**
```bash
pb update --check
```

**Manual update methods:**
```bash
# npm
npm update -g promptbrain-cli

# Homebrew
brew upgrade pb
```

For more details, see [Update Guide](./docs/UPDATE.md).

## Commands

### `pb signup`

Create a new PromptBrain account directly from the CLI.

```bash
pb signup

# Or provide details upfront
pb signup --email user@example.com --name "Your Name"
```

**Features:**
- Email validation
- Password strength requirements (min 8 characters)
- Optional full name
- Automatic login after signup (if email confirmation not required)
- Clear error messages for existing accounts

### `pb login`

Login to your existing PromptBrain account.

```bash
pb login

# Or provide credentials upfront
pb login --email user@example.com
```

### `pb whoami`

Displays your current user information, plan details, and quota usage.

```bash
pb whoami
```

### `pb usage`

Check your API usage and remaining quota.

```bash
pb usage

# Output as JSON
pb usage --json
```

Shows:
- Daily requests made and limit
- Current plan (Free, Pro, Builder)
- Usage percentage
- Time until quota reset
- Warnings when approaching limits

### `pb quota`

View quota limits for your current plan.

```bash
pb quota
```

Displays:
- Current plan details
- Daily request limits
- Time until next reset
- Upgrade information for Free plan users

### `pb billing open`

Open the Stripe billing portal to manage your subscription and payment methods.

```bash
pb billing open
```

This command:
- Opens the billing portal in your default browser
- Allows you to update payment methods
- Manage your subscription
- View billing history

### `pb enhance "<prompt>"`

Enhances a prompt using the Context Engine.

```bash
pb enhance "Fix this bug in my react app"
```

### `pb init`

Initializes PromptBrain in your current project directory. Detects the framework (Next.js, React, etc.) and sets up configuration.

```bash
pb init
```

### `pb link <provider>`

Links external integrations to your PromptBrain account.

**Available providers:**
- `notion` - Link your Notion workspace
- `cursor` - Link your Cursor IDE
- `list` - View all integrations and their status

```bash
# Link Notion
pb link notion

# Link Cursor
pb link cursor

# List all integrations
pb link list
```

**How it works:**
1. Opens your browser for OAuth authorization
2. You approve the connection
3. CLI automatically detects completion
4. No OAuth tokens stored locally (only session confirmation)

For detailed documentation, see [LINK_COMMANDS.md](./LINK_COMMANDS.md).

## Plans and Pricing

PBCLI supports three subscription tiers:

- **Free Plan**: 50 requests per day
- **Pro Plan**: Unlimited requests
- **Builder Plan**: Unlimited requests + advanced features

Check your current usage with `pb usage` and upgrade at [https://promptbrain.io/pricing](https://promptbrain.io/pricing).

## Error Handling

PBCLI provides intelligent error handling:

- **Quota Exceeded (402)**: Shows time until reset and upgrade options
- **Payment Required (402)**: Offers to open billing portal
- **Authentication Failed (401)**: Suggests re-authentication
- **Rate Limited (429)**: Automatically retries with backoff
- **Server Errors (5xx)**: Retries up to 3 times with exponential backoff

## Troubleshooting

- **Login fails**: Ensure port 4783 is not in use.
- **Quota exceeded**: Check `pb usage` and upgrade your plan with `pb billing open`.
- **Permission errors**: Try running with `sudo` if you have issues with global installation (though not recommended for `pb login` due to keychain access).
- **API key not working**: Verify the key exists with `pb api key list` or create a new one with `pb api key create`.
- **Network errors**: The CLI automatically retries failed requests. Check your internet connection if issues persist.

## PB Library (Templates)

PBCLI includes a template system to manage prompt templates.

- `pb lib list`: List all available templates.
- `pb lib add`: Add a new custom template.
- `pb lib remove <name>`: Remove a custom template.

See [docs/phase2-pbcli-templates.md](docs/phase2-pbcli-templates.md) for more details.

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run specific test
npx mocha test/lib/templateLoader.test.ts
```

### Building
```bash
npm run build
```

Built with [oclif](https://oclif.io) and TypeScript.

```bash
npm run build   # Build the project
npm test        # Run tests
```
