import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.resolve('bin/agentic-workflow.js');
const fixtures = [];

async function createFixture() {
  const fixture = await mkdtemp(path.join(tmpdir(), 'agentic-workflow-'));
  fixtures.push(fixture);
  return fixture;
}

async function runCli(args) {
  return execFileAsync(process.execPath, [CLI_PATH, ...args], {
    cwd: path.resolve('.'),
  });
}

async function runGit(args, cwd) {
  return execFileAsync('git', args, { cwd });
}

async function initFixture(fixture, extraArgs = []) {
  return runCli([
    'init',
    '--cwd',
    fixture,
    '--base-branch',
    'trunk',
    '--verify-command',
    'verify-project',
    ...extraArgs,
  ]);
}

async function addBoardRow(fixture, row) {
  const boardPath = path.join(
    fixture,
    'docs',
    'implementation',
    'orchestration-board.md',
  );
  const lines = (await readFile(boardPath, 'utf8')).split(/\r?\n/u);
  const headerIndex = lines.findIndex((line) => /^\| ID \|/u.test(line));
  lines.splice(headerIndex + 2, 0, row);
  await writeFile(boardPath, lines.join('\n'), 'utf8');
}

function reviewedPacket({
  base,
  head,
  id,
  reviewer,
  status = 'reviewed',
}) {
  const approved = status === 'reviewed';
  return `# Task Packet: ${id} - Review integrity

## Metadata

- Status: ${status}
- Base branch: \`trunk\`
- Base commit: ${base}
- Worker branch: ${id}-review-integrity
- Worktree: ../worktrees/${id}-review-integrity
- Dependencies: none

## Mission

Prove review identity and Git ancestry constraints.

## Scope

Included:

- Review integrity evidence.

Excluded:

- Product behavior changes.

## Ownership

- Write-set: \`test/\`
- Read-set: \`src/\`
- Forbidden-set: \`docs/archive/\`
- Exclusive resources: none

## Context Route

### Required

- \`AGENTS.md\`

### On demand

- none

### Discovery

- \`Review integrity\`

### Do not preload

- \`docs/archive/\`

## Decisions

- Decision: review one exact descendant of the dispatch base.
  - Evidence: unrelated commits cannot represent dispatched work.

## Open Questions

- none

## Assumptions

- Assumption: Git ancestry identifies the dispatched change lineage.
  - Evidence: base and head are immutable commits in the fixture.

## Documentation Impact

- Update: \`AGENTS.md\`
- Reason: review authority and lineage are workflow behavior.

## Acceptance Criteria

1. Invalid review identity or ancestry is rejected.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | check fixture | invalid review passes | invalid review is rejected |

## Plan

1. Record review evidence.
2. Run the workflow check.

## Stop Conditions

Stop if Git evidence is unavailable.

## Handoff Evidence

### Human Summary

- Response language: en
- Outcome summary: The fixture records one exact review target for validation.
- Changes made: Added review identity and Git lineage evidence to the Task Packet.
- Verification summary: The workflow check evaluates reviewer separation and ancestry.
- Unverified or inferred: none - the fixture uses repository commits as evidence.
- Remaining work: The next authority depends on the current workflow state.
- Next gate: ${approved ? 'human-merge' : 'independent-review'}

### Machine Evidence

- Work classification: hardening
- Initial evidence command: \`npm test\`
- Initial evidence result: passed-characterization
- Initial evidence: existing workflow validation completed before this fixture
- Failure oracle: invalid reviewer identity or unrelated head must fail check
- Head commit: ${head}
- Verification command: \`npm run verify\`
- Verification result: passed
- Verified commit: ${head}
- Acceptance criteria: AC1: workflow check evaluates exact review integrity
- Scope command: \`git diff --name-only ${base}...${head}\`
- Scope result: passed
- Review status: ${approved ? 'approved' : 'pending'}
- Reviewer: ${approved ? reviewer : 'pending'}
- Reviewed commit: ${approved ? head : 'pending'}
- Review verification command: ${approved ? '`npm run verify`' : 'pending'}
- Review verification result: ${approved ? 'passed' : 'pending'}
- Review verified commit: ${approved ? head : 'pending'}
- Findings: ${approved ? 'none' : 'pending'}
- Residual risks: ${approved ? 'none' : 'pending'}
- Merge authorized by: pending
- Merge status: ${approved ? 'pending human gate' : 'pending'}
- Merged commit: pending
- Integrated verification command: pending
- Integrated verification result: pending
- Integrated verified commit: pending

## Definition of Done

- [x] Acceptance criteria demonstrated.
`;
}

test.after(async () => {
  await Promise.all(
    fixtures.map((fixture) => rm(fixture, { force: true, recursive: true })),
  );
});

