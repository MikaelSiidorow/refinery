/**
 * Shared idea status constants
 * Used by both server-side schema and client-side queries to avoid circular dependencies
 */

export const IDEA_STATUSES = [
	'inbox',
	'developing',
	'ready',
	'published',
	'archived',
	'cancelled'
] as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[number];
