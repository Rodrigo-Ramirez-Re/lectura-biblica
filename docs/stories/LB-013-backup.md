---
id: LB-013
title: Backup export and import
epic: E2
status: done
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

- [x] Validation library — _Recommendation (adopted):_ hand-written validators in the domain (no dependency in a framework-free lib; the schema is small).

## Decisions

- Backups are validated by hand-written checks in `reading-domain` (no dependency in a framework-free lib). Errors: not JSON, not a backup of this app, a newer `schemaVersion` (asks to update the app), or invalid (damaged or incomplete). A rejected file changes nothing.
- The migration chain lives next to the parser (`migrations[version]`), empty at v1; the next change of the stored shape adds a step and a test importing a v1 file.
- Import replaces everything in one IndexedDB transaction after a preview (plan, number of logs, first and last date) and an explicit "Reemplazar mis datos".
- `Clock` gained `now()` for the export instant; files are saved through a `FileSaver` port (`BrowserFileSaver` downloads through a temporary link, which works offline and in installed apps).
- Reminder on Hoy: logs on 7 different days and no export ever, or the last export over 30 days old. "Ahora no" hides it until the app is opened again; "Ir a Respaldo" opens Acerca de, where the panel lives.
- "Borrar mis datos" sits collapsed in the panel and needs the word BORRAR; afterwards the app returns to the first-run welcome.
- Review fix: imports must leave the app loadable. Days must be real calendar days, instants must parse, blocks must not end before they start, and the plan must pass `validatePlan` (known, unique books, at least one not excluded). Blocks and notes must be of known books, and every log must belong to a block in the file. The 30-day reminder counts from the local day of the last export (an evening export in Mexico is already the next day in UTC), and "Ahora no" lasts across screens until the app is opened again.

## Definition of done

- [ ] All scenarios covered by tests (unit/integration/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
