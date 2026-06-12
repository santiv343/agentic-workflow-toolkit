# AGENTS.md

Read this file before acting. Local project rules override generic instructions and
tool defaults.

## Session Start

1. Run `agentic-workflow brief` for the assigned role and Task Packet.
2. Read only the returned bootstrap and required route.
3. Work only from an approved Task Packet that passes `agentic-workflow grill`.
4. Run the brief again after compaction, resume, handoff, or role change.

## Commands

- verify: `npm run verify`

## Repository Boundary

- This repository owns executable package code, schema, templates, tests, usage,
  security, contribution, changelog, and release mechanics.
- `docs/architecture.md` is the canonical dependency and module-boundary contract.
- Cross-project methodology, pain catalogs, practice references, and general learning
  live in the separate Knowledge Hub. Link to them; do not copy them here.
- Consumer-project architecture, domain policy, risk, and ownership never belong in
  this package.

## Agent Workflow

- The orchestrator coordinates work and does not edit product code.
- One implementer owns one Task Packet, branch, worktree, and write-set.
- Parallel writers require isolated worktrees and disjoint write-sets.
- Reviewers are read-only and review a concrete head commit.
- Integration is serial and follows the configured human gates.
- Discover before broad reading; load on-demand context only when the task requires it.
- Explore repository evidence before asking. Ask one irreducible question at a time
  with a recommended answer.
- After a human correction, record a bounded learning proposal or explicitly classify
  it as one-off. Proposals never modify rules automatically.

## Git and Merge

- Base branch: `main`
- Workers do not merge their own changes.
- Never bypass hooks, verification, or human gates.

## Stop Conditions

Stop when scope must expand, a dependency is missing, a write-set overlaps another
writer, a gate must be weakened, documentation impact is unresolved, an assumption
lacks evidence, or repository state contradicts the Task Packet.
