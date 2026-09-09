# Paper–Tailwind Skill Contract

## Purpose

Define portable instructions for safe Paper token authoring and Tailwind consumption.

## Requirements

### Requirement: C1 Portable activation

The skill MUST package its runtime references and clearly delimit activation.

#### Scenario: C1.1 Isolated installation
- GIVEN only the skill folder is installed
- WHEN its runtime references are followed
- THEN all resolve within that folder; repository navigation remains valid.

#### Scenario: C1.2 Relevant requests
- GIVEN token authoring, export, or audit versus unrelated editing
- WHEN deciding activation
- THEN the former loads this skill; the latter does not require it.

### Requirement: C2 Verified MCP operations

The workflow MUST load Paper guidance before context, reuse tokens, inspect per-entry results, and verify readback.

#### Scenario: C2.1 Preparation
- GIVEN an unprepared session
- WHEN token work starts
- THEN guidance precedes context and font inspection precedes typography.

#### Scenario: C2.2 Partial failure
- GIVEN one mutation entry fails
- WHEN producing output
- THEN identify failed entries and unresolved work; never claim complete success.

### Requirement: C3 Token and responsive vocabulary

The skill MUST map all ten Paper types, follow documented ordering, preserve consumers, and distinguish viewport from container thresholds.

#### Scenario: C3.1 Designed thresholds
- GIVEN artboards at 320, 768, and 1200px
- WHEN declaring breakpoints
- THEN exclude 320; reject unmatched thresholds and identify namespace ownership.

#### Scenario: C3.2 Consumer boundaries
- GIVEN reusable components and Paper-bound spacing steps
- WHEN simplifying the browser vocabulary
- THEN use container variants for slots and retain referenced Paper tokens and the browser spacing base.

### Requirement: C4 Explicit leading conversion

The skill MUST distinguish ratios, percentages, em, px, aliases, and unsupported values. Inherited leading needs a ratio; intentional fixed leading MAY remain fixed with documented scope.

#### Scenario: C4.1 Convertible values
- GIVEN 1.2, 120%, 1.2em, or 24px paired explicitly with 20px
- WHEN exporting inherited leading
- THEN obtain 1.2; resolve aliases without cycles before conversion.

#### Scenario: C4.2 Unknown intent
- GIVEN absolute leading without intent, cyclic aliases, or unsupported expressions
- WHEN exporting
- THEN report unresolved values and never invent ratios or claim full conversion.

### Requirement: C5 Safe migration

Renaming MUST preserve canonical values, compatibility, and rollback across token and node consumers.

#### Scenario: C5.1 Completed rename
- GIVEN old consumers and dependent aliases
- WHEN migration finishes and the old name is deleted
- THEN the new name resolves independently and consumers retain their appearance.

#### Scenario: C5.2 Uncertain consumers
- GIVEN unresolved usages or a failed migration
- WHEN considering deletion
- THEN retain compatibility and restore the recorded prior mapping when rolling back.

### Requirement: C6 Persistent ownership

Regeneration MUST affect only generated content in a consumer stylesheet; skill assets and application overrides MUST survive.

#### Scenario: C6.1 Consecutive exports
- GIVEN fallbacks, paired modifiers, theme overrides, resets, and motion
- WHEN replacing generated tokens twice
- THEN those overrides persist, updated tokens render, and installed assets remain unchanged.

### Requirement: C7 Typography and theming

The skill MUST use px sizing, explicit em tracking, verified fonts, and application-owned pairs/fallbacks. Fluid px-bound tokens MAY be stored; storage alone MUST NOT prove viewport fidelity.

#### Scenario: C7.1 Nested rendering
- GIVEN nested themes, differently sized text, and unavailable fonts
- WHEN applying semantics and typography
- THEN aliases resolve locally, tracking scales, leading/tracking pairs apply, and fallback behavior is explicit.

### Requirement: C8 Truthful snapshot output

Output MUST report changes, CSS destination, owned namespaces, unresolved cases, and a final file-bound token hash.

#### Scenario: C8.1 Stable export
- GIVEN verified mutations and matching hashes surrounding export
- WHEN saving CSS
- THEN record that final hash, not the initial pre-mutation hash.

#### Scenario: C8.2 Unavailable or changing source
- GIVEN failed access or mismatching surrounding hashes
- WHEN completing export
- THEN report incomplete evidence and retry or stop without recording a synchronized result.
