import type { BookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import type { BlockRecord, PlanRecord } from './journal';
import { chaptersBetween, type Pace } from './pace';

/** A block of the schedule: recorded once it started, projected while still to come. */
export interface ScheduledBlock {
  readonly bookId: string;
  readonly cycle: number;
  readonly start: LocalDate;
  readonly end: LocalDate;
  /** Set when the block is recorded. */
  readonly id: string | null;
}

const date = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

/**
 * A monthly block runs to the end of its calendar month and grows by whole months until one pass
 * of the book fits at the plan's pace (rest days read nothing). At 3 a day only Salmos needs it
 * (150 chapters, 50 days), which is why the default cycle lasts 67 months for 66 books.
 */
export function monthlyBlockEnd(start: LocalDate, chapters: number, pace: Pace) {
  let end = start.endOfMonth();
  while (chaptersBetween(pace, start, end) < chapters) end = end.plusDays(1).endOfMonth();
  return end;
}

/**
 * The first cycle: recorded blocks as they happened, then the rest of the plan's order projected
 * from the day after the last recorded block. Editing the plan only changes the projection.
 */
export function projectSchedule(
  plan: PlanRecord,
  recorded: readonly BlockRecord[],
  catalog: BookCatalog,
): ScheduledBlock[] {
  const past: ScheduledBlock[] = [...recorded]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((block) => ({
      bookId: block.bookId,
      cycle: block.cycle,
      start: date(block.start),
      end: date(block.end),
      id: block.id,
    }));

  const done = new Set(past.map((block) => block.bookId));
  let start = past.length ? past[past.length - 1].end.plusDays(1) : date(plan.startDate);
  const upcoming: ScheduledBlock[] = [];
  for (const bookId of plan.bookOrder) {
    if (done.has(bookId) || plan.excluded.includes(bookId)) continue;
    const book = catalog.find(bookId);
    if (!book) continue;
    const end = monthlyBlockEnd(start, book.chapters, plan);
    upcoming.push({ bookId, cycle: 1, start, end, id: null });
    start = end.plusDays(1);
  }
  return [...past, ...upcoming];
}

/**
 * Records every block that has started by `today` and settles statuses: the block containing
 * today is active, earlier ones are done. Returns only the records that are new or changed.
 */
export function advanceBlocks(
  plan: PlanRecord,
  recorded: readonly BlockRecord[],
  catalog: BookCatalog,
  today: LocalDate,
): BlockRecord[] {
  const changes: BlockRecord[] = [];
  for (const block of projectSchedule(plan, recorded, catalog)) {
    if (block.start.isAfter(today)) break;
    const status = block.end.isBefore(today) ? 'done' : 'active';
    const existing = recorded.find((record) => record.id === block.id);
    if (existing) {
      if (existing.status !== status) changes.push({ ...existing, status });
      continue;
    }
    changes.push({
      id: blockId(block),
      cycle: block.cycle,
      bookId: block.bookId,
      start: block.start.toString(),
      end: block.end.toString(),
      goalPasses: null,
      status,
    });
  }
  return changes;
}

/**
 * Deterministic, so recording the same block twice (two tabs, or Hoy and Plan opening together)
 * writes the same record instead of a duplicate.
 */
export function blockId(block: Pick<ScheduledBlock, 'cycle' | 'bookId' | 'start'>): string {
  return `${block.cycle}:${block.bookId}:${block.start.toString()}`;
}
