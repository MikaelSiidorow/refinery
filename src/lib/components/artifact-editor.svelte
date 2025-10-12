<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import type { ContentArtifact } from '$lib/zero/zero-schema.gen';
	import type { UuidV7 } from '$lib/utils';
	import { generateId } from '$lib/utils';
	import { get_z } from '$lib/z.svelte';

	let {
		open = $bindable(false),
		ideaId,
		artifact = null,
		initialType = null,
		onSaved
	}: {
		open?: boolean;
		ideaId: UuidV7;
		artifact?: ContentArtifact | null;
		initialType?: string | null;
		onSaved?: () => void;
	} = $props();

	const z = get_z();

	const isEditing = $derived(!!artifact);

	let title = $state('');
	let content = $state('');
	let artifactType = $state<
		'blog-post' | 'thread' | 'carousel' | 'newsletter' | 'email' | 'short-post' | 'comment'
	>('thread');
	let platform = $state('');
	let status = $state<'draft' | 'ready' | 'published'>('draft');
	let publishedUrl = $state('');
	let publishedAt = $state('');
	let impressions = $state('');
	let likes = $state('');
	let comments = $state('');
	let shares = $state('');
	let notes = $state('');

	let isSaving = $state(false);

	const artifactTypeOptions = [
		{ value: 'blog-post', label: 'Blog Post' },
		{ value: 'thread', label: 'Twitter Thread' },
		{ value: 'carousel', label: 'Carousel' },
		{ value: 'newsletter', label: 'Newsletter' },
		{ value: 'email', label: 'Email' },
		{ value: 'short-post', label: 'Short Post' },
		{ value: 'comment', label: 'Comment' }
	] as const;

	const statusOptions = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'ready', label: 'Ready' },
		{ value: 'published', label: 'Published' }
	] as const;

	$effect(() => {
		// Populate form when opening
		if (open) {
			if (artifact) {
				title = artifact.title || '';
				content = artifact.content || '';
				artifactType = artifact.artifactType;
				platform = artifact.platform ? artifact.platform : '';
				status = artifact.status || 'draft';
				publishedUrl = (artifact.publishedUrl || '') as string;
				publishedAt = artifact.publishedAt
					? new Date(artifact.publishedAt).toISOString().split('T')[0]!
					: '';
				impressions = artifact.impressions ? artifact.impressions.toString() : '';
				likes = artifact.likes ? artifact.likes.toString() : '';
				comments = artifact.comments ? artifact.comments.toString() : '';
				shares = artifact.shares ? artifact.shares.toString() : '';
				notes = artifact.notes ? artifact.notes : '';
			} else {
				resetForm();
				// Apply initial type if provided (from prompt strategy)
				if (initialType) {
					artifactType = initialType as
						| 'blog-post'
						| 'thread'
						| 'carousel'
						| 'newsletter'
						| 'email'
						| 'short-post'
						| 'comment';
				}
			}
		}
	});

	function resetForm() {
		title = '';
		content = '';
		artifactType = 'thread';
		platform = '';
		status = 'draft';
		publishedUrl = '';
		publishedAt = '';
		impressions = '';
		likes = '';
		comments = '';
		shares = '';
		notes = '';
	}

	async function handleSave() {
		if (!content.trim()) return;

		isSaving = true;
		try {
			if (isEditing && artifact) {
				const write = z.mutate.contentArtifact.update({
					id: artifact.id,
					title: title || undefined,
					content: content.trim(),
					status,
					publishedUrl: publishedUrl || undefined,
					publishedAt: publishedAt ? new Date(publishedAt).getTime() : undefined,
					impressions: impressions ? parseInt(impressions) : undefined,
					likes: likes ? parseInt(likes) : undefined,
					comments: comments ? parseInt(comments) : undefined,
					shares: shares ? parseInt(shares) : undefined,
					notes: notes || undefined
				});
				await write.client;
			} else {
				const write = z.mutate.contentArtifact.create({
					id: generateId(),
					ideaId,
					title: title || undefined,
					content: content.trim(),
					artifactType,
					platform: platform || undefined
				});
				await write.client;
			}

			onSaved?.();
			open = false;
		} catch (error) {
			console.error('Failed to save artifact:', error);
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!artifact) return;

		const confirmed = confirm('Delete this artifact? This cannot be undone.');
		if (!confirmed) return;

		try {
			const write = z.mutate.contentArtifact.delete(artifact.id);
			await write.client;
			onSaved?.();
			open = false;
		} catch (error) {
			console.error('Failed to delete artifact:', error);
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Edit Artifact' : 'Create Artifact'}</Dialog.Title>
			<Dialog.Description>
				{isEditing
					? 'Update your platform-specific content'
					: 'Create a new platform-specific version of your content'}
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex-1 space-y-4 overflow-y-auto pr-2">
			<div class="space-y-2">
				<label for="artifact-title" class="text-sm font-medium">
					Title <span class="text-muted-foreground">(optional)</span>
				</label>
				<Input
					id="artifact-title"
					bind:value={title}
					placeholder="e.g., Twitter Thread about Zero Sync"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="artifact-type" class="text-sm font-medium">Type</label>
					<Select.Root type="single" bind:value={artifactType} disabled={isEditing}>
						<Select.Trigger id="artifact-type">
							{artifactTypeOptions.find((o) => o.value === artifactType)?.label || 'Select type'}
						</Select.Trigger>
						<Select.Content>
							{#each artifactTypeOptions as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									{option.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<label for="artifact-platform" class="text-sm font-medium">
						Platform <span class="text-muted-foreground">(optional)</span>
					</label>
					<Input
						id="artifact-platform"
						bind:value={platform}
						placeholder="e.g., Twitter, LinkedIn"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<label for="artifact-content" class="text-sm font-medium">Content</label>
				<Textarea
					id="artifact-content"
					bind:value={content}
					placeholder="Paste your AI-generated content here..."
					class="min-h-[200px] font-mono text-sm"
				/>
			</div>

			<div class="space-y-2">
				<label for="artifact-status" class="text-sm font-medium">Status</label>
				<Select.Root type="single" bind:value={status}>
					<Select.Trigger id="artifact-status">
						{statusOptions.find((o) => o.value === status)?.label || 'Select status'}
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

			{#if status === 'published'}
				<div class="space-y-4 rounded-lg border bg-muted/50 p-4">
					<h4 class="text-sm font-semibold">Publishing Information</h4>

					<div class="space-y-2">
						<label for="published-url" class="text-sm font-medium">Published URL</label>
						<Input
							id="published-url"
							bind:value={publishedUrl}
							type="url"
							placeholder="https://..."
						/>
					</div>

					<div class="space-y-2">
						<label for="published-date" class="text-sm font-medium">Published Date</label>
						<Input id="published-date" bind:value={publishedAt} type="date" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<label for="impressions" class="text-sm font-medium">Impressions</label>
							<Input id="impressions" bind:value={impressions} type="number" placeholder="0" />
						</div>

						<div class="space-y-2">
							<label for="likes" class="text-sm font-medium">Likes</label>
							<Input id="likes" bind:value={likes} type="number" placeholder="0" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<label for="comments-count" class="text-sm font-medium">Comments</label>
							<Input id="comments-count" bind:value={comments} type="number" placeholder="0" />
						</div>

						<div class="space-y-2">
							<label for="shares" class="text-sm font-medium">Shares</label>
							<Input id="shares" bind:value={shares} type="number" placeholder="0" />
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-2">
				<label for="artifact-notes" class="text-sm font-medium">
					Notes <span class="text-muted-foreground">(optional)</span>
				</label>
				<Textarea
					id="artifact-notes"
					bind:value={notes}
					placeholder="Any additional notes about this artifact..."
					class="min-h-[80px]"
				/>
			</div>
		</div>

		<Dialog.Footer class="flex items-center justify-between">
			<div>
				{#if isEditing}
					<Button variant="destructive" onclick={handleDelete} disabled={isSaving}>Delete</Button>
				{/if}
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={() => (open = false)} disabled={isSaving}>Cancel</Button>
				<Button onclick={handleSave} disabled={isSaving || !content.trim()}>
					{isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
