## Exploration: Paper to Tailwind skill functional audit

### Current State

Audited on 2026-09-09 from commit `9f35c7f`. The repository contains one skill,
three root guides plus a README, a CSS template, and four standalone HTML probes.
There is no package manifest, test runner, CI workflow, build command, coverage
command, or lint/typecheck/format configuration. Bounded root discovery found
no manifest-backed subprojects. Strict TDD is therefore disabled in
`openspec/config.yaml`.

Gentle AI 2.7.0 selected the `openspec` artifact store. CodeGraph was initialized
through the required Gentle AI command, then queried through MCP. It returned
no relevant code for this Markdown/HTML workspace; direct file inspection followed.
The skill registry was refreshed. All work ran in the main thread, as requested.

The skill has complete frontmatter, a quoted 156-character description, and all
seven expected sections in order. Its body contains 483 whitespace-separated
words; this is not a token-budget measurement. All inspected references exist
inside this checkout, but five reference edges escape the installable skill folder.

Paper MCP is connected to the existing normalization-test file. Read-only
`get_basic_info` and `get_tokens(format: "tailwind")` returned 18 tokens and
`contentHash.tokens = df953992`. The current export still contains `120%`,
`24px`, `1.2em`, `0.05px`, `1rem`, and `clamp(1rem, 2vw, 2rem)`.
These reads confirm current stored/exported values; they do not repeat the
historical create/write normalization experiments.

### Affected Areas

All source locations below are relative to the repository root.

- `skills/paper-tailwind-tokens/SKILL.md` — workflow, migration, normalization, target path, final hash.
- `skills/paper-tailwind-tokens/references/docs.md` — installation portability.
- `skills/paper-tailwind-tokens/assets/paper-tokens.css` — generated/manual ownership.
- `tailwind-v4-coverage-and-sync.md` — alias deletion, regeneration, hash contract.
- `tailwind-v4-theming-with-paper.md` and `README.md` — contradictory fluid/spacing guidance.
- `paper-mcp-normalization-tests.md` — overclaimed font conclusions and evidence freshness.
- `tests/README.md` and four HTML files — manual evidence, fixture preconditions, reproducibility.

### Findings

#### A01 — P1: rename protocol leaves a dangling alias

`tailwind-v4-coverage-and-sync.md:240–243` creates the new name as an alias of
the old name, migrates usages, and deletes the old token. The new token itself
still references the deleted name. A literal zero-reference check would prevent
completion; checking only application classes permits a broken deletion.

Browser reproduction: `--audit-new: var(--audit-old)` initially renders red;
after removing `--audit-old`, the new value becomes empty and text inherits the
page's ink color. The runtime contract at `SKILL.md:28` lacks a detachment step.

Proposed correction: give the new canonical token the original value/dependency,
optionally alias the old name to the new one, migrate Paper nodes and code
usages, check token-to-token references, then remove the compatibility alias.
Keep ambiguous/dynamic consumers on the compatibility path. Test deletion and
rollback, not only the intermediate state where both names exist.

#### A02 — P1: regeneration can erase manual configuration

`assets/paper-tokens.css:19–41` labels a block as replaceable Paper output, but
it also contains fallback stacks, paired line height, breakpoint reset policy,
and a derived spacing base. `coverage-and-sync.md:187–189` explicitly puts
manual pairings in the export block. A subsequent raw export loses those edits.

Proposed correction: define a generated block and an ordered application-owned
override block; keep fallback stacks, pairs, and policy in the latter. Define
normalization as a repeatable generation step. Test two consecutive exports
and verify owned declarations survive. `SKILL.md:48` should instruct the agent
to copy the template into the consumer's stylesheet, not overwrite the installed
skill's `assets/` file. This is a static ownership defect; no exporter exists
in this repository to exercise as a production function.

#### A03 — P1: the skill is not self-contained when installed alone

`SKILL.md:59` points outside the package to the root normalization guide.
Four guide links in `references/docs.md` also leave the package. These five
edges work only while the surrounding repository structure is preserved.

Proposed correction: package the normative guidance under skill-local
`references/`, keeping a single authoritative copy and root navigation links.
Add an isolated-copy check that resolves every runtime reference without
access to the source checkout.

#### A04 — P1: line-height conversion has undefined branches

