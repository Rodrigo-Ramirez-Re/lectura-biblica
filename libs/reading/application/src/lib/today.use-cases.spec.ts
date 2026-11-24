import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { LocalDate } from '@lectura/shared-kernel';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { AdvanceBlocks, StartDefaultPlan } from './plan.use-cases';
import {
  GetBookProgress,
  GetToday,
  LogReading,
  SetBlockGoal,
  UndoReading,
} from './today.use-cases';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

/** Starts the default plan on `start` and moves the clock to `today`. */
async function reading(start: string, today = start) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock(start);
  const ids = new SequentialIds();
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  clock.set(today);
  await new AdvanceBlocks(journal, journal, clock).execute();
  return {
    journal,
    clock,
    today: new GetToday(journal, clock),
    log: new LogReading(journal, journal, clock, ids),
    undo: new UndoReading(journal),
    progress: new GetBookProgress(journal),
    advance: new AdvanceBlocks(journal, journal, clock),
  };
}

/** Plays a plan forward to the block of `bookId` by moving the clock block by block. */
async function readingBook(bookId: string) {
  const setup = await reading('2026-12-01');
  for (;;) {
    const view = await setup.today.execute();
    if (!view) throw new Error(`No active block before reaching ${bookId}`);
    if (view.bookId === bookId) return setup;
    setup.clock.set(view.end.plusDays(1).toString());
    await setup.advance.execute();
  }
}

describe('GetToday (LB-012)', () => {
  it('has nothing due before the plan starts', async () => {
    const { today } = await reading('2026-12-01', '2026-12-01');
    expect(await today.execute()).not.toBeNull();

    const notStarted = new InMemoryJournal();
    expect(await new GetToday(notStarted, new FixedClock('2026-12-01')).execute()).toBeNull();
  });

  it('shows three chapters of a one-chapter book as three readings of chapter 1', async () => {
    const { today } = await reading('2026-12-01', '2026-12-03');

    const view = await today.execute();

    expect(view).toMatchObject({ bookName: 'Abdías', dueChapters: 3, readToday: 0 });
    expect(view?.dueSpans).toEqual([
      { from: 1, to: 1 },
      { from: 1, to: 1 },
      { from: 1, to: 1 },
    ]);
    expect(view?.passesThatFit).toBe(93);
  });

  it('continues Salmos after the chapters already read', async () => {
    const setup = await readingBook('salmos');
    await setup.log.execute({ chapters: 3 });
    setup.clock.set(setup.clock.today().plusDays(1).toString());

    const view = await setup.today.execute();

    expect(view?.dueSpans).toEqual([{ from: 4, to: 6 }]);
    expect(view?.passesInBlock).toEqual({ complete: 0, chaptersIntoCurrent: 3 });
  });

  it('wraps Rut into a new pass', async () => {
    const setup = await readingBook('rut');
    await setup.log.execute({ chapters: 3 });
    setup.clock.set(setup.clock.today().plusDays(1).toString());

    expect((await setup.today.execute())?.dueSpans).toEqual([
      { from: 4, to: 4 },
      { from: 1, to: 2 },
    ]);
  });
});

describe('LogReading (LB-012)', () => {
  it('logs today and leaves nothing due', async () => {
    const { log, today } = await reading('2026-12-01', '2026-12-03');

    const result = await log.execute({ chapters: 3 });

    expect(result.ok && result.value).toMatchObject({
      date: '2026-12-03',
      bookId: 'abdias',
      startChapter: 1,
      chaptersRead: 3,
    });
    expect(await today.execute()).toMatchObject({ dueChapters: 0, readToday: 3, dueSpans: [] });
  });

  it('logs a different amount from the next chapter', async () => {
    const setup = await readingBook('salmos');

    await setup.log.execute({ chapters: 5 });

    expect((await setup.today.execute())?.nextChapter).toBe(6);
  });

  it('accepts extra chapters after the day is done', async () => {
    const { log, today } = await reading('2026-12-01', '2026-12-03');
    await log.execute({ chapters: 3 });

    await log.execute({ chapters: 2 });

    expect(await today.execute()).toMatchObject({ dueChapters: 0, readToday: 5 });
  });

  it('logs a past day of the active block', async () => {
    const { log, journal } = await reading('2026-12-01', '2026-12-03');

    await log.execute({ chapters: 3, date: day('2026-12-02') });

    expect(journal.journal.logs.map((l) => l.date)).toEqual(['2026-12-02']);
  });

  it('rejects a day before the block or after today', async () => {
    const { log } = await reading('2026-12-01', '2026-12-03');

    expect(await log.execute({ chapters: 3, date: day('2026-11-30') })).toEqual({
      ok: false,
      error: 'outside-block',
    });
    expect(await log.execute({ chapters: 3, date: day('2026-12-04') })).toEqual({
      ok: false,
      error: 'in-the-future',
    });
  });

  it('needs an active block', async () => {
    const journal = new InMemoryJournal();
    const log = new LogReading(journal, journal, new FixedClock('2026-12-03'), new SequentialIds());

    expect(await log.execute({ chapters: 3 })).toEqual({ ok: false, error: 'no-active-block' });
  });
});

describe('UndoReading (LB-012)', () => {
  it('deletes the log and makes the day due again', async () => {
    const { log, undo, today } = await reading('2026-12-01', '2026-12-03');
    const result = await log.execute({ chapters: 3 });

    await undo.execute(result.ok ? result.value.id : '');

    expect(await today.execute()).toMatchObject({ dueChapters: 3, readToday: 0 });
  });
});

describe('GetBookProgress (LB-012)', () => {
  it('adds up passes across the blocks where the book was read', async () => {
    const { log, progress } = await reading('2026-12-01', '2026-12-03');
    await log.execute({ chapters: 3 });
    await log.execute({ chapters: 2, date: day('2026-12-02') });

    const view = await progress.execute('abdias');

    expect(view?.passes).toEqual({ complete: 5, chaptersIntoCurrent: 0 });
    expect(view?.blocks).toHaveLength(1);
    expect(view?.blocks[0].chaptersRead).toBe(5);
  });

  it('shows no reading for a book not read yet', async () => {
    const { progress } = await reading('2026-12-01', '2026-12-03');

    expect(await progress.execute('salmos')).toEqual({
      passes: { complete: 0, chaptersIntoCurrent: 0 },
      chaptersRead: 0,
      blocks: [],
    });
  });
});

describe('SetBlockGoal (LB-016)', () => {
  it('sets a goal of passes and says when it is met', async () => {
    const { journal, clock, today, log } = await reading('2026-12-01', '2026-12-03');
    const setGoal = new SetBlockGoal(journal, journal, clock);

    await setGoal.execute(5);
    expect(await today.execute()).toMatchObject({ goalPasses: 5, goalMet: false });

    await log.execute({ chapters: 5 });
    expect(await today.execute()).toMatchObject({ goalPasses: 5, goalMet: true });
  });

  it('clears the goal', async () => {
    const { journal, clock, today } = await reading('2026-12-01', '2026-12-03');
    const setGoal = new SetBlockGoal(journal, journal, clock);
    await setGoal.execute(5);

    await setGoal.execute(null);

    expect(await today.execute()).toMatchObject({ goalPasses: null, goalMet: false });
  });

  it('refuses a goal that is not a whole number of at least 1', async () => {
    const { journal, clock } = await reading('2026-12-01', '2026-12-03');

    expect(await new SetBlockGoal(journal, journal, clock).execute(0)).toEqual({
      ok: false,
      error: 'invalid-goal',
    });
  });
});
