import { Clock, FileSaver, IdGenerator, LocalDate } from '@lectura/shared-kernel';

export class SystemClock extends Clock {
  today(): LocalDate {
    return LocalDate.fromDate(new Date());
  }

  now(): Date {
    return new Date();
  }
}

export class RandomIdGenerator extends IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}

/** Downloads a file through a temporary link, which works offline and in installed PWAs. */
export class BrowserFileSaver extends FileSaver {
  save(fileName: string, content: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
