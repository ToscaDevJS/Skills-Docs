# Archive Report: paper-tailwind-skill-audit

Closed 2026-09-09. All phases ran in the main conversation thread without
subagents, as the user instructed; that instruction overrode the SDD delegation
flow for the whole cycle.

## Outcome

Ten audited findings, all addressed. Delivered as five stacked pull requests
against `main`, merged in order.

| PR | Unit | Commit |
| --- | --- | --- |
| [#1](https://github.com/ToscaDevJS/Skills-Docs/pull/1) | Packaging — the skill resolves its own references | `a98415b` |
| [#2](https://github.com/ToscaDevJS/Skills-Docs/pull/2) | Runtime contract corrections | `fb6b170`, `a928ce4` |
| [#3](https://github.com/ToscaDevJS/Skills-Docs/pull/3) | CSS region ownership and the offline harness | `9a34b61` |
| [#4](https://github.com/ToscaDevJS/Skills-Docs/pull/4) | Fixture corrections and browser regressions | `e630409` |
| [#5](https://github.com/ToscaDevJS/Skills-Docs/pull/5) | Evidence protocols, coverage matrix, commit gate | `f8a2c51`, `edecd00` |

## Verification at close

| Command | Result |
| --- | --- |
| `npm test` | 21 pass, 0 fail, exit 0 |
| `npm run test:contract` | 5 pass, 0 fail |
| `npm run test:browser` | 16 pass, 0 fail |
| `npm run build` | exit 0, 905 lines emitted |
| Negative control | A deliberately wrong expectation exits 1; restored source exits 0 |
| Pre-commit gate | Every commit in the chain passed through it |

Environment: Node 24.14.0, Playwright 1.63.0, Chromium build 1243, Tailwind
4.3.3, macOS arm64. The browser lane blocks every external request.

## Claims this cycle corrected

Five statements in this repository were found to outrun their evidence. Each is
recorded in place with its correction rather than quietly rewritten.

| Claim | Correction |
| --- | --- |
| T4: equal advance widths prove no synthetic bold | Toggling only `font-synthesis` on the same element changes the raster. Width is a metric, not a raster |
| C3: width comparison is the only reliable font check | Equal widths prove nothing about face identity. The loaded face set is what is load-bearing |
| F-01 fixture: an 18px parent | The fixture used an undefined `text-md` and rendered 16px. The number was right, the label was wrong |
| A01: the naive rename dangles **in Paper** | Measured live: Paper rewrites the dependent onto the deleted token's target. The dangling failure is real in exported CSS only |
| `contentHash` captured before mutation | Recorded the wrong revision. Captured after the last mutation, bound to a file id |

The fourth was found by the live protocol *after* the pull requests were opened,
and was corrected on the branch that shipped it.

## Live Paper protocol

Executed end to end against `Token Normalization Test — Paper MCP`
(`01M21E5GY1QMZ5CSPQTNNWVD7N`). Outcome **passed**. Start and end hash both
`df953992` across five intermediate values.

New primary evidence:

- `contentHash.tokens` is content-derived, not a revision counter.
- A batch with one invalid entry succeeds overall, advances the hash, and
  reports the failure in-band with no `name` on the error entry.
- `create_tokens` requires an explicit `type`; the enum is exactly the ten
  Paper types.
- `find_nodes` searches canvas nodes, not token-to-token references.
- F-01, F-02 and F-04 confirmed live for the first time.

Cleanup disposition: the file was restored, not deleted. The MCP exposes no
`delete_file`.

## Deliberately not done

**The agent workflow lane is `not-run`.** Eight rubrics are written in
`tests/workflow-cases.md` with inputs and fail signals. Nothing in this session
could judge them credibly — the same context that wrote the skill cannot grade
its own adherence. They need a fresh session with only the skill installed.

**`strict_tdd` is now `true`, and that enforces less than it looks like.** The
orchestrator forwards strict TDD only when launching the `sdd-apply` /
`sdd-verify` sub-agents. This project runs main-thread-only, so nothing forwards
it here. The flag is accurate bookkeeping about capability; the pre-commit hook
is the part that actually runs. This change itself was not built test-first —
the tests were the deliverable.

**Two units exceeded the 400-line review budget** and were reported rather than
compressed: PR #3 at 540 authored lines and PR #5 at 663. One slicing pass was
made in each case. No code, comment, doc or test was deleted to reach a number.

## Delivery note

Merging PR #1 with `--delete-branch` closed PR #2, because GitHub closes a pull
request whose base branch is deleted. The branch was restored, #2 was reopened
and retargeted to `main`, and the remaining branches were retargeted only after
their parent had merged. Do not delete base branches in a stacked chain until
every child has been retargeted.
