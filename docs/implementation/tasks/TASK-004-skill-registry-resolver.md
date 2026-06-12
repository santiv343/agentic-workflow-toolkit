# Task Packet: TASK-004 - Portable Skill Registry and Resolver

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-003

## Mission

Discover skill metadata from approved roots and deterministically select the smallest
compatible set for a Task Packet without loading every skill body or creating a second
workflow authority.

## Scope

Included:

- portable skill metadata contract and registry;
- project/global precedence, aliases, requirements, writes, and conflicts;
- task-aware resolution and exact-path output;
- lazy body loading and capability evidence;
- deterministic diagnostics and conformance fixtures.

Excluded:

- distributing or installing third-party skills;
- executing skill instructions;
- replacing Task Packets, board state, verification, or host permissions;
- scanning unapproved user directories.

## Ownership

- Write-set: skill contracts, discovery/resolution modules, schemas, fixtures, CLI/API,
  tests, docs
- Read-set: normalized capability contracts and project workflow configuration
- Forbidden-set: third-party skill bodies, native adapter code, profile DB internals
- Exclusive resources: skill metadata schema and precedence algorithm

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated TASK-003 capability contracts
- Knowledge Hub skills and conflict rules

### On demand

- workflow schema and Task Packet parser
- profile-approved roots after TASK-001
- representative skill metadata fixtures

### Discovery

- existing project and global skill conventions
- Task Packet fields available for required/optional/forbidden skills

### Do not preload

- all installed skill bodies
- unrelated host configuration
- consumer project source

## Decisions

- Decision: index metadata and exact paths, then load selected bodies on demand.
  - Evidence: context efficiency requires progressive disclosure.
- Decision: local project skills outrank compatible global duplicates.
  - Evidence: project authority and stack specificity are higher precedence.
- Decision: lifecycle skills map outputs to canonical toolkit artifacts.
  - Evidence: parallel boards, specs, or done definitions create conflicting authority.

## Open Questions

- `PMQ-003`: approved automatic and explicitly enrolled discovery roots.

## Assumptions

- Assumption: normalized capability reporting exists before resolver integration.
  - Evidence: TASK-004 depends on TASK-003.

## Documentation Impact

- Update: skill metadata reference, conflict policy, CLI/API usage, changelog
- Reason: users need observable precedence and conflict behavior.

## Acceptance Criteria

1. Discovery remains inside approved roots and reads metadata before bodies.
2. Resolution is deterministic for local/global duplicates and aliases.
3. Conflicting lifecycle or write-set behavior blocks selection visibly.
4. Workers receive only selected exact paths and declared fallbacks.
5. Registry output records source and validated version without copying skill bodies.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | root escape fixture | outside skill is indexed | discovery rejects escape |
| AC2 | duplicate matrix | order changes result | precedence is stable |
| AC3 | conflict fixture | competing workflow loads | resolver blocks with reason |
| AC4-AC5 | context snapshot | all bodies are loaded | only selected paths are returned |

## Plan

1. Resolve PMQ-003.
2. Decompose into registry and resolver child packets.
3. Implement failing discovery and precedence fixtures.
4. Implement conflict and context-budget tests.
5. Integrate status output and documentation.

## Stop Conditions

Stop if discovery scans arbitrary roots, the resolver executes skills, or a selected
skill can override canonical project authority.

## Definition of Done

- [ ] Epic was decomposed before dispatch.
- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
