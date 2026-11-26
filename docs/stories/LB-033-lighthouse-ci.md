---
id: LB-033
title: Lighthouse in CI
epic: E5
status: ready
phase: 4
depends_on: [LB-032]
---

# LB-033 — Lighthouse in CI

## Story

**As the** owner
**I want** every pull request to measure the app with Lighthouse and fail when it gets worse
**So that** performance, accessibility and good practices don't decay without anyone noticing

## Context

[[product/spec#8. PWA and deployment|spec §8]]: "pass Lighthouse (PWA, accessibility, performance)". Lighthouse 12 removed the PWA category. The PWA requirements are covered by `pwa.spec.ts`: the manifest is served, the app works offline after the first visit, and it makes no request outside its origin.

## Acceptance criteria

```gherkin
Feature: Lighthouse in CI

  Scenario: Measured on every pull request
    Given a pull request that affects the reader app
    Then CI runs Lighthouse on the production build served under /lectura-biblica/, on Hoy, Avance, Libros and Acerca de

  Scenario: Budgets
    Then CI fails if any page scores below 90 in performance, 100 in accessibility, 95 in best practices or 90 in SEO

  Scenario: Report
    Then the HTML reports are kept as a CI artifact for 7 days, and nothing is uploaded to a public server

  Scenario: Locally
    When I run npx nx run reader:lighthouse
    Then the same check runs on my machine with Chrome or Edge

  Scenario: Installable
    Then the PWA checks cover what the removed category did: manifest name, icons 192, 512 and maskable, start_url and scope relative, theme colour, the service worker controlling the page
```

## Out of scope

- Lighthouse on the published site after each deploy.
- Tracking scores over time.

## Technical notes

- `@lhci/cli` as a dev dependency, configured in `apps/reader/lighthouserc.cjs`; Nx target `reader:lighthouse` depends on `pages` and serves the build with `tools/pages/src/serve.mjs`.
- CI: a `lighthouse` job on `ubuntu-latest`, which already has Google Chrome, through `npx nx affected -t lighthouse`.
- Mobile preset (Lighthouse's default), 3 runs per page, median score asserted.

## Open questions

- [ ] Performance budget on noisy CI machines — _Recommendation:_ median of 3 runs at 90; if it proves flaky, lower it in the config and say so in the story, never skip the job.
- [ ] Accessibility at 100 — _Recommendation:_ yes: LB-032 leaves every screen clean, and any drop is a real regression.
- [ ] Upload target — _Recommendation:_ the filesystem plus a CI artifact; `temporary-public-storage` would publish the reports on Google's servers (spec §5 privacy).

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Works offline on the sub-path build
- [ ] Docs updated (README commands, testing conventions)
