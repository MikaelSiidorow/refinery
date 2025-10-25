<script lang="ts">
	import * as Command from '$lib/components/ui/command';
	import { goto } from '$app/navigation';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar';
	import { House, CirclePlus, LogOut, PanelLeft, Settings, type IconProps } from '@lucide/svelte';
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
			id: 'settings',
			title: 'Settings',
			description: 'Configure your content settings',
			url: '/settings',
			icon: Settings,
			shortcut: {
				type: 'chain',
				keys: ['G', 'S']
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

	type NavItemType = (typeof navigationItems)[number];

	type SearchMatch = {
		score: number;
		indices: [number, number][];
	};

	type SearchResult = {
		item: NavItemType;
		matches: { key: 'title' | 'description'; indices: [number, number][] }[];
		score: number;
	};

	function sequentialMatch(query: string, text: string): SearchMatch | null {
		const lowerQuery = query.toLowerCase();
		const lowerText = text.toLowerCase();

		const indices: [number, number][] = [];
		let queryIndex = 0;
		let textIndex = 0;

		while (textIndex < lowerText.length && queryIndex < lowerQuery.length) {
			if (lowerText[textIndex] === lowerQuery[queryIndex]) {
				const start = textIndex;
				let end = textIndex;

				// Match consecutive characters
				while (
					queryIndex < lowerQuery.length &&
					textIndex < lowerText.length &&
					lowerText[textIndex] === lowerQuery[queryIndex]
				) {
					end = textIndex;
					queryIndex++;
					textIndex++;
				}

				indices.push([start, end]);
			} else {
				textIndex++;
			}
		}

		// If we didn't match all query characters, no match
		if (queryIndex < lowerQuery.length) {
			return null;
		}

		// Calculate score (lower is better)
		let score = 0;

		// Position weight: earlier matches score better (0-0.3)
		const startPosition = indices[0]?.[0] ?? text.length;
		score += (startPosition / text.length) * 0.3;

		// Consecutive chars weight: more consecutive = better (0-0.4)
		const matchedLength = indices.reduce((sum, [start, end]) => sum + (end - start + 1), 0);
		const consecutiveRatio = matchedLength / query.length;
		score += (1 - consecutiveRatio) * 0.4;

		// Coverage weight: how much text is matched (0-0.3)
		score += (1 - matchedLength / text.length) * 0.3;

		return { score, indices };
	}

	function searchItems(query: string): SearchResult[] {
		const results: SearchResult[] = [];

		for (const item of navigationItems) {
			const titleMatch = sequentialMatch(query, item.title);
			const descMatch = sequentialMatch(query, item.description);

			// Item matches if either title or description matches
			if (titleMatch || descMatch) {
				const matches: SearchResult['matches'] = [];

				if (titleMatch) {
					matches.push({ key: 'title', indices: titleMatch.indices });
				}

				if (descMatch) {
					matches.push({ key: 'description', indices: descMatch.indices });
				}

				// Calculate combined score (lower is better)
				let score: number;

				if (titleMatch && descMatch) {
					// Both match: weighted combination
					score = titleMatch.score * 0.7 + descMatch.score * 0.3;
				} else if (titleMatch) {
					// Only title matches: use title score directly (best case)
					score = titleMatch.score;
				} else {
					// Only description matches: add penalty to always rank below title matches
					score = 1.0 + descMatch!.score;
				}

				results.push({ item, matches, score });
			}
		}

		// Sort by score (lower is better)
		return results.sort((a, b) => a.score - b.score);
	}

	let filteredResults = $derived.by(() => {
		// Force re-evaluation by reading searchQuery directly
		const query = searchQuery.trim();

		if (!query) {
			return navigationItems.map((item) => ({ item, matches: [], score: 0 }));
		}

		return searchItems(query);
	});

	function highlightMatches(text: string, matches?: { indices: [number, number][] }): string {
		if (!matches || matches.indices.length === 0) {
			return text;
		}

		let result = '';
		let lastIndex = 0;

		for (const [start, end] of matches.indices) {
			result += text.slice(lastIndex, start);
			result += `<mark class="bg-yellow-200/50 dark:bg-yellow-500/30 rounded-sm px-0.5">${text.slice(start, end + 1)}</mark>`;
			lastIndex = end + 1;
		}

		result += text.slice(lastIndex);
		return result;
	}

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

<Command.Dialog bind:open shouldFilter={false}>
	<Command.Input placeholder="Type a command or search..." bind:value={searchQuery} />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Navigation">
			{#each filteredResults as result (result.item.id)}
				{@const titleMatch = result.matches?.find((m) => m.key === 'title')}
				{@const descMatch = result.matches?.find((m) => m.key === 'description')}
				<Command.Item onSelect={() => handleSelect(result.item)}>
					<result.item.icon class="mr-2 h-4 w-4" />
					<div class="flex flex-1 flex-col gap-0.5">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- Safe: highlighting static text from const array, user input only affects indices -->
						<span>{@html highlightMatches(result.item.title, titleMatch)}</span>
						{#if result.item.description}
							<span class="text-xs text-muted-foreground">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -- Safe: highlighting static text from const array, user input only affects indices -->
								{@html highlightMatches(result.item.description, descMatch)}
							</span>
						{/if}
					</div>
					{#if result.item.shortcut}
						<Command.Shortcut>
							{#if result.item.shortcut.type === 'chain'}
								<Kbd.Group>
									{#each result.item.shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
										{#if i < result.item.shortcut.keys.length - 1}
											<span>then</span>
										{/if}
									{/each}
								</Kbd.Group>
								<!-- 			{:else if result.item.shortcut.type === 'option'}
								<Kbd.Group>
									{#each result.item.shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
										{#if i < result.item.shortcut.keys.length - 1}
											<span>or</span>
										{/if}
									{/each}
								</Kbd.Group> -->
							{:else if result.item.shortcut.type === 'combination'}
								<Kbd.Group>
									{#each result.item.shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
									{/each}
								</Kbd.Group>
							{:else if result.item.shortcut.type === 'single'}
								<Kbd.Root>{result.item.shortcut.key}</Kbd.Root>
							{/if}
						</Command.Shortcut>
					{/if}
				</Command.Item>
			{/each}
		</Command.Group>
	</Command.List>
</Command.Dialog>
