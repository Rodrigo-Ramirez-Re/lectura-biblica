export type BookId = string;

export type Testament = 'old' | 'new';

/** A book of the Bible as fixed reference data (docs/domain/ubiquitous-language.md). */
export interface Book {
  readonly id: BookId;
  readonly name: string;
  readonly chapters: number;
  readonly testament: Testament;
  /** Canonical position, 1 (Génesis) to 66 (Apocalipsis). */
  readonly position: number;
}
