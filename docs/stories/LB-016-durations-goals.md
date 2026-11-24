---
id: LB-016
title: Block duration and goals
epic: E3
status: ready
phase: 2
depends_on: [LB-015]
---

# LB-016 — How long to stay on each book, and a goal of passes

## Story

**As a** reader
**I want** to stay on each book a month, some weeks or days, or until I've read it a number of times, and to set a goal of passes
**So that** short books don't have to take a whole month, and I know when I've met my goal

## Context

[[product/spec#Configure how to read|spec §3]]: "Duración de cada libro: un mes por defecto, o un número de semanas o días, o hasta cumplir un número de pasadas. Meta por libro: pasadas deseadas o fecha objetivo." The target date is LB-018 (change the end of the current block).

## Acceptance criteria

```gherkin
Feature: Durations and goals

  Scenario: Months
    Given the duration is 2 months
    Then each upcoming block runs to the end of the month after its start month

  Scenario: Weeks or days
    Given the duration is 2 weeks (or 10 days)
    Then each upcoming block lasts 14 days (or 10), and grows until one pass fits at the pace

  Scenario: Until a number of passes
    Given the duration is "hasta leerlo 3 veces"
    Then each upcoming block lasts the reading days needed to read the book 3 times at the plan's pace
    And its goal is 3 passes

  Scenario: Goal of the current block
    When I set a goal of 5 passes for the current book on Hoy
    Then Hoy shows "Meta: 5 vueltas · llevas 2"

  Scenario: Goal met
    Given I reach the goal of the current block
    Then Hoy says the goal is met and offers to move on to the next book, without forcing it
```

## Out of scope

Changing the current block's dates (LB-018).

## Technical notes

- Domain: `blockEnd(start, book, plan)` for every unit; "one pass fits" applies to all of them.
- New blocks get `goalPasses = value` when the unit is passes, else null. `SetBlockGoal` updates the active block.

## Open questions

- [ ] Weeks and days growing — _Recommendation:_ yes, by whole weeks or single days, like months, so a block always allows one pass.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
