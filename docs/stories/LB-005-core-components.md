---
id: LB-005
title: Core components
epic: E0
status: ready
phase: 1
depends_on: [LB-003]
---

# LB-005 — Core components and Storybook

## Story

**As a** developer
**I want** the basic accessible components the MVP screens need, catalogued in Storybook
**So that** screens are built from the same parts and stay consistent

## Context

[[conventions/design-system|Design system]].

## Acceptance criteria

```gherkin
Feature: Core components

  Scenario: Button
    Then button[lbButton] and a[lbButton] offer variants primary, secondary, ghost and sizes md, lg,
      with a visible focus ring and a 44px minimum touch target

  Scenario: Card
    Then section[lbCard] groups content with a heading slot

  Scenario: Progress
    Then lb-progress shows a value out of a max with a text label, exposed as role="progressbar"
      with aria-valuenow, aria-valuemax and an accessible name

  Scenario: Stepper
    Then lb-stepper lets me change a number with − and + buttons or by typing, within min and max,
      and announces the value

  Scenario: Form field
    Then lb-form-field wires label, hint and error to its control with aria-describedby and aria-invalid

  Scenario: Storybook
    When I run `npx nx storybook ui-components`
    Then every component has a story with its states and variants, in light and dark
```

## Out of scope

Charts (phase 3), dialogs and toasts unless a phase 1 screen needs them (added in that story).

## Technical notes

- `libs/ui/components` (type:ui, scope:shared) with Storybook; theme switcher toolbar in Storybook.
- Attribute selectors keep native elements and semantics.

## Open questions

- None.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (component tests by role and label)
- [ ] Lint, boundaries, tests, build, build-storybook green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated (design-system.md component table)
