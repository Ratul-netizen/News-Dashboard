# Use official Node.js 18 Alpine image
FROM node:18-alpine

# Install OS packages required for Prisma & runtime
RUN apk add --no-cache \
  bash \
  curl \
  cronie \
  openssl \
  libc6-compat \
  && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install project dependencies using npm
RUN npm ci --legacy-peer-deps

# Copy application source
COPY . .

# Generate Prisma client (must succeed before build)
RUN npx prisma generate

# Build Next.js for production
RUN npm run build

# Ensure scripts are executable
RUN chmod +x scripts/*.sh

# Copy startup script and set permissions
COPY scripts/docker-startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Expose Next.js port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start production server and auxiliary startup tasks
CMD ["sh", "-c", "npm start & /app/startup.sh"]
