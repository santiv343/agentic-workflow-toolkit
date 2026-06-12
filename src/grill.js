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
  'Handoff Evidence',
  'Definition of Done',
];
const REQUIRED_HANDOFF_FIELDS = [
  'Response language',
  'Outcome summary',
  'Changes made',
  'Verification summary',
  'Unverified or inferred',
  'Remaining work',
  'Next gate',
  'Work classification',
  'Initial evidence command',
  'Initial evidence result',
  'Initial evidence',
  'Failure oracle',
  'Head commit',
  'Verification command',
  'Verification result',
  'Verified commit',
  'Acceptance criteria',
  'Scope command',
  'Scope result',
  'Review status',
  'Reviewer',
  'Reviewed commit',
  'Review verification command',
  'Review verification result',
  'Review verified commit',
  'Findings',
  'Residual risks',
  'Merge authorized by',
  'Merge status',
  'Merged commit',
  'Integrated verification command',
  'Integrated verification result',
  'Integrated verified commit',
];
const PLACEHOLDER =
  /\b(?:TBD|TODO|TASK-ID|Describe the|Define included|Define explicit|Title)\b/iu;
const TASK_STATUSES = new Set([
  'deferred',
  'planned',
  'ready',
  'active',
  'review',
  'reviewed',
  'done',
]);
const ACTIVE_STATUSES = new Set(['active', 'review', 'reviewed', 'done']);
const EXECUTION_STATUSES = new Set(['review', 'reviewed', 'done']);
const REVIEWED_STATUSES = new Set(['reviewed', 'done']);
const SHA_PATTERN = /^[0-9a-f]{40}$/iu;
const WORK_CLASSIFICATIONS = new Set([
  'behavior-change',
  'bug-fix',
  'refactor',
  'characterization',
  'hardening',
  'documentation',
  'research',
]);
const INITIAL_EVIDENCE_RESULTS = new Map([
  ['behavior-change', 'failed-intended'],
  ['bug-fix', 'failed-intended'],
  ['refactor', 'passed-characterization'],
  ['characterization', 'passed-characterization'],
  ['hardening', 'passed-characterization'],
  ['documentation', 'reviewed-non-executable'],
  ['research', 'reviewed-non-executable'],
]);

function issue(code, message, recommendedAction) {
  return { code, message, recommendedAction };
}

function hasNone(section) {
  const items = listItems(section);
  return items.length === 1 && isNone(items[0]);
}

function fieldValue(section, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return section
    .match(new RegExp(`^\\s*-\\s*${escaped}:\\s*(.+?)\\s*$`, 'imu'))?.[1]
    ?.replaceAll('`', '')
    .trim();
}

function isPending(value) {
  return (
    !value ||
    /^(?:pending|unassigned|none|n\/a|-|set at dispatch)$/iu.test(value)
  );
}

function isUnresolvedReviewValue(value) {
  return (
    !value ||
    /^(?:pending|unassigned|-|set at dispatch)$/iu.test(value)
  );
}

function isSha(value) {
  return typeof value === 'string' && SHA_PATTERN.test(value);
}

function isLanguageTag(value) {
  if (!value || value.toLowerCase() === 'und') {
    return false;
  }
  try {
    const canonical = Intl.getCanonicalLocales(value);
    const displayNames = new Intl.DisplayNames(['en'], {
      fallback: 'none',
      type: 'language',
    });
    return canonical.length === 1 && Boolean(displayNames.of(canonical[0]));
  } catch {
    return false;
  }
}

function isWeakHumanSummary(value) {
  return (
    isPending(value) ||
    (value?.trim().length ?? 0) < 20 ||
    /^(?:done|completed|implemented|fixed|passed|all good|no changes)$/iu.test(
      value ?? '',
    )
  );
}

function requireField(findings, section, label, code, message) {
  const value = fieldValue(section, label);
  if (isPending(value)) {
    findings.push(
      issue(
        code,
        message,
        `Record a concrete ${label.toLowerCase()} before claiming this task state.`,
      ),
    );
  }
  return value;
}

function acceptanceCriterionIds(section) {
  return section
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*(\d+)\.\s+/u)?.[1])
    .filter((value) => typeof value === 'string')
    .map((value) => `AC${value}`);
}

function hasConcreteCriterionEvidence(value, criterion) {
  const escaped = criterion.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const evidence = value?.match(
    new RegExp(
      `(?:^|;)\\s*${escaped}\\s*(?::|=|->)\\s*([^;]+)`,
      'iu',
    ),
  )?.[1]?.trim();
  return Boolean(
    evidence &&
      evidence.length >= 8 &&
      !/^(?:passed|done|yes|checked|complete|completed)$/iu.test(evidence),
  );
}

export function taskStatus(source) {
  const metadata = parseSections(source).get('Metadata') ?? '';
  return metadata.match(/^\s*-\s*Status:\s*(\S+)/imu)?.[1]?.toLowerCase();
}

