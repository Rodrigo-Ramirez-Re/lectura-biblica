import { err, ok, type Result } from '@lectura/shared-kernel';
import type { NoteRecord } from './journal';

export type NoteError = 'empty-note' | 'note-too-long';

export const NOTE_MAX_LENGTH = 5000;

/** A note keeps its text as written (line breaks included), without surrounding blanks (LB-021). */
export function noteText(text: string): Result<string, NoteError> {
  const trimmed = text.trim();
  if (!trimmed) return err('empty-note');
  if (trimmed.length > NOTE_MAX_LENGTH) return err('note-too-long');
  return ok(trimmed);
}

/** The notes of a book, newest first. */
export function notesOf(notes: readonly NoteRecord[], bookId: string): NoteRecord[] {
  return notes
    .filter((note) => note.bookId === bookId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
