# Task Packet: TASK-005 - Universal MCP Interface

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-003, TASK-004

## Mission

Expose toolkit operations through a provider-neutral MCP server while preserving the
same authority, validation, failures, and evidence as the CLI.

## Scope

Included:

- MCP lifecycle and transport composition;
- read-only tools for status, brief, context, grill, skills, and diagnostics;
- approved mutating tools after explicit authorization policy;
- shared application use cases rather than duplicated command logic;
- schemas, limits, cancellation, errors, and conformance tests.

Excluded:

- hosted control plane or mandatory remote service;
- host-specific plugin installation;
- bypassing repository commands, human gates, or profile policy;
- exposing raw memory, secrets, or unrestricted filesystem access.

## Ownership

- Write-set: MCP interface adapter, composition, schemas, tests, usage docs
- Read-set: TASK-003 events/results, TASK-004 resolver, public application use cases
- Forbidden-set: domain-policy duplication, native host adapters, provider credentials
- Exclusive resources: MCP tool namespace and transport contract

## Context Route

### Required

- `AGENTS.md`
- `docs/architecture.md`
- `docs/implementation/post-mvp-questions.md`
- integrated TASK-003 and TASK-004 public contracts

### On demand

- official MCP specification and SDK documentation current at dispatch
- CLI adapter mappings for equivalent use cases
- profile authorization contracts if integrated

### Discovery

- reusable application operations behind current commands
- cancellation and structured-error boundaries

### Do not preload

- native host plugin internals
- unrelated storage adapters
- remote observability SDKs

## Decisions

- Decision: MCP is an inbound adapter over shared application use cases.
  - Evidence: duplicating command logic would create divergent authority and errors.
- Decision: begin with read-only tools and add mutations only after policy resolution.
  - Evidence: MCP transport does not itself establish authorization.
- Decision: every tool has bounded schemas, cancellation, and structured failures.
  - Evidence: MCP inputs are external untrusted contracts.

## Open Questions

- `PMQ-004`: allowed mutations, transports, and required authorization context.

## Assumptions

- Assumption: normalized events and skill resolution are stable before MCP publication.
  - Evidence: TASK-005 depends on TASK-003 and TASK-004.

## Documentation Impact

- Update: MCP installation, tool reference, security model, capability matrix, changelog
- Reason: external hosts need a stable interoperability contract.

## Acceptance Criteria

1. CLI and MCP invoke the same application behavior and produce equivalent results.
2. Tool inputs and outputs are versioned, bounded, and validated.
3. Read-only tools cannot mutate repository or profile state.
4. Mutations cannot run without the approved authorization and confirmation policy.
5. Cancellation and disconnects release resources deterministically.
6. Unsupported capabilities are explicit and preserve CLI fallback.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | CLI/MCP golden fixture | outputs diverge | semantic results match |
| AC2-AC3 | malformed/read-only fixture | invalid or mutating call passes | boundary rejects it |
| AC4 | authorization matrix | mutation bypasses gate | policy blocks or confirms |
| AC5-AC6 | disconnect/partial-host fixture | leak or false support | cleanup and fallback are explicit |

## Plan

1. Resolve PMQ-004.
2. Decompose read-only server and mutation support into separate child packets.
3. Add read-only contract tests before server implementation.
4. Add authorized mutations only after independent review.
5. Run MCP and package conformance verification.

## Stop Conditions

Stop if MCP creates new authority, exposes unrestricted content, or a mutation lacks
an explicit authorization and evidence contract.

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
