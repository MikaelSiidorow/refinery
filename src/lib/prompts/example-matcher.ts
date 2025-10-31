import Fuse from 'fuse.js';
import type { ContentIdea, ContentArtifact } from '$lib/zero/zero-schema.gen';
import type { ArtifactType } from '$lib/server/db/schema';

/**
 * Find the most relevant past ideas based on tags, content, and topic similarity
 */
export function findRelevantIdeas(
	currentIdea: ContentIdea,
	allIdeas: ContentIdea[],
	limit = 2
): ContentIdea[] {
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
 */
export function findRelevantArtifacts(
	artifactType: ArtifactType,
	currentContent: string,
	allArtifacts: ContentArtifact[],
	limit = 2
): ContentArtifact[] {
	// Filter to artifacts of the same type with substantial content
	const relevantArtifacts = allArtifacts.filter(
		(artifact) =>
			artifact.artifactType === artifactType &&
			artifact.content &&
			artifact.content.trim().length > 50
	);

	if (relevantArtifacts.length === 0) return [];

	// If we have few artifacts of this type, just return them all (up to limit)
	if (relevantArtifacts.length <= limit) {
		return relevantArtifacts;
	}

	// Use Fuse to find similar content
	const fuse = new Fuse(relevantArtifacts, {
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
		// No good matches, return most recent
		return relevantArtifacts.slice(0, limit);
	}

	return results.slice(0, limit).map((result) => result.item);
}
