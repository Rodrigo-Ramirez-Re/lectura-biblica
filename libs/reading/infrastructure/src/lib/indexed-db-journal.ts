import {
  JournalReader,
  emptyJournal,
  upgradePlan,
  type BlockRecord,
  type Journal,
  type JournalWriter,
  type NoteRecord,
  type PlanRecord,
  type PlanTemplateRecord,
  type ReadingLogRecord,
  type SettingsRecord,
} from '@lectura/reading-domain';
import {
  STORES,
  openLecturaDatabase,
  type LecturaDatabase,
} from '@lectura/shared-infrastructure-browser';
import type { StorageGuard } from '@lectura/shared-kernel';

const SINGLE = 'current';

/**
 * The journal in IndexedDB, one store per collection (ADR 0003). Each operation opens and closes
 * its own connection: an idle open connection blocks a future schema upgrade from another tab.
 */
export class IndexedDbJournal extends JournalReader implements JournalWriter {
  private persistenceRequested = false;

  constructor(private readonly storage: StorageGuard) {
    super();
  }

  load(): Promise<Journal> {
    return this.read(async (db) => {
      const tx = db.transaction(STORES, 'readonly');
      const [settings, plan, blocks, logs, notes, templates] = await Promise.all([
        tx.objectStore('settings').get(SINGLE),
        tx.objectStore('plan').get(SINGLE),
        tx.objectStore('blocks').getAll(),
        tx.objectStore('logs').getAll(),
        tx.objectStore('notes').getAll(),
        tx.objectStore('templates').getAll(),
      ]);
      return {
        settings: (settings as SettingsRecord | undefined) ?? emptyJournal.settings,
        plan: plan ? upgradePlan(plan as PlanRecord) : null,
        blocks: blocks as unknown as BlockRecord[],
        logs: logs as unknown as ReadingLogRecord[],
        notes: notes as unknown as NoteRecord[],
        templates: templates as unknown as PlanTemplateRecord[],
      };
    });
  }

  savePlan(plan: PlanRecord): Promise<void> {
    return this.write(async (db) => void (await db.put('plan', plan, SINGLE)));
  }

  saveBlocks(blocks: readonly BlockRecord[]): Promise<void> {
    return this.write(async (db) => {
      const tx = db.transaction('blocks', 'readwrite');
      await Promise.all([...blocks.map((block) => tx.store.put(block)), tx.done]);
    });
  }

  removeBlock(id: string): Promise<void> {
    return this.write((db) => db.delete('blocks', id));
  }

  addLog(log: ReadingLogRecord): Promise<void> {
    return this.write(async (db) => void (await db.put('logs', log)));
  }

  saveLogs(logs: readonly ReadingLogRecord[]): Promise<void> {
    return this.write(async (db) => {
      const tx = db.transaction('logs', 'readwrite');
      await Promise.all([...logs.map((log) => tx.store.put(log)), tx.done]);
    });
  }

  removeLog(id: string): Promise<void> {
    return this.write((db) => db.delete('logs', id));
  }

  saveSettings(settings: SettingsRecord): Promise<void> {
    return this.write(async (db) => void (await db.put('settings', settings, SINGLE)));
  }

  replaceAll(journal: Journal): Promise<void> {
    return this.write(async (db) => {
      const tx = db.transaction(STORES, 'readwrite');
      await Promise.all([
        ...STORES.map((store) => tx.objectStore(store).clear()),
        tx.objectStore('settings').put(journal.settings, SINGLE),
        ...(journal.plan ? [tx.objectStore('plan').put(journal.plan, SINGLE)] : []),
        ...journal.blocks.map((block) => tx.objectStore('blocks').put(block)),
        ...journal.logs.map((log) => tx.objectStore('logs').put(log)),
        ...journal.notes.map((note) => tx.objectStore('notes').put(note)),
        ...journal.templates.map((template) => tx.objectStore('templates').put(template)),
        tx.done,
      ]);
    });
  }

  private async read<T>(operation: (db: LecturaDatabase) => Promise<T>): Promise<T> {
    const db = await openLecturaDatabase();
    try {
      return await operation(db);
    } finally {
      db.close();
    }
  }

  // The first write of a session asks the browser to keep the data (LB-010). Not awaited: Firefox
  // answers only after the person replies to its permission prompt, and saving must not wait.
  private write(operation: (db: LecturaDatabase) => Promise<void>): Promise<void> {
    if (!this.persistenceRequested) {
      this.persistenceRequested = true;
      void this.storage.persist();
    }
    return this.read(operation);
  }
}
