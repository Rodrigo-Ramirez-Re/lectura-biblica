---
id: LB-022
title: Plan templates
epic: E3
status: done
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

- [x] What applying keeps — _Adopted:_ the start date, the current block and the pause state; everything else comes from the template.

## Decisions

- Applying a template keeps the start date and the pause state and replaces the rest of the settings (name, pace, durations, order, exclusions, cycles). Stored blocks are untouched, so the current block stays and the change shows from the next projection, like any plan edit (LB-015).
- "Un libro al mes" is a built-in template built from the default plan: it can be applied and exported, never deleted, and it is not stored.
- "Guardar estas opciones como plantilla" saves the settings being edited, even unsaved ones, so a way of reading can be kept without applying it.
- A template file is `{ app, kind: 'plan-template', schemaVersion, template: { name, settings } }`, validated with the same rules as a backup plan; an imported template gets a new id. File name: `plantilla-<slug>.json`.
- A template keeps only the plan settings (`planSettings`): never the start date, the pause or unknown fields from an imported file.
- `JournalWriter` gained `saveTemplate` and `removeTemplate`.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Docs updated
