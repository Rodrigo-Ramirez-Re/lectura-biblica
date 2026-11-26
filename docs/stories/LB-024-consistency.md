---
id: LB-024
title: Consistency — streaks and the month's calendar
epic: E4
status: done
phase: 3
depends_on: [LB-023]
---

# LB-024 — How consistent am I? Streaks and the month's calendar

## Story

**As a** reader
**I want** to see my current and best streak and which days I read this month
**So that** I can keep the habit and see the gaps

## Context

[[product/spec#4. Insights|spec §4]]: current and best streak; days read out of days in the month; calendar heatmap.

## Acceptance criteria

```gherkin
Feature: Consistency

  Scenario: Streaks
    Given I read every reading day from 1 to 8 December, missed the 9th and read the 10th and 11th
    Then Avance shows "Racha actual: 2 días" and "Mejor racha: 8 días"

  Scenario: Today not read yet
    Given I read yesterday but not yet today
    Then the current streak still counts up to yesterday

  Scenario: Rest days
    Given Sunday is a rest day
    Then not reading on Sunday doesn't break the streak, and reading on it adds one day

  Scenario: Days read this month
    Given 11 days of December have passed and I read on 9 of them
    Then Avance shows "9 de 11 días con lectura"

  Scenario: Calendar
    Then a calendar of the month marks each day read, missed, rest or still to come, by shade and by a symbol
    And tapping a day shows its chapters
    And "Ver como tabla" lists the days

  Scenario: Nothing read yet
    Given I haven't logged any reading
    Then the section says the streaks start with the first day read
```

## Out of scope

Calendars of previous months (the monthly history is LB-028).

## Technical notes

- Domain: `streaks(journal, today)` and `monthDays(journal, today)`, table-driven tests.
- Chart kit: a calendar heatmap component (7 columns, Monday first like es-MX calendars).

## Open questions

- [x] Which days count for a streak — _Adopted:_ days the plan expects reading (same rule as LB-023); a day with any chapter logged counts, even if fewer than expected; days that expect nothing are neutral.
- [x] "Days in the month" — _Adopted:_ days of the month so far, today included, that expect reading.

## Decisions

- Both open questions were adopted as recommended: a day with any chapter counts for a streak, a missed day that expected reading breaks it, and days that expect nothing (rest, pause, before the plan) leave it as it is; today only breaks it once it's over.
- "Días con lectura": the days so far with any chapter, out of the days so far that expected reading plus the rest days read on, so the first number never exceeds the second.
- `lb-calendar-heatmap` (ui-components): Monday first; each day is a button named with its whole detail ("3 de diciembre: 5 capítulos"), with one day in the tab order and the arrow keys moving by day or week (roving tab index). The detail of the day tapped shows under the calendar. Each state has its own symbol (✓ read, ✗ missed, ○ today, — nothing expected), so the shade is never the only cue.
- The shade is the share of the day's pace that was read: under half, under the pace, up to twice, more; a rest day read on shows as a full day.
- Days still to come show what the plan will expect (nothing while paused); the table lists the days so far.
- With nothing read yet the section says "Tus rachas empiezan con tu primer día de lectura." instead of drawing an empty calendar.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated
