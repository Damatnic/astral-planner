# ===================================================================
# Quantum's Production-Grade Dockerfile - Zero Downtime Deployment
# Multi-stage build with security hardening and performance optimization
# ===================================================================

# Builder stage with full development environment
FROM node:18-alpine AS base
RUN apk add --no-cache \
    dumb-init \
    libc6-compat \
    curl \
    ca-certificates
WORKDIR /app

# Dependencies stage - optimized for caching
FROM base AS deps
# Copy package files with integrity checks
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Development dependencies for building
FROM base AS build-deps
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Builder stage with security scanning
FROM build-deps AS builder
COPY . .

# Security: Remove potential secrets from build context
RUN rm -f .env* 2>/dev/null || true

# Build optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PRIVATE_STANDALONE=true

# Build with optimizations
RUN npm run build && \
    npm run bundle:check

# Security scanning during build
RUN npm audit --audit-level=moderate || true

# Production runtime stage
FROM base AS runner
WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security: Create non-root user with minimal privileges
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create required directories with proper permissions
RUN mkdir -p logs cache tmp && \
    chown -R nextjs:nodejs logs cache tmp && \
    chmod 755 logs cache tmp

# Security hardening
RUN rm -rf /tmp/* /var/cache/apk/* && \
    rm -f /etc/passwd- /etc/shadow- /etc/group- && \
    find /app -type f -name "*.md" -delete && \
    find /app -type f -name "*.txt" -delete

# Health check script
COPY --chown=nextjs:nodejs <<EOF /app/healthcheck.js
const http = require('http');
const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  timeout: 5000,
  method: 'GET'
};

const healthCheck = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error('Health check failed with status:', res.statusCode);
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('Health check error:', err.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.error('Health check timeout');
  process.exit(1);
});

healthCheck.end();
EOF

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check with improved reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Labels for container metadata
LABEL maintainer="quantum@astral-planner.com" \
      version="1.0.0" \
      description="Astral Planner - Production Grade Container" \
      org.opencontainers.image.source="https://github.com/astral-planner/app" \
      org.opencontainers.image.title="Astral Planner" \
      org.opencontainers.image.description="AI-powered digital planner" \
      org.opencontainers.image.licenses="MIT"