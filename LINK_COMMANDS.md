# Link Commands Documentation

## Overview

The `pb link` commands allow you to connect external integrations to your PromptBrain account. These integrations enable seamless synchronization of your data across different platforms.

## Available Commands

### `pb link notion`

Links your Notion workspace to PromptBrain.

**Usage:**
```bash
pb link notion
```

**Flow:**
1. The CLI generates a unique session ID
2. Opens your default browser with the Notion OAuth authorization page
3. You approve the connection in your browser
4. The CLI automatically detects when authorization is complete
5. Displays a success message

**Example Output:**
```
🔗 Starting Notion authorization...
Opening browser for authorization...
⏳ Waiting for you to approve access...
(This may take a few moments)
✓ Notion linked successfully!
Your Notion workspace is now synced with PromptBrain.
```

**Notes:**
- You must be logged in (`pb login`) before linking integrations
- The authorization must be completed within 5 minutes
- No OAuth tokens are stored in the CLI - only session confirmation

---

### `pb link cursor`

Links your Cursor IDE to PromptBrain.

**Usage:**
```bash
pb link cursor
```

**Flow:**
1. The CLI generates a unique session ID
2. Opens your default browser with the Cursor OAuth authorization page
3. You approve the connection in your browser
4. The CLI automatically detects when authorization is complete
5. Displays a success message

**Example Output:**
```
🔗 Starting Cursor authorization...
Opening browser for authorization...
⏳ Waiting for you to approve access...
(This may take a few moments)
✓ Cursor linked successfully!
Your Cursor IDE is now connected to PromptBrain.
```

**Notes:**
- You must be logged in (`pb login`) before linking integrations
- The authorization must be completed within 5 minutes
- No OAuth tokens are stored in the CLI - only session confirmation

---

### `pb link list`

Lists all available integrations and their connection status.

**Usage:**
```bash
pb link list
```

**Example Output:**
```
📋 Fetching your integrations...

Your Integrations:

📝 Notion: ✓ connected (connected 11/22/2025)
💻 Cursor: not connected
🤖 ChatGPT: coming soon

To link an integration, run: pb link <provider>
Example: pb link notion
```

**Notes:**
- Shows all available integrations
- Indicates which ones are connected
- Displays connection date for linked integrations
- Shows "coming soon" for integrations in development

---

## Security & Privacy

### Token Storage
- **No OAuth tokens are stored in the CLI**
- Only the main PromptBrain session token is stored (using keytar for secure storage)
- OAuth tokens remain securely on the backend server
- CLI only receives confirmation that linking is complete

### Session Management
- Each link operation uses a temporary CLI session ID (UUID)
- Session IDs are only valid for the duration of the OAuth flow
- The backend maps CLI sessions to user accounts securely

### Authentication Flow
1. User must be logged in with `pb login`
2. CLI generates a unique session ID
3. Backend creates an OAuth URL tied to that session
4. User completes OAuth in browser
5. Backend associates the OAuth tokens with the user account
6. CLI polls to confirm completion (no tokens transferred)

---

## Troubleshooting

### "Authorization timed out"
- The OAuth flow must be completed within 5 minutes
- Try running the command again
- Make sure you complete the authorization in your browser

### "You must be logged in"
- Run `pb login` first to authenticate with PromptBrain
- Check your login status with `pb whoami`

### "Failed to open browser"
- The CLI will display the URL manually
- Copy and paste it into your browser
- Complete the authorization and the CLI will detect it

### Network Issues
- Ensure you have a stable internet connection
- Check if you can access the PromptBrain backend
- Try again after a few moments

---

## Technical Implementation

### Architecture
- **Browser Opening**: Uses the `open` package to launch the default browser
- **Polling**: Checks integration status every 2 seconds
- **Timeout**: 5-minute maximum for OAuth completion
- **Error Handling**: Comprehensive error messages for common issues

### API Endpoints
- `POST /cli/link/start` - Initiates OAuth flow
- `GET /integrations/list` - Lists user integrations (with optional cli_session for polling)

### Dependencies
- `uuid` - Generates unique CLI session IDs
- `chalk` - Colorful terminal output
- `open` - Opens URLs in the default browser
- `keytar` - Secure credential storage

---

## Examples

### Complete Workflow

```bash
# 1. Login to PromptBrain
pb login

# 2. Link Notion
pb link notion
# Browser opens, you approve, CLI confirms

# 3. Link Cursor
pb link cursor
# Browser opens, you approve, CLI confirms

# 4. Check your integrations
pb link list
# Shows both Notion and Cursor as connected
```

### Checking Status Before Linking

```bash
# First, check what's already connected
pb link list

# Then link what you need
pb link notion
```

---

## Future Integrations

The following integrations are planned:
- **ChatGPT** - Coming soon
- **GitHub** - Planned
- **Slack** - Planned
- **Linear** - Planned

Stay tuned for updates!
