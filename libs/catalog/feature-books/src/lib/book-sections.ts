import { InjectionToken, type Type } from '@angular/core';

/**
 * A panel another context adds to the book page (reading progress, study material…). The page
 * renders every registered section in `order`, passing the book id as the `bookId` input.
 */
export interface BookSection {
  readonly order: number;
  readonly component: Type<unknown>;
}

export const BOOK_SECTIONS = new InjectionToken<readonly BookSection[]>('BOOK_SECTIONS');
