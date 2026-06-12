# Task Packet: TASK-011 - MVP Release Hardening

## Metadata

- Status: ready
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: none

## Mission

Prove that the existing public CLI delivers the complete MVP journey from a packed
artifact in a clean repository, then fix only defects that prevent that journey.

## Scope

Included:

- package-and-install integration fixture;
- end-to-end coverage of every documented MVP command;
- atomic initialization and actionable failure verification;
- package-content, portability, and private-data checks;
- README and MVP limitation corrections;
- narrowly scoped implementation fixes exposed by the tests.

Excluded:

- TypeScript migration or architecture restructuring;
- profiles, SQLite, sync, MCP, skills, native adapters, or observability;
- new commands unrelated to the journey in `docs/MVP.md`;
- release publication requiring external credentials.

## Ownership

- Write-set: `test/`, test fixtures/helpers, `README.md`, `docs/MVP.md`,
  `CHANGELOG.md`, and minimal existing source fixes required by failing MVP tests
- Read-set: public CLI/API, templates, package manifest, current tests
- Forbidden-set: post-MVP task packets, Knowledge Hub methodology, consumer projects,
  new persistent user data
- Exclusive resources: MVP end-to-end fixture and release-candidate checklist

## Context Route

### Required

- `AGENTS.md`
- `docs/MVP.md`
- `README.md`
- `package.json`
- `docs/implementation/orchestration-board.md`

### On demand

- one public command implementation selected by a failing test
- related existing tests and templates
- package dry-run output

### Discovery

- public executable and package entry points
- temporary-repository helpers
- current failure and rollback behavior

### Do not preload

- `docs/architecture.md`
- post-MVP packets
- Knowledge Hub
- unrelated source modules

## Decisions

- Decision: validate the current JavaScript package rather than rewrite it for MVP.
  - Evidence: `docs/MVP.md` defines an already implemented portable user journey.
- Decision: use the packed artifact and public executable in the primary integration
  test.
  - Evidence: source-level tests cannot prove package contents or install behavior.
- Decision: permit only fixes required by an observed MVP failure.
  - Evidence: post-MVP preparation is explicitly outside the release boundary.

## Open Questions

- none

## Assumptions

- Assumption: Node.js `>=22.13.0` remains the supported runtime.
  - Evidence: `package.json` and `README.md` declare that engine requirement.
- Assumption: no external service or credential is required for the MVP journey.
  - Evidence: every included command is currently local and provider-neutral.

## Documentation Impact

- Update: `README.md`, `docs/MVP.md`, and `CHANGELOG.md`
- Reason: the release candidate must state tested behavior and honest limitations.

## Acceptance Criteria

1. A packed artifact installs into a temporary repository and exposes the CLI.
2. The fixture completes init, check, context, grill, brief, learn, and doctor flows.
3. Ambiguous init and conflicting managed files fail without partial writes.
4. Context output routes paths without embedding their file contents.
5. Grill blocks an unresolved packet and passes a resolved packet.
6. Brief returns invariants, bounded context, and pending learnings.
7. Package contents contain no machine-specific paths, credentials, or Knowledge Hub.
8. Public docs match the behavior observed by the integration test.
9. `npm run verify` passes from a clean checkout.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1-AC2 | packed-artifact journey | install or command flow fails | complete public journey succeeds |
| AC3 | initialization fault fixtures | partial files remain | preflight leaves repository unchanged |
| AC4-AC6 | output contract tests | content leaks or gates misreport | bounded structured output matches contract |
| AC7 | package/privacy inspection | forbidden path or data ships | artifact contains only declared files |
| AC8-AC9 | docs assertion and verify | docs drift or gate fails | behavior, docs, and verification agree |

## Plan

1. Add the failing packed-artifact end-to-end test.
2. Add failure and privacy fixtures.
3. Fix only observed MVP defects in the owning modules.
4. Update release documentation.
5. Run `npm run verify` and inspect the final package contents.

## Stop Conditions

Stop if a fix requires a post-MVP capability, changes a public contract without a
separate decision, expands persistent state, or needs external credentials.

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Diff stayed inside the write-set.
- [ ] Decisions and assumptions are evidence-backed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
