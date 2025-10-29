import { GitHub, LinkedIn } from 'arctic';
import { env } from '$env/dynamic/private';

export const github = new GitHub(
	env.GITHUB_CLIENT_ID!,
	env.GITHUB_CLIENT_SECRET!,
	env.GITHUB_REDIRECT_URL!
);

export const linkedin = new LinkedIn(
	env.LINKEDIN_CLIENT_ID!,
	env.LINKEDIN_CLIENT_SECRET!,
	env.LINKEDIN_REDIRECT_URL!
);
