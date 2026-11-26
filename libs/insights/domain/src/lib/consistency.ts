import { dailyPace, type Journal } from '@lectura/reading-domain';
import { LocalDate } from '@lectura/shared-kernel';
import { chaptersByDay, expectedOn } from './daily';

export interface Streaks {
  /** Reading days in a row up to today, or up to yesterday while today isn't read yet. */
  readonly current: number;
  readonly best: number;
}

const parse = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

/**
 * Streaks of reading days (LB-024). A day with any chapter counts, even fewer than expected; a
 * missed day that expected reading breaks the run; days that expect nothing (rest, pause) leave it
 * as it is. Null until something is read.
 */
export function streaks(journal: Journal, today: LocalDate): Streaks | null {
  const { plan, logs, blocks } = journal;
  if (!plan || !logs.length) return null;
  const byDay = chaptersByDay(logs);
  const first = [plan.startDate, ...logs.map((log) => log.date)].sort()[0] ?? plan.startDate;
  let current = 0;
  let best = 0;
  for (let day = parse(first); !day.isAfter(today); day = day.plusDays(1)) {
    if ((byDay.get(day.toString()) ?? 0) > 0) {
      current++;
      best = Math.max(best, current);
    } else if (!day.equals(today) && expectedOn(plan, blocks, day) > 0) {
      current = 0;
    }
  }
  return { current, best };
}

export type DayState = 'read' | 'missed' | 'today' | 'rest' | 'upcoming';

export interface MonthDay {
  readonly day: LocalDate;
  readonly chapters: number;
  readonly expected: number;
  readonly state: DayState;
}

export interface MonthDays {
  /** Days so far with any chapter read. */
  readonly readDays: number;
  /** Days so far that expected reading, plus the rest days read on. */
  readonly readingDays: number;
  /** Every day of the month, the ones still to come included. */
  readonly days: readonly MonthDay[];
}

/** The calendar of today's month (LB-024). */
export function monthDays(journal: Journal, today: LocalDate): MonthDays | null {
  const { plan, blocks } = journal;
  if (!plan) return null;
  const byDay = chaptersByDay(journal.logs);
  const days: MonthDay[] = [];
  const last = today.endOfMonth();
  for (
    let day = LocalDate.of(today.year, today.month, 1);
    !day.isAfter(last);
    day = day.plusDays(1)
  ) {
    const chapters = byDay.get(day.toString()) ?? 0;
    // Days to come have no block recorded yet: they show what the plan will expect, unless paused.
    const expected = !day.isAfter(today)
      ? expectedOn(plan, blocks, day)
      : plan.pausedSince
        ? 0
        : dailyPace(plan, day);
    days.push({ day, chapters, expected, state: stateOf(day, today, chapters, expected) });
  }
  const sofar = days.filter((d) => !d.day.isAfter(today));
  return {
    readDays: sofar.filter((d) => d.chapters > 0).length,
    readingDays: sofar.filter((d) => d.chapters > 0 || d.expected > 0).length,
    days,
  };
}

function stateOf(day: LocalDate, today: LocalDate, chapters: number, expected: number): DayState {
  if (chapters > 0) return 'read';
  if (day.isAfter(today)) return 'upcoming';
  if (expected === 0) return 'rest';
  return day.equals(today) ? 'today' : 'missed';
}
