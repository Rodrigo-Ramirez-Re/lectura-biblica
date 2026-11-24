import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  chapterSpans,
  createReadingLog,
  dailyPace,
  nextChapter,
  passes,
  passesThatFit,
  totalChapters,
  type BlockRecord,
  type ChapterSpan,
  type JournalReader,
  type JournalWriter,
  type LogError,
  type Passes,
  type ReadingLogRecord,
} from '@lectura/reading-domain';
import {
  LocalDate,
  err,
  ok,
  type Clock,
  type IdGenerator,
  type Result,
} from '@lectura/shared-kernel';

export interface TodayView {
  readonly blockId: string;
  readonly bookId: string;
  readonly bookName: string;
  readonly bookChapters: number;
  readonly start: LocalDate;
  readonly end: LocalDate;
  readonly today: LocalDate;
  /** Chapters the plan expects today; 0 on a rest day. */
  readonly todayPace: number;
  readonly restDay: boolean;
  /** Chapters still expected today; 0 once the day's pace is met. No debt carries over. */
  readonly dueChapters: number;
  /** Where the next reading starts and what the due chapters cover. */
  readonly dueSpans: readonly ChapterSpan[];
  readonly nextChapter: number;
  readonly readToday: number;
  readonly passesInBlock: Passes;
  readonly passesThatFit: number;
  readonly goalPasses: number | null;
  readonly goalMet: boolean;
}

const parse = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

/** The active block and what is due today (LB-012); null when no block is running. */
export class GetToday {
  constructor(
    private readonly reader: JournalReader,
    private readonly clock: Clock,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(): Promise<TodayView | null> {
    const { plan, blocks, logs } = await this.reader.load();
    const today = this.clock.today();
    const block = activeBlock(blocks, today);
    const book = block && this.catalog.find(block.bookId);
    if (!plan || !block || !book) return null;

    const blockLogs = logs.filter((log) => log.blockId === block.id);
    const read = totalChapters(blockLogs);
    const readToday = totalChapters(blockLogs.filter((log) => log.date === today.toString()));
    const todayPace = dailyPace(plan, today);
    const due = Math.max(todayPace - readToday, 0);
    const next = nextChapter(read, book.chapters);
    const start = parse(block.start);
    const end = parse(block.end);
    return {
      blockId: block.id,
      bookId: book.id,
      bookName: book.name,
      bookChapters: book.chapters,
      start,
      end,
      today,
      todayPace,
      restDay: todayPace === 0,
      dueChapters: due,
      dueSpans: chapterSpans(next, due, book.chapters),
      nextChapter: next,
      readToday,
      passesInBlock: passes(read, book.chapters),
      passesThatFit: passesThatFit(start, end, plan, book.chapters),
      goalPasses: block.goalPasses,
      goalMet:
        block.goalPasses !== null && passes(read, book.chapters).complete >= block.goalPasses,
    };
  }
}

export type LogReadingError = LogError | 'no-active-block';

/** Logs chapters of the active block, today or a past day of it (LB-012). */
export class LogReading {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(input: {
    chapters: number;
    date?: LocalDate;
  }): Promise<Result<ReadingLogRecord, LogReadingError>> {
    const { blocks, logs } = await this.reader.load();
    const today = this.clock.today();
    const block = activeBlock(blocks, today);
    const book = block && this.catalog.find(block.bookId);
    if (!block || !book) return err('no-active-block');

    const result = createReadingLog({
      id: this.ids.next(),
      date: input.date ?? today,
      today,
      block,
      blockLogs: logs.filter((log) => log.blockId === block.id),
      bookChapters: book.chapters,
      chaptersRead: input.chapters,
    });
    if (result.ok) await this.writer.addLog(result.value);
    return result;
  }
}

export type SetGoalError = 'no-active-block' | 'invalid-goal';

/** Sets or clears the goal of passes of the active block (LB-016). */
export class SetBlockGoal {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
  ) {}

  async execute(goalPasses: number | null): Promise<Result<void, SetGoalError>> {
    if (goalPasses !== null && (!Number.isInteger(goalPasses) || goalPasses < 1))
      return err('invalid-goal');
    const block = activeBlock((await this.reader.load()).blocks, this.clock.today());
    if (!block) return err('no-active-block');
    await this.writer.saveBlocks([{ ...block, goalPasses }]);
    return ok(undefined);
  }
}

/** Removes a log just made by mistake (LB-012); editing any log comes in phase 2. */
export class UndoReading {
  constructor(private readonly writer: JournalWriter) {}

  execute(logId: string): Promise<void> {
    return this.writer.removeLog(logId);
  }
}

export interface BookProgress {
  readonly passes: Passes;
  readonly chaptersRead: number;
  readonly blocks: readonly { start: LocalDate; end: LocalDate; chaptersRead: number }[];
}

/** Everything read of one book across blocks, for its page (LB-012). */
export class GetBookProgress {
  constructor(
    private readonly reader: JournalReader,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  async execute(bookId: string): Promise<BookProgress | null> {
    const book = this.catalog.find(bookId);
    if (!book) return null;
    const { blocks, logs } = await this.reader.load();
    const bookLogs = logs.filter((log) => log.bookId === bookId);
    const chaptersRead = totalChapters(bookLogs);
    return {
      passes: passes(chaptersRead, book.chapters),
      chaptersRead,
      blocks: blocks
        .filter((block) => block.bookId === bookId)
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((block) => ({
          start: parse(block.start),
          end: parse(block.end),
          chaptersRead: totalChapters(bookLogs.filter((log) => log.blockId === block.id)),
        })),
    };
  }
}

function activeBlock(blocks: readonly BlockRecord[], today: LocalDate): BlockRecord | undefined {
  const day = today.toString();
  return blocks.find((block) => block.start <= day && day <= block.end);
}
