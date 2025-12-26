import { dev } from '$app/environment';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { seedDemoUser, DEMO_USER_ID } from '$lib/server/seed-data';
import type { RequestEvent } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';

/**
 * Demo sign-in endpoint - DEVELOPMENT ONLY
 * Signs in as the demo user with pre-seeded content
 */
export async function GET(event: RequestEvent): Promise<Response> {
	// Only allow in development
	if (!dev) {
		error(404, 'Not found');
	}

	try {
		// Create or update demo user with seed data
		await seedDemoUser(db);

		// Create session for demo user
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, DEMO_USER_ID);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} catch (e) {
		console.error('Demo sign-in failed:', e);
		error(500, 'Failed to sign in as demo user');
	}

	// Redirect to dashboard
	redirect(302, '/');
}
