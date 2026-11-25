import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Notes, type NoteView, type NotesError } from '@lectura/reading-application';
import {
  ButtonComponent,
  CardComponent,
  FormControlDirective,
  FormFieldComponent,
} from '@lectura/ui-components';

type Mode = { kind: 'edit' | 'delete'; noteId: string } | null;

/**
 * "Tus notas": what was understood about a book (LB-021). On Hoy it also lets the reader write a
 * note about the book being read; on the book page it lists, edits and deletes them. Notes are
 * shown as text, keeping their line breaks.
 */
@Component({
  selector: 'lb-book-notes',
  imports: [DatePipe, ButtonComponent, CardComponent, FormFieldComponent, FormControlDirective],
  template: `
    <section lbCard aria-labelledby="notes-title">
      <h2 id="notes-title" class="text-heading-2" i18n="@@reading.notes.title">Tus notas</h2>

      @if (canAdd()) {
        <form class="flex flex-col gap-2" (submit)="add($event)" novalidate>
          <lb-form-field
            label="Lo que entendiste y los puntos importantes"
            i18n-label="@@reading.notes.new"
            [error]="error() ?? undefined"
          >
            <textarea
              lbControl
              rows="3"
              [value]="draft()"
              (input)="draft.set(asText($event))"
            ></textarea>
          </lb-form-field>
          <button
            lbButton
            variant="secondary"
            type="submit"
            class="self-start"
            i18n="@@reading.notes.save"
          >
            Guardar nota
          </button>
        </form>
      }

      <ul class="flex flex-col">
        @for (note of notes(); track note.id) {
          <li class="flex flex-col gap-2 border-b border-border py-2">
            <span class="text-body-sm text-on-surface-muted">
              {{ note.date.toDate() | date: "d 'de' MMMM 'de' y" }}
            </span>
            @if (mode()?.noteId === note.id && mode()?.kind === 'edit') {
              <form class="flex flex-col gap-2" (submit)="save($event, note)" novalidate>
                <lb-form-field
                  label="Editar nota"
                  i18n-label="@@reading.notes.edit-field"
                  [error]="error() ?? undefined"
                >
                  <textarea
                    lbControl
                    rows="3"
                    [value]="editText()"
                    (input)="editText.set(asText($event))"
                  ></textarea>
                </lb-form-field>
                <div class="flex gap-2">
                  <button lbButton type="submit" i18n="@@reading.notes.save-edit">Guardar</button>
                  <button
                    lbButton
                    variant="ghost"
                    type="button"
                    (click)="mode.set(null)"
                    i18n="@@reading.notes.cancel"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            } @else {
              <p class="whitespace-pre-line">{{ note.text }}</p>
              <span class="flex gap-1">
                <button
                  lbButton
                  variant="ghost"
                  type="button"
                  (click)="startEdit(note)"
                  i18n="@@reading.notes.edit"
                >
                  Editar
                </button>
                <button
                  lbButton
                  variant="danger"
                  type="button"
                  (click)="mode.set({ kind: 'delete', noteId: note.id })"
                  i18n="@@reading.notes.delete"
                >
                  Borrar
                </button>
              </span>
            }
            @if (mode()?.noteId === note.id && mode()?.kind === 'delete') {
              <div
                role="group"
                class="flex flex-wrap items-center gap-2"
                aria-labelledby="delete-note-question"
              >
                <span id="delete-note-question" i18n="@@reading.notes.delete-question"
                  >¿Borrar esta nota?</span
                >
                <button
                  lbButton
                  variant="danger"
                  type="button"
                  (click)="remove(note)"
                  i18n="@@reading.notes.delete-confirm"
                >
                  Sí, borrar
                </button>
                <button
                  lbButton
                  variant="ghost"
                  type="button"
                  (click)="mode.set(null)"
                  i18n="@@reading.notes.delete-cancel"
                >
                  No
                </button>
              </div>
            }
          </li>
        } @empty {
          <li class="py-2 text-on-surface-muted" i18n="@@reading.notes.empty">
            Aún no tienes notas de este libro.
          </li>
        }
      </ul>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookNotesSection {
  readonly bookId = input.required<string>();
  /** True on Hoy, where the book is being read. */
  readonly canAdd = input(false);

  private readonly service = inject(Notes);

  protected readonly notes = signal<readonly NoteView[]>([]);
  protected readonly draft = signal('');
  protected readonly editText = signal('');
  protected readonly mode = signal<Mode>(null);
  protected readonly error = signal<string | null>(null);

  private readonly messages: Record<NotesError, string> = {
    'empty-note': $localize`:@@reading.notes.error-empty:La nota está vacía.`,
    'note-too-long': $localize`:@@reading.notes.error-long:La nota es demasiado larga (máximo 5000 caracteres).`,
    'no-active-block': $localize`:@@reading.notes.error-no-block:Hoy no hay un libro en curso.`,
    'not-found': $localize`:@@reading.notes.error-not-found:Esa nota ya no existe.`,
  };

  constructor() {
    effect(() => {
      const bookId = this.bookId();
      void this.load(bookId);
    });
  }

  protected async add(event: Event): Promise<void> {
    event.preventDefault();
    const result = await this.service.add(this.draft());
    this.error.set(result.ok ? null : this.messages[result.error]);
    if (result.ok) this.draft.set('');
    await this.load(this.bookId());
  }

  protected startEdit(note: NoteView): void {
    this.editText.set(note.text);
    this.error.set(null);
    this.mode.set({ kind: 'edit', noteId: note.id });
  }

  protected async save(event: Event, note: NoteView): Promise<void> {
    event.preventDefault();
    const result = await this.service.edit(note.id, this.editText());
    this.error.set(result.ok ? null : this.messages[result.error]);
    if (result.ok) this.mode.set(null);
    await this.load(this.bookId());
  }

  protected async remove(note: NoteView): Promise<void> {
    await this.service.remove(note.id);
    this.mode.set(null);
    await this.load(this.bookId());
  }

  protected asText(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }

  private async load(bookId: string): Promise<void> {
    this.notes.set(await this.service.forBook(bookId));
  }
}
