import { Clock, IdGenerator, LocalDate } from '../lib/local-date';

/** A clock stopped on a given day, for tests. */
export class FixedClock extends Clock {
  constructor(private day: string) {
    super();
  }

  today(): LocalDate {
    const parsed = LocalDate.parse(this.day);
    if (!parsed.ok) throw new Error(`FixedClock: "${this.day}" is not YYYY-MM-DD`);
    return parsed.value;
  }

  set(day: string): void {
    this.day = day;
  }
}

/** Predictable ids (`id-1`, `id-2`…), for tests. */
export class SequentialIds extends IdGenerator {
  private count = 0;

  next(): string {
    return `id-${++this.count}`;
  }
}
