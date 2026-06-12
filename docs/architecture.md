# Toolkit Architecture

This document defines the post-MVP target architecture delivered incrementally by
approved Task Packets. Until TASK-009 is integrated, the current flat JavaScript
layout is legacy structure, not precedent for new modules.

The current release boundary is `docs/MVP.md`. A future contract described here does
not become an MVP dependency merely because its design is documented.

## Architectural Style

The toolkit is a modular monolith with hexagonal boundaries:

- one package, release, process, and deployment unit;
- capabilities remain explicit and independently testable;
- domain and application policy do not depend on Node.js I/O, databases, CLIs, MCP,
  or host APIs;
- external technologies are adapters behind application-owned ports;
- a single composition root performs concrete wiring.

This is intentionally lighter than full Domain-Driven Design. A capability introduces
entities, value objects, events, or repositories only when its invariants require
them.

## Target Structure

```text
src/
  domain/
    workflow/
    profiles/
    sync/
    skills/
    conformance/
  application/
    workflow/
    profiles/
    sync/
    skills/
    conformance/
  infrastructure/
    persistence/
    filesystem/
    process/
    transports/
    memory/
  interfaces/
    cli/
    mcp/
    hosts/
  composition/
  shared/
```

Only directories required by implemented behavior are created. Empty architecture
scaffolding is prohibited.

## Layer Responsibilities

### `domain/`

Owns deterministic concepts, invariants, policies, state transitions, reason codes,
and domain events. It has no filesystem, process, SQLite, network, environment,
console, CLI, MCP, host SDK, or third-party framework imports.

### `application/`

Owns use cases and the ports they require. It coordinates domain behavior but does
not know concrete adapters. Ports describe the smallest capability a use case needs;
generic repositories or service interfaces are not created speculatively.

### `infrastructure/`

Implements outbound ports for SQLite, filesystems, processes, clocks, randomness,
transports, and memory providers. It maps external values into validated domain or
application values. Infrastructure modules do not call one another through concrete
implementations when an application port is the correct boundary.

### `interfaces/`

Implements inbound adapters for the CLI, MCP, and host integrations. It parses and
validates external input, calls application use cases, and maps results to the host
format. It contains no business policy and never imports concrete infrastructure.

### `composition/`

Is the only production location allowed to instantiate concrete adapters and connect
them to use cases and inbound interfaces. It contains wiring and lifecycle only, not
policy. Executable entry points delegate to this composition root.

## Dependency Injection

The toolkit uses Pure DI: explicit arguments, typed factories, and manual wiring.
There is no DI container, reflection metadata, decorator injection, service locator,
mutable module singleton, or global dependency registry.

Every use case or application service declares the smallest readonly dependency
object it needs:

```ts
export interface CheckWorkflowDependencies {
  readonly loadWorkflow: LoadWorkflowPort;
  readonly inspectRepository: InspectRepositoryPort;
  readonly now: ClockPort;
}

export function createCheckWorkflow(
  dependencies: CheckWorkflowDependencies,
): CheckWorkflow {
  // Return the use case without resolving anything globally.
}
```

Composition is hierarchical without hiding dependencies:

```text
createWorkflowComposition(dependencies)
createProfileComposition(dependencies)
createSyncComposition(dependencies)
  -> createApplicationRuntime(adapters, configuration)
  -> createCliInterface(runtime)
  -> createMcpInterface(runtime)
```

Capability composition functions may build their own internal graph and return only
their public application contract. The top-level root owns cross-capability wiring,
resource startup, and interface construction. Composition modules may call one
another only through explicit parameters and return values.

### Lifetimes

- Immutable configuration and validated policy are created once per runtime.
- Stateful outbound adapters such as SQLite connections, evidence stores, and
  transport sessions are runtime-scoped unless their contract requires a shorter
  lifetime.
- Stateless use cases may be runtime-scoped; factories must not rely on identity or
  hidden mutable caches.
- Command, request, session, cancellation, correlation, authorization, and profile
  context are explicit input values. They are never stored in globals or ambient
  async state.
- Optional or expensive capabilities use an explicit lazy provider port only when
  startup cost or host capability requires it. General dependencies are eager.

