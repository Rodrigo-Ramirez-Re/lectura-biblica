---
id: LB-022
title: Plan templates
epic: E3
status: ready
phase: 2
depends_on: [LB-019]
---

# LB-022 — Plan templates: save, apply, export and import

## Story

**As a** reader
**I want** to save my way of reading as a template, apply another one, and share templates as files
**So that** I can try a different plan and come back, or pass my plan to someone else

## Context

[[product/spec#Configure how to read|spec §3]]: "Guardar, exportar e importar planes como plantillas reutilizables." A template holds how one reads (pace, durations, order, cycles), never the history.

## Acceptance criteria

```gherkin
Feature: Plan templates

  Scenario: Built-in template
    Then the editor offers "Un libro al mes" as a template

  Scenario: Save the current plan as a template
    When I save my plan as "Mi plan de 2027"
    Then it appears in the template list

  Scenario: Apply a template
    When I apply a template and confirm
    Then the plan takes its settings from today on, and my history stays as it was

  Scenario: Export and import a template
    When I export a template
    Then a file "plantilla-<nombre>.json" downloads
    When I import that file on another device
    Then it appears in the template list there

  Scenario: Invalid template file
    When I import a file that is not a template of this app
    Then I'm told why and nothing changes

  Scenario: Delete a template
    When I delete a saved template after confirming
    Then it disappears from the list; the built-in one cannot be deleted
```

## Out of scope

A shared online gallery of templates.

## Technical notes

- Templates live in the `templates` store (LB-014) and in backups.
- Template file: `{ app: 'lectura-biblica', kind: 'plan-template', schemaVersion, template }`, validated like a backup.

## Open questions

- [ ] What applying keeps — _Recommendation:_ the start date, the current block and the pause state; everything else comes from the template.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
