# Coding standards

## General

- English everywhere in code. UI copy in Spanish through i18n.
- TypeScript `strict`, no `any` (use `unknown` + narrowing).
- Names reveal intent; no abbreviations except well-known ones (`id`, `url`).
- Small functions, one level of abstraction each. Early returns over nesting.
- No dead code, no commented-out code, no `console.log` in committed code.

## Comments

Write a comment only when it adds what the code can't say: **why** something is done, a constraint, a workaround, a link to an ADR or external rule. Never narrate **what** the code does.

```ts
// ✗ Loop through the months and add one
// ✓ Psalms does not fit in one month at 3 chapters a day; a monthly block grows until one pass fits.
```

## SOLID in practice

- **S** — a use case does one thing; components are either presentational or smart, not both.
- **O** — extend via new adapters, order templates or book sections, not by adding `if` branches.
- **L** — adapters honour the port's contract (including error semantics).
- **I** — small ports per use (`ReadingLogReader` vs `ReadingLogWriter`), not one fat repository.
- **D** — features and use cases depend on ports; the app wires the adapters.

## DDD

- Entities guard their invariants in factories (`ReadingLog.create(...)` returns `Result`), not in the UI.
- Value objects are immutable and compared by value (`LocalDate`, `BookId`, `ChapterRange`).
- No anemic models: behaviour that belongs to a concept lives on it.
- Use the [[domain/ubiquitous-language|ubiquitous language]] in names.
- Errors are domain types (`InvalidBackup`, `BookNotFound`), mapped to UI messages at the edge.
- Time is a port (`Clock`) so "today" is testable; domain code never calls `new Date()`.

## Angular

- Standalone components, `ChangeDetectionStrategy.OnPush`, signals for state, zoneless.
- `inject()` over constructor injection.
- New control flow (`@if`, `@for`), `@defer` for heavy content below the fold.
- No business logic in templates or components — call use cases.
- Typed reactive forms.
- Routes lazy-loaded per feature.
- Browser APIs (`navigator.storage`, `indexedDB`, file download) only through injected adapters.

## i18n

- Every user-facing template text and attribute carries `i18n` / `i18n-<attr>` with a custom ID; lint fails otherwise ([[architecture/adr/0005-i18n|ADR 0005]]). In TS: `` $localize`:@@id:Texto` ``.
- IDs: `<context-or-area>.<screen>.<name>` in English, e.g. `reading.today.log-button`, `ui.update-banner.reload`.
- Dates and numbers go through Angular pipes in the es-MX locale.

## Files

- kebab-case filenames; one exported concept per file.
- Suffixes: `.entity.ts`, `.value-object.ts`, `.use-case.ts`, `.port.ts`, `.adapter.ts`, `.mapper.ts`, `.component.ts`, `.spec.ts`.
- Each lib exposes a public API through `index.ts` only.
