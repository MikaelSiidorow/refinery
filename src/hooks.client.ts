import type { HandleClientError } from '@sveltejs/kit/hooks';

function reportError(payload: Record<string, unknown>) {
	void fetch('/api/telemetry/errors', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	}).catch(() => {
		// Best-effort — don't throw from the error handler
	});
}

/**
 * Catch-all for unexpected client-side errors.
 * Reports to the server so it reaches Loki → AlertManager → Telegram.
 */
export const handleError: HandleClientError = ({ kind, error }) => {
	// SvelteKit 3 also passes expected errors (error(...), 404s) here; only report
	// unexpected ones, as before.
	if (kind !== 'unknown') return;

	const errorObj = error instanceof Error ? error : new Error(String(error));

	reportError({
		message: errorObj.message,
		stack: errorObj.stack,
		url: window.location.href
	});
};
