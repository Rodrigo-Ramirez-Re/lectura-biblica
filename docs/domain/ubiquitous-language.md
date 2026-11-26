# Ubiquitous language & bounded contexts

Code uses the **English** term; the UI shows the **Spanish** one.

| English (code)  | Spanish (UI)             | Definition                                                                                                                                                                                                |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Book            | Libro                    | One of the 66 books of the Protestant canon, with id, Reina-Valera name, chapter count, testament and canonical position. Fixed reference data.                                                           |
| Testament       | Testamento               | `old` (Antiguo, 39 books, 929 chapters) or `new` (Nuevo, 27 books, 260 chapters).                                                                                                                         |
| Book order      | Orden de los libros      | The sequence in which a plan goes through the books. Built from an order template or by hand.                                                                                                             |
| Order template  | Orden sugerido           | A ready-made ordering: `by-chapters` (fewest to most chapters, ties in canonical order), `canonical`, …                                                                                                   |
| Reading plan    | Plan de lectura          | How a person reads: start date, pace, rest days, book order, excluded books, block duration, cycles. Editable at any time.                                                                                |
| Pace            | Ritmo                    | Chapters per day (default 3).                                                                                                                                                                             |
| Rest day        | Día de descanso          | A weekday with no reading expected.                                                                                                                                                                       |
| Plan template   | Plantilla                | A reusable plan. _Un libro al mes_ is the default one.                                                                                                                                                    |
| Block           | Bloque                   | The period devoted to one book (e.g. December for Abdías). Recorded when it starts; future blocks are projected from the plan.                                                                            |
| Block duration  | Duración                 | How long a block lasts: a calendar month by default; weeks, days or a number of passes later. A monthly block grows by whole months until one pass fits at the plan's pace.                               |
| Cycle           | Ciclo                    | One journey through every included book. Can be repeated without losing history.                                                                                                                          |
| Schedule        | Calendario del plan      | The blocks of the current cycle: recorded ones plus the projection of what is to come.                                                                                                                    |
| Reading log     | Registro de lectura      | The only recorded fact: on a day, N consecutive chapters of a book starting at a chapter (wrapping after the last one).                                                                                   |
| Pass            | Pasada / vuelta          | One complete read of a book. Passes = chapters read ÷ chapters of the book; the fraction is the current pass's progress.                                                                                  |
| Due today       | Lectura de hoy           | The chapters the plan expects today in the active block, minus what is already logged today.                                                                                                              |
| Block status    | Estado del bloque        | `active`, `done`, `skipped` (Saltado: counts as read in its cycle), `paused` (En pausa) and `replaced` (Cambiado): the book of a paused or replaced block returns to the queue.                           |
| Pause           | Pausa                    | The plan stops on a day: no block runs and none starts until it resumes; the paused book starts again with a full block.                                                                                  |
| Note            | Nota                     | Free text about what was understood, attached to a block or a book.                                                                                                                                       |
| Backup reminder | Recordatorio de respaldo | A card on Hoy asking to export a backup: after logs on 7 days with none ever made, or once the chosen interval (7, 14, 30 or 90 days, or never) has passed since the last one with readings logged since. |
| Postponement    | Ahora no                 | Hides the backup reminder for 7 days, across restarts.                                                                                                                                                    |
| Backup          | Respaldo                 | JSON file with the whole dataset and its `schemaVersion`.                                                                                                                                                 |
| Book section    | Sección de la ficha      | A panel on the book page contributed by a context (reading progress now; study material in phase 5).                                                                                                      |

## Bounded contexts

See [[architecture/overview#Layers (Clean Architecture)|overview]] for the dependency rules between contexts.

| Context    | Owns                                                     | Phase |
| ---------- | -------------------------------------------------------- | ----- |
| `catalog`  | Book, Testament, Order template                          | 1     |
| `reading`  | Reading plan, Block, Schedule, Reading log, Note, Backup | 1     |
| `insights` | Metrics                                                  | 3     |
| `study`    | Study material                                           | 5     |
