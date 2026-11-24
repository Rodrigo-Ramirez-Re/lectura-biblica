---
id: LB-019
title: Cycles
epic: E3
status: ready
phase: 2
depends_on: [LB-018]
---

# LB-019 — Cycles: repeat the journey, a number of cycles, restart one

## Story

**As a** reader
**I want** the journey to start over when I finish it, as many times as I choose, and to restart it when I want
**So that** I can keep reading the whole Bible again without losing my history

## Context

[[product/spec#2. Starting point: the "Un libro al mes" rule|spec §2]]: "recorrer los 66 libros en un ciclo… y poder repetir el ciclo todas las veces que se quiera."

## Acceptance criteria

```gherkin
Feature: Cycles

  Scenario: The next cycle starts on its own
    Given the last block of cycle 1 ended yesterday and there is no limit of cycles
    When I open the app
    Then cycle 2 starts today with the first book of the order

  Scenario: A number of cycles
    Given the plan is set to 2 cycles and cycle 2 has ended
    Then Hoy says the journey is complete and Plan shows both cycles finished

  Scenario: Restart the cycle
    When I choose "Reiniciar el ciclo" in the editor and confirm
    Then a new cycle starts today with the first book, and every previous block and log stays in the history

  Scenario: Plan shows the cycle
    Then Plan says "Ciclo 2 de 3" (or "Ciclo 2") and lists the current cycle's blocks
```

## Out of scope

Per-cycle insights (phase 3).

## Technical notes

- Projection works on the current cycle: the highest recorded cycle, its read books, and the next cycle once it is complete and the limit allows it.
- `RestartCycle` closes the active block (as in LB-018) and records the first book of cycle + 1.

## Open questions

- [ ] Automatic next cycle — _Recommendation:_ yes, unless the plan's number of cycles is reached.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
