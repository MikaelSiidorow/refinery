<script lang="ts">
	import HouseIcon from '@lucide/svelte/icons/house';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UsersIcon from '@lucide/svelte/icons/users';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve } from '$app/paths';
	import NavUser from './nav-user.svelte';
	import type { User } from '$lib/server/db/schema';
	import { PlusIcon } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';

	let { user }: { user: Pick<User, 'username' | 'avatarUrl' | 'isSuperAdmin'> } = $props();

	const sidebar = Sidebar.useSidebar();

	type SidebarRoute = '/' | '/timeline' | '/settings' | '/admin/users';
	type SidebarItem = {
		title: string;
		url: SidebarRoute;
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- matches exactly lucide icon types
		icon: Component<IconProps, {}, ''>;
	};

	const baseItems = [
		{
			title: 'Dashboard',
			url: '/',
			icon: HouseIcon
		},
		{
			title: 'Timeline',
			url: '/timeline',
			icon: CalendarIcon
		},
		{
			title: 'Settings',
			url: '/settings',
			icon: SettingsIcon
		}
	] satisfies ReadonlyArray<SidebarItem>;

	const superAdminItems = [
		{
			title: 'Users',
			url: '/admin/users',
			icon: UsersIcon
		}
	] satisfies ReadonlyArray<SidebarItem>;

	const items = $derived.by(() =>
		user.isSuperAdmin ? [...baseItems, ...superAdminItems] : baseItems
	);

	function handleNavClick() {
		if (sidebar.isMobile && sidebar.openMobile) {
			sidebar.setOpenMobile(false);
		}
	}
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href={resolve('/new-idea')} {...props} onclick={handleNavClick}>
							<PlusIcon />
							<span>New Idea</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Application</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={resolve(item.url)} {...props} onclick={handleNavClick}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
