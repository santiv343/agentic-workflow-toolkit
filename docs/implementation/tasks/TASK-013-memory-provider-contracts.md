# Task Packet: TASK-013 - Pluggable Memory Provider Contracts

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-001, TASK-003

## Mission

Allow episodic memory providers to be replaced without making memory authoritative,
leaking profile data, or forcing agents to load broad historical context.

## Scope

Included:

- search, read, save, session-summary, delete, and health ports;
- provider capability and degradation reporting;
- provenance, scope, retention, sensitivity, and size validation;
- selected retrieval for orchestrators and compaction recovery;
- one external adapter chosen after policy resolution plus shared contract tests.

Excluded:

- storing canonical task state, permissions, decisions, or review only in memory;
- unrestricted transcript/tool-payload persistence;
- automatic promotion into project rules;
- implicit cross-profile or cross-project search.

## Ownership

- Write-set: memory application ports, provider adapters, schemas, contract tests,
  status/API/docs
- Read-set: profile policy/storage and normalized lifecycle events
- Forbidden-set: provider credentials in repository, board/task mutation, sync engine
- Exclusive resources: memory provider contract and capability vocabulary

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated TASK-001 and TASK-003 contracts
- Knowledge Hub memory-provider contract

### On demand

- selected provider official documentation
- local SQLite adapter contract
- compaction and brief integration

### Discovery

- current session-summary and learning-candidate data classes
- policy checks required before outbound writes

### Do not preload

- complete memory databases
- historical transcripts
- providers not selected for the first adapter

## Decisions

- Decision: memory assists recall and never becomes canonical authority.
  - Evidence: memory can be stale, incomplete, or unavailable.
- Decision: orchestrators retrieve a bounded selection for the current task.
  - Evidence: broad recall defeats context and cost controls.
- Decision: every provider declares capabilities and disclosure behavior.
  - Evidence: providers differ in delete, retention, locality, and summary support.

## Open Questions

- `PMQ-009`: first external provider and permitted outbound data classes.

## Assumptions

- Assumption: profile policy and normalized session events are integrated first.
  - Evidence: scope, retention, and compaction triggers depend on TASK-001/TASK-003.

## Documentation Impact

- Update: provider SPI, privacy matrix, profile policy, fallback behavior, changelog
- Reason: adapters may move selected data outside local storage.

## Acceptance Criteria

1. Providers pass one contract suite for supported operations.
2. Missing capabilities degrade explicitly without weakening gates.
3. Search and reads remain profile/project scoped and result bounded.
4. Outbound writes obey class, size, retention, sensitivity, and network policy.
5. Memory cannot mutate canonical workflow state or promote itself automatically.
6. Provider failure preserves local workflow and reports actionable status.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1-AC2 | provider fake matrix | unsupported operation is simulated | capability and fallback are explicit |
| AC3 | isolation fixture | cross-scope record appears | query remains scoped and bounded |
| AC4 | policy canaries | prohibited data leaves machine | adapter rejects before transport |
| AC5-AC6 | authority/outage fixture | memory changes gate or crashes flow | workflow remains canonical |

## Plan

1. Resolve PMQ-009.
2. Split provider SPI and first external adapter into child packets.
3. Implement contract tests and deterministic fake first.
4. Integrate bounded retrieval and status.
5. Implement selected adapter and privacy tests.

## Stop Conditions

Stop if a provider requires canonical state, policy cannot describe disclosure, or
tests need real personal data or credentials.

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
- [ ] Verification and provider conformance passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
