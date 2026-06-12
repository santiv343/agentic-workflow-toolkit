import assert from 'node:assert/strict';
import test from 'node:test';

import { auditTaskPacketSource } from '../src/grill.js';

const HEAD = '0123456789abcdef0123456789abcdef01234567';
const BASE = 'fedcba9876543210fedcba9876543210fedcba98';

function packet({
  status = 'review',
  workClassification = 'hardening',
  initialEvidenceCommand = 'npm test',
  initialEvidenceResult = 'passed-characterization',
  initialEvidence = 'passing characterization baseline',
  reviewStatus = 'pending',
  reviewer = 'pending',
  reviewedCommit = 'pending',
  findings = 'pending',
  residualRisks = 'pending',
  mergeAuthorizedBy = 'pending',
  mergeStatus = 'pending',
  mergedCommit = 'pending',
  integratedResult = 'pending',
  integratedCommit = 'pending',
  acceptanceEvidence = 'AC1: completion-evidence.test.js rejects invalid claims',
  outcomeSummary = 'Invalid completion claims now fail before state changes.',
  responseLanguage = 'en',
  unverifiedOrInferred = 'none - every material claim is covered by the focused test',
} = {}) {
  const nextGate = new Map([
    ['review', 'independent-review'],
    ['reviewed', 'human-merge'],
    ['done', 'none'],
  ]).get(status);
  return `# Task Packet: TASK-900 - Completion evidence

## Metadata

- Status: ${status}
- Base branch: \`main\`
- Base commit: ${BASE}
- Worker branch: TASK-900-completion-evidence
- Worktree: ../worktrees/TASK-900-completion-evidence
- Dependencies: none

## Mission

Prove completion claims with durable evidence.

## Scope

Included:

- Completion evidence.

Excluded:

- Product behavior.

## Ownership

- Write-set: \`test/\`
- Read-set: \`src/\`
- Forbidden-set: \`docs/archive/\`
- Exclusive resources: none

## Context Route

### Required

- \`AGENTS.md\`

### On demand

- none

### Discovery

- \`Completion gates\`

### Do not preload

- \`docs/archive/\`

## Decisions

- Decision: use exact commit evidence.
  - Evidence: mutable summaries cannot prove review state.

## Open Questions

- none

## Assumptions

- Assumption: Git commits are immutable review targets.
  - Evidence: the workflow requires head-SHA review.

## Documentation Impact

- Update: \`README.md\`
- Reason: completion semantics are public workflow behavior.

## Acceptance Criteria

1. Invalid completion claims are rejected.

## Test Map

| Criterion | Test | Expected red | Expected green |
|---|---|---|---|
| AC1 | completion evidence test | invalid claim passes | invalid claim blocks |

## Plan

1. Add the gate.
2. Run verification.

## Stop Conditions

Stop if evidence cannot be verified.

## Handoff Evidence

### Human Summary

- Response language: ${responseLanguage}
- Outcome summary: ${outcomeSummary}
- Changes made: Added deterministic completion-evidence validation to the grill gate.
- Verification summary: The focused test proves unsupported claims are rejected.
- Unverified or inferred: ${unverifiedOrInferred}
- Remaining work: Independent review or integration still follows the recorded state.
- Next gate: ${nextGate}

### Machine Evidence

- Work classification: ${workClassification}
- Initial evidence command: ${initialEvidenceCommand}
- Initial evidence result: ${initialEvidenceResult}
- Initial evidence: ${initialEvidence}
- Failure oracle: removing the expected evidence makes this audit fail
- Head commit: ${HEAD}
- Verification command: \`npm run verify\`
- Verification result: passed
- Verified commit: ${HEAD}
- Acceptance criteria: ${acceptanceEvidence}
- Scope command: \`git diff --name-only ${BASE}...${HEAD}\`
- Scope result: passed
- Review status: ${reviewStatus}
- Reviewer: ${reviewer}
- Reviewed commit: ${reviewedCommit}
- Review verification command: \`npm run verify\`
- Review verification result: ${reviewStatus === 'approved' ? 'passed' : 'pending'}
- Review verified commit: ${reviewStatus === 'approved' ? HEAD : 'pending'}
- Findings: ${findings}
- Residual risks: ${residualRisks}
- Merge authorized by: ${mergeAuthorizedBy}
- Merge status: ${mergeStatus}
- Merged commit: ${mergedCommit}
- Integrated verification command: ${integratedResult === 'passed' ? '`npm run verify`' : 'pending'}
- Integrated verification result: ${integratedResult}
- Integrated verified commit: ${integratedCommit}

## Definition of Done

- [ ] Acceptance criteria demonstrated.
`;
}

function codes(source) {
  return auditTaskPacketSource(source).map((finding) => finding.code);
}

test('review state rejects an approval claim', () => {
  assert.ok(
    codes(packet({ reviewStatus: 'approved' })).includes(
      'review_state_conflict',
    ),
  );
});

test('behavior changes require a failing pre-change oracle', () => {
  assert.ok(
    codes(
      packet({
        workClassification: 'behavior-change',
        initialEvidenceResult: 'passed-characterization',
        initialEvidence: 'all existing tests passed',
      }),
    ).includes('initial_evidence_result_invalid'),
  );
});

test('hardening may start from a passing characterization baseline', () => {
  assert.ok(
    !codes(packet()).includes('initial_evidence_result_invalid'),
  );
});

test('generic acceptance claims do not replace criterion-by-criterion evidence', () => {
  assert.ok(
    codes(
      packet({
        acceptanceEvidence: 'AC1: passed',
      }),
    ).includes('acceptance_evidence_incomplete'),
  );
});

test('done rejects missing merge and integrated verification evidence', () => {
  const findings = codes(
    packet({
      status: 'done',
      reviewStatus: 'approved',
      reviewer: 'independent-reviewer',
      reviewedCommit: HEAD,
      findings: 'none',
      residualRisks: 'none',
    }),
  );

  assert.ok(findings.includes('integration_evidence_incomplete'));
});

test('bare status words do not satisfy the human-readable handoff', () => {
  assert.ok(
    codes(packet({ outcomeSummary: 'done' })).includes(
      'human_handoff_incomplete',
    ),
  );
});

test('the handoff requires an explicit response language', () => {
  assert.ok(
    codes(packet({ responseLanguage: 'pending' })).includes(
      'human_handoff_language_invalid',
    ),
  );
});

test('regional BCP 47 response languages are accepted', () => {
  assert.ok(
    !codes(packet({ responseLanguage: 'es-AR' })).includes(
      'human_handoff_language_invalid',
    ),
  );
});

test('the handoff must disclose unverified or inferred claims', () => {
  assert.ok(
    codes(packet({ unverifiedOrInferred: 'pending' })).includes(
      'human_handoff_incomplete',
    ),
  );
});

test('malformed handoff fields are rejected before execution', () => {
  const malformed = packet().replace(
    '- Work classification: hardening\n- Initial evidence command:',
    '- Work classification: hardening- Initial evidence command:',
  );

  assert.ok(codes(malformed).includes('handoff_contract_missing'));
});
