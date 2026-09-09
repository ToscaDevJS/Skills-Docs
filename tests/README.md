# Tests

Three lanes, three kinds of evidence. Keeping them apart is the point: a green
`npm test` says the CSS behaves and the package is portable. It says nothing
about whether an agent follows the skill, and nothing about live Paper.

| Lane | Command | What it can prove |
| --- | --- | --- |
| Contract | `npm run test:contract` | The installed skill is self-contained and its metadata is intact |
| Browser | `npm run test:browser` | What the generated CSS actually does in a pinned Chromium |
| Agent | [`workflow-cases.md`](workflow-cases.md) | Tool ordering, error handling, refusing to guess — judged from a transcript |
| Live Paper | [`live-paper.md`](live-paper.md) | Normalization, migration and hash behavior in the real MCP |

Neither of the last two is automated. The **agent lane is not-run** — written
down so its absence stays visible instead of implied. The **live Paper lane was
executed on 2026-09-09 and passed**, and one of its results corrected a claim
this repository had inferred rather than measured; see its status table.

## Install and run

```bash
npm install                      # pinned compiler, browser runner, font faces
npx playwright install chromium  # the pinned Chromium, not system Chrome
npm test                         # both local lanes; nonzero exit on any failure
npm run build                    # compile the shipped template to build/
npm run probes                   # serve the visual fixtures for a human
```

`npm install` also runs `prepare`, which points `core.hooksPath` at
[`.githooks/`](../.githooks). That installs a **pre-commit gate**: it runs
`npm test` and refuses the commit on a nonzero exit. Both paths are verified —
a wrong expectation exits 1, the restored suite exits 0.

The gate is a speed bump, not a wall. `git commit --no-verify` bypasses it, and
nothing runs it in CI, because this repository has no CI. Treat it as the thing
that catches an honest mistake, not as proof that every commit was tested.

Node 24. Every dependency is pinned to an exact version in `package.json`;
`package-lock.json` records what actually resolved, and the browser lane prints
the resolved toolchain as test diagnostics on every run.

The three test faces — Caprasimo, Syne and Meow Script — come from `@fontsource`
and are licensed under the **SIL Open Font License 1.1**. The license text ships
with each package (`node_modules/@fontsource/<family>/LICENSE`) and is retained
by the pinned install; no font file is vendored into this repository.

**The browser lane runs offline.** `tests/support/server.mjs` serves the pinned
Tailwind build and the pinned font faces from `node_modules` over loopback, and
`tests/support/browser.mjs` aborts every request that is not the fixture server.
A fixture that reaches for a CDN fails; it does not quietly render with
something else. Two controls prove the harness fails loudly: one page requests a
CDN and is blocked, another requests a missing local file and times out.

## Requirement coverage

Every requirement in `openspec/changes/paper-tailwind-skill-audit/specs/` maps
to a check here. `not-run` is a legitimate value; an unmapped requirement is not.

### Skill contract

