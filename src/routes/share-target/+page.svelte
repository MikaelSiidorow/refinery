<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	onMount(() => {
		const title = $page.url.searchParams.get('title') || '';
		const text = $page.url.searchParams.get('text') || '';
		const url = $page.url.searchParams.get('url') || '';

		const sharedContent = [title, text, url].filter(Boolean).join(' ').trim();

		if (sharedContent) {
			const params = new URLSearchParams({ shared: sharedContent });
			goto(`/new-idea?${params.toString()}`, { replaceState: true });
		} else {
			goto('/new-idea', { replaceState: true });
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<p class="text-muted-foreground">Processing shared content...</p>
</div>
