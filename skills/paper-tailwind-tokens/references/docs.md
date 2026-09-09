# Reference index

The authoritative guides below ship inside this skill. Repository test pages are optional reproductions, not runtime dependencies.

| Topic | File | Sections |
|-------|------|----------|
| Namespace map, two-layer palette/semantic model, `@theme inline` mechanics | [`theming.md`](theming.md) | Part I, §1–5 |
| Mobile-first breakpoints, container queries, fluid type, spacing base | [`theming.md`](theming.md) | Part II, §6–9 |
| Namespaces Paper cannot store, font fallbacks, line-height branches, paired modifiers, safe rename, `contentHash` drift detection | [`coverage-and-sync.md`](coverage-and-sync.md) | §1–7 |
| Integration path and symptom-to-section lookup | [`integration.md`](integration.md) | all |
| Measured normalization behavior of every token type | [`normalization-evidence.md`](normalization-evidence.md) | F-01–F-07, T1–T4, C1–C5 |

## Fast lookups

**Paper type → Tailwind namespace**

`color`→`--color-*` · `fontFamily`→`--font-*` · `fontSize`→`--text-*` ·
`fontWeight`→`--font-weight-*` · `letterSpacing`→`--tracking-*` ·
`lineHeight`→`--leading-*` · `spacing`→`--spacing-*` · `radius`→`--radius-*` ·
`breakpoint`→`--breakpoint-*` · `container`→`--container-*`

**No Paper equivalent** — maintain by hand:

`--shadow-*` · `--inset-shadow-*` · `--drop-shadow-*` · `--text-shadow-*` ·
`--blur-*` · `--ease-*` · `--animate-*` · `--aspect-*` · `--perspective-*`

**Line-height conversion** — six branches, only two are arithmetic:

`1.2`→`1.2` · `120%`→`1.2` (÷100) · `1.2em`→`1.2` · `24px`→ needs a recorded
ratio or paired size, else **unresolved** · `var(--x)`→ resolve first, reject
cycles · anything else → **unresolved**. Full table in
[`coverage-and-sync.md`](coverage-and-sync.md) §3.

**Rename direction** — the new token takes the canonical value; the *old* name
becomes the alias. Never `--new: var(--old)` followed by deleting `--old`.
See [`coverage-and-sync.md`](coverage-and-sync.md) §6.

**Hash timing** — read `contentHash.tokens` again after the last mutation, and
record that one. See [`coverage-and-sync.md`](coverage-and-sync.md) §7.
