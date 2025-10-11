<script lang="ts">
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	const z = get_z();

	const ideas = new Query(z.query.contentIdea);
</script>

{#each ideas.current as idea (idea.id)}
	<p>{idea.oneLiner} ({idea.status})</p>
{/each}
