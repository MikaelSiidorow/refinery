<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import HouseIcon from '@lucide/svelte/icons/house';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	const navItems = [
		{ title: 'Home', url: '/', icon: HouseIcon },
		{ title: 'New', url: '/new-idea', icon: PlusIcon },
		{ title: 'Timeline', url: '/timeline', icon: CalendarIcon }
	] as const;
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-around border-t border-border bg-background shadow-lg md:hidden"
	style="padding-bottom: env(safe-area-inset-bottom, 0);"
	aria-label="Primary navigation"
>
	{#each navItems as item (item.title)}
		{@const active = page.url.pathname === item.url}
		<a
			href={resolve(item.url)}
			class="flex h-full min-w-16 flex-1 flex-col items-center justify-center gap-1 px-2 text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent/15 active:scale-95"
			class:text-primary={active}
			aria-current={active ? 'page' : undefined}
		>
			<item.icon class="size-6" aria-hidden="true" />
			<span class="text-xs leading-none font-medium">{item.title}</span>
		</a>
	{/each}
</nav>
