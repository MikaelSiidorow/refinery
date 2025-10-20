import { syncedQuery } from '@rocicorp/zero';
import { z } from 'zod';
import { builder } from './schema';
import type { UuidV7 } from '$lib/utils';
import { zUuidV7 } from '$lib/utils/validators';

// All content ideas for a user
export const allIdeas = syncedQuery('allIdeas', z.tuple([zUuidV7()]), (userId: UuidV7) => {
	return builder.contentIdea.where('userId', userId).orderBy('createdAt', 'desc');
});

// Inbox ideas for quick capture
export const inboxIdeas = syncedQuery('inboxIdeas', z.tuple([zUuidV7()]), (userId: UuidV7) => {
	return builder.contentIdea
		.where('userId', userId)
		.where('status', 'inbox')
		.orderBy('createdAt', 'desc');
});

// Single idea by ID
export const ideaById = syncedQuery(
	'ideaById',
	z.tuple([zUuidV7(), zUuidV7()]),
	(userId: UuidV7, ideaId: UuidV7) => {
		return builder.contentIdea.where('userId', userId).where('id', ideaId);
	}
);

// Artifacts for a specific idea
export const artifactsByIdeaId = syncedQuery(
	'artifactsByIdeaId',
	z.tuple([zUuidV7(), zUuidV7()]),
	(userId: UuidV7, ideaId: UuidV7) => {
		return builder.contentArtifact
			.where('userId', userId)
			.where('ideaId', ideaId)
			.orderBy('createdAt', 'desc');
	}
);

// Single artifact by ID
export const artifactById = syncedQuery(
	'artifactById',
	z.tuple([zUuidV7(), zUuidV7()]),
	(userId: UuidV7, artifactId: UuidV7) => {
		return builder.contentArtifact.where('userId', userId).where('id', artifactId);
	}
);

// User's content settings
export const userSettings = syncedQuery('userSettings', z.tuple([zUuidV7()]), (userId: UuidV7) => {
	return builder.contentSettings.where('userId', userId);
});

// All artifacts with planned publish dates (for timeline)
export const scheduledArtifacts = syncedQuery(
	'scheduledArtifacts',
	z.tuple([zUuidV7()]),
	(userId: UuidV7) => {
		return builder.contentArtifact.where('userId', userId).orderBy('plannedPublishDate', 'asc');
	}
);
