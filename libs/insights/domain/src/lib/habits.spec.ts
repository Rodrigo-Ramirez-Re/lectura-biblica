import { bookCatalog } from '@lectura/catalog-domain';
import {
  defaultPlan,
  emptyJournal,
  type Journal,
  type ReadingLogRecord,
} from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { habits } from './habits';

const plan = defaultPlan(LocalDate.of(2026, 11, 30), bookCatalog); // a Monday
const block = {
  id: 'b',
  cycle: 1,
  bookId: 'abdias',
  start: '2026-11-30',
  end: '2027-12-31',
  goalPasses: null,
  status: 'active' as const,
};
const date = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};
const log = (day: LocalDate, chaptersRead: number): ReadingLogRecord => ({
  id: day.toString(),
  date: day.toString(),
  blockId: 'b',
  bookId: 'abdias',
  startChapter: 1,
  chaptersRead,
});
/** Logs from `from` for `days` days: `chapters(day)` each, skipping days that return 0. */
function logs(from: LocalDate, days: number, chapters: (day: LocalDate) => number) {
  return Array.from({ length: days }, (_, i) => from.plusDays(i))
    .filter((day) => chapters(day) > 0)
    .map((day) => log(day, chapters(day)));
}
const journal = (entries: ReadingLogRecord[]): Journal => ({
  ...emptyJournal,
  plan,
  blocks: [block],
  logs: entries,
});

describe('habits (LB-027)', () => {
  const monday = date('2026-11-30');

  it('averages each weekday, Monday first, over every occurrence since the first log', () => {
    // 4 weeks: 3 chapters a day, 6 on Saturdays.
    const entries = logs(monday, 28, (day) => (day.dayOfWeek === 6 ? 6 : 3));

    const result = habits(journal(entries), date('2026-12-27'));

    expect(result.kind).toBe('habits');
    if (result.kind !== 'habits') return;
    expect(result.weekdays.map((w) => [w.weekday, w.average])).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
      [6, 6],
      [0, 3],
    ]);
    expect(result.dailyAverage).toBeCloseTo((24 * 3 + 4 * 6) / 28);
  });

  it('lowers a weekday that was skipped', () => {
    // Two Saturdays: one with 6 chapters, one without.
    const entries = logs(monday, 14, (day) =>
      day.dayOfWeek === 6 && day.day === 5 ? 6 : day.dayOfWeek === 6 ? 0 : 3,
    );

    const result = habits(journal(entries), date('2026-12-13'));

    expect(result.kind === 'habits' && result.weekdays[5]).toEqual({ weekday: 6, average: 3 });
  });

  it('averages the last 7 days, today included', () => {
    const entries = logs(monday, 14, () => 3);

    const result = habits(journal(entries), date('2026-12-13'));

    expect(result.kind === 'habits' && result.last7Average).toBe(3);
  });

  it("doesn't count today against the averages until something is read", () => {
    const entries = logs(monday, 7, () => 3);

    const result = habits(journal(entries), date('2026-12-07'));

    expect(result.kind === 'habits' && result.dailyAverage).toBe(3);
    expect(result.kind === 'habits' && result.weekdays[0]).toEqual({ weekday: 1, average: 3 });
  });

  it('counts the reading days without any chapter in the last 30, today excluded', () => {
    const entries = logs(monday, 40, (day) => ([3, 9, 17, 25].includes(day.day) ? 0 : 3));

    const result = habits(journal(entries), date('2027-01-08'));

    // 9, 17 and 25 December and 3 January fall in the 30 days before 8 January; 3 December doesn't.
    expect(result.kind === 'habits' && result.zeroDays).toBe(4);
  });

  it("doesn't count rest days as days without reading", () => {
    const resting = { ...plan, restDays: [0] };
    const entries = logs(monday, 14, (day) => (day.dayOfWeek === 0 ? 0 : 3));

    const result = habits({ ...journal(entries), plan: resting }, date('2026-12-14'));

    expect(result.kind === 'habits' && result.zeroDays).toBe(0);
  });

  it('needs a week of reading', () => {
    const entries = logs(monday, 6, () => 3);

    expect(habits(journal(entries), date('2026-12-05'))).toEqual({ kind: 'too-early' });
    expect(habits(journal([]), date('2026-12-05'))).toEqual({ kind: 'too-early' });
  });
});
