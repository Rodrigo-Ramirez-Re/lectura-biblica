import { Clock, IdGenerator, LocalDate } from '@lectura/shared-kernel';

export class SystemClock extends Clock {
  today(): LocalDate {
    return LocalDate.fromDate(new Date());
  }
}

export class RandomIdGenerator extends IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
