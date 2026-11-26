import type { BookCatalog } from '@lectura/catalog-domain';
import { LocalDate, err, ok, type Result } from '@lectura/shared-kernel';
import { validatePlan } from './reading-plan';
import {
  BACKUP_INTERVALS,
  BLOCK_STATUSES,
  BLOCK_UNITS,
  SCHEMA_VERSION,
  type BlockRecord,
  type BlockStatus,
  type BlockUnit,
  type PlanSettings,
  type PlanTemplateRecord,
  type Journal,
  type NoteRecord,
  type PlanRecord,
  type ReadingLogRecord,
  type SettingsRecord,
} from './journal';

export const BACKUP_APP = 'lectura-biblica';

/** The JSON file a person keeps (docs/architecture/data-model.md). */
export interface BackupDocument extends Journal {
  readonly schemaVersion: number;
  readonly app: typeof BACKUP_APP;
  readonly exportedAt: string;
}

export type BackupError = 'not-json' | 'not-a-backup' | 'newer-version' | 'invalid';

export interface BackupSummary {
  readonly planName: string | null;
  readonly logs: number;
  readonly firstDate: string | null;
  readonly lastDate: string | null;
  readonly exportedAt: string;
}

export function toBackup(journal: Journal, exportedAt: Date): BackupDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: BACKUP_APP,
    exportedAt: exportedAt.toISOString(),
    settings: journal.settings,
    plan: journal.plan,
    blocks: journal.blocks,
    logs: journal.logs,
    notes: journal.notes,
    templates: journal.templates,
  };
}

/**
 * Upgrades a document of an older `schemaVersion` one step at a time; each step has a test that
 * imports a file of that version.
 */
const migrations: Record<number, (document: Record<string, unknown>) => Record<string, unknown>> = {
  // v2 (LB-014): pace per weekday, pause, plan templates.
  1: (document) => ({
    ...document,
    schemaVersion: 2,
    plan: isObject(document['plan'])
      ? { paceByWeekday: null, pausedSince: null, ...document['plan'] }
      : document['plan'],
    templates: [],
  }),
  // v3 (LB-031): how often to remind of a backup, and "Ahora no".
  2: (document) => ({
    ...document,
    schemaVersion: 3,
    settings: isObject(document['settings'])
      ? { backupEveryDays: 30, backupReminderPostponedUntil: null, ...document['settings'] }
      : document['settings'],
  }),
};

/**
 * Reads a backup file. Anything that is not a complete, valid backup is rejected as a whole:
 * imported data must never leave the app unable to load (LB-013 review).
 */
export function parseBackup(
  text: string,
  catalog: BookCatalog,
): Result<BackupDocument, BackupError> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return err('not-json');
  }
  if (!isObject(data) || data['app'] !== BACKUP_APP || !Number.isInteger(data['schemaVersion']))
    return err('not-a-backup');

  let version = data['schemaVersion'] as number;
  if (version > SCHEMA_VERSION) return err('newer-version');
  let document: Record<string, unknown> = data;
  while (version < SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) return err('invalid');
    document = migrate(document);
    version++;
  }
  return isValidDocument(document) && isConsistent(document, catalog)
    ? ok(document)
    : err('invalid');
}

export function summarize(backup: BackupDocument): BackupSummary {
  const dates = backup.logs.map((log) => log.date).sort();
  return {
    planName: backup.plan?.name ?? null,
    logs: backup.logs.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    exportedAt: backup.exportedAt,
  };
}

const REMINDER_MIN_DAYS = 7;
const POSTPONE_DAYS = 7;

/**
 * A backup is due once there are logs on at least 7 days and none was ever exported (LB-013), or
 * the chosen interval has passed since the day of the last export and something was logged on or
 * after that day (LB-031). Never while turned off or postponed.
 */
export function isBackupDue(journal: Journal, today: LocalDate): boolean {
  const { lastBackupAt, backupEveryDays, backupReminderPostponedUntil } = journal.settings;
  if (backupEveryDays === null) return false;
  if (backupReminderPostponedUntil && today.toString() < backupReminderPostponedUntil) return false;
  if (!lastBackupAt) return new Set(journal.logs.map((log) => log.date)).size >= REMINDER_MIN_DAYS;
  // The local day of the export instant: an evening export in Mexico is already tomorrow in UTC.
  const lastDay = LocalDate.fromDate(new Date(lastBackupAt));
  // Logs carry no time: one on the backup day may have been made after it, so it counts.
  const logsSince = journal.logs.some((log) => log.date >= lastDay.toString());
  return logsSince && !today.plusDays(-backupEveryDays).isBefore(lastDay);
}

/** "Ahora no": the reminder stays away for a week, across app restarts (LB-031). */
export function postponeBackupReminder(settings: SettingsRecord, today: LocalDate): SettingsRecord {
  return { ...settings, backupReminderPostponedUntil: today.plusDays(POSTPONE_DAYS).toString() };
}

