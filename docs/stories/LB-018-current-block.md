---
id: LB-018
title: Control the current block
epic: E3
status: ready
phase: 2
depends_on: [LB-016, LB-017]
---

# LB-018 — The current book: change it, skip it, pause, resume, end it on another day

## Story

**As a** reader
**I want** to switch to another book mid-month, skip a book, pause the plan and resume it, or move the end of the current book
**So that** life and my interests can change the plan without breaking it

## Context

[[product/spec#Configure how to read|spec §3]]: "Elegir libremente el libro de cada mes, cambiarlo a mitad de mes, pausar o saltar." and the goal by target date. The history of what was read is never lost.

## Acceptance criteria

```gherkin
Feature: Current block

  Scenario: Change the book
    When I choose "Cambiar de libro" on Hoy and pick Rut
    Then Rut starts today with a block of the plan's duration, the previous book returns to the queue in its place,
      and what I read of it stays in its history

  Scenario: Skip the book
    When I choose "Saltar este libro"
    Then the next book of the order starts today and the skipped one does not come back in this cycle

  Scenario: Pause and resume
    When I choose "Pausar el plan"
    Then Hoy says the plan is paused since today, expects nothing and no new block starts
    When I choose "Reanudar" days later
    Then the paused book starts again that day with a full block

  Scenario: Move the end of the current book
    When I set the end of the current block to another day from today on
    Then the block ends that day and the following blocks move accordingly

  Scenario: Today already logged
    Given I already logged chapters today
    When I change, skip or pause
    Then the change starts tomorrow and today's reading stays with the current book
```

## Out of scope

Choosing books of future months (that is the order, LB-017).

## Technical notes

- Domain: `truncateActiveBlock`, statuses `replaced`, `skipped`, `paused`; projection treats done, skipped and active books as read in the cycle, and replaced or paused ones as still to come.
- `plan.pausedSince` stops `advanceBlocks`; resuming records the paused book's new block.
- `JournalWriter.removeBlock` for a block that would end before it started.

## Open questions

- [ ] Which books can be chosen — _Recommendation:_ any included book not yet read or started in the current cycle.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
