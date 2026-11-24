---
name: lb-review
description: Review the current branch of lectura-biblica against its user story and the project's architecture, DDD, TDD, SOLID, design-system, PWA/offline, data-safety, accessibility, i18n and git rules. Use before opening a PR or when asked to review a story's implementation.
---

# LB review

Review the changes on the current branch versus `development` for the story in the branch name (`<type>/LB-<id>-…`).

## Steps

1. Identify the story: parse the ID from the branch, read `docs/stories/LB-<id>-*.md`.
2. Get the diff: `git diff development...HEAD` and `git log development..HEAD --format=%s%n%b`.
3. Read the changed files in full where needed for context.
4. Check each principle below, in order. Story fit comes first: perfect code that solves the wrong thing fails.
5. Run `npx nx affected -t lint typecheck test build --base=development` and report results.
6. Output the report in the format at the end. Do not modify code unless asked.

## Principles

### 1. Story fit

- Every Gherkin scenario is implemented **and** covered by at least one test (map scenario → test).
- Nothing outside the story's scope was added (no gold-plating, no unrelated refactors).
- All open questions in the story are resolved; decisions recorded under `## Decisions`; frontmatter status updated.

### 2. Clean Architecture

- Dependencies point inward: domain ← application ← infrastructure / feature ← app.
- `domain` libs import no `@angular/*`, `rxjs`, `idb`, or browser APIs (`window`, `indexedDB`, `navigator`, `Date.now()` for "today").
- IndexedDB and browser storage appear only in `infrastructure` libs, behind ports declared in domain/application.
- Ports bound to adapters only in app config. Lib public APIs go through `index.ts`.

### 3. DDD

- Names follow `docs/domain/ubiquitous-language.md`; new terms are added there.
- Entities enforce invariants in factories; no invalid object can be constructed.
- Value objects immutable, compared by value. No primitive obsession for dates (`LocalDate`), book ids, chapter ranges.
- No anemic models; no cross-context reach-ins beyond the exceptions in `docs/architecture/overview.md`.

### 4. Data safety

- Nothing derived (passes, progress, streaks, metrics) is persisted; it is computed from logs + plan.
- Editing the plan never modifies logs or notes.
- Any change to the stored shape bumps `schemaVersion`, adds a migration and a test importing a previous-version backup; `docs/architecture/data-model.md` updated.
- Dates are local `YYYY-MM-DD`; no timezone-dependent day arithmetic.
- Imports are validated and atomic; a rejected import leaves data untouched.

### 5. TDD & tests

- Tests describe behaviour (user-visible or domain rules), not implementation details.
- Unit tests use in-memory fakes and a fake `Clock`; adapters tested with `fake-indexeddb`.
- Edge and error cases covered (one-chapter books, wrapping ranges, month ends, leap years), not just the happy path.

### 6. SOLID & clean code

- Single responsibility per class/function/component; presentational vs smart separation.
- Small, intention-revealing names; no dead or commented-out code; no `any`.
- No duplication that should be an abstraction — and no premature abstraction either.

### 7. Angular

- Standalone, OnPush, signals, `inject()`, new control flow, typed forms, lazy routes, zoneless.
- No business logic in templates/components. Subscriptions cleaned up (or none, via signals).

### 8. PWA & offline

- No request leaves the app's origin and sub-path: no CDN fonts, scripts or images.
- Every URL is relative to the base href; nothing assumes the site root.
- New assets are covered by `ngsw-config.json`; updates are never activated without the person's click.

### 9. Design system

- Only semantic tokens/utilities; no raw hex, px values or primitives outside `ui-tokens`.
- Works in light and dark; never relies on colour alone.
- Reuses existing components before creating new ones; new components have a Storybook story.
- UI libs contain no services or domain logic.

### 10. Security & privacy

- No personal data collected, no trackers, no secrets, tokens or bank details committed (public repo).
- Imported files treated as untrusted input; user text rendered as text, never as HTML.

### 11. Accessibility, i18n, performance

- Semantic HTML, labels, focus management, contrast, touch targets ≥ 44 px; axe clean.
- All user-facing strings have i18n markers with custom IDs; Spanish source text correct.
- Bundle within budget; heavy screens lazy-loaded.

### 12. Comments & docs

- Comments explain only _why_ / constraints / workarounds — flag any that restate the code.
- ADR added for any significant decision; CLAUDE.md/README updated if commands or conventions changed.

### 13. Git & PR

- Branch name `<type>/LB-<id>-<kebab>` from `development`.
- Commit titles are Conventional Commits with a valid scope; **no `Co-Authored-By` or attribution trailers**.
- PR description follows `.github/pull_request_template.md` and describes the functionality.
- No docs-only/dev-only files leak into build output.

## Report format

```
## LB review — LB-<id> <title>
Verdict: ✅ Ready | ⚠️ Ready with fixes | ❌ Changes required

### Scenario coverage
| Scenario | Implemented | Test |
|---|---|---|

### Findings
🔴 Blocker / 🟠 Major / 🟡 Minor / 🔵 Suggestion — `path:line` — principle # — what and why — suggested fix

### Checks
lint · typecheck · test · build · boundaries — pass/fail with output excerpt on failure
```
