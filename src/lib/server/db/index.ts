import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | undefined;

export const db = new Proxy({} as DrizzleDB, {
	get(_, prop) {
		if (!_db) {
			if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
			_db = drizzle(new Pool({ connectionString: env.DATABASE_URL }), {
				schema,
				casing: 'snake_case'
			});
		}
		const value: unknown = Reflect.get(_db, prop);
		return typeof value === 'function' ? (value as () => unknown).bind(_db) : value;
	}
});
