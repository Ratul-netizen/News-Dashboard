# Use official Node.js 18 Alpine image (Docker Hub)
FROM node:18-alpine

# Install necessary packages
RUN apk add --no-cache \
    bash \
    curl \
    cronie \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy application code
COPY . .

# Generate Prisma client (ensure it's available for Studio)
RUN npx prisma generate || echo "Warning: Prisma generate failed during build, will retry at runtime"

# Make scripts executable
RUN chmod +x scripts/*.sh
RUN chmod +x scripts/*.ts

# Copy startup script
COPY scripts/docker-startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["sh", "-c", "npm run dev & /app/startup.sh"]
