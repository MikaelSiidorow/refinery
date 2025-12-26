/**
 * Shared artifact status constants
 * Used by both server-side schema and client-side queries to avoid circular dependencies
 */

export const ARTIFACT_STATUSES = ['draft', 'ready', 'published'] as const;

export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];
