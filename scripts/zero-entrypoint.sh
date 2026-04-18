#!/bin/bash
# Zero Cache entrypoint script
# Validates required runtime configuration before starting zero-cache

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

REPLICA_DIR="$(dirname "$ZERO_REPLICA_FILE")"

echo "Checking replica directory permissions..."
if [ ! -d "$REPLICA_DIR" ]; then
    echo "✗ Replica directory does not exist: $REPLICA_DIR"
    exit 1
fi

if [ ! -w "$REPLICA_DIR" ]; then
    echo "✗ Replica directory is not writable: $REPLICA_DIR"
    echo "Current permissions: $(ls -ld "$REPLICA_DIR")"
    exit 1
fi
echo "✓ Replica directory is writable"

echo "Starting Zero Cache server..."
echo "Environment check:"
echo "  ZERO_UPSTREAM_DB: ${ZERO_UPSTREAM_DB:0:20}..."
echo "  ZERO_REPLICA_FILE: $ZERO_REPLICA_FILE"
echo "  ZERO_APP_ID: ${ZERO_APP_ID:-refinery}"
echo "  ZERO_PORT: ${ZERO_PORT:-4848}"
echo "  ZERO_LOG_LEVEL: ${ZERO_LOG_LEVEL:-info}"
echo "  ZERO_ADMIN_PASSWORD: ${ZERO_ADMIN_PASSWORD:+[set]}"

if [ -n "$ZERO_CVR_DB" ]; then
    echo "  ZERO_CVR_DB: ${ZERO_CVR_DB:0:20}..."
else
    echo "  ZERO_CVR_DB: [using ZERO_UPSTREAM_DB]"
fi

if [ -n "$ZERO_CHANGE_DB" ]; then
    echo "  ZERO_CHANGE_DB: ${ZERO_CHANGE_DB:0:20}..."
else
    echo "  ZERO_CHANGE_DB: [using ZERO_UPSTREAM_DB]"
fi

exec pnpm exec zero-cache
