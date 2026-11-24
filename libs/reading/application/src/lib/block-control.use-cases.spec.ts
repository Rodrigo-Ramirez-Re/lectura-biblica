import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { LocalDate } from '@lectura/shared-kernel';
import { FixedClock } from '@lectura/shared-kernel/testing';
import { ControlCurrentBlock } from './block-control.use-cases';
import { AdvanceBlocks, GetSchedule, StartDefaultPlan } from './plan.use-cases';
import { GetToday } from './today.use-cases';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

async function setup(today = '2026-12-10') {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  clock.set(today);
  const advance = new AdvanceBlocks(journal, journal, clock);
  await advance.execute();
  return {
    journal,
    clock,
    advance,
    control: new ControlCurrentBlock(journal, journal, clock),
    today: new GetToday(journal, clock),
    schedule: new GetSchedule(journal, clock),
  };
}

describe('ControlCurrentBlock (LB-018)', () => {
  it('offers the books not read or running in this cycle, by name', async () => {
    const { control } = await setup();

    const choices = await control.choices();

    expect(choices[0]).toEqual({ bookId: 'filemon', name: 'Filemón' });
    expect(choices.map((c) => c.bookId)).not.toContain('abdias');
  });

  it('changes the book and Hoy follows', async () => {
    const { control, today, schedule } = await setup();

    await control.changeBook('rut');

    expect((await today.execute())?.bookName).toBe('Rut');
    const states = (await schedule.execute())?.entries
      .slice(0, 2)
      .map((e) => [e.bookName, e.state]);
    expect(states).toEqual([
      ['Abdías', 'replaced'],
      ['Rut', 'current'],
    ]);
  });

  it('skips the book and the next one starts', async () => {
    const { control, advance, today } = await setup();

    await control.skip();
    await advance.execute();

    expect((await today.execute())?.bookName).toBe('Filemón');
  });

  it('pauses and resumes', async () => {
    const { control, today, clock, advance, schedule } = await setup();

    await control.pause();
    expect(await today.execute()).toBeNull();
    expect((await schedule.execute())?.plan.pausedSince).toBe('2026-12-10');

    clock.set('2027-01-05');
    await advance.execute();
    await control.resume();

    expect(await today.execute()).toMatchObject({ bookName: 'Abdías' });
  });

  it('moves the end of the block', async () => {
    const { control, today } = await setup();

    await control.changeEnd(day('2026-12-20'));

    expect((await today.execute())?.end.toString()).toBe('2026-12-20');
  });

  it('reports why a change cannot be made', async () => {
    const { control } = await setup();

    expect(await control.resume()).toEqual({ ok: false, error: 'not-paused' });
  });
});

describe('cycles (LB-019)', () => {
  it('restarts the cycle and Plan shows cycle 2 from its first book', async () => {
    const { control, schedule, today } = await setup();

    await control.restartCycle();

    const view = await schedule.execute();
    expect(view).toMatchObject({ cycle: 2, cyclesTarget: null, complete: false });
    expect(view?.entries[0]).toMatchObject({ bookName: 'Abdías', state: 'current' });
    expect((await today.execute())?.bookName).toBe('Abdías');
  });

  it('says the journey is complete once every cycle is read', async () => {
    const journal = new InMemoryJournal();
    const clock = new FixedClock('2026-12-01');
    await new StartDefaultPlan(journal, journal, clock).execute('today');
    journal.journal = {
      ...journal.journal,
      plan: journal.journal.plan && {
        ...journal.journal.plan,
        bookOrder: ['abdias'],
        cyclesTarget: 1,
      },
    };
    clock.set('2027-01-05');
    await new AdvanceBlocks(journal, journal, clock).execute();

    expect(await new GetSchedule(journal, clock).execute()).toMatchObject({
      cycle: 1,
      complete: true,
    });
  });
});
