import { err, ok, type Result } from './result';

const MS_PER_DAY = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A calendar day with no time or zone (data model: dates are local `YYYY-MM-DD`). Arithmetic runs
 * on UTC day numbers so daylight-saving changes never shift a day.
 */
export class LocalDate {
  private constructor(private readonly epochDay: number) {}

  static parse(text: string): Result<LocalDate, 'invalid-date'> {
    const match = ISO.exec(text);
    if (!match) return err('invalid-date');
    const [year, month, day] = match.slice(1).map(Number);
    const date = LocalDate.of(year, month, day);
    return date.year === year && date.month === month && date.day === day
      ? ok(date)
      : err('invalid-date');
  }

  /** `month` is 1–12. Out-of-range days roll over, as in `Date.UTC`. */
  static of(year: number, month: number, day: number): LocalDate {
    return new LocalDate(Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY));
  }

  /** The calendar day a `Date` falls on in the device's time zone. */
  static fromDate(date: Date): LocalDate {
    return LocalDate.of(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  private get utc(): Date {
    return new Date(this.epochDay * MS_PER_DAY);
  }

  get year(): number {
    return this.utc.getUTCFullYear();
  }

  get month(): number {
    return this.utc.getUTCMonth() + 1;
  }

  get day(): number {
    return this.utc.getUTCDate();
  }

  /** 0 = Sunday … 6 = Saturday. */
  get dayOfWeek(): number {
    return this.utc.getUTCDay();
  }

  plusDays(days: number): LocalDate {
    return new LocalDate(this.epochDay + days);
  }

  endOfMonth(): LocalDate {
    return LocalDate.of(this.year, this.month + 1, 0);
  }

  firstOfNextMonth(): LocalDate {
    return LocalDate.of(this.year, this.month + 1, 1);
  }

  /** Days from this date to `other`; negative when `other` is earlier. */
  daysUntil(other: LocalDate): number {
    return other.epochDay - this.epochDay;
  }

  /** Calendar months from this date's month to `other`'s, counting both (Dec → Jan = 2). */
  monthsSpannedUntil(other: LocalDate): number {
    return (other.year - this.year) * 12 + (other.month - this.month) + 1;
  }

  isBefore(other: LocalDate): boolean {
    return this.epochDay < other.epochDay;
  }

  isAfter(other: LocalDate): boolean {
    return this.epochDay > other.epochDay;
  }

  equals(other: LocalDate): boolean {
    return this.epochDay === other.epochDay;
  }

  toString(): string {
    const pad = (n: number, width = 2) => String(n).padStart(width, '0');
    return `${pad(this.year, 4)}-${pad(this.month)}-${pad(this.day)}`;
  }

  /** Local noon, so formatting in any zone shows this day. */
  toDate(): Date {
    return new Date(this.year, this.month - 1, this.day, 12);
  }
}

/** Where "today" comes from; tests use a fixed one (docs/conventions/testing.md). */
export abstract class Clock {
  abstract today(): LocalDate;
}

/** Random ids generated on the device for stored records. */
export abstract class IdGenerator {
  abstract next(): string;
}
