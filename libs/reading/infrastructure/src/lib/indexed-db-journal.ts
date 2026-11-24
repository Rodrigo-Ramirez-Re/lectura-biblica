import {
  JournalReader,
  emptyJournal,
  type BlockRecord,
  type Journal,
  type JournalWriter,
  type NoteRecord,
  type PlanRecord,
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

/** The journal in IndexedDB, one store per collection (ADR 0003). */
export class IndexedDbJournal extends JournalReader implements JournalWriter {
  private database?: Promise<LecturaDatabase>;
  private persistenceRequested = false;

  constructor(private readonly storage: StorageGuard) {
    super();
  }

  async load(): Promise<Journal> {
    const db = await this.db();
    const tx = db.transaction(STORES, 'readonly');
    const [settings, plan, blocks, logs, notes] = await Promise.all([
      tx.objectStore('settings').get(SINGLE),
      tx.objectStore('plan').get(SINGLE),
      tx.objectStore('blocks').getAll(),
      tx.objectStore('logs').getAll(),
      tx.objectStore('notes').getAll(),
    ]);
    return {
      settings: (settings as SettingsRecord | undefined) ?? emptyJournal.settings,
      plan: (plan as PlanRecord | undefined) ?? null,
      blocks: blocks as unknown as BlockRecord[],
      logs: logs as unknown as ReadingLogRecord[],
      notes: notes as unknown as NoteRecord[],
    };
  }

  async savePlan(plan: PlanRecord): Promise<void> {
    await (await this.writable()).put('plan', plan, SINGLE);
  }

  async saveBlocks(blocks: readonly BlockRecord[]): Promise<void> {
    const tx = (await this.writable()).transaction('blocks', 'readwrite');
    await Promise.all([...blocks.map((block) => tx.store.put(block)), tx.done]);
  }

  async addLog(log: ReadingLogRecord): Promise<void> {
    await (await this.writable()).put('logs', log);
  }

  async removeLog(id: string): Promise<void> {
    await (await this.writable()).delete('logs', id);
  }

  async saveSettings(settings: SettingsRecord): Promise<void> {
    await (await this.writable()).put('settings', settings, SINGLE);
  }

  async replaceAll(journal: Journal): Promise<void> {
    const tx = (await this.writable()).transaction(STORES, 'readwrite');
    await Promise.all([
      ...STORES.map((store) => tx.objectStore(store).clear()),
      tx.objectStore('settings').put(journal.settings, SINGLE),
      ...(journal.plan ? [tx.objectStore('plan').put(journal.plan, SINGLE)] : []),
      ...journal.blocks.map((block) => tx.objectStore('blocks').put(block)),
      ...journal.logs.map((log) => tx.objectStore('logs').put(log)),
      ...journal.notes.map((note) => tx.objectStore('notes').put(note)),
      tx.done,
    ]);
  }

  private db(): Promise<LecturaDatabase> {
    this.database ??= openLecturaDatabase();
    return this.database;
  }

  // The first write of a session asks the browser to keep the data (LB-010).
  private async writable(): Promise<LecturaDatabase> {
    if (!this.persistenceRequested) {
      this.persistenceRequested = true;
      await this.storage.persist();
    }
    return this.db();
  }
}
