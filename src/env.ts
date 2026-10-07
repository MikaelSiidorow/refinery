import { defineEnvVars } from '@sveltejs/kit/env';

// Read at startup. Unset variables stay undefined, as with $env/dynamic in SvelteKit 2;
// call sites check for the ones they need.
export const variables = defineEnvVars({
	PUBLIC_SERVER: { public: true, schema: (input) => input },
	PUBLIC_QUERY_URL: { public: true, schema: (input) => input },
	ENCRYPTION_KEY: { schema: (input) => input },
	GITHUB_CLIENT_ID: { schema: (input) => input },
	GITHUB_CLIENT_SECRET: { schema: (input) => input },
	GITHUB_REDIRECT_URL: { schema: (input) => input },
	LINKEDIN_CLIENT_ID: { schema: (input) => input },
	LINKEDIN_CLIENT_SECRET: { schema: (input) => input },
	LINKEDIN_REDIRECT_URL: { schema: (input) => input },
	DATABASE_URL: { schema: (input) => input }
});
