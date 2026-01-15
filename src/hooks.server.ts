import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import * as auth from '$lib/server/auth';
import { emitWideEvent } from '$lib/server/logger';

/**
 * Wide event logging - emits one canonical log line per request at completion.
 * All context accumulated in event.locals.ctx throughout the request lifecycle.
 */
const handleWideEvent: Handle = async ({ event, resolve }) => {
	const start = performance.now();

	// Initialize request context
	event.locals.ctx = {
		method: event.request.method,
		path: event.url.pathname,
		route: event.route.id ?? undefined
	};

	try {
		const response = await resolve(event);

		// Capture response status
		event.locals.ctx.status = response.status;
		event.locals.ctx.duration_ms = Math.round(performance.now() - start);

		// Emit wide event
		emitWideEvent(event.locals.ctx);

		return response;
	} catch (error) {
		// Capture error context
		event.locals.ctx.status = 500;
		event.locals.ctx.duration_ms = Math.round(performance.now() - start);
		event.locals.ctx.error = error instanceof Error ? error.message : String(error);
		event.locals.ctx.error_type = error instanceof Error ? error.constructor.name : typeof error;

		// Emit wide event (will log at error level due to status 500)
		emitWideEvent(event.locals.ctx);

		throw error;
	}
};

/**
 * Auth handling - validates session and populates user context.
 * Adds auth info to event.locals.ctx for wide event logging.
 */
const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.ctx.auth_status = 'unauthenticated';
		event.tracing?.root.setAttribute('auth.status', 'unauthenticated');
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	if (user && session) {
		// Add to wide event context
		event.locals.ctx.auth_status = 'authenticated';
		event.locals.ctx.user_id = user.id;
		event.locals.ctx.username = user.username;
		event.locals.ctx.session_id = session.id;

		// Add to trace span
		event.tracing?.root.setAttribute('auth.status', 'authenticated');
		event.tracing?.root.setAttribute('user.id', user.id);
		event.tracing?.root.setAttribute('user.username', user.username);
		event.tracing?.root.setAttribute('session.id', session.id);
	} else {
		event.locals.ctx.auth_status = 'invalid_session';
		event.tracing?.root.setAttribute('auth.status', 'invalid_session');
	}

	return resolve(event);
};

// Wide event handler runs first (outermost) to capture full request lifecycle
export const handle: Handle = sequence(handleWideEvent, handleAuth);
