# Changelog

This project follows Semantic Versioning for its public CLI, generated file contract,
and programmatic API.

## Unreleased

- Add an explicit task state machine from planning through integrated completion.
- Require exact-SHA dispatch, execution, review, merge, and verification evidence for
  executable task states.
- Reject orchestration-board and Task Packet state contradictions.
- Distinguish red-first behavior changes from passing characterization and hardening
  baselines.
- Re-anchor agents with role-authority and completion-evidence invariants.
- Require readable, language-matched, evidence-calibrated handoffs that disclose
  unverified claims and the next human gate.
- Register a post-MVP behavioral evaluation suite for normal, ambiguous, adversarial,
  multilingual, and multi-agent scenarios.

## 0.4.0

- Require Node.js 22.13.0 or newer as the runtime baseline.
- Establish the built-in `node:sqlite` module as the baseline for planned
  profile-aware local persistence, isolated behind a toolkit-owned adapter.
- Avoid native third-party SQLite dependencies and their platform-specific install
  lifecycle.
- Add packed-artifact end-to-end integration test proving the complete MVP journey
  from an installed package in a clean repository.
- Add atomic initialization fixture verifying that conflicting managed files stop the
  preflight before any writes.
- Add package-content privacy inspection verifying no machine-specific paths,
  credentials, or Knowledge Hub artifacts ship in the published tarball.
- Add documentation assertion test verifying that README and MVP.md match the
  observable CLI behavior.

## 0.3.1

- Keep `doctor` provider-neutral by detecting agent hosts rather than specific memory
  products.

## 0.3.0

- Add `context` for role-specific progressive disclosure and context budgets.
- Add `grill` for unresolved questions, unsupported assumptions, decisions, and
  documentation impact.
- Add `brief` to re-anchor sessions after start, resume, compaction, or role changes.
- Add `learn` and a durable learning inbox for reviewed abstraction of corrections.
- Apply the grill gate automatically to task packets in executable states.
- Expand Task Packets with context routing and explicit decision records.
- Clarify that `doctor` detects availability but does not prove binding adoption or
  behavioral conformance.
- Detect Pi as an optional agent host.
- Keep cross-project methodology in the separate Knowledge Hub.

## 0.2.0

- Infer the base branch from Git when the evidence is unambiguous.
- Infer a declared `verify` command from package scripts, Make, Just, or Taskfile.
- Make repeated initialization idempotent when generated files still match.
- Add `--dry-run`.
- Keep explicit flags as overrides and require input when inference is ambiguous.

## 0.1.0

- Initial `init`, `check`, and `doctor` commands.
- Portable workflow manifest, schema, project contract, board, and Task Packet templates.
