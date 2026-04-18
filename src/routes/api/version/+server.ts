import type { RequestHandler } from './$types';
import { getVersionHeaders, getVersionPayload } from '$lib/version-policy';

export const GET: RequestHandler = () => {
	const payload = getVersionPayload();

	return Response.json(payload, {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			...getVersionHeaders(payload)
		}
	});
};
