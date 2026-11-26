---
id: LB-034
title: Coverage gate at 90 %
epic: E5
status: done
phase: 4
depends_on: [LB-002]
---

# LB-034 — Coverage gate at 90 %

## Story

**As the** owner
**I want** every project's unit tests to cover at least 90 % of its code, and CI to fail when they don't
**So that** TDD is measurable and no story can lower the safety net without anyone noticing

## Context

The working agreement is TDD, but nothing measures it. A coverage run on 2026-11-26 found every project at or above 90 % of statements, lines and functions except two: `shared-infrastructure-browser` (76 %) and `ui-components` (87 %). The `reader` app's report counted every library it imports, so its own figure was unknown. Branch coverage was lower everywhere (64–100 %). The owner asked for a minimum of 90 % coverage on 2026-11-26.

## Acceptance criteria

```gherkin
Feature: Coverage gate

  Scenario: Every project measured
    When I run npx nx test <project> (any project with unit tests, including the reader app and tools)
    Then coverage is measured and printed without extra flags

  Scenario: Own code only
    Then each report counts only the project's own source: no specs, stories, test helpers, barrels or other libraries

  Scenario: Threshold
    Given a project below 90 % of statements, lines or functions
    Then its test target fails, locally and in CI

  Scenario: Today's projects pass
    Then every existing project meets the threshold after this story's tests are added

  Scenario: Documented
    Then docs/conventions/testing.md states the threshold and how to read a report
```

## Out of scope

- Coverage of e2e runs.
- Uploading reports to an external service (the repo stays free of third-party services).

## Technical notes

- One shared `coverage` preset (`vitest.coverage.mts` at the root) imported by every `vitest.config.mts`/`vite.config.mts`: v8, enabled, `include: ['src/**/*.ts']`, excludes specs, stories, `index.ts`, `testing/`, `test-setup.ts`, and the thresholds.
- Reader app (`@angular/build:unit-test`): `coverage: true`, `coverageInclude: ['apps/reader/src/**/*.ts']`, `coverageExclude`, `coverageThresholds`.

## Open questions

- [x] Which measures at 90 % — _Adopted:_ statements, lines and functions at 90 %; branches at 70 % for now. Angular's control flow adds template branches that make branch coverage lag; a later story can raise them once the gap is closed. Never below today's figures.
- [x] Per project or global — _Adopted:_ per project, so a well-tested lib can't hide an untested one.

## Decisions

- Both open questions were adopted as recommended: statements, lines and functions at 90 % and branches at 70 %, per project. Angular's template control flow adds branches that make branch coverage lag; after this story every project is at 75 % or more, so a later story can raise the bar.
- Coverage is always on: the shared preset `vitest.coverage.ts` sets `enabled: true`, so `npx nx test <project>` measures it and fails below the thresholds, locally, on `git push` and in CI. No extra flag. The reader app does the same through `coverage`, `coverageInclude`, `coverageExclude` and `coverageThresholds` in its `project.json`.
- Each report counts every file of the project's `src`, tested or not. Before, the reader app only counted files some test loaded, so the app configuration, routes, providers, screen titles, focus on navigation and the not-found page had no tests at all.
- Tests added to reach the bar:
  - `shared-infrastructure-browser` (76 % → 100 %): current instant, file download through a temporary link, persistence errors.
  - `catalog-feature-books` (77 % → 100 %): book routes and their titles.
  - `ui-components` (87 % → 98 %): line chart pointer, touch, Home/End and resize.
  - `reader` (82 % → 99.6 %): every use case wired, every route loads its screen, tab titles, focus after navigating, not-found page.
- Refactor: the width tracking repeated in the line and column charts became `trackHostWidth()` in `ui-components`.
- `tools/quality/src/coverage.spec.ts` fails if a project's config stops using the preset or the thresholds change. CLAUDE.md, the testing conventions and the `lb-review` skill state the rule.

## Definition of done

- [x] All scenarios covered by tests
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Docs updated (testing conventions, README)
