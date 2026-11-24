import type { BookId } from './book';
import type { BookCatalog } from './book-catalog';

export type OrderTemplate = 'canonical' | 'by-chapters';

/** Builds a book order from a template. New templates are new entries, not new branches. */
export const orderTemplates: Record<OrderTemplate, (catalog: BookCatalog) => BookId[]> = {
  canonical: (catalog) => catalog.all().map((book) => book.id),
  // Fewest chapters first; ties keep canonical order (Abdías, Filemón, 2 Juan, 3 Juan, Judas…).
  'by-chapters': (catalog) =>
    [...catalog.all()]
      .sort((a, b) => a.chapters - b.chapters || a.position - b.position)
      .map((book) => book.id),
};
