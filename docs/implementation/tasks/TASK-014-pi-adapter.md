# Task Packet: TASK-014 - Native Pi Adapter

## Metadata

- Status: deferred
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-003, TASK-004, TASK-005

## Mission

Add a native Pi extension only when measured usage or missing fallback fidelity
justifies another maintained host adapter.

## Scope

Included:

- Pi extension lifecycle and installation;
- normalized events, skills, permissions, and operations mapping;
- coexistence with existing Pi packages and memory extensions;
- conformance, capability reporting, and fallback.

Excluded:

- beginning work before PMQ-008 has evidence;
- copying behavior or branding from another harness;
- replacing generic CLI/MCP support;
- making a specific memory extension mandatory.

## Ownership

- Write-set: Pi adapter/extension, installer, fixtures, conformance tests, docs
- Read-set: shared adapter contracts and current official Pi extension documentation
- Forbidden-set: third-party extension source, unrelated adapters, user data
- Exclusive resources: Pi extension ID and compatibility matrix

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated TASK-003/004/005 contracts

### On demand

- official Pi extension and package docs current at dispatch
- measured fallback limitations and usage evidence

### Discovery

- stable Pi lifecycle surfaces and extension coexistence rules
- exact fidelity unavailable through CLI/MCP

### Do not preload

- third-party harness internals
- complete user Pi configuration or memory

## Decisions

- Decision: defer native Pi maintenance until evidence justifies it.
  - Evidence: CLI/MCP already provide universal compatibility at lower fidelity.
- Decision: any Pi memory integration remains an optional provider adapter.
  - Evidence: the toolkit must not depend on one memory implementation.

## Open Questions

- `PMQ-008`: adoption or fidelity threshold that justifies this adapter.

## Assumptions

- Assumption: generic fallback remains functional before native work starts.
  - Evidence: TASK-014 depends on universal contracts.

## Documentation Impact

- Update: Pi compatibility, install/uninstall, conflicts, fidelity, changelog
- Reason: native support adds maintenance and user-configuration surface.

## Acceptance Criteria

1. Evidence recorded in PMQ-008 justifies native implementation.
2. Install/uninstall preserve unrelated Pi packages and configuration.
3. Native hooks map to canonical operations and shared conformance.
4. Optional memory packages remain replaceable and non-authoritative.
5. Unsupported behavior retains explicit CLI/MCP fallback.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | readiness review | no measured need | approved evidence exists |
| AC2 | config round-trip | foreign package changes | only owned entries change |
| AC3-AC5 | conformance matrix | divergent/mandatory behavior | canonical mapping and fallback hold |

## Plan

1. Resolve PMQ-008 with usage evidence.
2. Revalidate current Pi extension APIs.
3. Decompose installer and runtime mapping.
4. Implement fixtures, binding, and shared conformance.
5. Document maintenance scope.

## Stop Conditions

Stop if no evidence justifies native maintenance, generic fallback is sufficient, or
integration requires a mandatory third-party harness or memory provider.

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
- [ ] Verification and host conformance passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
