<script lang="ts">
	/**
	 * AI Coach Panel - Placeholder Component
	 *
	 * TODO: This is a placeholder for future AI coaching functionality.
	 * Future implementation will:
	 * - Ask clarifying questions based on content analysis
	 * - Highlight areas for improvement (like Hemingway Editor)
	 * - Suggest thinking frameworks when stuck
	 * - Provide encouragement without rewriting content
	 * - Guide voice development, not replace it
	 *
	 * For now: Shows mock questions and guidance
	 */

	import { Sparkles } from '@lucide/svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';

	// Mock questions based on common content development needs
	const mockQuestions = [
		{
			category: 'Clarity',
			question: 'What specific outcome do you want readers to take away?',
			expanded: false
		},
		{
			category: 'Authenticity',
			question: 'What personal experience led to this insight?',
			expanded: false
		},
		{
			category: 'Engagement',
			question: 'What question would make readers stop scrolling?',
			expanded: false
		}
	];

	let questions = $state(mockQuestions);
</script>

<div class="flex h-full flex-col overflow-hidden border-t">
	<div class="border-b px-4 py-3">
		<div class="flex items-center gap-2">
			<Sparkles class="h-4 w-4 text-teal-600" />
			<h2 class="text-sm font-semibold">Thinking Coach</h2>
		</div>
		<p class="text-xs text-muted-foreground">Questions to guide your development</p>
	</div>

	<div class="flex-1 space-y-3 overflow-y-auto px-4 py-4">
		<div class="rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-950/20">
			<p class="font-medium text-amber-900 dark:text-amber-100">
				💡 AI Coach helps you think, not writes for you
			</p>
			<p class="mt-1 text-amber-800 dark:text-amber-200">
				Answer these questions in your own words to develop authentic content.
			</p>
		</div>

		{#each questions as item, i}
			<Collapsible.Root
				bind:open={item.expanded}
				class="rounded-lg border bg-card text-card-foreground"
			>
				<Collapsible.Trigger class="flex w-full items-start gap-3 p-3 text-left">
					<div
						class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700 dark:bg-teal-900 dark:text-teal-100"
					>
						{i + 1}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-xs font-medium text-muted-foreground">{item.category}</p>
						<p class="mt-0.5 text-sm">{item.question}</p>
					</div>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div class="border-t px-3 pb-3 pt-2">
						<p class="text-xs text-muted-foreground italic">
							[Future: Personalized follow-up questions and context-aware suggestions will appear here]
						</p>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}

		<!-- Placeholder for future features -->
		<div class="rounded-lg border border-dashed p-3 text-center">
			<p class="text-xs text-muted-foreground">
				More coaching questions will appear as you write
			</p>
		</div>
	</div>
</div>

<!--
Design Notes:
- Questions over rewrites (Hemingway approach)
- Encourage without replacing voice
- Visual cues (numbers, colors) for progress
- Collapsible to reduce cognitive load
- Future: Content analysis, highlighting, smart suggestions
-->
