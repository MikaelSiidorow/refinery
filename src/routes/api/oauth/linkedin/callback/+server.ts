import { redirect, isRedirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { linkedin } from '$lib/server/oauth';
import { db } from '$lib/server/db';
import { connectedAccount } from '$lib/server/db/schema';
import { generateId } from '$lib/utils';
import { eq, and } from 'drizzle-orm';
import { OAuth2RequestError } from 'arctic';
import { encrypt } from '$lib/server/crypto';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	if (!locals.user) {
		return redirect(302, '/sign-in');
	}

	locals.ctx.oauth_provider = 'linkedin';

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('linkedin_oauth_state');

	if (!code || !state || !storedState || state !== storedState) {
		return new Response('Invalid OAuth state', { status: 400 });
	}

	try {
		const tokens = await linkedin.validateAuthorizationCode(code);
		const accessToken = tokens.accessToken();
		const expiresAt = tokens.accessTokenExpiresAt();

		let refreshToken: string | null = null;
		try {
			refreshToken = tokens.refreshToken();
		} catch {
			// OpenID Connect flows may not return refresh tokens
		}

		const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
			headers: { Authorization: `Bearer ${accessToken}` }
		});

		if (!profileResponse.ok) {
			throw new Error('Failed to fetch LinkedIn profile');
		}

		const profile = (await profileResponse.json()) as {
			sub: string;
			name: string;
			email?: string;
		};

		const existing = await db
			.select()
			.from(connectedAccount)
			.where(
				and(eq(connectedAccount.userId, locals.user.id), eq(connectedAccount.provider, 'linkedin'))
			);

		const accountData = {
			userId: locals.user.id,
			provider: 'linkedin',
			providerAccountId: profile.sub,
			username: profile.email || profile.name,
			accessToken: encrypt(accessToken),
			refreshToken: refreshToken ? encrypt(refreshToken) : null,
			expiresAt: expiresAt || null
		};

		if (existing.length > 0) {
			await db
				.update(connectedAccount)
				.set(accountData)
				.where(eq(connectedAccount.id, existing[0]!.id));
			locals.ctx.linkedin_action = 'updated';
		} else {
			await db.insert(connectedAccount).values({
				id: generateId(),
				...accountData,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			locals.ctx.linkedin_action = 'created';
		}

		cookies.delete('linkedin_oauth_state', { path: '/' });
		return redirect(302, '/settings?linkedin_connected=true');
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}

		// Add error context for wide event logging
		locals.ctx.error = error instanceof Error ? error.message : String(error);
		locals.ctx.error_type = error instanceof Error ? error.constructor.name : typeof error;

		if (error instanceof OAuth2RequestError) {
			return new Response('Invalid authorization code', { status: 400 });
		}

		return redirect(302, '/settings?linkedin_error=true');
	}
};
