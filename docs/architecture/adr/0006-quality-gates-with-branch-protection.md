---
status: accepted
date: 2026-11-24
---

# 0006 — Quality gates with branch protection

## Context

The repo is public, so GitHub Free offers branch protection and unlimited Actions minutes for standard runners.

## Decision

1. **commit-msg / pre-commit hooks** (husky): commitlint and lint-staged.
2. **pre-push hook**: `nx affected -t lint typecheck test` against `origin/development`.
3. **CI on every PR** into `development` and `main`, two jobs: `checks` (commitlint on title and commits, affected lint/typecheck/test/build/build-storybook/extract-i18n) and `e2e` (Chromium, Firefox and WebKit against the sub-path build, inside the Playwright image so no browser or system library is installed per run).
4. **Branch protection** on `development` and `main`: PR required, the `checks` and `e2e` jobs required and up to date, no force pushes, no deletions. No required human review (single maintainer).
5. **Who merges:** the agent squash-merges its own story PR into `development` once every check is green (`gh pr merge --squash --match-head-commit`). Only the owner merges `development` → `main`.

Repo settings: squash (PR title → commit title) and merge commit enabled, rebase disabled, head branches auto-deleted.

## Consequences

- A red check blocks the merge button; hooks are a fast local preview of the same gates.
- No budget pressure, so every engine runs on every PR (unlike the private-repo tiering used elsewhere).
