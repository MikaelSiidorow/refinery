# Dockerfile for SvelteKit App
# Multi-stage build for optimized production image

# Shared Node + pnpm setup
FROM node:24-slim AS base

# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Stage 1: Install dependencies once
FROM base AS deps

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Stage 2: Copy the filtered repository
FROM deps AS source
COPY . .

# Stage 3: Build the application bundle
FROM source AS app-builder

# Build metadata (passed from CI)
ARG GITHUB_SHA=unknown
ARG GITHUB_REF_NAME=unknown

# Generate Zero schema from Drizzle schema
RUN pnpm zero:generate

# Build application with metadata
ENV GITHUB_SHA=${GITHUB_SHA}
ENV GITHUB_REF_NAME=${GITHUB_REF_NAME}
RUN pnpm build

# Stage 4: Keep a production-only dependency set for runtime images
FROM deps AS prod-deps
RUN pnpm prune --prod

# Shared runtime base for app and migration images
FROM node:24-slim AS runtime-base

WORKDIR /app

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs
USER nodejs

# Set environment
ENV NODE_ENV=production

# Stage 5: SvelteKit runtime image
FROM runtime-base AS app-runtime

# Copy built app and production dependencies
COPY --from=app-builder --chown=nodejs:nodejs /app/build ./build
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node --eval "fetch('http://localhost:3000/').then(r => r.ok || process.exit(1)).catch(() => process.exit(1))"

# Start the application server
CMD ["node", "build"]

# Stage 6: One-shot migration runtime image
FROM runtime-base AS migrate-runtime

COPY --from=source --chown=nodejs:nodejs /app/drizzle ./drizzle
COPY --from=source --chown=nodejs:nodejs /app/scripts/run-migrations.js ./scripts/run-migrations.js
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /app/package.json ./package.json

CMD ["node", "scripts/run-migrations.js"]
