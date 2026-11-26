---
id: LB-027
title: Reading habits — weekdays, 7-day average, days without reading
epic: E4
status: done
phase: 3
depends_on: [LB-023]
---

# LB-027 — How do I read?

## Story

**As a** reader
**I want** to see on which weekdays I read most, my average of the last 7 days and my days without reading
**So that** I can adjust my plan to how I really read

## Context

[[product/spec#4. Insights|spec §4]]: chapters per weekday, 7-day average, zero days; weekday bars and an average line. It closes the loop with the pace per weekday of LB-015.

## Acceptance criteria

```gherkin
Feature: Reading habits

  Scenario: Weekdays
    Given I read 3 chapters every weekday and 6 on Saturdays for 4 weeks
    Then Avance shows a bar per weekday, Monday to Sunday, with the average chapters of that weekday
    And a line marks my overall daily average

  Scenario: 7-day average
    Given I read 21 chapters in the last 7 days
    Then Avance shows "Promedio de 7 días: 3 capítulos al día"

  Scenario: Days without reading
    Given in the last 30 days there were 4 reading days without any chapter logged
    Then Avance shows "4 días sin leer en los últimos 30"

  Scenario: Little data
    Given I've been reading for less than 7 days
    Then the section says it needs a week of reading to show habits

  Scenario: Table
    Then "Ver como tabla" lists weekday and average chapters
```

## Out of scope

Suggesting a new pace.

## Technical notes

- Domain: `habits(journal, today)`; weekday averages over the whole history since the first log.
- Chart kit: vertical bar chart with a reference line.

## Open questions

- [x] Average per weekday over what — _Adopted:_ every occurrence of that weekday from the first log to today, including the ones without reading, so a skipped Saturday lowers the Saturday bar.
- [x] Days without reading — _Adopted:_ days in the last 30 (today excluded, it isn't over) that expect reading and have no chapter logged; rest and paused days don't count.

## Decisions

- Both open questions were adopted as recommended: a weekday's average counts every occurrence of it from the first log on, the ones without reading included; days without reading are the days of the last 30 (today excluded) that expected reading and had no chapter, so rest and paused days never count.
- Today only enters the averages once something is read, so opening Avance in the morning doesn't lower them.
- "Tu promedio diario" (the dashed reference line) is the chapters per day over the same days as the weekday bars. The 7-day average includes today.
- `lb-column-chart` (ui-components): columns with their value written above them and the reference line named in the legend. Every value is printed, so it needs no tooltip; the table lists each weekday in full.
- Wording: "Promedio de 7 días: N capítulos al día", "Ningún día sin leer en los últimos 30." / "1 día…" / "N días…", and "Con una semana de lectura verás qué días de la semana lees más." until there are 7 days since the first log.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated
