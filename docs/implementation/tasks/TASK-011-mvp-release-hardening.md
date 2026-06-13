# Task Packet: TASK-011 - MVP Release Hardening

## Metadata

- Status: reviewed
- Base branch: `main`
- Base commit: 4f5e38ed7e7386d64aa226641ec5936e2dd85e31
- Worker branch: TASK-011-mvp-release-hardening
- Worktree: C:/Users/santi/AppData/Local/Temp/opencode/worktrees/TASK-011-mvp-release-hardening
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

1. Add the packed-artifact end-to-end characterization test and record whether the
   existing baseline passes or fails for the intended reason.
2. Add failure and privacy fixtures.
3. Fix only observed MVP defects in the owning modules.
4. Update release documentation.
5. Run `npm run verify` and inspect the final package contents.

## Stop Conditions

Stop if a fix requires a post-MVP capability, changes a public contract without a
separate decision, expands persistent state, or needs external credentials.

## Handoff Evidence

### Human Summary

- Response language: es-AR
- Outcome summary: El paquete instalado completa el recorrido MVP y los casos negativos ahora prueban la causa correcta.
- Changes made: Se reforzaron las pruebas de instalación, ambigüedad, atomicidad, documentación y contenido real del tarball.
- Verification summary: `npm run verify` pasó 56 tests y validó el paquete generado sobre el commit de handoff.
- Unverified or inferred: none - todas las afirmaciones materiales están cubiertas por tests o inspección del diff.
- Remaining work: Falta integrar el head revisado en `main` y verificar el commit integrado.
- Next gate: human-merge

### Machine Evidence

- Work classification: hardening
- Initial evidence command: `npm run verify` on 4f5e38ed7e7386d64aa226641ec5936e2dd85e31
- Initial evidence result: passed-characterization
- Initial evidence: El baseline del toolkit pasó 45 tests antes de incorporar la caracterización release-level.
- Failure oracle: Las pruebas fallan si no se ejecuta el CLI real, si quedan escrituras parciales, si el payload contiene secretos o paths privados, o si la documentación contradice el comportamiento.
- Head commit: e18b51ea25b88f04675f65dc085e5274912a0cd5
- Verification command: `npm run verify`
- Verification result: passed
- Verified commit: e18b51ea25b88f04675f65dc085e5274912a0cd5
- Acceptance criteria: AC1: npm pack instala el artefacto y expone el CLI; AC2: la fixture ejecuta init, check, context, grill, brief, learn y doctor; AC3: el CLI real rechaza ambigüedad y conflictos sin escrituras parciales; AC4: context prueba rutas sin contenido embebido; AC5: grill bloquea y acepta packets según contrato; AC6: brief prueba invariantes, contexto y learnings; AC7: el tarball extraído se inspecciona por paths, secretos y archivos no declarados; AC8: README y MVP se comparan con comportamiento y límites observables; AC9: npm run verify pasa sobre el head exacto.
- Scope command: `git diff --name-only 4f5e38ed7e7386d64aa226641ec5936e2dd85e31...e18b51ea25b88f04675f65dc085e5274912a0cd5`
- Scope result: passed
- Review status: approved
- Reviewer: Pasteur (independent read-only reviewer)
- Reviewed commit: e18b51ea25b88f04675f65dc085e5274912a0cd5
- Review verification command: `npm run verify`
- Review verification result: passed
- Review verified commit: e18b51ea25b88f04675f65dc085e5274912a0cd5
- Findings: none
- Residual risks: Unix tar branches were not executed on Windows; credential patterns are defensive rather than a specialized secret scanner; documentation assertions cover critical claims rather than every sentence.
- Merge authorized by: pending
- Merge status: pending
- Merged commit: pending
- Integrated verification command: pending
- Integrated verification result: pending
- Integrated verified commit: pending

## Definition of Done

- [x] Acceptance criteria demonstrated.
- [x] Verification passed.
- [x] Diff stayed inside the write-set.
- [x] Decisions and assumptions are evidence-backed.
- [x] Open Questions is `none`.
- [x] Documentation impact was completed.
- [x] Independent review recorded the reviewed head commit.
