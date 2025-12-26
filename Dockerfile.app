# Dockerfile for SvelteKit App
# Multi-stage build for optimized production image

ARG BUN_VERSION=1.3.3

# Stage 1: Build
FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Zero schema from Drizzle schema
RUN bun run zero:generate

# Build application
RUN bun run build

# Prune dev dependencies
RUN rm -rf node_modules && bun install --frozen-lockfile --production

# Stage 2: Production
FROM oven/bun:${BUN_VERSION}-slim

WORKDIR /app

# Copy built app and production dependencies from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/').then(r => r.ok || process.exit(1)).catch(() => process.exit(1))"

# Set environment
ENV NODE_ENV=production

# Start server
CMD ["bun", "run", "./build"]
