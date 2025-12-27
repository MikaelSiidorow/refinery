import { defineQueries, defineQuery } from '@rocicorp/zero';
import * as v from 'valibot';
import { zql } from './schema';
import { vUuidV7 } from '$lib/utils/validators';
import { ARTIFACT_TYPES } from '$lib/constants/artifact-types';

export const queries = defineQueries({
	/** All content ideas for a user */
	allIdeas: defineQuery(({ ctx }) => {
		return zql.contentIdea.where('userId', ctx.userID).orderBy('createdAt', 'desc');
	}),
	/** Inbox ideas for quick capture */
	inboxIdeas: defineQuery(({ ctx }) => {
		return zql.contentIdea
			.where('userId', ctx.userID)
			.where('status', 'inbox')
			.orderBy('createdAt', 'desc');
	}),
	/** Single idea by ID  */
	ideaById: defineQuery(vUuidV7(), ({ ctx, args: ideaId }) => {
		return zql.contentIdea.where('userId', ctx.userID).where('id', ideaId);
	}),
	/** Artifacts for a specific idea */
	artifactsByIdeaId: defineQuery(vUuidV7(), ({ ctx, args: ideaId }) => {
		return zql.contentArtifact
			.where('userId', ctx.userID)
			.where('ideaId', ideaId)
			.orderBy('createdAt', 'desc');
	}),
	/** Single artifact by ID */
	artifactById: defineQuery(vUuidV7(), ({ ctx, args: artifactId }) => {
		return zql.contentArtifact.where('userId', ctx.userID).where('id', artifactId);
	}),
	/** User's content settings */
	userSettings: defineQuery(({ ctx }) => {
		return zql.contentSettings.where('userId', ctx.userID);
	}),
	/** All artifacts with planned publish dates (for timeline) */
	scheduledArtifacts: defineQuery(({ ctx }) => {
		return zql.contentArtifact.where('userId', ctx.userID).orderBy('plannedPublishDate', 'asc');
	}),
	/** Recent artifacts by type (for few-shot examples in prompts) */
	recentArtifactsByType: defineQuery(v.picklist(ARTIFACT_TYPES), ({ ctx, args: artifactType }) => {
		return zql.contentArtifact
			.where('userId', ctx.userID)
			.where('artifactType', artifactType)
			.orderBy('createdAt', 'desc')
			.limit(3);
	}),
	/** Recent ideas with content (for few-shot examples in prompts) */
	recentIdeasWithContent: defineQuery(({ ctx }) => {
		return zql.contentIdea.where('userId', ctx.userID).orderBy('updatedAt', 'desc').limit(5);
	}),
	/**  All artifacts for a user (for filtering examples client-side) */
	allArtifacts: defineQuery(({ ctx }) => {
		return zql.contentArtifact.where('userId', ctx.userID).orderBy('createdAt', 'desc');
	})
});
