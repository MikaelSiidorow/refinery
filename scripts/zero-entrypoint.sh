#!/bin/bash
# Zero Cache entrypoint script
# Runs database migrations and deploys permissions before starting zero-cache

set -e

# Validate required environment variables
if [ -z "$ZERO_UPSTREAM_DB" ]; then
    echo "✗ ZERO_UPSTREAM_DB is required"
    exit 1
fi

if [ -z "$ZERO_REPLICA_FILE" ]; then
    echo "✗ ZERO_REPLICA_FILE is required"
    exit 1
fi

# In production, ZERO_ADMIN_PASSWORD is required
if [ "$NODE_ENV" = "production" ] && [ -z "$ZERO_ADMIN_PASSWORD" ]; then
    echo "✗ ZERO_ADMIN_PASSWORD is required in production"
    echo "  Generate one with: openssl rand -base64 32"
    exit 1
fi

# Ensure /data directory is writable
echo "Checking /data directory permissions..."
if [ ! -w /data ]; then
    echo "✗ /data directory is not writable"
    echo "Current permissions: $(ls -ld /data)"
    exit 1
fi
echo "✓ /data directory is writable"

echo "Running database migrations..."
export DATABASE_URL="$ZERO_UPSTREAM_DB"
bunx drizzle-kit migrate

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migration failed"
    exit 1
fi

echo "Deploying Zero permissions..."
bunx zero-deploy-permissions \
    --schema-path src/lib/zero/schema.ts \
    --upstream-db "$ZERO_UPSTREAM_DB" \
    --app-id "${ZERO_APP_ID:-refinery}" \
    --log-level info

if [ $? -eq 0 ]; then
    echo "✓ Permissions deployed successfully"
else
    echo "✗ Permission deployment failed"
    exit 1
fi

echo "Starting Zero Cache server..."
echo "Environment check:"
echo "  ZERO_UPSTREAM_DB: ${ZERO_UPSTREAM_DB:0:20}..."
echo "  ZERO_CVR_DB: ${ZERO_CVR_DB:0:20:-[using ZERO_UPSTREAM_DB]}..."
echo "  ZERO_CHANGE_DB: ${ZERO_CHANGE_DB:0:20:-[using ZERO_UPSTREAM_DB]}..."
echo "  ZERO_REPLICA_FILE: $ZERO_REPLICA_FILE"
echo "  ZERO_APP_ID: ${ZERO_APP_ID:-refinery}"
echo "  ZERO_PORT: ${ZERO_PORT:-4848}"
echo "  ZERO_LOG_LEVEL: ${ZERO_LOG_LEVEL:-info}"
echo "  ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD:+[set]}"

# Start zero-cache with environment variables
# CVR_DB and CHANGE_DB default to ZERO_UPSTREAM_DB if not set
exec bunx zero-cache
