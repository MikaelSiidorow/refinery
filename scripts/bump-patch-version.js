// Renovate post-upgrade task: every PR must bump the app version (see
// release-discipline-check.yml). Rewrites only the version line so the rest
// of package.json keeps its formatting.
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync('package.json', 'utf8');
const pattern = /^(\t"version": ")(\d+)\.(\d+)\.(\d+)(",?)$/m;
const match = pattern.exec(source);
if (!match) throw new Error('Could not find a semver "version" line in package.json');

const [, prefix, major, minor, patch, suffix] = match;
const next = `${major}.${minor}.${Number(patch) + 1}`;
writeFileSync('package.json', source.replace(pattern, `${prefix}${next}${suffix}`));
console.log(`package.json version ${major}.${minor}.${patch} -> ${next}`);
