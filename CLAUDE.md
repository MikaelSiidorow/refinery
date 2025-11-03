# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Refinery** is an authenticity-first content development platform for founders and builders. It helps you get your voice out by guiding your thinking, not replacing it.

### Vision & Philosophy

**Core Mission**: Guide you to get your voice out. Founders and builders have a lot to say, but it's hard to get started. Focus on authenticity and real content, not generic engagement bait or AI slop.

**Key Principles**:

- **Authenticity First**: Never generate full content from scratch - only provide thinking frameworks and refinement tools
- **AI as Collaborator**: Use AI as a megaphone and thinking tool, not a content machine
- **Your Voice**: Few-shot learning from your own past work ensures outputs always sound like YOU
- **No "AI" in UI**: Avoid "AI" terminology that loses credibility - use "frameworks", "thinking prompts", "polish & refine"

### Tech Stack

- **Frontend**: Svelte 5 with shadcn-svelte UI components
- **Database**: PostgreSQL with Drizzle ORM for server-side and Zero for local-first client sync
- **Authentication**: GitHub OAuth with session-based auth (Oslo libraries)
- **Styling**: TailwindCSS v4 with mode-watcher for dark mode
- **Search/Matching**: Fuse.js for client-side fuzzy search and example matching
- **Package Manager**: pnpm

## Documentation

**This file (CLAUDE.md)** - Quick reference for development workflow, conventions, and common patterns

**For deep dives, see:**
- **`docs/ARCHITECTURE.md`** - Database schema, Zero sync patterns, query examples, type safety
- **`docs/DEPLOY.md`** - Production deployment on Coolify/Hetzner with Docker
- **`docs/DESIGN_SYSTEM.md`** - UI/UX philosophy ("Calm Flow"), typography, interaction patterns

**When to reference:**
- Building features → This file + ARCHITECTURE.md
- Styling/UI work → DESIGN_SYSTEM.md
- Deploying to production → DEPLOY.md
- Schema changes → "Database Layer" in this file + ARCHITECTURE.md

### Codebase Map

**Data Layer:**
- `src/lib/server/db/schema.ts` - Drizzle schema (source of truth)
- `src/lib/zero/schema.ts` - Zero permissions and builder
- `src/lib/zero/queries.ts` - Synced query definitions
- `src/lib/zero/mutators.ts` - Server-side mutations with auth

**UI System:**
- `src/lib/components/ui/` - shadcn-svelte components
- `src/app.css` - Design tokens (typography, colors, transitions)
- `src/lib/components/` - Custom application components

**Content System:**
- `src/lib/prompts/strategies.ts` - AI prompt templates
- `src/lib/prompts/example-matcher.ts` - Few-shot learning with Fuse.js
- `src/lib/constants/artifact-types.ts` - Content format definitions

**Authentication & Routes:**
- `src/hooks.server.ts` - Session validation middleware
- `src/routes/sign-in/` - GitHub OAuth flow
- `src/lib/server/auth.ts` - Auth utilities (session management)
- `src/routes/(app)/` - Protected routes (requires auth)

**Utilities:**
- `src/lib/utils/` - Type-safe helpers (must, assert, isNonEmpty)
- `src/lib/z.svelte.ts` - Zero context access helper

## Development Commands

### Running the application

```bash
pnpm dev           # Start development server
pnpm dev -- --open # Start dev server and open in browser
pnpm build         # Build for production
pnpm preview       # Preview production build
```

### Database (Drizzle ORM - Server-side)

```bash
pnpm db:start      # Start PostgreSQL via docker compose
pnpm db:push       # Push schema changes to database
pnpm db:generate   # Generate migration files
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Drizzle Studio UI
```

### Zero (Local-first sync)

```bash
pnpm zero:generate # Generate Zero schema from Drizzle schema
pnpm zero:start    # Start Zero cache server for development
```

### Code Quality

```bash
pnpm check         # Type-check with svelte-check
pnpm check:watch   # Type-check in watch mode
pnpm lint          # Run prettier and eslint
pnpm format        # Format code with prettier
```

## Architecture

### Database Layer (Dual-schema approach)

The application uses both Drizzle ORM (server-side) and Zero (client-side local-first sync):

1. **Drizzle Schema** (`src/lib/server/db/schema.ts`): Source of truth for PostgreSQL tables
2. **Zero Schema** (`src/lib/zero/zero-schema.gen.ts`): Auto-generated from Drizzle schema via `pnpm zero:generate`
3. **Zero Permissions** (`src/lib/zero/schema.ts`): Defines row-level permissions using Zero's permission system
4. **Zero Mutators** (`src/lib/zero/mutators.ts`): Server-side mutation functions with authorization checks

**Important workflow**: When modifying database schema:

1. Update `src/lib/server/db/schema.ts` (Drizzle schema)
2. Run `pnpm db:push` to sync with PostgreSQL
3. Run `pnpm zero:generate` to regenerate Zero schema

### Zero Integration

Zero provides local-first data sync with:

- **Initialization**: Z instance created in `src/routes/(app)/+layout.svelte` with:
  - `userID`: For IndexedDB namespacing (multi-user browser support)
  - `schema`: Zero schema with permissions
  - `mutators`: Custom mutation functions with auth checks
