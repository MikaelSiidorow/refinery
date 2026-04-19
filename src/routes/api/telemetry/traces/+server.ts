import type { RequestHandler } from './$types';
import { logger } from '$lib/server/logger';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.arrayBuffer();
		const contentType = request.headers.get('Content-Type') || 'application/x-protobuf';
		const contentEncoding = request.headers.get('Content-Encoding');

		const headers: Record<string, string> = {
			'Content-Type': contentType
		};

		if (contentEncoding) {
			headers['Content-Encoding'] = contentEncoding;
		}

		const response = await fetch(`${OTEL_ENDPOINT}/v1/traces`, {
			method: 'POST',
			headers,
			body
		});

		if (!response.ok) {
			logger.warn(
				{ status: response.status, statusText: response.statusText },
				'Failed to forward traces to collector'
			);
		}

		return new Response(null, { status: response.status });
	} catch (error) {
		logger.error({ err: error }, 'Error proxying traces to collector');
		return new Response(null, { status: 502 });
	}
};
