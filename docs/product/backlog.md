# Backlog

Status lives in each story's frontmatter. Order = suggested execution order. Later phases are listed as epics; their stories are written when the phase starts.

## Phase 1 — MVP

Done when the owner can log a full month from their phone.

### E0 · Foundation

| ID                                            | Story                                                             | Depends on |
| --------------------------------------------- | ----------------------------------------------------------------- | ---------- |
| [[stories/LB-001-workspace-scaffold\|LB-001]] | Workspace scaffold (Nx, reader app, Tailwind, Vitest, Playwright) | —          |
| [[stories/LB-002-quality-gates\|LB-002]]      | Quality gates: boundaries, commitlint, husky, CI, branch rules    | 001        |
| [[stories/LB-003-design-tokens\|LB-003]]      | Design tokens, light and dark themes                              | 001        |
| [[stories/LB-004-i18n-baseline\|LB-004]]      | i18n baseline (es-MX)                                             | 001        |
| [[stories/LB-005-core-components\|LB-005]]    | Core components + Storybook                                       | 003        |
| [[stories/LB-006-app-shell\|LB-006]]          | App shell: navigation, about page, not-found                      | 004, 005   |
| [[stories/LB-007-pwa\|LB-007]]                | Installable and offline PWA with update notice                    | 006        |
| [[stories/LB-008-pages-deploy\|LB-008]]       | GitHub Pages deploy on the sub-path                               | 002, 007   |

### E1 · Catalog and plan

| ID                                       | Story                                         | Depends on |
| ---------------------------------------- | --------------------------------------------- | ---------- |
| [[stories/LB-009-book-catalog\|LB-009]]  | Book catalog and book page                    | 006        |
| [[stories/LB-010-local-storage\|LB-010]] | Local storage and data-safety notice          | 006        |
| [[stories/LB-011-default-plan\|LB-011]]  | Start with the default plan; see the schedule | 009, 010   |

### E2 · Reading log

| ID                                   | Story                                  | Depends on |
| ------------------------------------ | -------------------------------------- | ---------- |
| [[stories/LB-012-today-log\|LB-012]] | Today: what is due and one-tap logging | 011        |
| [[stories/LB-013-backup\|LB-013]]    | Backup export and import               | 012        |

## Phase 2 — Flexibility (E3)

Each person builds their own way of reading and can change it without losing history.

| ID                                         | Story                                                           | Depends on |
| ------------------------------------------ | --------------------------------------------------------------- | ---------- |
| [[stories/LB-014-data-model-v2\|LB-014]]   | Data model v2 (migration of backups and of the device database) | 013        |
| [[stories/LB-015-pace-editor\|LB-015]]     | Plan editor: name, pace, rest days, pace per weekday            | 014        |
| [[stories/LB-016-durations-goals\|LB-016]] | Block duration (month, weeks, days, passes) and goals           | 015        |
| [[stories/LB-017-book-order\|LB-017]]      | Book order: templates, reorder by hand, include or exclude      | 015        |
| [[stories/LB-018-current-block\|LB-018]]   | Current book: change, skip, pause and resume, move its end      | 016, 017   |
| [[stories/LB-019-cycles\|LB-019]]          | Cycles: repeat, number of cycles, restart                       | 018        |
| [[stories/LB-020-edit-logs\|LB-020]]       | Edit and delete past logs                                       | 018        |
| [[stories/LB-021-notes\|LB-021]]           | Notes per book or block                                         | 020        |
| [[stories/LB-022-plan-templates\|LB-022]]  | Plan templates: save, apply, export, import                     | 019        |

## Phase 3 — Insights (E4)

The seven metrics of [[product/spec#4. Insights|spec §4]], each with an SVG chart and its equivalent table, empty states with little data, and CSV export of the history.

| ID                                          | Story                                                         | Depends on |
| ------------------------------------------- | ------------------------------------------------------------- | ---------- |
| [[stories/LB-023-insights-on-pace\|LB-023]] | Insights page, chart kit and "¿Voy al día?"                   | 022        |
| [[stories/LB-024-consistency\|LB-024]]      | Consistency: streaks and the month's calendar                 | 023        |
| [[stories/LB-025-passes-per-book\|LB-025]]  | Passes per book                                               | 023        |
| [[stories/LB-026-cycle-progress\|LB-026]]   | Cycle progress and estimated end at the real pace             | 023        |
| [[stories/LB-027-reading-habits\|LB-027]]   | Reading habits: weekdays, 7-day average, days without reading | 023        |
| [[stories/LB-028-monthly-history\|LB-028]]  | Monthly history and CSV export                                | 023        |

## Phase 4 — Support and polish (E5)

Configurable donation link, install help (Android, iPhone, desktop), accessibility audit, Lighthouse in CI, backup reminders tuning.

| ID                                             | Story                                        | Depends on         |
| ---------------------------------------------- | -------------------------------------------- | ------------------ |
| [[stories/LB-029-donation\|LB-029]]            | Configurable donation section                | 006                |
| [[stories/LB-030-install-help\|LB-030]]        | Install help for Android, iPhone and desktop | 007                |
| [[stories/LB-031-backup-reminders\|LB-031]]    | Backup reminders tuning                      | 013                |
| [[stories/LB-032-accessibility-audit\|LB-032]] | Accessibility audit                          | 028, 029, 030, 031 |
| [[stories/LB-033-lighthouse-ci\|LB-033]]       | Lighthouse in CI                             | 032                |

## Phase 5 — Study material (E6)

One content file per book, a "Material de estudio" book section, reading practices and guide questions, highlighted during the book's block.

## Phase 6 — Sync (E7, optional)

Sync between devices through an external free-tier service, only if needed.
