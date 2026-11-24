import type { Book, BookId, Testament } from './book';
import { books } from './books';

// Accents and case are ignored, so "genesis" finds Génesis and "JUA" finds Juan.
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-MX')
    .trim();

export class BookCatalog {
  private readonly byId: ReadonlyMap<BookId, Book>;

  constructor(private readonly list: readonly Book[]) {
    this.byId = new Map(list.map((book) => [book.id, book]));
  }

  /** Every book in canonical order. */
  all(): readonly Book[] {
    return this.list;
  }

  find(id: BookId): Book | undefined {
    return this.byId.get(id);
  }

  inTestament(testament: Testament): readonly Book[] {
    return this.list.filter((book) => book.testament === testament);
  }

  search(query: string): readonly Book[] {
    const wanted = normalize(query);
    return wanted ? this.list.filter((book) => normalize(book.name).includes(wanted)) : this.list;
  }

  get size(): number {
    return this.list.length;
  }
}

export const bookCatalog = new BookCatalog(books);
