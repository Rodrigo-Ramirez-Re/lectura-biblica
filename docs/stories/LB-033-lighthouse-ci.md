---
id: LB-033
title: Lighthouse in CI
epic: E5
status: done
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

- [x] Performance budget on noisy CI machines — _Adopted:_ median of 3 runs at 90; if it proves flaky, lower it in the config and say so in the story, never skip the job.
- [x] Accessibility at 100 — _Adopted:_ yes: LB-032 leaves every screen clean, and any drop is a real regression.
- [x] Upload target — _Adopted:_ the filesystem plus a CI artifact; `temporary-public-storage` would publish the reports on Google's servers (spec §5 privacy).

## Decisions

- All three open questions were adopted as recommended:
  - Performance at 90 (median of 3 runs, Lighthouse's simulated mobile).
  - Accessibility at 100, best practices at 95, SEO at 90.
  - Reports go to the filesystem and a 7-day CI artifact, never to `temporary-public-storage`.
- `@lhci/cli` 0.16.1 (Lighthouse 13) runs as the `reader:lighthouse` Nx target, which builds the Pages site first. CI has a `lighthouse` job on `ubuntu-latest`, whose Google Chrome it finds on its own, running `nx affected -t lighthouse`.
- Deep links: GitHub Pages answers `/avance` with the app's page and status 404, and Lighthouse refuses to measure a 404 page. The local Pages server gained `deepLinkStatus`, still 404 by default, and Lighthouse starts it with `--deep-links-200`. The document is the same, so browsers render both alike.
- The first runs scored 0.83–0.89 on Libros and Acerca de, and first paint swung between 0.7 s and 3.5 s. The cause was the local server: it sent the 364 KB main script uncompressed, while Pages gzips text. The server now compresses text for clients that accept gzip, as Pages does. Medians went to 0.94–0.97, so the 90 budget holds without lowering it.
- The PWA category Lighthouse 12 removed is covered by e2e. A new test checks the manifest (name, short name, relative `start_url` and `scope`, standalone, `lang`, colours), that the 192, 512 and maskable icons are served as PNG, and the apple-touch-icon. The existing tests already check offline after the first visit and that no request leaves the origin.
- Locally the target needs Chrome; with Edge only, set `CHROME_PATH` (README).
- `npm audit` reports 18 advisories in development tooling that were there before (Nx, Storybook, `sharp`, `minimatch`). None comes from Lighthouse CI or ships to production (`npm audit --omit=dev`: 0).

## Definition of done

- [x] All scenarios covered by tests (unit/component/e2e)
- [x] Lint, boundaries, tests, build green
- [x] `lb-review` passed
- [x] Works offline on the sub-path build
- [x] Docs updated (README commands, testing conventions)
