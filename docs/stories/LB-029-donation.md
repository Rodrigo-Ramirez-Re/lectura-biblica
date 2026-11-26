---
id: LB-029
title: Configurable donation section
epic: E5
status: ready
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

- [ ] Where it is shown — _Recommendation:_ only in "Acerca de", right after "Qué es", never in the footer or on Hoy: spec §6 forbids nagging and the about page is where "es gratuita" already lives.
- [ ] Is the label translatable? — _Recommendation:_ the configured label is the owner's text and is shown as is; the default and the surrounding copy are i18n-marked.
- [ ] Should it be on in the repo? — _Recommendation:_ no: it stays `enabled: false` until the owner picks a service (spec §6); the doc explains how to turn it on.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