Every required dependency, configuration value, schema compatibility check, and
storage migration is validated before an interface reports ready. Startup is
transactional where possible: if construction fails, already-created resources are
closed in reverse order.

The runtime exposes one idempotent asynchronous close operation. It rejects new work,
lets owned in-flight operations follow their documented cancellation policy, and
closes resources in reverse construction order. Cleanup failures retain every cause
rather than stopping after the first one.

### Test Composition

Unit and application tests call the same factories with complete typed fake port
objects. Missing dependencies are compile errors.

Root-level overrides are reserved for integration and conformance tests. They use an
explicit `TestOverrides` contract containing only approved replaceable ports. The
production root does not accept arbitrary `Partial` objects, string tokens, or
untyped maps, and tests do not patch imported modules or process globals.

### Dependency Rules

- Factories are pure unless their name and return type declare resource acquisition.
- Constructors and factories do not read environment variables or configuration
  files; validated configuration is passed in.
- Domain objects never receive adapters or a runtime/container object.
- Application code never calls `resolve`, `getService`, or equivalent lookup APIs.
- Interfaces receive the public runtime contract, not the composition internals.
- Dependency cycles are forbidden and checked from the TypeScript import graph.
- Dynamic host or memory-provider discovery produces a typed adapter descriptor;
  only composition may instantiate the selected implementation.

### `shared/`

Contains only stable, pure, capability-neutral primitives. It has no I/O, mutable
global state, configuration lookup, or domain policy. Code is promoted here only
after at least two real consumers demonstrate that no capability owns it.

## Dependency Matrix

| From | May import |
|---|---|
| `shared` | `shared` |
| `domain` | `domain`, `shared` |
| `application` | `application`, `domain`, `shared` |
| one `infrastructure` adapter | its own internal files, application ports, domain public contracts, `shared` |
| one `interfaces` adapter | its own internal files, application public contracts, domain public contracts, `shared` |
| `composition` | every layer for wiring only |
| `bin` and executable entry points | `composition` only |

Forbidden edges include:

- domain or application to infrastructure, interfaces, or composition;
- interfaces directly to infrastructure;
- infrastructure directly to interfaces;
- one adapter importing another adapter;
- business behavior in composition;
- external SDK, database, transport, or framework types in a port signature.

## Capability Boundaries

Each capability owns its internal model. Cross-capability access follows these rules:

1. Import only from the capability's explicit public contract.
2. Share immutable identifiers and value projections, not internal mutable state.
3. Invoke behavior through an application port or a versioned event.
4. Do not read another capability's persistence tables or adapter internals.
5. Avoid a global shared domain model.

Direct imports of another capability's internal files are architecture violations.
The same rule applies inside outer layers: an adapter may use its own internal files
but not a concrete sibling adapter.

## Boundary Validation

YAML, JSON, NDJSON, SQLite rows, environment variables, CLI arguments, MCP payloads,
filesystem contents, and host events enter as `unknown`. Their inbound adapter or
infrastructure adapter validates and converts them before application or domain use.

Domain and application code never receive an unvalidated external object.

## External Contract Schemas

JSON Schema Draft 2020-12 is the canonical source for serialized contract shape.
This includes repository configuration, persisted records, sync envelopes, MCP
payloads, normalized host events, and public machine-readable output.

The ownership chain is:

```text
versioned JSON Schema
  -> generated TypeScript transport type
  -> generated standalone Ajv validator
  -> adapter mapping
  -> domain/application value with semantic invariants
```

Schema constraints describe serialization and structural validity: required fields,
primitive types, discriminants, closed objects, bounded collections, and syntactic
limits. Domain/application code owns authorization, policy, causal validity,
cross-record consistency, state transitions, quota decisions, and other semantic
invariants. A rule lives in both places only when the schema needs an early structural
bound and the domain still must defend its invariant.

### Schema Rules

- Every schema declares Draft 2020-12 with `$schema`, a globally unique stable `$id`,
  a title, and an explicit payload version or versioned envelope.
- Object schemas are closed with `additionalProperties: false` or
  `unevaluatedProperties: false`. Intentional maps define a value schema,
  `propertyNames`, and `maxProperties`.
