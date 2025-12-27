import { assertIsOwner } from './context';
import { zql } from './schema';
import { isNonEmpty, type UuidV7 } from '$lib/utils';
import * as v from 'valibot';
import { defineMutator, defineMutators } from '@rocicorp/zero';
import { vShortString, vUuidV7 } from '$lib/utils/validators';
import { IDEA_STATUSES } from '$lib/constants/idea-statuses';
import { ARTIFACT_TYPES } from '$lib/constants/artifact-types';
import { ARTIFACT_STATUSES } from '$lib/constants/artifact-statuses';

const createContentIdeaSchema = v.object({
	id: vUuidV7(),
	oneLiner: vShortString()
});

const updateContentIdeaSchema = v.object({
	id: vUuidV7(),
	oneLiner: v.optional(vShortString()),
	status: v.optional(v.picklist(IDEA_STATUSES)),
	content: v.optional(v.string()),
	notes: v.optional(v.string()),
	tags: v.optional(v.array(v.string()))
});

const upsertContentSettingsSchema = v.object({
	targetAudience: v.string(),
	brandVoice: v.string(),
	contentPillars: v.string(),
	uniquePerspective: v.string()
});

const createContentArtifactSchema = v.object({
	id: vUuidV7(),
	ideaId: vUuidV7(),
	title: v.optional(v.string()),
	content: v.string(),
	artifactType: v.picklist(ARTIFACT_TYPES),
	platform: v.optional(v.string()),
	plannedPublishDate: v.optional(v.number())
});

const updateContentArtifactSchema = v.object({
	id: vUuidV7(),
	title: v.optional(v.string()),
	content: v.optional(v.string()),
	artifactType: v.optional(v.picklist(ARTIFACT_TYPES)),
	platform: v.optional(v.string()),
	status: v.optional(v.picklist(ARTIFACT_STATUSES)),
	plannedPublishDate: v.optional(v.number()),
	publishedAt: v.optional(v.number()),
	publishedUrl: v.optional(v.string()),
	impressions: v.optional(v.number()),
	likes: v.optional(v.number()),
	comments: v.optional(v.number()),
	shares: v.optional(v.number()),
	notes: v.optional(v.string())
});

export const mutators = defineMutators({
	contentIdea: {
		create: defineMutator(createContentIdeaSchema, async ({ tx, ctx, args: { id, oneLiner } }) => {
			const userId = ctx.userID;
			await tx.mutate.contentIdea.insert({
				id,
				oneLiner,
				userId,
				status: 'inbox',
				content: '',
				notes: '',
				tags: [],
				createdAt: Date.now(),
				updatedAt: Date.now()
			});
		}),
		update: defineMutator(
			updateContentIdeaSchema,
			async ({ tx, ctx, args: { id, oneLiner, status, content, notes, tags } }) => {
				const entity = await tx.run(zql.contentIdea.where('id', id).one());
				assertIsOwner(ctx, entity, id);

				const updateData: {
					id: UuidV7;
					oneLiner?: string;
					status?: 'inbox' | 'developing' | 'ready' | 'published' | 'archived' | 'cancelled';
					content?: string;
					notes?: string;
					tags?: string[];
					updatedAt: number;
				} = {
					id,
					updatedAt: Date.now()
				};

				if (oneLiner !== undefined) updateData.oneLiner = oneLiner;
				if (status !== undefined) updateData.status = status;
				if (content !== undefined) updateData.content = content;
				if (notes !== undefined) updateData.notes = notes;
				if (tags !== undefined) updateData.tags = tags;

				await tx.mutate.contentIdea.update(updateData);
			}
		)
	},
	contentSettings: {
		/**
		 * Upsert user content settings.
		 * Updates existing settings if found, otherwise creates new ones.
		 */
		upsert: defineMutator(
			upsertContentSettingsSchema,
			async ({
				tx,
				ctx,
				args: { targetAudience, brandVoice, contentPillars, uniquePerspective }
			}) => {
				const userId = ctx.userID;
				const existing = await tx.run(zql.contentSettings.where('userId', userId));

				const now = Date.now();

				if (isNonEmpty(existing)) {
					await tx.mutate.contentSettings.update({
						id: existing[0].id,
						targetAudience,
						brandVoice,
						contentPillars,
						uniquePerspective,
						updatedAt: now
					});
				} else {
					const { v7: uuidv7 } = await import('uuid');
					await tx.mutate.contentSettings.insert({
						id: uuidv7() as UuidV7,
						userId,
						targetAudience,
						brandVoice,
						contentPillars,
						uniquePerspective,
						createdAt: now,
						updatedAt: now
					});
				}
			}
		)
	},
	contentArtifact: {
		create: defineMutator(
			createContentArtifactSchema,
			async ({
				tx,
				ctx,
				args: { id, ideaId, title, content, artifactType, platform, plannedPublishDate }
			}) => {
				const userId = ctx.userID;
				const now = Date.now();

				await tx.mutate.contentArtifact.insert({
					id,
					userId,
					ideaId,
					title: title ?? null,
					content,
					artifactType,
					platform: platform ?? null,
					status: 'draft',
					plannedPublishDate: plannedPublishDate ?? null,
					publishedAt: null,
					publishedUrl: null,
					impressions: null,
					likes: null,
					comments: null,
					shares: null,
					notes: null,
					createdAt: now,
					updatedAt: now
				});
			}
		),
		update: defineMutator(
			updateContentArtifactSchema,
			async ({
				tx,
				ctx,
				args: {
					id,
					title,
					content,
					artifactType,
					platform,
					status,
					plannedPublishDate,
					publishedAt,
					publishedUrl,
					impressions,
					likes,
					comments,
					shares,
					notes
				}
			}) => {
				const entity = await tx.run(zql.contentArtifact.where('id', id).one());
				assertIsOwner(ctx, entity, id);

				await tx.mutate.contentArtifact.update({
					id,
					updatedAt: Date.now(),
					...(title !== undefined && { title: title ?? null }),
					...(content !== undefined && { content }),
					...(artifactType !== undefined && { artifactType }),
					...(platform !== undefined && { platform: platform ?? null }),
					...(status !== undefined && { status }),
					...(plannedPublishDate !== undefined && {
						plannedPublishDate: plannedPublishDate ?? null
					}),
					...(publishedAt !== undefined && { publishedAt }),
					...(publishedUrl !== undefined && { publishedUrl: publishedUrl ?? null }),
					...(impressions !== undefined && { impressions }),
					...(likes !== undefined && { likes }),
					...(comments !== undefined && { comments }),
					...(shares !== undefined && { shares }),
					...(notes !== undefined && { notes: notes ?? null })
				});
			}
		),
		delete: defineMutator(vUuidV7(), async ({ tx, ctx, args: id }) => {
			const entity = await tx.run(zql.contentArtifact.where('id', id).one());
			assertIsOwner(ctx, entity, id);
			await tx.mutate.contentArtifact.delete({ id });
		})
	}
});
