import type { LocalDate } from '@lectura/shared-kernel';
import type { PlanRecord } from './journal';

export type Pace = Pick<PlanRecord, 'chaptersPerDay' | 'restDays' | 'paceByWeekday'>;

/** Chapters the plan expects on a day: its weekday's amount, or the daily pace unless resting. */
export function dailyPace(pace: Pace, day: LocalDate): number {
  if (pace.paceByWeekday) return pace.paceByWeekday[day.dayOfWeek] ?? 0;
  return pace.restDays.includes(day.dayOfWeek) ? 0 : pace.chaptersPerDay;
}

/** Chapters the plan expects from `start` to `end`, both included. */
export function chaptersBetween(pace: Pace, start: LocalDate, end: LocalDate): number {
  let total = 0;
  for (let day = start; !day.isAfter(end); day = day.plusDays(1)) total += dailyPace(pace, day);
  return total;
}