test('init creates the portable workflow contract with configured commands', async () => {
  const fixture = await createFixture();

  const { stdout } = await runCli([
    'init',
    '--cwd',
    fixture,
    '--base-branch',
    'trunk',
    '--verify-command',
    'npm test',
  ]);

  assert.match(stdout, /Initialized agentic workflow/);

  const agents = await readFile(path.join(fixture, 'AGENTS.md'), 'utf8');
  const workflow = await readFile(
    path.join(fixture, '.agentic', 'workflow.yaml'),
    'utf8',
  );
  const board = await readFile(
    path.join(fixture, 'docs', 'implementation', 'orchestration-board.md'),
    'utf8',
  );
  const tasks = await readFile(
    path.join(fixture, 'docs', 'implementation', 'tasks', 'README.md'),
    'utf8',
  );

  assert.match(agents, /Base branch: `trunk`/);
  assert.match(agents, /verify: `npm test`/);
  assert.match(workflow, /base_branch: "trunk"/);
  assert.match(workflow, /verify: "npm test"/);
  assert.match(board, /# Orchestration Board/);
  assert.match(tasks, /# Task Packets/);
  assert.match(agents, /Workers may report evidence, but cannot approve their own work/);
  assert.match(agents, /Characterization or hardening work may begin with passing tests/);
  assert.match(tasks, /planned.*ready.*active.*review.*reviewed.*done/s);
  assert.match(tasks, /A command failing for the wrong reason is not evidence/);
  assert.match(
    await readFile(
      path.join(
        fixture,
        'docs',
        'implementation',
        'tasks',
        'TASK.template.md',
      ),
      'utf8',
    ),
    /## Handoff Evidence/,
  );
  assert.match(
    await readFile(
      path.join(
        fixture,
        'docs',
        'implementation',
        'tasks',
        'TASK.template.md',
      ),
      'utf8',
    ),
    /Response language: pending[\s\S]*Unverified or inferred: pending[\s\S]*Initial evidence result: pending[\s\S]*Review verification command: pending[\s\S]*Merge authorized by: pending/,
  );
  assert.match(
    await readFile(
      path.join(fixture, '.agentic', 'learnings', 'README.md'),
      'utf8',
    ),
    /# Learning Inbox/,
  );
});

test('init infers conventional git base branch and package verify command', async () => {
  const fixture = await createFixture();
  await runGit(['init', '-b', 'trunk'], fixture);
  await writeFile(
    path.join(fixture, 'package.json'),
    JSON.stringify({ scripts: { verify: 'run-quality-gates' } }),
    'utf8',
  );
  await writeFile(path.join(fixture, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n', 'utf8');

  const { stdout } = await runCli(['init', '--cwd', fixture]);

  assert.match(stdout, /base branch: trunk \(git-current-conventional\)/);
  assert.match(stdout, /verify command: pnpm verify \(package-script\)/);
  assert.match(
    await readFile(path.join(fixture, 'AGENTS.md'), 'utf8'),
    /verify: `pnpm verify`/,
  );
});

test('explicit init values override inferred project defaults', async () => {
  const fixture = await createFixture();
  await runGit(['init', '-b', 'main'], fixture);
  await writeFile(
    path.join(fixture, 'package.json'),
    JSON.stringify({ scripts: { verify: 'run-quality-gates' } }),
    'utf8',
  );

  await initFixture(fixture);

  assert.match(
    await readFile(path.join(fixture, 'AGENTS.md'), 'utf8'),
    /Base branch: `trunk`/,
  );
  assert.match(
    await readFile(path.join(fixture, 'AGENTS.md'), 'utf8'),
    /verify: `verify-project`/,
  );
});

test('init asks only for values that cannot be inferred safely', async () => {
  const fixture = await createFixture();

  await assert.rejects(
    runCli(['init', '--cwd', fixture]),
    /Could not infer base branch and verify command/,
  );
});

test('init refuses existing files without making partial changes', async () => {
  const fixture = await createFixture();
  const workflowPath = path.join(fixture, '.agentic', 'workflow.yaml');
  await mkdir(path.dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, 'existing: content\n', 'utf8');

  await assert.rejects(
    initFixture(fixture),
    /Refusing to overwrite existing files/,
  );

  assert.equal(await readFile(workflowPath, 'utf8'), 'existing: content\n');
  await assert.rejects(access(path.join(fixture, 'AGENTS.md')));
});

test('init overwrites only managed files when force is explicit', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const unrelatedPath = path.join(fixture, 'notes.txt');
  await writeFile(path.join(fixture, 'AGENTS.md'), 'old contract\n', 'utf8');
  await writeFile(unrelatedPath, 'keep me\n', 'utf8');

  await initFixture(fixture, ['--force']);

  assert.match(
    await readFile(path.join(fixture, 'AGENTS.md'), 'utf8'),
    /Base branch: `trunk`/,
  );
  assert.equal(await readFile(unrelatedPath, 'utf8'), 'keep me\n');
});

test('init is idempotent when managed files already match', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);

  const { stdout } = await initFixture(fixture);

  assert.match(stdout, /0 written, 8 unchanged/);
});

test('init dry-run reports work without changing the repository', async () => {
  const fixture = await createFixture();

  const { stdout } = await initFixture(fixture, ['--dry-run']);

  assert.match(stdout, /Dry run/);
  assert.match(stdout, /8 planned/);
  await assert.rejects(access(path.join(fixture, 'AGENTS.md')));
});

test('init installs a workflow schema and task packet template', async () => {
  const fixture = await createFixture();

  await initFixture(fixture);

  const schema = JSON.parse(
    await readFile(
      path.join(fixture, '.agentic', 'workflow.schema.json'),
      'utf8',
    ),
  );
  const taskTemplate = await readFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      'TASK.template.md',
    ),
    'utf8',
  );

  assert.equal(schema.title, 'Agentic Workflow Configuration');
  assert.match(taskTemplate, /## Acceptance Criteria/);
  assert.match(taskTemplate, /## Ownership/);
  assert.match(taskTemplate, /## Test Map/);
});

test('check accepts a freshly initialized workflow', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);

  const { stdout } = await runCli(['check', '--cwd', fixture]);

  assert.match(stdout, /Workflow configuration is valid/);
  assert.match(stdout, /0 errors, 0 warnings/);
});

