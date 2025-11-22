# PromptBrain CLI (PBCLI)

Official CLI tool for interacting with the PromptBrain Context Engine.

## Installation

```bash
npm install -g promptbrain-cli
# or link locally
git clone <repo>
cd promptbrain-cli
npm install
npm link
```

## Authentication

To start using the CLI, you need to log in.

```bash
pb login
```

This will open your browser to authenticate with PromptBrain. Once logged in, your session token will be stored securely in your OS keychain.

## Commands

### `pb login`

Logs you into the PromptBrain ecosystem.

### `pb whoami`

Displays your current user information, plan details, and quota usage.

```bash
pb whoami
```

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

## Troubleshooting

- **Login fails**: Ensure port 4783 is not in use.
- **Quota exceeded**: Upgrade your plan on the PromptBrain dashboard.
- **Permission errors**: Try running with `sudo` if you have issues with global installation (though not recommended for `pb login` due to keychain access).

## Development

Built with [oclif](https://oclif.io) and TypeScript.

```bash
npm run build   # Build the project
npm test        # Run tests
```
