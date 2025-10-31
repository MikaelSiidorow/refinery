<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { getTagColor } from '$lib/utils/tag-colors';

	type Props = {
		value: string;
		disabled: boolean | null;
		active: boolean;
		onDelete: (value: string) => void;
	};

	let { value, disabled, onDelete, active }: Props = $props();
</script>

<div
	class="flex place-items-center gap-2 rounded-md px-2 py-0.5 ring-offset-background transition-all hover:cursor-default aria-selected:ring-2 aria-selected:ring-ring aria-selected:ring-offset-2 {getTagColor(
		value
	)}"
	aria-selected={active}
>
	<span>
		{value}
	</span>
	<button
		type="button"
		{disabled}
		onclick={() => onDelete(value)}
		class="rounded-sm focus-ring transition-calm hover:opacity-70"
	>
		<XIcon class="size-4" />
	</button>
</div>
