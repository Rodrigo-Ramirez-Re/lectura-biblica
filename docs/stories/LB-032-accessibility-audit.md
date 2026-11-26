---
id: LB-032
title: Accessibility audit
epic: E5
status: ready
phase: 4
depends_on: [LB-028, LB-029, LB-030, LB-031]
---

# LB-032 — Accessibility audit

## Story

**As a** reader who uses a keyboard, a screen reader, large text or a small phone
**I want** every screen to work for me
**So that** nobody is left out of the app

## Context

Each story ran axe on the screens it touched. Nobody has audited the whole app in both themes, at the narrowest width, with large text and with reduced motion. [[product/spec#8. PWA and deployment|spec §8]] asks to "check contrast and keyboard use" before calling something done. Target: WCAG 2.2 AA.

## Acceptance criteria

```gherkin
Feature: Accessibility audit

  Scenario: Every screen passes axe in both themes
    Given each screen: Hoy (first run and with a plan), Plan, Editar plan, Historial del libro, Avance (empty and with data), Libros, a book page, Acerca de, Instalar and Página no encontrada
    When it is scanned in light and in dark
    Then axe finds no WCAG 2.2 A/AA violation

  Scenario: Reflow
    Given a 320 px wide screen
    Then no screen scrolls sideways, except tables and charts inside their own box

  Scenario: Large text
    Given text at 200 %
    Then no text is cut off or overlaps

  Scenario: Keyboard
    Then every screen can be used with the keyboard alone, in a logical order, with a visible focus, and the skip link reaches the content

  Scenario: Reduced motion
    Given the device asks for reduced motion
    Then nothing animates or scrolls smoothly

  Scenario: Findings
    Then every problem found is fixed or recorded in the audit report with a reason
```

## Out of scope

- WCAG AAA.
- Testing with real screen readers on devices: the report lists the checks the owner should do with TalkBack and VoiceOver.

## Technical notes

- A new e2e suite `accessibility-audit.spec.ts` walks every screen with seeded data, in both themes, and checks axe and the 320 px reflow; it replaces nothing that already exists.
- `docs/operations/accessibility-audit.md` records the method, the results per screen, the fixes and the manual checklist.

## Open questions

- [ ] Large text in tests — _Recommendation:_ emulate it by setting the root font size to 200 % and check that nothing overflows its container. Browser zoom can't be driven the same way in all three engines.
- [ ] axe best-practice rules — _Recommendation:_ report them in the audit but only fail the suite on WCAG A/AA rules, as the existing checks do.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated (audit report)
