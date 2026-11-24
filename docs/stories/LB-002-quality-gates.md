---
id: LB-002
title: Quality gates
epic: E0
status: done
phase: 1
depends_on: [LB-001]
---

# LB-002 — Quality gates

## Story

**As a** maintainer
**I want** architecture, commit and test rules checked automatically on every commit, push and PR
**So that** nothing that breaks the conventions reaches `development` or `main`

## Context

[[architecture/adr/0006-quality-gates-with-branch-protection|ADR 0006]], [[architecture/overview|overview]], [[conventions/git-workflow|git workflow]].

## Acceptance criteria

```gherkin
Feature: Quality gates

  Scenario: Layer boundaries
    Given a domain lib that imports @angular/core, rxjs or idb
    When lint runs
    Then it fails naming the rule

  Scenario: Context boundaries
    Given the catalog context importing from the reading context
    When lint runs
    Then it fails; reading importing catalog passes

  Scenario: Commit messages
    Given a commit titled "update stuff" or carrying a Co-Authored-By line
    When I commit
    Then commitlint rejects it

  Scenario: Pre-push
    When I push
    Then affected lint, typecheck and test run against origin/development

  Scenario: CI on pull requests
    When a PR targets development or main
    Then CI runs commitlint on the title and commits, affected lint, typecheck, test and build,
      and e2e on Chromium, Firefox and WebKit

  Scenario: Branch protection
    Given a PR with a failing CI check
    Then GitHub does not allow merging it into development or main
```

## Out of scope

The Pages deploy workflow (LB-008); i18n and token lint rules (LB-003, LB-004).

## Technical notes

- Copy the rule specs from the sibling workspace (`tools/quality`): module boundaries and commitlint, adapted to this repo's tags and scopes.
- `scope:reader` may use any scope; `reading` may use `catalog`; `insights` may use `catalog` and `reading`; `study` may use `catalog`.
- Branch protection via `gh api`: require the CI check (strict), no force push, no deletion; no review count.

## Open questions

- None.

## Decisions

- e2e runs in its own job inside the official Playwright image (`mcr.microsoft.com/playwright`), pinned to the exact `@playwright/test` version (a quality spec keeps both equal): installing browsers with apt on the runner once took 29 minutes and timed out. Required checks: `checks` and `e2e`.
- Context rules are specified on the ESLint config itself until the context libs exist; layer rules are specified by linting probe files.
- `idb` is banned outside `infrastructure` libs with `no-restricted-imports` too: `bannedExternalImports` only sees installed packages.
- Domain libs also ban the browser globals `window`, `document`, `navigator`, `localStorage` and `indexedDB`.
- The required check is the CI job `checks`; branch protection is applied with `gh api` once the job has run on this PR.

## Definition of done

- [ ] All scenarios covered by tests (`tools/quality`)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Docs updated
