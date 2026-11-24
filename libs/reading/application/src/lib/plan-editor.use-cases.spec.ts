import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock } from '@lectura/shared-kernel/testing';
import { GetPlan, UpdatePlan } from './plan-editor.use-cases';
import { AdvanceBlocks, GetSchedule, StartDefaultPlan } from './plan.use-cases';
import { GetToday } from './today.use-cases';

async function setup(today = '2026-12-01') {
  const journal = new InMemoryJournal();
  const clock = new FixedClock(today);
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  await new AdvanceBlocks(journal, journal, clock).execute();
  return {
    journal,
    clock,
    getPlan: new GetPlan(journal),
    update: new UpdatePlan(journal, journal),
    today: new GetToday(journal, clock),
    schedule: new GetSchedule(journal, clock),
  };
}

describe('UpdatePlan (LB-015)', () => {
  it('saves a new daily pace that Hoy follows', async () => {
    const { update, today, getPlan } = await setup();

    await update.execute({ chaptersPerDay: 4 });

    expect((await getPlan.execute())?.chaptersPerDay).toBe(4);
    expect(await today.execute()).toMatchObject({ todayPace: 4, dueChapters: 4 });
  });

  it('expects nothing on a rest day', async () => {
    const { update, today, clock } = await setup();
    await update.execute({ restDays: [0] });

    clock.set('2026-12-06');

    expect(await today.execute()).toMatchObject({ restDay: true, dueChapters: 0 });
  });

  it('follows a pace per weekday', async () => {
    const { update, today, clock } = await setup();
    await update.execute({ paceByWeekday: [0, 2, 2, 2, 2, 2, 5] });

    clock.set('2026-12-05');

    expect(await today.execute()).toMatchObject({ todayPace: 5, restDay: false });
  });

  it('refuses a week with no reading day', async () => {
    const { update, getPlan } = await setup();

    expect(await update.execute({ paceByWeekday: [0, 0, 0, 0, 0, 0, 0] })).toEqual({
      ok: false,
      error: 'no-reading-days',
    });
    expect((await getPlan.execute())?.paceByWeekday).toBeNull();
  });

  it('renames the plan, refusing an empty name', async () => {
    const { update, getPlan } = await setup();

    await update.execute({ name: '  Mi plan  ' });
    expect((await getPlan.execute())?.name).toBe('Mi plan');
    expect(await update.execute({ name: '   ' })).toEqual({ ok: false, error: 'empty-name' });
  });

  it('keeps recorded blocks as they were and changes only what is to come', async () => {
    const { update, schedule, journal } = await setup();
    const recorded = journal.journal.blocks;

    await update.execute({ restDays: [0, 6] });

    expect(journal.journal.blocks).toEqual(recorded);
    expect((await schedule.execute())?.entries[0].end.toString()).toBe('2026-12-31');
  });

  it('needs a plan', async () => {
    const empty = new InMemoryJournal();
    expect(await new UpdatePlan(empty, empty).execute({ chaptersPerDay: 2 })).toEqual({
      ok: false,
      error: 'no-plan',
    });
  });
});
