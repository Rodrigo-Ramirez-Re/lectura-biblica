import type { NoteRecord } from './journal';
import { NOTE_MAX_LENGTH, noteText, notesOf } from './notes';

describe('notes (LB-021)', () => {
  it('keeps the text with its line breaks, without surrounding blanks', () => {
    expect(noteText('  Dios juzga a Edom.\nPero restaura a su pueblo.  ')).toEqual({
      ok: true,
      value: 'Dios juzga a Edom.\nPero restaura a su pueblo.',
    });
  });

  it('refuses an empty note', () => {
    expect(noteText('   \n ')).toEqual({ ok: false, error: 'empty-note' });
  });

  it('refuses a note longer than the limit', () => {
    expect(noteText('a'.repeat(NOTE_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: 'note-too-long',
    });
  });

  it('lists the notes of a book, newest first', () => {
    const note = (id: string, bookId: string, date: string): NoteRecord => ({
      id,
      bookId,
      blockId: null,
      date,
      text: id,
    });
    const notes = [
      note('a', 'abdias', '2026-12-01'),
      note('b', 'rut', '2026-12-02'),
      note('c', 'abdias', '2026-12-03'),
    ];

    expect(notesOf(notes, 'abdias').map((n) => n.id)).toEqual(['c', 'a']);
  });
});
