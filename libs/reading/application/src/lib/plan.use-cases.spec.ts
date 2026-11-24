import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock } from '@lectura/shared-kernel/testing';
import { AdvanceBlocks, GetSchedule, StartDefaultPlan } from './plan.use-cases';

function setup(today = '2026-11-24') {
  const journal = new InMemoryJournal();
  const clock = new FixedClock(today);
  return {
    journal,
    clock,
    start: new StartDefaultPlan(journal, journal, clock),
    advance: new AdvanceBlocks(journal, journal, clock),
    schedule: new GetSchedule(journal, clock),
  };
}

describe('StartDefaultPlan (LB-011)', () => {
  it('offers today or the first of next month', () => {
    const { start } = setup('2026-11-24');

    const { today, nextMonth } = start.options();
    expect([today.toString(), nextMonth.toString()]).toEqual(['2026-11-24', '2026-12-01']);
  });

  it('starts today with the first book recorded as the active block', async () => {
    const { start, journal } = setup('2026-11-24');

    await start.execute('today');

    expect(journal.journal.plan?.startDate).toBe('2026-11-24');
    expect(journal.journal.blocks).toEqual([
      expect.objectContaining({
        bookId: 'abdias',
        start: '2026-11-24',
        end: '2026-11-30',
        status: 'active',
      }),
    ]);
  });

  it('starts on the 1st of next month with nothing recorded yet', async () => {
    const { start, journal } = setup('2026-11-24');

    await start.execute('next-month');

    expect(journal.journal.plan?.startDate).toBe('2026-12-01');
    expect(journal.journal.blocks).toEqual([]);
  });

  it('never replaces an existing plan', async () => {
    const { start } = setup();
    await start.execute('today');

    expect(await start.execute('next-month')).toEqual({ ok: false, error: 'plan-exists' });
  });
});

describe('AdvanceBlocks (LB-011)', () => {
  it('starts the next block once the current one has ended', async () => {
    const { start, advance, clock, journal } = setup('2026-12-01');
    await start.execute('today');

    clock.set('2027-01-01');
    await advance.execute();

    expect(journal.journal.blocks.map((b) => [b.bookId, b.status])).toEqual([
      ['abdias', 'done'],
      ['filemon', 'active'],
    ]);
  });

  it('does nothing without a plan', async () => {
    const { advance, journal } = setup();

    await advance.execute();

    expect(journal.journal.blocks).toEqual([]);
  });
});

describe('GetSchedule (LB-011)', () => {
  it('has nothing to show without a plan', async () => {
    expect(await setup().schedule.execute()).toBeNull();
  });

  it('lists the cycle with past, current and upcoming blocks and its length', async () => {
    const { start, advance, clock, schedule } = setup('2026-12-01');
    await start.execute('today');
    clock.set('2027-01-10');
    await advance.execute();

    const view = await schedule.execute();

    expect(view?.months).toBe(67);
    expect(view?.entries).toHaveLength(66);
    expect(view?.entries.slice(0, 3).map((e) => [e.bookName, e.state])).toEqual([
      ['Abdías', 'done'],
      ['Filemón', 'current'],
      ['2 Juan', 'upcoming'],
    ]);
  });
});
