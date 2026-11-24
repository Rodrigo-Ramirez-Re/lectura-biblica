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

Plan editor: pace, rest days, pace per weekday; block duration (month, weeks, days, passes) and goals per block; book order (templates, reorder by hand, include/exclude); cycles and restarting a cycle; choose or change the book of a block, pause, skip; edit and delete past logs; notes per block or book; plan templates (save, export, import).

## Phase 3 — Insights (E4)

The seven metrics of [[product/spec#4. Insights|spec §4]], each with an SVG chart and its equivalent table, empty states with little data, and CSV export of the history.

## Phase 4 — Support and polish (E5)

Configurable donation link, install help (Android, iPhone, desktop), accessibility audit, Lighthouse in CI, backup reminders tuning.

## Phase 5 — Study material (E6)

One content file per book, a "Material de estudio" book section, reading practices and guide questions, highlighted during the book's block.

## Phase 6 — Sync (E7, optional)

Sync between devices through an external free-tier service, only if needed.
