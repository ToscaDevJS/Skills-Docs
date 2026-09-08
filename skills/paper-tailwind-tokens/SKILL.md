---
name: paper-tailwind-tokens
description: "Trigger: Paper MCP, design tokens, Tailwind v4, @theme, token export, design system sync, dark mode. Map Paper tokens to native Tailwind v4 theme variables."
license: Apache-2.0
metadata:
  author: "ToscaDevJS"
  version: "1.0"
---

## Activation Contract

Load when:

- Generating or exporting Paper design tokens for a Tailwind v4 codebase.
- Calling `create_tokens` or `set_tokens` on a Paper file.
- Adding theming (dark mode) or responsive sizing to a Paper-backed design system.
- Auditing an existing Paper token set for Tailwind compatibility.

## Hard Rules

- Name every token with a Tailwind v4 namespace. Paper stores exactly ten types: `--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--spacing-*`, `--radius-*`, `--breakpoint-*`, `--container-*`.
- Declare aliased theme variables inside `@theme inline`. Plain `@theme` resolves at `:root` and breaks nested theme scopes.
- Never create a breakpoint for the smallest artboard. Breakpoints are `min-width`; the base size takes no prefix.
- Declare only breakpoints backed by a designed artboard.
- Convert every `--leading-*` from `%` to unitless **at export time**. Paper normalizes unitless line-height to a percentage and cannot store a ratio; `%` and `px` pass a computed px value down the whole subtree.
- Never rename a token in one step: alias → migrate usages → verify zero hits → delete.
- Keep Paper-synced and codebase-owned `@theme` blocks separate. Regeneration replaces only the synced block.

## Decision Gates

| Need | Action |
|------|--------|
| Component must adapt to its slot | `@container` + `@md:`, never viewport `md:` |
| Value is conditional, computed, or unitless (dark mode, `clamp()`, line-height ratios) | Codebase layer, not Paper |
| Namespace has no Paper type (`shadow`, `ease`, `animate`, `blur`, `aspect`, `perspective`) | Codebase-owned block in `assets/paper-tokens.css` |
| Font size needs bundled leading or tracking | Add `--text-*--line-height` after export |
| Taking ownership of a namespace | Clear it with `--ns-*: initial`; never do this for `--spacing-*` |

## Execution Steps

1. Call `get_basic_info`. Record artboards, existing tokens, and `contentHash.tokens`.
2. Call `get_font_family_info` before any typographic styling.
3. Create palette tokens first, then semantic tokens aliasing them via `var(--token)`.
4. Export with `get_tokens({ format: "tailwind" })`.
5. Land the export in the synced block of `assets/paper-tokens.css`; wire semantics with `@theme inline`.
6. Convert `--leading-*` to unitless, then add fallback font stacks, paired modifiers, and the elevation/motion block.
7. Store `contentHash.tokens` beside the generated CSS for CI drift checks.

## Output Contract

Return: tokens created or changed, the generated `@theme` block, namespaces left codebase-owned, and the recorded `contentHash.tokens`. Flag every breakpoint with no matching artboard, and confirm every `--leading-*` was converted to unitless in the export.

## References

- `references/docs.md` — index of the full guides.
- `assets/paper-tokens.css` — two-block stylesheet template.
