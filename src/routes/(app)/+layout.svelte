<script lang="ts">
	import type { WithChildren } from 'bits-ui';
	import { Z } from 'zero-svelte';
	import { PUBLIC_SERVER } from '$env/static/public';
	import type { AuthData } from '$lib/zero/auth';
	import { createMutators } from '$lib/zero/mutators';
	import { schema, type Schema } from '$lib/zero/schema';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator';
	import AppSidebar from '$lib/components/layout/app-sidebar.svelte';
	import AppBreadcrumb from '$lib/components/layout/app-breadcrumb.svelte';
	import CommandPalette from '$lib/components/layout/command-palette.svelte';
	import { setupAppShortcuts } from '$lib/hooks/use-keyboard-shortcuts.svelte';
	import type { LayoutData } from './$types';
	import { set_z } from '$lib/z.svelte';

	let { data, children }: WithChildren<{ data: LayoutData }> = $props();

	const authData: AuthData = {
		sub: data.user.id
	};

	set_z(
		new Z<Schema, ReturnType<typeof createMutators>>({
			userID: data.user.id,
			server: PUBLIC_SERVER,
			schema,
			mutators: createMutators(authData)
		})
	);

	let commandPaletteOpen = $state(false);
	const shortcuts = setupAppShortcuts();
</script>

<svelte:window onkeydown={shortcuts.handleKeydown} />

<CommandPalette bind:open={commandPaletteOpen} />

<Sidebar.Provider>
	<AppSidebar user={data.user} />
	<main class="flex flex-1 flex-col overflow-hidden">
		<header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<AppBreadcrumb />
		</header>
		{@render children?.()}
	</main>
</Sidebar.Provider>
