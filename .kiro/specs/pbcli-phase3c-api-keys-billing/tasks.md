# Implementation Plan

- [x] 1. Create API key storage module with encryption
  - Implement `src/lib/apiKeyStorage.ts` with dual storage (keytar + encrypted filesystem)
  - Add machine-specific encryption key generation
  - Add encrypt/decrypt functions using AES-256-CBC
  - Add store, retrieve, and remove functions for API keys
  - Ensure filesystem backup has 0600 permissions
  - _Requirements: 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for encryption round-trip
  - **Property 2: Encryption round-trip preservation**
  - **Validates: Requirements 1.5**

- [ ]* 1.2 Write property test for dual storage consistency
  - **Property 1: API key dual storage consistency**
  - **Validates: Requirements 1.3, 1.4**

- [x] 2. Create formatting utilities
  - Implement `src/utils/formatting.ts` with API key masking function
  - Add time until reset formatting function
  - Add usage percentage formatting with colors
  - Add plan name formatting with emojis
  - _Requirements: 2.2, 4.3, 12.1_

- [ ]* 2.1 Write property test for API key masking format
  - **Property 3: API key masking format compliance**
  - **Validates: Requirements 2.2**

- [ ]* 2.2 Write property test for time calculation
  - **Property 9: Time until reset calculation**
  - **Validates: Requirements 4.3**

- [x] 3. Enhance API client with API key support
  - Add API key interfaces to `src/lib/apiClient.ts` (ApiKeyResponse, UsageResponse)
  - Create `apiKeyApi` object with create, list, revoke methods
  - Create `billingApi` object with getUsage, getPortalUrl methods
  - Update request interceptor to load and attach API key from storage
  - Implement authentication waterfall: API key → session token → error
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 3.1 Write property test for authentication waterfall
  - **Property 12: Authentication waterfall priority**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ]* 3.2 Write property test for API key header attachment
  - **Property 13: API key header attachment**
  - **Validates: Requirements 7.2**

- [x] 4. Enhance error handling for billing and quota
  - Update response interceptor in `src/lib/apiClient.ts` for 402 quota_exceeded
  - Add response interceptor handling for 402 payment_required
  - Add response interceptor handling for 401 with API key (remove invalid key)
  - Update error messages in `src/utils/errors.ts` for quota and billing errors
  - Add error codes for quota and payment errors
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 11.3_

- [ ]* 4.1 Write property test for invalid API key cleanup
  - **Property 14: Invalid API key cleanup**
  - **Validates: Requirements 7.5, 11.3**

- [ ]* 4.2 Write property test for non-retryable 402 errors
  - **Property 18: Non-retryable 402 errors**
  - **Validates: Requirements 9.5, 10.5**

- [x] 5. Enhance retry logic
  - Update retry logic in `src/lib/apiClient.ts` to handle 429 with Retry-After header
  - Ensure 5xx and network errors retry up to 3 times with exponential backoff
  - Ensure 402 errors do NOT retry
  - Add retry logging for debugging
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 9.5, 10.5_

- [ ]* 5.1 Write property test for retryable error backoff
  - **Property 15: Retryable error exponential backoff**
  - **Validates: Requirements 8.1, 8.3**

- [ ]* 5.2 Write property test for rate limit retry
  - **Property 16: Rate limit retry with Retry-After**
  - **Validates: Requirements 8.2**

- [ ]* 5.3 Write property test for retry logging
  - **Property 17: Retry attempt logging**
  - **Validates: Requirements 8.5**

- [x] 6. Implement API key create command
  - Create `src/commands/api/key/create.ts` command
  - Check user authentication before creating key
  - Call `apiKeyApi.create()` to generate key
  - Display full key once with warning message
  - Store key using `apiKeyStorage.storeKey()`
  - Handle errors and display troubleshooting suggestions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 6.1 Write unit test for API key creation
  - Test successful creation with valid auth
  - Test failure without authentication
  - Test error handling and display

- [x] 7. Implement API key list command
  - Create `src/commands/api/key/list.ts` command
  - Add --json flag for JSON output
  - Call `apiKeyApi.list()` to fetch keys
  - Mask secrets using `maskApiKey()` utility
  - Display table with ID, masked secret, created_at, scopes
  - Handle empty list with helpful message
  - Support JSON output when flag provided
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 7.1 Write property test for API key display completeness
  - **Property 4: API key display completeness**
  - **Validates: Requirements 2.3**