test('check rejects contradictory workflow safety settings', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const workflowPath = path.join(fixture, '.agentic', 'workflow.yaml');
  const workflow = await readFile(workflowPath, 'utf8');

  await writeFile(
    workflowPath,
    workflow
      .replace('require_isolated_worktree: true', 'require_isolated_worktree: false')
      .replace('allow_worker_merge: false', 'allow_worker_merge: true')
      .replace('max_parallel_writers: 1', 'max_parallel_writers: 3')
      .replace(
        'require_disjoint_write_sets: true',
        'require_disjoint_write_sets: false',
      )
      .replace('can_self_review: false', 'can_self_review: true'),
    'utf8',
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /parallel_without_isolation/);
    assert.match(error.stdout, /parallel_without_disjoint_write_sets/);
    assert.match(error.stdout, /worker_merge_bypasses_gate/);
    assert.match(error.stdout, /reviewer_self_review/);
    return true;
  });
});

test('check enforces schema values and rejects unknown configuration keys', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const workflowPath = path.join(fixture, '.agentic', 'workflow.yaml');
  const workflow = await readFile(workflowPath, 'utf8');
  await writeFile(
    workflowPath,
    workflow
      .replace('human_merge_gate: "required"', 'human_merge_gate: "sometimes"')
      .replace('integration: "serial"', 'integration: "chaotic"')
      .replace('max_parallel_writers: 1', 'max_parallel_writers: 0')
      .concat('\nunexpected: true\n'),
    'utf8',
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /invalid_config_value/);
    assert.match(error.stdout, /unknown_config_key/);
    return true;
  });
});

test('check detects possible secrets in configured bindings without echoing them', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const bindings = path.join(fixture, '.agentic', 'bindings');
  const fakeSecret = 'sk-test-1234567890abcdef';
  await mkdir(bindings, { recursive: true });
  await writeFile(
    path.join(bindings, 'example.yaml'),
    `provider:\n  api_key: "${fakeSecret}"\n`,
    'utf8',
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /possible_secret/);
    assert.doesNotMatch(error.stdout, new RegExp(fakeSecret));
    return true;
  });
});

test('check rejects invalid YAML and unsafe or missing canonical paths', async (t) => {
  await t.test('invalid YAML', async () => {
    const fixture = await createFixture();
    await initFixture(fixture);
    await writeFile(
      path.join(fixture, '.agentic', 'workflow.yaml'),
      'version: [\n',
      'utf8',
    );

    await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
      assert.match(error.stdout, /invalid_yaml/);
      return true;
    });
  });

  await t.test('unsafe and missing paths', async () => {
    const fixture = await createFixture();
    await initFixture(fixture);
    const workflowPath = path.join(fixture, '.agentic', 'workflow.yaml');
    const workflow = await readFile(workflowPath, 'utf8');
    await writeFile(
      workflowPath,
      workflow
        .replace(
          'project_contract: "AGENTS.md"',
          'project_contract: "../AGENTS.md"',
        )
        .replace(
          'orchestration_board: "docs/implementation/orchestration-board.md"',
          'orchestration_board: "docs/missing-board.md"',
        ),
      'utf8',
    );

    await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
      assert.match(error.stdout, /unsafe_path/);
      assert.match(error.stdout, /missing_path/);
      return true;
    });
  });
});

