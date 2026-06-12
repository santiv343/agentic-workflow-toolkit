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

Run `agentic-workflow grill --task <path>` before moving a task to `ready`.
Run `agentic-workflow context --role implementer --task <path>` before loading
project context.
