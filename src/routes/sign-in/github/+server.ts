import { redirect } from '@sveltejs/kit';
import {
	createAuthorizationURL,
	generateCodeVerifier,
	generateState,
	github
} from '#lib/server/oauth.js';
import type { RequestEvent } from '@sveltejs/kit';

export function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = createAuthorizationURL(github, { state, scopes: ['user:email'], codeVerifier });

	const cookieOptions = {
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	} as const;
	event.cookies.set('github_oauth_state', state, cookieOptions);
	event.cookies.set('github_code_verifier', codeVerifier, cookieOptions);

	redirect(302, url.toString(), { external: ['https://github.com'] });
}
