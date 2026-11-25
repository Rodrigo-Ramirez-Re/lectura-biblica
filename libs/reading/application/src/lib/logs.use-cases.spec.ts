import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { LocalDate } from '@lectura/shared-kernel';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { EditLogs, GetBlockHistory } from './logs.use-cases';
import { AdvanceBlocks, StartDefaultPlan } from './plan.use-cases';
import { GetBookProgress, LogReading } from './today.use-cases';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

async function setup() {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  clock.set('2026-12-03');
  await new AdvanceBlocks(journal, journal, clock).execute();
  const log = new LogReading(journal, journal, clock, new SequentialIds());
  await log.execute({ chapters: 3, date: day('2026-12-01') });
  await log.execute({ chapters: 2, date: day('2026-12-02') });
  const blockId = journal.journal.blocks[0].id;
  return {
    journal,
    blockId,
    history: new GetBlockHistory(journal),
    edits: new EditLogs(journal, journal, clock),
    progress: new GetBookProgress(journal),
  };
}

describe('GetBlockHistory (LB-020)', () => {
  it('lists the logs of a block, newest first, with its passes', async () => {
    const { history, blockId } = await setup();

    const view = await history.execute(blockId);

    expect(view).toMatchObject({ bookName: 'Abdías', status: 'active', passes: { complete: 5 } });
    expect(view?.logs.map((l) => [l.date.toString(), l.chaptersRead])).toEqual([
      ['2026-12-02', 2],
      ['2026-12-01', 3],
    ]);
  });

  it('has nothing for an unknown block', async () => {
    expect(await (await setup()).history.execute('nope')).toBeNull();
  });
});

describe('EditLogs (LB-020)', () => {
  it('edits a log and progress follows', async () => {
    const { edits, journal, progress } = await setup();
    const [first] = journal.journal.logs;

    await edits.edit(first.id, { date: day('2026-12-01'), chaptersRead: 5 });

    expect((await progress.execute('abdias'))?.chaptersRead).toBe(7);
  });

  it('deletes a log and progress follows', async () => {
    const { edits, journal, progress } = await setup();

    await edits.delete(journal.journal.logs[0].id);

    expect((await progress.execute('abdias'))?.chaptersRead).toBe(2);
  });

  it('explains why an edit is refused', async () => {
    const { edits, journal } = await setup();

    expect(
      await edits.edit(journal.journal.logs[0].id, { date: day('2026-12-09'), chaptersRead: 3 }),
    ).toEqual({ ok: false, error: 'in-the-future' });
  });
});
