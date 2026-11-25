---
id: LB-025
title: Passes per book
epic: E4
status: ready
phase: 3
depends_on: [LB-023]
---

# LB-025 — How many times have I read each book?

## Story

**As a** reader
**I want** to see how many times I've read each book, and how far into the current read I am
**So that** I see what my reading has added up to

## Context

[[product/spec#4. Insights|spec §4]]: full passes and fraction of the current one, per book; horizontal bars per book. Passes are chapters read ÷ chapters of the book ([[architecture/adr/0007-chapters-as-the-unit-of-progress|ADR 0007]]), across every cycle.

## Acceptance criteria

```gherkin
Feature: Passes per book

  Scenario: Books read
    Given I've read Abdías 1 chapter 31 times and Filemón 1 chapter 12 times
    Then Avance shows a bar per book: "Abdías: 31 vueltas", "Filemón: 12 vueltas"

  Scenario: A pass in progress
    Given I've read 60 of the 150 chapters of Salmos
    Then its bar reads "Salmos: 0 vueltas y 40 % de la siguiente"

  Scenario: Across cycles
    Given I read Abdías in two cycles
    Then its passes add up both

  Scenario: Order
    Then the books follow the plan's order, and only books with something read appear

  Scenario: Table
    Then "Ver como tabla" lists book, passes and chapters read
```

## Out of scope

Passes per block (shown in the block history, LB-020).

## Technical notes

- Domain: `passesByBook(journal, catalog)` reuses `passes()` from `reading-domain`.
- Chart kit: horizontal bar chart with a text label on every bar.

## Open questions

- [ ] Bars of very different lengths (31 vs 0.4) — _Recommendation:_ one scale from 0 to the most-read book; the label carries the exact value, so a short bar is still readable.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
