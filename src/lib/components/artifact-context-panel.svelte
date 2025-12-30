<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { queries } from '$lib/zero/queries';
	import type { UuidV7 } from '$lib/utils';
	import { formatRelativeTime } from '$lib/utils/date';
	import * as Collapsible from '$lib/components/ui/collapsible';

	const { ideaId }: { ideaId: UuidV7 } = $props();

	const z = get_z();

	const ideaQuery = $derived(z.q(queries.ideaById(ideaId)));
	const idea = $derived(ideaQuery.data[0]);
</script>

{#if idea}
	<div class="flex h-full flex-col overflow-hidden">
		<div class="border-b px-4 py-3">
			<h2 class="text-sm font-semibold">Idea Context</h2>
			<p class="text-xs text-muted-foreground">Original thinking and notes</p>
		</div>

		<div class="flex-1 space-y-4 overflow-y-auto px-4 py-4">
			<!-- One-liner -->
			<div class="space-y-2">
				<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Title</h3>
				<p class="text-sm">{idea.oneLiner || 'Untitled'}</p>
			</div>

			<!-- Tags -->
			{#if idea.tags && idea.tags.length > 0}
				<div class="space-y-2">
					<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tags</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each idea.tags as tag (tag)}
							<span class="rounded-md bg-muted px-2 py-0.5 text-xs">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Status -->
			<div class="space-y-2">
				<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Status</h3>
				<p class="text-sm capitalize">{idea.status}</p>
			</div>

			<!-- Content -->
			{#if idea.content}
				<Collapsible.Root open={true}>
					<div class="space-y-2">
						<Collapsible.Trigger class="flex w-full items-center justify-between">
							<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								Content
							</h3>
							<span class="text-xs text-muted-foreground">(click to collapse)</span>
						</Collapsible.Trigger>
						<Collapsible.Content>
							<div
								class="max-h-96 overflow-y-auto rounded-md bg-muted/30 p-3 font-mono text-xs leading-relaxed"
							>
								{idea.content}
							</div>
						</Collapsible.Content>
					</div>
				</Collapsible.Root>
			{/if}

			<!-- Metadata -->
			<div class="space-y-1 pt-2 text-xs text-muted-foreground">
				<p>Updated {formatRelativeTime(idea.updatedAt)}</p>
			</div>
		</div>
	</div>
{/if}
