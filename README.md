# Agentic Workflow Toolkit

A portable Node.js CLI and ESM package for bootstrapping and validating a repository
control plane for agentic work. It does not assume a programming language, build
system, hosting provider, repository name, or local filesystem layout.

The current release boundary is documented in [`docs/MVP.md`](docs/MVP.md). The
target architecture and post-MVP backlog are intentionally broader and do not block
the initial release.

## Requirements

- Node.js 22.13.0 or newer

Node 22.13.0 is the minimum because it provides `node:sqlite` without requiring an
experimental runtime flag. Planned profile persistence will remain behind a
toolkit-owned adapter so the rest of the package does not depend directly on SQLite
API details.

## Install

Until an npm release is published, install from GitHub:

```sh
npm install --save-dev github:santiv343/agentic-workflow-toolkit
```

After npm publication:

```sh
npm install --global agentic-workflow-toolkit
```

The package exposes the `agentic-workflow` executable.

Source and releases:
[github.com/santiv343/agentic-workflow-toolkit](https://github.com/santiv343/agentic-workflow-toolkit).

## Initialize

Start with no configuration:

```sh
agentic-workflow init
```

The CLI infers only values backed by repository evidence:

- base branch: remote default branch, one conventional local branch, or the current
  conventional branch;
- verification: an explicit `verify` package script with an unambiguous package
  manager, or a `verify` target in Make, Just, or Taskfile.

When either value is ambiguous or absent, the CLI stops and asks only for the missing
flag. Explicit values always override inference:

```sh
agentic-workflow init \
  --base-branch "<base branch>" \
  --verify-command "<project verification command>"
```

Options:

- `--cwd <path>` writes into another project directory.
- `--dry-run` reports planned files without changing the repository.
- `--force` replaces files managed by this toolkit.

Initialization is idempotent. Matching managed files are left unchanged. Without
`--force`, the command performs a complete preflight and writes nothing when a
managed destination exists with different content.

Generated files:

```text
AGENTS.md
.agentic/workflow.yaml
.agentic/workflow.schema.json
.agentic/learnings/README.md
.agentic/learnings/inbox/README.md
docs/implementation/orchestration-board.md
docs/implementation/tasks/README.md
docs/implementation/tasks/TASK.template.md
```

## Validate

```sh
agentic-workflow check
```

`check` reports errors for:

- invalid YAML or required configuration values;
- absolute, escaping, or missing canonical paths;
- unsafe parallel-writer settings and merge/review contradictions;
- probable credentials in files under `authority.bindings`.

Secret detection is defensive, not a replacement for a dedicated secret scanner.
Findings print only the file and line number, never the matched value.

## Route Context Efficiently

```sh
agentic-workflow context \
  --role implementer \
  --task docs/implementation/tasks/TASK-001.md
```

The command returns paths, status, and byte budgets. It does not inject file
contents. The Task Packet controls:

- required direct reads;
- on-demand references;
- structural discovery targets;
- paths that must not be preloaded.

Use `--json` when another orchestrator or CLI consumes the route.

## Grill Implicit Decisions

```sh
agentic-workflow grill \
  --task docs/implementation/tasks/TASK-001.md
```

The grill gate blocks executable Task Packets with unresolved questions,
placeholders, unsupported assumptions or decisions, and undocumented documentation
impact. Agents should investigate repository evidence first, then ask one irreducible
human question at a time with a recommended answer.

## Re-anchor Every Session

```sh
agentic-workflow brief \
  --role implementer \
  --task docs/implementation/tasks/TASK-001.md
```

Run the brief at session start, after compaction or resume, after handoff, and when the
role or Task Packet changes. It combines:

- a short invariant reminder;
- the progressive context route;
- pending learning proposals.

Tool-specific bindings should invoke this command automatically when their hook model
supports it. The universal fallback is the generated `AGENTS.md` session-start rule.

No text-only framework can guarantee that every model remembers every instruction on
every turn. The practical guarantee is layered: always-on contract, re-anchor brief,
role permissions, deterministic gates, and CI.

## Verify Completion Claims

The toolkit treats agent reports as claims, not authority. Task state follows:

```text
deferred/planned -> ready -> active -> review -> reviewed -> done
```

- the orchestrator records dispatch metadata before implementation;
- the worker hands off one exact head with verification and acceptance evidence;
- an independent reviewer reruns verification and approves that same exact head;
- the human merge gate authorizes integration;
- `done` requires verification on the exact merged commit.

`grill` rejects incomplete execution, review, or integration evidence. `check` also
rejects contradictions between the orchestration board and Task Packets.
Acceptance evidence must name every numbered criterion (`AC1`, `AC2`, ...) rather
than stating that the task was checked in general. Each mapping uses
`AC1: concrete evidence; AC2: concrete evidence`.

Evidence semantics are explicit. Behavior changes and bug fixes require a pre-change
failure or reproduction. Characterization, refactoring, and release hardening may
start from a passing baseline, but must state the regression oracle they add. A
command failing for an unrelated reason never counts as a red test. If the declared
baseline fails before reaching the expected behavioral oracle, the agent records
`blocked-invalid-baseline` and stops without changing implementation, tests,
dependencies, configuration, or scripts. Baseline repair must be explicitly scoped;
an alternate test added afterward cannot retroactively establish test-first evidence.

Every handoff has two layers. `Human Summary` explains the outcome, changes,
verification, remaining work, and next gate in plain language. `Machine Evidence`
records commands, exact commits, acceptance mappings, review, authorization, and
integration facts. A readable report cannot replace evidence, and raw evidence cannot
replace a readable report. The summary also records `Response language`, and the
agent answers in the language of the latest human request. It separately records
anything unverified or inferred so a confident tone cannot conceal an evidence gap.

Tone rules are part of the contract: be direct, do not flatter or agree
automatically, challenge unsupported premises, and never describe an inference as an
observed result. These semantic qualities require behavioral evaluation in addition
to deterministic field validation.

The MVP validates durable records, exact Git objects, commit ancestry, role
separation, and board/packet consistency. It does not cryptographically attest who
ran a command. CI or a trusted orchestrator must execute the recorded commands;
native host adapters may provide stronger attestations later.

## Learn From Corrections

The agent converts a correction into a bounded JSON candidate:

```json
{
  "id": "classify-artifact-owner",
  "correction": "Do not place cross-project methodology in the package.",
  "observedPattern": "Artifacts followed implementation proximity.",
  "generalizedRule": "Classify audience, owner, lifecycle, and authority before creating an artifact.",
  "scope": "methodology",
  "proposedOwner": "methodology-owner",
  "mechanism": "gate",
  "evidence": ["The artifacts have different maintainers and release cycles."],
  "limitations": ["Package-specific usage remains in the package."],
  "regression": "Package review confirms that methodology is linked, not copied."
}
```

Then:

```sh
agentic-workflow learn --from learning.json
```

The command validates and stores a proposal under `.agentic/learnings/inbox/`. It
never changes rules automatically. A reviewer promotes it into the correct owner:
project policy, tool binding, toolkit behavior, methodology, or no rule.

## Diagnose Tools

```sh
agentic-workflow doctor
agentic-workflow doctor --json
```

`doctor` inspects `PATH` and reports available runtimes, version control, package
managers, and common agent CLIs. It does not depend on `which`, `where`, or a
particular shell.

Detection proves only that a tool is installed and callable. Adoption requires a
project binding with a trigger, observable evidence, enforcement or warning behavior,
a fallback, and a conformance result for the validated version.

## Programmatic API

```js
import {
  checkWorkflow,
  buildContextRoute,
  buildBrief,
  detectProjectDefaults,
  diagnoseTools,
  auditTaskPacket,
  initWorkflow,
  recordLearningProposal,
} from 'agentic-workflow-toolkit';
```

- `initWorkflow(options)` generates the managed files.
- `detectProjectDefaults(cwd)` returns evidence-backed inferred values.
- `checkWorkflow(cwd)` returns parsed configuration and structured issues.
- `buildContextRoute(options)` returns progressive-disclosure paths and budgets.
- `auditTaskPacket(cwd, path)` returns grill blockers and recommended actions.
- `buildBrief(options)` returns the minimal re-anchor payload.
- `recordLearningProposal(cwd, path)` validates and stores a proposal.
- `diagnoseTools()` returns the portable CLI availability report.

## Upgrade Policy

- Patch releases fix behavior without changing generated contracts.
- Minor releases may add optional fields, checks, templates, or inference sources.
- Major releases may change required manifest fields or generated contract semantics.
- Run `agentic-workflow init --dry-run` before adopting a new version.
- Run `agentic-workflow check` in CI to prevent configuration drift.

The CLI never silently resolves ambiguous project decisions. Inference is a
convenience; repository evidence and explicit configuration remain authoritative.

## Development

```sh
npm ci
npm run verify
```

Tests use `node:test`, invoke the public executable, and isolate filesystem behavior
in temporary directories.

The broader methodology, pain catalog, established-practice references, and
cross-project maintenance guidance live separately in the
[Agentic Engineering Knowledge Hub](https://github.com/santiv343/knowledge-hub/tree/main/00-agentic-engineering).
