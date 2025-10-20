import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_, prop) {
		if (!_db) {
			if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
			const client = postgres(env.DATABASE_URL);
			_db = drizzle(client, { schema, casing: 'snake_case' });
		}
		return _db[prop as keyof typeof _db];
	}
});
