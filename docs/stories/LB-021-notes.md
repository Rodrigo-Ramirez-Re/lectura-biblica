---
id: LB-021
title: Notes
epic: E3
status: done
phase: 2
depends_on: [LB-020]
---

# LB-021 — Notes about what I understood

## Story

**As a** reader
**I want** to write down what I understood and the key points of the book I'm reading
**So that** I keep what I learned and find it again on the book's page

## Context

[[product/spec#Log reading|spec §3]]: "Una nota por libro o por lectura sobre lo que se entendió y los puntos importantes."

## Acceptance criteria

```gherkin
Feature: Notes

  Scenario: Write a note while reading
    When I write a note on Hoy and save it
    Then it is kept with today's date, the current book and block

  Scenario: Notes on the book page
    When I open a book's page
    Then a "Tus notas" section lists every note of that book, newest first, with its date

  Scenario: Edit or delete a note
    When I edit a note's text or delete it after confirming
    Then the change is kept

  Scenario: Empty note
    When I try to save an empty note
    Then nothing is saved and I'm told it is empty

  Scenario: Notes are text
    When a note contains HTML or line breaks
    Then it is shown as plain text, keeping its line breaks
```

## Out of scope

Rich text, notes per chapter, sharing notes.

## Technical notes

- `JournalWriter`: `saveNote`, `removeNote`. Notes have `blockId` when written during a block.
- The book page section registers through `BOOK_SECTIONS` like "Tu lectura".

## Open questions

- [x] Several notes per book — _Recommendation (adopted):_ yes, any number; each with its date.

## Decisions

- One component, "Tus notas", on Hoy (with a field to write about the book being read) and as a book page section registered through `BOOK_SECTIONS` (list, edit, delete with confirmation).
- A note keeps its text as written, trimmed, up to 5,000 characters; empty notes are refused. Notes written on Hoy carry the date, the book and the current block.
- Notes are rendered as text with `white-space: pre-line`, so line breaks show and HTML never runs.
- `JournalWriter` gained `saveNote` and `removeNote`.

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
