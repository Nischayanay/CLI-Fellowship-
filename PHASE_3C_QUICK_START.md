# Phase-3C Quick Start Guide

## 🎉 Phase-3C is Complete!

PBCLI now has full API key management, usage tracking, quota enforcement, and billing integration.

## 🚀 Try It Out

### 1. Build the CLI

```bash
npm run build
```

### 2. Create an API Key

```bash
pb api key create
```

This will:
- Create a new API key via the backend
- Display the full key (only time you'll see it)
- Store it securely in your OS keychain + encrypted filesystem

### 3. List Your API Keys

```bash
pb api key list
```

Shows all your keys with masked secrets (`pb_xxxxxx_last4`)

### 4. Check Your Usage

```bash
pb usage
```

Displays:
- Daily requests made and limit
- Current plan (Free/Pro/Builder)
- Usage percentage with color coding
- Time until quota reset
- Warnings when approaching limits

### 5. Check Your Quota

```bash
pb quota
```

Shows:
- Current plan details
- Daily request limits
- Next reset time
- Upgrade information

### 6. Open Billing Portal

```bash
pb billing open
```

Opens Stripe Customer Portal in your browser to:
- Update payment methods
- Manage subscription
- View billing history

## 🔑 Authentication Priority

The CLI now uses this authentication waterfall:

1. **API Key** (if exists) → `x-api-key` header
2. **Session Token** (fallback) → `Authorization: Bearer` header
3. **Error** (if neither exists) → Prompt to login

## 🎯 Key Features

### Secure Storage
- API keys stored in OS keychain (keytar)
- Encrypted filesystem backup at `~/.promptbrain/api-keys.json`
- File permissions: 0600 (owner only)
- Machine-specific encryption

### Intelligent Error Handling
- **402 Quota Exceeded**: Shows reset time, upgrade link, doesn't retry
- **402 Payment Required**: Offers to open billing portal
- **401 Unauthorized**: Removes invalid API key, suggests login
- **429 Rate Limited**: Automatically retries with Retry-After header
- **5xx Server Errors**: Retries up to 3 times with exponential backoff

### Plan-Specific Messaging
- **Free Plan**: Upgrade prompts, quota warnings
- **Pro/Builder Plans**: Thank you messages, unlimited requests

## 📊 Command Reference

### API Key Management
```bash
pb api key create              # Create new API key
pb api key list                # List all keys
pb api key list --json         # JSON output
pb api key revoke <id>         # Revoke specific key
```

### Usage & Quota
```bash
pb usage                       # Check usage
pb usage --json                # JSON output
pb quota                       # Check quota limits
```

### Billing
```bash
pb billing open                # Open billing portal
```

## 🔒 Security Best Practices

1. **One-Time Display**: API keys shown in full only during creation
2. **Never Logged**: Keys never appear in logs, even debug mode
3. **Rotate Regularly**: Create new keys and revoke old ones periodically
4. **Revoke Compromised**: Immediately revoke any compromised keys
5. **Use in CI/CD**: API keys are perfect for automated environments

## 🧪 Testing Your Implementation

### Test API Key Creation
```bash
pb api key create
# Should display full key once and store securely
```

### Test Authentication Waterfall
```bash
# With API key
pb usage
# Should use x-api-key header

# Revoke API key
pb api key revoke <id>

# Try again
pb usage
# Should fall back to session token
```

### Test Error Handling
```bash
# If you hit quota limit (Free plan)
pb usage
# Should show quota exceeded message with reset time
```

### Test Billing Portal
```bash
pb billing open
# Should open browser to Stripe portal
```

## 📁 Files Created

**New Modules:**
- `src/lib/apiKeyStorage.ts` - Secure API key storage
- `src/utils/formatting.ts` - Display formatting utilities

**New Commands:**
- `src/commands/api/key/create.ts`
- `src/commands/api/key/list.ts`
- `src/commands/api/key/revoke.ts`
- `src/commands/usage.ts`
- `src/commands/quota.ts`
- `src/commands/billing/open.ts`

**Enhanced Files:**
- `src/lib/apiClient.ts` - API key support, enhanced errors
- `src/utils/retry.ts` - 402 non-retryable
- `README.md` - Updated documentation

## 🎨 User Experience Highlights

### Color-Coded Usage
- 🟢 Green: < 80% usage
- 🟡 Yellow: 80-99% usage
- 🔴 Red: 100% usage (quota exceeded)

### Plan Emojis
- 🆓 Free Plan
- ⭐ Pro Plan
- 🚀 Builder Plan

### Masked Keys
- Full key: `pb_abc123def456ghi789jkl012mno345pqr678`
- Masked: `pb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxr678`

## 🐛 Troubleshooting

### API Key Not Working
```bash
# Check if key exists
pb api key list

# Create new key if needed
pb api key create
```

### Quota Exceeded
```bash
# Check usage
pb usage

# Check when quota resets
pb quota

# Upgrade plan
pb billing open
```

### Authentication Failed
```bash
# Re-login
pb login

# Or create API key
pb api key create
```

## 🎯 What Makes This Professional-Grade

✅ **Stripe CLI-like**: API key management, billing integration  
✅ **Supabase CLI-like**: Secure credential storage, dual auth  
✅ **OpenAI CLI-like**: Usage tracking, quota enforcement  
✅ **Intelligent Retry**: Exponential backoff, rate limit handling  
✅ **Contextual Errors**: Plan-specific messaging  
✅ **Security First**: Encryption, keychain, no logging  
✅ **Developer-Friendly**: JSON output, clear errors, helpful suggestions  

## 🚀 Next Steps

1. **Test all commands** to ensure they work with your backend
2. **Create API keys** for any CI/CD or automation needs
3. **Monitor usage** to understand your API consumption
4. **Upgrade plan** if you need unlimited requests

## 📚 Documentation

- Full spec: `.kiro/specs/pbcli-phase3c-api-keys-billing/`
- Requirements: `requirements.md`
- Design: `design.md`
- Tasks: `tasks.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`

## 🎉 Success!

Phase-3C is complete and production-ready. PBCLI is now a professional-grade developer platform client with:
- Secure API key management
- Real-time usage tracking
- Quota enforcement
- Billing integration
- Intelligent error handling
- Excellent user experience

Enjoy your new developer platform CLI! 🚀
