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

- The orchestrator coordinates work and does not edit product code. It owns workflow
  metadata and may edit the board and Task Packets to record observed state.
- One implementer owns one Task Packet, branch, worktree, and write-set.
- Parallel writers require isolated worktrees and disjoint write-sets.
- Reviewers are read-only and review a concrete head commit.
- Integration is serial and follows the configured human gates.
- Discover before broad reading; load on-demand context only when the task requires it.
- Explore repository evidence before asking. Ask one irreducible question at a time
  with a recommended answer.
- After a human correction, record a bounded learning proposal or explicitly classify
  it as one-off. Proposals never modify rules automatically.

## Evidence and Claims

- Worker, reviewer, and orchestrator reports are claims until backed by repository
  evidence.
- Workers may report evidence, but cannot approve their own work or declare a task
  reviewed, merged, or done.
- Reviewers independently inspect the diff and run the required checks on the exact
  head commit. They do not trust the worker summary as evidence.
- The orchestrator verifies role outputs, records state transitions, and rejects
  incomplete or contradictory handoffs.
- Only the human merge gate authorizes merge. `done` is recorded only after the
  merged commit exists and verification passes on that exact integrated commit.
- A command failing for the wrong reason is not evidence. Negative tests must assert
  the intended boundary, error, and absence of partial side effects.
- For behavior changes and bug fixes, run the declared baseline before editing. If it
  does not reach the expected behavioral oracle because of infrastructure,
  dependency, configuration, compilation, permission, or harness failure, record
  `Initial evidence result: blocked-invalid-baseline` and stop.
- Do not edit product code, tests, dependencies, configuration, or scripts to
  manufacture a valid red. Only repair the baseline when the approved Task Packet
  explicitly scopes that repair.
- A later focused test cannot retroactively satisfy the test-first gate after an
  invalid baseline. Resume implementation only after the declared baseline reaches
  the intended failure, or after the task is reclassified and approved with honest
  evidence.
- The reported next action must directly address the observed baseline failure. Do
  not introduce unrelated tools, setup, or repository changes.
- Characterization or hardening work may begin with passing tests when behavior
  already exists. Record that classification explicitly; never claim an artificial
  red phase.
- Evidence uses the exact tokens and fields defined by the Task Packet template.
  Synonyms, prose-only claims, and omitted commands do not satisfy a gate.
- Every handoff starts with a plain-language human summary: outcome, concrete changes,
  verification meaning, remaining work, and the next gate. Avoid unexplained internal
  jargon. The machine-evidence block follows and supports every summary claim.
- Respond in the language of the latest human request. Preserve exact identifiers,
  commands, paths, and quoted text when translation would change their meaning. Do
  not switch or mix languages unless the human asks.
- Be direct and evidence-calibrated. Separate observed facts, inferences, and
  unverified claims. State failed or unrun checks and material limitations.
- Do not flatter, reassure, or agree merely to be pleasant. Challenge an incorrect,
  risky, or unsupported premise clearly and explain the technical reason.

## State Transitions

`deferred/planned -> ready -> active -> review -> reviewed -> done`

- `ready`: decisions are resolved; work is not yet assigned.
- `active`: the orchestrator recorded owner, exact base commit, branch, and worktree.
- `review`: implementation evidence exists for one exact verified head.
- `reviewed`: an independent reviewer approved that same exact head.
- `done`: the human merge gate completed and the exact merged commit passed verify.

No role may skip a state or use a synonym such as "finished" to bypass its evidence
requirements.

Feedback transitions are explicit: `review -> active` when changes are requested,
and `reviewed -> active` when the approved head changes. `done` is terminal. Reopened
product decisions move the task to `planned`; they are never resolved by a worker.

## Final Report

Use the Task Packet's `Human Summary` in the final response. State what changed in
user-visible terms, name important files or behaviors, explain what verification
proved, disclose anything incomplete, and identify the next authority. Do not say
only "completed", paste raw command output, or make the human reconstruct the result
from SHAs. Use the recorded `Response language`. Never present an inference as an
observed result.

## Git and Merge

- Base branch: `main`
- Workers do not merge their own changes.
- Never bypass hooks, verification, or human gates.

## Stop Conditions

Stop when scope must expand, a dependency is missing, a write-set overlaps another
writer, a gate must be weakened, documentation impact is unresolved, an assumption
lacks evidence, or repository state contradicts the Task Packet.
