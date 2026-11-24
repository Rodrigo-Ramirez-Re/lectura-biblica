import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  emptyJournal,
  isBackupDue,
  parseBackup,
  summarize,
  toBackup,
  type BackupError,
  type BackupSummary,
  type JournalReader,
  type JournalWriter,
} from '@lectura/reading-domain';
import { err, ok, type Clock, type FileSaver, type Result } from '@lectura/shared-kernel';

/** Downloads the whole dataset as JSON and remembers when (LB-013). */
export class ExportBackup {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly files: FileSaver,
  ) {}

  async execute(): Promise<void> {
    const journal = await this.reader.load();
    const exportedAt = this.clock.now();
    const settings = { ...journal.settings, lastBackupAt: exportedAt.toISOString() };
    const backup = toBackup({ ...journal, settings }, exportedAt);
    this.files.save(
      `lectura-biblica-respaldo-${this.clock.today().toString()}.json`,
      JSON.stringify(backup, null, 2),
      'application/json',
    );
    await this.writer.saveSettings(settings);
  }
}

/** What a backup file contains, shown before anything is replaced (LB-013). */
export class PreviewBackup {
  constructor(private readonly catalog: BookCatalog = bookCatalog) {}

  execute(text: string): Result<BackupSummary, BackupError> {
    const parsed = parseBackup(text, this.catalog);
    return parsed.ok ? ok(summarize(parsed.value)) : parsed;
  }
}

/** Replaces all data with a valid backup in one transaction, or changes nothing (LB-013). */
export class ImportBackup {
  constructor(
    private readonly writer: JournalWriter,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(text: string): Promise<Result<void, BackupError>> {
    const parsed = parseBackup(text, this.catalog);
    if (!parsed.ok) return err(parsed.error);
    const { settings, plan, blocks, logs, notes, templates } = parsed.value;
    await this.writer.replaceAll({ settings, plan, blocks, logs, notes, templates });
    return ok(undefined);
  }
}

/** Deletes everything recorded on this device (LB-013). */
export class DeleteAllData {
  constructor(private readonly writer: JournalWriter) {}

  execute(): Promise<void> {
    return this.writer.replaceAll(emptyJournal);
  }
}

/** Whether Hoy should remind the person to export a backup (LB-013). */
export class CheckBackupReminder {
  constructor(
    private readonly reader: JournalReader,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<boolean> {
    return isBackupDue(await this.reader.load(), this.clock.today());
  }
}
