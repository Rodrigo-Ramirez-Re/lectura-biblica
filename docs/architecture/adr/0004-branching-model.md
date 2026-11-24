---
status: accepted
date: 2026-11-24
---

# 0004 — Branching model

## Decision

- `main`: production. Updated only by PR from `development`. Each push deploys to GitHub Pages.
- `development`: default branch, integration. Updated only by PR from work branches.
- Work branches from `development`: `<type>/LB-<id>-<kebab-name>`.
- Merge strategy: **squash** into `development` (one Conventional Commit per story), **merge commit** from `development` into `main` (keeps release boundaries visible).
- Releases are tagged `reader@x.y.z` after merging into `main`.

## Revisit when

A preview environment is needed → deploy `development` to a second Pages site or an artifact preview first.
