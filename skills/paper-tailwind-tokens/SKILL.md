---
name: paper-tailwind-tokens
description: "Trigger: Paper MCP, design tokens, Tailwind v4, @theme, token export, design system sync, dark mode. Map Paper tokens to native Tailwind v4 theme variables."
license: Apache-2.0
metadata:
  author: "ToscaDevJS"
  version: "1.1"
---

## Activation Contract

Load when:

- Generating or exporting Paper design tokens for a Tailwind v4 codebase.
- Calling `create_tokens` or `set_tokens` on a Paper file.
- Adding theming (dark mode) or responsive sizing to a Paper-backed design system.
- Auditing an existing Paper token set for Tailwind compatibility.

Do not load for unrelated canvas editing, copywriting, or component work that
touches no token.

## Hard Rules

- Call `get_guide({ topic: "paper-mcp-instructions" })` before any other Paper tool in the session.
- Name every token with a Tailwind v4 namespace. Paper stores exactly ten types: `--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--spacing-*`, `--radius-*`, `--breakpoint-*`, `--container-*`.
- Pass an explicit `type` on every `create_tokens` entry. The accepted values are exactly the ten Paper types; omitting `type` rejects the whole call.
- Inspect every per-entry result of a mutation and read the tokens back. A partial failure is reported as a partial failure; never report complete success. A batch with one bad entry still succeeds overall and still advances the hash.
- Match per-entry results **by position**. A failed entry comes back as `{ result: "error", message }` with **no `name` field**, so keying results by name silently drops it.
- `find_nodes` finds canvas consumers, not token-to-token references. A `count: 0` means no node uses the token — never that nothing references it.
- Declare aliased theme variables inside `@theme inline`. Plain `@theme` resolves at `:root` and breaks nested theme scopes.
- Never create a breakpoint for the smallest artboard. Breakpoints are `min-width`; the base size takes no prefix. Declare only breakpoints backed by a designed artboard.
- Convert inherited `--leading-*` to unitless **at export time** using the branch table below. Paper normalizes unitless line-height to a percentage and cannot store a ratio; `%`, `px` and `em` all pass a computed px value down the whole subtree.
- Author size tokens in `px`, never `rem`. Paper does not resolve `rem` against a 16px root, so `rem` renders smaller on the canvas than in the browser.
- Pass `letterSpacing` as an explicit `em` string. A bare number is coerced to px (`0.05` becomes `0.05px`).
- Rename by creating the new canonical value first, aliasing the old name to it, migrating consumers, then removing the alias. Never point the new token at a name you are about to delete.
- Generated output replaces one delimited region of the **consumer's** stylesheet. Never overwrite this skill's `assets/paper-tokens.css`; copy it into the codebase once.
- Capture `contentHash.tokens` again after the last mutation and record that hash, not the one read before the work started.

## Decision Gates

| Need | Action |
|------|--------|
| Component must adapt to its slot | `@container` + `@md:`, never viewport `md:` |
| Value is conditional (dark mode, media-dependent) | Codebase layer, not Paper |
| Fluid type | `clamp()` IS storable as a Paper `fontSize` token — px bounds only. Storing it does not prove canvas/browser parity at every width |
| Namespace has no Paper type (`shadow`, `ease`, `animate`, `blur`, `aspect`, `perspective`) | Application-owned region of the consumer stylesheet |
| Font size needs bundled leading or tracking | Add `--text-*--line-height` and `--text-*--letter-spacing` in the owned region after export |
| Taking ownership of a namespace | Clear it with `--ns-*: initial` in the owned region; never do this for `--spacing-*` |
| Inherited `--leading-*` value cannot be resolved | Report it unresolved. Never invent a ratio |

**Leading conversion branches** (inherited leading only):

| Stored form | Export | Note |
|-------------|--------|------|
| `1.2` | `1.2` | Already a ratio |
| `120%` | `1.2` | Divide by 100 |
| `1.2em` | `1.2` | The multiplier is the ratio |
| `24px` | `1.2` only with a recorded intended ratio or an explicitly paired font size (`24px` on `20px` text) | Otherwise unresolved |
| `var(--other)` | Resolve the alias first; reject cycles | Unresolved on a cycle or missing target |
| Anything else | Unresolved | Report the literal stored value |

Leading applied to the same element that sets its own font size MAY stay
absolute; record that element scope in the token description.

## Execution Steps

1. Call `get_guide({ topic: "paper-mcp-instructions" })`.
2. Call `get_basic_info`. Record artboards, existing tokens, and `contentHash.tokens` as the pre-work reading.
3. Call `get_font_family_info` before any typographic styling, and before tokenizing a weight.
4. Reuse existing tokens. Create palette tokens first, then semantic tokens aliasing them via `var(--token)`; present semantic entries first and sort the rest by value. Display order is presentation — validate alias dependencies separately.
5. Inspect each per-entry mutation result, then read the tokens back and compare against what you sent.
6. Export with `get_tokens({ format: "tailwind" })`.
7. Land the export in the delimited generated region of the consumer stylesheet (copied from `assets/paper-tokens.css`). Convert inherited `--leading-*` per the branch table. Wire semantics with `@theme inline`.
8. In the application-owned regions, add fallback font stacks, paired `--text-*--line-height` / `--text-*--letter-spacing` modifiers, namespace resets, and the elevation/motion block.
9. Read `contentHash.tokens` again from the same file. If it differs from the reading taken immediately before export, re-export or stop; do not record a synchronized result.

## Output Contract

Return: tokens created or changed, per-entry failures, the generated `@theme`
block, its destination file and delimited region, namespaces left
application-owned, unresolved leading values with their stored form, and the
**final** `contentHash.tokens` bound to the file it came from. Flag every
breakpoint with no matching artboard. If the file could not be re-read, report
the evidence as incomplete instead of recording a hash.

## References

- `references/docs.md` — index of the full guides.
- `references/normalization-evidence.md` — measured token normalization behavior.
- `references/coverage-and-sync.md` — migration, ownership, and drift detection.
- `assets/paper-tokens.css` — three-region stylesheet template.
