# Refinery

Refinery is a local-first content bank built with SvelteKit, Postgres, Drizzle, and Zero.

## Development

```sh
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm check`
- `pnpm lint`
- `pnpm db:generate`
- `pnpm db:migrate:run`
- `pnpm zero:generate`

## Release Discipline

Every pull request must bump the root `package.json` version. CI rejects PRs that do not move the version forward.

The version in `package.json` is the human release version. Production container images published from `main` use three tag styles:

- `sha-<commit>` for the exact merged artifact
- `<package.json version>` for the release alias
- `production` for the mutable deployment target

Deployments follow `:production`. Traceability follows `sha-*`. Human release notes and compatibility decisions follow the package version.

## Client Compatibility Policy

`src/lib/version-policy.ts` is the source of truth for client compatibility:

- `appVersion` is injected from `package.json`
- `minSupportedVersion` is the oldest client version allowed to keep running
- `/api/version` and response headers expose the active policy to browsers and operators

Client behavior is intentionally split:

- If a newer version exists but the current client is still supported, the app shows a soft refresh prompt.
- If the current client is below `minSupportedVersion`, the app blocks interaction and requires a refresh.

Zero still keeps its own low-level `onUpdateNeeded` reload path as the safety net if a client reaches an incompatible sync state.

## Schema Changes

When a PR changes `drizzle/*.sql`, it must carry exactly one schema label:

- `schema:expand`
- `schema:contract`

`schema:contract` PRs must also raise `minSupportedVersion` in `src/lib/version-policy.ts`.

Important: `minSupportedVersion` is the oldest app version that is safe after the contract change. It is not necessarily the version introduced by the current PR.

Typical flow:

1. Bump `package.json` version.
2. Update schema and generate migration files.
3. Regenerate Zero schema if needed.
4. Add the correct schema label.
5. If the label is `schema:contract`, raise `minSupportedVersion`.

Contract migrations should be rare and delayed. Expand first, ship code that no longer depends on the old schema, wait for clients to refresh, then run the destructive migration.
