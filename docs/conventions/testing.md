# Testing (TDD)

## Cycle

Red → Green → Refactor. Write the failing test from a story's Gherkin scenario before the implementation.

## Pyramid

| Level       | Tool                             | Scope                                                                  | Where               |
| ----------- | -------------------------------- | ---------------------------------------------------------------------- | ------------------- |
| Unit        | Vitest                           | Entities, value objects, schedule and pass rules, use cases with fakes | domain, application |
| Component   | Vitest + Angular Testing Library | Components by user-visible behaviour (roles, labels), not internals    | ui / feature libs   |
| Integration | Vitest + `fake-indexeddb`        | IndexedDB adapters and backup round-trips                              | infrastructure libs |
| E2E         | Playwright + axe-core            | Gherkin scenarios end to end on the sub-path build, offline, a11y scan | `apps/reader-e2e`   |

## Runners

- **App:** Angular's official `@angular/build:unit-test` (Vitest).
- **Angular libs:** Vitest via `@analogjs/vitest-angular` (libs are intentionally non-buildable).
- **Framework-free libs (domain, application):** plain Vitest, `node` environment.

Every project also has a `typecheck` target (`tsc --noEmit` over lib/app and spec tsconfigs): the test runners strip types without checking them.

## Where checks run

| When         | What                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `git commit` | Prettier + ESLint on staged files; commitlint on the message                                                                            |
| `git push`   | `nx affected -t lint typecheck test` vs `origin/development`                                                                            |
| Every PR     | PR title + commits (commitlint); affected lint, typecheck, test, build, build-storybook, extract-i18n; e2e on Chromium, Firefox, WebKit |
| Push to main | Build and deploy to GitHub Pages                                                                                                        |

Quality-gate rules themselves are specified in `tools/quality` (`npx nx test quality`).

## Rules

- Test behaviour, not implementation. No testing private methods.
- No IndexedDB in unit/component tests — bind ports to fakes.
- "Today" comes from a fake `Clock`; never depend on the real date.
- Test names mirror scenarios: `it('shows the chapters due today in the active block')`.
- Every Gherkin scenario in a story maps to at least one test; reference the story ID in the `describe`.
- **Coverage gate (LB-034):** every project's `test` target measures coverage of its own source and fails below **90 % of statements, lines and functions** or **70 % of branches**. Specs, stories, `index.ts`, `testing/`, test setup and declaration files are not counted, nor entry points that only wire tested code (the app's `main.ts`, the `tools/pages` CLI scripts). Vitest projects use the shared preset `vitest.coverage.mjs` (in Nx's `sharedGlobals`, so changing it reruns every test); the reader app sets the same in its `project.json`. `tools/quality` checks every config resolves to the gate, and CI runs it on every PR.
- Reading a report: the text summary printed by `npx nx test <project>`, or `coverage/<project path>/index.html` (`coverage/reader` for the app). A drop means new code without a test: write the test, never lower the threshold.
