---
id: LB-023
title: Insights page, chart kit and "¿Voy al día?"
epic: E4
status: done
phase: 3
depends_on: [LB-022]
---

# LB-023 — Insights page, chart kit and "¿Voy al día?"

## Story

**As a** reader
**I want** an "Avance" page that tells me whether I'm on pace this month
**So that** I know at a glance if I'm ahead or behind and by how much

## Context

[[product/spec#4. Insights|spec §4]], first question: chapters read vs expected this month, the difference in chapters and days, a cumulative line of actual vs plan. This story also lays the ground every other insight uses: the `insights` context (ADR 0001, overview), the page, and hand-drawn SVG charts that follow the chart rules (tooltip on hover and tap, never colour alone, light and dark, an equivalent table, a message when there is little data).

## Acceptance criteria

```gherkin
Feature: Am I on pace?

  Scenario: Avance in the navigation
    Then the navigation has "Avance" between "Plan" and "Libros"

  Scenario: No plan yet
    Given I haven't started a plan
    When I open Avance
    Then it explains that insights appear once I start reading, with a link to Hoy

  Scenario: Ahead of the plan
    Given the plan expects 3 chapters a day and today is 10 December, the 10th day of the plan
    And I've read 36 chapters this month
    Then Avance says "Vas 6 capítulos adelantado (2 días)"

  Scenario: Behind the plan
    Given I've read 24 chapters by 10 December at 3 a day
    Then Avance says "Vas 6 capítulos atrasado (2 días)"

  Scenario: Cumulative chart
    Then a chart draws chapters read and chapters expected day by day this month, each line labelled
    And hovering or tapping a day shows its date, read and expected
    And "Ver como tabla" shows the same data as a table

  Scenario: Rest days and pauses
    Given a rest day or a paused day this month
    Then that day expects no chapters
```

## Out of scope

The other six questions (LB-024 to LB-028). Previous months (LB-028).

## Technical notes

- New libs: `libs/insights/domain` (pure metrics over `Journal`, catalog and a day), `libs/insights/application` (`GetInsights` from `JournalReader` + `Clock`), `libs/insights/feature` (the page). Tags `scope:insights`; it may use `catalog` and `reading`.
- New `libs/ui/charts` (`type:ui, scope:shared`): a chart frame (title, figure, legend, "Ver como tabla"), a line chart, and the tooltip behaviour. No chart library.
- Route `avance`, nav icon `chart`.

## Open questions

- [x] What a day expects — _Adopted:_ the current plan's pace for that weekday, only on days a recorded block covers (so days before the plan started and paused days expect nothing). The pace history isn't stored, and a changed pace shows from the day it applies on Plan anyway.
- [x] How to turn chapters into days — _Adopted:_ divide by the plan's average chapters per reading day, rounding to the nearest whole day; say nothing about days when it rounds to 0.
- [x] "This month" — _Adopted:_ the calendar month of today, up to today.

## Decisions

- The three open questions were adopted as recommended: a day expects the current plan's pace only on days a recorded block covers; days = chapters ÷ the plan's average per reading day, rounded and left out when it rounds to 0; "this month" is today's calendar month up to today.
- The chart kit lives in `ui-components` (`lib/charts/`) instead of a new `ui-charts` lib: same tags, same Storybook. It can be split if it grows.
- `lb-line-chart`: the drawing follows the width it gets (`ResizeObserver`), so text and strokes keep their size on a phone and on a desktop. Series differ by dash as well as colour and are named in a legend. A tooltip shows a day on hover, on tap (it stays until the next tap) and with the arrow keys, Home, End and Escape once the chart has focus. The chart is an image with a one-sentence summary; `lb-chart-table` ("Ver como tabla") is the equivalent for assistive technology.
- Both lines run from the 1st to today; the plan's line doesn't run ahead to the end of the month.
- Wording: "Vas N capítulos adelantado/atrasado (M días)", "Vas al día", singular for 1, and "Llevas R de E capítulos que tu plan espera este mes." A month with nothing read or expected yet says so instead of drawing empty lines.
- Avance records blocks that started while the app was closed (`AdvanceBlocks`) before computing, like Hoy and Plan.
- New libs `insights-domain`, `insights-application` and `insights-feature`; `GetInsights` returns null until a plan starts. Navigation has five tabs, with "Avance" (chart icon) between Plan and Libros.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated
