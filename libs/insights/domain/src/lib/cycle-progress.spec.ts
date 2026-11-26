import { bookCatalog } from '@lectura/catalog-domain';
import {
  advanceBlocks,
  defaultPlan,
  emptyJournal,
  projectSchedule,
  type Journal,
  type PlanRecord,
  type ReadingLogRecord,
} from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { cycleProgress, finishEstimate, type FinishEstimate } from './cycle-progress';

function estimated(result: FinishEstimate | null) {
  if (result?.kind !== 'estimate') throw new Error(`expected an estimate, got ${result?.kind}`);
  return result;
}

const start = LocalDate.of(2026, 12, 1);
const plan = defaultPlan(start, bookCatalog);
const date = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

/** The journal of a plan started on 1 Dec 2026, its blocks recorded up to `today`. */
function journalOn(
  today: LocalDate,
  options: { plan?: PlanRecord; logs?: ReadingLogRecord[] } = {},
) {
  const current = options.plan ?? plan;
  const blocks = advanceBlocks(current, [], bookCatalog, today);
  return { ...emptyJournal, plan: current, blocks, logs: options.logs ?? [] } satisfies Journal;
}

/** `perDay` chapters logged on every day from `from` to `to`. */
function daily(from: LocalDate, to: LocalDate, perDay: number): ReadingLogRecord[] {
  const logs: ReadingLogRecord[] = [];
  for (let day = from; !day.isAfter(to); day = day.plusDays(1))
    logs.push({
      id: day.toString(),
      date: day.toString(),
      blockId: 'b',
      bookId: 'abdias',
      startChapter: 1,
      chaptersRead: perDay,
    });
  return logs;
}

describe('cycleProgress (LB-026)', () => {
  it('counts the books finished out of the books of the plan, and the months left', () => {
    // 1 Feb 2028 is month 15 of the default plan: 14 books are done.
    const today = date('2028-02-10');
    const journal = journalOn(today);
    const end = projectSchedule(plan, journal.blocks, bookCatalog).at(-1)?.end;

    const progress = cycleProgress(journal, bookCatalog, today);

    expect(progress).toMatchObject({ cycle: 1, finished: 14, total: 66, complete: false });
    expect(progress?.end.toString()).toBe(end?.toString());
    expect(progress?.monthsLeft).toBe(today.monthsSpannedUntil(end ?? today));
  });

  it('counts skipped books as finished in their cycle', () => {
    const today = date('2027-01-10');
    const journal = journalOn(today);
    const blocks = journal.blocks.map((block) =>
      block.bookId === 'abdias' ? { ...block, status: 'skipped' as const } : block,
    );

    expect(cycleProgress({ ...journal, blocks }, bookCatalog, today)?.finished).toBe(1);
  });

  it('counts only the books the plan keeps', () => {
    const leftOut = {
      ...plan,
      bookOrder: plan.bookOrder.slice(6),
      excluded: plan.bookOrder.slice(0, 6),
    };

    expect(cycleProgress(journalOn(start, { plan: leftOut }), bookCatalog, start)?.total).toBe(60);
  });

  it('is complete once the last cycle the plan asks for is read', () => {
    const once = {
      ...plan,
      cyclesTarget: 1,
      bookOrder: ['abdias'],
      excluded: plan.bookOrder.slice(1),
    };
    const today = date('2027-02-10');

    expect(cycleProgress(journalOn(today, { plan: once }), bookCatalog, today)).toMatchObject({
      finished: 1,
      total: 1,
      complete: true,
    });
  });

  it('is null without a plan', () => {
    expect(cycleProgress(emptyJournal, bookCatalog, start)).toBeNull();
  });
});

describe('finishEstimate (LB-026)', () => {
  it('projects the rest of the cycle at the pace of the last 30 days', () => {
    const today = date('2027-01-30');
    const journal = journalOn(today, { logs: daily(date('2027-01-01'), today, 2) });

    const estimate = estimated(finishEstimate(journal, bookCatalog, today));

    expect(estimate.pace).toBe(2);
    const atPlanPace = cycleProgress(journal, bookCatalog, today)?.end;
    expect(estimate.end.isAfter(atPlanPace ?? today)).toBe(true);
  });

  it('matches the plan when reading at its pace', () => {
    const today = date('2027-01-30');
    const journal = journalOn(today, { logs: daily(date('2026-12-31'), today, 3) });

    const estimate = estimated(finishEstimate(journal, bookCatalog, today));

    expect(estimate.end.toString()).toBe(
      cycleProgress(journal, bookCatalog, today)?.end.toString(),
    );
  });

  it('averages over the days since the plan started when it is younger than 30 days', () => {
    const today = date('2026-12-10');
    const journal = journalOn(today, { logs: daily(start, today, 4) });

    expect(estimated(finishEstimate(journal, bookCatalog, today)).pace).toBe(4);
  });

  it('needs a week of plan', () => {
    const today = date('2026-12-06');
    const journal = journalOn(today, { logs: daily(start, today, 3) });

    expect(finishEstimate(journal, bookCatalog, today)).toEqual({ kind: 'too-early' });
  });

  it('needs some reading in the last 30 days', () => {
    const today = date('2027-03-10');
    const journal = journalOn(today, { logs: daily(start, date('2026-12-31'), 3) });

    expect(finishEstimate(journal, bookCatalog, today)).toEqual({ kind: 'too-little' });
  });

  it('has nothing to estimate once the journey is complete', () => {
    const once = {
      ...plan,
      cyclesTarget: 1,
      bookOrder: ['abdias'],
      excluded: plan.bookOrder.slice(1),
    };
    const today = date('2027-02-10');

    expect(finishEstimate(journalOn(today, { plan: once }), bookCatalog, today)).toEqual({
      kind: 'complete',
    });
  });
});

describe('cycle progress while paused (LB-026)', () => {
  it('says the end will move instead of estimating it', () => {
    const today = date('2027-01-30');
    const paused = { ...plan, pausedSince: '2027-01-20' };
    const journal = journalOn(today, { plan: paused, logs: daily(date('2027-01-01'), today, 3) });

    expect(cycleProgress(journal, bookCatalog, today)?.paused).toBe(true);
    expect(finishEstimate(journal, bookCatalog, today)).toEqual({ kind: 'paused' });
  });
});
