# Architecture overview

## System

```
 reader ──▶ https://<user>.github.io/lectura-biblica/   (GitHub Pages, static files)
              │
              ├─ Angular SPA (client-rendered)
              ├─ Angular service worker: caches the whole app, offline, update notice
              └─ IndexedDB on the device: plan, blocks, reading logs, notes, settings
                    ▲
                    └─ JSON backup export / import (the only way data leaves the device in v1)
```

No server, no accounts, no network calls at runtime. A sync adapter can be added later behind the same ports ([[architecture/adr/0003-local-first-indexeddb|ADR 0003]]).

## Layers (Clean Architecture)

Dependencies point inward only. Enforced with Nx tags + `@nx/enforce-module-boundaries`.

| Layer              | Nx tag                | Contains                                                             | May depend on                 |
| ------------------ | --------------------- | -------------------------------------------------------------------- | ----------------------------- |
| Domain             | `type:domain`         | Entities, value objects, domain services, repository **ports**       | `type:domain`                 |
| Application        | `type:application`    | Use cases, DTOs, application ports                                   | domain, util                  |
| Infrastructure     | `type:infrastructure` | IndexedDB adapters implementing ports, mappers, backup file handling | domain, application, util     |
| UI (design system) | `type:ui`             | Tokens, presentational components — no business logic                | ui, util                      |
| Feature            | `type:feature`        | Pages, smart components, route definitions                           | application, ui, domain, util |
| App                | `type:app`            | Bootstrapping, DI wiring (port → adapter), routing shell, PWA setup  | everything                    |
| Util               | `type:util`           | Pure helpers                                                         | util                          |
| E2E                | `type:e2e`            | Playwright suites (`apps/*-e2e`)                                     | util                          |
| Tooling            | `type:tooling`        | Workspace specs and scripts (`tools/*`)                              | nothing                       |

Domain libs may not import `@angular/*`, `rxjs`, `idb` or browser storage APIs. Only `type:infrastructure` libs may import `idb`.

Each lib also gets a `scope:` tag. A context may depend only on itself and `scope:shared`, except the explicit exceptions below; the app (`scope:reader`) may depend on any scope.

| Context    | Owns                                                    | May also use         | Phase |
| ---------- | ------------------------------------------------------- | -------------------- | ----- |
| `catalog`  | Book, canonical order, testament (fixed reference data) | —                    | 1     |
| `reading`  | Reading plan, Block, Reading log, Note, Pass, Backup    | `catalog`            | 1     |
| `insights` | Metrics computed from the reading log and the plan      | `catalog`, `reading` | 3     |
| `study`    | Study material per book                                 | `catalog`            | 5     |

Rules live in the root `eslint.config.mjs`; their behaviour is specified in `tools/quality`.

## Lib layout

```
libs/
  shared/
    kernel/            type:domain   Result, LocalDate, ids
    util-i18n/         type:util     Spanish locale providers
  catalog/
    domain/            the 66 books (books.json) and ordering
    feature-books/     book list and book page (extensible sections)
  reading/
    domain/ application/ infrastructure/ feature-*/
  insights/
    domain/            metrics computed from the journal (nothing stored)
    application/       GetInsights
    feature/           the Avance page
  ui/
    tokens/            CSS variables + Tailwind theme (light / dark)
    components/        design system components, charts (hand-drawn SVG + table)
    layout/            app shell: header, tab bar
```

## Dependency injection

Ports are `InjectionToken`s (or abstract classes) declared in `domain`/`application`. The app binds them to IndexedDB adapters in `app.config.ts`. Tests bind them to in-memory fakes; adapters are tested against `fake-indexeddb`.

## Book page extension point

The book page renders an ordered list of **book sections** registered through a multi-provider token (`BOOK_SECTIONS`, in `libs/catalog/util-book-sections`). Each section is `{ order, load }`, where `load` dynamically imports its component, so a section ships with its own lazy feature. Phase 1 registers "Tu lectura" (reading context); the study module (phase 5) adds its own section without touching the page.
