# Production Deployment Guide

This guide covers deploying Refinery to production using Coolify on Hetzner.

## Architecture Overview

Refinery consists of four services:

1. **PostgreSQL** - Database with WAL replication enabled
2. **Zero Cache Server** - Local-first sync server (`zero.yourdomain.com`)
3. **SvelteKit App** - Main application (`app.yourdomain.com`)
4. **Drizzle Studio** (optional) - Database management UI (`db.yourdomain.com`)

```
┌─────────────┐
│   Client    │
│   Browser   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       v                 v
┌──────────────┐  ┌──────────────┐
│  SvelteKit   │  │  Zero Cache  │
│     App      │  │    Server    │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │    ┌────────────┤
       │    │            │
       v    v            v
   ┌─────────────┐  ┌──────────────┐
   │ PostgreSQL  │  │   Drizzle    │
   │             │  │    Studio    │
   └─────────────┘  └──────────────┘
```

## Prerequisites

- Coolify instance on Hetzner (or similar platform)
- Domain with DNS access
- GitHub OAuth app (production credentials)

## Container Images

Docker images are automatically built and published to GitHub Container Registry (GHCR) on every push to `main`:

- **SvelteKit App**: `ghcr.io/[owner]/refinery/app:latest`
- **Zero Cache**: `ghcr.io/[owner]/refinery/zero:latest`
- **Drizzle Studio**: `ghcr.io/[owner]/refinery/drizzle:latest`

The CI workflow (`.github/workflows/docker-build.yml`) builds all three images in parallel and tags them with:

- `latest` - Latest build from main branch
- `main-<sha>` - Commit SHA for traceability
- `v*` - Semantic version tags (e.g., `v1.0.0`)

**To use a specific version**, replace `latest` with the desired tag in Coolify.

### Making Images Accessible

**Option 1: Public Images** (Recommended for open source)

- Go to your GitHub repository → Packages → Select each image
- Change visibility to "Public" under Package settings
- Coolify can pull images without authentication

**Option 2: Private Images with Authentication**

- In Coolify, configure Docker registry credentials:
  - **Registry**: `ghcr.io`
  - **Username**: Your GitHub username
  - **Password**: GitHub Personal Access Token with `read:packages` scope
- Generate PAT at: https://github.com/settings/tokens

## DNS Setup

Configure DNS records for your domain:

```
app.yourdomain.com  → A/CNAME to your server
zero.yourdomain.com → A/CNAME to your server
db.yourdomain.com   → A/CNAME to your server (optional)
```

## Deployment Steps

### 1. Deploy PostgreSQL

In Coolify, create a new PostgreSQL database service:

**Service Configuration:**

- **Version**: PostgreSQL 16 or later
- **Port**: 5432 (internal)
- **Volume**: `/var/lib/postgresql/data` (persistent)

**Required Configuration:**

```bash
# PostgreSQL must have WAL level set to logical for Zero replication
wal_level=logical
max_wal_senders=10
max_replication_slots=10
```

**Environment Variables:**

```bash
POSTGRES_DB=refinery
POSTGRES_USER=refinery
POSTGRES_PASSWORD=<generate-secure-password>
```

Save the database connection string:

```
postgres://refinery:<password>@postgres:5432/refinery
```

### 2. Deploy Zero Cache Server

In Coolify, create a new service from Docker image:

**Image Configuration:**

- **Image**: `ghcr.io/[owner]/refinery/zero:latest`
- **Port**: 4848
- **Domain**: `zero.yourdomain.com`

**Required Environment Variables:**

```bash
NODE_ENV=production
ZERO_UPSTREAM_DB=postgres://refinery:<password>@postgres:5432/refinery
ZERO_REPLICA_FILE=/data/sync-replica.db
ZERO_ADMIN_PASSWORD=<generate-secure-password>  # Required in production
```

**Optional Environment Variables (Recommended):**

```bash
# App identifier for multi-tenancy (default: "zero")
ZERO_APP_ID=refinery

# Performance optimization: Separate databases for CVR and change tracking
# If not set, both default to ZERO_UPSTREAM_DB (single database)
# ZERO_CVR_DB=postgres://refinery:<password>@postgres:5432/refinery_cvr
# ZERO_CHANGE_DB=postgres://refinery:<password>@postgres:5432/refinery_change

# Server configuration
ZERO_PORT=4848  # Default: 4848
ZERO_LOG_LEVEL=info  # Options: debug, info, warn, error
```

**Volume Mount:**

```
/data → Container path for persistent Zero replica file
```

**Health Check:**

- Endpoint: `/` (not `/health`)
- Expected: HTTP 200 with "OK"

**Important**: On first startup, the Zero Cache container will:

1. Validate required environment variables
2. Run Drizzle migrations to create/update database tables
3. Deploy Zero permissions to PostgreSQL
4. Start the zero-cache server

Check the container logs to confirm migrations and permissions deployed successfully before proceeding.

#### Zero Configuration Details

**Authentication Method**: Cookie-based (not JWT)

- We use SvelteKit session cookies forwarded to Zero endpoints
- No need for `ZERO_AUTH_SECRET` or `ZERO_AUTH_JWKS_URL`

