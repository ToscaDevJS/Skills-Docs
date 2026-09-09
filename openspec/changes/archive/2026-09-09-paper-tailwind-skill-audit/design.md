# Design: Portable Skill and Reproducible Validation

## Technical Approach

Implement C1–C8 as instructions/examples and V1–V6 as package/browser checks
and agent/live protocols. Preserve the skill architecture.

## Architecture Decisions

| Choice | Alternative | Rationale |
| --- | --- | --- |
| Move normative guides into skill-local references; leave root navigation stubs | Duplicate guides | One source of truth survives isolated installation |
| Node built-in test runner; pinned Playwright Chromium and Tailwind browser package | Floating CDN/manual Chrome | Existing HTML remains useful with repeatable assertions |
| Serve dependencies/fonts locally and reject external browser requests | Depend on Google Fonts at test time | Missing resources become failures rather than silent fallback |
| Document conversion branches and test worked examples | Build a production converter | Preserve the proposed skill scope |
| Keep F-01 explicitly 16px | Change parent to 18px | Preserves the observed 19.2px/48px comparison |

Use Node 24, matching this workspace. Pin Playwright to 1.63.0 and Tailwind
browser/CLI to 4.3.3, the versions observed during exploration; validate availability
before installation. Use the matching downloaded Chromium, not system Chrome.
Pin font packages for Caprasimo, Syne, and Meow Script and retain their licenses.
Record exact resolved versions in the lockfile and test output. Installation may
download dependencies; test execution blocks external requests.

## Data Flow

`Paper readback → documented normalization → generated CSS region → consumer overrides`

`isolated skill copy → reference/metadata checks`

`local fixtures + shipped template + pinned assets → browser assertions → evidence`

The separate Paper protocol cannot establish unobserved agent execution.

## Interfaces / Contracts

- Generated-region delimiters identify exactly one replaceable section in
  `assets/paper-tokens.css`. Copy the asset into consumer code before use.
- Place semantic `@theme inline` bindings, font fallback stacks, leading/tracking
  pairs, namespace resets, derived spacing, and motion in later owned regions.
  Keep raw palette tokens namespaced throughout; override palette values in nested
  theme scopes so semantic utilities resolve at the consumer.
- For inherited leading: ratios remain ratios; percent divides by 100; em uses
  its multiplier. Px requires a recorded intended ratio or explicit paired size.
  Cycles, missing dependencies, and unknown expressions remain unresolved.
  Intentional fixed leading is preserved only with documented element scope.
- Rename by creating the new canonical value first, aliasing old→new during
  migration, then checking Paper nodes, code usages, and token dependencies before
  removing the compatibility alias. Record restoration data.
- Capture a final pre-export hash and post-export hash from the same file after
  verified mutations. Compare them; report mismatches/unavailable access.
- Final output names changed tokens, generated destination, owned namespaces,
  final hash, failures, and unresolved intent. CI hash snippets remain explicitly
  illustrative until a consumer supplies its live adapter.

## File Changes

| Paths | Action |
| --- | --- |
| `skills/paper-tailwind-tokens/SKILL.md` | Correct compact workflow and local references |
| `skills/paper-tailwind-tokens/references/*.md` | Relocate guides; add workflow/unit-policy guidance |
| Root guides, `README.md`, `AGENTS.md` | Preserve navigation and update evidence pointers |
| `skills/paper-tailwind-tokens/assets/paper-tokens.css` | Separate replacement and override regions |
| `package.json`, `package-lock.json`, `.gitignore` | Pin test tools; ignore generated reports/builds |
| `tests/contract.test.mjs`, `tests/browser.test.mjs`, `tests/support/` | Isolated reference and rendering checks |
| `tests/*.html`, `tests/README.md` | Repair preconditions and document commands |
| `tests/workflow-cases.md`, `tests/live-paper.md` | Agent rubrics and bounded live protocol |

## Testing Strategy

| Command/lane | Evidence |
| --- | --- |
| `npm run test:contract` | Isolated links, metadata, negative missing/escaping references |
| `npm run test:browser` | Shipped template, two replacements, alias removal, unit matrix, nested themes, responsive edges, sweeps, same-element font pixels |
| `npm test` | Both local layers; nonzero on either failure |
| `npm run build` | Compile shipped template to ignored build output |
| Agent/live protocols | Inputs, expected actions, actual observations, pass/fail/not-run |

Use file APIs, loopback serving, and Playwright without shell interpolation.
Close browser/server resources in finally blocks. Fail on missing browser/fonts.
Compare the same element without asserting historical pixel counts.

## Threat Matrix

| Boundary | Applicability |
| --- | --- |
| Documentation-like executable paths | N/A: no executable classifier |
| Git repository selection | N/A: tests invoke no Git operations |
| Commit state | N/A: no commit automation |
| Push state | N/A: no push automation |
| PR commands | N/A: no PR execution |

Browser process cleanup and missing-resource failure are covered by V1.2;
arbitrary shell commands are not accepted by the harness.

## Migration / Rollout

Use independently reversible work units: packaging, runtime rules, CSS ownership,
browser regressions, and evidence protocols. Update the registry after metadata
changes. Retain historical findings as dated evidence and append corrections.

## Open Questions

None blocking technical design. Delivery slicing is decided in tasks before apply.
