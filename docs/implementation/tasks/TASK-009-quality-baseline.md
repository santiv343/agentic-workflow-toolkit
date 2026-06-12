# Task Packet: TASK-009 - TypeScript and Quality Baseline

## Metadata

- Status: planned
- Base branch: `main`
- Base commit: set at dispatch
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
- JSON Schema, generated transport types, and standalone runtime validation;
- typed result and failure contracts;
- explicit typed dependency composition and resource lifecycle;
- modular-monolith ports-and-adapters structure and architecture tests;
- package metadata and release mechanics for compiled output;
- incremental refactoring required to type existing behavior safely.

Excluded:

- changing existing public behavior;
- adding a bundler or runtime TypeScript loader;
- implementing profiles, sync, MCP, skills, or adapters;
- enforcing coverage percentages as a substitute for risk-based tests;
- full mutation testing on every commit.

## Ownership

- Write-set: `src/`, `bin/`, `test/`, `schema/`, generation scripts and output,
  TypeScript, ESLint, format, and build configuration, `package.json`, lockfile,
  `README.md`, `CHANGELOG.md`
- Read-set: schemas, templates, package API, current tests, downstream Task Packets
- Forbidden-set: Knowledge Hub methodology, consumer repositories, future feature
  implementation
- Exclusive resources: TypeScript compiler configuration, package entry points,
  verification pipeline

## Context Route

### Required

- `AGENTS.md`
- `package.json`
- `docs/architecture.md`
- `src/index.js`
- `src/cli.js`
- `docs/implementation/orchestration-board.md`

### On demand

- remaining `src/*.js`
- relevant sections of `test/cli.test.js` selected by command or behavior
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
- Decision: structure the toolkit as a modular monolith with `domain`,
  `application`, `infrastructure`, `interfaces`, `composition`, and minimal `shared`
  layers.
  - Evidence: approved option C keeps one deployable package while preserving
    replaceable adapters and independently testable policy.
- Decision: organize domain and application behavior by capability: workflow,
  profiles, sync, skills, and conformance.
  - Evidence: layer-only folders would still allow unrelated capabilities to become
    one coupled model.
- Decision: define outbound ports in the application capability that consumes them.
  - Evidence: ports should express use-case needs rather than infrastructure-shaped
    generic repositories.
- Decision: allow concrete adapter construction only in `composition`.
  - Evidence: CLI, MCP, and host adapters must not select SQLite, filesystem,
    transport, or memory implementations themselves.
- Decision: permit cross-capability imports only through explicit public contracts;
  behavior crosses through application ports or versioned events.
  - Evidence: private-file imports and shared persistence would make later extraction
    unsafe.
- Decision: keep `shared` pure, capability-neutral, and promotion-based.
  - Evidence: a general utilities directory otherwise becomes an unowned coupling
    point.
- Decision: enforce dependency direction with TypeScript-AST architecture tests and
  positive and negative fixtures.
  - Evidence: directory conventions and regex scans are too easy for agents to
    violate or misread.
- Decision: retain one package and one release; do not create workspace packages or
  services during TASK-009.
  - Evidence: module boundaries are needed now, while distributed operation and
    package management are not.
- Decision: model declared domain, application, and classified operational failures
  with a shared discriminated `Result<TValue, TFailure>` primitive and
  capability-owned failure unions.
  - Evidence: approved option C makes expected control flow explicit and exhaustive
    without coupling every capability to an exception hierarchy.
- Decision: reserve exceptions for defects, violated internal invariants, and
  genuinely unclassified failures.
  - Evidence: an unexpected exception must remain distinguishable from a policy
    denial, conflict, invalid input, cancellation, or unavailable dependency.
- Decision: require infrastructure adapters to translate only deterministically
  recognized native failures into the failure union declared by their application
  port.
  - Evidence: passing Node.js, SQLite, transport, or provider error shapes inward
    would leak technology and make callers non-portable.
- Decision: define one safe public problem projection mapped by CLI, JSON, MCP, and
  host presenters from stable namespaced failure codes.
  - Evidence: human messages and numeric exit codes are presentation details, while
    agents and integrations need a versioned machine contract.
- Decision: catch unexpected exceptions once at the outermost interface, preserve
  sanitized diagnostic evidence behind a correlation ID, and expose only
  `internal.unexpected`.
  - Evidence: stacks and raw causes aid diagnosis but may contain paths, secrets, SQL,
    provider payloads, or tool output.
- Decision: prohibit expected-failure classes, thrown strings, optional-property
  error bags, silent catch blocks, and default branches that hide new failure
  variants.
  - Evidence: these patterns defeat exhaustiveness or blur the expected/unexpected
    boundary.
- Decision: use Pure DI with explicit readonly dependency objects, typed factory
  functions, and manual wiring under `composition`.
  - Evidence: approved option C keeps dependencies visible to TypeScript and tests
    without reflection, decorators, runtime tokens, or container behavior.
