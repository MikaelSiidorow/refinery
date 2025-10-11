import type { contentIdea } from '$lib/server/db/schema';
import type { Transaction } from '@rocicorp/zero/server';
import { assertIsSignedIn, assertIsCreator, type AuthData } from './auth';
import type { Schema } from './schema';
import type { UuidV7 } from '$lib/utils';
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
				await assertIsCreator(authData, tx.query.contentIdea, id);

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
		}
	} as const;
}

export type Mutators = ReturnType<typeof createMutators>;
