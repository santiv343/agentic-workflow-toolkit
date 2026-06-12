# Changelog

This project follows Semantic Versioning for its public CLI, generated file contract,
and programmatic API.

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
