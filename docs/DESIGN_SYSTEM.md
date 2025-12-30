# Refinery Design System

## Design Philosophy: "Calm Flow"

Refinery uses the **Calm Flow** design system - a thoughtful, peaceful visual language that supports focused content creation without distraction.

## Typography

### Font Families

**Fraunces Variable** (Display/Headings)

- Serif with character and warmth
- Playful precision that embodies Otto the otter
- Used for H1, H2 (large, distinctive headings)
- Variable font for fine-tuned weight control

**Inter Variable** (Body/UI)

- Exceptional readability, neutral personality
- Glides into the background like water
- Used for H3-H5, labels, body text, UI
- Industry-proven, accessible

**Geist Mono** (Code)

- Clean, modern monospace
- Used for code blocks and technical content

### Typography Utilities

Use these utility classes instead of raw HTML tags:

```svelte
<!-- Large display headings (Fraunces serif) -->
<h1 class="typography-h1">Main Page Title</h1>
<h2 class="typography-h2">Section Title</h2>

<!-- Smaller headings (Inter sans) -->
<h3 class="typography-h3">Subsection</h3>
<h4 class="typography-h4">Card Title</h4>
<h5 class="typography-h5">Small Heading</h5>

<!-- Labels and body -->
<label class="typography-label">Form Label</label>
<p class="typography-body">Body text paragraph</p>

<!-- Code -->
<code class="typography-code">const foo = 'bar'</code>
```

### Font Family Classes

For custom compositions:

```svelte
<div class="font-display">Custom serif text</div>
<div class="font-sans">Custom sans text</div>
<div class="font-mono">Custom mono text</div>
```

### Font Stacks

All fonts extend Tailwind's defaults with our custom fonts prepended:

```css
--font-display: 'Fraunces Variable', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
--font-sans:
	'Inter Variable', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
	'Segoe UI Symbol', 'Noto Color Emoji';
--font-mono:
	'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
	'Courier New', monospace;
```

This ensures graceful fallback if custom fonts fail to load, and includes emoji support.

### Core Principles

1. **Calm and Focused**: Visual design that fades into the background, letting content take center stage
2. **Fluid Interactions**: Smooth, natural transitions that feel effortless
3. **Purposeful Contrast**: Strategic use of color to guide attention without overwhelming
4. **Readable First**: Text clarity and readability are paramount - no dark text on dark backgrounds

### The Otter Philosophy

**Otto the Otter** represents our interaction philosophy:

> Otters are playful yet precise, fluid yet focused. They glide through water effortlessly but are deliberate in their actions. They're social but not overwhelming, gentle but capable.

This philosophy manifests in:

