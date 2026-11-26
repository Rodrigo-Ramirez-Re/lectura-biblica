import { formatDate, formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExportHistory } from '@lectura/insights-application';
import type { HistoryMonth, MonthBook } from '@lectura/insights-domain';
import { ButtonComponent, CardComponent } from '@lectura/ui-components';

/** "¿Qué pasó cada mes?" (LB-028): one row per month, newest first, and the CSV export. */
@Component({
  selector: 'lb-history-section',
  imports: [ButtonComponent, CardComponent, RouterLink],
  template: `
    <section lbCard aria-labelledby="history-title">
      <h2 id="history-title" class="text-heading-2" i18n="@@insights.history.title">
        ¿Qué pasó cada mes?
      </h2>
      @if (months().length) {
        <div class="max-h-[32rem] overflow-auto">
          <table class="w-full border-collapse text-left text-body-sm">
            <caption class="sr-only" i18n="@@insights.history.caption">
              Tu historial, mes por mes
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  class="border-b border-border-strong px-2 py-1"
                  i18n="@@insights.history.column-month"
                >
                  Mes
                </th>
                <th
                  scope="col"
                  class="border-b border-border-strong px-2 py-1"
                  i18n="@@insights.history.column-books"
                >
                  Libros
                </th>
                <th
                  scope="col"
                  class="border-b border-border-strong px-2 py-1 text-right"
                  i18n="@@insights.history.column-chapters"
                >
                  Capítulos
                </th>
              </tr>
            </thead>
            <tbody>
              @for (month of months(); track month.year * 100 + month.month) {
                <tr class="align-top">
                  <th scope="row" class="border-b border-border px-2 py-2 font-semibold">
                    {{ monthName(month) }}
                  </th>
                  <td class="border-b border-border px-2 py-2">
                    <ul class="flex flex-col gap-1">
                      @for (book of month.books; track book.bookId) {
                        <li>
                          <a
                            class="font-semibold text-primary underline-offset-4 hover:underline focus-visible:focus-ring"
                            [routerLink]="['/libros', book.bookId]"
                            >{{ book.bookName }}</a>&ngsp;<span>{{ details(book) }}</span>
                        </li>
                      }
                    </ul>
                  </td>
                  <td class="border-b border-border px-2 py-2 text-right tabular-nums">
                    {{ month.chapters }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <button
          lbButton
          variant="secondary"
          type="button"
          class="self-start"
          (click)="export()"
          i18n="@@insights.history.export"
        >
          Exportar historial (CSV)
        </button>
        <p role="status" class="text-success">{{ notice() }}</p>
      } @else {
        <p i18n="@@insights.history.empty">Tu primer mes aparecerá aquí con tu primera lectura.</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorySection {
  readonly months = input.required<readonly HistoryMonth[]>();

  private readonly locale = inject(LOCALE_ID);
  private readonly exportHistory = inject(ExportHistory);

  protected readonly notice = signal('');

  protected monthName(month: HistoryMonth): string {
    const name = formatDate(new Date(month.year, month.month - 1, 1), "MMMM 'de' y", this.locale);
    return name.charAt(0).toLocaleUpperCase(this.locale) + name.slice(1);
  }

  /** "· 3.1 vueltas · meta de 5: cumplida · 2 notas" */
  protected details(book: MonthBook): string {
    const passes = formatNumber(book.passes, this.locale, '1.0-1');
    const parts = [
      book.passes === 1
        ? $localize`:@@insights.history.one-pass:1 vuelta`
        : $localize`:@@insights.history.passes:${passes}:passes: vueltas`,
    ];
    const goal = book.goal;
    if (goal) {
      const outcome = {
        met: $localize`:@@insights.history.goal-met:cumplida`,
        missed: $localize`:@@insights.history.goal-missed:no cumplida`,
        'in-progress': $localize`:@@insights.history.goal-running:en curso`,
      }[goal.kind];
      parts.push(
        goal.goal === 1
          ? $localize`:@@insights.history.goal-one:meta de 1 vuelta: ${outcome}:outcome:`
          : $localize`:@@insights.history.goal:meta de ${goal.goal}:goal: vueltas: ${outcome}:outcome:`,
      );
    }
    if (book.notes === 1) parts.push($localize`:@@insights.history.one-note:1 nota`);
    else if (book.notes > 1)
      parts.push($localize`:@@insights.history.notes:${book.notes}:notes: notas`);
    return `· ${parts.join(' · ')}`;
  }

  protected async export(): Promise<void> {
    if (await this.exportHistory.execute())
      this.notice.set($localize`:@@insights.history.exported:Historial exportado.`);
  }
}
