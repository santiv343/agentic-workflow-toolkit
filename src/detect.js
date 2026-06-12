import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { parse } from 'yaml';

const execFileAsync = promisify(execFile);
const CONVENTIONAL_BASE_BRANCHES = ['main', 'master', 'develop', 'trunk'];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function gitOutput(cwd, args) {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
    });
    return stdout.trim();
  } catch {
    return '';
  }
}

async function detectBaseBranch(cwd) {
  const remoteHead = await gitOutput(cwd, [
    'symbolic-ref',
    '--quiet',
    '--short',
    'refs/remotes/origin/HEAD',
  ]);
  if (remoteHead.startsWith('origin/')) {
    return {
      source: 'git-origin-head',
      value: remoteHead.slice('origin/'.length),
    };
  }

  const branches = (
    await gitOutput(cwd, ['branch', '--format=%(refname:short)'])
  )
    .split(/\r?\n/u)
    .filter(Boolean);
  const matchingBranches = CONVENTIONAL_BASE_BRANCHES.filter((branch) =>
    branches.includes(branch),
  );
  if (matchingBranches.length === 1) {
    return {
      source: 'git-conventional-branch',
      value: matchingBranches[0],
    };
  }

  const currentBranch = await gitOutput(cwd, [
    'symbolic-ref',
    '--quiet',
    '--short',
    'HEAD',
  ]);
  if (CONVENTIONAL_BASE_BRANCHES.includes(currentBranch)) {
    return {
      source: 'git-current-conventional',
      value: currentBranch,
    };
  }

  return undefined;
}

function packageManagerCommand(packageManager, script) {
  if (packageManager === 'npm') {
    return `npm run ${script}`;
  }
  if (packageManager === 'pnpm') {
    return `pnpm ${script}`;
  }
  return `${packageManager} run ${script}`;
}

async function detectPackageManager(cwd, packageJson) {
  if (
    typeof packageJson.packageManager === 'string' &&
    packageJson.packageManager.includes('@')
  ) {
    return packageJson.packageManager.split('@')[0];
  }

  const lockfiles = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
    ['npm-shrinkwrap.json', 'npm'],
  ];
  const detected = [];
  for (const [lockfile, packageManager] of lockfiles) {
    if (await exists(path.join(cwd, lockfile))) {
      detected.push(packageManager);
    }
  }
  return new Set(detected).size === 1 ? detected[0] : undefined;
}

async function detectPackageVerify(cwd) {
  const packagePath = path.join(cwd, 'package.json');
  if (!(await exists(packagePath))) {
    return undefined;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  } catch {
    return undefined;
  }
  if (
    typeof packageJson !== 'object' ||
    packageJson === null ||
    typeof packageJson.scripts !== 'object' ||
    packageJson.scripts === null ||
    typeof packageJson.scripts.verify !== 'string'
  ) {
    return undefined;
  }

  const packageManager = await detectPackageManager(cwd, packageJson);
  if (!packageManager) {
    return undefined;
  }
  return {
    source: 'package-script',
    value: packageManagerCommand(packageManager, 'verify'),
  };
}

async function detectDeclaredVerify(cwd) {
  const candidates = [
    {
      command: 'make verify',
      file: 'Makefile',
      matches: (content) => /^verify\s*:/mu.test(content),
      source: 'make-target',
    },
    {
      command: 'just verify',
      file: 'justfile',
      matches: (content) => /^verify(?:\s+[^:]*)?\s*:/mu.test(content),
      source: 'just-recipe',
    },
  ];

  for (const candidate of candidates) {
    const filePath = path.join(cwd, candidate.file);
    if (
      (await exists(filePath)) &&
      candidate.matches(await readFile(filePath, 'utf8'))
    ) {
      return { source: candidate.source, value: candidate.command };
    }
  }

  for (const file of ['Taskfile.yml', 'Taskfile.yaml']) {
    const filePath = path.join(cwd, file);
    if (!(await exists(filePath))) {
      continue;
    }
    try {
      const taskfile = parse(await readFile(filePath, 'utf8'));
      if (
        typeof taskfile === 'object' &&
        taskfile !== null &&
        typeof taskfile.tasks === 'object' &&
        taskfile.tasks !== null &&
        'verify' in taskfile.tasks
      ) {
        return { source: 'taskfile-task', value: 'task verify' };
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

async function detectVerifyCommand(cwd) {
  return (await detectPackageVerify(cwd)) ?? (await detectDeclaredVerify(cwd));
}

export async function detectProjectDefaults(cwd) {
  const [baseBranch, verifyCommand] = await Promise.all([
    detectBaseBranch(cwd),
    detectVerifyCommand(cwd),
  ]);

  return { baseBranch, verifyCommand };
}