`SKILL.md:49,54` requires every leading token to become unitless, while the
current Paper export includes both `24px` and `1.2em`. The only specified
algorithm is percentage division. A pixel value has no unique ratio without
an intended font size or recorded ratio. A percentage alias also requires
dependency-aware handling. The description-based ratio guidance in the root
guide is absent from the runtime steps.

Proposed correction: specify numeric/percentage/em/px/alias/unsupported branches.
Use intended ratio metadata or an explicit paired font size for absolute values;
report unresolved cases rather than guessing. Preserve intentional fixed leading
when that is the documented component contract. Add nested inheritance and
unsupported-input cases. Confirm author intent before choosing the absolute-value policy.

#### A05 — P2: existing pages do not form an automated test suite

The four files have no assertions, failure exit codes, pinned dependencies, or
workspace runner. They all load floating `@tailwindcss/browser@4`; this audit
received 4.3.3. Google Fonts assets also come from the network. The tests README
still says there are two pages. No existing page imports the shipped CSS template.

Proposed correction: preserve the visual probes, add one documented test entry
point, pin the compiler/browser dependencies, and separate offline contract/
browser tests from optional live Paper checks. Assert resource/font readiness
and report skips/failures explicitly. Do not equate a successful navigation
with a passing requirement.

#### A06 — P2: F-01 measures a different parent size than its label

`tests/f01-leading-inheritance.html:14,19` uses `text-md` without defining
`--text-md`. The parent therefore computes to 16px, although the page and
`tests/README.md:37` say 18px. The inherited 19.2px is 16 × 1.2, not 18 × 1.2.

Proposed correction: explicitly choose 16px and update the prose, or define
18px and change the expected inherited leading to 21.6px. Assert the parent
size before asserting the child. The underlying inheritance finding is valid.

#### A07 — P2: equal text widths do not prove absence of synthetic bold

`paper-mcp-normalization-tests.md:263–282` concludes that requested weight 600
is a silent no-op because three text widths match. All three still measure
290.78125px in this audit. However, toggling only `font-synthesis: none` on the
same 600-weight element changes 2,514 pixels in a 292 × 57px screenshot.
The current rendering refutes the no-op conclusion.

Proposed correction: replace the width-only inference with a same-element
raster comparison, record loaded font faces and browser version, and restrict
the finding to the measured environment. C3's assertion that width comparison
is the only reliable font check is also too strong; width alone is not proof
of face identity. A missing-family `document.fonts.check()` returning true is
expected API behavior, not proof that a requested face exists.

#### A08 — P2: runtime steps omit current MCP prerequisites and error checks

`SKILL.md:44` starts at `get_basic_info`, whereas the MCP requires loading
`get_guide({ topic: "paper-mcp-instructions" })` before other Paper calls.
Step 3 creates palette before semantics; the current `create_tokens` contract
and theming guide specify semantic-first presentation, with other types sorted
by value. Distinguish display order from alias dependency validation.

The workflow also omits checking per-token in-band errors and readback before
reporting success. `set_tokens` exists in the current MCP, but the root guide's
`set_tokens({ delete: true })` example is incomplete: entries belong in a
`tokens` array and each requires `name`.

Proposed correction: document prerequisite guide loading, token reuse,
per-entry result inspection, readback, and exact mutation envelopes. Add agent
workflow scenarios; static string checks alone cannot prove correct tool use.

#### A09 — P2: fluid type and spacing advice contradict measured findings

`README.md:55–57` sends `clamp()` to the codebase as unsupported, while the
skill and the normalization guide explicitly permit storing it in Paper.
The theming guide's spacing advice says not to enumerate tokens, but the
normalization guide records 134 Paper-node consumers of enumerated tokens.
That historical count was not remeasured here.

Proposed correction: separate Paper storage needs from browser scale derivation;
qualify spacing deduplication by consumer and check Paper usages before deletion.
Keep px-bound fluid type advice consistent, without claiming that storing a
viewport formula proves artboard-to-browser equivalence at every size.

#### A10 — P2: drift check is a sketch, and the captured hash can be stale

`coverage-and-sync.md:271` invokes undefined `paper-token-hash`; there is no
implementation or CI configuration. `SKILL.md:44` captures the hash before
token creation and step 7 never explicitly refreshes it. Saving that initial
hash after edits records the wrong design revision.

