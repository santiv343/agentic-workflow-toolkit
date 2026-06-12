import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { buildBrief, formatBrief } from './brief.js';
import { checkWorkflow } from './check.js';
import { buildContextRoute, formatContextRoute } from './context.js';
import { detectProjectDefaults } from './detect.js';
import { diagnoseTools } from './doctor.js';
import { auditTaskPacket, formatGrillReport } from './grill.js';
import { initWorkflow } from './init.js';
import {
  formatLearningFindings,
  recordLearningProposal,
} from './learn.js';

const HELP = `Usage:
  agentic-workflow init [--base-branch <branch>] [--verify-command <command>] [--cwd <path>] [--dry-run] [--force]
  agentic-workflow check [--cwd <path>]
  agentic-workflow context --role <role> [--task <path>] [--cwd <path>] [--json]
  agentic-workflow grill --task <path> [--cwd <path>] [--json]
  agentic-workflow learn --from <json-path> [--cwd <path>]
  agentic-workflow brief --role <role> [--task <path>] [--cwd <path>] [--json]
  agentic-workflow doctor [--json]

Commands:
  init    Infer safe defaults and create the workflow control plane.
  check   Validate configuration, paths, safety rules, and binding secrets.
  context Return a progressive-disclosure reading route without file contents.
  grill   Block implicit decisions and incomplete task contracts.
  learn   Record a bounded learning proposal without changing project rules.
  brief   Re-anchor a session with minimal invariants, context route, and learnings.
  doctor  Report available runtimes, package managers, VCS, and agent CLIs.
`;

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

export async function main(args) {
  const [command] = args;

  if (!command || args.includes('--help')) {
    process.stdout.write(HELP);
    return;
  }

  if (command === '--version') {
    const packageJson = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    );
    process.stdout.write(`${packageJson.version}\n`);
    return;
  }

  const cwd = path.resolve(readOption(args, '--cwd', process.cwd()));

  if (command === 'check') {
    const result = await checkWorkflow(cwd);
    const errors = result.issues.filter(
      (issue) => issue.severity === 'error',
    );
    const warnings = result.issues.filter(
      (issue) => issue.severity === 'warning',
    );

    for (const issue of result.issues) {
      process.stdout.write(
        `${issue.severity.toUpperCase()} [${issue.code}] ${issue.message}\n`,
      );
    }
    process.stdout.write(`${errors.length} errors, ${warnings.length} warnings\n`);

    if (errors.length > 0) {
      throw new Error('Workflow configuration is invalid');
    }
    process.stdout.write('Workflow configuration is valid.\n');
    return;
  }

  if (command === 'doctor') {
    const report = diagnoseTools();
    if (args.includes('--json')) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return;
    }

    process.stdout.write(`Platform: ${report.platform}\n`);
    for (const tool of report.tools) {
      const detail = tool.available ? tool.version : 'not found';
      process.stdout.write(`${tool.name}: ${detail}\n`);
    }
    return;
  }

  if (command === 'context') {
    const role = readOption(args, '--role', undefined);
    if (!role) {
      throw new Error('--role is required');
    }
    const taskPath = readOption(args, '--task', undefined);
    const route = await buildContextRoute({ cwd, role, taskPath });
    if (args.includes('--json')) {
      process.stdout.write(`${JSON.stringify(route, null, 2)}\n`);
    } else {
      process.stdout.write(formatContextRoute(route));
    }
    if (route.missing.length > 0) {
      throw new Error('Context route contains missing required paths');
    }
    return;
  }

  if (command === 'grill') {
    const taskPath = readOption(args, '--task', undefined);
    if (!taskPath) {
      throw new Error('--task is required');
    }
    const report = await auditTaskPacket(cwd, taskPath);
    if (args.includes('--json')) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      process.stdout.write(formatGrillReport(report));
    }
    if (report.findings.length > 0) {
      throw new Error('Task Packet has unresolved grill blockers');
    }
    return;
  }

  if (command === 'learn') {
    const inputPath = readOption(args, '--from', undefined);
    if (!inputPath) {
      throw new Error('--from is required');
    }
    const result = await recordLearningProposal(
      cwd,
      path.resolve(cwd, inputPath),
    );
    if (result.findings.length > 0) {
      process.stdout.write(formatLearningFindings(result.findings));
      throw new Error('Learning proposal is incomplete or unsafe');
    }
    process.stdout.write(
      `Learning proposal recorded: ${result.path}. No project rules were changed.\n`,
    );
    return;
  }

  if (command === 'brief') {
    const role = readOption(args, '--role', undefined);
    if (!role) {
      throw new Error('--role is required');
    }
    const taskPath = readOption(args, '--task', undefined);
    const brief = await buildBrief({ cwd, role, taskPath });
    if (args.includes('--json')) {
      process.stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
    } else {
      process.stdout.write(formatBrief(brief));
    }
    if (brief.route.missing.length > 0) {
      throw new Error('Brief contains missing required paths');
    }
    return;
  }

  if (command !== 'init') {
    throw new Error(
      'Expected a command: init, check, context, grill, learn, brief, or doctor. Run agentic-workflow --help for usage.',
    );
  }

  const detected = await detectProjectDefaults(cwd);
  const configuredBaseBranch = readOption(args, '--base-branch', undefined);
  const configuredVerifyCommand = readOption(
    args,
    '--verify-command',
    undefined,
  );
  const baseBranch = configuredBaseBranch ?? detected.baseBranch?.value;
  const verifyCommand =
    configuredVerifyCommand ?? detected.verifyCommand?.value;
  if (!baseBranch || !verifyCommand) {
    const missing = [
      !baseBranch ? 'base branch' : undefined,
      !verifyCommand ? 'verify command' : undefined,
    ].filter(Boolean);
    const flags = [
      !baseBranch ? '--base-branch <branch>' : undefined,
      !verifyCommand ? '--verify-command <command>' : undefined,
    ].filter(Boolean);
    throw new Error(
      `Could not infer ${missing.join(' and ')} safely; provide ${flags.join(' and ')}`,
    );
  }
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  const result = await initWorkflow({
    baseBranch,
    cwd,
    dryRun,
    force,
    verifyCommand,
  });

  if (!configuredBaseBranch && detected.baseBranch) {
    process.stdout.write(
      `Inferred base branch: ${baseBranch} (${detected.baseBranch.source}).\n`,
    );
  }
  if (!configuredVerifyCommand && detected.verifyCommand) {
    process.stdout.write(
      `Inferred verify command: ${verifyCommand} (${detected.verifyCommand.source}).\n`,
    );
  }
  const prefix = dryRun ? 'Dry run' : 'Initialized agentic workflow';
  process.stdout.write(
    `${prefix} in ${cwd}: ${result.written.length} written, ${result.unchanged.length} unchanged, ${result.planned.length} planned.\n`,
  );
}
