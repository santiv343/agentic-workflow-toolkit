import {
  accessSync,
  constants,
  existsSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const TOOLS = [
  { category: 'runtime', command: 'node', name: 'node' },
  { category: 'version-control', command: 'git', name: 'git' },
  { category: 'package-manager', command: 'npm', name: 'npm' },
  { category: 'package-manager', command: 'pnpm', name: 'pnpm' },
  { category: 'package-manager', command: 'yarn', name: 'yarn' },
  { category: 'package-manager', command: 'bun', name: 'bun' },
  { category: 'package-manager', command: 'deno', name: 'deno' },
  { category: 'agent-cli', command: 'codex', name: 'codex' },
  { category: 'agent-cli', command: 'claude', name: 'claude' },
  { category: 'agent-cli', command: 'gemini', name: 'gemini' },
  { category: 'agent-cli', command: 'opencode', name: 'opencode' },
  { category: 'agent-cli', command: 'pi', name: 'pi' },
  { category: 'agent-memory', command: 'engram', name: 'engram' },
];

function canExecute(filePath) {
  try {
    if (!statSync(filePath).isFile()) {
      return false;
    }
    if (process.platform !== 'win32') {
      accessSync(filePath, constants.X_OK);
    }
    return true;
  } catch {
    return false;
  }
}

function executableExtensions() {
  if (process.platform !== 'win32') {
    return [''];
  }

  const pathExt = process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD';
  return pathExt.split(';').map((extension) => extension.toLowerCase());
}

function findExecutable(command) {
  if (command === 'node') {
    return process.execPath;
  }

  const pathEntries = (process.env.PATH ?? '').split(path.delimiter);
  for (const directory of pathEntries) {
    if (!directory) {
      continue;
    }
    for (const extension of executableExtensions()) {
      const candidate = path.join(directory, `${command}${extension}`);
      if (existsSync(candidate) && canExecute(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
}

function runVersion(executable) {
  const extension = path.extname(executable).toLowerCase();
  const options = {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  };

  if (
    process.platform === 'win32' &&
    (extension === '.cmd' || extension === '.bat')
  ) {
    const commandProcessor = process.env.ComSpec ?? 'cmd.exe';
    return spawnSync(
      commandProcessor,
      ['/d', '/c', executable, '--version'],
      options,
    );
  }

  return spawnSync(executable, ['--version'], options);
}

function firstOutputLine(result) {
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  return output.split(/\r?\n/u).find((line) => line.trim().length > 0)?.trim();
}

function diagnoseTool(tool) {
  const executable = findExecutable(tool.command);
  if (!executable) {
    return {
      available: false,
      category: tool.category,
      name: tool.name,
    };
  }

  const result = runVersion(executable);
  const version = firstOutputLine(result);
  if (result.status !== 0 || !version) {
    return {
      available: false,
      category: tool.category,
      name: tool.name,
    };
  }

  return {
    available: true,
    category: tool.category,
    name: tool.name,
    version,
  };
}

export function diagnoseTools() {
  return {
    platform: process.platform,
    tools: TOOLS.map(diagnoseTool),
  };
}
