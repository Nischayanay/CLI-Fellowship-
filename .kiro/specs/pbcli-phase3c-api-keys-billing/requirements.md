# Requirements Document

## Introduction

This specification defines Phase-3C of the PromptBrain CLI (PBCLI), which transforms PBCLI into a professional-grade developer platform client similar to Stripe CLI, Supabase CLI, and OpenAI CLI. This phase implements API key management, usage tracking, quota enforcement, billing portal integration, and intelligent error handling to provide a seamless developer experience.

The backend Context Engine is already deployed at https://promptbrain-context-engine.vercel.app and provides all necessary endpoints for API keys, billing, quotas, and usage tracking. PBCLI will integrate with these existing endpoints.

## Glossary

- **PBCLI**: PromptBrain Command Line Interface - the CLI tool being enhanced
- **Context Engine**: The backend API service deployed at https://promptbrain-context-engine.vercel.app
- **API Key**: A secret token used to authenticate CLI requests to the Context Engine
- **Keytar**: A Node.js library for securely storing secrets in the operating system's keychain
- **Quota**: The usage limit for API requests based on the user's subscription plan
- **Billing Portal**: Stripe Customer Portal where users manage their subscription and payment methods
- **Session Token**: Supabase authentication token used as fallback when API key is not present
- **Masked Key**: An API key displayed with most characters hidden (format: pb_xxxxxx_last4)
- **Free Plan**: Subscription tier with 50 requests per day limit
- **Pro Plan**: Subscription tier with unlimited requests
- **Builder Plan**: Subscription tier with unlimited requests and additional features
- **Retry Logic**: Automatic re-attempt of failed requests with exponential backoff
- **402 Status Code**: HTTP status indicating payment required or quota exceeded

## Requirements

### Requirement 1

**User Story:** As a developer, I want to generate API keys for my CLI, so that I can authenticate my requests without using interactive login sessions.

#### Acceptance Criteria

1. WHEN a user executes `pb api key create` THEN the CLI SHALL send a POST request to /auth/api-key endpoint
2. WHEN the Context Engine returns an API key THEN the CLI SHALL display the full secret key once to the user
3. WHEN an API key is created THEN the CLI SHALL store the key securely in the operating system keychain using keytar
4. WHEN an API key is created THEN the CLI SHALL also store a backup copy in the filesystem at ~/.promptbrain/api-keys.json with restricted permissions
5. WHEN storing the API key THEN the CLI SHALL encrypt the filesystem backup using a machine-specific key
6. WHEN the API key creation fails THEN the CLI SHALL display the error message from the Context Engine and suggest troubleshooting steps

### Requirement 2

**User Story:** As a developer, I want to list my existing API keys, so that I can see which keys are active and when they were created.

#### Acceptance Criteria

1. WHEN a user executes `pb api key list` THEN the CLI SHALL send a GET request to /auth/api-key endpoint
2. WHEN displaying API keys THEN the CLI SHALL mask the secret using the format pb_xxxxxx_last4 where last4 represents the final 4 characters
3. WHEN displaying API keys THEN the CLI SHALL show the key ID, masked secret, creation timestamp, and scopes for each key
4. WHEN displaying API keys THEN the CLI SHALL format the output in a readable table format
5. WHEN the --json flag is provided THEN the CLI SHALL output the key list as JSON with masked secrets
6. WHEN no API keys exist THEN the CLI SHALL display a helpful message suggesting the user run `pb api key create`

### Requirement 3

**User Story:** As a developer, I want to revoke API keys, so that I can invalidate compromised or unused keys.

#### Acceptance Criteria

1. WHEN a user executes `pb api key revoke <id>` THEN the CLI SHALL send a DELETE request to /auth/api-key/:id endpoint
2. WHEN an API key is successfully revoked THEN the CLI SHALL remove it from both keytar and the filesystem backup
3. WHEN an API key is successfully revoked THEN the CLI SHALL display a confirmation message with the revoked key ID
4. WHEN the revocation fails THEN the CLI SHALL display the error message and retain the local key storage
5. WHEN revoking the currently active API key THEN the CLI SHALL warn the user and prompt for confirmation before proceeding

### Requirement 4

**User Story:** As a developer, I want to check my API usage, so that I can monitor how many requests I've made and how many remain.

#### Acceptance Criteria

1. WHEN a user executes `pb usage` THEN the CLI SHALL send a GET request to /billing/usage endpoint
2. WHEN displaying usage THEN the CLI SHALL show daily requests made, daily limit, current plan name, and usage percentage
3. WHEN displaying usage THEN the CLI SHALL show the time until the next quota reset
4. WHEN the account has a past-due status THEN the CLI SHALL display a warning message with a link to the billing portal
5. WHEN usage exceeds 80 percent of the quota THEN the CLI SHALL display a warning suggesting the user upgrade their plan
6. WHEN the --json flag is provided THEN the CLI SHALL output usage data as JSON

### Requirement 5

**User Story:** As a developer, I want to check my quota limits, so that I can understand my plan's capabilities and restrictions.

#### Acceptance Criteria

