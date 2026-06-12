import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REQUIRED_FIELDS = [
  'id',
  'correction',
  'observedPattern',
  'generalizedRule',
  'scope',
  'proposedOwner',
  'mechanism',
  'evidence',
  'limitations',
  'regression',
];
const SCOPES = new Set([
  'one-off',
  'project',
  'tool-binding',
  'toolkit',
  'methodology',
]);
const MECHANISMS = new Set([
  'doc',
  'template',
  'gate',
  'test',
  'permission',
  'eval',
  'no-rule',
]);

function finding(code, message) {
  return { code, message };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyStringArray(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isNonEmptyString)
  );
}

export function validateLearningCandidate(candidate) {
  const findings = [];
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    return [finding('invalid_learning', 'learning input must be a JSON object')];
  }

  for (const field of REQUIRED_FIELDS) {
    const value = candidate[field];
    const valid =
      field === 'evidence' || field === 'limitations'
        ? isNonEmptyStringArray(value)
        : isNonEmptyString(value);
    if (!valid) {
      findings.push(
        finding(
          'missing_learning_field',
          `${field} must be ${field === 'evidence' || field === 'limitations' ? 'a non-empty string array' : 'a non-empty string'}`,
        ),
      );
    }
  }

  if (
    isNonEmptyString(candidate.id) &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(candidate.id)
  ) {
    findings.push(
      finding(
        'invalid_learning_id',
        'id must use lowercase kebab-case',
      ),
    );
  }
  if (
    isNonEmptyString(candidate.scope) &&
    !SCOPES.has(candidate.scope)
  ) {
    findings.push(
      finding(
        'invalid_learning_scope',
        `scope must be one of: ${[...SCOPES].join(', ')}`,
      ),
    );
  }
  if (
    isNonEmptyString(candidate.mechanism) &&
    !MECHANISMS.has(candidate.mechanism)
  ) {
    findings.push(
      finding(
        'invalid_learning_mechanism',
        `mechanism must be one of: ${[...MECHANISMS].join(', ')}`,
      ),
    );
  }

  if (
    isNonEmptyString(candidate.correction) &&
    isNonEmptyString(candidate.generalizedRule)
  ) {
    const correction = candidate.correction.trim().toLowerCase();
    const rule = candidate.generalizedRule.trim().toLowerCase();
    if (
      correction === rule ||
      candidate.generalizedRule.trim().split(/\s+/u).length < 6
    ) {
      findings.push(
        finding(
          'overbroad_learning',
          'generalizedRule must abstract the correction into a specific, bounded rule',
        ),
      );
    }
  }

  return findings;
}

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

export async function recordLearningProposal(cwd, inputPath) {
  const candidate = JSON.parse(await readFile(inputPath, 'utf8'));
  const findings = validateLearningCandidate(candidate);
  if (findings.length > 0) {
    return { findings };
  }

  const destination = path.join(
    cwd,
    '.agentic',
    'learnings',
    'inbox',
    `${candidate.id}.json`,
  );
  if (await exists(destination)) {
    return {
      findings: [
        finding(
          'learning_already_exists',
          `learning proposal already exists: ${candidate.id}`,
        ),
      ],
    };
  }

  const proposal = {
    ...candidate,
    status: 'proposed',
  };
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(proposal, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });

  return {
    findings: [],
    path: path
      .relative(cwd, destination)
      .replaceAll('\\', '/'),
    proposal,
  };
}

export function formatLearningFindings(findings) {
  return `${findings
    .map((entry) => `BLOCKER [${entry.code}] ${entry.message}`)
    .join('\n')}\n`;
}

export async function pendingLearningPaths(cwd) {
  const inbox = path.join(cwd, '.agentic', 'learnings', 'inbox');
  try {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(inbox, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('.json'),
      )
      .map((entry) =>
        path
          .relative(cwd, path.join(inbox, entry.name))
          .replaceAll('\\', '/'),
      )
      .sort();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
