import type { RequestHandler } from './$types';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: unknown = await request.json();

		const { message, stack, source, lineno, colno, url, componentStack } = body as {
			message?: string;
			stack?: string;
			source?: string;
			lineno?: number;
			colno?: number;
			url?: string;
			componentStack?: string;
		};

		logger.error(
			{
				event: 'client_error',
				error: message,
				stack,
				source,
				lineno,
				colno,
				url,
				componentStack
			},
			`Client error: ${message ?? 'Unknown error'}`
		);

		return new Response(null, { status: 204 });
	} catch {
		return new Response(null, { status: 400 });
	}
};
