---
status: accepted
date: 2026-11-24
---

# 0001 — Nx workspace with one Angular app

## Context

One PWA today, but its rules (plan, schedule, passes, metrics) are the valuable part and must stay framework-free and testable. Phase 5 adds a study module that must plug in without rewriting the tracker. Clean Architecture must be enforceable, not just documented.

## Decision

One Nx workspace (npm, integrated mode: libs resolved through `tsconfig.base.json` path aliases `@lectura/*`) with `apps/reader`, `apps/reader-e2e` and libs per bounded context and layer. Layer and scope rules enforced by `@nx/enforce-module-boundaries`. Same toolchain and conventions as the owner's other Nx project, so the way of working carries over.

## Consequences

- Boundary violations fail lint, so architecture is checked in CI.
- New modules (insights, study, sync) are new libs, wired in the app.
- More configuration than a single Angular CLI project.

## Rejected

- **Plain HTML/CSS/JS without a build step** — simplest to publish, but no types, no enforced layers and a weaker test setup for the domain rules.
- **Single Angular CLI project** — layers would be folders only; nothing would stop a component from reaching IndexedDB.
