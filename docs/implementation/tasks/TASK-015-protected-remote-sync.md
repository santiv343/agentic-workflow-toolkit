# Task Packet: TASK-015 - Protected Remote Sync Transport

## Metadata

- Status: deferred
- Base branch: `main`
- Base commit: set at dispatch
- Worker branch:
- Worktree:
- Dependencies: TASK-002

## Mission

Replace manual plaintext bundle transfer with an authenticated and encrypted remote
transport while reusing the approved sync protocol, merge rules, and profile policy.

## Scope

Included:

- one selected remote/cloud transport adapter;
- authentication, encryption in transit, channel enrollment, revocation, and recovery;
- push/pull, retries, quotas, cost limits, and status;
- transport capability and conformance tests;
- migration from a plaintext channel into a new protected channel.

Excluded:

- changing causal merge semantics owned by TASK-002;
- silently uploading existing profile data;
- claiming end-to-end encryption unless the design and implementation provide it;
- mandatory hosted service for local toolkit operation.

## Ownership

- Write-set: remote transport adapter, credential interface, conformance fixtures,
  status/CLI additions, security/docs
- Read-set: TASK-002 protocol and TASK-001 policy/credential ports
- Forbidden-set: raw SQLite files, provider credentials in repo, unrelated adapters
- Exclusive resources: remote transport ID, authentication flow, protection claims

## Context Route

### Required

- `AGENTS.md`
- `docs/implementation/post-mvp-questions.md`
- integrated TASK-002 sync transport contract
- effective profile security policy

### On demand

- selected provider official API/security documentation
- credential-store adapter contract
- plaintext-channel migration rules

### Discovery

- provider quota, retry, consistency, revocation, and recovery semantics
- least-privilege credential storage available on supported operating systems

### Do not preload

- profile payloads or databases
- providers not selected for implementation
- unrelated host adapters

## Decisions

- Decision: reuse logical envelopes and merge semantics from TASK-002.
  - Evidence: transport replacement must not create a second sync engine.
- Decision: enrollment and upload require explicit preview and consent.
  - Evidence: remote disclosure is not implied by local or plaintext sync.
- Decision: protection claims are capability-specific and test-backed.
  - Evidence: TLS, provider encryption, and end-to-end encryption are distinct.

## Open Questions

- `PMQ-012`: first provider and authentication, encryption, revocation, and recovery
  contract.

## Assumptions

- Assumption: TASK-002 exposes a transport-neutral protocol and conformance suite.
  - Evidence: TASK-015 depends on the integrated plaintext transport foundation.

## Documentation Impact

- Update: threat model, provider setup, credentials, costs, migration, recovery,
  capability matrix, changelog
- Reason: remote transport changes disclosure, security, availability, and cost.

## Acceptance Criteria

1. No data uploads before explicit channel enrollment and preview.
2. Credentials use an approved external secret mechanism and never enter repositories.
3. Push/pull are idempotent and preserve TASK-002 conflict semantics.
4. Revocation and recovery behave according to the approved threat model.
5. Quotas, retries, backoff, and cost limits are deterministic and visible.
6. Transport outage cannot corrupt local state or acknowledged envelopes.
7. Protection claims match conformance evidence.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1-AC2 | enrollment/secret canaries | implicit upload or leaked secret | consent and secret boundary hold |
| AC3 | shared transport conformance | remote merge diverges | logical result matches file transport |
| AC4 | revocation/recovery fixtures | stale client retains authority | approved policy is enforced |
| AC5-AC7 | quota/outage/security faults | unbounded retry or false claim | bounded safe behavior and evidence |

## Plan

1. Resolve PMQ-012.
2. Threat-model and decompose enrollment, transport, and recovery packets.
3. Run shared transport tests against a deterministic fake.
4. Implement the selected provider adapter.
5. Complete security review and documentation.

## Stop Conditions

Stop if provider behavior cannot satisfy protocol safety, secrets require repository
storage, protection claims are ambiguous, or cost cannot be bounded.

## Definition of Done

- [ ] Epic was decomposed before dispatch.
- [ ] Acceptance criteria demonstrated.
- [ ] Verification, security review, and transport conformance passed.
- [ ] Open Questions is `none`.
- [ ] Documentation impact was completed.
- [ ] Independent review recorded the reviewed head commit.
