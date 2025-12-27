<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { postToServiceWorker } from '$lib/service-worker/messages';

	let registration: ServiceWorkerRegistration | null = $state(null);
	let updateAvailable = $state(false);

	function reloadApp() {
		postToServiceWorker(registration?.waiting, { type: 'SKIP_WAITING' });
		window.location.reload();
	}

	function showUpdateToast() {
		if (updateAvailable) return;
		updateAvailable = true;

		toast('Update available', {
			description: 'A new version is ready. Refresh to update.',
			duration: Infinity,
			action: {
				label: 'Refresh',
				onClick: reloadApp
			}
		});
	}

	onMount(() => {
		if (!browser || !('serviceWorker' in navigator)) return;

		void navigator.serviceWorker.ready.then((reg) => {
			registration = reg;

			// Check if there's already a waiting worker
			if (reg.waiting) {
				showUpdateToast();
			}

			// Listen for new service workers
			reg.addEventListener('updatefound', () => {
				const newWorker = reg.installing;
				if (!newWorker) return;

				newWorker.addEventListener('statechange', () => {
					// New worker is installed and waiting
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						showUpdateToast();
					}
				});
			});
		});

		// Handle controller change (when skipWaiting is called)
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			// Only reload if we triggered it
			if (updateAvailable) {
				window.location.reload();
			}
		});

		// Periodically check for updates (every 5 minutes)
		const interval = setInterval(
			() => {
				registration?.update().catch(() => {
					// Ignore update check failures (e.g., offline)
				});
			},
			5 * 60 * 1000
		);

		return () => clearInterval(interval);
	});
</script>
