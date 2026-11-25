---
id: LB-028
title: Monthly history and CSV export
epic: E4
status: ready
phase: 3
depends_on: [LB-023]
---

# LB-028 — What happened each month? History and CSV export

## Story

**As a** reader
**I want** a table of every month I've read and a CSV file of my whole history
**So that** I can look back, and use my data in a spreadsheet

## Context

[[product/spec#4. Insights|spec §4]]: book, passes, chapters, goal met or not, notes; a history table, one row per month; export the history to CSV.

## Acceptance criteria

```gherkin
Feature: Monthly history

  Scenario: One row per month
    Given I read Abdías in December 2026 and Filemón in January 2027
    Then the history shows a row per month, newest first, with the books, passes, chapters, goal and notes of each

  Scenario: A month with two books
    Given a month in which one block ended and another started
    Then its row lists both books, each with its passes

  Scenario: Goals
    Given a block with a goal of 5 passes ended having read it 6 times
    Then its month shows the goal as met; a block without a goal shows none

  Scenario: Notes
    Given I wrote notes on a book that month
    Then the row shows how many and links to the book page

  Scenario: Export to CSV
    When I tap "Exportar historial (CSV)"
    Then a file "lectura-biblica-historial-YYYY-MM-DD.csv" downloads with one row per reading log
    And it opens in a spreadsheet with accents intact

  Scenario: Nothing yet
    Given nothing is logged
    Then the history says the first month appears with the first reading, and the export is not offered
```

## Out of scope

Importing CSV (the JSON backup is the way to restore, LB-013).

## Technical notes

- Domain: `monthlyHistory(journal, catalog)` and `historyCsv(journal, catalog)`; the CSV is built in the domain as text and saved through `FileSaver`.
- A month is a calendar month; a block appears in each month it covers, with what was read in that month.

## Open questions

- [ ] CSV columns — _Recommendation:_ `fecha, libro, desde, hasta, capitulos, ciclo`, Spanish headers and book names, comma-separated, UTF-8 with BOM so Excel keeps the accents; `hasta` wraps like a log's range (data model).
- [ ] Goal per month — _Recommendation:_ shown on the month the block ends; a block still active shows "en curso".

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
