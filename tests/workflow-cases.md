# Agent workflow cases

The browser lane proves what CSS does. It cannot prove what an **agent** does
with the skill. These cases cover the runtime rules that have no CSS surface:
tool ordering, error handling, and refusing to guess.

**They are judged by a human or a judge model reading a transcript.** A string
match against `SKILL.md` proves the instruction is written down, not that it was
followed — so no case here may be marked passed on the strength of the skill
text alone.

| Field | Meaning |
| --- | --- |
| Input | What the agent is asked, and the state it starts from |
| Expected | The observable actions that satisfy the rule |
| Fail signal | What a violation looks like in the transcript |
| Status | `passed` / `failed` / **`not-run`** |

Status values below are the outcome of the **2026-09-09** cycle. Every case is
`not-run`: this cycle hardened the skill and built the local lanes; no agent
transcript was collected against the corrected text. Recording anything else
would be the exact overclaim the audit was opened to fix.

---

## W1 — Activation boundary · C1.2

**Input.** Two prompts against the same repository:
(a) "export the Paper tokens for this Tailwind app";
(b) "rename the CTA button label on the landing artboard".

**Expected.** (a) loads `paper-tailwind-tokens` before any Paper call.
(b) completes without loading it.

**Fail signal.** The skill loads for (b), or (a) starts calling Paper tools with
no skill in context.

**Status:** not-run.

---

## W2 — Prerequisite ordering · C2.1

**Input.** A fresh session, a Paper file with existing tokens, and a request to
add a typographic token.

**Expected, in order:** `get_guide({ topic: "paper-mcp-instructions" })` →
`get_basic_info` → `get_font_family_info` → mutation. The pre-work
`contentHash.tokens` is recorded at `get_basic_info` and labelled as the
*pre-work* reading.

**Fail signal.** The first Paper call is `get_basic_info`; or typography is
styled before the font families are read; or the pre-work hash is presented as
the result hash.

**Status:** not-run.

---

## W3 — Partial batch failure · C2.2

**Input.** A `create_tokens` call with six entries where one is invalid (for
example a `lineHeight` the file rejects), returning a per-entry result array
with one failure.

**Expected.** The agent inspects each entry, reads the tokens back, and reports
"5 of 6 created; `--leading-x` failed because …". Remaining work is named.

**Fail signal.** "Tokens created ✅". A summary that counts the request instead
of the result. Any success claim without a readback.

**Status:** not-run.

---

## W4 — Alias cycle and unresolved leading · C4.2

**Input.** A token set containing `--leading-a: var(--leading-b)`,
`--leading-b: var(--leading-a)`, and `--leading-fixed: 24px` with no description
and no paired size.

**Expected.** Both branches are reported unresolved, quoting the stored values.
The export completes for everything else. No ratio is invented for `24px`, and
the cycle is named as a cycle rather than followed until it runs out of depth.

**Fail signal.** `24px → 1.5` (a guessed 16px root). "All leading tokens
converted." A hang or a stack overflow on the cycle.

**Status:** not-run.

---

## W5 — Stale hash · C8.1 / C8.2

**Input.** A session that reads `contentHash.tokens` at the start, mutates
tokens, then exports. Variant B: the file changes between the pre-export read
and the post-export read.

**Expected.** Variant A records the **final** hash. Variant B detects the
mismatch and re-exports or stops, and never writes a hash beside CSS it does not
describe.

**Fail signal.** The opening hash appears in the output contract. A mismatch is
noticed and then recorded anyway.

**Status:** not-run.

---

## W6 — Rename direction · C5.1

**Input.** "Rename `--color-accent` to `--color-brand`", with the value in use
by Paper nodes and by another token.

**Expected.** `--color-brand` is created with the canonical value; the old name
becomes the alias; token-to-token consumers are checked, not only class names;
rollback data is recorded before the alias is removed.

**Fail signal.** `--color-brand: var(--color-accent)` followed by deleting
`--color-accent` — the dangling reference the browser lane reproduces.

**Status:** not-run.

---

## W7 — Export destination · C6.1

**Input.** "Land the export" in a project where the skill is installed under a
skills directory and the app has `src/styles/`.

**Expected.** The generated block goes into the consumer stylesheet, between the
`paper-tokens:generated` markers. The installed
`skills/paper-tailwind-tokens/assets/paper-tokens.css` is untouched.

**Fail signal.** Any write to the installed asset. A whole-file overwrite that
drops the owned regions.

**Status:** not-run.

---

## W8 — Breakpoint policy · C3.1

**Input.** A file with artboards at 320, 768 and 1200px, and a request to
"declare the breakpoints", followed by "also add a `--breakpoint-tablet: 900px`".

**Expected.** 320 is excluded — it is the base size and takes no prefix. 768 and
1200 are declared. The 900px request is refused or flagged: no artboard backs
it. The agent also names which namespaces it is taking ownership of.

**Fail signal.** A `--breakpoint-mobile: 320px` that matches every device. A
900px breakpoint accepted without comment.

**Status:** not-run.

---

## How to run these

Operator instructions, seeding recipes and the verbatim prompts live in
[`workflow-runner.md`](workflow-runner.md). The short version:

1. Start a session with only the skill installed — no repository context that
   restates the rules. **The session under test must never see this file**: it
   states the expected tool order, so an agent that reads it performs the right
   sequence because it was told.
2. Give the input verbatim. Do not hint at the expected tool order.
3. Save the transcript as `tests/transcripts/2026-MM-DD-W<n>.md`.
4. Judge against **Expected** and **Fail signal**, and record the status here
   with a link to the transcript. Partial credit is a `failed` with a note, not
   a `passed`.
5. A failure is a finding about the skill. Open an issue against `SKILL.md`
   rather than rewriting the rubric to match the behaviour.
