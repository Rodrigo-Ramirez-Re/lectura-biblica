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

export type Duration = Pace & Pick<PlanRecord, 'defaultBlock'>;

/**
 * When a block starting on `start` ends, for every duration unit (LB-016). A block always allows at
 * least one pass of the book at the plan's pace, counting only reading days, and grows by whole
 * months, weeks or single days until it does. At 3 a day only Salmos needs to grow a monthly block
 * (150 chapters, 50 days), which is why the default cycle lasts 67 months for 66 books.
 */
export function blockEnd(start: LocalDate, chapters: number, plan: Duration): LocalDate {
  const { unit, value } = plan.defaultBlock;
  const fits = (end: LocalDate, target: number) => chaptersBetween(plan, start, end) >= target;
  let end: LocalDate;
  switch (unit) {
    case 'month':
      end = LocalDate.of(start.year, start.month + value - 1, 1).endOfMonth();
      while (!fits(end, chapters)) end = end.plusDays(1).endOfMonth();
      return end;
    case 'weeks':
      end = start.plusDays(7 * value - 1);
      while (!fits(end, chapters)) end = end.plusDays(7);
      return end;
    case 'days':
      end = start.plusDays(value - 1);
      while (!fits(end, chapters)) end = end.plusDays(1);
      return end;
    case 'passes':
      end = start;
      while (!fits(end, chapters * value)) end = end.plusDays(1);
      return end;
  }
}

/** The goal a new block starts with: the number of passes when the plan reads until that many. */
export function defaultGoal(plan: Pick<PlanRecord, 'defaultBlock'>): number | null {
  return plan.defaultBlock.unit === 'passes' ? plan.defaultBlock.value : null;
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
    const end = blockEnd(start, book.chapters, plan);
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
      goalPasses: defaultGoal(plan),
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
