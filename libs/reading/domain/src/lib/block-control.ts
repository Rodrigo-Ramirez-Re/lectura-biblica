import type { BookCatalog } from '@lectura/catalog-domain';
import { LocalDate, err, ok, type Result } from '@lectura/shared-kernel';
import type { BlockRecord, BlockStatus, Journal, PlanRecord } from './journal';
import { blockEnd, currentCycle, projectSchedule, recordOf } from './schedule';

export type BlockControlError =
  'no-plan' | 'no-active-block' | 'not-available' | 'not-paused' | 'invalid-end';

/** What to write: blocks to save, blocks to remove and, when it changes, the plan. */
export interface BlockChanges {
  readonly save: readonly BlockRecord[];
  readonly remove: readonly string[];
  readonly plan?: PlanRecord;
}

const date = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

export function activeBlock(blocks: readonly BlockRecord[], today: LocalDate) {
  const day = today.toString();
  return blocks.find(
    (block) => block.status === 'active' && block.start <= day && day <= block.end,
  );
}

/**
 * The day a change takes effect: today, or tomorrow when today's reading is already logged, so
 * what was read today stays with the book it was read in (LB-018).
 */
export function effectiveDay(journal: Journal, block: BlockRecord, today: LocalDate): LocalDate {
  const loggedToday = journal.logs.some(
    (log) => log.blockId === block.id && log.date === today.toString(),
  );
  return loggedToday ? today.plusDays(1) : today;
}

/**
 * Ends the active block the day before `from` with a final status; a block that would end before
 * it started never really ran, so it is removed instead (it can have no logs).
 */
function close(block: BlockRecord, from: LocalDate, status: BlockStatus): BlockChanges {
  const end = from.plusDays(-1);
  if (end.toString() < block.start) return { save: [], remove: [block.id] };
  return { save: [{ ...block, end: end.toString(), status }], remove: [] };
}

function startBlock(
  plan: PlanRecord,
  bookId: string,
  cycle: number,
  start: LocalDate,
  catalog: BookCatalog,
): BlockRecord {
  const book = catalog.find(bookId);
  if (!book) throw new Error(`Unknown book "${bookId}"`);
  return recordOf(
    { bookId, cycle, start, end: blockEnd(start, book.chapters, plan) },
    plan,
    'active',
  );
}

/** Books that can replace the current one: included and not read or running in this cycle. */
export function bookChoices(journal: Journal, catalog: BookCatalog): string[] {
  if (!journal.plan) return [];
  return projectSchedule(journal.plan, journal.blocks, catalog)
    .filter((block) => block.id === null)
    .map((block) => block.bookId);
}

/** Switches to another book: the current one goes back to the queue with its history (LB-018). */
export function changeBook(
  journal: Journal,
  bookId: string,
  today: LocalDate,
  catalog: BookCatalog,
): Result<BlockChanges, BlockControlError> {
  const { plan } = journal;
  if (!plan) return err('no-plan');
  const block = activeBlock(journal.blocks, today);
  if (!block) return err('no-active-block');
  if (!bookChoices(journal, catalog).includes(bookId)) return err('not-available');
  const from = effectiveDay(journal, block, today);
  const closed = close(block, from, 'replaced');
  return ok({
    save: [...closed.save, startBlock(plan, bookId, block.cycle, from, catalog)],
    remove: closed.remove,
  });
}

/**
 * Ends the current book and moves on to the next of the order: `skipped` when left unfinished,
 * `done` when the goal was met (LB-016, LB-018). The next block is recorded when it starts.
 */
export function moveOn(
  journal: Journal,
  status: 'skipped' | 'done',
  today: LocalDate,
): Result<BlockChanges, BlockControlError> {
  if (!journal.plan) return err('no-plan');
  const block = activeBlock(journal.blocks, today);
  if (!block) return err('no-active-block');
  return ok(close(block, effectiveDay(journal, block, today), status));
}

/** Pauses the plan: the current book stops and nothing new starts until resuming (LB-018). */
export function pause(journal: Journal, today: LocalDate): Result<BlockChanges, BlockControlError> {
  const { plan } = journal;
  if (!plan) return err('no-plan');
  const block = activeBlock(journal.blocks, today);
  if (!block) return err('no-active-block');
  const from = effectiveDay(journal, block, today);
  return ok({ ...close(block, from, 'paused'), plan: { ...plan, pausedSince: from.toString() } });
}

/** Resumes a paused plan: the paused book starts again today with a full block (LB-018). */
export function resume(
  journal: Journal,
  today: LocalDate,
  catalog: BookCatalog,
): Result<BlockChanges, BlockControlError> {
  const { plan } = journal;
  if (!plan) return err('no-plan');
  if (!plan.pausedSince) return err('not-paused');
  const paused = [...journal.blocks]
    .filter((block) => block.status === 'paused')
    .sort((a, b) => a.end.localeCompare(b.end))
    .at(-1);
  const resumed = { ...plan, pausedSince: null };
  // A pause taking effect tomorrow can be undone before it started: nothing was paused yet.
  const start = date(plan.pausedSince).isAfter(today) ? date(plan.pausedSince) : today;
  return ok({
    save: paused ? [startBlock(resumed, paused.bookId, paused.cycle, start, catalog)] : [],
    remove: [],
    plan: resumed,
  });
}

/**
 * Starts the next cycle today with the first book of the order (LB-019). The current book ends as
 * read in its cycle; a pause ends too. Every previous block and log stays in the history.
 */
export function restartCycle(
  journal: Journal,
  today: LocalDate,
  catalog: BookCatalog,
): Result<BlockChanges, BlockControlError> {
  const { plan } = journal;
  if (!plan) return err('no-plan');
  const block = activeBlock(journal.blocks, today);
  const from = block ? effectiveDay(journal, block, today) : today;
  const closed = block ? close(block, from, 'done') : { save: [], remove: [] };
  const first = plan.bookOrder.find((bookId) => !plan.excluded.includes(bookId));
  if (!first) return err('no-plan');
  const cycle = currentCycle(journal.blocks) + 1;
  return ok({
    save: [...closed.save, startBlock(plan, first, cycle, from, catalog)],
    remove: closed.remove,
    plan: plan.pausedSince ? { ...plan, pausedSince: null } : undefined,
  });
}

/** Moves the end of the current block to another day from today on (LB-018). */
export function changeBlockEnd(
  journal: Journal,
  end: LocalDate,
  today: LocalDate,
): Result<BlockChanges, BlockControlError> {
  if (!journal.plan) return err('no-plan');
  const block = activeBlock(journal.blocks, today);
  if (!block) return err('no-active-block');
  if (end.isBefore(today) || end.toString() < block.start) return err('invalid-end');
  return ok({ save: [{ ...block, end: end.toString() }], remove: [] });
}
