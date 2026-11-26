import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import type { BookPasses } from '@lectura/insights-domain';
import {
  BarListComponent,
  CardComponent,
  ChartTableComponent,
  type BarItem,
} from '@lectura/ui-components';

/** "¿Cuántas veces he leído cada libro?" (LB-025): passes per book, every cycle added up. */
@Component({
  selector: 'lb-passes-section',
  imports: [BarListComponent, CardComponent, ChartTableComponent],
  template: `
    <section lbCard aria-labelledby="passes-title">
      <h2 id="passes-title" class="text-heading-2" i18n="@@insights.passes.title">
        ¿Cuántas veces he leído cada libro?
      </h2>
      @if (books().length) {
        <lb-bar-list [items]="items()" [summary]="summary" />
        <lb-chart-table [caption]="summary" [columns]="columns" [rows]="rows()" />
      } @else {
        <p i18n="@@insights.passes.empty">
          Cada libro aparecerá aquí con las veces que lo has leído en cuanto registres tu lectura.
        </p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassesSection {
  readonly books = input.required<readonly BookPasses[]>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly summary = $localize`:@@insights.passes.summary:Vueltas por libro, en el orden de tu plan`;
  protected readonly columns = [
    $localize`:@@insights.passes.column-book:Libro`,
    $localize`:@@insights.passes.column-passes:Vueltas`,
    $localize`:@@insights.passes.column-chapters:Capítulos leídos`,
  ];

  protected readonly items = computed<BarItem[]>(() =>
    this.books().map((book) => ({
      label: book.bookName,
      value: book.passes,
      text: this.text(book),
    })),
  );

  protected readonly rows = computed(() =>
    this.books().map((book) => [
      book.bookName,
      formatNumber(book.passes, this.locale, '1.0-2'),
      book.chapters,
    ]),
  );

  private text(book: BookPasses): string {
    const complete =
      book.complete === 1
        ? $localize`:@@insights.passes.one:1 vuelta`
        : $localize`:@@insights.passes.many:${book.complete}:count: vueltas`;
    if (!book.fraction) return complete;
    // Never "0 %" or "100 %" for a pass that has started but isn't finished.
    const percent = Math.min(99, Math.max(1, Math.round(book.fraction * 100)));
    return $localize`:@@insights.passes.partial:${complete}:complete: y ${percent}:percent: % de la siguiente`;
  }
}
