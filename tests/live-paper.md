# Live Paper protocol

The contract and browser lanes run offline. Everything they assert about Paper
itself — that it normalizes a unitless line-height, that it coerces a bare
number to px, that `contentHash.tokens` advances on a write — is **historical
evidence re-read from earlier runs**, not something the local suite can prove.

This file is the bounded protocol for refreshing that evidence against a live
Paper MCP connection. It is deliberately separate: a green `npm test` says
nothing about any step below.

## Status of the last run

| Field | Value |
| --- | --- |
| Date | 2026-09-09 |
| Outcome | **passed**, with one finding that corrected a repository claim |
| File | `Token Normalization Test — Paper MCP` (`01M21E5GY1QMZ5CSPQTNNWVD7N`) |
| Steps executed | L1 ten types · L2 hash advance · L3 migration and rollback · L4 export destination · L5 final hash · L6 cleanup |
| Start / end hash | `df953992` → `df953992` (five intermediate values) |
| Tokens created / deleted | 16 / 16 |
| Cleanup disposition | File **restored, not deleted** — the MCP exposes no `delete_file` |

Per-step results, including the raw readbacks, are recorded as **Part 5** of
`skills/paper-tailwind-tokens/references/normalization-evidence.md`.

### What this run changed

- **F-01 and F-04 confirmed live.** Writing `1.2` to a `lineHeight` reads back
  `120%`; writing the bare number `0.05` to a `letterSpacing` reads back
  `0.05px`. These were historical results until now.
- **F-02 confirmed live** with px bounds: `clamp(40px, 6vw, 100px)` survives
  verbatim.
- **Finding A01 was corrected.** Paper does *not* leave a dangling reference
  when an aliased-from token is deleted — it rewrites the dependent onto the
  deleted token's target. The dangling failure is real in exported CSS only.
- **`contentHash.tokens` is content-derived.** Deleting everything returned the
  file to its exact starting hash. It fingerprints state, never history.
- **Partial failures are in-band.** A batch with one bad entry succeeds overall
  and advances the hash; the error entry carries no `name`.

All ten Paper types now have a live sample.

## Preconditions

- Paper MCP connected and responding to `get_guide`.
- A **dedicated, disposable** file. Never run this protocol against a design
  file anyone depends on: it creates, renames and deletes tokens.
- Record the file id. Every hash below is meaningless without it.

## Protocol

### L1 — Ten types round trip · V6

Create one token of each of the ten Paper types in a single `create_tokens`
call, then read them back.

| Type | Written | Expected readback |
| --- | --- | --- |
| `color` | `#B45844` | verbatim |
| `fontFamily` | `Syne` | verbatim |
| `fontSize` | `28px` | verbatim |
| `fontSize` (fluid) | `clamp(40px, 6vw, 100px)` | verbatim (F-02) |
| `fontWeight` | `600` | verbatim |
| `letterSpacing` | `0.05em` | verbatim |
| `letterSpacing` (bare number) | `0.05` | **`0.05px`** — coercion (F-04) |
| `lineHeight` | `1.2` | **`120%`** — normalization (F-01) |
| `spacing` | `4px` | verbatim |
| `radius` | `15px` | verbatim |
| `breakpoint` | `768px` | verbatim |
| `container` | `1200px` | verbatim |
| `fontSize` (rem control) | `1rem` | verbatim string; renders against Paper's own root (F-03) |

Record: the per-entry result array, the readback, and every difference between
what was sent and what came back. A difference is the finding — do not silently
normalize it away in the notes.

### L2 — Hash advance

1. `get_basic_info` → record `contentHash.tokens` as `H0`.
2. Perform one write from L1.
3. `get_basic_info` → record `H1`.

Expected: `H1 ≠ H0`. If they match, the write did not land and any success
report from step 2 was wrong.

### L3 — Migration and rollback · C5

1. Create `--color-old: #B45844`.
2. Create `--color-brand: #B45844` — the **canonical value**, not `var(--color-old)`.
3. Set `--color-old: var(--color-brand)`.
4. `find_nodes` for consumers of `--color-old`; migrate them.
5. Record the rollback pair (`--color-old`, `#B45844`).
6. Delete `--color-old` via `set_tokens`, entries in the `tokens` array, each
   with its `name`.
7. Read back: `--color-brand` still resolves to `#B45844`.
8. Rollback drill: re-create `--color-old: #B45844` from the recorded pair.

Record: the node count from step 4, and whether step 7 held.

### L4 — Export destination

`get_tokens({ format: "tailwind" })`, then place the result between the
`paper-tokens:generated` markers of a scratch copy of
`skills/paper-tailwind-tokens/assets/paper-tokens.css`. Confirm the installed
asset is byte-identical afterwards.

### L5 — Final hash

Read `contentHash.tokens` immediately before and immediately after the export.
Equal → record it with the file id. Different → re-export. Unreadable → record
"unavailable", not a hash.

### L6 — Cleanup

Delete every token created by L1–L3 and delete the disposable file. Record the
disposition explicitly: *deleted*, *left in place with a reason*, or *cleanup
failed*. An unreported leftover is how a test file becomes a real one.

## Reporting rule

The live lane reports one of three outcomes, never a fourth:

- **passed** — every step above executed, with recorded values.
- **failed** — a step executed and contradicted its expectation. Quote it.
- **not-run / unavailable** — Paper was not reachable, or the protocol was not
  executed this cycle.

`npm test` passing while this file says `not-run` is the normal, honest state.
Presenting it as "all integrations passed" is the failure mode this separation
exists to prevent.
