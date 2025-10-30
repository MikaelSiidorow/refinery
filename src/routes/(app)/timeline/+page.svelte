<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import {
		FileText,
		MessageSquare,
		Newspaper,
		Mail,
		Image,
		Twitter,
		Calendar,
		CircleAlert,
		Funnel
	} from '@lucide/svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { isNonEmpty } from '$lib/utils';
	import { createQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';

	const z = get_z();

	let statusFilter = $state<'all' | 'draft' | 'ready' | 'published'>('all');
	let typeFilter = $state<
		'all' | 'blog-post' | 'thread' | 'carousel' | 'newsletter' | 'email' | 'short-post' | 'comment'
	>('all');

	const artifactsQuery = createQuery(z, queries.scheduledArtifacts);

	const artifacts = $derived.by(() => {
		// Filter for artifacts with planned dates
		let filtered = artifactsQuery.data.filter((a) => a.plannedPublishDate != null);

		if (statusFilter !== 'all') {
			filtered = filtered.filter((a) => a.status === statusFilter);
		}

		if (typeFilter !== 'all') {
			filtered = filtered.filter((a) => a.artifactType === typeFilter);
		}

		return filtered;
	});

	const artifactIcons = {
		'blog-post': FileText,
		thread: Twitter,
		carousel: Image,
		newsletter: Newspaper,
		email: Mail,
		'short-post': MessageSquare,
		comment: MessageSquare
	};

	const statusColors = {
		draft: 'bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400',
		ready: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
		published: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
	};

	function startOfDay(timestamp: number): number {
		const date = new SvelteDate(timestamp);
		date.setHours(0, 0, 0, 0);
		return date.getTime();
	}

	function isSameDay(timestamp1: number, timestamp2: number): boolean {
		return startOfDay(timestamp1) === startOfDay(timestamp2);
	}

	function isThisWeek(timestamp: number, now: number): boolean {
		const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
		return timestamp >= startOfDay(now) && timestamp <= weekFromNow;
	}

	function isNextWeek(timestamp: number, now: number): boolean {
		const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
		const twoWeeksFromNow = now + 14 * 24 * 60 * 60 * 1000;
		return timestamp > weekFromNow && timestamp <= twoWeeksFromNow;
	}

	const groupedArtifacts = $derived.by(() => {
		const now = Date.now();
		const todayStart = startOfDay(now);

		return {
			overdue: artifacts.filter(
				(a) => a.plannedPublishDate && a.plannedPublishDate < todayStart && a.status !== 'published'
			),
			today: artifacts.filter(
				(a) => a.plannedPublishDate && isSameDay(a.plannedPublishDate, todayStart)
			),
			thisWeek: artifacts.filter(
				(a) =>
					a.plannedPublishDate &&
					isThisWeek(a.plannedPublishDate, now) &&
					!isSameDay(a.plannedPublishDate, todayStart)
			),
			nextWeek: artifacts.filter(
				(a) => a.plannedPublishDate && isNextWeek(a.plannedPublishDate, now)
			),
			later: artifacts.filter((a) => {
				if (!a.plannedPublishDate) return false;
				const twoWeeksFromNow = now + 14 * 24 * 60 * 60 * 1000;
				return a.plannedPublishDate > twoWeeksFromNow;
			})
		};
	});

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = Date.now();
		const diffDays = Math.floor((timestamp - startOfDay(now)) / (24 * 60 * 60 * 1000));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays === -1) return 'Yesterday';
		if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
		if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
		});
	}

	function navigateToArtifact(artifact: (typeof artifacts)[number]) {
		goto(resolve(`/idea/${artifact.ideaId}/artifact/${artifact.id}`));
	}
</script>

