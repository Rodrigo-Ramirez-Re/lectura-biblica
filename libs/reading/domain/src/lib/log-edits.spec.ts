import { bookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { emptyJournal, type BlockRecord, type Journal, type ReadingLogRecord } from './journal';
import { deleteLog, editLog, renumber } from './log-edits';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

const rut: BlockRecord = {
  id: 'b1',
  cycle: 1,
  bookId: 'rut',
  start: '2026-12-01',
  end: '2026-12-31',
  goalPasses: null,
  status: 'active',
};

const log = (
  id: string,
  date: string,
  startChapter: number,
  chaptersRead = 3,
): ReadingLogRecord => ({
  id,
  date,
  blockId: 'b1',
  bookId: 'rut',
  startChapter,
  chaptersRead,
});

// Rut has 4 chapters: 3 on the 1st (1–3), 3 on the 2nd (4, 1–2), 3 on the 3rd (3–4, 1).
const journal: Journal = {
  ...emptyJournal,
  blocks: [rut],
  logs: [log('a', '2026-12-01', 1), log('b', '2026-12-02', 4), log('c', '2026-12-03', 3)],
};
const today = day('2026-12-05');

describe('renumbering (LB-020)', () => {
  it('keeps consecutive ranges in date order', () => {
    expect(renumber(journal.logs, 4)).toEqual([]);
    const shuffled = [journal.logs[2], journal.logs[0], journal.logs[1]];
    expect(renumber(shuffled, 4)).toEqual([]);
  });
});

describe('editing a log (LB-020)', () => {
  it('changes the amount and renumbers the logs after it', () => {
    const result = editLog(
      journal,
      'a',
      { date: day('2026-12-01'), chaptersRead: 1 },
      today,
      bookCatalog,
    );

    expect(result.ok && result.value.save).toEqual([
      { ...journal.logs[0], chaptersRead: 1 },
      { ...journal.logs[1], startChapter: 2 },
      { ...journal.logs[2], startChapter: 1 },
    ]);
  });

  it('moves a log to another day of its block', () => {
    const result = editLog(
      journal,
      'c',
      { date: day('2026-12-04'), chaptersRead: 3 },
      today,
      bookCatalog,
    );

    expect(result.ok && result.value.save).toEqual([{ ...journal.logs[2], date: '2026-12-04' }]);
  });

  it.each([
    ['a day outside the block', '2026-11-30', 3, 'outside-block'],
    ['a day in the future', '2026-12-06', 3, 'in-the-future'],
    ['no chapters', '2026-12-02', 0, 'invalid-amount'],
  ])('refuses %s', (_, date, chaptersRead, error) => {
    expect(editLog(journal, 'a', { date: day(date), chaptersRead }, today, bookCatalog)).toEqual({
      ok: false,
      error,
    });
  });

  it('reports a log that does not exist', () => {
    expect(editLog(journal, 'x', { date: today, chaptersRead: 1 }, today, bookCatalog)).toEqual({
      ok: false,
      error: 'not-found',
    });
  });
});

describe('deleting a log (LB-020)', () => {
  it('removes it and renumbers the rest of the block', () => {
    const result = deleteLog(journal, 'a', bookCatalog);

    expect(result.ok && result.value).toEqual({
      remove: ['a'],
      save: [
        { ...journal.logs[1], startChapter: 1 },
        { ...journal.logs[2], startChapter: 4 },
      ],
    });
  });
});
