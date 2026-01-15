import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
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
		event.tracing?.root.setAttribute('auth.status', 'authenticated');
		event.tracing?.root.setAttribute('user.id', user.id);
		event.tracing?.root.setAttribute('user.username', user.username);
		event.tracing?.root.setAttribute('session.id', session.id);
	} else {
		event.tracing?.root.setAttribute('auth.status', 'invalid_session');
	}

	return resolve(event);
};

export const handle: Handle = handleAuth;
