#!/bin/bash

# Linux Docker setup script for News Dashboard
echo "🚀 Setting up News Dashboard with Docker on Linux..."

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

# Make sure the setup script is executable
chmod +x scripts/docker-setup.sh

# Build and start the containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for the application to be ready
echo "⏳ Waiting for the application to start..."
sleep 15

# Check if the application is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ News Dashboard is running successfully!"
    echo "🌐 Access your application at: http://localhost:3000"
    
    # Get the machine's IP address
    HOST_IP=$(hostname -I | awk '{print $1}')
    if [ ! -z "$HOST_IP" ]; then
        echo "🌐 Or use your machine's IP address: http://$HOST_IP:3000"
    fi
    
    # Get external IP if available
    EXTERNAL_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 ipinfo.io/ip 2>/dev/null)
    if [ ! -z "$EXTERNAL_IP" ]; then
        echo "🌐 External IP (if accessible): http://$EXTERNAL_IP:3000"
    fi
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
echo "  Check status: docker-compose ps"
echo ""
echo "🔧 Container management:"
echo "  Enter container: docker exec -it news-dashboard-app /bin/sh"
echo "  View container info: docker inspect news-dashboard-app"
echo "  Check container logs: docker logs news-dashboard-app"
