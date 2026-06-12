# Task Packet: TASK-003 - Normalized Events and Conformance

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-009

## Mission

Define a provider-neutral host lifecycle and prove adapter capability with normalized
events and independently generated conformance evidence.

## Scope

Included:

- closed versioned lifecycle events and capability levels;
- schema validation and migration rules;
- normalized command, task, session, review, and verification outcomes;
- deterministic conformance fixtures and reports;
- explicit unsupported and degraded capability reporting.

Excluded:

- host-specific hooks or installation;
- MCP transport;
- skill discovery;
- profile persistence, telemetry sinks, or security audit.

## Ownership

- Write-set: event domain/application modules, schemas, generated contracts,
  conformance runner, fixtures, focused tests, API/docs
- Read-set: TASK-009 public contracts and lifecycle architecture
- Forbidden-set: host adapters, profile storage, external SDK configuration
- Exclusive resources: event namespace, capability-level vocabulary, conformance
  report schema

## Context Route

### Required

- `AGENTS.md`
- `docs/architecture.md`
- `docs/implementation/post-mvp-questions.md`
- integrated TASK-009 public contracts

### On demand

- current CLI command result contracts
- schema generation and registry code
- Knowledge Hub portable-harness event sections

### Discovery

- public use-case boundaries that emit lifecycle outcomes
- existing structured result and problem codes

### Do not preload

- host SDK internals
- profile and sync implementation
- historical telemetry

## Decisions

- Decision: host adapters translate to one application-owned event model.
  - Evidence: provider neutrality requires core semantics independent of hook names.
- Decision: conformance is based on observable fixtures, not adapter declarations.
  - Evidence: self-reported support cannot prove trigger, output, or enforcement.
- Decision: unsupported capabilities remain explicit and use documented fallback.
  - Evidence: hosts expose materially different lifecycle surfaces.

## Open Questions

- `PMQ-001`: minimum shared lifecycle and optional fidelity extensions.
- `PMQ-002`: evidence required for advisory, enforced, and native capability claims.

## Assumptions

- Assumption: TASK-009 provides strict schemas, results, failures, and composition.
  - Evidence: TASK-003 depends on the integrated foundation contracts.

## Documentation Impact

- Update: architecture, public event reference, capability-level reference, changelog
- Reason: adapters and MCP depend on these machine contracts.

## Acceptance Criteria

1. Events are versioned, bounded, exhaustive, and provider-neutral.
2. Unknown versions and invalid transitions fail with stable problem codes.
3. Capability levels distinguish unsupported, advisory, enforced, and native.
4. Conformance reports cite fixture evidence and validated adapter version.
5. A host may omit optional events without weakening required fallback behavior.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1-AC2 | schema and transition fixtures | loose/unknown event passes | bounded event validates or fails stably |
| AC3 | capability matrix | support is boolean or ambiguous | level and fallback are explicit |
| AC4 | dishonest adapter fixture | self-report passes | missing evidence fails conformance |
| AC5 | partial-host fixture | optional gap breaks core | declared degradation preserves workflow |

## Plan

1. Resolve PMQ-001 and PMQ-002.
2. Decompose into event-contract and conformance-runner child packets.
3. Implement schemas and pure transition tests first.
4. Implement evidence collection and reports.
5. Run verification and publish the compatibility contract.

## Stop Conditions

Stop if host-specific concepts enter the core, conformance trusts self-reporting, or
an unresolved lifecycle decision reaches implementation.

## Handoff Evidence

### Human Summary

- Response language: pending
- Outcome summary: pending
- Changes made: pending
- Verification summary: pending
- Unverified or inferred: pending
- Remaining work: pending
- Next gate: pending

### Machine Evidence

- Work classification: pending
- Initial evidence command: pending
- Initial evidence result: pending
- Initial evidence: pending
- Failure oracle: pending
- Head commit: pending
- Verification command: pending
- Verification result: pending
- Verified commit: pending
- Acceptance criteria: pending
- Scope command: pending
- Scope result: pending
- Review status: pending
- Reviewer: pending
- Reviewed commit: pending
- Review verification command: pending
- Review verification result: pending
- Review verified commit: pending
- Findings: pending
- Residual risks: pending
- Merge authorized by: pending
- Merge status: pending
- Merged commit: pending
- Integrated verification command: pending
- Integrated verification result: pending
- Integrated verified commit: pending

## Definition of Done

- [ ] Epic was decomposed before dispatch.
- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
