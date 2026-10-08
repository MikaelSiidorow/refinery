// OAuth 2.0 authorization code flow, adapted from Arctic's replacement examples
// (github.com/pilcrowonpaper/arctic/tree/main/code) after Arctic was deprecated.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GITHUB_REDIRECT_URL,
	LINKEDIN_CLIENT_ID,
	LINKEDIN_CLIENT_SECRET,
	LINKEDIN_REDIRECT_URL
} from '$app/env/private';

interface OAuthProvider {
	authorizationEndpoint: string;
	tokenEndpoint: string;
	clientId: string;
	clientSecret: string;
	redirectURI: string;
}

export interface OAuthTokens {
	accessToken: string;
	accessTokenExpiresAt: Date | null;
	refreshToken: string | null;
}

/** The authorization server rejected the code exchange (invalid/expired code, bad client credentials). */
export class OAuthTokenRequestError extends Error {
	constructor(
		public readonly code: string,
		description: string | undefined
	) {
		super(description ? `${code}: ${description}` : code);
		this.name = 'OAuthTokenRequestError';
	}
}

export const github: OAuthProvider = {
	authorizationEndpoint: 'https://github.com/login/oauth/authorize',
	tokenEndpoint: 'https://github.com/login/oauth/access_token',
	clientId: GITHUB_CLIENT_ID!,
	clientSecret: GITHUB_CLIENT_SECRET!,
	redirectURI: GITHUB_REDIRECT_URL!
};

// LinkedIn only enables PKCE for native apps on request, so it relies on state alone.
export const linkedin: OAuthProvider = {
	authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
	tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
	clientId: LINKEDIN_CLIENT_ID!,
	clientSecret: LINKEDIN_CLIENT_SECRET!,
	redirectURI: LINKEDIN_REDIRECT_URL!
};

export function generateState(): string {
	return randomBytes(32).toString('base64url');
}

export function generateCodeVerifier(): string {
	return randomBytes(32).toString('base64url');
}

export function statesMatch(stored: string, received: string): boolean {
	const a = Buffer.from(stored);
	const b = Buffer.from(received);
	return a.length === b.length && timingSafeEqual(a, b);
}

export function createAuthorizationURL(
	provider: OAuthProvider,
	options: { state: string; scopes: string[]; codeVerifier?: string }
): URL {
	const url = new URL(provider.authorizationEndpoint);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', provider.clientId);
	url.searchParams.set('redirect_uri', provider.redirectURI);
	url.searchParams.set('state', options.state);
	if (options.scopes.length > 0) {
		url.searchParams.set('scope', options.scopes.join(' '));
	}
	if (options.codeVerifier) {
		const codeChallenge = createHash('sha256').update(options.codeVerifier).digest('base64url');
		url.searchParams.set('code_challenge', codeChallenge);
		url.searchParams.set('code_challenge_method', 'S256');
	}
	return url;
}

export async function exchangeAuthorizationCode(
	provider: OAuthProvider,
	code: string,
	codeVerifier?: string
): Promise<OAuthTokens> {
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: provider.redirectURI,
		client_id: provider.clientId,
		client_secret: provider.clientSecret
	});
	if (codeVerifier) {
		body.set('code_verifier', codeVerifier);
	}

	const response = await fetch(provider.tokenEndpoint, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	const result = (await response.json().catch(() => null)) as {
		access_token?: string;
		expires_in?: number;
		refresh_token?: string;
		error?: string;
		error_description?: string;
	} | null;

	// GitHub reports errors with a 200 status, so check the body as well.
	if (!response.ok || !result || result.error || typeof result.access_token !== 'string') {
		throw new OAuthTokenRequestError(
			result?.error ?? `http_${response.status}`,
			result?.error_description
		);
	}

	return {
		accessToken: result.access_token,
		accessTokenExpiresAt:
			typeof result.expires_in === 'number'
				? new Date(Date.now() + result.expires_in * 1000)
				: null,
		refreshToken: result.refresh_token ?? null
	};
}
