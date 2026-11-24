import { InjectionToken, type Type } from '@angular/core';

/**
 * A panel another context adds to the book page (reading progress, study material…). The page
 * loads every registered section in `order` and passes the book id as the `bookId` input.
 * `load` is a dynamic import so the section ships with the screens that use it, not up front.
 */
export interface BookSection {
  readonly order: number;
  readonly load: () => Promise<Type<unknown>>;
}

export const BOOK_SECTIONS = new InjectionToken<readonly BookSection[]>('BOOK_SECTIONS');

/** Loads the registered sections, sorted by `order`. */
export async function loadBookSections(sections: readonly BookSection[]): Promise<Type<unknown>[]> {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return Promise.all(sorted.map((section) => section.load()));
}
