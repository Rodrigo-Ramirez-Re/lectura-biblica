import { bookCatalog } from '@lectura/catalog-domain';
import { defaultPlan, emptyJournal, type Journal } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { monthDays, streaks } from './consistency';

const plan = defaultPlan(LocalDate.of(2026, 12, 1), bookCatalog);
const december = {
  id: '1:abdias:2026-12-01',
  cycle: 1,
  bookId: 'abdias',
  start: '2026-12-01',
  end: '2026-12-31',
  goalPasses: null,
  status: 'active' as const,
};
const day = (n: number) => LocalDate.of(2026, 12, n);
/** A journal with one log of `chapters` on each listed day of December 2026. */
const reading = (
  days: readonly number[],
  chapters = 3,
  overrides: Partial<Journal> = {},
): Journal => ({
  ...emptyJournal,
  plan,
  blocks: [december],
  logs: days.map((n) => ({
    id: `l${n}`,
    date: day(n).toString(),
    blockId: december.id,
    bookId: 'abdias',
    startChapter: 1,
    chaptersRead: chapters,
  })),
  ...overrides,
});
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('streaks (LB-024)', () => {
  it('counts the current and the best run of reading days', () => {
    expect(streaks(reading([...range(1, 8), 10, 11]), day(11))).toEqual({ current: 2, best: 8 });
  });

  it("keeps the current streak while today isn't read yet", () => {
    expect(streaks(reading(range(1, 5)), day(6))).toEqual({ current: 5, best: 5 });
  });

  it('breaks the current streak when a past reading day was missed', () => {
    expect(streaks(reading(range(1, 5)), day(7))).toEqual({ current: 0, best: 5 });
  });

  it("doesn't break on a rest day, and adds the rest days read on", () => {
    // 6 Dec 2026 is a Sunday.
    const resting = { ...plan, restDays: [0] };
    expect(streaks(reading([4, 5, 7], 3, { plan: resting }), day(7))).toEqual({
      current: 3,
      best: 3,
    });
    expect(streaks(reading(range(4, 7), 3, { plan: resting }), day(7))?.current).toBe(4);
  });

  it('counts a day with fewer chapters than expected', () => {
    expect(streaks(reading([1, 2], 1), day(2))).toEqual({ current: 2, best: 2 });
  });

  it("doesn't break on paused days", () => {
    const blocks = [
      { ...december, end: '2026-12-03', status: 'paused' as const },
      { ...december, id: 'again', start: '2026-12-07', end: '2026-12-31' },
    ];
    expect(streaks(reading([1, 2, 3, 7], 3, { blocks }), day(7))?.current).toBe(4);
  });

  it('is null before anything is read', () => {
    expect(streaks(reading([]), day(7))).toBeNull();
    expect(streaks(emptyJournal, day(7))).toBeNull();
  });
});

describe('monthDays (LB-024)', () => {
  it('counts the days read out of the reading days so far', () => {
    const month = monthDays(reading([1, 2, 3, 5, 6, 7, 8, 10, 11]), day(11));

    expect(month).toMatchObject({ readDays: 9, readingDays: 11 });
  });

  it('marks each day of the month', () => {
    const resting = { ...plan, restDays: [0] }; // Sundays: 6, 13…
    const month = monthDays(reading([1, 6], 4, { plan: resting }), day(8));

    expect(month?.days).toHaveLength(31);
    expect(
      month?.days.slice(0, 9).map((d) => [d.day.day, d.state, d.chapters, d.expected]),
    ).toEqual([
      [1, 'read', 4, 3],
      [2, 'missed', 0, 3],
      [3, 'missed', 0, 3],
      [4, 'missed', 0, 3],
      [5, 'missed', 0, 3],
      [6, 'read', 4, 0],
      [7, 'missed', 0, 3],
      [8, 'today', 0, 3],
      [9, 'upcoming', 0, 3],
    ]);
  });

  it('counts a rest day read on, so the days read never exceed the days counted', () => {
    const resting = { ...plan, restDays: [0] };
    expect(monthDays(reading([6], 3, { plan: resting }), day(8))).toMatchObject({
      readDays: 1,
      readingDays: 8,
    });
  });

  it('marks days that expect nothing as rest', () => {
    const month = monthDays(
      reading([], 3, { blocks: [{ ...december, start: '2026-12-05' }] }),
      day(8),
    );

    expect(month?.days[0]?.state).toBe('rest');
    expect(month?.readingDays).toBe(4);
  });

  it('is null without a plan', () => {
    expect(monthDays(emptyJournal, day(8))).toBeNull();
  });
});
