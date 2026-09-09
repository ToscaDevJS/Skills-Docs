# Paper–Tailwind Validation

## Purpose

Make regressions repeatable while separating local rendering, agent behavior, and live Paper evidence.

## Requirements

### Requirement: V1 Reproducible execution

The repository MUST provide one documented local test command, pinned dependencies, and explicit failures. Installed tests MUST run without CDN or Google Fonts access.

#### Scenario: V1.1 Offline execution
- GIVEN dependencies, fonts, and the pinned browser are installed
- WHEN running the local command with external requests blocked
- THEN packaging and browser assertions execute and report their results.

#### Scenario: V1.2 Broken environment or assertion
- GIVEN a missing browser/font or deliberately incorrect expected value
- WHEN executing the relevant check
- THEN fail with a nonzero exit and a useful cause, without silently using a different browser or font.

### Requirement: V2 Portable package checks

Tests MUST validate metadata, runtime references, and examples using an isolated installation, including negative controls.

#### Scenario: V2.1 Reference isolation
- GIVEN a copied skill without its repository
- WHEN validating the package
- THEN every normative reference resolves locally and the source copy remains unchanged.

#### Scenario: V2.2 Broken reference
- GIVEN a removed reference or path escaping the copied package
- WHEN validation runs
- THEN report the offending reference and fail.

### Requirement: V3 Behavioral CSS regressions

Browser tests MUST exercise the shipped template and documented correction examples, including migration, regeneration, leading, nested themes, paired typography, responsive boundaries, spacing, and token sweeps.

#### Scenario: V3.1 Correct examples
- GIVEN the corrected template and examples
- WHEN compiling and rendering
- THEN assert canonical value survival, persistent overrides, semantic scope, all declared color/size steps, and spacing/radius behavior.

#### Scenario: V3.2 Boundary and failure controls
- GIVEN breakpoint/container boundaries, percentage inheritance, dangling aliases, and plain scoped aliases
- WHEN comparing corrected behavior with those controls
- THEN distinguish both outcomes; F-01 explicitly asserts its 16px parent and 19.2px versus 48px children.

### Requirement: V4 Font evidence

Font tests MUST verify face readiness and compare controlled rendering; equal widths and a positive missing-family check MUST NOT establish face identity or absence of synthesis.

#### Scenario: V4.1 Synthesis comparison
- GIVEN the same element, loaded single-weight font, and requested heavier weight
- WHEN toggling synthesis with constant content and position
- THEN compare raster pixels and report browser/font versions without requiring historical pixel counts.

#### Scenario: V4.2 Missing face
- GIVEN an intentionally unavailable family
- WHEN evaluating fallback
- THEN report fallback separately from declared family and font-set check results.

### Requirement: V5 Traceable evidence

Every skill requirement MUST map to an automated assertion or explicit agent/live scenario. Results MUST distinguish passed, failed, and not-run checks with provenance.

#### Scenario: V5.1 Coverage inventory
- GIVEN the requirement matrix
- WHEN reviewing test results
- THEN identify the command or scenario for every requirement and expose unexecuted cases.

#### Scenario: V5.2 Agent workflow cases
- GIVEN activation, batch-error, alias-cycle, and stale-hash transcripts
- WHEN judging expected actions
- THEN document the rubric and observed result; static text matches alone cannot claim agent execution.

### Requirement: V6 Bounded live protocol

The project MUST document a separate live Paper protocol covering ten token types, normalization, migration, hash consistency, and cleanup.

#### Scenario: V6.1 Available Paper
- GIVEN live access and a dedicated test document
- WHEN following the protocol
- THEN record inputs, per-entry results, readback/export, hashes, and cleanup disposition.

#### Scenario: V6.2 Missing live evidence
- GIVEN no current live run or unavailable Paper
- WHEN reporting local results
- THEN label the live lane not-run or unavailable; never imply all integrations passed.