Proposed correction: recapture/check the token hash around the final export,
bind the result to the selected file, and abort/retry on concurrent changes.
Either ship an explicit snapshot comparison interface or label the example
as pseudocode requiring a live-MCP adapter. Test unchanged, changed, stale,
and unavailable-source cases; unavailable live access must not silently pass.

### Requirement and Evidence Matrix

Observed means measured in this audit; historical means read from prior results.
These are exploration findings, not a formal SDD verification report.

| Contract point | Evidence/status | Next acceptance check |
| --- | --- | --- |
| Activation/frontmatter/section order | Structurally valid; general authoring prompt not exercised | Trigger and non-trigger agent scenarios |
| All ten Paper namespaces | Current MCP schema supports ten; not all have live samples | Table-driven mapping for all ten |
| Aliases use `@theme inline` | Observed nested plain stays white; inline becomes black | Persistent nested light/dark control |
| Base artboard has no breakpoint | Policy present, not executed | Smallest artboard excluded from generated list |
| Every breakpoint backed by design | No validation logic or fixture | Reject an unmatched threshold |
| Leading normalization | % inheritance observed; absolute/alias policy incomplete | %/em/px/alias matrix and unresolved input |
| px sizing instead of rem | Historical canvas comparison only | New controlled Paper render comparison |
| Explicit em tracking | 2.13/21.3 and 1/10px observed | Compare multiple font sizes; live numeric coercion |
| Safe rename | Final alias deletion demonstrably broken | Canonical value survives rename and rollback |
| Preserve codebase-owned block | Template conflicts with ownership rule | Export twice; preserve overrides and keyframes |
| Component container variants | Wide/narrow container probe reproduced | Boundary sizes and same viewport, different slot |
| Conditional values in code | Nested theme rule reproduced | Token toggling without component class edits |
| Fluid `clamp()` | Current stored/exported string confirmed | px bounds and canvas/browser viewport semantics |
| Unsupported namespaces in code | Template has shadows/ease/animation | Compile representative utilities; retain after export |
| Bundled leading/tracking | Template shows leading; runtime gate omits tracking action | Both paired modifiers applied and preserved |
| Namespace reset | Default scales coexist in probes | Test explicit reset plus retained dynamic spacing |
| Read context/fonts first | Context call succeeds; guide prerequisite missing | Guide → context → fonts before typography |
| Create palette/semantic tokens | Ordering conflicts with current tool guide | Reuse, ordering, alias resolution, partial errors |
| Tailwind export | Current MCP export succeeds | All ten types plus invalid/duplicate token cases |
| Destination/normalization | Asset path ambiguous; no consumer integration | Install package, copy template, generate consumer CSS |
| Font fallbacks | Historical widths; T4 inference refuted | Loaded-face diagnostics and controlled failure fallback |
| Final hash/output contract | Hash readable; capture timing incomplete | Final snapshot hash and explicit unresolved report |
| Installable references | Five reference edges escape skill directory | Isolated-copy link validation |

### Browser Execution Evidence

Environment: Chrome `152.0.7977.84`, Playwright Core `1.63.0`, Tailwind browser
CDN response `4.3.3`. The four repository HTML files were unchanged. The main
probe made five navigations: all four at their documented sizes, with the
claims page repeated at 1300px and 1100px. It awaited generated CSS and fonts.
No page errors or failed network requests were observed on that completed run.

| Probe | Observed result |
| --- | --- |
| F-01 | Parent 16px; percentage child 19.2px leading; ratio child 48px |
| CTA | Height 501.1875px; headline 70px/63px; body 18px/21.6px; button height 52px |
| Containers | max-width 1200px; query applies at 1400px slot, absent at 800px |
| Spacing | p-4=16px; p-5=20px; p-13=52px; gap-7=28px |
| Viewport 1300 | sm/md/lg/xl active; 2xl inactive |
| Viewport 1100 | sm/md active; lg/xl/2xl inactive |
| Color sweep | All nine declared colors match; alpha serializes as oklab |
| Size sweep | All twelve values match: 10,12,13,16,18,28,30,35,40,50,70,100px |
| Tracking | 0.213em→2.13/21.3px; 0.1em→1/10px; zero→normal |
| Radius | custom 15px; defaults 4/8/16px; full→3.35544e+07px |
| Font control | Missing-family check returns true; equal widths hide raster differences |
| Focused synthetic weight | Same element, synthesis toggle: 2,514 changed pixels |
| Focused alias deletion | Red → inherited ink; new custom property becomes empty |
| Focused nested theme | Plain alias stays white; inline alias resolves black |

