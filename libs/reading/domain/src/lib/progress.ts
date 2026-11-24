import { err, ok, type LocalDate, type Result } from '@lectura/shared-kernel';
import type { BlockRecord, ReadingLogRecord } from './journal';

/** Consecutive chapters of one pass, e.g. Salmos 4–6. `from === to` for a single chapter. */
export interface ChapterSpan {
  readonly from: number;
  readonly to: number;
}

/**
 * The spans `count` chapters cover from `start`, wrapping to chapter 1 after the last one
 * (data model: ranges wrap). Rut 4 + 3 chapters → 4, then 1–2. Abdías 1 × 3 → 1, 1, 1.
 */
export function chapterSpans(start: number, count: number, bookChapters: number): ChapterSpan[] {
  const spans: ChapterSpan[] = [];
  let from = start;
  let left = count;
  while (left > 0) {
    const to = Math.min(bookChapters, from + left - 1);
    spans.push({ from, to });
    left -= to - from + 1;
    from = 1;
  }
  return spans;
}

/** The chapter the reading continues from after `chaptersRead` chapters of the book. */
export function nextChapter(chaptersRead: number, bookChapters: number): number {
  return (chaptersRead % bookChapters) + 1;
}

export interface Passes {
  /** Complete reads of the book. */
  readonly complete: number;
  /** Chapters read of the pass in progress (0 when a pass just ended). */
  readonly chaptersIntoCurrent: number;
}

/** Passes are derived: chapters read ÷ chapters of the book (ADR 0007). */
export function passes(chaptersRead: number, bookChapters: number): Passes {
  return {
    complete: Math.floor(chaptersRead / bookChapters),
    chaptersIntoCurrent: chaptersRead % bookChapters,
  };
}

export const totalChapters = (logs: readonly ReadingLogRecord[]) =>
  logs.reduce((sum, log) => sum + log.chaptersRead, 0);

/** How many passes the block's days allow at the plan's pace. */
export function passesThatFit(
  start: LocalDate,
  end: LocalDate,
  chaptersPerDay: number,
  bookChapters: number,
): number {
  return ((start.daysUntil(end) + 1) * chaptersPerDay) / bookChapters;
}

export type LogError = 'invalid-amount' | 'outside-block' | 'in-the-future';

/**
 * A reading log of the active block. Its range starts where the block's reading is, so logs
 * entered later for past days continue the same sequence (LB-012 decisions).
 */
export function createReadingLog(input: {
  id: string;
  date: LocalDate;
  today: LocalDate;
  block: BlockRecord;
  blockLogs: readonly ReadingLogRecord[];
  bookChapters: number;
  chaptersRead: number;
}): Result<ReadingLogRecord, LogError> {
  const { id, date, today, block, blockLogs, bookChapters, chaptersRead } = input;
  if (!Number.isInteger(chaptersRead) || chaptersRead < 1) return err('invalid-amount');
  if (date.isAfter(today)) return err('in-the-future');
  const day = date.toString();
  if (day < block.start || day > block.end) return err('outside-block');
  return ok({
    id,
    date: day,
    blockId: block.id,
    bookId: block.bookId,
    startChapter: nextChapter(totalChapters(blockLogs), bookChapters),
    chaptersRead,
  });
}
