---
id: LB-006
title: App shell
epic: E0
status: ready
phase: 1
depends_on: [LB-004, LB-005]
---

# LB-006 — App shell: navigation, about page, not-found

## Story

**As a** reader on my phone
**I want** a simple navigation between Hoy, Plan, Libros and Acerca de
**So that** I always know where I am and reach any screen with my thumb

## Context

Mobile first ([[product/spec#Experience|spec §3]]). The app name comes from `apps/reader/src/config.json`.

## Acceptance criteria

```gherkin
Feature: App shell

  Scenario: Bottom navigation on mobile
    Given a narrow screen
    Then a bottom tab bar shows Hoy, Plan, Libros and Acerca de with icon and label,
      and the current one is marked with aria-current="page"

  Scenario: Wide screens
    Given a wide screen
    Then the same navigation shows as a top or side bar

  Scenario: Page titles
    When I navigate to a screen
    Then the document title is "<Screen> · <App name>" and focus moves to the main heading

  Scenario: About page
    When I open Acerca de
    Then I read what the app is, that it is free, that my data stays on this device and no data is collected

  Scenario: Theme choice
    When I choose Claro, Oscuro or Automático in Acerca de
    Then the theme changes at once and the choice is kept after reloading

  Scenario: Not found
    When I open an unknown route
    Then I see a "página no encontrada" screen with a link to Hoy

  Scenario: Skip link
    When I press Tab on a fresh page
    Then a "Saltar al contenido" link is the first focusable element
```

## Out of scope

Install help and donation (phase 4); real content of Hoy, Plan and Libros (later stories).

## Technical notes

- `libs/ui/layout` (type:ui) for the shell; the app owns routes.
- `config.json`: `{ "appName": "Lectura bíblica", "shortName": "Lectura", "donation": { "enabled": false, "label": "", "url": "" } }`. Only `appName`/`shortName` are used now.
- Theme choice persisted through a settings port; until LB-010 lands, a `localStorage` adapter is acceptable only if replaced there. — _Recommendation:_ implement LB-010's settings store first if order allows.

## Open questions

- [ ] Icons — _Recommendation:_ inline SVG icons (Lucide, ISC licence) copied as Angular components, no icon font or runtime dependency.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
