---
id: LB-015
title: Plan editor — pace and rest days
epic: E3
status: ready
phase: 2
depends_on: [LB-014]
---

# LB-015 — Plan editor: name, pace, rest days and pace per weekday

## Story

**As a** reader
**I want** to choose how many chapters I read each day, rest some days, or read a different amount per weekday
**So that** the plan fits my week instead of the other way round

## Context

[[product/spec#Configure how to read|spec §3]]. First section of the plan editor (`/plan/editar`); later stories add sections to it. Editing the plan only changes what is still to come: logs and recorded blocks never change ([[architecture/adr/0007-chapters-as-the-unit-of-progress|ADR 0007]]).

## Acceptance criteria

```gherkin
Feature: Pace

  Scenario: Open the editor
    Given I have a plan
    When I press "Editar plan" on Plan
    Then I see the editor with the plan's name and pace, "Guardar cambios" and "Cancelar"

  Scenario: Same pace every day
    When I set 4 chapters a day and save
    Then Hoy expects 4 chapters and Plan says "4 capítulos al día"

  Scenario: Rest days
    When I mark Sunday as a rest day and save
    Then on Sundays Hoy says it is a rest day and expects nothing, and I can still log if I want

  Scenario: Pace per weekday
    When I choose "Distinto cada día" and set 5 on Saturday, 0 on Sunday and 2 the other days
    Then each day Hoy expects that day's amount, and 0 means rest

  Scenario: At least one reading day
    When every day is a rest day
    Then I cannot save and I'm told why

  Scenario: Blocks follow the pace
    Given a pace that reads fewer chapters per week
    Then upcoming blocks grow until one pass fits counting only reading days, and "passes that fit" use the new pace

  Scenario: Rename the plan
    When I change its name and save
    Then Plan shows the new name

  Scenario: Cancel
    When I change something and press "Cancelar"
    Then nothing changes
```

## Out of scope

Durations, order, cycles, templates (later sections of the editor).

## Technical notes

- Domain: `dailyPace(plan, weekday)` and `chaptersBetween(plan, start, end)`; block extension and `passesThatFit` use them.
- Application: `GetPlan`, `UpdatePlan` (validates and saves, or rejects with a reason).
- `reading/feature-plan`: `PlanEditorPage` with a draft plan signal and one component per section.

## Open questions

- [ ] Where is "Editar plan"? — _Recommendation:_ a button on Plan, under the summary.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
