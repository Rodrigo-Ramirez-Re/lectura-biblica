# Data model

Version 1. The plan (editable), the history (blocks and reading logs, never lost) and notes are separate. **Nothing derived is stored**: passes, progress, streaks and every metric are computed from logs + plan, so correcting a past day updates everything.

Changing this model needs a decision in a story and a `schemaVersion` migration ([[architecture/adr/0007-chapters-as-the-unit-of-progress|ADR 0007]]).

## Backup document

The JSON export is the whole dataset. IndexedDB stores the same records, one object store per collection.

```json
{
  "schemaVersion": 1,
  "app": "lectura-biblica",
  "exportedAt": "2026-12-03T21:15:00.000Z",
  "settings": { "lastBackupAt": null },
  "plan": {
    "name": "Un libro al mes",
    "startDate": "2026-12-01",
    "chaptersPerDay": 3,
    "restDays": [],
    "bookOrder": ["abdias", "filemon", "2juan", "3juan", "judas", "hageo"],
    "excluded": [],
    "defaultBlock": { "unit": "month", "value": 1 },
    "cyclesTarget": null
  },
  "blocks": [
    {
      "id": "b_01",
      "cycle": 1,
      "bookId": "abdias",
      "start": "2026-12-01",
      "end": "2026-12-31",
      "goalPasses": null,
      "status": "active"
    }
  ],
  "logs": [
    {
      "id": "l_01",
      "date": "2026-12-03",
      "blockId": "b_01",
      "bookId": "abdias",
      "startChapter": 1,
      "chaptersRead": 3
    }
  ],
  "notes": []
}
```

## Rules

- **Dates** are local calendar days `YYYY-MM-DD` (`LocalDate`), never timestamps, so a day never shifts with the time zone. Only `exportedAt` is an instant.
- **Passes** over a book = Σ `chaptersRead` of its logs ÷ the book's chapters. One-chapter books are read several times a day this way.
- **Ranges:** a log covers `chaptersRead` consecutive chapters from `startChapter`, wrapping to chapter 1 after the last one (Abdías 1 ×3 is `startChapter: 1, chaptersRead: 3`).
- **Blocks** are created when they start; future blocks are projected from the plan, not stored. Editing the plan therefore only changes what is still to come.
- Changing the plan or reordering books never modifies `logs` or `notes`.
- **Ids** are random strings generated on the device.
- **Import** validates the whole document, migrates older `schemaVersion`s, and replaces the data in one transaction — or rejects the file with a clear message and leaves current data untouched.

## Differences from the brief

- `chaptersPerDay` and `restDays` moved from `settings` into `plan`: they define how one reads, and plan templates (phase 2) must carry them.
- `startDate` added to `plan`: the schedule is projected from it.
- `startChapter` added to logs: the brief asks to record which chapters were read.
- `bookId` added to notes: notes may belong to a book, not only to a block.
- `app` added to the document to reject backups of other apps.
- `theme` moved out of `settings` and out of backups (LB-006): it is a per-device preference kept in `localStorage` under `lectura-biblica.theme`, read synchronously before the first paint so a forced theme never flashes.
