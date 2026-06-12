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

## Open Questions

- What exact data classes may each profile persist?
- What are the default retention, purge, and backup policies?
- Which fingerprint changes require rebind versus migration?
- How should explicit overrides interact with commands that mutate persistent state?

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
