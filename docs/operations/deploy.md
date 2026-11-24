# Deploy

The app is published at **https://rodrigo-ramirez-re.github.io/lectura-biblica/** by `.github/workflows/pages.yml` on every push to `main` ([[architecture/adr/0002-static-pwa-on-github-pages|ADR 0002]]).

## Release

1. Open a PR `development` → `main` titled `chore(repo): release reader@x.y.z`.
2. When CI is green, the owner merges it (merge commit).
3. The Pages workflow builds with `--base-href /lectura-biblica/` and deploys `dist/apps/reader/browser`.
4. Tag the merge commit: `git tag reader@x.y.z && git push --tags`.

## Checks after a release

- Open the URL above (not the root of a local server).
- A device with the previous version shows "Hay una versión nueva"; after reloading, the data is still there.
- Offline (airplane mode) the installed app opens and logs reading.

## One-time repository setup

Already applied when the repo was created; listed to rebuild it if needed.

- Public repository, default branch `development`.
- Merge options: squash and merge commit on, rebase off, delete head branches on.
- Settings → Pages → Source: **GitHub Actions**.
- Environment `github-pages`: deployments allowed from `main`.
- Branch protection on `development` and `main` ([[architecture/adr/0006-quality-gates-with-branch-protection|ADR 0006]]).
