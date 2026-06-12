# Toolkit Architecture

This document defines the target architecture delivered by TASK-009. Until that task
is integrated, the current flat JavaScript layout is legacy structure, not precedent
for new modules.

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

## Test Boundaries

- Domain tests are pure and require no I/O.
- Application tests use in-memory or controlled fake port implementations.
- Every outbound adapter has contract tests shared with its fakes where practical.
- Infrastructure tests cover serialization, failure, recovery, and atomicity.
- Interface tests cover validation and result mapping.
- Package smoke tests exercise compiled public exports and the executable CLI.
- Architecture tests parse TypeScript imports and enforce this document.

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