- **Context Access**: Use `get_z()` helper from `src/lib/z.svelte.ts` to access Zero in components
- **Server**: Zero cache server runs on `PUBLIC_SERVER` (default: http://127.0.0.1:4848)
- **Mutators**: Custom server-side functions for all data modifications, with built-in authorization using `assertIsSignedIn()` and `assertIsOwner()` helpers
- **Cookie Auth**: Zero automatically forwards cookies to the push endpoint, enabling standard cookie-based authentication

The app layout within `(app)` route group has `ssr = false` to support client-side Zero sync.

#### Synced Queries Pattern

The application uses **synced queries** for all data fetching, which provides:

1. **Server-side query definitions** (`src/lib/zero/queries.ts`): Centralized query definitions using `syncedQuery` with userId as the first parameter
2. **Get queries endpoint** (`src/routes/api/get-queries/+server.ts`): Server endpoint that injects userId and handles synced query requests
3. **Svelte helpers** (`src/lib/zero/use-query.svelte.ts`): Reactive query wrappers that automatically inject userId from the Z instance and work with Svelte 5's fine-grained reactivity

**Defining queries** (`src/lib/zero/queries.ts`):

```typescript
import { syncedQuery } from '@rocicorp/zero';
import { builder } from './schema';

export const ideaById = syncedQuery(
	'ideaById',
	z.tuple([z.string(), z.string()]),
	(userId: string, ideaId: string) => {
		return builder.contentIdea.where('userId', userId as UuidV7).where('id', ideaId as UuidV7);
	}
);
```

**Using queries in components**:

```svelte
<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { createQuery, createParameterizedQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';

	const z = get_z();

	// Static query
	const settingsQuery = createQuery(z, queries.userSettings());
	const settings = $derived(settingsQuery.data[0]);

	// Parameterized query with reactive parameters
	const ideaQuery = createParameterizedQuery(z, queries.ideaById, () => [
		page.params.ideaId as UuidV7
	]);
	const idea = $derived(ideaQuery.data[0]);

	// Conditionally enabled query
	const artifactQuery = createParameterizedQuery(
		z,
		queries.artifactById,
		() => [routeInfo.artifactId || ('00000000-0000-0000-0000-000000000000' as UuidV7)],
		() => routeInfo.type === 'artifact' // Only enable when artifact route
	);
</script>
```

**Key patterns**:

- All queries defined in `src/lib/zero/queries.ts` using `syncedQuery` with userId as first parameter
- Helpers automatically inject userId from `z.userID`
- Use `createQuery()` for static queries (userId-only parameter)
- Use `createParameterizedQuery()` for queries with additional reactive parameters
- Pass query function directly (not wrapped) and use functions for `getArgs` and `getEnabled` for reactivity
- Access results via `.data` property (not `.current`)
- Helpers handle Svelte 5 reactivity constraints (avoid `state_unsafe_mutation` errors)

### Authentication

- **Provider**: GitHub OAuth via Arctic library
- **Session Management**: Session tokens stored in HTTP-only cookies, validated via `hooks.server.ts`
- **Route Protection**: Protected routes in `(app)` group redirect to `/sign-in` if not authenticated
- **Zero Auth**: Uses cookie-based authentication - cookies are automatically forwarded to Zero push endpoint where `locals.user` provides auth data
- **Environment**: Requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for OAuth

### UI Components

Uses shadcn-svelte configured in `components.json`:

- Components live in `$lib/components/ui/`
- Path aliases configured: `$lib/components`, `$lib/utils`, etc.
- TailwindCSS v4 with design tokens in `src/app.css`

**Design System**: See `docs/DESIGN_SYSTEM.md` for:
- Typography (Fraunces display, Inter sans, Geist mono)
- "Calm Flow" interaction philosophy
- Color palette (teal primary, purple secondary, amber accents)
- Focus rings, hover states, transitions

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection for Drizzle
- `ZERO_UPSTREAM_DB`: PostgreSQL connection for Zero cache server
- `ZERO_REPLICA_FILE`: Path for Zero's local SQLite replica
- `ZERO_MUTATE_URL`: URL for Zero mutations endpoint
- `ZERO_GET_QUERIES_URL`: URL for synced queries endpoint (e.g., `http://127.0.0.1:5173/api/get-queries`)
- `ZERO_GET_QUERIES_FORWARD_COOKIES`: Enable cookie forwarding for queries (set to `true`)
- `ZERO_MUTATE_FORWARD_COOKIES`: Enable cookie forwarding for mutations (set to `true`)
- `PUBLIC_SERVER`: Zero cache server URL (exposed to client)
- `GITHUB_CLIENT_ID`: GitHub OAuth application client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth application client secret

### Docker Setup

PostgreSQL runs via docker-compose with:

- Port 5432 exposed
- WAL level set to `logical` (required for Zero's replication)
- Persistent volume for data

## Content Frameworks System

### Prompt Categories

Prompts are organized into 4 categories based on the content development workflow:

1. **STRUCTURE** (3 prompts): Frameworks for organizing initial thinking
   - General Content Outline: Flexible framework for any content type
   - Technical Deep-Dive Outline: Structure for technical tutorials
   - Founder Story Framework: Narrative structure for personal stories

2. **ADAPT** (5 prompts): Reformat existing content for different platforms
   - Convert to Twitter Thread
   - Short LinkedIn Post
   - LinkedIn Carousel
   - Bluesky Thread
   - Newsletter Format
   - All require `needsMasterContent: true` - only work on already-drafted content

3. **REFINE** (6 prompts): Polish and improve existing artifacts
   - Stronger Opening Hook
   - Make It Shorter
   - Add/Improve Call-to-Action
   - Boost Engagement
   - Add Data & Examples
   - Optimize for SEO

4. **ENGAGE** (1 prompt): Help with community interaction
   - Write Engagement Comment: Craft thoughtful comments for others' posts

### Few-Shot Example System

**Location**: `src/lib/prompts/example-matcher.ts`

All prompts use intelligent few-shot learning to maintain authentic voice:

- **`findRelevantIdeas()`**: Matches based on tags (40%), oneLiner (30%), content (20%), notes (10%)
- **`findRelevantArtifacts()`**: Finds similar artifacts of the same type based on content similarity
- Uses Fuse.js for client-side fuzzy matching (fast, no backend)
- Automatically injects 2 most relevant examples into each prompt
- Examples shown under "## YOUR AUTHENTIC VOICE - Past Examples" header

**How it works**:

1. User selects a prompt strategy
2. System queries past ideas/artifacts from Zero
3. Fuse.js finds 2 most topically relevant examples
4. Examples injected into prompt generation
5. LLM learns user's style from real examples
6. Output matches user's authentic voice

### Prompt Strategy Structure

**Location**: `src/lib/prompts/strategies.ts`

Each prompt is a `PromptStrategy` object with:

```typescript
{
  id: string;                        // Unique identifier
  name: string;                      // Display name
  description: string;               // Short description for UI
  category: 'structure' | 'adapt' | 'engage' | 'refine';
  icon: string;                      // Emoji for UI
  requirements: {
    needsMasterContent?: boolean;    // Requires idea.content to exist
    needsOneLiner?: boolean;         // Requires idea.oneLiner
    needsNotes?: boolean;            // Requires idea.notes
  };
  producesArtifact: boolean;         // Creates a new artifact vs updates idea
  artifactType?: ArtifactType;       // Type of artifact created
  targetArtifactTypes?: ArtifactType[]; // Which artifact types this refines
  generate: (
    ideaOrArtifact: ContentIdea | ContentArtifact,
    settings?: ContentSetting,
    examples?: ExampleContent        // Past work for few-shot learning
  ) => string;
}
```

### Adding New Prompts

When adding a new prompt:

1. **Determine category**: STRUCTURE (helps initial thinking), ADAPT (reformats content), REFINE (improves existing), or ENGAGE (community interaction)
2. **Set requirements**: Specify what content is needed (`needsMasterContent`, `needsOneLiner`, etc.)
3. **Use examples parameter**: Always accept and use `examples` to inject user's past work
4. **Add instruction**: Include "**IMPORTANT**: Match the voice, structure, and style of the past examples above" when examples exist
5. **Focus on guidance**: Provide frameworks and questions, not templates to fill
6. **Avoid generation**: Never generate full content - guide thinking instead

**Example**:

```typescript
{
  id: 'new-framework',
  name: 'New Framework Name',
  description: 'Help users structure their thinking about X',
  category: 'structure',
  icon: '📋',
  requirements: { needsOneLiner: true },
  producesArtifact: false,
  generate: (ideaOrArtifact, settings, examples) => {
    const pastExamples = formatIdeaExamples(examples?.pastIdeas || [], 2);

    return `Help me develop this idea...

${pastExamples}
[Framework questions and guidance here]

${pastExamples ? '\n**IMPORTANT**: Match your natural style from the examples above\n' : ''}`;
  }
}
```

## Key Conventions

- **Authenticity First**: Never add prompts that generate full content from scratch
- **No "AI" in UI**: Use "frameworks", "thinking prompts", "polish & refine" - never "AI-generated"
- Database schema uses snake_case via `casing: 'snake_case'` in Drizzle config
- Svelte 5 runes syntax (`$props`, `$state`, etc.)
- Common timestamp pattern defined in schema as reusable object with `createdAt`/`updatedAt`
- UUIDs use v7 format via branded `UuidV7` type, generated with `generateId()` from `$lib/utils`
- Type-safe utilities: Use `isNonEmpty(arr)` instead of `arr.length > 0`, `must()` for non-null assertions, `assert()` for runtime checks
- Derive types from Drizzle/Zero schemas using `$inferSelect` and `$inferInsert` rather than defining separate types
- Use modern Drizzle syntax without explicit column names
- Avoid code comments that explain code; prefer comments explaining design choices or rationale
- Zero mutators handle all data modifications with authorization - don't bypass them with direct database access
- Always git add specific files deliberately, no `git add -A`
- Let me know if you need to run `db:push`, you can't do it
