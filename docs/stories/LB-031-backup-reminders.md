---
id: LB-031
title: Backup reminders tuning
epic: E5
status: ready
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

- [ ] Where the preference lives — _Recommendation:_ in the journal's settings, so it travels with backups and restores on another device, instead of a per-device preference.
- [ ] How long "Ahora no" lasts — _Recommendation:_ 7 days; with a weekly reminder that is simply the next one.
- [ ] What counts as new — _Recommendation:_ a reading log dated after the day of the last backup; editing old logs or the plan alone doesn't trigger it, since logs are what can't be rebuilt.
- [ ] First reminder — _Recommendation:_ unchanged: never exported and logs on 7 days (unless "nunca").

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated (data model)
