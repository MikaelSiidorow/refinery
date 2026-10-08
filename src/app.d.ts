// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: import('#lib/server/auth.js').SessionValidationResult['user'];
			session: import('#lib/server/auth.js').SessionValidationResult['session'];
			/** Accumulate context for wide event logging - emitted at request completion */
			ctx: import('#lib/server/logger.js').WideEvent;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
