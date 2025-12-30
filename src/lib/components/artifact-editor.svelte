<script lang="ts">
	import { get_z } from '$lib/z.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { CircleCheck, Sparkles } from '@lucide/svelte';
	import { queries } from '$lib/zero/queries';
	import { mutators } from '$lib/zero/mutators';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import PromptSelector from '$lib/components/prompt-selector.svelte';
	import { createAutosaveForm } from '$lib/autosave-form.svelte';
	import type { UuidV7 } from '$lib/utils';
	import type { ContentArtifact } from '$lib/server/db/schema';

	const {
		artifactId,
		ideaId,
		onDelete,
		onSave
	}: {
		artifactId: UuidV7;
		ideaId: UuidV7;
		onDelete?: () => void | Promise<void>;
		onSave?: () => void | Promise<void>;
	} = $props();

	const z = get_z();

	const artifactQuery = $derived(z.q(queries.artifactById(artifactId)));
	const artifact = $derived(artifactQuery.data[0]);

	const settingsQuery = z.q(queries.userSettings());
	const settings = $derived(settingsQuery.data[0]);

	let promptSelectorOpen = $state(false);
	let deleteDialogOpen = $state(false);

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

	const form = createAutosaveForm({
		source: () => artifact,
		key: () => artifact?.id,

		defaultValues: {
			title: '',
			content: '',
			artifactType: 'thread' as const,
			platform: '',
			status: 'draft' as const,
			plannedPublishDate: '',
			publishedUrl: '',
			publishedAt: '',
			impressions: '',
			likes: '',
			comments: '',
			shares: '',
			notes: ''
		},

		initialize: (artifact) => ({
			title: artifact.title || '',
			content: artifact.content || '',
			artifactType: artifact.artifactType,
			platform: artifact.platform || '',
			status: artifact.status || 'draft',
			plannedPublishDate: artifact.plannedPublishDate
				? new Date(artifact.plannedPublishDate).toISOString().split('T')[0]!
				: '',
			publishedUrl: artifact.publishedUrl || '',
			publishedAt: artifact.publishedAt
				? new Date(artifact.publishedAt).toISOString().split('T')[0]!
				: '',
			impressions: artifact.impressions != null ? artifact.impressions.toString() : '',
			likes: artifact.likes != null ? artifact.likes.toString() : '',
			comments: artifact.comments != null ? artifact.comments.toString() : '',
			shares: artifact.shares != null ? artifact.shares.toString() : '',
			notes: artifact.notes || ''
		}),

		normalize: (artifact) => ({
			title: artifact.title || '',
			content: artifact.content || '',
			artifactType: artifact.artifactType,
			platform: artifact.platform || '',
			status: artifact.status || 'draft',
			plannedPublishDate: artifact.plannedPublishDate
				? new Date(artifact.plannedPublishDate).toISOString().split('T')[0]!
				: '',
			publishedUrl: artifact.publishedUrl || '',
			publishedAt: artifact.publishedAt
				? new Date(artifact.publishedAt).toISOString().split('T')[0]!
				: '',
			impressions: artifact.impressions != null ? artifact.impressions.toString() : '',
			likes: artifact.likes != null ? artifact.likes.toString() : '',
			comments: artifact.comments != null ? artifact.comments.toString() : '',
			shares: artifact.shares != null ? artifact.shares.toString() : '',
			notes: artifact.notes || ''
		}),

		onSave: async (values) => {
			if (!artifact) return;

			const write = z.mutate(
				mutators.contentArtifact.update({
					id: artifact.id,
					title: values.title || undefined,
					content: values.content.trim() || '',
					artifactType: values.artifactType,
					platform: values.platform || undefined,
					status: values.status,
					plannedPublishDate: values.plannedPublishDate
						? new Date(values.plannedPublishDate).getTime()
						: undefined,
					publishedUrl: values.publishedUrl || undefined,
					publishedAt: values.publishedAt ? new Date(values.publishedAt).getTime() : undefined,
					impressions: values.impressions ? parseInt(values.impressions) : undefined,
					likes: values.likes ? parseInt(values.likes) : undefined,
					comments: values.comments ? parseInt(values.comments) : undefined,
					shares: values.shares ? parseInt(values.shares) : undefined,
					notes: values.notes || undefined
				})
			);
			await write.client;
			await onSave?.();
		}
	});

	function confirmDelete() {
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (!artifact) return;

		try {
			const write = z.mutate(mutators.contentArtifact.delete(artifact.id));
			await write.client;
			deleteDialogOpen = false;
			await onDelete?.();
		} catch (error) {
			console.error('Failed to delete artifact:', error);
		}
	}

	export async function save() {
		await form.save();
	}