export function auditTaskPacketSource(source) {
  const findings = [];
  const sections = parseSections(source);
  const status = taskStatus(source);

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

  if (!status || !TASK_STATUSES.has(status)) {
    findings.push(
      issue(
        'invalid_task_status',
        `task status must be one of: ${[...TASK_STATUSES].join(', ')}`,
        'Use the documented state machine and do not invent synonymous states.',
      ),
    );
  }

  const metadata = sections.get('Metadata') ?? '';
  const handoff = sections.get('Handoff Evidence') ?? '';
  if (handoff.trim()) {
    const missingHandoffFields = REQUIRED_HANDOFF_FIELDS.filter(
      (label) => fieldValue(handoff, label) === undefined,
    );
    if (missingHandoffFields.length > 0) {
      findings.push(
        issue(
          'handoff_contract_missing',
          `handoff fields are missing or malformed: ${missingHandoffFields.join(', ')}`,
          'Restore every Human Summary and Machine Evidence field from the canonical Task Packet template.',
        ),
      );
    }
  }

  if (status && ACTIVE_STATUSES.has(status)) {
    const baseCommit = fieldValue(metadata, 'Base commit');
    const workerBranch = fieldValue(metadata, 'Worker branch');
    const worktree = fieldValue(metadata, 'Worktree');
    if (!isSha(baseCommit) || isPending(workerBranch) || isPending(worktree)) {
      findings.push(
        issue(
          'dispatch_evidence_missing',
          'active work requires an exact base commit, worker branch, and worktree',
          'The orchestrator must record dispatch evidence before implementation starts.',
        ),
      );
    }
  }

  if (status && EXECUTION_STATUSES.has(status)) {
    if (!handoff.trim()) {
      findings.push(
        issue(
          'handoff_evidence_incomplete',
          'execution handoff evidence is missing',
          'Record the exact head, verification, acceptance, and scope evidence.',
        ),
      );
    } else {
      const humanSummaryFields = [
        ['Outcome summary', 'the user-facing outcome is missing'],
        ['Changes made', 'the concrete change summary is missing'],
        ['Verification summary', 'the plain-language verification summary is missing'],
        ['Unverified or inferred', 'unverified claims and inferences are not disclosed'],
        ['Remaining work', 'remaining work or explicit none is missing'],
      ];
      for (const [label, message] of humanSummaryFields) {
        const value = fieldValue(handoff, label);
        if (isWeakHumanSummary(value)) {
          findings.push(
            issue(
              'human_handoff_incomplete',
              message,
              `Write a concrete plain-language ${label.toLowerCase()} of at least 20 characters; do not use a bare status word.`,
            ),
          );
        }
      }

      const responseLanguage = fieldValue(
        handoff,
        'Response language',
      )?.toLowerCase();
      if (!isLanguageTag(responseLanguage)) {
        findings.push(
          issue(
            'human_handoff_language_invalid',
            'Response language must be an explicit valid BCP 47 language tag',
            'Record the latest human request language, such as es, es-AR, en, or pt-BR, and use it in the final report.',
          ),
        );
      }

      const expectedNextGate = new Map([
        ['review', 'independent-review'],
        ['reviewed', 'human-merge'],
        ['done', 'none'],
      ]).get(status);
      if (fieldValue(handoff, 'Next gate')?.toLowerCase() !== expectedNextGate) {
        findings.push(
          issue(
            'human_handoff_next_gate_invalid',
            `${status} status requires Next gate: ${expectedNextGate}`,
            'State the exact next authority so the human knows what can happen next.',
          ),
        );
      }

      const headCommit = fieldValue(handoff, 'Head commit');
      const verifiedCommit = fieldValue(handoff, 'Verified commit');
      const verificationCommand = requireField(
        findings,
        handoff,
        'Verification command',
        'handoff_evidence_incomplete',
        'verification command is missing',
      );
      const verificationResult = fieldValue(handoff, 'Verification result');
      const acceptanceEvidence = requireField(
        findings,
        handoff,
        'Acceptance criteria',
        'handoff_evidence_incomplete',
        'acceptance-criteria evidence is missing',
      );
      const scopeResult = fieldValue(handoff, 'Scope result');
      const scopeCommand = requireField(
        findings,
        handoff,
        'Scope command',
        'handoff_evidence_incomplete',
        'scope verification command is missing',
      );
      const workClassification = fieldValue(
        handoff,
        'Work classification',
      )?.toLowerCase();
      const initialEvidenceCommand = requireField(
        findings,
        handoff,
        'Initial evidence command',
        'handoff_evidence_incomplete',
        'initial evidence command or review procedure is missing',
      );
      const initialEvidenceResult = fieldValue(
        handoff,
        'Initial evidence result',
      )?.toLowerCase();
      const initialEvidence = requireField(
        findings,
        handoff,
        'Initial evidence',
        'handoff_evidence_incomplete',
        'initial test or review evidence is missing',
      );
      requireField(
        findings,
        handoff,
        'Failure oracle',
        'handoff_evidence_incomplete',
        'the evidence oracle is missing',
      );

      if (
        !isSha(headCommit) ||
        verifiedCommit !== headCommit ||
        isPending(verificationCommand) ||
        isPending(scopeCommand) ||
        isPending(initialEvidenceCommand) ||
        verificationResult?.toLowerCase() !== 'passed' ||
        scopeResult?.toLowerCase() !== 'passed'
      ) {
        findings.push(
          issue(
            'handoff_evidence_incomplete',
            'execution evidence must identify one exact verified head with passed verification and scope checks',
            'Run the recorded command on the exact head and map each acceptance criterion before review.',
          ),
        );
      }
      const missingAcceptanceEvidence = acceptanceCriterionIds(
        sections.get('Acceptance Criteria') ?? '',
      ).filter(
        (criterion) =>
          !hasConcreteCriterionEvidence(acceptanceEvidence, criterion),
      );
      if (missingAcceptanceEvidence.length > 0) {
        findings.push(
          issue(
            'acceptance_evidence_incomplete',
            `handoff does not map: ${missingAcceptanceEvidence.join(', ')}`,
            'Name every acceptance criterion and its concrete test, inspection, or artifact.',
          ),
        );
      }
      if (
        !workClassification ||
        !WORK_CLASSIFICATIONS.has(workClassification)
      ) {
        findings.push(
          issue(
            'evidence_classification_missing',
            `work classification must be one of: ${[...WORK_CLASSIFICATIONS].join(', ')}`,
            'Classify the work before interpreting red, green, or non-executable evidence.',
          ),
        );
      } else if (
        initialEvidenceResult !==
        INITIAL_EVIDENCE_RESULTS.get(workClassification)
      ) {
        findings.push(
          issue(
            'initial_evidence_result_invalid',
            `${workClassification} requires Initial evidence result: ${INITIAL_EVIDENCE_RESULTS.get(workClassification)}`,
            'Use the exact result token for the selected work classification and describe the observed oracle separately.',
          ),
        );
      }
    }
  }

  if (status && REVIEWED_STATUSES.has(status)) {
    const headCommit = fieldValue(handoff, 'Head commit');
    const reviewStatus = fieldValue(handoff, 'Review status');
    const reviewedCommit = fieldValue(handoff, 'Reviewed commit');
    const reviewer = fieldValue(handoff, 'Reviewer');
    const findingsValue = fieldValue(handoff, 'Findings');
    const residualRisks = fieldValue(handoff, 'Residual risks');
    const reviewVerificationCommand = fieldValue(
      handoff,
      'Review verification command',
    );
    const reviewVerificationResult = fieldValue(
      handoff,
      'Review verification result',
    );
    const reviewVerifiedCommit = fieldValue(
      handoff,
      'Review verified commit',
    );

    if (
      reviewStatus?.toLowerCase() !== 'approved' ||
      !isSha(reviewedCommit) ||
      reviewedCommit !== headCommit ||
      isPending(reviewVerificationCommand) ||
      reviewVerificationResult?.toLowerCase() !== 'passed' ||
      reviewVerifiedCommit !== headCommit ||
      isPending(reviewer) ||
      isUnresolvedReviewValue(findingsValue) ||
      isUnresolvedReviewValue(residualRisks)
    ) {
      findings.push(
        issue(
          'review_evidence_incomplete',
          'reviewed status requires an independent reviewer approving the exact execution head',
          'Record reviewer identity, exact reviewed commit, findings, and residual risks.',
        ),
      );
    }
  }

  if (
    status === 'review' &&
    !/^pending$/iu.test(
      fieldValue(handoff, 'Review status') ?? '',
    )
  ) {
    findings.push(
      issue(
        'review_state_conflict',
        'review state requires Review status: pending',
        'Move to reviewed on approval or back to active when changes are requested.',
      ),
    );
  }

  if (
    status === 'reviewed' &&
    !/^(?:pending|pending human gate)$/iu.test(
      fieldValue(handoff, 'Merge status') ?? '',
    )
  ) {
    findings.push(
      issue(
        'integration_state_conflict',
        'reviewed state must still be pending the human merge gate',
        'Use done only after merge and integrated verification are observed.',
      ),
    );
  }

  if (status === 'done') {
    const mergeStatus = fieldValue(handoff, 'Merge status');
    const mergeAuthorizedBy = fieldValue(handoff, 'Merge authorized by');
    const mergedCommit = fieldValue(handoff, 'Merged commit');
    const integratedCommand = fieldValue(
      handoff,
      'Integrated verification command',
    );
    const integratedResult = fieldValue(
      handoff,
      'Integrated verification result',
    );
    const integratedCommit = fieldValue(
      handoff,
      'Integrated verified commit',
    );
    if (
      mergeStatus?.toLowerCase() !== 'merged' ||
      isPending(mergeAuthorizedBy) ||
      !isSha(mergedCommit) ||
      isPending(integratedCommand) ||
      integratedResult?.toLowerCase() !== 'passed' ||
      integratedCommit !== mergedCommit
    ) {
      findings.push(
        issue(
          'integration_evidence_incomplete',
          'done status requires an observed merged commit and verification of that exact integrated commit',
          'Keep the task reviewed until the human merge gate and integrated verification are complete.',
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
