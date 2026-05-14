#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATION_LOCK_NAMESPACE = 8246;
const MIGRATION_LOCK_ID = 1;

/** @param {string} databaseUrl */
async function runMigrations(databaseUrl) {
	console.log('Starting database migrations...');

	const migrationClient = postgres(databaseUrl, {
		max: 1,
		ssl: 'prefer'
	});
	const db = drizzle({ client: migrationClient, casing: 'snake_case' });
	const migrationsFolder = path.join(__dirname, '..', 'drizzle');
	let lockAcquired = false;

	try {
		console.log(
			`Acquiring migration advisory lock (${MIGRATION_LOCK_NAMESPACE}, ${MIGRATION_LOCK_ID})...`
		);
		await migrationClient`SELECT pg_advisory_lock(${MIGRATION_LOCK_NAMESPACE}, ${MIGRATION_LOCK_ID})`;
		lockAcquired = true;

		await migrate(db, { migrationsFolder });
		console.log('✓ Database migrations completed successfully');
	} catch (error) {
		console.error('✗ Database migration failed:', error);
		throw error;
	} finally {
		if (lockAcquired) {
			try {
				console.log('Releasing migration advisory lock...');
				await migrationClient`SELECT pg_advisory_unlock(${MIGRATION_LOCK_NAMESPACE}, ${MIGRATION_LOCK_ID})`;
			} catch (unlockError) {
				console.error('Failed to release migration advisory lock:', unlockError);
			}
		}
		await migrationClient.end();
	}
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	console.error('Error: DATABASE_URL environment variable is not set');
	process.exit(1);
}

try {
	await runMigrations(databaseUrl);
} catch (error) {
	console.error('Failed to run migrations:', error);
	process.exit(1);
}
