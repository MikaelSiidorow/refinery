<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Kbd from '$lib/components/ui/kbd';
	import { ideaSchema } from './schema';
	import { generateId, isNonEmpty } from '$lib/utils';
	import Fuse from 'fuse.js';
	import { CircleCheck, CircleAlert, X, LoaderCircle, Copy, Trash2, Pencil } from '@lucide/svelte';
	import type { UuidV7 } from '$lib/utils';
	import { formatRelativeTime } from '$lib/utils/date';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte';
	import { ZodError } from 'zod';
	import { createQuery } from '$lib/zero/use-query.svelte';
	import * as queries from '$lib/zero/queries';

	const z = get_z();

	// Query all ideas for duplicate detection
	const allIdeas = createQuery(z, queries.allIdeas);

	// Query inbox ideas for display (sorted by newest first)
	const inboxIdeas = createQuery(z, queries.inboxIdeas);

	let inputValue = $state('');
	let queuedIdeas = $state<Array<{ id: UuidV7; text: string; isDuplicate: boolean }>>([]);
	let isSubmitting = $state(false);
	let editingId = $state<string | null>(null);
	let editValue = $state('');
	let saveStatus = $state<Record<string, 'saving' | 'saved'>>({});
	let inputError = $state<string | null>(null);

	const fuseOptions = {
		includeScore: true,
		threshold: 0.4,
		keys: ['oneLiner']
	};

	function checkDuplicate(text: string): boolean {
		const fuse = new Fuse(allIdeas.data, fuseOptions);
		const results = fuse.search(text);
		return isNonEmpty(results) && (results[0].score ?? 0) < 0.4;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			addIdeaToQueue();
		} else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
			event.preventDefault();
			submitAllIdeas();
		}
	}

	function addIdeaToQueue() {
		const trimmed = inputValue.trim();
		if (!trimmed) return;

		try {
			ideaSchema.parse(trimmed);
			inputError = null; // Clear any previous errors

			const isDuplicate = checkDuplicate(trimmed);
			queuedIdeas.push({
				id: generateId(),
				text: trimmed,
				isDuplicate
			});

			inputValue = '';
		} catch (error) {
			if (error instanceof ZodError) {
				// Get the first error message from Zod
				const firstError = error.issues[0];
				inputError = firstError?.message || 'Invalid input';
			}
		}
	}

	async function handlePaste(event: ClipboardEvent) {
		const pastedText = event.clipboardData?.getData('text');
		if (!pastedText) return;

		let lines = pastedText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		const allStartWithDash = lines.every((line) => line.startsWith('- '));
		const allStartWithAsterisk = lines.every((line) => line.startsWith('* '));

		if (allStartWithDash || allStartWithAsterisk) {
			lines = lines.map((line) => line.replace(/^[-*]\s+/, '').trim());
		}

		if (lines.length > 1) {
			event.preventDefault();

			const confirmed = confirm(`Detected ${lines.length} ideas. Add all to queue?`);
			if (confirmed) {
				lines.forEach((line) => {
					try {
						ideaSchema.parse(line);
						const isDuplicate = checkDuplicate(line);
						queuedIdeas.push({
							id: generateId(),
							text: line,
							isDuplicate
						});
					} catch (error) {
						console.error('Validation error for line:', line, error);
					}
				});
				inputValue = '';
			}
		}
	}

	function removeFromQueue(id: string) {
		queuedIdeas = queuedIdeas.filter((idea) => idea.id !== id);
	}

	function clearQueue() {
		if (queuedIdeas.length === 0) return;
		const confirmed = confirm(
			`Clear ${queuedIdeas.length} queued ${queuedIdeas.length === 1 ? 'idea' : 'ideas'}?`
		);
		if (confirmed) {
			queuedIdeas = [];
		}
	}

	async function submitAllIdeas() {
		if (queuedIdeas.length === 0) return;

		isSubmitting = true;
		try {
			for (const idea of queuedIdeas) {
				const write = z.mutate.contentIdea.create({
					id: idea.id,
					oneLiner: idea.text
				});
				await write.client;
			}

			queuedIdeas = [];
		} catch (error) {
			console.error('Failed to create ideas:', error);
			// TODO: Show error toast
		} finally {
			isSubmitting = false;
		}
	}

	function startEditing(id: string, currentText: string) {
		editingId = id;
		editValue = currentText;
	}

	async function saveEdit(id: string) {
		if (!editValue.trim()) return;

		try {
			ideaSchema.parse(editValue.trim());
			saveStatus[id] = 'saving';

			const write = z.mutate.contentIdea.update({
				id: id as UuidV7,
				oneLiner: editValue.trim()
			});
			await write.client;

			saveStatus[id] = 'saved';
			setTimeout(() => {
				delete saveStatus[id];
			}, 2000);

			editingId = null;
		} catch (error) {
			console.error('Failed to update idea:', error);
		}
	}

	function cancelEdit() {
		editingId = null;
		editValue = '';
	}

	let charCount = $derived(inputValue.length);
	let isNearLimit = $derived(charCount >= 230); // Yellow warning at 230
	let isOverLimit = $derived(charCount > 256); // Red error over 256
	let hasError = $derived(inputError !== null || isOverLimit);
</script>

<svelte:head>
	<title>Quick Capture - Refinery</title>
</svelte:head>

<div
	class="mx-auto grid grid-cols-1 gap-8 p-4 sm:p-8 lg:grid-cols-[minmax(0,768px)_384px]"
	style="max-width: 1200px;"
