# PromptBrain CLI - Comprehensive Test Plan

**Test Date:** December 4, 2024  
**Test User:** anayb.dhamma@gmail.com  
**CLI Version:** 0.1.5

## Test Overview

This document outlines a comprehensive testing plan for all PromptBrain CLI commands, with a focus on integration linking (Notion, Figma, Cursor, ChatGPT) and backend API functionality.

---

## Pre-Test Setup

### 1. Build & Link CLI
```bash
npm run build
npm link
```

### 2. Verify Installation
```bash
pb --version
pb --help
```

---

## Test Categories

### A. Authentication & User Management

#### A1. Login
```bash
pb login --email anayb.dhamma@gmail.com
```
**Expected:** Successful login with session token stored securely

#### A2. Whoami
```bash
pb whoami
```
**Expected:** Display user info, plan, and quota

#### A3. Logout
```bash
pb logout
```
**Expected:** Session cleared, user logged out

---

### B. Usage & Quota Management

#### B1. Usage Check
```bash
pb usage
```
**Expected:** Display daily usage, limit, and plan details

#### B2. Usage JSON Output
```bash
pb usage --json
```
**Expected:** JSON formatted usage data

#### B3. Quota Check
```bash
pb quota
```
**Expected:** Display quota limits and reset time

---

### C. Integration Linking

#### C1. List Integrations (Before Linking)
```bash
pb link list
pb link list --verbose
pb link list --json
```
**Expected:** Show all available integrations with "not connected" status

#### C2. Link Notion
```bash
pb link notion
```
**Flow:**
1. CLI generates unique session ID
2. Opens browser for OAuth
3. User approves in browser
4. CLI polls for completion
5. Success message displayed

**Expected:** Notion workspace linked successfully

#### C3. Link Cursor
```bash
pb link cursor
```
**Flow:** Same as Notion
**Expected:** Cursor IDE linked successfully

#### C4. Link Figma
```bash
pb link figma
```
**Flow:**
1. OAuth authorization
2. Fetch available projects
3. Interactive project selection
4. Start ingestion
5. Track progress

**Expected:** Figma projects synced and indexed

**Test Variations:**
```bash
# Sync all projects
pb link figma --all

# Sync specific projects
pb link figma --projects proj1,proj2
```

#### C5. Link ChatGPT
```bash
pb link chatgpt --file ~/Downloads/conversations.json
```
**Prerequisites:** Export ChatGPT history from chat.openai.com

**Flow:**
1. Validate export file
2. Parse conversations
3. Confirm with user
4. Start ingestion
5. Track progress

**Expected:** ChatGPT conversations imported and searchable

#### C6. List Integrations (After Linking)
```bash
pb link list
```
**Expected:** Show all integrations with "connected" status and sync details

---

### D. API Key Management

#### D1. List API Keys
```bash
pb api key list
```
**Expected:** Display all API keys with masked values

#### D2. Create API Key
```bash
pb api key create
```
**Expected:** New API key created and displayed (full key shown once)

#### D3. Revoke API Key
```bash
pb api key revoke <key-id>
```
**Expected:** API key revoked successfully

---

### E. Core Functionality

#### E1. Enhance Prompt
```bash
pb enhance "Create a React component for user authentication"
pb enhance "Fix bug in my Next.js API route"
pb enhance "Write a Python function to parse CSV files"
```
**Expected:** Enhanced prompts with context from linked integrations

#### E2. Devsync
```bash
pb devsync
```
**Expected:** Context from current project, git status, and linked integrations

#### E3. Init Project
```bash
pb init
```
**Expected:** Auto-detect framework and create .promptbrain config

---

### F. System Commands

#### F1. Doctor (Pre-login)
```bash
pb doctor
```
**Expected:** System health check, show not logged in

#### F2. Doctor (Post-login)
```bash
pb doctor
```
**Expected:** Full system health check with auth status

#### F3. Health Check
```bash
pb health
```
**Expected:** Backend API health status

#### F4. Update Check
```bash
pb update --check
```
**Expected:** Check for CLI updates without installing

---

### G. Template Library

#### G1. List Templates
```bash
pb lib list
```
**Expected:** Display all available templates

#### G2. Add Custom Template
```bash
pb lib add
```
**Expected:** Interactive template creation

#### G3. Remove Template
```bash
pb lib remove <name>
```
**Expected:** Template removed

---

### H. Billing

#### H1. Open Billing Portal
```bash
pb billing open
```
**Expected:** Opens Stripe billing portal in browser

---

## Integration-Specific Tests

### Notion Integration

**Test Cases:**
1. Link workspace
2. Verify pages are synced
3. Check sync status: `pb link list`
4. Use Notion context in enhance: `pb enhance "Summarize my project docs"`

**Expected Behavior:**
- OAuth flow completes successfully
- Pages indexed in background
- Context available in enhance commands

---

### Figma Integration

**Test Cases:**
1. Link Figma account
2. List available projects
3. Select projects to sync (interactive)
4. Sync all projects: `pb link figma --all`
5. Sync specific projects: `pb link figma --projects <ids>`
6. Track ingestion progress
7. Verify designs indexed

**Expected Behavior:**
- OAuth flow completes
- Projects listed with metadata
- Ingestion progress tracked
- Design specs available as context

