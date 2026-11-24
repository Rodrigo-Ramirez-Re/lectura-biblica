# Git workflow

See [[architecture/adr/0004-branching-model|ADR 0004]] for the rationale and [[architecture/adr/0006-quality-gates-with-branch-protection|ADR 0006]] for how rules are enforced.

## Branches

| Branch                  | Purpose                       | Receives PRs from  |
| ----------------------- | ----------------------------- | ------------------ |
| `main`                  | Production (deploys to Pages) | `development` only |
| `development`           | Integration (default)         | work branches      |
| `<type>/LB-<id>-<name>` | One story                     | —                  |

Example: `feat/LB-012-today-log`.

## Commits — Conventional Commits

```
<type>(<scope>): <imperative summary, lowercase, no period>
```

- **types:** `feat` `fix` `refactor` `test` `docs` `style` `perf` `build` `ci` `chore` `revert`
- **scopes (required):** the app (`reader`), a bounded context (`catalog`, `reading`, `insights`, `study`), `shared` (shared kernel/util), `ui`, `pwa`, `deps`, `repo`. The list lives in `commitlint.config.mjs`; change both together.
- Breaking change: `feat(reading)!: …` + `BREAKING CHANGE:` footer
- **No `Co-Authored-By` or "Generated with" attribution lines. Ever.** commitlint rejects them.

## Hooks

Installed by `npm install` (husky `prepare` script).

| Hook         | Runs                                                         |
| ------------ | ------------------------------------------------------------ |
| `pre-commit` | Prettier + ESLint on staged files (lint-staged)              |
| `commit-msg` | commitlint                                                   |
| `pre-push`   | `nx affected -t lint typecheck test` vs `origin/development` |

Hooks run in Git's `sh`, so `node` must be on its PATH. With fnm, add to `~/.config/husky/init.sh`:

```sh
eval "$(fnm env)"
```

## Pull requests

- Title: Conventional Commit format — it becomes the squash commit, and CI lints it.
- Body: `.github/pull_request_template.md` — short and functional; the detail lives in the story.
- Merge into `development`: **squash**. Merge `development` → `main`: **merge commit**.
- Merge only with CI green and `lb-review` run. Branch protection requires the CI check.
- Who merges: the agent squash-merges story PRs into `development` once CI is green; the owner merges `development` → `main`, which deploys.

## Releases

Tag after merging into `main`: `reader@1.0.0`.
