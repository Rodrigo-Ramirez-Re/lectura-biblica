---
id: LB-XXX
title: <short title>
epic: E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7
status: draft # draft → ready → in-progress → in-review → done
phase: 1
depends_on: []
---

# LB-XXX — <title>

## Story

**As a** <role>
**I want** <capability>
**So that** <benefit>

## Context

<Why now, links to spec/ADRs.>

## Acceptance criteria

```gherkin
Feature: <feature>

  Scenario: <happy path>
    Given …
    When …
    Then …
```

## Out of scope

- …

## Technical notes

- …

## Open questions

- [ ] … — _Recommendation:_ …

## Decisions

<Filled while implementing: every decision taken on the owner's behalf.>

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
