import { LocalDate } from '@lectura/shared-kernel';
import { chaptersBetween, dailyPace, type Pace } from './pace';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

const every = (chaptersPerDay: number, restDays: number[] = []): Pace => ({
  chaptersPerDay,
  restDays,
  paceByWeekday: null,
});

// 2026-12-06 is a Sunday.
describe('pace (LB-015)', () => {
  it('expects the same chapters every day', () => {
    expect(dailyPace(every(4), day('2026-12-06'))).toBe(4);
  });

  it('expects nothing on a rest day', () => {
    expect(dailyPace(every(3, [0]), day('2026-12-06'))).toBe(0);
    expect(dailyPace(every(3, [0]), day('2026-12-07'))).toBe(3);
  });

  it('follows the pace of each weekday when set, ignoring the daily pace', () => {
    const weekly: Pace = { chaptersPerDay: 3, restDays: [], paceByWeekday: [0, 2, 2, 2, 2, 2, 5] };
    expect(dailyPace(weekly, day('2026-12-06'))).toBe(0);
    expect(dailyPace(weekly, day('2026-12-07'))).toBe(2);
    expect(dailyPace(weekly, day('2026-12-12'))).toBe(5);
  });

  it('adds up the chapters of a period, both ends included', () => {
    expect(chaptersBetween(every(3), day('2026-12-01'), day('2026-12-31'))).toBe(93);
    expect(chaptersBetween(every(3, [0]), day('2026-12-01'), day('2026-12-31'))).toBe(81);
    expect(chaptersBetween(every(3), day('2026-12-02'), day('2026-12-01'))).toBe(0);
  });
});
