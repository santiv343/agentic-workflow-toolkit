import { buildContextRoute, formatContextRoute } from './context.js';
import { pendingLearningPaths } from './learn.js';

export async function buildBrief(options) {
  const [route, learnings] = await Promise.all([
    buildContextRoute(options),
    pendingLearningPaths(options.cwd),
  ]);

  return {
    invariants: [
      'Load only the context route; discover before broad reading.',
      'Run grill before execution; unresolved decisions block ready.',
      'Stay inside declared ownership and stop on scope expansion.',
      'Treat role reports as claims; verify exact-SHA evidence before changing state.',
      'Workers cannot self-approve, reviewers cannot merge, and done requires integrated verification.',
      'Report a plain-language outcome before machine evidence; make remaining work and the next gate explicit.',
      'Answer in the language of the latest human request without unnecessary language mixing.',
      'Be direct and honest: separate observed, inferred, and unverified claims; do not flatter or agree automatically.',
      'Review documentation impact before done.',
      'After a human correction, record or explicitly reject a learning proposal.',
      'Run the configured verification gate before handoff.',
    ],
    learnings,
    route,
  };
}

export function formatBrief(brief) {
  const lines = [
    '# Re-anchor brief',
    '',
    ...brief.invariants.map((invariant) => `- ${invariant}`),
    '',
    `Pending learning proposals: ${brief.learnings.length}`,
  ];
  for (const learning of brief.learnings) {
    lines.push(`- ${learning}`);
  }
  lines.push('', formatContextRoute(brief.route).trim());
  return `${lines.join('\n')}\n`;
}
