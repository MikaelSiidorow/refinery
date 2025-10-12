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

/** All tables that belong to a user and have a userId column */
export type OwnedTable = 'contentIdea' | 'contentArtifact' | 'contentSettings';

export async function assertIsOwner(
	authData: AuthData | undefined,
	query: Query<typeof schema, OwnedTable>,
	id: UuidV7
) {
	assertIsSignedIn(authData);
	const entity = must(await query.where('id', id).one().run(), `entity ${id} does not exist`);
	const userId = entity.userId;
	assert(authData.sub === userId, `User ${authData.sub} is not the owner of this entity`);
}
