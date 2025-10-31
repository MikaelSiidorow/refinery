<script lang="ts">
	import type { WithChildren } from 'bits-ui';
	import { Z } from 'zero-svelte';
	import { env } from '$env/dynamic/public';
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
			server: env.PUBLIC_SERVER!,
			schema,
			mutators: createMutators(authData)
		})
	);

	let commandPaletteOpen = $state(false);
	const shortcuts = setupAppShortcuts();
</script>

<svelte:window onkeydown={shortcuts.handleKeydown} />

<Sidebar.Provider>
	<CommandPalette bind:open={commandPaletteOpen} />
	<AppSidebar user={data.user} />
	<Sidebar.Inset>
		<header
			class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4"
		>
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<AppBreadcrumb />
			<button
				class="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md focus-ring text-muted-foreground transition-calm hover:bg-accent/15 md:hidden"
				onclick={() => (commandPaletteOpen = true)}
				aria-label="Open command palette"
				type="button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.3-4.3"></path>
				</svg>
			</button>
		</header>
		{@render children?.()}
	</Sidebar.Inset>
</Sidebar.Provider>
