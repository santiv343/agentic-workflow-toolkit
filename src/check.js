import {
  access,
  readFile,
  readdir,
  realpath,
  stat,
} from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { parseDocument } from 'yaml';

import { auditTaskPacketSource, taskStatus } from './grill.js';
import { pendingLearningPaths } from './learn.js';
import { parseSections } from './markdown.js';

const execFileAsync = promisify(execFile);
const REQUIRED_PATHS = [
  { keys: ['authority', 'project_contract'], type: 'file' },
  { keys: ['authority', 'orchestration_board'], type: 'file' },
  { keys: ['authority', 'task_packets'], type: 'directory' },
  { keys: ['authority', 'learnings'], type: 'directory' },
];
const MAX_BINDING_FILE_BYTES = 1024 * 1024;
const MAX_PROJECT_CONTRACT_BYTES = 16 * 1024;
const MAX_TASK_PACKET_BYTES = 64 * 1024;
const ALLOWED_TASK_STATES = new Set([
  'deferred',
  'planned',
  'ready',
  'active',
  'review',
  'reviewed',
  'done',
]);
const SECRET_PATTERNS = [
  /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/u,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/u,
  /\bsk-[A-Za-z0-9_-]{16,}\b/u,
];
const ALLOWED_KEYS = new Map([
  ['', ['version', 'authority', 'git', 'workflow', 'roles', 'commands', 'stop_conditions']],
  [
    'authority',
    [
      'project_contract',
      'orchestration_board',
      'task_packets',
      'bindings',
      'learnings',
    ],
  ],
  [
    'git',
    [
      'base_branch',
      'branch_pattern',
      'require_isolated_worktree',
      'allow_worker_merge',
      'human_merge_gate',
    ],
  ],
  [
    'workflow',
    [
      'human_plan_gate',
      'integration',
      'dependencies_ready_when',
      'max_parallel_writers',
      'require_disjoint_write_sets',
      'require_head_sha_review',
    ],
  ],
  ['roles', ['orchestrator', 'implementer', 'reviewer']],
  ['roles.orchestrator', ['can_edit_product', 'can_delegate']],
  ['roles.implementer', ['one_task_at_a_time', 'requires_task_packet']],
  ['roles.reviewer', ['can_edit', 'can_self_review']],
  [
    'commands',
    [
      'setup',
      'focused_test',
      'verify',
      'context',
      'grill',
      'learn',
      'brief',
    ],
  ],
]);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getValue(value, keys) {
  let current = value;
  for (const key of keys) {
    if (!isRecord(current) || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function addTypeIssue(issues, config, keys, type) {
  const value = getValue(config, keys);
  const valid =
    type === 'array'
      ? Array.isArray(value)
      : type === 'integer'
        ? Number.isInteger(value)
        : typeof value === type;

  if (!valid || (type === 'string' && value.length === 0)) {
    issues.push({
      code: 'invalid_config',
      message: `${keys.join('.')} must be a non-empty ${type}`,
      severity: 'error',
    });
  }
}

function isPortableAbsolute(candidate) {
  return (
    path.isAbsolute(candidate) ||
    path.posix.isAbsolute(candidate) ||
    path.win32.isAbsolute(candidate)
  );
}

function resolveProjectPath(cwd, candidate) {
  if (
    isPortableAbsolute(candidate) ||
    candidate.split(/[\\/]/u).includes('..')
  ) {
    return undefined;
  }

  const resolved = path.resolve(cwd, candidate);
  const relative = path.relative(cwd, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return undefined;
  }
  return resolved;
}

function isInsideProject(projectRoot, candidate) {
  const relative = path.relative(projectRoot, candidate);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

async function pathExists(filePath) {
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

function looksLikePlaceholder(value) {
  return (
    value.startsWith('$') ||
    value.startsWith('<') ||
    value.startsWith('{{') ||
    /^(?:example|placeholder|replace|your)[-_]/iu.test(value)
  );
}

function lineContainsSecret(line) {
  if (SECRET_PATTERNS.some((pattern) => pattern.test(line))) {
    return true;
  }

  const assignment = line.match(
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|credential)\b\s*[:=]\s*["']?([^"'#\s]+)/iu,
  );
  return Boolean(assignment?.[1] && !looksLikePlaceholder(assignment[1]));
}

async function collectBindingFiles(root) {
  const rootStat = await stat(root);
  if (rootStat.isFile()) {
    return [root];
  }
  if (!rootStat.isDirectory()) {
    return [];
  }

  const files = [];
  const directories = [root];
  while (directories.length > 0) {
    const current = directories.pop();
    if (!current) {
      continue;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory()) {
        directories.push(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }
  return files;
}

async function scanBindings(cwd, config) {
  const candidate = getValue(config, ['authority', 'bindings']);
  if (typeof candidate !== 'string') {
    return [];
  }

  const root = resolveProjectPath(cwd, candidate);
  if (!root) {
    return [
      {
        code: 'unsafe_path',
        message: `authority.bindings must stay inside the project: ${candidate}`,
        severity: 'error',
      },
    ];
  }
  if (!(await pathExists(root))) {
    return [];
  }

  const projectRoot = await realpath(cwd);
  const bindingRoot = await realpath(root);
  if (!isInsideProject(projectRoot, bindingRoot)) {
    return [
      {
        code: 'unsafe_path',
        message: `authority.bindings resolves outside the project: ${candidate}`,
        severity: 'error',
      },
    ];
  }

  const issues = [];
  const files = await collectBindingFiles(bindingRoot);
  for (const file of files) {
    const fileStat = await stat(file);
    if (fileStat.size > MAX_BINDING_FILE_BYTES) {
      issues.push({
        code: 'binding_too_large',
        message: `${path.relative(cwd, file)} was not scanned because it exceeds 1 MiB`,
        severity: 'warning',
      });
      continue;
    }

    const lines = (await readFile(file, 'utf8')).split(/\r?\n/u);
    for (const [index, line] of lines.entries()) {
      if (lineContainsSecret(line)) {
        issues.push({
          code: 'possible_secret',
          message: `possible secret in ${path.relative(cwd, file)}:${index + 1}`,
          severity: 'error',
        });
      }
    }
  }
  return issues;
}

async function scanReadyTaskPackets(cwd, config) {
  const candidate = getValue(config, ['authority', 'task_packets']);
  if (typeof candidate !== 'string') {
    return [];
  }
  const root = resolveProjectPath(cwd, candidate);
  if (!root || !(await pathExists(root))) {
    return [];
  }

  const issues = [];
  const files = (await collectBindingFiles(root)).filter((file) => {
    const name = path.basename(file).toLowerCase();
    return (
      path.extname(file).toLowerCase() === '.md' &&
      name !== 'readme.md' &&
      !name.includes('template')
    );
  });
  for (const file of files) {
    const fileStat = await stat(file);
    if (fileStat.size > MAX_TASK_PACKET_BYTES) {
      issues.push({
        code: 'oversized_task_packet',
        message: `${path.relative(cwd, file)} exceeds the recommended 64 KiB context budget`,
        severity: 'warning',
      });
    }
    const source = await readFile(file, 'utf8');
    const status = taskStatus(source);
    if (!['ready', 'active', 'review', 'reviewed', 'done'].includes(status)) {
      continue;
    }
    const findings = auditTaskPacketSource(source);
    for (const finding of findings) {
      issues.push({
        code: 'task_not_ready',
        message: `${path.relative(cwd, file)}: ${finding.code}: ${finding.message}`,
        severity: 'error',
      });
    }
  }
  return issues;
}

function markdownTable(source) {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.findIndex(
    (line) => /^\s*\|/u.test(line) && /\|\s*ID\s*\|/iu.test(line),
  );
  if (headerIndex < 0) {
    return [];
  }
  const headers = lines[headerIndex]
    .split('|')
    .slice(1, -1)
    .map((value) => value.trim());
  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!/^\s*\|/u.test(line)) {
      break;
    }
    const values = line
      .split('|')
      .slice(1, -1)
      .map((value) => value.trim().replaceAll('`', ''));
    if (values.length !== headers.length) {
      continue;
    }
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index]])));
  }
  return rows;
}