- Strings, arrays, and objects have explicit size limits where they cross a trust or
  persistence boundary.
- Standard `$ref` values resolve only through the package-owned local schema registry.
  Runtime network resolution is prohibited.
- Ajv-specific `$data`, mutating custom keywords, and other implementation extensions
  are prohibited in portable contracts.
- `format` is an annotation unless a specifically reviewed safe implementation is
  registered. Security-sensitive syntax uses bounded standard keywords or explicit
  adapter parsing.
- Recursive schemas, complex regular expressions, `uniqueItems` on large structures,
  and other high-cost constructs require an explicit performance and security test.
- Schemas are trusted package code. Compiling user-provided or remote schemas is not
  supported by the baseline.

Raw byte or record limits are enforced before parsing when the transport exposes
them. Parsing rejects duplicate keys and unsafe YAML features where applicable.
Structural validation never mutates input: coercion, default insertion, and automatic
removal of properties are disabled.

### Ajv Runtime

Package-owned schemas are compiled during build with the Ajv Draft 2020-12 entry
point and strict schema settings. Generated standalone ESM validators are published
with the package, so normal execution does not compile schemas repeatedly.

The build uses Ajv 8 through its programmatic API, not `ajv-cli`. No format plugin is
registered by default; a schema that needs a format must add and security-review only
that implementation.

Production validation stops at the first structural error. It does not use
`allErrors`, verbose data output, or raw Ajv messages as a public contract. Adapters
map bounded `instancePath`, `schemaPath`, keyword, and safe params into the toolkit's
typed validation failure without including rejected values.

### Generated Types

Transport types are deterministically generated with the
`json-schema-to-typescript` build package. Ajv and the generator are exact-pinned when
the task is dispatched and recorded in the lockfile. Generated files:

- are marked generated and never edited manually;
- contain no `any`;
- are used only at adapter and serialization boundaries;
- are regenerated into a temporary location during `verify` and byte-compared with
  committed output;
- do not replace hand-written branded identifiers, value objects, policies, or
  domain state.

The same build step generates a schema registry manifest containing each `$id`,
payload version, digest, validator export, and generated type export. Duplicate IDs,
unresolved references, nondeterministic output, or schema/type/validator drift fail
verification.

### Evolution

Unknown payload versions fail closed; the toolkit never guesses a schema from object
shape. Local persisted/configuration formats use explicit deterministic migration
chains to the current version. Wire contracts retain version-specific validators and
negotiate supported versions before exchange.

Every schema change is classified:

- compatible reader change: the current reader still accepts all supported old
  fixtures and preserves their meaning;
- breaking change: new schema ID/version plus migration or protocol negotiation;
- security tightening: explicit migration/rejection policy and release note.

Golden fixtures from every supported version run against validators, type generation,
migrations, and serialization round trips. A schema cannot be removed while a
supported migration, persisted record, or negotiated peer still depends on it.

## Failure Contract

Expected failures are values, not exceptions:

```ts
export type Result<TValue, TFailure> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: TFailure };
```

Capability-owned failure unions use a stable discriminant and explicit fields. They
do not use optional-property bags, raw strings, native `Error` objects, or external
SDK types.

```ts
export type ProfileFailure =
  | {
      readonly code: 'profile.binding_missing';
      readonly projectId: ProjectId;
    }
  | {
      readonly code: 'profile.write_denied';
      readonly profileId: ProfileId;
      readonly dataClass: DataClass;
    };
```

Rules:

1. Validation rejection, missing data, policy denial, required approval, unsupported
   capability, conflict, cancellation, and classified operational failure return a
   typed `Result`.
2. Domain and application code do not throw for a declared failure path.
3. Infrastructure catches native failures only when it can classify them
   deterministically. It converts known system or provider failures into the
   application port's failure union.
4. Unknown caught values are normalized to `Error` and rethrown with their cause.
   Exceptions are reserved for defects, violated internal invariants, and genuinely
   unclassified failures.
5. `Result` is a pure shared primitive; concrete failure unions belong to the
   capability that defines the contract.
