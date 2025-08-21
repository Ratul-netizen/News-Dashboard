#!/bin/bash

echo "🌱 Starting database seeding process..."

# Navigate to the app directory
cd /app

# Run the database seeding script
echo "📝 Running database seeder..."
npx tsx scripts/seed-database.ts

echo "✅ Database seeding completed!"
echo "🔄 Restarting the application to load new data..."

# Exit successfully
exit 0
