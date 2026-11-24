---
id: LB-017
title: Book order
epic: E3
status: ready
phase: 2
depends_on: [LB-015]
---

# LB-017 — Order of the books: templates, reorder by hand, include or exclude

## Story

**As a** reader
**I want** to choose the order of the books from a template or by hand, and leave out books I don't want in this journey
**So that** I read the Bible in the sequence that makes sense to me

## Context

[[product/spec#Configure how to read|spec §3]]: "plantillas (menor a mayor, canónico, otras) y orden personalizado reordenando a mano. Incluir o excluir libros." The order only affects the books still to come in the cycle.

## Acceptance criteria

```gherkin
Feature: Book order

  Scenario: Order templates
    When I apply "De menor a mayor", "Canónico" or "Nuevo Testamento primero" in the editor and save
    Then the upcoming blocks follow that order

  Scenario: Reorder by hand
    When I move Romanos up with its "Subir" button
    Then it moves one place earlier, and a screen reader announces its new position

  Scenario: Exclude a book
    When I uncheck Cantares and save
    Then Cantares disappears from the upcoming blocks, and the cycle is one book shorter

  Scenario: Books already read keep their place
    Given Abdías and Filemón are done in this cycle
    When I change the order
    Then they stay where they were and only the upcoming blocks change

  Scenario: At least one book
    When I exclude every book
    Then I cannot save and I'm told why
```

## Out of scope

Choosing another book for the current block (LB-018).

## Technical notes

- Catalog domain: order template `new-testament-first` (New Testament then Old, canonical inside each).
- The editor's order section edits the draft's `bookOrder` and `excluded`.

## Open questions

- [ ] Drag and drop — _Recommendation:_ "Subir" / "Bajar" buttons only: accessible with keyboard and screen readers, and fine on a phone. Drag can come later.

## Decisions

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
