# Design Document

## Overview

Phase-3C transforms PBCLI into a professional-grade developer platform client by implementing comprehensive API key management, usage tracking, quota enforcement, and billing integration. This design follows patterns established by industry-leading CLIs (Stripe CLI, Supabase CLI, OpenAI CLI) to provide developers with a familiar and robust experience.

The implementation integrates with the existing Context Engine backend at https://promptbrain-context-engine.vercel.app, which already provides all necessary endpoints for authentication, billing, and usage tracking. PBCLI will act as a client to these services, handling secure credential storage, intelligent error recovery, and user-friendly messaging.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PBCLI                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Commands   │  │  API Client  │  │  Auth Layer  │     │
│  │              │  │              │  │              │     │
│  │ • api key    │──│ • Request    │──│ • API Keys   │     │
│  │ • usage      │  │   Wrapper    │  │ • Sessions   │     │
│  │ • quota      │  │ • Retry      │  │ • Keytar     │     │
│  │ • billing    │  │   Logic      │  │ • Filesystem │     │
│  └──────────────┘  │ • Error      │  └──────────────┘     │
│                     │   Handling   │                        │
│                     └──────────────┘                        │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Context Engine (Backend)                        │
│         https://promptbrain-context-engine.vercel.app       │
│                                                              │
│  • /auth/api-key (POST, GET, DELETE)                        │
│  • /billing/usage (GET)                                      │
│  • /billing/portal (GET)                                     │
│  • All other existing endpoints                             │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────┐
│ Command │
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────┐
│ ApiClient.request()                     │
│                                         │
│ 1. Check for API Key in keytar         │
│    ├─ Found? → Use x-api-key header    │
│    └─ Not found? → Check session token │
│                                         │
│ 2. Check for Session Token             │
│    ├─ Found & valid? → Use Bearer auth │
│    ├─ Found & expired? → Refresh token │
│    └─ Not found? → Return 401 error    │
│                                         │
│ 3. Make request with auth              │
│    ├─ Success → Return response        │
│    ├─ 401 → Remove invalid credentials │
│    ├─ 402 → Handle quota/billing       │
│    ├─ 429 → Retry with backoff         │
│    └─ 5xx → Retry with backoff         │
└─────────────────────────────────────────┘
```

### Credential Storage Strategy

PBCLI uses a dual-storage approach for maximum reliability:

1. **Primary Storage (Keytar)**: Secure OS keychain storage
   - macOS: Keychain
   - Windows: Credential Vault
   - Linux: libsecret/gnome-keyring

2. **Backup Storage (Filesystem)**: Encrypted JSON file
   - Location: `~/.promptbrain/api-keys.json`
   - Permissions: 0600 (owner read/write only)
   - Encryption: AES-256 with machine-specific key

This dual approach ensures:
- Security through OS-level credential management
- Reliability when keytar is unavailable (CI/CD environments)
- Easy migration and backup capabilities

## Components and Interfaces

### 1. API Key Management Commands

#### `src/commands/api/key/create.ts`

```typescript
export default class ApiKeyCreate extends Command {
  static description = 'Create a new API key for CLI authentication';
  
  async run(): Promise<void> {
    // 1. Check authentication
    // 2. POST /auth/api-key
    // 3. Display full key once
    // 4. Store in keytar
    // 5. Store encrypted backup in filesystem
  }
}
```

#### `src/commands/api/key/list.ts`

```typescript
export default class ApiKeyList extends Command {
  static description = 'List all API keys';
  static flags = {
    json: Flags.boolean({ description: 'Output as JSON' })
  };
  
  async run(): Promise<void> {
    // 1. GET /auth/api-key
    // 2. Mask secrets (pb_xxxxxx_last4)
    // 3. Display table or JSON
  }
}
```

#### `src/commands/api/key/revoke.ts`

```typescript
export default class ApiKeyRevoke extends Command {
  static description = 'Revoke an API key';
  static args = {
    id: Args.string({ required: true, description: 'API key ID' })
  };
  
