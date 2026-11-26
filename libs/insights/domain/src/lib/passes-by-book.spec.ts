import { bookCatalog } from '@lectura/catalog-domain';
import { defaultPlan, emptyJournal, type Journal } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { passesByBook } from './passes-by-book';

const plan = defaultPlan(LocalDate.of(2026, 12, 1), bookCatalog);
let ids = 0;
const log = (bookId: string, chaptersRead: number, blockId = 'b1') => ({
  id: `l${++ids}`,
  date: '2026-12-01',
  blockId,
  bookId,
  startChapter: 1,
  chaptersRead,
});
const journal = (logs: Journal['logs'], overrides: Partial<Journal> = {}): Journal => ({
  ...emptyJournal,
  plan,
  logs,
  ...overrides,
});

describe('passesByBook (LB-025)', () => {
  it('counts the complete passes and the share of the next one, per book', () => {
    const result = passesByBook(
      journal([log('abdias', 31), log('filemon', 12), log('salmos', 60)]),
      bookCatalog,
    );

    expect(result.map((b) => [b.bookId, b.bookName, b.chapters, b.complete, b.fraction])).toEqual([
      ['abdias', 'Abdías', 31, 31, 0],
      ['filemon', 'Filemón', 12, 12, 0],
      ['salmos', 'Salmos', 60, 0, 0.4],
    ]);
  });

  it('adds up every cycle', () => {
    const result = passesByBook(
      journal([log('abdias', 30, '1:abdias:x'), log('abdias', 3, '2:abdias:y')]),
      bookCatalog,
    );

    expect(result).toEqual([expect.objectContaining({ bookId: 'abdias', complete: 33 })]);
  });

  it("follows the plan's order and only lists books with something read", () => {
    const reordered = {
      ...plan,
      bookOrder: ['salmos', ...plan.bookOrder.filter((id) => id !== 'salmos')],
    };
    const result = passesByBook(
      journal([log('abdias', 1), log('salmos', 1)], { plan: reordered }),
      bookCatalog,
    );

    expect(result.map((b) => b.bookId)).toEqual(['salmos', 'abdias']);
  });

  it('keeps books read before they were left out, after the ones in the order', () => {
    const leftOut = {
      ...plan,
      bookOrder: plan.bookOrder.filter((id) => id !== 'abdias'),
      excluded: ['abdias'],
    };
    const result = passesByBook(
      journal([log('abdias', 2), log('filemon', 1)], { plan: leftOut }),
      bookCatalog,
    );

    expect(result.map((b) => b.bookId)).toEqual(['filemon', 'abdias']);
  });

  it('passes as one number, for the bar', () => {
    const [salmos] = passesByBook(journal([log('salmos', 210)]), bookCatalog);

    expect(salmos?.passes).toBeCloseTo(1.4);
  });

  it('is empty before anything is read', () => {
    expect(passesByBook(journal([]), bookCatalog)).toEqual([]);
  });
});
