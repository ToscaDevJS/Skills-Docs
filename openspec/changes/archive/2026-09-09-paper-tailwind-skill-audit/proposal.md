# Proposal: Make the Paper–Tailwind skill portable and verifiable

## Intent

Correct unsafe migration, regeneration, incomplete line-height rules, and
nonportable references. Turn manual browser probes into repeatable evidence.
The ten findings are recorded in `exploration.md`.

## Scope

### In Scope

- Package normative references inside the skill; preserve root navigation.
- Preserve canonical token values through alias migration and deletion.
- Separate generated CSS from persistent application overrides.
- Specify leading conversion by unit and alias; report unresolved intent.
- Align MCP prerequisites, error checks, export destination, and final hash capture.
- Correct F-01 sizing, T4 font conclusions, and contradictory guidance.
- Add reproducible contract/browser tests and a bounded live Paper test protocol.

### Out of Scope

- Exporter service, CI authentication, publishing, global installation.
- Paper redesigns or unrelated skills.

## Capabilities

### New Capabilities

- `paper-tailwind-skill-contract`: portable instructions, safe migration,
  normalization, ownership, and truthful output.
- `paper-tailwind-validation`: repeatable local assertions, evidence provenance,
  and separately reported live Paper scenarios.

### Modified Capabilities

None; no main specifications exist.

## Approach

Package local references and add a Node-based test entry point with pinned
compiler/browser dependencies. Correct probe preconditions and add assertions.
Check agent tool sequences separately from CSS rendering. Absolute leading
without intent remains unresolved.

## Affected Areas

| Area | Impact |
| --- | --- |
| `skills/paper-tailwind-tokens/` | Correct contract, references, and template |
| Root Markdown guides | Reconcile guidance and measured conclusions |
| `tests/` | Repair fixtures and add regression scenarios |
| Root test manifest/configuration | Add one documented execution entry point |

## Risks

| Risk | Mitigation |
| --- | --- |
| Platform-dependent font pixels | Pin browser/fonts and compare the same element |
| Unknown absolute leading intent | Report unresolved input; never invent a ratio |
| Live Paper unavailable | Explicitly report unavailable evidence; no false pass |
| Relocated references break navigation | Validate installed and repository link graphs |

## Rollback Plan

Revert corrections, reference relocation, and tooling independently; retain
audit evidence. Live probes use a disposable file with documented cleanup.

## Dependencies

Node, a pinned Tailwind compiler and browser runner; Paper MCP for the live lane.

## Success Criteria

- [x] Isolated skill installation resolves every runtime reference.
- [x] Alias deletion preserves the canonical value — asserted in the browser lane.
- [~] Rollback is specified (recorded restore pair) but its drill is live-Paper
      step L3, status `not-run`.
- [x] Repeated export preserves application-owned overrides.
- [x] Every runtime rule maps to an assertion or explicit agent/live scenario.
- [x] One documented command reports local failures with a nonzero exit.
- [x] F-01/T4 claims match measured evidence; source versions are recorded.
- [x] The skill contract requires reporting the final hash, per-entry failures and
      unresolved values; the dangling-alias and unresolved-leading branches are
      asserted locally.
- [~] Whether an agent actually reports them is workflow cases W3/W4/W5,
      status `not-run`.

Legend: `[x]` met with recorded evidence · `[~]` specified and reviewable, evidence lane not executed.