test('doctor reports available CLIs as portable structured data', async () => {
  const { stdout } = await runCli(['doctor', '--json']);
  const report = JSON.parse(stdout);
  const node = report.tools.find((tool) => tool.name === 'node');
  const npm = report.tools.find((tool) => tool.name === 'npm');
  const pi = report.tools.find((tool) => tool.name === 'pi');

  assert.equal(report.platform, process.platform);
  assert.equal(node.available, true);
  assert.equal(npm.available, true);
  assert.equal(typeof node.version, 'string');
  assert.equal(pi.category, 'agent-cli');
  assert.equal(
    report.tools.some((tool) => tool.category === 'agent-memory'),
    false,
  );
  assert.ok(
    report.tools.every(
      (tool) =>
        typeof tool.name === 'string' &&
        typeof tool.category === 'string' &&
        typeof tool.available === 'boolean',
    ),
  );
});

test('context returns a role-specific progressive disclosure route without file contents', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const architecturePath = path.join(fixture, 'docs', 'architecture.md');
  const taskPath = path.join(
    fixture,
    'docs',
    'implementation',
    'tasks',
    'TASK-001.md',
  );
  await writeFile(architecturePath, '# Architecture\n\nSensitive details.\n', 'utf8');
  await writeFile(
    taskPath,
    `# Task Packet: TASK-001

## Context Route

### Required

- \`docs/architecture.md#boundaries\`

### On demand

- \`docs/decisions/\`

### Discovery

- \`TargetSymbol callers and callees\`

### Do not preload

- \`docs/archive/\`
`,
    'utf8',
  );

  const { stdout } = await runCli([
    'context',
    '--cwd',
    fixture,
    '--role',
    'implementer',
    '--task',
    'docs/implementation/tasks/TASK-001.md',
    '--json',
  ]);
  const route = JSON.parse(stdout);

  assert.equal(route.role, 'implementer');
  assert.deepEqual(
    route.bootstrap.map((entry) => entry.path),
    ['AGENTS.md', '.agentic/workflow.yaml'],
  );
  assert.equal(
    route.task.path,
    'docs/implementation/tasks/TASK-001.md',
  );
  assert.deepEqual(
    route.required.map((entry) => entry.path),
    ['docs/architecture.md#boundaries'],
  );
  assert.deepEqual(route.onDemand, ['docs/decisions/']);
  assert.deepEqual(route.discovery, ['TargetSymbol callers and callees']);
  assert.deepEqual(route.doNotPreload, ['docs/archive/']);
  assert.doesNotMatch(stdout, /Sensitive details/);
});

test('context reports budget and missing required paths before execution', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const taskPath = path.join(
    fixture,
    'docs',
    'implementation',
    'tasks',
    'TASK-002.md',
  );
  await writeFile(
    taskPath,
    `# Task Packet: TASK-002

## Context Route

### Required

- \`docs/missing.md\`
`,
    'utf8',
  );

  await assert.rejects(
    runCli([
      'context',
      '--cwd',
      fixture,
      '--role',
      'implementer',
      '--task',
      'docs/implementation/tasks/TASK-002.md',
    ]),
    (error) => {
      assert.match(error.stdout, /MISSING/);
      assert.match(error.stdout, /docs\/missing\.md/);
      assert.match(error.stdout, /Bootstrap budget:/);
      return true;
    },
  );
});

test('context requires task packets only for execution and review roles', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);

  const orchestrator = await runCli([
    'context',
    '--cwd',
    fixture,
    '--role',
    'orchestrator',
    '--json',
  ]);
  assert.equal(JSON.parse(orchestrator.stdout).task, null);

  await assert.rejects(
    runCli([
      'context',
      '--cwd',
      fixture,
      '--role',
      'reviewer',
    ]),
    /--task is required for role reviewer/,
  );
});

