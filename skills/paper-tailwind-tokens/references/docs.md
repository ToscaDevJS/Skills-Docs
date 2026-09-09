# Reference index

The authoritative guides below ship inside this skill. Repository test pages are optional reproductions, not runtime dependencies.

| Topic | File | Sections |
|-------|------|----------|
| Namespace map, two-layer palette/semantic model, `@theme inline` mechanics | [`tailwind-v4-theming-with-paper.md`](theming.md) | Part I, §1–5 |
| Mobile-first breakpoints, container queries, fluid type, spacing base | [`tailwind-v4-theming-with-paper.md`](theming.md) | Part II, §6–9 |
| Namespaces Paper cannot store, font fallbacks, line-height inheritance, paired modifiers, rename protocol, `contentHash` drift detection | [`tailwind-v4-coverage-and-sync.md`](coverage-and-sync.md) | §1–7 |
| Integration path and symptom-to-section lookup | [`README.md`](integration.md) | all |
| Measured normalization behavior of every token type | [`paper-mcp-normalization-tests.md`](normalization-evidence.md) | F-01–F-07 |

## Fast lookups

**Paper type → Tailwind namespace**

`color`→`--color-*` · `fontFamily`→`--font-*` · `fontSize`→`--text-*` ·
`fontWeight`→`--font-weight-*` · `letterSpacing`→`--tracking-*` ·
`lineHeight`→`--leading-*` · `spacing`→`--spacing-*` · `radius`→`--radius-*` ·
`breakpoint`→`--breakpoint-*` · `container`→`--container-*`

**No Paper equivalent** — maintain by hand:

`--shadow-*` · `--inset-shadow-*` · `--drop-shadow-*` · `--text-shadow-*` ·
`--blur-*` · `--ease-*` · `--animate-*` · `--aspect-*` · `--perspective-*`

**Line-height conversion** — divide by 100:

`90%`→`0.9` · `100%`→`1` · `120%`→`1.2` · `180%`→`1.8`
