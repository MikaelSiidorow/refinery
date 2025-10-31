/**
 * Shared artifact type constants
 * Used by both server-side schema and client-side queries to avoid circular dependencies
 */

export const ARTIFACT_TYPES = [
	'blog-post',
	'thread',
	'carousel',
	'newsletter',
	'email',
	'short-post',
	'comment'
] as const;

export type ArtifactType = (typeof ARTIFACT_TYPES)[number];
