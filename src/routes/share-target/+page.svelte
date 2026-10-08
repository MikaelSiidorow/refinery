<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	onMount(() => {
		const title = page.url.searchParams.get('title') || '';
		const text = page.url.searchParams.get('text') || '';
		const url = page.url.searchParams.get('url') || '';

		const sharedContent = [title, text, url].filter(Boolean).join(' ').trim();

		const basePath = resolve('new-idea');

		if (sharedContent) {
			const params = new URLSearchParams({ shared: sharedContent });
			void goto(`${basePath}?${params.toString()}`, { replace: true });
		} else {
			void goto(basePath, { replace: true });
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<p class="text-muted-foreground">Processing shared content...</p>
</div>
