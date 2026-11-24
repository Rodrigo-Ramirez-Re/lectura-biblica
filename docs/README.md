# Lectura bíblica — docs

Obsidian-compatible vault (open the `docs/` folder as a vault). Never deployed.

## Product

- [[product/spec|Product spec]] — the brief
- [[product/backlog|Backlog]]
- [[stories/_template|Story template]]

## Architecture

- [[architecture/overview|Architecture overview]]
- [[architecture/data-model|Data model]]
- Decisions: [[architecture/adr/0001-monorepo-nx|0001 Nx workspace]] · [[architecture/adr/0002-static-pwa-on-github-pages|0002 Static PWA on GitHub Pages]] · [[architecture/adr/0003-local-first-indexeddb|0003 Local-first IndexedDB]] · [[architecture/adr/0004-branching-model|0004 Branching model]] · [[architecture/adr/0005-i18n|0005 i18n]] · [[architecture/adr/0006-quality-gates-with-branch-protection|0006 Quality gates]] · [[architecture/adr/0007-chapters-as-the-unit-of-progress|0007 Chapters as the unit of progress]]

## Operations

- [[operations/deploy|Deploy]] — GitHub Pages, repository settings

## Domain

- [[domain/ubiquitous-language|Ubiquitous language & bounded contexts]]

## Conventions

- [[conventions/git-workflow|Git workflow]]
- [[conventions/coding-standards|Coding standards]]
- [[conventions/testing|Testing (TDD)]]
- [[conventions/design-system|Design system]]

## Workflow per story

1. **Questions** — resolve every open question in the story file.
2. **Code** — TDD, on a branch from `development`.
3. **Review** — run the `lb-review` skill (`.claude/skills/lb-review`).
4. **PR** — into `development`, description from the template.
5. Update the story `status` in its frontmatter.