| Requirement | Where | Status |
| --- | --- | --- |
| C1.1 Isolated installation | contract · *isolated skill resolves all runtime references* | automated |
| C1.1 Metadata and section order | contract · *discovery metadata and runtime sections remain complete* | automated |
| C1.2 Relevant requests | [W1](workflow-cases.md#w1--activation-boundary--c12) | not-run |
| C2.1 Preparation order | [W2](workflow-cases.md#w2--prerequisite-ordering--c21) | not-run |
| C2.2 Partial failure | [W3](workflow-cases.md#w3--partial-batch-failure--c22) | not-run |
| C3.1 Designed thresholds | [W8](workflow-cases.md#w8--breakpoint-policy--c31) | not-run |
| C3.2 Consumer boundaries | browser · *viewport breakpoints … container queries*; *spacing: the derived scale* | automated |
| C3 All ten namespaces render | browser · sweeps, leading matrix, boundaries, *font weight: the tokens resolve* | automated — 10 of 10 |
| C4.1 Convertible values | browser · *leading unit matrix* | automated |
| C4.2 Unknown intent | browser · *leading unit matrix* (dangling alias) + [W4](workflow-cases.md#w4--alias-cycle-and-unresolved-leading--c42) | partial · agent case not-run |
| C5.1 Completed rename | browser · *rename: the naive protocol breaks* | automated |
| C5.2 Uncertain consumers / rollback | [W6](workflow-cases.md#w6--rename-direction--c51) + [L3](live-paper.md) | **rollback drill passed 2026-09-09**; agent case not-run |
| C6.1 Consecutive exports | browser · *two consecutive regenerations*; *shipped template compiles* | automated |
| C6.1 Installed asset untouched | browser · *two consecutive regenerations* (byte compare) | automated |
| C7.1 Nested rendering | browser · *@theme inline resolves nested overrides*; *paired modifiers*; *missing family* | automated |
| C7 Fluid storage ≠ viewport fidelity | [L1](live-paper.md) fluid entry | **passed 2026-09-09** — `clamp(40px, 6vw, 100px)` stored verbatim |

| C8.1 Stable export | [W5](workflow-cases.md#w5--stale-hash--c81--c82) + [L5](live-paper.md#l5--final-hash) | not-run |
| C8.2 Unavailable or changing source | [W5](workflow-cases.md#w5--stale-hash--c81--c82) + [L5](live-paper.md#l5--final-hash) | not-run |

### Validation

| Requirement | Where | Status |
| --- | --- | --- |
| V1.1 Offline execution | the whole browser lane; external requests are aborted | automated |
| V1.2 Broken environment | browser · *an external request is blocked*; *a missing local resource fails* | automated |
| V2.1 Reference isolation | contract · *isolated skill resolves all runtime references* | automated |
| V2.2 Broken reference | contract · *missing reference*; *reference outside the package*; *symlink* | automated |
| V3.1 Correct examples | browser · template, regeneration, rename, sweep, spacing, CTA | automated |
| V3.1 Full sweep probes | browser · every `token-sweep.html` probe, alpha modifier and `rounded-full` included | automated |
| C3 `--container-*` double duty | browser · *one --container-\* token serves both max-width and the container threshold* | automated |
| C3 Custom breakpoint without a reset | browser · *a custom breakpoint moves one step and leaves the default scale standing* | automated |
| V3.2 Boundary and failure controls | browser · *viewport … container*; *F-01*; *leading unit matrix*; *rename* | automated |
| V4.1 Synthesis comparison | browser · *font synthesis changes the raster*, with the *font weight* positive control | automated |
| V4.2 Missing face | browser · *missing family* | automated |
| V5.1 Coverage inventory | this table | automated by inspection |
| V5.2 Agent workflow cases | [workflow-cases.md](workflow-cases.md) | not-run |
| V6.1 Available Paper | [live-paper.md](live-paper.md) | **passed 2026-09-09** |
| V6.2 Missing live evidence | [live-paper.md](live-paper.md) status table | recorded |

## Environment-bound numbers

Some assertions depend on the browser and the font build. They are asserted by
**direction**, never against a historical constant:

- The synthesis test asserts that toggling `font-synthesis` changes the raster
  of the same element, and reports the browser version. It does not assert the
  2,514 changed pixels the audit measured. Its positive control is the element
  backed by a real Syne 600 face, which must render *identically* with synthesis
  off — that is what makes the Caprasimo difference attributable to synthesis
  rather than to the toggle.
- The CTA test asserts a height band, not `501.1875px`.
- Font widths are compared against a control in the same page, never to a
  recorded pixel count.

Anything asserted exactly — computed `font-size`, `line-height`, `padding`,
`border-radius`, colors — is arithmetic the browser must reproduce anywhere.

## Where the fixture data comes from

A probe asserting invented values proves the browser works, not that the skill
does. Three of the four pages use **real Radiant Thread Studio tokens**, and that
was re-verified against live Paper on 2026-09-09:

| Page | Provenance | Drift vs live Paper |
|------|------------|---------------------|
| `roundtrip-final-cta.html` | `get_jsx({format:"tailwind"})` + `get_tokens`, pasted verbatim | — export, not re-checked per token |
| `token-sweep.html` | 28 Radiant Thread tokens | **0** |
| `unverified-claims.html` | 18 Radiant Thread tokens | **0** |
| `f01-leading-inheritance.html` | **synthetic, necessarily** | n/a |

The only non-Paper token in the sweep is `--font-missing: NotARealTypeface`, a
deliberate control for silent substitution.

F-01 is synthetic because it *cannot* be otherwise: it contrasts `120%` against
the unitless `1.2`, and Paper cannot store a unitless line-height — writing `1.2`
reads back `120%` (F-01 is that finding). The fixture must hand-write the value
Paper refuses to hold. The in-memory fixtures inside `browser.test.mjs` are
synthetic for the same class of reason: they stage broken states (a dangling
alias, a missing resource) that no real design file should contain.

Re-run the drift check by exporting the Radiant Thread tokens and diffing them
against each fixture's `@theme` block. A fixture that has drifted is still a
valid CSS test, but it stops being evidence about this design system.

## The visual probes

The four HTML pages are still readable by hand; run `npm run probes` and open
them, because they now load the pinned compiler and fonts from `/vendor/*`
instead of a CDN.

### `roundtrip-final-cta.html`

Paper → HTML → Tailwind v4 fidelity check. The `Section: Final CTA` export from
Radiant Thread Studio, pasted verbatim — `get_jsx({ format: "tailwind" })` with
`className` renamed to `class`, and the `@theme` block from `get_tokens` with no
edits. Only the asset `<link>`/`<script>` tags were repointed at the local
server; the exported markup and theme are untouched. Open at 1200px.

### `f01-leading-inheritance.html`

Falsification test for F-01. Two identical cards; the only variable is the
stored form of the line-height token — `120%` (what Paper saves) against `1.2`
(what Tailwind ships). Each card nests a 40px child inside a **16px** parent.

The left card's child inherits a **19.2px** line box (16 × 1.2) and collides
with the lines around it; the right card's child resolves to **48px**
(40 × 1.2). A 2.5× error, visible without instruments.

> The parent is 16px, declared explicitly. An earlier version of this page and
> of this README said 18px while styling the parent with an undefined
> `text-md`, which computed to the 16px default. The browser test now asserts
> the parent size before asserting the children.

### `unverified-claims.html`

Four probes for claims this repository once made without evidence: `--container-*`
double duty, enumerated `--spacing-N` versus the derived scale, a redefined
breakpoint against the default scale, and `font-semibold` on a family that ships
only weight 400. T3 is viewport-dependent — measure at 1300px and again at
1100px. Three held; **T4 was refuted, and its refutation was later refuted** —
see `normalization-evidence.md` T4.

### `token-sweep.html`

Full sweep of `color`, `fontSize`, `fontFamily`, `letterSpacing` and `radius` —
every declared step, not one sample each. Includes a deliberately unavailable
family, `--font-missing: NotARealTypeface`, as a control for silent font
substitution. Do **not** trust `document.fonts.check()`, which reports `true`
for it; inspect `document.fonts` instead.
