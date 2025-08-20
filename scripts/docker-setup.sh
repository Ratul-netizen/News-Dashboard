#!/bin/bash

# Docker setup script for News Dashboard
echo "🚀 Setting up News Dashboard with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build and start the containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for the application to be ready
echo "⏳ Waiting for the application to start..."
sleep 10

# Check if the application is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ News Dashboard is running successfully!"
    echo "🌐 Access your application at: http://localhost:3000"
    echo "🌐 Or use your machine's IP address: http://$(hostname -I | awk '{print $1}'):3000"
else
    echo "❌ Application failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart"
echo "  Rebuild: docker-compose up --build -d"
