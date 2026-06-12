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
