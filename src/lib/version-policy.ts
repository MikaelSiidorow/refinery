import { compareSemver } from '$lib/utils/semver';

export const versionHeaderNames = {
	appVersion: 'X-App-Version',
	buildSha: 'X-App-Build-Sha',
	minSupportedVersion: 'X-App-Min-Supported-Version'
} as const;

/**
 * Oldest app version that may continue running without a blocking refresh.
 *
 * Contract PRs must increase this when older clients would no longer be safe
 * after the destructive migration.
 */
export const minSupportedVersion = '1.0.0';

export const appVersion = __APP_VERSION__;
export const buildSha = __COMMIT_SHA__;

export type VersionPayload = {
	appVersion: string;
	buildSha: string;
	minSupportedVersion: string;
};

export function getVersionPayload(): VersionPayload {
	return {
		appVersion,
		buildSha,
		minSupportedVersion
	};
}

export function getVersionHeaders(
	payload: VersionPayload = getVersionPayload()
): Record<string, string> {
	return {
		[versionHeaderNames.appVersion]: payload.appVersion,
		[versionHeaderNames.buildSha]: payload.buildSha,
		[versionHeaderNames.minSupportedVersion]: payload.minSupportedVersion
	};
}

export function isVersionBelowMinimum(version: string, minimumVersion: string): boolean {
	return compareSemver(version, minimumVersion) < 0;
}
