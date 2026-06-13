# Task Packets

Create one Markdown file per task. A Task Packet must define:

- identity, status, base branch, and base commit;
- observable outcome, scope, and acceptance criteria;
- write-set, read-set, forbidden-set, and exclusive resources;
- a progressive context route: required, on-demand, discovery, and do-not-preload;
- decisions and assumptions with evidence;
- open questions resolved before `ready`;
- documentation impact, including an explicit reason when no update is needed;
- dependencies, test map, verification command, and stop conditions;
- handoff evidence with base commit, head commit, and review status.

Workers must stop when the packet is ambiguous, stale, contradictory, or requires
work outside its declared ownership.

## State Machine

```text
deferred/planned -> ready -> active -> review -> reviewed -> done
```

| State | Meaning | Required authority |
|---|---|---|
| `deferred` | intentionally unscheduled | human/orchestrator |
| `planned` | scoped but not decision-complete or scheduled | orchestrator |
| `ready` | decisions resolved; eligible for dispatch | orchestrator after grill |
| `active` | owner, exact base SHA, branch, and worktree recorded | orchestrator |
| `review` | worker handed off one exact verified head | orchestrator after checking evidence |
| `reviewed` | independent reviewer approved that same head | orchestrator |
| `done` | human merge gate completed and merged SHA passed verify | human + orchestrator |

Workers never set `reviewed` or `done`. Reviewers never merge or edit workflow state.
The orchestrator may edit only workflow metadata while coordinating; it must not edit
product code.

Allowed feedback transitions are `review -> active` when changes are requested and
`reviewed -> active` whenever the approved head changes. Reopened product decisions
move the task to `planned`. `done` is terminal.

## Evidence Rules

- A role summary is not evidence.
- A handoff contains both a `Human Summary` and `Machine Evidence`. The summary makes
  the result understandable; the evidence makes it auditable. Both are required.
- The human summary states outcome, concrete changes, verification meaning, remaining
  work, and exactly one next gate: `independent-review`, `human-merge`, or `none`.
- `Response language` records a BCP 47 tag for the latest human request, such as
  `es`, `es-AR`, or `pt-BR`. The report uses that language without unnecessary
  mixing.
- `Unverified or inferred` explicitly separates what the agent did not observe from
  what it proved. Use `none - <reason>` only when every material claim is evidenced.
- Every execution, review, scope, and integrated-verification command is recorded
  with the exact commit on which it ran.
- A command failing for the wrong reason is not evidence.
- Negative tests assert the intended error and side effects. Any unrelated process
  failure is insufficient.
- For behavior changes and bug fixes, the declared initial evidence command must
  reach the expected behavioral oracle before implementation begins. Infrastructure,
  dependency, configuration, compilation, permission, and harness failures are
  recorded as `Initial evidence result: blocked-invalid-baseline`.
- `blocked-invalid-baseline` is a stop condition, not permission to create an
  alternate focused test, modify the harness, or proceed with implementation. A
  later test cannot retroactively satisfy the test-first gate.
- Only repair the baseline when the approved Task Packet explicitly scopes that
  repair. Otherwise report the observed failure and the smallest next action needed
  to make the declared baseline executable.
- That next action must directly address the observed failure; do not introduce
  unrelated tools, setup, or repository changes.
- Every acceptance criterion maps by ID (`AC1`, `AC2`, ...) to a concrete test,
  inspection, or artifact using `AC1: evidence; AC2: evidence`. Bare IDs or words
  such as `passed`, `done`, or `checked` are invalid evidence.
- A reviewer independently inspects the diff and reruns required verification.
- The reviewer identity must differ from the implementation owner.
- Review approval is valid only for the exact recorded head. Any later change makes
  it stale.
- `done` requires an observed merged commit and verification on that integrated
  commit; approval before merge is only `reviewed`.

Test-first terminology is explicit:

- **Behavior change or bug fix:** demonstrate the expected failing test before the
  implementation change and record `Initial evidence result: failed-intended`.
- **Characterization or release hardening:** existing behavior may already pass. State
  that classification, record `Initial evidence result: passed-characterization`,
  and prove the test would detect the claimed regression; do not fabricate a red
  phase.
- **Documentation or research:** use deterministic review criteria and record
  `Initial evidence result: reviewed-non-executable`.

## Dispatch Size

A `planned` packet may describe a post-MVP epic. It is not dispatchable merely because
the file exists.

Before moving an epic to `ready`, the orchestrator must split it when any of these are
true:

- more than one independently testable capability is included;
- the write-set crosses multiple capability owners;
- implementation is expected to exceed three focused agent-days;
- more than one worker could safely deliver disjoint vertical slices;
- an unresolved question would force the worker to make product policy.

Each child packet must leave the repository integrated and verified. Less-capable
workers receive one child packet, exact ownership, a bounded context route, and no
unresolved product decisions.

Run `agentic-workflow grill --task <path>` before moving a task to `ready`.
Run `agentic-workflow context --role implementer --task <path>` before loading
project context.
