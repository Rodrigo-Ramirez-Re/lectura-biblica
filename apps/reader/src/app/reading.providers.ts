import { inject, type Provider } from '@angular/core';
import { AdvanceBlocks, GetSchedule, StartDefaultPlan } from '@lectura/reading-application';
import { JournalReader, JournalWriter } from '@lectura/reading-domain';
import { IndexedDbJournal } from '@lectura/reading-infrastructure';
import {
  BrowserStorageGuard,
  RandomIdGenerator,
  SystemClock,
} from '@lectura/shared-infrastructure-browser';
import { Clock, IdGenerator, StorageGuard } from '@lectura/shared-kernel';

/** Binds the reading ports to the device adapters and exposes the use cases to the screens. */
export function provideReading(): Provider[] {
  return [
    { provide: StorageGuard, useFactory: () => new BrowserStorageGuard() },
    { provide: Clock, useFactory: () => new SystemClock() },
    { provide: IdGenerator, useFactory: () => new RandomIdGenerator() },
    { provide: IndexedDbJournal, useFactory: () => new IndexedDbJournal(inject(StorageGuard)) },
    { provide: JournalReader, useExisting: IndexedDbJournal },
    { provide: JournalWriter, useExisting: IndexedDbJournal },
    {
      provide: StartDefaultPlan,
      useFactory: () =>
        new StartDefaultPlan(
          inject(JournalReader),
          inject(JournalWriter),
          inject(Clock),
          inject(IdGenerator),
        ),
    },
    {
      provide: AdvanceBlocks,
      useFactory: () =>
        new AdvanceBlocks(
          inject(JournalReader),
          inject(JournalWriter),
          inject(Clock),
          inject(IdGenerator),
        ),
    },
    {
      provide: GetSchedule,
      useFactory: () => new GetSchedule(inject(JournalReader), inject(Clock)),
    },
  ];
}
