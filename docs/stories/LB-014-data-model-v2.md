---
id: LB-014
title: Data model v2
epic: E3
status: ready
phase: 2
depends_on: [LB-013]
---

# LB-014 — Data model v2 for a flexible plan

## Story

**As a** reader who already has data
**I want** the app to understand everything phase 2 adds without losing anything I recorded
**So that** I keep reading on the same device and can restore my older backups

## Context

Phase 2 needs new fields: a pace per weekday, a paused plan, block durations in weeks, days or passes, blocks that were skipped, paused or replaced, and saved plan templates. [[architecture/adr/0007-chapters-as-the-unit-of-progress|ADR 0007]]: a change of the stored shape bumps `schemaVersion` and ships with a migration and a test that imports a previous-version backup. All v2 changes land here at once so the version moves only once.

## Acceptance criteria

```gherkin
Feature: Data model v2

  Scenario: Existing data on the device
    Given the device has a v1 database with a plan, blocks and logs
    When the new version opens
    Then everything is still there and the new fields have their defaults

  Scenario: Importing a v1 backup
    Given a backup exported by the v1 app
    When I import it
    Then it is migrated to v2 and imported with the same plan, blocks and logs

  Scenario: Exporting
    When I export a backup
    Then it carries schemaVersion 2 and the saved plan templates

  Scenario: New block statuses
    Then a block can be active, done, skipped, paused or replaced, and a backup with any of them is valid
```

## Out of scope

Any screen that uses the new fields (LB-015 to LB-022).

## Technical notes

- `PlanRecord`: `paceByWeekday: number[] | null` (7 entries, Sunday first; null = `chaptersPerDay` every day except `restDays`); `pausedSince: IsoDate | null`; `defaultBlock.unit: 'month' | 'weeks' | 'days' | 'passes'`.
- `BlockStatus`: `active | done | skipped | paused | replaced`.
- `Journal.templates: PlanTemplateRecord[]` — `{ id, name, settings }`, where settings are the plan without `startDate` and `pausedSince`.
- IndexedDB v2 adds a `templates` store; the upgrade keeps every v1 store.
- Migration `1 → 2` in the backup parser; the same function upgrades a v1 plan read from the database.

## Open questions

- None.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/integration/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Docs updated (data model)
