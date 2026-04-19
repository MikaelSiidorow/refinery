#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @param {string} databaseUrl */
async function runMigrations(databaseUrl) {
	console.log('Starting database migrations...');

	const migrationClient = postgres(databaseUrl, {
		max: 1,
		ssl: 'prefer'
	});
	const db = drizzle({ client: migrationClient, casing: 'snake_case' });
	const migrationsFolder = path.join(__dirname, '..', 'drizzle');

	try {
		await migrate(db, { migrationsFolder });
		console.log('✓ Database migrations completed successfully');
	} catch (error) {
		console.error('✗ Database migration failed:', error);
		throw error;
	} finally {
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
