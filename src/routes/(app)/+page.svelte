<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRelativeTime } from '$lib/utils/date';
	import { getTagColor } from '$lib/utils/tag-colors';
	import { extractUrls, removeUrls } from '$lib/utils/url';
	import UrlBadges from '$lib/components/url-badges.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { isNonEmpty } from '$lib/utils';
	import { createQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';

	const z = get_z();

	const allIdeas = createQuery(z, queries.allIdeas);

	let selectedTags = $state<string[]>([]);

	const allUniqueTags = $derived.by(() => {
		const tagSet = new SvelteSet<string>();
		allIdeas.data.forEach((idea) => {
			if (isNonEmpty(idea.tags)) {
				idea.tags.forEach((tag) => tagSet.add(tag));
			}
		});
		return Array.from(tagSet).sort();
	});

	const filteredIdeas = $derived.by(() => {
		if (selectedTags.length === 0) return allIdeas.data;
		return allIdeas.data.filter((idea) => {
			const tags = idea.tags;
			return isNonEmpty(tags) && selectedTags.some((tag) => tags.includes(tag));
		});
	});

	const groupedIdeas = $derived.by(() => {
		const groups = {
			inbox: filteredIdeas.filter((i) => i.status === 'inbox'),
			developing: filteredIdeas.filter((i) => i.status === 'developing'),
			ready: filteredIdeas.filter((i) => i.status === 'ready'),
			published: filteredIdeas.filter((i) => i.status === 'published')
		};
		return groups;
	});

	const statusConfig = {
		inbox: { label: 'Inbox', badgeClass: 'bg-muted text-muted-foreground' },
		developing: {
			label: 'Developing',
			badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
		},
		ready: {
			label: 'Ready',
			badgeClass: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
		},
		published: {
			label: 'Published',
			badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400'
		}
	};

	function navigateToIdea(id: string) {
		goto(resolve(`/idea/${id}`));
	}
</script>

<svelte:head>
	<title>Dashboard - Refinery</title>
</svelte:head>

<div class="mx-auto max-w-7xl p-4 sm:p-8">
	<div class="mb-8">
		<h1 class="typography-h1">Dashboard</h1>
		<p class="mt-2 text-sm text-muted-foreground">
			{groupedIdeas.inbox.length} Inbox · {groupedIdeas.developing.length} Developing · {groupedIdeas
				.ready.length} Ready · {groupedIdeas.published.length} Published
		</p>
	</div>

	{#if isNonEmpty(allUniqueTags)}
		<div class="mb-6 flex flex-wrap gap-2">
			<span class="text-sm text-muted-foreground">Filter by tags:</span>
			{#each allUniqueTags as tag (tag)}
				{@const isSelected = selectedTags.includes(tag)}
				<button
					onclick={() => {
						if (isSelected) {
							selectedTags = selectedTags.filter((t) => t !== tag);
						} else {
							selectedTags = [...selectedTags, tag];
						}
					}}
					class="rounded-md focus-ring px-2 py-1 text-xs transition-calm {getTagColor(
						tag
					)} {isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-80'}"
				>
					{tag}
				</button>
			{/each}
			{#if isNonEmpty(selectedTags)}
				<button
					onclick={() => {
						selectedTags = [];
					}}
					class="rounded-md border border-dashed focus-ring px-2 py-1 text-xs transition-calm hover:bg-accent"
				>
					Clear
				</button>
			{/if}
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each Object.entries(statusConfig) as [status, config] (status)}
			<div class="flex min-h-[400px] flex-col">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-sm font-semibold text-muted-foreground">
						{config.label}
					</h2>
					<Badge class="{config.badgeClass} ml-2">
						{groupedIdeas[status as keyof typeof groupedIdeas].length}
					</Badge>
				</div>

				<div class="space-y-2">
					{#each groupedIdeas[status as keyof typeof groupedIdeas] as idea (idea.id)}
						{@const urls = extractUrls(idea.oneLiner)}
						{@const cleanText = urls.length > 0 ? removeUrls(idea.oneLiner) : idea.oneLiner}
						<button
							onclick={() => navigateToIdea(idea.id)}
							class="group w-full rounded-lg border focus-ring interactive-surface bg-card p-3 text-left"
							type="button"
						>
							<div class="mb-2 flex items-start justify-between gap-2">
								<p class="line-clamp-2 flex-1 text-sm leading-relaxed wrap-break-word">
									{cleanText}
								</p>
							</div>
							{#if urls.length > 0}
								<div class="mb-2">
									<UrlBadges {urls} variant="outline" size="sm" />
								</div>
							{/if}
							{#if isNonEmpty(idea.tags)}
								<div class="mt-1.5 flex flex-wrap gap-1">
									{#each idea.tags.slice(0, 3) as tag (tag)}
										<Badge class="{getTagColor(tag)} px-1.5 py-0 text-xs">
											{tag}
										</Badge>
									{/each}
									{#if idea.tags.length > 3}
										<Badge variant="outline" class="px-1.5 py-0 text-xs">
											+{idea.tags.length - 3}
										</Badge>
									{/if}
								</div>
							{/if}
							<p class="text-xs text-muted-foreground">
								{formatRelativeTime(idea.createdAt)}
							</p>
						</button>
					{:else}
						<div class="rounded-lg border border-dashed p-6 text-center">
							{#if status === 'inbox'}
								<p class="mb-1 text-sm font-medium">No ideas yet</p>
								<p class="text-xs text-muted-foreground">Capture ideas as they come to you</p>
							{:else if status === 'developing'}
								<p class="mb-1 text-sm font-medium">Nothing in development</p>
								<p class="text-xs text-muted-foreground">Move ideas here to expand them</p>
							{:else if status === 'ready'}
								<p class="mb-1 text-sm font-medium">No content ready</p>
								<p class="text-xs text-muted-foreground">
									Finish developing ideas to mark as ready
								</p>
							{:else}
								<p class="mb-1 text-sm font-medium">Nothing published</p>
								<p class="text-xs text-muted-foreground">
									Share your content and track performance
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
