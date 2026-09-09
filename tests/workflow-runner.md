# Running the agent workflow cases

Operator instructions for taking `workflow-cases.md` out of `not-run`.

## The one rule that makes this valid

**The session under test must never see `workflow-cases.md`, this file, or this
repository.** Those documents state the expected tool order and the fail
signals. An agent that reads them will perform the right sequence because it was
told, which proves nothing about whether the skill produces that behaviour.

The prompts below are written the way a real user would type them. None of them
hints at what is being measured. Resist the urge to add "remember to check…" —
that hint *is* the failure you are trying to detect.

The same applies to you as the judge: you may read the rubrics, the tested
session may not.

## Setup

1. A scratch project directory, empty apart from what each case needs.
2. Install the skill and nothing else from this repo:
   ```bash
   mkdir -p <scratch>/.claude/skills
   cp -R skills/paper-tailwind-tokens <scratch>/.claude/skills/
   ```
3. Paper MCP connected, pointed at a **disposable** file. Never run these
   against a design anyone depends on — several cases mutate and delete tokens.
4. One fresh session per case. Context bleeds; a session that already loaded the
   skill for W2 is no longer a clean subject for W1(b).

Record each transcript as `tests/transcripts/2026-MM-DD-W<n>.md`, then fill in
the `Status:` line in `workflow-cases.md` with a link.

---

## W1 — Activation boundary

Two **separate** sessions in the same scratch project.

> (a) export the Paper tokens for this Tailwind app

> (b) rename the CTA button label on the landing artboard

Watch which session loads `paper-tailwind-tokens`. (a) must load it before any
Paper call; (b) must finish without it.

---

## W2 — Prerequisite ordering

Fresh session against a Paper file that already has tokens.

> add a display font size token, 44px, to this file

Log the Paper calls **in order**. The rubric is about the sequence, not the
result.

---

## W3 — Partial batch failure

You need a mutation where one entry fails and the others succeed.

**Verified recipe** — a `set_tokens` batch mixing a real token with a name that
does not exist. Measured on 2026-09-09: the call succeeds overall, advances the
hash, and reports the bad entry in-band with no `name` field.

Seed the file with `--color-probe: #B45844`, then:

> update --color-probe to #24130A and --color-ghost to #FFFFFF

> **Unverified path.** The rubric text says `create_tokens` with an invalid
> entry. I have not measured a *partial* failure on `create_tokens` — omitting
> `type` rejects the whole call rather than one entry. Use the `set_tokens`
> recipe above until someone establishes a create-side equivalent.

The failure to catch is a summary that counts the request instead of the result.

---

## W4 — Alias cycle and unresolved leading

Seed the file first:

```
--leading-a: var(--leading-b)
--leading-b: var(--leading-a)
--leading-fixed: 24px        (no description, no paired size)
```

Then:

> export these tokens for Tailwind v4

---

## W5 — Stale hash

**Variant A** — fresh session:

> create a --color-brand token as #B45844, then export everything to CSS for me

**Variant B** — same prompt, but **you edit the Paper file by hand** while the
agent is between its export and its final readback. Add or delete any token.

Variant B is the one worth the effort: it is the only case that exercises "stop
rather than record a hash you cannot stand behind".

---

## W6 — Rename direction

Seed the file so the old name has both kinds of consumer:

```
--color-accent: #B45844
--color-card:   var(--color-accent)     ← token-to-token consumer
```

plus at least one canvas node bound to `var(--color-accent)`.

> rename --color-accent to --color-brand

The failure is `--color-brand: var(--color-accent)` followed by deleting
`--color-accent`.

> Note: measured live, Paper repairs that chain on delete. The failure surfaces
> in the **exported CSS**, not in the design file — so judge the export and the
> agent's stated protocol, not just the end state in Paper.

---

## W7 — Export destination

Scratch project with the skill installed under `.claude/skills/` **and** an
`src/styles/paper-tokens.css` copied from the skill's template.

> export the Paper tokens and land them in the stylesheet

Then check: did `.claude/skills/paper-tailwind-tokens/assets/paper-tokens.css`
change? Any write to it is a fail.

---

## W8 — Breakpoint policy

A Paper file with artboards at 320, 768 and 1200px. Two prompts, in order, same
session:

> declare the breakpoints for this design system

> also add a --breakpoint-tablet: 900px

---

## Judging

Read `workflow-cases.md` **after** the transcripts are collected. For each case
compare against **Expected** and **Fail signal**, then record one of:

- `passed` — every expected action observed in the transcript.
- `failed` — with the quoted line that triggered the fail signal.
- `not-run` — the case was not executed.

**Partial credit is a `failed` with a note, never a `passed`.** An agent that
inspected per-entry results but skipped the readback did not satisfy W3; say so
and quote what it did instead.

If a case fails, that is a finding about the skill, not about the run. Open an
issue against `SKILL.md` rather than rewriting the rubric to match the behaviour.
