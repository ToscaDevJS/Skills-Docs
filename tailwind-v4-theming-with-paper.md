# Design Tokens: Paper → Tailwind CSS v4

How to author design tokens in Paper so they drop into a Tailwind v4 codebase
with zero translation layer — covering light/dark theming and responsive sizing.

---

## TL;DR

1. Name tokens using Tailwind v4 theme namespaces. The token name *is* the
   utility class.
2. Split tokens into two layers: **palette** (raw values) and **semantic**
   (roles that alias the palette).
3. Export from Paper with `get_tokens({ format: "tailwind" })`.
4. In the codebase, put the palette on `:root` / `[data-theme="dark"]` and wire
   the semantic layer with **`@theme inline`**.

**Responsive**

5. Breakpoints are mobile-first `min-width`. The smallest artboard is the base
   and takes **no prefix**.
6. Declare only breakpoints you actually designed an artboard for.
7. Viewport breakpoints (`md:`) for page layout; container queries (`@md:`) for
   components.
8. Define `--spacing` once; every step is derived.

---

# Part I — Design tokens and theming

## 1. Token naming is the API

Tailwind v4 generates utilities directly from CSS variable names declared inside
`@theme`. There is no config file and no mapping step — the namespace determines
which utilities exist.

Paper's MCP guide requires this exact format. Cover **every** namespace, even
the ones you don't think you need yet:

| Namespace         | Purpose                     | Example token        | Generated utility |
| ----------------- | --------------------------- | -------------------- | ----------------- |
| `--color-*`       | Text, background, border    | `--color-surface`    | `bg-surface`      |
| `--font-*`        | Font families               | `--font-display`     | `font-display`    |
| `--text-*`        | Font sizes (px)             | `--text-lg`          | `text-lg`         |
| `--font-weight-*` | Font weights (number)       | `--font-weight-bold` | `font-bold`       |
| `--tracking-*`    | Letter spacing (prefer `em`)| `--tracking-wide`    | `tracking-wide`   |
| `--leading-*`     | Line height (prefer `px`/%) | `--leading-tight`    | `leading-tight`   |
| `--radius-*`      | Corner radius               | `--radius-button`    | `rounded-button`  |
| `--spacing-*`     | Spacing scale               | `--spacing-4`        | `p-4`, `gap-4`    |
| `--breakpoint-*`  | Responsive breakpoints      | `--breakpoint-md`    | `md:`             |
| `--container-*`   | Container widths            | `--container-canvas` | `max-w-canvas`    |

**Declaration order matters** in Paper: semantic colors before palette colors,
neutrals first, then primary, secondary, accent. Every other token type is
ordered by value, smallest first.

---

## 2. Two layers: palette + semantic

A single flat layer works right up until you need a second theme.

```css
/* Single layer — the problem */
--color-ground: #F5E9DB;
```

`ground` does not describe a role. It describes *cream*. Cream has no dark
variant, so there is nothing to swap.

Split it:

```
Palette layer (what the color is)      Semantic layer (what it's for)
--color-ground: #F5E9DB          ←──   --color-surface
--color-ink:    #24130A          ←──   --color-content
--color-rust:   #B45844          ←──   --color-accent
```

Designs and components reference **only** the semantic layer. The palette layer
becomes an implementation detail that a theme is free to reassign.

---

## 3. Paper side

Create the semantic tokens as aliases. Paper's `create_tokens` accepts
`var(--other-token)` as a value:

```json
{
  "tokens": [
    {
      "type": "color",
      "name": "--color-surface",
      "value": "var(--color-ground)",
      "description": "Page background"
    },
    {
      "type": "color",
      "name": "--color-content",
      "value": "var(--color-ink)",
      "description": "Primary body text"
    },
    {
      "type": "color",
      "name": "--color-accent",
      "value": "var(--color-rust)",
      "description": "Primary CTA and links"
    }
  ]
}
```

On the canvas, use `var(--color-surface)` — never `var(--color-ground)`.

Export the result:

```
get_tokens({ format: "tailwind" })
```

This returns a ready-to-paste `@theme { ... }` block. Note that Paper stores one
value per token, so the export represents a **single** theme. Wiring the second
theme is a codebase concern.

---

## 4. Codebase side

