# Use Node.js 18 Alpine from Google's mirror to avoid Docker Hub outages
FROM mirror.gcr.io/library/node:18-alpine

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

# Generate Prisma client
RUN npx prisma generate

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
