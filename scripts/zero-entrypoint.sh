#!/bin/bash
# Zero Cache entrypoint script
# Runs database migrations before starting zero-cache

set -e

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
exec pnpm exec zero-cache
