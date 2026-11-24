---
id: LB-009
title: Book catalog and book page
epic: E1
status: ready
phase: 1
depends_on: [LB-006]
---

# LB-009 — Book catalog and book page

## Story

**As a** reader
**I want** to browse the 66 books and open a page for each one
**So that** I can see its size and, later, my progress and study material on it

## Context

[[domain/ubiquitous-language|Ubiquitous language]] (Book, Testament, Book section), [[architecture/overview#Book page extension point|book page extension point]]. Names follow Reina-Valera (book names are not copyrighted; no Bible text is shown).

## Acceptance criteria

```gherkin
Feature: Book catalog

  Scenario: Complete catalog
    Then the catalog has 66 books: 39 in the Old Testament with 929 chapters and 27 in the New with 260,
      1,189 chapters in total, each with a unique id, Reina-Valera name, chapter count and canonical position

  Scenario: Browse
    When I open Libros
    Then I see the books grouped by testament in canonical order, each with its chapter count

  Scenario: Search
    When I type "jua" in the search field
    Then I see Juan, 1 Juan, 2 Juan and 3 Juan, ignoring accents and case ("genesis" finds Génesis)

  Scenario: Book page
    When I open /libros/abdias
    Then I see Abdías, Antiguo Testamento, 1 capítulo, libro 31 de 66

  Scenario: Unknown book
    When I open /libros/xyz
    Then I see "libro no encontrado" with a link to Libros

  Scenario: Extension point
    Given another context registers a book section
    Then the book page renders it below the book facts, in its declared order, without changes to the page
```

## Out of scope

Reading progress on the book page (LB-012 registers that section); study material (phase 5).

## Technical notes

- `libs/catalog/domain` (type:domain, scope:catalog): `Book`, `BookId`, `Testament`, `books.json`, `BookCatalog` (find, all, by testament), order templates `canonical` and `by-chapters` (fewest chapters first, ties in canonical order).
- `libs/catalog/feature-books` (type:feature): list + page; `BOOK_SECTIONS` multi-provider token exported for other contexts.
- Ids: lowercase ASCII, digits first for numbered books (`1samuel`, `2juan`, `cantares`).

## Open questions

- [x] Naming convention — Reina-Valera (owner, 2026-11-24): Abdías, Cantares, Hechos, Apocalipsis…

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated
