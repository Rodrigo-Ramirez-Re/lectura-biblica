---
id: LB-027
title: Reading habits — weekdays, 7-day average, days without reading
epic: E4
status: ready
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

- Domain: `habits(journal, plan, today)`; weekday averages over the whole history since the first log.
- Chart kit: vertical bar chart with a reference line.

## Open questions

- [ ] Average per weekday over what — _Recommendation:_ every occurrence of that weekday from the first log to today, including the ones without reading, so a skipped Saturday lowers the Saturday bar.
- [ ] Days without reading — _Recommendation:_ days in the last 30 (today excluded, it isn't over) that expect reading and have no chapter logged; rest and paused days don't count.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
