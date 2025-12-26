import type { contentIdea } from '$lib/server/db/schema';
import { assertIsOwner } from './context';
import { zql } from './schema';
import { isNonEmpty, type UuidV7 } from '$lib/utils';
import { z } from 'zod';
import { defineMutator, defineMutators } from '@rocicorp/zero';
import { zUuidV7 } from '$lib/utils/validators';
import { IDEA_STATUSES } from '$lib/constants/idea-statuses';
import { ARTIFACT_TYPES } from '$lib/constants/artifact-types';
import { ARTIFACT_STATUSES } from '$lib/constants/artifact-statuses';

const zShortString = z.string().min(1).max(256);

const createContentIdeaSchema = z.object({
	id: zUuidV7(),
	oneLiner: zShortString
}) satisfies z.ZodType<Partial<Omit<typeof contentIdea.$inferInsert, 'userId'>>>;

const updateContentIdeaSchema = z.object({
	id: zUuidV7(),
	oneLiner: zShortString.optional(),
	status: z.enum(IDEA_STATUSES).optional(),
	content: z.string().optional(),
	notes: z.string().optional(),
	tags: z.array(z.string()).optional()
}) satisfies z.ZodType<Partial<Omit<typeof contentIdea.$inferInsert, 'userId'>>>;

const upsertContentSettingsSchema = z.object({
	targetAudience: z.string(),
	brandVoice: z.string(),
	contentPillars: z.string(),
	uniquePerspective: z.string()
});

const createContentArtifactSchema = z.object({
	id: zUuidV7(),
	ideaId: zUuidV7(),
	title: z.string().optional(),
	content: z.string(),
	artifactType: z.enum(ARTIFACT_TYPES),
	platform: z.string().optional(),
	plannedPublishDate: z.number().optional()
});

const updateContentArtifactSchema = z.object({
	id: zUuidV7(),
	title: z.string().optional(),
	content: z.string().optional(),
	artifactType: z.enum(ARTIFACT_TYPES).optional(),
	platform: z.string().optional(),
	status: z.enum(ARTIFACT_STATUSES).optional(),
	plannedPublishDate: z.number().optional(),
	publishedAt: z.number().optional(),
	publishedUrl: z.string().optional(),
	impressions: z.number().optional(),
	likes: z.number().optional(),
	comments: z.number().optional(),
	shares: z.number().optional(),
	notes: z.string().optional()
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
		delete: defineMutator(zUuidV7(), async ({ tx, ctx, args: id }) => {
			const entity = await tx.run(zql.contentArtifact.where('id', id).one());
			assertIsOwner(ctx, entity, id);
			await tx.mutate.contentArtifact.delete({ id });
		})
	}
});
