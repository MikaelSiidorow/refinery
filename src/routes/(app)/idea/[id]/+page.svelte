<script lang="ts">
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { ArrowLeft, Copy, CircleCheck, CircleAlert } from '@lucide/svelte';
	import { formatRelativeTime } from '$lib/utils/date';
	import type { UuidV7 } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const z = get_z();

	const ideas = new Query(z.query.contentIdea.where('id', data.ideaId as UuidV7));
	const idea = $derived(ideas.current[0]);

	let editedOneLiner = $state('');
	let editedNotes = $state('');
	let editedContent = $state('');
	let selectedStatus = $state<
		'inbox' | 'developing' | 'ready' | 'published' | 'archived' | 'cancelled'
	>('inbox');
	let isSaving = $state(false);
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	let savedIndicatorTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		editedOneLiner = idea.oneLiner || '';
		editedNotes = idea.notes || '';
		editedContent = idea.content || '';
		selectedStatus = idea.status || 'inbox';
	});

	$effect(() => {
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
		saveStatus = 'saving';
		isSaving = true;
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
			// TODO: Show error toast
		} finally {
			isSaving = false;
		}
	}

	function copyPromptToClipboard() {
		if (!idea) return;

		const prompt = `You are a professional content writer. Based on the following idea and notes, write a complete, engaging blog post.

Idea: ${editedOneLiner}

Notes:
${editedNotes || '(No notes yet)'}

Write a well-structured post with:
- Compelling introduction that hooks the reader
- Clear main points with supporting examples
- Practical takeaways
- Strong conclusion`;

		navigator.clipboard.writeText(prompt);
		// TODO: Show success toast
		alert('Prompt copied to clipboard! Paste it into Claude 4.5');
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

		// Escape to go back (only when not focused in input)
		if (event.key === 'Escape' && !isInputFocused) {
			event.preventDefault();
			goBack();
		}
	}

	function goBack() {
		goto(resolve('/'));
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{idea?.oneLiner || 'Not Found'} - Refinery</title>
</svelte:head>

{#if !idea}
	<!-- 404 Not Found -->
	<div class="flex flex-1 items-center justify-center p-8">
		<div class="max-w-md text-center">
			<CircleAlert class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
			<h1 class="mb-2 text-2xl font-bold">Idea not found</h1>
			<p class="mb-6 text-muted-foreground">
				The idea you're looking for doesn't exist or has been deleted.
			</p>
			<Button onclick={() => goto(resolve('/'))} class="gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back to Dashboard
			</Button>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-7xl p-4 sm:p-8">
		<Button variant="ghost" onclick={goBack} class="mb-6 gap-2">
			<ArrowLeft class="h-4 w-4" />
			Back to Dashboard
		</Button>

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

				<Button onclick={copyPromptToClipboard} variant="outline" size="sm" class="gap-2">
					<Copy class="h-4 w-4" />
					Copy Prompt
				</Button>
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
				<label for="content" class="text-sm font-semibold">Content Draft</label>
				<p class="text-xs text-muted-foreground">
					Your full content draft - paste AI-generated content here or write manually
				</p>
				<Textarea
					id="content"
					bind:value={editedContent}
					placeholder="Write or paste your content here..."
					class="min-h-[calc(100vh-24rem)] resize-y font-mono text-sm"
				/>
			</div>
		</div>
	</div>
{/if}
