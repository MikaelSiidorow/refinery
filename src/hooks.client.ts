import type { HandleClientError } from '@sveltejs/kit';

function reportError(payload: Record<string, unknown>) {
	try {
		fetch('/api/telemetry/errors', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch {
		// Best-effort — don't throw from the error handler
	}
}

/**
 * Catch-all for unexpected client-side errors.
 * Reports to the server so it reaches Loki → AlertManager → Telegram.
 */
export const handleError: HandleClientError = async ({ error, message }) => {
	const errorObj = error instanceof Error ? error : new Error(String(error));

	reportError({
		message: errorObj.message,
		stack: errorObj.stack,
		url: window.location.href
	});

	return { message };
};
