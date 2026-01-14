#!/bin/bash

API_KEY="pb_4fa9848683a4cfca0a419de7371eb482003bdcb2b0a69acc6cad098769b7f10d1673c5b1e4c61969"
BASE_URL="https://api.promptbrain.io"

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