```css
/* app.css */
@import "tailwindcss";

/* --- Layer 1: raw palette, swapped per theme --- */
:root {
  --ground: #F5E9DB;
  --ink:    #24130A;
  --rust:   #B45844;
}

[data-theme="dark"] {
  --ground: #19191A;
  --ink:    #F5E9DB;
  --rust:   #D59F93;
}

/* --- Layer 2: semantic roles exposed to Tailwind --- */
@theme inline {
  --color-surface: var(--ground);
  --color-content: var(--ink);
  --color-accent:  var(--rust);
}
```

Markup stays theme-agnostic:

```html
<section class="bg-surface text-content">
  <h1 class="font-display text-4xl">Radiant Thread</h1>
  <button class="bg-accent rounded-button px-6 py-3">Get started</button>
</section>
```

No `dark:` variants. No conditional classes. Flipping `data-theme` on `<html>`
re-themes the whole tree.

To toggle with a class instead of a data attribute, register the variant:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

---

## 5. Why `@theme inline` and not plain `@theme`

This is the detail that silently breaks nested theming.

**Without `inline`**, Tailwind emits a reference to the theme variable:

```css
:root       { --color-surface: var(--ground); }
.bg-surface { background-color: var(--color-surface); }
```

CSS custom properties resolve at computed-value time in the scope where they are
declared. `--color-surface` resolves to `#F5E9DB` **on `:root`**, and that
already-resolved value inherits down the tree. A `[data-theme="dark"]` on a
*nested* container reassigns `--ground` too late — nothing recomputes
`--color-surface`.

**With `inline`**, Tailwind inlines the value:

```css
.bg-surface { background-color: var(--ground); }
```

Now `--ground` resolves at the element that uses the utility, so the nearest
theme scope wins.

> Symptom to recognize: dark mode works at page level but a nested widget or
> preview pane stays light. The fix is `@theme inline`.

`@theme` is not conditional and cannot be nested inside a selector or media
query. It declares vocabulary; themes live in `:root` and its overrides.

---

# Part II — Responsive sizing

## 6. Breakpoints are mobile-first min-widths

Every Tailwind breakpoint compiles to a `min-width` media query:

```css
md:   →  @media (width >= 48rem)
lg:   →  @media (width >= 64rem)
```

Three consequences that are easy to get wrong.

**The smallest size gets no prefix.** It is the base. Never create a breakpoint
named after the smallest artboard:

```css
/* WRONG */
--breakpoint-mobile: 320px;   /* → @media (width >= 320px) — always true */
```

`mobile:hidden` would read as "hide on phones" and behave as "hide everywhere".

**Custom breakpoints do not replace the defaults.** Adding `--breakpoint-desktop`
leaves `sm` `md` `lg` `xl` `2xl` in place, producing a mixed set nobody can reason
about. Either adopt the default scale, or clear the namespace and own all of it:

```css
@theme {
  --breakpoint-*: initial;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1200px;
}
```

**Declare only breakpoints you have designed.** A breakpoint with no artboard
behind it is an implementation guess. Artboards at 320 and 1200 with nothing in
between leave 880px of undesigned range.

To target a single range, stack a `max-*` variant:

```html
<div class="md:max-lg:flex"><!-- md only, not lg and up --></div>
```

---

## 7. Breakpoints for layout, container queries for components

Container queries are part of core in Tailwind v4 — no plugin. This is the
distinction that makes a design system portable:

- **Viewport breakpoints (`md:`)** — page-level layout. Where the columns are.
- **Container queries (`@md:`)** — components. How a component adapts to the
  space it was given.

```html
<!-- Page layout responds to the viewport -->
<main class="grid grid-cols-1 lg:grid-cols-[1fr_320px]">

  <!-- Component responds to its own slot -->
  <article class="@container">
    <div class="flex flex-col @md:flex-row @md:gap-6">
      <!-- ... -->
    </div>
  </article>

</main>
```

The same card can sit in a 320px sidebar or an 800px main column. With `md:` it
has no idea how much room it actually has; with `@md:` it does. A design system
component must be relocatable.

Ranges stack the same way as breakpoints:

```html
<div class="@container">
  <div class="@min-md:@max-xl:hidden"><!-- ... --></div>
</div>
```

### `--container-*` has two jobs

```css
--container-canvas: 1200px;
```

