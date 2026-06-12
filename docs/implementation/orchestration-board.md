# Orchestration Board

This board is the durable source of workflow state. `docs/MVP.md` defines the current
release boundary. Post-MVP rows preserve sequencing but do not block the MVP.

Allowed states are `deferred`, `planned`, `ready`, `active`, `review`, `reviewed`, and
`done`. Reports from agents do not change state by themselves; the orchestrator
records transitions only after checking the required Task Packet evidence.

## Tasks

| ID | Phase | Kind | Objective | Depends on | State | Owner | Branch | Worktree | Write-set | Base commit | Head commit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TASK-011 | MVP | slice | Harden and dogfood the existing portable CLI journey | none | ready | unassigned | - | - | tests, fixtures, package/docs fixes | set at dispatch | - |
| TASK-009 | Foundation | epic | Migrate to strict TypeScript and enforce target boundaries | TASK-011 | planned | unassigned | - | - | toolchain, source, tests, schemas, package | set at dispatch | - |
| TASK-003 | Foundation | epic | Add normalized host events and conformance evidence | TASK-009 | planned | unassigned | - | - | event core, schemas, conformance | set at dispatch | - |
| TASK-001 | Local runtime | epic | Add profiles, local persistence, memory policy, and safe binding | TASK-009 | planned | unassigned | - | - | profile, storage, CLI, tests, docs | set at dispatch | - |
| TASK-004 | Local runtime | epic | Add portable skill discovery and conflict resolution | TASK-003 | planned | unassigned | - | - | skills, resolver, tests, docs | set at dispatch | - |
| TASK-013 | Local runtime | epic | Add pluggable episodic-memory provider contracts | TASK-001, TASK-003 | planned | unassigned | - | - | memory ports, adapters, tests, docs | set at dispatch | - |
| TASK-005 | Universal interface | epic | Add a provider-neutral MCP interface | TASK-003, TASK-004 | planned | unassigned | - | - | MCP server, tools, tests, docs | set at dispatch | - |
| TASK-006 | Native adapter | epic | Add an OpenCode adapter | TASK-003, TASK-004, TASK-005 | planned | unassigned | - | - | OpenCode binding, hooks, conformance | set at dispatch | - |
| TASK-007 | Native adapter | epic | Add a Codex adapter | TASK-003, TASK-004, TASK-005 | planned | unassigned | - | - | Codex plugin, hooks, conformance | set at dispatch | - |
| TASK-008 | Native adapter | epic | Add a Claude Code adapter | TASK-003, TASK-004, TASK-005 | planned | unassigned | - | - | Claude binding, hooks, conformance | set at dispatch | - |
| TASK-014 | Native adapter | epic | Add a Pi adapter when native fidelity is justified | TASK-003, TASK-004, TASK-005 | deferred | unassigned | - | - | Pi extension, hooks, conformance | set at dispatch | - |
| TASK-010 | Operations | epic | Add telemetry, evidence durability, and security audit | TASK-001, TASK-003 | deferred | unassigned | - | - | telemetry, JSONL, audit, OTel | set at dispatch | - |
| TASK-002 | Portability | epic | Add plaintext portable multi-machine synchronization | TASK-001 | deferred | unassigned | - | - | sync protocol, file transport, tests | set at dispatch | - |
| TASK-015 | Portability | epic | Add a protected remote or cloud sync transport | TASK-002 | deferred | unassigned | - | - | remote transport, security, conformance | set at dispatch | - |

## Ready

- `TASK-011` is the only MVP task and the only packet currently eligible for dispatch.

## Blocked

- Post-MVP tasks are intentionally unscheduled.
- Tasks with entries in `docs/implementation/post-mvp-questions.md` cannot move to
  `ready` until those entries are resolved.
- Every row whose `Kind` is `epic` must be decomposed according to
  `docs/implementation/tasks/README.md` before workers receive it.

## Exclusive Resources

No exclusive resources are assigned.

## Merge Queue

The merge queue is empty.
