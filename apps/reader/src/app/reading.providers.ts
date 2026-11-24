import { inject, type Provider } from '@angular/core';
import { BOOK_SECTIONS } from '@lectura/catalog-util-book-sections';
import {
  AdvanceBlocks,
  CheckBackupReminder,
  DeleteAllData,
  ExportBackup,
  GetBookProgress,
  GetPlan,
  GetSchedule,
  GetToday,
  ImportBackup,
  LogReading,
  PreviewBackup,
  SetBlockGoal,
  StartDefaultPlan,
  UndoReading,
  UpdatePlan,
} from '@lectura/reading-application';
import { JournalReader, JournalWriter } from '@lectura/reading-domain';
import { IndexedDbJournal } from '@lectura/reading-infrastructure';
import {
  BrowserFileSaver,
  BrowserStorageGuard,
  RandomIdGenerator,
  SystemClock,
} from '@lectura/shared-infrastructure-browser';
import { Clock, FileSaver, IdGenerator, StorageGuard } from '@lectura/shared-kernel';

/** Binds the reading ports to the device adapters and exposes the use cases to the screens. */
export function provideReading(): Provider[] {
  return [
    { provide: StorageGuard, useFactory: () => new BrowserStorageGuard() },
    { provide: Clock, useFactory: () => new SystemClock() },
    { provide: IdGenerator, useFactory: () => new RandomIdGenerator() },
    { provide: FileSaver, useFactory: () => new BrowserFileSaver() },
    { provide: IndexedDbJournal, useFactory: () => new IndexedDbJournal(inject(StorageGuard)) },
    { provide: JournalReader, useExisting: IndexedDbJournal },
    { provide: JournalWriter, useExisting: IndexedDbJournal },
    {
      provide: StartDefaultPlan,
      useFactory: () =>
        new StartDefaultPlan(inject(JournalReader), inject(JournalWriter), inject(Clock)),
    },
    {
      provide: AdvanceBlocks,
      useFactory: () =>
        new AdvanceBlocks(inject(JournalReader), inject(JournalWriter), inject(Clock)),
    },
    {
      provide: GetSchedule,
      useFactory: () => new GetSchedule(inject(JournalReader), inject(Clock)),
    },
    { provide: GetToday, useFactory: () => new GetToday(inject(JournalReader), inject(Clock)) },
    {
      provide: LogReading,
      useFactory: () =>
        new LogReading(
          inject(JournalReader),
          inject(JournalWriter),
          inject(Clock),
          inject(IdGenerator),
        ),
    },
    { provide: UndoReading, useFactory: () => new UndoReading(inject(JournalWriter)) },
    { provide: GetBookProgress, useFactory: () => new GetBookProgress(inject(JournalReader)) },
    {
      provide: BOOK_SECTIONS,
      multi: true,
      useValue: {
        order: 10,
        load: () => import('@lectura/reading-feature-today').then((m) => m.BookProgressSection),
      },
    },
    {
      provide: ExportBackup,
      useFactory: () =>
        new ExportBackup(
          inject(JournalReader),
          inject(JournalWriter),
          inject(Clock),
          inject(FileSaver),
        ),
    },
    { provide: PreviewBackup, useFactory: () => new PreviewBackup() },
    { provide: ImportBackup, useFactory: () => new ImportBackup(inject(JournalWriter)) },
    { provide: DeleteAllData, useFactory: () => new DeleteAllData(inject(JournalWriter)) },
    {
      provide: CheckBackupReminder,
      useFactory: () => new CheckBackupReminder(inject(JournalReader), inject(Clock)),
    },
    { provide: GetPlan, useFactory: () => new GetPlan(inject(JournalReader)) },
    {
      provide: UpdatePlan,
      useFactory: () => new UpdatePlan(inject(JournalReader), inject(JournalWriter)),
    },
    {
      provide: SetBlockGoal,
      useFactory: () =>
        new SetBlockGoal(inject(JournalReader), inject(JournalWriter), inject(Clock)),
    },
  ];
}
