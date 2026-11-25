import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  chapterSpans,
  deleteLog,
  editLog,
  passes,
  totalChapters,
  type BlockStatus,
  type ChapterSpan,
  type JournalReader,
  type JournalWriter,
  type LogChanges,
  type LogEditError,
  type Passes,
} from '@lectura/reading-domain';
import { LocalDate, ok, type Clock, type Result } from '@lectura/shared-kernel';

export interface LogEntry {
  readonly id: string;
  readonly date: LocalDate;
  readonly chaptersRead: number;
  readonly spans: readonly ChapterSpan[];
}

export interface BlockHistory {
  readonly blockId: string;
  readonly bookName: string;
  readonly bookChapters: number;
  readonly start: LocalDate;
  readonly end: LocalDate;
  readonly status: BlockStatus;
  readonly passes: Passes;
  /** Newest first. */
  readonly logs: readonly LogEntry[];
}

const parse = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

/** A block with every log of it, for the block page (LB-020). */
export class GetBlockHistory {
  constructor(
    private readonly reader: JournalReader,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(blockId: string): Promise<BlockHistory | null> {
    const { blocks, logs } = await this.reader.load();
    const block = blocks.find((candidate) => candidate.id === blockId);
    const book = block && this.catalog.find(block.bookId);
    if (!block || !book) return null;
    const blockLogs = logs.filter((log) => log.blockId === blockId);
    return {
      blockId,
      bookName: book.name,
      bookChapters: book.chapters,
      start: parse(block.start),
      end: parse(block.end),
      status: block.status,
      passes: passes(totalChapters(blockLogs), book.chapters),
      logs: [...blockLogs]
        .sort((a, b) => b.date.localeCompare(a.date) || b.startChapter - a.startChapter)
        .map((log) => ({
          id: log.id,
          date: parse(log.date),
          chaptersRead: log.chaptersRead,
          spans: chapterSpans(log.startChapter, log.chaptersRead, book.chapters),
        })),
    };
  }
}

async function write(writer: JournalWriter, changes: LogChanges): Promise<void> {
  for (const id of changes.remove) await writer.removeLog(id);
  if (changes.save.length) await writer.saveLogs(changes.save);
}

/** Corrects or deletes any log; passes and progress follow (LB-020). */
export class EditLogs {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async edit(
    logId: string,
    changes: { date: LocalDate; chaptersRead: number },
  ): Promise<Result<void, LogEditError>> {
    const result = editLog(
      await this.reader.load(),
      logId,
      changes,
      this.clock.today(),
      this.catalog,
    );
    if (!result.ok) return result;
    await write(this.writer, result.value);
    return ok(undefined);
  }

  async delete(logId: string): Promise<Result<void, LogEditError>> {
    const result = deleteLog(await this.reader.load(), logId, this.catalog);
    if (!result.ok) return result;
    await write(this.writer, result.value);
    return ok(undefined);
  }
}
