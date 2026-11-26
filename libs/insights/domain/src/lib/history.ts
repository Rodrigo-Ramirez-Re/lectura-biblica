import type { BookCatalog } from '@lectura/catalog-domain';
import type { BlockRecord, Journal } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';

/** A block's goal, judged on the month the block ends. */
export interface GoalOutcome {
  readonly kind: 'met' | 'missed' | 'in-progress';
  readonly goal: number;
  /** Passes read in the whole block. */
  readonly passes: number;
}

export interface MonthBook {
  readonly bookId: string;
  readonly bookName: string;
  /** Chapters of the book read that month. */
  readonly chapters: number;
  /** Those chapters as passes over the book. */
  readonly passes: number;
  readonly goal: GoalOutcome | null;
  /** Notes written about the book that month. */
  readonly notes: number;
}

export interface HistoryMonth {
  readonly year: number;
  readonly month: number;
  readonly chapters: number;
  readonly books: readonly MonthBook[];
}

const monthOf = (iso: string) => iso.slice(0, 7);

/**
 * "¿Qué pasó cada mes?" (LB-028): every calendar month with something read or a block that ran,
 * newest first. A book appears in each month its blocks cover, with what was read in that month.
 */
export function monthlyHistory(
  journal: Journal,
  catalog: BookCatalog,
  today: LocalDate,
): HistoryMonth[] {
  if (!journal.logs.length) return [];
  const todayIso = today.toString();
  const months = new Map<string, Map<string, BlockRecord[]>>();
  const add = (month: string, block: BlockRecord) => {
    const books = months.get(month) ?? new Map<string, BlockRecord[]>();
    books.set(block.bookId, [...(books.get(block.bookId) ?? []), block]);
    months.set(month, books);
  };
  for (const block of [...journal.blocks].sort((a, b) => a.start.localeCompare(b.start))) {
    const last = block.end < todayIso ? block.end : todayIso;
    for (let month = monthOf(block.start); month <= monthOf(last); month = nextMonth(month))
      add(month, block);
  }

  return [...months.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, books]) => {
      const entries = [...books.entries()].flatMap(([bookId, blocks]) => {
        const book = catalog.find(bookId);
        if (!book) return [];
        const ids = new Set(blocks.map((block) => block.id));
        const chapters = journal.logs
          .filter((log) => ids.has(log.blockId) && monthOf(log.date) === key)
          .reduce((sum, log) => sum + log.chaptersRead, 0);
        const ending = blocks.filter((block) => monthOf(block.end) === key).at(-1);
        return [
          {
            bookId,
            bookName: book.name,
            chapters,
            passes: chapters / book.chapters,
            goal: ending ? goalOf(ending, journal, book.chapters) : null,
            notes: journal.notes.filter(
              (note) => note.bookId === bookId && monthOf(note.date) === key,
            ).length,
          },
        ];
      });
      return {
        year: Number(key.slice(0, 4)),
        month: Number(key.slice(5, 7)),
        chapters: entries.reduce((sum, entry) => sum + entry.chapters, 0),
        books: entries,
      };
    });
}

function goalOf(block: BlockRecord, journal: Journal, chapters: number): GoalOutcome | null {
  if (block.goalPasses === null) return null;
  const read = journal.logs
    .filter((log) => log.blockId === block.id)
    .reduce((sum, log) => sum + log.chaptersRead, 0);
  const passes = read / chapters;
  const kind =
    passes >= block.goalPasses ? 'met' : block.status === 'active' ? 'in-progress' : 'missed';
  return { kind, goal: block.goalPasses, passes };
}

function nextMonth(month: string): string {
  const [year, value] = month.split('-').map(Number);
  return LocalDate.of(year ?? 0, value ?? 1, 1)
    .firstOfNextMonth()
    .toString()
    .slice(0, 7);
}

/** Excel only keeps the accents of a CSV that starts with a byte order mark. */
const BOM = '\uFEFF';

function field(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The whole history as CSV, one row per reading log, oldest first (LB-028): Spanish headers and
 * book names, comma-separated, CRLF line ends. `hasta` wraps like a log's range (data model).
 */
export function historyCsv(journal: Journal, catalog: BookCatalog): string {
  const cycles = new Map(journal.blocks.map((block) => [block.id, block.cycle]));
  const rows = [...journal.logs]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((log) => {
      const book = catalog.find(log.bookId);
      const chapters = book?.chapters ?? 1;
      const to = ((log.startChapter - 1 + log.chaptersRead - 1) % chapters) + 1;
      return [
        log.date,
        book?.name ?? log.bookId,
        log.startChapter,
        to,
        log.chaptersRead,
        cycles.get(log.blockId) ?? '',
      ];
    });
  return (
    BOM +
    [['fecha', 'libro', 'desde', 'hasta', 'capitulos', 'ciclo'], ...rows]
      .map((row) => row.map(field).join(',') + '\r\n')
      .join('')
  );
}

export function historyFileName(today: LocalDate): string {
  return `lectura-biblica-historial-${today.toString()}.csv`;
}
