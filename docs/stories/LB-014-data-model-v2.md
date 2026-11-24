---
id: LB-014
title: Data model v2
epic: E3
status: done
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

- One version bump for all of phase 2: `paceByWeekday`, `pausedSince`, the units `weeks`, `days` and `passes`, the statuses `skipped`, `paused` and `replaced`, and `templates`.
- The backup migration `1 → 2` fills the new plan fields with null and adds an empty template list. A v1 plan read from the device database is completed the same way (`upgradePlan`).
- The IndexedDB upgrade runs per step from the version on the device (`oldVersion`); v2 only adds the `templates` store, and a test opens a real v1 database first.
- `validatePlan` now also requires at least one reading day, 7 whole numbers in a pace per weekday, and a known duration unit with a value of 1 or more. Templates in a backup are validated like plans.
- `planSettings(plan)` returns what a template keeps.
- Lint ignores the siblings of a rest destructure (`const { removed, ...rest } = record`), the idiom for dropping a field from an immutable record.

## Definition of done

- [ ] All scenarios covered by tests (unit/integration/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Docs updated (data model)
