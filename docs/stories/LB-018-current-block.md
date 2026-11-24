---
id: LB-018
title: Control the current block
epic: E3
status: done
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

- [x] Which books can be chosen — _Recommendation (adopted):_ any included book not yet read or started in the current cycle.

## Decisions

- Every change takes effect today, or tomorrow when today is already logged, so today's reading stays with the book it was read in. The current block ends the day before with a final status; a block that would end before it started (started today, nothing read) is removed.
- Changing the book closes the current block as `replaced` (its book goes back to the queue in its place) and records the chosen book with a full block of the plan's duration. Choices are the included books not read or running in the cycle.
- Skipping closes it as `skipped` (it does not come back in the cycle); "Pasar al siguiente libro", offered once the goal is met, closes it as `done`. The next book of the order is recorded when it starts.
- Pausing closes it as `paused` and sets `plan.pausedSince`; nothing new is recorded while paused. Resuming records the paused book again from that day with a full block.
- "Terminar este libro el" moves the end of the current block to any day from today on; the projection follows.
- The actions live in a collapsed "Cambiar este libro" on Hoy; Plan labels blocks Saltado, Cambiado and En pausa, and entries are keyed by book and start because a book can appear twice.
- The projection now covers the current cycle only and starts after the last recorded block of any status; the active block closes as `done` when its end has passed.
- The plan feature's unit tests get 20 s: the editor lists 66 books and role queries over it take seconds in jsdom.

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
