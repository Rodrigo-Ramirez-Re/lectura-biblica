---
id: LB-036
title: "Material de estudio" on the book page
epic: E6
status: ready
phase: 5
depends_on: [LB-035]
---

# LB-036 — "Material de estudio" on the book page

## Story

**As a** reader
**I want** to see the study material of a book on its page, even offline
**So that** I learn its key points while I read it

## Context

[[product/spec#9. Roadmap|spec §9]]: the material is shown on the book page. The page already renders the sections other contexts register through `BOOK_SECTIONS` ([[architecture/overview#Book page extension point|overview]]): "Tu lectura" (order 10) and "Notas" (order 20). Phase 5 "only adds content and a section".

This story creates the `study` context (`libs/study/domain`, `infrastructure`, `feature`), which may use `catalog` only. It reads what LB-035 compiles.

## Acceptance criteria

```gherkin
Feature: Study material on the book page

  Scenario: A book with material
    Given Rut has study material
    When I open the page of Rut
    Then a "Material de estudio" section shows, in this order, Resumen, Puntos clave, Preguntas guía and Prácticas de lectura
    And the sources, as "Título, de Autor"
    And sections the file leaves out are not shown

  Scenario: A book without material
    Given Génesis has no study material
    When I open its page
    Then no "Material de estudio" section, heading or message appears

  Scenario: Offline
    Given I opened the app once online
    When I open the page of Rut without connection
    Then its study material is shown

  Scenario: It fails to load
    Given Rut has study material but its file can't be read
    When I open the page of Rut
    Then the section says it couldn't be loaded and offers "Reintentar"

  Scenario: Accessible
    Then the section is a region named by its heading, its parts are headings and lists, and it passes axe in light and dark themes
```

## Out of scope

- Marking practices as done or answering questions in the app (would change the data model).
- Search, or a list of the books that have material.

## Technical notes

- Domain: `StudyMaterial` and the port `StudyLibrary` (`has(bookId)`, `load(bookId)`).
- Infrastructure: `FetchStudyLibrary` reads `study/index.json` once and `study/<bookId>.json` on demand, with relative URLs (sub-path). It checks the shape of what it reads and treats anything else as a failure.
- The service worker prefetches `/study/**` with the app, so material works offline from the first visit.
- The accessibility audit (LB-032) adds the book page with material (served by the test) to its screens.

## Open questions

- [ ] Where the section goes — _Recommendation:_ order 15, between "Tu lectura" and "Notas": what to read and learn first, then your own notes.
- [ ] What a book without material shows — _Recommendation:_ nothing. A "no material yet" message on 66 pages promises content that may never come.
- [ ] Offline strategy — _Recommendation:_ prefetch everything with the app. The files are small (≤ 30 kB each, LB-035), and a book's material should not need a visit while online first.
- [ ] Heading levels — _Recommendation:_ "Material de estudio" is an `h2`, like the other sections, and its parts are `h3`.

## Decisions

<Filled while implementing.>

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated (architecture overview, ubiquitous language)
