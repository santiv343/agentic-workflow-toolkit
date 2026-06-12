# Contributing

Changes must remain generic across languages, stacks, products, and repository sizes.

1. Open or identify the problem and observable outcome.
2. Add a failing test first.
3. Implement the smallest portable change.
4. Run `npm run verify`.
5. Update documentation and `CHANGELOG.md` when behavior changes.
6. Keep project-specific policy out of universal defaults.
7. Keep cross-project methodology in the Knowledge Hub, not in this package.

Inference must be evidence-backed and unambiguous. Product intent, permissions,
ownership, risk tolerance, and removal of human gates are never inferred.

## Release Checklist

1. Run `npm run verify`.
2. Run `npm audit --omit=dev`.
3. Scan package contents for secrets, personal paths, and project-specific names.
4. Test `init`, repeated `init`, `--dry-run`, `check`, `context`, `grill`, and
   `doctor` in a temporary repository.
5. Update `CHANGELOG.md` and the semantic version.
6. Publish only from a clean tagged commit.
