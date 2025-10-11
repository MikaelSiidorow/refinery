import type { contentIdea } from '$lib/server/db/schema';
import type { Transaction } from '@rocicorp/zero/server';
import { assertIsSignedIn, type AuthData } from './auth';
import type { Schema } from './schema';

export type CreateContentIdeaArgs = Omit<typeof contentIdea.$inferInsert, 'userId'>;

export function createMutators(authData: AuthData | undefined) {
	return {
		contentIdea: {
			async create(tx: Transaction<Schema>, { id, oneLiner }: CreateContentIdeaArgs) {
				assertIsSignedIn(authData);
				const userId = authData.sub;
				await tx.mutate.contentIdea.insert({
					id,
					oneLiner,
					userId,
					createdAt: Date.now(),
					updatedAt: Date.now()
				});
			}
		}
	} as const;
}

export type Mutators = ReturnType<typeof createMutators>;