test('grill accepts an explicit decision-complete task packet', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const taskPath = path.join(
    fixture,
    'docs',
    'implementation',
    'tasks',
    'TASK-003.md',
  );
  await writeFile(
    taskPath,
    `# Task Packet: TASK-003 - Example

## Metadata

- Status: ready
- Base branch: \`trunk\`
- Base commit: abc123
- Worker branch: task-003
- Worktree: ../worktrees/task-003
- Dependencies: none

## Mission

Add an observable behavior with a deterministic result.

## Scope

Included:

- One behavior.

Excluded:

- Unrelated behavior.

## Ownership

- Write-set: \`src/example.js\`
- Read-set: \`src/reference.js\`
- Forbidden-set: \`src/unrelated/\`
- Exclusive resources: none

## Context Route

### Required

- \`src/reference.js\`

### On demand

- none

### Discovery

- \`Example callers\`

### Do not preload

- \`docs/archive/\`

## Decisions

- Decision: preserve the existing public API.
  - Evidence: current contract and acceptance criterion AC1.

## Open Questions

- none

## Assumptions

- Assumption: the existing test runner is authoritative.
  - Evidence: \`npm run verify\` is the configured project gate.

## Documentation Impact

- Update: \`README.md\`
- Reason: public behavior changes.

## Acceptance Criteria

1. AC1: the behavior is observable.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | example test | behavior absent | behavior present |

## Plan

1. Add a failing test.
2. Implement the behavior.
3. Run \`npm run verify\`.

## Stop Conditions

Stop on scope expansion.

## Handoff Evidence

### Human Summary

- Response language: en
- Outcome summary: Implementation has not started; this packet is ready for dispatch.
- Changes made: No product files changed because ready is a pre-execution state.
- Verification summary: The grill validates that planning decisions are explicit.
- Unverified or inferred: none - this summary claims only the current planning state.
- Remaining work: Dispatch, implementation, independent review, and integration remain.
- Next gate: independent-review

### Machine Evidence

- Work classification: pending
- Initial evidence command: pending
- Initial evidence result: pending
- Initial evidence: pending
- Failure oracle: pending
- Head commit: pending
- Verification command: pending
- Verification result: pending
- Verified commit: pending
- Acceptance criteria: pending
- Scope command: pending
- Scope result: pending
- Review status: pending
- Reviewer: pending
- Reviewed commit: pending
- Review verification command: pending
- Review verification result: pending
- Review verified commit: pending
- Findings: pending
- Residual risks: pending
- Merge authorized by: pending
- Merge status: pending
- Merged commit: pending
- Integrated verification command: pending
- Integrated verification result: pending
- Integrated verified commit: pending

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Documentation impact completed.
`,
    'utf8',
  );

  const { stdout } = await runCli([
    'grill',
    '--cwd',
    fixture,
    '--task',
    'docs/implementation/tasks/TASK-003.md',
  ]);

  assert.match(stdout, /Grill gate passed/);
  assert.match(stdout, /0 blockers/);
});

test('grill blocks implicit decisions, unsupported assumptions, and forgotten docs', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const taskPath = path.join(
    fixture,
    'docs',
    'implementation',
    'tasks',
    'TASK-004.md',
  );
  await writeFile(
    taskPath,
    `# Task Packet: TASK-004 - Example

## Metadata

- Status: ready

## Mission

TBD

## Open Questions

- Which compatibility behavior should be used?

## Assumptions

- The old behavior is probably correct.

## Documentation Impact

- none
`,
    'utf8',
  );

  await assert.rejects(
    runCli([
      'grill',
      '--cwd',
      fixture,
      '--task',
      'docs/implementation/tasks/TASK-004.md',
    ]),
    (error) => {
      assert.match(error.stdout, /unresolved_question/);
      assert.match(error.stdout, /assumption_without_evidence/);
      assert.match(error.stdout, /documentation_without_reason/);
      assert.match(error.stdout, /placeholder/);
      assert.match(error.stdout, /Recommended action:/);
      return true;
    },
  );
});

test('grill blocks reviewed tasks without exact handoff evidence', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const taskPath = path.join(
    fixture,
    'docs',
    'implementation',
    'tasks',
    'TASK-REVIEWED.md',
  );
  await writeFile(
    taskPath,
    `# Task Packet: TASK-REVIEWED - Example

## Metadata

- Status: reviewed
- Base branch: \`trunk\`
- Base commit: pending
- Worker branch:
- Worktree:
- Dependencies: none

## Mission

Prove reviewed work cannot be declared from a summary alone.

## Scope

Included:

- Review evidence.

Excluded:

- Product changes.

## Ownership

- Write-set: \`test/\`
- Read-set: \`src/\`
- Forbidden-set: \`docs/archive/\`
- Exclusive resources: none

## Context Route

### Required

- \`AGENTS.md\`

### On demand

- none

### Discovery

- \`Review evidence\`

### Do not preload

- \`docs/archive/\`

## Decisions

- Decision: require exact reviewed commits.
  - Evidence: summaries can be stale or unsupported.

## Open Questions

- none

## Assumptions

- Assumption: Git commits identify immutable review targets.
  - Evidence: the project requires head-SHA review.

## Documentation Impact

- Update: \`AGENTS.md\`
- Reason: completion claims are workflow behavior.

## Acceptance Criteria

1. Reviewed status requires durable evidence.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | grill | unsupported review passes | unsupported review blocks |

## Plan

1. Add the gate.
2. Run verification.

## Stop Conditions

Stop if review evidence is unavailable.

## Definition of Done

- [ ] Acceptance criteria demonstrated.

## Handoff Evidence

- Work classification: pending
- Initial evidence: pending
- Failure oracle: pending
- Head commit: pending
- Verification command: pending
- Verification result: pending
- Verified commit: pending
- Acceptance criteria: pending
- Scope result: pending
- Review status: approved
- Reviewer: pending
- Reviewed commit: pending
- Findings: pending
- Residual risks: pending
- Merge status: pending
- Merged commit: pending
- Integrated verification result: pending
- Integrated verified commit: pending
`,
    'utf8',
  );

  await assert.rejects(
    runCli([
      'grill',
      '--cwd',
      fixture,
      '--task',
      'docs/implementation/tasks/TASK-REVIEWED.md',
    ]),
    (error) => {
      assert.match(error.stdout, /dispatch_evidence_missing/);
      assert.match(error.stdout, /handoff_evidence_incomplete/);
      assert.match(error.stdout, /review_evidence_incomplete/);
      return true;
    },
  );
});

