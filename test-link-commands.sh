#!/bin/bash

# Test script for pb link commands
# This tests the CLI link functionality manually

set -e

echo "=========================================="
echo "Testing PB Link Commands"
echo "=========================================="
echo ""

# Set API URL to localhost
export PB_API_URL=http://localhost:3000

# Your API key (from earlier testing)
API_KEY="pb_239d7094b81e9f0e21d6023047380c0f9bd4b08f63cee3b6947fae8bcd67dc8aec60eeaf3eab4b7a"

echo "1. Testing login..."
node bin/pb login --email promptbrain.ops@gmail.com --password 1234567890
echo "✓ Login successful"
echo ""

echo "2. Testing whoami..."
node bin/pb whoami
echo ""

echo "3. Testing link list..."
node bin/pb link list
echo ""

echo "4. Testing backend /integrations/list endpoint directly..."
curl -s -H "x-api-key: $API_KEY" http://localhost:3000/integrations/list | jq .
echo ""

echo "5. Testing backend /cli/link/start endpoint directly..."
curl -s -X POST \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider":"notion","cli_session":"550e8400-e29b-41d4-a716-446655440000"}' \
  http://localhost:3000/cli/link/start | jq .
echo ""

echo "=========================================="
echo "Expected Results:"
echo "=========================================="
echo "✓ Login works"
echo "✓ Whoami shows user info"
echo "✓ Link list shows authentication error (needs API key in CLI)"
echo "✓ Direct API call to /integrations/list works with API key"
echo "✓ Direct API call to /cli/link/start fails with 'cli_sessions table not found'"
echo ""
echo "Next Steps:"
echo "1. Create cli_sessions table in database"
echo "2. Update CLI to use API key for integration endpoints"
echo "3. Test full OAuth flow"
