import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAuthorizationURL, generateState, linkedin } from '#lib/server/oauth.js';
import { requireApprovedUser } from '#lib/server/access.js';

export const GET: RequestHandler = ({ cookies, locals }) => {
	requireApprovedUser(locals);

	const state = generateState();
	const scopes = ['openid', 'profile', 'email'];

	const url = createAuthorizationURL(linkedin, { state, scopes });

	cookies.set('linkedin_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	redirect(302, url.toString(), { external: ['https://www.linkedin.com'] });
};