generates **both** `max-w-canvas` (a width utility) **and** `@canvas:` (a
container-query variant). Name these tokens by role — `prose`, `canvas`, `panel`
— not by device, or they collide conceptually with the breakpoint set.

---

## 8. Type and spacing across sizes

A single fixed px type scale cannot serve a 320px and a 1200px layout. A 100px
display size does not fit inside a 320px frame. Two valid approaches:

**A — Responsive steps.** Explicit, every jump is a decision:

```html
<h1 class="text-3xl md:text-5xl lg:text-6xl">
```

**B — Fluid with `clamp()`.** One token, scales continuously:

```css
@theme {
  --text-display: clamp(2.5rem, 6vw + 1rem, 6.25rem);
}
```

Same split as theming: **Paper stores discrete px values per artboard; fluid
formulas live in the codebase.** Paper's token API takes px strings for sizes, so
`clamp()` belongs on the Tailwind side, exactly like the dark-mode palette swap.

### Spacing is dynamic in v4

Do not enumerate a spacing scale. Define the base unit and every step is derived:

```css
@theme {
  --spacing: 4px;
}
```

`p-1`, `p-5`, `p-13`, `gap-97` all resolve via `calc()`. Enumerating
`--spacing-1 … --spacing-8` invites gaps in the ramp (missing `20`, missing `40`)
that show up as inconsistent rhythm in the design.

---

## 9. Worked example

A two-breakpoint system backed by three artboards — 320 (base), 768, 1200:

```css
@theme {
  /* Breakpoints — one per designed artboard, base is unprefixed */
  --breakpoint-*: initial;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1200px;

  /* Containers — named by role, not by device */
  --container-prose:  680px;
  --container-canvas: 1200px;

  /* Spacing — single base, steps derived */
  --spacing: 4px;
}
```

```html
<body class="px-4 md:px-8">
  <main class="mx-auto max-w-canvas">
    <p class="max-w-prose">...</p>
  </main>
</body>
```

---

# Checklist

- [ ] Every token name uses a Tailwind v4 namespace.
- [ ] All namespaces covered, including ones not yet used.
- [ ] Palette tokens hold raw values; semantic tokens hold `var()` aliases.
- [ ] Designs and components reference semantic tokens only.
- [ ] Palette declared on `:root` and each theme scope.
- [ ] Semantic layer declared inside `@theme inline`.
- [ ] Verified in a *nested* themed container, not just at page level.
- [ ] No breakpoint named after the smallest artboard.
- [ ] Breakpoint namespace either fully default or fully reset with `initial`.
- [ ] Every declared breakpoint has an artboard behind it.
- [ ] Components that can be relocated use `@container`, not viewport variants.
- [ ] `--container-*` tokens named by role, not by device.
- [ ] Spacing declared as a single `--spacing` base.

### Anti-patterns

| Anti-pattern                              | Why it fails                                      |
| ----------------------------------------- | ------------------------------------------------- |
| Hex values hardcoded in components        | Untheme-able; drifts from the design file          |
| Components referencing palette tokens     | Couples markup to a specific color, not a role     |
| Plain `@theme` for aliased variables      | Resolves at `:root`; nested theme scopes break     |
| `dark:` variants on every element         | Duplicates the palette across the entire codebase  |
| Trying to nest `@theme` in a selector     | Not supported — `@theme` is unconditional          |
| `--breakpoint-mobile` on the base size    | Min-width — matches every device, never just phones|
| Custom breakpoints beside the defaults    | Mixed set; nobody knows which scale to reach for   |
| Breakpoints with no matching artboard     | The undesigned range gets improvised in code       |
| Viewport variants inside a reusable card  | Card reacts to the window, not to its actual slot  |
| Enumerating `--spacing-1 … --spacing-8`   | Leaves gaps in the ramp; v4 derives steps already  |

---

# References

- Paper MCP guide: `get_guide({ topic: "paper-mcp-instructions" })` — design
  token format requirements.
- Tailwind CSS v4 — [Theme variables](https://tailwindcss.com/docs/theme),
  section "Referencing other variables".
- Tailwind CSS v4 — [Colors](https://tailwindcss.com/docs/colors),
  section "Referencing other variables".
- Tailwind CSS v4 — [Responsive design](https://tailwindcss.com/docs/responsive-design),
  sections "Customizing breakpoints", "Container queries", "Removing default
  breakpoints".