test('grill accepts reviewed tasks with verified exact-SHA evidence', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const taskPath = path.join(
    fixture,
    'docs',
    'implementation',
    'tasks',
    'TASK-REVIEWED.md',
  );
  const head = '0123456789abcdef0123456789abcdef01234567';
  const base = 'fedcba9876543210fedcba9876543210fedcba98';
  await writeFile(
    taskPath,
    `# Task Packet: TASK-REVIEWED - Example

## Metadata

- Status: reviewed
- Base branch: \`trunk\`
- Base commit: ${base}
- Worker branch: TASK-REVIEWED-example
- Worktree: ../worktrees/TASK-REVIEWED-example
- Dependencies: none

## Mission

Record independently verified handoff evidence.

## Scope

Included:

- Review evidence.

Excluded:

- Product changes.

## Ownership

- Write-set: \`test/\`
- Read-set: \`src/\`
- Forbidden-set: \`docs/archive/\`
- Exclusive resources: none

## Context Route

### Required

- \`AGENTS.md\`

### On demand

- none

### Discovery

- \`Review evidence\`

### Do not preload

- \`docs/archive/\`

## Decisions

- Decision: require exact reviewed commits.
  - Evidence: immutable review targets prevent stale approval.

## Open Questions

- none

## Assumptions

- Assumption: the reviewer ran the configured verification.
  - Evidence: the handoff records the command and result.

## Documentation Impact

- Update: \`AGENTS.md\`
- Reason: completion claims are workflow behavior.

## Acceptance Criteria

1. Reviewed status requires durable evidence.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | grill | unsupported review passes | reviewed evidence passes |

## Plan

1. Add the gate.
2. Run verification.

## Stop Conditions

Stop if review evidence is unavailable.

## Definition of Done

- [x] Acceptance criteria demonstrated.

## Handoff Evidence

### Human Summary

- Response language: en
- Outcome summary: Reviewed tasks now require independently verified exact-SHA evidence.
- Changes made: Added one complete reviewed-state fixture for the grill contract.
- Verification summary: The grill accepts the packet only when every required field is valid.
- Unverified or inferred: none - every material claim is covered by this grill fixture.
- Remaining work: The human merge gate remains pending and no integration is claimed.
- Next gate: human-merge

### Machine Evidence

- Work classification: hardening
- Initial evidence command: \`npm test\`
- Initial evidence result: passed-characterization
- Initial evidence: passing characterization baseline before adding the durable gate
- Failure oracle: removing exact-SHA evidence makes the grill reject reviewed status
- Head commit: ${head}
- Verification command: \`npm run verify\`
- Verification result: passed
- Verified commit: ${head}
- Acceptance criteria: AC1: exact-SHA grill verification passes this packet
- Scope command: \`git diff --name-only ${base}...${head}\`
- Scope result: passed
- Review status: approved
- Reviewer: independent-reviewer
- Reviewed commit: ${head}
- Review verification command: \`npm run verify\`
- Review verification result: passed
- Review verified commit: ${head}
- Findings: none
- Residual risks: none
- Merge authorized by: pending
- Merge status: pending human gate
- Merged commit: pending
- Integrated verification command: pending
- Integrated verification result: pending
- Integrated verified commit: pending
`,
    'utf8',
  );

  const { stdout } = await runCli([
    'grill',
    '--cwd',
    fixture,
    '--task',
    'docs/implementation/tasks/TASK-REVIEWED.md',
  ]);

  assert.match(stdout, /Grill gate passed/);
  assert.match(stdout, /0 blockers/);
});

test('check applies the grill gate to ready task packets', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  await writeFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      'TASK-005.md',
    ),
    `# Task Packet: TASK-005

## Metadata

- Status: ready

## Mission

TBD
`,
    'utf8',
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /task_not_ready/);
    assert.match(error.stdout, /TASK-005.md/);
    return true;
  });
});

test('check rejects orchestration-board state that contradicts its Task Packet', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  await writeFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      'TASK-016.md',
    ),
    `# Task Packet: TASK-016 - State consistency

## Metadata

- Status: planned
`,
    'utf8',
  );
  await addBoardRow(
    fixture,
    '| TASK-016 | State consistency | none | ready | unassigned | - | - | docs | - | - |',
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /task_state_mismatch/);
    assert.match(error.stdout, /TASK-016/);
    return true;
  });
});

