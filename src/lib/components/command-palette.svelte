<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { goto } from '$app/navigation';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import Fuse from 'fuse.js';
	import { House, CirclePlus, LogOut, PanelLeft, type IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import * as Kbd from '$lib/components/ui/kbd';
	import { resolve } from '$app/paths';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const sidebar = useSidebar();

	type NavItem = {
		id: string;
		title: string;
		description: string;
		url: string;
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- matches exactly lucide icon types
		icon: Component<IconProps, {}, ''>;
		shortcut?:
			| {
					type: 'chain';
					keys: string[];
			  }
			| {
					type: 'option';
					keys: string[];
			  }
			| {
					type: 'combination';
					keys: string[];
			  }
			| {
					type: 'single';
					key: string;
			  };
		isAction: boolean;
	};

	const navigationItems = [
		{
			id: 'dashboard',
			title: 'Dashboard',
			description: 'View all your content ideas',
			url: '/',
			icon: House,
			shortcut: {
				type: 'chain',
				keys: ['G', 'D']
			},
			isAction: false
		},
		{
			id: 'new-idea',
			title: 'New Idea',
			description: 'Quick capture a content idea',
			url: '/new-idea',
			icon: CirclePlus,
			shortcut: {
				type: 'single',
				key: 'C'
			},
			isAction: false
		},
		{
			id: 'toggle-sidebar',
			title: 'Toggle Sidebar',
			description: 'Show or hide the sidebar',
			url: '',
			icon: PanelLeft,
			shortcut: {
				type: 'combination',
				keys: [cmdOrCtrl, '.']
			},
			isAction: true
		},
		{
			id: 'sign-out',
			title: 'Sign Out',
			description: 'Sign out of your account',
			url: '/sign-out',
			icon: LogOut,
			shortcut: {
				type: 'combination',
				keys: ['Alt', 'Shift', 'Q']
			},
			isAction: true
		}
	] as const satisfies ReadonlyArray<NavItem>;

	let searchQuery = $state('');
	let filteredItems = $derived.by(() => {
		if (!searchQuery.trim()) {
			return navigationItems;
		}

		const fuse = new Fuse(navigationItems, {
			keys: ['title', 'description'],
			threshold: 0.3,
			includeScore: true
		});

		const results = fuse.search(searchQuery);
		return results.map((result) => result.item);
	});

	function handleSelect(item: (typeof navigationItems)[number]) {
		if (item.isAction) {
			if (item.id === 'sign-out') {
				// Handle sign out with form submission
				const form = document.createElement('form');
				form.method = 'POST';
				form.action = '/sign-out';
				document.body.appendChild(form);
				form.submit();
			} else if (item.id === 'toggle-sidebar') {
				// Toggle sidebar
				sidebar.toggle();
			}
		} else {
			goto(resolve(item.url));
		}
		open = false;
		searchQuery = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			open = !open;
		}
	}

	// Reset search when dialog closes
	$effect(() => {
		if (!open) {
			searchQuery = '';
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." bind:value={searchQuery} />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Navigation">
			{#each filteredItems as item (item.id)}
				<Command.Item onSelect={() => handleSelect(item)}>
					<item.icon class="mr-2 h-4 w-4" />
					<div class="flex flex-1 flex-col gap-0.5">
						<span>{item.title}</span>
						{#if item.description}
							<span class="text-xs text-muted-foreground">{item.description}</span>
						{/if}
					</div>
					{#if item.shortcut}
						<Command.Shortcut>
							{#if item.shortcut.type === 'chain'}
								<Kbd.Group>
									{#each item.shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
										{#if i < item.shortcut.keys.length - 1}
											<span>then</span>
										{/if}
									{/each}
								</Kbd.Group>
								<!-- 			{:else if item.shortcut.type === 'option'}
								<Kbd.Group>
									{#each item.shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
										{#if i < item.shortcut.keys.length - 1}
											<span>or</span>
										{/if}
									{/each}
								</Kbd.Group> -->
							{:else if item.shortcut.type === 'combination'}
								<Kbd.Group>
									{#each item.shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
									{/each}
								</Kbd.Group>
							{:else if item.shortcut.type === 'single'}
								<Kbd.Root>{item.shortcut.key}</Kbd.Root>
							{/if}
						</Command.Shortcut>
					{/if}
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
