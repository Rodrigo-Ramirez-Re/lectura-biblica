import type { BookCatalog } from '@lectura/catalog-domain';
import { err, ok, type LocalDate, type Result } from '@lectura/shared-kernel';
import type { Journal, ReadingLogRecord } from './journal';
import { nextChapter, type LogError } from './progress';

export type LogEditError = LogError | 'not-found';

/** What to write after editing logs: the logs to save and the ones to remove. */
export interface LogChanges {
  readonly save: readonly ReadingLogRecord[];
  readonly remove: readonly string[];
}

/**
 * Renumbers the chapters each log of a block covers, in date order (logs of the same day keep the
 * order they were made in), so ranges stay consecutive after an edit (LB-020). Only changed logs
 * are returned. Passes do not depend on this: they add up chapters.
 */
export function renumber(
  blockLogs: readonly ReadingLogRecord[],
  bookChapters: number,
): ReadingLogRecord[] {
  const ordered = blockLogs
    .map((log, index) => ({ log, index }))
    .sort((a, b) => a.log.date.localeCompare(b.log.date) || a.index - b.index)
    .map(({ log }) => log);
  let read = 0;
  const changed: ReadingLogRecord[] = [];
  for (const log of ordered) {
    const startChapter = nextChapter(read, bookChapters);
    if (log.startChapter !== startChapter) changed.push({ ...log, startChapter });
    read += log.chaptersRead;
  }
  return changed;
}

function chaptersOf(log: ReadingLogRecord, catalog: BookCatalog): number {
  return catalog.find(log.bookId)?.chapters ?? 1;
}

/** Corrects the day or the amount of a log within its block (LB-020). */
export function editLog(
  journal: Journal,
  logId: string,
  changes: { date: LocalDate; chaptersRead: number },
  today: LocalDate,
  catalog: BookCatalog,
): Result<LogChanges, LogEditError> {
  const log = journal.logs.find((candidate) => candidate.id === logId);
  const block = log && journal.blocks.find((candidate) => candidate.id === log.blockId);
  if (!log || !block) return err('not-found');
  const { date, chaptersRead } = changes;
  if (!Number.isInteger(chaptersRead) || chaptersRead < 1) return err('invalid-amount');
  if (date.isAfter(today)) return err('in-the-future');
  const day = date.toString();
  if (day < block.start || day > block.end) return err('outside-block');

  const edited = { ...log, date: day, chaptersRead };
  const blockLogs = journal.logs
    .filter((candidate) => candidate.blockId === block.id)
    .map((candidate) => (candidate.id === logId ? edited : candidate));
  const renumbered = renumber(blockLogs, chaptersOf(log, catalog));
  const save = renumbered.some((candidate) => candidate.id === logId)
    ? renumbered
    : [edited, ...renumbered];
  return ok({ save, remove: [] });
}

/** Deletes a log; the rest of its block is renumbered (LB-020). */
export function deleteLog(
  journal: Journal,
  logId: string,
  catalog: BookCatalog,
): Result<LogChanges, LogEditError> {
  const log = journal.logs.find((candidate) => candidate.id === logId);
  if (!log) return err('not-found');
  const rest = journal.logs.filter(
    (candidate) => candidate.blockId === log.blockId && candidate.id !== logId,
  );
  return ok({ save: renumber(rest, chaptersOf(log, catalog)), remove: [logId] });
}
