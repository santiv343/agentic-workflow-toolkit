# Task Packet: TASK-007 - Native Codex Adapter

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-003, TASK-004, TASK-005

## Mission

Integrate supported Codex plugin, skill, and session surfaces with the portable
workflow while preserving repository authority and existing user customization.

## Scope

Included:

- versioned Codex plugin/binding installation and removal;
- supported session-start, resume, compaction, permission, and tool integration;
- normalized event and operation mapping;
- coexistence checks for global/project skills and plugins;
- capability report, fallback, and conformance tests.

Excluded:

- changing Codex itself or depending on undocumented internals;
- duplicating toolkit workflow logic in prompts;
- silently replacing existing plugins or skills;
- model-specific behavior.

## Ownership

- Write-set: Codex plugin/binding, installer, fixtures, conformance tests, usage docs
- Read-set: TASK-003/004/005 contracts and current official Codex documentation
- Forbidden-set: unrelated adapters, user credentials, consumer repositories
- Exclusive resources: Codex plugin ID and compatibility matrix

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated normalized events, skills, and MCP contracts

### On demand

- official Codex plugin, skill, and session documentation current at dispatch
- representative configuration fixtures

### Discovery

- stable hooks and plugin lifecycle for supported Codex versions
- safe user/project installation and removal boundaries

### Do not preload

- other adapter source
- user conversations, memories, or full skill bodies

## Decisions

- Decision: repository `AGENTS.md` remains authoritative over plugin defaults.
  - Evidence: the host binding cannot redefine project policy.
- Decision: native support is claimed only for conformance-tested hooks.
  - Evidence: documentation or prompt presence alone does not prove execution.
- Decision: unsupported lifecycle events use CLI/MCP fallback.
  - Evidence: portability must survive host capability gaps.

## Open Questions

- `PMQ-006`: stable Codex surfaces and enforcement boundary for the first version.

## Assumptions

- Assumption: official integration surfaces can be detected and versioned.
  - Evidence: this must be verified before moving the packet to ready.

## Documentation Impact

- Update: Codex install/uninstall, compatibility, conflicts, fallback, changelog
- Reason: plugin adoption changes local behavior and supported fidelity.

## Acceptance Criteria

1. Installation is idempotent and does not overwrite unrelated Codex customization.
2. Supported lifecycle events invoke canonical toolkit operations exactly once.
3. Skill precedence and conflicts follow TASK-004.
4. Unsupported events degrade visibly to CLI/MCP fallback.
5. Conformance records the validated Codex version and observed evidence.
6. Uninstall removes only toolkit-owned artifacts.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1/AC6 | install round-trip | unrelated config changes | only owned artifacts change |
| AC2 | event fixtures | duplicate/divergent operation | canonical mapping executes once |
| AC3 | skill conflict fixture | precedence drifts | shared resolver decision holds |
| AC4-AC5 | reduced-host conformance | false native claim | fallback and evidence are explicit |

## Plan

1. Resolve PMQ-006 against current official docs.
2. Split installer and runtime mapping into child packets.
3. Add failing configuration and lifecycle fixtures.
4. Implement mapping and shared conformance.
5. Document supported and unsupported fidelity.

## Stop Conditions

Stop if support requires undocumented internals, overwriting foreign configuration, or
duplicating canonical workflow logic.

## Definition of Done

- [ ] Epic was decomposed before dispatch.
- [ ] Acceptance criteria demonstrated.
- [ ] Verification and host conformance passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