**Database Architecture**:

- **ZERO_UPSTREAM_DB**: Main authoritative PostgreSQL database (required)
- **ZERO_CVR_DB**: Client View Records database (optional, defaults to ZERO_UPSTREAM_DB)
- **ZERO_CHANGE_DB**: Replication log database (optional, defaults to ZERO_UPSTREAM_DB)

For small to medium deployments, using a single database (ZERO_UPSTREAM_DB) is sufficient. Separate databases can improve performance for high-scale deployments.

**Custom Image vs Official Image**:
Our deployment uses a custom Docker image that:

- Automatically runs Drizzle migrations on startup
- Deploys Zero permissions before starting zero-cache
- Simplifies deployment (no external migration orchestration needed)

This differs from Rocicorp's official `rocicorp/zero` image, which requires separate migration and permission deployment steps.

### 3. Deploy SvelteKit App

In Coolify, create a new service from Docker image:

**Image Configuration:**

- **Image**: `ghcr.io/[owner]/refinery/app:latest`
- **Port**: 3000
- **Domain**: `app.yourdomain.com`

**Environment Variables:**

```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://refinery:<password>@postgres:5432/refinery

# Zero configuration
ZERO_UPSTREAM_DB=postgres://refinery:<password>@postgres:5432/refinery
ZERO_REPLICA_FILE=/tmp/sync-replica.db
ZERO_MUTATE_URL=https://app.yourdomain.com/api/zero/mutate
ZERO_GET_QUERIES_URL=https://app.yourdomain.com/api/zero/get-queries
PUBLIC_SERVER=https://zero.yourdomain.com

# Zero cookie forwarding
ZERO_GET_QUERIES_FORWARD_COOKIES=true
ZERO_MUTATE_FORWARD_COOKIES=true

# Cookie domain (enables cookie sharing between app and zero subdomains)
COOKIE_DOMAIN=.yourdomain.com

# GitHub OAuth (production app)
GITHUB_CLIENT_ID=<your-production-client-id>
GITHUB_CLIENT_SECRET=<your-production-client-secret>
```

**GitHub OAuth Callback URL:**

```
https://app.yourdomain.com/auth/callback/github
```

Update your GitHub OAuth app settings with this callback URL.

**Health Check:**

- Endpoint: `/`
- Expected: HTTP 200

### 5. Deploy Drizzle Studio (Optional)

In Coolify, create a new service from Docker image:

**Image Configuration:**

- **Image**: `ghcr.io/[owner]/refinery/drizzle:latest`
- **Port**: 4983
- **Domain**: `db.yourdomain.com`

**Environment Variables:**

```bash
DATABASE_URL=postgres://refinery:<password>@postgres:5432/refinery
```

**Security Note:** Restrict access to Drizzle Studio using Coolify's authentication or firewall rules.

## Verification

### Health Checks

Run the health check script to verify all services:

```bash
# Set environment variables
export APP_URL="https://app.yourdomain.com"
export ZERO_URL="https://zero.yourdomain.com"
export ZERO_ADMIN_PASSWORD="<your-admin-password>"

# Run health check
node scripts/health-check.mjs
```

Expected output:

```
Checking SvelteKit App... ✓ OK (HTTP 200)
Checking Zero Cache (public)... ✓ OK (HTTP 200)
Checking Zero Cache (admin)... ✓ OK (HTTP 200)
✓ All services are healthy!
```

### Manual Verification

1. **Visit SvelteKit App**: https://app.yourdomain.com
   - Should load the login page
   - GitHub OAuth should work

2. **Check Zero Cache**: https://zero.yourdomain.com/health
   - Should return: `{"ok":true}`

3. **Test Zero Admin**: https://zero.yourdomain.com/statz
   - Requires: `Authorization: Bearer <ZERO_ADMIN_PASSWORD>` header
   - Should return Zero statistics JSON

4. **Check Drizzle Studio** (if deployed): https://db.yourdomain.com
   - Should show database management UI
   - Verify tables are created

## Updating the Deployment

### Schema Changes

When you modify the database schema:

```bash
# 1. Update src/lib/server/db/schema.ts locally
# 2. Generate migration
pnpm db:generate

# 3. Commit migration files
git add src/lib/server/db/migrations
git commit -m "feat: add new schema migration"

# 4. Regenerate Zero schema
pnpm zero:generate

# 5. Commit and push
git add src/lib/zero/zero-schema.gen.ts
git commit -m "chore: regenerate zero schema"
git push
```

The deployment workflow:

1. GitHub Actions builds new Docker images with the migrations included
2. Coolify pulls and restarts the Zero Cache service
3. Zero Cache automatically runs migrations and deploys permissions on startup
4. SvelteKit app is redeployed with the updated Zero schema

**Manual migration (if needed)**: Use `scripts/deploy-permissions.sh` for manual schema deployment without restarting services.

### Application Updates

For application code changes:

```bash
git commit -m "feat: your changes"
git push
```

The deployment workflow:

1. GitHub Actions automatically builds new Docker images
2. Images are pushed to GHCR with `latest` tag
3. Coolify pulls the new image and redeploys services with zero-downtime rolling updates

