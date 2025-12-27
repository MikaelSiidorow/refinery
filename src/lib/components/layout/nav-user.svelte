<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import type { User } from '$lib/server/db/schema';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { handleBuildInfoClick } from '$lib/utils/build-info';

	let { user }: { user: Pick<User, 'username' | 'avatarUrl'> } = $props();
	const sidebar = useSidebar();
	const initials = $derived(user.username.slice(0, 2).toUpperCase());
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatarUrl} alt={user.username} />
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.username}</span>
						</div>
						<ChevronsUpDownIcon class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<!-- Hidden build info trigger: tap 5 times -->
					<button
						type="button"
						class="flex w-full items-center gap-2 px-1 py-1.5 text-left text-sm"
						onclick={handleBuildInfoClick}
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatarUrl} alt={user.username} />
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.username}</span>
						</div>
					</button>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<form method="POST" action="/sign-out">
					<DropdownMenu.Item>
						<button type="submit" class="flex w-full items-center gap-2">
							<LogOutIcon />
							Sign out
						</button>
					</DropdownMenu.Item>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
