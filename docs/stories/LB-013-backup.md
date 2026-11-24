---
id: LB-013
title: Backup export and import
epic: E2
status: ready
phase: 1
depends_on: [LB-012]
---

# LB-013 — Backup export and import

## Story

**As a** reader
**I want** to save my data to a file and restore it
**So that** I don't lose my history if the browser clears it or I change phones

## Context

[[architecture/adr/0003-local-first-indexeddb|ADR 0003]], [[architecture/data-model|data model]].

## Acceptance criteria

```gherkin
Feature: Backup

  Scenario: Export
    When I press "Exportar respaldo" in Acerca de
    Then a file "lectura-biblica-respaldo-YYYY-MM-DD.json" downloads with schemaVersion, plan, blocks, logs, notes and settings,
      and the date of my last backup is updated

  Scenario: Import a valid backup
    Given a backup file
    When I choose it in "Importar respaldo"
    Then I see what it contains (plan, number of logs, first and last date) and a warning that it replaces my current data
    And after confirming, the data is replaced and Hoy reflects it

  Scenario: Invalid file
    Given a file that is not a backup of this app, or is corrupt
    When I import it
    Then I see a clear message of what is wrong and my current data is unchanged

  Scenario: Newer version
    Given a backup with a schemaVersion newer than the app's
    Then I'm told to update the app first and nothing is imported

  Scenario: Round trip
    Given I export, delete all data and import the file
    Then everything is as before

  Scenario: Reminder
    Given I have logs from at least 7 days and never exported, or my last export is over 30 days old
    Then Hoy shows a dismissible reminder to export a backup

  Scenario: Delete all data
    When I choose "Borrar mis datos" and confirm by typing BORRAR
    Then everything is deleted and the app returns to the first-run welcome
```

## Out of scope

Plan templates as files (phase 2); CSV export (phase 3).

## Technical notes

- `reading/domain`: `Backup` schema, validation and the migration chain (`v1` only now, with the hook for v2).
- `reading/application`: `ExportBackup`, `PreviewBackup`, `ImportBackup` (one IndexedDB transaction across stores), `DeleteAllData`.
- File download and file picker behind an infrastructure port.

## Open questions

- [ ] Validation library — _Recommendation:_ hand-written validators in the domain (no dependency in a framework-free lib; the schema is small).

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/integration/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
