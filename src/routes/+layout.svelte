<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import AppUpdateManager from '$lib/components/app-update-manager.svelte';
	import { initClientTracing } from '$lib/instrumentation.client';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		initClientTracing();
	});
</script>

<svelte:head>
	<title>Refinery - Your Content Bank</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster position="top-center" />
<AppUpdateManager />

{@render children()}
