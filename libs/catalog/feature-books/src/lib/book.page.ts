import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { bookCatalog } from '@lectura/catalog-domain';
import { ButtonComponent } from '@lectura/ui-components';
import { BOOK_SECTIONS } from './book-sections';

@Component({
  selector: 'lb-book-page',
  imports: [NgComponentOutlet, RouterLink, ButtonComponent],
  template: `
    @if (book(); as book) {
      <h1 class="font-display text-heading-1">{{ book.name }}</h1>
      <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt class="text-on-surface-muted" i18n="@@catalog.book.testament">Testamento</dt>
        <dd>{{ testament() }}</dd>
        <dt class="text-on-surface-muted" i18n="@@catalog.book.chapters-label">Capítulos</dt>
        <dd i18n="@@catalog.book.chapters">
          {book.chapters, plural, =1 {1 capítulo} other {{{ book.chapters }} capítulos}}
        </dd>
        <dt class="text-on-surface-muted" i18n="@@catalog.book.position-label">Posición</dt>
        <dd i18n="@@catalog.book.position">libro {{ book.position }} de {{ total }}</dd>
      </dl>

      <div class="mt-section flex flex-col gap-section">
        @for (section of sections; track section.component) {
          <ng-container *ngComponentOutlet="section.component; inputs: { bookId: book.id }" />
        }
      </div>
    } @else {
      <h1 class="font-display text-heading-1" i18n="@@catalog.book.not-found">
        Libro no encontrado
      </h1>
      <a lbButton class="mt-section" routerLink="/libros" i18n="@@catalog.book.back">
        Ver todos los libros
      </a>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookPage {
  /** Bound from the route parameter. */
  readonly bookId = input.required<string>();

  protected readonly total = bookCatalog.size;
  protected readonly book = computed(() => bookCatalog.find(this.bookId()));
  protected readonly testament = computed(() =>
    this.book()?.testament === 'old'
      ? $localize`:@@catalog.testament.old:Antiguo Testamento`
      : $localize`:@@catalog.testament.new:Nuevo Testamento`,
  );
  protected readonly sections = [...(inject(BOOK_SECTIONS, { optional: true }) ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}
