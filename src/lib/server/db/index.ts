import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DATABASE_URL } from '$app/env/private';
import { logger } from '$lib/server/logger';

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | undefined;

export const db = new Proxy({} as DrizzleDB, {
	get(_, prop) {
		if (!_db) {
			if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
			const pool = new Pool({ connectionString: DATABASE_URL });
			// pg emits idle-client errors (e.g. Postgres restarts) on the pool and crashes
			// the process if nothing listens; the pool replaces the client on next use.
			pool.on('error', (err) => {
				logger.warn({ event: 'db_pool_error', err }, 'Idle database client error');
			});
			_db = drizzle(pool, {
				schema,
				casing: 'snake_case'
			});
		}
		const value: unknown = Reflect.get(_db, prop);
		return typeof value === 'function' ? (value as () => unknown).bind(_db) : value;
	}
});
