# Task Packet: TASK-001 - Profile-Aware Local Persistence

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: `a853a7abd1d4950126f7b104b04b74ec1d92c604`
- Worker branch:
- Worktree:
- Dependencies: none

## Mission

Add machine-local profiles, safe project-to-profile binding, and local persistence
without writing toolkit artifacts into repositories using zero-footprint mode.

## Scope

Included:

- profile lifecycle and selection;
- project fingerprinting and local binding;
- SQLite adapter, schema, and migrations;
- managed, zero-footprint, and disabled repository modes;
- observable status and safe failure behavior;
- profile isolation, purge, and retention required by the accepted policy.

Excluded:

- implicit synchronization between machines;
- network filesystem access to an active SQLite database;
- remote memory providers;
- automatic promotion of memory into project rules;
- inference of personal or work identity from directory names, accounts, CLIs, or
  models.

## Ownership

- Write-set: `src/profile*.js`, `src/storage/`, `src/cli.js`, `src/index.js`,
  `test/profile*.test.js`, `test/cli.test.js`, `README.md`, `CHANGELOG.md`
- Read-set: `package.json`, existing CLI and test helpers, Knowledge Hub profile and
  memory decisions
- Forbidden-set: consumer repositories, external CLI configuration, unrelated
  generated templates
- Exclusive resources: profile schema and migration version

## Context Route

### Required

- `AGENTS.md`
- `docs/architecture.md`
- `README.md`
- `docs/implementation/orchestration-board.md`
- `00-agentic-engineering/13-profiles-zero-footprint-and-portability.md` in the
  Knowledge Hub

### On demand

- `00-agentic-engineering/09-capability-adoption-and-memory.md` in the Knowledge Hub
- `src/cli.js`
- `src/detect.js`
- `test/cli.test.js`

### Discovery

- CLI command dispatch and option parsing
- platform-specific user data paths
- Git remote and worktree identity

### Do not preload

- consumer-project source code
- unrelated Knowledge Hub domains
- full historical conversations

## Decisions

- Decision: require Node.js `>=22.13.0` and use built-in `node:sqlite`.
  - Evidence: approved runtime baseline in release `v0.4.0`.
- Decision: encapsulate SQLite behind a toolkit-owned adapter.
  - Evidence: storage must remain replaceable and must not leak runtime APIs into the
    profile or memory domain.
- Decision: keep one memory database per profile and machine outside repositories.
  - Evidence: accepted isolation and zero-footprint policy.
- Decision: bind a project fingerprint to a profile explicitly on first attach.
  - Evidence: approved option C in the profile-selection grill.
- Decision: select profiles in this order: `--profile`, environment override, exact
  local binding, otherwise stop and ask.
  - Evidence: explicit overrides are intentional; heuristic or stale global selection
    can contaminate work and personal contexts.
- Decision: an override applies only to its invocation and does not silently rewrite
  the stored binding.
  - Evidence: persistent identity changes require an explicit rebind operation.
- Decision: never fall back to the last active profile or infer identity from path,
  account, CLI, model, or repository name.
  - Evidence: those signals are not reliable security boundaries.
- Decision: store profile routing in one machine-local global `registry.db`.
  - Evidence: routing must be resolved before a private profile database can be
    selected, without scanning every profile or writing into the repository.
- Decision: limit the registry to opaque profile identity, hashed fingerprint
  identity, exact bindings, repository mode, schema state, timestamps, and binding
  provenance.
  - Evidence: a global routing index must not become shared memory or expose project
    content across profile boundaries.
- Decision: derive private database locations from opaque profile IDs instead of
  storing externally controlled paths.
  - Evidence: deterministic locations reduce path traversal and accidental
    cross-profile access.
- Decision: fail closed for persistence when the registry is missing, corrupt, or
  migration-incompatible.
  - Evidence: scanning profile databases or guessing a binding would weaken the
    selected isolation policy.
- Decision: require every persisted record to use a closed, versioned data class.
  - Evidence: generic blobs prevent enforceable retention, sanitization, and profile
    policy.
