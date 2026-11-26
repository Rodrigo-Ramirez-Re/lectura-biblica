import type { Journal } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { averagePace, chaptersByDay, expectedOn } from './daily';

export interface PacePoint {
  readonly day: LocalDate;
  /** Chapters read from the 1st of the month to this day, included. */
  readonly read: number;
  /** Chapters the plan expected over the same days. */
  readonly expected: number;
}

export interface OnPace {
  readonly read: number;
  readonly expected: number;
  /** Positive when ahead, negative when behind. */
  readonly difference: number;
  /** The difference in reading days at the plan's average pace, rounded; null if it never reads. */
  readonly days: number | null;
  readonly series: readonly PacePoint[];
}

/** "¿Voy al día?": this calendar month up to today, read vs expected (LB-023). */
export function onPace(journal: Journal, today: LocalDate): OnPace | null {
  const { plan } = journal;
  if (!plan) return null;
  const byDay = chaptersByDay(journal.logs);
  const series: PacePoint[] = [];
  let read = 0;
  let expected = 0;
  for (
    let day = LocalDate.of(today.year, today.month, 1);
    !day.isAfter(today);
    day = day.plusDays(1)
  ) {
    read += byDay.get(day.toString()) ?? 0;
    expected += expectedOn(plan, journal.blocks, day);
    series.push({ day, read, expected });
  }
  const difference = read - expected;
  const pace = averagePace(plan);
  // `|| 0` turns Math.round's -0 into 0.
  const days = pace === null ? null : Math.round(difference / pace) || 0;
  return { read, expected, difference, days, series };
}
