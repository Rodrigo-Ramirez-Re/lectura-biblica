# CLAUDE.md

Context for AI agents working in this repository. Humans: start at [README.md](README.md).

## Project

A free, installable, offline-first PWA to plan, log and analyse Bible reading. Each person builds their own way of reading (pace, order, duration per book, goals, cycles) and sees how they have progressed. Static site on GitHub Pages, data on the device. Product context lives in `docs/` — the brief is `docs/product/spec.md`.

## Working agreement (mandatory)

1. **No story, no code.** Every change maps to a story in `docs/stories/`.
2. Per story: **questions phase → code (TDD) → review with the `lb-review` skill → PR**. Do not start coding until the story's open questions are resolved. Tests come first, and every project keeps **≥ 90 % coverage** of statements, lines and functions (enforced by `nx test`, LB-034).
3. Do not assume — ask when the story or docs don't answer something.
4. **Batch mode:** when the owner asks for a set of stories, do not stop for open questions inside that range. Decide using the recommendation written in the story, record it in the story's `## Decisions` section, and report every decision made on the owner's behalf at the end (in Spanish).
5. **Data model changes** (`docs/architecture/data-model.md`) need an explicit decision in the story and a `schemaVersion` migration.

## Language

- Code, identifiers, commits, PRs, docs: **English**.
- UI copy: **Spanish (es-MX)** via Angular i18n — never hard-code user-facing strings without i18n markers.
- Conversation with the owner: Spanish.

## Git

- `main` = production (every push deploys to GitHub Pages), `development` = integration (default branch).
- Branch from `development`: `feat/LB-012-short-name`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`.
- Commit titles: Conventional Commits, scope = app or bounded context (`feat(reading): …`, `chore(repo): …`).
- **Never add `Co-Authored-By` or any attribution trailer** to commits or PRs.
- Feature description goes in the PR body (template in `.github/pull_request_template.md`): short and functional.
- Open PRs with `gh pr create` once CI-equivalent checks pass locally (include `e2e`). When every CI check is green on the PR's latest commit, squash-merge into `development`: `gh pr merge <n> --squash --delete-branch --match-head-commit <sha>`. **Never merge into `main`** — the owner does. Never bypass hooks with `--no-verify`.

## Architecture rules

- Clean Architecture + DDD, enforced by Nx module boundary tags. See `docs/architecture/overview.md`.
- `domain` libs: pure TypeScript, no Angular, no browser APIs.
- IndexedDB and other browser storage only inside `infrastructure` libs, behind ports defined in `domain`/`application`.
- Progress is measured in chapters read; passes, streaks and every metric are **computed**, never stored. Editing the plan never touches reading logs or notes.
- UI uses design tokens only (`docs/conventions/design-system.md`).
- Works fully offline: no CDN fonts, scripts or charts. Charts are hand-made SVG.

## Comments

Only explain what the code can't: intent, constraints, non-obvious decisions, workarounds. Never restate the code.

## Not shipped to production

`docs/`, `*.md`, `.claude/`, Storybook. Deploys publish only `dist/apps/reader/browser`.

## Public repository

The repo is public (GitHub Pages on the free plan requires it). Never commit personal data, tokens, keys or bank details — Git history keeps them forever.

## Commands

Always run tasks through Nx (`npx nx …`), never the underlying tools directly. See README for the full table.

- `npx nx affected -t lint typecheck test build` — before every PR
- `npx nx test <project>` / `npx nx lint <project>` / `npx nx typecheck <project>` / `npx nx e2e reader-e2e`
- `npx nx g @nx/angular:library libs/<context>/<layer> --name=<context>-<layer> --importPath=@lectura/<context>-<layer> --unitTestRunner=vitest-analog --tags="type:<layer>,scope:<context>"` — new Angular lib
- `npx nx g @nx/js:library libs/<context>/domain --name=<context>-domain --importPath=@lectura/<context>-domain --bundler=none --unitTestRunner=vitest --tags="type:domain,scope:<context>"` — new framework-free lib (set `module: esnext` in its tsconfig)
- After generating any project, add a `typecheck` target listing its tsconfigs (see `libs/shared/kernel/project.json`).

Agent shell notes: run Nx from `C:\dev\lectura-biblica` (uppercase drive letter) — with a lowercase `c:` working directory, Angular unit tests fail with "Vitest failed to find the runner". Node is managed by fnm; if `node` is missing, prefix commands with `fnm env --shell powershell | Out-String | Invoke-Expression;`. If `gh` is missing, reload PATH: `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")`.
