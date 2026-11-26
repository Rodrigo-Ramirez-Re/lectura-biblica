import type { Journal } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { chaptersByDay, expectedOn } from './daily';

export interface WeekdayAverage {
  /** 0 is Sunday, as in `Date.getDay()`. */
  readonly weekday: number;
  readonly average: number;
}

export type Habits =
  | {
      readonly kind: 'habits';
      /** Monday to Sunday. */
      readonly weekdays: readonly WeekdayAverage[];
      /** Chapters per day over every day counted. */
      readonly dailyAverage: number;
      /** Chapters per day over the last 7 days, today included. */
      readonly last7Average: number;
      /** Days of the last 30 (today excluded) that expected reading and had none. */
      readonly zeroDays: number;
    }
  /** Less than a week of reading to learn from. */
  | { readonly kind: 'too-early' };

const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];
const MIN_DAYS = 7;

/**
 * "¿Cómo leo?" (LB-027). Averages count every day from the first log on, the ones without reading
 * included, so a skipped Saturday lowers the Saturday bar; today only counts once something is read.
 */
export function habits(journal: Journal, today: LocalDate): Habits {
  const { plan, blocks, logs } = journal;
  const first = logs.map((log) => log.date).sort()[0];
  if (!plan || !first) return { kind: 'too-early' };
  const byDay = chaptersByDay(logs);
  const read = (day: LocalDate) => byDay.get(day.toString()) ?? 0;
  const last = read(today) > 0 ? today : today.plusDays(-1);
  const parsed = LocalDate.parse(first);
  if (!parsed.ok) throw new Error(`Stored date "${first}" is not YYYY-MM-DD`);

  const totals = new Map<number, { chapters: number; days: number }>();
  let chapters = 0;
  let days = 0;
  for (let day = parsed.value; !day.isAfter(last); day = day.plusDays(1)) {
    const entry = totals.get(day.dayOfWeek) ?? { chapters: 0, days: 0 };
    totals.set(day.dayOfWeek, { chapters: entry.chapters + read(day), days: entry.days + 1 });
    chapters += read(day);
    days++;
  }
  if (days < MIN_DAYS) return { kind: 'too-early' };

  let last7 = 0;
  for (let i = 0; i < 7; i++) last7 += read(today.plusDays(-i));
  let zeroDays = 0;
  for (let i = 1; i <= 30; i++) {
    const day = today.plusDays(-i);
    if (read(day) === 0 && expectedOn(plan, blocks, day) > 0) zeroDays++;
  }

  return {
    kind: 'habits',
    weekdays: MONDAY_FIRST.map((weekday) => {
      const entry = totals.get(weekday);
      return { weekday, average: entry?.days ? entry.chapters / entry.days : 0 };
    }),
    dailyAverage: chapters / days,
    last7Average: last7 / 7,
    zeroDays,
  };
}