<svelte:head>
	<title>Timeline - Refinery</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-4 sm:p-8">
	<div class="mb-8">
		<div class="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Content Timeline</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					{#if isNonEmpty(groupedArtifacts.overdue)}
						{groupedArtifacts.overdue.length} overdue ·
					{/if}
					{groupedArtifacts.today.length + groupedArtifacts.thisWeek.length} this week ·
					{artifacts.length} total scheduled
				</p>
			</div>
		</div>

		<div class="flex flex-wrap gap-2">
			<div class="flex items-center gap-2">
				<Funnel class="h-4 w-4 text-muted-foreground" />
				<span class="text-sm text-muted-foreground">Filters:</span>
			</div>
			<Select.Root type="single" bind:value={statusFilter}>
				<Select.Trigger class="h-9 w-[140px]">
					Status: {statusFilter === 'all' ? 'All' : statusFilter}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All">All</Select.Item>
					<Select.Item value="draft" label="Draft">Draft</Select.Item>
					<Select.Item value="ready" label="Ready">Ready</Select.Item>
					<Select.Item value="published" label="Published">Published</Select.Item>
				</Select.Content>
			</Select.Root>

			<Select.Root type="single" bind:value={typeFilter}>
				<Select.Trigger class="h-9 w-40">
					Type: {typeFilter === 'all' ? 'All' : typeFilter.replace('-', ' ')}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All">All</Select.Item>
					<Select.Item value="blog-post" label="Blog Post">Blog Post</Select.Item>
					<Select.Item value="thread" label="Thread">Thread</Select.Item>
					<Select.Item value="carousel" label="Carousel">Carousel</Select.Item>
					<Select.Item value="newsletter" label="Newsletter">Newsletter</Select.Item>
					<Select.Item value="email" label="Email">Email</Select.Item>
					<Select.Item value="short-post" label="Short Post">Short Post</Select.Item>
					<Select.Item value="comment" label="Comment">Comment</Select.Item>
				</Select.Content>
			</Select.Root>

			{#if statusFilter !== 'all' || typeFilter !== 'all'}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => {
						statusFilter = 'all';
						typeFilter = 'all';
					}}
				>
					Clear filters
				</Button>
			{/if}
		</div>
	</div>

	<div class="space-y-8">
		{#if isNonEmpty(groupedArtifacts.overdue)}
			<section>
				<div class="mb-4 flex items-center gap-2">
					<CircleAlert class="h-5 w-5 text-red-600" />
					<h2 class="text-lg font-semibold text-red-600">
						Overdue ({groupedArtifacts.overdue.length})
					</h2>
				</div>
				<div class="space-y-3">
					{#each groupedArtifacts.overdue as artifact (artifact.id)}
						{@const Icon = artifactIcons[artifact.artifactType]}
						<button
							onclick={() => navigateToArtifact(artifact)}
							class="group w-full rounded-lg border border-red-200 bg-red-50/50 p-4 text-left transition-colors hover:bg-red-100/50 dark:border-red-900/50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
						>
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
									<Icon class="h-4 w-4 text-red-700 dark:text-red-400" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<h3 class="min-w-0 flex-1 truncate font-semibold">
											{artifact.title || artifact.artifactType.replace('-', ' ')}
										</h3>
										<Badge class="{statusColors[artifact.status || 'draft']} shrink-0 text-xs">
											{artifact.status || 'draft'}
										</Badge>
									</div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar class="h-3 w-3" />
										<span
											>{artifact.plannedPublishDate
												? formatDate(artifact.plannedPublishDate)
												: ''}</span
										>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if isNonEmpty(groupedArtifacts.today)}
			<section>
				<div class="mb-4 flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-blue-600"></div>
					<h2 class="text-lg font-semibold">Today</h2>
				</div>
				<div class="space-y-3">
					{#each groupedArtifacts.today as artifact (artifact.id)}
						{@const Icon = artifactIcons[artifact.artifactType]}
						<button
							onclick={() => navigateToArtifact(artifact)}
							class="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
						>
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-muted p-2">
									<Icon class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<h3 class="min-w-0 flex-1 truncate font-semibold">
											{artifact.title || artifact.artifactType.replace('-', ' ')}
										</h3>
										<Badge class="{statusColors[artifact.status || 'draft']} shrink-0 text-xs">
											{artifact.status || 'draft'}
										</Badge>
									</div>
									{#if artifact.platform}
										<p class="text-xs text-muted-foreground">Platform: {artifact.platform}</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if isNonEmpty(groupedArtifacts.thisWeek)}
			<section>
				<div class="mb-4">
					<h2 class="text-lg font-semibold">This Week</h2>
					<p class="text-xs text-muted-foreground">Next 7 days</p>
				</div>
				<div class="space-y-3">
					{#each groupedArtifacts.thisWeek as artifact (artifact.id)}
						{@const Icon = artifactIcons[artifact.artifactType]}
						<button
							onclick={() => navigateToArtifact(artifact)}
							class="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
						>
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-muted p-2">
									<Icon class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<h3 class="min-w-0 flex-1 truncate font-semibold">
											{artifact.title || artifact.artifactType.replace('-', ' ')}
										</h3>
										<Badge class="{statusColors[artifact.status || 'draft']} shrink-0 text-xs">
											{artifact.status || 'draft'}
										</Badge>
									</div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar class="h-3 w-3" />
										<span
											>{artifact.plannedPublishDate
												? formatDate(artifact.plannedPublishDate)
												: ''}</span
										>
									</div>
									{#if artifact.platform}
										<p class="text-xs text-muted-foreground">Platform: {artifact.platform}</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if isNonEmpty(groupedArtifacts.nextWeek)}
			<section>
				<div class="mb-4">
					<h2 class="text-lg font-semibold">Next Week</h2>
					<p class="text-xs text-muted-foreground">8-14 days from now</p>
				</div>
				<div class="space-y-3">
					{#each groupedArtifacts.nextWeek as artifact (artifact.id)}
						{@const Icon = artifactIcons[artifact.artifactType]}
						<button
							onclick={() => navigateToArtifact(artifact)}
							class="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
						>
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-muted p-2">
									<Icon class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<h3 class="min-w-0 flex-1 truncate font-semibold">
											{artifact.title || artifact.artifactType.replace('-', ' ')}
										</h3>
										<Badge class="{statusColors[artifact.status || 'draft']} shrink-0 text-xs">
											{artifact.status || 'draft'}
										</Badge>
									</div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar class="h-3 w-3" />
										<span
											>{artifact.plannedPublishDate
												? formatDate(artifact.plannedPublishDate)
												: ''}</span
										>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if isNonEmpty(groupedArtifacts.later)}
			<section>
				<div class="mb-4">
					<h2 class="text-lg font-semibold">Later</h2>
					<p class="text-xs text-muted-foreground">More than 2 weeks out</p>
				</div>
				<div class="space-y-3">
					{#each groupedArtifacts.later as artifact (artifact.id)}
						{@const Icon = artifactIcons[artifact.artifactType]}
						<button
							onclick={() => navigateToArtifact(artifact)}
							class="group w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
						>
							<div class="flex items-start gap-3">
								<div class="rounded-lg bg-muted p-2">
									<Icon class="h-4 w-4 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<h3 class="min-w-0 flex-1 truncate font-semibold">
											{artifact.title || artifact.artifactType.replace('-', ' ')}
										</h3>
										<Badge class="{statusColors[artifact.status || 'draft']} shrink-0 text-xs">
											{artifact.status || 'draft'}
										</Badge>
									</div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar class="h-3 w-3" />
										<span
											>{artifact.plannedPublishDate
												? formatDate(artifact.plannedPublishDate)
												: ''}</span
										>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		{#if artifacts.length === 0}
			<div class="rounded-lg border border-dashed bg-muted/20 p-12 text-center">
				<Calendar class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="mb-2 text-lg font-semibold">No scheduled content</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					Set planned publish dates on your artifacts to see them here.<br />
					This helps you plan your content calendar and stay organized.
				</p>
				<Button onclick={() => goto(resolve('/'))}>Go to Dashboard</Button>
			</div>
		{/if}
	</div>
</div>
