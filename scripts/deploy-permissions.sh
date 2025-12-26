#!/bin/bash
# Deploy Zero permissions and schema to production database
# Run this after deploying PostgreSQL and before deploying Zero Cache

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Zero Permissions Deployment Script  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check required environment variables
if [ -z "$ZERO_UPSTREAM_DB" ]; then
    echo -e "${RED}Error: ZERO_UPSTREAM_DB environment variable is not set${NC}"
    echo "Example: export ZERO_UPSTREAM_DB='postgres://user:password@host:5432/database'"
    exit 1
fi

# Optional: App ID (defaults to 'refinery')
ZERO_APP_ID=${ZERO_APP_ID:-refinery}

echo -e "${YELLOW}Configuration:${NC}"
echo "  App ID: $ZERO_APP_ID"
echo "  Database: ${ZERO_UPSTREAM_DB%%@*}@***"
echo ""

# Confirm before proceeding
read -p "Deploy Zero permissions to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo -e "${GREEN}Step 1: Running Drizzle migrations...${NC}"

# Run Drizzle migrations first
export DATABASE_URL="$ZERO_UPSTREAM_DB"
bunx drizzle-kit migrate

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Drizzle migration failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Drizzle migrations completed${NC}"
echo ""

echo -e "${GREEN}Step 2: Deploying Zero permissions...${NC}"

# Run zero-deploy-permissions
bunx zero-deploy-permissions \
    --schema-path src/lib/zero/schema.ts \
    --upstream-db "$ZERO_UPSTREAM_DB" \
    --app-id "$ZERO_APP_ID" \
    --log-level info

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Permissions deployed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Deploy Zero Cache service"
    echo "  2. Deploy SvelteKit App service"
    echo "  3. Test the application"
else
    echo ""
    echo -e "${RED}✗ Permission deployment failed${NC}"
    exit 1
fi
