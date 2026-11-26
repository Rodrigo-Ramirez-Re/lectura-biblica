---
id: LB-030
title: Install help for Android, iPhone and desktop
epic: E5
status: done
phase: 4
depends_on: [LB-007]
---

# LB-030 — Install help for Android, iPhone and desktop

## Story

**As a** reader
**I want** short instructions to install the app on my device, or a button that does it
**So that** I open it from my home screen, use it offline and keep my data safer

## Context

[[product/spec#8. PWA and deployment|spec §8]]: "Brief install help for Android, iPhone and desktop". Installing reduces the risk of Safari evicting the data ([[product/spec#5. Decisions already taken|spec §5]]); the storage notice (LB-010) already tells people to install it, but not how.

## Acceptance criteria

```gherkin
Feature: Install help

  Scenario: Instructions per device
    When I open "Instalar la aplicación" from "Acerca de"
    Then I see brief steps for Android, iPhone or iPad, and computer
    And the steps for my device come first and open, the others are collapsed

  Scenario: Install in one tap
    Given my browser offers to install the app (Chrome or Edge)
    Then an "Instalar ahora" button opens the browser's install dialog
    And once installed the page says the app is installed

  Scenario: Already installed
    Given I opened the app from its icon
    Then the page says I am already using the installed app, and Acerca de does not suggest installing it

  Scenario: From the storage notice
    Given the first-run notice about where data lives
    Then it links to the install help

  Scenario: Why install
    Then the page says what installing gives: its own icon, works without internet, and the browser keeps the data longer
```

## Out of scope

- Install prompts on Hoy or any banner that interrupts.
- Screenshots of each browser (they go stale; text steps only).

## Technical notes

- New route `instalar` (not in the bottom navigation), linked from "Acerca de" and from the storage notice.
- Pure `detectPlatform(userAgent, maxTouchPoints)` → `android | ios | desktop`; iPadOS reports a Mac user agent with touch points.
- `InstallPrompt` service in the app's `pwa/` folder captures `beforeinstallprompt` from bootstrap (it fires once, early), exposes `canInstall`, `install()` and `installed`, and listens to `appinstalled`; installed also when `display-mode: standalone` or `navigator.standalone`.

## Open questions

- [x] Section in Acerca de or its own page? — _Adopted:_ its own page `instalar`: Acerca de is already long, and the storage notice needs a direct link.
- [x] Browsers covered — _Adopted:_ Android (Chrome, also Samsung Internet and Edge), iPhone/iPad (Safari, and since iOS 16.4 also other browsers via Compartir), computer (Chrome and Edge from the address bar; Safari on Mac with "Agregar al Dock"; Firefox doesn't install web apps, so it says to use another browser or keep using it in the tab).

## Decisions

- Both open questions were adopted as recommended:
  - Install help is its own page, `instalar`, kept out of the bottom navigation and linked from Acerca de ("Cómo instalar la aplicación") and from the first-run storage notice ("Cómo instalarla").
  - It covers Android (Chrome, plus Samsung Internet and Edge), iPhone or iPad (Safari, plus Chrome and Edge since iOS 16.4) and computer (Chrome and Edge, Safari on Mac). It says that Firefox does not install web apps.
- The steps for the person's own device come first and open; the other two are collapsed `<details>` that open with the keyboard. Detection is only a hint: an iPad that reports itself as a Mac is recognised by its touch screen, and every platform's steps stay on the page.
- "Instalar ahora" appears only when the browser has offered to install (Chrome and Edge fire `beforeinstallprompt`). The app listens from start-up, since the browser fires the offer once, early. The browser's own install hint is not suppressed, because the button lives on a page people choose to open.
- An offer is used once. If the person declines it, the button disappears until the browser offers again.
- "Installed" means the app runs in standalone mode (`display-mode: standalone`, or `navigator.standalone` on iOS), or the browser reported `appinstalled`. In that case the page says "Ya estás usando la aplicación instalada." and Acerca de stops suggesting installing it.
- Text steps only, no screenshots: browser menus change and images would go stale.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated
