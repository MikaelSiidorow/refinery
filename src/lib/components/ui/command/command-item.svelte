<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		"relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none transition-calm aria-selected:bg-primary/10 aria-selected:border-l-2 aria-selected:border-l-primary aria-selected:pl-[calc(0.5rem-2px)] aria-selected:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus-visible:border-l-2 focus-visible:border-l-ring focus-visible:pl-[calc(0.5rem-2px)] aria-selected:focus-visible:border-l-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
		className
	)}
	{...restProps}
/>
