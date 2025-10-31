<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import { Badge } from '$lib/components/ui/badge';
	import { ExternalLink } from '@lucide/svelte';
	import { extractDomain } from '$lib/utils/url';

	let {
		urls,
		variant = 'secondary',
		size = 'default'
	}: {
		urls: string[];
		variant?: 'default' | 'secondary' | 'outline';
		size?: 'default' | 'sm';
	} = $props();

	const sizeClasses = {
		default: 'text-xs px-2 py-1',
		sm: 'text-[10px] px-1.5 py-0.5'
	};
</script>

{#if urls.length > 0}
	<div class="flex flex-wrap gap-1.5">
		{#each urls as url (url)}
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-block rounded-md focus-ring transition-calm hover:opacity-80"
				onclick={(e) => e.stopPropagation()}
			>
				<Badge {variant} class="{sizeClasses[size]} flex items-center gap-1">
					<ExternalLink class="h-3 w-3" />
					<span class="max-w-[200px] truncate">{extractDomain(url)}</span>
				</Badge>
			</a>
		{/each}
	</div>
{/if}
