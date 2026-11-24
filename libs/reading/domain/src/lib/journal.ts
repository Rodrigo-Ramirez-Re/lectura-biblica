/**
 * The stored shape of the reading data (docs/architecture/data-model.md). Changing any of these
 * needs a story decision and a `schemaVersion` migration (ADR 0007).
 */
export const SCHEMA_VERSION = 1;

/** A local calendar day, `YYYY-MM-DD`. */
export type IsoDate = string;

export type BlockUnit = 'month';

export interface PlanRecord {
  readonly name: string;
  readonly startDate: IsoDate;
  readonly chaptersPerDay: number;
  /** Weekdays with no reading expected, 0 = Sunday. */
  readonly restDays: readonly number[];
  readonly bookOrder: readonly string[];
  readonly excluded: readonly string[];
  readonly defaultBlock: { readonly unit: BlockUnit; readonly value: number };
  readonly cyclesTarget: number | null;
}

export type BlockStatus = 'active' | 'done';

export interface BlockRecord {
  readonly id: string;
  readonly cycle: number;
  readonly bookId: string;
  readonly start: IsoDate;
  readonly end: IsoDate;
  readonly goalPasses: number | null;
  readonly status: BlockStatus;
}

export interface ReadingLogRecord {
  readonly id: string;
  readonly date: IsoDate;
  readonly blockId: string;
  readonly bookId: string;
  readonly startChapter: number;
  readonly chaptersRead: number;
}

export interface NoteRecord {
  readonly id: string;
  readonly blockId: string | null;
  readonly bookId: string;
  readonly date: IsoDate;
  readonly text: string;
}

export interface SettingsRecord {
  /** Instant of the last backup export, ISO 8601. */
  readonly lastBackupAt: string | null;
}

/** Everything a person has recorded: what a backup contains. */
export interface Journal {
  readonly settings: SettingsRecord;
  readonly plan: PlanRecord | null;
  readonly blocks: readonly BlockRecord[];
  readonly logs: readonly ReadingLogRecord[];
  readonly notes: readonly NoteRecord[];
}

export const emptyJournal: Journal = {
  settings: { lastBackupAt: null },
  plan: null,
  blocks: [],
  logs: [],
  notes: [],
};
