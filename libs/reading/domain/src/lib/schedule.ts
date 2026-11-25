import type { BookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import type { BlockRecord, BlockStatus, PlanRecord } from './journal';
import { chaptersBetween, type Pace } from './pace';

/** A block of the schedule: recorded once it started, projected while still to come. */
export interface ScheduledBlock {
  readonly bookId: string;
  readonly cycle: number;
  readonly start: LocalDate;
  readonly end: LocalDate;
  /** Set when the block is recorded. */
  readonly id: string | null;
  /** The recorded status; null for a projected block. */
  readonly status: BlockStatus | null;
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

/** Books whose block counts as read in its cycle; replaced and paused ones go back to the queue. */
const READ: readonly BlockStatus[] = ['active', 'done', 'skipped'];

/**
 * The current cycle: its recorded blocks as they happened (whatever their status), then the books
 * of the plan's order still to read, projected from the day after the last recorded block. Editing
 * the plan only changes the projection.
 */
export function projectSchedule(
  plan: PlanRecord,
  recorded: readonly BlockRecord[],
  catalog: BookCatalog,
): ScheduledBlock[] {
  const cycle = currentCycle(recorded);
  const past: ScheduledBlock[] = recorded
    .filter((block) => block.cycle === cycle)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((block) => ({
      bookId: block.bookId,
      cycle: block.cycle,
      start: date(block.start),
      end: date(block.end),
      id: block.id,
      status: block.status,
    }));

  const read = new Set(
    past.filter((block) => READ.includes(block.status ?? 'active')).map((block) => block.bookId),
  );
  const lastEnd = recorded
    .map((block) => block.end)
    .sort()
    .at(-1);
  let start = lastEnd ? date(lastEnd).plusDays(1) : date(plan.startDate);
  const project = (inCycle: number, skip: ReadonlySet<string>) => {
    const blocks: ScheduledBlock[] = [];
    for (const bookId of plan.bookOrder) {
      if (skip.has(bookId) || plan.excluded.includes(bookId)) continue;
      const book = catalog.find(bookId);
      if (!book) continue;
      const end = blockEnd(start, book.chapters, plan);
      blocks.push({ bookId, cycle: inCycle, start, end, id: null, status: null });
      start = end.plusDays(1);
    }
    return blocks;
  };

  const upcoming = project(cycle, read);
  // A finished cycle is followed by the next one, unless the plan's number of cycles is reached.
  if (!upcoming.length && !cycleLimitReached(plan, cycle))
    upcoming.push(...project(cycle + 1, new Set()));
  return [...past, ...upcoming];
}

/** Whether the plan's number of cycles is reached once `cycle` is complete (LB-019). */
export function cycleLimitReached(plan: Pick<PlanRecord, 'cyclesTarget'>, cycle: number): boolean {
  return plan.cyclesTarget !== null && cycle >= plan.cyclesTarget;
}

/** The cycle being read: the highest one recorded, or 1 before anything is (LB-019). */
export function currentCycle(recorded: readonly BlockRecord[]): number {
  return Math.max(1, ...recorded.map((block) => block.cycle));
}

/**
 * Records every projected block that has started by `today` and closes the active block once it
 * has ended. Nothing new starts while the plan is paused. Returns only new or changed records.
 */
export function advanceBlocks(
  plan: PlanRecord,
  recorded: readonly BlockRecord[],
  catalog: BookCatalog,
  today: LocalDate,
): BlockRecord[] {
  const changes: BlockRecord[] = recorded
    .filter((block) => block.status === 'active' && date(block.end).isBefore(today))
    .map((block) => ({ ...block, status: 'done' as const }));
  if (plan.pausedSince) return changes;

  // Each pass may complete a cycle and reveal the next one, so repeat until nothing new starts.
  let all = [...recorded.filter((block) => !changes.some((c) => c.id === block.id)), ...changes];
  for (;;) {
    const started = projectSchedule(plan, all, catalog)
      .filter((block) => !block.id && !block.start.isAfter(today))
      .map((block) => recordOf(block, plan, block.end.isBefore(today) ? 'done' : 'active'));
    if (!started.length) return changes;
    changes.push(...started);
    all = [...all, ...started];
  }
}

/** The record of a projected block when it starts. */
export function recordOf(
  block: Pick<ScheduledBlock, 'cycle' | 'bookId' | 'start' | 'end'>,
  plan: Pick<PlanRecord, 'defaultBlock'>,
  status: BlockStatus,
): BlockRecord {
  return {
    id: blockId(block),
    cycle: block.cycle,
    bookId: block.bookId,
    start: block.start.toString(),
    end: block.end.toString(),
    goalPasses: defaultGoal(plan),
    status,
  };
}

/**
 * Deterministic, so recording the same block twice (two tabs, or Hoy and Plan opening together)
 * writes the same record instead of a duplicate.
 */
export function blockId(block: Pick<ScheduledBlock, 'cycle' | 'bookId' | 'start'>): string {
  return `${block.cycle}:${block.bookId}:${block.start.toString()}`;
}
