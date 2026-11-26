---
id: LB-029
title: Configurable donation section
epic: E5
status: done
phase: 4
depends_on: [LB-006]
---

# LB-029 — Configurable donation section

## Story

**As the** owner
**I want** to turn on an optional donation link from one place in the config
**So that** whoever finds the app useful can support it, without anyone feeling pushed to pay

## Context

[[product/spec#6. Donations (phase 4)|spec §6]]: free app, voluntary support, an external payment link configured in a `donation` section (`enabled`, `label`, `url`), shown in "Acerca de" or the footer with a clear statement that the app is free. Never account numbers, CLABE or card numbers in the code, repo or page. No pop-ups or nagging. `apps/reader/src/config.json` already has `donation: { enabled: false, label: "", url: "" }` (LB-006); nothing reads it yet.

## Acceptance criteria

```gherkin
Feature: Donation section

  Scenario: Turned off
    Given the config has donation.enabled false, or no url
    Then no donation section, link or text appears anywhere in the app

  Scenario: Turned on
    Given the config has donation enabled with a url and a label
    When I open "Acerca de"
    Then a "Apoya este proyecto" section says the app is free and support is voluntary
    And a link with the configured label opens the url in a new tab, announced as opening another site

  Scenario: Default label
    Given donation is enabled with a url and an empty label
    Then the link reads "Hacer una donación"

  Scenario: Only safe links
    Given the url is not https (http, javascript:, a relative path)
    Then the section is not shown

  Scenario: Never bank details
    Given the config contains an account, CLABE or card-like number
    Then the unit tests fail before it can be merged
```

## Out of scope

- Choosing the payment service and creating the account (the owner does it; see `docs/operations/donations.md`).
- Showing it anywhere but "Acerca de", reminders or banners.

## Technical notes

- `appSettings` becomes an injection token (`APP_SETTINGS`, default from `config.json`) so tests can provide other values.
- A pure `donationLink(settings)` returns `{label, url} | null` applying the rules above.
- A spec reads the real `config.json` and fails on any run of 10+ digits (accounts, CLABE, cards) and on an enabled donation that is not https.

## Open questions

- [x] Where it is shown — _Adopted:_ only in "Acerca de", right after "Qué es", never in the footer or on Hoy: spec §6 forbids nagging and the about page is where "es gratuita" already lives.
- [x] Is the label translatable? — _Adopted:_ the configured label is the owner's text and is shown as is; the default and the surrounding copy are i18n-marked.
- [x] Should it be on in the repo? — _Adopted:_ no: it stays `enabled: false` until the owner picks a service (spec §6); the doc explains how to turn it on.

## Decisions

- All three open questions were adopted as recommended. The section shows only in "Acerca de", right after "Qué es", never in the footer or on Hoy. The configured label is shown as written; the default "Hacer una donación" and the surrounding copy are i18n-marked. The repo keeps `enabled: false` until the owner picks a service.
- The link opens in a new tab with `rel="noopener noreferrer"`, an external-link icon and "(se abre en otro sitio)" for screen readers, styled as a secondary button so it doesn't compete with the app's own actions.
- Only a well-formed `https://` URL turns the section on; `http`, `javascript:`, relative paths and bare domains are ignored, so a typo can't publish an unsafe link.
- The bank-details guard rejects any run of 10 or more digits in `config.json`, after removing spaces, dots and dashes. That covers CLABE (18), cards (13–19) and account numbers. A donation URL rarely needs such a run.
- `appSettings` is now also an injection token (`APP_SETTINGS`) so tests can turn the section on; the app still reads `src/config.json` at build time.
- `docs/operations/donations.md` explains how to turn it on and off, what never to publish, and the tax note.

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Accessible (keyboard + axe) and i18n-marked
- [x] Works offline on the sub-path build
- [x] Docs updated
