---
id: LB-035
title: Study material files, checked and compiled at build time
epic: E6
status: ready
phase: 5
depends_on: [LB-009]
---

# LB-035 — Study material files, checked and compiled at build time

## Story

**As the** owner
**I want** to write the study material of each book in a plain text file, in my own words, and have the build tell me exactly what is wrong with it
**So that** adding material for a book is writing one file and opening a PR, with no code to touch

## Context

[[product/spec#9. Roadmap|spec §9]], phase 5: notes and practices per book, one content file per book (`content/<bookId>.md` or JSON), shown on the book page. [[product/spec#10. Rights|spec §10]]: the material is written in the owner's own words (summaries, questions, practices), citing title and author, never copying passages from the source works or derived guides.

The app has no server: whatever it shows must be in the published site and in the offline cache. Markdown files must not reach the deploy output (CI's "Deploy output has no docs" check), so they are compiled to JSON when the app is built.

This story gives the owner the file format, the check and the authoring guide. Showing the material is LB-036 and LB-037. No study material is written by an agent: the folder starts empty, with a template.

## Acceptance criteria

```gherkin
Feature: Study material files

  Scenario: One file per book
    Given I write content/study/rut.md with the sections Resumen, Puntos clave, Preguntas guía, Prácticas de lectura and Fuentes
    When the app is built
    Then the published site has study/rut.json with that material and study/index.json lists "rut"

  Scenario: Sections are optional, but not all of them
    Given a file has only "Preguntas guía"
    Then it builds, and the other sections are empty
    But a file with no Resumen, Puntos clave, Preguntas guía or Prácticas de lectura fails the build

  Scenario: Sources cite title and author
    Given "Fuentes" has the item "El mensaje de Rut — Ana Pérez"
    Then the source has the title "El mensaje de Rut" and the author "Ana Pérez"
    And an item without an author fails the build with the file and line

  Scenario: Mistakes are reported precisely
    Given a file name that is not a book id, an unknown or repeated section, an empty section, text outside a list in a list section, HTML, Markdown links or bold, or a file over 30 kB
    When the app is built
    Then the build fails listing every problem as "content/study/<file>.md:<line> <message>"

  Scenario: No material yet
    Given content/study has only the template
    Then the build succeeds with study/index.json listing no books

  Scenario: Markdown never ships
    Then no .md file from content/ is in the deploy output
```

## Out of scope

- Showing the material (LB-036, LB-037).
- Writing the material itself: the owner does it, in their own words.
- Images, Bible text, links, or rich formatting.

## Technical notes

- `content/study/` is its own Nx project (`study-content`), so a change to a file marks the reader as affected and reruns its build, e2e and Lighthouse in CI. The compiler lives in `tools/study` (`type:tooling`), tested with Vitest like `tools/pages`.
- The reader's build depends on `study-content:compile`, which writes `dist/study/`; the build copies it to `study/` next to `index.html`.
- Compiled shape (the contract LB-036 reads): `index.json` = `{ "books": ["rut", …] }`; `<bookId>.json` = `{ "bookId", "summary": string[], "keyPoints": string[], "questions": string[], "practices": string[], "sources": { "title", "author" }[] }`.

## Open questions

- [ ] Markdown or JSON for authoring — _Recommendation:_ Markdown with a fixed set of `##` sections: prose is pleasant to write and review in Markdown and painful in JSON. The app reads JSON compiled from it, so it needs no Markdown parser.
- [ ] Which sections — _Recommendation:_ Resumen (paragraphs), Puntos clave, Preguntas guía, Prácticas de lectura and Fuentes (lists). They are what spec §1 and §9 name: summaries, key points ("to learn its key points", §2), questions and practices, plus the citation §10 requires.
- [ ] Formatting — _Recommendation:_ plain text only. HTML, links and bold fail the build instead of showing literally. Bible references are written as text ("Rut 1:16").
- [ ] Must every file cite a source — _Recommendation:_ no: "Fuentes" is optional, but every item needs a title and an author. Material may be entirely the owner's own reflection; the guide stresses citing whatever it is based on.
- [ ] A size limit — _Recommendation:_ 30 kB per file. Every file is cached for offline use, and that is several pages of text.

## Decisions

<Filled while implementing.>

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked — n/a (no UI)
- [ ] Works offline on the sub-path build — n/a (no UI)
- [ ] Docs updated (authoring guide, README)
