<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import ArtifactEditor from '$lib/components/artifact-editor.svelte';
	import type { UuidV7 } from '$lib/utils';
	import { isQueryLoading, shouldShow404 } from '$lib/zero/query-helpers';
	import { ArtifactPageSkeleton } from '$lib/components/skeletons';
	import { get_z } from '$lib/z.svelte';
	import { queries } from '$lib/zero/queries';

	const z = get_z();

	const { params } = $props();

	const artifactQuery = $derived(z.q(queries.artifactById(params.artifactId as UuidV7)));
	const artifact = $derived(artifactQuery.data[0]);
	const isLoading = $derived(isQueryLoading(artifactQuery));
	const showNotFound = $derived(shouldShow404(artifact, artifactQuery));

	const ideaQuery = $derived(artifact && z.q(queries.ideaById(artifact.ideaId)));
	const idea = $derived(ideaQuery?.data[0]);

	let editorRef: ArtifactEditor | null = $state(null);

	async function handleKeydown(event: KeyboardEvent) {
		const isInputFocused = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName);

		if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			await editorRef?.save();
			return;
		}

		if (event.key === 'Escape' && !isInputFocused) {
			event.preventDefault();
			await goBack();
		}
	}

	async function goBack() {
		if (idea) {
			await goto(resolve(`/idea/${idea.id}`));
		}
	}

	async function handleDelete() {
		await goBack();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{artifact?.title || (isLoading ? 'Loading...' : 'Not Found')} - Refinery</title>
</svelte:head>

{#if isLoading}
	<ArtifactPageSkeleton />
{:else if showNotFound}
	<div class="flex min-h-96 flex-col items-center justify-center p-8">
		<h1 class="mb-2 typography-h1">Artifact Not Found</h1>
		<p class="mb-4 text-muted-foreground">The artifact you're looking for doesn't exist.</p>
		<Button href="/" variant="outline">Back to Dashboard</Button>
	</div>
{:else if artifact && idea}
	<div class="mx-auto max-w-4xl px-4 py-4 sm:p-8">
		<ArtifactEditor
			bind:this={editorRef}
			artifactId={params.artifactId as UuidV7}
			ideaId={params.ideaId as UuidV7}
			onDelete={handleDelete}
		/>
	</div>
{/if}
