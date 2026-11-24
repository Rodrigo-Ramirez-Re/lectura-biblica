import { LocalDate } from '@lectura/shared-kernel';
import type { BlockRecord, ReadingLogRecord } from './journal';
import {
  chapterSpans,
  createReadingLog,
  nextChapter,
  passes,
  passesThatFit,
  totalChapters,
} from './progress';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

const salmos: BlockRecord = {
  id: 'b1',
  cycle: 1,
  bookId: 'salmos',
  start: '2032-03-01',
  end: '2032-04-30',
  goalPasses: null,
  status: 'active',
};

const log = (chaptersRead: number, date = '2032-03-01'): ReadingLogRecord => ({
  id: `l${date}${chaptersRead}`,
  date,
  blockId: 'b1',
  bookId: 'salmos',
  startChapter: 1,
  chaptersRead,
});

describe('chapter spans (LB-012)', () => {
  it('covers consecutive chapters', () => {
    expect(chapterSpans(4, 3, 150)).toEqual([{ from: 4, to: 6 }]);
  });

  it('wraps to chapter 1 after the last one', () => {
    expect(chapterSpans(4, 3, 4)).toEqual([
      { from: 4, to: 4 },
      { from: 1, to: 2 },
    ]);
  });

  it('repeats a one-chapter book', () => {
    expect(chapterSpans(1, 3, 1)).toEqual([
      { from: 1, to: 1 },
      { from: 1, to: 1 },
      { from: 1, to: 1 },
    ]);
  });
});

describe('next chapter and passes (LB-012)', () => {
  it('continues after the chapters already read, starting over after the last', () => {
    expect(nextChapter(0, 150)).toBe(1);
    expect(nextChapter(3, 150)).toBe(4);
    expect(nextChapter(4, 4)).toBe(1);
    expect(nextChapter(7, 1)).toBe(1);
  });

  it('counts complete passes and the progress of the current one', () => {
    expect(passes(3, 150)).toEqual({ complete: 0, chaptersIntoCurrent: 3 });
    expect(passes(152, 150)).toEqual({ complete: 1, chaptersIntoCurrent: 2 });
    expect(passes(7, 1)).toEqual({ complete: 7, chaptersIntoCurrent: 0 });
  });

  it('adds up the chapters of the logs', () => {
    expect(totalChapters([log(3), log(5)])).toBe(8);
  });

  it('tells how many passes fit in a block at the plan pace', () => {
    expect(passesThatFit(day('2026-12-01'), day('2026-12-31'), 3, 1)).toBe(93);
    expect(passesThatFit(day('2032-03-01'), day('2032-04-30'), 3, 150)).toBeCloseTo(1.22, 2);
  });
});

describe('reading log (LB-012)', () => {
  const base = {
    id: 'new',
    today: day('2032-03-02'),
    block: salmos,
    bookChapters: 150,
  };

  it('starts where the block reading is', () => {
    const result = createReadingLog({
      ...base,
      date: day('2032-03-02'),
      blockLogs: [log(3)],
      chaptersRead: 3,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        id: 'new',
        date: '2032-03-02',
        blockId: 'b1',
        bookId: 'salmos',
        startChapter: 4,
        chaptersRead: 3,
      },
    });
  });

  it.each([0, -2, 1.5])('rejects %s chapters', (chaptersRead) => {
    expect(
      createReadingLog({ ...base, date: day('2032-03-02'), blockLogs: [], chaptersRead }),
    ).toEqual({ ok: false, error: 'invalid-amount' });
  });

  it('rejects a day outside the block', () => {
    expect(
      createReadingLog({ ...base, date: day('2032-02-29'), blockLogs: [], chaptersRead: 3 }),
    ).toEqual({ ok: false, error: 'outside-block' });
  });

  it('rejects a day after today', () => {
    expect(
      createReadingLog({ ...base, date: day('2032-03-03'), blockLogs: [], chaptersRead: 3 }),
    ).toEqual({ ok: false, error: 'in-the-future' });
  });
});
