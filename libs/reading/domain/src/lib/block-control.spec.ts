import { bookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import {
  bookChoices,
  changeBlockEnd,
  changeBook,
  moveOn,
  pause,
  resume,
  type BlockChanges,
} from './block-control';
import { emptyJournal, type Journal, type ReadingLogRecord } from './journal';
import { defaultPlan } from './reading-plan';
import { advanceBlocks, projectSchedule } from './schedule';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

/** The default plan started on 1 December 2026, as recorded on `today`, with optional logs. */
function journalOn(today: string, logs: ReadingLogRecord[] = []): Journal {
  const plan = defaultPlan(day('2026-12-01'), bookCatalog);
  return { ...emptyJournal, plan, blocks: advanceBlocks(plan, [], bookCatalog, day(today)), logs };
}

/** Applies the changes the way the journal writer would. */
function apply(journal: Journal, changes: BlockChanges): Journal {
  const ids = new Set([...changes.remove, ...changes.save.map((block) => block.id)]);
  return {
    ...journal,
    plan: changes.plan ?? journal.plan,
    blocks: [...journal.blocks.filter((block) => !ids.has(block.id)), ...changes.save],
  };
}

const planOf = (journal: Journal) => {
  if (!journal.plan) throw new Error('no plan');
  return journal.plan;
};

const unwrap = <T>(result: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const logToday: ReadingLogRecord = {
  id: 'l1',
  date: '2026-12-10',
  blockId: '1:abdias:2026-12-01',
  bookId: 'abdias',
  startChapter: 1,
  chaptersRead: 3,
};

describe('change the book (LB-018)', () => {
  it('starts the chosen book today and sends the current one back to the queue', () => {
    const journal = journalOn('2026-12-10');

    const changed = apply(
      journal,
      unwrap(changeBook(journal, 'rut', day('2026-12-10'), bookCatalog)),
    );

    expect(changed.blocks.map((b) => [b.bookId, b.start, b.end, b.status])).toEqual([
      ['abdias', '2026-12-01', '2026-12-09', 'replaced'],
      ['rut', '2026-12-10', '2026-12-31', 'active'],
    ]);
    const next = projectSchedule(planOf(changed), changed.blocks, bookCatalog).find((b) => !b.id);
    expect(next?.bookId).toBe('abdias');
  });

  it('starts tomorrow when today is already logged', () => {
    const journal = journalOn('2026-12-10', [logToday]);

    const changed = apply(
      journal,
      unwrap(changeBook(journal, 'rut', day('2026-12-10'), bookCatalog)),
    );

    expect(changed.blocks.map((b) => [b.bookId, b.end, b.status])).toEqual([
      ['abdias', '2026-12-10', 'replaced'],
      ['rut', '2026-12-31', 'active'],
    ]);
  });

  it('removes a block that started today with nothing read', () => {
    const journal = journalOn('2026-12-01');

    const changes = unwrap(changeBook(journal, 'rut', day('2026-12-01'), bookCatalog));

    expect(changes.remove).toEqual(['1:abdias:2026-12-01']);
  });

  it('offers only books not read or running in this cycle', () => {
    const journal = journalOn('2027-01-10');

    const choices = bookChoices(journal, bookCatalog);

    expect(choices).not.toContain('abdias');
    expect(choices).not.toContain('filemon');
    expect(choices).toContain('salmos');
    expect(changeBook(journal, 'abdias', day('2027-01-10'), bookCatalog)).toEqual({
      ok: false,
      error: 'not-available',
    });
  });
});

describe('skip or finish the book (LB-016, LB-018)', () => {
  it('skips the current book: the next of the order starts and it does not come back', () => {
    const journal = journalOn('2026-12-10');

    const skipped = apply(journal, unwrap(moveOn(journal, 'skipped', day('2026-12-10'))));
    const recorded = apply(skipped, {
      save: advanceBlocks(planOf(skipped), skipped.blocks, bookCatalog, day('2026-12-10')),
      remove: [],
    });

    expect(recorded.blocks.map((b) => [b.bookId, b.start, b.status])).toEqual([
      ['abdias', '2026-12-01', 'skipped'],
      ['filemon', '2026-12-10', 'active'],
    ]);
    const books = projectSchedule(planOf(recorded), recorded.blocks, bookCatalog).map(
      (b) => b.bookId,
    );
    expect(books.filter((id) => id === 'abdias')).toHaveLength(1);
  });

  it('finishes a book whose goal was met as done', () => {
    const journal = journalOn('2026-12-10');

    const changes = unwrap(moveOn(journal, 'done', day('2026-12-10')));

    expect(changes.save[0]).toMatchObject({ bookId: 'abdias', end: '2026-12-09', status: 'done' });
  });
});

describe('pause and resume (LB-018)', () => {
  it('pauses today: nothing runs and no new block starts', () => {
    const journal = journalOn('2026-12-10');

    const paused = apply(journal, unwrap(pause(journal, day('2026-12-10'))));

    expect(paused.plan?.pausedSince).toBe('2026-12-10');
    expect(paused.blocks[0]).toMatchObject({ end: '2026-12-09', status: 'paused' });
    expect(advanceBlocks(planOf(paused), paused.blocks, bookCatalog, day('2027-02-01'))).toEqual(
      [],
    );
  });

  it('resumes days later with the paused book and a full block', () => {
    const journal = journalOn('2026-12-10');
    const paused = apply(journal, unwrap(pause(journal, day('2026-12-10'))));

    const resumed = apply(paused, unwrap(resume(paused, day('2027-01-05'), bookCatalog)));

    expect(resumed.plan?.pausedSince).toBeNull();
    expect(resumed.blocks.at(-1)).toMatchObject({
      bookId: 'abdias',
      start: '2027-01-05',
      end: '2027-01-31',
      status: 'active',
    });
  });

  it('cannot resume a plan that is not paused', () => {
    expect(resume(journalOn('2026-12-10'), day('2026-12-10'), bookCatalog)).toEqual({
      ok: false,
      error: 'not-paused',
    });
  });
});

describe('move the end of the current block (LB-018)', () => {
  it('ends the block on another day and the next ones follow', () => {
    const journal = journalOn('2026-12-10');

    const moved = apply(
      journal,
      unwrap(changeBlockEnd(journal, day('2026-12-20'), day('2026-12-10'))),
    );

    expect(moved.blocks[0].end).toBe('2026-12-20');
    const next = projectSchedule(planOf(moved), moved.blocks, bookCatalog)[1];
    expect(next.start.toString()).toBe('2026-12-21');
  });

  it('refuses an end before today', () => {
    expect(changeBlockEnd(journalOn('2026-12-10'), day('2026-12-09'), day('2026-12-10'))).toEqual({
      ok: false,
      error: 'invalid-end',
    });
  });
});
