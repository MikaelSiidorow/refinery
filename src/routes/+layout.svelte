<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	import { PUBLIC_SERVER } from '$env/static/public';
	import { Z } from 'zero-svelte';
	import { schema, type Schema } from '$lib/zero/schema';

	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';

	let { children } = $props();

	new Z<Schema>({
		userID: 'anon',
		// userID: user_id, possibly from loader?
		server: PUBLIC_SERVER,
		schema
		// auth: data.jwt, if you need it
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<main>
		<Sidebar.Trigger />
		{@render children?.()}
	</main>
</Sidebar.Provider>
