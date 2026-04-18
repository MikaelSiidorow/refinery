<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { postToServiceWorker } from '$lib/service-worker/messages';
	import { buildInfo } from '$lib/utils/build-info';
	import { compareSemver } from '$lib/utils/semver';
	import type { VersionPayload } from '$lib/version-policy';

	const VERSION_POLL_INTERVAL_MS = 5 * 60 * 1000;

	let registration: ServiceWorkerRegistration | null = $state(null);
	let blockingVersion: VersionPayload | null = $state(null);
	let updateToastId: string | number | undefined = $state(undefined);
	let updateToastKey: string | null = $state(null);
	let reloadRequested = $state(false);
	let refreshInFlight = $state(false);
	let versionCheckInFlight = false;

	function clearUpdateToast() {
		if (updateToastId !== undefined) {
			toast.dismiss(updateToastId);
			updateToastId = undefined;
		}

		updateToastKey = null;
	}

	function showRefreshToast(key: string, description: string) {
		if (blockingVersion || updateToastKey === key) return;

		clearUpdateToast();
		updateToastKey = key;
		updateToastId = toast('Update available', {
			description,
			duration: Infinity,
			action: {
				label: 'Refresh',
				onClick: () => void refreshApplication()
			}
		});
	}

	function isNewerServerBuild(payload: VersionPayload): boolean {
		const versionComparison = compareSemver(payload.appVersion, buildInfo.appVersion);

		return (
			versionComparison > 0 || (versionComparison === 0 && payload.buildSha !== buildInfo.commitSha)
		);
	}

	function applyVersionPolicy(payload: VersionPayload) {
		if (compareSemver(buildInfo.appVersion, payload.minSupportedVersion) < 0) {
			blockingVersion = payload;
			clearUpdateToast();
			return;
		}

		blockingVersion = null;

		if (!isNewerServerBuild(payload)) return;

		const description =
			payload.appVersion === buildInfo.appVersion
				? 'A newer build is ready. Refresh when convenient.'
				: `Version ${payload.appVersion} is ready. Refresh when convenient.`;

		showRefreshToast(`build:${payload.buildSha}`, description);
	}

	async function checkVersionPolicy() {
		if (!browser || versionCheckInFlight) return;
		versionCheckInFlight = true;

		try {
			const response = await fetch('/api/version', {
				cache: 'no-store',
				headers: {
					accept: 'application/json'
				}
			});

			if (!response.ok) return;

			const payload = (await response.json()) as VersionPayload;
			applyVersionPolicy(payload);
		} catch {
			// Ignore transient network and parsing failures.
		} finally {
			versionCheckInFlight = false;
		}
	}

	async function refreshApplication() {
		if (!browser || refreshInFlight) return;

		refreshInFlight = true;
		reloadRequested = true;

		try {
			await registration?.update();
		} catch {
			// Best-effort. Fall back to a full page reload below.
		}

		if (registration?.waiting) {
			postToServiceWorker(registration.waiting, { type: 'SKIP_WAITING' });
			return;
		}

		window.location.reload();
	}

	function handleRefreshClick() {
		void refreshApplication();
	}

	onMount(() => {
		if (!browser) return;

		let disposed = false;
		let updateFoundHandler: (() => void) | null = null;
		const handleFocus = () => {
			void checkVersionPolicy();
		};

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				void checkVersionPolicy();
			}
		};

		const handleControllerChange = () => {
			if (reloadRequested) {
				window.location.reload();
			}
		};

		void checkVersionPolicy();

		if ('serviceWorker' in navigator) {
			void navigator.serviceWorker.ready.then((reg) => {
				if (disposed) return;

				registration = reg;

				if (reg.waiting) {
					showRefreshToast(
						'service-worker:waiting',
						'A new version is ready. Refresh when convenient.'
					);
				}

				updateFoundHandler = () => {
					const newWorker = reg.installing;
					if (!newWorker) return;

					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							showRefreshToast(
								'service-worker:waiting',
								'A new version is ready. Refresh when convenient.'
							);
						}
					});
				};

				reg.addEventListener('updatefound', updateFoundHandler);
			});

			navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
		}

		window.addEventListener('focus', handleFocus);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		const interval = window.setInterval(() => {
			void registration?.update().catch(() => {
				// Ignore service worker update failures while offline.
			});
			void checkVersionPolicy();
		}, VERSION_POLL_INTERVAL_MS);

		return () => {
			disposed = true;
			window.clearInterval(interval);
			window.removeEventListener('focus', handleFocus);
			document.removeEventListener('visibilitychange', handleVisibilityChange);

			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
			}

			if (registration && updateFoundHandler) {
				registration.removeEventListener('updatefound', updateFoundHandler);
			}
		};
	});
</script>

{#if blockingVersion}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-6 backdrop-blur-sm"
	>
		<div class="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-lg">
			<div class="space-y-3">
				<p class="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
					Update required
				</p>
				<h1 class="text-2xl font-semibold tracking-tight">
					This version can no longer stay online.
				</h1>
				<p class="text-sm leading-6 text-muted-foreground">
					The app has moved past version <span class="font-medium text-foreground"
						>{blockingVersion.minSupportedVersion}</span
					>. Refresh now to keep using Refinery safely.
				</p>
			</div>

			<div class="mt-5 grid gap-2 rounded-xl border bg-muted/35 p-4 text-sm">
				<div class="flex items-center justify-between gap-3">
					<span class="text-muted-foreground">Current version</span>
					<code class="font-medium text-foreground">{buildInfo.appVersion}</code>
				</div>
				<div class="flex items-center justify-between gap-3">
					<span class="text-muted-foreground">Minimum supported</span>
					<code class="font-medium text-foreground">{blockingVersion.minSupportedVersion}</code>
				</div>
				<div class="flex items-center justify-between gap-3">
					<span class="text-muted-foreground">Latest release</span>
					<code class="font-medium text-foreground">{blockingVersion.appVersion}</code>
				</div>
			</div>

			<div class="mt-6 flex items-center justify-between gap-4">
				<p class="text-xs leading-5 text-muted-foreground">
					Unsaved local work in this tab may be lost after the refresh.
				</p>
				<Button size="lg" onclick={handleRefreshClick} disabled={refreshInFlight}>
					{refreshInFlight ? 'Refreshing…' : 'Refresh now'}
				</Button>
			</div>
		</div>
	</div>
{/if}