function taskId(source) {
  return source.match(
    /^# Task Packet:\s*([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)/imu,
  )?.[1];
}

function sectionValue(source, sectionName, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const section = parseSections(source).get(sectionName) ?? '';
  return section
    .match(new RegExp(`^\\s*-\\s*${escaped}:\\s*(.+?)\\s*$`, 'imu'))?.[1]
    ?.replaceAll('`', '')
    .trim();
}

function metadataValue(source, label) {
  return sectionValue(source, 'Metadata', label);
}

function handoffValue(source, label) {
  return sectionValue(source, 'Handoff Evidence', label);
}

async function gitCommitExists(cwd, commit) {
  if (!/^[0-9a-f]{40}$/iu.test(commit ?? '')) {
    return false;
  }
  try {
    await execFileAsync('git', ['cat-file', '-e', `${commit}^{commit}`], {
      cwd,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function gitCommitIsIntegrated(cwd, commit) {
  if (!(await gitCommitExists(cwd, commit))) {
    return false;
  }
  try {
    await execFileAsync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], {
      cwd,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function gitCommitIsAncestor(cwd, ancestor, descendant) {
  if (
    !(await gitCommitExists(cwd, ancestor)) ||
    !(await gitCommitExists(cwd, descendant))
  ) {
    return false;
  }
  try {
    await execFileAsync(
      'git',
      ['merge-base', '--is-ancestor', ancestor, descendant],
      {
        cwd,
        windowsHide: true,
      },
    );
    return true;
  } catch {
    return false;
  }
}

async function inspectOrchestrationState(cwd, config) {
  const boardCandidate = getValue(config, [
    'authority',
    'orchestration_board',
  ]);
  const tasksCandidate = getValue(config, ['authority', 'task_packets']);
  if (
    typeof boardCandidate !== 'string' ||
    typeof tasksCandidate !== 'string'
  ) {
    return [];
  }
  const boardPath = resolveProjectPath(cwd, boardCandidate);
  const tasksPath = resolveProjectPath(cwd, tasksCandidate);
  if (
    !boardPath ||
    !tasksPath ||
    !(await pathExists(boardPath)) ||
    !(await pathExists(tasksPath))
  ) {
    return [];
  }

  const issues = [];
  const rows = markdownTable(await readFile(boardPath, 'utf8'));
  const rowById = new Map();
  for (const row of rows) {
    if (rowById.has(row.ID)) {
      issues.push({
        code: 'duplicate_board_task',
        message: `${row.ID} appears more than once on the orchestration board`,
        severity: 'error',
      });
    }
    rowById.set(row.ID, row);
    if (!ALLOWED_TASK_STATES.has(row.State?.toLowerCase())) {
      issues.push({
        code: 'invalid_board_state',
        message: `${row.ID} uses unsupported board state: ${row.State || '<missing>'}`,
        severity: 'error',
      });
    }
  }
  const files = (await collectBindingFiles(tasksPath)).filter((file) => {
    const name = path.basename(file).toLowerCase();
    return (
      path.extname(file).toLowerCase() === '.md' &&
      name !== 'readme.md' &&
      !name.includes('template')
    );
  });

  const packetIds = new Set();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const id = taskId(source);
    if (!id) {
      continue;
    }
    if (packetIds.has(id)) {
      issues.push({
        code: 'duplicate_task_packet',
        message: `${id} is declared by more than one Task Packet`,
        severity: 'error',
      });
    }
    packetIds.add(id);
    const row = rowById.get(id);
    if (!row) {
      issues.push({
        code: 'task_missing_from_board',
        message: `${id} has a Task Packet but no orchestration-board row`,
        severity: 'error',
      });
      continue;
    }

    const status = taskStatus(source);
    if (!ALLOWED_TASK_STATES.has(status)) {
      issues.push({
        code: 'invalid_task_status',
        message: `${id} uses unsupported packet status: ${status || '<missing>'}`,
        severity: 'error',
      });
    }
    if (row.State?.toLowerCase() !== status) {
      issues.push({
        code: 'task_state_mismatch',
        message: `${id} board state ${row.State || '<missing>'} does not match packet status ${status || '<missing>'}`,
        severity: 'error',
      });
    }

    if (['active', 'review', 'reviewed', 'done'].includes(status)) {
      const baseCommit = metadataValue(source, 'Base commit');
      const expected = {
        'Base commit': baseCommit,
        Branch: metadataValue(source, 'Worker branch'),
        Worktree: metadataValue(source, 'Worktree'),
      };
      for (const [column, value] of Object.entries(expected)) {
        if (row[column] !== value) {
          issues.push({
            code: 'task_dispatch_mismatch',
            message: `${id} board ${column} does not match its Task Packet`,
            severity: 'error',
          });
        }
      }
      if (!(await gitCommitExists(cwd, baseCommit))) {
        issues.push({
          code: 'task_base_commit_missing',
          message: `${id} base commit does not exist in this repository`,
          severity: 'error',
        });
      }
      if (!row.Owner || /^(?:unassigned|-|pending)$/iu.test(row.Owner)) {
        issues.push({
          code: 'task_owner_missing',
          message: `${id} is ${status} without an assigned board owner`,
          severity: 'error',
        });
      }
    }

    if (['review', 'reviewed', 'done'].includes(status)) {
      const head = handoffValue(source, 'Head commit');
      const baseCommit = metadataValue(source, 'Base commit');
      if (row['Head commit'] !== head) {
        issues.push({
          code: 'task_head_mismatch',
          message: `${id} board head does not match its execution handoff`,
          severity: 'error',
        });
      }
      if (!(await gitCommitExists(cwd, head))) {
        issues.push({
          code: 'task_head_commit_missing',
          message: `${id} handoff head does not exist in this repository`,
          severity: 'error',
        });
      }
      if (!(await gitCommitIsAncestor(cwd, baseCommit, head))) {
        issues.push({
          code: 'task_head_not_based_on_dispatch',
          message: `${id} handoff head does not descend from its recorded base commit`,
          severity: 'error',
        });
      }
    }

    if (['reviewed', 'done'].includes(status)) {
      const reviewer = handoffValue(source, 'Reviewer');
      if (
        reviewer &&
        row.Owner &&
        reviewer.toLowerCase() === row.Owner.toLowerCase()
      ) {
        issues.push({
          code: 'task_self_review',
          message: `${id} reviewer must differ from the implementation owner`,
          severity: 'error',
        });
      }
    }

    if (status === 'done') {
      const head = handoffValue(source, 'Head commit');
      const mergedCommit = handoffValue(source, 'Merged commit');
      if (!(await gitCommitIsIntegrated(cwd, mergedCommit))) {
        issues.push({
          code: 'task_merge_not_integrated',
          message: `${id} merged commit is not reachable from the checked-out HEAD`,
          severity: 'error',
        });
      }
      if (!(await gitCommitIsAncestor(cwd, head, mergedCommit))) {
        issues.push({
          code: 'task_reviewed_head_not_merged',
          message: `${id} merged commit does not contain the exact reviewed head`,
          severity: 'error',
        });
      }
    }
  }

  for (const row of rows) {
    if (row.ID && !packetIds.has(row.ID)) {
      issues.push({
        code: 'board_task_missing_packet',
        message: `${row.ID} has an orchestration-board row but no Task Packet`,
        severity: 'error',
      });
    }
  }

  return issues;
}

async function inspectContextBudgets(cwd, config) {
  const issues = [];
  const candidate = getValue(config, ['authority', 'project_contract']);
  if (typeof candidate !== 'string') {
    return issues;
  }
  const projectContract = resolveProjectPath(cwd, candidate);
  if (!projectContract || !(await pathExists(projectContract))) {
    return issues;
  }
  const contractStat = await stat(projectContract);
  if (contractStat.isFile() && contractStat.size > MAX_PROJECT_CONTRACT_BYTES) {
    issues.push({
      code: 'oversized_project_contract',
      message: `${candidate} exceeds the recommended 16 KiB always-on context budget`,
      severity: 'warning',
    });
  }
  return issues;
}

function validateShape(config) {
  const issues = [];
  if (!isRecord(config)) {
    return [
      {
        code: 'invalid_config',
        message: 'workflow.yaml must contain a YAML object',
        severity: 'error',
      },
    ];
  }

  if (config.version !== 1) {
    issues.push({
      code: 'unsupported_version',
      message: 'version must be 1',
      severity: 'error',
    });
  }

  const strings = [
    ...REQUIRED_PATHS.map((entry) => entry.keys),
    ['authority', 'bindings'],
    ['git', 'base_branch'],
    ['git', 'branch_pattern'],
    ['git', 'human_merge_gate'],
    ['workflow', 'human_plan_gate'],
    ['workflow', 'integration'],
    ['workflow', 'dependencies_ready_when'],
    ['commands', 'verify'],
    ['commands', 'context'],
    ['commands', 'grill'],
    ['commands', 'learn'],
    ['commands', 'brief'],
  ];
  const booleans = [
    ['git', 'require_isolated_worktree'],
    ['git', 'allow_worker_merge'],
    ['workflow', 'require_disjoint_write_sets'],
    ['workflow', 'require_head_sha_review'],
    ['roles', 'orchestrator', 'can_edit_product'],
    ['roles', 'orchestrator', 'can_delegate'],
    ['roles', 'implementer', 'one_task_at_a_time'],
    ['roles', 'implementer', 'requires_task_packet'],
    ['roles', 'reviewer', 'can_edit'],
    ['roles', 'reviewer', 'can_self_review'],
  ];

  for (const keys of strings) {
    addTypeIssue(issues, config, keys, 'string');
  }
  for (const keys of booleans) {
    addTypeIssue(issues, config, keys, 'boolean');
  }
  addTypeIssue(
    issues,
    config,
    ['workflow', 'max_parallel_writers'],
    'integer',
  );
  addTypeIssue(issues, config, ['stop_conditions'], 'array');

  return issues;
}

function validateSchemaValues(config) {
  const issues = [];

  for (const [location, allowed] of ALLOWED_KEYS) {
    const keys = location ? location.split('.') : [];
    const value = keys.length === 0 ? config : getValue(config, keys);
    if (!isRecord(value)) {
      continue;
    }

    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) {
        issues.push({
          code: 'unknown_config_key',
          message: `unknown configuration key: ${[...keys, key].join('.')}`,
          severity: 'error',
        });
      }
    }
  }

  const enums = [
    {
      allowed: ['required', 'optional'],
      keys: ['git', 'human_merge_gate'],
    },
    {
      allowed: ['required', 'optional'],
      keys: ['workflow', 'human_plan_gate'],
    },
    {
      allowed: ['serial', 'parallel'],
      keys: ['workflow', 'integration'],
    },
    {
      allowed: ['merged', 'reviewed', 'completed'],
      keys: ['workflow', 'dependencies_ready_when'],
    },
  ];
  for (const rule of enums) {
    const value = getValue(config, rule.keys);
    if (typeof value === 'string' && !rule.allowed.includes(value)) {
      issues.push({
        code: 'invalid_config_value',
        message: `${rule.keys.join('.')} must be one of: ${rule.allowed.join(', ')}`,
        severity: 'error',
      });
    }
  }

  const maxWriters = getValue(config, ['workflow', 'max_parallel_writers']);
  if (Number.isInteger(maxWriters) && maxWriters < 1) {
    issues.push({
      code: 'invalid_config_value',
      message: 'workflow.max_parallel_writers must be at least 1',
      severity: 'error',
    });
  }

  const stopConditions = getValue(config, ['stop_conditions']);
  if (Array.isArray(stopConditions)) {
    const validItems = stopConditions.every(
      (item) => typeof item === 'string' && item.length > 0,
    );
    if (!validItems || stopConditions.length === 0) {
      issues.push({
        code: 'invalid_config_value',
        message: 'stop_conditions must contain at least one non-empty string',
        severity: 'error',
      });
    } else if (new Set(stopConditions).size !== stopConditions.length) {
      issues.push({
        code: 'invalid_config_value',
        message: 'stop_conditions must not contain duplicates',
        severity: 'error',
      });
    }
  }

  return issues;
}

function validateContradictions(config) {
  const issues = [];
  const maxWriters = getValue(config, ['workflow', 'max_parallel_writers']);

  if (
    Number.isInteger(maxWriters) &&
    maxWriters > 1 &&
    getValue(config, ['git', 'require_isolated_worktree']) === false
  ) {
    issues.push({
      code: 'parallel_without_isolation',
      message: 'parallel writers require isolated worktrees',
      severity: 'error',
    });
  }

  if (
    Number.isInteger(maxWriters) &&
    maxWriters > 1 &&
    getValue(config, ['workflow', 'require_disjoint_write_sets']) === false
  ) {
    issues.push({
      code: 'parallel_without_disjoint_write_sets',
      message: 'parallel writers require disjoint write-sets',
      severity: 'error',
    });
  }

  if (
    getValue(config, ['git', 'allow_worker_merge']) === true &&
    getValue(config, ['git', 'human_merge_gate']) === 'required'
  ) {
    issues.push({
      code: 'worker_merge_bypasses_gate',
      message: 'worker merge cannot be enabled when the human merge gate is required',
      severity: 'error',
    });
  }

  if (getValue(config, ['roles', 'reviewer', 'can_self_review']) === true) {
    issues.push({
      code: 'reviewer_self_review',
      message: 'reviewers cannot review their own work',
      severity: 'error',
    });
  }

  return issues;
}

export async function checkWorkflow(cwd) {
  const issues = [];
  const manifestPath = path.join(cwd, '.agentic', 'workflow.yaml');
  let source;

  try {
    source = await readFile(manifestPath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {
        issues: [
          {
            code: 'missing_manifest',
            message: '.agentic/workflow.yaml does not exist',
            severity: 'error',
          },
        ],
      };
    }
    throw error;
  }

  const document = parseDocument(source, {
    prettyErrors: true,
    uniqueKeys: true,
  });
  for (const error of document.errors) {
    issues.push({
      code: 'invalid_yaml',
      message: error.message,
      severity: 'error',
    });
  }

  if (issues.length > 0) {
    return { issues };
  }

  const config = document.toJS({ maxAliasCount: 50 });
  issues.push(...validateShape(config));
  issues.push(...validateSchemaValues(config));
  issues.push(...validateContradictions(config));

  const projectRoot = await realpath(cwd);
  for (const requirement of REQUIRED_PATHS) {
    const { keys } = requirement;
    const candidate = getValue(config, keys);
    if (typeof candidate !== 'string') {
      continue;
    }

    const resolved = resolveProjectPath(cwd, candidate);
    if (!resolved) {
      issues.push({
        code: 'unsafe_path',
        message: `${keys.join('.')} must stay inside the project: ${candidate}`,
        severity: 'error',
      });
    } else if (!(await pathExists(resolved))) {
      issues.push({
        code: 'missing_path',
        message: `${keys.join('.')} does not exist: ${candidate}`,
        severity: 'error',
      });
    } else {
      const resolvedRealPath = await realpath(resolved);
      if (!isInsideProject(projectRoot, resolvedRealPath)) {
        issues.push({
          code: 'unsafe_path',
          message: `${keys.join('.')} resolves outside the project: ${candidate}`,
          severity: 'error',
        });
        continue;
      }

      const resolvedStat = await stat(resolvedRealPath);
      const validType =
        requirement.type === 'file'
          ? resolvedStat.isFile()
          : resolvedStat.isDirectory();
      if (!validType) {
        issues.push({
          code: 'invalid_path_type',
          message: `${keys.join('.')} must reference a ${requirement.type}: ${candidate}`,
          severity: 'error',
        });
      }
    }
  }

  issues.push(...(await scanBindings(cwd, config)));
  issues.push(...(await inspectContextBudgets(cwd, config)));
  issues.push(...(await scanReadyTaskPackets(cwd, config)));
  issues.push(...(await inspectOrchestrationState(cwd, config)));
  for (const learningPath of await pendingLearningPaths(cwd)) {
    issues.push({
      code: 'pending_learning',
      message: `${learningPath} awaits review and promotion or rejection`,
      severity: 'warning',
    });
  }

  return { config, issues };
}
