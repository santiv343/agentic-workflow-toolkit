# Task Packet: TASK-006 - Native OpenCode Adapter

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-003, TASK-004, TASK-005

## Mission

Integrate the toolkit with supported OpenCode lifecycle surfaces so session anchoring,
task gates, skill selection, verification, and evidence run automatically where the
host can enforce them.

## Scope

Included:

- versioned OpenCode binding installation and removal;
- supported session, resume, compaction, permission, and tool hooks;
- mapping to normalized events and toolkit application operations;
- non-destructive coexistence with existing user plugins and skills;
- capability report, fallback behavior, and conformance suite.

Excluded:

- core workflow logic inside the plugin;
- replacing existing user configuration without consent;
- claiming enforcement for hooks OpenCode does not expose;
- model-provider-specific prompts or routing.

## Ownership

- Write-set: OpenCode adapter/binding, adapter fixtures, installer, conformance tests,
  OpenCode usage docs
- Read-set: TASK-003/004/005 public contracts and current official OpenCode docs
- Forbidden-set: OpenCode source internals, unrelated adapters, consumer repositories
- Exclusive resources: OpenCode binding ID and compatibility matrix

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated normalized events, skills, and MCP contracts

### On demand

- official OpenCode plugin, hooks, skills, and permission documentation at dispatch
- representative non-secret user configuration fixtures

### Discovery

- current supported OpenCode versions and stable hook payloads
- safe merge/install locations and uninstall provenance

### Do not preload

- other host adapter implementations
- user skill bodies
- provider credentials or chat history

## Decisions

- Decision: keep the binding thin and map every behavior to toolkit operations.
  - Evidence: host adapters are transports, not workflow authorities.
- Decision: preserve existing compatible customization and report conflicts.
  - Evidence: adoption must not erase user plugins, hooks, or skills.
- Decision: validate exact host versions through conformance.
  - Evidence: host APIs can change independently of the toolkit.

## Open Questions

- `PMQ-005`: first supported OpenCode versions and native hook contract.

## Assumptions

- Assumption: CLI/MCP fallback remains available when a native hook is absent.
  - Evidence: TASK-006 depends on the universal contracts.

## Documentation Impact

- Update: OpenCode install/uninstall, conflict policy, capability matrix, changelog
- Reason: native adoption changes user configuration and enforcement fidelity.

## Acceptance Criteria

1. Install and uninstall are idempotent and preserve unrelated configuration.
2. Supported hooks invoke the correct normalized operation exactly once.
3. Missing hooks produce declared fallback rather than false enforcement.
4. Existing compatible skills/plugins remain active; conflicts are actionable.
5. The validated OpenCode version and conformance evidence are visible.
6. No project or personal data is copied into the package or binding.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | config merge fixtures | settings are clobbered | install/uninstall round-trip preserves them |
| AC2-AC3 | hook matrix | duplicate or missing action is hidden | mapping and fallback are explicit |
| AC4 | conflict fixtures | competing workflow activates | installer blocks or scopes conflict |
| AC5-AC6 | conformance/privacy test | version/data omitted | evidence is versioned and sanitized |

## Plan

1. Resolve PMQ-005 from current official APIs and product policy.
2. Split installer and runtime mapping into child packets.
3. Add configuration round-trip and hook fixtures first.
4. Implement binding and run shared conformance.
5. Document fidelity and fallback.

## Stop Conditions

Stop if installation must clobber unknown configuration, a hook contract is unstable,
or native behavior cannot map to canonical toolkit operations.

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
