# Design Document: PBCLI ↔ Context Engine Deep Integration

## Overview

This design document outlines the architecture for deep integration between PBCLI (the command-line interface) and the Context Engine backend. The integration makes PBCLI feel like a native extension of the backend by providing:

1. **Stable API Interaction Layer**: Robust authentication, automatic retry logic, token refresh, and offline detection
2. **Full Pipeline Control**: Complete Phase-2 orchestration for `pb enhance`, new `pb devsync` command for coding context
3. **Integration Sync Commands**: OAuth-based linking for Notion, Cursor, Figma, and ChatGPT with real-time progress tracking

The design builds upon the existing PBCLI architecture (oclif framework, axios-based API client, keytar authentication) and extends it with enhanced reliability, new commands, and seamless backend integration.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PBCLI                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Command Layer (oclif)                     │ │
│  │  • pb enhance  • pb devsync  • pb link <provider>     │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Enhanced API Client Layer                    │ │
│  │  • Token Management  • Auto-Retry  • Offline Queue    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Orchestration Layer                       │ │
│  │  • Task Detection  • Model Routing  • Templates       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Network Layer
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Context Engine Backend                     │
│  • /general (enhancement)  • /devsync  • /cli/link/*        │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **User Command** → Command handler validates auth and parses flags
2. **Command Handler** → Orchestrator prepares request (task detection, model routing, template)
3. **Orchestrator** → Enhanced API Client with retry/offline handling
4. **API Client** → Context Engine Backend
5. **Backend Response** → Command handler formats and displays results

## Components and Interfaces

### 1. Enhanced API Client (`src/lib/apiClient.ts`)

**Responsibilities:**
- Manage authentication tokens with automatic refresh
- Implement exponential backoff retry logic for transient failures
- Detect offline state and queue operations
- Handle rate limiting gracefully
- Provide unified error handling

**Key Interfaces:**

```typescript
interface TokenRefreshResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface QueuedOperation {
  id: string;
  method: string;
  path: string;
  body?: any;
  timestamp: number;
  retries: number;
}

interface ConnectionState {
  isOnline: boolean;
  lastCheck: number;
  queuedOperations: QueuedOperation[];
}

interface EnhancedRequestOptions extends AxiosRequestConfig {
  skipRetry?: boolean;
  skipTokenRefresh?: boolean;
  queueIfOffline?: boolean;
}
```

**Enhanced Methods:**

```typescript
class EnhancedApiClient {
  // Token management
  async refreshToken(): Promise<TokenRefreshResult>;
  async ensureValidToken(): Promise<void>;
  
  // Connection management
  async checkConnectivity(): Promise<boolean>;
  getConnectionState(): ConnectionState;
  
  // Queue management
  async queueOperation(operation: QueuedOperation): Promise<void>;
  async processQueue(): Promise<void>;
  async clearQueue(): Promise<void>;
  
  // Enhanced request with all features
  async request<T>(options: EnhancedRequestOptions): Promise<T>;
}
```

### 2. Devsync Command (`src/commands/devsync.ts`)

**Responsibilities:**
- Analyze current project state (git status, open files, recent changes)
- Send context to backend for processing
- Retrieve and display relevant coding context
- Format output with syntax highlighting

**Interface:**

```typescript
interface DevsyncRequest {
  project_path: string;
  git_status?: GitStatus;
  open_files?: string[];
  recent_commits?: GitCommit[];
  query?: string;
}

interface DevsyncResponse {
  context: ContextItem[];
  suggestions: string[];
  relevant_docs: DocumentReference[];
  code_examples: CodeExample[];
}

interface ContextItem {
  type: 'code' | 'doc' | 'issue' | 'design';
  title: string;
  content: string;
  relevance_score: number;
  source: string;
}
```

### 3. Integration Link Commands

**Figma Link Command (`src/commands/link/figma.ts`):**

```typescript
interface FigmaLinkOptions {
  projects?: string[];  // Specific project IDs to sync
  all?: boolean;        // Sync all accessible projects
}

interface FigmaProject {
  id: string;
  name: string;
  last_modified: string;
}
```

**ChatGPT Link Command (`src/commands/link/chatgpt.ts`):**

```typescript
interface ChatGPTLinkOptions {
  file?: string;        // Path to exported conversations JSON
  apiKey?: string;      // ChatGPT API key for direct access
}

interface ChatGPTConversation {
  id: string;
  title: string;
  messages: ChatGPTMessage[];
  created_at: string;
}
```

### 4. Offline Queue Manager (`src/lib/offlineQueue.ts`)

**Responsibilities:**
- Persist queued operations to disk
- Automatically sync when connectivity restored
- Handle queue conflicts and deduplication
- Provide queue status and management

**Interface:**

```typescript
class OfflineQueueManager {
  async enqueue(operation: QueuedOperation): Promise<void>;
  async dequeue(): Promise<QueuedOperation | null>;
  async processAll(): Promise<ProcessResult[]>;
  async clear(): Promise<void>;
  async getStatus(): Promise<QueueStatus>;
  
  // Event handlers
  onConnectivityRestored(callback: () => void): void;
  onQueueProcessed(callback: (results: ProcessResult[]) => void): void;
}

interface QueueStatus {
  count: number;
  oldestTimestamp: number;
  totalSize: number;
}

interface ProcessResult {
  operation: QueuedOperation;
  success: boolean;
  error?: string;
}
```

### 5. Progress Tracker (`src/lib/progressTracker.ts`)

**Responsibilities:**
- Display real-time progress for long-running operations
- Show ingestion progress (files processed, items indexed)
- Provide visual feedback with spinners and progress bars

**Interface:**

```typescript
class ProgressTracker {
  start(message: string): void;
  update(current: number, total: number, message?: string): void;
  succeed(message: string): void;
  fail(message: string): void;
  
  // For streaming updates
  onProgress(callback: (progress: ProgressUpdate) => void): void;
}

interface ProgressUpdate {
  phase: string;
  current: number;
  total: number;
  message: string;
  percentage: number;
}
```

## Data Models

### Authentication Models

```typescript
interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;  // NEW: Calculated expiration timestamp
  user_id: string;
  email?: string;
}

interface TokenMetadata {
  issued_at: number;
  expires_at: number;
  refresh_threshold: number;  // Refresh when this many seconds remain
}
```

### Integration Models

```typescript
interface Integration {
  provider: 'notion' | 'cursor' | 'figma' | 'chatgpt';
  connected: boolean;
  connected_at?: string;
  last_sync?: string;
  sync_status?: 'idle' | 'syncing' | 'error';
  error_message?: string;
  metadata?: IntegrationMetadata;
}

interface IntegrationMetadata {
  items_synced?: number;
  last_sync_duration?: number;
  next_sync?: string;
}

interface SyncProgress {
  provider: string;
  phase: 'authenticating' | 'fetching' | 'processing' | 'indexing' | 'complete';
  items_processed: number;
  items_total: number;
  current_item?: string;
}
```

### Devsync Models

```typescript
interface GitStatus {
  branch: string;
  modified_files: string[];
  untracked_files: string[];
  ahead: number;
  behind: number;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
}

interface CodeExample {
  language: string;
  code: string;
  description: string;
  source: string;
}

interface DocumentReference {
  title: string;
  url: string;
  excerpt: string;
  relevance: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework, several redundancies and consolidation opportunities were identified:

**Redundancies Identified:**
1. Properties 1.5 and 9.5 both test queue processing on connectivity restoration - these can be combined
2. Properties 4.3, 5.4, 6.4, and 10.4 all test progress display during ingestion - these can be consolidated into one comprehensive property
3. Properties 4.4, 6.5, and 10.5 all test completion confirmation with counts - these can be combined
4. Properties 4.5 and 7.3 both test error messaging - can be consolidated
5. Properties 2.1, 2.2, 2.3, 2.4 test sequential orchestration steps - can be combined into one comprehensive orchestration property

**Consolidated Properties:**
- Combine all progress display properties into "Ingestion progress display"
- Combine all completion confirmation properties into "Ingestion completion confirmation"
- Combine orchestration pipeline properties into "Complete orchestration execution"
- Combine queue processing properties into "Queue processing on reconnection"

This reduces the total number of properties while maintaining comprehensive coverage of all requirements.

### Correctness Properties

**Property 1: Authentication validation before requests**
*For any* command requiring authentication, if no valid API key exists, the command should fail with an authentication error before attempting any network requests.
**Validates: Requirements 1.1**

**Property 2: Token refresh on expiration**
*For any* API request with an expired token, the system should automatically refresh the token and retry the original request, resulting in a successful response.
**Validates: Requirements 1.2**

**Property 3: Exponential backoff retry**
*For any* transient error (5xx, timeout, network error), the system should retry the request with exponentially increasing delays (e.g., 500ms, 1500ms, 4500ms).
**Validates: Requirements 1.3**

**Property 4: Offline detection and queueing**
*For any* operation attempted without network connectivity, the system should detect the offline state, queue the operation, and display an offline message rather than failing immediately.
**Validates: Requirements 1.4**

**Property 5: Queue processing on reconnection**
*For any* queued operations, when connectivity is restored, all operations should be processed in the order they were queued.
**Validates: Requirements 1.5, 9.5**

**Property 6: Complete orchestration execution**
*For any* user prompt to `pb enhance`, the system should execute the complete orchestration pipeline: task detection → model routing → template application → backend request, with each step producing valid output.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

**Property 7: Devsync context retrieval**
*For any* `pb devsync` command, the system should analyze project state (git status, files), send analysis to backend, retrieve context, and format output with syntax highlighting for code examples.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

**Property 8: Ingestion progress display**
*For any* integration ingestion operation (Notion, Figma, ChatGPT), the system should display real-time progress updates including current phase, items processed, and total items.
**Validates: Requirements 4.3, 5.4, 6.4, 10.4**

**Property 9: Ingestion completion confirmation**
*For any* successful ingestion operation, the system should display a confirmation message including the count of items indexed (pages, files, conversations, etc.).
**Validates: Requirements 4.4, 6.5, 10.5**

**Property 10: Error message clarity**
*For any* failed operation, the system should display a user-friendly error message that includes the specific issue and actionable troubleshooting guidance.
**Validates: Requirements 4.5, 7.1, 7.3**

**Property 11: Server error retry limit**
*For any* 5xx server error, the system should retry exactly 3 times before failing, with each retry using exponential backoff.
**Validates: Requirements 7.2**

**Property 12: Timeout handling**
*For any* API request that exceeds the timeout threshold, the system should cancel the request and inform the user with a timeout error message.
**Validates: Requirements 7.4**

**Property 13: Rate limit respect**
*For any* 429 rate limit response, the system should wait for the duration specified in the retry-after header (or a default duration) before retrying.
**Validates: Requirements 7.5**

**Property 14: Integration status display**
*For any* `pb link list` command, the system should display all available integrations with their connection status, last sync timestamp (if connected), and error status (if applicable).
**Validates: Requirements 8.2, 8.3, 8.4**

**Property 15: Offline operation filtering**
*For any* local-only operation (e.g., `pb whoami`, `pb link list` with cached data), the system should execute without attempting network requests when offline.
**Validates: Requirements 9.3**

**Property 16: Queue persistence**
*For any* operation queued during offline mode, the operation should be persisted to disk and survive application restarts.
**Validates: Requirements 9.4**

**Property 17: Data validation before ingestion**
*For any* ChatGPT data provided for ingestion, the system should validate the format and reject invalid data with a clear error message before attempting ingestion.
**Validates: Requirements 10.2**

## Error Handling

### Error Categories

1. **Authentication Errors (401, 403)**
   - Display clear message about authentication failure
   - Suggest running `pb login` for 401 errors
   - For 403, indicate insufficient permissions
   - Do not retry (client error)

2. **Network Errors (ECONN, ETIMEDOUT)**
   - Check connectivity using DNS lookup
   - Display offline message if no connectivity
   - Queue operation if `queueIfOffline` is true
   - Retry with exponential backoff if transient

3. **Rate Limiting (429)**
   - Extract `retry-after` header value
   - Wait specified duration before retry
   - Display message: "Rate limit reached, waiting X seconds..."
   - Do not count against retry limit

4. **Server Errors (5xx)**
   - Retry up to 3 times with exponential backoff
   - Log each retry attempt in debug mode
   - After 3 failures, display error with suggestion to check status page
   - Include request ID if available for support

5. **Client Errors (4xx except 429)**
   - Do not retry (client error)
   - Parse error response for specific message
   - Display user-friendly version of error
   - For 402 (quota exceeded), suggest upgrade

6. **Validation Errors**
   - Validate input before making requests
   - Display specific validation failure reason
   - Provide examples of valid input
   - Do not make network request if validation fails

### Error Response Format

All errors should follow a consistent format:

```typescript
interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: string;
  suggestion?: string;
  request_id?: string;
}
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: 3;
  baseDelay: 500;  // ms
  maxDelay: 10000; // ms
  factor: 3;       // exponential factor
  retryableErrors: [
    'ECONN',
    'ETIMEDOUT', 
    'ECONNRESET',
    'ENOTFOUND',
    'EAI_AGAIN',
    500, 502, 503, 504
  ];
  nonRetryableErrors: [
    400, 401, 403, 404, 422
  ];
}
```

### Offline Handling Strategy

1. **Detection**: Check connectivity before each request using DNS lookup to `google.com`
2. **Queueing**: Store operations in `~/.pb/queue.json` with metadata
3. **Processing**: On connectivity restoration, process queue in FIFO order
4. **Deduplication**: Check for duplicate operations before queueing
5. **Expiration**: Remove queued operations older than 24 hours

## Testing Strategy

### Unit Testing

Unit tests will verify specific behaviors and edge cases:

- **Authentication**: Test token validation, refresh logic, session management
- **Error Handling**: Test each error category with specific status codes
- **Offline Queue**: Test queue persistence, deduplication, expiration
- **Progress Tracking**: Test progress calculation and display formatting
- **Data Validation**: Test validation logic for ChatGPT data, Figma projects

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using the **fast-check** library (already installed in the project). Each property test will:

- Run a minimum of 100 iterations to ensure comprehensive coverage
- Use smart generators that constrain inputs to valid ranges
- Be tagged with comments referencing the design document property

**PBT Configuration:**
```typescript
import * as fc from 'fast-check';

// Configure for minimum 100 runs
const pbtConfig = { numRuns: 100 };
```

**Property Test Tagging Format:**
Each property-based test must include a comment with this exact format:
```typescript
/**
 * Feature: pbcli-context-engine-integration, Property 1: Authentication validation before requests
 */
