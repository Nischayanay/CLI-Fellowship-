# PromptBrain CLI - Testing Guide

**Test User:** anayb.dhamma@gmail.com  
**Date:** December 4, 2024  
**Purpose:** Comprehensive testing of all CLI commands and integrations

---

## Quick Start

### Option 1: Interactive Test (Recommended)
```bash
node interactive-test.js
```
This script guides you through each test step-by-step with prompts.

### Option 2: Automated Test
```bash
./test-all-commands.sh
```
This script runs all tests automatically (requires manual OAuth approvals).

### Option 3: Manual Testing
Follow the test plan in `TEST_PLAN.md` for detailed manual testing.

---

## Test Files

1. **`interactive-test.js`** - Interactive test suite with user prompts
2. **`test-all-commands.sh`** - Automated bash script for all commands
3. **`TEST_PLAN.md`** - Comprehensive test plan with expected results
4. **`TESTING_GUIDE.md`** - This file - quick reference

---

## Pre-Test Checklist

- [ ] Node.js installed (v12+)
- [ ] npm installed
- [ ] Internet connection active
- [ ] Test user credentials ready: `anayb.dhamma@gmail.com`
- [ ] Browser available for OAuth flows
- [ ] (Optional) ChatGPT export file ready

---

## Test Sequence

### 1. Setup & Build
```bash
npm run build
npm link
pb --version
```

### 2. Authentication
```bash
pb login --email anayb.dhamma@gmail.com
pb whoami
```

### 3. System Health
```bash
pb doctor
pb health
pb usage
pb quota
```

### 4. Integration Linking

#### Before Linking
```bash
pb link list
```

#### Link Notion
```bash
pb link notion
```
- Opens browser for OAuth
- Approve Notion workspace access
- CLI confirms success

#### Link Cursor
```bash
pb link cursor
```
- Opens browser for OAuth
- Approve Cursor IDE access
- CLI confirms success

#### Link Figma
```bash
pb link figma
```
- Opens browser for OAuth
- Approve Figma access
- Select projects to sync
- Track ingestion progress

**Variations:**
```bash
pb link figma --all                    # Sync all projects
pb link figma --projects proj1,proj2   # Sync specific projects
```

#### Link ChatGPT
```bash
pb link chatgpt --file ~/Downloads/conversations.json
```
- Requires export file from chat.openai.com
- Validates file format
- Imports conversations
- Tracks ingestion progress

#### After Linking
```bash
pb link list
pb link list --verbose
pb link list --json
```

### 5. API Key Management
```bash
pb api key list
pb api key create
pb api key list
```

### 6. Core Functionality
```bash
# Enhance prompts
pb enhance "Create a React component for user authentication"
pb enhance "Fix bug in my Next.js API route"

# Get project context
pb devsync

# Initialize project
pb init
```

### 7. Templates
```bash
pb lib list
```

### 8. Billing
```bash
pb billing open
```

### 9. Updates
```bash
pb update --check
```

---

## Integration Testing Details

### Notion Integration

**What to Test:**
- OAuth flow completes
- Workspace pages are synced
- Context available in enhance commands

**Verification:**
```bash
pb link list --verbose
# Should show: Notion connected, items synced, last sync time
```

**Test Context:**
```bash
pb enhance "Summarize my project documentation"
# Should use Notion pages as context
```

---

### Figma Integration

**What to Test:**
- OAuth flow completes
- Projects listed correctly
- Interactive selection works
- Ingestion progress tracked
- Design specs indexed

**Verification:**
```bash
pb link list --verbose
# Should show: Figma connected, projects synced, last sync time
```

**Test Context:**
```bash
pb enhance "Create a component matching our design system"
# Should use Figma designs as context
```

---

### Cursor Integration

**What to Test:**
- OAuth flow completes
- IDE connection established
- Code context available

**Verification:**
```bash
pb link list --verbose
# Should show: Cursor connected
```

---

### ChatGPT Integration

**What to Test:**
- File validation works
- Conversations parsed correctly
- Ingestion completes
- History searchable

**Verification:**
```bash
pb link list --verbose
# Should show: ChatGPT connected, conversations imported
```

**Test Context:**
```bash
pb devsync
# Should include relevant ChatGPT conversations
```

---

## Expected Outputs

### pb whoami
```
👤 User Information

Email: anayb.dhamma@gmail.com
Plan: [Free/Pro/Builder]
User ID: [uuid]

📊 Usage
Daily requests: X / Y
Quota resets: in X hours
```

### pb usage
```
📊 API Usage

Daily Usage: X / Y requests
Plan: [Free/Pro/Builder]
Quota resets: [timestamp]
```

