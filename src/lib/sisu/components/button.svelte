<!-- @sisu/button v0.1.0 -->
<!-- Migrated from shadcn-svelte button component -->
<!-- Variants: default, destructive, outline, secondary, ghost, link -->
<!-- Sizes: sm, default, lg, icon, icon-sm, icon-lg -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type BaseProps = {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
		children?: Snippet;
		class?: string;
	};

	type ButtonAsButton = BaseProps & {
		href?: never;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
	};

	type ButtonAsAnchor = BaseProps & {
		href: string;
		type?: never;
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
	};

	type Props = ButtonAsButton | ButtonAsAnchor;

	let props: Props = $props();
	let { variant = 'default', size = 'default', children, class: className, ...rest } = $derived(props);
</script>

{#if 'href' in props && props.href}
	<a
		data-variant={variant}
		data-size={size}
		href={props.disabled ? undefined : props.href}
		aria-disabled={props.disabled}
		class={className}
		onclick={props.onclick}
		role={props.disabled ? 'link' : undefined}
		tabindex={props.disabled ? -1 : undefined}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		data-variant={variant}
		data-size={size}
		type={'type' in props ? props.type : 'button'}
		disabled={'disabled' in props ? props.disabled : undefined}
		class={className}
		onclick={props.onclick}
	>
		{@render children?.()}
	</button>
{/if}

<style>
	/* Base button styles */
	button,
	a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-shrink: 0;
		white-space: nowrap;
		border-radius: var(--sisu-radius);
		font-family: var(--sisu-font-sans);
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.25rem;
		transition-property: color, background-color, border-color, text-decoration-color, fill, stroke,
			opacity, box-shadow, transform;
		transition-timing-function: var(--sisu-ease-out);
		transition-duration: var(--sisu-duration-micro);
		outline: none;
		cursor: pointer;
	}

	button:disabled,
	a[aria-disabled='true'] {
		pointer-events: none;
		opacity: 0.5;
	}

	/* Focus visible state - consistent focus ring */
	button:focus-visible,
	a:focus-visible {
		border-color: var(--sisu-color-ring);
		box-shadow: 0 0 0 3px oklch(from var(--sisu-color-ring) l c h / 0.5);
	}

	/* SVG icon sizing */
	button :global(svg:not([class*='size-'])),
	a :global(svg:not([class*='size-'])) {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
	}

	/* Variant: default (primary) */
	button[data-variant='default'],
	a[data-variant='default'] {
		background-color: var(--sisu-color-primary);
		color: var(--sisu-color-primary-foreground);
		box-shadow: var(--sisu-shadow-sm);
	}

	button[data-variant='default']:hover:not(:disabled),
	a[data-variant='default']:hover:not([aria-disabled='true']) {
		background-color: oklch(from var(--sisu-color-primary) calc(l * 0.9) c h);
	}

	button[data-variant='default']:active:not(:disabled),
	a[data-variant='default']:active:not([aria-disabled='true']) {
		transform: scale(0.98);
	}

	/* Variant: destructive */
	button[data-variant='destructive'],
	a[data-variant='destructive'] {
		background-color: var(--sisu-color-destructive);
		color: white;
		box-shadow: var(--sisu-shadow-sm);
	}

	button[data-variant='destructive']:hover:not(:disabled),
	a[data-variant='destructive']:hover:not([aria-disabled='true']) {
		background-color: oklch(from var(--sisu-color-destructive) calc(l * 0.9) c h);
	}

	button[data-variant='destructive']:active:not(:disabled),
	a[data-variant='destructive']:active:not([aria-disabled='true']) {
		transform: scale(0.98);
	}

	button[data-variant='destructive']:focus-visible,
	a[data-variant='destructive']:focus-visible {
		box-shadow: 0 0 0 3px oklch(from var(--sisu-color-destructive) l c h / 0.3);
	}

	/* Variant: outline */
	button[data-variant='outline'],
	a[data-variant='outline'] {
		background-color: var(--sisu-color-background);
		border: 1px solid var(--sisu-color-border);
		box-shadow: var(--sisu-shadow-sm);
	}

	button[data-variant='outline']:hover:not(:disabled),
	a[data-variant='outline']:hover:not([aria-disabled='true']) {
		background-color: oklch(from var(--sisu-color-accent) l c h / 0.15);
	}

	button[data-variant='outline']:active:not(:disabled),
	a[data-variant='outline']:active:not([aria-disabled='true']) {
		transform: scale(0.98);
	}

	/* Variant: secondary */
	button[data-variant='secondary'],
	a[data-variant='secondary'] {
		background-color: var(--sisu-color-secondary);
		color: var(--sisu-color-secondary-foreground);
		box-shadow: var(--sisu-shadow-sm);
	}

	button[data-variant='secondary']:hover:not(:disabled),
	a[data-variant='secondary']:hover:not([aria-disabled='true']) {
		background-color: oklch(from var(--sisu-color-secondary) calc(l * 0.8) c h);
	}

	button[data-variant='secondary']:active:not(:disabled),
	a[data-variant='secondary']:active:not([aria-disabled='true']) {
		transform: scale(0.98);
	}

	/* Variant: ghost */
	button[data-variant='ghost'],
	a[data-variant='ghost'] {
		background-color: transparent;
	}

	button[data-variant='ghost']:hover:not(:disabled),
	a[data-variant='ghost']:hover:not([aria-disabled='true']) {
		background-color: oklch(from var(--sisu-color-accent) l c h / 0.15);
		color: var(--sisu-color-accent-foreground);
	}

	/* Variant: link */
	button[data-variant='link'],
	a[data-variant='link'] {
		background-color: transparent;
		color: var(--sisu-color-primary);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	button[data-variant='link']:hover:not(:disabled),
	a[data-variant='link']:hover:not([aria-disabled='true']) {
		text-decoration: none;
	}

	/* Size: default */
	button[data-size='default'],
	a[data-size='default'] {
		height: 2.25rem;
		padding-left: 1rem;
		padding-right: 1rem;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}

	button[data-size='default']:has(> :global(svg)),
	a[data-size='default']:has(> :global(svg)) {
		padding-left: 0.75rem;
		padding-right: 0.75rem;
	}

	/* Size: sm */
	button[data-size='sm'],
	a[data-size='sm'] {
		height: 2rem;
		gap: 0.375rem;
		padding-left: 0.75rem;
		padding-right: 0.75rem;
		border-radius: var(--sisu-radius);
	}

	button[data-size='sm']:has(> :global(svg)),
	a[data-size='sm']:has(> :global(svg)) {
		padding-left: 0.625rem;
		padding-right: 0.625rem;
	}

	/* Size: lg */
	button[data-size='lg'],
	a[data-size='lg'] {
		height: 2.5rem;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
		border-radius: var(--sisu-radius);
	}

	button[data-size='lg']:has(> :global(svg)),
	a[data-size='lg']:has(> :global(svg)) {
		padding-left: 1rem;
		padding-right: 1rem;
	}

	/* Size: icon */
	button[data-size='icon'],
	a[data-size='icon'] {
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
	}

	/* Size: icon-sm */
	button[data-size='icon-sm'],
	a[data-size='icon-sm'] {
		width: 2rem;
		height: 2rem;
		padding: 0;
	}

	/* Size: icon-lg */
	button[data-size='icon-lg'],
	a[data-size='icon-lg'] {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
	}
</style>
