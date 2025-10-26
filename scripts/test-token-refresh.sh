#!/bin/bash

echo "🧪 Testing Automatic Token Refresh System"
echo "========================================"

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
sleep 10

# Test token status endpoint
echo "🔍 Testing token status endpoint..."
curl -s http://localhost:3000/api/token/status | jq '.' || echo "❌ Token status endpoint failed"

echo ""
echo "🔄 Testing token refresh endpoint..."
curl -s -X POST http://localhost:3000/api/token/refresh | jq '.' || echo "❌ Token refresh endpoint failed"

echo ""
echo "📊 Testing data ingestion with automatic token..."
curl -s -X POST http://localhost:3000/api/ingest | jq '.success' || echo "❌ Data ingestion failed"

echo ""
echo "✅ Token refresh system test completed!"
echo "💡 Check the dashboard at http://localhost:3000 for the token monitor"
