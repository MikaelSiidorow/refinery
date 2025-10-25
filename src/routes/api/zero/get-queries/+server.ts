import type { RequestHandler } from './$types';
import { handleGetQueriesRequest } from '@rocicorp/zero/server';
import { schema } from '$lib/zero/schema';
import * as queries from '$lib/zero/queries';
import { withValidation } from '@rocicorp/zero';
import type { QueryContext } from '$lib/zero/auth';

const queryMap = Object.fromEntries(
	Object.values(queries).map((q) => [q.queryName, withValidation(q)])
);

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const context: QueryContext = { userID: locals.user.id };

		const response = await handleGetQueriesRequest(
			(name, args) => {
				const q = queryMap[name as keyof typeof queryMap];
				if (!q) {
					throw new Error(`Unknown query: ${name}`);
				}

				return { query: q(context, ...args), context };
			},
			schema,
			request
		);

		return Response.json(response);
	} catch (error) {
		console.error('Get queries error:', error);
		return Response.json({ error: 'Internal server error' }, { status: 500 });
	}
};
