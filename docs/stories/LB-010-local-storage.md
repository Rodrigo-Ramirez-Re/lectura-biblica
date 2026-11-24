---
id: LB-010
title: Local storage and data-safety notice
epic: E1
status: done
phase: 1
depends_on: [LB-006]
---

# LB-010 — Local storage and data-safety notice

## Story

**As a** reader
**I want** my data kept on my device and to know how to protect it
**So that** I never lose my reading history by surprise

## Context

[[architecture/adr/0003-local-first-indexeddb|ADR 0003]], [[architecture/data-model|data model]].

## Acceptance criteria

```gherkin
Feature: Local storage

  Scenario: Survives reloads
    Given I saved settings or reading data
    When I close and reopen the app, online or offline
    Then the data is there

  Scenario: Persistent storage
    When the app first stores data
    Then it asks the browser for persistent storage, and Acerca de shows whether it was granted

  Scenario: Data-safety notice
    Given I open the app for the first time
    Then a short notice says my data lives only on this device, that some browsers (Safari) may delete it
      if I don't use the app for a while, and that installing the app and exporting backups protects it
    And after "Entendido" it doesn't show again

  Scenario: Storage unavailable
    Given IndexedDB is not available (private mode in some browsers)
    Then the app says it cannot save on this device instead of failing silently

  Scenario: Shared origin
    Then the database is named "lectura-biblica", independent of the URL path
```

## Out of scope

Backup files (LB-013).

## Technical notes

- `libs/reading/infrastructure` (type:infrastructure, scope:reading) with `idb`: database `lectura-biblica` v1, stores `settings`, `plan`, `blocks` (index `cycle`), `logs` (indexes `date`, `blockId`, `bookId`), `notes`.
- Ports in `reading/domain`/`application`: `SettingsRepository`, `PlanRepository`, `BlockRepository`, `ReadingLogRepository`, `StorageGuard` (persist + estimate). In-memory fakes for tests; adapters tested with `fake-indexeddb`.
- Settings (theme, notice acknowledged, last backup) move here from LB-006's temporary store if one exists.

## Open questions

- None.

## Decisions

- One IndexedDB database, `lectura-biblica` v1, opened by `libs/shared/infrastructure-browser` (stores `settings`, `plan`, `blocks`, `logs` with `date`/`blockId`/`bookId` indexes, `notes`). Contexts reach it through their own adapters; the reading one is `IndexedDbJournal`.
- Ports: `JournalReader` (load everything) and `JournalWriter` (save plan, blocks, settings; add/remove logs; replace all in one transaction) in `reading-domain`; `StorageGuard` (available, persist, persisted) in the shared kernel.
- Persistent storage is requested on the first write of a session, not on first load: the person has something worth keeping by then, and Firefox may show a prompt.
- Device preferences (theme, notice seen) stay in `localStorage`; reading data in IndexedDB. Data model updated.
- When IndexedDB cannot open, a red alert says nothing can be saved; the first-run notice is shown otherwise until "Entendido".
- "Survives reloads" is covered by adapter tests against `fake-indexeddb` (two instances share the data); the end-to-end reload with real data lands with LB-011, the first screen that saves.
- e2e blocks the service worker except in the PWA and sub-path suites: its prefetch on every first load made Firefox crash during axe scans and slowed lazy routes.

## Definition of done

- [ ] All scenarios covered by tests (unit/integration/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
