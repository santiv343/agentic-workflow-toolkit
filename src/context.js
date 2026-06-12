import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import {
  cleanListValue,
  isNone,
  listItems,
  parseSections,
} from './markdown.js';

const ROLES = new Set([
  'orchestrator',
  'planner',
  'implementer',
  'reviewer',
]);
const TASK_REQUIRED_ROLES = new Set(['implementer', 'reviewer']);

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

function portablePath(candidate) {
  return candidate.replaceAll('\\', '/');
}

function filePart(candidate) {
  return candidate.split('#', 1)[0];
}

function resolveInside(cwd, candidate) {
  const relative = filePart(candidate);
  if (
    !relative ||
    path.isAbsolute(relative) ||
    path.win32.isAbsolute(relative) ||
    relative.split(/[\\/]/u).includes('..')
  ) {
    return undefined;
  }
  const resolved = path.resolve(cwd, relative);
  const projectRelative = path.relative(cwd, resolved);
  return projectRelative.startsWith('..') || path.isAbsolute(projectRelative)
    ? undefined
    : resolved;
}

async function describePath(cwd, candidate) {
  const resolved = resolveInside(cwd, candidate);
  if (!resolved || !(await exists(resolved))) {
    return {
      bytes: 0,
      path: portablePath(candidate),
      status: 'missing',
    };
  }
  const fileStat = await stat(resolved);
  return {
    bytes: fileStat.isFile() ? fileStat.size : 0,
    path: portablePath(candidate),
    status: fileStat.isFile() ? 'file' : 'directory',
  };
}

function routeValues(source, subsection) {
  const sections = parseSections(source, 3);
  return listItems(sections.get(subsection) ?? '')
    .filter((value) => !isNone(value))
    .map(cleanListValue);
}

export async function buildContextRoute(options) {
  if (!ROLES.has(options.role)) {
    throw new Error(
      `--role must be one of: ${[...ROLES].join(', ')}`,
    );
  }
  if (TASK_REQUIRED_ROLES.has(options.role) && !options.taskPath) {
    throw new Error(`--task is required for role ${options.role}`);
  }

  const bootstrap = await Promise.all([
    describePath(options.cwd, 'AGENTS.md'),
    describePath(options.cwd, '.agentic/workflow.yaml'),
  ]);
  const required = [];
  if (options.role === 'orchestrator' || options.role === 'planner') {
    required.push(
      await describePath(
        options.cwd,
        'docs/implementation/orchestration-board.md',
      ),
    );
  }

  let task = null;
  let onDemand = [];
  let discovery = [];
  let doNotPreload = [];
  if (options.taskPath) {
    const taskDescriptor = await describePath(options.cwd, options.taskPath);
    task = taskDescriptor;
    if (taskDescriptor.status === 'file') {
      const taskSource = await readFile(
        resolveInside(options.cwd, options.taskPath),
        'utf8',
      );
      const contextRoute =
        parseSections(taskSource).get('Context Route') ?? '';
      for (const candidate of routeValues(contextRoute, 'Required')) {
        required.push(await describePath(options.cwd, candidate));
      }
      onDemand = routeValues(contextRoute, 'On demand');
      discovery = routeValues(contextRoute, 'Discovery');
      doNotPreload = routeValues(contextRoute, 'Do not preload');
    }
  }

  const bootstrapBytes = bootstrap.reduce(
    (total, entry) => total + entry.bytes,
    0,
  );
  const requiredBytes =
    required.reduce((total, entry) => total + entry.bytes, 0) +
    (task?.bytes ?? 0);
  const missing = [...bootstrap, ...required, ...(task ? [task] : [])].filter(
    (entry) => entry.status === 'missing',
  );

  return {
    bootstrap,
    budget: {
      bootstrapBytes,
      recommendedBootstrapMaxBytes: 16_384,
      requiredBytes,
      recommendedRequiredMaxBytes: 65_536,
    },
    discovery,
    doNotPreload,
    missing,
    onDemand,
    required,
    role: options.role,
    strategy: 'progressive-disclosure',
    task,
  };
}

export function formatContextRoute(route) {
  const lines = [
    `Role: ${route.role}`,
    `Strategy: ${route.strategy}`,
    `Bootstrap budget: ${route.budget.bootstrapBytes}/${route.budget.recommendedBootstrapMaxBytes} bytes`,
    `Required-read budget: ${route.budget.requiredBytes}/${route.budget.recommendedRequiredMaxBytes} bytes`,
    '',
    'Read first:',
  ];
  for (const entry of route.bootstrap) {
    lines.push(`- ${entry.status.toUpperCase()} ${entry.path} (${entry.bytes} bytes)`);
  }
  if (route.task) {
    lines.push(`- ${route.task.status.toUpperCase()} ${route.task.path} (${route.task.bytes} bytes)`);
  }
  for (const entry of route.required) {
    lines.push(`- ${entry.status.toUpperCase()} ${entry.path} (${entry.bytes} bytes)`);
  }
  lines.push('', 'Load on demand:');
  lines.push(...(route.onDemand.length > 0 ? route.onDemand.map((value) => `- ${value}`) : ['- none']));
  lines.push('', 'Discover before reading broadly:');
  lines.push(...(route.discovery.length > 0 ? route.discovery.map((value) => `- ${value}`) : ['- none']));
  lines.push('', 'Do not preload:');
  lines.push(...(route.doNotPreload.length > 0 ? route.doNotPreload.map((value) => `- ${value}`) : ['- none']));
  return `${lines.join('\n')}\n`;
}