- Decision: split composition by capability and let the top-level root wire only
  public capability contracts, concrete adapters, lifecycle, and interfaces.
  - Evidence: one monolithic factory would become a second service locator, while
    independent roots would hide cross-capability ownership.
- Decision: create required configuration, policies, migrations, and adapters eagerly
  before an interface reports ready; use explicit lazy provider ports only for truly
  optional or expensive capabilities.
  - Evidence: deterministic startup catches invalid graphs and configuration before
    partial work begins without forcing unavailable host capabilities to initialize.
- Decision: scope immutable configuration, stateless use cases, and stateful adapter
  resources to one runtime; pass request, command, session, cancellation,
  correlation, authorization, and profile context explicitly per operation.
  - Evidence: ambient request state and module globals leak data between concurrent
    users, projects, profiles, and host sessions.
- Decision: expose one idempotent async runtime close operation, reject new work
  during shutdown, and release owned resources in reverse construction order while
  preserving all cleanup failures.
  - Evidence: CLI, MCP, and long-lived host adapters have different process lifetimes
    but require the same deterministic ownership semantics.
- Decision: have unit and application tests call production factories with complete
  typed fakes; allow only an explicit `TestOverrides` contract at the integration
  composition boundary.
  - Evidence: arbitrary `Partial` overrides, module patching, and process-global
    mutation hide missing dependencies and produce order-dependent tests.
- Decision: prohibit service lookup APIs, dependency tokens, decorator metadata,
  mutable module singletons, environment reads inside factories, and injection of a
  container/runtime object into domain or application code.
  - Evidence: these practices turn explicit constructor/factory injection back into
    hidden dependencies.
- Decision: validate the import graph for dependency cycles and test startup rollback,
  lifecycle order, idempotent close, and concurrent context isolation.
  - Evidence: type correctness alone does not prove that the object graph can start,
    stop, or serve concurrent operations safely.
- Decision: use JSON Schema Draft 2020-12 as the canonical source for every serialized
  external contract and Ajv's Draft 2020-12 implementation for runtime validation.
  - Evidence: approved option C preserves language- and host-neutral contracts while
    the existing workflow schema already uses this draft.
- Decision: generate transport-only TypeScript types and standalone ESM validators
  from package-owned schemas during build.
  - Evidence: generation prevents hand-maintained schema/type drift, and standalone
    validation avoids repeated runtime compilation.
- Decision: use Ajv 8 programmatically through its Draft 2020-12 and standalone-code
  APIs, plus `json-schema-to-typescript` as a build-only type generator.
  - Evidence: this directly implements the selected contract without adding
    `ajv-cli`, a runtime TypeScript schema DSL, or another validation framework.
- Decision: exact-pin validator and generator versions when TASK-009 is dispatched;
  do not register `ajv-formats` or any format implementation by default.
  - Evidence: generated output must be reproducible, and Ajv requires separate format
    implementations whose untrusted-input safety must be assessed individually.
- Decision: keep domain/application types and semantic invariants hand-written and
  separate from generated transport types.
  - Evidence: JSON Schema can validate serialized shape but cannot own authorization,
    causal validity, transitions, cross-record consistency, or policy decisions.
- Decision: run Ajv with strict schema validation and non-mutating behavior; disable
  coercion, defaults, property removal, verbose data output, and `allErrors` for
  production validation.
  - Evidence: portable validation must not transform input, and Ajv documents
    `allErrors` and untrusted data/schema complexity as security risks.
- Decision: allow only local package-owned `$ref` resolution and standard Draft
  2020-12 keywords in portable contracts.
  - Evidence: network refs, custom keywords, and `$data` make builds non-reproducible
    or bind the contract to one validator.
- Decision: require closed and bounded schemas, including explicit rules for
  intentional maps, strings, arrays, and objects.
  - Evidence: unknown properties and unbounded structures increase ambiguity,
    storage cost, validation cost, and denial-of-service risk.
- Decision: enforce raw transport limits before parsing where possible and return
  bounded sanitized structural diagnostics without rejected values.
  - Evidence: schema validation cannot protect a process that already accepted an
    oversized payload, and raw validator messages can leak input.
- Decision: generate and commit deterministic transport types, validators, and a
  registry manifest; `verify` regenerates to temporary output and byte-compares.
  - Evidence: committed generated artifacts support inspection and package use while
    drift checks prevent manual edits or stale output.
- Decision: version every payload explicitly, fail closed on unknown versions, use
  deterministic migrations for local data, and negotiate retained validators for
  wire protocols.
  - Evidence: object-shape guessing and silently replacing schemas would corrupt old
    state or split adapters across incompatible protocol meanings.
- Decision: classify every schema change as compatible reader change, breaking
  version, or security tightening and test all supported golden fixtures.
  - Evidence: closed schemas make compatibility directional; release intent and
    migration behavior must be explicit.
- Decision: do not compile user-provided or remote schemas in the baseline.
  - Evidence: Ajv treats schemas as trusted application code and warns that untrusted
    schemas can cause excessive compilation or validation cost.

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
- Assumption: current commands can be migrated capability by capability without
  preserving the flat source filenames as public contracts.
  - Evidence: package exports and CLI behavior, rather than private source paths, are
    the documented compatibility surface.