```

**Key Property Tests:**

1. **Token Refresh Property**: Generate random expired tokens, verify refresh and retry
2. **Retry Backoff Property**: Generate random transient errors, verify exponential delays
3. **Queue Processing Property**: Generate random operations, verify FIFO processing
4. **Orchestration Property**: Generate random prompts, verify complete pipeline execution
5. **Error Message Property**: Generate random errors, verify user-friendly messages
6. **Progress Display Property**: Generate random progress states, verify correct formatting
7. **Validation Property**: Generate random ChatGPT data (valid and invalid), verify validation

### Integration Testing

Integration tests will verify end-to-end flows:

- Complete `pb enhance` flow from command to response
- Complete `pb link notion` OAuth flow
- Complete `pb devsync` flow with real project analysis
- Offline → online transition with queue processing
- Token expiration → refresh → retry flow

### Test Organization

```
test/
├── unit/
│   ├── apiClient.test.ts
│   ├── auth.test.ts
│   ├── offlineQueue.test.ts
│   ├── progressTracker.test.ts
│   └── validation.test.ts
├── property/
│   ├── tokenRefresh.property.test.ts
│   ├── retryBackoff.property.test.ts
│   ├── queueProcessing.property.test.ts
│   ├── orchestration.property.test.ts
│   └── errorMessages.property.test.ts
└── integration/
    ├── enhance.integration.test.ts
    ├── devsync.integration.test.ts
    └── link.integration.test.ts