>
	<div class="min-w-0 lg:order-1">
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight">Quick Capture</h1>
			<p class="mt-2 text-muted-foreground">
				Rapidly capture content ideas. Press <Kbd.Root>Enter</Kbd.Root> to queue, <Kbd.Root
					>{cmdOrCtrl}+Enter</Kbd.Root
				> to submit.
			</p>
		</div>

		<div class="mb-8 space-y-3">
			<div>
				<div class="relative">
					<Input
						bind:value={inputValue}
						autofocus
						placeholder="Quick capture an idea... (Press Enter to add)"
						onkeydown={handleKeydown}
						onpaste={handlePaste}
						oninput={() => {
							if (inputError) inputError = null;
						}}
						aria-invalid={hasError}
						class="pr-16 text-base"
					/>
					<div
						class="absolute top-1/2 right-3 -translate-y-1/2 text-xs transition-colors {isOverLimit
							? 'font-medium text-destructive'
							: isNearLimit
								? 'font-medium text-amber-600 dark:text-amber-500'
								: 'text-muted-foreground'}"
					>
						{charCount}/256
					</div>
				</div>
				{#if inputError}
					<div class="mt-2 text-sm font-medium text-destructive">
						{inputError}
					</div>
				{:else if isOverLimit}
					<div class="mt-2 text-sm font-medium text-destructive">Max 256 characters</div>
				{/if}
			</div>

			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<Copy class="h-3 w-3" />
				<span>Tip: Paste multiple lines to bulk add</span>
			</div>
		</div>

		{#if queuedIdeas.length > 0}
			<div class="mb-8 space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">
						Queued Ideas
						<span class="ml-2 text-sm font-normal text-muted-foreground">
							({queuedIdeas.length})
						</span>
					</h2>
					<div class="flex gap-2">
						<Button
							onclick={clearQueue}
							disabled={queuedIdeas.length === 0}
							variant="outline"
							size="sm"
							class="gap-2"
						>
							<Trash2 class="h-4 w-4" />
							Clear
						</Button>
						<Button onclick={submitAllIdeas} disabled={isSubmitting} class="gap-2">
							{#if isSubmitting}
								<LoaderCircle class="h-4 w-4 animate-spin" />
								Submitting...
							{:else}
								Submit {queuedIdeas.length} {queuedIdeas.length === 1 ? 'Idea' : 'Ideas'}
							{/if}
						</Button>
					</div>
				</div>

				<div class="space-y-2">
					{#each queuedIdeas as idea (idea.id)}
						<div
							class="group relative rounded-lg border bg-card p-4 transition-colors {idea.isDuplicate
								? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20'
								: ''}"
						>
							<div class="flex items-start justify-between gap-3">
								<p class="flex-1 text-sm break-words">{idea.text}</p>
								<button
									onclick={() => removeFromQueue(idea.id)}
									class="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
									type="button"
								>
									<X class="h-4 w-4 text-muted-foreground hover:text-destructive" />
								</button>
							</div>

							{#if idea.isDuplicate}
								<div
									class="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500"
								>
									<CircleAlert class="h-3.5 w-3.5" />
									<span>Similar to existing idea</span>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<div class="min-w-0 space-y-4 lg:order-2 lg:border-l lg:pl-8">
		<div class="lg:sticky lg:top-8">
			<h2 class="mb-4 text-lg font-semibold">
				Inbox Ideas
				<span class="ml-2 text-sm font-normal text-muted-foreground">
					({inboxIdeas.data.length})
				</span>
			</h2>

			{#if inboxIdeas.data.length === 0}
				<p class="text-sm text-muted-foreground">No ideas yet. Create one above!</p>
			{:else}
				<div class="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2">
					{#each inboxIdeas.data as idea (idea.id)}
						<div class="group relative rounded-lg border bg-card p-3 transition-colors">
							{#if editingId === idea.id}
								<div class="flex items-center gap-2">
									<Input
										bind:value={editValue}
										class="flex-1 text-sm"
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												saveEdit(idea.id);
											} else if (e.key === 'Escape') {
												cancelEdit();
											}
										}}
									/>
									<Button onclick={() => saveEdit(idea.id)} size="sm" variant="ghost" class="gap-1">
										<CircleCheck class="h-4 w-4" />
									</Button>
									<Button onclick={cancelEdit} size="sm" variant="ghost">
										<X class="h-4 w-4" />
									</Button>
								</div>
							{:else}
								<button
									onclick={() => startEditing(idea.id, idea.oneLiner)}
									class="group/item w-full text-left"
									type="button"
								>
									<div class="flex items-start justify-between gap-2">
										<div class="min-w-0 flex-1">
											<p
												class="text-sm leading-relaxed transition-colors group-hover/item:text-primary"
											>
												{idea.oneLiner}
											</p>
											<p class="mt-2 text-xs text-muted-foreground">
												{formatRelativeTime(idea.createdAt)}
											</p>
										</div>
										<div
											class="flex-shrink-0 pt-0.5 opacity-0 transition-opacity group-hover/item:opacity-100"
										>
											<Pencil class="h-3.5 w-3.5 text-muted-foreground" />
										</div>
									</div>
								</button>

								{#if saveStatus[idea.id] === 'saved'}
									<div
										class="absolute top-3 right-3 flex items-center gap-1 text-xs text-green-600"
									>
										<CircleCheck class="h-3.5 w-3.5" />
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
