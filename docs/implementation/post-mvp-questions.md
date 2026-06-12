# Post-MVP Decision Register

These questions are intentionally deferred. They do not block `TASK-011` or the MVP.
The owning task must resolve its questions before moving from `planned` to `ready`.

| ID | Workstream | Question | Blocks |
|---|---|---|---|
| PMQ-001 | normalized events | What is the minimum stable lifecycle shared by all hosts, and which events are optional fidelity extensions? | TASK-003 |
| PMQ-002 | conformance evidence | Which evidence is sufficient to claim advisory, enforced, or native capability without trusting adapter self-reporting? | TASK-003 |
| PMQ-003 | skill registry | Which global skill roots may be discovered automatically, and which require explicit enrollment per profile or project? | TASK-004 |
| PMQ-004 | MCP | Which mutating operations may MCP expose, over which transports, and what authorization context must accompany them? | TASK-005 |
| PMQ-005 | OpenCode | Which supported OpenCode versions and hooks form the first native compatibility contract? | TASK-006 |
| PMQ-006 | Codex | Which Codex plugin, skill, and session hooks are stable enough to enforce rather than advise? | TASK-007 |
| PMQ-007 | Claude Code | Which Claude Code hooks and permission boundaries can preserve the toolkit authority model? | TASK-008 |
| PMQ-008 | Pi | What real usage or missing fidelity justifies maintaining a native Pi adapter instead of CLI/MCP fallback? | TASK-014 |
| PMQ-009 | memory providers | Which external provider is implemented first, and which data classes may leave the machine under each profile policy? | TASK-013 |
| PMQ-010 | audit durability | When evidence or audit storage is unavailable, which actions fail closed and which may proceed after a durable local pending record? | TASK-010 |
| PMQ-011 | remote observability | Which destinations, retention, disclosure, and cost limits are acceptable before enabling OpenTelemetry export? | TASK-010 |
| PMQ-012 | protected sync | Which cloud or remote transport is implemented first, and what authentication, encryption, revocation, and recovery contract is required? | TASK-015 |
| PMQ-013 | managed policy | How are organization policies distributed, authenticated, updated, and recovered without creating a mandatory hosted control plane? | future task after TASK-001 |

## Resolution Rule

For each question:

1. inspect current host APIs, repository evidence, and applicable standards;
2. document viable options and tradeoffs;
3. ask the human only when the choice is product policy rather than discoverable fact;
4. record the decision in the owning Task Packet and canonical architecture;
5. add a regression or conformance test that makes the decision observable.

Do not answer these questions speculatively during unrelated implementation.
