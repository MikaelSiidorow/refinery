import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { github } from '$lib/server/oauth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';
import { generateId, type UuidV7 } from '$lib/utils';
import { seedUserData } from '$lib/server/seed-data';

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
		let isNewUser = false;

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
			isNewUser = true;
			await db.insert(table.user).values({
				id: userId,
				githubId: githubUser.id,
				username: githubUser.login,
				email: githubUser.email,
				avatarUrl: githubUser.avatar_url,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			// Load example data for new users (non-critical)
			try {
				await seedUserData(db, userId);
			} catch (seedError) {
				// Add warning to wide event context (non-fatal)
				event.locals.ctx.seed_error =
					seedError instanceof Error ? seedError.message : String(seedError);
			}
		}

		// Add context for wide event
		event.locals.ctx.oauth_provider = 'github';
		event.locals.ctx.is_new_user = isNewUser;
		event.locals.ctx.github_user_id = githubUser.id;

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
		// Add error context for wide event logging
		event.locals.ctx.error = e instanceof Error ? e.message : String(e);
		event.locals.ctx.error_type = e instanceof Error ? e.constructor.name : typeof e;
		event.locals.ctx.oauth_provider = 'github';
		return new Response(null, { status: 500 });
	}
}

async function getGitHubUser(accessToken: string) {
	const response = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	return (await response.json()) as {
		id: number;
		login: string;
		avatar_url: string;
		email: string | null;
	};
}
