import type { BookCatalog } from '@lectura/catalog-domain';
import { passes, type Journal } from '@lectura/reading-domain';

export interface BookPasses {
  readonly bookId: string;
  readonly bookName: string;
  /** Chapters read of the book, across every cycle. */
  readonly chapters: number;
  /** Complete reads of the book. */
  readonly complete: number;
  /** Share of the next read, from 0 to just under 1. */
  readonly fraction: number;
  /** `complete + fraction`: the length of its bar. */
  readonly passes: number;
}

/**
 * How many times each book has been read (LB-025): chapters read ÷ chapters of the book, every
 * cycle added up (ADR 0007). Books follow the plan's order; books read and later left out of it
 * follow in canonical order. Only books with something read are listed.
 */
export function passesByBook(journal: Journal, catalog: BookCatalog): BookPasses[] {
  const read = new Map<string, number>();
  for (const log of journal.logs)
    read.set(log.bookId, (read.get(log.bookId) ?? 0) + log.chaptersRead);
  const order = journal.plan?.bookOrder ?? [];
  const rest = catalog
    .all()
    .map((book) => book.id)
    .filter((id) => !order.includes(id));
  return [...order, ...rest].flatMap((bookId) => {
    const chapters = read.get(bookId) ?? 0;
    const book = catalog.find(bookId);
    if (!chapters || !book) return [];
    const { complete, chaptersIntoCurrent } = passes(chapters, book.chapters);
    const fraction = chaptersIntoCurrent / book.chapters;
    return [
      { bookId, bookName: book.name, chapters, complete, fraction, passes: complete + fraction },
    ];
  });
}
