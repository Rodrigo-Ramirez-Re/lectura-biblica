---
id: LB-003
title: Design tokens and themes
epic: E0
status: ready
phase: 1
depends_on: [LB-001]
---

# LB-003 — Design tokens, light and dark themes

## Story

**As a** reader
**I want** a calm, legible interface in light or dark mode
**So that** I can read my plan comfortably at any time of day

## Context

[[conventions/design-system|Design system]]. No brand exists yet: the palette is chosen here and can change later as a token change.

## Acceptance criteria

```gherkin
Feature: Design tokens

  Scenario: Semantic tokens only
    Given a component using a primitive --lb-* variable or a removed Tailwind default (bg-red-500, text-lg)
    When lint or build runs
    Then it fails

  Scenario: Follows the system theme
    Given the device is in dark mode and the theme setting is "auto"
    When I open the app
    Then the dark theme is applied

  Scenario: Forced theme
    Given the root element has data-theme="light" or "dark"
    Then that theme is applied regardless of the device setting

  Scenario: Contrast
    Then every text/background pair in contrastPairs passes 4.5:1, and focus pairs 3:1, in both themes
```

## Out of scope

The theme picker UI and storing the choice (settings, LB-010/LB-006).

## Technical notes

- `libs/ui/tokens` (type:ui, scope:shared): `primitives.css`, `theme.css` (Tailwind v4 `@theme`), `foundations.ts` with `contrastPairs`.
- Categories: colour, typography (system font stack, fluid sizes), spacing, radius, shadow, focus ring.
- Lint rule `lb/no-primitive-tokens` (copied and renamed from the sibling workspace).

## Open questions

- [ ] Palette — _Recommendation:_ warm neutral paper background with a deep blue-green primary and an amber accent; dark theme on a near-black warm grey. Neutral enough for a public app.
- [ ] Font — _Recommendation:_ system UI stack for text (zero bytes, offline) and a serif system stack (`ui-serif, Georgia`) for book names and headings.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Docs updated (design-system.md)
