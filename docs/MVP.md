# MVP Boundary

## Outcome

The MVP proves one portable workflow:

1. install the package in a repository;
2. initialize a small control plane;
3. validate its configuration;
4. route only the context required by one Task Packet;
5. block unresolved decisions before implementation;
6. re-anchor an agent after resume or compaction;
7. record a human correction as a reviewable learning proposal;
8. run the repository verification gate before handoff.

This outcome is delivered through the existing CLI, generated `AGENTS.md`, and
repository artifacts. Native hooks improve fidelity later; they are not required to
prove the workflow.

## Included

- `init`, `check`, `context`, `grill`, `brief`, `learn`, and `doctor`;
- idempotent repository bootstrap and dry-run;
- progressive context routing and byte budgets;
- Task Packet and orchestration-board templates;
- the universal `AGENTS.md` fallback for any agent CLI;
- package installation, public API, tests, and release documentation;
- one end-to-end dogfood journey from clean repository to reviewed handoff;
- explicit reporting of capabilities that remain advisory without native hooks.

## Excluded

The following are post-MVP:

- TypeScript migration and the target modular architecture;
- persistent profiles, SQLite memory, backup, and zero-footprint overlays;
- multi-machine or cloud synchronization;
- normalized host events and a conformance runtime;
- skill discovery and conflict resolution;
- MCP and native OpenCode, Codex, Claude Code, or Pi adapters;
- operational telemetry, durable audit, and OpenTelemetry export;
- external memory providers, managed policy distribution, and model routing.

The design for these capabilities is retained. It must not become an MVP dependency.

## Exit Criteria

The MVP is complete when `TASK-011` demonstrates:

- a packed artifact installs into a temporary repository;
- the documented user journey works only through public commands;
- failures are actionable and do not partially initialize a repository;
- `npm run verify` passes;
- package contents contain no private, machine-specific, or Knowledge Hub data;
- the current behavior and post-MVP limitations are documented honestly.

## Scope Rule

A change belongs in the MVP only when the user journey above cannot be completed
reliably without it. Architectural preparation for an unimplemented post-MVP feature
is not sufficient justification.
