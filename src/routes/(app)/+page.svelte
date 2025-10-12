<script lang="ts">
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge';
	import { formatRelativeTime } from '$lib/utils/date';
	import { getTagColor } from '$lib/utils/tag-colors';

	const z = get_z();

	const allIdeas = new Query(z.query.contentIdea.orderBy('createdAt', 'desc'));

	let selectedTags = $state<string[]>([]);

	const allUniqueTags = $derived.by(() => {
		const tagSet = new Set<string>();
		allIdeas.current.forEach((idea) => {
			idea.tags?.forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet).sort();
	});

	const filteredIdeas = $derived.by(() => {
		if (selectedTags.length === 0) return allIdeas.current;
		return allIdeas.current.filter(
			(idea) => idea.tags && selectedTags.some((tag) => idea.tags.includes(tag))
		);
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
		<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
		<p class="mt-2 text-sm text-muted-foreground">
			{groupedIdeas.inbox.length} Inbox · {groupedIdeas.developing.length} Developing · {groupedIdeas
				.ready.length} Ready · {groupedIdeas.published.length} Published
		</p>
	</div>

	{#if allUniqueTags.length > 0}
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
					class="rounded-md px-2 py-1 text-xs transition-opacity {getTagColor(tag)} {isSelected
						? 'opacity-100'
						: 'opacity-60 hover:opacity-80'}"
				>
					{tag}
				</button>
			{/each}
			{#if selectedTags.length > 0}
				<button
					onclick={() => {
						selectedTags = [];
					}}
					class="rounded-md border border-dashed px-2 py-1 text-xs hover:bg-accent"
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
						<button
							onclick={() => navigateToIdea(idea.id)}
							class="group w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
							type="button"
						>
							<div class="mb-2 flex items-start justify-between gap-2">
								<p class="line-clamp-2 flex-1 text-sm leading-relaxed">
									{idea.oneLiner}
								</p>
							</div>
							{#if idea.tags && idea.tags.length > 0}
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
						<div class="rounded-lg border border-dashed p-4 text-center">
							<p class="text-xs text-muted-foreground">No ideas</p>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
