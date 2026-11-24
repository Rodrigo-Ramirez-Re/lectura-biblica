import { bookCatalog, type BookCatalog } from '@lectura/catalog-domain';
import {
  bookChoices,
  changeBlockEnd,
  changeBook,
  moveOn,
  pause,
  resume,
  type BlockChanges,
  type BlockControlError,
  type JournalReader,
  type JournalWriter,
} from '@lectura/reading-domain';
import { ok, type Clock, type LocalDate, type Result } from '@lectura/shared-kernel';

export interface BookChoice {
  readonly bookId: string;
  readonly name: string;
}

async function write(writer: JournalWriter, changes: BlockChanges): Promise<void> {
  for (const id of changes.remove) await writer.removeBlock(id);
  if (changes.save.length) await writer.saveBlocks(changes.save);
  if (changes.plan) await writer.savePlan(changes.plan);
}

/**
 * Changes to the current block (LB-018): change the book, skip it, finish it, pause, resume, or
 * move its end. Each takes effect today, or tomorrow when today is already logged.
 */
export class ControlCurrentBlock {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly catalog: BookCatalog = bookCatalog,
  ) {}

  /** Books that can replace the current one, in the plan's order. */
  async choices(): Promise<BookChoice[]> {
    return bookChoices(await this.reader.load(), this.catalog).map((bookId) => ({
      bookId,
      name: this.catalog.find(bookId)?.name ?? bookId,
    }));
  }

  changeBook(bookId: string): Promise<Result<void, BlockControlError>> {
    return this.run((journal, today) => changeBook(journal, bookId, today, this.catalog));
  }

  skip(): Promise<Result<void, BlockControlError>> {
    return this.run((journal, today) => moveOn(journal, 'skipped', today));
  }

  /** Moves on after meeting the goal: the book counts as done. */
  finish(): Promise<Result<void, BlockControlError>> {
    return this.run((journal, today) => moveOn(journal, 'done', today));
  }

  pause(): Promise<Result<void, BlockControlError>> {
    return this.run((journal, today) => pause(journal, today));
  }

  resume(): Promise<Result<void, BlockControlError>> {
    return this.run((journal, today) => resume(journal, today, this.catalog));
  }

  changeEnd(end: LocalDate): Promise<Result<void, BlockControlError>> {
    return this.run((journal, today) => changeBlockEnd(journal, end, today));
  }

  private async run(
    decide: (
      journal: Awaited<ReturnType<JournalReader['load']>>,
      today: LocalDate,
    ) => Result<BlockChanges, BlockControlError>,
  ): Promise<Result<void, BlockControlError>> {
    const result = decide(await this.reader.load(), this.clock.today());
    if (!result.ok) return result;
    await write(this.writer, result.value);
    return ok(undefined);
  }
}
