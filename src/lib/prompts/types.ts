import type { ContentIdea, ContentArtifact, ContentSetting } from '$lib/zero/zero-schema.gen';
import type { ArtifactType } from '$lib/server/db/schema';

export type PromptCategory = 'expand' | 'adapt' | 'engage' | 'analyze' | 'refine';

export type { ArtifactType };

export interface StrategyRequirements {
	needsMasterContent?: boolean; // Requires idea.content to be filled
	needsNotes?: boolean; // Requires idea.notes to be filled
	needsOneLiner?: boolean; // Requires idea.oneLiner to be filled
}

export interface PromptStrategy {
	id: string;
	name: string;
	description: string;
	category: PromptCategory;
	icon: string;
	requirements: StrategyRequirements;
	producesArtifact: boolean; // If true, this creates an artifact
	artifactType?: ArtifactType; // What type of artifact it creates
	targetArtifactTypes?: ArtifactType[]; // Which artifact types this strategy applies to (for refine category)
	generate: (ideaOrArtifact: ContentIdea | ContentArtifact, settings?: ContentSetting) => string;
}
