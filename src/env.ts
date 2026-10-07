import { defineEnvVars } from '@sveltejs/kit/env';

// @migration-task Review usage of dynamic environment variables. They fall back to the empty string if not present, which may not be what you want.
export const variables = defineEnvVars({
	PUBLIC_SERVER: { public: true, schema: (input) => input ?? '' },
	PUBLIC_QUERY_URL: { public: true, schema: (input) => input ?? '' },
	ENCRYPTION_KEY: { schema: (input) => input ?? '' },
	GITHUB_CLIENT_ID: { schema: (input) => input ?? '' },
	GITHUB_CLIENT_SECRET: { schema: (input) => input ?? '' },
	GITHUB_REDIRECT_URL: { schema: (input) => input ?? '' },
	LINKEDIN_CLIENT_ID: { schema: (input) => input ?? '' },
	LINKEDIN_CLIENT_SECRET: { schema: (input) => input ?? '' },
	LINKEDIN_REDIRECT_URL: { schema: (input) => input ?? '' },
	DATABASE_URL: { schema: (input) => input ?? '' }
});