```

## Implementation Notes

### Technology Stack

- **CLI Framework**: oclif (already in use)
- **HTTP Client**: axios with custom interceptors (already in use)
- **Authentication Storage**: keytar for secure credential storage (already in use)
- **Progress Display**: Use oclif's built-in `ux.progress` and `ux.action`
- **Syntax Highlighting**: chalk for terminal colors (already in use), consider `cli-highlight` for code
- **Property Testing**: fast-check (already installed)

### Configuration

Store configuration in `~/.pb/config.json`:

```json
{
  "api_base_url": "https://promptbrain-context-engine.vercel.app",
  "retry_config": {
    "max_retries": 3,
    "base_delay": 500,
    "factor": 3
  },
  "offline_queue": {
    "enabled": true,
    "max_age_hours": 24,
    "max_size_mb": 10
  },
  "progress_display": {
    "enabled": true,
    "update_interval_ms": 500
  }
}
```

### Performance Considerations

1. **Token Refresh**: Check expiration before each request, refresh proactively when < 5 minutes remain
2. **Connectivity Check**: Cache connectivity status for 30 seconds to avoid excessive DNS lookups
3. **Queue Processing**: Process queue in batches of 10 to avoid overwhelming the backend
4. **Progress Updates**: Throttle progress updates to max 2 per second to avoid terminal flicker

### Security Considerations

1. **Token Storage**: Use keytar for OS-level secure storage (Keychain on macOS, Credential Manager on Windows)
2. **Queue Storage**: Encrypt sensitive data in queued operations
3. **Logging**: Never log tokens or sensitive user data, even in debug mode
4. **OAuth**: Use PKCE flow for OAuth integrations to prevent authorization code interception

### Backward Compatibility

- Maintain support for Phase-1 backend responses as fallback
- Gracefully handle missing fields in API responses
- Provide migration path for users with old queue format
- Support both old and new configuration formats

### Future Enhancements

- WebSocket support for real-time progress updates
- Parallel queue processing for independent operations
- Smart retry with jitter to avoid thundering herd
- Offline mode with local LLM fallback
- Integration health monitoring and auto-reconnect
