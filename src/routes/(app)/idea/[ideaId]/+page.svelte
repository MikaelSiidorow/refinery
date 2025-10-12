<script lang="ts">
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { Copy, CircleCheck, Plus } from '@lucide/svelte';
	import { formatRelativeTime } from '$lib/utils/date';
	import type { UuidV7 } from '$lib/utils';
	import { generateId } from '$lib/utils';
	import type { PageData } from './$types';
	import PromptSelector from '$lib/components/prompt-selector.svelte';
	import ArtifactCard from '$lib/components/artifact-card.svelte';

	let { data }: { data: PageData } = $props();

	const z = get_z();

	// Initialize query without filter first
	let ideasQuery = new Query(z.query.contentIdea.limit(0));

	// Update query when params change
	$effect(() => {
		const ideaId = page.params.ideaId as UuidV7;
		ideasQuery.updateQuery(z.query.contentIdea.where('id', ideaId));
	});

	const idea = $derived(ideasQuery.current[0]);

	const settingsQuery = new Query(z.query.contentSettings.where('userId', data.user.id as UuidV7));
	const settings = $derived(settingsQuery.current[0]);

	let artifactsQuery = new Query(z.query.contentArtifact.limit(0));

	$effect(() => {
		const ideaId = page.params.ideaId as UuidV7;
		artifactsQuery.updateQuery(
			z.query.contentArtifact.where('ideaId', ideaId).orderBy('createdAt', 'desc')
		);
	});

	const artifacts = $derived(artifactsQuery.current);

	let editedOneLiner = $state('');
	let editedNotes = $state('');
	let editedContent = $state('');
	let selectedStatus = $state<
		'inbox' | 'developing' | 'ready' | 'published' | 'archived' | 'cancelled'
	>('inbox');
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let savedIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;
	let promptSelectorOpen = $state(false);

	$effect(() => {
		if (!idea) return;
		editedOneLiner = idea.oneLiner || '';
		editedNotes = idea.notes || '';
		editedContent = idea.content || '';
		selectedStatus = idea.status || 'inbox';
	});

	$effect(() => {
		if (!idea) return;
		const currentValues = {
			oneLiner: editedOneLiner,
			notes: editedNotes,
			content: editedContent,
			status: selectedStatus
		};

		if (
			currentValues.oneLiner === idea.oneLiner &&
			currentValues.notes === (idea.notes || '') &&
			currentValues.content === (idea.content || '') &&
			currentValues.status === (idea.status || 'inbox')
		) {
			return;
		}

		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(() => {
			saveChanges();
		}, 1000);

		return () => {
			if (saveTimeout) clearTimeout(saveTimeout);
		};
	});

	const statusOptions = [
		{ value: 'inbox', label: 'Inbox' },
		{ value: 'developing', label: 'Developing' },
		{ value: 'ready', label: 'Ready' },
		{ value: 'published', label: 'Published' },
		{ value: 'archived', label: 'Archived' },
		{ value: 'cancelled', label: 'Cancelled' }
	] as const;

	async function saveChanges() {
		if (!idea) return;
		saveStatus = 'saving';
		try {
			const write = z.mutate.contentIdea.update({
				id: idea.id,
				oneLiner: editedOneLiner,
				status: selectedStatus,
				notes: editedNotes,
				content: editedContent
			});
			await write.client;

			saveStatus = 'saved';
			if (savedIndicatorTimeout) {
				clearTimeout(savedIndicatorTimeout);
			}
			savedIndicatorTimeout = setTimeout(() => {
				saveStatus = 'idle';
			}, 2000);
		} catch (error) {
			console.error('Failed to save changes:', error);
			saveStatus = 'idle';
		}
	}

	function openPromptSelector() {
		promptSelectorOpen = true;
	}

	function handleKeydown(event: KeyboardEvent) {
		// Don't handle shortcuts when typing in inputs
		const isInputFocused = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName);

		// Cmd/Ctrl+S to save
		if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			saveChanges();
			return;
		}

		// Escape to go back (only when not focused in input and no modals are open)
		// Check for dialog overlays in the DOM to ensure no modals are open
		if (event.key === 'Escape' && !isInputFocused) {
			const hasOpenDialog = document.querySelector('[role="dialog"]');
			if (!hasOpenDialog && !promptSelectorOpen) {
				event.preventDefault();
				goBack();
			}
		}
	}

	function goBack() {
		goto(resolve('/'));
	}

	function handleEditArtifact(id: string) {
		if (!idea) return;
		goto(resolve(`/idea/${idea.id}/artifact/${id}`));
	}

	async function handleCreateArtifact() {
		if (!idea) return;

		try {
			const artifactId = generateId();
			const write = z.mutate.contentArtifact.create({
				id: artifactId,
				ideaId: idea.id,
				title: undefined,
				content: '',
				artifactType: 'thread',
				platform: undefined
			});
			await write.client;

			// Navigate to the edit page
			goto(resolve(`/idea/${idea.id}/artifact/${artifactId}`));
		} catch (error) {
			console.error('Failed to create artifact:', error);
		}
	}

	async function handleCreateArtifactFromPrompt(artifactType: string) {
		if (!idea) return;

		try {
			const artifactId = generateId();
			const write = z.mutate.contentArtifact.create({
				id: artifactId,
				ideaId: idea.id,
				title: undefined,
				content: '',
				artifactType: artifactType as
					| 'blog-post'
					| 'thread'
					| 'carousel'
					| 'newsletter'
					| 'email'
					| 'short-post'
					| 'comment',
				platform: undefined
			});
			await write.client;

			// Navigate to the edit page
			goto(resolve(`/idea/${idea.id}/artifact/${artifactId}`));
		} catch (error) {
			console.error('Failed to create artifact:', error);
		}
	}

	async function handleDeleteArtifact(id: string) {
		const confirmed = confirm('Delete this artifact? This cannot be undone.');
		if (!confirmed) return;

		try {
			const write = z.mutate.contentArtifact.delete(id as UuidV7);
			await write.client;
		} catch (error) {
			console.error('Failed to delete artifact:', error);
		}
	}

	async function handleCopyArtifact(content: string) {
		try {
			await navigator.clipboard.writeText(content);
			// TODO: Show toast notification
			console.log('Content copied to clipboard');
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			// Fallback: create temporary textarea
			const textarea = document.createElement('textarea');
			textarea.value = content;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{idea?.oneLiner || 'Not Found'} - Refinery</title>
</svelte:head>

{#if idea}
	<div class="mx-auto max-w-7xl p-4 sm:p-8">
		<div class="mb-6 space-y-4 border-b pb-6">
			<Input
				bind:value={editedOneLiner}
				placeholder="Idea title..."
				class="border-0 px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
			/>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4 text-sm">
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground">Status:</span>
						<Select.Root type="single" bind:value={selectedStatus}>
							<Select.Trigger class="h-8 w-[140px]">
								{statusOptions.find((o) => o.value === selectedStatus)?.label || 'Select status'}
							</Select.Trigger>
							<Select.Content>
								{#each statusOptions as option (option.value)}
									<Select.Item value={option.value} label={option.label}>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<span class="text-muted-foreground">·</span>
					<span class="text-muted-foreground">Updated {formatRelativeTime(idea.updatedAt)}</span>
					<div class="flex min-w-[60px] items-center gap-1">
						{#if saveStatus === 'saved'}
							<CircleCheck class="h-3.5 w-3.5 text-green-600" />
							<span class="text-xs text-green-600">Saved</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div
			class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,600px)]"
			style="max-width: 1224px;"
		>
			<div class="min-w-0 space-y-2">
				<label for="notes" class="text-sm font-semibold">Notes</label>
				<p class="text-xs text-muted-foreground">
					Brainstorm, research, outline - anything to help you write
				</p>
				<Textarea
					id="notes"
					bind:value={editedNotes}
					placeholder="Add your notes here..."
					class="min-h-[calc(100vh-24rem)] resize-y"
				/>
			</div>

			<div class="min-w-0 space-y-2">
				<div class="flex items-center justify-between">
					<div>
						<label for="content" class="text-sm font-semibold">Content Draft</label>
						<p class="text-xs text-muted-foreground">
							Your full content draft - paste AI-generated content here or write manually
						</p>
					</div>
					<Button onclick={openPromptSelector} variant="outline" size="sm" class="gap-2">
						<Copy class="h-4 w-4" />
						AI Prompts
					</Button>
				</div>
				<Textarea
					id="content"
					bind:value={editedContent}
					placeholder="Write or paste your content here..."
					class="min-h-[calc(100vh-24rem)] resize-y font-mono text-sm"
				/>
			</div>
		</div>

		<div class="mt-12 border-t pt-8" style="max-width: 1224px;">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold">
						Artifacts
						<span class="ml-2 text-sm font-normal text-muted-foreground">
							({artifacts.length})
						</span>
					</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Platform-specific versions of your content
					</p>
				</div>
				<Button onclick={handleCreateArtifact} class="gap-2">
					<Plus class="h-4 w-4" />
					New Artifact
				</Button>
			</div>

			{#if artifacts.length === 0}
				<div class="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
					<p class="text-sm text-muted-foreground">
						No artifacts yet. Create platform-specific versions using the prompt library.
					</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each artifacts as artifact (artifact.id)}
						<ArtifactCard
							{artifact}
							onEdit={handleEditArtifact}
							onDelete={handleDeleteArtifact}
							onCopy={handleCopyArtifact}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if idea}
		<PromptSelector
			bind:open={promptSelectorOpen}
			{idea}
			{settings}
			onCreateArtifact={handleCreateArtifactFromPrompt}
		/>
	{/if}
{/if}
