import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve('.');
const fixtures = [];

function npmCmd() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function runNpm(args, opts = {}) {
  if (process.platform === 'win32') {
    const cmd = process.env.ComSpec ?? 'cmd.exe';
    return execFileAsync(cmd, ['/d', '/c', 'npm', ...args], {
      encoding: 'utf8',
      windowsHide: true,
      ...opts,
    });
  }
  return execFileAsync('npm', args, { encoding: 'utf8', ...opts });
}

async function createFixture() {
  const fixture = await mkdtemp(path.join(tmpdir(), 'awt-integration-'));
  fixtures.push(fixture);
  return fixture;
}

test.after(async () => {
  await Promise.all(
    fixtures.map((fixture) => rm(fixture, { force: true, recursive: true })),
  );
});

test('AC1-AC2: packed artifact delivers complete MVP journey', async (t) => {
  const packResult = await runNpm(['pack', '--json'], { cwd: PROJECT_ROOT });
  const packs = JSON.parse(packResult.stdout);
  assert.ok(packs.length > 0, 'npm pack produced at least one artifact');
  const tgzPath = path.join(PROJECT_ROOT, packs[0].filename);

  t.after(async () => {
    await rm(tgzPath, { force: true });
  });

  const repoDir = await createFixture();

  await execFileAsync('git', ['init', '-b', 'main'], { cwd: repoDir });
  await writeFile(
    path.join(repoDir, 'package.json'),
    JSON.stringify({ scripts: { verify: 'echo ok' } }),
    'utf8',
  );

  const installResult = await runNpm(['install', tgzPath], {
    cwd: repoDir,
  });
  assert.ok(
    installResult.stdout.includes('added') || installResult.stdout.includes('up to date'),
    'package installed without errors',
  );

  const cliBin = path.join(
    repoDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'agentic-workflow.cmd' : 'agentic-workflow',
  );

  async function runCli(args) {
    if (process.platform === 'win32') {
      const cmd = process.env.ComSpec ?? 'cmd.exe';
      return execFileAsync(cmd, ['/d', '/c', cliBin, ...args], {
        cwd: repoDir,
      });
    }
    return execFileAsync(cliBin, args, { cwd: repoDir });
  }

  await t.test('init creates control plane from installed package', async () => {
    const { stdout } = await runCli([
      'init',
      '--base-branch',
      'main',
      '--verify-command',
      'npm test',
    ]);

    assert.match(stdout, /Initialized agentic workflow/);
    assert.match(stdout, /8 written/);

    const agents = await readFile(
      path.join(repoDir, 'AGENTS.md'),
      'utf8',
    );
    assert.match(agents, /Base branch: `main`/);
    assert.match(agents, /verify: `npm test`/);

    const workflow = await readFile(
      path.join(repoDir, '.agentic', 'workflow.yaml'),
      'utf8',
    );
    assert.match(workflow, /base_branch: "main"/);
    assert.match(workflow, /verify: "npm test"/);

    const schema = await readFile(
      path.join(repoDir, '.agentic', 'workflow.schema.json'),
      'utf8',
    );
    assert.match(schema, /Agentic Workflow Configuration/);

    const board = await readFile(
      path.join(repoDir, 'docs', 'implementation', 'orchestration-board.md'),
      'utf8',
    );
    assert.match(board, /# Orchestration Board/);

    const template = await readFile(
      path.join(
        repoDir,
        'docs',
        'implementation',
        'tasks',
        'TASK.template.md',
      ),
      'utf8',
    );
    assert.match(template, /## Acceptance Criteria/);

    const learningsReadme = await readFile(
      path.join(repoDir, '.agentic', 'learnings', 'README.md'),
      'utf8',
    );
    assert.match(learningsReadme, /# Learning Inbox/);

    const inboxReadme = await readFile(
      path.join(repoDir, '.agentic', 'learnings', 'inbox', 'README.md'),
      'utf8',
    );
    assert.match(inboxReadme, /# Proposed Learnings/);
  });

  await t.test('check validates freshly initialized workflow', async () => {
    const { stdout } = await runCli(['check']);

    assert.match(stdout, /Workflow configuration is valid/);
    assert.match(stdout, /0 errors, 0 warnings/);
  });

  await t.test('context returns routes without embedding file contents', async () => {
    const taskContent = `# Task Packet: TASK-INT-001

## Context Route

### Required

- \`AGENTS.md\`

### On demand

- \`README.md\`

### Discovery

- \`Callers and callees\`

### Do not preload

- \`docs/archive/\`
`;

    await mkdir(
      path.join(repoDir, 'docs', 'implementation', 'tasks'),
      { recursive: true },
    );
    await writeFile(
      path.join(
        repoDir,
        'docs',
        'implementation',
        'tasks',
        'TASK-INT-001.md',
      ),
      taskContent,
      'utf8',
    );

    const { stdout } = await runCli([
      'context',
      '--role',
      'implementer',
      '--task',
      'docs/implementation/tasks/TASK-INT-001.md',
      '--json',
    ]);
    const route = JSON.parse(stdout);

    assert.equal(route.role, 'implementer');
    assert.equal(route.strategy, 'progressive-disclosure');
    assert.deepEqual(
      route.bootstrap.map((e) => e.path),
      ['AGENTS.md', '.agentic/workflow.yaml'],
    );
    assert.ok(
      route.required.some((e) => e.path === 'AGENTS.md'),
      'required includes AGENTS.md',
    );
    assert.deepEqual(route.onDemand, ['README.md']);
    assert.deepEqual(route.discovery, ['Callers and callees']);
    assert.deepEqual(route.doNotPreload, ['docs/archive/']);
    assert.equal(typeof route.budget.bootstrapBytes, 'number');
    assert.equal(typeof route.budget.requiredBytes, 'number');

    assert.doesNotMatch(stdout, /Local project rules/);
    assert.doesNotMatch(stdout, /Read this file before acting/);
  });

  await t.test('grill blocks unresolved and passes resolved task packet', async () => {
    await mkdir(
      path.join(repoDir, 'docs', 'implementation', 'tasks'),
      { recursive: true },
    );

    const unresolvedPath = path.join(
      repoDir,
      'docs',
      'implementation',
      'tasks',
      'TASK-INT-UNRESOLVED.md',
    );
    await writeFile(
      unresolvedPath,
      `# Task Packet: TASK-INT-UNRESOLVED

## Metadata

- Status: ready

## Mission

TBD
`,
      'utf8',
    );

    await assert.rejects(
      runCli([
        'grill',
        '--task',
        'docs/implementation/tasks/TASK-INT-UNRESOLVED.md',
      ]),
      (error) => {
        assert.match(error.stdout, /BLOCKER/);
        assert.match(error.stdout, /missing_section/);
        assert.match(error.stdout, /placeholder/);
        return true;
      },
    );

    const resolvedPath = path.join(
      repoDir,
      'docs',
      'implementation',
      'tasks',
      'TASK-INT-RESOLVED.md',
    );
    await writeFile(
      resolvedPath,
      `# Task Packet: TASK-INT-RESOLVED

## Metadata

- Status: ready
- Base branch: \`main\`
- Base commit: abc123
- Worker branch: task-resolved
- Worktree: ../worktrees/task-resolved
- Dependencies: none

## Mission

Deliver a resolved task packet for testing.

## Scope

Included:

- Complete task packet template.

Excluded:

- Post-MVP features.

## Ownership

- Write-set: \`src/\`
- Read-set: \`src/\`
- Forbidden-set: \`test/fixtures/\`
- Exclusive resources: none

## Context Route

### Required

- \`AGENTS.md\`

### On demand

- \`README.md\`

### Discovery

- \`Source modules\`

### Do not preload

- \`docs/archive/\`

## Decisions

- Decision: use the complete template.
  - Evidence: acceptance criteria require all sections.

## Open Questions

- none

## Assumptions

- Assumption: Java is not required.
  - Evidence: \`package.json\` lists only Node.js as a dependency.

## Documentation Impact

- Update: \`README.md\`
- Reason: demonstrate complete documentation path.

## Acceptance Criteria

1. AC1: the packet passes the grill.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | grill test | blockers | no blockers |

## Plan

1. Write the task packet.
2. Run \`agentic-workflow grill\`.

## Stop Conditions

Stop on undefined behavior.

## Definition of Done

- [ ] Acceptance criteria demonstrated.
- [ ] Verification passed.
- [ ] Documentation impact completed.
`,
      'utf8',
    );

    const { stdout } = await runCli([
      'grill',
      '--task',
      'docs/implementation/tasks/TASK-INT-RESOLVED.md',
    ]);

    assert.match(stdout, /Grill gate passed/);
    assert.match(stdout, /0 blockers/);
  });

  await t.test('brief returns invariants, bounded context, and pending learnings', async () => {
    const learningPath = path.join(repoDir, 'learning.json');
    await writeFile(
      learningPath,
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
        regression:
          'Task planning includes an artifact-owner decision.',
        scope: 'methodology',
      }),
      'utf8',
    );
    await runCli(['learn', '--from', 'learning.json']);
    await rm(learningPath, { force: true });

    const { stdout } = await runCli([
      'brief',
      '--role',
      'implementer',
      '--task',
      'docs/implementation/tasks/TASK-INT-RESOLVED.md',
    ]);

    assert.match(stdout, /# Re-anchor brief/);
    assert.match(stdout, /Pending learning proposals: 1/);
    assert.match(stdout, /Run grill before execution/);
    assert.match(stdout, /Run the configured verification gate before handoff/);
    assert.match(stdout, /Stay inside declared ownership/);
    assert.match(stdout, /Review documentation impact/);
    assert.match(stdout, /Load only the context route/);
    assert.match(stdout, /After a human correction/);
    assert.match(stdout, /classify-artifact-owner/);
    assert.match(stdout, /Role: implementer/);
    assert.match(stdout, /Strategy: progressive-disclosure/);
    assert.match(stdout, /Bootstrap budget:/);
    assert.match(stdout, /Required-read budget:/);
    assert.doesNotMatch(stdout, /undefined/);
  });

  await t.test('learn records learning proposals from installed package', async () => {
    const learningPath = path.join(repoDir, 'proposal.json');
    await writeFile(
      learningPath,
      JSON.stringify({
        correction: 'Do not place cross-project methodology in a package repository.',
        evidence: [
          'Methodology and package have different audiences and release cycles.',
        ],
        generalizedRule:
          'Place each artifact with the owner responsible for maintaining its lifecycle.',
        id: 'artifact-owner-boundary',
        limitations: [
          'Package-specific documentation stays with the package.',
        ],
        mechanism: 'gate',
        observedPattern:
          'Documentation was placed near implementation instead of with the methodology owner.',
        proposedOwner: 'methodology-owner',
        regression:
          'Package review confirms methodology is linked, not copied.',
        scope: 'methodology',
      }),
      'utf8',
    );

    const { stdout } = await runCli(['learn', '--from', 'proposal.json']);

    assert.match(stdout, /Learning proposal recorded/);
    assert.match(stdout, /no project rules were changed/i);

    const proposal = await readFile(
      path.join(
        repoDir,
        '.agentic',
        'learnings',
        'inbox',
        'artifact-owner-boundary.json',
      ),
      'utf8',
    );
    assert.match(proposal, /"status": "proposed"/);
    assert.match(proposal, /"scope": "methodology"/);

    await rm(learningPath, { force: true });
  });

  await t.test('doctor reports available tools', async () => {
    const { stdout } = await runCli(['doctor', '--json']);
    const report = JSON.parse(stdout);

    assert.equal(typeof report.platform, 'string');
    const node = report.tools.find((t) => t.name === 'node');
    assert.ok(node, 'node is reported');
    assert.equal(node.available, true);
    assert.equal(typeof node.version, 'string');

    assert.ok(
      report.tools.every(
        (t) =>
          typeof t.name === 'string' &&
          typeof t.category === 'string' &&
          typeof t.available === 'boolean',
      ),
    );
  });
});

test('AC3: ambiguous init fails without partial writes', async () => {
  const repoDir = await createFixture();

  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(repoDir, 'nonexistent'),
      'init',
      '--cwd',
      repoDir,
    ]),
  );

  await assert.rejects(
    async () => {
      const agentsPath = path.join(repoDir, 'AGENTS.md');
      await access(agentsPath);
    },
    /ENOENT/,
  );

  const agentsPath = path.join(repoDir, 'AGENTS.md');
  await writeFile(agentsPath, 'existing content\n', 'utf8');

  const workflowPath = path.join(repoDir, '.agentic', 'workflow.yaml');
  await mkdir(path.dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, 'original: data\n', 'utf8');

  await assert.rejects(
    execFileAsync(process.execPath, [
      'bin/agentic-workflow.js',
      'init',
      '--cwd',
      repoDir,
      '--base-branch',
      'main',
      '--verify-command',
      'npm test',
    ]),
    (error) => {
      assert.match(
        error.stderr || error.stdout || '',
        /Refusing to overwrite/,
      );
      return true;
    },
  );

  assert.equal(
    await readFile(workflowPath, 'utf8'),
    'original: data\n',
    'existing conflicting files are not modified',
  );
  assert.equal(
    await readFile(agentsPath, 'utf8'),
    'existing content\n',
    'existing AGENTS.md is not modified',
  );
  await assert.rejects(
    access(path.join(repoDir, 'docs', 'implementation', 'orchestration-board.md')),
    /ENOENT/,
    'non-conflicting files are not written when a conflict exists',
  );
});

