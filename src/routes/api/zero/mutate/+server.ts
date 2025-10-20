import type { RequestHandler } from './$types';
import { PushProcessor, ZQLDatabase, PostgresJSConnection } from '@rocicorp/zero/pg';
import postgres from 'postgres';
import { schema } from '$lib/zero/schema';
import { createMutators } from '$lib/zero/mutators';
import type { AuthData } from '$lib/zero/auth';
import { ZERO_UPSTREAM_DB } from '$env/static/private';

// Create postgres connection (reuse across requests)
const sql = postgres(ZERO_UPSTREAM_DB);

// Create processor (reuse across requests)
const processor = new PushProcessor(new ZQLDatabase(new PostgresJSConnection(sql), schema));

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get auth data from session (via cookies)
		let authData: AuthData | undefined;

		if (locals.user) {
			authData = { sub: locals.user.id };
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
