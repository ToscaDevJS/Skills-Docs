# Tasks: Paper–Tailwind Skill Hardening

## Review Workload Forecast

| Field | Value |
| --- | --- |
| Estimated authored additions + deletions | 1,100–1,600; document moves and lockfile reported separately |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | U1 packaging → U2 rules → U3 template → U4 browser regressions → U5 evidence |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

This is one preliminary slicing pass. Measure each implemented slice; report
any cohesive unit still exceeding 400 lines without compressing code to fit.
No PR creation or publication is authorized by this planning artifact.

### Suggested Work Units

| Unit / likely PR | Focused command | Runtime harness | Rollback boundary |
| --- | --- | --- | --- |
| U1 / PR1 packaging | `npm run test:contract` | Isolated installation and broken-link controls | Reference relocation and package checks |
| U2 / PR2 rules | `npm run test:contract` | N/A: instructions; evaluate workflow cases separately | Runtime contract and policy references |
| U3 / PR3 template | `npm run test:browser -- --test-name-pattern=ownership` | Two exports, aliases, nested theme | Template and focused browser support |
| U4 / PR4 regressions | `npm run test:browser` | Four fixtures, font pixels, boundary controls | Fixture corrections and regression assertions |
| U5 / PR5 evidence | `npm test` and `npm run build` | Agent rubrics; separate live Paper protocol | Evidence documents and runner integration |

## Phase 1: Portable package

- [x] 1.1 Add `package.json` and `tests/contract.test.mjs` with isolated-copy, missing-reference, and escaping-reference controls (C1, V2).
- [x] 1.2 Relocate authoritative guides into `skills/paper-tailwind-tokens/references/`; update root navigation, `README.md`, and `AGENTS.md`.

## Phase 2: Runtime contract

- [x] 2.1 Correct `skills/paper-tailwind-tokens/SKILL.md` and local workflow guidance for prerequisites, errors, ten mappings, ordering, fonts, and responsive rules (C2–C3, C7).
- [x] 2.2 Specify conversion branches, independent canonical migration, rollback, and final hash capture in local references; reconcile historical conclusions (C4–C5, C8).

## Phase 3: Consumer template and harness

- [x] 3.1 Pin browser/compiler/font dependencies in `package.json` and `package-lock.json`; add local serving and cleanup in `tests/support/` (V1).
- [x] 3.2 Add missing-resource failure controls and ownership/migration assertions in `tests/browser.test.mjs` (V1.2, V3).
- [x] 3.3 Separate generated/owned regions in `skills/paper-tailwind-tokens/assets/paper-tokens.css`; test consecutive replacements and compile output (C6).

## Phase 4: Browser regressions

- [x] 4.1 Correct F-01 labels/classes in `tests/f01-leading-inheritance.html`; retain explicit 16px evidence.
- [x] 4.2 Add leading-unit, paired-typography, container/viewport-edge, spacing/reset, color/size/radius, and CTA assertions to `tests/browser.test.mjs`.
- [x] 4.3 Add same-element synthesis and missing-family controls; correct font conclusions in local evidence references (V4).

## Phase 5: Evidence and integration

- [x] 5.1 Add `tests/workflow-cases.md` and `tests/live-paper.md` with inputs, rubrics, provenance, and honest not-run outcomes (V5–V6).
- [x] 5.2 Map every requirement to its test/scenario in `tests/README.md`; document install, local commands, and live limitations.
- [x] 5.3 Execute local tests/build, update `openspec/config.yaml` with observed capabilities, and refresh the skill registry.

## Measured Slices — recorded 2026-09-09 after apply

Authored lines only. `package-lock.json` (1,245) and the Phase 1 document moves
are reported separately, as the forecast required.

| Unit | Authored additions + deletions | Focused command | Result |
| --- | --- | --- | --- |
| U1 packaging | ~130 (`package.json` 24, `tests/contract.test.mjs` 92, root/AGENTS pointers ~14) | `npm run test:contract` | 5 assertions pass |
| U2 rules | ~320 (`SKILL.md` +70/-24, four reference corrections) | `npm run test:contract` | pass; agent cases stay not-run by design |
| U3 template | ~380 (`paper-tokens.css` +85/-33, `tests/support/` 298) | `npm run test:browser -- --test-name-pattern=ownership` | pass |
| U4 regressions | **~480** (`tests/browser.test.mjs` 449, four fixtures ~31) | `npm run test:browser` | 16 assertions pass |
| U5 evidence | ~490 (`workflow-cases.md` 166, `live-paper.md` 112, `tests/README.md` +200, `openspec/config.yaml`) | `npm test` and `npm run build` | 21 pass; build emits 905 lines |

**Two units exceed the 400-line budget and are reported, not compressed.**

- **U4 (~480).** One cohesive test file. Splitting it by lens (leading vs fonts
  vs responsive) would fragment the shared harness import and the requirement
  matrix that `tests/README.md` maps against. Reviewable as one unit because
  every test is independent and named after the requirement it covers.
- **U5 (~490).** Three documents, no code. Each is independently reviewable and
  the unit can be split at file boundaries if a reviewer prefers it.

No code was compressed to fit the budget.

## Verification Record — 2026-09-09

| Command | Observed result |
| --- | --- |
| `npm test` | 21 pass, 0 fail, exit 0 (~5.4s) |
| `npm run test:contract` | 5 pass, 0 fail |
| `npm run test:browser` | 16 pass, 0 fail |
| `npm run build` | `tailwindcss v4.3.3`, exit 0, `build/paper-tokens.build.css` 905 lines |
| `gentle-ai skill-registry refresh --force` | 15 skills indexed |

Environment: Node 24.14.0, Playwright 1.63.0, Chromium (playwright build 1243),
Tailwind 4.3.3, macOS arm64. External requests blocked during the browser lane.

Lanes deliberately not executed: `tests/workflow-cases.md` (8 agent cases,
all `not-run`) and `tests/live-paper.md` (live Paper protocol, `not-run` —
only read-only reads were made during exploration).
