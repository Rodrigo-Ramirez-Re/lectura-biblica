---
id: LB-008
title: GitHub Pages deploy
epic: E0
status: ready
phase: 1
depends_on: [LB-002, LB-007]
---

# LB-008 — GitHub Pages deploy on the sub-path

## Story

**As the** owner
**I want** every merge into `main` published at `https://rodrigo-ramirez-re.github.io/lectura-biblica/`
**So that** I can use the app from my phone and share it

## Context

[[architecture/adr/0002-static-pwa-on-github-pages|ADR 0002]], [[operations/deploy|deploy]].

## Acceptance criteria

```gherkin
Feature: Pages deploy

  Scenario: Deploy on main
    When a commit lands on main
    Then the Pages workflow builds the reader with base href /lectura-biblica/ and deploys it

  Scenario: Sub-path works
    Given the build served under /lectura-biblica/
    When I open the home and a deep link such as /lectura-biblica/acerca
    Then both load, and every asset, the manifest and the service worker are requested under /lectura-biblica/

  Scenario: E2E uses the sub-path
    Then reader-e2e runs against the production build served under /lectura-biblica/, never from the root

  Scenario: No docs in the output
    Then the deployed artifact contains no markdown, docs or .claude files
```

## Out of scope

Custom domain.

## Technical notes

- Workflow `pages.yml`: checkout, setup-node, `npm ci`, `nx build reader` (production, base href), copy `index.html` → `404.html`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`; permissions `pages: write`, `id-token: write`; concurrency group `pages`.
- A small static server for e2e that serves `dist/apps/reader/browser` under `/lectura-biblica/` with the `404.html` fallback, like Pages does.
- Repo: Pages source "GitHub Actions"; `github-pages` environment allows `main`.

## Open questions

- None.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Works offline on the sub-path build
- [ ] Docs updated (deploy.md)
