---
id: LB-004
title: i18n baseline
epic: E0
status: ready
phase: 1
depends_on: [LB-001]
---

# LB-004 — i18n baseline (es-MX)

## Story

**As a** Spanish-speaking reader
**I want** every text, date and number in Mexican Spanish
**So that** the app reads naturally

## Context

[[architecture/adr/0005-i18n|ADR 0005]].

## Acceptance criteria

```gherkin
Feature: i18n baseline

  Scenario: Unmarked text fails lint
    Given a template with user-facing text without an i18n marker and custom ID
    When lint runs
    Then it fails

  Scenario: Spanish dates
    When a date is rendered through the date pipe
    Then it reads in es-MX ("martes, 3 de diciembre")

  Scenario: Extraction
    When I run `npx nx extract-i18n reader`
    Then the source catalogue is generated with every marked message

  Scenario: Document language
    Then the host page declares lang="es-MX"
```

## Out of scope

A second language.

## Technical notes

- `libs/shared/util-i18n` (type:util) with `provideSpanishLocale()`.
- Template i18n lint rule adapted from the sibling workspace.

## Open questions

- None.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Docs updated