</script>

{#if artifact}
	<div class="flex h-full flex-col">
		<div class="space-y-4 border-b p-6 pb-6">
			<div class="flex items-center justify-between">
				<h1 class="typography-h1">Edit Artifact</h1>
				<div class="flex items-center gap-4">
					<div class="flex min-w-15 items-center gap-1">
						{#if form.status === 'saved'}
							<CircleCheck class="h-3.5 w-3.5 text-green-600" />
							<span class="text-xs text-green-600">Saved</span>
						{:else if form.status === 'saving'}
							<span class="text-xs text-muted-foreground">Saving...</span>
						{/if}
					</div>
					<Button variant="destructive" onclick={confirmDelete} size="sm">Delete</Button>
				</div>
			</div>
		</div>

		<div class="flex-1 space-y-6 overflow-y-auto p-6">
			<div class="space-y-2">
				<label for="artifact-title" class="text-sm font-medium">
					Title <span class="text-muted-foreground">(optional)</span>
				</label>
				<Input
					id="artifact-title"
					bind:value={form.values.title}
					placeholder="e.g., Twitter Thread about Zero Sync"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<label for="artifact-type" class="text-sm font-medium">Type</label>
					<Select.Root type="single" bind:value={form.values.artifactType}>
						<Select.Trigger id="artifact-type">
							{artifactTypeOptions.find((o) => o.value === form.values.artifactType)?.label ||
								'Select type'}
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
						bind:value={form.values.platform}
						placeholder="e.g., Twitter, LinkedIn"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="artifact-content" class="text-sm font-medium">Content</label>
					<Button
						variant="outline"
						size="sm"
						onclick={() => (promptSelectorOpen = true)}
						class="gap-2"
					>
						<Sparkles class="h-4 w-4" />
						Polish & Refine
					</Button>
				</div>
				<Textarea
					id="artifact-content"
					bind:value={form.values.content}
					placeholder="Write your content here..."
					class="min-h-100 text-sm"
				/>
			</div>

			<div class="space-y-2">
				<label for="artifact-status" class="text-sm font-medium">Status</label>
				<Select.Root type="single" bind:value={form.values.status}>
					<Select.Trigger id="artifact-status">
						{statusOptions.find((o) => o.value === form.values.status)?.label || 'Select status'}
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

			{#if form.values.status !== 'published'}
				<div class="space-y-2">
					<label for="planned-date" class="text-sm font-medium">
						Planned Publish Date <span class="text-muted-foreground">(optional)</span>
					</label>
					<Input id="planned-date" type="date" bind:value={form.values.plannedPublishDate} />
					<p class="text-xs text-muted-foreground">
						Set a target date to help plan your content calendar
					</p>
				</div>
			{/if}

			{#if form.values.status === 'published'}
				<div class="space-y-4 rounded-lg border bg-muted/50 p-4">
					<h2 class="text-sm font-semibold">Publishing Information</h2>

					<div class="space-y-2">
						<label for="published-url" class="text-sm font-medium">Published URL</label>
						<Input
							id="published-url"
							bind:value={form.values.publishedUrl}
							type="url"
							placeholder="https://..."
						/>
					</div>

					<div class="space-y-2">
						<label for="published-date" class="text-sm font-medium">Published Date</label>
						<Input id="published-date" bind:value={form.values.publishedAt} type="date" />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<label for="impressions" class="text-sm font-medium">Impressions</label>
							<Input
								id="impressions"
								bind:value={form.values.impressions}
								type="number"
								placeholder="0"
							/>
						</div>

						<div class="space-y-2">
							<label for="likes" class="text-sm font-medium">Likes</label>
							<Input id="likes" bind:value={form.values.likes} type="number" placeholder="0" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<label for="comments-count" class="text-sm font-medium">Comments</label>
							<Input
								id="comments-count"
								bind:value={form.values.comments}
								type="number"
								placeholder="0"
							/>
						</div>

						<div class="space-y-2">
							<label for="shares" class="text-sm font-medium">Shares</label>
							<Input id="shares" bind:value={form.values.shares} type="number" placeholder="0" />
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
					bind:value={form.values.notes}
					placeholder="Any additional notes about this artifact..."
					class="min-h-25"
				/>
			</div>
		</div>
	</div>

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
					onclick={handleDelete}
					class="text-destructive-foreground bg-destructive hover:bg-destructive/90"
				>
					Delete
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<PromptSelector bind:open={promptSelectorOpen} {artifact} {settings} />
{/if}