- Decision: support `operational_metadata`, `artifact_reference`,
  `session_summary`, `episodic_memory`, `learning_candidate`, `raw_transcript`,
  `tool_payload`, and `content_snapshot` as explicit classes.
  - Evidence: these separate technical routing and bounded memory from high-risk raw
    content.
- Decision: use deny-by-default profile allowlists, with deny taking precedence and
  unknown classes rejected.
  - Evidence: adapters must not expand persistence through omission or fallback.
- Decision: prohibit secrets and credentials without override, regardless of class.
  - Evidence: a class label cannot make credential storage safe.
- Decision: classify, validate, scan, sanitize, revalidate, then persist.
  - Evidence: sanitization must happen before durable storage and its output must
    still satisfy the policy.
- Decision: provide conservative `personal`, `work`, `restricted`, and `disabled`
  presets.
  - Evidence: selected option D combines explicit classes with usable defaults while
    allowing stricter project or organizational policy.
- Decision: enable metadata, summaries, and episodic memory for `personal`; metadata
  and sanitized summaries for `work`; content-free metadata for `restricted`; and no
  persistence for `disabled`.
  - Evidence: these are the approved defaults; artifact references and learning
    candidates remain explicit opt-ins.
- Decision: disable raw transcripts, full tool payloads, and content snapshots in
  every preset.
  - Evidence: their privacy, security, storage, and retention costs require explicit
    opt-in rather than an implicit default.
- Decision: combine TTL per data class, a total profile quota, LRU eviction under
  quota pressure, and explicit pins.
  - Evidence: selected option D bounds age and disk usage without discarding
    intentionally preserved records.
- Decision: calculate expiry from the effective write policy and never extend TTL on
  read.
  - Evidence: access frequency must not silently turn temporary data into permanent
    storage.
- Decision: purge managed hard-limit violations first, then expired unpinned records,
  then unpinned LRU records until the profile is within quota.
  - Evidence: managed policy is authoritative and ordinary cleanup should preserve
    explicit pins.
- Decision: require each pin to identify a record, actor, reason, and policy-bounded
  effective expiration; the caller may request an earlier expiration.
  - Evidence: pins are policy exceptions that must remain bounded and auditable.
- Decision: allow non-expiring pins only through explicit managed policy, never in
  built-in presets.
  - Evidence: an omitted caller expiration must not create hidden indefinite
    retention.
- Decision: pins do not override prohibited content, managed maxima, explicit purge,
  or secret-incident response.
  - Evidence: preservation intent cannot weaken security or organizational policy.
- Decision: reject new writes when pinned records consume the available quota rather
  than silently deleting or unpinning them.
  - Evidence: destructive conflict resolution requires an explicit human or managed
    policy decision.
- Decision: run bounded maintenance on profile open, near-quota writes, and an
  explicit maintenance command without requiring an LLM or daemon.
  - Evidence: retention behavior should be portable, deterministic, and observable.
- Decision: use conservative built-in quotas of 128 MiB for `personal`, 32 MiB for
  `work`, 4 MiB for `restricted`, and 0 MiB for `disabled`.
  - Evidence: approved option B provides bounded useful storage without making local
    memory operationally heavy.
- Decision: use built-in TTLs of 30/180/365 days for personal metadata, summaries,
  and episodic memory; 14/30 days for work metadata and summaries; and 7 days for
  restricted metadata.
  - Evidence: these are the approved conservative class defaults.
- Decision: cap pins at 365 days for `personal`, 90 days for `work`, and disable pins
  for `restricted` and `disabled`.
  - Evidence: pins remain bounded in every built-in preset.
- Decision: require opt-in classes to declare TTL, per-record size, and quota budget
  explicitly rather than inheriting a hidden default.
  - Evidence: enabling a new data class must expose its retention cost.
- Decision: define MiB as 1,048,576 bytes and enforce quota using logical persisted
  bytes, while reporting SQLite file, WAL, temporary, and backup sizes separately.
  - Evidence: physical SQLite size includes implementation overhead and free pages,
    so it is not a stable admission-control metric.
- Decision: require a preview and explicit conflict decision before applying a preset
  change to existing data.
  - Evidence: preset changes must not silently delete, reclassify, or grandfather
    records that violate the new policy.
