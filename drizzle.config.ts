import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'fs';

// Only load .env if it exists (not in Docker build)
if (existsSync('.env')) {
	process.loadEnvFile();
}

// DATABASE_URL is only required for actual database operations, not schema generation
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: DATABASE_URL },
	verbose: true,
	strict: true,
	casing: 'snake_case'
});
