# Paper → Tailwind CSS v4

Getting design tokens from a Paper file into a Tailwind v4 codebase with no
translation layer, and keeping them there.

## The documents

| Document | Read it when |
| -------- | ------------ |
| **This file** | You are wiring it up for the first time |
| [`tailwind-v4-theming-with-paper.md`](./tailwind-v4-theming-with-paper.md) | You are designing the token model — naming, theming, responsive sizing |
| [`tailwind-v4-coverage-and-sync.md`](./tailwind-v4-coverage-and-sync.md) | Something Paper cannot express, or the design and the code have drifted |
| [`skills/paper-tailwind-tokens/`](./skills/paper-tailwind-tokens/SKILL.md) | An agent is doing the work — runtime contract, not prose |
| [`paper-mcp-normalization-tests.md`](./paper-mcp-normalization-tests.md) | A token value came back different from what you wrote |

---

## Integration in seven steps

**1. Name tokens with Tailwind v4 namespaces.**
The token name *is* the utility class. `--color-surface` → `bg-surface`.

**2. Split colors into two layers.**
Palette tokens hold raw values. Semantic tokens alias them with
`var(--other-token)`. Designs reference semantic tokens only.

**3. Export.**

```
get_tokens({ format: "tailwind" })
```

**4. Land the export in its own block.**

```css
/* styles/paper-tokens.css — generated, never edited by hand */
```

**5. Wire theming with `@theme inline`.**
Palette on `:root` and `[data-theme="dark"]`; semantic layer inside
`@theme inline`. Plain `@theme` breaks nested theme scopes.

**6. Add what Paper cannot store.**
Fallback font stacks, `--text-*--line-height` pairs, shadows, easing,
animations — in a second block, clearly marked as codebase-owned.

**7. Record `contentHash.tokens` and check it in CI.**
This is what stops the design file and the codebase from silently diverging.

---

## Two rules worth memorizing

**Paper stores one discrete value per token.** Anything conditional or
computed — dark mode, `clamp()`, media queries — lives in the codebase. That is
not a limitation to fight; it is the seam. Design it deliberately.

**Mobile-first means the smallest size has no prefix.** Breakpoints are
`min-width`. A breakpoint named after your smallest artboard matches every
device.

---

## When something looks wrong

| Symptom | Cause | Where |
| ------- | ----- | ----- |
| Dark mode works page-wide, breaks in a nested panel | Plain `@theme` instead of `@theme inline` | Theming §5 |
| A utility class does nothing | Token renamed; classes not migrated | Coverage §6 |
| Type looks right on desktop, overflows on mobile | Fixed px scale spanning both artboards | Theming §8 |
| `md:hidden` hides on every device | Breakpoint named after the base size | Theming §6 |
| Font is subtly wrong everywhere | No fallback stack, or face never loaded | Coverage §2 |
| Headings collide with their own line height | `%` or `px` leading inherited by children | Coverage §3 |
| A card ignores the space it was given | Viewport variant where a container query belongs | Theming §7 |
| Colors drifted from the design file | No `contentHash` check | Coverage §7 |
| A written token value reads back changed | Paper normalizes on save | Tests F-01, F-04 |
| Type looks smaller on canvas than in browser | `rem` token, non-16px root | Tests F-03 |
