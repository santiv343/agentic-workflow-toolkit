import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { isNone, listItems, parseSections } from './markdown.js';

const REQUIRED_SECTIONS = [
  'Metadata',
  'Mission',
  'Scope',
  'Ownership',
  'Context Route',
  'Decisions',
  'Open Questions',
  'Assumptions',
  'Documentation Impact',
  'Acceptance Criteria',
  'Test Map',
  'Plan',
  'Stop Conditions',
  'Definition of Done',
];
const PLACEHOLDER =
  /\b(?:TBD|TODO|TASK-ID|Describe the|Define included|Define explicit|Title)\b/iu;

function issue(code, message, recommendedAction) {
  return { code, message, recommendedAction };
}

function hasNone(section) {
  const items = listItems(section);
  return items.length === 1 && isNone(items[0]);
}

export function taskStatus(source) {
  const metadata = parseSections(source).get('Metadata') ?? '';
  return metadata.match(/^\s*-\s*Status:\s*(\S+)/imu)?.[1]?.toLowerCase();
}

export function auditTaskPacketSource(source) {
  const findings = [];
  const sections = parseSections(source);

  for (const name of REQUIRED_SECTIONS) {
    if (!sections.get(name)?.trim()) {
      findings.push(
        issue(
          'missing_section',
          `missing or empty section: ${name}`,
          `Complete ## ${name} before moving the task to ready.`,
        ),
      );
    }
  }

  for (const [name, content] of sections) {
    if (PLACEHOLDER.test(content)) {
      findings.push(
        issue(
          'placeholder',
          `placeholder remains in section: ${name}`,
          'Replace placeholders with evidence-backed content or an explicit none with reason.',
        ),
      );
    }
  }

  const openQuestions = sections.get('Open Questions') ?? '';
  if (openQuestions && !hasNone(openQuestions)) {
    for (const question of listItems(openQuestions)) {
      findings.push(
        issue(
          'unresolved_question',
          `unresolved question: ${question}`,
          'Explore repository evidence first; if still irreducible, ask the human one question with a recommended answer.',
        ),
      );
    }
  }

  const assumptions = sections.get('Assumptions') ?? '';
  if (
    assumptions &&
    !hasNone(assumptions) &&
    !/^\s*-\s*Evidence:/imu.test(assumptions)
  ) {
    findings.push(
      issue(
        'assumption_without_evidence',
        'assumptions exist without an Evidence entry',
        'Add the source, code path, test, ADR, or human decision supporting each assumption.',
      ),
    );
  }

  const decisions = sections.get('Decisions') ?? '';
  if (
    decisions &&
    !hasNone(decisions) &&
    !/^\s*-\s*Evidence:/imu.test(decisions)
  ) {
    findings.push(
      issue(
        'decision_without_evidence',
        'decisions exist without an Evidence entry',
        'Record why the decision was selected and which alternatives or constraints were considered.',
      ),
    );
  }

  const documentationImpact = sections.get('Documentation Impact') ?? '';
  if (
    documentationImpact &&
    hasNone(documentationImpact) &&
    !/reason:/iu.test(documentationImpact)
  ) {
    findings.push(
      issue(
        'documentation_without_reason',
        'documentation impact says none without a reason',
        'State which canonical documentation was reviewed and why no update is required.',
      ),
    );
  } else if (
    documentationImpact &&
    !hasNone(documentationImpact) &&
    !/^\s*-\s*(?:Reason|Update):/imu.test(documentationImpact)
  ) {
    findings.push(
      issue(
        'documentation_impact_incomplete',
        'documentation impact must name an update or give a reason',
        'List the authoritative document to update, or state none with a concrete reason.',
      ),
    );
  }

  return findings;
}

export async function auditTaskPacket(cwd, taskPath) {
  const resolved = path.resolve(cwd, taskPath);
  const relative = path.relative(cwd, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('--task must stay inside the project');
  }
  const source = await readFile(resolved, 'utf8');
  return {
    findings: auditTaskPacketSource(source),
    path: taskPath.replaceAll('\\', '/'),
    status: taskStatus(source),
  };
}

export function formatGrillReport(report) {
  const lines = [`Task: ${report.path}`];
  for (const finding of report.findings) {
    lines.push(
      `BLOCKER [${finding.code}] ${finding.message}`,
      `  Recommended action: ${finding.recommendedAction}`,
    );
  }
  lines.push(`${report.findings.length} blockers`);
  if (report.findings.length === 0) {
    lines.push('Grill gate passed.');
  }
  return `${lines.join('\n')}\n`;
}
