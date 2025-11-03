# Refinery Architecture

Deep dive into database schema, Zero sync patterns, and data architecture.

## Design Principles

1. **UUID Primary Keys** - UUIDv7 for distributed sync and timestamp ordering
2. **Snake Case** - Database naming convention (`content_idea` not `contentIdeas`)
3. **Timestamps Pattern** - Consistent `createdAt`/`updatedAt` across all tables
4. **Zero Compatibility** - Simple relations that sync efficiently
5. **User-Centric** - All user data isolated by `userId` for security and multi-tenancy
6. **Local-First** - Zero provides offline capability with server sync

## Database Schema

### Core Tables

#### `user`

Authentication and profile data from GitHub OAuth.

```typescript
{
  id: uuid (PK, UuidV7),
  githubId: integer UNIQUE NOT NULL,
  username: text NOT NULL,
  email: text,
  avatarUrl: text,
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}
```

#### `session`

Session-based authentication using Oslo libraries.

```typescript
{
  id: varchar(64) (PK),          // SHA256 hash of session token
  userId: uuid (FK -> user.id) NOT NULL,
  expiresAt: timestamp NOT NULL
}
```

**Note**: Session ID is NOT a UUID - it's a hash of the session token for security.

#### `connected_account`

OAuth connections to content platforms (LinkedIn, Bluesky) for importing posts.

```typescript
{
  id: uuid (PK, UuidV7),
  userId: uuid (FK -> user.id) NOT NULL,
  provider: text NOT NULL,       // 'linkedin' | 'bluesky'
  providerAccountId: text NOT NULL,
  username: text,
  accessToken: text (Encrypted),
  refreshToken: text (Encrypted | null),
  expiresAt: timestamp,
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}
```

**Encryption**: Tokens are encrypted at the database level using custom `Encrypted` type.

#### `content_idea`

The content bank - central to the app's value proposition.

```typescript
{
  id: uuid (PK, UuidV7),
  userId: uuid (FK -> user.id) NOT NULL,
  oneLiner: text NOT NULL,       // The hook/key insight
  status: idea_status NOT NULL DEFAULT 'inbox',
  content: text NOT NULL DEFAULT '',
  notes: text NOT NULL DEFAULT '',
  tags: text[] NOT NULL DEFAULT '{}',
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}
```

**Status Flow**: `inbox` → `developing` → `ready` → `published` (or `archived`/`cancelled`)

**Tags**: Stored as PostgreSQL text array for efficient querying and filtering.

#### `content_settings`

User's brand voice and content strategy (formerly `brand_foundation`).

```typescript
{
  id: uuid (PK, UuidV7),
  userId: uuid (FK -> user.id) UNIQUE NOT NULL,
  targetAudience: text NOT NULL DEFAULT '',
  brandVoice: text NOT NULL DEFAULT '',
  contentPillars: text NOT NULL DEFAULT '',
  uniquePerspective: text NOT NULL DEFAULT '',
  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}
```

**Pattern**: One row per user (upsert pattern). These settings inform AI prompt generation.

#### `content_artifact`

Published or drafted content pieces derived from ideas.

```typescript
{
  id: uuid (PK, UuidV7),
  userId: uuid (FK -> user.id) NOT NULL,
  ideaId: uuid (FK -> content_idea.id) NOT NULL,
  title: text,
  content: text NOT NULL,
  artifactType: artifact_type NOT NULL,
  platform: text,                    // 'twitter', 'linkedin', 'blog', etc.
  status: artifact_status NOT NULL DEFAULT 'draft',

  // Publishing
  plannedPublishDate: timestamp,
  publishedAt: timestamp,
  publishedUrl: text,

  // Analytics (manually tracked)
  impressions: integer,
  likes: integer,
  comments: integer,
  shares: integer,
  notes: text,

  // Import tracking
  importedFrom: text,                // 'linkedin' | 'bluesky' | null
  externalId: text,                  // Original post ID from platform

  createdAt: timestamp NOT NULL,
  updatedAt: timestamp NOT NULL
}
```

**Artifact Types**: `twitter_thread`, `linkedin_post`, `blog_post`, `newsletter`, `carousel`, etc.

**Status Flow**: `draft` → `ready` → `published`

### Enums

```typescript
// Idea lifecycle
idea_status: 'inbox' | 'developing' | 'ready' | 'published' | 'archived' | 'cancelled'

// Artifact formats
artifact_type: See ARTIFACT_TYPES constant (20+ types)

// Artifact readiness
artifact_status: 'draft' | 'ready' | 'published'
```

### Relations