### pb link list
```
📋 Fetching your integrations...

Your Integrations:

📝 Notion: ✓ connected (connected 12/04/2024)
   Last synced: 2 hours ago
   Items indexed: 45

💻 Cursor: ✓ connected (connected 12/04/2024)
   Last synced: 1 hour ago

🎨 Figma: ✓ connected (connected 12/04/2024)
   Last synced: 30 minutes ago
   Items indexed: 12

🤖 ChatGPT: ✓ connected (connected 12/04/2024)
   Last synced: 1 hour ago
   Items indexed: 150
```

### pb doctor
```
🏥 PromptBrain CLI Health Check

✓ CLI Version: 0.1.5
✓ Node.js: v18.x.x
✓ Authentication: Logged in as anayb.dhamma@gmail.com
✓ API Connection: Connected
✓ Integrations: 4 connected

Everything looks good! 🎉
```

---

## Troubleshooting

### OAuth Flow Issues

**Problem:** Browser doesn't open
```bash
# CLI will display URL manually
# Copy and paste into browser
```

**Problem:** Authorization timeout
```bash
# Complete OAuth within 5 minutes
# If timeout, run command again
```

### Authentication Issues

**Problem:** Login fails
```bash
# Verify credentials
# Check network connection
pb doctor
```

**Problem:** Token expired
```bash
# CLI auto-refreshes tokens
# If issues persist, re-login
pb logout
pb login
```

### Integration Issues

**Problem:** Sync fails
```bash
# Check integration status
pb link list --verbose

# Re-link if needed
pb link [provider]
```

**Problem:** No context in enhance
```bash
# Verify integration is synced
pb link list

# Wait for sync to complete
# Check sync status shows "idle" not "syncing"
```

---

## Test Results Template

### Test Session Info
- **Date:** ___________
- **Tester:** ___________
- **CLI Version:** ___________
- **Test Duration:** ___________

### Results

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Authentication | 3 | ☐ | ☐ | |
| Usage & Quota | 3 | ☐ | ☐ | |
| System Health | 2 | ☐ | ☐ | |
| Integrations | 4 | ☐ | ☐ | |
| API Keys | 3 | ☐ | ☐ | |
| Core Features | 3 | ☐ | ☐ | |
| Templates | 1 | ☐ | ☐ | |
| Billing | 1 | ☐ | ☐ | |
| Updates | 1 | ☐ | ☐ | |

### Integration Status

- [ ] Notion: Connected and syncing
- [ ] Cursor: Connected and syncing
- [ ] Figma: Connected and syncing
- [ ] ChatGPT: Connected and syncing

### Issues Found

1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### Recommendations

1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

---

## Backend API Endpoints Tested

- [x] POST /api/auth/login
- [x] POST /api/auth/refresh
- [x] GET /billing/usage
- [x] GET /billing/portal
- [x] POST /cli/link/start
- [x] GET /integrations/list
- [x] GET /integrations/{provider}/progress
- [x] POST /integrations/{provider}/ingest
- [x] POST /devsync
- [x] GET /health
- [x] POST /auth/api-key
- [x] GET /auth/api-key
- [x] DELETE /auth/api-key/{id}

---

## Performance Metrics

Track these during testing:

- **Login time:** _____ seconds
- **OAuth flow time:** _____ seconds per integration
- **Enhance response time:** _____ seconds
- **Devsync response time:** _____ seconds
- **Figma ingestion time:** _____ minutes for _____ projects
- **ChatGPT ingestion time:** _____ minutes for _____ conversations

---

## Security Checklist

- [ ] Session tokens stored in keychain (not plaintext)
- [ ] API keys masked in list output
- [ ] No tokens in debug logs
- [ ] OAuth tokens not stored locally
- [ ] HTTPS used for all API calls
- [ ] Sensitive data not logged

---

## Next Steps After Testing

1. **Document Issues:** Create GitHub issues for any bugs found
2. **Verify Sync:** Check all integrations are syncing properly
3. **Test Context Quality:** Verify enhance commands use integration context
4. **Monitor Performance:** Check backend API response times
5. **User Feedback:** Gather feedback on UX and error messages

---

## Support

If you encounter issues during testing:

1. Check `pb doctor` output
2. Review logs in debug mode: `pb [command] --debug`
3. Check integration status: `pb link list --verbose`
4. Verify network connectivity
5. Contact support with request ID from error messages

---

## Quick Commands Reference

```bash
# Authentication
pb login --email anayb.dhamma@gmail.com
pb whoami
pb logout

# Usage
pb usage
pb quota

# Integrations
pb link list
pb link notion
pb link cursor
pb link figma
pb link chatgpt --file <file>

# API Keys
pb api key list
pb api key create
pb api key revoke <id>

# Core Features
pb enhance "<prompt>"
pb devsync
pb init

# System
pb doctor
pb health
pb update --check

# Billing
pb billing open

# Templates
pb lib list
```

---

**Happy Testing! 🚀**