**Note**: Configure Coolify to watch for new images on GHCR, or manually trigger a redeploy after CI completes.

## Troubleshooting

### Issue: "Unauthorized" errors with Zero mutations

**Symptoms:**

- Mutations fail with "user must be logged in for this operation"
- Auth works on SvelteKit app but not Zero Cache

**Solution:**

1. Verify `COOKIE_DOMAIN=.yourdomain.com` is set in SvelteKit app
2. Check that Zero Cache and SvelteKit app use same domain suffix
3. Ensure `ZERO_GET_QUERIES_FORWARD_COOKIES=true` and `ZERO_MUTATE_FORWARD_COOKIES=true`
4. Clear browser cookies and test again

### Issue: Zero Cache fails to connect to PostgreSQL

**Symptoms:**

- Zero Cache health check fails
- Logs show connection errors

**Solution:**

1. Verify `ZERO_UPSTREAM_DB` connection string is correct
2. Check PostgreSQL service is running
3. Verify network connectivity between services in Coolify
4. Confirm PostgreSQL has `wal_level=logical`

### Issue: Database migrations fail

**Symptoms:**

- `deploy-permissions.sh` script fails during migration step

**Solution:**

1. Check `DATABASE_URL` environment variable is set correctly
2. Verify network access to PostgreSQL from your local machine
3. Review migration files in `src/lib/server/db/migrations`
4. Manually run: `pnpm exec drizzle-kit migrate` for detailed errors

### Issue: GitHub OAuth fails in production

**Symptoms:**

- OAuth callback fails
- "Redirect URI mismatch" error

**Solution:**

1. Verify GitHub OAuth app callback URL is `https://app.yourdomain.com/auth/callback/github`
2. Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are for production app
3. Ensure SvelteKit app is accessible at `https://app.yourdomain.com`

### Issue: Zero Cache replica file grows too large

**Symptoms:**

- Disk space issues
- Slow sync performance

**Solution:**

1. Zero Cache periodically compacts the replica file
2. Ensure `/data` volume has sufficient space (10GB+ recommended)
3. Monitor disk usage in Coolify

### Issue: Permission deployment fails

**Symptoms:**

- `zero-deploy-permissions` command fails

**Solution:**

1. Verify `ZERO_UPSTREAM_DB` is accessible
2. Check that Drizzle migrations ran successfully first
3. Ensure `src/lib/zero/schema.ts` has valid permission definitions
4. Run with `--log-level debug` for detailed output

## Security Considerations

1. **Secrets Management**
   - Never commit `.env` files
   - Use Coolify's environment variable encryption
   - Rotate `ZERO_ADMIN_PASSWORD` regularly

2. **Database Access**
   - PostgreSQL should NOT be publicly accessible
   - Use internal Docker networking in Coolify
   - Restrict Drizzle Studio access with authentication

3. **Cookie Security**
   - Production uses `secure: true` and `httpOnly: true`
   - `sameSite: 'lax'` for OAuth compatibility
   - Domain scoped to `.yourdomain.com`

4. **Zero Admin Endpoints**
   - `/statz` requires admin password
   - Only expose admin endpoints to trusted networks
   - Consider firewall rules for admin access

## Monitoring

### Logs

Access logs in Coolify for each service:

```bash
# SvelteKit App logs
docker logs -f <app-container-id>

# Zero Cache logs
docker logs -f <zero-container-id>

# PostgreSQL logs
docker logs -f <postgres-container-id>
```

### Metrics

Use Zero's `/statz` endpoint for metrics:

```bash
curl -H "Authorization: Bearer $ZERO_ADMIN_PASSWORD" \
  https://zero.yourdomain.com/statz
```

Returns:

- Active connections
- Query performance
- Replication status
- Memory usage

## Backup Strategy

### Database Backups

Configure automated PostgreSQL backups in Coolify:

```bash
# Manual backup
pg_dump -h postgres -U refinery refinery > backup.sql

# Restore
psql -h postgres -U refinery refinery < backup.sql
```

### Zero Replica File

The Zero replica file is regenerated from PostgreSQL, so database backups are sufficient. However, for faster recovery:

```bash
# Backup replica file
cp /data/sync-replica.db /backups/sync-replica-$(date +%Y%m%d).db
```

## Cost Optimization

**Recommended Hetzner Setup:**

- **CPX21** (3 vCPU, 4GB RAM) - ~€8/month
  - Sufficient for small to medium deployments
  - Can run all services on single instance

**Scaling Up:**

- **CPX31** (4 vCPU, 8GB RAM) - ~€15/month
  - Better for production with higher load
  - More headroom for concurrent users

**Storage:**

- 80GB+ SSD recommended for PostgreSQL and replica files
- Add backup volume for automated backups

## Support

For issues related to:

- **Coolify**: https://coolify.io/docs
- **Zero**: https://zero.rocicorp.dev
- **SvelteKit**: https://kit.svelte.dev/docs
- **Drizzle**: https://orm.drizzle.team/docs

For Refinery-specific issues, check the repository documentation.