test('check rejects dispatch commits that do not exist in Git', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const missingCommit = '0123456789abcdef0123456789abcdef01234567';
  await writeFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      'TASK-017.md',
    ),
    `# Task Packet: TASK-017 - Missing dispatch commit

## Metadata

- Status: active
- Base branch: \`trunk\`
- Base commit: ${missingCommit}
- Worker branch: TASK-017-missing-dispatch
- Worktree: ../worktrees/TASK-017-missing-dispatch
- Dependencies: none

## Mission

Reject dispatch metadata that cannot be verified.
`,
    'utf8',
  );
  await addBoardRow(
    fixture,
    `| TASK-017 | Missing dispatch commit | none | active | worker-1 | TASK-017-missing-dispatch | ../worktrees/TASK-017-missing-dispatch | test | ${missingCommit} | - |`,
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /task_base_commit_missing/);
    assert.match(error.stdout, /TASK-017/);
    return true;
  });
});

test('check rejects self-review even when the exact head is approved', async () => {
  const fixture = await createFixture();
  await runGit(['init', '-b', 'trunk'], fixture);
  await runGit(['config', 'user.email', 'agent@example.test'], fixture);
  await runGit(['config', 'user.name', 'Agent Test'], fixture);
  await writeFile(path.join(fixture, 'base.txt'), 'base\n', 'utf8');
  await runGit(['add', 'base.txt'], fixture);
  await runGit(['commit', '-m', 'base'], fixture);
  const base = (await runGit(['rev-parse', 'HEAD'], fixture)).stdout.trim();
  await writeFile(path.join(fixture, 'head.txt'), 'head\n', 'utf8');
  await runGit(['add', 'head.txt'], fixture);
  await runGit(['commit', '-m', 'head'], fixture);
  const head = (await runGit(['rev-parse', 'HEAD'], fixture)).stdout.trim();
  await initFixture(fixture);
  const id = 'TASK-018';
  await writeFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      `${id}.md`,
    ),
    reviewedPacket({ base, head, id, reviewer: 'worker-1' }),
    'utf8',
  );
  await addBoardRow(
    fixture,
    `| ${id} | Review integrity | none | reviewed | worker-1 | ${id}-review-integrity | ../worktrees/${id}-review-integrity | test | ${base} | ${head} |`,
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /task_self_review/);
    assert.match(error.stdout, new RegExp(id));
    return true;
  });
});

test('check rejects a review head outside the dispatch base ancestry', async () => {
  const fixture = await createFixture();
  await runGit(['init', '-b', 'trunk'], fixture);
  await runGit(['config', 'user.email', 'agent@example.test'], fixture);
  await runGit(['config', 'user.name', 'Agent Test'], fixture);
  await writeFile(path.join(fixture, 'base.txt'), 'base\n', 'utf8');
  await runGit(['add', 'base.txt'], fixture);
  await runGit(['commit', '-m', 'base'], fixture);
  const base = (await runGit(['rev-parse', 'HEAD'], fixture)).stdout.trim();
  const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
  const head = (
    await runGit(['commit-tree', emptyTree, '-m', 'unrelated'], fixture)
  ).stdout.trim();
  await initFixture(fixture);
  const id = 'TASK-019';
  await writeFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      `${id}.md`,
    ),
    reviewedPacket({
      base,
      head,
      id,
      reviewer: 'reviewer-1',
      status: 'review',
    }),
    'utf8',
  );
  await addBoardRow(
    fixture,
    `| ${id} | Review integrity | none | review | worker-1 | ${id}-review-integrity | ../worktrees/${id}-review-integrity | test | ${base} | ${head} |`,
  );

  await assert.rejects(runCli(['check', '--cwd', fixture]), (error) => {
    assert.match(error.stdout, /task_head_not_based_on_dispatch/);
    assert.match(error.stdout, new RegExp(id));
    return true;
  });
});

test('check warns when always-on or ready task context exceeds recommended budgets', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  await writeFile(
    path.join(fixture, 'AGENTS.md'),
    `# AGENTS.md\n\n${'Always-on context. '.repeat(1200)}`,
    'utf8',
  );
  await writeFile(
    path.join(
      fixture,
      'docs',
      'implementation',
      'tasks',
      'TASK-006.md',
    ),
    `# Task Packet: TASK-006

## Metadata

- Status: planned

${'Planned context. '.repeat(5000)}
`,
    'utf8',
  );
  await addBoardRow(
    fixture,
    '| TASK-006 | Planned context | none | planned | unassigned | - | - | docs | - | - |',
  );

  const { stdout } = await runCli(['check', '--cwd', fixture]);

  assert.match(stdout, /oversized_project_contract/);
  assert.match(stdout, /oversized_task_packet/);
  assert.match(stdout, /0 errors, 2 warnings/);
});

