#!/bin/bash
# Zero Cache entrypoint script
# Runs database migrations before starting zero-cache

set -e

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
pnpm exec drizzle-kit migrate

if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migration failed"
    exit 1
fi

echo "Deploying Zero permissions..."
pnpm exec zero-deploy-permissions \
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
echo "  ZERO_REPLICA_FILE: $ZERO_REPLICA_FILE"
echo "  ZERO_APP_ID: ${ZERO_APP_ID:-refinery}"
echo "  ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD:+[set]}"

exec pnpm exec zero-cache
