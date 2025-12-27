<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setContext } from 'svelte';

	interface PreloadResult {
		cleanup: () => void;
		complete: Promise<void>;
	}

	interface Props {
		preloads: PreloadResult[];
		timeout?: number;
		children: Snippet;
	}

	const { preloads, timeout = 2000, children }: Props = $props();

	let ready = $state(false);

	// Context to let child components know if data loading timed out
	const dataReadySymbol = Symbol('dataReady');
	setContext(dataReadySymbol, () => ready);

	$effect(() => {
		let cancelled = false;

		void Promise.race([
			Promise.all(preloads.map((p) => p.complete)),
			new Promise<void>((resolve) => setTimeout(resolve, timeout))
		]).then(() => {
			if (!cancelled) {
				ready = true;
			}
		});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if ready}
	{@render children()}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="flex flex-col items-center gap-3">
			<div
				class="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"
			></div>
			<p class="text-sm text-muted-foreground">Loading...</p>
		</div>
	</div>
{/if}