  async run(): Promise<void> {
    // 1. Confirm if revoking active key
    // 2. DELETE /auth/api-key/:id
    // 3. Remove from keytar
    // 4. Remove from filesystem backup
  }
}
```

### 2. Usage and Quota Commands

#### `src/commands/usage.ts`

```typescript
export default class Usage extends Command {
  static description = 'Check API usage and limits';
  static flags = {
    json: Flags.boolean({ description: 'Output as JSON' })
  };
  
  async run(): Promise<void> {
    // 1. GET /billing/usage
    // 2. Calculate usage percentage
    // 3. Display warnings if > 80%
    // 4. Show time until reset
    // 5. Display plan-specific messaging
  }
}
```

#### `src/commands/quota.ts`

```typescript
export default class Quota extends Command {
  static description = 'Check quota limits for your plan';
  
  async run(): Promise<void> {
    // 1. GET /billing/usage
    // 2. Display plan name
    // 3. Show quota limits (50/day for Free, Unlimited for Pro/Builder)
    // 4. Show next reset time
    // 5. Display upgrade messaging for Free plan
  }
}
```

### 3. Billing Command

#### `src/commands/billing/open.ts`

```typescript
export default class BillingOpen extends Command {
  static description = 'Open the billing portal in your browser';
  
  async run(): Promise<void> {
    // 1. Check authentication
    // 2. GET /billing/portal
    // 3. Open URL in browser using 'open' package
    // 4. Display confirmation or fallback URL
  }
}
```

### 4. Enhanced API Client

#### `src/lib/apiClient.ts` (Enhanced)

```typescript
// New interfaces
export interface ApiKeyStorage {
  id: string;
  key: string;
  created_at: string;
  last_used?: string;
}

export interface UsageResponse {
  daily_usage: number;
  daily_limit: number | null; // null = unlimited
  plan: 'free' | 'pro' | 'builder';
  reset_at: string;
  past_due: boolean;
}

export interface ApiKeyResponse {
  id: string;
  key?: string; // Only present on creation
  key_preview: string; // Masked version
  scopes: string[];
  created_at: string;
}

// New API methods
export const apiKeyApi = {
  create: async (): Promise<ApiKeyResponse> => {
    return request('POST', '/auth/api-key');
  },
  
  list: async (): Promise<ApiKeyResponse[]> => {
    return request('GET', '/auth/api-key');
  },
  
  revoke: async (id: string): Promise<void> => {
    return request('DELETE', `/auth/api-key/${id}`);
  }
};

export const billingApi = {
  getUsage: async (): Promise<UsageResponse> => {
    return request('GET', '/billing/usage');
  },
  
  getPortalUrl: async (): Promise<{ url: string }> => {
    return request('GET', '/billing/portal');
  }
};

// Enhanced request interceptor
apiClient.interceptors.request.use(async (config) => {
  // 1. Try to load API key from storage
  const apiKey = await apiKeyStorage.getActiveKey();
  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
    return config;
  }
  
  // 2. Fallback to session token
  const token = await auth.ensureValidToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }
  
  // 3. No authentication available
  return config;
});

// Enhanced response interceptor for billing errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Handle 402 quota exceeded
    if (status === 402 && data?.error === 'quota_exceeded') {
      const pbError = createError(
        'Quota exceeded. Upgrade your plan to continue.',
        ErrorCode.EQUOTA,
        error,
        {
          status,
          suggestion: 'Visit https://promptbrain.io/pricing to upgrade',
          context: { reset_at: data.reset_at }
        }
      );
      return Promise.reject(pbError);
    }
    
    // Handle 402 payment required
    if (status === 402 && data?.error === 'payment_required') {
      const pbError = createError(
        'Payment required. Please update your billing information.',
        ErrorCode.EQUOTA,
        error,
        {
          status,
          suggestion: 'Run: pb billing open',
        }
      );
      return Promise.reject(pbError);
    }
    
    // Handle 401 with API key
    if (status === 401) {
      const apiKey = await apiKeyStorage.getActiveKey();
      if (apiKey) {
        // Invalid API key, remove it
        await apiKeyStorage.removeActiveKey();
      }
    }
    
    // Existing error handling...
    return Promise.reject(error);
  }
);
```

### 5. API Key Storage Module

#### `src/lib/apiKeyStorage.ts` (New)

```typescript
import keytar from 'keytar';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const SERVICE_NAME = 'promptbrain-cli';
const API_KEY_ACCOUNT = 'api-key';
const CONFIG_DIR = path.join(os.homedir(), '.promptbrain');
const API_KEYS_FILE = path.join(CONFIG_DIR, 'api-keys.json');

