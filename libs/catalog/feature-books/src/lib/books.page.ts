import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { bookCatalog, type Testament } from '@lectura/catalog-domain';
import { FormControlDirective, FormFieldComponent } from '@lectura/ui-components';

@Component({
  selector: 'lb-books-page',
  imports: [RouterLink, FormFieldComponent, FormControlDirective],
  template: `
    <h1 class="font-display text-heading-1" i18n="@@catalog.books.title">Libros</h1>

    <lb-form-field
      class="mt-section block"
      label="Buscar libro"
      i18n-label="@@catalog.books.search"
    >
      <input
        lbControl
        type="search"
        autocomplete="off"
        [value]="query()"
        (input)="query.set(asText($event))"
      />
    </lb-form-field>

    @for (group of groups(); track group.testament) {
      @if (group.books.length) {
        <section class="mt-section" [attr.aria-labelledby]="'testament-' + group.testament">
          <h2 [id]="'testament-' + group.testament" class="text-heading-2">{{ group.title }}</h2>
          <ul class="mt-2 divide-y divide-border">
            @for (book of group.books; track book.id) {
              <li>
                <a
                  [routerLink]="book.id"
                  class="flex min-h-touch items-center justify-between gap-3 py-2 focus-visible:focus-ring"
                >
                  <span class="font-display text-heading-3">{{ book.name }}</span>
                  <span class="text-body-sm text-on-surface-muted" i18n="@@catalog.books.chapters">
                    {book.chapters, plural, =1 {1 capítulo} other {{{ book.chapters }} capítulos}}
                  </span>
                </a>
              </li>
            }
          </ul>
        </section>
      }
    }

    @if (!hasResults()) {
      <p class="mt-section text-on-surface-muted" role="status" i18n="@@catalog.books.no-results">
        No hay libros con ese nombre.
      </p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksPage {
  protected readonly query = signal('');

  private readonly titles: Record<Testament, string> = {
    old: $localize`:@@catalog.testament.old:Antiguo Testamento`,
    new: $localize`:@@catalog.testament.new:Nuevo Testamento`,
  };

  protected readonly groups = computed(() => {
    const found = bookCatalog.search(this.query());
    return (['old', 'new'] as const).map((testament) => ({
      testament,
      title: this.titles[testament],
      books: found.filter((book) => book.testament === testament),
    }));
  });

  protected readonly hasResults = computed(() => this.groups().some((g) => g.books.length > 0));

  protected asText(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
