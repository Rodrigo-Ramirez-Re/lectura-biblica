---
id: LB-037
title: Study material on Hoy while its book is being read
epic: E6
status: ready
phase: 5
depends_on: [LB-036, LB-012]
---

# LB-037 — Study material on Hoy while its book is being read

## Story

**As a** reader
**I want** Hoy to bring up the study material of the book I am reading, with one guide question for the day
**So that** I study the book during its month, not only when I remember to open its page

## Context

[[product/spec#9. Roadmap|spec §9]]: the material is shown "especially during the month it is read". Hoy is the screen opened every day (LB-012) and knows the current block. It belongs to the `reading` context, which may not depend on `study`. So Hoy gets an extension point like the book page's: sections for the book being read, registered by other contexts.

## Acceptance criteria

```gherkin
Feature: Study material on Hoy

  Scenario: The book being read has material
    Given the current block is Rut, which has study material with guide questions
    When I open Hoy
    Then a "Material de estudio" card shows "Pregunta para hoy" with one of its guide questions
    And a link "Ver el material de Rut" opens the page of Rut

  Scenario: A different question each day
    Given Rut has 3 guide questions and its block started on October 1
    Then October 1 shows the first question, October 2 the second, October 3 the third and October 4 the first again

  Scenario: Material without questions
    Given Rut has material but no guide questions
    Then the card shows only the link to the material

  Scenario: Nothing to highlight
    Given there is no current block, the plan is paused, or the current book has no material
    Then no study card appears on Hoy

  Scenario: Accessible
    Then the card is a region named by its heading and passes axe in light and dark themes
```

## Out of scope

- Answering the question or marking it done in the app (use Notas).
- Highlighting material for a book that is not the current block's.

## Technical notes

- New token `CURRENT_BOOK_SECTIONS` in `libs/catalog/util-book-sections`, with the same `{ order, load }` shape as `BOOK_SECTIONS`. Hoy renders the sections with the inputs `bookId` and `blockDay` (1 on the block's first day).
- The study feature registers the card; the app wires it, like the book page sections.

## Open questions

- [ ] What Hoy shows — _Recommendation:_ one guide question a day plus a link to the whole material. A question is short enough for a daily screen and invites reflection; the summary or the full lists would push the reading itself down.
- [ ] Which question — _Recommendation:_ in order, by the day of the block (`(blockDay − 1) mod count`), so the month goes through all of them and every reader on the same day of the block sees the same one.
- [ ] Where on Hoy — _Recommendation:_ after the book's progress and before its notes: logging and progress stay first, and the question sits next to where you write what you understood.
- [ ] Can it be hidden — _Recommendation:_ no. It shows only while the book has material, and it is content, not a notice.

## Decisions

<Filled while implementing.>

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Works offline on the sub-path build
- [ ] Docs updated (ubiquitous language)
