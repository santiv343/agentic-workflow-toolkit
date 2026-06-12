# Task Packet: TASK-008 - Native Claude Code Adapter

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-003, TASK-004, TASK-005

## Mission

Map supported Claude Code hooks, permissions, and skills to the portable workflow
without introducing a parallel task system or weakening repository gates.

## Scope

Included:

- versioned Claude Code binding installation and removal;
- supported lifecycle, permission, and tool hooks;
- normalized operation and evidence mapping;
- compatibility with existing user/project skills and hooks;
- capability report, fallback behavior, and conformance.

Excluded:

- enabling autonomous merge or permission escalation;
- using prompts as the only enforcement mechanism;
- replacing unrelated Claude Code configuration;
- provider/model routing.

## Ownership

- Write-set: Claude Code binding, installer, fixtures, conformance tests, usage docs
- Read-set: TASK-003/004/005 contracts and current official Claude Code documentation
- Forbidden-set: unrelated adapters, user credentials, consumer repositories
- Exclusive resources: Claude Code binding ID and compatibility matrix

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated normalized events, skills, and MCP contracts

### On demand

- official Claude Code hooks, permissions, and skills docs current at dispatch
- representative safe configuration fixtures

### Discovery

- hook ordering, failure behavior, and permission boundaries
- user/project configuration merge and uninstall rules

### Do not preload

- other host adapter implementations
- user transcripts, secrets, or full skill libraries

## Decisions

- Decision: host permissions may restrict toolkit behavior but never widen project
  authority.
  - Evidence: lower-precedence bindings cannot weaken repository policy.
- Decision: hooks map to shared operations and structured failures.
  - Evidence: prompt-only duplicated behavior drifts across hosts.
- Decision: unsupported hooks retain explicit CLI/MCP fallback.
  - Evidence: portability requires honest degraded modes.

## Open Questions

- `PMQ-007`: supported Claude Code hooks and permission boundaries.

## Assumptions

- Assumption: supported hook behavior can be tested without private user data.
  - Evidence: conformance must use isolated fixtures.

## Documentation Impact

- Update: Claude Code install/uninstall, permissions, conflicts, capability matrix,
  changelog
- Reason: users must understand configuration effects and enforcement limits.

## Acceptance Criteria

1. Installation and removal preserve unrelated hooks, permissions, and skills.
2. Supported hooks invoke canonical toolkit operations once and in documented order.
3. Host permissions cannot bypass a repository or profile restriction.
4. Skill conflicts use the shared resolver.
5. Missing hooks produce explicit fallback and fidelity status.
6. Conformance records host version and observed evidence.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | configuration round-trip | foreign entry changes | owned changes round-trip cleanly |
| AC2 | hook ordering fixture | duplicate/out-of-order action | normalized sequence matches |
| AC3 | permission matrix | lower layer widens access | effective policy remains restrictive |
| AC4-AC6 | conflicts/conformance | false support or drift | resolver and evidence are explicit |

## Plan

1. Resolve PMQ-007 from current official APIs.
2. Split installer and runtime mapping into child packets.
3. Add failing hook, permission, and merge fixtures.
4. Implement the thin binding and shared conformance.
5. Document fidelity and fallback.

## Stop Conditions

Stop if hooks cannot preserve gate ordering, installation overwrites foreign config, or
the host requires a competing workflow authority.

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
