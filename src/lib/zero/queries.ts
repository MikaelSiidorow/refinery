import { syncedQueryWithContext } from '@rocicorp/zero';
import { z } from 'zod';
import { builder } from './schema';
import type { QueryContext } from './auth';
import { zUuidV7 } from '$lib/utils/validators';
import { artifactTypeEnum } from '$lib/server/db/schema';

// All content ideas for a user
export const allIdeas = syncedQueryWithContext('allIdeas', z.tuple([]), (ctx: QueryContext) => {
	return builder.contentIdea.where('userId', ctx.userID).orderBy('createdAt', 'desc');
});

// Inbox ideas for quick capture
export const inboxIdeas = syncedQueryWithContext('inboxIdeas', z.tuple([]), (ctx: QueryContext) => {
	return builder.contentIdea
		.where('userId', ctx.userID)
		.where('status', 'inbox')
		.orderBy('createdAt', 'desc');
});

// Single idea by ID
export const ideaById = syncedQueryWithContext(
	'ideaById',
	z.tuple([zUuidV7()]),
	(ctx: QueryContext, ideaId) => {
		return builder.contentIdea.where('userId', ctx.userID).where('id', ideaId);
	}
);

// Artifacts for a specific idea
export const artifactsByIdeaId = syncedQueryWithContext(
	'artifactsByIdeaId',
	z.tuple([zUuidV7()]),
	(ctx: QueryContext, ideaId) => {
		return builder.contentArtifact
			.where('userId', ctx.userID)
			.where('ideaId', ideaId)
			.orderBy('createdAt', 'desc');
	}
);

// Single artifact by ID
export const artifactById = syncedQueryWithContext(
	'artifactById',
	z.tuple([zUuidV7()]),
	(ctx: QueryContext, artifactId) => {
		return builder.contentArtifact.where('userId', ctx.userID).where('id', artifactId);
	}
);

// User's content settings
export const userSettings = syncedQueryWithContext(
	'userSettings',
	z.tuple([]),
	(ctx: QueryContext) => {
		return builder.contentSettings.where('userId', ctx.userID);
	}
);

// All artifacts with planned publish dates (for timeline)
export const scheduledArtifacts = syncedQueryWithContext(
	'scheduledArtifacts',
	z.tuple([]),
	(ctx: QueryContext) => {
		return builder.contentArtifact.where('userId', ctx.userID).orderBy('plannedPublishDate', 'asc');
	}
);

// Recent artifacts by type (for few-shot examples in prompts)
export const recentArtifactsByType = syncedQueryWithContext(
	'recentArtifactsByType',
	z.tuple([z.enum(artifactTypeEnum.enumValues)]),
	(ctx: QueryContext, artifactType) => {
		return builder.contentArtifact
			.where('userId', ctx.userID)
			.where('artifactType', artifactType)
			.orderBy('createdAt', 'desc')
			.limit(3);
	}
);

// Recent ideas with content (for few-shot examples in prompts)
export const recentIdeasWithContent = syncedQueryWithContext(
	'recentIdeasWithContent',
	z.tuple([]),
	(ctx: QueryContext) => {
		return builder.contentIdea.where('userId', ctx.userID).orderBy('updatedAt', 'desc').limit(5);
	}
);

// All artifacts for a user (for filtering examples client-side)
export const allArtifacts = syncedQueryWithContext(
	'allArtifacts',
	z.tuple([]),
	(ctx: QueryContext) => {
		return builder.contentArtifact.where('userId', ctx.userID).orderBy('createdAt', 'desc');
	}
);
