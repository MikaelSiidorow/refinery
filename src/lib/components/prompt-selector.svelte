<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { promptStrategies } from '$lib/prompts/strategies';
	import type { Row } from '@rocicorp/zero';
	import type { ExampleContent } from '$lib/prompts/types';
	import { Copy, Check } from '@lucide/svelte';
	import { get_z } from '$lib/z.svelte';
	import { queries } from '$lib/zero/queries';
	import { findRelevantIdeas, findRelevantArtifacts } from '$lib/prompts/example-matcher';

	let {
		open = $bindable(false),
		idea,
		artifact,
		settings,
		onCreateArtifact
	}: {
		open?: boolean;
		idea?: Row['contentIdea'];
		artifact?: Row['contentArtifact'];
		settings?: Row['contentSettings'];
		onCreateArtifact?: (artifactType: string) => void;
	} = $props();

	const z = get_z();

	// Fetch past content for examples
	const pastIdeasQuery = z.q(queries.recentIdeasWithContent());
	const pastIdeas = $derived(pastIdeasQuery.data);

	let selectedStrategyId = $state<string | null>(null);
	let copiedStrategyId = $state<string | null>(null);
	let copiedTimeout: ReturnType<typeof setTimeout> | null = null;

	// Determine context
	const isArtifactContext = $derived(!!artifact);
	const contentSource = $derived(artifact || idea);

	const hasContent = $derived(
		!!(idea?.content && idea.content.trim().length > 0) ||
			!!(artifact?.content && artifact.content.trim().length > 0)
	);
	const hasNotes = $derived(!!(idea?.notes && idea.notes.trim().length > 0));
	const hasOneLiner = $derived(!!(idea?.oneLiner && idea.oneLiner.trim().length > 0));

	const relevantStrategies = $derived(
		promptStrategies.filter((strategy) => {
			// For artifact context, filter by artifact type
			if (isArtifactContext && artifact) {
				// If strategy has targetArtifactTypes, check if current artifact matches
				if (strategy.targetArtifactTypes) {
					if (!strategy.targetArtifactTypes.includes(artifact.artifactType)) {
						return false;
					}
				}
				// For refine category, always show in artifact context
				if (strategy.category === 'refine') {
					return true;
				}
				// For adapt/engage categories, they can also be useful for refining
				if (strategy.category === 'adapt' || strategy.category === 'engage') {
					return true;
				}
				// Don't show structure strategies in artifact context
				if (strategy.category === 'structure') {
					return false;
				}
			} else {
				// For idea context (original behavior)
				// Don't show refine strategies
				if (strategy.category === 'refine') {
					return false;
				}
			}

			// Check requirements
			if (
				strategy.requirements.needsMasterContent !== undefined &&
				strategy.requirements.needsMasterContent !== hasContent
			) {
				return false;
			}
			if (strategy.requirements.needsNotes && !hasNotes) return false;
			if (strategy.requirements.needsOneLiner && !hasOneLiner) return false;
			return true;
		})
	);

	const structureStrategies = $derived(
		relevantStrategies.filter((s) => s.category === 'structure')
	);
	const adaptStrategies = $derived(relevantStrategies.filter((s) => s.category === 'adapt'));
	const engageStrategies = $derived(relevantStrategies.filter((s) => s.category === 'engage'));
	const refineStrategies = $derived(relevantStrategies.filter((s) => s.category === 'refine'));

	const selectedStrategy = $derived(
		selectedStrategyId ? promptStrategies.find((s) => s.id === selectedStrategyId) : null
	);

	// Fetch all past artifacts for examples
	const allArtifactsQuery = z.q(queries.allArtifacts());
	const allArtifacts = $derived(allArtifactsQuery.data);

	// Prepare examples for prompts using intelligent matching
	const examples = $derived<ExampleContent>({
		// For idea context, find relevant past ideas based on topic/tags
		pastIdeas: idea ? findRelevantIdeas(idea, pastIdeas, 2) : [],
		// For artifact context, find relevant past artifacts of the same type and platform
		pastArtifacts:
			selectedStrategy?.artifactType && contentSource
				? findRelevantArtifacts(
						selectedStrategy.artifactType,
						contentSource.content || '',
						allArtifacts,
						2,
						selectedStrategy.targetPlatform
					)
				: []
	});

	const generatedPrompt = $derived(
		selectedStrategy && contentSource
			? selectedStrategy.generate(contentSource, settings, examples)
			: ''
	);

	const categoryColors = {
		structure: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
		adapt: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
		engage: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
		analyze: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
		refine: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
	};

	function handleSelectStrategy(strategyId: string) {
		selectedStrategyId = strategyId;
	}

	function handleCopyPrompt() {
		if (generatedPrompt && selectedStrategyId) {
			void navigator.clipboard.writeText(generatedPrompt);
			copiedStrategyId = selectedStrategyId;

			if (copiedTimeout) {
				clearTimeout(copiedTimeout);
			}

			copiedTimeout = setTimeout(() => {
				copiedStrategyId = null;
			}, 2000);
		}
	}

	function handleCopyAndCreateArtifact() {
		if (generatedPrompt && selectedStrategy?.artifactType) {
			// Copy to clipboard
			void navigator.clipboard.writeText(generatedPrompt);

			// Trigger artifact creation with pre-filled type
			onCreateArtifact?.(selectedStrategy.artifactType);

			// Close the prompt selector
			open = false;
		}
	}

	// Reset state when dialog closes
	$effect(() => {
		if (!open) {
			selectedStrategyId = null;
			copiedStrategyId = null;
			if (copiedTimeout) {
				clearTimeout(copiedTimeout);
			}
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90vh] max-w-[95vw] flex-col overflow-hidden lg:max-w-[85vw]">
		<Dialog.Header>
			<Dialog.Title>
				{isArtifactContext ? 'Polish Your Content' : 'Content Frameworks'}
			</Dialog.Title>
			<Dialog.Description>
				{#if isArtifactContext}
					Choose a framework to refine and improve your {artifact?.artifactType.replace('-', ' ')}
				{:else}
					Choose a thinking framework to develop your content idea
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="mb-4 rounded-lg border bg-muted/50 p-3">
			{#if isArtifactContext}
				<p class="text-sm">
					<span class="font-semibold">✨ Polishing: {artifact?.artifactType.replace('-', ' ')}</span
					><br />
					Strengthen hooks, add CTAs, optimize length, and more
				</p>
			{:else if !hasContent}
				<p class="text-sm">
					<span class="font-semibold">💡 Starting fresh</span><br />
					Use frameworks to structure your thinking and develop your ideas
				</p>
			{:else}
				<p class="text-sm">
					<span class="font-semibold">✅ Content ready</span><br />
					Adapt to platforms, refine messaging, or boost engagement
				</p>
			{/if}
		</div>

		<div class="flex flex-1 gap-4 overflow-hidden">
			<div class="w-1/3 space-y-4 overflow-y-auto pr-2">
				{#if relevantStrategies.length === 0}
					<div class="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
						<p class="mb-2 text-sm font-semibold">No strategies available</p>
						<p class="text-xs text-muted-foreground">
							{#if !hasOneLiner}
								Add a one-liner to your idea to see available strategies.
							{:else}
								Please check the debug info above to see why strategies are hidden.
							{/if}
						</p>
					</div>
				{/if}

				{#if structureStrategies.length > 0}
					<div>
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Structure Your Thinking ({structureStrategies.length})
						</h3>
						<div class="space-y-2">
							{#each structureStrategies as strategy (strategy.id)}
								<button
									onclick={() => handleSelectStrategy(strategy.id)}
									class="w-full rounded-lg border focus-ring interactive-item p-3 text-left {selectedStrategyId ===
									strategy.id
										? 'border-primary bg-accent'
										: 'bg-card'}"
									type="button"
								>
									<div class="mb-2 flex items-start justify-between gap-2">
										<span class="text-2xl">{strategy.icon}</span>
										<Badge class="{categoryColors[strategy.category]} text-xs">
											{strategy.category}
										</Badge>
									</div>
									<h3 class="mb-1 font-semibold">{strategy.name}</h3>
									<p class="text-xs text-muted-foreground">{strategy.description}</p>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if adaptStrategies.length > 0}
					<div>
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Adapt to Platforms ({adaptStrategies.length})
						</h3>
						<div class="space-y-2">
							{#each adaptStrategies as strategy (strategy.id)}
								<button
									onclick={() => handleSelectStrategy(strategy.id)}
									class="w-full rounded-lg border focus-ring interactive-item p-3 text-left {selectedStrategyId ===
									strategy.id
										? 'border-primary bg-accent'
										: 'bg-card'}"
									type="button"
								>
									<div class="mb-2 flex items-start justify-between gap-2">
										<span class="text-2xl">{strategy.icon}</span>
										<Badge class="{categoryColors[strategy.category]} text-xs">
											{strategy.category}
										</Badge>
									</div>
									<h3 class="mb-1 font-semibold">{strategy.name}</h3>
									<p class="text-xs text-muted-foreground">{strategy.description}</p>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if engageStrategies.length > 0}
					<div>
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Engagement Tools ({engageStrategies.length})
						</h3>
						<div class="space-y-2">
							{#each engageStrategies as strategy (strategy.id)}
								<button
									onclick={() => handleSelectStrategy(strategy.id)}
									class="w-full rounded-lg border focus-ring interactive-item p-3 text-left {selectedStrategyId ===
									strategy.id
										? 'border-primary bg-accent'
										: 'bg-card'}"
									type="button"
								>
									<div class="mb-2 flex items-start justify-between gap-2">
										<span class="text-2xl">{strategy.icon}</span>
										<Badge class="{categoryColors[strategy.category]} text-xs">
											{strategy.category}
										</Badge>
									</div>
									<h3 class="mb-1 font-semibold">{strategy.name}</h3>
									<p class="text-xs text-muted-foreground">{strategy.description}</p>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if refineStrategies.length > 0}
					<div>
						<h3 class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Refine Content ({refineStrategies.length})
						</h3>
						<div class="space-y-2">
							{#each refineStrategies as strategy (strategy.id)}
								<button
									onclick={() => handleSelectStrategy(strategy.id)}
									class="w-full rounded-lg border focus-ring interactive-item p-3 text-left {selectedStrategyId ===
									strategy.id
										? 'border-primary bg-accent'
										: 'bg-card'}"
									type="button"
								>
									<div class="mb-2 flex items-start justify-between gap-2">
										<span class="text-2xl">{strategy.icon}</span>
										<Badge class="{categoryColors[strategy.category]} text-xs">
											{strategy.category}
										</Badge>
									</div>
									<h3 class="mb-1 font-semibold">{strategy.name}</h3>
									<p class="text-xs text-muted-foreground">{strategy.description}</p>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="flex flex-1 flex-col overflow-hidden border-l pl-4">
				{#if selectedStrategy}
					<div class="mb-3">
						<h3 class="mb-1 flex items-center gap-2 font-semibold">
							<span class="text-xl">{selectedStrategy.icon}</span>
							{selectedStrategy.name}
						</h3>
						<p class="text-sm text-muted-foreground">{selectedStrategy.description}</p>
					</div>

					<div class="mb-3 flex-1 overflow-y-auto rounded-lg border bg-muted/50 p-4">
						<pre
							class="font-mono text-xs leading-relaxed whitespace-pre-wrap outline-none">{generatedPrompt}</pre>
					</div>

					<div class="flex gap-2 self-end">
						<Button onclick={handleCopyPrompt} variant="outline" class="gap-2">
							{#if copiedStrategyId === selectedStrategy.id}
								<Check class="h-4 w-4" />
								Copied!
							{:else}
								<Copy class="h-4 w-4" />
								Copy to Clipboard
							{/if}
						</Button>

						{#if selectedStrategy.producesArtifact && onCreateArtifact}
							<Button onclick={handleCopyAndCreateArtifact} class="gap-2">
								<Copy class="h-4 w-4" />
								Copy & Create Artifact
							</Button>
						{/if}
					</div>
				{:else}
					<div class="flex flex-1 items-center justify-center text-center">
						<div class="max-w-xs">
							<p class="text-muted-foreground">
								Select a framework on the left to see your personalized thinking prompt
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
