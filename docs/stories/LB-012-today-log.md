---
id: LB-012
title: Today and one-tap logging
epic: E2
status: ready
phase: 1
depends_on: [LB-011]
---

# LB-012 — Today: what is due and one-tap logging

## Story

**As a** reader
**I want** to open the app, see what I have to read today and mark it with one tap
**So that** logging takes seconds and I see how far I've gone in this month's book

## Context

[[product/spec#Log reading|spec §3]], [[architecture/data-model|data model]] (ranges wrap, passes are computed).

## Acceptance criteria

```gherkin
Feature: Today

  Scenario: What is due
    Given the active block is Salmos, I have read 3 chapters in it and nothing today
    When I open Hoy
    Then I see "Salmos 4–6" as today's reading and the block's dates

  Scenario: One-chapter books
    Given the active block is Abdías and nothing is logged today
    Then today's reading is "Abdías 1, 3 veces"

  Scenario: Wrapping into a new pass
    Given the active block is Rut (4 chapters) and I have read 3 chapters in it
    Then today's reading is "Rut 4 y Rut 1–2"

  Scenario: One tap
    When I press "Ya leí"
    Then today's due chapters are logged with today's date, the screen says I'm done for today,
      and an "Deshacer" action is offered for a few seconds

  Scenario: A different amount
    When I change the amount with the stepper to 5 and log
    Then 5 chapters are logged from the next chapter

  Scenario: Read more after finishing
    Given I'm done for today
    Then I can still log extra chapters

  Scenario: A past day
    When I log for yesterday or another day of the active block up to today
    Then the log is saved with that date

  Scenario: Undo
    When I press "Deshacer"
    Then that log is deleted and today's reading is due again

  Scenario: Progress of the book
    Then I see completed passes in this block, the current pass as a progress bar ("capítulo 4 de 150"),
      and how many passes fit in the block at the plan's pace

  Scenario: Book page section
    When I open the active book's page
    Then a "Tu lectura" section shows total passes of the book across all blocks and the blocks where I read it
```

## Out of scope

Editing or deleting logs other than undo, notes, rest days (phase 2); pace and streak metrics (phase 3).

## Technical notes

- `reading/domain`: `ReadingLog` (factory: chaptersRead ≥ 1, startChapter within the book), `ChapterRange` (wrapping), `Passes` and `DueToday` pure functions.
- `reading/application`: `GetToday`, `LogReading`, `UndoReading`, `GetBookProgress`.
- `reading/feature-today`; book section registered on `BOOK_SECTIONS`.

## Open questions

- [ ] Missed days — _Recommendation:_ no debt carries over in phase 1: each day shows the plan's pace. Being behind is shown by the pace metric in phase 3.
- [ ] Past-day range — _Recommendation:_ a past-day log starts where the reading currently is (the next chapter), like any other log.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
