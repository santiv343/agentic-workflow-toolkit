# Orchestration Board

This board is the durable source of workflow state. Update it when task state,
ownership, dependencies, or reviewed commits change.

## Tasks

| ID | Objective | Depends on | State | Owner | Branch | Worktree | Write-set | Base commit | Head commit |
|---|---|---|---|---|---|---|---|---|---|
| TASK-001 | Add profile-aware local persistence and safe project binding | TASK-009 | planned | unassigned | - | - | profile, storage, CLI, tests, docs | `a853a7a` | - |
| TASK-002 | Add portable multi-machine profile synchronization | TASK-001 | planned | unassigned | - | - | sync protocol, transports, merge, tests, docs | `313fcd6` | - |
| TASK-003 | Add normalized event core and conformance evidence | TASK-009 | planned | unassigned | - | - | core protocol, schemas, conformance, evidence | - | - |
| TASK-004 | Add portable skill registry and resolver | TASK-003 | planned | unassigned | - | - | skill discovery, precedence, conflicts, tests | - | - |
| TASK-005 | Add universal MCP interface | TASK-001, TASK-003, TASK-004 | planned | unassigned | - | - | MCP server, tools, tests, docs | - | - |
| TASK-006 | Add native OpenCode adapter | TASK-003, TASK-004, TASK-005 | planned | unassigned | - | - | OpenCode binding, hooks, conformance | - | - |
| TASK-007 | Add native Codex adapter | TASK-003, TASK-004, TASK-005 | planned | unassigned | - | - | Codex plugin, hooks, conformance | - | - |
| TASK-008 | Add native Claude Code adapter | TASK-003, TASK-004, TASK-005 | planned | unassigned | - | - | Claude plugin, hooks, conformance | - | - |
| TASK-009 | Harden toolkit quality baseline | none | planned | unassigned | - | - | TypeScript, lint, build, architecture, package | `f785a1d` | - |

## Ready

No tasks are ready.

## Blocked

No tasks are blocked.

## Exclusive Resources

No exclusive resources are assigned.

## Merge Queue

The merge queue is empty.
