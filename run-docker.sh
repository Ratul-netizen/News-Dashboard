#!/bin/bash

echo "🚀 News Dashboard Docker Setup"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

echo "✅ Docker environment check passed"

# Check if external API is accessible
echo "🔍 Checking external API accessibility..."
if curl -f http://192.168.100.35:9051/api/posts/ > /dev/null 2>&1; then
    echo "✅ External API is accessible"
else
    echo "⚠️  Warning: External API not accessible. You may need to update the URL in docker.env"
    echo "   Current URL: http://192.168.100.35:9051/api/posts/"
    read -p "   Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Please update docker.env with the correct API URL."
        exit 1
    fi
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose down

# Remove old database if it exists
if [ -f "prisma/dev.db" ]; then
    echo "🗑️  Removing old database..."
    rm -f prisma/dev.db
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check status
echo "📊 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Recent logs (press Ctrl+C to stop viewing logs):"
echo "   To view logs later, run: docker-compose logs -f news-dashboard"
echo ""

# Follow logs for a bit to show progress
timeout 60 docker-compose logs -f news-dashboard || true

echo ""
echo "🎉 Setup completed!"
echo "🌐 Access your dashboard at: http://localhost:3000"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f news-dashboard"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Check status: docker-compose ps"
echo ""
echo "🔍 To monitor data ingestion:"
echo "   docker-compose exec news-dashboard tail -f /var/log/cron.log"
