import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { github } from '$lib/server/oauth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { generateId, type UuidV7 } from '$lib/utils';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state');

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, { status: 400 });
	}

	try {
		const tokens: OAuth2Tokens = await github.validateAuthorizationCode(code);
		const githubUser = await getGitHubUser(tokens.accessToken());

		// Check if user exists
		const [existingUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.githubId, githubUser.id));

		let userId: UuidV7;

		if (existingUser) {
			userId = existingUser.id;

			// Update user info (in case they changed username/avatar)
			await db
				.update(table.user)
				.set({
					username: githubUser.login,
					avatarUrl: githubUser.avatar_url,
					email: githubUser.email,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, userId));
		} else {
			// Create new user
			userId = generateId();
			await db.insert(table.user).values({
				id: userId,
				githubId: githubUser.id,
				username: githubUser.login,
				email: githubUser.email,
				avatarUrl: githubUser.avatar_url,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		// Create session
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, userId);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	} catch (e) {
		console.error(e);
		return new Response(null, { status: 500 });
	}
}

async function getGitHubUser(accessToken: string) {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	return await response.json();
}
