# Task Packet: TASK-010 - Observability, Evidence, and Audit

## Metadata

- Status: deferred
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-001, TASK-003

## Mission

Provide structured, privacy-preserving operational telemetry, workflow evidence, and
security audit without coupling the core to a vendor, changing workflow decisions, or
mixing signals with different authority and durability requirements.

This is a post-MVP epic. It must be decomposed before dispatch and does not block
native adapters or the universal fallback.

## Scope

Included:

- separate typed ports and versioned schemas for telemetry, evidence, and audit;
- deterministic allowlist-based sanitization and correlation;
- machine-local profile-isolated NDJSON telemetry adapter;
- evidence and audit storage adapters over ports delivered by dependencies;
- optional OpenTelemetry logs, metrics, and trace-correlation adapter;
- buffering, rotation, retention, quota, health, shutdown, and failure behavior;
- status, inspect, and diagnostic interfaces with safe projections;
- conformance, privacy, fault-injection, cardinality, and cost tests.

Excluded:

- making telemetry authoritative;
- storing prompts, responses, transcripts, source, file contents, or raw tool
  payloads;
- using an LLM for redaction, sampling, classification, or incident decisions;
- requiring an OpenTelemetry SDK or remote collector for core operation;
- implementing a hosted observability backend;
- replacing the orchestration board, Task Packets, memory, or backup.

## Ownership

- Write-set: observability application ports, event schemas and generated artifacts,
  `src/infrastructure/observability/`, JSONL and OpenTelemetry adapters, evidence and
  audit adapters, composition wiring, focused tests, `README.md`, `CHANGELOG.md`
- Read-set: profile/policy/storage ports from TASK-001, normalized events and evidence
  contracts from TASK-003, architecture and schema contracts
- Forbidden-set: consumer repositories, remote provider credentials, product-domain
  analytics, raw memory content, unrelated adapters
- Exclusive resources: observability event namespace, signal schemas, local telemetry
  file layout, audit event taxonomy

## Context Route

### Required

- `AGENTS.md`
- `docs/architecture.md`
- `docs/implementation/tasks/TASK-001-profile-persistence.md`
- TASK-003 packet and integrated public contracts
- `docs/implementation/orchestration-board.md`

### On demand

- profile policy and storage implementations
- normalized event and conformance implementations
- composition root and lifecycle tests
- schema registry and generation scripts
- OpenTelemetry adapter documentation

### Discovery

- application ports available for storage, clock, identifiers, and lifecycle
- exact evidence records required by gates and conformance
- CLI/MCP/host status and diagnostic projection points
- profile policy representation for retention and export

### Do not preload

- consumer-project source code
- model prompts or responses
- full historical telemetry
- provider SDK internals before implementing the optional adapter

## Decisions

- Decision: keep operational telemetry, workflow evidence, and security audit as
  separate typed signals with independent ports, schemas, queues, and retention.
  - Evidence: approved option C and their different authority and durability needs.
- Decision: telemetry is never authoritative; workflow state remains in canonical
  project artifacts and profile state.
  - Evidence: dropping or disabling operational data must not change decisions.
- Decision: use versioned closed events under the `agentic.workflow.*` namespace.
  - Evidence: all CLI, MCP, host, JSONL, and OpenTelemetry mappings need one stable
    machine contract.
- Decision: construct event attributes from an allowlist and sanitize before any sink,
  repeating sink-boundary sanitization as defense in depth.
  - Evidence: denylist-only logging misses new fields and secrets.
- Decision: prohibit raw content, commands, paths, remotes, user identity, secrets,
  SQL, rejected values, stacks, and arbitrary metadata objects by default.
  - Evidence: observability must not become an ungoverned content store.
- Decision: use explicit operation and correlation IDs, optional trace/span IDs, and
  opaque scoped references.
  - Evidence: concurrency needs correlation without exposing local identity.
- Decision: keep metric dimensions fixed and low-cardinality.
  - Evidence: project, session, task, model, error-message, and path dimensions create
    unbounded cost and privacy risk.
- Decision: ship a local UTF-8 NDJSON operational telemetry adapter outside
  repositories and isolated by profile after selection.
  - Evidence: selected option C provides an inspectable free default compatible with
    zero-footprint operation.
- Decision: keep a machine-local metadata-only startup stream before profile
  selection.
  - Evidence: startup failures need diagnosis without guessing a profile.
- Decision: use bounded queues, sampling, and dropping only for operational telemetry,
  prioritizing warnings, errors, drop counters, and sink-health transitions.
  - Evidence: telemetry must not exhaust memory or block core work.
- Decision: never sample or silently drop workflow evidence or security audit.
  - Evidence: partial durable records would falsely imply complete evidence.
- Decision: make OpenTelemetry an optional infrastructure adapter over already
  sanitized events.
  - Evidence: the core remains provider-neutral and incurs no mandatory exporter cost.