1. WHEN a user executes `pb quota` THEN the CLI SHALL send a GET request to /billing/usage endpoint
2. WHEN displaying quota for Free Plan THEN the CLI SHALL show "50 requests per day" with the next reset time
3. WHEN displaying quota for Pro Plan or Builder Plan THEN the CLI SHALL show "Unlimited requests"
4. WHEN displaying quota THEN the CLI SHALL show the current plan name prominently
5. WHEN on Free Plan THEN the CLI SHALL display an upgrade message with a link to pricing information

### Requirement 6

**User Story:** As a developer, I want to open the billing portal, so that I can manage my subscription and payment methods.

#### Acceptance Criteria

1. WHEN a user executes `pb billing open` THEN the CLI SHALL send a GET request to /billing/portal endpoint
2. WHEN the Context Engine returns a portal URL THEN the CLI SHALL open the URL in the user's default browser
3. WHEN the browser opens successfully THEN the CLI SHALL display a confirmation message
4. WHEN the browser fails to open THEN the CLI SHALL display the portal URL for manual access
5. WHEN the user is not authenticated THEN the CLI SHALL prompt the user to run `pb login` first

### Requirement 7

**User Story:** As a developer, I want the CLI to automatically attach my API key to requests, so that I don't have to manually authenticate each command.

#### Acceptance Criteria

1. WHEN making any API request THEN the CLI SHALL attempt to load an API key from keytar first
2. WHEN an API key exists THEN the CLI SHALL attach it to the request using the x-api-key header
3. WHEN no API key exists THEN the CLI SHALL fallback to using the Supabase session token with Authorization header
4. WHEN both API key and session token are missing THEN the CLI SHALL prompt the user to authenticate
5. WHEN the API key is invalid THEN the CLI SHALL remove it from storage and fallback to session token

### Requirement 8

**User Story:** As a developer, I want the CLI to automatically retry failed requests, so that transient network issues don't interrupt my workflow.

#### Acceptance Criteria

1. WHEN a request fails with a 5xx status code THEN the CLI SHALL retry the request up to 3 times with exponential backoff
2. WHEN a request fails with a 429 rate limit status THEN the CLI SHALL retry after the duration specified in the Retry-After header
3. WHEN a request fails with a network error THEN the CLI SHALL retry up to 3 times with exponential backoff
4. WHEN all retry attempts are exhausted THEN the CLI SHALL display the final error message to the user
5. WHEN retrying a request THEN the CLI SHALL log the retry attempt number and delay for debugging purposes

### Requirement 9

**User Story:** As a developer, I want the CLI to handle quota exceeded errors gracefully, so that I understand why my request failed and what actions I can take.

#### Acceptance Criteria

1. WHEN the Context Engine returns a 402 status with quota_exceeded error THEN the CLI SHALL display a message indicating the quota is exceeded
2. WHEN quota is exceeded THEN the CLI SHALL display the time until the next quota reset
3. WHEN quota is exceeded THEN the CLI SHALL display a link to upgrade the plan at https://promptbrain.io/pricing
4. WHEN the Context Engine returns upgrade_required flag THEN the CLI SHALL display a prominent upgrade message
5. WHEN quota is exceeded THEN the CLI SHALL NOT retry the request

### Requirement 10

**User Story:** As a developer, I want the CLI to handle payment required errors gracefully, so that I can quickly resolve billing issues.

#### Acceptance Criteria

1. WHEN the Context Engine returns a 402 status with payment_required error THEN the CLI SHALL display a message indicating payment is required
2. WHEN payment is required THEN the CLI SHALL automatically offer to open the billing portal
3. WHEN the user confirms THEN the CLI SHALL execute the billing portal open flow
4. WHEN the user declines THEN the CLI SHALL display the billing portal URL for manual access
5. WHEN payment is required THEN the CLI SHALL NOT retry the request

### Requirement 11

**User Story:** As a developer, I want the CLI to handle authentication errors gracefully, so that I can quickly re-authenticate when my session expires.

#### Acceptance Criteria

1. WHEN the Context Engine returns a 401 unauthorized status THEN the CLI SHALL display a message indicating authentication is required
2. WHEN authentication fails THEN the CLI SHALL suggest running `pb login` to re-authenticate
3. WHEN using an API key and receiving 401 THEN the CLI SHALL remove the invalid API key from storage
4. WHEN using a session token and receiving 401 THEN the CLI SHALL attempt to refresh the token once
5. WHEN token refresh fails THEN the CLI SHALL prompt the user to run `pb login`

### Requirement 12

**User Story:** As a developer, I want the CLI to display contextual plan information, so that I understand the capabilities and limitations of my current subscription.

#### Acceptance Criteria

1. WHEN displaying usage or quota information THEN the CLI SHALL show the current plan name (Free, Pro, or Builder)
2. WHEN on Free Plan THEN the CLI SHALL display upgrade messaging in usage and quota commands
3. WHEN on Pro or Builder Plan THEN the CLI SHALL display a thank you message for being a subscriber
4. WHEN approaching quota limits on Free Plan THEN the CLI SHALL display increasingly urgent upgrade messages
5. WHEN quota is exceeded THEN the CLI SHALL display plan-specific messaging with appropriate upgrade paths
