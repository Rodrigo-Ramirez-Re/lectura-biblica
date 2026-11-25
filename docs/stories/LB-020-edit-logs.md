---
id: LB-020
title: Edit and delete logs
epic: E3
status: done
phase: 2
depends_on: [LB-018]
---

# LB-020 — Edit and delete past reading logs

## Story

**As a** reader
**I want** to see what I logged in each block and correct or delete any log
**So that** my history is accurate even when I tapped the wrong thing days ago

## Context

[[product/spec#Log reading|spec §3]]: "Registrar días pasados y editar o borrar cualquier registro." Every number is computed from the logs ([[architecture/adr/0007-chapters-as-the-unit-of-progress|ADR 0007]]), so correcting a log updates passes and progress everywhere.

## Acceptance criteria

```gherkin
Feature: Logs

  Scenario: History of a block
    When I open a past or current block from Plan
    Then I see its book, dates, passes and every log with its day and chapters, newest first

  Scenario: Edit a log
    When I change a log to 5 chapters on another day of the block and save
    Then the log is updated and passes and progress reflect it

  Scenario: Delete a log
    When I delete a log and confirm
    Then it disappears and passes and progress reflect it

  Scenario: Invalid change
    When I set a day outside the block or in the future, or 0 chapters
    Then I'm told why and nothing changes
```

## Out of scope

Bulk edits; notes (LB-021).

## Technical notes

- Route `/plan/bloque/:blockId`; Plan rows of recorded blocks link there.
- After an edit or a delete, the chapters each log of the block covers are renumbered in date order, so ranges stay consecutive.

## Open questions

- [x] Renumbering — _Recommendation (adopted):_ yes, renumber `startChapter` of the block's logs in date order after every change; passes do not depend on it.

## Decisions

- Each recorded block has its page, `/plan/bloque/:blockId`, linked from its row on Plan: book, dates, passes and every log, newest first, with "Editar" (day within the block up to today, and amount) and "Borrar" (confirmed).
- After an edit or a delete the block's logs are renumbered in date order (logs of one day keep the order they were made), so the chapters each log covers stay consecutive; passes and progress never depended on it.
- `JournalWriter.saveLogs` writes edited logs by id.
- Local e2e runs use 2 workers: more made the three engines starve each other on a laptop; CI runs one.

## Definition of done

- [ ] All scenarios covered by tests (unit/component/e2e)
- [ ] Lint, boundaries, tests, build green
- [ ] `lb-review` passed
- [ ] Accessible (keyboard + axe) and i18n-marked
- [ ] Docs updated