test('learn records a reviewed learning proposal without changing project rules', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const inputPath = path.join(fixture, 'learning.json');
  await writeFile(
    inputPath,
    JSON.stringify({
      correction: 'Do not store cross-project methodology in an executable package.',
      evidence: [
        'The methodology and package have different audiences and release cycles.',
      ],
      generalizedRule:
        'Place an artifact with the owner responsible for maintaining its lifecycle.',
      id: 'artifact-owner-boundary',
      limitations: [
        'Package-specific usage and release documentation still belongs with the package.',
      ],
      mechanism: 'gate',
      observedPattern:
        'Documentation was placed near the current implementation instead of its owner.',
      proposedOwner: 'methodology-owner',
      regression:
        'Package review confirms that cross-project methodology is linked, not copied.',
      scope: 'methodology',
    }),
    'utf8',
  );

  const { stdout } = await runCli([
    'learn',
    '--cwd',
    fixture,
    '--from',
    inputPath,
  ]);

  assert.match(stdout, /Learning proposal recorded/);
  assert.match(stdout, /no project rules were changed/i);
  const proposal = await readFile(
    path.join(
      fixture,
      '.agentic',
      'learnings',
      'inbox',
      'artifact-owner-boundary.json',
    ),
    'utf8',
  );
  assert.match(proposal, /"status": "proposed"/);
  assert.match(proposal, /"scope": "methodology"/);
});

test('learn rejects vague or unsafe automatic abstractions', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const inputPath = path.join(fixture, 'learning.json');
  await writeFile(
    inputPath,
    JSON.stringify({
      correction: 'Always do better.',
      generalizedRule: 'Always do better.',
      id: 'vague',
      scope: 'methodology',
    }),
    'utf8',
  );

  await assert.rejects(
    runCli(['learn', '--cwd', fixture, '--from', inputPath]),
    (error) => {
      assert.match(error.stdout, /missing_learning_field/);
      assert.match(error.stdout, /overbroad_learning/);
      return true;
    },
  );
  await assert.rejects(
    access(
      path.join(
        fixture,
        '.agentic',
        'learnings',
        'inbox',
        'vague.json',
      ),
    ),
  );
});

test('brief reanchors the role, task route, required gates, and pending learnings', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const inputPath = path.join(fixture, 'learning.json');
  await writeFile(
    inputPath,
    JSON.stringify({
      correction: 'Review documentation ownership before adding a new file.',
      evidence: ['A previous artifact was placed in the wrong repository.'],
      generalizedRule:
        'Classify audience, owner, lifecycle, and authority before creating an artifact.',
      id: 'classify-artifact-owner',
      limitations: ['One-off scratch files may be discarded instead.'],
      mechanism: 'template',
      observedPattern: 'Artifacts followed implementation proximity.',
      proposedOwner: 'methodology-owner',
      regression: 'Task planning includes an artifact-owner decision.',
      scope: 'methodology',
    }),
    'utf8',
  );
  await runCli(['learn', '--cwd', fixture, '--from', inputPath]);

  const { stdout } = await runCli([
    'brief',
    '--cwd',
    fixture,
    '--role',
    'orchestrator',
  ]);

  assert.match(stdout, /Re-anchor brief/);
  assert.match(stdout, /Pending learning proposals: 1/);
  assert.match(stdout, /Run grill before execution/);
  assert.match(stdout, /Treat role reports as claims/);
  assert.match(stdout, /Workers cannot self-approve/);
  assert.match(stdout, /Review documentation impact/);
  assert.match(stdout, /Load only the context route/);
  assert.ok(stdout.length < 5000);
});

test('check reports pending learning proposals without blocking unrelated verification', async () => {
  const fixture = await createFixture();
  await initFixture(fixture);
  const inbox = path.join(fixture, '.agentic', 'learnings', 'inbox');
  await writeFile(
    path.join(inbox, 'pending.json'),
    JSON.stringify({ id: 'pending', status: 'proposed' }),
    'utf8',
  );

  const { stdout } = await runCli(['check', '--cwd', fixture]);

  assert.match(stdout, /pending_learning/);
  assert.match(stdout, /0 errors, 1 warnings/);
});

test('CLI exposes help and package version', async () => {
  const help = await runCli(['--help']);
  const version = await runCli(['--version']);
  const packageMetadata = JSON.parse(
    await readFile(path.resolve('package.json'), 'utf8'),
  );

  assert.match(help.stdout, /agentic-workflow init/);
  assert.match(help.stdout, /agentic-workflow check/);
  assert.match(help.stdout, /agentic-workflow doctor/);
  assert.match(help.stdout, /agentic-workflow context/);
  assert.match(help.stdout, /agentic-workflow grill/);
  assert.match(help.stdout, /agentic-workflow learn/);
  assert.match(help.stdout, /agentic-workflow brief/);
  assert.equal(version.stdout.trim(), '0.4.0');
  assert.equal(packageMetadata.engines.node, '>=22.13.0');
});
