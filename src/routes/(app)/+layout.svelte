<script lang="ts">
	import type { WithChildren } from 'bits-ui';
	import { Z } from 'zero-svelte';
	import { PUBLIC_SERVER } from '$env/static/public';
	import type { AuthData } from '$lib/zero/auth';
	import { createMutators } from '$lib/zero/mutators';
	import { schema, type Schema } from '$lib/zero/schema';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import CommandPalette from '$lib/components/command-palette.svelte';
	import { setupAppShortcuts } from '$lib/hooks/use-keyboard-shortcuts.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: WithChildren<{ data: LayoutData }> = $props();

	const authData: AuthData = {
		sub: data.user.id
	};

	new Z<Schema, ReturnType<typeof createMutators>>({
		userID: data.user.id, // For IndexedDB namespacing (multi-user browser support)
		auth: data.zeroAuth, // JWT - the actual security boundary
		server: PUBLIC_SERVER,
		schema,
		mutators: createMutators(authData)
	});

	let commandPaletteOpen = $state(false);
	const shortcuts = setupAppShortcuts();
</script>

<svelte:window onkeydown={shortcuts.handleKeydown} />

<CommandPalette bind:open={commandPaletteOpen} />

<Sidebar.Provider>
	<AppSidebar user={data.user} />
	<main class="flex flex-1 flex-col overflow-hidden">
		<Sidebar.Trigger />
		{@render children?.()}
	</main>
</Sidebar.Provider>