// --- validation -------------------------------------------------------------------------------

type Shape = Record<string, unknown>;

const isObject = (value: unknown): value is Shape =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string';
const isDay = (value: unknown) => isText(value) && LocalDate.parse(value).ok;
const isInstant = (value: unknown) =>
  isText(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
const isCount = (value: unknown, min = 0) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min;
const isTextList = (value: unknown) => Array.isArray(value) && value.every(isText);
const listOf = (value: unknown, check: (item: Shape) => boolean) =>
  Array.isArray(value) && value.every((item) => isObject(item) && check(item));

/** The shape of plan settings, as stored in plans, templates and template files. */
export const isPlanSettings = (plan: unknown): plan is PlanSettings =>
  isObject(plan) && isSettings(plan);

const isSettings = (plan: Shape) =>
  isText(plan['name']) &&
  isCount(plan['chaptersPerDay'], 1) &&
  Array.isArray(plan['restDays']) &&
  (plan['restDays'] as unknown[]).every((day) => isCount(day) && (day as number) <= 6) &&
  isTextList(plan['bookOrder']) &&
  isTextList(plan['excluded']) &&
  isObject(plan['defaultBlock']) &&
  BLOCK_UNITS.includes(plan['defaultBlock']['unit'] as BlockUnit) &&
  isCount(plan['defaultBlock']['value'], 1) &&
  (plan['cyclesTarget'] === null || isCount(plan['cyclesTarget'], 1)) &&
  (plan['paceByWeekday'] === null ||
    (Array.isArray(plan['paceByWeekday']) &&
      (plan['paceByWeekday'] as unknown[]).every((n) => isCount(n))));

const isPlan = (plan: Shape): plan is Shape & PlanRecord =>
  isSettings(plan) &&
  isDay(plan['startDate']) &&
  (plan['pausedSince'] === null || isDay(plan['pausedSince']));

const isTemplate = (template: Shape): template is Shape & PlanTemplateRecord =>
  isText(template['id']) &&
  isText(template['name']) &&
  isObject(template['settings']) &&
  isSettings(template['settings']);

const isBlock = (block: Shape): block is Shape & BlockRecord =>
  isText(block['id']) &&
  isCount(block['cycle'], 1) &&
  isText(block['bookId']) &&
  isDay(block['start']) &&
  isDay(block['end']) &&
  (block['start'] as string) <= (block['end'] as string) &&
  (block['goalPasses'] === null || isCount(block['goalPasses'], 1)) &&
  BLOCK_STATUSES.includes(block['status'] as BlockStatus);

const isLog = (log: Shape): log is Shape & ReadingLogRecord =>
  isText(log['id']) &&
  isDay(log['date']) &&
  isText(log['blockId']) &&
  isText(log['bookId']) &&
  isCount(log['startChapter'], 1) &&
  isCount(log['chaptersRead'], 1);

const isNote = (note: Shape): note is Shape & NoteRecord =>
  isText(note['id']) &&
  (note['blockId'] === null || isText(note['blockId'])) &&
  isText(note['bookId']) &&
  isDay(note['date']) &&
  isText(note['text']);

function isValidDocument(document: Shape): document is Shape & BackupDocument {
  const settings = document['settings'];
  return (
    isInstant(document['exportedAt']) &&
    isObject(settings) &&
    (settings['lastBackupAt'] === null || isInstant(settings['lastBackupAt'])) &&
    (settings['backupEveryDays'] === null ||
      BACKUP_INTERVALS.some((days) => days === settings['backupEveryDays'])) &&
    (settings['backupReminderPostponedUntil'] === null ||
      isDay(settings['backupReminderPostponedUntil'])) &&
    (document['plan'] === null || (isObject(document['plan']) && isPlan(document['plan']))) &&
    listOf(document['blocks'], isBlock) &&
    listOf(document['logs'], isLog) &&
    listOf(document['notes'], isNote) &&
    listOf(document['templates'], isTemplate)
  );
}

/** References between collections and to the catalog hold, so every screen can load the data. */
function isConsistent(document: BackupDocument, catalog: BookCatalog): boolean {
  if (document.plan && !validatePlan(document.plan, catalog).ok) return false;
  if (!document.templates.every((template) => validatePlan(template.settings, catalog).ok))
    return false;
  const known = (bookId: string) => catalog.find(bookId) !== undefined;
  const blockIds = new Set(document.blocks.map((block) => block.id));
  return (
    blockIds.size === document.blocks.length &&
    document.blocks.every((block) => known(block.bookId)) &&
    document.logs.every((log) => known(log.bookId) && blockIds.has(log.blockId)) &&
    document.notes.every((note) => known(note.bookId))
  );
}
