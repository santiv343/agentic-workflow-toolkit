# Task Packet: TASK-002 - Secure Multi-Machine Sync

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: `313fcd6`
- Worker branch:
- Worktree:
- Dependencies: TASK-001

## Mission

Synchronize authorized profile data between machines without copying SQLite files,
mixing profiles, or requiring the toolkit core to depend on one remote provider.

## Scope

Included:

- versioned sync protocol over logical records and tombstones;
- profile and device identity;
- end-to-end protection and transport abstraction;
- offline operation and deterministic conflict handling;
- explicit enrollment, revocation, status, pause, resume, and reset;
- conformance tests for each transport.

Excluded:

- sharing an active SQLite file;
- implicit cross-profile sync;
- automatic enrollment based on account, hostname, remote, or repository;
- using backup as synchronization;
- weakening local data-class, retention, or managed policies.

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

## Open Questions

- What metadata may the transport observe?
- How are costs, quotas, retries, and offline backlogs bounded?

## Documentation Impact

- Update: `README.md`, `CHANGELOG.md`, command help, security model, and transport
  conformance documentation.
- Reason: sync introduces network, cryptographic, recovery, and conflict semantics.

## Acceptance Criteria

1. Sync never copies or opens a remote SQLite database.
2. A device cannot sync until explicitly enrolled into one profile.
3. Local policy filters every outgoing and incoming record.
4. Revocation prevents future synchronization without deleting unrelated profiles.
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

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | transport integration | DB file is transferred | only protocol envelopes move |
| AC2 | unenrolled device | data is accepted | enrollment is required |
| AC3 | policy mismatch | denied class crosses boundary | record is filtered or rejected |
| AC4 | revoked device | sync continues | credentials and cursor are rejected |
| AC5 | concurrent offline edits | nondeterministic winner | deterministic merge or conflict |
| AC6 | alternate transport | domain changes | same protocol contract passes |
| AC7 | work preset | sync starts implicitly | explicit approved policy is required |
| AC8 | bundle replay and branching | duplicate records appear | stable IDs deduplicate and converge |
| AC9 | file/cloud conformance | transports change semantics | both pass the same protocol suite |
| AC10 | plaintext threat model | UI implies protected data | every surface reports `protection: none` |
| AC11 | lost or deleted bundle | pending local changes vanish | outbox can create a replacement bundle |
| AC12 | concurrent field edits | one variant disappears | safe fields merge and conflicting values persist |
| AC13 | delete/policy/pin races | wall clock selects a winner | causal and restrictive rules converge |

## Plan

1. Resolve every open question and move this packet to `ready`.
2. Specify protocol and threat model.
3. Add failing protocol, policy, crypto, and convergence tests.
4. Implement a transport-neutral sync engine.
5. Implement the selected first transport.
6. Add enrollment, status, recovery, and revocation CLI flows.
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
