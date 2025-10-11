<script lang="ts">
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { generateId } from '$lib/utils';

	const z = get_z();

	let oneLiner = $state('');

	// Query all content ideas using Zero's Query pattern
	const ideas = new Query(z.query.contentIdea);

	async function createIdea() {
		if (!oneLiner.trim()) return;

		try {
			const write = z.mutate.contentIdea.create({
				id: generateId(),
				oneLiner: oneLiner.trim()
			});
			await write.client;
			oneLiner = '';
		} catch (error) {
			console.error('Failed to create idea:', error);
		}
	}
</script>

<div class="p-8">
	<h1 class="mb-6 text-3xl font-bold">Test Custom Mutators</h1>

	{#if z.online}
		<div>Connected</div>
	{:else}
		<div>Offline</div>
	{/if}

	<div class="mb-8 max-w-md">
		<h2 class="mb-4 text-xl font-semibold">Create Content Idea</h2>
		<div class="flex gap-2">
			<Input
				bind:value={oneLiner}
				placeholder="Enter a content idea..."
				onkeydown={(e) => {
					if (e.key === 'Enter') createIdea();
				}}
			/>
			<Button onclick={createIdea}>Create</Button>
		</div>
	</div>

	<div>
		<h2 class="mb-4 text-xl font-semibold">Your Content Ideas ({ideas.current.length})</h2>
		{#if ideas.current.length === 0}
			<p class="text-gray-500">No ideas yet. Create one above!</p>
		{:else}
			<ul class="space-y-2">
				{#each ideas.current as idea (idea.id)}
					<li class="rounded border p-3">
						<p>{idea.oneLiner}</p>
						<p class="mt-1 text-sm text-gray-500">ID: {idea.id}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
