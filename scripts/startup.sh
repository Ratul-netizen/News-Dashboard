#!/bin/bash

echo "🚀 Starting News Dashboard with real data..."

# Wait a bit for the application to be ready
sleep 20

# Clear any existing data (including fake demo data)
echo "🧹 Clearing existing data..."
curl -X DELETE http://localhost:3000/api/ingest

# Wait a bit more
sleep 5

# Fetch real data from external API
echo "📡 Fetching real data from external API..."
curl -X POST http://localhost:3000/api/ingest

echo "✅ Startup completed! Dashboard should now show real data."
echo "🌐 Access your dashboard at: http://localhost:3000"

# Keep the script running to prevent container exit
tail -f /dev/null
