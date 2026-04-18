const SEMVER_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

type SemverTuple = [major: number, minor: number, patch: number];

export function parseSemver(version: string): SemverTuple {
	const match = SEMVER_PATTERN.exec(version);

	if (!match) {
		throw new Error(`Invalid semver version: ${version}`);
	}

	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function compareSemver(left: string, right: string): number {
	const leftParts = parseSemver(left);
	const rightParts = parseSemver(right);

	if (leftParts[0] > rightParts[0]) return 1;
	if (leftParts[0] < rightParts[0]) return -1;

	if (leftParts[1] > rightParts[1]) return 1;
	if (leftParts[1] < rightParts[1]) return -1;

	if (leftParts[2] > rightParts[2]) return 1;
	if (leftParts[2] < rightParts[2]) return -1;

	return 0;
}
