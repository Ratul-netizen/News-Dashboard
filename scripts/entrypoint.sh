#!/bin/bash

echo "🚀 Starting News Dashboard..."

# Start the application in the background
echo "📱 Starting Next.js application..."
node server.js &
APP_PID=$!

# Wait for the application to be ready
echo "⏳ Waiting for application to start..."
sleep 30

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

# Wait for the application process
wait $APP_PID
