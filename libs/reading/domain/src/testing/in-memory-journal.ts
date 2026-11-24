import {
  emptyJournal,
  type BlockRecord,
  type Journal,
  type PlanRecord,
  type ReadingLogRecord,
  type SettingsRecord,
} from '../lib/journal';
import { JournalReader, type JournalWriter } from '../lib/journal.port';

/** The journal ports in memory, for tests of use cases and screens. */
export class InMemoryJournal extends JournalReader implements JournalWriter {
  constructor(public journal: Journal = emptyJournal) {
    super();
  }

  async load(): Promise<Journal> {
    return this.journal;
  }

  async savePlan(plan: PlanRecord): Promise<void> {
    this.journal = { ...this.journal, plan };
  }

  async saveBlocks(blocks: readonly BlockRecord[]): Promise<void> {
    const ids = new Set(blocks.map((block) => block.id));
    this.journal = {
      ...this.journal,
      blocks: [...this.journal.blocks.filter((block) => !ids.has(block.id)), ...blocks],
    };
  }

  async addLog(log: ReadingLogRecord): Promise<void> {
    this.journal = { ...this.journal, logs: [...this.journal.logs, log] };
  }

  async removeLog(id: string): Promise<void> {
    this.journal = { ...this.journal, logs: this.journal.logs.filter((log) => log.id !== id) };
  }

  async saveSettings(settings: SettingsRecord): Promise<void> {
    this.journal = { ...this.journal, settings };
  }

  async replaceAll(journal: Journal): Promise<void> {
    this.journal = journal;
  }
}
