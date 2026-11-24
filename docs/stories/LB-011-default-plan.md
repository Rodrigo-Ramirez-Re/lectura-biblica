---
id: LB-011
title: Default plan and schedule
epic: E1
status: done
phase: 1
depends_on: [LB-009, LB-010]
---

# LB-011 — Start with the default plan; see the schedule

## Story

**As a** new reader
**I want** to start reading with a ready-made plan in one step and see which book comes each month
**So that** I can begin today and know where the journey goes

## Context

The default template is the owner's "Un libro al mes" ([[product/spec#2. Starting point the "Un libro al mes" rule|spec §2]]). It is data, not code: phase 2 lets each person build their own plan from it. [[architecture/adr/0007-chapters-as-the-unit-of-progress|ADR 0007]].

## Acceptance criteria

```gherkin
Feature: Default plan

  Scenario: First run
    Given I have no plan
    When I open Hoy
    Then I see a welcome that explains the plan "Un libro al mes": 3 chapters a day, one book per month,
      shortest to longest, and a button to start

  Scenario: Choose the start
    When I start
    Then I can begin today or on the 1st of next month, and the plan is saved with that start date

  Scenario: Default order
    Then the plan goes through the 66 books from fewest to most chapters, ties in canonical order:
      Abdías, Filemón, 2 Juan, 3 Juan, Judas, Hageo, …, Isaías, Salmos

  Scenario: Monthly blocks
    Given the plan starts on 2026-12-01
    Then the first block is Abdías from 2026-12-01 to 2026-12-31 and the second is Filemón in January 2027

  Scenario: A partial first month
    Given the plan starts on 2026-11-24
    Then the first block runs from 2026-11-24 to 2026-11-30

  Scenario: A book that does not fit in a month
    Given Salmos (150 chapters) at 3 chapters a day needs 50 days
    Then its block lasts two calendar months
    And the full cycle of the default plan lasts 67 months

  Scenario: Blocks start on their own
    Given the active block ended yesterday
    When I open the app
    Then the next block of the order is recorded as active from its start date

  Scenario: Schedule
    When I open Plan
    Then I see the plan's settings, the cycle's blocks with book and dates (past, current, upcoming),
      the current one highlighted, and the total length of the cycle
```

## Out of scope

Editing the plan, choosing another book for a month, pausing, skipping, cycles beyond the first (phase 2).

## Technical notes

- `reading/domain`: `ReadingPlan` (factory validates pace ≥ 1, order covers the catalog without duplicates), `Block`, `ScheduleProjector` (pure: plan + recorded blocks + catalog → recorded and projected blocks), `MonthlyDuration` rule.
- `reading/application`: `StartDefaultPlan`, `GetSchedule`, `AdvanceBlocks` (records every block whose start ≤ today; runs on app start).
- `reading/feature-plan`: welcome + Plan screen.
- `Clock` port in `shared/kernel`.

## Open questions

- [x] Size criterion — owner's personal preference; the app must let people build their own (owner, 2026-11-24). Default template: chapter count, ties canonical.
- [x] Why 67 months — _Recommendation (adopted as the rule above):_ a monthly block grows by whole months until one full pass fits at the plan's pace; only Salmos needs it at 3 a day, giving 66 + 1.
- [x] Default start — _Recommendation (adopted):_ "today" preselected; the 1st of next month as the alternative.
- [x] Missed blocks (app not opened for a whole month) — _Recommendation (adopted):_ they are still recorded with their book and dates; the history shows them with 0 chapters. Pausing comes in phase 2.

## Decisions

- The 67 months are a rule, not a constant: a monthly block grows by whole months until one pass fits at the plan's pace. A domain test asserts the default cycle spans 67 calendar months for 66 books.
- `LocalDate` (shared kernel) does day arithmetic on UTC day numbers, so no time zone or daylight-saving change shifts a day; `Clock` and `IdGenerator` are ports with device adapters (`SystemClock`, `RandomIdGenerator`) and test doubles (`FixedClock`, `SequentialIds`, `InMemoryJournal`) exported from `/testing` entry points.
- Blocks are recorded when they start (`advanceBlocks`); upcoming ones are projected (`projectSchedule`) from the day after the last recorded block, so editing the plan only changes the projection.
- Hoy and Plan advance the blocks before reading the schedule. An async app initializer was tried first; Playwright's Firefox crashed during axe scans whenever start-up awaited anything, and the initializer was not needed.
- Found while testing in Firefox (fixes to LB-010 code): `navigator.storage.persist()` is no longer awaited before writing — Firefox answers only after the person replies to its prompt, which blocked saving; and the IndexedDB adapter opens and closes a connection per operation, so an idle connection never blocks a future schema upgrade from another tab.
- axe scans run in Chromium and WebKit; in Firefox the test records an `axe` annotation instead (the scan crashes Playwright's Firefox, not the page).
- Plan shows the plan summary ("66 libros en 67 meses: del … al …") and every block with dates and state (Terminado, Ahora with `aria-current="step"`, Próximo).
- Review fix: block ids are deterministic (`cycle:bookId:start`), so two tabs, or Hoy and Plan opening together, record a starting block once instead of twice. `StartDefaultPlan` and `AdvanceBlocks` no longer need an id generator. An empty schedule (no book left) yields no view instead of failing, and Plan shows an error if the data cannot be read.

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated (ubiquitous language)
