import { Clock, FileSaver, IdGenerator, LocalDate } from '../lib/local-date';

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

  now(): Date {
    return new Date(`${this.day}T12:00:00.000Z`);
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

/** Keeps saved files in memory, for tests. */
export class InMemoryFileSaver extends FileSaver {
  readonly files: { fileName: string; content: string; type: string }[] = [];

  save(fileName: string, content: string, type: string): void {
    this.files.push({ fileName, content, type });
  }
}
