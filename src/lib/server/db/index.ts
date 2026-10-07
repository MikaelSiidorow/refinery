import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { instrumentDrizzleClient } from '@kubiks/otel-drizzle';

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _client: postgres.Sql | undefined;
let _db: DrizzleDB | undefined;
let _zeroDb: DrizzleDB | undefined;

function createDrizzle(): DrizzleDB {
	if (!_client) {
		if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
		_client = postgres(env.DATABASE_URL);
	}
	return drizzle(_client, { schema, casing: 'snake_case' });
}

function lazy(get: () => DrizzleDB): DrizzleDB {
	return new Proxy({} as DrizzleDB, {
		get(_, prop) {
			const target = get();
			const value: unknown = Reflect.get(target, prop);
			return typeof value === 'function' ? (value as () => unknown).bind(target) : value;
		}
	});
}

export const db = lazy(() => {
	if (!_db) {
		_db = createDrizzle();
		instrumentDrizzleClient(_db, {
			dbSystem: 'postgresql',
			dbName: 'refinery'
		});
	}
	return _db;
});

/**
 * Uninstrumented instance for Zero. @rocicorp/zero's drizzle adapter picks the
 * prepareQuery call signature from its arity, which otel-drizzle's variadic
 * wrapper hides, so Zero would call drizzle with the wrong arguments.
 */
export const zeroDb = lazy(() => (_zeroDb ??= createDrizzle()));