- **Smooth, natural transitions** (like an otter gliding through water)
- **Precise, deliberate interactions** (like an otter catching fish)
- **Calm, focused presence** (like an otter floating peacefully)
- **Playful without distraction** (like an otter's gentle play)

### Color Palette

Built on **OKLCH** color space for perceptual uniformity:

#### Primary (Teal/Sage)

- **Hue**: 180° (cyan/teal range)
- **Purpose**: Focus states, interactive feedback
- **Character**: Calm, natural, trustworthy

#### Secondary (Purple)

- **Hue**: 280° (violet range)
- **Purpose**: Secondary actions, alternative states
- **Character**: Creative, thoughtful, sophisticated

#### Accent (Amber/Warm)

- **Hue**: 70° (yellow-orange range)
- **Purpose**: Hover states, subtle highlights
- **Character**: Warm, inviting, energetic

### Interaction Patterns

#### Focus States

- **3px teal ring** at 50% opacity using box-shadow approach
- Applied via `focus-ring` or `focus-ring-input` utility classes
- Consistent across all interactive elements (buttons, inputs, menus)
- **Focus color (Teal)**: Primary brand color - professional, accessibility-first
- Menu items get additional **2px left border** in teal for keyboard navigation clarity
- Focus states are additive - can combine with hover states

#### Hover States

- **Amber overlay** - warm, inviting exploratory feedback
- **Hover color (Amber)**: Accent color - distinct from focus for clear state separation
- Opacity levels by context:
  - **5% opacity** for surfaces/cards (very subtle)
  - **8% opacity** for menu items (subtle but visible)
  - **15% opacity** for ghost buttons (more visible, no border context)
- Applied via `hover-surface` or `hover-item` utilities
- Text must remain readable (never dark text on dark background)

#### Selected States (Command Palette)

- **Primary (teal) background** at 10% opacity - distinct from hover
- **2px left border** in primary color
- **Medium font weight** for additional distinction
- Visually distinct from both hover and focus states

#### Transitions

- Duration: `var(--duration-micro)` (150ms)
- Easing: `var(--ease-out)` (cubic-bezier for natural deceleration)
- Applied via `transition-calm` utility class
- Properties: color, background, border, shadow, transform

### Utility Classes

```css
/* Focus ring - teal ring using box-shadow (consistent across all elements) */
.focus-ring {
	outline: none;
	&:focus-visible {
		border-color: var(--color-ring);
		box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.5);
	}
}

/* Focus ring for inputs - same as focus-ring for consistency */
.focus-ring-input {
	outline: none;
	&:focus-visible {
		border-color: var(--color-ring);
		box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.5);
	}
}

/* Hover surface - very subtle amber hover for cards (5%) */
.hover-surface {
	transition: all var(--duration-micro) var(--ease-out);
	&:hover {
		background-color: oklch(from var(--color-accent) l c h / 0.05);
	}
}

/* Hover item - subtle amber hover for menu items (8%) */
.hover-item {
	transition: all var(--duration-micro) var(--ease-out);
	&:hover {
		background-color: oklch(from var(--color-accent) l c h / 0.08);
	}
}

/* Legacy aliases for backward compatibility */
.interactive-surface {
	transition: all var(--duration-micro) var(--ease-out);
	&:hover {
		background-color: oklch(from var(--color-accent) l c h / 0.05);
	}
}

.interactive-item {
	transition: all var(--duration-micro) var(--ease-out);
	&:hover {
		background-color: oklch(from var(--color-accent) l c h / 0.08);
	}
}

/* Calm transitions - smooth, natural motion */
.transition-calm {
	transition-property:
		color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow,
		transform;
	transition-timing-function: var(--ease-out);
	transition-duration: var(--duration-micro);
}
```

### Component-Specific Patterns

#### Buttons

- **Primary**: Teal background, darkens 10% on hover
- **Secondary**: Gray background, lightens 20% on hover
- **Outline**: 15% amber on hover (subtle warmth)
- **Ghost**: 15% amber background on hover (consistent with outline)
- **All variants**: Include teal focus ring, scale 98% on active
- Dark mode uses consistent /15 opacity for ghost variant

#### Form Inputs

- Consistent border and focus states across all inputs
- **Focus**: Teal ring (3px box-shadow) + border color change
- **Hover**: Very subtle amber (5%) on select triggers
- No special overrides for title vs regular inputs

#### Cards & Surfaces

- Use `hover-surface` for clickable cards
- 5% amber hover - very subtle, keeps text fully readable
- Teal focus ring on keyboard navigation

#### Menus (Dropdown, Select, Command)

- **Hover/Highlighted**: 8% amber background - subtle exploratory feedback
- **Focus (keyboard)**: Same as hover + 2px left teal border for clarity
- **Selected (Command)**: 10% teal background + 2px left teal border + medium font weight
- Data attribute states: `data-[highlighted]`, `aria-selected`
- Hover and keyboard focus share same visual (acceptable for menus)
- Selected state is visually distinct from hover/focus (prevents confusion)

### Design System Consistency

**Key Rule**: Use utility classes and design tokens consistently. Never mix approaches:

- ✅ `hover-surface focus-ring` or `hover-item focus-ring`
- ✅ `data-[highlighted]:bg-accent/8`
- ✅ `aria-selected:bg-primary/10` (distinct from hover)
- ❌ `hover:bg-accent` (too strong, use appropriate opacity)
- ❌ `data-highlighted` without brackets (incorrect syntax)
- ❌ Direct inline opacity values without semantic meaning

**Color Separation Philosophy**:
- **Teal (Primary)** = Focus, accessibility, "you are here" - serious and functional
- **Amber (Accent)** = Hover, exploration, "come check this out" - warm and inviting
- This separation ensures focus and hover states are visually distinct and serve different purposes

**Readability Check**: If hover/focus makes text harder to read, the opacity is wrong. Text readability trumps visual effect every time.

**Accessibility**: All focus indicators meet WCAG 2.2 Success Criterion 2.4.11 (Focus Appearance) with 3:1 contrast ratio.

### Implementation Notes

- Built on **Tailwind CSS v4** (uses `@utility` not `@layer utilities`)
- Uses **OKLCH** for transparent overlays: `oklch(from var(--color-accent) l c h / 0.15)`
- Design tokens via CSS custom properties in `src/app.css`
- Component library: **shadcn-svelte** with Calm Flow customizations
- **Radix UI** primitives for accessible interactions

---

_Remember: Like Otto the otter, our design should be fluid, focused, and effortlessly calm. Every interaction should feel natural, never forced or overwhelming._
