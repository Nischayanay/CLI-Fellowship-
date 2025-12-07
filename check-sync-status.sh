#!/bin/bash

API_KEY="pb_239d7094b81e9f0e21d6023047380c0f9bd4b08f63cee3b6947fae8bcd67dc8aec60eeaf3eab4b7a"
BASE_URL="http://localhost:3000"

echo "🔍 Checking Notion Sync Status..."
echo ""

# Check integration status
echo "📊 Integration Status:"
curl -s -H "x-api-key: $API_KEY" "$BASE_URL/integrations/list" | jq '.integrations[] | {provider, connected, last_synced_at}'
echo ""

# Check graph data
echo "📈 Graph Data:"
curl -s -H "x-api-key: $API_KEY" "$BASE_URL/api/graph/data" | jq '{nodes: .nodes | length, edges: .edges | length, clusters: .clusters | length}'
echo ""

# Sample nodes if any exist
echo "📝 Sample Nodes:"
curl -s -H "x-api-key: $API_KEY" "$BASE_URL/api/graph/data" | jq '.nodes[:3] | .[] | {label, type, salience}'
echo ""

echo "💡 Tip: Run this script again in a few moments to see sync progress"
