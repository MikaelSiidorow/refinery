# sisu - CSS-First Component Library

Zero-runtime, CSS-first components for Refinery. Code lives in your project, not node_modules.

## Philosophy

- **CSS First**: Target `data-*` attributes, not utility classes
- **Zero Runtime**: No dependencies - code is copied into your project
- **Scoped Styles**: Svelte scoped styles, no global naming conventions
- **Semantic Tokens**: Built on existing Refinery design tokens
- **Light/Dark**: Via `prefers-color-scheme` + optional toggle

## Components

### Button

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes**: `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`

```svelte
<script>
  import Button from '$lib/sisu/components/button.svelte';
</script>

<!-- Basic usage -->
<Button>Click me</Button>

<!-- With variant and size -->
<Button variant="outline" size="lg">Large Button</Button>

<!-- As link (renders <a> tag) -->
<Button href="/somewhere">Navigate</Button>

<!-- Using #child snippet for semantic flexibility -->
<Button variant="primary" size="lg">
  {#snippet child({ props })}
    <div {...props}>
      <Icon />
      <span>Custom Element</span>
    </div>
  {/snippet}
</Button>
```

## The `#child` Snippet Pattern

Inspired by bits-ui, the `#child` snippet allows you to change the underlying DOM element while preserving all button styles and behavior.

**Use cases**:
- Render a different semantic element (e.g., `<div>` instead of `<button>`)
- Add wrapper elements with custom structure
- Integrate with third-party components that require specific DOM

**Example**: Using with a custom Link component

```svelte
<Button variant="ghost">
  {#snippet child({ props })}
    <Link to="/dashboard" {...props}>
      Go to Dashboard
    </Link>
  {/snippet}
</Button>
```

The `props` object contains:
- `data-variant`: The selected variant
- `data-size`: The selected size
- `data-sisu-button`: Attribute for styling hook
- `class`: Any custom classes passed
- `onclick`: Click handler if provided

All button styles target `[data-sisu-button]` so they work regardless of the underlying element.

## CSS Variable Validation

Run stylelint to ensure all CSS variables are properly defined:

```bash
pnpm lint:css
```

Stylelint is configured to:
- Validate CSS custom properties exist
- Check for unknown property values
- Enforce property ordering (via recess-order)
- Support Tailwind directives (`@apply`, `@layer`, etc.)
- Validate oklch() color functions

## Token Layer

All components use semantic tokens from `tokens/props.css`, which map to Refinery's existing design system:

```css
var(--sisu-color-primary)           /* Maps to var(--color-primary) */
var(--sisu-radius)                  /* Maps to var(--radius) */
var(--sisu-duration-micro)          /* Maps to var(--duration-micro) */
var(--sisu-shadow-sm)               /* Maps to var(--shadow-sm) */
```

This ensures visual consistency across shadcn-svelte and sisu components during migration.

## Adding New Components

1. Create component in `components/[name].svelte`
2. Use `data-sisu-[name]` attribute for styling hook
3. Support `#child` snippet for flexibility
4. Use semantic tokens from `tokens/props.css`
5. Add version comment at top: `<!-- @sisu/[name] v0.1.0 -->`
6. Document variants, sizes, and API

## Migration from shadcn-svelte

1. **Import**: Change from `$lib/components/ui/button` to `$lib/sisu/components/button.svelte`
2. **API Compatible**: Same props (variant, size, disabled, etc.)
3. **Simplified**: No need to wrap buttons in `<a>` - use `href` prop directly
4. **Classes**: Pass via `class` prop - they're merged with component styles
