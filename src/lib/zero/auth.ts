import type { Query } from '@rocicorp/zero';
import type { schema } from './schema';
import { z } from 'zod';
import { assert, must, type UuidV7 } from '$lib/utils';

export const authDataSchema = z.object({
	sub: z.uuidv7().transform((val): UuidV7 => val as UuidV7)
});

export type AuthData = z.infer<typeof authDataSchema>;

export function assertIsSignedIn(authData: AuthData | undefined): asserts authData {
	assert(authData, 'user must be logged in for this operation');
}

export async function assertIsCreator(
	authData: AuthData | undefined,
	query: Query<typeof schema, 'contentIdea'>,
	id: UuidV7
) {
	assertIsSignedIn(authData);
	const userId = must(
		await query.where('id', id).one().run(),
		`entity ${id} does not exist`
	).userId;
	assert(
		authData.sub === userId,
		`User ${authData.sub} is not an admin or the creator of the target entity`
	);
}
