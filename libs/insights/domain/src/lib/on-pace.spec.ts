import { bookCatalog } from '@lectura/catalog-domain';
import {
  defaultPlan,
  emptyJournal,
  type BlockRecord,
  type Journal,
  type ReadingLogRecord,
} from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { averagePace, expectedOn } from './daily';
import { onPace } from './on-pace';

const plan = defaultPlan(LocalDate.of(2026, 12, 1), bookCatalog);
const block = (start: string, end: string, status: BlockRecord['status'] = 'active') => ({
  id: `1:abdias:${start}`,
  cycle: 1,
  bookId: 'abdias',
  start,
  end,
  goalPasses: null,
  status,
});
const december = block('2026-12-01', '2026-12-31');
let ids = 0;
const log = (date: string, chaptersRead: number): ReadingLogRecord => ({
  id: `l${++ids}`,
  date,
  blockId: december.id,
  bookId: 'abdias',
  startChapter: 1,
  chaptersRead,
});
const journal = (overrides: Partial<Journal> = {}): Journal => ({
  ...emptyJournal,
  plan,
  blocks: [december],
  ...overrides,
});
const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};
/** One log a day from the 1st, `perDay` chapters each, for `days` days. */
const daily = (days: number, perDay: number) =>
  Array.from({ length: days }, (_, i) => log(`2026-12-${String(i + 1).padStart(2, '0')}`, perDay));

describe('expectedOn (LB-023)', () => {
  it("is the plan's pace on a day a recorded block covers", () => {
    expect(expectedOn(plan, [december], day('2026-12-10'))).toBe(3);
  });

  it.each([
    ['before the plan started', '2026-11-30'],
    ['with no block, as while paused', '2027-01-05'],
  ])('is 0 %s', (_, iso) => {
    expect(expectedOn(plan, [december], day(iso))).toBe(0);
  });

  it('is 0 on a rest day, and follows the pace per weekday', () => {
    const resting = { ...plan, restDays: [4] }; // 10 Dec 2026 is a Thursday
    expect(expectedOn(resting, [december], day('2026-12-10'))).toBe(0);
    const weekdays = { ...plan, paceByWeekday: [0, 2, 2, 2, 5, 2, 6] };
    expect(expectedOn(weekdays, [december], day('2026-12-10'))).toBe(5);
  });

  it('counts a closed block too: what was expected then stays expected', () => {
    const paused = block('2026-12-01', '2026-12-05', 'paused');
    expect(expectedOn(plan, [paused], day('2026-12-05'))).toBe(3);
    expect(expectedOn(plan, [paused], day('2026-12-06'))).toBe(0);
  });
});

describe('averagePace (LB-023)', () => {
  it('is the average of the reading days of a week', () => {
    expect(averagePace(plan)).toBe(3);
    expect(averagePace({ ...plan, paceByWeekday: [0, 2, 2, 2, 2, 2, 5] })).toBe(2.5);
    expect(averagePace({ ...plan, paceByWeekday: [0, 0, 0, 0, 0, 0, 0] })).toBeNull();
  });
});

describe('onPace (LB-023)', () => {
  const today = day('2026-12-10');

  it('is null without a plan', () => {
    expect(onPace(emptyJournal, today)).toBeNull();
  });

  it('says how far ahead, in chapters and days', () => {
    const result = onPace(journal({ logs: [...daily(9, 3), log('2026-12-10', 9)] }), today);

    expect(result).toMatchObject({ read: 36, expected: 30, difference: 6, days: 2 });
  });

  it('says how far behind', () => {
    const result = onPace(journal({ logs: daily(8, 3) }), today);

    expect(result).toMatchObject({ read: 24, expected: 30, difference: -6, days: -2 });
  });

  it('rounds days to the nearest whole day', () => {
    expect(onPace(journal({ logs: [log('2026-12-01', 31)] }), today)?.days).toBe(0);
    expect(onPace(journal({ logs: [log('2026-12-01', 35)] }), today)?.days).toBe(2);
  });

  it('draws the month day by day, cumulative, up to today', () => {
    const result = onPace(journal({ logs: [log('2026-12-02', 5)] }), day('2026-12-03'));

    expect(
      result?.series.map((point) => [point.day.toString(), point.read, point.expected]),
    ).toEqual([
      ['2026-12-01', 0, 3],
      ['2026-12-02', 5, 6],
      ['2026-12-03', 5, 9],
    ]);
  });

  it('only counts this calendar month', () => {
    const lastMonth = { ...log('2026-11-30', 10), blockId: 'other' };
    const result = onPace(
      journal({ blocks: [block('2026-11-01', '2026-11-30', 'done'), december], logs: [lastMonth] }),
      day('2026-12-01'),
    );

    expect(result).toMatchObject({ read: 0, expected: 3 });
  });

  it('has no days when the plan expects no reading at all', () => {
    const resting = { ...plan, paceByWeekday: [0, 0, 0, 0, 0, 0, 0] };
    expect(onPace(journal({ plan: resting }), today)?.days).toBeNull();
  });
});