The first temporary browser harness exited 1 because its readiness predicate
looked for a comment in CSSOM rules. Comments are not a useful readiness signal.
The predicate was changed to computed flex layout; the completed baseline and
focused runs both exited 0. This was an instrumentation failure, not a failed
repository test or a formal verification attempt. Exit 0 means measurements
were collected; it does not mean every measured claim passed.

Reproduction scratch directory from this session:
`/var/folders/bn/r3pl02zd5bgd4g2lvy22651m0000gn/T/paper-skill-audit-f_tb4gpj`.
It holds `audit.cjs`, `focused.cjs`, `result.json`, `focused.json`, and screenshots.
Commands run from the repository root were `node <scratch>/audit.cjs` and
`node <scratch>/focused.cjs`. Playwright was installed only in this scratch
directory; each run closed its isolated browser. These temporary scripts are
diagnostic instruments, not an installed project test suite.

Baseline fixture SHA-256:

| File | SHA-256 |
| --- | --- |
| f01-leading-inheritance.html | 771b6abfdedc28eaf146e904701f3b621ed2a03b77ed9d8956c47c78f13561f9 |
| roundtrip-final-cta.html | 38603b7a3ee4feaa8421fb0b6e566546d1beaf936005ece357fbe1a71ca644ee |
| token-sweep.html | 7e61c63246cf88facaa6fe2c5a478b595f35330aec6358ecfd0b1332adbe1390 |
| unverified-claims.html | 87f28dd73e0cd38e8abc64aeb5d7e89a23a3f02d8bbfb3ae7ffe4e486ee38b9c |

### Approaches

1. **Correct the skill and add a small contract/browser suite** — recommended.
   Pros: preserves the skill's purpose, covers demonstrated defects, produces
   repeatable checks. Cons: introduces a test toolchain and requires a separate
   live Paper lane. Effort: medium.
2. **Correct prose only.** Pros: smallest change. Cons: no regression signal for
   alias deletion, regeneration, rendering, or future dependency changes. Effort: low.
3. **Build an exporter/CI service.** Pros: operational synchronization. Cons:
   materially broader product and authentication/transport scope than this skill.
   Effort: high; defer until specifically needed.

### Recommendation

Keep the deliverable a portable skill with local references and an executable
regression suite. Plan fixes in this order: migration and ownership; line-height
policy and packaging; faulty fixtures/conclusions; deterministic browser checks;
then bounded live Paper create/read/export scenarios. Use a requirements matrix
to select agent-behavior cases as well as CSS cases. Treat generation success,
browser correctness, and live Paper evidence as separate outcomes.

Start with a Node-based runner plus a pinned browser/compiler for the proposed
automation; choose the exact versions in the design phase. This is a suggested
toolchain, not an existing capability. Keep live Paper operations explicit and
scoped to a disposable test file, with per-entry checks and cleanup evidence.

### Risks

- This audit did not run fresh Paper mutations or remeasure canvas rem resolution.
- The CTA browser baseline was reproduced; no fresh source-artboard comparison was made.
- Passing CSS probes do not demonstrate that an agent follows every skill instruction.
- Pixel baselines need a pinned browser/font environment; historical exact widths are not universal.
- Temporary measurements are not a CI runner. There is no formal SDD verify pass or archive readiness.
- Absolute line-height conversion requires a documented intent policy before implementation.

### Sources Consulted

Repository source and current Paper MCP schemas/readbacks are the primary audit
evidence. The following official references were accessed on 2026-09-09:

- [Tailwind theme variables](https://tailwindcss.com/docs/theme#referencing-other-variables)
  supports inline values for aliases and generated utility semantics.
- [MDN font-synthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-synthesis)
  describes synthesis control for missing faces; equal advance width is not a guarantee of equal raster output.
- [MDN FontFaceSet.check](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/check#nonexistent_fonts)
  documents why nonexistent families may return true.

### Ready for Proposal

Yes for a bounded skill-hardening and regression-test proposal. Optional formal
`sdd-research` was offered; no implementation or publishing is included in this
exploration. Resolve the line-height intent policy in the proposal/design handoff.
