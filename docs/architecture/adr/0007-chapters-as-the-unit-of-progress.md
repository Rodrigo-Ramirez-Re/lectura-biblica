---
status: accepted
date: 2026-11-24
---

# 0007 — Chapters as the unit of progress; derived values are computed

## Context

People change their plan: pace, order, the book of a month. History must survive every change, and correcting a past day must fix every number shown.

## Decision

- The only recorded fact is a **reading log**: on a day, N chapters of a book starting at a chapter.
- **Passes**, the book's current chapter, progress of a block, streaks, pace and estimates are pure functions of logs + plan + catalog, in `domain`. They are never persisted.
- The **plan** is configuration; **blocks** record which book was read when, once a block starts. Future blocks are projected from the plan.
- Any change to the stored shape bumps `schemaVersion` and ships with a migration and a test that imports a backup of the previous version.

## Consequences

- Metrics are recomputed on every screen. Volumes are tiny (a few thousand logs over a cycle), so this costs nothing.
- The domain is where the tests concentrate: schedule projection, passes and metrics are table-driven unit tests.
