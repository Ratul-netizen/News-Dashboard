# News Dashboard - Docker Setup

This guide explains how to run the News Dashboard project using Docker.

## Prerequisites

- Docker installed and running
- Docker Compose installed
- At least 2GB of available RAM

## Quick Start

### Option 1: Using the setup script (Recommended)

#### On Windows/macOS:
```bash
# Run the setup script
./scripts/docker-setup.sh
```

#### On Linux:
```bash
# Make the script executable (first time only)
chmod +x scripts/docker-setup.sh

# Run the setup script
./scripts/docker-setup.sh

# Or use the Linux-specific script
chmod +x scripts/docker-linux-setup.sh
./scripts/docker-linux-setup.sh
```

### Option 2: Manual Docker commands

```bash
# Build and start the containers
docker-compose up --build -d

# Check the logs
docker-compose logs -f

# Stop the containers
docker-compose down
```

## Automatic Script Permissions (Linux)

When you deploy this project to a Linux environment, Docker automatically handles script permissions:

- **Dockerfile**: Automatically runs `chmod +x scripts/*.sh` during build
- **Volume Mount**: Scripts directory is mounted as read-only volume
- **Cross-platform**: Works seamlessly between Windows, macOS, and Linux

The container automatically makes all shell scripts executable, so you don't need to manually set permissions.

## Accessing the Application

Once running, you can access the News Dashboard at:

- **Localhost**: http://localhost:3000
- **Network IP**: http://YOUR_MACHINE_IP:3000
- **Any IP**: The container is configured to accept connections from any IP address

## Configuration

### Environment Variables

The application uses the following environment variables (set in docker-compose.yml):

- `NODE_ENV=production`
- `HOSTNAME=0.0.0.0` (allows external connections)
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1`

### Port Configuration

- **Container Port**: 3000 (internal)
- **Host Port**: 3000 (external)
- **Binding**: `0.0.0.0:3000:3000` (accepts connections from any IP)

## Docker Commands

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f news-dashboard

# Restart the application
docker-compose restart news-dashboard

# Rebuild and restart
docker-compose up --build -d

# Stop all services
docker-compose down

# Remove all containers and images
docker-compose down --rmi all --volumes --remove-orphans
```

## Troubleshooting

### Port already in use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process or change the port in docker-compose.yml
```

### Container won't start
```bash
# Check container logs
docker-compose logs news-dashboard

# Check container status
docker-compose ps
```

### Permission issues
```bash
# If you get permission errors, run with sudo
sudo docker-compose up --build -d
```

### Database issues
The application uses SQLite by default. If you want to use PostgreSQL:

1. Uncomment the postgres service in `docker-compose.yml`
2. Update your environment variables
3. Run `docker-compose up --build -d`

## Network Configuration

The Docker setup creates a custom bridge network (`news-network`) that:

- Isolates the application from other Docker networks
- Allows the container to bind to `0.0.0.0` (all IPs)
- Provides consistent networking across different environments

## Health Checks

The container includes health checks that:

- Test the application endpoint every 30 seconds
- Wait 40 seconds after startup before beginning checks
- Retry up to 3 times before marking as unhealthy

## Performance

- **Multi-stage build**: Optimizes image size
- **Alpine Linux**: Lightweight base image
- **Standalone output**: Next.js optimized for production
- **Non-root user**: Security best practice

## Security

- Runs as non-root user (`nextjs`)
- Exposes only necessary ports
- Includes security headers
- No sensitive data in the image

## Development vs Production

This Docker setup is optimized for production. For development:

1. Remove the `output: 'standalone'` from `next.config.mjs`
2. Use volume mounts for hot reloading
3. Expose additional ports for debugging

## Linux Deployment

When deploying to Linux servers:

1. **Automatic Permissions**: Docker automatically makes scripts executable
2. **Volume Mounts**: Scripts are accessible from the host system
3. **Cross-platform**: Same setup works on any Linux distribution
4. **No Manual Steps**: Everything is handled automatically during build

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify Docker is running: `docker info`
3. Check port availability: `netstat -tulpn | grep :3000`
4. Ensure sufficient disk space: `df -h`
