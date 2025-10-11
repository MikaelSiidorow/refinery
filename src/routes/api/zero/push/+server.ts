import type { RequestHandler } from './$types';
import { PushProcessor, ZQLDatabase, PostgresJSConnection } from '@rocicorp/zero/pg';
import postgres from 'postgres';
import { schema } from '$lib/zero/schema';
import { createMutators } from '$lib/zero/mutators';
import type { AuthData } from '$lib/zero/auth';
import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { jwtVerify } from 'jose';
import { ZERO_AUTH_SECRET } from '$env/static/private';
import type { UuidV7 } from '$lib/utils';

// Create postgres connection (reuse across requests)
const sql = postgres(ZERO_UPSTREAM_DB);

// Create processor (reuse across requests)
const processor = new PushProcessor(new ZQLDatabase(new PostgresJSConnection(sql), schema));

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Extract and verify JWT from Authorization header
		const authHeader = request.headers.get('authorization');
		let authData: AuthData | undefined;

		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.substring(7);
			try {
				const secret = new TextEncoder().encode(ZERO_AUTH_SECRET);
				const { payload } = await jwtVerify(token, secret);
				authData = { sub: payload.sub as UuidV7 };
			} catch (e) {
				console.error('JWT verification failed:', e);
				// Continue without auth data - server mutators will reject if needed
			}
		}

		// Process the push request
		const result = await processor.process(createMutators(authData), request);

		return Response.json(result);
	} catch (error) {
		console.error('Push processing error:', error);
		return Response.json(
			{ error: 'Internal server error' },
			{
				status: 500
			}
		);
	}
};
