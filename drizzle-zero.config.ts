import { drizzleZeroConfig } from 'drizzle-zero';
import * as schema from './src/lib/server/db/schema';

export default drizzleZeroConfig(schema, {
	tables: {
		user: true,
		contentIdea: true,
		contentSettings: true,
		contentArtifact: true,
		connectedAccount: false,
		session: false
	},
	casing: 'snake_case'
});