interface StoredApiKey {
  id: string;
  key_encrypted: string;
  created_at: string;
  last_used?: string;
}

/**
 * Get machine-specific encryption key
 */
const getMachineKey = (): string => {
  const machineId = os.hostname() + os.platform() + os.arch();
  return crypto.createHash('sha256').update(machineId).digest('hex');
};

/**
 * Encrypt API key for filesystem storage
 */
const encryptKey = (key: string): string => {
  const algorithm = 'aes-256-cbc';
  const machineKey = getMachineKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(machineKey, 'hex').slice(0, 32),
    iv
  );
  
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt API key from filesystem storage
 */
const decryptKey = (encryptedKey: string): string => {
  const algorithm = 'aes-256-cbc';
  const machineKey = getMachineKey();
  const [ivHex, encrypted] = encryptedKey.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(machineKey, 'hex').slice(0, 32),
    iv
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const apiKeyStorage = {
  /**
   * Store API key in both keytar and encrypted filesystem
   */
  storeKey: async (id: string, key: string): Promise<void> => {
    // Store in keytar
    await keytar.setPassword(SERVICE_NAME, API_KEY_ACCOUNT, key);
    
    // Store encrypted backup in filesystem
    await fs.ensureDir(CONFIG_DIR);
    const encrypted = encryptKey(key);
    const stored: StoredApiKey = {
      id,
      key_encrypted: encrypted,
      created_at: new Date().toISOString(),
    };
    
    await fs.writeJson(API_KEYS_FILE, stored, { spaces: 2, mode: 0o600 });
  },
  
  /**
   * Get active API key (try keytar first, fallback to filesystem)
   */
  getActiveKey: async (): Promise<string | null> => {
    // Try keytar first
    try {
      const key = await keytar.getPassword(SERVICE_NAME, API_KEY_ACCOUNT);
      if (key) return key;
    } catch (error) {
      // Keytar failed, try filesystem
    }
    
    // Fallback to filesystem
    try {
      if (await fs.pathExists(API_KEYS_FILE)) {
        const stored: StoredApiKey = await fs.readJson(API_KEYS_FILE);
        return decryptKey(stored.key_encrypted);
      }
    } catch (error) {
      // Filesystem read failed
    }
    
    return null;
  },
  
  /**
   * Remove active API key from both storages
   */
  removeActiveKey: async (): Promise<void> => {
    // Remove from keytar
    try {
      await keytar.deletePassword(SERVICE_NAME, API_KEY_ACCOUNT);
    } catch (error) {
      // Ignore keytar errors
    }
    
    // Remove from filesystem
    try {
      if (await fs.pathExists(API_KEYS_FILE)) {
        await fs.remove(API_KEYS_FILE);
      }
    } catch (error) {
      // Ignore filesystem errors
    }
  },
  
  /**
   * Get stored API key metadata
   */
  getKeyMetadata: async (): Promise<{ id: string; created_at: string } | null> => {
    try {
      if (await fs.pathExists(API_KEYS_FILE)) {
        const stored: StoredApiKey = await fs.readJson(API_KEYS_FILE);
        return {
          id: stored.id,
          created_at: stored.created_at,
        };
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  },
};
```

### 6. Utility Functions

#### `src/utils/formatting.ts` (New)

```typescript
/**
 * Mask API key for display (pb_xxxxxx_last4)
 */
export const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '***';
  
  const prefix = key.startsWith('pb_') ? 'pb_' : '';
  const last4 = key.slice(-4);
  const maskedLength = Math.max(6, key.length - prefix.length - 4);
  const masked = 'x'.repeat(maskedLength);
  
  return `${prefix}${masked}${last4}`;
};

/**
 * Format time until reset
 */
export const formatTimeUntilReset = (resetAt: string): string => {
  const now = Date.now();
  const reset = new Date(resetAt).getTime();
  const diff = reset - now;
  
  if (diff <= 0) return 'now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format usage percentage with color
 */
export const formatUsagePercentage = (used: number, limit: number | null): string => {
  if (limit === null) return 'unlimited';
  
  const percentage = (used / limit) * 100;
  const rounded = Math.round(percentage);
  
  if (percentage >= 100) return chalk.red(`${rounded}%`);
  if (percentage >= 80) return chalk.yellow(`${rounded}%`);
  return chalk.green(`${rounded}%`);
};

/**
 * Get plan display name with emoji
 */
export const formatPlanName = (plan: string): string => {
  switch (plan.toLowerCase()) {
    case 'free':
      return '🆓 Free Plan';
    case 'pro':
      return '⭐ Pro Plan';
    case 'builder':
      return '🚀 Builder Plan';
    default:
      return plan;
  }
};
```

## Data Models

### API Key

```typescript
interface ApiKey {
  id: string;                // Unique identifier
  key?: string;              // Full secret (only on creation)
  key_preview: string;       // Masked version (pb_xxxxxx_last4)
  scopes: string[];          // Permissions
  created_at: string;        // ISO timestamp
  last_used?: string;        // ISO timestamp
}
```

### Usage Information

```typescript
interface Usage {
  daily_usage: number;       // Requests made today
  daily_limit: number | null; // null = unlimited
  plan: 'free' | 'pro' | 'builder';
  reset_at: string;          // ISO timestamp
  past_due: boolean;         // Payment status
  upgrade_required?: boolean; // Soft limit flag
}
```

### Billing Portal

```typescript
interface BillingPortal {
  url: string;               // Stripe Customer Portal URL
  expires_at: string;        // URL expiration
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, I've identified the following consolidations to eliminate redundancy:

**Consolidations:**
- Properties 1.3 and 1.4 (keytar storage + filesystem storage) can be combined into a single "dual storage" property
- Properties 7.1, 7.2, and 7.3 (auth priority) can be combined into a single "authentication waterfall" property
- Properties 8.1 and 8.3 (5xx retry + network retry) can be combined into a single "retryable error" property
- Properties 9.5 and 10.5 (quota/payment non-retry) can be combined into a single "non-retryable 402" property
- Properties 2.3 and 4.2 (display completeness) follow the same pattern and validate similar concerns

**Unique Properties Retained:**
- Encryption round-trip (1.5) - unique cryptographic property
- API key masking (2.2) - unique formatting property
- Revocation cleanup (3.2) - unique state management property
- Storage retention on failure (3.4) - unique error handling property
- Invalid key cleanup (7.5, 11.3) - unique error recovery property
- Rate limit retry (8.2) - unique retry behavior distinct from general retries
- Retry logging (8.5) - unique observability property

### Correctness Properties

Property 1: API key dual storage consistency
*For any* API key creation, the key SHALL be stored in both keytar and encrypted filesystem backup, and both storages SHALL contain the same key value when decrypted.
**Validates: Requirements 1.3, 1.4**

Property 2: Encryption round-trip preservation
*For any* API key string, encrypting with the machine-specific key and then decrypting SHALL return the original key value unchanged.
**Validates: Requirements 1.5**

Property 3: API key masking format compliance
*For any* API key string, the masked version SHALL follow the format pb_xxxxxx_last4 where the last 4 characters match the original key's last 4 characters.
**Validates: Requirements 2.2**

Property 4: API key display completeness
*For any* API key in the list response, the displayed output SHALL contain the key ID, masked secret, creation timestamp, and scopes.
**Validates: Requirements 2.3**

Property 5: JSON output validity with masking
*For any* list command with --json flag, the output SHALL be valid JSON and all key secrets SHALL be masked.
**Validates: Requirements 2.5**

Property 6: Revocation dual cleanup
*For any* successful API key revocation, the key SHALL be removed from both keytar and filesystem storage.
**Validates: Requirements 3.2**

Property 7: Storage retention on revocation failure
*For any* failed API key revocation, the key SHALL remain in both keytar and filesystem storage unchanged.
**Validates: Requirements 3.4**

Property 8: Usage display completeness
*For any* usage response, the displayed output SHALL contain daily requests made, daily limit, current plan name, and usage percentage.
**Validates: Requirements 4.2**

Property 9: Time until reset calculation
*For any* reset timestamp in the future, the calculated time until reset SHALL be positive and decrease as current time advances.
**Validates: Requirements 4.3**

Property 10: JSON output validity for usage
*For any* usage command with --json flag, the output SHALL be valid JSON containing all usage fields.
**Validates: Requirements 4.6**

Property 11: Quota display completeness
*For any* quota response, the displayed output SHALL contain the current plan name.
**Validates: Requirements 5.4**

Property 12: Authentication waterfall priority
*For any* API request, the CLI SHALL attempt authentication in order: (1) API key from keytar, (2) session token, (3) error if neither exists.
**Validates: Requirements 7.1, 7.2, 7.3**

Property 13: API key header attachment
*For any* API request when an API key exists, the request SHALL include the x-api-key header with the key value.
**Validates: Requirements 7.2**

Property 14: Invalid API key cleanup
*For any* API request that returns 401 when using an API key, the CLI SHALL remove the API key from both keytar and filesystem storage.
**Validates: Requirements 7.5, 11.3**

Property 15: Retryable error exponential backoff
*For any* request that fails with a 5xx status or network error, the CLI SHALL retry up to 3 times with exponentially increasing delays.
**Validates: Requirements 8.1, 8.3**

Property 16: Rate limit retry with Retry-After
*For any* request that fails with 429 status, the CLI SHALL retry after the duration specified in the Retry-After header.
**Validates: Requirements 8.2**

Property 17: Retry attempt logging
*For any* request retry, the CLI SHALL log the attempt number and delay duration.
**Validates: Requirements 8.5**

Property 18: Non-retryable 402 errors
*For any* request that fails with 402 status (quota_exceeded or payment_required), the CLI SHALL NOT retry the request.
**Validates: Requirements 9.5, 10.5**

## Error Handling

### Error Categories and Responses

#### 1. Authentication Errors (401, 403)

**Behavior:**
- Display clear authentication failure message
- Suggest running `pb login`
- If using API key: remove invalid key from storage
- If using session token: attempt refresh once, then prompt for login

**User Experience:**
```
✖ Authentication failed. Please run `pb login` to authenticate.
Suggestion: Run: pb login
```

#### 2. Quota Exceeded (402 with quota_exceeded)

**Behavior:**
- Display quota exceeded message
- Show time until next reset
- Display upgrade link
- Do NOT retry request

**User Experience:**
```
✖ Quota exceeded. You've used 50/50 requests today.
ℹ Quota resets in 4h 23m
ℹ Upgrade your plan: https://promptbrain.io/pricing
```

#### 3. Payment Required (402 with payment_required)

**Behavior:**
- Display payment required message
- Offer to open billing portal
- If user confirms: execute `pb billing open`
- If user declines: display portal URL
- Do NOT retry request

**User Experience:**
```
✖ Payment required. Please update your billing information.
? Open billing portal now? (Y/n)
```

#### 4. Rate Limiting (429)

**Behavior:**
- Parse Retry-After header
- Wait specified duration
- Retry request automatically
- Display retry information in debug mode

**User Experience:**
```
⚠ Rate limit exceeded. Retrying in 5 seconds...
```

#### 5. Server Errors (5xx)

**Behavior:**
- Retry up to 3 times with exponential backoff
- Log retry attempts in debug mode
- After exhausting retries, display error with status link

**User Experience:**
```
✖ Server error. Please try again later.
Suggestion: Check service status at status.promptbrain.io
```

#### 6. Network Errors

**Behavior:**
- Check connectivity
- Retry up to 3 times with exponential backoff
- Display appropriate message based on connectivity

**User Experience:**
```
✖ No internet connection. Please check your network.
```

### Error Context Propagation

All errors include:
- **Request ID**: For support and debugging
- **Status Code**: HTTP status when available
- **Suggestion**: Actionable next step
- **Context**: Additional metadata (reset times, retry delays, etc.)

## Testing Strategy

### Unit Testing

Unit tests will cover specific examples and edge cases:

**API Key Commands:**
- Creating an API key with valid authentication
- Creating an API key without authentication (should fail)
- Listing API keys when none exist
- Revoking a non-existent key (should fail)
- Revoking the currently active key (should prompt)

**Usage and Quota:**
- Displaying usage at 0%, 50%, 80%, 100%
- Displaying usage with past-due status
- Displaying quota for each plan type (Free, Pro, Builder)
- Calculating time until reset for various timestamps

**Billing:**
- Opening billing portal with valid authentication
- Opening billing portal without authentication (should fail)
- Handling browser open failure

**Error Handling:**
- 401 with API key (should remove key)
- 401 with session token (should refresh)
- 402 quota exceeded (should not retry)
- 402 payment required (should offer portal)
- 429 with Retry-After header
- 5xx errors (should retry)
- Network errors (should retry)

**Storage:**
- Storing API key in keytar
- Storing API key in filesystem with correct permissions
- Loading API key from keytar
- Falling back to filesystem when keytar fails
- Removing API key from both storages

### Property-Based Testing

Property-based tests will use **fast-check** (already in package.json) to verify universal properties across many inputs. Each test will run a minimum of 100 iterations.

**Test Configuration:**
```typescript
import * as fc from 'fast-check';

// Configure for 100+ iterations
const testConfig = { numRuns: 100 };
```

**Property Test Structure:**
Each property-based test will:
1. Generate random valid inputs using fast-check arbitraries
2. Execute the operation
3. Verify the property holds
4. Include a comment linking to the design document property

**Example:**
```typescript
// Feature: pbcli-phase3c-api-keys-billing, Property 2: Encryption round-trip preservation
it('encrypts and decrypts API keys without data loss', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 20, maxLength: 100 }), // Random API key
      (apiKey) => {
        const encrypted = encryptKey(apiKey);
        const decrypted = decryptKey(encrypted);
        expect(decrypted).to.equal(apiKey);
      }
    ),
    testConfig
  );
});
```

**Property Tests to Implement:**

1. **Property 1: Dual storage consistency** - Generate random API keys, store them, verify both storages contain the same value
2. **Property 2: Encryption round-trip** - Generate random strings, encrypt/decrypt, verify equality
3. **Property 3: Masking format** - Generate random API keys, mask them, verify format compliance
4. **Property 4: Display completeness** - Generate random API key responses, verify all fields present
5. **Property 5: JSON validity** - Generate random key lists, verify JSON output is valid and masked
6. **Property 6: Revocation cleanup** - Generate random keys, revoke them, verify both storages cleared
7. **Property 7: Storage retention on failure** - Simulate revocation failures, verify storage unchanged
8. **Property 8: Usage display completeness** - Generate random usage data, verify all fields present
9. **Property 9: Time calculation** - Generate random future timestamps, verify time calculation correctness
10. **Property 10: JSON validity for usage** - Generate random usage data, verify JSON output validity
11. **Property 11: Quota display completeness** - Generate random quota data, verify plan name present
12. **Property 12: Authentication waterfall** - Test various auth states, verify priority order
13. **Property 13: Header attachment** - Generate random requests with API keys, verify header present
14. **Property 14: Invalid key cleanup** - Simulate 401 responses, verify key removal
15. **Property 15: Retry backoff** - Simulate retryable errors, verify retry count and delays
16. **Property 16: Rate limit retry** - Generate random Retry-After values, verify correct delays
17. **Property 17: Retry logging** - Simulate retries, verify log entries
18. **Property 18: Non-retryable 402** - Simulate 402 errors, verify no retries occur

### Integration Testing

Integration tests will verify end-to-end flows:

- Complete API key lifecycle: create → list → use → revoke
- Authentication flow: login → create API key → use API key → logout
- Quota enforcement: make requests → hit limit → see error → upgrade
- Billing flow: check usage → open portal → update payment
- Error recovery: invalid key → cleanup → fallback to session

### Test Utilities

**Mocks and Fixtures:**
- Mock HTTP client for API responses
- Mock keytar for storage testing
- Mock filesystem for backup testing
- Mock 'open' package for browser testing
- Fixture data for various plan types and usage scenarios

**Generators (for property-based testing):**
```typescript
// Arbitrary for API keys
const apiKeyArbitrary = fc.string({ minLength: 32, maxLength: 64 })
  .map(s => `pb_${s}`);

// Arbitrary for usage data
const usageArbitrary = fc.record({
  daily_usage: fc.nat(1000),
  daily_limit: fc.option(fc.nat(1000), { nil: null }),
  plan: fc.constantFrom('free', 'pro', 'builder'),
  reset_at: fc.date().map(d => d.toISOString()),
  past_due: fc.boolean(),
});

// Arbitrary for timestamps
const futureTimestampArbitrary = fc.date({ min: new Date() })
  .map(d => d.toISOString());
```

## Implementation Notes

### Dependencies

**Existing:**
- `keytar`: Secure credential storage
- `axios`: HTTP client
- `chalk`: Terminal colors
- `open`: Browser opening
- `fs-extra`: Filesystem operations
- `fast-check`: Property-based testing

**No new dependencies required.**

### File Structure

```
src/
├── commands/
│   ├── api/
│   │   └── key/
│   │       ├── create.ts    (new)
│   │       ├── list.ts      (new)
│   │       └── revoke.ts    (new)
│   ├── billing/
│   │   └── open.ts          (new)
│   ├── usage.ts             (new)
│   └── quota.ts             (new)
├── lib/
│   ├── apiClient.ts         (enhanced)
│   ├── apiKeyStorage.ts     (new)
│   └── auth.ts              (enhanced)
└── utils/
    ├── errors.ts            (enhanced)
    ├── formatting.ts        (new)
    └── logger.ts            (existing)

test/
├── commands/
│   ├── api/
│   │   └── key/
│   │       ├── create.test.ts
│   │       ├── list.test.ts
│   │       └── revoke.test.ts
│   ├── billing/
│   │   └── open.test.ts
│   ├── usage.test.ts
│   └── quota.test.ts
├── lib/
│   ├── apiClient.test.ts
│   └── apiKeyStorage.test.ts
└── utils/
    └── formatting.test.ts
```

### Configuration

**Environment Variables:**
- `SUPABASE_ANON_KEY`: Already configured for session auth
- `DEBUG`: Enable debug logging (already supported)

**File Locations:**
- API keys: `~/.promptbrain/api-keys.json` (mode 0600)
- Session: Keytar service `promptbrain-cli`, account `session`
- API key: Keytar service `promptbrain-cli`, account `api-key`

### Security Considerations

1. **API Key Display**: Full key shown only once on creation
2. **Storage Encryption**: Filesystem backup encrypted with machine-specific key
3. **File Permissions**: API key file restricted to owner (0600)
4. **Key Cleanup**: Invalid keys automatically removed
5. **No Logging**: API keys never logged, even in debug mode
6. **Secure Transmission**: All requests over HTTPS

### Backward Compatibility

- Existing commands continue to work with session-based auth
- API key auth is additive, not breaking
- Session auth remains as fallback
- No changes to existing command interfaces

### Performance Considerations

- **Keytar First**: Faster than filesystem, used as primary
- **Filesystem Fallback**: Only when keytar unavailable
- **Retry Limits**: Maximum 3 retries prevents infinite loops
- **Exponential Backoff**: Prevents server overload
- **Connectivity Cache**: 30-second TTL reduces DNS lookups

## Future Enhancements

Potential improvements for future phases:

1. **Multiple API Keys**: Support for multiple named keys
2. **Key Scopes**: Granular permissions per key
3. **Key Rotation**: Automatic key rotation policies
4. **Usage Analytics**: Detailed usage breakdown by endpoint
5. **Quota Alerts**: Proactive notifications before hitting limits
6. **Offline Mode**: Queue requests when offline
7. **Key Export**: Secure key export for CI/CD
8. **Team Management**: Shared keys for team accounts
