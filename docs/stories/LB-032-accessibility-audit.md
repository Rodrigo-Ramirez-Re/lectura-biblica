---
id: LB-032
title: Accessibility audit
epic: E5
status: done
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

- [x] Large text in tests — _Adopted:_ emulate it by setting the root font size to 200 % and check that nothing overflows its container. Browser zoom can't be driven the same way in all three engines.
- [x] axe best-practice rules — _Adopted:_ report them in the audit but only fail the suite on WCAG A/AA rules, as the existing checks do.

## Decisions

- Both open questions were adopted as recommended. Large text is emulated by setting the root font size to 200 % on a 1280 px viewport. The check is that the page doesn't scroll sideways and no element cuts its text off. axe fails the suite on WCAG A/AA rules only, as the existing checks do.
- The audit is an e2e suite that runs on every PR (`accessibility-audit.spec.ts`): 12 screens × 4 checks in three engines. Screens with data are seeded by importing a backup with twelve days of reading and a note.
- Engine limits, recorded in the suite:
  - axe doesn't run in Playwright's Firefox (LB-011).
  - The keyboard walk doesn't run in WebKit, because Safari tabs only to form controls unless a system setting is on. The manual checklist covers it.
- One defect found and fixed: the scrolling boxes of "Ver como tabla" and of the monthly history couldn't be reached by keyboard (`scrollable-region-focusable`). Each is now a focusable region named after its table, with the focus ring. Unit tests cover both.
- A dark-mode contrast report turned out to be axe measuring buttons mid-fade after the theme switched on an open page. The suite now waits for CSS transitions (at most 1 s) before scanning in dark.
- `docs/operations/accessibility-audit.md` has the method, the results per screen, the findings and the checks the owner should do with TalkBack, VoiceOver, large system text, 400 % zoom, forced colours and Safari's keyboard setting.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated (audit report)
