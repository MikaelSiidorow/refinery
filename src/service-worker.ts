// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Ensures that the `$service-worker` import has proper type definitions
/// <reference types="@sveltejs/kit" />

// Only necessary if you have an import from `$env/static/public`
/// <reference types="../.svelte-kit/ambient.d.ts" />

import { build, files, version } from '$service-worker';
import { isServiceWorkerMessage } from './lib/service-worker/messages';

declare const self: ServiceWorkerGlobalScope;

const CACHE = `cache-${version}`;

const ASSETS = [...build, ...files];

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