- Decision: align the adapter with the stable OpenTelemetry Logs data model and use
  W3C Trace Context only at trusted interface boundaries.
  - Evidence: standard mappings preserve portability and correlation.
- Decision: disable remote export by default and require profile or managed policy to
  enable it.
  - Evidence: telemetry leaving the machine is a separate disclosure decision.
- Decision: derive metrics and spans from typed events rather than emitting another
  unrelated instrumentation model.
  - Evidence: one event contract avoids semantic drift between signals.
- Decision: make redaction, sampling, rotation, retention, quotas, and sink health
  deterministic and observable without LLM calls.
  - Evidence: safety and cost controls cannot depend on probabilistic decisions.
- Decision: prevent recursive sink-failure logging.
  - Evidence: an unavailable file or exporter must not create an infinite event loop.
- Decision: audit at least profile binding, overrides, policy, purge, restore,
  promotion/export, sync lifecycle, migrations, credential configuration, and
  observability-policy changes.
  - Evidence: these actions alter authority, retention, identity, or disclosure.

## Open Questions

- `PMQ-010`: failure behavior when required evidence or audit storage is unavailable.
- `PMQ-011`: acceptable remote observability destinations, disclosure, retention, and
  cost limits.

## Assumptions

- Assumption: TASK-001 provides profile-aware policy and storage ports usable without
  leaking SQLite.
  - Evidence: persistence is required before durable audit storage.
- Assumption: TASK-003 defines normalized workflow events and required evidence
  contracts without making an observability adapter authoritative.
  - Evidence: signal semantics must precede provider mappings.
- Assumption: operation context supplies clock, IDs, profile, project, task, session,
  authorization, and cancellation explicitly.
  - Evidence: TASK-009's Pure DI contract prohibits ambient request state.

## Documentation Impact

- Update: `docs/architecture.md`, `README.md`, `CHANGELOG.md`, command help, privacy
  model, profile policy reference, and adapter conformance documentation.
- Reason: observability introduces stored metadata, retention, export, diagnostics,
  and failure semantics.

## Acceptance Criteria

1. Telemetry, evidence, and audit cannot be substituted for one another.
2. Every event is schema-valid, versioned, bounded, and correlation-safe.
3. Canary secrets and prohibited content never reach JSONL, audit, evidence, or OTel.
4. Zero-footprint operation never writes observability data into the target repo.
5. Profile events remain isolated and profileless startup events contain metadata
   only.
6. Telemetry pressure is bounded and reports drops without recursive failure.
7. Evidence and audit are never sampled or silently discarded.
8. OTel export is optional, policy-enabled, and semantically equivalent to local
   events.
9. Metrics have fixed low-cardinality dimensions.
10. Rotation, retention, quotas, shutdown, and recovery are deterministic.
11. Sink failures follow the approved fail-open/fail-closed matrix.
12. Telemetry never alters a workflow, policy, authorization, or domain result.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | signal substitution fixtures | telemetry satisfies audit/evidence | separate ports reject substitution |
| AC2 | event schema/property tests | loose or oversized event passes | bounded versioned event validates |
| AC3 | secret and content canaries | prohibited value reaches a sink | every sink projection excludes it |
| AC4 | zero-footprint integration | repo status changes | all output remains external |
| AC5 | concurrent profile test | startup/profile data mixes | streams remain scoped |
| AC6 | queue pressure and sink outage | memory grows or recursion starts | bounded drop accounting |
| AC7 | evidence/audit pressure | required record disappears | approved durability behavior |
| AC8 | JSONL/OTel conformance | mappings disagree | equivalent stable semantics |
| AC9 | cardinality test | dynamic dimensions appear | fixed reviewed dimensions only |
| AC10 | rotation and shutdown faults | truncation or leak occurs | deterministic recovery and close |
| AC11 | sink failure matrix | action proceeds or blocks incorrectly | policy classification decides |
| AC12 | decision isolation | sink changes domain result | result remains identical |

## Plan

1. Resolve PMQ-010 and PMQ-011.
2. Add failing schemas, privacy canaries, signal-separation, and cardinality tests.
3. Add failing queue, rotation, shutdown, and sink-fault tests.
4. Implement typed ports, event builders, sanitization, and correlation.
5. Implement local profile-aware NDJSON telemetry.
6. Implement durable evidence and audit adapters.
7. Implement optional OpenTelemetry mapping and conformance tests.
8. Add status/inspect surfaces and policy controls.
9. Run complete verification and inspect packaged artifacts.

## Stop Conditions

Stop if a sink receives prohibited content, telemetry becomes authoritative, signals
share a lossy queue, remote export becomes implicit, metric cardinality is unbounded,
an adapter infers durability policy, or an unresolved failure class is embedded as a
default.

## Definition of Done

- [ ] Epic was decomposed before dispatch.
- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Diff stayed inside the write-set.
- [ ] Privacy canaries and fault injection passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
