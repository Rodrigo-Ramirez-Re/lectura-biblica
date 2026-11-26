import {
  dailyPace,
  type BlockRecord,
  type Pace,
  type ReadingLogRecord,
} from '@lectura/reading-domain';
import type { LocalDate } from '@lectura/shared-kernel';

/**
 * Chapters the plan expected on a day: its pace for that weekday, but only on days a recorded block
 * covers, so days before the plan started and paused days expect nothing. The pace is the current
 * plan's: its history isn't stored (LB-023 decisions).
 */
export function expectedOn(pace: Pace, blocks: readonly BlockRecord[], day: LocalDate): number {
  const iso = day.toString();
  const covered = blocks.some((block) => block.start <= iso && iso <= block.end);
  return covered ? dailyPace(pace, day) : 0;
}

/** Chapters per reading day across a week; null when the plan never reads. */
export function averagePace(pace: Pace): number | null {
  const week = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    pace.paceByWeekday
      ? (pace.paceByWeekday[weekday] ?? 0)
      : pace.restDays.includes(weekday)
        ? 0
        : pace.chaptersPerDay,
  );
  const reading = week.filter((chapters) => chapters > 0);
  return reading.length ? reading.reduce((a, b) => a + b, 0) / reading.length : null;
}

/** Chapters logged per day, keyed `YYYY-MM-DD`. */
export function chaptersByDay(logs: readonly ReadingLogRecord[]): ReadonlyMap<string, number> {
  const byDay = new Map<string, number>();
  for (const log of logs) byDay.set(log.date, (byDay.get(log.date) ?? 0) + log.chaptersRead);
  return byDay;
}
