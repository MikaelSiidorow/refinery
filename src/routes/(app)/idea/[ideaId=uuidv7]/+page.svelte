<script lang="ts">
	import { get_z } from '$lib/z.svelte';
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
	import PromptSelector from '$lib/components/prompt-selector.svelte';
	import ArtifactCard from '$lib/components/artifact-card.svelte';
	import { TagsInput } from '$lib/components/ui/tags-input';
	import { createParameterizedQuery, createQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { toast } from 'svelte-sonner';
	import { createAutosaveForm } from '$lib/autosave-form.svelte';

	const z = get_z();

	const { params } = $props();

	const ideasQuery = createParameterizedQuery(z, queries.ideaById, () => [params.ideaId]);
	const idea = $derived(ideasQuery.data[0]);

	const settingsQuery = createQuery(z, queries.userSettings);
	const settings = $derived(settingsQuery.data[0]);

	const artifactsQuery = createParameterizedQuery(z, queries.artifactsByIdeaId, () => [
		params.ideaId
	]);
	const artifacts = $derived(artifactsQuery.data);

	let promptSelectorOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let artifactToDelete = $state<string | null>(null);

	const statusOptions = [
		{ value: 'inbox', label: 'Inbox' },
		{ value: 'developing', label: 'Developing' },
		{ value: 'ready', label: 'Ready' },
		{ value: 'published', label: 'Published' },
		{ value: 'archived', label: 'Archived' },
		{ value: 'cancelled', label: 'Cancelled' }
	] as const;

	const form = createAutosaveForm({
		source: () => idea,
		key: () => idea?.id,

		defaultValues: {
			oneLiner: '',
			notes: '',
			content: '',
			tags: [],
			status: 'inbox' as const
		},

		initialize: (idea) => ({
			oneLiner: idea.oneLiner || '',
			notes: idea.notes || '',
			content: idea.content || '',
			tags: idea.tags || [],
			status: idea.status || 'inbox'
		}),

		normalize: (idea) => ({
			oneLiner: idea.oneLiner || '',
			notes: idea.notes || '',
			content: idea.content || '',
			tags: (idea.tags || []).slice().sort(),
			status: idea.status || 'inbox'
		}),

		onSave: async (values) => {
			if (!idea) return;

			const write = z.mutate.contentIdea.update({
				id: idea.id,
				oneLiner: values.oneLiner,
				status: values.status,
				notes: values.notes,
				content: values.content,
				tags: values.tags
			});
			await write.client;
		}
	});

	function openPromptSelector() {
		promptSelectorOpen = true;
	}

	function handleKeydown(event: KeyboardEvent) {
		const isInputFocused = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName);

		if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			form.save();
			return;
		}

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

			goto(resolve(`/idea/${idea.id}/artifact/${artifactId}`));
		} catch (error) {
			console.error('Failed to create artifact:', error);
		}
	}

	function confirmDeleteArtifact(id: string) {
		artifactToDelete = id;
		deleteDialogOpen = true;
	}

	async function handleDeleteArtifact() {
		if (!artifactToDelete) return;

		try {
			const write = z.mutate.contentArtifact.delete(artifactToDelete as UuidV7);
			await write.client;
			deleteDialogOpen = false;
			artifactToDelete = null;
		} catch (error) {
			console.error('Failed to delete artifact:', error);
		}
	}

	async function handleCopyArtifact(content: string) {
		try {
			await navigator.clipboard.writeText(content);
			toast.success('Copied to clipboard', {
				description: 'Content is ready to paste'
			});
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			// Fallback: create temporary textarea
			const textarea = document.createElement('textarea');
			textarea.value = content;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			const success = document.execCommand('copy');
			document.body.removeChild(textarea);

			if (success) {
				toast.success('Copied to clipboard', {
					description: 'Content is ready to paste'
				});
			} else {
				toast.error('Failed to copy', {
					description: 'Please try copying manually'
				});
			}
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
				bind:value={form.values.oneLiner}
				placeholder="Idea title..."
				class="border-0 px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
			/>

			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4 text-sm">
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground">Status:</span>
						<Select.Root type="single" bind:value={form.values.status}>
							<Select.Trigger class="h-8 w-[140px]">
								{statusOptions.find((o) => o.value === form.values.status)?.label ||
									'Select status'}
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
						{#if form.status === 'saved'}
							<CircleCheck class="h-3.5 w-3.5 text-green-600" />
							<span class="text-xs text-green-600">Saved</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="mb-6 space-y-2 px-4 sm:px-0" style="max-width: 1224px;">
			<label for="tags" class="text-sm font-semibold">Tags</label>
			<p class="text-xs text-muted-foreground">
				Organize your ideas with tags (use comma, semicolon, or Enter to add)
			</p>
			<TagsInput
				id="tags"
				bind:value={form.values.tags}
				validate={(tag) => tag.toLowerCase().trim()}
			/>
		</div>

		<div
			class="grid grid-cols-1 gap-6 px-4 sm:px-0 lg:grid-cols-[minmax(0,600px)_minmax(0,600px)]"
			style="max-width: 1224px;"
		>
			<div class="min-w-0 space-y-2">
				<label for="notes" class="text-sm font-semibold">Notes</label>
				<p class="text-xs text-muted-foreground">
					Brainstorm, research, outline - anything to help you write
				</p>
				<Textarea
					id="notes"
					bind:value={form.values.notes}
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
					bind:value={form.values.content}
					placeholder="Write or paste your content here..."
					class="min-h-[calc(100vh-24rem)] resize-y font-mono text-sm"
				/>
			</div>
		</div>

		<div class="mt-12 border-t px-4 pt-8 sm:px-0" style="max-width: 1224px;">
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
					<Copy class="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
					<p class="mb-1 text-sm font-medium">No artifacts yet</p>
					<p class="mb-4 text-sm text-muted-foreground">
						Create platform-specific versions of your content.<br />
						Use the AI Prompts button to get started.
					</p>
					<div
						class="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground"
					>
						<span class="rounded-md bg-muted px-2 py-1">Twitter Thread</span>
						<span class="rounded-md bg-muted px-2 py-1">LinkedIn Post</span>
						<span class="rounded-md bg-muted px-2 py-1">Blog Post</span>
						<span class="rounded-md bg-muted px-2 py-1">Newsletter</span>
					</div>
				</div>
			{:else}
				<div class="space-y-3">
					{#each artifacts as artifact (artifact.id)}
						<ArtifactCard
							{artifact}
							onEdit={handleEditArtifact}
							onDelete={confirmDeleteArtifact}
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

<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete artifact?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete this artifact.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={handleDeleteArtifact}
				class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
			>
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
