# Task Packet: TASK-002 - Portable Multi-Machine Sync

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: `313fcd6`
- Worker branch:
- Worktree:
- Dependencies: TASK-001

## Mission

Synchronize policy-permitted profile data between machines without copying SQLite files,
mixing profiles, or requiring the toolkit core to depend on one remote provider.

## Scope

Included:

- versioned sync protocol over logical records and tombstones;
- profile and device identity;
- explicit plaintext threat model and transport abstraction;
- offline operation and deterministic conflict handling;
- explicit join, coordination cleanup, status, pause, resume, and reset;
- conformance tests for each transport.

Excluded:

- sharing an active SQLite file;
- implicit cross-profile sync;
- automatic enrollment based on account, hostname, remote, or repository;
- using backup as synchronization;
- weakening local data-class, retention, or managed policies.

## Ownership

- Write-set: `src/sync/`, sync-facing additions in `src/cli.js` and `src/index.js`,
  `test/sync*.test.js`, sync fixtures, `README.md`, `CHANGELOG.md`
- Read-set: profile and storage APIs delivered by TASK-001, existing CLI helpers,
  Knowledge Hub sync decisions
- Forbidden-set: consumer repositories, profile database internals outside public
  storage ports, unrelated templates, external CLI configuration
- Exclusive resources: sync protocol version, envelope schema, transport conformance
  contract

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/tasks/TASK-001-profile-persistence.md`
- `00-agentic-engineering/13-profiles-zero-footprint-and-portability.md` in the
  Knowledge Hub

### On demand

- profile storage ports implemented by TASK-001
- `src/cli.js`
- `src/index.js`
- `test/cli.test.js`
- `00-agentic-engineering/09-capability-adoption-and-memory.md` in the Knowledge Hub

### Discovery

- public profile record and policy interfaces
- CLI command dispatch and streaming filesystem helpers
- checksum and atomic-replacement facilities available in supported Node versions

### Do not preload

- consumer-project source code
- raw profile databases
- unrelated Knowledge Hub domains
- full historical conversations

## Decisions

- Decision: keep one local SQLite database per profile and machine.
  - Evidence: local operation and machine isolation remain required.
- Decision: synchronize logical, versioned changes rather than database files.
  - Evidence: SQLite WAL and network filesystems are not a portable sync protocol.
- Decision: keep transport replaceable and outside the memory domain.
  - Evidence: the toolkit must not depend on a specific vendor or CLI.
- Decision: never synchronize across profiles implicitly.
  - Evidence: personal and work isolation is a security boundary.
- Decision: select synchronized data by profile, project, and data class.
  - Evidence: approved option D provides useful continuity without broad implicit
    replication.
- Decision: enable portable profile configuration, session summaries, and episodic
  memory for `personal` by default.
  - Evidence: these are the approved personal continuity defaults.
- Decision: keep `work` and `restricted` sync disabled until approved policy enables
  it.
  - Evidence: organizational data must not leave a device implicitly.
- Decision: synchronize explicit pins, deletion tombstones, and portable policy
  changes, while excluding secrets, raw transcripts, tool payloads, content
  snapshots, backups, credentials, local bindings, and device-local paths.
  - Evidence: convergence requires lifecycle operations, but raw and machine-local
    data must remain excluded.
- Decision: apply the most restrictive intersection of sender and receiver policies.
  - Evidence: sync cannot expand what either endpoint is allowed to store.
- Decision: implement a versioned `.agentic-sync` file bundle as the first transport.
  - Evidence: the requested initial UX is to carry one file between machines and run
    one sync command.
- Decision: make `agentic-workflow sync <file>` preview and apply inbound changes,
  append pending local changes, deduplicate stable IDs, record acknowledgements, and
  atomically replace the bundle.
  - Evidence: one bidirectional command minimizes manual state while remaining
    recoverable.
- Decision: keep bundles transport-only and idempotent, never canonical state,
  database snapshots, or backups.
  - Evidence: replay and divergent file copies must converge without transferring
    SQLite.
- Decision: require future cloud transports to carry the same protocol envelopes.
  - Evidence: cloud adoption must not fork merge, policy, or memory semantics.
- Decision: ship the initial file transport without encryption, password, recovery
  code, or shared secret.
  - Evidence: the approved initial UX prioritizes a simple user-managed file
    transfer and accepts responsibility for how the file is shared.
- Decision: label the file transport `protection: none` and state that checksums
  detect accidental corruption but not intentional tampering.
  - Evidence: the implementation must not claim confidentiality or authenticity it
    does not provide.
- Decision: use random channel and device IDs only for routing, cursors,
  acknowledgements, and deduplication, not as credentials.
  - Evidence: identifiers without a secret cannot authenticate a device.
- Decision: make `sync join <file> --profile <profile>` an explicit local-consent
  flow with a preview of profile, channel, policy, projects, classes, and devices.
  - Evidence: a plaintext channel still requires deliberate local association.
- Decision: provide `forget-device` as coordination cleanup, not strong revocation.
  - Evidence: a holder of an old plaintext bundle cannot be cryptographically
    excluded.
- Decision: retain local outgoing changes until acknowledgement or explicit discard.
  - Evidence: losing the transport file must not delete unsynchronized local state.
- Decision: model encryption and authentication as optional transport capabilities
  that a future cloud or protected-file transport may require.
  - Evidence: adding protection later must not fork the sync protocol.
- Decision: assign each device a monotonic channel sequence and include causal
  context in every envelope.
  - Evidence: merge order must not depend on unsynchronized wall clocks.
- Decision: merge different entities and disjoint concurrent fields automatically;
  deduplicate equal concurrent values; preserve distinct same-field variants as an
  explicit conflict.
  - Evidence: approved option D automates safe cases without losing information.
- Decision: apply a tombstone only when it causally follows the revision it deletes;
  preserve concurrent delete-vs-update as a conflict.
  - Evidence: deletion must not erase an update it never observed.
- Decision: immediately enforce the most restrictive intersection of concurrent
  policy changes and require explicit resolution before any relaxation.
  - Evidence: synchronization cannot temporarily broaden permissions.
- Decision: merge concurrent pins using the shortest effective expiration, treating
  unpin as the more restrictive state.
  - Evidence: pins must not gain retention through concurrency.
- Decision: keep memory content append-oriented through revisions while allowing
  portable configuration to merge by field.
  - Evidence: immutable history reduces destructive content merges without making
    configuration unusable.
- Decision: resolve conflicts by creating a new envelope that references every
  variant and preserves them until acknowledgement and audit retention permit
  compaction.
  - Evidence: resolution must converge and remain auditable rather than deleting
    evidence immediately.
- Decision: never call an LLM to choose a sync winner.
  - Evidence: convergence must be deterministic, local, and cost-free.
- Decision: cap the active file bundle at 64 MiB and each serialized envelope at
  256 KiB.
  - Evidence: approved option D bounds portable transfer and parsing costs.
- Decision: reject oversized envelopes before outbox admission rather than silently
  fragmenting or promoting them into content snapshots.
  - Evidence: the data-class and per-record limits must remain enforceable.
- Decision: compact only acknowledged replaceable events while retaining pending
  events, open conflicts, required tombstones, and audit-retained resolutions.
  - Evidence: size reduction must not break convergence or lose unresolved data.
- Decision: create a policy-filtered logical snapshot and causal frontier when an
  active device can no longer replay retained history.
  - Evidence: an offline device needs a bounded rebase path without receiving a
    database backup.
- Decision: merge a recovery snapshot into the local profile rather than replacing
  the local database.
  - Evidence: non-synchronized local data and local policy remain authoritative.
- Decision: keep local outbox changes until acknowledgement or explicit previewed
  discard, using stable references where payload reconstruction is deterministic.
  - Evidence: transport loss and compaction must not lose local work or duplicate
    storage unnecessarily.
- Decision: allow a forgotten device to stop blocking compaction and require it to
  rebase from the current logical snapshot if it returns.
  - Evidence: abandoned devices cannot retain history forever.
- Decision: perform at most three bounded automatic retries per command and use
  temporary validation plus atomic replacement.
  - Evidence: failures should remain recoverable without infinite loops or partial
    bundles.
- Decision: never allow an implicitly unlimited bundle or envelope policy.
  - Evidence: every transport must expose bounded storage, retry, and future cost
    behavior.
- Decision: use UTF-8 NDJSON with one manifest line, streaming envelope lines, and a
  final trailer.
  - Evidence: the format remains portable and inspectable without requiring a
    64 MiB in-memory parse.
- Decision: include all technical metadata required for routing, causal merge,
  policy enforcement, schema compatibility, size accounting, and accidental
  corruption detection.
  - Evidence: metadata minimization cannot make safe application impossible.
- Decision: identify profile and project scopes with channel-scoped opaque sync IDs,
  never human names, remotes, paths, hostnames, users, CLIs, models, or providers.
  - Evidence: human identity does not participate in protocol convergence and would
    add unnecessary disclosure.
- Decision: include permitted plaintext payloads in envelopes and require an
  explicit `--show-payloads` option to display them through inspect.
  - Evidence: the selected transport is plaintext, but routine diagnostics should
    avoid printing content accidentally.
- Decision: keep project sync ID mappings local and quarantine envelopes for unknown
  project scopes until explicit mapping or exclusion.
  - Evidence: an unknown scope must never be guessed or applied to another project.
- Decision: acknowledge unknown-scope envelopes only after the user accepts, excludes,
  or maps the scope.
  - Evidence: transport compaction must not discard data the receiver has not
    deliberately handled.

## Open Questions

- none

## Assumptions

- Assumption: TASK-001 exposes storage and policy ports without leaking
  `node:sqlite` into the sync domain.
  - Evidence: TASK-001 requires SQLite to remain behind a toolkit-owned adapter.
- Assumption: supported filesystems can create a temporary sibling and replace the
  target file, or report that atomic replacement is unavailable.
  - Evidence: the accepted failure policy preserves the original bundle when safe
    replacement cannot be demonstrated.
- Assumption: users can transfer a plaintext file between machines for the first
  transport.
  - Evidence: this is the explicitly selected v1 sync workflow.
- Assumption: profile policy can classify outgoing and incoming records before the
  sync engine applies them.
  - Evidence: TASK-001 defines closed data classes and deny-by-default profile
    allowlists.

## Documentation Impact

- Update: `README.md`, `CHANGELOG.md`, command help, security model, and transport
  conformance documentation.
- Reason: sync introduces transport, threat-model, recovery, and conflict semantics.

## Acceptance Criteria

1. Sync never copies or opens a remote SQLite database.
2. A device cannot sync until explicitly joined to one local profile.
3. Local policy filters every outgoing and incoming record.
4. Forgetting a device stops it from blocking compaction and forces a rebase if it
   later returns, without claiming strong revocation.
5. Offline edits converge deterministically or surface an actionable conflict.
6. Transport replacement does not alter memory-domain APIs.
7. Work and restricted sync remain disabled unless policy explicitly enables them.
8. Reapplying or combining file bundles does not duplicate changes.
9. File and future cloud transports use the same versioned envelopes.
10. Plaintext transport behavior never claims encryption, authentication, or strong
    revocation.
11. Losing a bundle does not remove unacknowledged local changes.
12. Concurrent edits either merge safely or preserve every incompatible variant.
13. Deletes, policies, pins, and conflict resolutions converge without wall-clock
    winner selection.
14. Bundle and envelope limits trigger lossless compaction or an actionable failure.
15. Devices older than the causal frontier can rebase from a filtered logical
    snapshot without replacing local-only data.
16. Bundles contain every required protocol field without exposing unnecessary local
    identity metadata.
17. Unknown project scopes remain quarantined until explicitly resolved.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | transport integration | DB file is transferred | only protocol envelopes move |
| AC2 | unjoined device | data is accepted | explicit local join is required |
| AC3 | policy mismatch | denied class crosses boundary | record is filtered or rejected |
| AC4 | forgotten device | it blocks compaction or resumes stale history | it no longer blocks and must rebase |
| AC5 | concurrent offline edits | nondeterministic winner | deterministic merge or conflict |
| AC6 | alternate transport | domain changes | same protocol contract passes |
| AC7 | work preset | sync starts implicitly | explicit approved policy is required |
| AC8 | bundle replay and branching | duplicate records appear | stable IDs deduplicate and converge |
| AC9 | file/cloud conformance | transports change semantics | both pass the same protocol suite |
| AC10 | plaintext threat model | UI implies protected data | every surface reports `protection: none` |
| AC11 | lost or deleted bundle | pending local changes vanish | outbox can create a replacement bundle |
| AC12 | concurrent field edits | one variant disappears | safe fields merge and conflicting values persist |
| AC13 | delete/policy/pin races | wall clock selects a winner | causal and restrictive rules converge |
| AC14 | bundle pressure and failed compaction | pending events or original file disappear | original state survives or compacted bundle validates |
| AC15 | long-offline device | full DB copy or permanent failure | logical snapshot rebase converges under policy |
| AC16 | format and metadata validation | incomplete or local identity fields pass | required opaque fields pass and forbidden metadata is absent |
| AC17 | unknown project scope | envelope attaches heuristically | inbox blocks until explicit mapping or exclusion |

## Plan

1. Resolve every open question and move this packet to `ready`.
2. Specify protocol and threat model.
3. Add failing protocol, policy, failure-injection, and convergence tests.
4. Implement a transport-neutral sync engine.
5. Implement the selected first transport.
6. Add join, status, recovery, and coordination-cleanup CLI flows.
7. Run conformance and failure-injection tests.

## Stop Conditions

Stop if the design copies SQLite, exposes cross-profile data, depends normatively on
one provider, hides a conflict, weakens policy, or lacks a recovery path.

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Threat model and protocol are documented.
- [ ] Open Questions is `none`.
- [ ] Transport conformance passed.
- [ ] Independent review recorded the reviewed head commit.
