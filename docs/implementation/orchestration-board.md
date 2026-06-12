# Orchestration Board

This board is the durable source of workflow state. Update it when task state,
ownership, dependencies, or reviewed commits change.

## Tasks

| ID | Objective | Depends on | State | Owner | Branch | Worktree | Write-set | Base commit | Head commit |
|---|---|---|---|---|---|---|---|---|---|
| TASK-001 | Add profile-aware local persistence and safe project binding | none | planned | unassigned | - | - | profile, storage, CLI, tests, docs | `a853a7a` | - |
| TASK-002 | Add secure multi-machine profile synchronization | TASK-001 | planned | unassigned | - | - | sync protocol, transports, crypto, tests, docs | `313fcd6` | - |

## Ready

No tasks are ready.

## Blocked

No tasks are blocked.

## Exclusive Resources

No exclusive resources are assigned.

## Merge Queue

The merge queue is empty.