6. Every consumer handles failure unions exhaustively. A default branch that hides a
   new variant is prohibited.

Inbound presenters convert failures into a versioned public problem projection with:

- a stable namespaced `code`;
- a coarse category;
- a user-safe message;
- retry guidance;
- optional structured remediation and safe metadata;
- a correlation ID when diagnostic evidence exists.

The stable code, not the human message or process exit number, is the machine
contract. CLI, JSON output, MCP, and host adapters map from the same failure union.
They never expose raw causes, stack traces, secrets, credentials, private paths,
SQLite statements, provider payloads, or unsanitized tool output.

The outermost interface catches an unexpected exception once. It records sanitized
diagnostic evidence, returns an `internal.unexpected` problem with a correlation ID,
and terminates or reports failure according to that interface. It never silently
converts an unexpected defect into a normal domain failure.

## Observability, Evidence, and Audit (Post-MVP)

The toolkit separates three signals that must not share authority or failure
semantics:

| Signal | Purpose | Authority | Typical sink |
|---|---|---|---|
| Operational telemetry | diagnose health, latency, failures, and capacity | never authoritative | local JSONL or optional OpenTelemetry |
| Workflow evidence | prove what gate, task, adapter, or review action occurred | evidence only; board and Task Packets remain authoritative | evidence store owned by workflow/conformance |
| Security audit | record sensitive identity, policy, storage, sync, and override actions | append-only record governed by profile/managed policy | policy-approved audit store |

Telemetry cannot satisfy an evidence or audit obligation. Evidence cannot mutate the
board, approve a gate, or become memory automatically. Audit is not a debug log and
does not contain content merely because an action touched it.

### Typed Events

Each signal has a separate application-owned port and a versioned closed event union.
Producers emit structured values, never formatted log strings:

```text
event schema version
event ID
event name and category
occurred-at timestamp
severity or outcome
capability and stable reason code
operation and correlation IDs
optional trace/span IDs
bounded allowlisted attributes
```

Event names and toolkit-specific attribute names use the
`agentic.workflow.*` namespace. Event schemas follow the external-contract rules and
are generated, validated, and versioned like other machine contracts.

The operation context creates correlation and operation IDs explicitly. Adapters may
map trusted W3C Trace Context to trace/span IDs, but domain/application code does not
parse headers or depend on OpenTelemetry types. Profile, project, task, session, and
device references are opaque scoped IDs. Metrics never use those IDs, paths, error
messages, model names, or other unbounded values as dimensions.

### Data Minimization

Events are constructed from an allowlist and sanitized before any sink receives them.
The following are prohibited by default:

- prompts, model responses, transcripts, source or file contents;
- raw tool input/output and command lines;
- environment values, credentials, tokens, secrets, or authorization material;
- raw paths, remotes, URLs, hostnames, usernames, email addresses, or customer data;
- SQL statements, rejected payload values, exception stacks, or native provider
  payloads;
- arbitrary objects serialized under `metadata`, `context`, or similar escape fields.

Allowed metadata is limited to opaque IDs, stable codes, versions, bounded counts,
durations, sizes, retry counts, capability names, adapter fidelity, and outcomes.
Diagnostic causes remain in the separately protected evidence mechanism described by
the failure contract and are referenced only by correlation ID.

Redaction is deterministic, allowlist-based, tested with canary secrets, and applied
again at sink boundaries as defense in depth. An LLM never decides what may be
recorded.

### Operational Telemetry Port

The application port is provider-neutral and non-authoritative. The default adapter
writes UTF-8 NDJSON outside repositories:

- profileless startup events use a machine-local metadata-only file;
- after explicit profile selection, events are isolated by profile;
- each line is one schema-valid event with newline-safe serialization;
- rotation, retention, quota, file permissions, flush, and recovery are explicit;
- zero-footprint mode never writes telemetry into the target repository.

The queue is bounded. Low-severity events may be sampled or dropped under pressure;
warnings, errors, drop counters, and sink-health transitions are prioritized. The
sink must not recursively report its own failure through itself. Telemetry failure
never changes a domain decision or weakens a gate.