---

### Cursor Integration

**Test Cases:**
1. Link Cursor IDE
2. Verify connection status
3. Check sync status

**Expected Behavior:**
- OAuth flow completes
- IDE connected
- Code context available

---

### ChatGPT Integration

**Test Cases:**
1. Export ChatGPT history from chat.openai.com
2. Validate export file format
3. Import conversations: `pb link chatgpt --file conversations.json`
4. Track ingestion progress
5. Search conversations in devsync

**Expected Behavior:**
- File validation passes
- Conversations parsed correctly
- Ingestion completes
- History searchable

---

## Error Handling Tests

### E1. Network Errors
```bash
# Disconnect network and run:
pb enhance "test prompt"
```
**Expected:** Clear error message about network connectivity

### E2. Authentication Errors
```bash
# Logout and run:
pb enhance "test prompt"
```
**Expected:** "You must be logged in" error with suggestion

### E3. Quota Exceeded
```bash
# After exceeding quota:
pb enhance "test prompt"
```
**Expected:** Quota exceeded message with upgrade link

### E4. Invalid Commands
```bash
pb invalid-command
```
**Expected:** "Did you mean?" suggestion

---

## Performance Tests

### P1. Large Prompt Enhancement
```bash
pb enhance "$(cat large-prompt.txt)"
```
**Expected:** Handles large prompts efficiently

### P2. Multiple Integrations
```bash
# With all integrations linked:
pb enhance "Create a feature using our design system"
```
**Expected:** Context from all sources combined

---

## Security Tests

### S1. Token Storage
```bash
# Check keychain storage (macOS)
security find-generic-password -s "promptbrain-cli"
```
**Expected:** Session token stored securely

### S2. API Key Masking
```bash
pb api key list
```
**Expected:** Keys displayed with masking (e.g., pb_***abc123)

### S3. No Token Logging
```bash
# Check logs don't contain tokens
pb enhance "test" --debug
```
**Expected:** No sensitive data in logs

---

## Backend API Tests

### API Endpoints to Test

1. **POST /api/auth/login** - Login
2. **POST /api/auth/refresh** - Token refresh
3. **GET /billing/usage** - Usage stats
4. **GET /billing/portal** - Billing portal URL
5. **POST /cli/link/start** - Start OAuth flow
6. **GET /integrations/list** - List integrations
7. **GET /integrations/{provider}/progress** - Sync progress
8. **POST /integrations/{provider}/ingest** - Start ingestion
9. **POST /devsync** - Get context
10. **GET /health** - Health check

---

## Test Execution Checklist

- [ ] Build CLI: `npm run build`
- [ ] Link CLI: `npm link`
- [ ] Verify version: `pb --version`
- [ ] Login: `pb login --email anayb.dhamma@gmail.com`
- [ ] Check whoami: `pb whoami`
- [ ] Check usage: `pb usage`
- [ ] List integrations: `pb link list`
- [ ] Link Notion: `pb link notion`
- [ ] Link Cursor: `pb link cursor`
- [ ] Link Figma: `pb link figma`
- [ ] Link ChatGPT: `pb link chatgpt --file <file>`
- [ ] Verify all linked: `pb link list`
- [ ] Create API key: `pb api key create`
- [ ] List API keys: `pb api key list`
- [ ] Test enhance: `pb enhance "test prompt"`
- [ ] Test devsync: `pb devsync`
- [ ] Run doctor: `pb doctor`
- [ ] Check health: `pb health`
- [ ] Open billing: `pb billing open`
- [ ] Check for updates: `pb update --check`

---

## Expected Results Summary

### Success Criteria

✅ All authentication commands work  
✅ All integrations link successfully  
✅ OAuth flows complete without errors  
✅ Ingestion progress tracked accurately  
✅ Context available in enhance commands  
✅ API keys created and managed  
✅ Usage and quota displayed correctly  
✅ Error messages are clear and helpful  
✅ No sensitive data in logs  
✅ All backend APIs respond correctly  

---

## Test Results

**Date:** _____________  
**Tester:** _____________  
**CLI Version:** _____________  

### Results Table

| Test ID | Command | Status | Notes |
|---------|---------|--------|-------|
| A1 | pb login | ⬜ | |
| A2 | pb whoami | ⬜ | |
| B1 | pb usage | ⬜ | |
| B3 | pb quota | ⬜ | |
| C1 | pb link list | ⬜ | |
| C2 | pb link notion | ⬜ | |
| C3 | pb link cursor | ⬜ | |
| C4 | pb link figma | ⬜ | |
| C5 | pb link chatgpt | ⬜ | |
| D1 | pb api key list | ⬜ | |
| D2 | pb api key create | ⬜ | |
| E1 | pb enhance | ⬜ | |
| E2 | pb devsync | ⬜ | |
| F2 | pb doctor | ⬜ | |
| F3 | pb health | ⬜ | |
| H1 | pb billing open | ⬜ | |

---

## Notes & Observations

_Add any observations, issues, or improvements here_

---

## Next Steps

After testing:
1. Document any bugs found
2. Verify all integrations are syncing
3. Test context quality in enhance commands
4. Monitor backend API performance
5. Check error handling edge cases
