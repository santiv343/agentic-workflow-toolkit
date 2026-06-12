import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const GENERATED_FILES = [
  {
    destination: 'AGENTS.md',
    template: 'AGENTS.md.template',
  },
  {
    destination: path.join('.agentic', 'workflow.yaml'),
    template: 'workflow.yaml.template',
  },
  {
    destination: path.join('.agentic', 'workflow.schema.json'),
    source: path.join('schema', 'workflow.schema.json'),
  },
  {
    destination: path.join(
      'docs',
      'implementation',
      'orchestration-board.md',
    ),
    template: 'orchestration-board.md.template',
  },
  {
    destination: path.join(
      'docs',
      'implementation',
      'tasks',
      'README.md',
    ),
    template: 'tasks.README.md.template',
  },
  {
    destination: path.join(
      'docs',
      'implementation',
      'tasks',
      'TASK.template.md',
    ),
    template: 'task-packet.md.template',
  },
  {
    destination: path.join('.agentic', 'learnings', 'README.md'),
    template: 'learnings.README.md.template',
  },
  {
    destination: path.join(
      '.agentic',
      'learnings',
      'inbox',
      'README.md',
    ),
    template: 'learnings-inbox.README.md.template',
  },
];

function yamlScalar(value) {
  return JSON.stringify(value);
}

function render(template, variables) {
  return template.replaceAll(
    /\{\{([A-Z_]+)\}\}/g,
    (_, name) => variables[name] ?? '',
  );
}

async function fileExists(filePath) {
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

export async function initWorkflow(options) {
  const variables = {
    BASE_BRANCH: options.baseBranch,
    VERIFY_COMMAND: options.verifyCommand,
    YAML_BASE_BRANCH: yamlScalar(options.baseBranch),
    YAML_VERIFY_COMMAND: yamlScalar(options.verifyCommand),
  };

  const destinations = [];
  for (const file of GENERATED_FILES) {
    const destinationPath = path.join(options.cwd, file.destination);
    const templatePath = file.source
      ? path.join(PACKAGE_ROOT, file.source)
      : path.join(PACKAGE_ROOT, 'templates', file.template);
    const template = await readFile(templatePath, 'utf8');
    const content = render(template, variables);
    const exists = await fileExists(destinationPath);
    const unchanged =
      exists && (await readFile(destinationPath, 'utf8')) === content;
    destinations.push({
      ...file,
      content,
      destinationPath,
      exists,
      unchanged,
    });
  }

  if (!options.force) {
    const conflicts = destinations
      .filter((file) => file.exists && !file.unchanged)
      .map((file) => file.destination);
    if (conflicts.length > 0) {
      throw new Error(
        `Refusing to overwrite existing files that differ: ${conflicts.join(', ')}`,
      );
    }
  }

  const unchanged = destinations
    .filter((file) => file.unchanged && !options.force)
    .map((file) => file.destination);
  const planned = destinations
    .filter((file) => options.force || !file.unchanged)
    .map((file) => file.destination);
  if (options.dryRun) {
    return { planned, unchanged, written: [] };
  }

  const written = [];
  for (const file of destinations) {
    if (file.unchanged && !options.force) {
      continue;
    }
    await mkdir(path.dirname(file.destinationPath), { recursive: true });
    await writeFile(file.destinationPath, file.content, {
      encoding: 'utf8',
      flag: options.force || file.exists ? 'w' : 'wx',
    });
    written.push(file.destination);
  }

  return { planned, unchanged, written };
}
