<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { ContentArtifact } from '$lib/zero/zero-schema.gen';
	import { formatRelativeTime } from '$lib/utils/date';
	import { extractUrls, removeUrls } from '$lib/utils/url';
	import UrlBadges from '$lib/components/url-badges.svelte';
	import {
		FileText,
		MessageSquare,
		Newspaper,
		Mail,
		Image,
		Twitter,
		Pencil,
		Trash2,
		Copy,
		Calendar
	} from '@lucide/svelte';

	let {
		artifact,
		onEdit,
		onDelete,
		onCopy
	}: {
		artifact: ContentArtifact;
		onEdit?: (id: string) => void;
		onDelete?: (id: string) => void;
		onCopy?: (content: string) => void;
	} = $props();

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

	const Icon = artifactIcons[artifact.artifactType] || FileText;

	const displayTitle = artifact.title || artifact.artifactType.replace('-', ' ');
	const status = artifact.status || 'draft';

	const plannedDate = $derived(
		artifact.plannedPublishDate ? new Date(artifact.plannedPublishDate) : null
	);

	const dateStatus = $derived.by(() => {
		if (!artifact.plannedPublishDate) return null;

		const todayTimestamp = Date.now();
		const todayDate = Math.floor(todayTimestamp / 86400000) * 86400000;

		const plannedTimestamp = artifact.plannedPublishDate;
		const plannedDateOnly = Math.floor(plannedTimestamp / 86400000) * 86400000;

		if (plannedDateOnly < todayDate) return 'overdue';
		if (plannedDateOnly === todayDate) return 'today';
		return 'upcoming';
	});

	const dateStatusColors = {
		overdue: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
		today: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
		upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
	};

	const formatPlannedDate = (date: Date) => {
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const contentUrls = $derived(artifact.content ? extractUrls(artifact.content) : []);
	const cleanContent = $derived(
		artifact.content && contentUrls.length > 0
			? removeUrls(artifact.content)
			: artifact.content || ''
	);
</script>

<div class="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
	<div class="flex items-start justify-between gap-3">
		<div class="flex flex-1 items-start gap-3">
			<div class="rounded-lg bg-muted p-2">
				<Icon class="h-4 w-4 text-muted-foreground" />
			</div>

			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-start gap-2">
					<h3 class="line-clamp-2 min-w-0 flex-1 font-semibold capitalize">{displayTitle}</h3>
					<Badge class="{statusColors[status]} shrink-0 text-xs">
						{status}
					</Badge>
				</div>

				{#if artifact.platform}
					<p class="text-xs text-muted-foreground">
						Platform: {artifact.platform}
					</p>
				{/if}

				<p class="text-xs text-muted-foreground">
					Created {formatRelativeTime(artifact.createdAt)}
				</p>

				{#if plannedDate && status !== 'published' && dateStatus}
					<div class="mt-1 flex items-center gap-1">
						<Calendar class="h-3 w-3" />
						<span class="text-xs"> Planned: </span>
						<Badge class="{dateStatusColors[dateStatus]} px-1.5 py-0 text-xs">
							{formatPlannedDate(plannedDate)}
							{#if dateStatus === 'overdue'}
								(overdue)
							{:else if dateStatus === 'today'}
								(today)
							{/if}
						</Badge>
					</div>
				{/if}

				{#if cleanContent}
					<p class="mt-2 line-clamp-2 text-sm wrap-break-word text-muted-foreground">
						{cleanContent}
					</p>
				{/if}

				{#if contentUrls.length > 0}
					<div class="mt-2">
						<UrlBadges urls={contentUrls} variant="outline" size="sm" />
					</div>
				{/if}

				{#if status === 'published'}
					<div class="mt-2 flex gap-4 text-xs text-muted-foreground">
						{#if artifact.impressions}
							<span>👁️ {artifact.impressions}</span>
						{/if}
						{#if artifact.likes}
							<span>❤️ {artifact.likes}</span>
						{/if}
						{#if artifact.comments}
							<span>💬 {artifact.comments}</span>
						{/if}
						{#if artifact.shares}
							<span>🔄 {artifact.shares}</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<div class="flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
			{#if onCopy}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => onCopy?.(artifact.content)}
					title="Copy content"
				>
					<Copy class="h-4 w-4" />
				</Button>
			{/if}

			{#if onEdit}
				<Button variant="ghost" size="sm" onclick={() => onEdit?.(artifact.id)} title="Edit">
					<Pencil class="h-4 w-4" />
				</Button>
			{/if}

			{#if onDelete}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => onDelete?.(artifact.id)}
					title="Delete"
					class="hover:text-destructive"
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</div>
</div>