test('AC8-AC9: public docs match observable behavior', async () => {
  const readme = await readFile(path.join(PROJECT_ROOT, 'README.md'), 'utf8');
  const mvp = await readFile(path.join(PROJECT_ROOT, 'docs', 'MVP.md'), 'utf8');

  assert.match(readme, /agentic-workflow init/, 'README documents init');
  assert.match(readme, /agentic-workflow check/, 'README documents check');
  assert.match(readme, /agentic-workflow context/, 'README documents context');
  assert.match(readme, /agentic-workflow grill/, 'README documents grill');
  assert.match(readme, /agentic-workflow brief/, 'README documents brief');
  assert.match(readme, /agentic-workflow learn/, 'README documents learn');
  assert.match(readme, /agentic-workflow doctor/, 'README documents doctor');

  assert.match(
    readme,
    /Node\.js 22\.13\.0/,
    'README documents minimum Node.js version',
  );
  assert.match(
    readme,
    /npm install.*agentic-workflow-toolkit/,
    'README documents install command',
  );

  assert.match(mvp, /init.*check.*context.*grill.*brief.*learn.*doctor/s, 'MVP covers all commands');
  assert.match(mvp, /packed artifact installs/);
  assert.match(mvp, /failures are actionable/);
  assert.match(mvp, /npm run verify[\s`]*passes/);

  assert.doesNotMatch(readme, /Knowledge Hub.*copied/);
  assert.match(readme, /Knowledge Hub/);
  assert.doesNotMatch(mvp, /native hooks.*required/);
});

test('AC7: package contents contain no machine-specific paths, credentials, or Knowledge Hub', async () => {
  const packResult = await runNpm(['pack', '--dry-run', '--json'], {
    cwd: PROJECT_ROOT,
  });
  const output = JSON.parse(packResult.stdout);

  assert.doesNotMatch(packResult.stdout, /node_modules/);
  assert.doesNotMatch(packResult.stdout, /\btest\//);
  assert.doesNotMatch(packResult.stdout, /\.git/);
  assert.doesNotMatch(packResult.stdout, /knowledge-hub/i);

  const files = output.files ?? output;
  const fileNames = files.map((f) => f.path ?? f);
  for (const name of fileNames) {
    assert.doesNotMatch(String(name), /knowledge-hub/i);
    assert.doesNotMatch(String(name), /\.pem$/);
    assert.doesNotMatch(String(name), /\.key$/);
    assert.doesNotMatch(String(name), /\.env$/);
    assert.doesNotMatch(String(name), /credentials/i);
    assert.doesNotMatch(String(name), /secrets/i);
    assert.doesNotMatch(String(name), /\bnode_modules\b/);
  }

  const packResultReal = await runNpm(['pack', '--json'], {
    cwd: PROJECT_ROOT,
  });
  const realPacks = JSON.parse(packResultReal.stdout);
  const tgzPath = path.join(PROJECT_ROOT, realPacks[0].filename);

  let tarList = '';
  let tarOk = false;
  try {
    if (process.platform === 'win32') {
      const cmdProc = process.env.ComSpec ?? 'cmd.exe';
      const tarResult = await execFileAsync(cmdProc, [
        '/d',
        '/c',
        'tar',
        '-tzf',
        tgzPath,
      ], { encoding: 'utf8', windowsHide: true });
      tarList = tarResult.stdout;
      tarOk = tarResult.stderr === '' || !tarResult.stderr.includes('Error');
    } else {
      const tarResult = await execFileAsync('tar', ['-tzf', tgzPath], {
        encoding: 'utf8',
      });
      tarList = tarResult.stdout;
      tarOk = true;
    }
  } catch {
    tarOk = false;
  }

  if (tarOk && tarList) {
    assert.doesNotMatch(tarList, /api[_-]?key/i);
    assert.doesNotMatch(tarList, /access[_-]?token/i);
    assert.doesNotMatch(tarList, /sk-/);
    assert.doesNotMatch(tarList, /BEGIN.*PRIVATE KEY/);

    assert.doesNotMatch(tarList, /C:\\/i);
    assert.doesNotMatch(tarList, /\\Users\\/i);
    assert.doesNotMatch(tarList, /\/home\//);
    assert.doesNotMatch(tarList, /\/Users\//);
    assert.doesNotMatch(tarList, /knowledge.hub/i);

    assert.match(tarList, /AGENTS.md/);
    assert.match(tarList, /workflow.yaml/);
    assert.match(tarList, /orchestration-board.md/);
    assert.match(tarList, /TASK.template.md/);
    assert.match(tarList, /workflow.schema.json/);
    assert.match(tarList, /CHANGELOG.md/);
    assert.match(tarList, /LICENSE/);
    assert.match(tarList, /README.md/);
    assert.match(tarList, /MVP.md/);
    assert.match(tarList, /package.json/);
  } else {
    const dryRunResult = await runNpm(['pack', '--dry-run', '--json'], {
      cwd: PROJECT_ROOT,
    });
    const dryRunData = JSON.parse(dryRunResult.stdout);
    const entry = Array.isArray(dryRunData) ? dryRunData[0] : dryRunData;
    const dryRunFiles = (entry.files ?? []).map((f) =>
      typeof f === 'string' ? f : f.path,
    );
    const dryRunStr = JSON.stringify(entry);
    assert.doesNotMatch(dryRunStr, /knowledge.hub/i);
    assert.doesNotMatch(dryRunStr, /\btest\//);
    assert.ok(
      dryRunFiles.some((f) => f && f.includes('AGENTS.md')),
      'AGENTS.md included in pack',
    );
    assert.ok(
      dryRunFiles.some((f) => f && f.includes('CHANGELOG.md')),
    );
    assert.ok(
      dryRunFiles.some((f) => f && f.includes('LICENSE')),
    );
    assert.ok(
      dryRunFiles.some((f) => f && f.includes('README.md')),
    );
    assert.ok(
      dryRunFiles.some((f) => f && f.includes('MVP.md')),
    );
  }

  await rm(tgzPath, { force: true });
});
