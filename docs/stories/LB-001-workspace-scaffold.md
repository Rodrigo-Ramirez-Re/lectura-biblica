---
id: LB-001
title: Workspace scaffold
epic: E0
status: ready
phase: 1
depends_on: []
---

# LB-001 — Workspace scaffold

## Story

**As a** developer
**I want** an Nx workspace with the reader app and the testing toolchain ready
**So that** every following story starts from a consistent, tested foundation

## Context

[[architecture/adr/0001-monorepo-nx|ADR 0001]], [[architecture/adr/0002-static-pwa-on-github-pages|ADR 0002]], [[architecture/overview|overview]].

## Acceptance criteria

```gherkin
Feature: Workspace scaffold

  Scenario: App runs locally
    Given a fresh clone and `npm install`
    When I run `npx nx serve reader`
    Then the app loads in the browser without console errors

  Scenario: Tests run
    When I run `npx nx run-many -t test`
    Then the Vitest suites of every project pass

  Scenario: E2E runs
    When I run `npx nx e2e reader-e2e`
    Then a Playwright smoke test against the home route passes

  Scenario: Tailwind works
    Given a Tailwind utility class in a template
    When the app is served
    Then the style is applied

  Scenario: Type-check runs
    When I run `npx nx run-many -t typecheck`
    Then every project type-checks its sources and specs
```

## Out of scope

Boundary rules, hooks and CI (LB-002), tokens (LB-003), i18n (LB-004), Storybook (LB-005), service worker (LB-007), sub-path build (LB-008).

## Technical notes

- npm, Angular + Nx versions aligned with the owner's other Nx workspace (Angular 22.2, Nx 24.0); Node 24 pinned in `.nvmrc` and `engines`.
- Angular: standalone, zoneless, strict, CSR (no SSR).
- Vitest as unit runner, Playwright for `reader-e2e`.
- Empty lib skeleton with tags: `shared-kernel` (type:domain, scope:shared).

## Open questions

- [x] App directory: `apps/reader` (+ `apps/reader-e2e`). Import prefix `@lectura/*`.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, tests, build green
- [ ] `lb-review` passed
- [ ] Docs updated (README commands)