```
user
  ├─ content_settings (1:1)
  ├─ content_idea (1:many)
  ├─ content_artifact (1:many)
  └─ connected_account (1:many)

content_idea
  └─ content_artifact (1:many)
```

**Design Note**: No version history table yet - considering adding `idea_version` for tracking content evolution.

## Zero Sync Architecture

### Dual-Schema Approach

Refinery uses both Drizzle ORM (server) and Zero (client) for local-first sync:

1. **Drizzle Schema** (`src/lib/server/db/schema.ts`) - Source of truth
2. **Zero Schema** (`src/lib/zero/zero-schema.gen.ts`) - Auto-generated via `pnpm zero:generate`
3. **Zero Permissions** (`src/lib/zero/schema.ts`) - Row-level security
4. **Zero Mutators** (`src/lib/zero/mutators.ts`) - Server-side mutations with auth

### Schema Modification Workflow

When changing the database schema:

```bash
# 1. Update Drizzle schema
vim src/lib/server/db/schema.ts

# 2. Push to PostgreSQL
pnpm db:push

# 3. Regenerate Zero schema
pnpm zero:generate

# 4. Commit both changes
git add src/lib/server/db/schema.ts src/lib/zero/zero-schema.gen.ts
git commit -m "feat: add new field to content_idea"
```

### Zero Permissions Pattern

All user data is protected with row-level permissions:

```typescript
const allowIfOwner = (authData: AuthData, { cmp }: ExpressionBuilder) =>
  cmp('userId', authData.sub);

return {
  contentIdea: {
    row: {
      select: [allowIfOwner],
      insert: [allowIfOwner],
      update: {
        preMutation: [allowIfOwner],
        postMutation: [allowIfOwner]
      },
      delete: [allowIfOwner]
    }
  },
  // ... similar for contentSettings, contentArtifact
};
```

**Key Pattern**: `authData.sub` contains the user's UUID from their session. Zero compares this against the `userId` column in each table.

### Cookie-Based Authentication

Zero uses cookie forwarding instead of JWT:

```typescript
// Environment variables
ZERO_GET_QUERIES_FORWARD_COOKIES=true
ZERO_MUTATE_FORWARD_COOKIES=true
```

**How it works**:
1. User authenticates via GitHub OAuth
2. SvelteKit sets session cookie
3. Zero automatically forwards cookies to push endpoint
4. Server validates session and injects `authData`
5. Permissions check against `authData.sub`

### Synced Queries Pattern

All queries use Zero's synced query system:

**Defining queries** (`src/lib/zero/queries.ts`):

```typescript
import { syncedQuery } from '@rocicorp/zero';
import { builder } from './schema';

export const ideaById = syncedQuery(
  'ideaById',
  z.tuple([z.string(), z.string()]),
  (userId: string, ideaId: string) => {
    return builder.contentIdea
      .where('userId', userId as UuidV7)
      .where('id', ideaId as UuidV7);
  }
);
```

**Using in components**:

```svelte
<script lang="ts">
  import { get_z } from '$lib/z.svelte';
  import { createParameterizedQuery } from '$lib/zero/use-query.svelte';
  import * as queries from '$lib/zero/queries';

  const z = get_z();

  const ideaQuery = createParameterizedQuery(z, queries.ideaById, () => [
    page.params.ideaId as UuidV7
  ]);

  const idea = $derived(ideaQuery.data[0]);
</script>
```

**Benefits**:
- Automatic userId injection
- Svelte 5 fine-grained reactivity
- Server-side query definitions
- Type-safe parameters

## Common Query Patterns

### Dashboard - Ideas by Status

```typescript
// In src/lib/zero/queries.ts
export const ideasByStatus = syncedQuery(
  'ideasByStatus',
  z.tuple([z.string()]),
  (userId: string) => {
    return builder.contentIdea
      .where('userId', userId as UuidV7)
      .orderBy('updatedAt', 'desc');
  }
);
```

Client-side grouping by status happens in the component.

### Timeline - Upcoming Artifacts

```typescript
export const upcomingArtifacts = syncedQuery(
  'upcomingArtifacts',
  z.tuple([z.string()]),
  (userId: string) => {
    return builder.contentArtifact
      .where('userId', userId as UuidV7)
      .where('status', 'ready')
      .orderBy('plannedPublishDate', 'asc');
  }
);
```

### Tag Filtering

```typescript
// Filter happens client-side after query
const ideas = ideaQuery.data.filter(idea =>
  selectedTags.length === 0 ||
  selectedTags.some(tag => idea.tags.includes(tag))
);
```

**Design Choice**: Zero doesn't support array operations in queries, so tag filtering is client-side. This is fine for content management - users rarely have thousands of ideas.

### Search Across Content

Uses Fuse.js for client-side fuzzy search:

```typescript
import Fuse from 'fuse.js';

const fuse = new Fuse(ideas, {
  keys: ['oneLiner', 'content', 'notes', 'tags'],
  threshold: 0.3
});

const results = fuse.search(searchTerm);
```

## Type Safety

### Type Derivation

Never define separate types - derive from schemas:

```typescript
// ✅ Derive from Drizzle
export type ContentIdea = typeof contentIdea.$inferSelect;
export type ContentArtifact = typeof contentArtifact.$inferSelect;

// ❌ Don't manually define
type ContentIdea = {
  id: string;
  userId: string;
  // ...
};
```

### UUID Type Safety

UUIDs use branded type to prevent mixing with regular strings:

```typescript
// UuidV7 is a branded type
import type { UuidV7 } from '$lib/utils';

// Generated with validation
const id = generateId(); // Returns UuidV7
```

### Type-Safe Utilities

```typescript
// ✅ Type-safe non-empty check
if (isNonEmpty(ideas)) {
  // ideas is Idea[], not Idea[] | []
}

// ✅ Non-null assertion with runtime check
const user = must(maybeUser, 'User must exist');

// ✅ Runtime assertion
assert(ideas.length > 0, 'Must have ideas');
```

## Performance Considerations

### Why Zero Works Here

Content management is a perfect fit for Zero because:

1. **Low data volume** - Even power users have < 1000 ideas, < 5000 artifacts
2. **Personal data** - No cross-user queries needed
3. **Read-heavy** - View content way more than creating/editing
4. **Offline value** - Local-first enables working without connection

### Zero Replica Size

The Zero replica file grows with user data:

- ~1MB per 1000 ideas/artifacts
- Compacted automatically by zero-cache
- Acceptable for personal content management

### When NOT to Use This Pattern

This architecture wouldn't scale for:

- Social feeds (millions of posts)
- Real-time collaboration (many simultaneous editors)
- Complex cross-user queries (recommendations, discovery)
- High-frequency writes (analytics, logs)

But for personal content management? Perfect fit.

## Future Considerations

### Planned Additions

1. **Version History** - Track content evolution
   ```typescript
   content_idea_version {
     id: uuid (PK),
     ideaId: uuid (FK),
     content: text,
     versionNumber: integer,
     createdAt: timestamp
   }
   ```

2. **Collaboration** - Share ideas with teammates
   ```typescript
   idea_collaborator {
     ideaId: uuid (FK),
     userId: uuid (FK),
     permission: 'view' | 'edit'
   }
   ```

### Not Planned

- Multi-user real-time editing (complexity not worth it)
- AI integration (prompts stay copy-paste only)
- OAuth auto-posting (manual publishing keeps authenticity)

## Migration Strategy

When adding new tables/fields:

```bash
# 1. Update schema
vim src/lib/server/db/schema.ts

# 2. Generate migration
pnpm db:generate

# 3. Review migration SQL
cat src/lib/server/db/migrations/*.sql

# 4. Apply migration (production: done in Docker startup)
pnpm db:migrate

# 5. Regenerate Zero schema
pnpm zero:generate

# 6. Update permissions if needed
vim src/lib/zero/schema.ts

# 7. Test locally before deploying
```

**Production Note**: The Zero Cache Docker container automatically runs migrations and deploys permissions on startup. See `docs/DEPLOY.md` for details.

## Troubleshooting

### Schema Out of Sync

**Symptom**: "Column not found" or "Table does not exist" errors

**Fix**:
```bash
pnpm db:push          # Sync database
pnpm zero:generate    # Regenerate Zero schema
```

### Permission Denied Errors

**Symptom**: Mutations fail with "user must be logged in"

**Cause**: Permission mismatch or cookie not forwarded

**Debug**:
1. Check `ZERO_MUTATE_FORWARD_COOKIES=true`
2. Verify `authData.sub` matches user ID
3. Check cookie domain configuration

### Zero Replica Corruption

**Symptom**: Client shows stale or wrong data

**Fix**:
```typescript
// Clear IndexedDB (client-side)
await z.clear();
```

Zero will re-sync from the server.

## Best Practices

1. **Always use Zero mutators** - Don't bypass with direct DB access
2. **Keep queries simple** - Complex filtering happens client-side
3. **Derive types from schemas** - Single source of truth
4. **Test migrations locally** - Before deploying to production
5. **Use branded types** - UuidV7, Encrypted prevent mistakes
6. **Validate with Zod** - Runtime type safety for user inputs
7. **Index frequently queried columns** - userId, status, timestamps

---

For deployment architecture, see `docs/DEPLOY.md`.
For design system, see `docs/design-system.md`.
