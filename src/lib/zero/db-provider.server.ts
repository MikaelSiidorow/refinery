import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import { schema } from './schema';
import { zeroDb } from '$lib/server/db';

/** Database provider for server-side Zero operations */
export const dbProvider = zeroDrizzle(schema, zeroDb);

declare module '@rocicorp/zero' {
	interface DefaultTypes {
		dbProvider: typeof dbProvider;
	}
}