- Decision: keep three automatic `registry.db` snapshots after migrations or binding
  changes.
  - Evidence: registry recovery is small and critical to profile routing.
- Decision: enable consistent local backups for `personal` when data changed, keeping
  seven daily and four weekly snapshots.
  - Evidence: approved backup option D balances recovery with bounded retention.
- Decision: disable backups for `work` and `restricted` unless an approved policy
  enables them; `disabled` never backs up.
  - Evidence: work environments may prohibit duplicating persisted data.
- Decision: never select network or cloud folders automatically and never copy an
  active SQLite database ad hoc.
  - Evidence: backup must not become unsafe implicit sync.
- Decision: restore into a new candidate database, verify checksum and integrity,
  apply compatible migrations, preview the result, then atomically swap with a
  temporary rollback copy.
  - Evidence: restoration must not destroy the last known-good local state.
- Decision: treat backup retention independently from record TTL and include
  toolkit-managed backups in security purge.
  - Evidence: snapshots can retain records after their live copies expire.
- Decision: assign each project an opaque stable `project_id` and treat fingerprints
  as versioned recognition evidence, never primary identity.
  - Evidence: paths, remotes, and Git metadata can change without meaning the project
    changed.
- Decision: group worktrees by Git common-dir while keeping session, task, branch,
  and ownership identities separate.
  - Evidence: worktrees share repository identity but not execution state.
- Decision: update path evidence automatically only when stronger existing evidence
  preserves the binding.
  - Evidence: moving a known clone should not lose memory, but path similarity cannot
    merge projects.
- Decision: require confirmation when associating a new clone by remote, adding a
  first remote, changing remotes, observing history replacement, or losing strong
  evidence.
  - Evidence: these events may represent rename, transfer, fork, recreation, or an
    unrelated repository.
- Decision: offer keep, new, or derived identity for semantic changes.
  - Evidence: users need to preserve continuity, isolate a new project, or record
    lineage without automatic memory sharing.
- Decision: never share memory automatically across derived projects.
  - Evidence: lineage is provenance, not an authorization boundary.
- Decision: keep fingerprint history with source, confidence, confirmation state,
  and timestamps, storing remotes and local evidence only as normalized hashes.
  - Evidence: diagnostics and old-clone recognition should not expose paths or remote
    URLs in the global registry.
- Decision: keep zero-footprint identity, confirmations, and lineage entirely outside
  the repository; managed mode may add a non-private versioned marker.
  - Evidence: restricted repositories cannot accept toolkit artifacts.
- Decision: allow temporary profile overrides for read-only commands when effective
  policy permits access.
  - Evidence: inspection and diagnostics do not mutate profile or project state.
- Decision: require interactive confirmation or `--allow-profile-override` for
  profile-scoped writes when the requested profile differs from the project binding.
  - Evidence: approved option D preserves automation while making contamination
    explicit.
- Decision: show project, bound profile, requested profile, effect, and data classes
  before confirming an override write.
  - Evidence: consent requires an observable impact preview.
- Decision: never rewrite bindings from `--profile`,
  `AGENTIC_WORKFLOW_PROFILE`, or `--allow-profile-override`.
  - Evidence: persistent identity changes require attach, detach, or rebind commands.
- Decision: prohibit project-scoped cross-profile writes through override flags.
  - Evidence: overrides select execution context; they do not authorize data
    transfer.
- Decision: implement cross-profile export or promotion as a separate sanitized,
  previewed copy with provenance.
  - Evidence: transferring knowledge must not move original rows or bypass data-class
    policy.
- Decision: keep destructive confirmation separate from profile-override consent.
  - Evidence: `--allow-profile-override` must not imply `--yes` for purge, restore, or
    detach.
- Decision: allow managed policy to reject overrides completely and audit every
  attempted write override.
  - Evidence: corporate constraints remain authoritative.

## Open Questions

- none

## Assumptions

- Assumption: the host can provide a writable user-data directory.
  - Evidence: supported desktop environments expose per-user application data paths;
    disabled mode remains the fallback when storage is prohibited.
