export function parseSections(source, level = 2) {
  const marker = '#'.repeat(level);
  const pattern = new RegExp(`^${marker} (.+)$`, 'gmu');
  const matches = [...source.matchAll(pattern)];
  const sections = new Map();

  for (const [index, match] of matches.entries()) {
    const name = match[1].trim();
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    sections.set(name, source.slice(start, end).trim());
  }

  return sections;
}

export function listItems(source) {
  return source
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/u)?.[1])
    .filter((value) => typeof value === 'string');
}

export function cleanListValue(value) {
  const backtick = value.match(/`([^`]+)`/u)?.[1];
  return (backtick ?? value).trim();
}

export function isNone(value) {
  return /^(?:none|n\/a|not applicable)(?:\s*[-:]\s*.*)?$/iu.test(
    cleanListValue(value),
  );
}
