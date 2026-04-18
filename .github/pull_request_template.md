## Checklist

- [ ] Bumped `package.json` version
- [ ] Added the correct schema label if this PR changes `drizzle/*.sql`
- [ ] Updated `src/lib/version-policy.ts` if this PR is labeled `schema:contract`

## Versioning Notes

- Every PR must move the root `package.json` version forward.
- `schema:contract` PRs must raise `minSupportedVersion`.
- `minSupportedVersion` means the oldest app version that is still safe after the contract change. It is not necessarily the version introduced by this PR.
