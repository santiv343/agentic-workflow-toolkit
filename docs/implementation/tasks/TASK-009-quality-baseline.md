# Task Packet: TASK-009 - TypeScript and Quality Baseline

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: `f17982e`
- Worker branch:
- Worktree:
- Dependencies: none

## Mission

Migrate the toolkit to strict compiled TypeScript and establish deterministic quality
gates before storage, sync, MCP, skills, and native adapters expand the codebase.

## Scope

Included:

- strict TypeScript migration for source, CLI, and tests;
- ESM build output and declaration files;
- ESLint flat configuration and deterministic formatting;
- public API and boundary type contracts;
- architecture-test foundation;
- package metadata and release mechanics for compiled output;
- incremental refactoring required to type existing behavior safely.

Excluded:

- changing existing public behavior;
- adding a bundler or runtime TypeScript loader;
- implementing profiles, sync, MCP, skills, or adapters;
- enforcing coverage percentages as a substitute for risk-based tests;
- full mutation testing on every commit.

## Ownership

- Write-set: `src/`, `bin/`, `test/`, TypeScript, ESLint, format, and build
  configuration, `package.json`, lockfile, `README.md`, `CHANGELOG.md`
- Read-set: schemas, templates, package API, current tests, downstream Task Packets
- Forbidden-set: Knowledge Hub methodology, consumer repositories, future feature
  implementation
- Exclusive resources: TypeScript compiler configuration, package entry points,
  verification pipeline

## Context Route

### Required

- `AGENTS.md`
- `package.json`
- `src/index.js`
- `src/cli.js`
- `test/cli.test.js`
- `docs/implementation/orchestration-board.md`

### On demand

- remaining `src/*.js`
- `schema/workflow.schema.json`
- package dry-run output
- downstream Task Packets for required public contracts

### Discovery

- public exports and CLI entry point
- modules with implicit object shapes
- filesystem and process boundaries
- current dependency directions

### Do not preload

- consumer-project source code
- unrelated Knowledge Hub domains
- future adapter API documentation

## Decisions

- Decision: migrate to TypeScript compiled with `tsc`.
  - Evidence: approved option C establishes static contracts before the system grows.
- Decision: retain ESM, Node.js `>=22.13.0`, and `node:test`.
  - Evidence: runtime and test runner already satisfy the project without another
    framework.
- Decision: emit runnable JavaScript and declaration files into `dist/`.
  - Evidence: consumers should not require TypeScript execution support.
- Decision: use a no-emit root configuration for source and test typechecking, a
  build configuration for public runtime output, and a separate test configuration
  that compiles source plus tests into a disposable ignored directory before
  invoking `node:test`.
  - Evidence: tests must be strict TypeScript without requiring a runtime loader or
    leaking test artifacts into the published package.
- Decision: do not add a bundler or runtime loader.
  - Evidence: the package is a Node CLI/library and does not need bundling complexity.
- Decision: enable `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`,
  `noPropertyAccessFromIndexSignature`, `noUncheckedSideEffectImports`,
  `useUnknownInCatchVariables`, `forceConsistentCasingInFileNames`, and
  `verbatimModuleSyntax`.
  - Evidence: these flags target missing keys, optional-field ambiguity, incomplete
    control flow, dead code, unsafe indexes, side effects, and module mistakes.
- Decision: use NodeNext module and resolution semantics with explicit relative
  extensions.
  - Evidence: build output must follow Node ESM without aliases or bundler rewriting.
- Decision: require explicit return types for exported functions, `import type` for
  type-only imports, and exhaustive discriminated unions.
  - Evidence: public contracts and protocol state transitions must be reviewable.
- Decision: prohibit `any`, routine `as` assertions, non-null assertions, enums,
  runtime namespaces, decorators, and path aliases.
  - Evidence: these can hide invalid states, runtime transforms, or module resolution.
- Decision: treat external values as `unknown` and validate YAML, JSON, NDJSON,
  SQLite rows, environment, CLI, MCP, and host-adapter payloads at their boundaries.
  - Evidence: TypeScript types do not validate runtime data.
- Decision: use ESLint flat config with type-aware rules for unsafe operations,
  floating promises, exhaustive switches, unused disables, and import hygiene.
  - Evidence: compiler checks alone do not cover promise and policy-quality hazards.
- Decision: use deterministic formatting and make check mode part of verification.
  - Evidence: agents should not produce formatting-only review noise.
- Decision: run verify as format, lint, typecheck, build, tests, architecture tests,
  and package dry-run.
  - Evidence: each gate covers a distinct failure class and does not duplicate TDD or
    human review.
- Decision: preserve behavior during migration and make public-path changes explicit
  in one versioned release.
  - Evidence: quality migration must not silently alter CLI semantics.

## Open Questions

- none

## Assumptions

- Assumption: current behavior is captured sufficiently to migrate incrementally.
  - Evidence: the package has 29 public-CLI integration tests and package dry-run.
- Assumption: strict migration may require splitting existing large modules without
  changing their behavior.
  - Evidence: `src/check.js` currently exceeds 600 lines and combines several
    validation responsibilities.
- Assumption: downstream tasks can target the compiled public ports after migration.
  - Evidence: TASK-001 and TASK-003 now depend on this baseline.

## Documentation Impact

- Update: `README.md`, `CHANGELOG.md`, development commands, package exports, and
  contribution guidance.
- Reason: build, source language, package entry points, and verification change.

## Acceptance Criteria

1. Published package consumers execute compiled JavaScript and receive declarations.
2. Strict typecheck passes with every selected compiler flag enabled.
3. No source or test uses `any`, non-null assertions, or unjustified assertions.
4. Every external boundary validates `unknown` before domain use.
5. Existing CLI behavior and all current regression tests remain green after their
   TypeScript compilation step.
6. Lint catches unsafe operations, floating promises, incomplete unions, and unused
   suppressions.
7. Verification executes every documented gate; temporary test output is cleaned and
   excluded; package dry-run contains compiled runtime files and declarations, not
   TypeScript source or test artifacts.
8. Source modules follow the approved dependency boundaries.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | package smoke test | source entry or missing declarations | compiled import and CLI work |
| AC2 | strict type fixture | unsafe optional/index access compiles | compiler rejects fixture |
| AC3 | static source scan and lint | escape hatches pass | violations block verify |
| AC4 | malformed-boundary tests | invalid payload reaches domain | parser returns typed failure |
| AC5 | compiled existing integration suite | behavior changes or runtime TS is required | all regressions pass through `node:test` |
| AC6 | lint fixtures | async/union hazards pass | lint reports each hazard |
| AC7 | verify, clean test build, and pack inspection | a gate or compiled file is missing | complete pipeline and package |
| AC8 | architecture fixtures | forbidden import passes | architecture gate blocks it |

## Plan

1. Add failing package, compiler, lint, and architecture fixtures.
2. Add TypeScript, ESLint, and formatting configuration.
3. Migrate shared low-level modules and public contracts first.
4. Migrate CLI and feature modules while keeping tests green.
5. Migrate tests and split oversized mixed-responsibility modules.
6. Update package exports, bin, build, docs, and changelog.
7. Run complete verification and inspect the packed artifact.

## Stop Conditions

Stop if migration changes public behavior without a separate decision, requires a
bundler/runtime loader, weakens strict flags, uses assertions to silence boundaries,
or mixes future feature implementation into the baseline.

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Diff stayed inside the write-set.
- [ ] No strictness exceptions remain undocumented.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
