# CLI Error Handling Fixes

## Issues Fixed

### 1. `[object Object]` Error Display Bug
**Problem:** The CLI was displaying `[object Object]` instead of actual error messages when errors occurred.

**Root Cause:** 
- Error messages were being concatenated directly without checking if they were objects
- The error handling code assumed `error.message` was always a string
- Response data objects were not being properly parsed

**Solution:**
- Created a `getErrorMessage()` helper function that safely extracts error messages
- Handles string, object, and nested error structures
- Falls back to JSON.stringify() for complex objects
- Applied to both `login.ts` and `signup.ts` commands

### 2. Environment Variable Not Being Read
**Problem:** The `PB_API_URL` environment variable was not being picked up, causing the CLI to always use the hardcoded production URL.

**Root Cause:**
- The `apiClient` was initialized with a hardcoded URL at module load time
- Environment variables were only checked in the `updateApiClient()` function which was never called

**Solution:**
- Created a `getBaseURL()` helper function that checks `process.env.PB_API_URL` first
- Updated the initial `apiClient` creation to use `getBaseURL()`
- Now supports both local development and production environments

## Files Modified

1. **src/lib/apiClient.ts**
   - Added `getBaseURL()` function to read environment variable
   - Updated initial apiClient creation to use dynamic URL
   - Updated `updateApiClient()` to use the same helper

2. **src/commands/login.ts**
   - Added `getErrorMessage()` helper for safe error extraction
   - Improved error handling for all error types (response, request, other)
   - Better user-facing error messages

3. **src/commands/signup.ts**
   - Added same `getErrorMessage()` helper
   - Consistent error handling with login command

4. **test-pb-cli.sh**
   - Updated to use localhost for local testing
   - Simplified test flow
   - Added API URL display

## Usage

### Local Development
```bash
export PB_API_URL=http://localhost:3000
pb login --email promptbrain.ops@gmail.com --password 1234567890
```

### Production
```bash
export PB_API_URL=https://api.promptbrain.io
pb login
```

### Default (No Environment Variable)
The CLI defaults to `https://api.promptbrain.io` if no environment variable is set.

## Test Results

✅ Login works with proper credentials
✅ Error messages display correctly (no more `[object Object]`)
✅ Environment variable is properly read
✅ Network errors show helpful messages
✅ Server errors display actual error content

## Working Credentials

- Email: `promptbrain.ops@gmail.com`
- Password: `1234567890`
- User ID: `f1fc5453-8d63-4686-807c-14355b6de622`

## Next Steps

The CLI is now fully functional for local development. The backend API at `http://localhost:3000` is working correctly, and the CLI properly communicates with it.