## Documentation Impact

- Update: `docs/architecture.md`, `README.md`, `CHANGELOG.md`, development commands,
  package exports, and contribution guidance.
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
8. Source modules follow `docs/architecture.md`; every forbidden dependency edge has
   a failing fixture and every allowed layer edge has a passing fixture.
9. Domain and application tests run without filesystem, process, database, network,
   MCP, or host SDK setup.
10. Public entry points delegate through composition and no inbound adapter imports a
    concrete outbound adapter.
11. Every declared failure path returns an exhaustive typed result; domain and
    application code do not throw for expected outcomes.
12. CLI, JSON, MCP, and host projections preserve the same stable failure code and
    never expose forbidden diagnostic data.
13. Known adapter failures map to port-owned failures; unknown exceptions remain
    unexpected and retain a diagnostic cause internally.
14. Every use case and service receives complete typed dependencies explicitly;
    production source contains no container, service locator, dependency token,
    decorator injection, or mutable singleton.
15. Required runtime construction fails before readiness and rolls back already
    acquired resources; close is asynchronous, idempotent, and reverse-ordered.
16. Concurrent operations cannot observe another operation's profile, authorization,
    cancellation, correlation, command, request, or session context.
17. Unit/application tests use complete typed fakes, while integration overrides are
    limited to the declared `TestOverrides` contract.
18. Every serialized toolkit contract has a unique versioned Draft 2020-12 schema,
    generated transport type, standalone validator, and registry entry.
19. Validation does not mutate input, resolve network references, compile untrusted
    schemas, expose rejected values, or permit unbounded contract structures.
20. Generated types and validators are deterministic, contain no `any`, and fail
    verification when they drift from schemas.
21. Unknown versions fail closed; all retained versions pass golden fixtures,
    migrations or negotiation tests, and serialization round trips.
22. Semantic invariants remain enforced in domain/application even when structural
    validation already succeeded.

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
| AC9 | pure core tests | core test requires I/O or SDK setup | in-memory tests run in isolation |
| AC10 | composition fixture | inbound adapter selects infrastructure | only composition wires concrete adapters |
| AC11 | expected failure tests | use case throws or returns loose error | exhaustive `Result` is returned |
| AC12 | presenter contract tests | surfaces disagree or leak diagnostics | stable safe problem projection |
| AC13 | adapter failure classification | native error leaks inward or unknown is swallowed | known failure maps and unknown preserves cause |
| AC14 | composition static fixtures | hidden lookup or incomplete factory passes | explicit typed graph is required |
| AC15 | lifecycle fault injection | partial startup leaks or close stops early | rollback and reverse idempotent close |
| AC16 | concurrent context test | context bleeds across operations | each invocation remains isolated |
| AC17 | test-composition fixtures | arbitrary partial/module patch works | only complete fakes and approved overrides compile |
| AC18 | schema registry test | ID, type, validator, or version missing | complete unique registry |
| AC19 | hostile boundary fixtures | payload mutates, fetches refs, or exhausts bounds | safe bounded rejection |
| AC20 | regeneration drift test | generated output is edited or stale | byte-identical deterministic output |
| AC21 | compatibility matrix | old/unknown version is guessed or corrupted | migration, negotiation, or closed failure |
| AC22 | semantic-invalid fixture | structurally valid policy/state is accepted | domain rejects the invalid meaning |

## Plan

1. Add failing package, compiler, lint, and architecture fixtures.
2. Add TypeScript, ESLint, and formatting configuration.
3. Add the architecture dependency matrix and failing forbidden-edge fixtures.
4. Add failing result, exhaustiveness, classification, and safe-projection fixtures.
5. Add failing composition, context-isolation, startup, and shutdown fixtures.
6. Add failing schema registry, drift, hostile-input, and compatibility fixtures.
7. Add Ajv, pinned type generation, standalone validator generation, and registry
   generation.
8. Migrate pure domain contracts and application use cases by capability.
9. Move I/O behind application-owned ports and implement infrastructure adapters.
10. Add capability factories, top-level composition, and explicit lifecycle handling.
11. Migrate CLI entry points into inbound interfaces.
12. Migrate tests and split oversized mixed-responsibility modules.
13. Update package exports, bin, build, docs, and changelog.
14. Run complete verification and inspect the packed artifact.

## Stop Conditions

Stop if migration changes public behavior without a separate decision, requires a
bundler/runtime loader, weakens strict flags, uses assertions to silence boundaries,
adds empty architectural scaffolding, introduces generic speculative ports, allows
adapter-to-adapter wiring, throws a declared failure, exposes a raw cause through a
public interface, introduces hidden dependency lookup or ambient request state, leaks
a partially constructed runtime, duplicates a transport type by hand, enables
mutating validation or remote schema resolution, guesses a payload version, or mixes
future feature implementation into the baseline.

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Diff stayed inside the write-set.
- [ ] No strictness exceptions remain undocumented.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
