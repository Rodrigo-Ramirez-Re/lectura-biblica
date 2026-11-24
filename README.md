# Lectura bíblica

A free PWA to plan, log and analyse Bible reading. Each person decides how to read — chapters per day, order of the books, how long to stay on each book, goals and cycles — logs what they read and sees how they are progressing. Installable, works offline, data stays on the device.

Working name: the app's display name comes from `apps/reader/src/config.json`, so renaming it is a config change.

## Roadmap

| Phase | Scope                                                                                      |
| ----- | ------------------------------------------------------------------------------------------ |
| 1     | MVP: book catalog, default plan, daily log, local storage, backup, installable and offline |
| 2     | Flexibility: full plan editor, templates, past-log editing, notes                          |
| 3     | Insights: the seven progress metrics with charts, tables and CSV export                    |
| 4     | Support and polish: donation link, install help, accessibility and Lighthouse              |
| 5     | Study material per book                                                                    |
| 6     | Optional sync between devices                                                              |

## Stack

Angular (Nx monorepo) · Angular service worker · IndexedDB · Tailwind CSS · Vitest · Playwright · Storybook · GitHub Pages

## Repository layout

```
apps/reader        The PWA
apps/reader-e2e    Playwright suites (run against the GitHub Pages sub-path)
libs/              Domain, application, infrastructure, UI and feature libraries
tools/             Workspace quality specs and scripts
docs/              Spec, stories, ADRs (Obsidian vault — never deployed)
```

See [docs/README.md](docs/README.md) for architecture, conventions and the backlog.
