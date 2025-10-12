import type { contentIdea } from '$lib/server/db/schema';
import type { Transaction } from '@rocicorp/zero/server';
import { assertIsSignedIn, assertIsOwner, type AuthData } from './auth';
import type { Schema } from './schema';
import { isNonEmpty, type UuidV7 } from '$lib/utils';
import { z } from 'zod';

const zShortString = z.string().min(1).max(256);

export type CreateContentIdeaArgs = Omit<typeof contentIdea.$inferInsert, 'userId'>;

export type UpdateContentIdeaArgs = {
	id: UuidV7;
	oneLiner?: string;
	status?: 'inbox' | 'developing' | 'ready' | 'published' | 'archived' | 'cancelled';
	content?: string;
	notes?: string;
};

export type UpsertContentSettingsArgs = {
	targetAudience: string;
	brandVoice: string;
	contentPillars: string;
	uniquePerspective: string;
};

export type CreateContentArtifactArgs = {
	id: UuidV7;
	ideaId: UuidV7;
	title?: string;
	content: string;
	artifactType:
		| 'blog-post'
		| 'thread'
		| 'carousel'
		| 'newsletter'
		| 'email'
		| 'short-post'
		| 'comment';
	platform?: string;
};

export type UpdateContentArtifactArgs = {
	id: UuidV7;
	title?: string;
	content?: string;
	artifactType?:
		| 'blog-post'
		| 'thread'
		| 'carousel'
		| 'newsletter'
		| 'email'
		| 'short-post'
		| 'comment';
	platform?: string;
	status?: 'draft' | 'ready' | 'published';
	publishedAt?: number;
	publishedUrl?: string;
	impressions?: number;
	likes?: number;
	comments?: number;
	shares?: number;
	notes?: string;
};

export function createMutators(authData: AuthData | undefined) {
	return {
		contentIdea: {
			async create(tx: Transaction<Schema>, { id, oneLiner }: CreateContentIdeaArgs) {
				assertIsSignedIn(authData);
				const userId = authData.sub;

				zShortString.parse(oneLiner);

				await tx.mutate.contentIdea.insert({
					id,
					oneLiner,
					userId,
					status: 'inbox',
					content: '',
					notes: '',
					createdAt: Date.now(),
					updatedAt: Date.now()
				});
			},
			async update(
				tx: Transaction<Schema>,
				{ id, oneLiner, status, content, notes }: UpdateContentIdeaArgs
			) {
				await assertIsOwner(authData, tx.query.contentIdea, id);

				if (oneLiner !== undefined) {
					zShortString.parse(oneLiner);
				}

				const updateData: {
					id: UuidV7;
					oneLiner?: string;
					status?: 'inbox' | 'developing' | 'ready' | 'published' | 'archived' | 'cancelled';
					content?: string;
					notes?: string;
					updatedAt: number;
				} = {
					id,
					updatedAt: Date.now()
				};

				if (oneLiner !== undefined) updateData.oneLiner = oneLiner;
				if (status !== undefined) updateData.status = status;
				if (content !== undefined) updateData.content = content;
				if (notes !== undefined) updateData.notes = notes;

				await tx.mutate.contentIdea.update(updateData);
			}
		},
		contentSettings: {
			async upsert(
				tx: Transaction<Schema>,
				{ targetAudience, brandVoice, contentPillars, uniquePerspective }: UpsertContentSettingsArgs
			) {
				assertIsSignedIn(authData);
				const userId = authData.sub;

				// Check if settings exist for this user
				const existing = await tx.query.contentSettings.where('userId', '=', userId).run();

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
					// Insert new settings
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
		},
		contentArtifact: {
			async create(
				tx: Transaction<Schema>,
				{ id, ideaId, title, content, artifactType, platform }: CreateContentArtifactArgs
			) {
				assertIsSignedIn(authData);
				const userId = authData.sub;

				const now = Date.now();

				await tx.mutate.contentArtifact.insert({
					id,
					userId,
					ideaId,
					title: title || null,
					content,
					artifactType,
					platform: platform || null,
					status: 'draft',
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
			},
			async update(
				tx: Transaction<Schema>,
				{
					id,
					title,
					content,
					artifactType,
					platform,
					status,
					publishedAt,
					publishedUrl,
					impressions,
					likes,
					comments,
					shares,
					notes
				}: UpdateContentArtifactArgs
			) {
				await assertIsOwner(authData, tx.query.contentArtifact, id);

				const updateData: {
					id: UuidV7;
					title?: string | null;
					content?: string;
					artifactType?:
						| 'blog-post'
						| 'thread'
						| 'carousel'
						| 'newsletter'
						| 'email'
						| 'short-post'
						| 'comment';
					platform?: string | null;
					status?: 'draft' | 'ready' | 'published';
					publishedAt?: number | null;
					publishedUrl?: string | null;
					impressions?: number | null;
					likes?: number | null;
					comments?: number | null;
					shares?: number | null;
					notes?: string | null;
					updatedAt: number;
				} = {
					id,
					updatedAt: Date.now()
				};

				if (title !== undefined) updateData.title = title || null;
				if (content !== undefined) updateData.content = content;
				if (artifactType !== undefined) updateData.artifactType = artifactType;
				if (platform !== undefined) updateData.platform = platform || null;
				if (status !== undefined) updateData.status = status;
				if (publishedAt !== undefined) updateData.publishedAt = publishedAt;
				if (publishedUrl !== undefined) updateData.publishedUrl = publishedUrl || null;
				if (impressions !== undefined) updateData.impressions = impressions;
				if (likes !== undefined) updateData.likes = likes;
				if (comments !== undefined) updateData.comments = comments;
				if (shares !== undefined) updateData.shares = shares;
				if (notes !== undefined) updateData.notes = notes || null;

				await tx.mutate.contentArtifact.update(updateData);
			},
			async delete(tx: Transaction<Schema>, id: UuidV7) {
				await assertIsOwner(authData, tx.query.contentArtifact, id);
				await tx.mutate.contentArtifact.delete({ id });
			}
		}
	} as const;
}

export type Mutators = ReturnType<typeof createMutators>;