An optional OpenTelemetry infrastructure adapter maps the same typed events to the
stable OpenTelemetry Logs data model and may derive low-cardinality metrics and
spans. The core package does not require an OpenTelemetry SDK or exporter. Export is
disabled until explicitly configured by profile or managed policy, and it receives
only the already-sanitized event projection.

### Evidence and Audit Ports

Workflow evidence and security audit use separate durable ports and queues. They are
not sampled or silently dropped. Evidence records reference exact task, head commit,
gate, adapter version, capability level, result, and correlation IDs without copying
large artifacts.

Audit covers at least profile binding changes, override attempts, policy changes,
purge, restore, export/promotion, sync join/forget/reset, schema migration, credential
configuration, and observability-policy changes. It records actor category, action,
target scope, policy decision, outcome, and before/after digests where safe, never
raw protected values.

Whether an unavailable evidence or audit sink blocks a requested action is a
policy-class decision owned by TASK-010. It must never be inferred by the adapter.

### Cost and Cardinality

Every signal defines per-event byte limits, queue limits, rotation/retention policy,
and health counters. Attribute values are bounded before allocation or serialization.
Metrics use a reviewed fixed dimension set. Debug verbosity, sampling, and optional
OpenTelemetry export are policy-controlled and observable.

## Test Boundaries

- Domain tests are pure and require no I/O.
- Application tests use in-memory or controlled fake port implementations.
- Every outbound adapter has contract tests shared with its fakes where practical.
- Infrastructure tests cover serialization, failure, recovery, and atomicity.
- Interface tests cover validation and result mapping.
- Package smoke tests exercise compiled public exports and the executable CLI.
- Architecture tests parse TypeScript imports and enforce this document.
- Failure-contract tests prove exhaustive mappings, safe public projections, and
  preservation of unexpected causes without leaking them.
- Composition tests prove complete explicit wiring, lifecycle order, startup rollback,
  idempotent close, and absence of ambient dependency lookup.
- Contract tests prove schema strictness, bounded parsing, generated-artifact drift,
  migration compatibility, safe diagnostics, and non-mutating validation.
- Observability tests prove signal separation, deterministic redaction, canary-secret
  exclusion, bounded queues, drop accounting, profile isolation, stable correlation,
  low-cardinality metrics, and sink-failure behavior.

Architecture fixtures must prove that every forbidden dependency edge fails and every
documented allowed edge passes. Regex-only import checks are insufficient.

## Extraction Readiness

A capability is structurally ready to become a separate package or service when:

- it has an explicit public application contract;
- callers do not import internal files;
- persistence is accessed only through owned ports;
- no mutable global state is shared;
- contract and conformance tests cover its boundary;
- its events and failure semantics are versioned.

This architecture reduces code coupling. It does not make a future service extraction
free: network failure, authentication, observability, deployment, data ownership, and
distributed consistency remain separate decisions.

## References

- Alistair Cockburn, Ports and Adapters:
  https://alistair.cockburn.us/hexagonal-architecture
- Robert C. Martin, The Dependency Rule:
  https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Martin Fowler, Monolith First:
  https://martinfowler.com/bliki/MonolithFirst.html
- Martin Fowler, Bounded Context:
  https://martinfowler.com/bliki/BoundedContext.html
- TypeScript narrowing and exhaustive checking:
  https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Node.js errors:
  https://nodejs.org/api/errors.html
- RFC 9457, machine-readable problem details:
  https://www.rfc-editor.org/info/rfc9457/
- Mark Seemann, Composition Root:
  https://blog.ploeh.dk/2011/07/28/CompositionRoot/
- Martin Fowler, Dependency Composition:
  https://martinfowler.com/articles/dependency-composition.html
- JSON Schema Draft 2020-12:
  https://json-schema.org/draft/2020-12
- Ajv schema management and standalone validators:
  https://ajv.js.org/guide/managing-schemas.html
- Ajv security considerations:
  https://ajv.js.org/security.html
- OpenTelemetry Logs data model:
  https://opentelemetry.io/docs/specs/otel/logs/data-model/
- W3C Trace Context:
  https://www.w3.org/TR/trace-context/
- OWASP Logging Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
