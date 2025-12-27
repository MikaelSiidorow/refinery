/**
 * Type-safe messaging between service worker and main thread.
 *
 * Usage in main thread:
 *   import { postToServiceWorker } from '$lib/service-worker/messages';
 *   postToServiceWorker(registration.waiting, { type: 'SKIP_WAITING' });
 *
 * Usage in service worker:
 *   import { isServiceWorkerMessage } from '$lib/service-worker/messages';
 *   if (isServiceWorkerMessage(event.data, 'SKIP_WAITING')) { ... }
 */

export type ServiceWorkerMessage =
	| { type: 'SKIP_WAITING' }
	| { type: 'CACHE_URLS'; urls: string[] }
	| { type: 'CLEAR_CACHE' };

export type ServiceWorkerMessageType = ServiceWorkerMessage['type'];

export function postToServiceWorker(
	worker: ServiceWorker | null | undefined,
	message: ServiceWorkerMessage
): void {
	worker?.postMessage(message);
}

export function isServiceWorkerMessage<T extends ServiceWorkerMessageType>(
	data: unknown,
	type: T
): data is Extract<ServiceWorkerMessage, { type: T }> {
	return typeof data === 'object' && data !== null && 'type' in data && data.type === type;
}
