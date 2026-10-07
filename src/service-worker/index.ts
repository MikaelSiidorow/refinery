import { assets, immutable } from '$app/manifest';
import { version } from '$app/env';
import { isServiceWorkerMessage } from '#lib/service-worker/messages.js';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

// Manifest paths are relative to the base path, which is the service worker's scope.
const ASSETS = [...immutable, ...assets].map(
	({ path }) => new URL(path, self.registration.scope).pathname
);

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}

		await self.clients.claim();
	}

	event.waitUntil(deleteOldCaches());
});

// Handle messages from the client
self.addEventListener('message', (event) => {
	if (isServiceWorkerMessage(event.data, 'SKIP_WAITING')) {
		void self.skipWaiting();
	}
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Dynamic API endpoints must always bypass the SW cache. In particular,
	// /api/version needs authoritative network responses for update checks.
	if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
		return;
	}

	// Network-first for navigation requests (HTML pages)
	// This ensures users always get the latest app shell
	if (event.request.mode === 'navigate') {
		event.respondWith(
			(async () => {
				try {
					const response = await fetch(event.request);

					if (response.status === 200) {
						const cache = await caches.open(CACHE);
						void cache.put(event.request, response.clone());
					}

					return response;
				} catch {
					// Offline fallback - serve from cache
					const cached = await caches.match(event.request);
					if (cached) return cached;

					// Last resort - return cached index
					const indexCache = await caches.match('/');
					if (indexCache) return indexCache;

					throw new Error('Offline and no cached page available');
				}
			})()
		);
		return;
	}

	// Cache-first for static assets (JS, CSS, images, fonts)
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);

			// Check if it's a known static asset
			if (ASSETS.includes(url.pathname)) {
				const cached = await cache.match(url.pathname);
				if (cached) return cached;
			}

			try {
				const response = await fetch(event.request);

				const isNotExtension = url.protocol === 'http:' || url.protocol === 'https:';
				const isSuccess = response.status === 200;

				if (isNotExtension && isSuccess) {
					void cache.put(event.request, response.clone());
				}

				return response;
			} catch {
				const cached = await cache.match(event.request);
				if (cached) return cached;

				throw new Error('Network request failed and no cache available');
			}
		})()
	);
});
