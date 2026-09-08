# Paper MCP: token normalization test results

Controlled tests run in an isolated Paper file, `Token Normalization Test — Paper MCP`
(`01M21E5GY1QMZ5CSPQTNNWVD7N`). Each token was written with `create_tokens`, read
back with `get_tokens`, and — where rendering mattered — applied to a text node
and screenshotted against a comparison ladder.

Method note: `get_computed_styles` returns the token *reference*
(`var(--text-t4)`), not a resolved pixel value. Resolution can only be measured
visually, by rendering the token beside literal-size reference rows.

---

## Results

| Type | Input | Stored as | Verdict |
|------|-------|-----------|---------|
| `lineHeight` | `1.2` (number) | `120%` | **converted** |
| `lineHeight` | `"1.2"` (string) | `120%` | **converted** |
| `lineHeight` | `"120%"` | `120%` | preserved |
| `lineHeight` | `"24px"` | `24px` | preserved |
| `lineHeight` | `"1.2em"` | `1.2em` | preserved |
| `fontSize` | `"16px"` | `16px` | preserved |
| `fontSize` | `"1rem"` | `1rem` | preserved |
| `fontSize` | `16` (number) | `16px` | coerced to px |
| `fontSize` | `"clamp(1rem, 2vw, 2rem)"` | `clamp(1rem, 2vw, 2rem)` | **preserved verbatim** |
| `letterSpacing` | `"0.05em"` | `0.05em` | preserved |
| `letterSpacing` | `"1px"` | `1px` | preserved |
| `letterSpacing` | `0.05` (number) | `0.05px` | coerced to px |
| `color` | `oklch(0.7 0.15 40)` | `oklch(70% 0.150 40)` | syntax normalized |
| `color` | `rgb(0 0 0 / 0.5)` | `rgb(0 0 0 / 50%)` | alpha normalized |
| `radius` | `"1rem"` | `1rem` | preserved |
| `spacing` | `"1rem"` | `1rem` | preserved |
| `fontWeight` | `"700"` (string) | `700` | preserved |

---

## Findings

### F-01 — Unitless line-height cannot be stored · HIGH

A unitless value is converted to a percentage on save, as a number or a string.
Confirmed by writing `2` and reading back `200%`.

The three storable forms — `%`, `px`, `em` — all inherit an already-computed
pixel value. Unitless is the only form that inherits a *ratio* and recomputes per
element, and it is the only form Paper rejects. **There is no workaround inside
Paper.** Convert at export.

Record the intended ratio in the token `description` so the export step has a
source of truth.

### F-02 — `clamp()` survives in a `fontSize` token · CORRECTS EARLIER GUIDANCE

`clamp(1rem, 2vw, 2rem)` is stored verbatim and renders on the canvas as a
visibly larger size — it is neither rejected, stripped, nor zeroed.

Earlier guidance in this repository stated that fluid type had to live in the
codebase because Paper's token API only takes px strings. **That was wrong.**
Fluid type can be authored as a Paper token. The remaining caveat is F-03: the
units *inside* the `clamp()` do not resolve the way a browser resolves them.

### F-03 — `rem` does not resolve against a 16px root · MEDIUM

`rem` is parsed and scales correctly — `2rem` renders about twice `1rem`. But
`1rem` renders visibly smaller than a literal `16px`, and `2rem` renders visibly
smaller than a literal `32px`.

Consequence: a size token stored in `rem` appears smaller on the Paper canvas
than it will in a browser, where the default root is 16px. The design and the
build disagree, silently, and neither is "wrong".

The exact root value is not exposed by the MCP. Prefer `px` for size tokens —
which is what Paper's own guide recommends, now with a measured reason.

### F-04 — Numbers are coerced to px, including for `letterSpacing` · MEDIUM

Passing `0.05` for a `letterSpacing` token stores `0.05px`, not `0.05em`. Tracking
is almost always intended in `em`, so the bare number is a silent footgun that
produces a value ~300× smaller than intended at body sizes. Always pass tracking
as an explicit `em` string.

### F-05 — The MCP does not document any of this · LOW, DOCUMENTATION

The `create_tokens` schema states: *"For lineHeight/letterSpacing, use a string
(`"1.5px"`) or number."* It permits a number and says nothing about conversion.
`get_guide({ topic: "paper-mcp-instructions" })` recommends px for line height and
adds that "relative line height units are also acceptable" — with no mention that
unitless is rewritten. No other guide topic (`mobile-status-bar`, `figma-import`,
`image-generation`) covers token value handling.

### F-06 — Token references are not resolved by `get_computed_styles` · LOW

The tool returns `fontSize: "var(--text-t4)"`. There is no MCP call that reports
the final computed pixel value of a token-bound style, so verifying what a token
actually renders as requires a screenshot and a comparison ladder.

### F-07 — Nested inline text is flattened · CONTEXT

A `<span>` with its own font size inside a text node does not survive
`write_html`; Paper has no rich text. Line-height inheritance therefore cannot be
observed inside Paper at all — which is a plausible reason the tool treats `%`
and unitless as interchangeable. The distinction only exists in exported code.

---

## Consequences for the token model

| Token type | Author in Paper as | Reason |
|------------|--------------------|--------|
| `fontSize` | `px`, or `clamp()` with px bounds | `rem` drifts (F-03) |
| `lineHeight` | `%`, ratio recorded in `description` | unitless impossible (F-01) |
| `letterSpacing` | explicit `em` string | numbers become px (F-04) |
| `spacing`, `radius` | `px` | consistency with F-03 |
| `color` | any CSS syntax | normalized but equivalent |
