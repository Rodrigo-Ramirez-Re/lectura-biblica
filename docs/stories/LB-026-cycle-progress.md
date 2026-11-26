---
id: LB-026
title: Cycle progress and when it ends
epic: E4
status: done
phase: 3
depends_on: [LB-023]
---

# LB-026 — How far into the cycle am I, and when will I finish?

## Story

**As a** reader
**I want** to see how many books of the cycle I've finished and when the cycle will end at my real pace
**So that** I know where I stand in the whole journey

## Context

[[product/spec#4. Insights|spec §4]]: books finished out of 66 and months left (cycle progress bar); estimated end of cycle at the last 30 days' pace (text with the date and the assumption). Plans may leave books out (LB-017), so "out of 66" is out of the books in the plan.

## Acceptance criteria

```gherkin
Feature: Cycle progress

  Scenario: Books finished
    Given the plan has 66 books and I've finished 12 of them in this cycle
    Then Avance shows a bar "12 de 66 libros" and how many months the plan has left

  Scenario: Books left out
    Given the plan leaves 6 books out
    Then the bar counts out of 60

  Scenario: Finish at my pace
    Given I read 2 chapters a day on average over the last 30 days and the plan expects 3
    Then Avance says when the cycle would end at 2 a day, and says it assumes the last 30 days' pace

  Scenario: Not enough data
    Given my plan started less than 7 days ago, or I read nothing in the last 30 days
    Then the estimate says it needs more days of reading

  Scenario: Cycle goal reached
    Given the plan's number of cycles is reached
    Then the section says the journey is complete
```

## Out of scope

Changing the plan from the estimate.

## Technical notes

- Domain: `cycleProgress(journal, catalog, today)` and `finishEstimate(journal, catalog, today)`. The estimate projects the rest of the cycle with `projectSchedule` using the measured pace instead of the plan's, so durations by month, weeks, days or passes all keep their rules.
- Chart kit: the existing `lb-progress` bar.

## Open questions

- [x] What counts as finished — _Adopted:_ blocks of the current cycle that are done or skipped (skipped counts as read in its cycle, LB-018); the active book isn't finished yet.
- [x] Months left — _Adopted:_ calendar months from today to the end of the cycle's last block in the plan's schedule.
- [x] Pace when reading less than the plan makes blocks grow — _Adopted:_ accepted: a block still allows one pass at the measured pace, so the date says honestly how long it would take.

## Decisions

- The three open questions were adopted as recommended: finished books are the done or skipped blocks of the current cycle; months left are the calendar months from this one to the end of the cycle in the plan's schedule, this month included ("faltan 67 meses, contando este"); the estimate keeps the plan's rules, so a slower pace makes blocks grow and pushes the end later.
- The total counts the books of the plan's order minus the books left out.
- The estimate averages the chapters read per calendar day (rest days included) over the last 30 days, or since the plan started when it is younger, and says which ("A tu ritmo de los últimos 30 días…" / "A tu ritmo desde que empezaste…"). It needs a week of plan ("Con una semana de lectura podré estimar…") and at least one chapter every five days lately ("No hay suficiente lectura…"); below that a projection would mean nothing and would run for decades.
- While the plan is paused there is no end date: Avance says it will move when reading resumes. Once the plan's number of cycles is read, the section says the journey is complete.
- The bar is the existing `lb-progress`, labelled "Libros terminados del ciclo N".

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated
