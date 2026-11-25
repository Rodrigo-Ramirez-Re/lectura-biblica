import {
  activeBlock,
  noteText,
  notesOf,
  type JournalReader,
  type JournalWriter,
  type NoteError,
} from '@lectura/reading-domain';
import {
  LocalDate,
  err,
  ok,
  type Clock,
  type IdGenerator,
  type Result,
} from '@lectura/shared-kernel';

export interface NoteView {
  readonly id: string;
  readonly date: LocalDate;
  readonly text: string;
}

export type NotesError = NoteError | 'no-active-block' | 'not-found';

const parse = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(`Stored date "${iso}" is not YYYY-MM-DD`);
  return parsed.value;
};

/** Notes about what was understood: written on Hoy, kept per book (LB-021). */
export class Notes {
  constructor(
    private readonly reader: JournalReader,
    private readonly writer: JournalWriter,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async forBook(bookId: string): Promise<NoteView[]> {
    return notesOf((await this.reader.load()).notes, bookId).map((note) => ({
      id: note.id,
      date: parse(note.date),
      text: note.text,
    }));
  }

  /** Adds a note to the book being read today. */
  async add(text: string): Promise<Result<void, NotesError>> {
    const valid = noteText(text);
    if (!valid.ok) return valid;
    const today = this.clock.today();
    const block = activeBlock((await this.reader.load()).blocks, today);
    if (!block) return err('no-active-block');
    await this.writer.saveNote({
      id: this.ids.next(),
      blockId: block.id,
      bookId: block.bookId,
      date: today.toString(),
      text: valid.value,
    });
    return ok(undefined);
  }

  async edit(id: string, text: string): Promise<Result<void, NotesError>> {
    const valid = noteText(text);
    if (!valid.ok) return valid;
    const note = (await this.reader.load()).notes.find((candidate) => candidate.id === id);
    if (!note) return err('not-found');
    await this.writer.saveNote({ ...note, text: valid.value });
    return ok(undefined);
  }

  remove(id: string): Promise<void> {
    return this.writer.removeNote(id);
  }
}
