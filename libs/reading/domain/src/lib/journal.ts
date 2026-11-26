/**
 * The stored shape of the reading data (docs/architecture/data-model.md). Changing any of these
 * needs a story decision and a `schemaVersion` migration (ADR 0007).
 */
export const SCHEMA_VERSION = 3;

/** A local calendar day, `YYYY-MM-DD`. */
export type IsoDate = string;

export type BlockUnit = 'month' | 'weeks' | 'days' | 'passes';

export const BLOCK_UNITS: readonly BlockUnit[] = ['month', 'weeks', 'days', 'passes'];

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
  /** Chapters per weekday, Sunday first; 0 = rest. Null: `chaptersPerDay` except `restDays`. */
  readonly paceByWeekday: readonly number[] | null;
  /** The day the plan was paused; null while it runs. */
  readonly pausedSince: IsoDate | null;
}

/** How one reads, without when: what a plan template holds. */
export type PlanSettings = Omit<PlanRecord, 'startDate' | 'pausedSince'>;

export interface PlanTemplateRecord {
  readonly id: string;
  readonly name: string;
  readonly settings: PlanSettings;
}

/**
 * `skipped` books count as read in their cycle; `replaced` and `paused` ones go back to the queue.
 */
export type BlockStatus = 'active' | 'done' | 'skipped' | 'paused' | 'replaced';

export const BLOCK_STATUSES: readonly BlockStatus[] = [
  'active',
  'done',
  'skipped',
  'paused',
  'replaced',
];

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

/** How often the backup reminder may come, in days (LB-031). */
export const BACKUP_INTERVALS = [7, 14, 30, 90] as const;

export type BackupInterval = (typeof BACKUP_INTERVALS)[number];

export interface SettingsRecord {
  /** Instant of the last backup export, ISO 8601. */
  readonly lastBackupAt: string | null;
  /** Days between backup reminders; null never reminds. */
  readonly backupEveryDays: BackupInterval | null;
  /** After "Ahora no", the first day the reminder may come back. */
  readonly backupReminderPostponedUntil: IsoDate | null;
}

/** Everything a person has recorded: what a backup contains. */
export interface Journal {
  readonly settings: SettingsRecord;
  readonly plan: PlanRecord | null;
  readonly blocks: readonly BlockRecord[];
  readonly logs: readonly ReadingLogRecord[];
  readonly notes: readonly NoteRecord[];
  readonly templates: readonly PlanTemplateRecord[];
}

export const emptyJournal: Journal = {
  settings: { lastBackupAt: null, backupEveryDays: 30, backupReminderPostponedUntil: null },
  plan: null,
  blocks: [],
  logs: [],
  notes: [],
  templates: [],
};

/** A plan stored by version 1, completed with the defaults of the fields version 2 added. */
export function upgradePlan(
  plan: Omit<PlanRecord, 'paceByWeekday' | 'pausedSince'> & Partial<PlanRecord>,
): PlanRecord {
  return {
    ...plan,
    paceByWeekday: plan.paceByWeekday ?? null,
    pausedSince: plan.pausedSince ?? null,
  };
}

/** Settings stored by version 2, completed with the defaults of the fields version 3 added. */
export function upgradeSettings(
  settings: Pick<SettingsRecord, 'lastBackupAt'> & Partial<SettingsRecord>,
): SettingsRecord {
  return { ...emptyJournal.settings, ...settings };
}

/** Only the settings of a plan or template: drops the start date, the pause and anything unknown. */
export function planSettings(plan: PlanSettings): PlanSettings {
  const { name, chaptersPerDay, restDays, paceByWeekday, bookOrder, excluded } = plan;
  return {
    name,
    chaptersPerDay,
    restDays,
    paceByWeekday,
    bookOrder,
    excluded,
    defaultBlock: plan.defaultBlock,
    cyclesTarget: plan.cyclesTarget,
  };
}
