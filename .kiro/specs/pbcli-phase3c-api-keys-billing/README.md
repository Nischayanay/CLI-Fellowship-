# PBCLI Phase-3C: API Keys + Billing + Developer Platform

## Overview

This spec transforms PBCLI into a professional-grade developer platform client, matching the experience of Stripe CLI, Supabase CLI, and OpenAI CLI.

## What's Included

### Features
- ✅ API key management (create, list, revoke)
- ✅ Usage tracking and quota display
- ✅ Billing portal integration
- ✅ Automatic API key attachment to requests
- ✅ Intelligent retry logic with exponential backoff
- ✅ Graceful error handling for quota, payment, and auth errors
- ✅ Plan-specific messaging (Free/Pro/Builder)

### Commands
- `pb api key create` - Generate new API key
- `pb api key list` - List all API keys (masked)
- `pb api key revoke <id>` - Revoke an API key
- `pb usage` - Check API usage and limits
- `pb quota` - Check quota limits for your plan
- `pb billing open` - Open Stripe billing portal

### Technical Highlights
- **Dual Storage**: Keytar (OS keychain) + encrypted filesystem backup
- **Authentication Waterfall**: API key → session token → error
- **Smart Retry**: 5xx/network errors retry, 402 errors don't
- **Security**: AES-256 encryption, 0600 file permissions, keys never logged

## Backend Integration

**Context Engine URL**: https://promptbrain-context-engine.vercel.app

**Endpoints Used**:
- `POST /auth/api-key` - Create API key
- `GET /auth/api-key` - List API keys
- `DELETE /auth/api-key/:id` - Revoke API key
- `GET /billing/usage` - Get usage and quota
- `GET /billing/portal` - Get billing portal URL

## Implementation Approach

### Phase 1: Core Infrastructure (Tasks 1-5)
- API key storage with encryption
- Formatting utilities
- Enhanced API client
- Error handling
- Retry logic

### Phase 2: Commands (Tasks 6-11)
- API key commands (create, list, revoke)
- Usage and quota commands
- Billing portal command

### Phase 3: Polish (Tasks 12-16)
- Interactive prompts
- Plan-specific messaging
- Documentation
- Testing

## Testing Strategy

- **Unit Tests**: Specific examples and edge cases
- **Property-Based Tests** (optional): 100+ iterations per property using fast-check
- **Integration Tests**: End-to-end flows

Optional tests are marked with `*` in the task list for faster MVP delivery.

## Correctness Properties

18 properties ensure system correctness:
- Storage consistency and encryption (Properties 1-2)
- Display formatting (Properties 3-5, 8, 10-11)
- Authentication and cleanup (Properties 12-14)
- Retry logic (Properties 15-17)
- Error handling (Property 18)

## Getting Started

To begin implementation:

1. Open `.kiro/specs/pbcli-phase3c-api-keys-billing/tasks.md`
2. Click "Start task" next to task 1
3. Follow the implementation plan sequentially

## Success Criteria

After Phase-3C, users should feel:
> "This is exactly like Stripe CLI and Supabase CLI."

Technical validation:
- ✅ All commands work as specified
- ✅ API keys stored securely
- ✅ Quota enforcement active
- ✅ Error handling professional-grade
- ✅ Retry logic prevents transient failures
- ✅ Plan-specific messaging contextual

## Files Modified

**New Files**:
- `src/lib/apiKeyStorage.ts`
- `src/utils/formatting.ts`
- `src/commands/api/key/create.ts`
- `src/commands/api/key/list.ts`
- `src/commands/api/key/revoke.ts`
- `src/commands/usage.ts`
- `src/commands/quota.ts`
- `src/commands/billing/open.ts`

**Enhanced Files**:
- `src/lib/apiClient.ts`
- `src/lib/auth.ts`
- `src/utils/errors.ts`

**Test Files**:
- Corresponding test files for all new commands and modules

## Dependencies

No new dependencies required. Uses existing:
- `keytar` - Secure storage
- `axios` - HTTP client
- `chalk` - Terminal colors
- `open` - Browser opening
- `fs-extra` - Filesystem
- `fast-check` - Property-based testing

## Security Notes

- API keys displayed in full only once on creation
- Filesystem backup encrypted with machine-specific key
- File permissions restricted to owner (0600)
- Invalid keys automatically removed
- Keys never logged, even in debug mode
- All requests over HTTPS

## Questions?

Refer to:
- `requirements.md` - Detailed acceptance criteria
- `design.md` - Architecture and component design
- `tasks.md` - Step-by-step implementation plan
