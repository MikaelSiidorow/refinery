import Fuse from 'fuse.js';
import type { Row } from '@rocicorp/zero';
import type { ArtifactType } from '$lib/server/db/schema';

/**
 * Find the most relevant past ideas based on tags, content, and topic similarity
 */
export function findRelevantIdeas(
	currentIdea: Row['contentIdea'],
	allIdeas: Row['contentIdea'][],
	limit = 2
): Row['contentIdea'][] {
	// Filter to ideas with substantial content
	const ideasWithContent = allIdeas.filter(
		(idea) => idea.id !== currentIdea.id && idea.content && idea.content.trim().length > 100
	);

	if (ideasWithContent.length === 0) return [];

	// Create search index on tags, oneLiner, and content
	const fuse = new Fuse(ideasWithContent, {
		keys: [
			{ name: 'tags', weight: 0.4 }, // Tags are most important for topical relevance
			{ name: 'oneLiner', weight: 0.3 }, // Topic/title similarity
			{ name: 'content', weight: 0.2 }, // Content similarity
			{ name: 'notes', weight: 0.1 } // Notes for context
		],
		threshold: 0.6, // More lenient matching
		includeScore: true,
		useExtendedSearch: true
	});

	// Build search query from current idea
	const searchTerms = [
		currentIdea.oneLiner || '',
		...(currentIdea.tags || []),
		currentIdea.notes || ''
	]
		.filter(Boolean)
		.join(' ');

	if (!searchTerms.trim()) {
		// No search terms, return most recent ideas with content
		return ideasWithContent.slice(0, limit);
	}

	const results = fuse.search(searchTerms);

	// Return top matches
	return results.slice(0, limit).map((result) => result.item);
}

/**
 * Find the most relevant past artifacts of a specific type
 * Prioritizes: 1) artifact type, 2) platform match, 3) content similarity, 4) recency
 */
export function findRelevantArtifacts(
	artifactType: ArtifactType,
	currentContent: string,
	allArtifacts: Row['contentArtifact'][],
	limit = 2,
	targetPlatform?: string
): Row['contentArtifact'][] {
	// Filter to artifacts of the same type with substantial content
	const relevantArtifacts = allArtifacts.filter(
		(artifact) =>
			artifact.artifactType === artifactType &&
			artifact.content &&
			artifact.content.trim().length > 50
	);

	if (relevantArtifacts.length === 0) return [];

	// Sort by recency first (most recent first) as a baseline
	const sortedByRecency = [...relevantArtifacts].sort((a, b) => {
		const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return dateB - dateA;
	});

	// If we have a target platform, prioritize platform matches
	if (targetPlatform) {
		const platformMatches = sortedByRecency.filter(
			(artifact) => artifact.platform === targetPlatform || artifact.importedFrom === targetPlatform
		);
		const nonPlatformMatches = sortedByRecency.filter(
			(artifact) => artifact.platform !== targetPlatform && artifact.importedFrom !== targetPlatform
		);

		// If we have enough platform matches, use content similarity within them
		if (platformMatches.length >= limit) {
			return findBestContentMatches(platformMatches, currentContent, limit);
		}

		// Otherwise, take all platform matches and fill remaining slots from other artifacts
		const remaining = limit - platformMatches.length;
		const additionalMatches = findBestContentMatches(nonPlatformMatches, currentContent, remaining);
		return [...platformMatches, ...additionalMatches];
	}

	// No platform specified, use content similarity on all artifacts
	return findBestContentMatches(sortedByRecency, currentContent, limit);
}

/**
 * Find best content matches using Fuse.js fuzzy search
 */
function findBestContentMatches(
	artifacts: Row['contentArtifact'][],
	currentContent: string,
	limit: number
): Row['contentArtifact'][] {
	if (artifacts.length === 0) return [];
	if (artifacts.length <= limit) return artifacts;

	// Use Fuse to find similar content
	const fuse = new Fuse(artifacts, {
		keys: [
			{ name: 'content', weight: 0.5 },
			{ name: 'title', weight: 0.3 },
			{ name: 'notes', weight: 0.2 }
		],
		threshold: 0.7,
		includeScore: true
	});

	const results = fuse.search(currentContent.substring(0, 500)); // Use first 500 chars for matching

	if (results.length === 0) {
		// No good matches, return most recent (already sorted)
		return artifacts.slice(0, limit);
	}

	return results.slice(0, limit).map((result) => result.item);
}
