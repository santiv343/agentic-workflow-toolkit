# Task Packet: TASK-ID - Title

## Metadata

- Status: ready
- Base branch: `main`
- Base commit:
- Worker branch:
- Worktree:
- Dependencies: none

## Mission

Describe the concrete problem and observable outcome.

## Scope

Included:

- Define included work.

Excluded:

- Define explicit exclusions.

## Ownership

- Write-set:
- Read-set:
- Forbidden-set:
- Exclusive resources:

## Context Route

Keep required context small. Load the rest only when evidence demands it.

### Required

- `path/to/direct-contract-or-reference`

### On demand

- `path/to/deeper-doc-or-directory`

### Discovery

- `symbol, route, schema, or relationship to locate before broad reading`

### Do not preload

- `archives, generated output, broad historical docs, unrelated subsystems`

## Decisions

- Decision: state the selected behavior or constraint.
  - Evidence: code, test, ADR, standard, or approved human decision.

## Open Questions

- none

## Assumptions

- Assumption: state only what execution depends on.
  - Evidence: identify the supporting source.

## Documentation Impact

- Update: `path/to/authoritative-doc.md`
- Reason: explain why it changes.

If no documentation changes:

- none - Reason: identify the authoritative docs reviewed and why they remain correct.

## Acceptance Criteria

1. Define a verifiable outcome.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | | | |

## Plan

1. Classify the work and record the required initial evidence.
2. For behavior changes or bug fixes, prove the intended failure. For
   characterization, hardening, documentation, or research, record the applicable
   passing baseline or deterministic review procedure.
3. If the declared baseline cannot reach the intended behavioral oracle, record
   `blocked-invalid-baseline` and stop without changing implementation, tests,
   dependencies, configuration, or scripts unless baseline repair is explicitly in
   scope.
4. Add the minimum scoped implementation or artifact change.
5. Run `npm run verify` on the exact handoff head.

## Stop Conditions

Stop if scope must expand, ownership overlaps, dependencies are stale, the declared
baseline fails before reaching its behavioral oracle, or a gate must be weakened.

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

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Diff stayed inside the write-set.
- [ ] Decisions and assumptions are evidence-backed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed or explicitly justified.
- [ ] Independent review recorded the reviewed head commit.
