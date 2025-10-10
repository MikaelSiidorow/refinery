<script lang="ts">
	import { Query } from 'zero-svelte';
	import { get_z } from '$lib/z.svelte';
	const z = get_z();

	const ideas = new Query(z.query.contentIdeas);
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

{#each ideas.current as idea (idea.id)}
	<p>({idea.oneLiner})</p>
{/each}
