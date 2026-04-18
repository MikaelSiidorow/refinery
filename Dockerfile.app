# Dockerfile for SvelteKit App
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:24-slim AS builder

# Build metadata (passed from CI)
ARG GITHUB_SHA=unknown
ARG GITHUB_REF_NAME=unknown

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Zero schema from Drizzle schema
RUN pnpm zero:generate

# Build application with metadata
ENV GITHUB_SHA=${GITHUB_SHA}
ENV GITHUB_REF_NAME=${GITHUB_REF_NAME}
RUN pnpm build

# Prune dev dependencies
RUN pnpm prune --prod

# Stage 2: Production
FROM node:24-slim

WORKDIR /app

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

# Copy built app and production dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/scripts/start-with-migrations.js ./scripts/start-with-migrations.js
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node --eval "fetch('http://localhost:3000/').then(r => r.ok || process.exit(1)).catch(() => process.exit(1))"

# Set environment
ENV NODE_ENV=production

# Run migrations before starting the app server
CMD ["node", "scripts/start-with-migrations.js"]