- [ ]* 7.2 Write property test for JSON output validity
  - **Property 5: JSON output validity with masking**
  - **Validates: Requirements 2.5**

- [ ]* 7.3 Write unit test for empty key list
  - Test display when no keys exist
  - Verify helpful message is shown

- [x] 8. Implement API key revoke command
  - Create `src/commands/api/key/revoke.ts` command
  - Add required `id` argument
  - Check if revoking active key and prompt for confirmation
  - Call `apiKeyApi.revoke(id)` to revoke key
  - Remove key from storage using `apiKeyStorage.removeActiveKey()`
  - Display confirmation message
  - Handle errors and retain storage on failure
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 8.1 Write property test for revocation cleanup
  - **Property 6: Revocation dual cleanup**
  - **Validates: Requirements 3.2**

- [ ]* 8.2 Write property test for storage retention on failure
  - **Property 7: Storage retention on revocation failure**
  - **Validates: Requirements 3.4**

- [ ]* 8.3 Write unit test for active key revocation
  - Test confirmation prompt when revoking active key
  - Test cancellation flow

- [x] 9. Implement usage command
  - Create `src/commands/usage.ts` command
  - Add --json flag for JSON output
  - Call `billingApi.getUsage()` to fetch usage data
  - Display daily usage, limit, plan name, and percentage
  - Calculate and display time until reset
  - Show warning if usage > 80%
  - Show warning if past_due is true
  - Support JSON output when flag provided
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 9.1 Write property test for usage display completeness
  - **Property 8: Usage display completeness**
  - **Validates: Requirements 4.2**

- [ ]* 9.2 Write property test for JSON output validity
  - **Property 10: JSON output validity for usage**
  - **Validates: Requirements 4.6**

- [ ]* 9.3 Write unit test for usage warnings
  - Test 80% warning display
  - Test past-due warning display

- [x] 10. Implement quota command
  - Create `src/commands/quota.ts` command
  - Call `billingApi.getUsage()` to fetch quota data
  - Display plan name prominently using `formatPlanName()`
  - Show "50 requests per day" for Free plan with reset time
  - Show "Unlimited requests" for Pro/Builder plans
  - Display upgrade message for Free plan
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 10.1 Write property test for quota display completeness
  - **Property 11: Quota display completeness**
  - **Validates: Requirements 5.4**

- [ ]* 10.2 Write unit test for plan-specific displays
  - Test Free plan display with limit
  - Test Pro plan display with unlimited
  - Test Builder plan display with unlimited

- [x] 11. Implement billing open command
  - Create `src/commands/billing/open.ts` command
  - Check user authentication before proceeding
  - Call `billingApi.getPortalUrl()` to get portal URL
  - Use `open` package to open URL in browser
  - Display confirmation message on success
  - Display URL for manual access on browser failure
  - Handle authentication errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 11.1 Write unit test for billing portal flow
  - Test successful browser open
  - Test browser failure with URL display
  - Test authentication check

- [x] 12. Add interactive billing portal prompt for payment errors
  - Update 402 payment_required handler in `src/lib/apiClient.ts`
  - Add interactive prompt asking user to open billing portal
  - Execute billing portal open flow if user confirms
  - Display portal URL if user declines
  - _Requirements: 10.2, 10.3, 10.4_

- [ ]* 12.1 Write unit test for payment error interaction
  - Test user confirmation flow
  - Test user decline flow

- [x] 13. Add plan-specific messaging
  - Update usage command to show plan-specific messages
  - Update quota command to show plan-specific messages
  - Add upgrade messaging for Free plan users
  - Add thank you messaging for Pro/Builder users
  - Add urgent messaging when approaching limits
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 13.1 Write unit test for plan-specific messaging
  - Test Free plan upgrade messages
  - Test Pro/Builder thank you messages
  - Test urgent messaging at various thresholds

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Update documentation
  - Update README.md with new commands
  - Add API key management section
  - Add usage and quota tracking section
  - Add billing portal section
  - Document authentication priority (API key vs session)
  - Add security best practices for API keys
  - _Requirements: All_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
