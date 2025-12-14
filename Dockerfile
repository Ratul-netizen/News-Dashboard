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
COPY pnpm-lock.yaml ./

# Install pnpm and project dependencies
RUN npm install -g pnpm
# Configure pnpm to allow build scripts for Prisma
RUN pnpm config set enable-pre-post-scripts true
# Lockfile is out of sync with package.json, so allow pnpm to update it during install
RUN pnpm install --no-frozen-lockfile

# Copy application source
COPY . .

# Generate Prisma client (must succeed before build)
RUN pnpm prisma generate

# Build Next.js for production
RUN pnpm build

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
CMD ["sh", "-c", "pnpm start & /app/startup.sh"]
