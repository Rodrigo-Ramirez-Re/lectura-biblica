import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { GetBookProgress, type BookProgress } from '@lectura/reading-application';
import { CardComponent } from '@lectura/ui-components';

/** "Tu lectura" on the book page: passes across every block of the book (LB-012). */
@Component({
  selector: 'lb-book-progress-section',
  imports: [DatePipe, CardComponent],
  template: `
    <section lbCard aria-labelledby="book-reading">
      <h2 id="book-reading" class="text-heading-2" i18n="@@reading.book.title">Tu lectura</h2>
      @if (progress(); as view) {
        @if (view.chaptersRead === 0) {
          <p class="text-on-surface-muted" i18n="@@reading.book.none">
            Aún no has leído este libro.
          </p>
        } @else {
          <p i18n="@@reading.book.passes">
            {view.passes.complete, plural,
              =0 {Ninguna vuelta completa todavía}
              =1 {1 vuelta completa}
              other {{{ view.passes.complete }} vueltas completas}
            }
            y
            {view.passes.chaptersIntoCurrent, plural,
              =1 {1 capítulo}
              other {{{ view.passes.chaptersIntoCurrent }} capítulos}
            }
            de la siguiente.
          </p>
        }
        @if (view.blocks.length) {
          <ul class="flex flex-col gap-1 text-body-sm">
            @for (block of view.blocks; track block.start.toString()) {
              <li i18n="@@reading.book.block">
                {{ block.start.toDate() | date: 'd MMM y' }} –
                {{ block.end.toDate() | date: 'd MMM y' }}:
                {block.chaptersRead, plural,
                  =1 {1 capítulo}
                  other {{{ block.chaptersRead }} capítulos}
                }
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookProgressSection {
  readonly bookId = input.required<string>();

  private readonly getProgress = inject(GetBookProgress);
  protected readonly progress = signal<BookProgress | null>(null);

  constructor() {
    effect(() => {
      const bookId = this.bookId();
      void this.getProgress.execute(bookId).then((view) => this.progress.set(view));
    });
  }
}
