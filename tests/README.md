# Test pages

Two standalone HTML pages backing the findings in
[`../paper-mcp-normalization-tests.md`](../paper-mcp-normalization-tests.md).
Both load Tailwind v4 from `@tailwindcss/browser@4`; open either file directly in
a browser — no build step, no server.

## `roundtrip-final-cta.html`

Paper → HTML → Tailwind v4 fidelity check.

Contains the `Section: Final CTA` export from Radiant Thread Studio, **pasted
verbatim** — the markup from `get_jsx({ format: "tailwind" })` with `className`
renamed to `class`, and the `@theme` block from
`get_tokens({ format: "tailwind" })` with no edits. Nothing is hand-tuned; that
is the point of the test.

Open at a 1200px viewport and compare against the artboard. Measured result:
sub-pixel differences only (Part 2 of the findings doc).

To re-measure rather than eyeball it, run this in the console:

```js
const el = document.querySelector('body > div');
const s  = getComputedStyle(el.children[1]);   // headline
({ height: el.getBoundingClientRect().height, fontSize: s.fontSize, lineHeight: s.lineHeight });
// expected: ~501.19, "70px", "63px"
```

## `f01-leading-inheritance.html`

Falsification test for finding F-01.

Two identical cards side by side. The only variable is the stored form of the
line-height token: `--leading-paper: 120%` (what Paper saves) versus
`--leading-tw: 1.2` (what Tailwind ships). Each card nests a 40px child inside
18px parent copy.

Expected: the left card's nested child inherits a **19.2px** line box and
collides with the lines above and below it; the right card's child resolves to
**48px**. A 2.5× error, visible without instruments.

This is why the `%` → unitless conversion is mandatory at export time even though
the round-trip page above passes: flat sections never expose it.
