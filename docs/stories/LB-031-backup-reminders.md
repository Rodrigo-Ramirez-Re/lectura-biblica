---
id: LB-031
title: Backup reminders tuning
epic: E5
status: done
phase: 4
depends_on: [LB-013]
---

# LB-031 — Backup reminders tuning

## Story

**As a** reader
**I want** the backup reminder to come as often as I choose, only when there is something new to save, and to stay away when I say "Ahora no"
**So that** it protects my data without becoming a nuisance

## Context

LB-013 added a reminder on Hoy: logs on 7 days and no export ever, or the last export over 30 days old. Today it has three problems:

- "Ahora no" lasts only until the app is opened again, so an installed app asks every day.
- It asks even when nothing was logged since the last backup.
- The 30 days can't be changed.

[[product/spec#5. Decisions already taken|spec §5]]: "reminds the person to back up now and then".

## Acceptance criteria

```gherkin
Feature: Backup reminders

  Scenario: Choose how often
    When I choose "Recordarme hacer un respaldo: cada semana" in the backup panel
    Then the reminder comes 7 days after my last backup instead of 30
    And the options are cada semana, cada 2 semanas, cada mes (default), cada 3 meses and nunca

  Scenario: Never
    Given I chose "nunca"
    Then no reminder appears, and the backup panel says reminders are off

  Scenario: Nothing new
    Given my last backup is 40 days old and I haven't logged anything since its day
    Then no reminder appears

  Scenario: Ahora no
    When I tap "Ahora no" on the reminder
    Then it does not come back for 7 days, even if I close and reopen the app

  Scenario: It says when
    Then the reminder says the date of my last backup, or that I have never made one

  Scenario: Old data
    Given a backup or device database from before this change
    When it is loaded
    Then reminders work with the monthly default and nothing else changes
```

## Out of scope

- Notifications outside the app (push, e-mail) or automatic backups to a folder.

## Technical notes

- Data model change (CLAUDE.md rule 5): `settings` gains `backupEveryDays: 7 | 14 | 30 | 90 | null` (null = never) and `backupReminderPostponedUntil: IsoDate | null`; `schemaVersion` 3 with a migration step adding the defaults (30, null) to backups and to the stored settings.
- `isBackupDue(journal, today)` adds the rules; new use cases `SetBackupReminder` and `PostponeBackupReminder`.

## Open questions

- [x] Where the preference lives — _Adopted:_ in the journal's settings, so it travels with backups and restores on another device, instead of a per-device preference.
- [x] How long "Ahora no" lasts — _Adopted:_ 7 days; with a weekly reminder that is simply the next one.
- [x] What counts as new — _Adopted:_ a reading log dated after the day of the last backup; editing old logs or the plan alone doesn't trigger it, since logs are what can't be rebuilt.
- [x] First reminder — _Adopted:_ unchanged: never exported and logs on 7 days (unless "nunca").

## Decisions

- All four open questions were adopted as recommended:
  - The preference lives in the journal's `settings`, so it travels with backups.
  - "Ahora no" lasts 7 days.
  - "Something new" means a reading log dated after the local day of the last backup.
  - The first reminder is unchanged: logs on 7 days and no export ever, unless "Nunca".
- Data model v3:
  - `settings.backupEveryDays` (7, 14, 30 or 90, or `null` for never) and `settings.backupReminderPostponedUntil` (the first day the reminder may come back).
  - The backup migration 2 → 3 fills 30 and `null`.
  - The device database needs no new object store: settings stored by version 2 are completed when read (`upgradeSettings`), like plans in v2.
  - Imports of v3 files reject other intervals and postponements that are not a day.
- An interval keeps LB-013's meaning of "older than": with "cada semana" a backup made on the 5th is due from the 13th. That matches "over 30 days" for the monthly default.
- The frequency is a select in the backup panel ("Recordarme hacer un respaldo"). With "Nunca" the panel says reminders are off and you decide when to export.
- The reminder on Hoy now says when the last backup was ("Tu último respaldo fue el 3 de octubre de 2026.") or that there was none.
- "Ahora no" and a new frequency are saved before the screen changes, so closing the app right after can't lose them.
- `BackupReminderState` (the session-only dismissal) was removed: the postponement is stored.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated (data model)
