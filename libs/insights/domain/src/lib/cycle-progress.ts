import type { BookCatalog } from '@lectura/catalog-domain';
import {
  currentCycle,
  cycleLimitReached,
  projectSchedule,
  type BlockStatus,
  type Journal,
  type PlanRecord,
} from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';

/** Skipped books count as read in their cycle (LB-018); the active one isn't finished yet. */
const FINISHED: readonly BlockStatus[] = ['done', 'skipped'];

export interface CycleProgress {
  readonly cycle: number;
  /** Books of this cycle already finished. */
  readonly finished: number;
  /** Books in the plan: the order minus the books left out. */
  readonly total: number;
  /** Last day of the cycle's schedule at the plan's pace. */
  readonly end: LocalDate;
  /** Calendar months from this month to the cycle's end, both counted. */
  readonly monthsLeft: number;
  /** While paused, the end moves on when reading resumes. */
  readonly paused: boolean;
  /** The plan's number of cycles is reached and its last book is read. */
  readonly complete: boolean;
}

const parse = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

function cycleEnd(plan: PlanRecord, journal: Journal, catalog: BookCatalog, cycle: number) {
  return projectSchedule(plan, journal.blocks, catalog)
    .filter((block) => block.cycle === cycle)
    .map((block) => block.end)
    .reduce<LocalDate | null>((last, end) => (!last || end.isAfter(last) ? end : last), null);
}

/** "¿Cuánto llevo del ciclo?" (LB-026). Null without a plan. */
export function cycleProgress(
  journal: Journal,
  catalog: BookCatalog,
  today: LocalDate,
): CycleProgress | null {
  const { plan, blocks } = journal;
  if (!plan) return null;
  const cycle = currentCycle(blocks);
  const inCycle = blocks.filter((block) => block.cycle === cycle);
  const finished = new Set(
    inCycle.filter((block) => FINISHED.includes(block.status)).map((block) => block.bookId),
  ).size;
  const total = plan.bookOrder.filter(
    (id) => !plan.excluded.includes(id) && catalog.find(id),
  ).length;
  const schedule = projectSchedule(plan, blocks, catalog).filter((block) => block.cycle === cycle);
  const complete =
    cycleLimitReached(plan, cycle) &&
    schedule.every((block) => block.status !== null && block.status !== 'active');
  const end = cycleEnd(plan, journal, catalog, cycle) ?? today;
  return {
    cycle,
    finished,
    total,
    end,
    monthsLeft: complete ? 0 : Math.max(0, today.monthsSpannedUntil(end)),
    paused: plan.pausedSince !== null,
    complete,
  };
}

export type FinishEstimate =
  /** The cycle's end if the next days are read like the last 30: `pace` chapters a day. */
  | {
      readonly kind: 'estimate';
      readonly end: LocalDate;
      readonly pace: number;
      /** Days the pace is averaged over: 30, or fewer while the plan is younger. */
      readonly days: number;
    }
  /** The plan started less than a week ago. */
  | { readonly kind: 'too-early' }
  /** Too little was read lately to project anything sensible. */
  | { readonly kind: 'too-little' }
  | { readonly kind: 'paused' }
  | { readonly kind: 'complete' };

const WINDOW = 30;
const MIN_DAYS = 7;
/** Below one chapter every five days a projection says nothing useful (and would run for decades). */
const MIN_PACE = 0.2;

/**
 * "¿Cuándo termino?" (LB-026): the rest of the cycle projected with the plan's own rules, but at
 * the chapters a day actually read over the last 30 days (or since the plan started, if sooner),
 * every day counted. Blocks still allow one pass at that pace, so a slower pace honestly pushes the
 * end later. Null without a plan.
 */
export function finishEstimate(
  journal: Journal,
  catalog: BookCatalog,
  today: LocalDate,
): FinishEstimate | null {
  const progress = cycleProgress(journal, catalog, today);
  const { plan } = journal;
  if (!progress || !plan) return null;
  if (progress.complete) return { kind: 'complete' };
  if (progress.paused) return { kind: 'paused' };
  const started = parse(plan.startDate);
  if (started.daysUntil(today) + 1 < MIN_DAYS) return { kind: 'too-early' };

  const windowStart = [today.plusDays(1 - WINDOW), started].reduce((a, b) =>
    a.isAfter(b) ? a : b,
  );
  const from = windowStart.toString();
  const to = today.toString();
  const chapters = journal.logs
    .filter((log) => log.date >= from && log.date <= to)
    .reduce((sum, log) => sum + log.chaptersRead, 0);
  const days = windowStart.daysUntil(today) + 1;
  const pace = chapters / days;
  if (pace < MIN_PACE) return { kind: 'too-little' };

  const measured: PlanRecord = { ...plan, chaptersPerDay: pace, restDays: [], paceByWeekday: null };
  return {
    kind: 'estimate',
    end: cycleEnd(measured, journal, catalog, progress.cycle) ?? progress.end,
    pace,
    days,
  };
}
