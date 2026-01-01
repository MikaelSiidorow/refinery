import type { Row } from '@rocicorp/zero';
import type { ArtifactType } from '$lib/server/db/schema';

export type PromptCategory = 'structure' | 'adapt' | 'engage' | 'analyze' | 'refine';

export type { ArtifactType };

export interface StrategyRequirements {
	needsMasterContent?: boolean; // Requires idea.content to be filled
	needsNotes?: boolean; // Requires idea.notes to be filled
	needsOneLiner?: boolean; // Requires idea.oneLiner to be filled
}

export interface ExampleContent {
	pastIdeas?: Row['contentIdea'][];
	pastArtifacts?: Row['contentArtifact'][];
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
	targetPlatform?: string; // Target platform for matching examples (e.g., 'linkedin', 'bluesky', 'twitter')
	targetArtifactTypes?: ArtifactType[]; // Which artifact types this strategy applies to (for refine category)
	generate: (
		ideaOrArtifact: Row['contentIdea'] | Row['contentArtifact'],
		settings?: Row['contentSettings'],
		examples?: ExampleContent
	) => string;
}
