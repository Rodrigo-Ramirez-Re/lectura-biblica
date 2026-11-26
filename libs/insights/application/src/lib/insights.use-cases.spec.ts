import { bookCatalog } from '@lectura/catalog-domain';
import { advanceBlocks, defaultPlan } from '@lectura/reading-domain';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { LocalDate } from '@lectura/shared-kernel';
import { FixedClock } from '@lectura/shared-kernel/testing';
import { GetInsights } from './insights.use-cases';

describe('GetInsights (LB-023)', () => {
  it('is null before a plan starts', async () => {
    const journal = new InMemoryJournal();

    expect(await new GetInsights(journal, new FixedClock('2026-12-10')).execute()).toBeNull();
  });

  it("computes this month's pace from the journal and today", async () => {
    const journal = new InMemoryJournal();
    const start = LocalDate.of(2026, 12, 1);
    const plan = defaultPlan(start, bookCatalog);
    await journal.savePlan(plan);
    await journal.saveBlocks(advanceBlocks(plan, [], bookCatalog, start));
    const block = journal.journal.blocks[0];
    if (!block) throw new Error('block');
    await journal.addLog({
      id: 'l1',
      date: '2026-12-02',
      blockId: block.id,
      bookId: block.bookId,
      startChapter: 1,
      chaptersRead: 12,
    });

    const view = await new GetInsights(journal, new FixedClock('2026-12-03')).execute();

    expect(view?.today.toString()).toBe('2026-12-03');
    expect(view?.onPace).toMatchObject({ read: 12, expected: 9, difference: 3, days: 1 });
    expect(view?.streaks).toEqual({ current: 1, best: 1 });
    expect(view?.month).toMatchObject({ readDays: 1, readingDays: 3 });
    expect(view?.books).toEqual([expect.objectContaining({ bookId: 'abdias', complete: 12 })]);
    expect(view?.cycle).toMatchObject({ cycle: 1, finished: 0, total: 66 });
    expect(view?.finish).toEqual({ kind: 'too-early' });
    expect(view?.habits).toEqual({ kind: 'too-early' });
  });
});