- Assumption: a project can be fingerprinted without writing into it.
  - Evidence: Git metadata or a local root fingerprint can be read in zero-footprint
    mode.

## Documentation Impact

- Update: `README.md`, `CHANGELOG.md`, and command help.
- Reason: profiles add public CLI behavior, persistence, and security constraints.

## Acceptance Criteria

1. A new project cannot persist data until a profile is selected explicitly.
2. An exact local binding reselects the profile without writing to the repository.
3. Ambiguous or missing bindings stop rather than using stale global state.
4. CLI and environment overrides are observable and do not rewrite bindings.
5. Work and personal profile databases cannot be searched across boundaries.
6. Zero-footprint mode leaves `git status` unchanged.
7. SQLite failures degrade without weakening critical project gates.
8. The global registry contains routing metadata only and never stores project or
   conversation content.
9. Unknown, denied, oversized, unsanitized, or secret-bearing records are rejected
   before durable storage.
10. Profile presets expose their effective allowlist and never enable raw content by
    default.
11. Retention applies the documented hard-limit, expiry, and LRU order without using
    an LLM.
12. Pins are auditable, bounded, and never weaken managed or security limits.
13. Built-in presets enforce the approved quotas, TTLs, and pin maxima using stable
    logical-byte accounting.
14. Preset changes cannot silently alter existing records.
15. Backups and restores follow profile policy, consistency checks, preview, and
    rollback without writing into repositories.
16. Moves and worktrees preserve identity while clones, remote changes, forks, and
    history replacement require the documented confirmation flow.
17. Derived identities record lineage without implicit memory sharing.
18. Overrides are observable, do not mutate bindings, and cannot transfer
    project-scoped data across profiles.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | first attach without profile | persistence proceeds or guesses | command requests explicit selection |
| AC2 | exact fingerprint binding | profile is unresolved | stored profile is selected |
| AC3 | missing and conflicting bindings | last profile is reused | command stops with actionable error |
| AC4 | flag and environment precedence | binding is mutated | one invocation uses observable override |
| AC5 | cross-profile lookup | records leak across profiles | lookup remains profile-scoped |
| AC6 | zero-footprint integration | repo contains changes | `git status` remains unchanged |
| AC7 | unavailable or corrupt database | gates weaken or crash unclearly | degraded status is explicit and gates remain |
| AC8 | registry schema and write API | content fields can be stored | only allowlisted routing metadata is accepted |
| AC9 | memory write policy | unsafe record reaches SQLite | validation rejects it with an observable reason |
| AC10 | preset conformance | raw content is enabled implicitly | effective policy matches the documented allowlist |
| AC11 | retention maintenance | records survive or purge nondeterministically | hard limits, TTL, and LRU run in fixed order |
| AC12 | pin pressure and overrides | pins bypass policy or disappear silently | writes stop and status reports the conflict |
| AC13 | quota and TTL boundaries | physical file size changes admission | logical bytes and exact time boundaries decide |
| AC14 | preset transition | conflicting records change silently | preview blocks until an explicit resolution exists |
| AC15 | backup and restore | active DB is copied or overwritten first | consistent candidate validates before atomic swap |
| AC16 | project identity changes | path or remote silently reassigns memory | evidence rules preserve or block as documented |
| AC17 | derived project | source memory becomes searchable | lineage exists but storage and search stay isolated |
| AC18 | read/write/destructive override matrix | flag silently broadens authority | each effect requires its documented consent and policy |

## Plan

1. Resolve every open question and move this packet to `ready`.
2. Add failing contract tests for profile selection and isolation.
3. Implement the minimum profile registry and SQLite adapter.
4. Add CLI lifecycle and status commands.
5. Add zero-footprint and failure-mode integration tests.
6. Update public documentation and run `npm run verify`.

## Stop Conditions

Stop if storage crosses profile boundaries, selection requires heuristic identity,
zero-footprint writes into the target repo, SQLite APIs escape the adapter, or an
unresolved policy decision would be embedded as a default.

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed on supported Node LTS versions.
- [ ] Diff stayed inside the write-set.
- [ ] Decisions and assumptions are evidence-backed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
