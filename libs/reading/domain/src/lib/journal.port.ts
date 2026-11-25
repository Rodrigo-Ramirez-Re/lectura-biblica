import type { BlockRecord, Journal, PlanRecord, ReadingLogRecord, SettingsRecord } from './journal';

export abstract class JournalReader {
  abstract load(): Promise<Journal>;
}

export abstract class JournalWriter {
  abstract savePlan(plan: PlanRecord): Promise<void>;
  abstract saveBlocks(blocks: readonly BlockRecord[]): Promise<void>;
  abstract removeBlock(id: string): Promise<void>;
  abstract addLog(log: ReadingLogRecord): Promise<void>;
  abstract removeLog(id: string): Promise<void>;
  /** Saves logs that already exist or new ones, by id. */
  abstract saveLogs(logs: readonly ReadingLogRecord[]): Promise<void>;
  abstract saveSettings(settings: SettingsRecord): Promise<void>;
  /** Replaces everything in one transaction: all of it is written, or nothing changes. */
  abstract replaceAll(journal: Journal): Promise<void>;
}
