import { BookCatalog, bookCatalog } from '@lectura/catalog-domain';
import {
  defaultPlan,
  emptyJournal,
  type BlockRecord,
  type Journal,
  type NoteRecord,
  type ReadingLogRecord,
} from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { historyCsv, historyFileName, monthlyHistory } from './history';

const plan = defaultPlan(LocalDate.of(2026, 12, 1), bookCatalog);
const block = (bookId: string, start: string, end: string, extra: Partial<BlockRecord> = {}) => ({
  id: `1:${bookId}:${start}`,
  cycle: 1,
  bookId,
  start,
  end,
  goalPasses: null,
  status: 'done' as const,
  ...extra,
});
const abdias = block('abdias', '2026-12-01', '2026-12-31', { goalPasses: 5 });
const filemon = block('filemon', '2027-01-01', '2027-01-31', { status: 'active' });
let ids = 0;
const log = (b: BlockRecord, date: string, chaptersRead: number, startChapter = 1) =>
  ({
    id: `l${++ids}`,
    date,
    blockId: b.id,
    bookId: b.bookId,
    startChapter,
    chaptersRead,
  }) satisfies ReadingLogRecord;
const note = (bookId: string, date: string): NoteRecord => ({
  id: `n${++ids}`,
  blockId: null,
  bookId,
  date,
  text: '…',
});
const journal = (overrides: Partial<Journal>): Journal => ({
  ...emptyJournal,
  plan,
  blocks: [abdias, filemon],
  ...overrides,
});
const date = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

describe('monthlyHistory (LB-028)', () => {
  it('lists every month read, newest first, with its books, chapters, goal and notes', () => {
    const history = monthlyHistory(
      journal({
        logs: [
          log(abdias, '2026-12-01', 3),
          log(abdias, '2026-12-02', 3),
          log(filemon, '2027-01-02', 2),
        ],
        notes: [
          note('abdias', '2026-12-02'),
          note('abdias', '2026-12-03'),
          note('filemon', '2027-01-02'),
        ],
      }),
      bookCatalog,
      date('2027-01-10'),
    );

    expect(history.map((month) => [month.year, month.month, month.chapters])).toEqual([
      [2027, 1, 2],
      [2026, 12, 6],
    ]);
    expect(history[1]?.books).toEqual([
      {
        bookId: 'abdias',
        bookName: 'Abdías',
        chapters: 6,
        passes: 6,
        goal: { kind: 'met', goal: 5, passes: 6 },
        notes: 2,
      },
    ]);
    expect(history[0]?.books[0]).toMatchObject({
      bookId: 'filemon',
      chapters: 2,
      passes: 2,
      notes: 1,
    });
  });

  it('judges a goal on the month its block ends: met, missed or still running', () => {
    const history = monthlyHistory(
      journal({
        blocks: [abdias, { ...filemon, goalPasses: 10 }],
        logs: [log(abdias, '2026-12-01', 4), log(filemon, '2027-01-02', 2)],
      }),
      bookCatalog,
      date('2027-01-10'),
    );

    expect(history[1]?.books[0]?.goal).toEqual({ kind: 'missed', goal: 5, passes: 4 });
    expect(history[0]?.books[0]?.goal).toEqual({ kind: 'in-progress', goal: 10, passes: 2 });

    const met = monthlyHistory(
      journal({ logs: [log(abdias, '2026-12-01', 6)] }),
      bookCatalog,
      date('2027-01-10'),
    );
    expect(met.find((m) => m.month === 12)?.books[0]?.goal).toEqual({
      kind: 'met',
      goal: 5,
      passes: 6,
    });
  });

  it('shows no goal for a block without one', () => {
    const history = monthlyHistory(
      journal({ logs: [log(filemon, '2027-01-02', 2)] }),
      bookCatalog,
      date('2027-01-10'),
    );

    expect(history[0]?.books[0]?.goal).toBeNull();
  });

  it('lists both books of a month in which one block ended and another started', () => {
    const mid = block('abdias', '2026-12-01', '2026-12-15');
    const next = block('filemon', '2026-12-16', '2027-01-15', { status: 'active' });
    const history = monthlyHistory(
      journal({
        blocks: [mid, next],
        logs: [log(mid, '2026-12-01', 3), log(next, '2026-12-16', 1)],
      }),
      bookCatalog,
      date('2026-12-20'),
    );

    expect(history).toHaveLength(1);
    expect(history[0]?.books.map((b) => [b.bookName, b.chapters])).toEqual([
      ['Abdías', 3],
      ['Filemón', 1],
    ]);
  });

  it('is empty before anything is read', () => {
    expect(monthlyHistory(journal({}), bookCatalog, date('2027-01-10'))).toEqual([]);
  });
});

describe('historyCsv (LB-028)', () => {
  it('has one row per log, with Spanish headers and book names, oldest first', () => {
    const salmos = block('salmos', '2027-02-01', '2027-03-31', { cycle: 2 });
    const csv = historyCsv(
      journal({
        blocks: [abdias, salmos],
        logs: [log(salmos, '2027-02-02', 4, 149), log(abdias, '2026-12-01', 3)],
      }),
      bookCatalog,
    );

    expect(csv).toBe(
      '\uFEFFfecha,libro,desde,hasta,capitulos,ciclo\r\n' +
        '2026-12-01,Abdías,1,1,3,1\r\n' +
        '2027-02-02,Salmos,149,2,4,2\r\n',
    );
  });

  it('quotes a field that needs it', () => {
    const odd = { ...log(abdias, '2026-12-01', 1), bookId: 'abdias' };
    const catalogWithComma = new BookCatalog(
      bookCatalog
        .all()
        .map((book) => (book.id === 'abdias' ? { ...book, name: 'Abdías, "el profeta"' } : book)),
    );

    expect(historyCsv(journal({ logs: [odd] }), catalogWithComma)).toContain(
      '2026-12-01,"Abdías, ""el profeta""",1,1,1,1',
    );
  });

  it('names the file after the day', () => {
    expect(historyFileName(date('2027-01-10'))).toBe('lectura-biblica-historial-2027-01-10.csv');
  });
});
