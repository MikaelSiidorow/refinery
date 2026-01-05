<!-- @sisu/button v0.2.0 -->
<!-- Migrated from shadcn-svelte button component -->
<!-- Variants: default, destructive, outline, secondary, ghost, link -->
<!-- Sizes: sm, default, lg, icon, icon-sm, icon-lg -->
<!-- Supports #child snippet for semantic element flexibility -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type BaseProps = {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
		children?: Snippet;
		child?: Snippet<[{ props: Record<string, any>; 'data-sisu-button': '' }]>;
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
	let {
		variant = 'default',
		size = 'default',
		children,
		child,
		class: className,
		...rest
	} = $derived(props);

	const buttonProps = $derived({
		'data-variant': variant,
		'data-size': size,
		'data-sisu-button': '',
		class: className,
		onclick: props.onclick
	});
</script>

{#if child}
	{@render child({ props: buttonProps })}
{:else if 'href' in props && props.href}
	<a
		{...buttonProps}
		href={props.disabled ? undefined : props.href}
		aria-disabled={props.disabled}
		role={props.disabled ? 'link' : undefined}
		tabindex={props.disabled ? -1 : undefined}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{...buttonProps}
		type={'type' in props ? props.type : 'button'}
		disabled={'disabled' in props ? props.disabled : undefined}
	>
		{@render children?.()}
	</button>
{/if}

<style>
	/* Base button styles - target data-sisu-button attribute */
	:global([data-sisu-button]) {
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

	:global([data-sisu-button]:disabled),
	:global([data-sisu-button][aria-disabled='true']) {
		pointer-events: none;
		opacity: 0.5;
	}

	/* Focus visible state - consistent focus ring */
	:global([data-sisu-button]:focus-visible) {
		border-color: var(--sisu-color-ring);
		box-shadow: 0 0 0 3px oklch(from var(--sisu-color-ring) l c h / 0.5);
	}

	/* SVG icon sizing */
	:global([data-sisu-button] svg:not([class*='size-'])) {
		width: 1rem;
		height: 1rem;
		pointer-events: none;
		flex-shrink: 0;
	}

	/* Variant: default (primary) */
	:global([data-sisu-button][data-variant='default']) {
		background-color: var(--sisu-color-primary);
		color: var(--sisu-color-primary-foreground);
		box-shadow: var(--sisu-shadow-sm);
	}

	:global([data-sisu-button][data-variant='default']:hover:not(:disabled):not([aria-disabled='true'])) {
		background-color: oklch(from var(--sisu-color-primary) calc(l * 0.9) c h);
	}

	:global([data-sisu-button][data-variant='default']:active:not(:disabled):not([aria-disabled='true'])) {
		transform: scale(0.98);
	}

	/* Variant: destructive */
	:global([data-sisu-button][data-variant='destructive']) {
		background-color: var(--sisu-color-destructive);
		color: white;
		box-shadow: var(--sisu-shadow-sm);
	}

	:global([data-sisu-button][data-variant='destructive']:hover:not(:disabled):not([aria-disabled='true'])) {
		background-color: oklch(from var(--sisu-color-destructive) calc(l * 0.9) c h);
	}

	:global([data-sisu-button][data-variant='destructive']:active:not(:disabled):not([aria-disabled='true'])) {
		transform: scale(0.98);
	}

	:global([data-sisu-button][data-variant='destructive']:focus-visible) {
		box-shadow: 0 0 0 3px oklch(from var(--sisu-color-destructive) l c h / 0.3);
	}

	/* Variant: outline */
	:global([data-sisu-button][data-variant='outline']) {
		background-color: var(--sisu-color-background);
		border: 1px solid var(--sisu-color-border);
		box-shadow: var(--sisu-shadow-sm);
	}

	:global([data-sisu-button][data-variant='outline']:hover:not(:disabled):not([aria-disabled='true'])) {
		background-color: oklch(from var(--sisu-color-accent) l c h / 0.15);
	}

	:global([data-sisu-button][data-variant='outline']:active:not(:disabled):not([aria-disabled='true'])) {
		transform: scale(0.98);
	}

	/* Variant: secondary */
	:global([data-sisu-button][data-variant='secondary']) {
		background-color: var(--sisu-color-secondary);
		color: var(--sisu-color-secondary-foreground);
		box-shadow: var(--sisu-shadow-sm);
	}

	:global([data-sisu-button][data-variant='secondary']:hover:not(:disabled):not([aria-disabled='true'])) {
		background-color: oklch(from var(--sisu-color-secondary) calc(l * 0.8) c h);
	}

	:global([data-sisu-button][data-variant='secondary']:active:not(:disabled):not([aria-disabled='true'])) {
		transform: scale(0.98);
	}

	/* Variant: ghost */
	:global([data-sisu-button][data-variant='ghost']) {
		background-color: transparent;
	}

	:global([data-sisu-button][data-variant='ghost']:hover:not(:disabled):not([aria-disabled='true'])) {
		background-color: oklch(from var(--sisu-color-accent) l c h / 0.15);
		color: var(--sisu-color-accent-foreground);
	}

	/* Variant: link */
	:global([data-sisu-button][data-variant='link']) {
		background-color: transparent;
		color: var(--sisu-color-primary);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	:global([data-sisu-button][data-variant='link']:hover:not(:disabled):not([aria-disabled='true'])) {
		text-decoration: none;
	}

	/* Size: default */
	:global([data-sisu-button][data-size='default']) {
		height: 2.25rem;
		padding-left: 1rem;
		padding-right: 1rem;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}

	:global([data-sisu-button][data-size='default']:has(> svg)) {
		padding-left: 0.75rem;
		padding-right: 0.75rem;
	}

	/* Size: sm */
	:global([data-sisu-button][data-size='sm']) {
		height: 2rem;
		gap: 0.375rem;
		padding-left: 0.75rem;
		padding-right: 0.75rem;
		border-radius: var(--sisu-radius);
	}

	:global([data-sisu-button][data-size='sm']:has(> svg)) {
		padding-left: 0.625rem;
		padding-right: 0.625rem;
	}

	/* Size: lg */
	:global([data-sisu-button][data-size='lg']) {
		height: 2.5rem;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
		border-radius: var(--sisu-radius);
	}

	:global([data-sisu-button][data-size='lg']:has(> svg)) {
		padding-left: 1rem;
		padding-right: 1rem;
	}

	/* Size: icon */
	:global([data-sisu-button][data-size='icon']) {
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
	}

	/* Size: icon-sm */
	:global([data-sisu-button][data-size='icon-sm']) {
		width: 2rem;
		height: 2rem;
		padding: 0;
	}

	/* Size: icon-lg */
	:global([data-sisu-button][data-size='icon-lg']) {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
	}
</style>
