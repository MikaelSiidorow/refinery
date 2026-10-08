import type { RequestHandler } from './$types';
import { handleQueryRequest } from '@rocicorp/zero/server';
import { mustGetQuery } from '@rocicorp/zero';
import { schema } from '#lib/zero/schema.js';
import { queries } from '#lib/zero/queries.js';
import { requireApprovedUser } from '#lib/server/access.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = requireApprovedUser(locals);

	try {
		const ctx = { userID: user.id };

		const response = await handleQueryRequest({
			handler: (name, args) => {
				const query = mustGetQuery(queries, name);
				return query.fn({ args, ctx });
			},
			schema,
			request,
			userID: user.id
		});

		return Response.json(response);
	} catch (error) {
		// Add error context for wide event logging
		locals.ctx.error = error instanceof Error ? error.message : String(error);
		locals.ctx.error_type = error instanceof Error ? error.constructor.name : typeof error;
		return Response.json({ error: 'Internal server error' }, { status: 500 });
	}
};
